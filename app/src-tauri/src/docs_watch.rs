use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use notify_debouncer_mini::{
    new_debouncer, notify::RecursiveMode, DebounceEventResult, DebouncedEvent, Debouncer,
};
use serde::Serialize;

/// Docs watcher + snapshot pipeline (T-003), re-armable per project (T-007).
///
/// The Rust side never parses: it watches `<project>/docs` and ships raw
/// `.md` contents to the webview, where @nputer/parser builds the model
/// (parsing lives where TypeScript runs; the app stays a pure lens).
/// Every push is a full snapshot of the docs tree — files are small, and
/// full-state pushes make create/rename/delete handling race-free by
/// construction (the frontend always converges on current disk truth).
///
/// T-007 adds project switching: one long-lived control thread owns the
/// notify debouncer and processes `WatchCtl` messages — debounced fs
/// batches and `Rearm` requests from the folder picker. The thread stays
/// alive even when no project is open, so a picked folder can arm it at
/// any point. The webview never supplies a path: the picker command opens
/// the native dialog in Rust, validates the choice here, and only then
/// re-arms.
///
/// ADR-010 containment: reads are confined to `<current project>/docs` —
/// the commands take no path arguments, symlinks are never followed, and
/// every file's canonical path must remain under the canonical project dir
/// or it is dropped.
///
/// T-018 makes the watcher truthful about its own blind spots:
/// - a non-recursive ROOT SENTINEL watch re-arms the docs watch when
///   `docs/` appears late or is replaced wholesale (the stale-handle
///   death T-003-s1 documented) — the missing trigger for the existing
///   re-arm machinery, not a new mechanism;
/// - the collector reports what it SKIPPED (path + reason) and whether
///   the file cap TRUNCATED the tree, so a skipped record never reads as
///   a deletion in the frontend;
/// - both are additive: every sentinel/telemetry failure path degrades to
///   exactly the pre-T-018 behavior (pinned by tests below).

/// Debounce window for editor save bursts (criterion 2). One debounced
/// batch -> at most one snapshot emit; well inside the 1s budget of
/// criterion 1.
pub const DEBOUNCE: Duration = Duration::from_millis(250);

const DOCS_DIR: &str = "docs";
/// Caps so a pathological repo cannot balloon the IPC payload.
const MAX_FILE_BYTES: u64 = 1_048_576; // 1 MiB per file
const MAX_FILES: usize = 2_000;
const MAX_DEPTH: usize = 16;
/// The skip REPORT is itself capped (T-018): a pathological repo must not
/// win back through telemetry the payload the caps took away. The
/// snapshot's `skipped_total` stays the honest count when the list clips.
const MAX_SKIPPED_REPORTED: usize = 200;
/// Frontend echo payloads are logged; cap what one line can carry.
const MAX_ECHO_LOG_CHARS: usize = 800;
/// How long the picker command waits for the watcher thread to re-arm.
const REARM_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocsFile {
    pub path: String,
    pub content: String,
}

/// Why the collector left a file out of the snapshot (T-018, absorbing
/// T-003-s3). Only files that WOULD have been collected are ever
/// reported: a `.txt` was never in the set, and symlinks stay silent BY
/// DECISION — they are ADR-010 security refusals, not telemetry gaps,
/// and listing them would hand a hostile repo a path-disclosure channel
/// (the "arguably stay silent" question T-003-s3 left open, settled
/// here as: silent).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SkipReason {
    /// File is over `MAX_FILE_BYTES` (1 MiB).
    Oversize,
    /// File content is not valid UTF-8.
    NonUtf8,
    /// Directory (reported once, for the dir) nested past `MAX_DEPTH`.
    TooDeep,
    /// Eligible file past the `MAX_FILES` cap (see `truncated`).
    FileCap,
    /// Read failed for a reason other than not-found (e.g. permissions).
    /// A file that vanished mid-read is a deletion, not a skip.
    Unreadable,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkippedFile {
    pub path: String,
    pub reason: SkipReason,
}

/// Everything one collection pass learned (T-018). This whole value —
/// not just `files` — is the emit-suppression baseline: a change in skip
/// state alone (a file crossing the 1 MiB line, say) must emit, or the
/// frontend keeps rendering stale truth about what it cannot see.
#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct CollectOutcome {
    pub files: Vec<DocsFile>,
    /// Skips, sorted by path, clipped at `MAX_SKIPPED_REPORTED`.
    pub skipped: Vec<SkippedFile>,
    /// True skip count even when `skipped` is clipped.
    pub skipped_total: usize,
    /// The `MAX_FILES` cap clipped collection (some eligible files are
    /// not in `files`).
    pub truncated: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocsSnapshot {
    pub seq: u64,
    pub project_dir: String,
    pub generated_at_ms: u64,
    pub files: Vec<DocsFile>,
    /// T-018: what the collector could not ship, path + reason (clipped
    /// at `MAX_SKIPPED_REPORTED`; `skipped_total` is the honest count).
    pub skipped: Vec<SkippedFile>,
    pub skipped_total: usize,
    /// T-018: the 2000-file cap clipped this snapshot.
    pub truncated: bool,
}

/// What the frontend's startup pull (`docs_snapshot` command) reports
/// (T-007): the app may have resolved no project at all (packaged .app
/// launched outside any repo), or a repo that has no docs/ tree — both
/// land on the friendly empty state instead of a silently empty board.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ProjectStatus {
    /// No repo resolved at launch (and nothing picked yet).
    NoProject,
    /// A project root is set but contains no plain `docs/` directory.
    /// T-026: `probe` is what the front door's "No plan in <folder>"
    /// checklist renders (measured, not decorative).
    NoDocs {
        project_dir: String,
        probe: PlanProbe,
    },
    /// Project open: here is the current docs tree.
    Open { snapshot: DocsSnapshot },
}

/// Typed result of the folder picker (T-007). The webview receives ONLY
/// this — it never sends a path, and a rejected pick mutates nothing.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum PickOutcome {
    /// User dismissed the native dialog; nothing changed.
    Cancelled,
    /// Another pick is already in flight (T-021 single-flight, absorbing
    /// T-007-s3): the command refuses BEFORE opening a dialog, so a
    /// double-invoking (or compromised) webview can never stack native
    /// dialogs. Nothing changed.
    Busy,
    /// Chosen folder has no plain `docs/` directory (or vanished before
    /// validation); nothing changed. `path` is what was looked at, and
    /// `probe` (T-026) is what was looked FOR — the "No plan in
    /// <folder>" card's checklist. The folder is remembered Rust-side as
    /// the genesis candidate, so "Start an interview here" needs no
    /// argument from the webview (ADR-012).
    NoDocs { path: String, probe: PlanProbe },
    /// Validation passed but the watcher could not re-arm; nothing changed
    /// (the previous project, if any, is still watched).
    Error { path: String, message: String },
    /// Folder validated and the watcher re-armed: this snapshot is the
    /// picked project's current docs tree.
    Picked { snapshot: DocsSnapshot },
    /// T-026: opened as a GENESIS project — a folder with no plan yet.
    /// The root is committed and the watcher armed on the root sentinel
    /// (T-018), so the first `mkdir docs` lights the ordinary pipeline
    /// with no re-pick. `seq` is the switch's ordering stamp: every emit
    /// from the PREVIOUS project carries a lower seq and drops as stale.
    ///
    /// T-042 criterion 1: a genesis folder MAY already hold a plain
    /// `docs/`, because "no plan" is a weaker condition than "no docs/"
    /// — a lone `docs/ARCHITECTURE.md`, a `docs/decisions/` tree, any
    /// repo whose docs/ predates nputer. When it does, the docs watch
    /// armed normally and `snapshot` carries that tree AT THE SAME `seq`,
    /// so the pane renders what is actually there instead of claiming
    /// nothing is written. `None` means the folder genuinely has no
    /// docs/ yet — the one shape this variant used to assume.
    Genesis {
        project_dir: String,
        seq: u64,
        probe: PlanProbe,
        snapshot: Option<DocsSnapshot>,
    },
}

/// Messages processed by the watcher control thread.
pub enum WatchCtl {
    /// A debounced batch of fs events from notify.
    Fs(DebounceEventResult),
    /// Switch the watch to `<root>/docs` (T-007 picker). `ack` reports
    /// success once the new watch is armed and the emit baseline reset;
    /// on failure the previous watch is untouched.
    Rearm {
        root: PathBuf,
        ack: mpsc::Sender<Result<(), String>>,
    },
    /// T-026: arm on a GENESIS root — a project folder that has no plan
    /// yet, and usually no `docs/` at all. Same rendezvous contract as
    /// `Rearm` (ack after arming; the previous project untouched on
    /// failure), but the sentinel is the load-bearing watch: there may be
    /// nothing to watch recursively until the interview writes docs/.
    ///
    /// T-042: the ack answers `Ok(true)` when a plain `docs/` WAS there
    /// and the ordinary recursive watch armed over it — the caller then
    /// owes the switch a snapshot of that tree (criterion 1). The
    /// arming thread is the only place that knows this for certain, so
    /// it says so rather than letting the caller re-stat and guess.
    ArmGenesis {
        root: PathBuf,
        ack: mpsc::Sender<Result<bool, String>>,
    },
}

/// Managed state: the current project dir (None until one resolves or is
/// picked), the shared sequence counter that orders every snapshot
/// (command responses and watcher events draw from the same counter, so
/// the frontend can drop stale or duplicate deliveries with a single
/// `seq <= applied` check — the counter is global and monotonic across
/// project switches, which is what makes late events from a previous
/// project provably stale), and the control-channel sender to the watcher
/// thread.
pub struct WatchState {
    project: Mutex<Option<PathBuf>>,
    seq: Arc<AtomicU64>,
    ctl: mpsc::Sender<WatchCtl>,
    /// T-021 single-flight latch for the picker (absorbs T-007-s3):
    /// claimed by `begin_pick` BEFORE the native dialog opens, released
    /// by `PickInFlight::drop` after `apply_picked_folder` returns. This
    /// guard — not the project mutex — is what serializes the whole
    /// dialog -> validate -> re-arm -> commit pipeline, which is what
    /// makes narrowing the mutex to the commit alone sound.
    picking: Arc<AtomicBool>,
    /// T-026: the last folder the user chose in the native dialog that
    /// was refused for having no `docs/` — the genesis candidate the
    /// front door's "No plan in <folder>" card is talking about.
    ///
    /// This is what keeps "Start an interview here" a ZERO-ARGUMENT
    /// command (ADR-012): the path came from the user's own dialog
    /// choice and stayed Rust-side; the webview never learned it in a
    /// form it could send back, and cannot name a different one.
    last_rejected: Mutex<Option<PathBuf>>,
}

/// Exclusive claim on the picker pipeline (T-021). Holding this value IS
/// the claim: `apply_picked_folder` consumes one, so the type system
/// guarantees no pick pipeline runs unguarded, and dropping it — on any
/// path, panic included — releases the latch.
pub struct PickInFlight(Arc<AtomicBool>);

impl Drop for PickInFlight {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

impl WatchState {
    pub fn new(
        project: Option<PathBuf>,
        seq: Arc<AtomicU64>,
        ctl: mpsc::Sender<WatchCtl>,
    ) -> Self {
        Self {
            project: Mutex::new(project),
            seq,
            ctl,
            picking: Arc::new(AtomicBool::new(false)),
            last_rejected: Mutex::new(None),
        }
    }

    /// Claim the picker (T-021 single-flight). `None` means a pick is
    /// already in flight — the command maps that to the typed
    /// `PickOutcome::Busy` without opening a dialog.
    pub fn begin_pick(&self) -> Option<PickInFlight> {
        self.picking
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .ok()
            .map(|_| PickInFlight(self.picking.clone()))
    }

    /// Next sequence number (first is 1; frontend starts at 0). Taken
    /// BEFORE collecting files in every path, so seq order matches
    /// collection start order.
    pub fn next_seq(&self) -> u64 {
        next_seq(&self.seq)
    }

    /// Current project root, if any.
    pub fn project_dir(&self) -> Option<PathBuf> {
        self.project.lock().expect("project mutex poisoned").clone()
    }

    /// T-026: remember a user-chosen folder that had no `docs/` as the
    /// genesis candidate (see `last_rejected`). Called only from the
    /// pick path, with a canonicalized path the USER chose.
    fn remember_rejected(&self, path: &Path) {
        *self
            .last_rejected
            .lock()
            .expect("rejected-pick mutex poisoned") = Some(path.to_path_buf());
    }

    /// T-026: the folder "Start an interview here" means. The user's most
    /// recently refused choice if there is one, else the open project
    /// (the launch-resolved repo that has no docs/ — the first-launch
    /// genesis entry). None means the front door has nothing to point at.
    pub fn genesis_target(&self) -> Option<PathBuf> {
        self.last_rejected
            .lock()
            .expect("rejected-pick mutex poisoned")
            .clone()
            .or_else(|| self.project_dir())
    }

