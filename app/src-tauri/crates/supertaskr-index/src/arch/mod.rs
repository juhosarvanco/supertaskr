//! `supertaskr-index arch` / `arch drift` — the reality-side join, printed.
//!
//! SCOPE, and the reason it is drawn exactly here. ADR-015 assigns the
//! intent⨝reality⨝TASKS derivation to TypeScript (T-011), because the
//! one hardened frontmatter parser lives there and a second one would
//! fork the FORMAT. T-014's criterion 2 nevertheless requires the binary
//! to print component/drift summaries, and `--fail-on
//! undeclared|unmapped` names the two findings that are pure
//! intent×reality. So this module computes the REALITY-SIDE join only:
//!
//!   in scope  — file -> component mapping (first match by numeric id),
//!               observed component edges (incl. the package.path seam),
//!               relations {confirmed, planned, undeclared}, and the
//!               findings D1/D2/D3/D4/D5 that need no task tree.
//!   NOT here  — status rollup, provenance rollup, the task join, the
//!               `component:` field, ADR-016 marks, the degraded
//!               inferred mode. Those need @supertaskr/parser's status-aware
//!               requiredness and stay TypeScript's, full stop. The
//!               `status` this prints is the component file's own
//!               declared field, copied verbatim, never a rollup.
//!
//! The anti-fork claim is a MEASUREMENT, and it was taken: run against
//! this repo's live registry and committed graph, this join reproduces
//! what `app/test/architecture-dogfood.test.ts` pins for the TypeScript
//! engine — all 8 mapping counts, the 28-row relation table row for row
//! with every observed count, all 9 finding ids in order, and all 22 D1
//! file edges in order. The reproduction command is in T-014's
//! implementation notes.
//!
//! That agreement is deliberately NOT pinned as a fourth live-registry
//! fixture here: CONVENTIONS already warns that declaring a component
//! moves three of them, and a fourth in another language would be a real
//! cost at every merge for a property the TypeScript fixture already
//! guards. `tests/arch.rs` instead pins what cannot go stale — totality,
//! determinism, order-independence, the package.path seam — over the
//! live tree. Where a permanent cross-engine pin should live is filed as
//! T-014-s2, and whether this join belongs in Rust at all as T-014-s1.

pub mod blast;
pub mod cycles;
pub mod glob;
pub mod registry;

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use crate::graph::Graph;
use registry::{compare_component_ids, Component, RegistryError};

/// The synthetic node unclaimed territory hangs off — the same id the
/// TypeScript engine uses (`UNMAPPED_ID`), so both reports name it alike.
pub const UNMAPPED_ID: &str = "unmapped";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Relation {
    /// Declared and observed.
    Confirmed,
    /// Declared, never observed.
    Planned,
    /// Observed, never declared (or touching unmapped territory).
    Undeclared,
}

