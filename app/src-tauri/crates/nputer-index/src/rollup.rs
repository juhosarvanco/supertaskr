//! T-140-s1 — THE RESTING PAYLOAD, AND THE PULL THAT ANSWERS FOR WHAT IS
//! ON SCREEN.
//!
//! WHAT THIS MODULE IS FOR, stated as the defect it removes. Until this
//! module, the map pane derived its component picture IN THE PANE, from
//! `graph.files[]` and the file-level `import` edges: `derive.ts` matched
//! every file path against the registry's globs and rolled the file edges
//! up into component edges. So the pane needed the whole skeleton to draw
//! fifteen boxes — and the skeleton is exactly the part of the committed
//! graph that is LINEAR IN FILE COUNT and that no truncation can reclaim
//! (`emit::apply_budget` may empty every symbol array; it may never drop
//! a file or an `import` edge). T-140 measured that floor at 1 131
//! bytes/file over this repository and derived the file ceiling it
//! implies; `check::floor_line` prints both at every gate run.
//!
//! [`Rollup`] is the other side of that trade. It carries what the map
//! draws AT REST — components, the observed and declared component edges
//! with their counts, and per-component file COUNTS — and NOTHING that is
//! keyed by a file. Its size is a function of the REGISTRY, not of the
//! tree: fifteen components and their edges serialize the same whether
//! the repository holds 189 files or 20 000. That property is the point,
//! it is what T-140's criterion 6 asked for, and it is pinned as a
//! RELATION rather than as a size in `tests/budget.rs`
//! (`the_resting_rollup_does_not_grow_with_the_file_count`), which is the
//! body that replaced the one this shape retired.
//!
//! **FLAT BY CONSTRUCTION, NOT BY MEASUREMENT.** Every collection here is
//! bounded by the registry: `components` by its size, `edges` by its
//! size squared, D1/D3/D5 by the same. The two findings that ARE keyed by
//! files — D2 (unclaimed territory) and D4 (a path more than one
//! component claims) — collapse to a COUNT here and hand their bodies to
//! the pull. A future finding that carries a per-file list must do the
//! same or it silently reintroduces the defect; that is why the tally
//! shape is spelled out in [`RollupFinding`] rather than left to
//! judgement.
//!
//! **WHAT IS DELIBERATELY ABSENT.** No status rollup, no provenance
//! rollup, no task join, no `component:` field, no ADR-016 marks. ADR-015
//! assigns intent⨝tasks to TypeScript and this module does not reopen
//! it: `arch`'s module doc states the scope line and this module sits
//! inside it. What travels here is the REALITY side, which is the side
//! this crate already computes.

use serde::Serialize;

use crate::arch::{ArchModel, Finding, UNMAPPED_ID};
use crate::error::IndexError;
use crate::graph::{Graph, Symbol, Unresolved};

/// How many paths ONE pull answers with before it clips and says so.
///
/// **THIS IS A DISPLAY CAP AND NOT THE CAP T-140 REFUSED**, and the
/// distinction is the whole reason a number is allowed to live here at
/// all. What T-140 refused — and what `T-151` reserves to @human — is a
/// limit on how much of a CODEBASE the map can know: a number of that
/// class decides whether a project is mappable, moves a cliff whose
/// driver is linear in file count, and buys a factor while leaving the
/// curve alone. This one decides how many rows one drill-in list shows
/// before it says "and N more". It cannot make a project unmappable,
/// because the map at rest is [`Rollup`] and the rollup carries no file
/// list at all; and it degrades honestly rather than refusing — the
/// answer carries `total` beside the clipped slice, so the pane can
/// always tell the truth about what it did not receive.
///
/// The value is one screen's worth with room to scroll, and nothing in
/// this crate or the app derives a project size from it.
pub const MAX_DETAIL_FILES: usize = 500;

