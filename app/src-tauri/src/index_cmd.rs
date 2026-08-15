use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use serde::Serialize;

use nputer_index::{index, stable_json, write_graph, IndexOptions, GRAPH_REL_PATH};

use crate::docs_watch::{has_plain_docs_dir, now_ms, WatchState};

/// The `index_repo` seam (T-012): everything the Tauri command does,
/// minus the Tauri runtime, so cargo tests drive it directly (the
/// T-007 pattern). Zero arguments cross the IPC boundary — the project
/// root comes from `WatchState`, the cache dir from the app's own cache
/// path — and the outcome carries counts and timestamps only.
///
/// Volatile stats (duration, indexed-at, byte size) live HERE, in the
/// in-memory outcome, never in the committed graph.json (ADR-014: the
/// committed payload is deterministic and volatile-field-free).
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum IndexOutcome {
    /// No project open (nothing resolved at launch, nothing picked).
    NoProject,
    /// The project root has no plain `docs/` directory — the app never
    /// CREATES docs/; indexing a docs-less repo would invent structure.
    NoDocs { project_dir: String },
    /// The index ran and `write_graph` decided: `changed = false` means
    /// byte-identical output, no write, no fs event, no snapshot — the
    /// loop-termination brake (T-009 §7) observed end to end.
    Indexed {
        changed: bool,
        files: usize,
        symbols: usize,
        edges: usize,
        truncated: bool,
        graph_bytes: usize,
        duration_ms: u64,
        indexed_at_ms: u64,
    },
    /// IndexError (or a refused write target), Display'd — never a panic.
    Error { message: String },
}

