use std::fs;
use std::path::PathBuf;

use serde::Serialize;

use nputer_index::arch;
use nputer_index::rollup::{detail, rollup, Detail, Rollup};
use nputer_index::{Graph, GRAPH_REL_PATH};

use crate::docs_watch::{has_plain_docs_dir, WatchState};

/// T-140-s1 — THE CHANNEL. The seam behind `arch_rollup` and
/// `arch_detail`: everything the two commands do, minus the Tauri
/// runtime, so cargo tests drive it directly (the T-007/T-012 pattern).
///
/// **WHY A CHANNEL AND NOT A BIGGER CAP.** T-140 ruled it, at
/// `MAX_FILE_BYTES`'s own definition site in `docs_watch.rs`, with three
/// reasons written there: a graph-specific cap only moves a cliff whose
/// driver is linear in file count; the docs pipeline is a BROADCAST and
/// cannot express "detail for what is on screen" at any cap; and the
/// measured cost is the channel's SHAPE, not its size. This module is
/// that channel. Read the ruling before proposing a cap here.
///
/// **WHAT TRAVELS AT REST AND WHAT TRAVELS ON A DRILL.** At rest:
/// [`nputer_index::rollup::Rollup`] — components, their observed and
/// declared edges with counts, per-component file COUNTS, and nothing
/// keyed by a file. On a drill: one [`Detail`] answer for one named
/// target. The resting payload's size is a function of the REGISTRY, so
/// the map's cost stops tracking the tree — the property
/// `crates/nputer-index/tests/budget.rs` pins as a relation.
///
/// **THE GRAPH IS READ HERE, FROM DISK, AND NEVER CROSSES IPC.** That is
/// what removes the wall: `graph.json` can be any size the indexer wrote
/// and the pane still gets its picture, because what crosses the boundary
/// is the rollup. The read is deliberately UNCAPPED and this is not an
/// oversight — the file is the app's own committed artifact, written by
/// the app's own indexer under `IndexOptions::max_graph_bytes`, and
/// `emit::write_graph` has read it whole with no cap since T-009 to do
/// its byte-compare. A cap here would reinstate exactly the cliff this
/// card removes, one layer down, and it would need a value that T-151
/// reserves to @human.
///
/// **CONTAINMENT (ADR-010).** No path crosses IPC inbound. The project
/// root comes from `WatchState`; the graph's location is a `&'static`
/// relative path; and a symlinked `docs/` or `docs/architecture/` is
/// REFUSED rather than followed, the same refusal `index_cmd::run_index`
/// makes on the write side. `arch_detail`'s one argument is a KEY into
/// the document just read — never a path this process opens (see
/// [`nputer_index::rollup::detail`]).

/// What `arch_rollup` can say. Every arm is a typed outcome; nothing
/// panics and no error text from the filesystem reaches the webview
/// except a parse/registry message the app itself produced.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum RollupOutcome {
    /// No project open (nothing resolved at launch, nothing picked).
    NoProject,
    /// The project root has no plain `docs/` directory.
    NoDocs { project_dir: String },
    /// No committed graph on disk — "index not run", which is a state the
    /// pane already renders and offers to fix.
    NoGraph,
    /// The graph exists and could not be turned into a picture: bad JSON,
    /// a schema this build does not read, or a registry the reader
    /// refuses (`arch::registry` refuses rather than guessing). NAMED,
    /// because the pane's remedy differs from "index not run" — this one
    /// is regenerate-or-fix-the-registry, not run-the-index.
    Unreadable { message: String },
    /// The picture. `graph_bytes` is the size of the file this was read
    /// from — a volatile stat, so it lives HERE and never in the
    /// committed payload (ADR-014), and it is what lets the pane say how
    /// much it did NOT have to receive.
    Ready { rollup: Rollup, graph_bytes: usize },
}

/// What `arch_detail` can say.
///
/// `Answered` carries the refusal INSIDE it, deliberately: a target the
/// document does not hold is an ANSWER — "I do not have that", by name —
/// and not a channel failure. The distinction matters to the pane, which
/// must not offer "re-index" for a stale click.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum DetailOutcome {
    NoProject,
    NoDocs { project_dir: String },
    NoGraph,
    Unreadable { message: String },
    Answered { detail: Detail },
}

