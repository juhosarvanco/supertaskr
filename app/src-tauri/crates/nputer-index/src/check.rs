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
    /// THE EMITTER'S OWN RECORD OF WHAT *IT* DROPPED from a fresh index
    /// of this tree (T-167-s5), read straight off `stats.truncated_files`.
    ///
    /// **THE UNIT IS FILES WHOSE SYMBOL ARRAY WAS EMPTIED — NEVER
    /// SYMBOLS**, and the distinction is the reason this field is named
    /// the long way. `apply_budget` drops whole symbol ARRAYS largest
    /// first and counts the FILES it emptied; the number of symbols that
    /// went with them is not recorded anywhere and cannot be recovered
    /// from the emitted document, because a file with an empty array is
    /// indistinguishable from a file that never had symbols. A clause
    /// that printed this figure as a symbol count would be a unit
    /// mismatch rather than an omission — the failure mode this family
    /// has now hit three times (T-194, T-196, T-208).
    pub fresh_truncated_files: usize,
    /// `stats.truncated_symbols` as the emitter set it on a fresh index.
    ///
    /// Carried BESIDE the count rather than derived from it, because the
    /// two are not the same fact. `apply_budget`'s floor arm sets this
    /// flag while leaving `truncated_files` unset — the state where the
    /// document is over budget and there was nothing left to empty — so
    /// `truncated_files == 0` does NOT imply an untruncated emit, and a
    /// clause reading only the count would go silent in exactly the worst
    /// state.
    pub fresh_truncated_symbols: bool,
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
    // T-167-s5: the emitter's own record of what it dropped, read once
    // here and carried, so the alarm never has to re-derive a fact the
    // emit already wrote down. See the field docs for the UNIT.
    let fresh_truncated_files = fresh.stats.truncated_files.unwrap_or(0);
    let fresh_truncated_symbols = fresh.stats.truncated_symbols.unwrap_or(false);
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
            fresh_truncated_files,
            fresh_truncated_symbols,
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
            fresh_truncated_files,
            fresh_truncated_symbols,
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
        fresh_truncated_files,
        fresh_truncated_symbols,
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
             ({} bytes, {ff} files, {fs} symbols, {fe} edges)\n{}{}{}",
            rel_display(&report.graph_path, root_label),
            report.committed_bytes,
            // ABOVE the stat lines, not among them (T-167-s2): the
            // reader of a green gate stops at the headline, and this is
            // the one line that must reach them anyway.
            headroom_alarm(report),
            budget_line(report),
            floor_line(report),
        ));
        return out;
    };

    out.push_str("[nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree\n");
    out.push_str(&headroom_alarm(report));
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

