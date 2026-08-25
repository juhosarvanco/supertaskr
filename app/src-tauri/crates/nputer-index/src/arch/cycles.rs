//! `nputer-index arch cycles` — is the DECLARED component graph acyclic?
//!
//! @human ruled on 2026-08-25 that this registry holds no cycles. Nothing
//! enforced it: T-033 removed three cycles by hand and no command could
//! answer the question afterwards, so its reviewer had to take the
//! acyclicity on trust. **A ruling without a gate decays at exactly the
//! rate people forget it** (T-127).
//!
//! # WHAT THIS GATE READS, AND WHAT IT DELIBERATELY DOES NOT
//!
//! It reads the `depends_on:` field of every
//! `docs/architecture/components/C-*.md`, through [`super::registry`],
//! and NOTHING ELSE. It never indexes, never reads
//! `docs/architecture/graph.json`, and has no opinion about imports. Two
//! consequences, both of them the point:
//!
//! - It cannot be a FALSE RED from a stale graph. A registry question
//!   answered from a committed index is a question with a second failure
//!   mode; this one has none. `index --check` stays the one staleness
//!   gate (ADR-014).
//! - It is a claim about DECLARATIONS, never about code. The observed
//!   side is `arch drift`, and that side has a measured blind spot: it
//!   counts `import` edges only, and a Rust `mod` declaration plus a path
//!   expression — the strongest dependency Rust has — produces ZERO edges
//!   (`T-126-s4`, reproduced at T-127: of this repository's edges, every
//!   Rust one is an `import` and there is not a single `call` or
//!   `type_ref`, while TypeScript carries all three kinds). **So a cycle
//!   made only of Rust `mod` dependencies is invisible to BOTH sides**,
//!   and [`render`] says so on every run, green or red. A gate that
//!   cannot see a whole dependency class has to say so rather than return
//!   a bare green.
//!
//! # WHY A CYCLE IS NAMED AS A PATH
//!
//! T-127's criterion: never a bare "cycle detected". A gate that says
//! only that something is wrong sends the next reader to redo the
//! measurement that found it. Every cycle is printed as the closed walk
//! that closes it — `C-08 -> C-09 -> C-08` — rotated to start at its
//! numerically-lowest component so one cycle has exactly one spelling.
//!
//! A `depends_on:` naming an id the registry does not declare is D5
//! (`dangling_depends_on`), not a cycle, and is skipped here: an edge to
//! nowhere cannot close a walk. A component that declares ITSELF is a
//! cycle of length one and is reported as `C-01 -> C-01`.

use std::collections::BTreeMap;

use super::registry::{compare_component_ids, Component};

/// How many cycles the report enumerates before it stops and says so.
/// The number of SIMPLE cycles in a graph is exponential in the worst
/// case, and this reader is pointed at a directory anybody may write
/// into. The VERDICT never depends on the cap — one cycle is as failing
/// as a thousand — so truncating the list costs nothing a caller needs
/// and bounds the work a hostile registry can ask for.
pub const MAX_CYCLES: usize = 64;

/// The whole answer: what was examined, and every cycle found.
#[derive(Clone, Debug, PartialEq)]
pub struct CycleReport {
    /// Components read from the registry.
    pub components: usize,
    /// Declared `depends_on` edges whose target the registry declares.
    /// Dangling targets are excluded — they are D5, not edges.
    pub declared_edges: usize,
    /// Every simple cycle, each one a closed walk: first id == last id.
    /// Rotated to its lowest member, then sorted, so the answer is a
    /// function of the registry and not of directory order.
    pub cycles: Vec<Vec<String>>,
    /// True when enumeration stopped at [`MAX_CYCLES`]. The verdict is
    /// unaffected; the LIST is incomplete and must not be read as a set.
    pub truncated: bool,
}

impl CycleReport {
    /// The gate's verdict. `false` is the only green.
    pub fn has_cycle(&self) -> bool {
        !self.cycles.is_empty()
    }

    /// Each cycle as the single line [`render`] prints for it.
    pub fn paths(&self) -> Vec<String> {
        self.cycles.iter().map(|c| c.join(" -> ")).collect()
    }
}

