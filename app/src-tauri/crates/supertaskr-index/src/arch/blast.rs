//! `supertaskr-index arch blast <path|slug>…` — how many things depend on
//! what a card touches (T-135).
//!
//! # THE NUMBER IS DERIVED, NEVER STORED
//!
//! T-135's criterion in as many words: *"a reverse index that can
//! disagree with the forward one is two implementations of the same fact
//! (T-057)"*. So there is no reverse index. [`blast`] reverses the
//! forward `import` edges **at read time**, in memory, from the graph it
//! was handed; nothing is written, no field is added to the schema, and
//! no card frontmatter records a count. If materialising it is ever
//! needed for cost, THIS derivation is the pin.
//!
//! It reads the COMMITTED graph — the same bytes `arch` and `arch drift`
//! read, and the same bytes the app renders — so the three reports cannot
//! silently disagree, and staleness stays ONE gate (`index --check`,
//! ADR-014). Every run says so on its last line.
//!
//! # WHAT IT COUNTS, AND WHAT THAT DELIBERATELY EXCLUDES
//!
//! DIRECT file→file dependents over `import` edges. Direct rather than
//! transitive because transitive saturates: in one large connected app
//! the distinct values collapse into a dense band that separates nothing.
//!
//! Three exclusions, each stated in the output rather than left for a
//! reader to discover:
//!
//! - **Symbol-level edges are not counted.** `call` and `type_ref` are
//!   symbol→symbol, and for a FILE-granularity count they are redundant
//!   in TypeScript — measured on this repository: of 1 256 TS
//!   `call`/`type_ref` edges, the number whose FILE PAIR carries no
//!   `import` edge is **zero**. In Rust they are not emitted at all
//!   (`T-010-s6`), which T-135 ruled safe for this number and unsafe for
//!   any symbol-granularity question.
//! - **A Rust cross-module PATH EXPRESSION with no `use` is invisible.**
//!   `mod` declarations became edges at T-135; `crate::a::b::f()` written
//!   inline still needs body-level name resolution, which is a card and
//!   not a clause. `arch::cycles::render` carries the same disclosure.
//! - **The cross-package seam is COMPONENT-granular only.** An import of
//!   `@supertaskr/parser` names the PACKAGE; which of that package's files
//!   the importer actually reaches needs the package's entry point
//!   resolved, and the graph does not carry it. Both available answers
//!   are wrong — attribute the seam to no file and every file of the
//!   package reads a confident zero, attribute it to all of them and each
//!   reads the package's whole importer count — so this command
//!   attributes it to NEITHER and prints `pkg-seam` beside every file it
//!   affects, naming the package and its importer count.
//!
//! # WHAT IT DOES NOT PRINT
//!
//! **A rung.** Where the ceremony rungs sit, and whether they bind at
//! all, is @human's ruling and lives in `method/tasks/TASK-FORMAT.md`;
//! this command is the measurement that ruling would read. It prints the
//! inputs to that decision — the per-file counts, the maximum, the
//! build-target roots, the coverage class — and never a verdict it has
//! not shown the working for.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use crate::graph::{Graph, Lang};

use super::glob;
use super::registry::{compare_component_ids, Component};

/// How the graph can answer for one input, in the order a caller should
/// read them. T-135 criterion 5: *"an unmeasured blast radius is not a
/// small one"* — so the two non-measured classes are kept APART, because
/// conflating them promotes the whole docs/method/tooling population to
/// the most expensive ceremony row instead of the cheapest.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Coverage {
    /// A graph entry exists for at least one file of this input.
    Measured,
    /// The input names a WALKED extension and the graph has no entry for
    /// it — either it is excluded from the walk by configuration, or the
    /// indexer could not complete it. This command reads the graph and
    /// the registry and nothing else, so it cannot tell those two apart,
    /// and it does not guess: both land here, which is the strict class.
    Unmeasured,
    /// The input names no walked extension at all, so the graph could
    /// never have had an entry for it. `docs/`, `method/`, a bare
    /// directory, a component whose declared `paths:` name no walked
    /// extension (the D3 `declared_only_component` case).
    NonCode,
}

