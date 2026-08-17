//! `nputer-index index --watch` — keep graph.json current, headless.
//!
//! For sessions whose agents run in a terminal while the app is closed
//! (map-technical-plan §5.2). Same debouncer and the same 250 ms window
//! as the app's docs watcher (`app/src-tauri/src/docs_watch.rs`), so the
//! two are one behaviour rather than two.
//!
//! CONTAINMENT, stated precisely. The event filter below is TRIAGE, not
//! the containment boundary: it decides only whether a batch is worth
//! re-indexing. Containment itself is enforced where it always was — in
//! the walk (`walk.rs`: symlinks skipped, every accepted file
//! canonicalized and prefix-checked against the canonical root) and in
//! `write_graph`'s atomic temp+rename, which replaces a symlinked target
//! instead of writing through it. The consequence a verifier can check:
//! a filter mistake can only cost an extra (byte-identical, no-op)
//! re-index — it can never widen what the watcher reads or writes.
//!
//! LOOP TERMINATION. graph.json lives under `docs/`, inside the watched
//! root, so writing it fires events too. Three brakes stop the cycle,
//! exactly as T-012 proved for the in-app path: byte-determinism, then
//! `write_graph`'s read-compare-skip (no write when equal, so no event),
//! then this module's filter (graph.json is a `.json` outside the
//! resolution-affecting set, so its own event is not even interesting).

use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::{Duration, Instant};

use notify_debouncer_mini::notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebounceEventResult};

use crate::{index, write_graph, IndexError, IndexOptions, GRAPH_REL_PATH};

/// Same window as the app watcher (`docs_watch.rs`'s `DEBOUNCE`): one
/// debounced batch -> at most one re-index.
pub const DEBOUNCE: Duration = Duration::from_millis(250);

/// Basenames whose content changes resolution or the walked set, even
/// though their extension is not in the indexer's allowlist.
const CONFIG_NAMES: [&str; 4] = ["tsconfig.json", "package.json", ".gitignore", ".nputerignore"];

/// What the watcher tells its caller. The binary prints these; tests
/// assert on them.
#[derive(Clone, Debug, PartialEq)]
pub enum WatchEvent {
    Started {
        root: PathBuf,
        debounce_ms: u64,
    },
    /// A batch was triaged as uninteresting — no index ran.
    Skipped {
        paths: usize,
    },
    Indexed {
        changed: bool,
        files: usize,
        symbols: usize,
        edges: usize,
        duration_ms: u64,
    },
    /// An index or write failed. The watcher keeps running: a transient
    /// half-written tree must not end the session.
    Failed {
        message: String,
    },
}

/// Is this event path worth a re-index?
///
/// Cheap triage, in this order: contained under the canonical root; not
/// inside the two trees the walker hard-skips unconditionally; then an
/// extension or basename the index actually depends on. Paths with no
/// extension at all pass, because a directory rename or delete arrives
/// as the directory's own path and may have taken source files with it.
pub(crate) fn is_interesting(canon_root: &Path, path: &Path) -> bool {
    let Ok(rel) = path.strip_prefix(canon_root) else {
        return false; // outside the root: never ours
    };
    let mut components = rel.components().peekable();
    if components.peek().is_none() {
        return false; // the root itself
    }
    for component in rel.components() {
        let Some(name) = component.as_os_str().to_str() else {
            return false;
        };
        if name == ".git" || name == "node_modules" {
            return false;
        }
    }
    let Some(name) = rel.file_name().and_then(|n| n.to_str()) else {
        return false;
    };
    if CONFIG_NAMES.contains(&name) {
        return true;
    }
    match name.rsplit_once('.') {
        // A dotfile like `.gitignore` splits to ("", "gitignore") — it is
        // not an extension, and the named set above already covered the
        // ones that matter.
        Some((stem, ext)) if !stem.is_empty() => {
            crate::graph::Lang::for_extension(ext).is_some()
        }
        _ => true, // no extension: a directory event, or an extensionless file
    }
}

/// Index once and write, reporting the outcome as a [`WatchEvent`].
fn index_once(opts: &IndexOptions, target: &Path) -> WatchEvent {
    let started = Instant::now();
    let graph = match index(opts) {
        Ok(graph) => graph,
        Err(err) => {
            return WatchEvent::Failed {
                message: err.to_string(),
            }
        }
    };
    match write_graph(&graph, target) {
        Ok(changed) => WatchEvent::Indexed {
            changed,
            files: graph.stats.files,
            symbols: graph.stats.symbols,
            edges: graph.stats.edges,
            duration_ms: started.elapsed().as_millis() as u64,
        },
        Err(err) => WatchEvent::Failed {
            message: err.to_string(),
        },
    }
}

