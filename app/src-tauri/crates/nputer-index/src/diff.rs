//! Structural diff between two graphs — what `--check` prints when the
//! committed graph is stale.
//!
//! This closes T-009 plan §5.5's one deferral: `diff()` was left out of
//! T-009 with the note "deferred to T-014, its only consumer; byte-compare
//! covers staleness until then". Byte-compare is still the VERDICT (the
//! contract is byte identity, ADR-014); this module only explains it.
//!
//! Legibility is the point (T-046's standard: "a gate whose failure is not
//! legible is half a gate"). An integrator who reads a `--check` failure
//! must be able to act without re-running a regen to find out what moved —
//! so the report names the files, the counts and the exact edges.
//!
//! Determinism: every list is built from the graphs' own sorted arrays and
//! set-differenced in place, so the same pair of graphs always renders the
//! same bytes.

use std::collections::BTreeMap;

use crate::graph::{Edge, FileEntry, Graph, Package, Unresolved};

/// A file present in both graphs whose content moved.
#[derive(Clone, Debug, PartialEq)]
pub struct FileChange {
    pub path: String,
    /// The blake3 hash moved — the file's bytes are different.
    pub hash_changed: bool,
    /// `(before, after)` line counts.
    pub loc: (usize, usize),
    /// `(before, after)` symbol counts.
    pub symbols: (usize, usize),
}

/// The structural delta from `a` (committed) to `b` (fresh).
///
/// Every `Vec` is sorted and free of machine identity — the same
/// determinism rules the graph itself obeys.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct GraphDiff {
    /// `schema`/`root`/`languages`/`stats` movement, one rendered line each.
    pub meta: Vec<String>,
    pub files_added: Vec<String>,
    pub files_removed: Vec<String>,
    pub files_changed: Vec<FileChange>,
    pub packages_added: Vec<String>,
    pub packages_removed: Vec<String>,
    pub edges_added: Vec<String>,
    pub edges_removed: Vec<String>,
    pub unresolved_added: Vec<String>,
    pub unresolved_removed: Vec<String>,
}

impl GraphDiff {
    /// True when the two graphs carry the same content. Note this can be
    /// true while the BYTES differ — a hand-edited or reformatted
    /// graph.json is the case, and `--check` says so in as many words
    /// rather than printing an empty delta (ADR-014: never hand-edited).
    pub fn is_empty(&self) -> bool {
        self.meta.is_empty()
            && self.files_added.is_empty()
            && self.files_removed.is_empty()
            && self.files_changed.is_empty()
            && self.packages_added.is_empty()
            && self.packages_removed.is_empty()
            && self.edges_added.is_empty()
            && self.edges_removed.is_empty()
            && self.unresolved_added.is_empty()
            && self.unresolved_removed.is_empty()
    }
}

/// Diff two graphs. Pure, allocation-only, never fails.
pub fn diff(a: &Graph, b: &Graph) -> GraphDiff {
    let mut out = GraphDiff::default();

    if a.schema != b.schema {
        out.meta.push(format!("schema {} -> {}", a.schema, b.schema));
    }
    if a.root != b.root {
        out.meta.push(format!("root {:?} -> {:?}", a.root, b.root));
    }
    if a.languages != b.languages {
        out.meta.push(format!(
            "languages [{}] -> [{}]",
            a.languages.join(", "),
            b.languages.join(", ")
        ));
    }
    for (label, before, after) in [
        ("stats.truncated_symbols", a.stats.truncated_symbols, b.stats.truncated_symbols)
    ] {
        if before != after {
            out.meta.push(format!("{label} {before:?} -> {after:?}"));
        }
    }
    if a.stats.truncated_files != b.stats.truncated_files {
        out.meta.push(format!(
            "stats.truncated_files {:?} -> {:?}",
            a.stats.truncated_files, b.stats.truncated_files
        ));
    }
    if a.stats.skipped != b.stats.skipped {
        out.meta.push(format!(
            "stats.skipped {:?} -> {:?}",
            a.stats.skipped, b.stats.skipped
        ));
    }

    // Files: added / removed / content-changed.
    let before: BTreeMap<&str, &FileEntry> =
        a.files.iter().map(|f| (f.path.as_str(), f)).collect();
    let after: BTreeMap<&str, &FileEntry> = b.files.iter().map(|f| (f.path.as_str(), f)).collect();
    for (path, entry) in &after {
        match before.get(path) {
            None => out.files_added.push((*path).to_string()),
            Some(old) => {
                let hash_changed = old.hash != entry.hash;
                let loc = (old.loc, entry.loc);
                let symbols = (old.symbols.len(), entry.symbols.len());
                // Symbol-level movement inside an unchanged-hash file is
                // impossible (the hash IS the content), so hash + counts
                // describe the change completely.
                if hash_changed || loc.0 != loc.1 || symbols.0 != symbols.1 {
                    out.files_changed.push(FileChange {
                        path: (*path).to_string(),
                        hash_changed,
                        loc,
                        symbols,
                    });
                }
            }
        }
    }
    for path in before.keys() {
        if !after.contains_key(path) {
            out.files_removed.push((*path).to_string());
        }
    }

    diff_lines(
        a.packages.iter().map(render_package),
        b.packages.iter().map(render_package),
        &mut out.packages_added,
        &mut out.packages_removed,
    );
    diff_lines(
        a.edges.iter().map(render_edge),
        b.edges.iter().map(render_edge),
        &mut out.edges_added,
        &mut out.edges_removed,
    );
    diff_lines(
        a.unresolved.iter().map(render_unresolved),
        b.unresolved.iter().map(render_unresolved),
        &mut out.unresolved_added,
        &mut out.unresolved_removed,
    );

    out
}