impl Coverage {
    pub fn as_str(&self) -> &'static str {
        match self {
            Coverage::Measured => "measured",
            Coverage::Unmeasured => "unmeasured",
            Coverage::NonCode => "non-code",
        }
    }
}

/// One file of one input, with everything the caller needs to read its
/// number honestly.
#[derive(Clone, Debug, PartialEq)]
pub struct FileBlast {
    pub path: String,
    /// Distinct files carrying an `import` edge INTO this one.
    pub dependents: usize,
    /// The component that claims this path, or `None` when nothing does.
    pub component: Option<String>,
    /// True when this file is a cargo build-target root. Reverse
    /// reachability TERMINATES at a build target, so its zero is a
    /// property of the graph's shape rather than a statement about risk.
    pub build_target_root: bool,
    /// `p:<name>` of the repo-internal package this file belongs to, with
    /// that package's importer count — the seam the file-level count
    /// cannot attribute.
    pub pkg_seam: Option<(String, usize)>,
}

/// One input as it was resolved.
#[derive(Clone, Debug, PartialEq)]
pub struct InputBlast {
    /// Verbatim as the caller wrote it.
    pub input: String,
    /// `slug` or `path` — decided by shape, never by lookup order.
    pub kind: &'static str,
    /// Components a slug resolved to (empty for a path input).
    pub components: Vec<String>,
    pub files: Vec<FileBlast>,
    pub coverage: Coverage,
}

impl InputBlast {
    pub fn max_dependents(&self) -> usize {
        self.files.iter().map(|f| f.dependents).max().unwrap_or(0)
    }
}

/// The whole answer.
#[derive(Clone, Debug, PartialEq)]
pub struct BlastReport {
    pub inputs: Vec<InputBlast>,
    /// Graph-wide caveats that contaminate every number in the run: the
    /// four `stats` counters that mean "the indexer did not finish" plus
    /// the per-file `depth_refused` count. All absent means every
    /// `measured` above is a complete measurement.
    pub incomplete: Vec<String>,
}

impl BlastReport {
    pub fn total_files(&self) -> usize {
        self.inputs.iter().map(|i| i.files.len()).sum()
    }
}

/// An input the registry cannot answer. A path that has no graph entry is
/// information (a coverage class); a SLUG nobody declares is a typo, and
/// answering it with a confident zero is the failure mode this whole card
/// is about.
#[derive(Clone, Debug, PartialEq)]
pub struct UnknownSlug {
    pub slug: String,
    pub known: Vec<String>,
}

/// A slug is a bare name: no `/`, no `.`, and not empty. Everything else
/// is a path. Decided by SHAPE rather than by "try the slug table first",
/// so the same input always resolves the same way whatever the registry
/// happens to hold.
fn is_slug(input: &str) -> bool {
    !input.is_empty() && !input.contains('/') && !input.contains('.')
}

/// Every declared slug, sorted and de-duplicated — the list an unknown
/// slug is answered with.
pub fn known_slugs(components: &[Component]) -> Vec<String> {
    let mut slugs: BTreeSet<String> = BTreeSet::new();
    for component in components {
        slugs.extend(component.touch_slugs.iter().cloned());
    }
    slugs.into_iter().collect()
}

