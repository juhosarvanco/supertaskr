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