    /// Forget the candidate — it just became the open project, or a new
    /// project was opened over it.
    fn clear_rejected(&self) {
        *self
            .last_rejected
            .lock()
            .expect("rejected-pick mutex poisoned") = None;
    }
}

fn next_seq(seq: &AtomicU64) -> u64 {
    seq.fetch_add(1, Ordering::SeqCst) + 1
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Join path components with `/` regardless of platform.
fn relative_posix(path: &Path, base: &Path) -> Option<String> {
    let rel = path.strip_prefix(base).ok()?;
    let parts: Vec<String> = rel
        .components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect();
    Some(parts.join("/"))
}

/// Is `path` a real directory — not a symlink, not a file, not absent?
/// The T-003 rule family's one primitive: every arming gate in this
/// module asks it (T-026 asks it of the project ROOT, which a genesis
/// project has instead of a docs/ dir), so a symlink swapped in between
/// validation and arming is refused at both ends.
pub fn is_plain_dir(path: &Path) -> bool {
    match fs::symlink_metadata(path) {
        Ok(meta) => !meta.file_type().is_symlink() && meta.is_dir(),
        Err(_) => false,
    }
}

/// Does `root` contain a plain `docs/` directory — a real dir, not a
/// symlink? The single definition of "convention layout present" used by
/// startup status, the picker validation, and the watcher's arming gate
/// (same symlink rules as T-003's collector, which refuses a symlinked
/// docs/ at read time).
pub fn has_plain_docs_dir(root: &Path) -> bool {
    is_plain_dir(&root.join(DOCS_DIR))
}

/// What the front door looked for in a folder, and what it found (T-026).
///
/// Two jobs, one stat sweep: it decides whether genesis may be OFFERED
/// for a folder (`has_plan` — criterion 5's predicate, which T-025's
/// runner re-checks Rust-side before spawning anything), and it feeds the
/// "No plan in <folder>" card's checklist so the ○/✓ marks are measured
/// rather than decorative.
///
/// Booleans only: the webview learns whether each looked-for path exists,
/// never any path the user did not already choose (the probe reads no
/// file contents and lists no names — a symlinked `docs/tasks` pointing
/// somewhere hostile can flip `tasks` to true, which only makes the app
/// MORE conservative about offering genesis, and discloses nothing).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanProbe {
    /// `docs/ROADMAP.md` exists.
    pub roadmap: bool,
    /// At least one `docs/tasks/*.md` exists.
    pub tasks: bool,
    /// `docs/ARCHITECTURE.md` exists.
    pub architecture: bool,
    /// `.git` exists (file or dir — worktrees count, as in T-007's
    /// launch resolution).
    pub git: bool,
}

impl PlanProbe {
    /// Criterion 5's predicate: the folder ALREADY holds a plan, so
    /// genesis is never offered for it (there is no overwrite path in
    /// this app by construction — the flow opens it as a normal project
    /// instead). Deliberately narrow: a ROADMAP or any task file is a
    /// plan; an ARCHITECTURE.md alone is not, and neither is a bare
    /// `docs/`.
    pub fn has_plan(&self) -> bool {
        self.roadmap || self.tasks
    }
}

/// Stat what a plan would live in. Never reads content; never follows a
/// symlink to decide `is_plain_dir`-style questions (it asks only "is
/// there something here", which is the conservative direction — a
/// symlinked plan still counts as a plan and blocks genesis).
pub fn probe_plan(root: &Path) -> PlanProbe {
    let docs = root.join(DOCS_DIR);
    PlanProbe {
        roadmap: fs::symlink_metadata(docs.join("ROADMAP.md")).is_ok(),
        tasks: has_any_task_file(&docs.join("tasks")),
        architecture: fs::symlink_metadata(docs.join("ARCHITECTURE.md")).is_ok(),
        git: fs::symlink_metadata(root.join(".git")).is_ok(),
    }
}

/// Any `*.md` directly inside `docs/tasks/` (names only — no content, no
/// recursion, and the names never leave this function).
fn has_any_task_file(tasks_dir: &Path) -> bool {
    let Ok(entries) = fs::read_dir(tasks_dir) else {
        return false;
    };
    entries.flatten().any(|entry| {
        entry
            .file_name()
            .to_str()
            .is_some_and(|name| name.ends_with(".md"))
    })
}

/// Which files ride the docs snapshot: every `.md` under docs/ (T-003),
/// plus `.json` whose project-relative path sits under
/// `docs/architecture/` (T-012, ADR-014 — the committed graph rides the
/// existing pipeline; subdirectories included, so T-015's layout.json
/// rides free later). The predicate runs on the POST-CANONICALIZE
/// relative POSIX path: containment first, classification second — no
/// symlink or traversal trick can reclassify a path into the set.
pub fn is_collected_docs_path(rel: &str) -> bool {
    if !rel.starts_with("docs/") {
        return false;
    }
    match Path::new(rel).extension().and_then(|e| e.to_str()) {
        Some("md") => true,
        Some("json") => rel.starts_with("docs/architecture/"),
        _ => false,
    }
}

/// Collect every snapshot-eligible file under `<project_dir>/docs`,
/// recursively (see `is_collected_docs_path` for the set), reporting
/// what was skipped and whether the file cap truncated the tree (T-018).
///
/// Containment (ADR-010): symlinks — file or directory — are skipped
/// outright AND silently (a security refusal is not telemetry), and each
/// file's canonical path must stay under the canonical project dir;
/// anything else is dropped. Non-UTF-8, oversized, unreadable files and
/// too-deep directories are skipped WITH a report entry. Files and skips
/// are sorted by path, so outcomes are deterministic and comparable (the
/// emit-suppression check relies on this).
///
/// Two phases: the walk classifies and gathers ELIGIBLE paths; then the
/// sorted list is capped and read. Cap membership is therefore the first
/// `MAX_FILES` readable paths in path order — deterministic — instead of
/// traversal-order luck (T-003-s2's silent nondeterminism: two collects
/// of the same over-cap tree used to be able to disagree about WHICH
/// files rode, which the equality-based suppression would then emit as
/// phantom churn).
pub fn collect_docs_tree(project_dir: &Path) -> CollectOutcome {
    let mut out = CollectOutcome::default();
    let Ok(canon_project) = project_dir.canonicalize() else {
        return out;
    };
    let docs_root = canon_project.join(DOCS_DIR);
    let Ok(docs_meta) = fs::symlink_metadata(&docs_root) else {
        return out; // no docs/ at all
    };
    if docs_meta.file_type().is_symlink() || !docs_meta.is_dir() {
        eprintln!("[nputer] watch: {} is not a plain directory - refusing to read it", docs_root.display());
        return out;
    }

    // Phase 1: walk. Gather eligible files; record structural skips.
    // Eligibility (containment + classification) is decided BEFORE any
    // skip verdict, so only files that WOULD have been collected are ever
    // reported — a 2 MiB .txt was never a record and stays silent.
    let mut eligible: Vec<(String, PathBuf, u64)> = Vec::new();
    let mut skips: Vec<SkippedFile> = Vec::new();
    let mut stack: Vec<(PathBuf, usize)> = vec![(docs_root, 0)];
    while let Some((dir, depth)) = stack.pop() {
        // Paths on the stack are built from the canonical docs root and
        // never through a symlink, so `dir` is canonical already.
        if depth > MAX_DEPTH {
            // One entry for the whole subtree, not one per buried file.
            if let Some(rel) = relative_posix(&dir, &canon_project) {
                skips.push(SkippedFile { path: rel, reason: SkipReason::TooDeep });
            }
            continue;
        }
        let entries = match fs::read_dir(&dir) {
            Ok(entries) => entries,
            Err(err) => {
                // A vanished dir is a deletion; anything else (e.g.
                // permissions) silently dropped a whole subtree pre-T-018.
                if err.kind() != std::io::ErrorKind::NotFound {
                    if let Some(rel) = relative_posix(&dir, &canon_project) {
                        skips.push(SkippedFile { path: rel, reason: SkipReason::Unreadable });
                    }
                }
                continue;
            }
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let Ok(meta) = fs::symlink_metadata(&path) else {
                continue;
            };
            if meta.file_type().is_symlink() {
                continue; // never follow links out of the tree; never report them
            }
            if meta.is_dir() {
                stack.push((path, depth + 1));
                continue;
            }
            if !meta.is_file() {
                continue;
            }
            // Belt to the symlink-skip's suspenders: canonical prefix
            // check, and the collected-set predicate runs on the
            // canonical RELATIVE path (containment first, classification
            // second — T-012).
            let Ok(canon) = path.canonicalize() else {
                continue;
            };
            if !canon.starts_with(&canon_project) {
                continue;
            }
            let Some(rel) = relative_posix(&canon, &canon_project) else {
                continue;
            };
            if !is_collected_docs_path(&rel) {
                continue;
            }
            eligible.push((rel, canon, meta.len()));
        }
    }

    // Phase 2: sort, cap, read. The cap counts files actually shipped
    // (as before: oversized/unreadable files never consumed a slot).
    eligible.sort_by(|a, b| a.0.cmp(&b.0));
    for (rel, canon, len) in eligible {
        if len > MAX_FILE_BYTES {
            skips.push(SkippedFile { path: rel, reason: SkipReason::Oversize });
            continue;
        }
        if out.files.len() >= MAX_FILES {
            out.truncated = true;
            skips.push(SkippedFile { path: rel, reason: SkipReason::FileCap });
            continue;
        }
        match fs::read_to_string(&canon) {
            Ok(content) => out.files.push(DocsFile { path: rel, content }),
            Err(err) if err.kind() == std::io::ErrorKind::InvalidData => {
                skips.push(SkippedFile { path: rel, reason: SkipReason::NonUtf8 });
            }
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                // Vanished mid-read: a deletion in progress, not a skip.
            }
            Err(_) => skips.push(SkippedFile { path: rel, reason: SkipReason::Unreadable }),
        }
    }
    // `files` is already path-sorted (read in sorted order); sort the
    // skips too so outcomes compare deterministically.
    skips.sort_by(|a, b| a.path.cmp(&b.path));
    out.skipped_total = skips.len();
    skips.truncate(MAX_SKIPPED_REPORTED);
    out.skipped = skips;
    out
}

/// T-003-shaped view of `collect_docs_tree` (files only) — kept so the
/// pre-T-018 tests read identically (production paths all want the
/// skips, so only tests still call this).
#[cfg(test)]
pub fn collect_docs_files(project_dir: &Path) -> Vec<DocsFile> {
    collect_docs_tree(project_dir).files
}

/// Stamp one collection outcome as a snapshot of `root`'s docs tree.
fn snapshot_from(root: &Path, seq: u64, outcome: CollectOutcome) -> DocsSnapshot {
    DocsSnapshot {
        seq,
        project_dir: root.display().to_string(),
        generated_at_ms: now_ms(),
        files: outcome.files,
        skipped: outcome.skipped,
        skipped_total: outcome.skipped_total,
        truncated: outcome.truncated,
    }
}

/// Build one snapshot of `root`'s docs tree stamped with `seq`.
fn build_snapshot(root: &Path, seq: u64) -> DocsSnapshot {
    snapshot_from(root, seq, collect_docs_tree(root))
}

/// The `docs_snapshot` command's answer (T-007 shape): what project is
/// open, and its docs tree when there is one to show.
pub fn project_status(state: &WatchState) -> ProjectStatus {
    match state.project_dir() {
        None => ProjectStatus::NoProject,
        Some(root) => {
            if has_plain_docs_dir(&root) {
                ProjectStatus::Open {
                    snapshot: build_snapshot(&root, state.next_seq()),
                }
            } else {
                ProjectStatus::NoDocs {
                    project_dir: root.display().to_string(),
                    probe: probe_plan(&root),
                }
            }
        }
    }
}

/// Apply a folder the user picked in the native dialog (T-007 criterion b).
///
/// Order is what makes a bad pick harmless: canonicalize -> require a
/// plain docs/ (same symlink rules as T-003) -> re-arm the watcher on the
/// new root (rendezvous; on failure the old watch is untouched) -> only
/// then commit the new project dir and take a snapshot. Every early
/// return leaves the previous project — state, watch, model — exactly as
/// it was (criterion c's no-corruption guarantee lives here).
///
/// T-021 (the T-007 verifier's residual note): the project mutex used to
/// be held across this whole pipeline, so a concurrent `docs_snapshot`
/// blocked for up to the 10s rendezvous timeout behind a slow re-arm.
/// Now the pipeline is serialized by the consumed `PickInFlight` guard
/// (claimed by the command before the dialog even opened), and the mutex
/// covers exactly one thing: the commit. `docs_snapshot` during a pick
/// answers immediately with the still-open project; the pick's own
/// snapshot seq is taken after the commit, so ordering across the switch
/// is unchanged (monotonic, ack-then-commit-then-seq).
pub fn apply_picked_folder(state: &WatchState, picked: &Path, flight: PickInFlight) -> PickOutcome {
    // Consuming the guard makes "the pipeline runs under the latch"
    // structural; its Drop releases the latch on every return path.
    let _flight = flight;

    let Ok(canon) = picked.canonicalize() else {
        // Vanished or unreadable: nothing usable was found at that path.
        return PickOutcome::NoDocs {
            path: picked.display().to_string(),
            probe: PlanProbe::default(),
        };
    };
    open_as_project(state, &canon)
}

/// The ordinary open, from a path that is already canonical (T-026 split
/// it out of `apply_picked_folder` so the genesis pick can ROUTE to it
/// outcome-for-outcome when the chosen folder turns out to hold a plan —
/// criterion 5's "routes to opening it as a normal project" is a call,
/// not a re-implementation).
fn open_as_project(state: &WatchState, canon: &Path) -> PickOutcome {
    let canon = canon.to_path_buf();
    if !has_plain_docs_dir(&canon) {
        // T-026: the front door is about to offer genesis for exactly
        // this folder, so remember it here — the user chose it, and the
        // path stays Rust-side.
        state.remember_rejected(&canon);
        return PickOutcome::NoDocs {
            path: canon.display().to_string(),
            probe: probe_plan(&canon),
        };
    }

    // Rendezvous with the watcher thread: arm the new root before any
    // state changes. The thread resets its emit baseline before acking,
    // and the snapshot below is read after the ack, so the snapshot is
    // never older than the baseline — post-pick changes always diff.
    // No lock is held here (T-021): the thread's own has_plain_docs_dir
    // gate re-checks the root at arm time (the T-007 validate->arm
    // defense in depth), so the mutex never protected this window —
    // it only made readers queue behind it.
    let (ack_tx, ack_rx) = mpsc::channel();
    if state
        .ctl
        .send(WatchCtl::Rearm {
            root: canon.clone(),
            ack: ack_tx,
        })
        .is_err()
    {
        return PickOutcome::Error {
            path: canon.display().to_string(),
            message: "watcher thread is not running".into(),
        };
    }
    match ack_rx.recv_timeout(REARM_TIMEOUT) {
        Ok(Ok(())) => {}
        Ok(Err(message)) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message,
            }
        }
        // T-021: the two failure shapes report honestly (the T-007
        // verifier's cosmetic note: a DROPPED ack is instant, not a
        // timeout — saying "timed out" was a lie).
        Err(mpsc::RecvTimeoutError::Timeout) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message: "watcher re-arm timed out".into(),
            }
        }
        Err(mpsc::RecvTimeoutError::Disconnected) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message: "watcher thread dropped the re-arm ack".into(),
            }
        }
    }

    // The commit — the only mutation, and now the only lock window.
    *state.project.lock().expect("project mutex poisoned") = Some(canon.clone());
    let seq = state.next_seq();
    state.clear_rejected(); // a project opened: no candidate is pending
    println!("[nputer] project folder picked: {}", canon.display());
    PickOutcome::Picked {
        snapshot: build_snapshot(&canon, seq),
    }
}