/// The blast radius of every input, or the first unknown slug.
///
/// `canon_root` is used for ONE thing: asking [`crate::resolve::rust`]
/// which walked files are cargo build-target roots, through the same
/// function the indexer itself uses. Pass `None` to skip that question —
/// the counts are unaffected and every `root=` marker simply reads false.
pub fn blast(
    root: Option<&Path>,
    components: &[Component],
    graph: &Graph,
    inputs: &[String],
) -> Result<BlastReport, UnknownSlug> {
    // --- the reverse index, built at read time and dropped at the end.
    let paths_by_id: BTreeMap<&str, &str> = graph
        .files
        .iter()
        .map(|f| (f.id.as_str(), f.path.as_str()))
        .collect();
    let mut dependents: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    // package id -> the files that import it; used for the seam note.
    let mut pkg_importers: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    for edge in &graph.edges {
        if edge.kind != "import" {
            continue;
        }
        let Some(from) = paths_by_id.get(edge.from.as_str()) else {
            continue; // imports originate in files; a dangling id is skipped
        };
        if let Some(to) = paths_by_id.get(edge.to.as_str()) {
            if from != to {
                dependents.entry(*to).or_default().insert(*from);
            }
        } else if edge.to.starts_with("p:") {
            pkg_importers
                .entry(edge.to.as_str())
                .or_default()
                .insert(*from);
        }
    }

    // --- repo-internal package directories, for the seam marker.
    let pkg_dirs: Vec<(String, String, usize)> = graph
        .packages
        .iter()
        .filter_map(|p| {
            let dir = p.path.clone()?;
            let count = pkg_importers.get(p.id.as_str()).map_or(0, BTreeSet::len);
            Some((p.id.clone(), dir, count))
        })
        .collect();

    // --- cargo build-target roots, from the indexer's OWN discovery.
    let rust_paths: Vec<&str> = graph
        .files
        .iter()
        .filter(|f| f.lang == Lang::Rust.as_str())
        .map(|f| f.path.as_str())
        .collect();
    let roots: BTreeSet<String> = match root.filter(|_| !rust_paths.is_empty()) {
        Some(root) => match root.canonicalize() {
            Ok(canon) => {
                let set: BTreeSet<&str> = rust_paths.iter().copied().collect();
                crate::resolve::rust::cargo_target_roots(&canon, &set)
                    .into_iter()
                    .map(|(file, _ident)| file)
                    .collect()
            }
            Err(_) => BTreeSet::new(),
        },
        None => BTreeSet::new(),
    };

    let mut out: Vec<InputBlast> = Vec::with_capacity(inputs.len());
    for input in inputs {
        let (kind, matched_components, paths) = if is_slug(input) {
            let owners: Vec<&Component> = components
                .iter()
                .filter(|c| c.touch_slugs.iter().any(|s| s == input))
                .collect();
            if owners.is_empty() {
                return Err(UnknownSlug {
                    slug: input.clone(),
                    known: known_slugs(components),
                });
            }
            let mut ids: Vec<String> = owners.iter().map(|c| c.id.clone()).collect();
            ids.sort_by(|a, b| compare_component_ids(a, b));
            let paths: Vec<&str> = graph
                .files
                .iter()
                .filter(|f| owners.iter().any(|c| glob::claims_path(&c.paths, &f.path)))
                .map(|f| f.path.as_str())
                .collect();
            ("slug", ids, paths)
        } else {
            let prefix = format!("{}/", input.trim_end_matches('/'));
            let paths: Vec<&str> = graph
                .files
                .iter()
                .filter(|f| f.path == *input || f.path.starts_with(&prefix))
                .map(|f| f.path.as_str())
                .collect();
            ("path", Vec::new(), paths)
        };

        let files: Vec<FileBlast> = paths
            .iter()
            .map(|path| FileBlast {
                path: (*path).to_string(),
                dependents: dependents.get(path).map_or(0, BTreeSet::len),
                component: components
                    .iter()
                    .find(|c| glob::claims_path(&c.paths, path))
                    .map(|c| c.id.clone()),
                build_target_root: roots.contains(*path),
                pkg_seam: pkg_dirs
                    .iter()
                    .find(|(_, dir, _)| path.starts_with(&format!("{dir}/")) || path == dir)
                    .map(|(id, _, count)| (id.clone(), *count)),
            })
            .collect();

        let coverage = classify(input, kind, &matched_components, components, &files);
        out.push(InputBlast {
            input: input.clone(),
            kind,
            components: matched_components,
            files,
            coverage,
        });
    }

    Ok(BlastReport {
        inputs: out,
        incomplete: incompleteness(graph),
    })
}

