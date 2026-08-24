//! Golden fixtures + the determinism properties (plan §8).
//!
//! Goldens are compared as BYTES (string equality, not JSON equality).
//! Regenerate with: NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index

mod common;

use std::path::Path;

use nputer_index::{index, stable_json, IndexOptions};

const FIXTURES: [&str; 4] = ["ts-basic", "ts-paths-alias", "mixed", "rust-workspace"];

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
fn rust_workspace_matches_golden() {
    check_fixture("rust-workspace");
}

/// The golden pins the BYTES; this pins the FACTS the bytes are supposed
/// to carry, so a regeneration that quietly lost half the Rust support
/// cannot pass by agreeing with itself (the golden's own poison hazard —
/// `NPUTER_UPDATE_GOLDEN=1` moves both sides at once).
#[test]
fn rust_workspace_carries_every_shape_the_criteria_name() {
    let tree = common::materialize_fixture("rust-workspace");
    let graph = index(&opts(tree.root(), None)).expect("index rust fixture");

    // Both languages on ONE walk.
    assert_eq!(graph.languages, vec!["rust", "ts"]);

    // Every kind the criteria name, from the crate root.
    let root = graph
        .files
        .iter()
        .find(|f| f.path == "app/src/lib.rs")
        .expect("app/src/lib.rs");
    let kinds: Vec<(&str, &str, bool)> = root
        .symbols
        .iter()
        .map(|s| (s.name.as_str(), s.kind.as_str(), s.exported))
        .collect();
    for expected in [
        ("boot", "fn", true),
        ("Root", "struct", true),
        ("Mode", "enum", true),
        ("Describe", "trait", true),
        ("impl Describe for Root", "impl", false),
        ("engine", "mod", true),
        ("shout", "macro", false),
        ("VERSION", "const", true),
        ("Alias", "type", true),
        // `pub(self)` is the one `pub` spelling that is not an export.
        ("private_by_restriction", "fn", false),
    ] {
        assert!(kinds.contains(&expected), "missing {expected:?} in {kinds:?}");
    }
    // Ranges are 1-based inclusive and non-degenerate for a block item.
    let describe_impl = root
        .symbols
        .iter()
        .find(|s| s.name == "impl Describe for Root")
        .expect("impl symbol");
    assert!(
        describe_impl.range[0] < describe_impl.range[1],
        "impl block spans rows: {:?}",
        describe_impl.range
    );

    let edge = |from: &str, to: &str| {
        graph
            .edges
            .iter()
            .find(|e| e.from == format!("f:{from}") && e.to == format!("f:{to}"))
            .cloned()
    };

    // The module tree: mod.rs form, sibling form, #[path], a bin target's
    // neighbour, a tests/ target's `mod common;`, and another workspace
    // crate reached by its package name with the hyphen swapped.
    for (from, to) in [
        ("app/src/lib.rs", "app/src/engine/runner.rs"),
        ("app/src/lib.rs", "app/src/util.rs"),
        ("app/src/engine/runner.rs", "app/src/engine/mod.rs"),
        ("app/src/relocated/elsewhere.rs", "app/src/util.rs"),
        ("app/src/bin/tool.rs", "app/src/bin/helper.rs"),
        ("app/tests/integration.rs", "app/tests/common/mod.rs"),
        ("app/src/lib.rs", "core/src/types.rs"),
        ("app/src/main.rs", "app/src/lib.rs"),
    ] {
        assert!(edge(from, to).is_some(), "no file edge {from} -> {to}");
    }

    // `pub use` is a re-export; a plain `use` on the same pair is not.
    let reexport = edge("core/src/lib.rs", "core/src/types.rs").expect("core reexport edge");
    assert_eq!(reexport.reexport, Some(true));
    assert_eq!(reexport.symbols, Some(vec!["Shape".to_string()]));
    let mixed = edge("app/src/lib.rs", "app/src/util.rs").expect("util edge");
    assert_eq!(
        mixed.reexport, None,
        "`pub use util::Helper` merged with `use crate::util::Helper` is not all-reexport"
    );

    // External crates are cargo package nodes, id == "p:" + name.
    let names: Vec<&str> = graph.packages.iter().map(|p| p.name.as_str()).collect();
    assert!(names.contains(&"cargo:serde"), "packages: {names:?}");
    assert!(names.contains(&"cargo:std"), "packages: {names:?}");
    for pkg in &graph.packages {
        assert_eq!(pkg.id, format!("p:{}", pkg.name));
        if pkg.name.starts_with("cargo:") {
            assert_eq!(pkg.ecosystem, "cargo");
        }
    }
    // A workspace sibling is a FILE edge, never a package node.
    assert!(
        !names.iter().any(|n| n.contains("demo_core")),
        "demo_core resolves to files: {names:?}"
    );

    // An unresolvable path is recorded and the run continues — with the
    // POSITIVE CONTROL beside it: the same file's `std::fmt` resolved.
    let stray: Vec<&str> = graph
        .unresolved
        .iter()
        .filter(|u| u.from == "f:orphan/stray.rs")
        .map(|u| u.specifier.as_str())
        .collect();
    assert_eq!(stray, vec!["crate::missing::Thing"]);
    assert_eq!(
        graph
            .unresolved
            .iter()
            .find(|u| u.from == "f:orphan/stray.rs")
            .map(|u| u.reason.as_str()),
        Some("not_found")
    );
    assert!(
        edge("orphan/stray.rs", "app/src/lib.rs").is_none(),
        "an unrooted file guesses at no crate root"
    );
    assert!(
        graph
            .edges
            .iter()
            .any(|e| e.from == "f:orphan/stray.rs" && e.to == "p:cargo:std"),
        "the positive control: the same file's std:: use DID resolve"
    );
    assert!(
        graph
            .files
            .iter()
            .any(|f| f.path == "orphan/stray.rs" && f.symbols.iter().any(|s| s.name == "stray")),
        "…and the file was extracted rather than skipped"
    );
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