/// THE HEADROOM AT WHICH THIS REPORT STOPS BEING A STAT LINE AND SHOUTS
/// (T-167-s2).
///
/// [`budget_line`] has printed the room left since T-139, on every run
/// INCLUDING the ones that exit 0 — and that is precisely why it does not
/// arrive: it is an indented stat between two other indented stats, and
/// the reader of a green gate stops at the headline. So the first anybody
/// learns that the budget ran out is a `truncated_symbols` flag inside
/// somebody else's merge, on a diff that did not cause it and behind a
/// fence that forbids fixing it. Under this many bytes the report prints
/// an unindented block, above the stats, in a shape nothing else here
/// has.
///
/// **THE NUMBER IS ONE ORDINARY MERGE'S GROWTH OF THIS GRAPH, MEASURED.**
/// `13_921` is the MEAN of the 68 positive single-commit growths in this
/// repository's own history of `docs/architecture/graph.json` — median
/// `4_501`, max `241_980` at T-010 — re-derived at `5073db6` (T-140-s4)
/// from successive blob sizes:
///
/// ```text
/// git log --reverse --format=%H -- docs/architecture/graph.json \
///   | while read -r c; do git cat-file -s "$(git rev-parse "$c:docs/architecture/graph.json")"; done
/// ```
///
/// — then the positive deltas of that series, and their mean. THE MEAN
/// AND NOT THE MEDIAN, because the question this answers is "can the next
/// ordinary merge spend the rest", and the merges that spend a graph
/// budget are exactly the large ones a median hides (the median growth
/// here is a third of the room the tree had left when this was written,
/// and would have called that state healthy).
///
/// **IT IS A STAMP, SO RE-DERIVE IT RATHER THAN TRUSTING THIS LINE.**
/// The series to date, each reading at its own ref: `15_751` over 55
/// growths at `13c736e` (T-139, which rejected a 10 819-byte headroom in
/// the words "one ordinary merge from truncating"), `14_914` over 61 at
/// `9ed2b7fa430d5088c6b5cbefe8c4f4cbac906803` (T-167-s2), `13_921` over
/// 68 here. A threshold that moves by a re-measurement is not news; a
/// threshold that moves without one is.
///
/// **THE LAST SEVEN GROWTHS WERE MEASURED UNDER A BINDING BUDGET AND
/// THAT PULLS THIS MEAN DOWN — SAID HERE BECAUSE THE NEXT
/// RE-DERIVATION WILL SEE IT MOVE BACK UP.** From `791ab39`
/// (2026-08-30) the committed graph carried `truncated_symbols: true`,
/// so its size was clamped near `1_040_000` and its recorded growths
/// are the clamp's rather than the tree's — the four smallest entries
/// in this series sit in that window. T-140-s4 raised the budget to
/// 2 145 959, which unclamps it; expect the mean to rise at the next
/// re-derivation, and read that rise as the clamp lifting rather than
/// as the repository accelerating. This is a downward-biased estimate
/// of an alarm threshold, which is the SAFE direction: it fires early.
///
/// **AND IT NO LONGER SITS UNDER A SECOND LIMIT** (T-140-s4). Until
/// that card the budget it watches was pinned below the docs
/// collector's per-file cap, so this alarm was the early warning for a
/// CLIFF as well as for degradation. The graph has left the collector,
/// so what it warns about now is exactly one thing: symbols about to be
/// dropped. The wording below never claimed more than that, which is
/// why it needed no repair.
///
/// **AND IT IS DELIBERATELY THE SAME NUMBER A HEALTH BAND ALREADY
/// CARRIES, said twice because the two cannot see each other.**
/// `graph/budget-headroom-bytes` (tools/e2e, `health-bands.config.mjs`)
/// breaches at `15_751` — T-139's reading of this same statistic — and is
/// read when somebody runs the health report. This one is read by
/// whoever spends the byte, at the moment they spend it. Neither
/// substitutes for the other, and a divergence between them is a
/// re-measurement until somebody shows it is a disagreement about
/// meaning. **THE TWO NOW DIVERGE BY 1 830 BYTES AND IT IS THAT
/// BENIGN KIND**: the band still carries T-139's `15_751` while this
/// line is at T-140-s4's `13_921`, because the band lives in `tools/e2e`
/// and this card's fence does not reach it. Routed as a suggestion card
/// rather than left to be discovered.
pub const WARN_HEADROOM_BYTES: usize = 13_921;