/// T-026 criterion 2: open a folder as a GENESIS project — one with no
/// plan yet, where the interview is about to write `docs/` for the first
/// time. Called from the zero-argument picker variant
/// (`pick_genesis_folder`) and from `start_genesis_here`, which supplies
/// the folder the front door is already talking about (`genesis_target`);
/// the webview supplies no path in either case (ADR-012).
///
/// Order mirrors `apply_picked_folder`, and every early return leaves the
/// previously open project — state, watch, model — exactly as it was
/// (criterion 6):
/// 1. canonicalize, then require a PLAIN DIRECTORY (the T-003 rule family
///    applied to the root: a symlink swapped in for the folder — before
///    or after this check — is refused here AND again by the watcher
///    thread's own gate at arm time);
/// 2. if the folder already holds a plan, genesis is NOT offered
///    (criterion 5) — route to the ordinary open instead, which is the
///    only writer of a project switch either way;
/// 3. rendezvous with the watcher thread (`ArmGenesis`): the root
///    sentinel goes on the project root, so the interview's first
///    `mkdir docs` re-arms the docs watch and lights the existing
///    pipeline with no re-pick (criterion 3, T-018's mechanism);
/// 4. only then commit the project dir and take the ordering seq.
///
/// T-042 criterion 1: step 3's ack also reports whether a plain `docs/`
/// was already there and armed. When it was, this switch carries a
/// SNAPSHOT of that tree — the honest answer to "what is written here",
/// which the genesis screen previously had no way to learn until the
/// first fs event under a folder nothing was writing to yet.
pub fn apply_genesis_folder(
    state: &WatchState,
    picked: &Path,
    flight: PickInFlight,
) -> PickOutcome {
    let _flight = flight; // same structural latch as the ordinary pick

    let Ok(canon) = picked.canonicalize() else {
        return PickOutcome::Error {
            path: picked.display().to_string(),
            message: "that folder is no longer there".into(),
        };
    };
    if !is_plain_dir(&canon) {
        return PickOutcome::Error {
            path: canon.display().to_string(),
            message: "not a plain directory - refusing to open it".into(),
        };
    }

    let probe = probe_plan(&canon);
    if probe.has_plan() {
        // Criterion 5: there is no overwrite path in this app. A folder
        // that already has a plan opens as the normal project it is.
        println!(
            "[nputer] genesis declined: {} already has a plan - opening it as a project",
            canon.display()
        );
        return open_as_project(state, &canon);
    }

    let (ack_tx, ack_rx) = mpsc::channel();
    if state
        .ctl
        .send(WatchCtl::ArmGenesis {
            root: canon.clone(),
            ack: ack_tx,
        })
        .is_err()
    {
        return PickOutcome::Error {
            path: canon.display().to_string(),
            message: "watcher thread is not running".into(),
        };
    }
    let docs_armed = match ack_rx.recv_timeout(REARM_TIMEOUT) {
        Ok(Ok(armed)) => armed,
        Ok(Err(message)) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message,
            }
        }
        Err(mpsc::RecvTimeoutError::Timeout) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message: "watcher re-arm timed out".into(),
            }
        }
        Err(mpsc::RecvTimeoutError::Disconnected) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message: "watcher thread dropped the re-arm ack".into(),
            }
        }
    };

    // The commit — the only mutation, and the only lock window.
    *state.project.lock().expect("project mutex poisoned") = Some(canon.clone());
    // The switch's ordering stamp: every emit still in flight from the
    // PREVIOUS project carries a lower seq and drops as stale on the
    // frontend — the T-007 invariant, held whether or not a tree rides.
    let seq = state.next_seq();
    state.clear_rejected();
    // T-042 criterion 1. Collected AFTER the ack, exactly as
    // `open_as_project` does and for the same load-bearing reason: the
    // arming thread reset its emit baseline to the tree it saw, so a
    // snapshot taken from THAT collection could be older than the
    // baseline and a file written in between would never diff — it would
    // be suppressed forever. Reading the tree after the ack costs one
    // extra collect and makes the snapshot never older than the baseline.
    let snapshot = docs_armed.then(|| build_snapshot(&canon, seq));
    println!(
        "[nputer] genesis project opened: {} ({})",
        canon.display(),
        match &snapshot {
            Some(snap) => format!("docs/ already holds {} file(s)", snap.files.len()),
            None => "waiting for docs/ to appear".to_string(),
        }
    );
    PickOutcome::Genesis {
        project_dir: canon.display().to_string(),
        seq,
        probe,
        snapshot,
    }
}

/// Escape control characters so untrusted text (file-derived) cannot smuggle
/// terminal escape sequences into our stdout logs; truncate to keep one
/// event to one sane line.
pub fn sanitize_for_log(raw: &str) -> String {
    let mut s: String = raw
        .chars()
        .take(MAX_ECHO_LOG_CHARS)
        .flat_map(|c| {
            if c.is_control() {
                c.escape_default().collect::<Vec<_>>()
            } else {
                vec![c]
            }
        })
        .collect();
    if raw.chars().count() > MAX_ECHO_LOG_CHARS {
        s.push_str("…(truncated)");
    }
    s
}

/// Spawn the watcher control thread and return its control-channel sender.
///
/// `initial_root` is the launch-resolved project (None when nothing
/// resolved — the thread stays alive, unarmed, until a folder is picked).
/// `sink` receives every emitted snapshot (production: the Tauri
/// `docs-changed` event; tests: a channel).
pub fn spawn_watcher_thread(
    seq: Arc<AtomicU64>,
    initial_root: Option<PathBuf>,
    sink: impl Fn(&DocsSnapshot) + Send + 'static,
) -> mpsc::Sender<WatchCtl> {
    let (tx, rx) = mpsc::channel::<WatchCtl>();
    let fs_tx = tx.clone();
    std::thread::spawn(move || run_watcher(seq, rx, fs_tx, initial_root, sink));
    tx
}

/// Everything the control thread mutates when (re)arming.
struct WatchTarget {
    /// The open project root — the sentinel's scope. Set even when the
    /// docs watch could not arm (docsless at startup), so a later
    /// `docs/` appearance re-arms (T-018).
    root: Option<PathBuf>,
    /// The currently ARMED recursive docs watch (None = unarmed).
    docs: Option<PathBuf>,
    /// (dev, ino) of the armed docs dir on unix — how a wholesale
    /// replacement (same path, new directory) is detected. None when
    /// unknown (non-unix, or metadata raced) — detection degrades to
    /// best-effort, never to an error.
    docs_id: Option<(u64, u64)>,
    /// The armed non-recursive root sentinel watch (T-018). Purely a
    /// wake-up channel: its events carry no meaning of their own beyond
    /// "a batch arrived — run the stat checks".
    sentinel: Option<PathBuf>,
    /// Emit-suppression baseline: the WHOLE outcome, skips included.
    last: CollectOutcome,
}

/// Directory identity for replacement detection: (dev, ino) on unix.
#[cfg(unix)]
fn dir_identity(path: &Path) -> Option<(u64, u64)> {
    use std::os::unix::fs::MetadataExt;
    fs::symlink_metadata(path).ok().map(|meta| (meta.dev(), meta.ino()))
}

/// Non-unix: identity unknown — replacement detection is best-effort
/// (appears/vanishes still handled via the armed-state + stat checks).
#[cfg(not(unix))]
fn dir_identity(_path: &Path) -> Option<(u64, u64)> {
    None
}

/// Arm (or move) the root sentinel — the non-recursive watch on the
/// project root whose only job is making a debounced batch ARRIVE when
/// the `docs` entry appears, vanishes, or is replaced. Best-effort by
/// contract (T-018 additive-only criterion): every failure path logs and
/// leaves the docs watch exactly as it was.
fn arm_sentinel<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    root: &Path,
) {
    if target.sentinel.as_deref() == Some(root) {
        return; // already armed there
    }
    match debouncer.watcher().watch(root, RecursiveMode::NonRecursive) {
        Ok(()) => {
            if let Some(old) = target.sentinel.take() {
                if let Err(err) = debouncer.watcher().unwatch(&old) {
                    eprintln!("[nputer] watch: sentinel unwatch {} failed: {err}", old.display());
                }
            }
            target.sentinel = Some(root.to_path_buf());
            println!(
                "[nputer] watch: root sentinel on {} (docs/ create/replace re-arms the watch)",
                root.display()
            );
        }
        Err(err) => {
            // Watching continues exactly as pre-T-018; only the
            // self-healing is lost, and we say so.
            eprintln!(
                "[nputer] watch: root sentinel failed on {}: {err} - a replaced docs/ will need a manual re-pick",
                root.display()
            );
            if let Some(old) = target.sentinel.take() {
                let _ = debouncer.watcher().unwatch(&old); // stale scope
            }
        }
    }
}

/// Reconcile the armed docs watch with what is on disk (T-018, the
/// sentinel's re-arm trigger). Stat-based on purpose: event paths differ
/// across notify backends, but "does `<root>/docs` exist, and is it the
/// directory we armed?" does not. Every failure path degrades to "watch
/// as before, retry on the next batch" — never an error, never a panic.
///
/// Returns TRUE when the docs watch's ARMED STATE CHANGED — unarmed to
/// armed, or armed to unarmed — and only then. ONE rule, not two special
/// cases: **a watch-state transition is news the tree cannot carry.**
///
/// T-026 criterion 4 (folding T-018-s4) established the appear
/// direction: an empty `docs/` collects EQUAL to the empty baseline, so
/// the suppression invariant swallowed it and the front door went on
/// claiming "no docs/ found" over a directory sitting right there.
/// T-042 criterion 2 completes the rule with the mirror (T-026-s5): an
/// EMPTY `docs/` being DELETED collects equal to that same baseline, so
/// the board outlived the docs/ it described. Both are facts about the
/// project that are absent from the tree by construction, and both are
/// now the same fact. A wholesale REPLACEMENT is deliberately not one of
/// them: the watch stays armed throughout and the content diff is the
/// news. The caller emits once on a true.
#[must_use]
fn ensure_docs_watch<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    root: &Path,
) -> bool {
    let docs = root.join(DOCS_DIR);
    let present = has_plain_docs_dir(root);
    // The one rule, measured rather than announced from inside the arms:
    // whatever the arms below do, the answer is whether this changed.
    let was_armed = target.docs.is_some();
    match (was_armed, present) {
        // docs/ appeared under a root we could not arm before: arm it.
        (false, true) => match debouncer.watcher().watch(&docs, RecursiveMode::Recursive) {
            Ok(()) => {
                target.docs = Some(docs.clone());
                target.docs_id = dir_identity(&docs);
                println!("[nputer] watch: docs/ appeared - watching {}", docs.display());
            }
            Err(err) => eprintln!(
                "[nputer] watch: docs/ appeared but watch failed: {err} (will retry on the next event)"
            ),
        },
        // Armed and present: re-arm only when the directory is provably
        // a DIFFERENT one (wholesale replacement — the old handle keeps
        // watching the moved-away inode and would go silent).
        (true, true) => {
            let replaced = match (dir_identity(&docs), target.docs_id) {
                (Some(now), Some(armed)) => now != armed,
                (Some(_), None) => true, // identity unknown at arm time: rebind to be safe
                (None, _) => false,      // cannot tell (non-unix): keep the handle
            };
            if replaced {
                if let Some(old) = target.docs.take() {
                    let _ = debouncer.watcher().unwatch(&old); // handle may already be dead
                }
                target.docs_id = None;
                match debouncer.watcher().watch(&docs, RecursiveMode::Recursive) {
                    Ok(()) => {
                        target.docs = Some(docs.clone());
                        target.docs_id = dir_identity(&docs);
                        println!(
                            "[nputer] watch: docs/ was replaced - re-armed on {}",
                            docs.display()
                        );
                    }
                    Err(err) => eprintln!(
                        "[nputer] watch: docs/ replaced but re-arm failed: {err} (will retry on the next event)"
                    ),
                }
            }
        }
        // Armed but gone (deleted, or replaced by something we refuse):
        // drop the stale handle so a later appearance re-arms. The
        // collect below then ships the empty tree — deletion semantics
        // unchanged, recovery now armed. T-042: when the docs/ that
        // vanished was EMPTY, that empty tree is the baseline and the
        // transition below is the whole of the news.
        (true, false) => {
            if let Some(old) = target.docs.take() {
                let _ = debouncer.watcher().unwatch(&old);
            }
            target.docs_id = None;
            println!(
                "[nputer] watch: docs/ gone from {} - sentinel waits for it to return",
                root.display()
            );
        }
        (false, false) => {}
    }
    target.docs.is_some() != was_armed
}

/// Handle one debounced fs batch: run the sentinel's re-arm check, then
/// collect, diff against the baseline, and emit. Factored out of
/// `run_watcher` so tests can drive it with arbitrary target states
/// (e.g. a failed sentinel) and synthetic batches.
fn handle_fs_batch<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    seq: &AtomicU64,
    events: &[DebouncedEvent],
    sink: &impl Fn(&DocsSnapshot),
) {
    if events.is_empty() {
        return;
    }
    let Some(root) = target.root.clone() else {
        return; // stale events with no project armed
    };
    // T-018 sentinel check BEFORE collecting, so this same batch ships
    // the re-armed tree's truth. Infallible by construction.
    let watch_state_changed = ensure_docs_watch(debouncer, target, &root);
    let seq = next_seq(seq);
    let outcome = collect_docs_tree(&root);
    // ONE RULE (T-026 criterion 4 + T-042 criterion 2): a WATCH-STATE
    // TRANSITION is news the tree cannot carry. "docs/ exists now" and
    // "docs/ is gone now" are both absent from the collected tree when
    // that tree is EMPTY — an empty docs/ is byte-for-byte the empty
    // baseline in either direction — so without this the front door would
    // keep claiming "no docs/ found" over a directory sitting right
    // there, and the board would outlive the docs/ it described. It fires
    // at most once per transition (the next batch finds the watch in its
    // new state), so the suppression invariant is untouched for every
    // other batch — including the very next one over the same tree.
    if outcome == target.last && !watch_state_changed {
        println!(
            "[nputer] watch: {} fs event(s) coalesced, content unchanged - suppressed",
            events.len()
        );
        return;
    }
    target.last = outcome.clone();
    let snapshot = snapshot_from(&root, seq, outcome);
    println!(
        "[nputer] docs-changed: seq={} files={} skipped={} truncated={} fs_events={} at_ms={}",
        snapshot.seq,
        snapshot.files.len(),
        snapshot.skipped_total,
        snapshot.truncated,
        events.len(),
        snapshot.generated_at_ms
    );
    sink(&snapshot);
}

