//! T-139 — the emit budget's DEGRADED state, exercised end to end
//! through the public `index()` rather than documented.
//!
//! `emit::apply_budget`'s own unit tests drive `apply_budget` directly
//! with hand-built `Graph` values, which proves the algorithm. What
//! NOTHING drove until this file is the FIELD: at this ref, before it,
//! `IndexOptions::max_graph_bytes` was never set to a non-default value
//! anywhere in the repository, so the wire between the option and the
//! emitter — `lib.rs:221` — was carried by inspection alone. These tests
//! index a real tree with a real budget and assert what SURVIVES.
//!
//! WHAT SURVIVES IS THE ASSERTION, AND THAT IS DELIBERATE. "Something
//! was dropped" is what a truncation and a catastrophe have in common;
//! the property worth pinning is that a graph over budget is still a
//! WORKING graph — every file present, every `import` edge present, no
//! dangling `s:` reference, and the loss recorded in `stats` where a
//! reader can find it. A test that only checked that symbols went would
//! pass just as happily on an emitter that had dropped half the files.

mod common;

use std::collections::BTreeSet;

use nputer_index::{index, stable_json, IndexOptions};

use common::TempTree;

/// A tree whose graph is comfortably over any small budget: enough files
/// that symbol blocks dominate, and enough imports that dropping symbols
/// has `call`-edge consequences.
fn crowded_tree(tag: &str) -> TempTree {
    let t = TempTree::new(tag);
    t.write(
        "src/lib.ts",
        "export function one() { return 1; }\n\
         export function two() { return 2; }\n\
         export function three() { return 3; }\n\
         export function four() { return 4; }\n\
         export function five() { return 5; }\n",
    );
    for i in 0..12 {
        t.write(
            &format!("src/m{i:02}.ts"),
            &format!(
                "import {{ one, two, three }} from \"./lib\";\n\
                 export const alpha{i:02} = () => one();\n\
                 export const beta{i:02} = () => two();\n\
                 export const gamma{i:02} = () => three();\n\
                 export class Delta{i:02} {{ run() {{ return alpha{i:02}(); }} }}\n"
            ),
        );
    }
    t
}

fn opts(root: &std::path::Path, budget: usize) -> IndexOptions {
    IndexOptions {
        root: root.to_path_buf(),
        max_graph_bytes: budget,
        ..Default::default()
    }
}

/// The whole degraded contract in one body, asserted on the SURVIVORS.
///
/// The full graph is measured first and is the POSITIVE CONTROL for every
/// clause below: the same tree at a generous budget keeps its symbols,
/// carries no truncation flags, and is the file/edge set the truncated
/// run is compared against. Without it, "13 files survived" would be a
/// claim about the fixture rather than about the emitter.
#[test]
fn a_graph_driven_over_the_budget_keeps_its_files_and_its_import_edges() {
    let t = crowded_tree("budget-degrade");

    // Control: no budget pressure at all.
    let full = index(&opts(t.root(), 10_000_000)).expect("index full");
    let full_bytes = stable_json(&full).len();
    assert_eq!(full.stats.truncated_symbols, None, "control must be untruncated");
    assert_eq!(full.stats.truncated_files, None, "control must be untruncated");
    assert!(full.stats.symbols > 40, "control carries symbols: {}", full.stats.symbols);
    let full_imports: BTreeSet<(String, String)> = full
        .edges
        .iter()
        .filter(|e| e.kind == "import")
        .map(|e| (e.from.clone(), e.to.clone()))
        .collect();
    assert!(!full_imports.is_empty(), "control carries import edges");

    // Squeeze: a budget well under the full document, comfortably over
    // the floor, so truncation is partial and the survivors are visible.
    let budget = full_bytes / 2;
    let cut = index(&opts(t.root(), budget)).expect("index squeezed");
    let cut_json = stable_json(&cut);

    // 1. IT FITS.
    assert!(
        cut_json.len() <= budget,
        "over budget after truncation: {} > {budget}",
        cut_json.len()
    );

    // 2. EVERY FILE SURVIVES — this is the clause that separates a
    //    truncation from a catastrophe.
    let full_paths: Vec<&str> = full.files.iter().map(|f| f.path.as_str()).collect();
    let cut_paths: Vec<&str> = cut.files.iter().map(|f| f.path.as_str()).collect();
    assert_eq!(cut_paths, full_paths, "files are never dropped");
    assert_eq!(cut.stats.files, full.stats.files);

    // 3. EVERY IMPORT EDGE SURVIVES — the drift derivation reads these,
    //    so losing one would move the architecture map silently.
    let cut_imports: BTreeSet<(String, String)> = cut
        .edges
        .iter()
        .filter(|e| e.kind == "import")
        .map(|e| (e.from.clone(), e.to.clone()))
        .collect();
    assert_eq!(cut_imports, full_imports, "import edges are never dropped");

    // 4. SOMETHING WAS ACTUALLY GIVEN UP, and it was symbols.
    assert!(
        cut.stats.symbols < full.stats.symbols,
        "the fixture did not exercise truncation at all: {} symbols either way",
        cut.stats.symbols
    );
    assert_eq!(cut.stats.truncated_symbols, Some(true), "the loss is flagged");
    let truncated_files = cut.stats.truncated_files.expect("truncated_files is set");
    assert!(truncated_files > 0);
    assert_eq!(
        truncated_files,
        cut.files
            .iter()
            .filter(|f| f.symbols.is_empty())
            .filter(|f| full
                .files
                .iter()
                .any(|g| g.path == f.path && !g.symbols.is_empty()))
            .count(),
        "truncated_files counts the arrays this run EMPTIED, not the empty ones"
    );

    // 5. NO DANGLING `s:` REFERENCE. Every symbol id an edge names is
    //    still in the document — the invariant that keeps a degraded
    //    graph parseable rather than merely smaller.
    let live: BTreeSet<&str> = cut
        .files
        .iter()
        .flat_map(|f| f.symbols.iter())
        .map(|s| s.id.as_str())
        .collect();
    for edge in &cut.edges {
        if edge.kind == "import" {
            continue;
        }
        for id in [&edge.from, &edge.to] {
            if id.starts_with("s:") {
                assert!(live.contains(id.as_str()), "dangling symbol id {id} in a {} edge", edge.kind);
            }
        }
    }

    // 6. THE STATS AGREE WITH THE DOCUMENT.
    assert_eq!(cut.stats.symbols, cut.files.iter().map(|f| f.symbols.len()).sum::<usize>());
    assert_eq!(cut.stats.edges, cut.edges.len());
}