/// Watch `opts.root` and keep its graph.json current. Blocks forever;
/// the caller ends the session (Ctrl-C, or a signal from its parent).
///
/// Returns `Err` only for conditions that make the whole run
/// meaningless — an invalid root, a watcher the OS refuses to create.
/// Per-batch failures are reported through `on_event` and the loop
/// continues.
pub fn watch(
    opts: &IndexOptions,
    debounce: Duration,
    mut on_event: impl FnMut(WatchEvent),
) -> Result<(), IndexError> {
    let canon_root = opts
        .root
        .canonicalize()
        .map_err(|_| IndexError::RootInvalid(opts.root.clone()))?;
    let target = canon_root.join(GRAPH_REL_PATH);
    let opts = IndexOptions {
        root: canon_root.clone(),
        ..opts.clone()
    };

    let (tx, rx) = mpsc::channel::<DebounceEventResult>();
    let mut debouncer = new_debouncer(debounce, move |res| {
        let _ = tx.send(res);
    })
    .map_err(|err| IndexError::Write {
        path: canon_root.clone(),
        source: std::io::Error::other(err.to_string()),
    })?;
    debouncer
        .watcher()
        .watch(&canon_root, RecursiveMode::Recursive)
        .map_err(|err| IndexError::Write {
            path: canon_root.clone(),
            source: std::io::Error::other(err.to_string()),
        })?;

    on_event(WatchEvent::Started {
        root: canon_root.clone(),
        debounce_ms: debounce.as_millis() as u64,
    });
    // Index once up front, so the session starts from a current graph
    // rather than from whatever the last writer left.
    on_event(index_once(&opts, &target));

    while let Ok(result) = rx.recv() {
        let paths: Vec<PathBuf> = match result {
            Ok(events) => events.into_iter().map(|e| e.path).collect(),
            // A watcher error (a lost inode, an overflowed queue) is a
            // reason to re-index, not to trust the last one.
            Err(error) => {
                on_event(WatchEvent::Failed {
                    message: format!("watcher error, re-indexing: {error}"),
                });
                on_event(index_once(&opts, &target));
                continue;
            }
        };
        if !paths.iter().any(|p| is_interesting(&canon_root, p)) {
            on_event(WatchEvent::Skipped { paths: paths.len() });
            continue;
        }
        on_event(index_once(&opts, &target));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    #[test]
    fn the_debounce_window_matches_the_app_watchers() {
        // docs_watch.rs pins 250 ms; the criterion asks for the same
        // containment and debounce semantics, so this is a real pin and
        // not a restatement — change one, change the other.
        assert_eq!(DEBOUNCE, Duration::from_millis(250));
    }

    #[test]
    fn triage_accepts_source_and_config_and_rejects_the_hard_skipped_trees() {
        let root = Path::new("/repo");
        for good in [
            "/repo/src/a.ts",
            "/repo/src/a.tsx",
            "/repo/src/a.mts",
            "/repo/src/a.cts",
            "/repo/src/a.js",
            "/repo/src/a.jsx",
            "/repo/tsconfig.json",
            "/repo/app/package.json",
            "/repo/.gitignore",
            "/repo/.nputerignore",
            "/repo/src/newdir",
        ] {
            assert!(is_interesting(root, Path::new(good)), "{good}");
        }
        for bad in [
            "/repo/.git/index",
            "/repo/node_modules/react/index.js",
            "/repo/app/node_modules/x/a.ts",
            "/repo/docs/architecture/graph.json",
            "/repo/README.md",
            "/repo/app/src/index.css",
            "/elsewhere/a.ts",
            "/repo",
        ] {
            assert!(!is_interesting(root, Path::new(bad)), "{bad}");
        }
    }

    #[test]
    fn the_graph_the_watcher_writes_is_never_itself_a_trigger() {
        // The third loop brake, pinned directly: graph.json's own write
        // event is triaged out, so even a watcher that fires on it
        // cannot cycle.
        assert!(!is_interesting(
            Path::new("/repo"),
            &Path::new("/repo").join(GRAPH_REL_PATH)
        ));
    }

    #[test]
    fn an_invalid_root_fails_the_run_rather_than_watching_nothing() {
        let opts = IndexOptions {
            root: PathBuf::from("/nonexistent/nputer-t014-watch"),
            ..Default::default()
        };
        let err = watch(&opts, DEBOUNCE, |_| {}).unwrap_err();
        assert!(matches!(err, IndexError::RootInvalid(_)));
    }

    #[test]
    fn index_once_writes_then_noops_and_reports_both() {
        let t = TempTree::new("watch-once");
        t.write("src/a.ts", "export const a = 1;\n");
        let opts = IndexOptions {
            root: t.root().to_path_buf(),
            ..Default::default()
        };
        let target = t.root().join(GRAPH_REL_PATH);
        match index_once(&opts, &target) {
            WatchEvent::Indexed { changed, files, .. } => {
                assert!(changed);
                assert_eq!(files, 1);
            }
            other => panic!("{other:?}"),
        }
        match index_once(&opts, &target) {
            WatchEvent::Indexed { changed, .. } => assert!(!changed, "no-op on equal bytes"),
            other => panic!("{other:?}"),
        }
    }
}