fn run_watcher(
    seq: Arc<AtomicU64>,
    rx: mpsc::Receiver<WatchCtl>,
    fs_tx: mpsc::Sender<WatchCtl>,
    initial_root: Option<PathBuf>,
    sink: impl Fn(&DocsSnapshot),
) {
    let mut debouncer = match new_debouncer(DEBOUNCE, move |res: DebounceEventResult| {
        let _ = fs_tx.send(WatchCtl::Fs(res));
    }) {
        Ok(d) => d,
        Err(err) => {
            eprintln!("[nputer] watch: failed to create watcher: {err}");
            return;
        }
    };

    let mut target = WatchTarget {
        root: None,
        docs: None,
        docs_id: None,
        sentinel: None,
        last: CollectOutcome::default(),
    };

    match initial_root {
        Some(root) => {
            if let Err(msg) = rearm(&mut debouncer, &mut target, root.clone()) {
                println!(
                    "[nputer] watch: {msg} - watcher idle until docs/ appears or a project folder is picked"
                );
                // T-018 (T-003-s1 case 1): the resolved project may grow a
                // docs/ LATER — scope the sentinel to the root so its
                // appearance re-arms us. Startup only: a failed PICK must
                // never move the sentinel off the previously open project
                // (rearm leaves everything untouched on failure).
                target.root = Some(root.clone());
                arm_sentinel(&mut debouncer, &mut target, &root);
            }
        }
        None => {
            println!("[nputer] watch: no project resolved - watcher idle until a project folder is picked");
        }
    }

    for msg in rx {
        match msg {
            WatchCtl::Fs(Ok(events)) => {
                handle_fs_batch(&mut debouncer, &mut target, &seq, &events, &sink);
            }
            WatchCtl::Fs(Err(err)) => eprintln!("[nputer] watch: watcher error: {err}"),
            WatchCtl::Rearm { root, ack } => {
                let _ = ack.send(rearm(&mut debouncer, &mut target, root));
            }
            // T-026: same rendezvous contract, genesis arming rules.
            WatchCtl::ArmGenesis { root, ack } => {
                let _ = ack.send(arm_genesis(&mut debouncer, &mut target, root));
            }
        }
    }
    // Keep the debouncer alive for the loop's whole lifetime.
    drop(debouncer);
}

/// (Re)arm the watch on `<new_root>/docs`. Arms the NEW watch before
/// dropping the old one, so a failure at any step leaves the previous
/// project's watch fully intact. Resets the emit baseline to the new
/// tree's current content on success. T-018: a successful (re)arm also
/// arms the root sentinel — best-effort, AFTER the docs watch, so its
/// failure can never fail the re-arm or disturb an armed watch.
fn rearm<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    new_root: PathBuf,
) -> Result<(), String> {
    // Same gate as the picker validation — defense in depth for the
    // window between validation and arming, and for the startup path.
    if !has_plain_docs_dir(&new_root) {
        return Err(format!(
            "{} is not a plain directory",
            new_root.join(DOCS_DIR).display()
        ));
    }
    let new_docs = new_root.join(DOCS_DIR);

    if target.docs.as_ref() == Some(&new_docs) {
        // Same folder re-picked: keep the watch — unless the directory
        // was replaced behind the same path, in which case the manual
        // re-pick is exactly the recovery the user reached for: heal the
        // handle (T-018; pre-T-018 this branch kept a stale handle).
        // The arm-transition flag is irrelevant here: this path resets the
        // baseline and the pick answers with a fresh snapshot of its own.
        let _ = ensure_docs_watch(debouncer, target, &new_root);
        if target.docs.is_none() {
            return Err(format!("cannot watch {}", new_docs.display()));
        }
        target.last = collect_docs_tree(&new_root);
        arm_sentinel(debouncer, target, &new_root);
        return Ok(());
    }

    if let Err(err) = debouncer
        .watcher()
        .watch(&new_docs, RecursiveMode::Recursive)
    {
        return Err(format!("cannot watch {}: {err}", new_docs.display()));
    }
    if let Some(old_docs) = target.docs.take() {
        if let Err(err) = debouncer.watcher().unwatch(&old_docs) {
            // Not fatal: any stale events collect from the NEW root and
            // are suppressed by content equality.
            eprintln!(
                "[nputer] watch: unwatch {} failed: {err}",
                old_docs.display()
            );
        }
    }
    target.last = collect_docs_tree(&new_root);
    target.docs = Some(new_docs.clone());
    target.docs_id = dir_identity(&new_docs);
    target.root = Some(new_root.clone());
    arm_sentinel(debouncer, target, &new_root);
    println!(
        "[nputer] watch: watching {} (debounce {}ms)",
        new_docs.display(),
        DEBOUNCE.as_millis()
    );
    Ok(())
}

