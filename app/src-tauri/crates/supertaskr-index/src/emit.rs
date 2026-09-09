//! Stable serializer, the size budget, and `write_graph` (plan §7).
//!
//! Serializer: serde_json `PrettyFormatter` with 2-space indent +
//! trailing `\n`, LF only. Key order = struct declaration order matching
//! §3.1's layout — ADR-014's "sorted keys" read as its purpose (a
//! byte-stable, diffable order) rather than alphabetization; byte
//! identity is the tested contract.

use std::collections::BTreeSet;
use std::path::Path;

use serde::Serialize;

use crate::error::IndexError;
use crate::graph::{symbol_id_path, FileEntry, Graph};

pub(crate) fn stable_json_string(graph: &Graph) -> Result<String, IndexError> {
    let mut buf: Vec<u8> = Vec::with_capacity(64 * 1024);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"  ");
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    graph
        .serialize(&mut ser)
        .map_err(|e| IndexError::Serialize(e.to_string()))?;
    buf.push(b'\n');
    String::from_utf8(buf).map_err(|e| IndexError::Serialize(e.to_string()))
}

/// Serialize, byte-compare against the existing file, and write only if
/// changed (atomic temp + rename). The no-op-on-equal is load-bearing for
/// T-012's delivery loop: graph.json lives inside the watched docs/ tree,
/// and byte-identical determinism + write-only-if-changed is what
/// terminates the index-on-change cycle.
pub(crate) fn write_graph(graph: &Graph, path: &Path) -> Result<bool, IndexError> {
    let doc = stable_json_string(graph)?;
    if let Ok(existing) = std::fs::read(path) {
        if existing == doc.as_bytes() {
            return Ok(false);
        }
    }
    let write_err = |source: std::io::Error| IndexError::Write {
        path: path.to_path_buf(),
        source,
    };
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(write_err)?;
        }
    }
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("graph.json");
    let tmp = path.with_file_name(format!(".{name}.tmp-{}", std::process::id()));
    std::fs::write(&tmp, doc.as_bytes()).map_err(write_err)?;
    std::fs::rename(&tmp, path).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        write_err(e)
    })?;
    Ok(true)
}

