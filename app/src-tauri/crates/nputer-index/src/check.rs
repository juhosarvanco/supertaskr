//! `nputer-index index --check` — is the committed graph current?
//!
//! ADR-014's gate, in the `cargo fmt --check` shape: exit non-zero when
//! `docs/architecture/graph.json` differs from a fresh index of the tree.
//! The VERDICT is byte identity (that is the committed contract); the
//! structural [`crate::diff`] only explains it.
//!
//! Until this landed, the interim rule (T-009-s1, ratified in
//! docs/CONVENTIONS.md) asked every integrator to run the `#[ignore]`d
//! `self_graph_is_current` test by hand at TS-touching merges. This is
//! that comparison as a first-class command — same fresh index, same
//! byte comparison, plus a failure tail an integrator can act on.

use std::path::{Path, PathBuf};

use crate::diff::{diff, GraphDiff};
use crate::graph::Graph;
use crate::{index, stable_json, IndexOptions, GRAPH_REL_PATH};

/// How many lines of any one delta list the report prints before it says
/// "and N more". Enough to act on; short enough that a big regen does not
/// bury the headline.
const MAX_LINES: usize = 20;

/// Why the committed graph is not current. Ordered by how much the reader
/// has to do about it.
#[derive(Clone, Debug, PartialEq)]
pub enum Staleness {
    /// No file at `docs/architecture/graph.json`.
    Missing,
    /// The file exists but is not a readable schema-1 graph. The bytes
    /// still decide staleness; this only means the delta cannot be shown.
    Unreadable(String),
    /// Content moved.
    Structural(GraphDiff),
    /// Content identical, bytes different — a hand edit, a reformat, or a
    /// serializer change. ADR-014: the file is never hand-edited, so this
    /// is worth naming rather than printing an empty delta.
    BytesOnly,
}

/// The outcome of a check run.
#[derive(Clone, Debug)]
pub struct CheckReport {
    pub stale: Option<Staleness>,
    /// The committed file's path, for the report.
    pub graph_path: PathBuf,
    pub committed_bytes: usize,
    pub fresh_bytes: usize,
    pub committed_stats: Option<(usize, usize, usize)>,
    pub fresh_stats: (usize, usize, usize),
    /// The emit budget this run measured against
    /// (`IndexOptions::max_graph_bytes`) — carried so the report can print
    /// the HEADROOM beside the size (T-139, taking `T-010-s3` arm 1).
    /// Every checkpoint runs this gate by hand, and until now the one
    /// number that would have warned anybody was the one it did not
    /// print: `bytes · files · symbols · edges`, and never how much room
    /// was left.
    pub budget_bytes: usize,
    /// The UNDROPPABLE FLOOR of a FRESH index of this tree — what
    /// `emit::apply_budget` emits when no budget can be met (T-140).
    ///
    /// The budget above is a ceiling the emitter can always reach, by
    /// giving symbols up. This is the part it cannot give up, and it is
    /// what actually decides how large a project this map can hold: past
    /// the point where the floor crosses the budget, "graceful
    /// degradation" has nothing left to degrade. Carried so the report
    /// can DERIVE that limit at every run instead of a document quoting
    /// a number measured on somebody else's tree.
    pub floor_bytes: usize,
}

impl CheckReport {
    pub fn is_stale(&self) -> bool {
        self.stale.is_some()
    }
}