/// The map's resting payload (T-140-s1 criterion 1).
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Rollup {
    pub schema: u32,
    /// One entry per declared component, registry order, plus the
    /// synthetic unmapped node when unclaimed territory exists — so the
    /// pane can draw every node it draws today without a file list.
    pub components: Vec<RollupComponent>,
    /// Observed AND declared component edges, each with the number of
    /// file-level import edges behind it. `observed == 0` is a `planned`
    /// edge; the count is what the pane's edge weight reads.
    pub edges: Vec<RollupEdge>,
    /// D1/D3/D5 in full (bounded by the registry); D2/D4 as tallies.
    pub findings: Vec<RollupFinding>,
    pub stats: RollupStats,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct RollupComponent {
    pub id: String,
    /// How many indexed files this component claims. A COUNT, never a
    /// list — the list is [`Detail::Component`]'s.
    pub files: usize,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct RollupEdge {
    pub from: String,
    pub to: String,
    /// "confirmed" | "planned" | "undeclared" — `Relation::as_str`.
    pub relation: String,
    pub declared: bool,
    /// File-level import edges behind this component edge.
    pub observed: usize,
}

/// A finding as the resting payload carries it.
///
/// D1/D3/D5 name components and are bounded by the registry, so they
/// travel whole. D2 and D4 are keyed by FILES — D2 lists every unclaimed
/// path, D4 exists once per ambiguously-claimed path — so they travel as
/// ONE tally each, with `count` carrying the honest number and the bodies
/// reachable through the pull. A finding rule added later that carries a
/// per-file list belongs in the second group, not the first.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct RollupFinding {
    /// "D1" | "D2" | "D3" | "D4" | "D5".
    pub rule: String,
    /// The finding's own id for D1/D3/D5; the bare rule name for the two
    /// tallies, whose members have no single id.
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub component: Option<String>,
    /// How many members the tally covers (D2: unclaimed paths; D4:
    /// ambiguously-claimed paths). Absent on the per-component rules.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub count: Option<usize>,
}

/// Content-determined totals. Counts only — nothing keyed by a file.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct RollupStats {
    /// Indexed files the graph carries.
    pub files: usize,
    /// Symbols the graph carries (0 when the budget emptied them).
    pub symbols: usize,
    /// Edges the graph carries, every kind.
    pub edges: usize,
    /// Declared components in the registry.
    pub components: usize,
    /// Indexed files some component claims.
    pub mapped: usize,
    /// Unclaimed paths (files plus repo-internal package dirs).
    pub unmapped: usize,
    /// True when the graph's own symbol arrays were emptied by the emit
    /// budget — the state `MapView`'s truncation note already renders.
    pub truncated_symbols: bool,
}

/// Roll an [`ArchModel`] up into the resting payload.
///
/// Pure over its inputs, like [`crate::arch::join`], so tests can drive
/// it with hand-built registries and synthetic trees.
pub fn rollup(model: &ArchModel, graph: &Graph) -> Rollup {
    let mut components: Vec<RollupComponent> = model
        .components
        .iter()
        .map(|component| RollupComponent {
            id: component.id.clone(),
            files: model
                .files_per_component
                .get(&component.id)
                .map(Vec::len)
                .unwrap_or(0),
        })
        .collect();
    if !model.unmapped.is_empty() {
        // The synthetic node is a node the pane draws, so it is a node
        // the resting payload carries — with a count, like every other.
        components.push(RollupComponent {
            id: UNMAPPED_ID.to_string(),
            files: model.unmapped.len(),
        });
    }

    let edges: Vec<RollupEdge> = model
        .edges
        .iter()
        .map(|edge| RollupEdge {
            from: edge.from.clone(),
            to: edge.to.clone(),
            relation: edge.relation.as_str().to_string(),
            declared: edge.declared,
            observed: edge.file_edges.len(),
        })
        .collect();

    let mut findings: Vec<RollupFinding> = Vec::new();
    let mut ambiguous = 0usize;
    for finding in &model.findings {
        match finding {
            Finding::D1 { id, from, to, .. } => findings.push(RollupFinding {
                rule: "D1".to_string(),
                id: id.clone(),
                from: Some(from.clone()),
                to: Some(to.clone()),
                component: None,
                count: None,
            }),
            Finding::D3 { id, component } => findings.push(RollupFinding {
                rule: "D3".to_string(),
                id: id.clone(),
                from: None,
                to: None,
                component: Some(component.clone()),
                count: None,
            }),
            Finding::D5 { id, from, to } => findings.push(RollupFinding {
                rule: "D5".to_string(),
                id: id.clone(),
                from: Some(from.clone()),
                to: Some(to.clone()),
                component: None,
                count: None,
            }),
            // The two file-keyed rules do not travel per member.
            Finding::D2 { .. } => {}
            Finding::D4 { .. } => ambiguous += 1,
        }
    }
    if !model.unmapped.is_empty() {
        findings.push(RollupFinding {
            rule: "D2".to_string(),
            id: format!("D2:{UNMAPPED_ID}"),
            from: None,
            to: None,
            component: Some(UNMAPPED_ID.to_string()),
            count: Some(model.unmapped.len()),
        });
    }
    if ambiguous > 0 {
        findings.push(RollupFinding {
            rule: "D4".to_string(),
            id: "D4".to_string(),
            from: None,
            to: None,
            component: None,
            count: Some(ambiguous),
        });
    }
    findings.sort_by(|a, b| a.id.cmp(&b.id));

    Rollup {
        schema: 1,
        components,
        edges,
        findings,
        stats: RollupStats {
            files: graph.stats.files,
            symbols: graph.stats.symbols,
            edges: graph.stats.edges,
            components: model.components.len(),
            mapped: model.mapped_files(),
            unmapped: model.unmapped.len(),
            truncated_symbols: graph.stats.truncated_symbols == Some(true),
        },
    }
}