impl Relation {
    pub fn as_str(&self) -> &'static str {
        match self {
            Relation::Confirmed => "confirmed",
            Relation::Planned => "planned",
            Relation::Undeclared => "undeclared",
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct FileEdge {
    pub from: String,
    pub to: String,
    /// Set when the edge was observed through a `file:` package node
    /// (T-009 plan §6.6): the importing file names the PACKAGE, and
    /// `to` is the package's repo-internal path.
    pub package: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ComponentEdge {
    pub from: String,
    pub to: String,
    pub relation: Relation,
    pub declared: bool,
    pub file_edges: Vec<FileEdge>,
}

/// The drift rules this crate computes. D1/D2 are the two the
/// `--fail-on` vocabulary names; D3/D4/D5 are printed because they cost
/// nothing once the mapping exists and a summary that hid them would be
/// less honest than one that shows them.
#[derive(Clone, Debug, PartialEq)]
pub enum Finding {
    /// Undeclared dependency between two DECLARED components.
    D1 {
        id: String,
        from: String,
        to: String,
        file_edges: Vec<FileEdge>,
    },
    /// Unclaimed territory: indexed files (and repo-internal package
    /// paths) no component claims.
    D2 { id: String, files: Vec<String> },
    /// A declared component that owns no indexed file.
    D3 { id: String, component: String },
    /// A path more than one component's patterns claim. `patterns`
    /// carries the declared text that decided each claim, in the same
    /// order as `ids` — an ambiguity nobody can locate is not actionable.
    D4 {
        id: String,
        path: String,
        ids: Vec<String>,
        patterns: Vec<String>,
    },
    /// A `depends_on` naming an id the registry does not declare.
    D5 { id: String, from: String, to: String },
}

impl Finding {
    pub fn id(&self) -> &str {
        match self {
            Finding::D1 { id, .. }
            | Finding::D2 { id, .. }
            | Finding::D3 { id, .. }
            | Finding::D4 { id, .. }
            | Finding::D5 { id, .. } => id,
        }
    }

    pub fn rule(&self) -> &'static str {
        match self {
            Finding::D1 { .. } => "D1",
            Finding::D2 { .. } => "D2",
            Finding::D3 { .. } => "D3",
            Finding::D4 { .. } => "D4",
            Finding::D5 { .. } => "D5",
        }
    }

    /// The rule's name, as the report prints it and agents grep it.
    pub fn label(&self) -> &'static str {
        match self {
            Finding::D1 { .. } => "undeclared_dependency",
            Finding::D2 { .. } => "unmapped_files",
            Finding::D3 { .. } => "declared_only_component",
            Finding::D4 { .. } => "ambiguous_mapping",
            Finding::D5 { .. } => "dangling_depends_on",
        }
    }
}

/// The whole reality-side model, deterministic in every field.
#[derive(Clone, Debug)]
pub struct ArchModel {
    pub components: Vec<Component>,
    /// Indexed path -> owning component id (or [`UNMAPPED_ID`]).
    pub file_component: BTreeMap<String, String>,
    pub files_per_component: BTreeMap<String, Vec<String>>,
    pub unmapped: Vec<String>,
    pub edges: Vec<ComponentEdge>,
    pub findings: Vec<Finding>,
}

impl ArchModel {
    pub fn mapped_files(&self) -> usize {
        self.file_component.len() - self.unmapped_file_count()
    }

    fn unmapped_file_count(&self) -> usize {
        self.file_component
            .values()
            .filter(|id| id.as_str() == UNMAPPED_ID)
            .count()
    }

    /// Component ids carrying drift (§4.5): a D1 source, or the synthetic
    /// unmapped node, or a D3/D5 subject.
    pub fn drift_ids(&self) -> Vec<String> {
        let mut ids: BTreeSet<String> = BTreeSet::new();
        for finding in &self.findings {
            match finding {
                Finding::D1 { from, .. } => {
                    ids.insert(from.clone());
                }
                Finding::D2 { .. } => {
                    ids.insert(UNMAPPED_ID.to_string());
                }
                Finding::D3 { component, .. } => {
                    ids.insert(component.clone());
                }
                Finding::D4 { ids: claimants, .. } => {
                    ids.extend(claimants.iter().cloned());
                }
                Finding::D5 { from, .. } => {
                    ids.insert(from.clone());
                }
            }
        }
        let mut out: Vec<String> = ids.into_iter().collect();
        out.sort_by(|a, b| compare_component_ids(a, b));
        out
    }