/// The size budget (plan §7). If the serialized graph exceeds
/// `max_graph_bytes`: drop symbol arrays (`symbols: []`) greedily from
/// the largest serialized symbol-block downward (tie: path asc) until the
/// projected size fits; drop call/type_ref edges referencing dropped
/// symbols (no dangling `s:` ids); set `stats.truncated_symbols` +
/// `stats.truncated_files`. Files and import edges are NEVER dropped —
/// at the floor the valid over-budget graph is emitted anyway, flagged.
///
/// **AND IT RETURNS THE SET IT EMPTIED, WHICH USED TO DIE HERE**
/// (T-167-s13). `all_dropped` was a local, so the only surviving trace of
/// a truncation was `stats.truncated_files` — a COUNT — and the count
/// cannot be turned back into the paths: **a file whose array this
/// function emptied is byte-for-byte indistinguishable, in the emitted
/// document, from a file that never had symbols**. So the actionable half
/// of a truncation report was unprintable, not merely unprinted. The set
/// is RETURNED rather than recorded in `stats` deliberately: see
/// `check::drop_clause` for the ADR-014 decision, whose short form is
/// that a list of paths inside the very document whose size caused the
/// truncation is a feedback loop, and the gate is the only reader.
///
/// **THE SET'S MEMBERSHIP IS THE SAME FACT `stats.truncated_files`
/// COUNTS** — arrays THIS call emptied, cumulative across passes, never a
/// file that arrived with none — so the two can never disagree by
/// construction, and `check` reads them as one record rather than
/// re-deriving either.
pub(crate) fn apply_budget(
    mut graph: Graph,
    max_graph_bytes: usize,
) -> Result<(Graph, BTreeSet<String>), IndexError> {
    // Cumulative across passes: only arrays this function EMPTIED count
    // as truncated (a file with zero symbols to begin with was never
    // truncated).
    let mut all_dropped: BTreeSet<String> = BTreeSet::new();
    loop {
        let doc = stable_json_string(&graph)?;
        if doc.len() <= max_graph_bytes {
            return Ok((graph, all_dropped));
        }

        // Cost per file = exact serialized bytes its symbol block adds at
        // document depth (measured from this pass's shapes).
        let mut costs: Vec<(usize, String)> = graph
            .files
            .iter()
            .filter(|f| !f.symbols.is_empty())
            .map(|f| (entry_cost(f), f.path.clone()))
            .collect();

        if costs.is_empty() {
            // Floor: nothing left to truncate. Emit the valid over-budget
            // graph with the over-budget state visible in stats — never
            // silent (acceptance criterion); files and edges are never
            // dropped (§3.2).
            graph.stats.truncated_symbols = Some(true);
            if !all_dropped.is_empty() {
                graph.stats.truncated_files = Some(all_dropped.len());
            }
            return Ok((graph, all_dropped));
        }

        costs.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.cmp(&b.1)));
        let needed = doc.len() - max_graph_bytes;
        let mut saved = 0usize;
        let mut dropped: BTreeSet<String> = BTreeSet::new();
        for (cost, path) in costs {
            if saved >= needed {
                break;
            }
            saved += cost;
            dropped.insert(path);
        }

        for file in &mut graph.files {
            if dropped.contains(&file.path) {
                file.symbols.clear();
            }
        }
        // Dependent drop: call/type_ref edges whose endpoints reference a
        // truncated file's symbols — no dangling s: ids (import edges are
        // file-level, so drift derivation is never affected).
        graph.edges.retain(|edge| {
            if edge.kind == "import" {
                return true;
            }
            let touches_dropped = [&edge.from, &edge.to]
                .into_iter()
                .any(|id| symbol_id_path(id).is_some_and(|path| dropped.contains(path)));
            !touches_dropped
        });

        all_dropped.extend(dropped);
        graph.stats.truncated_symbols = Some(true);
        graph.stats.truncated_files = Some(all_dropped.len());
        graph.stats.symbols = graph.files.iter().map(|f| f.symbols.len()).sum();
        graph.stats.edges = graph.edges.len();
        // Loop: re-serialize and re-check (stats flags change the size a
        // little; a further pass truncates more if needed).
    }
}

/// THE UNDROPPABLE FLOOR, in bytes: what [`apply_budget`] emits when no
/// budget can be met — every symbol array emptied, every dependent `s:`
/// edge gone, and every FILE and `import` edge still present, because
/// those are never dropped.
///
/// T-140 — THE NUMBER THIS CRATE OWNS AND NEVER PRINTED. The budget is a
/// ceiling the emitter can always reach by giving symbols up; the floor
/// is the part it cannot give up, and it is LINEAR IN FILE COUNT. So the
/// budget is not what decides how large a project this map can hold: the
/// floor is, and a project whose floor is over the budget is one whose
/// graph degrades to nothing useful and then keeps growing. Printed by
/// `index --check` (see `check::floor_line`) so the figure is DERIVED at
/// every gate run rather than transcribed into a document that ages.
///
/// Budget `0` is unmeetable by construction, so `apply_budget` runs to
/// its floor branch and returns exactly the document an oversized
/// project would ship. It is the emitter's own answer rather than a
/// second implementation of it (a floor computed here by hand would be a
/// rule with two implementations, and this crate has been bitten by
/// that).
pub(crate) fn floor_len(graph: &Graph) -> Result<usize, IndexError> {
    let (floored, _dropped) = apply_budget(graph.clone(), 0)?;
    Ok(stable_json_string(&floored)?.len())
}

/// Exact in-document byte cost of a file entry's symbol block: the entry
/// serialized at its real depth, with symbols vs with `symbols: []`.
fn entry_cost(file: &FileEntry) -> usize {
    #[derive(Serialize)]
    struct Wrap<'a> {
        files: [&'a FileEntry; 1],
    }
    let full = pretty_len(&Wrap { files: [file] });
    let mut empty = file.clone();
    empty.symbols.clear();
    let hollow = pretty_len(&Wrap { files: [&empty] });
    full.saturating_sub(hollow)
}