/// The graph plus the registry join, or the reason there is neither.
enum Loaded {
    Ready(Box<(arch::ArchModel, Graph, usize)>),
    NoProject,
    NoDocs(String),
    NoGraph,
    Unreadable(String),
}

fn load(state: &WatchState) -> Loaded {
    let Some(root) = state.project_dir() else {
        return Loaded::NoProject;
    };
    if !has_plain_docs_dir(&root) {
        return Loaded::NoDocs(root.display().to_string());
    }
    // ADR-010: refuse to read THROUGH a symlinked architecture directory.
    // `has_plain_docs_dir` has already refused a symlinked `docs/`.
    let arch_dir = root.join("docs").join("architecture");
    if let Ok(meta) = fs::symlink_metadata(&arch_dir) {
        if meta.file_type().is_symlink() {
            return Loaded::Unreadable(format!(
                "{} is a symlink - refusing to read through it",
                arch_dir.display()
            ));
        }
    }
    let graph_path: PathBuf = root.join(GRAPH_REL_PATH);
    // A graph.json that is itself a symlink is refused too: the write
    // side gets away without this check because its atomic temp+rename
    // REPLACES the link, but a READ would follow it straight out of the
    // project.
    if let Ok(meta) = fs::symlink_metadata(&graph_path) {
        if meta.file_type().is_symlink() {
            return Loaded::Unreadable(format!(
                "{} is a symlink - refusing to read through it",
                graph_path.display()
            ));
        }
    }
    let bytes = match fs::read(&graph_path) {
        Ok(bytes) => bytes,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Loaded::NoGraph,
        Err(err) => return Loaded::Unreadable(format!("could not read the committed graph: {err}")),
    };
    let graph_bytes = bytes.len();
    let graph: Graph = match serde_json::from_slice(&bytes) {
        Ok(graph) => graph,
        Err(err) => {
            return Loaded::Unreadable(format!(
                "the committed graph is not readable ({err}); re-indexing regenerates it"
            ))
        }
    };
    let model = match arch::model(&root, &graph) {
        Ok(model) => model,
        Err(err) => return Loaded::Unreadable(err.to_string()),
    };
    Loaded::Ready(Box::new((model, graph, graph_bytes)))
}

/// The map's resting payload for the open project.
pub fn run_rollup(state: &WatchState) -> RollupOutcome {
    match load(state) {
        Loaded::NoProject => RollupOutcome::NoProject,
        Loaded::NoDocs(dir) => RollupOutcome::NoDocs { project_dir: dir },
        Loaded::NoGraph => RollupOutcome::NoGraph,
        Loaded::Unreadable(message) => RollupOutcome::Unreadable { message },
        Loaded::Ready(loaded) => {
            let (model, graph, graph_bytes) = *loaded;
            RollupOutcome::Ready {
                rollup: rollup(&model, &graph),
                graph_bytes,
            }
        }
    }
}

/// File-level detail for ONE named target — the pull.
pub fn run_detail(state: &WatchState, target: &str) -> DetailOutcome {
    match load(state) {
        Loaded::NoProject => DetailOutcome::NoProject,
        Loaded::NoDocs(dir) => DetailOutcome::NoDocs { project_dir: dir },
        Loaded::NoGraph => DetailOutcome::NoGraph,
        Loaded::Unreadable(message) => DetailOutcome::Unreadable { message },
        Loaded::Ready(loaded) => {
            let (model, graph, _) = *loaded;
            DetailOutcome::Answered {
                detail: detail(&model, &graph, target),
            }
        }
    }
}

/// The pull's argument, bounded before it is used as a key.
///
/// A key is not a path, but it is still webview-supplied text that ends
/// up in a comparison and — on a miss — in the answer. `Detail::Unknown`
/// echoes the target back so the pane can say WHICH click it could not
/// serve, so an unbounded argument would be an unbounded echo. This is
/// the `MAX_ECHO_LOG_CHARS` discipline, applied at the other boundary.
pub const MAX_TARGET_CHARS: usize = 512;