/// Index `root` fresh and compare it against the committed graph.
///
/// Returns `Err` only when the tree cannot be indexed at all (an invalid
/// root, a grammar that will not load) — "the committed graph is stale"
/// is a REPORT, never an error, because the caller must be able to tell
/// "the gate says no" from "the gate could not run".
pub fn check(opts: &IndexOptions) -> Result<CheckReport, crate::IndexError> {
    let fresh = index(opts)?;
    let fresh_json = stable_json(&fresh);
    // T-140: the part of a fresh index truncation can never reclaim.
    // Measured through the emitter itself, never re-derived here.
    let floor_bytes = crate::emit::floor_len(&fresh)?;
    let graph_path = opts.root.join(GRAPH_REL_PATH);
    let committed_bytes = std::fs::read(&graph_path);

    let fresh_stats = (fresh.stats.files, fresh.stats.symbols, fresh.stats.edges);
    let Ok(committed_raw) = committed_bytes else {
        return Ok(CheckReport {
            stale: Some(Staleness::Missing),
            graph_path,
            committed_bytes: 0,
            fresh_bytes: fresh_json.len(),
            committed_stats: None,
            fresh_stats,
            budget_bytes: opts.max_graph_bytes,
            floor_bytes,
        });
    };

    if committed_raw == fresh_json.as_bytes() {
        return Ok(CheckReport {
            stale: None,
            graph_path,
            committed_bytes: committed_raw.len(),
            fresh_bytes: fresh_json.len(),
            committed_stats: Some(fresh_stats),
            fresh_stats,
            budget_bytes: opts.max_graph_bytes,
            floor_bytes,
        });
    }

    // Bytes differ. Parse the committed payload so the failure can name
    // what moved; a payload we cannot parse is still stale, just less
    // explainable.
    let committed: Result<Graph, _> = serde_json::from_slice(&committed_raw);
    let (stale, committed_stats) = match committed {
        Ok(old) => {
            let delta = diff(&old, &fresh);
            let stats = Some((old.stats.files, old.stats.symbols, old.stats.edges));
            if delta.is_empty() {
                (Staleness::BytesOnly, stats)
            } else {
                (Staleness::Structural(delta), stats)
            }
        }
        Err(err) => (Staleness::Unreadable(err.to_string()), None),
    };

    Ok(CheckReport {
        stale: Some(stale),
        graph_path,
        committed_bytes: committed_raw.len(),
        fresh_bytes: fresh_json.len(),
        committed_stats,
        fresh_stats,
        budget_bytes: opts.max_graph_bytes,
        floor_bytes,
    })
}

/// Render a report as the plain text `--check` prints.
///
/// Shape borrowed from the boot gate's failure tail (T-046): a headline
/// verdict, then the evidence itself, `| `-prefixed, then the exact
/// command that fixes it. `root_label` is what the caller typed, so the
/// suggested command is copy-pasteable.
pub fn render(report: &CheckReport, root_label: &str) -> String {
    let mut out = String::new();
    let (ff, fs, fe) = report.fresh_stats;
    let Some(stale) = &report.stale else {
        out.push_str(&format!(
            "[nputer-index] graph.json is CURRENT - {} matches a fresh index \
             ({} bytes, {ff} files, {fs} symbols, {fe} edges)\n{}{}",
            rel_display(&report.graph_path, root_label),
            report.committed_bytes,
            budget_line(report),
            floor_line(report),
        ));
        return out;
    };

    out.push_str("[nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree\n");
    match stale {
        Staleness::Missing => {
            out.push_str(&format!(
                "[nputer-index]   committed:   MISSING at {}\n",
                rel_display(&report.graph_path, root_label)
            ));
        }
        Staleness::Unreadable(err) => {
            out.push_str(&format!(
                "[nputer-index]   committed:   {} bytes, but NOT a readable schema-1 graph\n\
                 [nputer-index]   | {err}\n",
                report.committed_bytes
            ));
        }
        Staleness::BytesOnly => {
            out.push_str(&format!(
                "[nputer-index]   committed:   {} bytes\n\
                 [nputer-index]   NO structural difference - the payload is identical and only the BYTES differ.\n\
                 [nputer-index]   That means a hand edit, a reformat, or a serializer change: ADR-014 says\n\
                 [nputer-index]   graph.json is never hand-edited, so regenerating is the whole fix.\n",
                report.committed_bytes
            ));
        }
        Staleness::Structural(delta) => {
            if let Some((cf, cs, ce)) = report.committed_stats {
                out.push_str(&format!(
                    "[nputer-index]   committed:   {} bytes · {cf} files · {cs} symbols · {ce} edges\n",
                    report.committed_bytes
                ));
            }
            out.push_str(&format!(
                "[nputer-index]   fresh index: {} bytes · {ff} files · {fs} symbols · {fe} edges\n",
                report.fresh_bytes
            ));
            render_delta(&mut out, delta);
        }
    }
    out.push_str(&budget_line(report));
    out.push_str(&floor_line(report));
    out.push_str(&format!(
        "[nputer-index]\n[nputer-index]   regenerate: nputer-index index --root {root_label}\n"
    ));
    out
}