/// Run the indexer over the open project and write the committed graph.
///
/// `cache_dir` is the caller's choice (the app passes its cache dir,
/// tests pass None — the crate degrades to a full parse either way).
pub fn run_index(state: &WatchState, cache_dir: Option<PathBuf>) -> IndexOutcome {
    let Some(root) = state.project_dir() else {
        return IndexOutcome::NoProject;
    };
    if !has_plain_docs_dir(&root) {
        return IndexOutcome::NoDocs {
            project_dir: root.display().to_string(),
        };
    }

    // T-003 rule family: refuse to write through a symlinked
    // docs/architecture directory (a symlinked docs/ is already refused
    // above). A graph.json that is itself a symlink needs no check:
    // write_graph's atomic temp+rename REPLACES the link without ever
    // following it.
    let arch_dir = root.join("docs").join("architecture");
    if let Ok(meta) = fs::symlink_metadata(&arch_dir) {
        if meta.file_type().is_symlink() {
            return IndexOutcome::Error {
                message: format!(
                    "{} is a symlink - refusing to write through it",
                    arch_dir.display()
                ),
            };
        }
    }

    let started = Instant::now();
    let graph = match index(&IndexOptions {
        root: root.clone(),
        cache_dir,
        ..Default::default()
    }) {
        Ok(graph) => graph,
        Err(err) => {
            return IndexOutcome::Error {
                message: err.to_string(),
            }
        }
    };
    let graph_bytes = stable_json(&graph).len();
    let changed = match write_graph(&graph, &root.join(GRAPH_REL_PATH)) {
        Ok(changed) => changed,
        Err(err) => {
            return IndexOutcome::Error {
                message: err.to_string(),
            }
        }
    };

    IndexOutcome::Indexed {
        changed,
        files: graph.stats.files,
        symbols: graph.stats.symbols,
        edges: graph.stats.edges,
        truncated: graph.stats.truncated_symbols == Some(true),
        graph_bytes,
        duration_ms: started.elapsed().as_millis() as u64,
        indexed_at_ms: now_ms(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::docs_watch::{
        apply_picked_folder, spawn_watcher_thread, DocsSnapshot, PickOutcome, WatchCtl, DEBOUNCE,
    };
    use std::path::Path;
    use std::sync::atomic::AtomicU64;
    use std::sync::{mpsc, Arc};
    use std::time::Duration;

    /// Unique scratch dir under the system temp dir; removed on drop
    /// (the T-003 TempTree pattern, local because docs_watch's helper is
    /// test-private to its own module).
    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "nputer-t012-{}-{}-{}",
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

    fn detached_state(initial: Option<PathBuf>) -> WatchState {
        let (ctl, _rx) = mpsc::channel::<WatchCtl>();
        WatchState::new(initial, Arc::new(AtomicU64::new(0)), ctl)
    }

    fn live_state(initial: Option<PathBuf>) -> (WatchState, mpsc::Receiver<DocsSnapshot>) {
        let seq = Arc::new(AtomicU64::new(0));
        let (emit_tx, emit_rx) = mpsc::channel();
        let ctl = spawn_watcher_thread(seq.clone(), initial.clone(), move |snap| {
            let _ = emit_tx.send(snap.clone());
        });
        (WatchState::new(initial, seq, ctl), emit_rx)
    }

    #[test]
    fn no_project_yields_no_project() {
        let state = detached_state(None);
        assert!(matches!(run_index(&state, None), IndexOutcome::NoProject));
    }

    #[test]
    fn docsless_root_yields_no_docs_and_creates_nothing() {
        let t = TempTree::new("nodocs");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        let state = detached_state(Some(t.root().to_path_buf()));
        match run_index(&state, None) {
            IndexOutcome::NoDocs { project_dir } => {
                assert_eq!(project_dir, t.root().display().to_string());
            }
            other => panic!("expected NoDocs, got {other:?}"),
        }
        assert!(!t.root().join("docs").exists(), "the app never creates docs/");
    }

    #[test]
    fn indexes_and_writes_the_graph_then_noops_when_unchanged() {
        let t = TempTree::new("indexed");
        t.write("docs/tasks/T-001-x.md", "not code");
        t.write("src/a.ts", "import { b } from \"./b\";\nexport const a = b;\n");
        t.write("src/b.ts", "export const b = 1;\n");
        let state = detached_state(Some(t.root().to_path_buf()));

        let first = run_index(&state, None);
        let IndexOutcome::Indexed {
            changed,
            files,
            symbols,
            edges,
            truncated,
            graph_bytes,
            ..
        } = first
        else {
            panic!("expected Indexed, got {first:?}");
        };
        assert!(changed, "first run writes");
        assert_eq!(files, 2);
        assert!(symbols >= 2);
        assert!(edges >= 1);
        assert!(!truncated);

        let on_disk = fs::read(t.root().join("docs/architecture/graph.json")).expect("graph");
        assert_eq!(on_disk.len(), graph_bytes, "outcome reports the committed size");
        let parsed: serde_json::Value = serde_json::from_slice(&on_disk).expect("valid JSON");
        assert_eq!(parsed["schema"], 1);

        // Determinism + read-compare-skip: the second run must not write.
        let second = run_index(&state, None);
        let IndexOutcome::Indexed { changed: changed2, .. } = second else {
            panic!("expected Indexed, got {second:?}");
        };
        assert!(!changed2, "unchanged tree, no write");
        assert_eq!(
            fs::read(t.root().join("docs/architecture/graph.json")).expect("graph"),
            on_disk,
            "byte-identical committed graph"
        );
    }

    #[cfg(unix)]
    #[test]
    fn symlinked_docs_architecture_is_refused() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("archlink");
        t.write("src/a.ts", "export const a = 1;\n");
        let outside = TempTree::new("archlink-target");
        fs::create_dir_all(outside.root().join("arch")).expect("mk target");
        symlink(outside.root().join("arch"), t.root().join("docs/architecture"))
            .expect("dir symlink");
        let state = detached_state(Some(t.root().to_path_buf()));
        match run_index(&state, None) {
            IndexOutcome::Error { message } => {
                assert!(message.contains("refusing"), "message: {message}");
            }
            other => panic!("expected Error for symlinked docs/architecture, got {other:?}"),
        }
        assert!(
            !outside.root().join("arch").join("graph.json").exists(),
            "nothing written through the link"
        );
    }

    /// THE LOOP-TERMINATION INTEGRATION TEST (plan §4): graph.json lives
    /// inside the watched docs/ tree, so an in-app index emits exactly
    /// one snapshot when the graph changes — and NONE when it does not.
    /// Three independent brakes (byte-determinism, write_graph's
    /// read-compare-skip, the collector's content-equality suppression)
    /// make re-index on an unchanged tree produce no write, no event, no
    /// snapshot.
    #[test]
    fn reindex_emits_once_then_never_again() {
        let t = TempTree::new("loop");
        t.write("docs/tasks/T-001-x.md", "doc");
        t.write("src/a.ts", "export const a = 1;\n");
        let (state, emits) = live_state(None);

        // Arm via the picker path — its rendezvous guarantees the watch
        // and emit baseline are set before it returns.
        match apply_picked_folder(&state, t.root()) {
            PickOutcome::Picked { snapshot } => {
                assert!(
                    !snapshot.files.iter().any(|f| f.path.ends_with("graph.json")),
                    "no graph before the first index"
                );
            }
            other => panic!("expected Picked, got {other:?}"),
        }

        // First index: one write → one debounced batch → ONE snapshot
        // carrying the new graph.json.
        let first = run_index(&state, None);
        assert!(matches!(first, IndexOutcome::Indexed { changed: true, .. }), "{first:?}");
        let emit = emits
            .recv_timeout(Duration::from_secs(10))
            .expect("the graph write must emit exactly one snapshot");
        let graph_file = emit
            .files
            .iter()
            .find(|f| f.path == "docs/architecture/graph.json")
            .expect("snapshot carries the graph");
        assert!(graph_file.content.contains("\"schema\": 1"));

        // Drain any residual batch from the same write (content-equal →
        // suppressed, so nothing should arrive; a straggler carrying the
        // SAME content would be a duplicate-emit bug).
        assert!(
            emits.recv_timeout(DEBOUNCE * 6).is_err(),
            "one write, one emit — no echo"
        );

        // Second index on the unchanged tree: no write, no event, no
        // snapshot — provably none within many debounce windows.
        let second = run_index(&state, None);
        assert!(matches!(second, IndexOutcome::Indexed { changed: false, .. }), "{second:?}");
        assert!(
            emits.recv_timeout(DEBOUNCE * 6).is_err(),
            "unchanged tree re-index must be snapshot-silent"
        );
    }
}