/// One file-level import edge, as a detail answer carries it.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct DetailEdge {
    /// Source file path.
    pub from: String,
    /// Target file path, or the repo-internal package directory.
    pub to: String,
    /// Present when the edge went through a package node (`p:` id).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package: Option<String>,
}

/// The pull's answer (T-140-s1 criterion 2).
///
/// `Unknown` IS AN ANSWER AND NOT AN ERROR, and that is deliberate. The
/// target names something the caller believes is on screen; a target the
/// document does not carry is a stale view or a hostile payload, and
/// either way the honest reply is "I do not have that", named, rather
/// than an empty list that reads as "that component has no files".
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum Detail {
    /// `c:<component-id>` — that component's claimed file paths.
    Component {
        id: String,
        files: Vec<String>,
        /// The honest total even when `files` is clipped.
        total: usize,
        truncated: bool,
    },
    /// `c:unmapped` — the D2 body.
    Unmapped {
        files: Vec<String>,
        total: usize,
        truncated: bool,
    },
    /// `f:<path>` — that file's own detail: the T2 half T-140 measured as
    /// already drill-only.
    File {
        path: String,
        lang: String,
        loc: usize,
        hash: String,
        symbols: Vec<Symbol>,
        /// Import edges this file is the SOURCE of.
        imports: Vec<DetailEdge>,
        /// Import edges naming this file as the target.
        importers: Vec<DetailEdge>,
        /// Specifiers this file names that resolved to nothing.
        unresolved: Vec<Unresolved>,
    },
    /// The refusal: no such target in this document.
    Unknown { target: String },
}