    pub fn count(&self, rule: &str) -> usize {
        self.findings.iter().filter(|f| f.rule() == rule).count()
    }
}

/// Read the registry under `root` and join it against `graph`.
pub fn model(root: &Path, graph: &Graph) -> Result<ArchModel, RegistryError> {
    let components = registry::read_registry(root)?;
    Ok(join(components, graph))
}

/// The join itself — pure over its inputs, so the tests can drive it with
/// hand-built registries.
///
/// Sorts its own input: first-match-wins is decided by NUMERIC id order
/// (`C-09` beats `C-100`), and a join whose answer depended on the order
/// the caller happened to read the directory in would not be
/// deterministic. `read_registry` already sorts; this makes the function
/// total over any input order rather than trusting it.
pub fn join(mut components: Vec<Component>, graph: &Graph) -> ArchModel {
    components.sort_by(|a, b| compare_component_ids(&a.id, &b.id));
    let declared: BTreeSet<String> = components.iter().map(|c| c.id.clone()).collect();
    let mut findings: Vec<Finding> = Vec::new();

    // --- mapping (first claimant in numeric id order) + D4.
    let mut file_component: BTreeMap<String, String> = BTreeMap::new();
    let mut files_per_component: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let mut unclaimed: BTreeSet<String> = BTreeSet::new();
    for file in &graph.files {
        let claimants: Vec<&Component> = components
            .iter()
            .filter(|c| glob::claims_path(&c.paths, &file.path))
            .collect();
        let Some(winner) = claimants.first() else {
            file_component.insert(file.path.clone(), UNMAPPED_ID.to_string());
            unclaimed.insert(file.path.clone());
            continue;
        };
        file_component.insert(file.path.clone(), winner.id.clone());
        files_per_component
            .entry(winner.id.clone())
            .or_default()
            .push(file.path.clone());
        if claimants.len() > 1 {
            findings.push(Finding::D4 {
                id: format!("D4:{}", file.path),
                path: file.path.clone(),
                ids: claimants.iter().map(|c| c.id.clone()).collect(),
                patterns: claimants
                    .iter()
                    .map(|c| {
                        glob::claiming_pattern(&c.paths, &file.path).unwrap_or_default()
                    })
                    .collect(),
            });
        }
    }

    // --- observed component edges, incl. the package.path seam.
    let files_by_id: BTreeMap<&str, &str> = graph
        .files
        .iter()
        .map(|f| (f.id.as_str(), f.path.as_str()))
        .collect();
    let packages_by_id: BTreeMap<&str, Option<&str>> = graph
        .packages
        .iter()
        .map(|p| (p.id.as_str(), p.path.as_deref()))
        .collect();
    let mut dir_owner_cache: BTreeMap<String, Option<String>> = BTreeMap::new();
    let mut observed: BTreeMap<(String, String), Vec<FileEdge>> = BTreeMap::new();

    for edge in &graph.edges {
        if edge.kind != "import" {
            continue;
        }
        let Some(from_path) = files_by_id.get(edge.from.as_str()) else {
            continue; // imports originate in files; a dangling id is skipped
        };
        let Some(from_component) = file_component.get(*from_path) else {
            continue;
        };
        let from_component = from_component.clone();
        let (to_component, file_edge) = if edge.to.starts_with("f:") {
            let Some(to_path) = files_by_id.get(edge.to.as_str()) else {
                continue;
            };
            let to_component = file_component
                .get(*to_path)
                .cloned()
                .unwrap_or_else(|| UNMAPPED_ID.to_string());
            (
                to_component,
                FileEdge {
                    from: (*from_path).to_string(),
                    to: (*to_path).to_string(),
                    package: None,
                },
            )
        } else if edge.to.starts_with("p:") {
            let Some(Some(pkg_path)) = packages_by_id.get(edge.to.as_str()) else {
                continue; // external package (or unknown id): no component edge
            };
            let owner = dir_owner_cache
                .entry((*pkg_path).to_string())
                .or_insert_with(|| {
                    components
                        .iter()
                        .find(|c| glob::claims_dir_contents(&c.paths, pkg_path))
                        .map(|c| c.id.clone())
                })
                .clone();
            if owner.is_none() {
                unclaimed.insert((*pkg_path).to_string()); // unowned territory -> D2
            }
            (
                owner.unwrap_or_else(|| UNMAPPED_ID.to_string()),
                FileEdge {
                    from: (*from_path).to_string(),
                    to: (*pkg_path).to_string(),
                    package: Some(edge.to.clone()),
                },
            )
        } else {
            continue; // symbol-level edges are T2, not component edges
        };
        if from_component == to_component {
            continue;
        }
        observed
            .entry((from_component, to_component))
            .or_default()
            .push(file_edge);
    }

    // --- declared edges + D5.
    let mut declared_pairs: BTreeSet<(String, String)> = BTreeSet::new();
    for component in &components {
        let mut seen: BTreeSet<&str> = BTreeSet::new();
        for target in &component.depends_on {
            if !seen.insert(target.as_str()) {
                continue;
            }
            if !declared.contains(target) {
                findings.push(Finding::D5 {
                    id: format!("D5:{}->{}", component.id, target),
                    from: component.id.clone(),
                    to: target.clone(),
                });
            }
            declared_pairs.insert((component.id.clone(), target.clone()));
        }
    }

    let mut keys: BTreeSet<(String, String)> = observed.keys().cloned().collect();
    keys.extend(declared_pairs.iter().cloned());
    let mut edges: Vec<ComponentEdge> = keys
        .into_iter()
        .map(|(from, to)| {
            let mut file_edges = observed.get(&(from.clone(), to.clone())).cloned().unwrap_or_default();
            file_edges.sort_by(|a, b| a.from.cmp(&b.from).then_with(|| a.to.cmp(&b.to)));
            let is_declared = declared_pairs.contains(&(from.clone(), to.clone()));
            let touches_unmapped = from == UNMAPPED_ID || to == UNMAPPED_ID;
            let relation = if !file_edges.is_empty() && (touches_unmapped || !is_declared) {
                Relation::Undeclared
            } else if !file_edges.is_empty() {
                Relation::Confirmed
            } else {
                Relation::Planned
            };
            ComponentEdge {
                from,
                to,
                relation,
                declared: is_declared,
                file_edges,
            }
        })
        .collect();
    edges.sort_by(|a, b| {
        compare_component_ids(&a.from, &b.from).then_with(|| compare_component_ids(&a.to, &b.to))
    });

    // --- D1 (declared x declared only; unmapped edges report through D2).
    for edge in &edges {
        if edge.relation != Relation::Undeclared {
            continue;
        }
        if !declared.contains(&edge.from) || !declared.contains(&edge.to) {
            continue;
        }
        findings.push(Finding::D1 {
            id: format!("D1:{}->{}", edge.from, edge.to),
            from: edge.from.clone(),
            to: edge.to.clone(),
            file_edges: edge.file_edges.clone(),
        });
    }

    // --- D2 (one grouped finding) and D3.
    let unmapped: Vec<String> = unclaimed.into_iter().collect();
    if !unmapped.is_empty() {
        findings.push(Finding::D2 {
            id: format!("D2:{UNMAPPED_ID}"),
            files: unmapped.clone(),
        });
    }
    for component in &components {
        if !files_per_component.contains_key(&component.id) {
            findings.push(Finding::D3 {
                id: format!("D3:{}", component.id),
                component: component.id.clone(),
            });
        }
    }

    findings.sort_by(|a, b| a.id().cmp(b.id()));

    ArchModel {
        components,
        file_component,
        files_per_component,
        unmapped,
        edges,
        findings,
    }
}

/// Which findings a `--fail-on` severity gates on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Severity {
    Undeclared,
    Unmapped,
    Any,
}

