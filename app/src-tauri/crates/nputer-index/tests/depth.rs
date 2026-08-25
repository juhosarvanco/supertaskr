//! T-129 — pathological nesting is REFUSED and RECORDED, never an abort.
//!
//! WHY THIS FILE EXISTS AT THE PIPELINE LEVEL when `src/extract/*.rs`
//! already pins each traversal in isolation: the defect was never that
//! one function recursed, it was that `index()` — which runs INSIDE the
//! Tauri app's process behind the zero-argument `index_repo` command —
//! took the whole process down with it. A Rust stack overflow is an
//! `abort()`, not a catchable panic, so there is no `catch_unwind` that
//! helps and no error path that runs: the window, the docs watcher, the
//! agent runner and any interview mid-turn go with it. The property
//! worth pinning is therefore `index()` RETURNING, and only a body that
//! drives the whole pipeline can pin it.
//!
//! EVERY BODY HERE FAILS AGAINST THE PRE-FIX TREE — and it fails as
//! **exit 134**, not as a red assertion, because an abort is not a test
//! failure. A harness that reads only pass/fail counts reports a crashed
//! child as nothing at all. Read the binary's exit code.
//!
//! FIXTURES ARE GENERATED INTO A TEMP TREE AT RUN TIME. A file with 20
//! 000 path segments does not belong in a repository, and none of these
//! shapes is committed anywhere.
//!
//! EVERY DEPTH BELOW IS A LITERAL. Nothing here can see
//! `extract::MAX_DEPTH` (it is `pub(crate)`), which is the structural
//! form of "a test parametrised by the constant it checks cannot pin
//! that constant".

mod common;

use nputer_index::{index, DepthSite, IndexOptions};

// ---- generators (in memory, written to a temp tree) ----------------------

/// `mod m0 { mod m1 { … } }` — n levels, with a `use` at the bottom.
fn nested_mods(n: usize) -> String {
    let mut s = String::new();
    for i in 0..n {
        s.push_str(&format!("mod m{i} {{\n"));
    }
    s.push_str("use marker::Deep;\n");
    for _ in 0..n {
        s.push_str("}\n");
    }
    s
}

/// `use a0::{a1::{ … Deep … }};` — n nested groups.
fn nested_use_groups(n: usize) -> String {
    let mut s = String::from("use ");
    for i in 0..n {
        s.push_str(&format!("a{i}::{{"));
    }
    s.push_str("Deep");
    for _ in 0..n {
        s.push('}');
    }
    s.push_str(";\n");
    s
}

/// `use s0::s1:: … ;` — one path, n segments.
fn long_path(n: usize) -> String {
    let segments: Vec<String> = (0..n).map(|i| format!("s{i}")).collect();
    format!("use {};\n", segments.join("::"))
}

/// `declare declare … const deepConst: number;` — n keywords.
fn declare_chain(n: usize) -> String {
    let mut s = String::new();
    for _ in 0..n {
        s.push_str("declare ");
    }
    s.push_str("const deepConst: number;\n");
    s
}

/// `const { k0: { … deepBinding … } } = obj;` — n nested pairs.
fn nested_binding_pattern(n: usize) -> String {
    let mut s = String::from("const ");
    for i in 0..n {
        s.push_str(&format!("{{ k{i}: "));
    }
    s.push_str("deepBinding");
    for _ in 0..n {
        s.push_str(" }");
    }
    s.push_str(" = obj;\n");
    s
}

/// `export const deepValue = { k0: { … deepCall() … } };` — n levels.
fn nested_object_value(n: usize) -> String {
    let mut s = String::from("export const deepValue = ");
    for i in 0..n {
        s.push_str(&format!("{{ k{i}: "));
    }
    s.push_str("deepCall()");
    for _ in 0..n {
        s.push_str(" }");
    }
    s.push_str(";\n");
    s
}

fn indexed(tree: &common::TempTree) -> nputer_index::Graph {
    index(&IndexOptions {
        root: tree.root().to_path_buf(),
        ..Default::default()
    })
    .expect("index returns rather than aborting")
}

// ---- the pins ------------------------------------------------------------

#[test]
fn a_pathological_file_is_indexed_and_recorded_rather_than_aborting_the_process() {
    let t = common::TempTree::new("t129-abort");
    // The card's own worst row: 20 000 path segments. On the pre-fix
    // tree this is `fatal runtime error: stack overflow` and exit 134.
    t.write("hostile.rs", &long_path(20_000));
    // A neighbour, so "it was refused" cannot be satisfied by a run in
    // which nothing was extracted at all.
    t.write("neighbour.ts", "export function ordinary() { return helper(); }\n");

    let g = indexed(&t);

    let hostile = g
        .files
        .iter()
        .find(|f| f.path == "hostile.rs")
        .expect("the hostile file is RECORDED, not dropped from the graph");
    assert_eq!(
        hostile.depth_refused,
        Some(DepthSite::RustPathSegments),
        "the refusal names the traversal that stopped"
    );
    assert_eq!(
        g.stats.depth_limited,
        Some(1),
        "counted, never silent — the rule `skipped` already follows"
    );

    // POSITIVE CONTROL at the pipeline level.
    let neighbour = g
        .files
        .iter()
        .find(|f| f.path == "neighbour.ts")
        .expect("neighbour.ts indexed");
    assert_eq!(neighbour.depth_refused, None);
    assert_eq!(
        neighbour
            .symbols
            .iter()
            .map(|s| s.name.as_str())
            .collect::<Vec<_>>(),
        vec!["ordinary"],
        "an ordinary file beside a refused one is untouched"
    );
    assert_eq!(g.stats.files, 2);
}