/// THE ONE NUMBER THIS REPORT USED NOT TO PRINT (T-139, taking
/// `T-010-s3` arm 1): how much of the emit budget a FRESH index of this
/// tree would spend, and how much would be left.
///
/// It is the fresh size and not the committed one on purpose. The
/// question a reader has at this gate is "what will the next regen
/// write", and on a CURRENT graph the two are byte-identical anyway.
///
/// Over budget is not an error and must not read like one: the emitter
/// degrades rather than failing — symbol arrays are dropped largest
/// first, files and `import` edges are never dropped — so the line names
/// the degradation and points at the flags that record it, because a
/// truncated graph is otherwise indistinguishable from a small one.
fn budget_line(report: &CheckReport) -> String {
    if report.budget_bytes == 0 {
        return String::new();
    }
    let used = report.fresh_bytes;
    let budget = report.budget_bytes;
    let percent = (used as f64) * 100.0 / (budget as f64);
    if used > budget {
        format!(
            "[nputer-index]   budget:      {used} of {budget} bytes ({percent:.1}%) - OVER by {}: \
             symbol arrays are being dropped (stats.truncated_symbols / truncated_files say how many)\n",
            used - budget
        )
    } else {
        format!(
            "[nputer-index]   budget:      {used} of {budget} bytes ({percent:.1}%) - {} left\n",
            budget - used
        )
    }
}

/// THE OTHER NUMBER THIS REPORT USED NOT TO PRINT, and the one the
/// budget line cannot stand in for (T-140).
///
/// `budget_line` answers "how much room is left before symbols start
/// going". This answers the question behind it: **how much room is left
/// before there is nothing left to give**. `apply_budget` drops symbol
/// arrays and never files or `import` edges, so the FLOOR — the file
/// list plus the import edges — is a cost the emitter cannot refuse, and
/// it is linear in the file count. Past the point where the floor
/// crosses the budget the degradation is no longer graceful: everything
/// droppable is already gone and the document is over anyway.
///
/// SO THE LINE PRINTS THE PROJECTION, DERIVED HERE AND NEVER QUOTED. The
/// file count at which this tree's own density puts the floor at the
/// budget is the card's whole subject, and it MOVES — with the schema,
/// with the import density, with the languages walked. A document that
/// wrote it down would be wrong by the next merge; a gate that prints it
/// at every run cannot be. It is a projection at THIS tree's shape and
/// says so: real projects are not uniform, and the number is an order of
/// magnitude rather than a promise.
fn floor_line(report: &CheckReport) -> String {
    if report.budget_bytes == 0 || report.floor_bytes == 0 {
        return String::new();
    }
    let floor = report.floor_bytes;
    let budget = report.budget_bytes;
    let percent = (floor as f64) * 100.0 / (budget as f64);
    if floor >= budget {
        return format!(
            "[nputer-index]   floor:       {floor} of {budget} bytes ({percent:.1}%) - OVER: \
             the files and import edges ALONE exceed the budget, so truncation has nothing \
             left to give and the document ships over anyway\n"
        );
    }
    let files = report.fresh_stats.0;
    if files == 0 {
        return format!(
            "[nputer-index]   floor:       {floor} of {budget} bytes ({percent:.1}%) - \
             files and import edges, which truncation can never reclaim\n"
        );
    }
    let per_file = (floor as f64) / (files as f64);
    let ceiling = ((budget as f64) / per_file).floor() as usize;
    format!(
        "[nputer-index]   floor:       {floor} of {budget} bytes ({percent:.1}%) - \
         {per_file:.0} bytes/file truncation can never reclaim, so at this tree's density \
         the budget stops degrading gracefully at about {ceiling} files\n"
    )
}