/// The coverage class, and every branch of it is derivable — none is a
/// judgement.
fn classify(
    input: &str,
    kind: &str,
    matched: &[String],
    components: &[Component],
    files: &[FileBlast],
) -> Coverage {
    if !files.is_empty() {
        return Coverage::Measured;
    }
    // Nothing in the graph. The question is whether the graph COULD have
    // had an entry: a walked extension means it could, and its absence is
    // then a fact about the walk rather than about the file type.
    let names_walked_extension = |text: &str| -> bool {
        text.rsplit_once('.')
            .and_then(|(_, ext)| Lang::for_extension(ext))
            .is_some()
    };
    if kind == "slug" {
        let claimed: Vec<&Component> = components
            .iter()
            .filter(|c| matched.iter().any(|id| *id == c.id))
            .collect();
        if claimed
            .iter()
            .any(|c| c.paths.iter().any(|p| names_walked_extension(p)))
        {
            return Coverage::Unmeasured;
        }
        return Coverage::NonCode;
    }
    if names_walked_extension(input) {
        Coverage::Unmeasured
    } else {
        Coverage::NonCode
    }
}

/// The graph's own admissions that it is not a complete measurement.
/// All five absent is what makes `measured` mean measured.
fn incompleteness(graph: &Graph) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    if let Some(n) = graph.stats.skipped {
        out.push(format!("stats.skipped={n}"));
    }
    if let Some(n) = graph.stats.truncated_files {
        out.push(format!("stats.truncated_files={n}"));
    }
    if graph.stats.truncated_symbols == Some(true) {
        out.push("stats.truncated_symbols=true".to_string());
    }
    if let Some(n) = graph.stats.depth_limited {
        out.push(format!("stats.depth_limited={n}"));
    }
    let refused = graph
        .files
        .iter()
        .filter(|f| f.depth_refused.is_some())
        .count();
    if refused > 0 {
        out.push(format!("files[].depth_refused={refused}"));
    }
    out
}