/// Answer one pull.
///
/// **THE TARGET IS A KEY INTO A DOCUMENT, NEVER A PATH THE PROCESS
/// OPENS.** `f:<path>` is looked up in `graph.files` by its own id and
/// `c:<id>` in the registry the model already read; nothing here joins
/// the target onto the project root, opens a file, or reaches the
/// filesystem at all. That is what keeps ADR-010's containment intact
/// while still letting the webview say WHICH thing the user opened —
/// the argument selects from what the process already holds, so a
/// traversal string is not a traversal, it is a miss.
pub fn detail(model: &ArchModel, graph: &Graph, target: &str) -> Detail {
    let unknown = || Detail::Unknown {
        target: target.to_string(),
    };
    if let Some(id) = target.strip_prefix("c:") {
        if id == UNMAPPED_ID {
            if model.unmapped.is_empty() {
                return unknown();
            }
            let total = model.unmapped.len();
            let files: Vec<String> = model.unmapped.iter().take(MAX_DETAIL_FILES).cloned().collect();
            return Detail::Unmapped {
                truncated: files.len() < total,
                files,
                total,
            };
        }
        if !model.components.iter().any(|c| c.id == id) {
            return unknown();
        }
        let all = model.files_per_component.get(id);
        let total = all.map(Vec::len).unwrap_or(0);
        let files: Vec<String> = all
            .map(|paths| paths.iter().take(MAX_DETAIL_FILES).cloned().collect())
            .unwrap_or_default();
        return Detail::Component {
            id: id.to_string(),
            truncated: files.len() < total,
            files,
            total,
        };
    }
    if target.starts_with("f:") {
        let Some(file) = graph.files.iter().find(|f| f.id == target) else {
            return unknown();
        };
        let path_of = |id: &str| -> Option<String> {
            if let Some(rest) = id.strip_prefix("f:") {
                return Some(rest.to_string());
            }
            if id.starts_with("p:") {
                return graph
                    .packages
                    .iter()
                    .find(|p| p.id == id)
                    .map(|p| p.path.clone().unwrap_or_else(|| p.name.clone()));
            }
            None
        };
        let mut imports: Vec<DetailEdge> = Vec::new();
        let mut importers: Vec<DetailEdge> = Vec::new();
        for edge in &graph.edges {
            if edge.kind != "import" {
                continue;
            }
            if edge.from == file.id {
                if let Some(to) = path_of(&edge.to) {
                    imports.push(DetailEdge {
                        from: file.path.clone(),
                        to,
                        package: edge.to.starts_with("p:").then(|| edge.to.clone()),
                    });
                }
            } else if edge.to == file.id {
                if let Some(from) = path_of(&edge.from) {
                    importers.push(DetailEdge {
                        from,
                        to: file.path.clone(),
                        package: None,
                    });
                }
            }
        }
        return Detail::File {
            path: file.path.clone(),
            lang: file.lang.clone(),
            loc: file.loc,
            hash: file.hash.clone(),
            symbols: file.symbols.clone(),
            imports,
            importers,
            unresolved: graph
                .unresolved
                .iter()
                .filter(|u| u.from == file.id)
                .cloned()
                .collect(),
        };
    }
    unknown()
}

/// The rollup's stable serialization — the same shape `stable_json` gives
/// the graph (2-space pretty, declaration-order keys, trailing LF), so a
/// byte length measured here is comparable with one measured there. This
/// is what `tests/budget.rs` weighs when it pins the relation.
pub fn stable_rollup_json(value: &Rollup) -> String {
    stable_string(value).expect("rollup serialization is infallible")
}

/// The same, for a pull answer.
pub fn stable_detail_json(value: &Detail) -> String {
    stable_string(value).expect("detail serialization is infallible")
}

