use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode, DebounceEventResult, Debouncer};
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

/// Debounce window for editor save bursts (criterion 2). One debounced
/// batch -> at most one snapshot emit; well inside the 1s budget of
/// criterion 1.
pub const DEBOUNCE: Duration = Duration::from_millis(250);

const DOCS_DIR: &str = "docs";
/// Caps so a pathological repo cannot balloon the IPC payload.
const MAX_FILE_BYTES: u64 = 1_048_576; // 1 MiB per file
const MAX_FILES: usize = 2_000;
const MAX_DEPTH: usize = 16;
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

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocsSnapshot {
    pub seq: u64,
    pub project_dir: String,
    pub generated_at_ms: u64,
    pub files: Vec<DocsFile>,
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
    NoDocs { project_dir: String },
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
    /// Chosen folder has no plain `docs/` directory (or vanished before
    /// validation); nothing changed. `path` is what was looked at.
    NoDocs { path: String },
    /// Validation passed but the watcher could not re-arm; nothing changed
    /// (the previous project, if any, is still watched).
    Error { path: String, message: String },
    /// Folder validated and the watcher re-armed: this snapshot is the
    /// picked project's current docs tree.
    Picked { snapshot: DocsSnapshot },
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
        }
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

/// Does `root` contain a plain `docs/` directory — a real dir, not a
/// symlink? The single definition of "convention layout present" used by
/// startup status, the picker validation, and the watcher's arming gate
/// (same symlink rules as T-003's collector, which refuses a symlinked
/// docs/ at read time).
pub fn has_plain_docs_dir(root: &Path) -> bool {
    match fs::symlink_metadata(root.join(DOCS_DIR)) {
        Ok(meta) => !meta.file_type().is_symlink() && meta.is_dir(),
        Err(_) => false,
    }
}

/// Collect every regular `.md` file under `<project_dir>/docs`, recursively.
///
/// Containment (ADR-010): symlinks — file or directory — are skipped
/// outright, and each file's canonical path must stay under the canonical
/// project dir; anything else is dropped. Non-UTF-8 and oversized files
/// are skipped. Results are sorted by path, so snapshots are deterministic
/// and byte-comparable (the emit-suppression check relies on this).
pub fn collect_docs_files(project_dir: &Path) -> Vec<DocsFile> {
    let mut out: Vec<DocsFile> = Vec::new();
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

    let mut stack: Vec<(PathBuf, usize)> = vec![(docs_root, 0)];
    while let Some((dir, depth)) = stack.pop() {
        if depth > MAX_DEPTH {
            continue;
        }
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let Ok(meta) = fs::symlink_metadata(&path) else {
                continue;
            };
            if meta.file_type().is_symlink() {
                continue; // never follow links out of the tree
            }
            if meta.is_dir() {
                stack.push((path, depth + 1));
                continue;
            }
            if !meta.is_file() {
                continue;
            }
            if path.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            if meta.len() > MAX_FILE_BYTES {
                continue;
            }
            if out.len() >= MAX_FILES {
                break;
            }
            // Belt to the symlink-skip's suspenders: canonical prefix check.
            let Ok(canon) = path.canonicalize() else {
                continue;
            };
            if !canon.starts_with(&canon_project) {
                continue;
            }
            let Ok(content) = fs::read_to_string(&canon) else {
                continue; // non-UTF-8 or vanished mid-read
            };
            let Some(rel) = relative_posix(&canon, &canon_project) else {
                continue;
            };
            out.push(DocsFile { path: rel, content });
        }
    }
    out.sort_by(|a, b| a.path.cmp(&b.path));
    out
}