/// The line-oriented report, in this crate's house shape: a leading
/// keyword per line, fixed field order, no blank lines.
pub fn render(report: &BlastReport, root_label: &str, graph_label: &str, bytes: usize) -> String {
    let mut out = String::new();
    out.push_str(&format!(
        "blast  source=committed graph  root={root_label}  graph={graph_label}  bytes={bytes}  inputs={}\n",
        report.inputs.len(),
    ));
    for incomplete in &report.incomplete {
        out.push_str(&format!(
            "incomplete  {incomplete}  - every count below is a FLOOR, not a measurement\n"
        ));
    }
    for input in &report.inputs {
        let components = if input.components.is_empty() {
            "-".to_string()
        } else {
            input.components.join(",")
        };
        out.push_str(&format!(
            "input  {}  kind={}  components={}  files={}  coverage={}  max_dependents={}\n",
            input.input,
            input.kind,
            components,
            input.files.len(),
            input.coverage.as_str(),
            input.max_dependents(),
        ));
        for file in &input.files {
            out.push_str(&format!(
                "  file  {}  dependents={}  component={}",
                file.path,
                file.dependents,
                file.component.as_deref().unwrap_or(super::UNMAPPED_ID),
            ));
            if file.build_target_root {
                out.push_str("  build-target-root=yes");
            }
            if let Some((id, count)) = &file.pkg_seam {
                out.push_str(&format!("  pkg-seam={id}(importers={count})"));
            }
            out.push('\n');
        }
    }
    out.push_str(
        "note  dependents are DIRECT file->file `import` edges, reversed AT READ TIME - nothing is stored\n",
    );
    out.push_str(
        "note  `call`/`type_ref` are symbol-level and add no file pair an `import` edge does not already carry;\n",
    );
    out.push_str(
        "note  Rust emits neither (T-010-s6), and a Rust path expression with no `use` is still invisible (T-135)\n",
    );
    out.push_str(
        "note  a build-target root has zero dependents BY CONSTRUCTION - the reverse walk terminates there\n",
    );
    out.push_str(
        "note  pkg-seam files are COMPONENT-granular only: which file of a package an importer reaches is not computable here\n",
    );
    out.push_str(
        "note  coverage=unmeasured means the graph COULD have answered and did not; non-code means it never could\n",
    );
    out.push_str(
        "note  this command prints no ceremony rung - where the rungs sit is a ruling, and this is the measurement it reads\n",
    );
    out.push_str(
        "note  computed from the COMMITTED graph; `supertaskr-index index --check` is what proves it current\n",
    );
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::{Edge, FileEntry, Package, Stats};

    fn component(id: &str, paths: &[&str], slugs: &[&str]) -> Component {
        Component {
            id: id.to_string(),
            name: format!("{id} name"),
            layer: "app".to_string(),
            status: "auto".to_string(),
            paths: paths.iter().map(|p| (*p).to_string()).collect(),
            depends_on: Vec::new(),
            touch_slugs: slugs.iter().map(|s| (*s).to_string()).collect(),
            file: format!("{id}.md"),
        }
    }

    fn file(path: &str, lang: &str) -> FileEntry {
        FileEntry {
            id: format!("f:{path}"),
            path: path.to_string(),
            lang: lang.to_string(),
            hash: format!("blake3:{}", "0".repeat(64)),
            loc: 1,
            symbols: Vec::new(),
            depth_refused: None,
        }
    }

    fn import(from: &str, to: &str) -> Edge {
        Edge {
            from: from.to_string(),
            to: to.to_string(),
            kind: "import".to_string(),
            symbols: None,
            reexport: None,
            confidence: None,
        }
    }

    fn graph_of(files: &[FileEntry], edges: Vec<Edge>, packages: Vec<Package>) -> Graph {
        Graph {
            schema: 1,
            root: ".".to_string(),
            languages: vec!["ts".to_string()],
            files: files.to_vec(),
            packages,
            edges,
            unresolved: Vec::new(),
            stats: Stats {
                files: files.len(),
                symbols: 0,
                edges: 0,
                truncated_symbols: None,
                truncated_files: None,
                skipped: None,
                depth_limited: None,
            },
        }
    }

    fn run(graph: &Graph, components: &[Component], inputs: &[&str]) -> BlastReport {
        let inputs: Vec<String> = inputs.iter().map(|s| (*s).to_string()).collect();
        blast(None, components, graph, &inputs).expect("known inputs")
    }

    #[test]
    fn dependents_are_the_reversed_import_edges_and_nothing_is_written_anywhere() {
        let files = [file("src/hub.ts", "ts"), file("src/a.ts", "ts"), file("src/b.ts", "ts")];
        let graph = graph_of(
            &files,
            vec![
                import("f:src/a.ts", "f:src/hub.ts"),
                import("f:src/b.ts", "f:src/hub.ts"),
                import("f:src/b.ts", "f:src/a.ts"),
            ],
            Vec::new(),
        );
        let report = run(&graph, &[], &["src/hub.ts", "src/a.ts", "src/b.ts"]);
        let counts: Vec<usize> = report
            .inputs
            .iter()
            .map(|i| i.files.first().expect("one file").dependents)
            .collect();
        assert_eq!(counts, vec![2, 1, 0]);
        // The report is a value. There is no reverse index to disagree
        // with the forward one, which is the criterion (T-057).
        assert_eq!(report.total_files(), 3);
    }

    #[test]
    fn a_repeated_import_of_the_same_pair_is_one_dependent_and_a_self_edge_is_none() {
        let files = [file("src/hub.ts", "ts"), file("src/a.ts", "ts")];
        let graph = graph_of(
            &files,
            vec![
                import("f:src/a.ts", "f:src/hub.ts"),
                import("f:src/a.ts", "f:src/hub.ts"),
                import("f:src/hub.ts", "f:src/hub.ts"),
            ],
            Vec::new(),
        );
        let report = run(&graph, &[], &["src/hub.ts"]);
        assert_eq!(report.inputs[0].files[0].dependents, 1);
    }

    /// `call`/`type_ref` are excluded, and the exclusion has TWO
    /// independent mechanisms that this body pins apart — because either
    /// one alone would make the other's test vacuous.
    ///
    /// 1. **The kind filter.** An edge whose `kind` is not `import` is
    ///    skipped even when both its endpoints are FILE ids. Only this
    ///    arm can see that filter, because arm 2's ids never reach it.
    /// 2. **Symbol ids are never resolved back to their files.** A real
    ///    `call` edge is `s:<path>#<name>` on both ends, and those ids are
    ///    not in the file table, so nothing maps them to a file pair.
    ///
    /// The POSITIVE CONTROL sits beside both: the same pairs with a real
    /// `import` count one, so the zeroes above are exclusions and not an
    /// empty graph.
    #[test]
    fn symbol_level_edges_are_not_counted_by_either_mechanism_that_excludes_them() {
        let files = [file("src/hub.ts", "ts"), file("src/a.ts", "ts")];
        // Arm 1: FILE endpoints, non-import kind.
        let mut file_level_call = import("f:src/a.ts", "f:src/hub.ts");
        file_level_call.kind = "call".to_string();
        let by_kind = graph_of(&files, vec![file_level_call.clone()], Vec::new());
        assert_eq!(
            run(&by_kind, &[], &["src/hub.ts"]).inputs[0].files[0].dependents,
            0,
            "a non-`import` edge is not a dependency even between two files"
        );
        // Arm 2: SYMBOL endpoints, which is the real shape.
        let mut call = import("s:src/a.ts#f", "s:src/hub.ts#g");
        call.kind = "call".to_string();
        let mut type_ref = import("s:src/a.ts#f", "s:src/hub.ts#T");
        type_ref.kind = "type_ref".to_string();
        let by_id = graph_of(&files, vec![call.clone(), type_ref.clone()], Vec::new());
        assert_eq!(run(&by_id, &[], &["src/hub.ts"]).inputs[0].files[0].dependents, 0);
        // POSITIVE CONTROL.
        let with_import = graph_of(
            &files,
            vec![file_level_call, call, type_ref, import("f:src/a.ts", "f:src/hub.ts")],
            Vec::new(),
        );
        assert_eq!(
            run(&with_import, &[], &["src/hub.ts"]).inputs[0].files[0].dependents,
            1
        );
    }

    #[test]
    fn a_slug_resolves_through_touch_slugs_and_may_name_more_than_one_component() {
        let files = [file("app/x.ts", "ts"), file("lib/y.ts", "ts"), file("other/z.ts", "ts")];
        let graph = graph_of(&files, vec![import("f:other/z.ts", "f:app/x.ts")], Vec::new());
        let components = [
            component("C-05", &["app/**"], &["app-shell"]),
            component("C-16", &["lib/**"], &["app-shell"]),
            component("C-07", &["other/**"], &["crate-index"]),
        ];
        let report = run(&graph, &components, &["app-shell"]);
        let input = &report.inputs[0];
        assert_eq!(input.kind, "slug");
        assert_eq!(input.components, vec!["C-05", "C-16"]);
        assert_eq!(
            input.files.iter().map(|f| f.path.as_str()).collect::<Vec<_>>(),
            vec!["app/x.ts", "lib/y.ts"]
        );
        assert_eq!(input.max_dependents(), 1);
    }

    #[test]
    fn an_unknown_slug_is_refused_and_names_the_ones_that_exist() {
        let graph = graph_of(&[file("app/x.ts", "ts")], Vec::new(), Vec::new());
        let components = [component("C-05", &["app/**"], &["app-shell"])];
        let err = blast(None, &components, &graph, &["app-shel".to_string()])
            .expect_err("a typo must not answer zero");
        assert_eq!(err.slug, "app-shel");
        assert_eq!(err.known, vec!["app-shell"]);
        // POSITIVE CONTROL: the correctly spelled slug does resolve, so
        // the refusal above is about the spelling and not about slugs.
        assert!(blast(None, &components, &graph, &["app-shell".to_string()]).is_ok());
    }

    #[test]
    fn a_path_input_takes_a_file_or_a_directory_prefix_and_never_the_slug_table() {
        let files = [file("app/a.ts", "ts"), file("app/deep/b.ts", "ts"), file("lib/c.ts", "ts")];
        let graph = graph_of(&files, Vec::new(), Vec::new());
        let components = [component("C-05", &["app/**"], &["app"])];
        let report = run(&graph, &components, &["app/a.ts", "app", "app/"]);
        assert_eq!(report.inputs[0].kind, "path");
        assert_eq!(report.inputs[0].files.len(), 1);
        // `app` has no `/` and no `.`, so by SHAPE it is a slug — and the
        // registry declares it, so it resolves as one.
        assert_eq!(report.inputs[1].kind, "slug");
        // `app/` has a `/`: a path, matched by directory prefix.
        assert_eq!(report.inputs[2].kind, "path");
        assert_eq!(report.inputs[2].files.len(), 2);
    }

    #[test]
    fn the_three_coverage_classes_separate_and_unmeasured_is_the_strict_one() {
        let graph = graph_of(&[file("app/a.ts", "ts")], Vec::new(), Vec::new());
        let components = [
            component("C-05", &["app/**"], &["app-shell"]),
            // A component whose declared paths name no walked extension:
            // the D3 `declared_only_component` case, and the population
            // criterion 5 would otherwise promote to the top rung.
            component("C-01", &["method/**"], &["method"]),
            // …and one that DOES name a walked extension and still has no
            // file: that is genuinely unmeasured.
            component("C-99", &["gone/**/*.ts"], &["gone"]),
        ];
        let report = run(&graph, &components, &["app/a.ts", "method/x.md", "method", "gone", "src/missing.ts"]);
        let classes: Vec<&str> = report.inputs.iter().map(|i| i.coverage.as_str()).collect();
        assert_eq!(
            classes,
            vec!["measured", "non-code", "non-code", "unmeasured", "unmeasured"]
        );
    }

    #[test]
    fn the_package_seam_is_marked_rather_than_counted_as_zero() {
        let files = [file("lib/parser/src/index.ts", "ts"), file("app/x.ts", "ts")];
        let graph = graph_of(
            &files,
            vec![import("f:app/x.ts", "p:@supertaskr/parser")],
            vec![Package {
                id: "p:@supertaskr/parser".to_string(),
                name: "@supertaskr/parser".to_string(),
                ecosystem: "npm".to_string(),
                path: Some("lib/parser".to_string()),
            }],
        );
        let report = run(&graph, &[], &["lib/parser/src/index.ts"]);
        let file = &report.inputs[0].files[0];
        // The honest answer: the file-level count really is zero, AND the
        // seam that makes that zero unreadable is named beside it.
        assert_eq!(file.dependents, 0);
        assert_eq!(
            file.pkg_seam,
            Some(("p:@supertaskr/parser".to_string(), 1)),
            "a confident zero here is the failure mode the card is about"
        );
        assert!(render(&report, ".", "g.json", 1).contains("pkg-seam=p:@supertaskr/parser(importers=1)"));
    }

    #[test]
    fn a_graph_that_admits_it_is_incomplete_says_so_before_any_number() {
        let mut graph = graph_of(&[file("app/a.ts", "ts")], Vec::new(), Vec::new());
        graph.stats.skipped = Some(2);
        graph.stats.depth_limited = Some(1);
        graph.files[0].depth_refused = Some(crate::graph::DepthSite::TsCandidateScan);
        let report = run(&graph, &[], &["app/a.ts"]);
        assert_eq!(
            report.incomplete,
            vec!["stats.skipped=2", "stats.depth_limited=1", "files[].depth_refused=1"]
        );
        let text = render(&report, ".", "g.json", 1);
        let first_incomplete = text.find("incomplete  ").expect("an incomplete line");
        let first_file = text.find("  file  ").expect("a file line");
        assert!(
            first_incomplete < first_file,
            "the caveat must precede the numbers it qualifies: {text}"
        );
    }

    #[test]
    fn the_report_never_prints_a_ceremony_rung() {
        let graph = graph_of(&[file("app/a.ts", "ts")], Vec::new(), Vec::new());
        let text = render(&run(&graph, &[], &["app/a.ts"]), ".", "g.json", 1);
        // Half B is @human's ruling and lives in method/. A measurement
        // that printed a verdict would bind the ruling before it is made.
        for forbidden in ["rung", "verifier", "integrator", "ceremony rung"] {
            assert!(
                !text.contains(&format!("{forbidden} ")) || text.contains("prints no ceremony rung"),
                "{forbidden}: {text}"
            );
        }
        assert!(text.contains("prints no ceremony rung"), "{text}");
        assert!(text.contains("computed from the COMMITTED graph"), "{text}");
    }

    /// THE FLOOR RULE'S INPUT. Reverse reachability terminates at a
    /// build target, so a root's zero is a property of the graph's shape
    /// and not a statement about risk — `app/src-tauri/src/lib.rs` is the
    /// live case, and it is the file T-126 touched.
    ///
    /// Root-ness comes from `resolve::rust::cargo_target_roots`, the same
    /// function the indexer itself walks the module tree from. There is
    /// exactly one implementation of "what is a cargo target" and this
    /// reads it (T-057).
    #[test]
    fn a_cargo_build_target_root_is_marked_and_its_neighbour_is_not() {
        let tree = crate::testutil::TempTree::new("blast-roots");
        tree.write("Cargo.toml", "[package]\nname = \"demo\"\n");
        tree.write("src/lib.rs", "pub mod util;\n");
        tree.write("src/util.rs", "pub struct Helper;\n");
        tree.write("src/main.rs", "fn main() {}\n");
        let files = [
            file("src/lib.rs", "rust"),
            file("src/main.rs", "rust"),
            file("src/util.rs", "rust"),
        ];
        let graph = graph_of(&files, vec![import("f:src/lib.rs", "f:src/util.rs")], Vec::new());
        // `src/` and not `src`: a bare word is a SLUG by shape, which is
        // the rule and is worth meeting once here.
        let inputs = vec!["src/".to_string()];
        let report = blast(Some(tree.root()), &[], &graph, &inputs).expect("paths only");
        let marks: Vec<(&str, usize, bool)> = report.inputs[0]
            .files
            .iter()
            .map(|f| (f.path.as_str(), f.dependents, f.build_target_root))
            .collect();
        assert_eq!(
            marks,
            vec![
                ("src/lib.rs", 0, true),   // the lib target: zero BY CONSTRUCTION
                ("src/main.rs", 0, true),  // an auto-discovered bin target
                ("src/util.rs", 1, false), // an ordinary module: zero would mean something
            ]
        );
        assert!(render(&report, ".", "g.json", 1).contains("build-target-root=yes"));
    }

    #[test]
    fn the_answer_does_not_depend_on_the_order_the_registry_was_read_in() {
        let files = [file("app/a.ts", "ts"), file("lib/b.ts", "ts")];
        let graph = graph_of(&files, vec![import("f:lib/b.ts", "f:app/a.ts")], Vec::new());
        let forward = vec![
            component("C-05", &["app/**"], &["s"]),
            component("C-16", &["lib/**"], &["s"]),
        ];
        let mut backward = forward.clone();
        backward.reverse();
        assert_eq!(run(&graph, &forward, &["s"]), run(&graph, &backward, &["s"]));
    }
}