/// THE TRIPWIRE (T-167-s2): the number [`budget_line`] already prints,
/// in a shape a reader cannot skip, and only when it matters.
///
/// Silent above [`WARN_HEADROOM_BYTES`] on purpose. A block that printed
/// on every run would be a banner, and a banner is read exactly as well
/// as the stat line this exists to escape.
///
/// **WITH ONE EXCEPTION, ADDED BY T-167-s5, AND THE EXCEPTION IS NOT A
/// WEAKENING OF THAT RULE BUT ITS OTHER HALF.** A drop makes this block
/// speak at ANY headroom (see [`drop_clause`]), because "plenty of room
/// left" is what a successful truncation looks like from here:
/// `apply_budget` empties whole symbol arrays, so the pass that brings a
/// document under the ceiling routinely overshoots and hands this
/// function a large, healthy, entirely misleading number. The block is
/// still not a banner — it is silent on every run where nothing was
/// dropped and the room is fine, which is the ordinary run.
///
/// **AND THE BLOCK NOW CARRIES A NUMBER THAT IS THE READER'S OWN** (see
/// [`spend_clause`]): everything else it prints is a property of the tree
/// and therefore the same for every lane, which is the habituation this
/// doc comment warns about one paragraph up.
///
/// IT DOES NOT TOUCH THE EXIT CODE, and that is a decision rather than an
/// omission. Exit 1 means the gate's own negative verdict — the committed
/// graph is stale (`crate::cli`'s exit-code contract) — and a graph with
/// little headroom is not stale; it is current, and correct, and about to
/// become expensive. A gate that redded here would hand every later lane
/// a red it did not cause and cannot fix, which is the same failure this
/// card is about with the sign flipped. Loudness is the whole mechanism;
/// the verdict above stays the verdict.
fn headroom_alarm(report: &CheckReport) -> String {
    if report.budget_bytes == 0 {
        return String::new();
    }
    let used = report.fresh_bytes;
    let budget = report.budget_bytes;
    // THE DROP IS DERIVED BEFORE ANY BUDGET ARM, and that placement is
    // the whole of T-167-s5's first criterion. Both degradation sentences
    // in this file used to live inside `used > budget` arms, so under
    // budget the word could not be printed at all — and under budget with
    // symbols dropped is not a rare corner, it is the state truncation
    // CREATES: `apply_budget` empties whole arrays, so the pass that
    // brings a document under the ceiling routinely overshoots and leaves
    // plenty of room. Measured at the T-169 merge regen: 34 160 bytes
    // left, alarm silent, and the emitter had just dropped.
    let drop = drop_clause(report);
    let spend = spend_clause(report);

    // Over budget FIRST: the headroom is negative there, and on unsigned
    // bytes the subtraction below would either underflow or be skipped.
    // The state past the ceiling must be the loudest, never the quietest.
    if used > budget {
        return format!(
            "[nputer-index]\n\
             {drop}\
             [nputer-index] !! GRAPH HEADROOM ALARM - there is none left: this index is {} bytes past the\n\
             [nputer-index] !! ceiling and the emitter is ALREADY dropping symbol arrays to fit\n\
             [nputer-index] !! (stats.truncated_symbols / truncated_files carry the count). Nothing is red\n\
             [nputer-index] !! because nothing failed - the graph is valid, and smaller than the tree it\n\
             [nputer-index] !! describes. THE VERDICT ABOVE IS UNAFFECTED: this is the room left, not the\n\
             [nputer-index] !! answer. The threshold and what measured it: check::WARN_HEADROOM_BYTES.\n\
             {spend}\
             [nputer-index]\n",
            used - budget
        );
    }
    let left = budget - used;
    if left >= WARN_HEADROOM_BYTES {
        // HEALTHY HEADROOM IS NOT A REASON TO BE SILENT ABOUT A DROP.
        // This is the arm the absorbed T-167-s7 was filed against: the
        // emit came in under the ceiling *by dropping*, so the one number
        // that used to print here said "plenty of room" about a map that
        // had already stopped answering. The drop still speaks; the
        // headroom sentence correctly does not, because there is nothing
        // wrong with the headroom.
        if drop.is_empty() {
            return String::new();
        }
        return format!("[nputer-index]\n{drop}{spend}[nputer-index]\n");
    }
    format!(
        "[nputer-index]\n\
         {drop}\
         [nputer-index] !! GRAPH HEADROOM ALARM - {left} bytes left, under the {WARN_HEADROOM_BYTES}-byte tripwire.\n\
         [nputer-index] !! That threshold is ONE ORDINARY MERGE's growth of this graph, measured over this\n\
         [nputer-index] !! repository's own history - so the NEXT code lane can be the one that crosses,\n\
         [nputer-index] !! and it will be somebody who did not cause it and whose fence cannot fix it.\n\
         [nputer-index] !! Crossing does not fail: the emitter drops symbol arrays to fit and sets\n\
         [nputer-index] !! stats.truncated_symbols, so the map quietly stops answering what is in a file.\n\
         [nputer-index] !! THE VERDICT ABOVE IS UNAFFECTED: this is the room left, not the answer, and\n\
         [nputer-index] !! moving either number to quiet it is a value call rather than a fix.\n\
         [nputer-index] !! The threshold and what measured it: check::WARN_HEADROOM_BYTES.\n\
         {spend}\
         [nputer-index]\n"
    )
}