fn render_delta(out: &mut String, delta: &GraphDiff) {
    if !delta.meta.is_empty() {
        out.push_str("[nputer-index]\n[nputer-index]   header\n");
        for line in &delta.meta {
            out.push_str(&format!("[nputer-index]   | ~ {line}\n"));
        }
    }
    section(
        out,
        "files",
        &[
            ("+", &delta.files_added),
            ("-", &delta.files_removed),
        ],
        Some(&delta.files_changed),
    );
    section(
        out,
        "packages",
        &[
            ("+", &delta.packages_added),
            ("-", &delta.packages_removed),
        ],
        None,
    );
    section(
        out,
        "edges",
        &[("+", &delta.edges_added), ("-", &delta.edges_removed)],
        None,
    );
    section(
        out,
        "unresolved",
        &[
            ("+", &delta.unresolved_added),
            ("-", &delta.unresolved_removed),
        ],
        None,
    );
}

fn section(
    out: &mut String,
    label: &str,
    groups: &[(&str, &Vec<String>)],
    changed: Option<&Vec<crate::diff::FileChange>>,
) {
    let changed_len = changed.map(Vec::len).unwrap_or(0);
    let total: usize = groups.iter().map(|(_, list)| list.len()).sum::<usize>() + changed_len;
    if total == 0 {
        return;
    }
    let mut header = format!("[nputer-index]   {label}");
    for (marker, list) in groups {
        header.push_str(&format!("  {marker}{}", list.len()));
    }
    if changed.is_some() {
        header.push_str(&format!("  ~{changed_len}"));
    }
    out.push_str("[nputer-index]\n");
    out.push_str(&header);
    out.push('\n');
    for (marker, list) in groups {
        emit_lines(out, marker, list.iter().cloned());
    }
    if let Some(changes) = changed {
        emit_lines(
            out,
            "~",
            changes.iter().map(|c| {
                let mut line = c.path.clone();
                let mut notes: Vec<String> = Vec::new();
                if c.hash_changed {
                    notes.push("content".to_string());
                }
                if c.loc.0 != c.loc.1 {
                    notes.push(format!("loc {} -> {}", c.loc.0, c.loc.1));
                }
                if c.symbols.0 != c.symbols.1 {
                    notes.push(format!("symbols {} -> {}", c.symbols.0, c.symbols.1));
                }
                if !notes.is_empty() {
                    line.push_str(&format!("  ({})", notes.join(", ")));
                }
                line
            }),
        );
    }
}

fn emit_lines(out: &mut String, marker: &str, lines: impl Iterator<Item = String>) {
    let all: Vec<String> = lines.collect();
    for line in all.iter().take(MAX_LINES) {
        out.push_str(&format!("[nputer-index]   | {marker} {line}\n"));
    }
    if all.len() > MAX_LINES {
        out.push_str(&format!(
            "[nputer-index]   | {marker} ... and {} more\n",
            all.len() - MAX_LINES
        ));
    }
}