impl Severity {
    pub fn parse(text: &str) -> Option<Severity> {
        match text {
            "undeclared" => Some(Severity::Undeclared),
            "unmapped" => Some(Severity::Unmapped),
            "any" => Some(Severity::Any),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Undeclared => "undeclared",
            Severity::Unmapped => "unmapped",
            Severity::Any => "any",
        }
    }

    pub fn matches(&self, finding: &Finding) -> bool {
        match self {
            Severity::Undeclared => matches!(finding, Finding::D1 { .. }),
            Severity::Unmapped => matches!(finding, Finding::D2 { .. }),
            Severity::Any => true,
        }
    }
}

/// `arch` — one record per line, leading keyword, fixed field order.
pub fn render_arch(model: &ArchModel) -> String {
    let mut out = String::new();
    let drift: BTreeSet<String> = model.drift_ids().into_iter().collect();
    for component in &model.components {
        let files = model
            .files_per_component
            .get(&component.id)
            .map(Vec::len)
            .unwrap_or(0);
        let observed = model
            .edges
            .iter()
            .filter(|e| e.from == component.id && !e.file_edges.is_empty())
            .count();
        let rules: Vec<&str> = model
            .findings
            .iter()
            .filter(|f| finding_subject(f) == component.id)
            .map(|f| f.rule())
            .collect();
        out.push_str(&format!(
            "component  {}  {}  layer={}  status={}  files={}  declared_deps={}  observed_deps={}  drift={}\n",
            component.id,
            component.name,
            if component.layer.is_empty() { "-" } else { &component.layer },
            component.status,
            files,
            component.depends_on.len(),
            observed,
            if rules.is_empty() {
                "-".to_string()
            } else {
                rules.join(",")
            },
        ));
    }
    if !model.unmapped.is_empty() {
        out.push_str(&format!(
            "component  {UNMAPPED_ID}  (unclaimed territory)  layer=-  status=-  files={}  declared_deps=0  observed_deps=0  drift=D2\n",
            model.unmapped.len()
        ));
    }
    for edge in &model.edges {
        out.push_str(&format!(
            "edge  {} -> {}  {}  observed={}\n",
            edge.from,
            edge.to,
            edge.relation.as_str(),
            edge.file_edges.len()
        ));
    }
    out.push_str(&format!(
        "summary  components={}  files={}  mapped={}  unmapped={}  edges={}  findings={}  drift_components={}\n",
        model.components.len(),
        model.file_component.len(),
        model.mapped_files(),
        model.unmapped.len(),
        model.edges.len(),
        model.findings.len(),
        drift.len(),
    ));
    out
}

