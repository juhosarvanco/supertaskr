//! Golden fixtures + the determinism properties (plan §8).
//!
//! Goldens are compared as BYTES (string equality, not JSON equality).
//! Regenerate with: NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index

mod common;

use std::path::Path;

use nputer_index::{index, stable_json, IndexOptions};

const FIXTURES: [&str; 3] = ["ts-basic", "ts-paths-alias", "mixed"];

fn opts(root: &Path, cache_dir: Option<&Path>) -> IndexOptions {
    IndexOptions {
        root: root.to_path_buf(),
        cache_dir: cache_dir.map(Path::to_path_buf),
        ..Default::default()
    }
}

fn indexed(root: &Path, cache_dir: Option<&Path>) -> String {
    stable_json(&index(&opts(root, cache_dir)).expect("index fixture"))
}

fn check_fixture(name: &str) {
    let tree = common::materialize_fixture(name);
    let actual = indexed(tree.root(), None);
    let golden_path = common::fixture_source(name).join("expected-graph.json");
    if common::update_golden() {
        std::fs::write(&golden_path, actual.as_bytes()).expect("write golden");
        return;
    }
    let expected = std::fs::read(&golden_path).unwrap_or_default();
    assert_eq!(
        actual.as_bytes(),
        expected.as_slice(),
        "byte mismatch against {name}/expected-graph.json — regenerate deliberately with NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index"
    );
}

#[test]
fn ts_basic_matches_golden() {
    check_fixture("ts-basic");
}

#[test]
fn ts_paths_alias_matches_golden() {
    check_fixture("ts-paths-alias");
}

#[test]
fn mixed_matches_golden() {
    check_fixture("mixed");
}

#[test]
fn fixtures_index_identically_twice() {
    for name in FIXTURES {
        let tree = common::materialize_fixture(name);
        let one = indexed(tree.root(), None);
        let two = indexed(tree.root(), None);
        assert_eq!(one, two, "{name}: two consecutive runs must be byte-identical");
    }
}

#[test]
fn cold_and_warm_cache_yield_identical_bytes() {
    for name in FIXTURES {
        let tree = common::materialize_fixture(name);
        let cache = common::TempTree::new("golden-cache");
        let uncached = indexed(tree.root(), None);
        let cold = indexed(tree.root(), Some(cache.root()));
        let warm = indexed(tree.root(), Some(cache.root()));
        assert_eq!(cold, warm, "{name}: warm cache must not change bytes");
        assert_eq!(uncached, cold, "{name}: cache must not change bytes at all");
    }
}

#[test]
fn different_materialization_paths_yield_identical_bytes() {
    // No absolute paths in the payload => goldens are
    // relocation-independent.
    for name in FIXTURES {
        let a = common::materialize_fixture(name);
        let b = common::materialize_fixture(name);
        assert_ne!(a.root(), b.root());
        assert_eq!(
            indexed(a.root(), None),
            indexed(b.root(), None),
            "{name}: checkout location must not leak into the payload"
        );
    }
}

#[test]
fn incremental_reindex_after_an_edit_matches_a_fresh_index() {
    let tree = common::materialize_fixture("ts-basic");
    let cache = common::TempTree::new("golden-incr");
    let _ = indexed(tree.root(), Some(cache.root())); // populate cache

    // Edit one file; the warm incremental result must equal a fresh
    // no-cache index of the changed tree, byte for byte.
    tree.write(
        "src/alpha-new.ts",
        "export const added = 1;\n",
    );
    tree.write(
        "src/old-helper.cts",
        "export const fromCts = 99;\n",
    );
    let warm_after_edit = indexed(tree.root(), Some(cache.root()));
    let fresh = indexed(tree.root(), None);
    assert_eq!(warm_after_edit, fresh);
    assert!(warm_after_edit.contains("\"alpha-new\"") || warm_after_edit.contains("alpha-new.ts"));
}
