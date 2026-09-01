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
        // T-135: THE `mod` DECLARATION IS ITSELF AN EDGE. Both of these
        // are declared by `mod` and named in no `use` anywhere, so both
        // are ABSENT from the pre-T-135 graph — which is what makes this
        // pair of rows a pin rather than a restatement (`T-080-s1`: a pin
        // that passes against the pre-fix tree pins nothing).
        //
        //   `pub mod engine;`                       -> engine/mod.rs
        //   `#[path = "relocated/elsewhere.rs"]`    -> the relocation, and
        //                                              the only inbound
        //                                              edge that file has
        ("app/src/lib.rs", "app/src/engine/mod.rs"),
        ("app/src/lib.rs", "app/src/relocated/elsewhere.rs"),
    ] {
        assert!(edge(from, to).is_some(), "no file edge {from} -> {to}");
    }

    // A `mod`-ONLY edge is the weakest occurrence there is: it binds no
    // name out of the target and asserts no re-export, so it carries
    // neither field. `pub mod engine;` is `pub`, and this is the row that
    // says `pub`-ness is NOT what `reexport` means.
    let mod_only = edge("app/src/lib.rs", "app/src/engine/mod.rs").expect("mod edge");
    assert_eq!(mod_only.kind, "import", "the `mod` edge rides the closed kind vocabulary");
    assert_eq!(mod_only.symbols, None, "`mod x;` imports no name");
    assert_eq!(mod_only.reexport, None, "`pub mod x;` is not an `export … from`");

    // `pub use` is a re-export; a plain `use` on the same pair is not.
    //
    // AND THE T-135 REGRESSION THIS PAIR NOW ALSO GUARDS: `core/src/lib.rs`
    // writes BOTH `pub mod types;` and `pub use types::Shape;`, so the
    // `mod` occurrence merges into an existing all-reexport edge. It must
    // change NOTHING — not the flag, not the symbol list. A `mod`
    // occurrence spelled with `reexport: false` clears the flag here, and
    // one spelled with the module's own name adds "types" to the list;
    // both were live alternatives and both are wrong.
    let reexport = edge("core/src/lib.rs", "core/src/types.rs").expect("core reexport edge");
    assert_eq!(reexport.reexport, Some(true));
    assert_eq!(reexport.symbols, Some(vec!["Shape".to_string()]));
    let mixed = edge("app/src/lib.rs", "app/src/util.rs").expect("util edge");
    assert_eq!(
        mixed.reexport, None,
        "`pub use util::Helper` merged with `use crate::util::Helper` is not all-reexport"
    );
    assert_eq!(
        mixed.symbols,
        Some(vec!["Helper".to_string()]),
        "and `pub mod util;` on the same pair adds no name of its own"
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

/// Clear every write bit — the PORTABLE spelling, so this control needs no
/// `cfg` and therefore cannot quietly vanish on a platform.
fn make_read_only(path: &Path) {
    let mut perms = std::fs::metadata(path)
        .expect("stat the manufactured source")
        .permissions();
    perms.set_readonly(true);
    std::fs::set_permissions(path, perms).expect("chmod the manufactured source read-only");
}

fn is_writable(path: &Path) -> bool {
    !std::fs::metadata(path)
        .expect("stat")
        .permissions()
        .readonly()
}

/// THE POSITIVE CONTROL FOR `common::copy_dir`'s UNLOCK (T-216-s4).
///
/// The body above EDITS a materialized fixture, and `fs::copy` copies the
/// source's permission bits — so under T-210's physical fence layer, which
/// makes every tracked file OUTSIDE a lane's fence `-r--r--r--`, it
/// panicked with `PermissionDenied` inside `common/mod.rs`'s
/// `TempTree::write` rather than running. `cli.rs`'s
/// `a_cycle_planted_into_a_fixture_reds_the_real_process_and_is_named_as_a_path`
/// is the same defect one file over. Both are repaired in `common::unlock`,
/// and NEITHER of them can be that repair's control: they are green with
/// the repair and green without it in any checkout the layer has not
/// touched.
///
/// SO THE SOURCE IS MANUFACTURED READ-ONLY HERE RATHER THAN FOUND
/// READ-ONLY, and that is the whole design of this body. The defect's
/// precondition is a property of the CHECKOUT, not of the tree: in the
/// integration checkout, and in the detached worktree a poison drill runs
/// in (docs/CONVENTIONS.md), `tests/fixtures/**` is `644` — so a mutant
/// that deleted the unlock would SURVIVE against the ambient tree and the
/// drill would report a kill it never made. Building the mode into the
/// fixture makes this body kill that mutant in every checkout, armed or
/// not.
#[test]
fn a_materialized_fixture_is_writable_even_when_its_source_is_read_only() {
    // NOT a docs-shaped literal, deliberately: `docs-scan.mjs` classifies
    // docs-shaped path literals in Rust sources as DOCS SITES, and a
    // fixture path that is really a temp-tree path has no business in that
    // census. The property under test is a MODE, and a mode has no opinion
    // about the spelling of the path carrying it.
    const REL: &str = "registry/C-01-core.md";
    let source = common::TempTree::new("ro-source");
    source.write(REL, "---\nid: C-01\nname: Core\n---\n");
    let planted = source.root().join(REL);
    make_read_only(&planted);
    // THE PRECONDITION, ASSERTED RATHER THAN ASSUMED: a filesystem that
    // ignored the chmod would satisfy every assertion below for a reason
    // that has nothing to do with the property.
    assert!(
        !is_writable(&planted),
        "the manufactured source must be read-only, or this control controls nothing"
    );

    let tree = common::TempTree::new("ro-copy");
    common::copy_dir(source.root(), tree.root());
    let copy = tree.root().join(REL);

    assert!(
        is_writable(&copy),
        "a materialized fixture inherited its source's read-only mode"
    );
    // AND THE MODE IS NOT THE CLAIM — THE WRITE IS. This is the exact call
    // the two repaired bodies make, so a permission model where the bit and
    // the syscall disagree is answered by the syscall.
    std::fs::write(&copy, "---\nid: C-01\ndepends_on: [C-02]\n---\n")
        .expect("a materialized fixture must be editable");
}