/// Print the graph path the way the caller would type it.
fn rel_display(path: &Path, root_label: &str) -> String {
    if root_label == "." {
        GRAPH_REL_PATH.to_string()
    } else {
        path.display().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    fn opts(root: &Path) -> IndexOptions {
        IndexOptions {
            root: root.to_path_buf(),
            ..Default::default()
        }
    }

    #[test]
    fn a_missing_committed_graph_is_stale_and_says_so() {
        let t = TempTree::new("check-missing");
        t.write("src/a.ts", "export const a = 1;\n");
        let report = check(&opts(t.root())).unwrap();
        assert_eq!(report.stale, Some(Staleness::Missing));
        let text = render(&report, ".");
        assert!(text.contains("STALE"), "{text}");
        assert!(text.contains("MISSING at docs/architecture/graph.json"), "{text}");
        assert!(text.contains("regenerate: nputer-index index --root ."), "{text}");
    }

    #[test]
    fn a_current_graph_is_green_and_names_its_counts() {
        let t = TempTree::new("check-green");
        t.write("src/a.ts", "export const a = 1;\n");
        let graph = index(&opts(t.root())).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();

        let report = check(&opts(t.root())).unwrap();
        assert!(!report.is_stale(), "{report:?}");
        let text = render(&report, ".");
        assert!(text.contains("CURRENT"), "{text}");
        assert!(text.contains("1 files"), "{text}");
        assert!(!text.contains("regenerate"), "green must not nag: {text}");
    }

    #[test]
    fn a_stale_graph_names_the_added_file_and_the_added_edge() {
        let t = TempTree::new("check-stale");
        t.write("src/a.ts", "export const a = 1;\n");
        let graph = index(&opts(t.root())).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();

        // Plant staleness: a new file that the old graph cannot know.
        t.write("src/b.ts", "import { a } from \"./a\";\nexport const b = a;\n");

        let report = check(&opts(t.root())).unwrap();
        assert!(report.is_stale());
        let text = render(&report, ".");
        assert!(text.contains("| + src/b.ts"), "names the added file:\n{text}");
        assert!(
            text.contains("| + f:src/b.ts -> f:src/a.ts (import) symbols=[a]"),
            "names the added edge:\n{text}"
        );
        assert!(text.contains("files  +1"), "counts the delta:\n{text}");
    }

    /// T-139, taking `T-010-s3` arm 1. This gate printed
    /// `bytes · files · symbols · edges` and never the room left, so the
    /// first anybody would learn the budget had run out was the day
    /// symbol panels went empty in the map with nothing pointing at the
    /// cause. This is the CURRENT path, which is the one a checkpoint
    /// reads.
    #[test]
    fn a_current_graph_reports_the_room_left_in_the_budget() {
        let t = TempTree::new("check-headroom");
        t.write("src/a.ts", "export const a = 1;\n");
        let graph = index(&opts(t.root())).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();

        let report = check(&opts(t.root())).unwrap();
        assert!(!report.is_stale(), "{report:?}");
        let text = render(&report, ".");
        let budget = IndexOptions::default().max_graph_bytes;
        let left = budget - report.fresh_bytes;
        assert!(
            text.contains(&format!("{} of {budget} bytes", report.fresh_bytes)),
            "names the size against the budget it was measured on:\n{text}"
        );
        assert!(
            text.contains(&format!("- {left} left")),
            "names the REMAINING room, which is the number nothing printed:\n{text}"
        );
        assert!(
            !text.contains("OVER by"),
            "an under-budget graph must not read as a degraded one:\n{text}"
        );
    }

    /// The other half, and the one that must read as a DEGRADATION rather
    /// than as a failure: over budget the emitter still emits, so the line
    /// names what is being lost and where the count of it lives. Driven
    /// through the real `index()` with a budget below even the floor, so
    /// `apply_budget` runs out of symbol arrays and emits the valid
    /// over-budget document.
    #[test]
    fn an_over_budget_graph_says_what_is_being_dropped() {
        let t = TempTree::new("check-overbudget");
        for i in 0..8 {
            t.write(
                &format!("src/f{i}.ts"),
                "export const alpha = 1;\nexport const beta = 2;\n",
            );
        }
        let tight = IndexOptions {
            max_graph_bytes: 400,
            ..opts(t.root())
        };
        let graph = index(&tight).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();

        let report = check(&tight).unwrap();
        let text = render(&report, ".");
        assert!(
            report.fresh_bytes > 400,
            "the fixture must actually exceed the budget: {report:?}"
        );
        assert!(
            text.contains(&format!("OVER by {}", report.fresh_bytes - 400)),
            "names how far over:\n{text}"
        );
        assert!(
            text.contains("symbol arrays are being dropped"),
            "says what the emitter gave up, not merely that a number is large:\n{text}"
        );
        assert!(
            text.contains("truncated_symbols"),
            "points at the flags that carry the count:\n{text}"
        );
    }

    /// The projected ceiling, read back out of the rendered line.
    fn projected_ceiling(text: &str) -> usize {
        let tail = text
            .split("at about ")
            .nth(1)
            .unwrap_or_else(|| panic!("no projection in:\n{text}"));
        tail.split(' ')
            .next()
            .and_then(|n| n.parse().ok())
            .unwrap_or_else(|| panic!("unparseable projection in:\n{text}"))
    }

    /// T-140. `budget_line` says how much room is left before symbols
    /// start going; NOTHING said how much is left before there is
    /// nothing left to give. The floor — files plus `import` edges — is
    /// the cost `apply_budget` cannot refuse, so it is the limit that
    /// actually decides how large a project this map can hold, and the
    /// gate every checkpoint runs by hand never printed it.
    ///
    /// THE DISCRIMINATOR IS DENSITY, NOT SIZE, and it has to be: the
    /// projection is a per-FILE figure, so it is roughly invariant in the
    /// file count and a two-sizes fixture would prove nothing. These two
    /// trees carry the SAME twelve files and differ only in how much
    /// each one imports — which is exactly what moves the undroppable
    /// cost per file — so a line that printed a constant, or divided by
    /// the wrong thing, cannot pass both halves.
    #[test]
    fn the_report_names_the_floor_truncation_can_never_reclaim() {
        let sparse = TempTree::new("check-floor-sparse");
        for i in 0..12 {
            sparse.write(
                &format!("src/f{i:02}.ts"),
                "export const alpha = 1;\nexport const beta = 2;\n",
            );
        }
        let dense = TempTree::new("check-floor-dense");
        for i in 0..12 {
            let imports: String = (0..12)
                .filter(|j| *j != i)
                .map(|j| format!("import {{ alpha as a{j:02}, beta as b{j:02} }} from \"./f{j:02}\";\n"))
                .collect();
            dense.write(
                &format!("src/f{i:02}.ts"),
                &format!("{imports}export const alpha = 1;\nexport const beta = 2;\n"),
            );
        }

        let sparse_report = check(&opts(sparse.root())).unwrap();
        let dense_report = check(&opts(dense.root())).unwrap();
        let sparse_text = render(&sparse_report, ".");
        let dense_text = render(&dense_report, ".");

        // The fixtures are the control for each other: same file count,
        // and the dense one really did produce the import edges.
        assert_eq!(sparse_report.fresh_stats.0, dense_report.fresh_stats.0, "same file count");
        assert!(
            dense_report.fresh_stats.2 > sparse_report.fresh_stats.2,
            "the dense fixture must actually carry more edges: {} vs {}",
            dense_report.fresh_stats.2,
            sparse_report.fresh_stats.2
        );

        // The floor is a REAL subset: something was droppable, and the
        // floor is what survives dropping it.
        assert!(
            sparse_report.floor_bytes > 0 && sparse_report.floor_bytes < sparse_report.fresh_bytes,
            "the floor must be a proper part of the document: {sparse_report:?}"
        );

        let budget = IndexOptions::default().max_graph_bytes;
        assert!(
            sparse_text.contains(&format!("{} of {budget} bytes", sparse_report.floor_bytes)),
            "names the floor against the budget it was measured on:\n{sparse_text}"
        );
        assert!(
            sparse_text.contains("truncation can never reclaim"),
            "says WHY the floor is the limit, not merely that a number exists:\n{sparse_text}"
        );

        // Density, not size, is what moves the projection.
        assert!(
            dense_report.floor_bytes > sparse_report.floor_bytes,
            "imports are undroppable, so a denser tree has a bigger floor: {} vs {}",
            dense_report.floor_bytes,
            sparse_report.floor_bytes
        );
        assert!(
            projected_ceiling(&dense_text) < projected_ceiling(&sparse_text),
            "a costlier file must project a SMALLER reach:\n{sparse_text}\n{dense_text}"
        );

        // THE ARITHMETIC PIN (T-140's verdict, correction 1): the printed
        // bytes/file and ceiling must BE the division of the report's own
        // fields, re-derived here — the verdict's surviving mutant halved
        // the headline projection and shipped green, because only the
        // ORDINAL (dense < sparse) was pinned. A constant factor on the
        // card's whole subject must never print unnoticed again.
        for (report, text) in [(&sparse_report, &sparse_text), (&dense_report, &dense_text)] {
            let per_file = (report.floor_bytes as f64) / (report.fresh_stats.0 as f64);
            let ceiling = ((report.budget_bytes as f64) / per_file).floor() as usize;
            assert!(
                text.contains(&format!("{per_file:.0} bytes/file")),
                "the printed per-file cost must equal floor/files re-derived ({per_file:.0}):\n{text}"
            );
            assert_eq!(
                projected_ceiling(text),
                ceiling,
                "the printed ceiling must equal budget/per-file re-derived:\n{text}"
            );
        }
    }

    /// The state the card is about, rendered: a project whose files and
    /// import edges ALONE are over the budget. There is nothing left to
    /// drop, so the line must not read like the ordinary truncation the
    /// budget line describes — that one is survivable and this one is
    /// the end of survivable.
    #[test]
    fn a_floor_over_the_budget_says_there_is_nothing_left_to_give() {
        let t = TempTree::new("check-floor-over");
        for i in 0..8 {
            t.write(
                &format!("src/f{i}.ts"),
                "export const alpha = 1;\nexport const beta = 2;\n",
            );
        }
        let tight = IndexOptions {
            max_graph_bytes: 400,
            ..opts(t.root())
        };
        let report = check(&tight).unwrap();
        assert!(
            report.floor_bytes > 400,
            "the fixture must put the FLOOR over the budget, not merely the document: {report:?}"
        );
        let text = render(&report, ".");
        assert!(
            text.contains(&format!("floor:       {} of 400 bytes", report.floor_bytes)),
            "names the floor:\n{text}"
        );
        assert!(
            text.contains("truncation has nothing left to give"),
            "an exhausted degradation must not read as an ordinary one:\n{text}"
        );
        assert!(
            !text.contains("at about"),
            "no projection is honest once the floor is already over:\n{text}"
        );
    }

    #[test]
    fn a_reformatted_graph_is_stale_but_reported_as_bytes_only() {
        let t = TempTree::new("check-bytes");
        t.write("src/a.ts", "export const a = 1;\n");
        let graph = index(&opts(t.root())).unwrap();
        let path = t.root().join(GRAPH_REL_PATH);
        crate::write_graph(&graph, &path).unwrap();
        // Same payload, different bytes: compact instead of pretty.
        let compact = serde_json::to_string(&graph).unwrap();
        std::fs::write(&path, compact).unwrap();

        let report = check(&opts(t.root())).unwrap();
        assert_eq!(report.stale, Some(Staleness::BytesOnly));
        let text = render(&report, ".");
        assert!(text.contains("NO structural difference"), "{text}");
        assert!(text.contains("never hand-edited"), "{text}");
    }

    #[test]
    fn an_unparseable_committed_graph_is_stale_and_explained() {
        let t = TempTree::new("check-junk");
        t.write("src/a.ts", "export const a = 1;\n");
        let path = t.root().join(GRAPH_REL_PATH);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, b"{ not a graph").unwrap();

        let report = check(&opts(t.root())).unwrap();
        assert!(matches!(report.stale, Some(Staleness::Unreadable(_))));
        let text = render(&report, ".");
        assert!(text.contains("NOT a readable schema-1 graph"), "{text}");
    }

    #[test]
    fn long_delta_lists_are_truncated_with_an_honest_count() {
        let t = TempTree::new("check-long");
        for i in 0..(MAX_LINES + 5) {
            t.write(&format!("src/f{i:03}.ts"), "export const x = 1;\n");
        }
        let graph = index(&opts(t.root())).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();
        for i in 0..(MAX_LINES + 5) {
            std::fs::remove_file(t.root().join(format!("src/f{i:03}.ts"))).unwrap();
        }
        let report = check(&opts(t.root())).unwrap();
        let text = render(&report, ".");
        assert!(text.contains("... and 5 more"), "{text}");
    }
}