/// True when the target is short enough to be worth looking up. An
/// over-long target is refused as unknown WITHOUT being echoed.
pub fn target_within_bounds(target: &str) -> bool {
    target.chars().take(MAX_TARGET_CHARS + 1).count() <= MAX_TARGET_CHARS
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::docs_watch::{now_ms, WatchCtl};
    use nputer_index::{index, write_graph, IndexOptions};
    // `Path` is borrowed by `TempTree::root` and by nothing outside this
    // module, so it belongs to the test build alone — at the file head it
    // was an unused import on every non-test `cargo build` (T-236-s6).
    use std::path::Path;
    use std::sync::atomic::AtomicU64;
    use std::sync::{mpsc, Arc};

    /// Unique scratch dir under the system temp dir; removed on drop (the
    /// `index_cmd` local, for the same reason: `docs_watch`'s helper is
    /// test-private to its own module).
    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "nputer-t140s1-{}-{}-{}",
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
        /// A registry the Rust reader accepts, plus a small code tree, and
        /// the committed graph over it — i.e. a project the channel can
        /// actually answer about.
        fn seed(&self) -> &Self {
            self.write(
                "docs/architecture/components/C-01.md",
                "---\nid: C-01\nname: app\nlayer: app\nstatus: building\n\
                 paths: [app/**]\ndepends_on: [C-02]\ntouch_slugs: [app]\n---\n",
            );
            self.write(
                "docs/architecture/components/C-02.md",
                "---\nid: C-02\nname: lib\nlayer: lib\nstatus: verified\n\
                 paths: [lib/**]\ndepends_on: []\ntouch_slugs: [lib]\n---\n",
            );
            self.write("lib/base.ts", "export const base = 1;\n");
            self.write(
                "app/main.ts",
                "import { base } from \"../lib/base\";\nexport const main = base;\n",
            );
            self.write("stray.ts", "export const stray = 0;\n");
            let graph = index(&IndexOptions {
                root: self.0.clone(),
                ..Default::default()
            })
            .expect("index the seeded tree");
            write_graph(&graph, &self.0.join(GRAPH_REL_PATH)).expect("write graph");
            self
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

    #[test]
    fn with_no_project_and_no_docs_the_channel_says_so_rather_than_guessing() {
        assert!(matches!(
            run_rollup(&detached_state(None)),
            RollupOutcome::NoProject
        ));
        assert!(matches!(
            run_detail(&detached_state(None), "c:C-01"),
            DetailOutcome::NoProject
        ));

        let t = TempTree::new("nodocs");
        fs::remove_dir_all(t.root().join("docs")).expect("rm docs");
        let state = detached_state(Some(t.root().to_path_buf()));
        match run_rollup(&state) {
            RollupOutcome::NoDocs { project_dir } => {
                assert_eq!(project_dir, t.root().display().to_string());
            }
            other => panic!("expected NoDocs, got {other:?}"),
        }
    }

    #[test]
    fn a_project_whose_index_has_not_run_is_no_graph_and_not_an_error() {
        let t = TempTree::new("nograph");
        t.write("docs/tasks/T-001-x.md", "doc");
        let state = detached_state(Some(t.root().to_path_buf()));
        assert!(matches!(run_rollup(&state), RollupOutcome::NoGraph));
        assert!(matches!(
            run_detail(&state, "c:C-01"),
            DetailOutcome::NoGraph
        ));
    }

    /// THE HAPPY PATH, both halves, over a real indexed tree.
    #[test]
    fn the_channel_serves_the_rollup_at_rest_and_the_detail_on_a_pull() {
        let t = TempTree::new("happy");
        t.seed();
        let state = detached_state(Some(t.root().to_path_buf()));

        let RollupOutcome::Ready { rollup, graph_bytes } = run_rollup(&state) else {
            panic!("expected Ready, got {:?}", run_rollup(&state));
        };
        assert!(graph_bytes > 0, "the read reports the file it read");
        let counts: Vec<(&str, usize)> = rollup
            .components
            .iter()
            .map(|c| (c.id.as_str(), c.files))
            .collect();
        assert_eq!(
            counts,
            vec![("C-01", 1), ("C-02", 1), ("unmapped", 1)],
            "per-component file COUNTS, plus the synthetic node"
        );
        let edge = rollup
            .edges
            .iter()
            .find(|e| e.from == "C-01" && e.to == "C-02")
            .expect("the observed crossing rolls up");
        assert_eq!(edge.relation, "confirmed");
        assert!(edge.declared);
        assert_eq!(edge.observed, 1, "with its count");
        assert_eq!(rollup.stats.files, 3);
        assert_eq!(rollup.stats.unmapped, 1);

        // The pull, both shapes.
        let DetailOutcome::Answered { detail } = run_detail(&state, "c:C-01") else {
            panic!("expected Answered");
        };
        match detail {
            Detail::Component { id, files, total, truncated, .. } => {
                assert_eq!(id, "C-01");
                assert_eq!(files, vec!["app/main.ts".to_string()]);
                assert_eq!(total, 1);
                assert!(!truncated);
            }
            other => panic!("expected Component, got {other:?}"),
        }
        let DetailOutcome::Answered { detail } = run_detail(&state, "f:app/main.ts") else {
            panic!("expected Answered");
        };
        match detail {
            Detail::File { path, symbols, edges, neighbours, .. } => {
                assert_eq!(path, "app/main.ts");
                assert!(!symbols.is_empty(), "the T2 half arrives on the pull");
                assert!(
                    edges
                        .iter()
                        .any(|e| e.from == "f:app/main.ts" && e.to == "f:lib/base.ts"),
                    "the file's own edges ride its answer: {edges:?}"
                );
                assert!(
                    neighbours.contains(&"lib/base.ts".to_string()),
                    "and every file they name: {neighbours:?}"
                );
            }
            other => panic!("expected File, got {other:?}"),
        }
    }

    /// THE REFUSAL, at the channel's own boundary: a target the document
    /// does not hold is an ANSWER, named, and never an error and never an
    /// empty list that would read as "that component has no files".
    #[test]
    fn the_pull_refuses_an_unknown_target_by_name_over_a_real_project() {
        let t = TempTree::new("refusal");
        t.seed();
        let state = detached_state(Some(t.root().to_path_buf()));

        // Positive control: this channel, this project, DOES answer.
        assert!(matches!(
            run_detail(&state, "c:C-01"),
            DetailOutcome::Answered { detail: Detail::Component { .. } }
        ));

        for target in ["c:C-99", "f:app/nope.ts", "app/main.ts", "", "f:../../etc/passwd"] {
            match run_detail(&state, target) {
                DetailOutcome::Answered { detail: Detail::Unknown { target: echoed } } => {
                    assert_eq!(echoed, target, "the refusal names what it refused");
                }
                other => panic!("{target:?} must be refused by name, got {other:?}"),
            }
        }
    }

    #[test]
    fn an_over_long_target_is_out_of_bounds_before_it_is_ever_echoed() {
        assert!(target_within_bounds("c:C-01"));
        assert!(target_within_bounds(&"x".repeat(MAX_TARGET_CHARS)));
        assert!(!target_within_bounds(&"x".repeat(MAX_TARGET_CHARS + 1)));
        // Char-counted, not byte-counted: a multi-byte target of legal
        // LENGTH is legal (the bound is about echo size in a UI, and
        // truncating mid-codepoint is how that goes wrong).
        assert!(target_within_bounds(&"é".repeat(MAX_TARGET_CHARS)));
    }

    #[test]
    fn a_corrupt_graph_is_unreadable_and_says_which_remedy_applies() {
        let t = TempTree::new("corrupt");
        t.seed();
        t.write(GRAPH_REL_PATH, "{ this is not json");
        let state = detached_state(Some(t.root().to_path_buf()));
        match run_rollup(&state) {
            RollupOutcome::Unreadable { message } => {
                assert!(message.contains("re-indexing"), "message: {message}");
            }
            other => panic!("expected Unreadable, got {other:?}"),
        }
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_architecture_directory_is_refused_rather_than_followed() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("archlink");
        t.write("docs/keep.md", "doc");
        let outside = TempTree::new("archlink-target");
        fs::create_dir_all(outside.root().join("arch")).expect("mk target");
        fs::write(outside.root().join("arch").join("graph.json"), "{}").expect("plant");
        symlink(outside.root().join("arch"), t.root().join("docs/architecture"))
            .expect("dir symlink");
        let state = detached_state(Some(t.root().to_path_buf()));
        match run_rollup(&state) {
            RollupOutcome::Unreadable { message } => {
                assert!(message.contains("refusing"), "message: {message}");
            }
            other => panic!("expected Unreadable, got {other:?}"),
        }
    }
}