/// The component a finding hangs off, for the `arch` drift column.
fn finding_subject(finding: &Finding) -> &str {
    match finding {
        Finding::D1 { from, .. } => from,
        Finding::D2 { .. } => UNMAPPED_ID,
        Finding::D3 { component, .. } => component,
        Finding::D4 { ids, .. } => ids.first().map(String::as_str).unwrap_or(""),
        Finding::D5 { from, .. } => from,
    }
}

/// `arch drift` — findings, then the tally, then the verdict line.
pub fn render_drift(model: &ArchModel, fail_on: Option<Severity>) -> String {
    let mut out = String::new();
    for finding in &model.findings {
        match finding {
            Finding::D1 {
                id,
                from,
                to,
                file_edges,
            } => {
                out.push_str(&format!(
                    "finding  D1  {id}  {} -> {}  file_edges={}\n",
                    from,
                    to,
                    file_edges.len()
                ));
                for edge in file_edges {
                    match &edge.package {
                        Some(pkg) => out.push_str(&format!(
                            "  file-edge  {} -> {}  package={pkg}\n",
                            edge.from, edge.to
                        )),
                        None => {
                            out.push_str(&format!("  file-edge  {} -> {}\n", edge.from, edge.to))
                        }
                    }
                }
            }
            Finding::D2 { id, files } => {
                out.push_str(&format!(
                    "finding  D2  {id}  {}  files={}\n",
                    finding.label(),
                    files.len()
                ));
                for file in files {
                    out.push_str(&format!("  file  {file}\n"));
                }
            }
            Finding::D3 { id, component } => {
                out.push_str(&format!(
                    "finding  D3  {id}  {component}  {}\n",
                    finding.label()
                ));
            }
            Finding::D4 {
                id,
                path,
                ids,
                patterns,
            } => {
                out.push_str(&format!(
                    "finding  D4  {id}  {path}  claimed_by={}  winner={}\n",
                    ids.join(","),
                    ids.first().map(String::as_str).unwrap_or("-")
                ));
                for (component, pattern) in ids.iter().zip(patterns.iter()) {
                    out.push_str(&format!("  claim  {component}  {pattern}\n"));
                }
            }
            Finding::D5 { id, from, to } => {
                out.push_str(&format!(
                    "finding  D5  {id}  {from} -> {to}  {}\n",
                    finding.label()
                ));
            }
        }
    }
    out.push_str(&format!(
        "summary  findings={}  undeclared={}  unmapped={}  declared_only={}  ambiguous={}  dangling={}\n",
        model.findings.len(),
        model.count("D1"),
        model.count("D2"),
        model.count("D3"),
        model.count("D4"),
        model.count("D5"),
    ));
    match fail_on {
        None => out.push_str("verdict  REPORT  no --fail-on given; exit 0 regardless of findings\n"),
        Some(severity) => {
            let matched = model
                .findings
                .iter()
                .filter(|f| severity.matches(f))
                .count();
            if matched == 0 {
                out.push_str(&format!(
                    "verdict  CLEAN  --fail-on {} matched 0 findings\n",
                    severity.as_str()
                ));
            } else {
                out.push_str(&format!(
                    "verdict  DRIFT  --fail-on {} matched {matched} finding(s)\n",
                    severity.as_str()
                ));
            }
        }
    }
    out
}