fn pretty_len<T: Serialize>(value: &T) -> usize {
    let mut buf: Vec<u8> = Vec::new();
    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"  ");
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    // Infallible for these types; on the unreachable failure path the
    // cost degrades to 0 (file sorts last, never a panic).
    let _ = value.serialize(&mut ser);
    buf.len()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::{Stats, Symbol};

    fn file(path: &str, symbol_names: &[&str]) -> FileEntry {
        FileEntry {
            id: format!("f:{path}"),
            path: path.to_string(),
            lang: "ts".to_string(),
            hash: format!("blake3:{}", "0".repeat(64)),
            loc: 10,
            symbols: symbol_names
                .iter()
                .map(|n| Symbol {
                    id: format!("s:{path}#{n}"),
                    name: n.to_string(),
                    kind: "function".to_string(),
                    exported: true,
                    range: [1, 5],
                })
                .collect(),
            depth_refused: None,
        }
    }

    fn graph(files: Vec<FileEntry>, edges: Vec<crate::graph::Edge>) -> Graph {
        let symbols = files.iter().map(|f| f.symbols.len()).sum();
        let stats = Stats {
            files: files.len(),
            symbols,
            edges: edges.len(),
            truncated_symbols: None,
            truncated_files: None,
            skipped: None,
            depth_limited: None,
        };
        Graph {
            schema: 1,
            root: ".".to_string(),
            languages: vec!["ts".to_string()],
            files,
            packages: vec![],
            edges,
            unresolved: vec![],
            stats,
        }
    }

    fn call_edge(from: &str, to: &str) -> crate::graph::Edge {
        crate::graph::Edge {
            from: from.to_string(),
            to: to.to_string(),
            kind: "call".to_string(),
            symbols: None,
            reexport: None,
            confidence: Some("resolved".to_string()),
        }
    }

    /// VERIFIER PROBE (T-167-s13, phase 2): the returned record equals,
    /// at EVERY budget, exactly the set of arrays this call emptied.
    /// Many equal-cost files, so the greedy loop's overshoot is small and
    /// a SECOND pass is reachable — the state no existing body reaches.
    #[test]
    fn probe_the_record_equals_what_was_emptied_at_every_budget() {
        let mk = || {
            let mut files = vec![file("bare.ts", &[])];
            for i in 0..40 {
                let n = format!("sym{i:02}");
                files.push(file(&format!("f{i:02}.ts"), &[n.as_str()]));
            }
            graph(files, vec![])
        };
        let full = stable_json_string(&mk()).unwrap().len();
        let had: BTreeSet<String> = mk()
            .files
            .iter()
            .filter(|f| !f.symbols.is_empty())
            .map(|f| f.path.clone())
            .collect();
        let mut bad: Vec<String> = Vec::new();
        for budget in 0..=full {
            let (out, rec) = apply_budget(mk(), budget).unwrap();
            let emptied: BTreeSet<String> = out
                .files
                .iter()
                .filter(|f| f.symbols.is_empty() && had.contains(&f.path))
                .map(|f| f.path.clone())
                .collect();
            if rec != emptied {
                bad.push(format!(
                    "budget {budget}: record {} != emptied {}",
                    rec.len(),
                    emptied.len()
                ));
            }
            let want = if rec.is_empty() { None } else { Some(rec.len()) };
            if out.stats.truncated_files != want {
                bad.push(format!(
                    "budget {budget}: count {:?} != record len {:?}",
                    out.stats.truncated_files, want
                ));
            }
        }
        assert!(
            bad.is_empty(),
            "{} budgets disagree, first 5: {:?}",
            bad.len(),
            &bad[..bad.len().min(5)]
        );
    }

    #[test]
    fn under_budget_graphs_pass_through_untouched() {
        let g = graph(vec![file("a.ts", &["one", "two"])], vec![]);
        let (out, dropped) = apply_budget(g.clone(), 1_000_000).unwrap();
        assert_eq!(out, g);
        assert_eq!(out.stats.truncated_symbols, None);
        // T-167-s13: the record is EMPTY on a pass-through, not merely
        // unread. An implementation that returned "every file with an
        // empty array" would name nothing here only by luck of the
        // fixture, so the emptiness is asserted where nothing was
        // dropped and again, by name, in the body below.
        assert!(dropped.is_empty(), "nothing was emptied: {dropped:?}");
    }

    /// T-167-s13: THE RECORD IS THE ARRAYS THIS CALL EMPTIED — never the
    /// arrays that are empty.
    ///
    /// The fixture is the distinction: `bare.ts` arrives with no symbols
    /// at all and `big.ts` is emptied by the budget, so after the pass
    /// BOTH have `symbols: []` and the emitted document cannot tell them
    /// apart. Any implementation that re-derived this set from the
    /// document — the obvious one, and the one the card forbids — names
    /// both. The emitter's own record names one.
    #[test]
    fn the_returned_record_names_the_files_this_pass_emptied_and_no_others() {
        let big: Vec<String> = (0..40).map(|i| format!("bigSymbol{i:02}")).collect();
        let big_refs: Vec<&str> = big.iter().map(String::as_str).collect();
        let g = graph(
            vec![
                file("big.ts", &big_refs),
                file("bare.ts", &[]),
                file("small.ts", &["tiny"]),
            ],
            vec![],
        );
        let full_len = stable_json_string(&g).unwrap().len();
        let (out, dropped) = apply_budget(g, full_len - 200).unwrap();

        // THE CONTROL IS ARMED: after the pass the two are
        // indistinguishable in the document, so the re-derivation really
        // would have had a second hit to report.
        let empty_now: BTreeSet<String> = out
            .files
            .iter()
            .filter(|f| f.symbols.is_empty())
            .map(|f| f.path.clone())
            .collect();
        assert_eq!(
            empty_now,
            BTreeSet::from(["bare.ts".to_string(), "big.ts".to_string()]),
            "the fixture must leave BOTH arrays empty, or the control proves nothing"
        );

        assert_eq!(
            dropped,
            BTreeSet::from(["big.ts".to_string()]),
            "the record is what this call emptied, never what is empty"
        );
        // And the record cannot drift from the count it is the same fact
        // as (the field `check` prints beside it).
        assert_eq!(out.stats.truncated_files, Some(dropped.len()));
    }

    #[test]
    fn over_budget_drops_largest_symbol_blocks_first_and_flags() {
        // big.ts has far more symbols than small.ts; a budget between the
        // two forces exactly the big block out.
        let big: Vec<String> = (0..40).map(|i| format!("bigSymbol{i:02}")).collect();
        let big_refs: Vec<&str> = big.iter().map(String::as_str).collect();
        let g = graph(
            vec![file("big.ts", &big_refs), file("small.ts", &["tiny"])],
            vec![],
        );
        let full_len = stable_json_string(&g).unwrap().len();
        let (out, _dropped) = apply_budget(g, full_len - 200).unwrap();
        let by_path: std::collections::BTreeMap<_, _> =
            out.files.iter().map(|f| (f.path.as_str(), f)).collect();
        assert!(by_path["big.ts"].symbols.is_empty(), "largest block dropped");
        assert_eq!(by_path["small.ts"].symbols.len(), 1, "small kept");
        assert_eq!(out.stats.truncated_symbols, Some(true));
        assert_eq!(out.stats.truncated_files, Some(1));
        assert_eq!(out.stats.symbols, 1);
        assert_eq!(out.stats.files, 2, "files are never dropped");
        let redoc = stable_json_string(&out).unwrap();
        assert!(redoc.len() <= full_len - 200, "fits after truncation");
    }

    #[test]
    fn dependent_call_edges_drop_with_their_symbols_but_imports_stay() {
        let big: Vec<String> = (0..40).map(|i| format!("bigSymbol{i:02}")).collect();
        let big_refs: Vec<&str> = big.iter().map(String::as_str).collect();
        let edges = vec![
            crate::graph::Edge {
                from: "f:small.ts".to_string(),
                to: "f:big.ts".to_string(),
                kind: "import".to_string(),
                symbols: Some(vec!["bigSymbol00".to_string()]),
                reexport: None,
                confidence: None,
            },
            call_edge("s:small.ts#tiny", "s:big.ts#bigSymbol00"),
            call_edge("s:small.ts#tiny", "s:small.ts#tiny"),
        ];
        let g = graph(
            vec![file("big.ts", &big_refs), file("small.ts", &["tiny"])],
            edges,
        );
        let full_len = stable_json_string(&g).unwrap().len();
        let (out, _dropped) = apply_budget(g, full_len - 200).unwrap();
        let kinds: Vec<(&str, &str)> = out
            .edges
            .iter()
            .map(|e| (e.kind.as_str(), e.to.as_str()))
            .collect();
        // Import survives; the call into big.ts's dropped symbols is gone;
        // the self-call among kept symbols survives.
        assert!(kinds.contains(&("import", "f:big.ts")));
        assert!(!kinds.contains(&("call", "s:big.ts#bigSymbol00")), "no dangling s: ids");
        assert!(kinds.contains(&("call", "s:small.ts#tiny")));
        assert_eq!(out.stats.edges, out.edges.len());
    }

    #[test]
    fn truncation_is_deterministic_across_runs() {
        let big: Vec<String> = (0..40).map(|i| format!("bigSymbol{i:02}")).collect();
        let big_refs: Vec<&str> = big.iter().map(String::as_str).collect();
        let make = || {
            graph(
                vec![
                    file("a.ts", &big_refs),
                    file("b.ts", &big_refs),
                    file("c.ts", &["tiny"]),
                ],
                vec![],
            )
        };
        let full_len = stable_json_string(&make()).unwrap().len();
        let budget = full_len - 300;
        let one = stable_json_string(&apply_budget(make(), budget).unwrap().0).unwrap();
        let two = stable_json_string(&apply_budget(make(), budget).unwrap().0).unwrap();
        assert_eq!(one, two);
        // Equal-cost tie (a.ts vs b.ts serialize identically apart from
        // the path): path asc means a.ts empties first.
        let (out, _dropped) = apply_budget(make(), budget).unwrap();
        assert!(out.files[0].symbols.is_empty(), "a.ts dropped on tie");
    }

    #[test]
    fn floor_emits_over_budget_graph_flagged_never_dropping_files() {
        let g = graph(
            vec![file("a.ts", &["one"]), file("b.ts", &[])],
            vec![],
        );
        let (out, _dropped) = apply_budget(g, 10).unwrap(); // absurd budget
        assert_eq!(out.files.len(), 2, "files never dropped");
        assert!(out.files.iter().all(|f| f.symbols.is_empty()));
        assert_eq!(out.stats.truncated_symbols, Some(true));
        // Only the EMPTIED array counts; b.ts had no symbols to truncate.
        assert_eq!(out.stats.truncated_files, Some(1));
        assert!(stable_json_string(&out).unwrap().len() > 10, "honestly over");
    }

    #[test]
    fn write_graph_is_atomic_and_noops_on_equal_bytes() {
        use crate::testutil::TempTree;
        let t = TempTree::new("emit-write");
        let target = t.root().join("docs").join("architecture").join("graph.json");
        let g = graph(vec![file("a.ts", &["one"])], vec![]);

        // First write creates parents and reports change.
        assert!(write_graph(&g, &target).unwrap());
        let first = std::fs::read(&target).unwrap();
        assert_eq!(first, stable_json_string(&g).unwrap().as_bytes());

        // Identical graph: no write (mtime unchanged proves no-op).
        let before = std::fs::metadata(&target).unwrap().modified().unwrap();
        assert!(!write_graph(&g, &target).unwrap());
        let after = std::fs::metadata(&target).unwrap().modified().unwrap();
        assert_eq!(before, after, "no-op on equal bytes");

        // Changed graph: rewritten, no temp litter.
        let g2 = graph(vec![file("b.ts", &["two"])], vec![]);
        assert!(write_graph(&g2, &target).unwrap());
        let names: Vec<String> = std::fs::read_dir(target.parent().unwrap())
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        assert_eq!(names, vec!["graph.json"], "no temp files: {names:?}");
    }

    #[test]
    fn stable_json_ends_with_single_trailing_lf_and_2_space_indent() {
        let g = graph(vec![file("a.ts", &["one"])], vec![]);
        let doc = stable_json_string(&g).unwrap();
        assert!(doc.ends_with('\n') && !doc.ends_with("\n\n"));
        assert!(!doc.contains('\r'));
        assert!(doc.starts_with("{\n  \"schema\": 1,\n  \"root\": \".\","));
        // Optional fields omitted, never null.
        assert!(!doc.contains("null"));
    }
}
