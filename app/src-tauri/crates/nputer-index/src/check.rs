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
             ({} bytes, {ff} files, {fs} symbols, {fe} edges)\n",
            rel_display(&report.graph_path, root_label),
            report.committed_bytes,
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
    out.push_str(&format!(
        "[nputer-index]\n[nputer-index]   regenerate: nputer-index index --root {root_label}\n"
    ));
    out
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