/// Does this model fail the gate at `severity`?
pub fn fails(model: &ArchModel, severity: Severity) -> bool {
    model.findings.iter().any(|f| severity.matches(f))
}

#[cfg(test)]
mod tests {
    use super::*;
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
            loc: 1,
            symbols: vec![],
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
                symbols: 0,
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
    fn first_claimant_by_numeric_id_wins_and_the_loser_makes_a_d4() {
        let g = graph(vec![file("app/x.ts")], vec![], vec![]);
        let m = join(
            vec![
                component("C-100", &["app/**"], &[]),
                component("C-09", &["app/**"], &[]),
            ],
            &g,
        );
        assert_eq!(m.file_component["app/x.ts"], "C-09", "C-09 beats C-100");
        assert_eq!(m.count("D4"), 1);
        match &m.findings.iter().find(|f| f.rule() == "D4").unwrap() {
            Finding::D4 {
                ids, path, patterns, ..
            } => {
                assert_eq!(ids, &vec!["C-09".to_string(), "C-100".to_string()]);
                assert_eq!(path, "app/x.ts");
                assert_eq!(patterns, &vec!["app/**".to_string(), "app/**".to_string()]);
            }
            other => panic!("{other:?}"),
        }
        assert!(
            render_drift(&m, None).contains("  claim  C-09  app/**"),
            "the ambiguity names the declared text that decided it"
        );
    }

    #[test]
    fn an_observed_undeclared_crossing_is_d1_and_a_declared_one_is_confirmed() {
        let g = graph(
            vec![file("a/x.ts"), file("b/y.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/y.ts")],
        );
        let undeclared = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );
        assert_eq!(undeclared.edges[0].relation, Relation::Undeclared);
        assert_eq!(undeclared.count("D1"), 1);
        assert_eq!(undeclared.findings[0].id(), "D1:C-01->C-02");