/// T-026: arm on a genesis root — a project folder whose `docs/` does not
/// exist yet. The ROOT SENTINEL is the load-bearing watch here, so unlike
/// T-018's best-effort sentinel this one is a hard requirement: if it
/// cannot be armed, the interview's first `mkdir docs` would never be
/// noticed and the app would sit there lying, so the pick fails instead
/// and the previously open project keeps its watch.
///
/// A genesis root that DOES already carry a plain `docs/` (a folder with
/// docs/ but no plan — an empty docs/, or a lone ARCHITECTURE.md) is
/// simply the ordinary arm: `rearm` does everything right for it,
/// including the sentinel.
///
/// Ok(true) means exactly that case — the recursive docs watch is armed,
/// so there is a tree here and the caller owes the switch a snapshot of
/// it (T-042 criterion 1). Ok(false) is the docs-less genesis root the
/// sentinel alone watches.
fn arm_genesis<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    new_root: PathBuf,
) -> Result<bool, String> {
    // The T-003 rule family at arm time (defense in depth for the
    // validate -> arm window, exactly as `rearm` re-checks docs/): a
    // symlink swapped in for the root between the pick's check and this
    // one is refused here, with nothing mutated.
    if !is_plain_dir(&new_root) {
        return Err(format!("{} is not a plain directory", new_root.display()));
    }
    if has_plain_docs_dir(&new_root) {
        return rearm(debouncer, target, new_root).map(|()| true);
    }

    // Arm the sentinel BEFORE dropping the old docs watch (T-007's rule:
    // a failure must leave the previous project fully watched).
    let previous_sentinel = target.sentinel.clone();
    arm_sentinel(debouncer, target, &new_root);
    if target.sentinel.as_deref() != Some(new_root.as_path()) {
        // arm_sentinel drops the old scope when it fails, so put the
        // previous project's self-healing back before returning — "the
        // previously open project is untouched" has to be literal, not
        // approximate.
        if let Some(old) = previous_sentinel {
            arm_sentinel(debouncer, target, &old);
        }
        return Err(format!(
            "cannot watch {} for docs/ appearing",
            new_root.display()
        ));
    }
    if let Some(old_docs) = target.docs.take() {
        if let Err(err) = debouncer.watcher().unwatch(&old_docs) {
            // Not fatal: stale events collect from the NEW root and are
            // suppressed by outcome equality.
            eprintln!(
                "[nputer] watch: unwatch {} failed: {err}",
                old_docs.display()
            );
        }
    }
    target.docs_id = None;
    target.root = Some(new_root.clone());
    // Honest baseline for a root with no docs/: the empty outcome. The
    // (unarmed -> armed) transition is what emits later, not a diff.
    target.last = collect_docs_tree(&new_root);
    println!(
        "[nputer] watch: genesis root {} (no docs/ yet - the sentinel is the watch)",
        new_root.display()
    );
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Unique scratch dir under the system temp dir; removed on drop.
    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "nputer-t003-{}-{}-{}",
                tag,
                std::process::id(),
                now_ms()
            ));
            fs::create_dir_all(dir.join("docs")).expect("mk temp docs");
            Self(dir)
        }
        fn root(&self) -> &Path {
            &self.0
        }
        fn write(&self, rel: &str, content: &str) {
            let path = self.0.join(rel);
            fs::create_dir_all(path.parent().expect("parent")).expect("mkdirs");
            fs::write(path, content).expect("write");
        }
    }
    impl Drop for TempTree {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    /// WatchState wired to a live watcher thread whose emits land on the
    /// returned channel (the test stand-in for the `docs-changed` event).
    fn live_state(initial: Option<PathBuf>) -> (WatchState, mpsc::Receiver<DocsSnapshot>) {
        let seq = Arc::new(AtomicU64::new(0));
        let (emit_tx, emit_rx) = mpsc::channel();
        let ctl = spawn_watcher_thread(seq.clone(), initial.clone(), move |snap| {
            let _ = emit_tx.send(snap.clone());
        });
        (WatchState::new(initial, seq, ctl), emit_rx)
    }

    /// WatchState with a dead control channel — fine for tests that never
    /// reach the re-arm rendezvous (validation rejections, status).
    fn detached_state(initial: Option<PathBuf>) -> WatchState {
        let (ctl, _rx) = mpsc::channel();
        WatchState::new(initial, Arc::new(AtomicU64::new(0)), ctl)
    }

    /// The command layer's pick, minus the dialog (T-021): claim the
    /// single-flight guard, then apply. Panics if a pick is already in
    /// flight — sequential tests never are.
    fn apply_pick(state: &WatchState, picked: &Path) -> PickOutcome {
        apply_picked_folder(state, picked, state.begin_pick().expect("picker free"))
    }

    fn recv_emit(rx: &mpsc::Receiver<DocsSnapshot>) -> DocsSnapshot {
        rx.recv_timeout(Duration::from_secs(10))
            .expect("expected a docs-changed emit")
    }

    #[test]
    fn collects_md_files_recursively_sorted_with_posix_relative_paths() {
        let t = TempTree::new("collect");
        t.write("docs/ROADMAP.md", "roadmap");
        t.write("docs/tasks/T-002-b.md", "b");
        t.write("docs/tasks/T-001-a.md", "a");
        t.write("docs/decisions/001-x.md", "adr");
        t.write("docs/notes.txt", "not markdown");
        t.write("outside.md", "outside docs, ignored");

        let files = collect_docs_files(t.root());
        let paths: Vec<&str> = files.iter().map(|f| f.path.as_str()).collect();
        assert_eq!(
            paths,
            vec![
                "docs/ROADMAP.md",
                "docs/decisions/001-x.md",
                "docs/tasks/T-001-a.md",
                "docs/tasks/T-002-b.md",
            ]
        );
        assert_eq!(files[0].content, "roadmap");
    }

    // ---- T-012: the collector's .json rule (ADR-014 delivery) ----------

    #[test]
    fn is_collected_docs_path_accepts_md_anywhere_and_json_only_under_architecture() {
        // .md anywhere under docs/ (unchanged T-003 behavior).
        assert!(is_collected_docs_path("docs/ROADMAP.md"));
        assert!(is_collected_docs_path("docs/tasks/T-001-a.md"));
        // .json only under docs/architecture/, subdirectories included
        // (T-015's layout.json rides free later).
        assert!(is_collected_docs_path("docs/architecture/graph.json"));
        assert!(is_collected_docs_path("docs/architecture/deep/layout.json"));
        assert!(!is_collected_docs_path("docs/foo.json"));
        assert!(!is_collected_docs_path("docs/tasks/data.json"));
        // Prefix trickery: "docs/architecture.json" is NOT under the dir.
        assert!(!is_collected_docs_path("docs/architecture.json"));
        // Other extensions stay out; nothing outside docs/ ever enters.
        assert!(!is_collected_docs_path("docs/architecture/notes.txt"));
        assert!(!is_collected_docs_path("src/architecture/graph.json"));
        assert!(!is_collected_docs_path("architecture/graph.json"));
    }

    #[test]
    fn collects_architecture_json_alongside_md() {
        let t = TempTree::new("json-collect");
        t.write("docs/ROADMAP.md", "roadmap");
        t.write("docs/architecture/graph.json", "{\"schema\":1}");
        t.write("docs/architecture/sub/layout.json", "{}");
        t.write("docs/tasks/data.json", "excluded - json outside architecture");
        t.write("docs/architecture/readme.txt", "excluded - not md/json");

        let files = collect_docs_files(t.root());
        let paths: Vec<&str> = files.iter().map(|f| f.path.as_str()).collect();
        assert_eq!(
            paths,
            vec![
                "docs/ROADMAP.md",
                "docs/architecture/graph.json",
                "docs/architecture/sub/layout.json",
            ]
        );
        assert_eq!(files[1].content, "{\"schema\":1}");
    }

    #[test]
    fn oversized_architecture_json_is_skipped_like_oversized_md() {
        let t = TempTree::new("json-big");
        t.write("docs/architecture/graph.json", "{}");
        let big = "x".repeat((MAX_FILE_BYTES + 1) as usize);
        t.write("docs/architecture/huge.json", &big);
        let paths: Vec<String> = collect_docs_files(t.root()).into_iter().map(|f| f.path).collect();
        assert_eq!(paths, vec!["docs/architecture/graph.json"]);
    }

    #[cfg(unix)]
    #[test]
    fn symlinked_architecture_json_is_never_followed() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("json-symlink");
        t.write("docs/architecture/real.json", "{}");
        let outside = TempTree::new("json-symlink-outside");
        outside.write("secret.json", "{\"secret\":true}");
        symlink(
            outside.root().join("secret.json"),
            t.root().join("docs/architecture/link.json"),
        )
        .expect("file symlink");

        let files = collect_docs_files(t.root());
        let paths: Vec<&str> = files.iter().map(|f| f.path.as_str()).collect();
        assert_eq!(paths, vec!["docs/architecture/real.json"]);
        assert!(files.iter().all(|f| !f.content.contains("secret")));
    }

    #[test]
    fn missing_docs_dir_yields_empty_snapshot() {
        let t = TempTree::new("nodocs");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        assert!(collect_docs_files(t.root()).is_empty());
        assert!(!has_plain_docs_dir(t.root()));
    }

    #[test]
    fn oversized_files_are_skipped() {
        let t = TempTree::new("bigfile");
        t.write("docs/small.md", "ok");
        let big = "x".repeat((MAX_FILE_BYTES + 1) as usize);
        t.write("docs/big.md", &big);
        let paths: Vec<String> = collect_docs_files(t.root()).into_iter().map(|f| f.path).collect();
        assert_eq!(paths, vec!["docs/small.md"]);
    }

    #[cfg(unix)]
    #[test]
    fn symlinks_are_never_followed() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("symlink");
        t.write("docs/real.md", "real");

        // A file outside the project a hostile repo might try to exfiltrate.
        let outside = TempTree::new("symlink-outside");
        outside.write("secret.md", "secret contents");
        symlink(outside.root().join("secret.md"), t.root().join("docs/link.md"))
            .expect("file symlink");
        symlink(outside.root(), t.root().join("docs/linkdir")).expect("dir symlink");

        let files = collect_docs_files(t.root());
        let paths: Vec<&str> = files.iter().map(|f| f.path.as_str()).collect();
        assert_eq!(paths, vec!["docs/real.md"]);
        assert!(files.iter().all(|f| !f.content.contains("secret")));
    }

    #[test]
    fn snapshots_are_equal_until_content_changes() {
        let t = TempTree::new("equality");
        t.write("docs/tasks/T-001-a.md", "a");
        let first = collect_docs_files(t.root());
        let second = collect_docs_files(t.root());
        assert_eq!(first, second); // basis of emit suppression

        t.write("docs/tasks/T-001-a.md", "a changed");
        let third = collect_docs_files(t.root());
        assert_ne!(first, third);
    }

    #[test]
    fn seq_is_monotonic_from_one() {
        let state = detached_state(Some(PathBuf::from("/tmp")));
        assert_eq!(state.next_seq(), 1);
        assert_eq!(state.next_seq(), 2);
        assert_eq!(state.next_seq(), 3);
    }

    #[test]
    fn sanitize_for_log_escapes_control_chars_and_truncates() {
        assert_eq!(sanitize_for_log("plain"), "plain");
        assert_eq!(sanitize_for_log("a\u{1b}[31mred"), "a\\u{1b}[31mred");
        assert_eq!(sanitize_for_log("line\nbreak"), "line\\nbreak");
        let long = "y".repeat(MAX_ECHO_LOG_CHARS + 5);
        let logged = sanitize_for_log(&long);
        assert!(logged.ends_with("…(truncated)"));
        assert_eq!(logged.chars().count(), MAX_ECHO_LOG_CHARS + "…(truncated)".chars().count());
    }

    // ---- T-007: project status ------------------------------------------

    #[test]
    fn project_status_reports_no_project_when_nothing_resolved() {
        let state = detached_state(None);
        assert!(matches!(project_status(&state), ProjectStatus::NoProject));
    }

    #[test]
    fn project_status_reports_no_docs_for_a_docsless_root() {
        let t = TempTree::new("status-nodocs");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        let state = detached_state(Some(t.root().to_path_buf()));
        match project_status(&state) {
            ProjectStatus::NoDocs { project_dir, probe } => {
                assert_eq!(project_dir, t.root().display().to_string());
                // T-026: the front door's checklist rides this status;
                // an empty scratch tree finds nothing, honestly.
                assert_eq!(probe, PlanProbe::default());
            }
            other => panic!("expected NoDocs, got {other:?}"),
        }
    }

    #[test]
    fn project_status_reports_open_with_the_docs_tree() {
        let t = TempTree::new("status-open");
        t.write("docs/tasks/T-100-x.md", "x");
        let state = detached_state(Some(t.root().to_path_buf()));
        match project_status(&state) {
            ProjectStatus::Open { snapshot } => {
                assert_eq!(snapshot.seq, 1);
                assert_eq!(
                    snapshot.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
                    vec!["docs/tasks/T-100-x.md"]
                );
            }
            other => panic!("expected Open, got {other:?}"),
        }
    }

    // ---- T-007: picker validation ---------------------------------------

    #[test]
    fn picking_a_nonexistent_folder_is_no_docs_and_mutates_nothing() {
        let prev = TempTree::new("pick-prev");
        let state = detached_state(Some(prev.root().to_path_buf()));
        let gone = prev.root().join("never-existed");
        match apply_pick(&state, &gone) {
            PickOutcome::NoDocs { path, probe } => {
                assert_eq!(path, gone.display().to_string());
                assert_eq!(probe, PlanProbe::default()); // nothing there to find
            }
            other => panic!("expected NoDocs, got {other:?}"),
        }
        // Previous project untouched (criterion c: no corruption).
        assert_eq!(state.project_dir(), Some(prev.root().to_path_buf()));
    }

    #[test]
    fn picking_a_folder_without_docs_is_no_docs_and_mutates_nothing() {
        let prev = TempTree::new("pick-prev2");
        let state = detached_state(Some(prev.root().to_path_buf()));
        let bare = TempTree::new("pick-bare");
        fs::remove_dir_all(bare.root().join("docs")).expect("rm docs");
        match apply_pick(&state, bare.root()) {
            PickOutcome::NoDocs { path, probe } => {
                // Canonicalized form of what was looked at.
                assert_eq!(path, bare.root().canonicalize().unwrap().display().to_string());
                assert_eq!(probe, PlanProbe::default());
            }
            other => panic!("expected NoDocs, got {other:?}"),
        }
        assert_eq!(state.project_dir(), Some(prev.root().to_path_buf()));
    }

    #[cfg(unix)]
    #[test]
    fn picking_a_root_whose_docs_is_a_symlink_is_refused() {
        use std::os::unix::fs::symlink;
        let state = detached_state(None);
        let trap = TempTree::new("pick-docslink");
        fs::remove_dir_all(trap.root().join("docs")).expect("rm docs");
        let outside = TempTree::new("pick-docslink-target");
        outside.write("docs/leak.md", "outside content");
        symlink(outside.root().join("docs"), trap.root().join("docs")).expect("docs symlink");

        match apply_pick(&state, trap.root()) {
            PickOutcome::NoDocs { .. } => {}
            other => panic!("expected NoDocs for symlinked docs/, got {other:?}"),
        }
        assert_eq!(state.project_dir(), None);
    }

    #[cfg(unix)]
    #[test]
    fn picked_root_containment_skips_internal_symlinks() {
        use std::os::unix::fs::symlink;
        let (state, _emits) = live_state(None);
        let picked = TempTree::new("pick-contain");
        picked.write("docs/real.md", "real");
        let outside = TempTree::new("pick-contain-outside");
        outside.write("secret.md", "secret contents");
        symlink(
            outside.root().join("secret.md"),
            picked.root().join("docs/leak.md"),
        )
        .expect("file symlink");
        symlink(outside.root(), picked.root().join("docs/leakdir")).expect("dir symlink");

        match apply_pick(&state, picked.root()) {
            PickOutcome::Picked { snapshot } => {
                let paths: Vec<&str> = snapshot.files.iter().map(|f| f.path.as_str()).collect();
                assert_eq!(paths, vec!["docs/real.md"]);
                assert!(snapshot.files.iter().all(|f| !f.content.contains("secret")));
            }
            other => panic!("expected Picked, got {other:?}"),
        }
    }

    #[cfg(unix)]
    #[test]
    fn picking_through_a_symlinked_root_anchors_to_the_canonical_path() {
        use std::os::unix::fs::symlink;
        let (state, _emits) = live_state(None);
        let real = TempTree::new("pick-canon");
        real.write("docs/tasks/T-200-y.md", "y");
        let alias_parent = TempTree::new("pick-canon-alias");
        let alias = alias_parent.root().join("alias");
        symlink(real.root(), &alias).expect("root symlink");

        match apply_pick(&state, &alias) {
            PickOutcome::Picked { snapshot } => {
                let canon = real.root().canonicalize().unwrap();
                assert_eq!(snapshot.project_dir, canon.display().to_string());
                assert_eq!(state.project_dir(), Some(canon));
            }
            other => panic!("expected Picked, got {other:?}"),
        }
    }

    // ---- T-007: re-arm --------------------------------------------------

    #[test]
    fn startup_arm_watches_the_initial_root() {
        let a = TempTree::new("startup-a");
        a.write("docs/tasks/T-300-s.md", "startup v1");
        let (_state, emits) = live_state(Some(a.root().to_path_buf()));

        // The initial arm is asynchronous (no rendezvous at spawn), so the
        // very first write can race the baseline collect and be suppressed;
        // let that window pass, then a further change MUST emit.
        a.write("docs/tasks/T-300-s.md", "startup v2");
        std::thread::sleep(DEBOUNCE * 4);
        a.write("docs/tasks/T-300-s.md", "startup v3");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "startup v3") {
                break;
            }
        }
    }

    #[test]
    fn picker_rearms_the_watcher_onto_the_new_root() {
        let a = TempTree::new("rearm-a");
        a.write("docs/tasks/T-301-a.md", "alpha v1");
        let b = TempTree::new("rearm-b");
        b.write("docs/tasks/T-302-b.md", "beta v1");

        // Start with no project and pick A — the pick's rendezvous
        // guarantees the watch is armed and the baseline set before it
        // returns, so everything after is deterministic.
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_pick(&state, a.root()),
            PickOutcome::Picked { .. }
        ));
        let canon_a = a.root().canonicalize().unwrap();

        // Watching A: a change there emits.
        a.write("docs/tasks/T-301-a.md", "alpha v2");
        let first = recv_emit(&emits);
        assert!(first.files.iter().any(|f| f.content == "alpha v2"));

        // A failed pick must not disturb the armed watch (criterion c).
        let bare = TempTree::new("rearm-bare");
        fs::remove_dir_all(bare.root().join("docs")).expect("rm docs");
        assert!(matches!(
            apply_pick(&state, bare.root()),
            PickOutcome::NoDocs { .. }
        ));
        a.write("docs/tasks/T-301-a.md", "alpha v3");
        let still_a = recv_emit(&emits);
        assert!(still_a.files.iter().any(|f| f.content == "alpha v3"));
        assert_eq!(state.project_dir(), Some(canon_a));

        // Successful pick: seq continues past everything emitted so far.
        let picked = match apply_pick(&state, b.root()) {
            PickOutcome::Picked { snapshot } => snapshot,
            other => panic!("expected Picked, got {other:?}"),
        };
        let canon_b = b.root().canonicalize().unwrap();
        assert_eq!(picked.project_dir, canon_b.display().to_string());
        assert!(picked.seq > still_a.seq);
        assert_eq!(
            picked.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
            vec!["docs/tasks/T-302-b.md"]
        );

        // Watching B now: changes in B emit, stamped with B's dir and a
        // seq newer than the pick snapshot.
        b.write("docs/tasks/T-302-b.md", "beta v2");
        let from_b = recv_emit(&emits);
        assert_eq!(from_b.project_dir, canon_b.display().to_string());
        assert!(from_b.seq > picked.seq);
        assert!(from_b.files.iter().any(|f| f.content == "beta v2"));

        // A change in the OLD project must never surface B's watch: any
        // residual event collects from B and is suppressed by equality.
        a.write("docs/tasks/T-301-a.md", "alpha v4 after switch");
        b.write("docs/tasks/T-302-b.md", "beta v3");
        let after = recv_emit(&emits);
        assert_eq!(after.project_dir, canon_b.display().to_string());
        assert!(after.files.iter().all(|f| !f.content.contains("alpha")));
        assert!(after.files.iter().any(|f| f.content == "beta v3"));
    }

    #[test]
    fn rearm_baseline_makes_the_first_post_pick_change_emit() {
        let a = TempTree::new("baseline-a");
        a.write("docs/one.md", "one");
        let (state, emits) = live_state(None); // launched with no project

        let picked = match apply_pick(&state, a.root()) {
            PickOutcome::Picked { snapshot } => snapshot,
            other => panic!("expected Picked, got {other:?}"),
        };
        assert_eq!(picked.files.len(), 1);

        a.write("docs/two.md", "two");
        let emit = recv_emit(&emits);
        assert!(emit.seq > picked.seq);
        assert_eq!(emit.files.len(), 2);
    }

    // ---- T-021: picker single-flight + narrowed commit lock ------------

    /// The single-flight latch is exclusive, its Busy result is TYPED
    /// with a pinned wire shape, and dropping the guard frees the picker
    /// (deterministic: hold, assert, release — no timing anywhere).
    #[test]
    fn second_pick_claim_is_refused_typed_until_the_first_releases() {
        let state = detached_state(None);

        let flight = state.begin_pick().expect("first claim wins");
        assert!(
            state.begin_pick().is_none(),
            "a concurrent pick must be refused while one is in flight"
        );
        // The refusal the command returns is a typed outcome, not a
        // string and not silence — pin the exact wire shape the
        // frontend's PickOutcomePayload mirror matches on.
        assert_eq!(
            serde_json::to_value(PickOutcome::Busy).expect("serialize"),
            serde_json::json!({ "kind": "busy" })
        );

        drop(flight);
        assert!(
            state.begin_pick().is_some(),
            "dropping the guard must release the latch"
        );
    }

    /// THE narrowed-mutex proof (T-021, the T-007 verifier's residual
    /// note): while a re-arm rendezvous is parked mid-pick, a concurrent
    /// `docs_snapshot` answers immediately with the still-open project —
    /// pre-T-021 it blocked on the project mutex for up to the 10s
    /// rendezvous timeout. Deterministic: a controllable stand-in
    /// watcher thread parks the re-arm until the test releases it (the
    /// timeouts below only bound the FAILURE mode; the pass path never
    /// waits on wall-clock).
    #[test]
    fn a_parked_rearm_blocks_neither_docs_snapshot_nor_leaks_the_latch() {
        let t = TempTree::new("parked-rearm");
        t.write("docs/a.md", "# a");

        let (ctl_tx, ctl_rx) = mpsc::channel::<WatchCtl>();
        let (entered_tx, entered_rx) = mpsc::channel::<()>();
        let (release_tx, release_rx) = mpsc::channel::<()>();
        std::thread::spawn(move || {
            for msg in ctl_rx {
                if let WatchCtl::Rearm { ack, .. } = msg {
                    entered_tx.send(()).expect("report the rendezvous");
                    release_rx.recv().expect("wait for the release");
                    ack.send(Ok(())).expect("ack the re-arm");
                }
            }
        });
        let state = Arc::new(WatchState::new(None, Arc::new(AtomicU64::new(0)), ctl_tx));

        let flight = state.begin_pick().expect("picker free");
        let apply_state = state.clone();
        let root = t.root().to_path_buf();
        let apply =
            std::thread::spawn(move || apply_picked_folder(&apply_state, &root, flight));

        // The pick is provably parked inside the rendezvous now.
        entered_rx
            .recv_timeout(Duration::from_secs(10))
            .expect("apply must reach the re-arm rendezvous");

        // In flight: a second claim is refused (what the command maps to
        // the typed Busy)...
        assert!(
            state.begin_pick().is_none(),
            "picker must be busy during the re-arm"
        );

        // ...and the T-021 point: project_status (the docs_snapshot
        // command body) must NOT block behind the parked re-arm. Run it
        // on a helper thread so a regression fails loudly instead of
        // hanging the suite.
        let status_state = state.clone();
        let (status_tx, status_rx) = mpsc::channel();
        std::thread::spawn(move || {
            let status = project_status(&status_state);
            let _ = status_tx.send(matches!(status, ProjectStatus::NoProject));
        });
        let no_project_still = status_rx
            .recv_timeout(Duration::from_secs(5))
            .expect("docs_snapshot must answer while a re-arm is parked (pre-T-021 it blocked here)");
        assert!(
            no_project_still,
            "nothing may be committed before the re-arm acks"
        );

        // Release the rendezvous: the pick commits and completes.
        release_tx.send(()).expect("release the parked re-arm");
        match apply.join().expect("apply thread") {
            PickOutcome::Picked { snapshot } => assert_eq!(snapshot.files.len(), 1),
            other => panic!("expected Picked, got {other:?}"),
        }
        assert_eq!(
            state.project_dir(),
            Some(t.root().canonicalize().expect("canonical root")),
            "commit lands exactly once, after the ack"
        );
        assert!(
            state.begin_pick().is_some(),
            "the latch must be free again after the pick completes"
        );
    }

    /// A watcher thread that dies holding the re-arm ack produces the
    /// honest typed error INSTANTLY (disconnect, not the 10s timeout
    /// lie the T-007 verifier noted), mutates nothing, and releases the
    /// latch.
    #[test]
    fn a_dropped_rearm_ack_reports_disconnect_mutates_nothing_frees_latch() {
        let t = TempTree::new("dead-ack");
        t.write("docs/a.md", "# a");

        let (ctl_tx, ctl_rx) = mpsc::channel::<WatchCtl>();
        std::thread::spawn(move || {
            for msg in ctl_rx {
                if let WatchCtl::Rearm { ack, .. } = msg {
                    drop(ack); // die mid-re-arm without answering
                }
            }
        });
        let state = WatchState::new(None, Arc::new(AtomicU64::new(0)), ctl_tx);

        match apply_pick(&state, t.root()) {
            PickOutcome::Error { path, message } => {
                assert_eq!(path, t.root().canonicalize().expect("canon").display().to_string());
                assert!(
                    message.contains("dropped the re-arm ack"),
                    "a dead ack is a disconnect, not a timeout: {message}"
                );
            }
            other => panic!("expected Error, got {other:?}"),
        }
        assert!(state.project_dir().is_none(), "nothing mutated");
        assert!(
            state.begin_pick().is_some(),
            "the latch must be free after the failed pick"
        );
    }

    // ---- T-018: the collector reports skips + truncation ---------------

    fn skip_of(outcome: &CollectOutcome, path: &str) -> Option<SkipReason> {
        outcome
            .skipped
            .iter()
            .find(|s| s.path == path)
            .map(|s| s.reason)
    }

    #[test]
    fn skips_carry_paths_and_reasons_for_oversize_and_non_utf8() {
        let t = TempTree::new("skip-report");
        t.write("docs/ok.md", "fine");
        t.write("docs/architecture/graph.json", "{}");
        let big = "x".repeat((MAX_FILE_BYTES + 1) as usize);
        t.write("docs/big.md", &big);
        t.write("docs/architecture/huge.json", &big);
        fs::write(t.root().join("docs/binary.md"), [0xFFu8, 0xFE, 0x00, 0x9C]).expect("bin");

        let outcome = collect_docs_tree(t.root());
        let paths: Vec<&str> = outcome.files.iter().map(|f| f.path.as_str()).collect();
        // Skips never subtract readable files (additive-only).
        assert_eq!(paths, vec!["docs/architecture/graph.json", "docs/ok.md"]);
        assert_eq!(skip_of(&outcome, "docs/big.md"), Some(SkipReason::Oversize));
        assert_eq!(
            skip_of(&outcome, "docs/architecture/huge.json"),
            Some(SkipReason::Oversize)
        );
        assert_eq!(skip_of(&outcome, "docs/binary.md"), Some(SkipReason::NonUtf8));
        assert_eq!(outcome.skipped_total, 3);
        assert!(!outcome.truncated); // skips alone never claim truncation
        // Sorted by path — outcomes are comparable.
        let mut sorted = outcome.skipped.clone();
        sorted.sort_by(|a, b| a.path.cmp(&b.path));
        assert_eq!(outcome.skipped, sorted);
    }

    #[test]
    fn skips_report_only_would_be_collected_files() {
        let t = TempTree::new("skip-eligible");
        t.write("docs/ok.md", "fine");
        let big = "x".repeat((MAX_FILE_BYTES + 1) as usize);
        // Oversized files OUTSIDE the collected set: never reported.
        t.write("docs/notes.txt", &big);
        t.write("docs/tasks/data.json", &big); // .json outside architecture/
        let outcome = collect_docs_tree(t.root());
        assert_eq!(outcome.skipped, vec![]);
        assert_eq!(outcome.skipped_total, 0);
        assert_eq!(outcome.files.len(), 1);
    }

    #[cfg(unix)]
    #[test]
    fn symlinks_stay_silent_in_the_skip_report() {
        // The T-003-s3 question settled: a symlink is an ADR-010 security
        // refusal, not a telemetry gap — reporting it would hand a
        // hostile repo a path-disclosure channel.
        use std::os::unix::fs::symlink;
        let t = TempTree::new("skip-symlink");
        t.write("docs/real.md", "real");
        let outside = TempTree::new("skip-symlink-outside");
        outside.write("secret.md", "secret");
        symlink(outside.root().join("secret.md"), t.root().join("docs/link.md"))
            .expect("symlink");
        let outcome = collect_docs_tree(t.root());
        assert_eq!(outcome.skipped, vec![]);
        assert_eq!(outcome.skipped_total, 0);
        assert_eq!(outcome.files.len(), 1);
    }

    #[test]
    fn too_deep_directory_is_reported_once_for_the_dir() {
        let t = TempTree::new("skip-depth");
        t.write("docs/top.md", "top");
        // MAX_DEPTH child dirs under docs/ stay collectable; one more is
        // past the cap and reported as a directory skip.
        let mut inside = String::from("docs");
        for i in 0..MAX_DEPTH {
            inside.push_str(&format!("/d{i}"));
        }
        t.write(&format!("{inside}/deepest-ok.md"), "still in");
        let beyond = format!("{inside}/d-too-far");
        fs::create_dir_all(t.root().join(&beyond)).expect("mk deep");
        t.write(&format!("{beyond}/lost.md"), "past the cap");

        let outcome = collect_docs_tree(t.root());
        assert!(outcome.files.iter().any(|f| f.path.ends_with("deepest-ok.md")));
        assert!(outcome.files.iter().all(|f| !f.path.ends_with("lost.md")));
        assert_eq!(skip_of(&outcome, &beyond), Some(SkipReason::TooDeep));
        // Once, for the dir — not per buried file.
        assert_eq!(outcome.skipped.len(), 1);
        assert_eq!(outcome.skipped_total, 1);
    }

    #[test]
    fn file_cap_truncates_deterministically_flags_and_counts() {
        let t = TempTree::new("skip-cap");
        // MAX_FILES readable files plus a clipped-report worth of overflow:
        // enough to exercise cap membership, the flag, the report clip,
        // and the honest total in one (deliberately large) tree.
        let overflow = MAX_SKIPPED_REPORTED + 7;
        for i in 0..(MAX_FILES + overflow) {
            t.write(&format!("docs/tasks/f-{i:05}.md"), "x");
        }
        let outcome = collect_docs_tree(t.root());
        assert_eq!(outcome.files.len(), MAX_FILES);
        assert!(outcome.truncated);
        // Deterministic membership: the first MAX_FILES paths in sorted
        // order ride; the alphabetical tail is skipped as FileCap.
        assert_eq!(outcome.files[0].path, "docs/tasks/f-00000.md");
        assert_eq!(
            outcome.files.last().map(|f| f.path.as_str()),
            Some(format!("docs/tasks/f-{:05}.md", MAX_FILES - 1).as_str())
        );
        assert!(outcome
            .skipped
            .iter()
            .all(|s| s.reason == SkipReason::FileCap));
        assert_eq!(
            outcome.skipped.first().map(|s| s.path.as_str()),
            Some(format!("docs/tasks/f-{:05}.md", MAX_FILES).as_str())
        );
        // The report clips; the total stays honest.
        assert_eq!(outcome.skipped.len(), MAX_SKIPPED_REPORTED);
        assert_eq!(outcome.skipped_total, overflow);
        // Same tree, same outcome — collect twice and compare whole.
        assert_eq!(outcome, collect_docs_tree(t.root()));
        // The T-003-shaped view still exists and matches.
        assert_eq!(collect_docs_files(t.root()), outcome.files);
    }

    #[test]
    fn outcome_equality_is_the_suppression_baseline_including_skips() {
        let t = TempTree::new("skip-equality");
        t.write("docs/a.md", "a");
        let first = collect_docs_tree(t.root());
        assert_eq!(first, collect_docs_tree(t.root()));
        // A NEW oversized file changes no collected file, but the outcome
        // must differ — otherwise the frontend never learns of the skip.
        let big = "x".repeat((MAX_FILE_BYTES + 1) as usize);
        t.write("docs/b.md", &big);
        let second = collect_docs_tree(t.root());
        assert_eq!(first.files, second.files);
        assert_ne!(first, second);
    }

    // ---- T-018: skips ride the live snapshot ---------------------------

    #[test]
    fn a_file_crossing_the_size_line_emits_with_a_skip_not_a_silent_deletion() {
        let t = TempTree::new("live-skip");
        t.write("docs/a.md", "a stays");
        t.write("docs/b.md", "b starts small");
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_pick(&state, t.root()),
            PickOutcome::Picked { .. }
        ));

        // b grows past the cap: files lose it, the skip report says why.
        let big = "y".repeat((MAX_FILE_BYTES + 1) as usize);
        t.write("docs/b.md", &big);
        let emit = recv_emit(&emits);
        assert_eq!(
            emit.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
            vec!["docs/a.md"]
        );
        assert_eq!(
            emit.skipped,
            vec![SkippedFile { path: "docs/b.md".into(), reason: SkipReason::Oversize }]
        );
        assert_eq!(emit.skipped_total, 1);
        assert!(!emit.truncated);

        // b shrinks back: collected again, skip report clears.
        t.write("docs/b.md", "b is back");
        let back = recv_emit(&emits);
        assert!(back.files.iter().any(|f| f.content == "b is back"));
        assert_eq!(back.skipped, vec![]);
        assert_eq!(back.skipped_total, 0);
    }

    // ---- T-018: root sentinel — docs/ appears, is replaced, returns ----

    /// Wait out at least one debounce round so racy arm windows settle.
    fn settle() {
        std::thread::sleep(DEBOUNCE * 4);
    }

    #[test]
    fn docs_created_after_a_docsless_startup_arms_and_emits() {
        // T-003-s1 case 1: launch resolves a repo with no docs/ at all.
        let t = TempTree::new("sentinel-late");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        let (_state, emits) = live_state(Some(t.root().to_path_buf()));
        settle(); // let the startup (failed) arm + sentinel arm land

        // docs/ appears with content. The sentinel's batch re-arms the
        // docs watch and this same batch ships the tree.
        t.write("docs/tasks/T-400-late.md", "born late v1");
        let emit = loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content.contains("born late")) {
                break emit;
            }
        };
        assert_eq!(emit.files[0].path, "docs/tasks/T-400-late.md");

        // And the re-armed watch is LIVE: an in-place edit emits too.
        t.write("docs/tasks/T-400-late.md", "born late v2");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "born late v2") {
                break;
            }
        }
    }

    #[test]
    fn docs_replaced_wholesale_rearms_and_sees_in_place_edits() {
        // T-003-s1 case 2, the stale-handle death: notify keeps watching
        // the moved-away inode, so pre-T-018 in-place edits inside the
        // REPLACEMENT tree never produced events again.
        let t = TempTree::new("sentinel-replace");
        t.write("docs/tasks/T-401-a.md", "original tree");
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_pick(&state, t.root()),
            PickOutcome::Picked { .. }
        ));

        // Build the replacement OUTSIDE docs/, then swap wholesale.
        t.write("docs-next/tasks/T-401-a.md", "replacement tree");
        fs::rename(t.root().join("docs"), t.root().join("docs-old")).expect("mv away");
        fs::rename(t.root().join("docs-next"), t.root().join("docs")).expect("mv in");

        // The swap itself emits the replacement's content...
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "replacement tree") {
                break;
            }
        }
        // ...and — the criterion — the watch is genuinely re-armed: an
        // in-place edit inside the NEW tree still produces an emit.
        settle();
        t.write("docs/tasks/T-401-a.md", "edited in place after swap");
        loop {
            let emit = recv_emit(&emits);
            if emit
                .files
                .iter()
                .any(|f| f.content == "edited in place after swap")
            {
                break;
            }
        }
    }

    #[test]
    fn docs_deleted_emits_empty_then_recreated_emits_again() {
        let t = TempTree::new("sentinel-return");
        t.write("docs/tasks/T-402-r.md", "here v1");
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_pick(&state, t.root()),
            PickOutcome::Picked { .. }
        ));

        // Deletion semantics unchanged: the empty tree ships.
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.is_empty() {
                break;
            }
        }
        // Recovery armed: recreating docs/ re-arms and emits — no
        // restart, no re-pick (pre-T-018 this silence was permanent).
        settle();
        t.write("docs/tasks/T-402-r.md", "here again");
        let emit = loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "here again") {
                break emit;
            }
        };
        assert_eq!(emit.files.len(), 1);

        // And the fresh watch is live for ordinary edits.
        t.write("docs/tasks/T-402-r.md", "here again v2");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "here again v2") {
                break;
            }
        }
    }

    // ---- T-018: additive-only — telemetry is never a failure mode ------

    #[test]
    fn a_dead_sentinel_leaves_the_existing_watch_fully_working() {
        use notify_debouncer_mini::DebouncedEventKind;
        // Drive the batch handler directly with a target whose sentinel
        // arm FAILED (sentinel: None) — collection, suppression, and
        // emits must behave exactly as pre-T-018.
        let t = TempTree::new("sentinel-dead");
        t.write("docs/a.md", "v1");
        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        rearm(&mut debouncer, &mut target, t.root().to_path_buf()).expect("arm");
        // Simulate the sentinel having failed to arm.
        if let Some(s) = target.sentinel.take() {
            let _ = debouncer.watcher().unwatch(&s);
        }

        let seq = AtomicU64::new(0);
        let (tx, rx) = mpsc::channel::<DocsSnapshot>();
        let sink = move |snap: &DocsSnapshot| {
            let _ = tx.send(snap.clone());
        };
        let batch = vec![DebouncedEvent::new(
            t.root().join("docs/a.md"),
            DebouncedEventKind::Any,
        )];

        // Unchanged content: suppressed, exactly as before.
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        assert!(rx.try_recv().is_err());

        // Changed content: emits, skips empty, no truncation claimed.
        t.write("docs/a.md", "v2");
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        let emit = rx.recv_timeout(Duration::from_secs(5)).expect("emit");
        assert!(emit.files.iter().any(|f| f.content == "v2"));
        assert_eq!(emit.skipped, vec![]);
        assert!(!emit.truncated);
    }

    #[test]
    fn a_vanished_root_never_panics_the_batch_handler() {
        use notify_debouncer_mini::DebouncedEventKind;
        let t = TempTree::new("root-gone");
        t.write("docs/a.md", "v1");
        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        rearm(&mut debouncer, &mut target, t.root().to_path_buf()).expect("arm");

        let seq = AtomicU64::new(0);
        let (tx, rx) = mpsc::channel::<DocsSnapshot>();
        let sink = move |snap: &DocsSnapshot| {
            let _ = tx.send(snap.clone());
        };
        let batch = vec![DebouncedEvent::new(
            t.root().join("docs/a.md"),
            DebouncedEventKind::Any,
        )];

        // The whole project vanishes: the sentinel check and collect both
        // degrade — an empty tree emits (deletion semantics), no panic.
        fs::remove_dir_all(t.root()).expect("rm root");
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        let emit = rx.recv_timeout(Duration::from_secs(5)).expect("empty emit");
        assert!(emit.files.is_empty());
        // A second batch on the same dead root: suppressed, still alive.
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        assert!(rx.try_recv().is_err());
    }

    // ---- T-026: genesis entry ------------------------------------------

    /// The genesis pick, minus the dialog — the exact command-layer call
    /// with the single-flight guard claimed first (the `apply_pick`
    /// pattern; sequential tests are never in flight).
    fn apply_genesis_pick(state: &WatchState, picked: &Path) -> PickOutcome {
        apply_genesis_folder(state, picked, state.begin_pick().expect("picker free"))
    }

    /// A scratch tree with no docs/ at all — what a genesis folder looks
    /// like before the interview runs.
    fn bare_tree(tag: &str) -> TempTree {
        let t = TempTree::new(tag);
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        t
    }

    #[test]
    fn plan_probe_measures_each_looked_for_path_and_gates_on_roadmap_or_tasks() {
        // Criterion 5's predicate, and the front-door checklist's marks.
        let t = bare_tree("probe");
        assert_eq!(probe_plan(t.root()), PlanProbe::default());
        assert!(!probe_plan(t.root()).has_plan());

        // An empty docs/ is not a plan (nor is ARCHITECTURE.md alone) —
        // both are genesis-eligible states.
        fs::create_dir_all(t.root().join("docs")).expect("mkdir docs");
        assert!(!probe_plan(t.root()).has_plan());
        t.write("docs/ARCHITECTURE.md", "# arch");
        let probe = probe_plan(t.root());
        assert!(probe.architecture && !probe.has_plan());

        // .git counts as a file (worktrees) exactly like T-007's walk-up.
        fs::write(t.root().join(".git"), "gitdir: elsewhere").expect("git file");
        assert!(probe_plan(t.root()).git);

        // Either half of the plan predicate is enough, on its own.
        t.write("docs/tasks/T-001-x.md", "task");
        assert!(probe_plan(t.root()).tasks && probe_plan(t.root()).has_plan());
        fs::remove_dir_all(t.root().join("docs/tasks")).expect("rm tasks");
        assert!(!probe_plan(t.root()).has_plan());
        t.write("docs/ROADMAP.md", "# roadmap");
        assert!(probe_plan(t.root()).roadmap && probe_plan(t.root()).has_plan());

        // A non-.md file in docs/tasks/ is not a task file.
        fs::remove_file(t.root().join("docs/ROADMAP.md")).expect("rm roadmap");
        t.write("docs/tasks/notes.txt", "not a task");
        assert!(!probe_plan(t.root()).has_plan());
    }

    #[test]
    fn genesis_pick_opens_a_docsless_folder_and_arms_the_root_sentinel() {
        // Criterion 2: the zero-argument picker variant's pipeline.
        let t = bare_tree("genesis-open");
        let (state, _emits) = live_state(None);
        let outcome = apply_genesis_pick(&state, t.root());
        let canon = t.root().canonicalize().expect("canon");
        match outcome {
            PickOutcome::Genesis {
                project_dir,
                seq,
                probe,
                snapshot,
            } => {
                assert_eq!(project_dir, canon.display().to_string());
                assert!(seq >= 1, "the switch carries an ordering stamp");
                assert_eq!(probe, PlanProbe::default());
                // T-042 criterion 1, the OTHER direction: this folder
                // really has no docs/, so there is nothing to snapshot
                // and the switch must not invent one.
                assert!(
                    snapshot.is_none(),
                    "a docs-less genesis switch carries no tree"
                );
            }
            other => panic!("expected Genesis, got {other:?}"),
        }
        // Committed: the genesis folder IS the open project now...
        assert_eq!(state.project_dir(), Some(canon.clone()));
        // ...and it is still docs-less, so the ordinary status call says
        // so rather than pretending there is a board.
        assert!(matches!(
            project_status(&state),
            ProjectStatus::NoDocs { .. }
        ));
    }

    #[test]
    fn genesis_pick_of_a_folder_that_already_has_a_plan_opens_it_as_a_project() {
        // Criterion 5: genesis is NOT offered — and the routing is the
        // ordinary open, outcome for outcome. No overwrite path exists.
        for (tag, plan_file) in [
            ("genesis-roadmap", "docs/ROADMAP.md"),
            ("genesis-tasks", "docs/tasks/T-500-x.md"),
        ] {
            let t = TempTree::new(tag);
            t.write(plan_file, "the plan is already here");
            let (state, _emits) = live_state(None);
            match apply_genesis_pick(&state, t.root()) {
                PickOutcome::Picked { snapshot } => {
                    assert_eq!(
                        snapshot.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
                        vec![plan_file]
                    );
                }
                other => panic!("expected the normal open for {plan_file}, got {other:?}"),
            }
            assert_eq!(
                state.project_dir(),
                Some(t.root().canonicalize().expect("canon"))
            );
        }
    }

    #[test]
    fn an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition() {
        // Criterion 4 (T-018-s4), driven through the batch-handler seam so
        // the counts are exact — no sleeps, no debounce luck.
        use notify_debouncer_mini::DebouncedEventKind;
        let t = bare_tree("s4-empty-docs");
        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        arm_genesis(&mut debouncer, &mut target, t.root().to_path_buf()).expect("genesis arm");
        assert!(target.docs.is_none(), "nothing to watch recursively yet");
        assert_eq!(target.sentinel.as_deref(), Some(t.root()));

        let seq = AtomicU64::new(0);
        let (tx, rx) = mpsc::channel::<DocsSnapshot>();
        let sink = move |snap: &DocsSnapshot| {
            let _ = tx.send(snap.clone());
        };
        let batch = vec![DebouncedEvent::new(
            t.root().join("docs"),
            DebouncedEventKind::Any,
        )];

        // Root churn BEFORE docs/ exists: nothing to arm, nothing to say.
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        assert!(rx.try_recv().is_err());

        // docs/ appears EMPTY: the collected outcome is byte-for-byte the
        // baseline, and pre-T-026 that meant silence — the front door kept
        // claiming "no docs/ found" over a directory that exists.
        fs::create_dir(t.root().join("docs")).expect("mkdir docs");
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        let emit = rx
            .recv_timeout(Duration::from_secs(5))
            .expect("the arm transition must emit exactly once");
        assert!(emit.files.is_empty(), "the empty board, rendered live");
        assert_eq!(emit.skipped_total, 0);
        assert!(!emit.truncated);
        assert!(target.docs.is_some(), "the docs watch is armed now");
        assert_eq!(target.last, CollectOutcome::default());

        // EXACTLY once: every further batch over the unchanged empty tree
        // is suppressed — the invariant holds for every other batch.
        for _ in 0..5 {
            handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        }
        assert!(
            rx.try_recv().is_err(),
            "only the transition emits; equality suppression is intact"
        );

        // And the pipeline is genuinely live: real content still emits.
        t.write("docs/ROADMAP.md", "# plan");
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        let emit = rx.recv_timeout(Duration::from_secs(5)).expect("content emit");
        assert_eq!(
            emit.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
            vec!["docs/ROADMAP.md"]
        );
        // ...and settles back into silence.
        handle_fs_batch(&mut debouncer, &mut target, &seq, &batch, &sink);
        assert!(rx.try_recv().is_err());
    }

    #[test]
    fn a_deleted_empty_docs_emits_on_the_armed_to_unarmed_transition() {
        // T-042 CRITERION 2 (T-026-s5), the mirror of the test above, and
        // the verifier's five-step sequence with exact counts. Criterion 4
        // of T-026 made the appear direction emit and thereby made this
        // state reachable: before it, an empty docs/ never produced a
        // board to go stale. Driven through T-018's batch seam — exact
        // counts, no sleeps, no debounce luck.
        use notify_debouncer_mini::DebouncedEventKind;
        let t = bare_tree("s5-deleted-empty-docs");
        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        arm_genesis(&mut debouncer, &mut target, t.root().to_path_buf()).expect("genesis arm");

        let seq = AtomicU64::new(0);
        let (tx, rx) = mpsc::channel::<DocsSnapshot>();
        let sink = move |snap: &DocsSnapshot| {
            let _ = tx.send(snap.clone());
        };
        let batch = vec![DebouncedEvent::new(
            t.root().join("docs"),
            DebouncedEventKind::Any,
        )];
        // Every emit this sequence produces, counted rather than sampled.
        let drain = |debouncer: &mut Debouncer<_>, target: &mut WatchTarget| -> Vec<DocsSnapshot> {
            handle_fs_batch(debouncer, target, &seq, &batch, &sink);
            let mut got = Vec::new();
            while let Ok(snap) = rx.try_recv() {
                got.push(snap);
            }
            got
        };

        // 1. appears -> exactly 1 (T-026 criterion 4, unchanged).
        fs::create_dir(t.root().join("docs")).expect("mkdir docs");
        let emits = drain(&mut debouncer, &mut target);
        assert_eq!(emits.len(), 1, "the arm transition emits exactly once");
        assert!(emits[0].files.is_empty());
        assert!(target.docs.is_some(), "armed");

        // 2. next batch -> 0.
        assert_eq!(drain(&mut debouncer, &mut target).len(), 0, "then silence");

        // 3. DELETED (while still empty) -> emits. THE FIX: the collected
        //    tree is byte-for-byte the baseline it has been all along, so
        //    the ONLY news is the watch state, and before T-042 this batch
        //    was silent and the empty board outlived its docs/.
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        let emits = drain(&mut debouncer, &mut target);
        assert_eq!(
            emits.len(),
            1,
            "the disarm transition is news the tree cannot carry"
        );
        assert!(emits[0].files.is_empty(), "and the tree it ships is empty");
        assert!(target.docs.is_none(), "the stale handle was dropped");

        // 3b. and it fires ONCE, not per batch, while docs/ stays gone.
        for _ in 0..5 {
            assert_eq!(
                drain(&mut debouncer, &mut target).len(),
                0,
                "one transition, one emit"
            );
        }

        // 4. recreated -> exactly 1 (the second arming).
        fs::create_dir(t.root().join("docs")).expect("mkdir docs again");
        assert_eq!(
            drain(&mut debouncer, &mut target).len(),
            1,
            "the second arming emits once"
        );

        // 5. next batch -> 0.
        assert_eq!(drain(&mut debouncer, &mut target).len(), 0);

        // The pipeline is still genuinely live through all of it.
        t.write("docs/NORTH_STAR.md", "# after the round trip");
        let emits = drain(&mut debouncer, &mut target);
        assert_eq!(emits.len(), 1);
        assert_eq!(emits[0].files.len(), 1);
        assert_eq!(drain(&mut debouncer, &mut target).len(), 0);

        // The mirror of step 3 for a NON-empty docs/: deleting it is a
        // transition AND a content change, and it is still ONE emit — the
        // rule adds a reason to emit, never a second emit.
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs with a file");
        let emits = drain(&mut debouncer, &mut target);
        assert_eq!(emits.len(), 1, "transition + content change is still one");
        assert!(emits[0].files.is_empty(), "deletion semantics unchanged");
    }

    #[test]
    fn the_suppression_invariant_stays_exactly_as_narrow_as_it_was() {
        // T-042 criterion 2's second clause, as a POSITIVE assertion: with
        // the watch armed and staying armed, the emit count over a long
        // batch sequence equals the number of CONTENT CHANGES exactly —
        // not "no failures", a counted number. This is what would break if
        // the new transition rule had widened into "ensure_docs_watch did
        // something" or "a batch arrived".
        use notify_debouncer_mini::DebouncedEventKind;
        let t = TempTree::new("suppression-narrow"); // docs/ exists throughout
        t.write("docs/a.md", "v1");
        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        rearm(&mut debouncer, &mut target, t.root().to_path_buf()).expect("arm");

        let seq = AtomicU64::new(0);
        let (tx, rx) = mpsc::channel::<DocsSnapshot>();
        let sink = move |snap: &DocsSnapshot| {
            let _ = tx.send(snap.clone());
        };
        let batch = vec![DebouncedEvent::new(
            t.root().join("docs/a.md"),
            DebouncedEventKind::Any,
        )];
        let run = |debouncer: &mut Debouncer<_>, target: &mut WatchTarget| -> usize {
            handle_fs_batch(debouncer, target, &seq, &batch, &sink);
            let mut n = 0usize;
            while rx.try_recv().is_ok() {
                n += 1;
            }
            n
        };
        let mut emitted = 0usize;

        // 20 batches over an unchanged tree: zero.
        for _ in 0..20 {
            emitted += run(&mut debouncer, &mut target);
        }
        assert_eq!(emitted, 0, "an unchanged tree never emits, ever");

        // Three real content changes, each with quiet batches around it.
        for (i, content) in ["v2", "v3", "v4"].iter().enumerate() {
            t.write("docs/a.md", content);
            emitted += run(&mut debouncer, &mut target);
            assert_eq!(emitted, i + 1, "one emit per content change, exactly");
            for _ in 0..5 {
                emitted += run(&mut debouncer, &mut target);
            }
            assert_eq!(emitted, i + 1, "and the quiet batches stay quiet");
        }
        assert_eq!(emitted, 3);

        // A WHOLESALE REPLACEMENT of docs/ with identical content: the
        // watch is re-armed onto a NEW inode (armed -> armed), which is
        // NOT a watch-state transition, so equality still suppresses it.
        // The tree diff is the news for a replacement; the rule stayed
        // about the armed STATE and did not widen to "we re-armed".
        let armed_before = target.docs_id;
        let stage = t.root().join("docs-next");
        fs::create_dir_all(&stage).expect("stage");
        fs::write(stage.join("a.md"), "v4").expect("same bytes");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        fs::rename(&stage, t.root().join("docs")).expect("swap in");
        emitted += run(&mut debouncer, &mut target);
        assert_eq!(emitted, 3, "a replacement with equal content is silent");
        assert!(target.docs.is_some(), "and the watch is armed on the new one");
        #[cfg(unix)]
        assert_ne!(target.docs_id, armed_before, "provably a different inode");
        #[cfg(not(unix))]
        let _ = armed_before;
    }

    #[test]
    fn docs_appearing_under_a_genesis_project_lights_the_pipeline_with_no_repick() {
        // Criterion 3, end to end from THIS task's flow: a real watcher
        // thread, armed by the genesis pick, sees the interview's first
        // write with no second trip through the picker.
        let t = bare_tree("genesis-lights-up");
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_genesis_pick(&state, t.root()),
            PickOutcome::Genesis { .. }
        ));
        settle(); // let the sentinel arm land

        // The interview writes its first artifact.
        t.write("docs/NORTH_STAR.md", "# the point of this project");
        let emit = loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content.contains("the point")) {
                break emit;
            }
        };
        assert_eq!(emit.files[0].path, "docs/NORTH_STAR.md");
        assert_eq!(
            emit.project_dir,
            t.root().canonicalize().expect("canon").display().to_string()
        );

        // The re-armed watch is LIVE for ordinary edits after that.
        t.write("docs/NORTH_STAR.md", "# the point, revised");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content.contains("revised")) {
                break;
            }
        }
    }

    #[test]
    fn a_failed_genesis_pick_leaves_the_open_project_untouched() {
        // Criterion 6 (PickOutcome discipline) for the genesis variant.
        let open = TempTree::new("genesis-keeps-open");
        open.write("docs/ROADMAP.md", "v1");
        let (state, emits) = live_state(None);
        assert!(matches!(
            apply_pick(&state, open.root()),
            PickOutcome::Picked { .. }
        ));
        let committed = state.project_dir();

        // (a) the folder vanished between dialog and apply.
        let gone = open.root().join("never-existed");
        assert!(matches!(
            apply_genesis_pick(&state, &gone),
            PickOutcome::Error { .. }
        ));
        assert_eq!(state.project_dir(), committed);

        // (b) the chosen path is a FILE, not a directory.
        let file = open.root().join("not-a-dir");
        fs::write(&file, "just a file").expect("write");
        assert!(matches!(
            apply_genesis_pick(&state, &file),
            PickOutcome::Error { .. }
        ));
        assert_eq!(state.project_dir(), committed);

        // The open project's watch never noticed any of it.
        open.write("docs/ROADMAP.md", "v2");
        let emit = loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content == "v2") {
                break emit;
            }
        };
        assert_eq!(
            emit.project_dir,
            open.root().canonicalize().expect("canon").display().to_string()
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time() {
        // The T-003 rule family applied to the ROOT: the arm-time gate is
        // the one that matters (validation happened a moment earlier), so
        // drive it directly — a symlinked root never becomes a project.
        use std::os::unix::fs::symlink;
        let open = TempTree::new("genesis-symlink-open");
        open.write("docs/ROADMAP.md", "real project");
        let outside = bare_tree("genesis-symlink-outside");
        let link_home = bare_tree("genesis-symlink-home");
        let link = link_home.root().join("linked-root");
        symlink(outside.root(), &link).expect("symlink");

        let mut debouncer =
            new_debouncer(DEBOUNCE, |_res: DebounceEventResult| {}).expect("debouncer");
        let mut target = WatchTarget {
            root: None,
            docs: None,
            docs_id: None,
            sentinel: None,
            last: CollectOutcome::default(),
        };
        rearm(&mut debouncer, &mut target, open.root().to_path_buf()).expect("arm the real one");
        let armed_docs = target.docs.clone();

        let err = arm_genesis(&mut debouncer, &mut target, link.clone())
            .expect_err("a symlinked root must be refused");
        assert!(err.contains("not a plain directory"), "got: {err}");
        // The previously open project keeps its watch, untouched.
        assert_eq!(target.docs, armed_docs);
        assert_eq!(target.root.as_deref(), Some(open.root()));
    }

    #[test]
    fn start_genesis_here_targets_the_folder_the_front_door_named() {
        // The zero-argument "Start an interview here": Rust remembers the
        // user's own rejected dialog choice; the webview names nothing.
        let open = TempTree::new("here-open");
        open.write("docs/ROADMAP.md", "an open project");
        let bare = bare_tree("here-bare");
        let (state, _emits) = live_state(None);

        // Nothing chosen and no project: nothing to point at.
        assert_eq!(state.genesis_target(), None);

        assert!(matches!(
            apply_pick(&state, open.root()),
            PickOutcome::Picked { .. }
        ));
        // With a project open and no rejection pending, "here" is the
        // open project (the launch-resolved-repo case).
        assert_eq!(
            state.genesis_target(),
            Some(open.root().canonicalize().expect("canon"))
        );

        // The user picks a folder with no docs/: refused, remembered.
        let refused = apply_pick(&state, bare.root());
        assert!(matches!(refused, PickOutcome::NoDocs { .. }));
        let bare_canon = bare.root().canonicalize().expect("canon");
        assert_eq!(state.genesis_target(), Some(bare_canon.clone()));

        // "Start an interview here" opens exactly that folder...
        let target = state.genesis_target().expect("a target");
        match apply_genesis_pick(&state, &target) {
            PickOutcome::Genesis { project_dir, .. } => {
                assert_eq!(project_dir, bare_canon.display().to_string());
            }
            other => panic!("expected Genesis, got {other:?}"),
        }
        // ...and the candidate is spent: it is the open project now.
        assert_eq!(state.project_dir(), Some(bare_canon.clone()));
        assert_eq!(state.genesis_target(), Some(bare_canon));
    }

    #[test]
    fn a_genesis_folder_that_already_has_an_empty_docs_dir_arms_the_docs_watch() {
        // The in-between state: no plan (genesis-eligible) but docs/ is
        // already there — the ordinary arm, so the board is live from the
        // first file with no arm-transition emit needed.
        let t = TempTree::new("genesis-with-empty-docs"); // TempTree makes docs/
        let (state, emits) = live_state(None);
        match apply_genesis_pick(&state, t.root()) {
            PickOutcome::Genesis {
                probe, snapshot, ..
            } => {
                assert!(!probe.has_plan());
                // T-042 criterion 1: docs/ is armed, so a tree rides — an
                // EMPTY one. "nothing is written here" becomes a
                // MEASUREMENT the switch carried rather than an
                // assumption the screen made, which is the same ○/✓
                // discipline T-026 applied to the front-door checklist.
                let snap = snapshot.expect("an armed docs/ carries its tree, empty or not");
                assert!(snap.files.is_empty(), "the tree is empty, and says so");
            }
            other => panic!("expected Genesis, got {other:?}"),
        }
        t.write("docs/NORTH_STAR.md", "written into an existing docs/");
        loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.path == "docs/NORTH_STAR.md") {
                break;
            }
        }
    }

    #[test]
    fn a_genesis_switch_onto_a_folder_whose_docs_holds_files_carries_that_tree() {
        // T-042 CRITERION 1, on the T-026 verifier's own repro. A folder
        // with docs/ARCHITECTURE.md + docs/decisions/001-x.md is
        // genesis-ELIGIBLE (no ROADMAP, no tasks/), and before this task
        // the switch carried nothing at all: the pane rendered
        // "docs/ · nothing written yet" over a docs/ that is not empty,
        // two clicks after the card truthfully showed
        // "✓ docs/ARCHITECTURE.md". The watch was armed the whole time —
        // which is exactly why nothing ever emitted: nothing CHANGED.
        let t = TempTree::new("genesis-existing-docs");
        t.write("docs/ARCHITECTURE.md", "# the shape of the thing");
        t.write("docs/decisions/001-x.md", "# 001 - x");
        let (state, emits) = live_state(None);
        let canon = t.root().canonicalize().expect("canon");

        let (seq, snapshot) = match apply_genesis_pick(&state, t.root()) {
            PickOutcome::Genesis {
                probe,
                seq,
                snapshot,
                ..
            } => {
                // The verifier's shape, verbatim: architecture found, no
                // plan, so genesis is still what this folder gets.
                assert!(probe.architecture, "the probe sees ARCHITECTURE.md");
                assert!(!probe.has_plan(), "and it is still not a plan");
                (seq, snapshot.expect("THE FIX: the tree rides the switch"))
            }
            other => panic!("expected Genesis, got {other:?}"),
        };

        // What rides is the real tree, not a token: both files, in path
        // order, with their bytes.
        assert_eq!(
            snapshot
                .files
                .iter()
                .map(|f| f.path.as_str())
                .collect::<Vec<_>>(),
            vec!["docs/ARCHITECTURE.md", "docs/decisions/001-x.md"]
        );
        assert!(snapshot.files[0].content.contains("the shape of the thing"));
        assert_eq!(snapshot.project_dir, canon.display().to_string());
        // ONE stamp for the switch and its tree: the frontend applies the
        // snapshot and advances the stale-drop watermark in one step.
        assert_eq!(snapshot.seq, seq, "the snapshot rides the switch's seq");
        assert!(snapshot.generated_at_ms > 0, "a real collection made it");

        // THE OTHER HALF OF THE REPRO, kept exactly as it was — and it
        // still holds, because it was never the bug. Nothing on disk
        // changed, so nothing emits; what changed is that the truth
        // arrived WITH the switch instead of never.
        settle();
        assert!(
            emits.recv_timeout(Duration::from_millis(1200)).is_err(),
            "an unchanged tree emits nothing - the watch is quiet, not dead"
        );

        // ...and the watch really was armed the whole time: a real edit
        // emits, carrying both files.
        t.write("docs/ARCHITECTURE.md", "# the shape, revised");
        let emit = loop {
            let emit = recv_emit(&emits);
            if emit.files.iter().any(|f| f.content.contains("revised")) {
                break emit;
            }
        };
        assert_eq!(emit.files.len(), 2, "the whole tree, live");
        assert!(emit.seq > seq, "and ordered after the switch");
    }

    #[test]
    fn genesis_and_no_docs_wire_shapes_are_pinned() {
        // The webview reads these tags; pin them like T-021 pinned busy.
        let probe = PlanProbe {
            roadmap: false,
            tasks: false,
            architecture: true,
            git: true,
        };
        let genesis = PickOutcome::Genesis {
            project_dir: "/tmp/sketchpad".into(),
            seq: 7,
            probe,
            snapshot: None,
        };
        assert_eq!(
            serde_json::to_value(&genesis).expect("serialize"),
            serde_json::json!({
                "kind": "genesis",
                "projectDir": "/tmp/sketchpad",
                "seq": 7,
                "probe": {
                    "roadmap": false,
                    "tasks": false,
                    "architecture": true,
                    "git": true
                },
                // T-042: the KEY IS ALWAYS PRESENT — a docs-less switch
                // says "no tree" explicitly rather than by omission, so
                // the webview never has to read absence as a claim.
                "snapshot": serde_json::Value::Null
            })
        );

        // T-042 criterion 1: the docs-bearing switch, pinned in the same
        // place. The snapshot is a whole `DocsSnapshot` at the SWITCH'S
        // OWN seq — that shared stamp is what lets the frontend apply the
        // tree and advance the stale-drop watermark in one step.
        let bearing = PickOutcome::Genesis {
            project_dir: "/tmp/sketchpad".into(),
            seq: 7,
            probe,
            snapshot: Some(DocsSnapshot {
                seq: 7,
                project_dir: "/tmp/sketchpad".into(),
                generated_at_ms: 1_700_000_000_000,
                files: vec![DocsFile {
                    path: "docs/ARCHITECTURE.md".into(),
                    content: "# shape".into(),
                }],
                skipped: Vec::new(),
                skipped_total: 0,
                truncated: false,
            }),
        };
        assert_eq!(
            serde_json::to_value(&bearing).expect("serialize"),
            serde_json::json!({
                "kind": "genesis",
                "projectDir": "/tmp/sketchpad",
                "seq": 7,
                "probe": {
                    "roadmap": false,
                    "tasks": false,
                    "architecture": true,
                    "git": true
                },
                "snapshot": {
                    "seq": 7,
                    "projectDir": "/tmp/sketchpad",
                    "generatedAtMs": 1_700_000_000_000_u64,
                    "files": [{ "path": "docs/ARCHITECTURE.md", "content": "# shape" }],
                    "skipped": [],
                    "skippedTotal": 0,
                    "truncated": false
                }
            })
        );
        let no_docs = PickOutcome::NoDocs {
            path: "/tmp/sketchpad".into(),
            probe: PlanProbe::default(),
        };
        assert_eq!(
            serde_json::to_value(&no_docs).expect("serialize"),
            serde_json::json!({
                "kind": "noDocs",
                "path": "/tmp/sketchpad",
                "probe": {
                    "roadmap": false,
                    "tasks": false,
                    "architecture": false,
                    "git": false
                }
            })
        );
        let status = ProjectStatus::NoDocs {
            project_dir: "/tmp/sketchpad".into(),
            probe: PlanProbe::default(),
        };
        assert_eq!(
            serde_json::to_value(&status).expect("serialize")["kind"],
            serde_json::json!("noDocs")
        );
    }
}
