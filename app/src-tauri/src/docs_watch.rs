use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use notify_debouncer_mini::{new_debouncer, notify::RecursiveMode, DebounceEventResult};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

/// Docs watcher + snapshot pipeline (T-003).
///
/// The Rust side never parses: it watches `<project>/docs` and ships raw
/// `.md` contents to the webview, where @nputer/parser builds the model
/// (parsing lives where TypeScript runs; the app stays a pure lens).
/// Every push is a full snapshot of the docs tree — files are small, and
/// full-state pushes make create/rename/delete handling race-free by
/// construction (the frontend always converges on current disk truth).
///
/// ADR-010 containment: reads are confined to `<project>/docs` — the
/// `docs_snapshot` command takes no path arguments, symlinks are never
/// followed, and every file's canonical path must remain under the
/// canonical project dir or it is dropped.

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

/// Managed state: the resolved project dir plus the shared sequence
/// counter that orders every snapshot (command responses and watcher
/// events draw from the same counter, so the frontend can drop stale or
/// duplicate deliveries with a single `seq <= applied` check).
pub struct WatchState {
    pub project_dir: PathBuf,
    seq: AtomicU64,
}

impl WatchState {
    pub fn new(project_dir: PathBuf) -> Self {
        Self {
            project_dir,
            seq: AtomicU64::new(0),
        }
    }

    /// Next sequence number (first is 1; frontend starts at 0). Taken
    /// BEFORE collecting files in both paths, so seq order matches
    /// collection start order.
    pub fn next_seq(&self) -> u64 {
        self.seq.fetch_add(1, Ordering::SeqCst) + 1
    }
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

/// Build a snapshot for the `docs_snapshot` command (seq first, then read).
pub fn snapshot_now(state: &WatchState) -> DocsSnapshot {
    let seq = state.next_seq();
    DocsSnapshot {
        seq,
        project_dir: state.project_dir.display().to_string(),
        generated_at_ms: now_ms(),
        files: collect_docs_files(&state.project_dir),
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

/// Spawn the watcher thread: debounced notify events over `<project>/docs`,
/// each surviving batch collected into a full snapshot and emitted as one
/// `docs-changed` event. Identical-content snapshots are suppressed, so an
/// editor save burst that settles on the same bytes produces zero
/// duplicate pushes (criterion 2's backend half).
pub fn spawn_watcher(app: AppHandle) {
    std::thread::spawn(move || run_watcher(app));
}

fn run_watcher(app: AppHandle) {
    let state = app.state::<WatchState>();
    let docs_root = state.project_dir.join(DOCS_DIR);
    if !docs_root.is_dir() {
        println!(
            "[nputer] watch: {} not found - watcher idle",
            docs_root.display()
        );
        return;
    }

    let (tx, rx) = mpsc::channel::<DebounceEventResult>();
    let mut debouncer = match new_debouncer(DEBOUNCE, tx) {
        Ok(d) => d,
        Err(err) => {
            eprintln!("[nputer] watch: failed to create watcher: {err}");
            return;
        }
    };
    if let Err(err) = debouncer.watcher().watch(&docs_root, RecursiveMode::Recursive) {
        eprintln!(
            "[nputer] watch: cannot watch {}: {err}",
            docs_root.display()
        );
        return;
    }
    println!(
        "[nputer] watch: watching {} (debounce {}ms)",
        docs_root.display(),
        DEBOUNCE.as_millis()
    );

    // Baseline = current disk state, so a change event only emits when
    // content actually differs from what the tree held at watch start.
    let mut last_files = collect_docs_files(&state.project_dir);

    for batch in rx {
        match batch {
            Ok(events) => {
                if events.is_empty() {
                    continue;
                }
                let seq = state.next_seq();
                let files = collect_docs_files(&state.project_dir);
                if files == last_files {
                    println!(
                        "[nputer] watch: {} fs event(s) coalesced, content unchanged - suppressed",
                        events.len()
                    );
                    continue;
                }
                last_files = files.clone();
                let snapshot = DocsSnapshot {
                    seq,
                    project_dir: state.project_dir.display().to_string(),
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
                if let Err(err) = app.emit("docs-changed", &snapshot) {
                    eprintln!("[nputer] watch: emit failed: {err}");
                }
            }
            Err(err) => eprintln!("[nputer] watch: watcher error: {err}"),
        }
    }
    // Keep the debouncer alive for the loop's whole lifetime.
    drop(debouncer);
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
        let state = WatchState::new(PathBuf::from("/tmp"));
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
}