        let declared = join(
            vec![
                component("C-01", &["a/**"], &["C-02"]),
                component("C-02", &["b/**"], &[]),
            ],
            &g,
        );
        assert_eq!(declared.edges[0].relation, Relation::Confirmed);
        assert_eq!(declared.count("D1"), 0);
    }

    #[test]
    fn a_declared_but_unobserved_edge_is_planned_and_a_fileless_component_is_d3() {
        let g = graph(vec![file("a/x.ts")], vec![], vec![]);
        let m = join(
            vec![
                component("C-01", &["a/**"], &["C-02"]),
                component("C-02", &["b/**"], &[]),
            ],
            &g,
        );
        assert_eq!(m.edges.len(), 1);
        assert_eq!(m.edges[0].relation, Relation::Planned);
        assert_eq!(m.count("D3"), 1);
        assert_eq!(m.findings.iter().find(|f| f.rule() == "D3").unwrap().id(), "D3:C-02");
    }

    #[test]
    fn unclaimed_files_group_into_one_d2_and_never_become_a_d1() {
        let g = graph(
            vec![file("a/x.ts"), file("orphan.ts"), file("other.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:orphan.ts")],
        );
        let m = join(vec![component("C-01", &["a/**"], &[])], &g);
        assert_eq!(m.unmapped, vec!["orphan.ts", "other.ts"]);
        assert_eq!(m.count("D2"), 1);
        assert_eq!(m.count("D1"), 0, "edges into unmapped report through D2");
        let edge = m.edges.iter().find(|e| e.to == UNMAPPED_ID).unwrap();
        assert_eq!(edge.relation, Relation::Undeclared);
    }

    #[test]
    fn a_depends_on_naming_unmapped_cannot_launder_the_synthetic_node() {
        let g = graph(
            vec![file("a/x.ts"), file("orphan.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:orphan.ts")],
        );
        let m = join(vec![component("C-01", &["a/**"], &["unmapped"])], &g);
        let edge = m.edges.iter().find(|e| e.to == UNMAPPED_ID).unwrap();
        assert_eq!(
            edge.relation,
            Relation::Undeclared,
            "the synthetic node is never confirmable"
        );
        assert_eq!(m.count("D5"), 1, "and the declaration is dangling");
    }

    #[test]
    fn the_package_path_seam_materializes_a_component_edge() {
        let g = graph(
            vec![file("app/x.ts")],
            vec![Package {
                id: "p:@supertaskr/parser".to_string(),
                name: "@supertaskr/parser".to_string(),
                ecosystem: "npm".to_string(),
                path: Some("lib/parser".to_string()),
            }],
            vec![import("f:app/x.ts", "p:@supertaskr/parser")],
        );
        let m = join(
            vec![
                component("C-05", &["app/**"], &["C-06"]),
                component("C-06", &["lib/parser/**"], &[]),
            ],
            &g,
        );
        assert_eq!(m.edges.len(), 1);
        assert_eq!(m.edges[0].relation, Relation::Confirmed);
        assert_eq!(
            m.edges[0].file_edges[0].package.as_deref(),
            Some("p:@supertaskr/parser")
        );
        // An external package (no path) draws no component edge at all.
        let external = graph(
            vec![file("app/x.ts")],
            vec![Package {
                id: "p:react".to_string(),
                name: "react".to_string(),
                ecosystem: "npm".to_string(),
                path: None,
            }],
            vec![import("f:app/x.ts", "p:react")],
        );
        let m2 = join(vec![component("C-05", &["app/**"], &[])], &external);
        assert!(m2.edges.is_empty());
    }

    #[test]
    fn an_unowned_package_path_joins_the_unclaimed_group() {
        let g = graph(
            vec![file("app/x.ts")],
            vec![Package {
                id: "p:@supertaskr/parser".to_string(),
                name: "@supertaskr/parser".to_string(),
                ecosystem: "npm".to_string(),
                path: Some("lib/parser".to_string()),
            }],
            vec![import("f:app/x.ts", "p:@supertaskr/parser")],
        );
        let m = join(vec![component("C-05", &["app/**"], &[])], &g);
        assert_eq!(m.unmapped, vec!["lib/parser"]);
        assert_eq!(m.count("D2"), 1);
    }

    #[test]
    fn severity_gates_exactly_what_it_names() {
        let g = graph(
            vec![file("a/x.ts"), file("b/y.ts"), file("orphan.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/y.ts")],
        );
        let m = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );
        assert!(fails(&m, Severity::Undeclared));
        assert!(fails(&m, Severity::Unmapped));
        assert!(fails(&m, Severity::Any));

        let clean_graph = graph(vec![file("a/x.ts")], vec![], vec![]);
        let clean = join(vec![component("C-01", &["a/**"], &[])], &clean_graph);
        assert!(!fails(&clean, Severity::Undeclared));
        assert!(!fails(&clean, Severity::Unmapped));
        assert!(!fails(&clean, Severity::Any));

        // A D3-only model: `any` fires, the two named severities do not.
        let d3_graph = graph(vec![file("a/x.ts")], vec![], vec![]);
        let d3 = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &d3_graph,
        );
        assert_eq!(d3.count("D3"), 1);
        assert!(!fails(&d3, Severity::Undeclared));
        assert!(!fails(&d3, Severity::Unmapped));
        assert!(fails(&d3, Severity::Any));
    }

    #[test]
    fn severity_parsing_is_a_closed_vocabulary() {
        assert_eq!(Severity::parse("undeclared"), Some(Severity::Undeclared));
        assert_eq!(Severity::parse("unmapped"), Some(Severity::Unmapped));
        assert_eq!(Severity::parse("any"), Some(Severity::Any));
        for bad in ["", "UNDECLARED", "all", "d1", "any "] {
            assert_eq!(Severity::parse(bad), None, "{bad:?}");
        }
    }

    #[test]
    fn the_rendered_report_is_stable_greppable_and_line_oriented() {
        let g = graph(
            vec![file("a/x.ts"), file("b/y.ts"), file("orphan.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/y.ts")],
        );
        let m = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );
        let arch = render_arch(&m);
        assert_eq!(arch, render_arch(&m), "same model, same bytes");
        assert!(arch.lines().all(|l| !l.is_empty()), "no blank lines");
        assert!(arch.contains("component  C-01  C-01 name  layer=app  status=auto  files=1"));
        assert!(arch.contains("edge  C-01 -> C-02  undeclared  observed=1"));
        assert!(arch.contains("summary  components=2  files=3  mapped=2  unmapped=1"));

        let drift = render_drift(&m, Some(Severity::Any));
        assert!(drift.contains("finding  D1  D1:C-01->C-02  C-01 -> C-02  file_edges=1"));
        assert!(drift.contains("  file-edge  a/x.ts -> b/y.ts"));
        assert!(drift.contains("finding  D2  D2:unmapped  unmapped_files  files=1"));
        assert!(
            drift.ends_with("verdict  DRIFT  --fail-on any matched 2 finding(s)\n"),
            "{drift}"
        );

        let report_only = render_drift(&m, None);
        assert!(report_only.ends_with("verdict  REPORT  no --fail-on given; exit 0 regardless of findings\n"));
    }

    #[test]
    fn findings_sort_by_id_and_the_model_is_order_independent() {
        let g = graph(
            vec![file("a/x.ts"), file("b/y.ts")],
            vec![],
            vec![import("f:a/x.ts", "f:b/y.ts")],
        );
        let forward = join(
            vec![component("C-01", &["a/**"], &[]), component("C-02", &["b/**"], &[])],
            &g,
        );
        let mut reversed = vec![component("C-02", &["b/**"], &[]), component("C-01", &["a/**"], &[])];
        reversed.sort_by(|a, b| compare_component_ids(&a.id, &b.id));
        let back = join(reversed, &g);
        assert_eq!(render_arch(&forward), render_arch(&back));
        let ids: Vec<&str> = forward.findings.iter().map(Finding::id).collect();
        let mut sorted = ids.clone();
        sorted.sort();
        assert_eq!(ids, sorted);
    }
}