fn stable_string<T: Serialize>(value: &T) -> Result<String, IndexError> {
    let mut buf: Vec<u8> = Vec::with_capacity(8 * 1024);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"  ");
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    value
        .serialize(&mut ser)
        .map_err(|e| IndexError::Serialize(e.to_string()))?;
    buf.push(b'\n');
    String::from_utf8(buf).map_err(|e| IndexError::Serialize(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arch::join;
    use crate::arch::registry::Component;
    use crate::graph::{Edge, FileEntry, Package, Stats};

    fn component(id: &str, paths: &[&str], deps: &[&str]) -> Component {
        Component {
            id: id.to_string(),
            name: format!("{id} name"),
            layer: "app".to_string(),
            status: "auto".to_string(),
            paths: paths.iter().map(|p| (*p).to_string()).collect(),
            depends_on: deps.iter().map(|d| (*d).to_string()).collect(),
            touch_slugs: vec![id.to_ascii_lowercase()],
            file: format!("{id}.md"),
        }
    }

    fn file(path: &str) -> FileEntry {
        FileEntry {
            id: format!("f:{path}"),
            path: path.to_string(),
            lang: "ts".to_string(),
            hash: format!("blake3:{}", "0".repeat(64)),
            loc: 3,
            symbols: vec![Symbol {
                id: format!("s:{path}#thing"),
                name: "thing".to_string(),
                kind: "const".to_string(),
                exported: true,
                range: [1, 1],
            }],
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

    fn graph(files: Vec<FileEntry>, packages: Vec<Package>, edges: Vec<Edge>) -> Graph {
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
                depth_limited: None,
            },
            files,
            packages,
            edges,
            unresolved: vec![],
        }
    }

    #[test]
    fn the_rollup_carries_counts_and_edges_and_no_file_path_anywhere() {
        let g = graph(
            vec![file("a/x.ts"), file("a/y.ts"), file("b/z.ts"), file("orphan.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/z.ts"), import("f:a/y.ts", "f:orphan.ts")],
        );
        let m = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );
        let r = rollup(&m, &g);

        assert_eq!(
            r.components,
            vec![
                RollupComponent { id: "C-01".to_string(), files: 2 },
                RollupComponent { id: "C-02".to_string(), files: 1 },
                RollupComponent { id: UNMAPPED_ID.to_string(), files: 1 },
            ],
            "every node the pane draws, each with a COUNT"
        );
        assert_eq!(r.stats.files, 4);
        assert_eq!(r.stats.mapped, 3);
        assert_eq!(r.stats.unmapped, 1);
        assert_eq!(r.stats.components, 2);

        let observed: Vec<(&str, &str, &str, usize)> = r
            .edges
            .iter()
            .map(|e| (e.from.as_str(), e.to.as_str(), e.relation.as_str(), e.observed))
            .collect();
        assert_eq!(
            observed,
            vec![("C-01", "C-02", "undeclared", 1), ("C-01", UNMAPPED_ID, "undeclared", 1)]
        );

        // THE LOAD-BEARING CLAUSE: no file path travels at rest. Every
        // path in this fixture is checked by name, so a field added later
        // that carries one fails here rather than silently restoring the
        // linear payload this shape exists to remove.
        let doc = stable_rollup_json(&r);
        for path in ["a/x.ts", "a/y.ts", "b/z.ts", "orphan.ts"] {
            assert!(!doc.contains(path), "the resting payload named {path}:\n{doc}");
        }
        assert!(!doc.contains("s:"), "no symbol id travels at rest:\n{doc}");
    }

    #[test]
    fn the_two_file_keyed_findings_travel_as_tallies_and_the_rest_travel_whole() {
        // Two components claiming the same path (D4 — and the loser
        // therefore owns no file, which is a second D3), an unclaimed
        // file (D2), a component whose globs match nothing (D3), a
        // dangling depends_on (D5) and an undeclared crossing (D1).
        let g = graph(
            vec![file("a/x.ts"), file("b/z.ts"), file("orphan.ts"), file("other.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/z.ts")],
        );
        let m = join(
            vec![
                component("C-01", &["a/**", "orphan.ts"], &["C-99"]),
                component("C-02", &["b/**"], &[]),
                component("C-03", &["a/**"], &[]),
                component("C-04", &["nothing/**"], &[]),
            ],
            &g,
        );
        assert_eq!(m.count("D4"), 1, "the fixture must really be ambiguous");
        let r = rollup(&m, &g);

        let rules: Vec<(&str, &str, Option<usize>)> = r
            .findings
            .iter()
            .map(|f| (f.rule.as_str(), f.id.as_str(), f.count))
            .collect();
        assert_eq!(
            rules,
            vec![
                ("D1", "D1:C-01->C-02", None),
                ("D2", "D2:unmapped", Some(1)),
                ("D3", "D3:C-03", None),
                ("D3", "D3:C-04", None),
                ("D4", "D4", Some(1)),
                ("D5", "D5:C-01->C-99", None),
            ],
            "D1/D3/D5 whole, D2/D4 as one tally each"
        );
        let doc = stable_rollup_json(&r);
        assert!(!doc.contains("other.ts"), "the D2 body stays in the pull:\n{doc}");
        assert!(!doc.contains("a/x.ts"), "the D4 body stays in the pull:\n{doc}");
    }

    #[test]
    fn the_pull_answers_a_component_a_file_and_the_unclaimed_group() {
        let g = graph(
            vec![file("a/x.ts"), file("a/y.ts"), file("b/z.ts"), file("orphan.ts")],
            vec![Package {
                id: "p:@nputer/parser".to_string(),
                name: "@nputer/parser".to_string(),
                ecosystem: "npm".to_string(),
                path: Some("lib/parser".to_string()),
            }],
            vec![
                import("f:a/x.ts", "f:b/z.ts"),
                import("f:a/y.ts", "f:a/x.ts"),
                import("f:a/x.ts", "p:@nputer/parser"),
            ],
        );
        let m = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );

        match detail(&m, &g, "c:C-01") {
            Detail::Component { id, files, total, truncated } => {
                assert_eq!(id, "C-01");
                assert_eq!(files, vec!["a/x.ts".to_string(), "a/y.ts".to_string()]);
                assert_eq!(total, 2);
                assert!(!truncated);
            }
            other => panic!("expected Component, got {other:?}"),
        }

        match detail(&m, &g, "c:unmapped") {
            Detail::Unmapped { files, total, .. } => {
                assert_eq!(files, vec!["lib/parser".to_string(), "orphan.ts".to_string()]);
                assert_eq!(total, 2);
            }
            other => panic!("expected Unmapped, got {other:?}"),
        }

        match detail(&m, &g, "f:a/x.ts") {
            Detail::File { path, lang, loc, symbols, imports, importers, .. } => {
                assert_eq!(path, "a/x.ts");
                assert_eq!(lang, "ts");
                assert_eq!(loc, 3);
                assert_eq!(symbols.len(), 1, "the T2 half arrives on the pull");
                assert_eq!(
                    imports
                        .iter()
                        .map(|e| (e.to.as_str(), e.package.as_deref()))
                        .collect::<Vec<_>>(),
                    vec![("b/z.ts", None), ("lib/parser", Some("p:@nputer/parser"))],
                    "package edges resolve to their repo-internal directory"
                );
                assert_eq!(
                    importers.iter().map(|e| e.from.as_str()).collect::<Vec<_>>(),
                    vec!["a/y.ts"],
                    "the reverse direction is answered too"
                );
            }
            other => panic!("expected File, got {other:?}"),
        }
    }

    #[test]
    fn the_pull_refuses_by_name_rather_than_answering_emptily() {
        let g = graph(vec![file("a/x.ts")], vec![], vec![]);
        let m = join(vec![component("C-01", &["a/**"], &[])], &g);

        // Positive control: the shapes that DO exist answer, so the
        // refusals below are about the target and not about the fixture.
        assert!(matches!(detail(&m, &g, "c:C-01"), Detail::Component { .. }));
        assert!(matches!(detail(&m, &g, "f:a/x.ts"), Detail::File { .. }));

        for target in [
            "c:C-99",          // a component the registry does not declare
            "f:a/nope.ts",     // a file the graph does not carry
            "c:unmapped",      // no unclaimed territory in this tree
            "a/x.ts",          // a bare path — not a key in this grammar
            "",                // nothing
            "s:a/x.ts#thing",  // a symbol id: T2 rides the file answer
            "f:../../etc/passwd", // a traversal string is a MISS, not a traversal
        ] {
            assert_eq!(
                detail(&m, &g, target),
                Detail::Unknown { target: target.to_string() },
                "{target:?} must be refused BY NAME"
            );
        }
    }

    #[test]
    fn a_component_over_the_display_cap_clips_and_says_the_honest_total() {
        let paths: Vec<String> = (0..MAX_DETAIL_FILES + 7)
            .map(|i| format!("a/m{i:04}.ts"))
            .collect();
        let g = graph(paths.iter().map(|p| file(p)).collect(), vec![], vec![]);
        let m = join(vec![component("C-01", &["a/**"], &[])], &g);
        match detail(&m, &g, "c:C-01") {
            Detail::Component { files, total, truncated, .. } => {
                assert_eq!(files.len(), MAX_DETAIL_FILES, "the slice is capped");
                assert_eq!(total, MAX_DETAIL_FILES + 7, "the total is not");
                assert!(truncated, "and the clipping is declared");
            }
            other => panic!("expected Component, got {other:?}"),
        }
        // And the RESTING payload for the same tree still carries one
        // number, not five hundred paths.
        let r = rollup(&m, &g);
        assert_eq!(r.components[0].files, MAX_DETAIL_FILES + 7);
        assert!(
            !stable_rollup_json(&r).contains("a/m0000.ts"),
            "the cap is the pull's; the rollup never had a list to cap"
        );
    }
}