/// THE FLOOR: a budget nothing can meet. `apply_budget` empties every
/// symbol array and then emits the OVER-budget document anyway, flagged
/// — it never drops a file to make the number work. This is the case
/// `max_graph_bytes` cannot protect against, and therefore the case the
/// collector's cap has to be far enough above.
#[test]
fn under_an_impossible_budget_the_graph_is_still_emitted_and_still_flagged() {
    let t = crowded_tree("budget-floor");
    let floored = index(&opts(t.root(), 1)).expect("index at an impossible budget");
    let doc = stable_json(&floored);

    assert!(doc.len() > 1, "the floor is over budget by construction");
    assert_eq!(floored.stats.symbols, 0, "every symbol array emptied");
    assert_eq!(floored.stats.truncated_symbols, Some(true));
    assert!(!floored.files.is_empty(), "files are never dropped, even here");
    assert!(
        floored.edges.iter().any(|e| e.kind == "import"),
        "import edges are never dropped, even here"
    );
    assert!(
        floored.edges.iter().all(|e| e.kind == "import"),
        "with no symbols left, no call/type_ref edge can survive: {:?}",
        floored
            .edges
            .iter()
            .filter(|e| e.kind != "import")
            .map(|e| e.kind.as_str())
            .collect::<Vec<_>>()
    );
    // And the emitted floor is still a graph a reader can parse.
    let reparsed: nputer_index::Graph = serde_json::from_str(&doc).expect("the floor is valid JSON");
    assert_eq!(reparsed.stats.files, floored.stats.files);
}

/// The default budget reaches the emitter. `lib.rs:221` is one line and
/// nothing exercised it, so a refactor that read the option and passed a
/// constant would have been invisible: this indexes one tree twice, at
/// two budgets, and requires the documents to DIFFER.
#[test]
fn the_budget_option_is_what_the_emitter_uses() {
    let t = crowded_tree("budget-wired");
    let generous = stable_json(&index(&opts(t.root(), 10_000_000)).expect("generous"));
    let mean = stable_json(&index(&opts(t.root(), generous.len() / 2)).expect("mean"));
    assert!(
        mean.len() < generous.len(),
        "the option did not reach apply_budget: {} vs {}",
        mean.len(),
        generous.len()
    );
    assert!(
        generous.contains("\"symbols\": ["),
        "the generous run must carry symbol arrays to have something to lose"
    );
}