/// Enumerate every simple cycle in the declared graph.
///
/// Pure over its input, and it sorts that input: first-match and
/// enumeration order are decided by NUMERIC id order (`C-09` before
/// `C-100`), the same rule [`super::join`] applies, so an answer can
/// never depend on the order the caller happened to read the directory
/// in.
///
/// The walk is ITERATIVE with an explicit stack. Recursion here would be
/// bounded only by the number of files somebody drops in the registry
/// directory, and in this crate a blown Rust stack is an `abort()` that
/// takes the whole app with it rather than a catchable panic (T-129).
pub fn cycles(components: &[Component]) -> CycleReport {
    let mut sorted: Vec<&Component> = components.iter().collect();
    sorted.sort_by(|a, b| compare_component_ids(&a.id, &b.id));

    let index: BTreeMap<&str, usize> = sorted
        .iter()
        .enumerate()
        .map(|(i, c)| (c.id.as_str(), i))
        .collect();

    // Adjacency in numeric id order, de-duplicated, dangling targets
    // dropped (a `depends_on` to nowhere is D5 and closes no walk).
    let mut adj: Vec<Vec<usize>> = Vec::with_capacity(sorted.len());
    let mut declared_edges = 0usize;
    for component in &sorted {
        let mut targets: Vec<usize> = Vec::new();
        for name in &component.depends_on {
            let Some(&to) = index.get(name.as_str()) else {
                continue;
            };
            if !targets.contains(&to) {
                targets.push(to);
            }
        }
        targets.sort_unstable();
        declared_edges += targets.len();
        adj.push(targets);
    }

    let n = sorted.len();
    let mut found: Vec<Vec<usize>> = Vec::new();
    let mut truncated = false;
    let mut on_path = vec![false; n];

    'starts: for start in 0..n {
        let mut path: Vec<usize> = vec![start];
        let mut cursor: Vec<usize> = vec![0];
        on_path[start] = true;
        while let Some(&node) = path.last() {
            let depth = path.len() - 1;
            if cursor[depth] < adj[node].len() {
                let next = adj[node][cursor[depth]];
                cursor[depth] += 1;
                if next == start {
                    // Closed. Record the walk, including the return hop.
                    let mut walk = path.clone();
                    walk.push(start);
                    found.push(walk);
                    if found.len() >= MAX_CYCLES {
                        truncated = true;
                        // Unwind our own marks before leaving.
                        for &node in &path {
                            on_path[node] = false;
                        }
                        break 'starts;
                    }
                    continue;
                }
                // Only nodes at or after `start` may extend the walk:
                // every cycle through an earlier node was already
                // enumerated from that node, so this reports each simple
                // cycle exactly once, rotated to its lowest member.
                if next < start || on_path[next] {
                    continue;
                }
                on_path[next] = true;
                path.push(next);
                cursor.push(0);
            } else {
                on_path[node] = false;
                path.pop();
                cursor.pop();
            }
        }
    }

    let mut cycles: Vec<Vec<String>> = found
        .into_iter()
        .map(|walk| walk.into_iter().map(|i| sorted[i].id.clone()).collect())
        .collect();
    cycles.sort_by(|a, b| {
        a.len()
            .cmp(&b.len())
            .then_with(|| a.join(" -> ").cmp(&b.join(" -> ")))
    });

    CycleReport {
        components: n,
        declared_edges,
        cycles,
        truncated,
    }
}