/// THE LOUDER HALF OF THE BLOCK (T-167-s5, absorbing `T-167-s7`): what
/// the emitter DROPPED from a fresh index of this tree.
///
/// Sits ABOVE the headroom sentence wherever both print, and that order
/// is a decision rather than a layout. Low headroom is a warning about
/// the NEXT merge; a drop is this merge's map already lying by omission,
/// and a block that let a reader take the second for the first would
/// have failed the card that asked for it. The two are not alternatives
/// and the drop is never the relief: dropping is precisely HOW an emit
/// that would have been over budget comes in under it.
///
/// **THE PRINTED UNIT IS FILES, AND THE LINE SAYS SO.** `truncated_files`
/// counts symbol ARRAYS emptied, one per file; the symbols inside them
/// are not counted anywhere and cannot be recovered from the emitted
/// document. Naming the unit in the output is the cheap half of the
/// repair this family has had to make three times running (T-194, T-196,
/// T-208), and the expensive half is not printing a number whose unit the
/// reader has to guess.
fn drop_clause(report: &CheckReport) -> String {
    if !report.fresh_truncated_symbols && report.fresh_truncated_files == 0 {
        return String::new();
    }
    // The floor: `apply_budget` set the flag and recorded no file count
    // because it had nothing left to empty. Printing "0 files" here would
    // be a smaller claim than the truth.
    if report.fresh_truncated_files == 0 {
        return "[nputer-index] !! GRAPH TRUNCATED - a fresh index of this tree set stats.truncated_symbols and\n\
                [nputer-index] !! recorded NO file count, which is apply_budget's FLOOR: it had nothing left to\n\
                [nputer-index] !! empty and emitted the over-budget document anyway. Degradation is finished\n\
                [nputer-index] !! here, so the headroom sentence below is the lesser of the two states.\n"
            .to_string();
    }
    let files = report.fresh_truncated_files;
    let plural = if files == 1 { "" } else { "s" };
    format!(
        "[nputer-index] !! GRAPH TRUNCATED - a fresh index of this tree DROPPED the symbol arrays of\n\
         [nputer-index] !! {files} file{plural} to fit the budget (unit: FILES whose array was emptied, never\n\
         [nputer-index] !! symbols - stats.truncated_files). The map is now smaller than the tree it\n\
         [nputer-index] !! describes and will answer \"no symbols\" for files that have them.\n\
         [nputer-index] !! THIS IS THE LOUD ONE. Low headroom warns about the next merge; this is the\n\
         [nputer-index] !! map already lying by omission, and an emit that came in under the ceiling\n\
         [nputer-index] !! by DROPPING is not relief. T-140-s1 is the fix, and its urgency is measured\n\
         [nputer-index] !! in dropped files rather than in bytes left.\n"
    )
}