#[test]
fn every_bounded_traversal_is_reachable_from_a_real_file_and_names_itself() {
    // A COVERAGE FLOOR, not a tally (CONVENTIONS' shape five): the
    // assertion is over the SET of sites, so deleting one bound — or
    // deleting the file that drives it — changes the set and reds here.
    // A printed count would not.
    //
    // EVERY DEPTH HERE IS PAST THE PRE-FIX ABORT THRESHOLD, not merely
    // past the bound, so this body fails against the pre-fix tree the
    // way the defect actually presented — exit 134 — rather than as a
    // compile error about a field that did not exist yet. Measured
    // against a binary built from `ae16fbe`, one file at a time: 6 000
    // modules, 4 000 groups, 20 000 segments, 12 000 `declare`s, 5 000
    // pattern pairs and a 5 000-deep value each abort on their own.
    let t = common::TempTree::new("t129-sites");
    t.write("mods.rs", &nested_mods(6_000));
    t.write("groups.rs", &nested_use_groups(4_000));
    t.write("path.rs", &long_path(20_000));
    t.write("declares.ts", &declare_chain(12_000));
    t.write("pattern.ts", &nested_binding_pattern(5_000));
    t.write("value.ts", &nested_object_value(5_000));
    // The seventh file is the control: without it the assertion below is
    // satisfied by a run that refused everything.
    t.write("plain.ts", "export const plain = 1;\n");

    let g = indexed(&t);

    let mut by_path: Vec<(&str, Option<&'static str>)> = g
        .files
        .iter()
        .map(|f| (f.path.as_str(), f.depth_refused.map(|s| s.as_str())))
        .collect();
    by_path.sort();
    assert_eq!(
        by_path,
        vec![
            ("declares.ts", Some("ts-module-statements")),
            ("groups.rs", Some("rust-use-tree")),
            ("mods.rs", Some("rust-mod-nesting")),
            ("path.rs", Some("rust-path-segments")),
            ("pattern.ts", Some("ts-binding-pattern")),
            ("plain.ts", None),
            ("value.ts", Some("ts-candidate-scan")),
        ],
        "one driver per bounded traversal, and one file that is not refused"
    );
    assert_eq!(g.stats.depth_limited, Some(6));
    assert_eq!(
        g.files
            .iter()
            .find(|f| f.path == "plain.ts")
            .expect("plain.ts")
            .symbols
            .len(),
        1,
        "the control file still extracts"
    );
}

#[test]
fn the_worst_legal_nesting_completes_on_a_small_explicit_stack() {
    // THE ARM-2 MEASUREMENT, kept as a pin rather than as a paragraph.
    // T-129's arm 2 — run the walk on a thread with a bigger explicit
    // stack — was RULED ON AND NOT TAKEN, because a bigger stack moves a
    // threshold where a bound removes one. What survives from that arm
    // is the question it was right about: how much stack does the
    // DEEPEST LEGAL input actually need? This body answers it from the
    // other end, by giving the walk a SMALL stack and requiring it to
    // finish.
    //
    // The input maximises three bounded traversals AT ONCE, because they
    // nest: `declarations` (256 inline modules) does not unwind before
    // it calls `use_declaration`, which does not unwind before
    // `use_tree` (128 groups), which does not unwind before
    // `collect_segments` (257 segments). That is the worst stack this
    // crate can be asked to build without any traversal refusing.
    //
    // IF THIS BODY EVER ABORTS INSTEAD OF FAILING, that is the finding
    // and not a harness fault: read the binary's exit code, not the
    // pass/fail counts. It is what a raised bound looks like from here,
    // and it is strictly better news than the app aborting.
    let deep_segments: Vec<String> = (0..129).map(|i| format!("s{i}")).collect();
    let mut inner = String::from("use ");
    for i in 0..64 {
        inner.push_str(&format!("g{i}::{{"));
    }
    inner.push_str(&deep_segments.join("::"));
    for _ in 0..64 {
        inner.push('}');
    }
    inner.push_str(";\n");

    let mut source = String::new();
    for i in 0..128 {
        source.push_str(&format!("mod m{i} {{\n"));
    }
    source.push_str(&inner);
    for _ in 0..128 {
        source.push_str("}\n");
    }

    let t = common::TempTree::new("t129-stack");
    t.write("worst.rs", &source);
    let root = t.root().to_path_buf();

    // 2 MiB — EXACTLY what a plain `std::thread` gets, spelled out so
    // that the pin says the thing a caller needs: the worst legal input
    // fits in the smallest stack this crate can plausibly be handed.
    // Measured at `ae16fbe` on this machine, debug profile: this input
    // needs between 512 KiB and 640 KiB, so the margin here is ~3.2x;
    // on a release build it needs between 128 KiB and 192 KiB. The UNBOUNDED forms of
    // the same three shapes abort at 3 000 / 5 000 / 20 000 on the 8 MiB
    // main stack, which is the class this bound removes.
    let handle = std::thread::Builder::new()
        .stack_size(2 * 1024 * 1024)
        .spawn(move || {
            index(&IndexOptions {
                root,
                ..Default::default()
            })
            .expect("index returns")
        })
        .expect("spawn");
    let g = handle.join().expect("the walk finished inside 512 KiB");

    let worst = &g.files[0];
    assert_eq!(
        worst.depth_refused, None,
        "every one of the three traversals is at its ceiling and none refused"
    );
    assert_eq!(g.stats.depth_limited, None);
    // And it did the work at the bottom: the innermost `use`, anchored
    // through all 256 inline modules.
    assert_eq!(worst.symbols.len(), 1, "one file-level `mod` symbol");
    assert_eq!(worst.symbols[0].name, "m0");
}