/// The line-oriented report the CLI prints, in this crate's house shape:
/// a leading keyword per line, fixed field order, no blank lines.
///
/// The `note` line is printed on EVERY run, green included, and that is
/// deliberate: a green from a gate whose reach nobody stated is a green
/// that will be quoted as more than it is.
pub fn render(report: &CycleReport, root_label: &str) -> String {
    let mut out = String::new();
    out.push_str(&format!(
        "cycles  source=declared depends_on  root={root_label}  registry={}  components={}  declared_edges={}\n",
        super::registry::REGISTRY_REL_DIR,
        report.components,
        report.declared_edges,
    ));
    for path in report.paths() {
        out.push_str(&format!("cycle  {path}\n"));
    }
    if report.truncated {
        out.push_str(&format!(
            "cycle  ... enumeration stopped at {MAX_CYCLES}; the list is incomplete and the verdict is not\n"
        ));
    }
    if report.has_cycle() {
        out.push_str(&format!(
            "verdict  DECLARED CYCLE  {} cycle(s) among {} components - the registry is not acyclic\n",
            report.cycles.len(),
            report.components,
        ));
    } else {
        out.push_str(&format!(
            "verdict  ACYCLIC  no declared cycle among {} components and {} declared edges\n",
            report.components, report.declared_edges,
        ));
    }
    out.push_str(
        "note  this verdict is about DECLARED depends_on only; it is not a claim about observed imports\n",
    );
    out.push_str(
        "note  the observed side (`arch drift`) sees `import` edges only - a Rust `mod` declaration plus a\n",
    );
    out.push_str(
        "note  path expression yields no edge at all (T-126-s4), so a cycle made of those is invisible to BOTH\n",
    );
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arch::registry::{self, RegistryError};
    use crate::testutil::TempTree;

    fn component(id: &str, deps: &[&str]) -> Component {
        Component {
            id: id.to_string(),
            name: format!("{id} name"),
            layer: "app".to_string(),
            status: "auto".to_string(),
            paths: vec![format!("{id}/**")],
            depends_on: deps.iter().map(|d| (*d).to_string()).collect(),
            file: format!("{id}.md"),
        }
    }

    #[test]
    fn a_two_node_cycle_is_named_as_a_closed_path_and_never_as_cycle_detected() {
        let report = cycles(&[component("C-01", &["C-02"]), component("C-02", &["C-01"])]);
        assert!(report.has_cycle());
        assert_eq!(report.paths(), vec!["C-01 -> C-02 -> C-01"]);
        let text = render(&report, ".");
        assert!(text.contains("cycle  C-01 -> C-02 -> C-01\n"), "{text}");
        assert!(text.contains("verdict  DECLARED CYCLE  1 cycle(s)"), "{text}");
    }

    #[test]
    fn a_genuinely_acyclic_registry_passes_and_states_what_it_examined() {
        // POSITIVE CONTROL (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A
        // POSITIVE CONTROL). A diamond is the shape a naive
        // "visited" walk mistakes for a cycle: C-04 is reached twice by
        // two disjoint paths and is not on either's stack.
        let report = cycles(&[
            component("C-01", &["C-02", "C-03"]),
            component("C-02", &["C-04"]),
            component("C-03", &["C-04"]),
            component("C-04", &[]),
        ]);
        assert!(!report.has_cycle(), "a diamond is not a cycle: {report:?}");
        assert_eq!(report.components, 4);
        assert_eq!(report.declared_edges, 4);
        let text = render(&report, ".");
        assert!(
            text.contains("verdict  ACYCLIC  no declared cycle among 4 components and 4 declared edges"),
            "a green must state its own corpus, or it is unfalsifiable: {text}"
        );
        assert!(!text.contains("cycle  C-"), "no cycle lines on green: {text}");
    }

    #[test]
    fn every_green_and_every_red_carries_what_the_gate_cannot_see() {
        // The blind spot is printed on BOTH verdicts, on purpose.
        for report in [
            cycles(&[component("C-01", &[])]),
            cycles(&[component("C-01", &["C-02"]), component("C-02", &["C-01"])]),
        ] {
            let text = render(&report, ".");
            assert!(
                text.contains("about DECLARED depends_on only"),
                "the verdict must state its own scope: {text}"
            );
            assert!(
                text.contains("T-126-s4"),
                "and name the observed side's blind spot: {text}"
            );
        }
    }

    #[test]
    fn a_component_that_declares_itself_is_a_cycle_of_length_one() {
        let report = cycles(&[component("C-01", &["C-01"])]);
        assert_eq!(report.paths(), vec!["C-01 -> C-01"]);
        assert_eq!(report.declared_edges, 1);
    }

    #[test]
    fn a_three_node_cycle_names_every_hop_and_is_reported_once() {
        let report = cycles(&[
            component("C-01", &["C-02"]),
            component("C-02", &["C-03"]),
            component("C-03", &["C-01"]),
        ]);
        assert_eq!(
            report.paths(),
            vec!["C-01 -> C-02 -> C-03 -> C-01"],
            "one cycle, one spelling, rotated to its lowest member"
        );
    }

    #[test]
    fn two_independent_cycles_are_both_reported() {
        let report = cycles(&[
            component("C-01", &["C-02"]),
            component("C-02", &["C-01"]),
            component("C-03", &["C-04"]),
            component("C-04", &["C-03"]),
        ]);
        assert_eq!(
            report.paths(),
            vec!["C-01 -> C-02 -> C-01", "C-03 -> C-04 -> C-03"]
        );
        assert!(render(&report, ".").contains("verdict  DECLARED CYCLE  2 cycle(s)"));
    }

    #[test]
    fn a_dangling_depends_on_is_not_an_edge_and_never_a_cycle() {
        // D5 territory (`arch drift` reports it). An edge to nowhere
        // cannot close a walk, and counting it would let a typo read as
        // a topology violation.
        let report = cycles(&[component("C-01", &["C-99"])]);
        assert!(!report.has_cycle());
        assert_eq!(report.declared_edges, 0, "the dangling target is not an edge");
    }

    #[test]
    fn a_repeated_depends_on_entry_is_one_edge() {
        let report = cycles(&[
            component("C-01", &["C-02", "C-02"]),
            component("C-02", &[]),
        ]);
        assert_eq!(report.declared_edges, 1);
    }

    #[test]
    fn the_answer_does_not_depend_on_the_order_the_registry_was_read_in() {
        let forward = vec![
            component("C-01", &["C-02"]),
            component("C-02", &["C-03"]),
            component("C-03", &["C-01"]),
        ];
        let mut backward = forward.clone();
        backward.reverse();
        assert_eq!(cycles(&forward), cycles(&backward));
        assert_eq!(
            render(&cycles(&forward), "."),
            render(&cycles(&backward), "."),
            "same registry, same bytes"
        );
    }

    #[test]
    fn the_enumeration_cap_is_the_documented_constant() {
        // A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT PIN THAT
        // CONSTANT (CONVENTIONS, T-063). Every assertion in the body
        // below is written in terms of `MAX_CYCLES`, so the whole family
        // stays green at ANY value the constant takes — measured on
        // T-127's drill, raising it from 64 to 100 000 killed **zero** of
        // 217 bodies and the suite exited 0. This line is the only thing
        // that reds when the cap moves, which is the whole of its job.
        assert_eq!(MAX_CYCLES, 64);
    }

    #[test]
    fn enumeration_is_capped_and_says_so_rather_than_running_forever() {
        // A complete digraph on 9 nodes carries far more than MAX_CYCLES
        // simple cycles. The VERDICT must survive the cap.
        let ids: Vec<String> = (1..=9).map(|i| format!("C-{i:02}")).collect();
        let comps: Vec<Component> = ids
            .iter()
            .map(|id| {
                let deps: Vec<&str> = ids
                    .iter()
                    .filter(|other| *other != id)
                    .map(String::as_str)
                    .collect();
                component(id, &deps)
            })
            .collect();
        let report = cycles(&comps);
        assert!(report.truncated, "the cap must be reachable to be honest");
        assert_eq!(report.cycles.len(), MAX_CYCLES);
        assert!(report.has_cycle(), "a truncated list is still a red verdict");
        let text = render(&report, ".");
        assert!(text.contains("the list is incomplete and the verdict is not"), "{text}");
    }

    #[test]
    fn an_unreadable_registry_is_an_error_and_never_a_clean_verdict() {
        // Silence would read as ACYCLIC. `read_registry` is what refuses,
        // and this pins that the gate has no way around it.
        let t = TempTree::new("cycles-noregistry");
        assert!(matches!(
            registry::read_registry(t.root()),
            Err(RegistryError::DirMissing(_))
        ));
    }
}