/// Set-difference two rendered line streams. Rendering the WHOLE record
/// (not just its identity key) is deliberate: an edge whose `symbols` list
/// moved reads as one removed + one added line rather than vanishing from
/// the report.
fn diff_lines<A, B>(a: A, b: B, added: &mut Vec<String>, removed: &mut Vec<String>)
where
    A: Iterator<Item = String>,
    B: Iterator<Item = String>,
{
    let before: std::collections::BTreeSet<String> = a.collect();
    let after: std::collections::BTreeSet<String> = b.collect();
    added.extend(after.difference(&before).cloned());
    removed.extend(before.difference(&after).cloned());
}

pub(crate) fn render_package(pkg: &Package) -> String {
    match &pkg.path {
        Some(path) => format!("{} ({}) path={}", pkg.id, pkg.ecosystem, path),
        None => format!("{} ({})", pkg.id, pkg.ecosystem),
    }
}

pub(crate) fn render_edge(edge: &Edge) -> String {
    let mut line = format!("{} -> {} ({})", edge.from, edge.to, edge.kind);
    if let Some(symbols) = &edge.symbols {
        line.push_str(&format!(" symbols=[{}]", symbols.join(",")));
    }
    if edge.reexport == Some(true) {
        line.push_str(" reexport");
    }
    if let Some(confidence) = &edge.confidence {
        line.push_str(&format!(" confidence={confidence}"));
    }
    line
}

pub(crate) fn render_unresolved(entry: &Unresolved) -> String {
    format!("{} -> {:?} ({})", entry.from, entry.specifier, entry.reason)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::{Stats, Symbol};

    fn file(path: &str, hash_seed: char, loc: usize, symbols: &[&str]) -> FileEntry {
        FileEntry {
            id: format!("f:{path}"),
            path: path.to_string(),
            lang: "ts".to_string(),
            hash: format!("blake3:{}", hash_seed.to_string().repeat(64)),
            loc,
            symbols: symbols
                .iter()
                .map(|n| Symbol {
                    id: format!("s:{path}#{n}"),
                    name: (*n).to_string(),
                    kind: "const".to_string(),
                    exported: true,
                    range: [1, 2],
                })
                .collect(),
        }
    }

    fn graph(files: Vec<FileEntry>, edges: Vec<Edge>) -> Graph {
        Graph {
            schema: 1,
            root: ".".to_string(),
            languages: vec!["ts".to_string()],
            stats: Stats {
                files: files.len(),
                symbols: files.iter().map(|f| f.symbols.len()).sum(),
                edges: edges.len(),
                truncated_symbols: None,
                truncated_files: None,
                skipped: None,
            },
            files,
            packages: vec![],
            edges,
            unresolved: vec![],
        }
    }

    fn import(from: &str, to: &str, symbols: &[&str]) -> Edge {
        Edge {
            from: from.to_string(),
            to: to.to_string(),
            kind: "import".to_string(),
            symbols: Some(symbols.iter().map(|s| (*s).to_string()).collect()),
            reexport: None,
            confidence: None,
        }
    }

    #[test]
    fn identical_graphs_diff_to_nothing() {
        let g = graph(vec![file("a.ts", 'a', 3, &["one"])], vec![]);
        let d = diff(&g, &g);
        assert!(d.is_empty(), "{d:?}");
    }

    #[test]
    fn added_removed_and_changed_files_are_each_reported() {
        let before = graph(
            vec![file("a.ts", 'a', 3, &["one"]), file("gone.ts", 'b', 1, &[])],
            vec![],
        );
        let after = graph(
            vec![file("a.ts", 'c', 9, &["one", "two"]), file("new.ts", 'd', 2, &[])],
            vec![],
        );
        let d = diff(&before, &after);
        assert_eq!(d.files_added, vec!["new.ts"]);
        assert_eq!(d.files_removed, vec!["gone.ts"]);
        assert_eq!(
            d.files_changed,
            vec![FileChange {
                path: "a.ts".to_string(),
                hash_changed: true,
                loc: (3, 9),
                symbols: (1, 2),
            }]
        );
        assert!(!d.is_empty());
    }

    #[test]
    fn an_edge_whose_symbol_list_moved_reads_as_removed_plus_added() {
        let before = graph(vec![], vec![import("f:a.ts", "f:b.ts", &["one"])]);
        let after = graph(vec![], vec![import("f:a.ts", "f:b.ts", &["one", "two"])]);
        let d = diff(&before, &after);
        assert_eq!(d.edges_removed, vec!["f:a.ts -> f:b.ts (import) symbols=[one]"]);
        assert_eq!(
            d.edges_added,
            vec!["f:a.ts -> f:b.ts (import) symbols=[one,two]"]
        );
    }

    #[test]
    fn meta_movement_is_reported_even_when_the_payload_is_identical() {
        let mut before = graph(vec![file("a.ts", 'a', 1, &[])], vec![]);
        let mut after = before.clone();
        after.languages = vec!["js".to_string(), "ts".to_string()];
        after.stats.skipped = Some(2);
        before.schema = 1;
        let d = diff(&before, &after);
        assert_eq!(
            d.meta,
            vec![
                "languages [ts] -> [js, ts]".to_string(),
                "stats.skipped None -> Some(2)".to_string(),
            ]
        );
        assert!(!d.is_empty());
    }

    #[test]
    fn diff_is_deterministic_and_sorted() {
        let before = graph(
            vec![file("z.ts", 'a', 1, &[]), file("a.ts", 'a', 1, &[])],
            vec![import("f:z.ts", "f:a.ts", &["x"])],
        );
        let after = graph(vec![], vec![]);
        let one = diff(&before, &after);
        let two = diff(&before, &after);
        assert_eq!(one, two);
        assert_eq!(one.files_removed, vec!["a.ts", "z.ts"], "sorted by path");
    }
}