/// THE NUMBER THAT IS THE READER'S OWN (T-167-s5): what THIS working tree
/// would spend, beside the standing room left.
///
/// `budget_line` and the headroom sentence both name a property of the
/// TREE, not of the reader's diff — very nearly the same number for every
/// lane that runs this gate until the payload shape moves — and a number
/// that is the same for everybody is read once and then becomes
/// wallpaper. The difference between a fresh index and the committed
/// graph is the one figure here that moved BECAUSE OF the reader, so it
/// is the one that cannot go stale on them.
///
/// SILENT AT ZERO, ON PURPOSE, and that is an acceptance criterion rather
/// than a nicety: on a current graph the two sizes are equal by
/// construction, so a clause that printed unconditionally would print
/// "0" on every green run — which is the same wallpaper one column over.
///
/// **THE ARITHMETIC IS SIGNED AND THE NEGATIVE SIDE IS THE POINT.** A
/// fresh index SMALLER than the committed graph is the shape a drop
/// makes, so unsigned subtraction here would underflow into a
/// preposterous figure in exactly the state the block above exists to
/// shout about.
fn spend_clause(report: &CheckReport) -> String {
    // A MISSING committed graph reports 0 bytes, and "spends 1 037 788
    // against nothing" is a fiction rather than a spend.
    if report.committed_bytes == 0 {
        return String::new();
    }
    let fresh = report.fresh_bytes as i128;
    let committed = report.committed_bytes as i128;
    let spend = fresh - committed;
    if spend == 0 {
        return String::new();
    }
    if spend < 0 {
        return format!(
            "[nputer-index] !! AND THIS WORKING TREE GIVES {} BYTES BACK: a fresh index is {fresh} bytes\n\
             [nputer-index] !! against the committed graph's {committed}. A map that shrank is only good\n\
             [nputer-index] !! news if the tree shrank with it - read it against any GRAPH TRUNCATED line\n\
             [nputer-index] !! above before taking it for relief.\n",
            -spend
        );
    }
    format!(
        "[nputer-index] !! AND THIS WORKING TREE SPENDS {spend} OF IT: a fresh index is {fresh} bytes\n\
         [nputer-index] !! against the committed graph's {committed}. THAT number is yours - the room\n\
         [nputer-index] !! left above is the same for every lane and goes stale on the reader; this one\n\
         [nputer-index] !! moved because of your diff.\n"
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

    /// T-167-s2's POSITIVE CONTROL, and the acceptance criterion in one
    /// body: a graph BELOW the threshold trips the tripwire and one above
    /// it does not — on the SAME TREE, emitting the SAME document, so the
    /// only thing that moved between the halves is the headroom itself. A
    /// block that fired on tree size, on staleness, or on nothing at all
    /// cannot pass both halves.
    ///
    /// BOTH HALVES SIT ON THE GREEN PATH deliberately. The card's whole
    /// finding is that this number prints on the runs that exit 0 and is
    /// skipped there; a control driven only through the STALE render
    /// would prove the alarm exists without proving it reaches the reader
    /// who needs it.
    #[test]
    fn the_headroom_tripwire_fires_below_its_threshold_and_is_silent_above_it() {
        let t = TempTree::new("check-tripwire");
        for i in 0..6 {
            t.write(&format!("src/f{i}.ts"), "export const alpha = 1;\n");
        }
        let graph = index(&opts(t.root())).unwrap();
        crate::write_graph(&graph, &t.root().join(GRAPH_REL_PATH)).unwrap();

        // SILENT: the default budget leaves about a megabyte of room.
        let roomy = check(&opts(t.root())).unwrap();
        assert!(!roomy.is_stale(), "the silent half must be the green path: {roomy:?}");
        assert!(
            roomy.budget_bytes - roomy.fresh_bytes > WARN_HEADROOM_BYTES,
            "the control must really be above the threshold: {roomy:?}"
        );
        let quiet = render(&roomy, ".");
        assert!(
            !quiet.contains("HEADROOM ALARM"),
            "a healthy headroom must not print a banner:\n{quiet}"
        );

        // ARMED: the same tree, the same document, ten bytes of room.
        let tight = IndexOptions {
            max_graph_bytes: roomy.fresh_bytes + 10,
            ..opts(t.root())
        };
        let armed = check(&tight).unwrap();
        assert!(!armed.is_stale(), "the armed half must be the green path too: {armed:?}");
        assert_eq!(
            armed.fresh_bytes, roomy.fresh_bytes,
            "only the budget moved: the emitted document is the same one"
        );
        let loud = render(&armed, ".");
        assert!(loud.contains("GRAPH HEADROOM ALARM"), "the tripwire must fire:\n{loud}");
        assert!(loud.contains("10 bytes left"), "it names the room it measured:\n{loud}");
        assert!(
            loud.contains(&format!("under the {WARN_HEADROOM_BYTES}-byte tripwire")),
            "and the threshold it measured that against:\n{loud}"
        );
        assert!(
            loud.contains("THE VERDICT ABOVE IS UNAFFECTED"),
            "an alarm that reads as a verdict would be a false red:\n{loud}"
        );

        // LOUD IS A PLACEMENT, not only a wording: above the indented
        // stats a reader skips, and below the headline they do read.
        let alarm_at = loud.find("GRAPH HEADROOM ALARM").unwrap();
        let budget_at = loud
            .find("  budget:      ")
            .unwrap_or_else(|| panic!("no budget line in:\n{loud}"));
        assert!(
            alarm_at < budget_at,
            "the block must sit above the stat line it exists to escape:\n{loud}"
        );
        assert!(
            loud.find("is CURRENT").unwrap() < alarm_at,
            "and below the verdict, which is still the headline:\n{loud}"
        );
    }

    /// The arm an unsigned comparison gets wrong by default, which is why
    /// it is a body rather than a reading of the code: past the ceiling
    /// the headroom is NEGATIVE, `budget - used` underflows, and a
    /// `left < WARN` written the obvious way never runs at all — the
    /// worst state would go the quietest. Driven through the real
    /// `index()` with a budget below even the floor, the same way the
    /// over-budget stat line is.
    #[test]
    fn the_headroom_tripwire_is_loudest_once_the_ceiling_is_already_crossed() {
        let t = TempTree::new("check-tripwire-over");
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
            report.fresh_bytes > 400,
            "the fixture must actually be over the budget: {report:?}"
        );
        let text = render(&report, ".");
        assert!(
            text.contains("GRAPH HEADROOM ALARM"),
            "the spent state must still fire:\n{text}"
        );
        assert!(
            text.contains(&format!(
                "there is none left: this index is {} bytes past the",
                report.fresh_bytes - 400
            )),
            "it names how far past, rather than an underflowed headroom:\n{text}"
        );
        assert!(
            !text.contains("bytes left, under the"),
            "the under-budget wording must not survive the budget being spent:\n{text}"
        );
    }

    /// The dropped-FILE count, read back out of the rendered block.
    /// Named for its unit, because the unit is the thing this family has
    /// got wrong three times (T-194, T-196, T-208).
    fn printed_dropped_files(text: &str) -> usize {
        let tail = text
            .split("DROPPED the symbol arrays of\n[nputer-index] !! ")
            .nth(1)
            .unwrap_or_else(|| panic!("no drop clause in:\n{text}"));
        tail.split(' ')
            .next()
            .and_then(|n| n.parse().ok())
            .unwrap_or_else(|| panic!("unparseable drop count in:\n{text}"))
    }

    /// The spend, read back out of the rendered block.
    fn printed_spend(text: &str) -> i128 {
        let tail = text
            .split("WORKING TREE SPENDS ")
            .nth(1)
            .unwrap_or_else(|| panic!("no spend clause in:\n{text}"));
        tail.split(' ')
            .next()
            .and_then(|n| n.parse().ok())
            .unwrap_or_else(|| panic!("unparseable spend in:\n{text}"))
    }

    /// T-167-s5's POSITIVE CONTROL FOR THE DROP CLAUSE: ONE TREE EMITTED
    /// AT TWO BUDGETS, dropping at one and not at the other, with the
    /// block differing accordingly.
    ///
    /// **THE ARMED HALF IS DELIBERATELY UNDER BUDGET WITH ROOM TO
    /// SPARE**, and that is the whole body rather than a detail of the
    /// fixture. Before this card both degradation sentences in this file
    /// lived inside `used > budget` arms, so the state proved here — the
    /// emitter dropped, and the emit is comfortably under the ceiling —
    /// printed NOTHING, and printed nothing precisely because the drop
    /// had succeeded. `apply_budget` empties whole symbol arrays, so the
    /// pass that brings a document under the budget overshoots: here it
    /// drops one fat file and lands tens of thousands of bytes clear,
    /// which the old block read as health. A control driven through the
    /// OVER-budget path would have passed against the unchanged
    /// function and proved nothing at all.
    #[test]
    fn a_drop_speaks_even_at_healthy_headroom_which_is_where_it_used_to_be_silent() {
        let t = TempTree::new("check-drop");
        // One fat symbol array and three thin ones. The emitter drops
        // largest-first, so the fat file is what goes, and it is big
        // enough that losing it clears the tripwire several times over.
        let fat: String = (0..400)
            .map(|i| format!("export const s{i:03} = {i};\n"))
            .collect();
        t.write("src/fat.ts", &fat);
        for i in 0..3 {
            t.write(&format!("src/thin{i}.ts"), "export const alpha = 1;\n");
        }

        // ROOMY: the default budget, and nothing is dropped.
        let roomy = check(&opts(t.root())).unwrap();
        assert_eq!(
            (roomy.fresh_truncated_files, roomy.fresh_truncated_symbols),
            (0, false),
            "the silent half must really be untruncated: {roomy:?}"
        );
        let quiet = render(&roomy, ".");
        assert!(
            !quiet.contains("GRAPH TRUNCATED"),
            "an untruncated emit must not cry truncation:\n{quiet}"
        );

        // ARMED: the SAME TREE, a budget a little under what it wants.
        let tight = IndexOptions {
            max_graph_bytes: roomy.fresh_bytes - 1_000,
            ..opts(t.root())
        };
        let dropped = check(&tight).unwrap();
        assert!(
            dropped.fresh_truncated_files > 0,
            "the armed half must really have dropped something: {dropped:?}"
        );

        // THE TWO PRECONDITIONS THAT MAKE THIS THE UNPRINTED STATE: the
        // emit came in UNDER its budget, and the room left is healthy by
        // the tripwire's own measure. Both must hold, or this body is
        // re-proving the over-budget arm that already worked.
        assert!(
            dropped.fresh_bytes <= tight.max_graph_bytes,
            "the drop must have brought the emit under budget: {dropped:?}"
        );
        let left = tight.max_graph_bytes - dropped.fresh_bytes;
        assert!(
            left >= WARN_HEADROOM_BYTES,
            "and it must have overshot past the tripwire, or the headroom \
             sentence would print and this is the old arm: {left} left"
        );

        let loud = render(&dropped, ".");
        assert!(
            loud.contains("GRAPH TRUNCATED"),
            "a dropped emit must say so at ANY headroom:\n{loud}"
        );
        assert!(
            !loud.contains("GRAPH HEADROOM ALARM"),
            "the headroom really is fine here, and claiming otherwise \
             would be a second false alarm:\n{loud}"
        );
        assert_eq!(
            printed_dropped_files(&loud),
            dropped.fresh_truncated_files,
            "the printed count must BE stats.truncated_files, not a re-derivation:\n{loud}"
        );
        assert!(
            loud.contains("unit: FILES whose array was emptied, never"),
            "a count without its unit cannot tell an omission from a mismatch:\n{loud}"
        );
    }

    /// T-167-s5 criterion 2: where BOTH states are present the drop is
    /// the louder, and loudness here is placement — the drop sits above
    /// the headroom sentence, the way T-167-s2 put the whole block above
    /// the stat line it was escaping.
    ///
    /// A graph smaller than the tree it describes is not relief, and a
    /// block that let a reader take it for relief has failed. The order
    /// is the mechanism by which it does not.
    #[test]
    fn where_both_states_are_present_the_drop_outranks_the_headroom_line() {
        let t = TempTree::new("check-drop-order");
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
            report.fresh_truncated_symbols,
            "the fixture must really have truncated: {report:?}"
        );
        assert!(
            report.fresh_bytes > 400,
            "and must really be over budget, so BOTH sentences print: {report:?}"
        );
        let text = render(&report, ".");
        let drop_at = text
            .find("GRAPH TRUNCATED")
            .unwrap_or_else(|| panic!("no drop clause in:\n{text}"));
        let headroom_at = text
            .find("GRAPH HEADROOM ALARM")
            .unwrap_or_else(|| panic!("no headroom clause in:\n{text}"));
        assert!(
            drop_at < headroom_at,
            "the drop is the more serious state and must be read first:\n{text}"
        );
        assert!(
            text.contains("THIS IS THE LOUD ONE"),
            "and must say which of the two it is, not merely sit above it:\n{text}"
        );
    }

    /// T-167-s5's POSITIVE CONTROL FOR THE SPEND CLAUSE: ONE TREE AT TWO
    /// COMMITTED GRAPHS, with the printed spend differing by exactly the
    /// difference between them.
    ///
    /// The fresh index is held CONSTANT across the two halves and only
    /// the committed side moves, which is what makes the difference
    /// between the two printed spends a measurement rather than a
    /// coincidence: a clause that printed the tree's size, the budget,
    /// the room left, or any other property of this tree would print the
    /// SAME number in both halves and cannot pass.
    ///
    /// The third half is the criterion against wallpaper: on a CURRENT
    /// graph the two sizes are equal by construction, and a clause that
    /// printed "0" there would be the same number for everybody one
    /// column over from the one this card came to fix.
    #[test]
    fn the_block_names_this_working_trees_own_spend_and_never_a_zero() {
        let t = TempTree::new("check-spend");
        for i in 0..4 {
            t.write(&format!("src/f{i}.ts"), "export const alpha = 1;\n");
        }
        // TWO COMMITTED PAYLOADS for one tree: index at two earlier
        // states, keep both, then finish the tree so the fresh index is
        // a constant from here on.
        let older = stable_json(&index(&opts(t.root())).unwrap());
        t.write("src/f4.ts", "export const alpha = 1;\n");
        let newer = stable_json(&index(&opts(t.root())).unwrap());
        t.write("src/f5.ts", "export const alpha = 1;\n");
        assert!(
            newer.len() > older.len(),
            "the two committed graphs must differ in size to be a control: \
             {} vs {}",
            older.len(),
            newer.len()
        );

        // Arm the alarm: the spend rides the block, it does not create
        // one. Ten bytes of room, the same shape T-167-s2's control uses.
        let fresh_bytes = check(&opts(t.root())).unwrap().fresh_bytes;
        let armed = IndexOptions {
            max_graph_bytes: fresh_bytes + 10,
            ..opts(t.root())
        };
        let path = t.root().join(GRAPH_REL_PATH);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();

        let mut spends = Vec::new();
        for payload in [&older, &newer] {
            std::fs::write(&path, payload).unwrap();
            let report = check(&armed).unwrap();
            assert_eq!(
                report.fresh_bytes, fresh_bytes,
                "only the committed side may move between the halves"
            );
            let text = render(&report, ".");
            assert!(
                text.contains("GRAPH HEADROOM ALARM"),
                "the spend rides an armed block:\n{text}"
            );
            let printed = printed_spend(&text);
            assert_eq!(
                printed,
                fresh_bytes as i128 - payload.len() as i128,
                "the printed spend must BE fresh minus committed:\n{text}"
            );
            spends.push(printed);
        }

        // THE MEASUREMENT: the two spends differ by exactly the
        // difference between the two committed graphs.
        assert_eq!(
            spends[0] - spends[1],
            newer.len() as i128 - older.len() as i128,
            "one tree at two committed graphs: the spends must differ by \
             exactly what the graphs do ({spends:?})"
        );

        // NEVER A ZERO: the committed graph is now the fresh one.
        let current = index(&armed).unwrap();
        crate::write_graph(&current, &path).unwrap();
        let green = check(&armed).unwrap();
        assert!(!green.is_stale(), "the third half must be the green path: {green:?}");
        let text = render(&green, ".");
        assert!(
            text.contains("GRAPH HEADROOM ALARM"),
            "the block must still be armed, or this proves nothing:\n{text}"
        );
        assert!(
            !text.contains("WORKING TREE SPENDS") && !text.contains("WORKING TREE GIVES"),
            "a clause that says 0 every time is the wallpaper this card is against:\n{text}"
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
