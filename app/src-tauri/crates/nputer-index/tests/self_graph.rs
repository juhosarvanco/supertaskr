//! The dogfood: this repo's own graph (plan §7/§8).
//!
//! The default-suite half is content-INDEPENDENT (a determinism property
//! over whatever the tree holds right now), so `cargo test` stays
//! hermetic to unrelated TS edits and never dirties the working tree.
//! The byte-comparison against the committed docs/architecture/graph.json
//! is `#[ignore]`d — the manual `--check` stand-in until T-014:
//!
//!   cargo test -p nputer-index --test self_graph -- --ignored
//!
//! With NPUTER_UPDATE_GOLDEN=1 that run REWRITES the committed graph —
//! the mechanism by which docs/architecture/graph.json is produced.

mod common;

use nputer_index::{index, stable_json, IndexOptions, GRAPH_REL_PATH};

fn self_options() -> IndexOptions {
    IndexOptions {
        root: common::repo_root(),
        ..Default::default()
    }
}

#[test]
fn live_repo_indexes_deterministically() {
    let one = stable_json(&index(&self_options()).expect("index self"));
    let two = stable_json(&index(&self_options()).expect("index self again"));
    assert_eq!(one, two, "same tree must serialize byte-identically");
    assert!(!one.is_empty());
}

#[test]
fn live_repo_walk_respects_the_dogfood_nputerignore() {
    // Content-independent shape checks: docs/ is the brain, not the
    // codebase (root .nputerignore), and dependency trees never walk.
    let graph = index(&self_options()).expect("index self");
    for file in &graph.files {
        assert!(
            !file.path.starts_with("docs/"),
            "docs/ must be excluded by the root .nputerignore: {}",
            file.path
        );
        assert!(
            !file.path.contains("node_modules/"),
            "node_modules is hard-skipped: {}",
            file.path
        );
        assert!(
            !file.path.contains("tests/fixtures/"),
            "fixture trees are config-excluded from the map: {}",
            file.path
        );
    }
}

/// THE LIVE CASE, AND IT IS THE FINDING ITSELF (T-135, closing
/// `T-126-s4`).
///
/// `app/src-tauri/src/lib.rs` writes `pub mod dispatch;` and reaches the
/// dispatch module through it. That is the strongest dependency Rust has
/// — delete the line and the whole component compiles into nothing, which
/// is exactly what happened on T-126 — and until T-135 it produced ZERO
/// edges, so the graph rated `dispatch/mod.rs` an isolated node.
///
/// DELIBERATELY CONTENT-DEPENDENT, against the rest of this file's grain
/// (the module doc calls the default-suite half content-INDEPENDENT).
/// The two ways this body can red are the two things worth knowing: the
/// `mod` fix regressed, or somebody removed `pub mod dispatch;` again. It
/// is asserted against a FRESH index rather than the committed
/// graph.json, because committing that file is the checkpoint's and not
/// a lane's.
///
/// The second assertion is the POSITIVE CONTROL for the first: the same
/// file's `use`-derived edges are still there, so a red above is the
/// `mod` half failing rather than the whole self-index having gone quiet.
#[test]
fn a_mod_declaration_is_an_edge_in_this_repositorys_own_graph() {
    let graph = index(&self_options()).expect("index self");
    let has = |from: &str, to: &str| {
        graph
            .edges
            .iter()
            .any(|e| e.from == format!("f:{from}") && e.to == format!("f:{to}") && e.kind == "import")
    };
    assert!(
        has(
            "app/src-tauri/src/lib.rs",
            "app/src-tauri/src/dispatch/mod.rs"
        ),
        "T-126-s4: `pub mod dispatch;` is a real dependency and must carry an edge"
    );
    assert!(
        has("app/src-tauri/src/lib.rs", "app/src-tauri/src/churn.rs"),
        "positive control: the `use`-derived edges are still present"
    );
}

#[test]
#[ignore = "byte-compares the committed graph.json; run explicitly (see module docs)"]
fn self_graph_is_current() {
    let root = common::repo_root();
    let graph = index(&self_options()).expect("index self");
    let committed = root.join(GRAPH_REL_PATH);
    if common::update_golden() {
        let changed = nputer_index::write_graph(&graph, &committed).expect("write graph");
        eprintln!(
            "self_graph_is_current: regenerated {} (changed: {changed})",
            committed.display()
        );
        return;
    }
    let expected = std::fs::read(&committed).unwrap_or_default();
    let actual = stable_json(&graph);
    assert_eq!(
        actual.as_bytes(),
        expected.as_slice(),
        "committed {} is stale — regenerate deliberately with NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored",
        GRAPH_REL_PATH
    );
}