/// Build one snapshot of `root`'s docs tree stamped with `seq`.
fn build_snapshot(root: &Path, seq: u64) -> DocsSnapshot {
    DocsSnapshot {
        seq,
        project_dir: root.display().to_string(),
        generated_at_ms: now_ms(),
        files: collect_docs_files(root),
    }
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
pub fn apply_picked_folder(state: &WatchState, picked: &Path) -> PickOutcome {
    let mut project = state.project.lock().expect("project mutex poisoned");

    let Ok(canon) = picked.canonicalize() else {
        // Vanished or unreadable: nothing usable was found at that path.
        return PickOutcome::NoDocs {
            path: picked.display().to_string(),
        };
    };
    if !has_plain_docs_dir(&canon) {
        return PickOutcome::NoDocs {
            path: canon.display().to_string(),
        };
    }

    // Rendezvous with the watcher thread: arm the new root before any
    // state changes. The thread resets its emit baseline before acking,
    // and the snapshot below is read after the ack, so the snapshot is
    // never older than the baseline — post-pick changes always diff.
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
        Err(_) => {
            return PickOutcome::Error {
                path: canon.display().to_string(),
                message: "watcher re-arm timed out".into(),
            }
        }
    }

    *project = Some(canon.clone());
    let seq = state.next_seq();
    println!("[nputer] project folder picked: {}", canon.display());
    PickOutcome::Picked {
        snapshot: build_snapshot(&canon, seq),
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
    root: Option<PathBuf>,
    docs: Option<PathBuf>,
    last_files: Vec<DocsFile>,
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
        last_files: Vec::new(),
    };

    match initial_root {
        Some(root) => {
            if let Err(msg) = rearm(&mut debouncer, &mut target, root) {
                println!("[nputer] watch: {msg} - watcher idle until a project folder is picked");
            }
        }
        None => {
            println!("[nputer] watch: no project resolved - watcher idle until a project folder is picked");
        }
    }

    for msg in rx {
        match msg {
            WatchCtl::Fs(Ok(events)) => {
                if events.is_empty() {
                    continue;
                }
                let Some(root) = target.root.clone() else {
                    continue; // stale events with no project armed
                };
                let seq = next_seq(&seq);
                let files = collect_docs_files(&root);
                if files == target.last_files {
                    println!(
                        "[nputer] watch: {} fs event(s) coalesced, content unchanged - suppressed",
                        events.len()
                    );
                    continue;
                }
                target.last_files = files.clone();
                let snapshot = DocsSnapshot {
                    seq,
                    project_dir: root.display().to_string(),
                    generated_at_ms: now_ms(),
                    files,
                };
                println!(
                    "[nputer] docs-changed: seq={} files={} fs_events={} at_ms={}",
                    snapshot.seq,
                    snapshot.files.len(),
                    events.len(),
                    snapshot.generated_at_ms
                );
                sink(&snapshot);
            }
            WatchCtl::Fs(Err(err)) => eprintln!("[nputer] watch: watcher error: {err}"),
            WatchCtl::Rearm { root, ack } => {
                let _ = ack.send(rearm(&mut debouncer, &mut target, root));
            }
        }
    }
    // Keep the debouncer alive for the loop's whole lifetime.
    drop(debouncer);
}

/// (Re)arm the watch on `<new_root>/docs`. Arms the NEW watch before
/// dropping the old one, so a failure at any step leaves the previous
/// project's watch fully intact. Resets the emit baseline to the new
/// tree's current content on success.
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
        // Same folder re-picked: keep the watch, refresh the baseline.
        target.last_files = collect_docs_files(&new_root);
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
    target.last_files = collect_docs_files(&new_root);
    target.docs = Some(new_docs.clone());
    target.root = Some(new_root);
    println!(
        "[nputer] watch: watching {} (debounce {}ms)",
        new_docs.display(),
        DEBOUNCE.as_millis()
    );
    Ok(())
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
            ProjectStatus::NoDocs { project_dir } => {
                assert_eq!(project_dir, t.root().display().to_string());
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
        match apply_picked_folder(&state, &gone) {
            PickOutcome::NoDocs { path } => assert_eq!(path, gone.display().to_string()),
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
        match apply_picked_folder(&state, bare.root()) {
            PickOutcome::NoDocs { path } => {
                // Canonicalized form of what was looked at.
                assert_eq!(path, bare.root().canonicalize().unwrap().display().to_string());
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

        match apply_picked_folder(&state, trap.root()) {
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

        match apply_picked_folder(&state, picked.root()) {
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

        match apply_picked_folder(&state, &alias) {
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
            apply_picked_folder(&state, a.root()),
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
            apply_picked_folder(&state, bare.root()),
            PickOutcome::NoDocs { .. }
        ));
        a.write("docs/tasks/T-301-a.md", "alpha v3");
        let still_a = recv_emit(&emits);
        assert!(still_a.files.iter().any(|f| f.content == "alpha v3"));
        assert_eq!(state.project_dir(), Some(canon_a));

        // Successful pick: seq continues past everything emitted so far.
        let picked = match apply_picked_folder(&state, b.root()) {
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

        let picked = match apply_picked_folder(&state, a.root()) {
            PickOutcome::Picked { snapshot } => snapshot,
            other => panic!("expected Picked, got {other:?}"),
        };
        assert_eq!(picked.files.len(), 1);

        a.write("docs/two.md", "two");
        let emit = recv_emit(&emits);
        assert!(emit.seq > picked.seq);
        assert_eq!(emit.files.len(), 2);
    }
}
