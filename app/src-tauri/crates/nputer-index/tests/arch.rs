//! The reality-side join, driven over THIS repo's live registry and
//! committed graph.
//!
//! Content-INDEPENDENT on purpose. `docs/CONVENTIONS.md` already warns
//! that declaring a component moves three live-registry fixtures; making
//! it four — in a second language — would be a standing cost at every
//! merge for a property `app/test/architecture-dogfood.test.ts` already
//! guards. So nothing here pins a count that a sibling task can move.
//! What it pins instead cannot go stale: the join is TOTAL over the
//! committed graph, DETERMINISTIC, INDEPENDENT of registry order, and it
//! consumes the T-009 §6.6 package.path seam.
//!
//! The exact cross-engine agreement (mapping counts, the relation table
//! row for row, finding ids and file edges) was measured against the
//! TypeScript pins and is recorded in T-014's implementation notes with
//! its reproduction command; where a permanent pin should live is
//! T-014-s2.

mod common;

use std::collections::BTreeSet;

use nputer_index::arch::registry::{compare_component_ids, read_registry, RegistryError};
use nputer_index::arch::cycles;
use nputer_index::arch::{self, Finding, Severity, UNMAPPED_ID};
use nputer_index::{Graph, GRAPH_REL_PATH};

fn live_graph() -> Graph {
    let raw = std::fs::read(common::repo_root().join(GRAPH_REL_PATH))
        .expect("this repo commits its graph (ADR-014)");
    serde_json::from_slice(&raw).expect("the committed graph is schema-1 readable")
}

fn live_model() -> arch::ArchModel {
    arch::model(&common::repo_root(), &live_graph()).expect("the live registry must read")
}

#[test]
fn the_live_registry_reads_without_refusing_anything() {
    let components = read_registry(&common::repo_root()).expect("registry");
    assert!(components.len() >= 5, "the dogfood registry has >= 5 components");
    for component in &components {
        assert!(component.id.starts_with("C-"), "{}", component.id);
        assert!(!component.name.is_empty(), "{}", component.id);
        assert!(
            !component.paths.is_empty(),
            "{} declares no paths — the format requires them",
            component.id
        );
        assert!(
            !component.status.is_empty(),
            "{} has no status (auto is the default, never empty)",
            component.id
        );
    }
}

#[test]
fn the_mapping_is_total_over_the_committed_graph() {
    let graph = live_graph();
    let model = live_model();
    assert_eq!(
        model.file_component.len(),
        graph.files.len(),
        "every indexed file gets a verdict — claimed or unclaimed, never absent"
    );
    let declared: BTreeSet<&str> = model.components.iter().map(|c| c.id.as_str()).collect();
    for (path, owner) in &model.file_component {
        assert!(
            owner == UNMAPPED_ID || declared.contains(owner.as_str()),
            "{path} maps to {owner}, which is neither declared nor the unmapped node"
        );
    }
    let owned: usize = model.files_per_component.values().map(Vec::len).sum();
    assert_eq!(
        owned + model.unmapped.len(),
        model.file_component.len() + package_paths_in(&model),
        "the buckets partition the files (plus any unowned package path)"
    );
}

/// Unowned repo-internal package paths join the unclaimed group without
/// being graph FILES — count them so the partition arithmetic above is
/// exact rather than approximate.
fn package_paths_in(model: &arch::ArchModel) -> usize {
    model
        .unmapped
        .iter()
        .filter(|entry| !model.file_component.contains_key(*entry))
        .count()
}

#[test]
fn the_join_is_deterministic_and_independent_of_registry_order() {
    let graph = live_graph();
    let one = arch::render_arch(&live_model());
    let two = arch::render_arch(&live_model());
    assert_eq!(one, two, "same inputs, same bytes");

    let mut reversed = read_registry(&common::repo_root()).expect("registry");
    reversed.reverse();
    let shuffled = arch::join(reversed, &graph);
    assert_eq!(
        arch::render_arch(&shuffled),
        one,
        "first-match-wins is decided by numeric id, never by read order"
    );
    assert_eq!(
        arch::render_drift(&shuffled, Some(Severity::Any)),
        arch::render_drift(&live_model(), Some(Severity::Any))
    );
}

#[test]
fn every_finding_id_is_well_formed_and_the_list_is_sorted() {
    let model = live_model();
    let ids: Vec<&str> = model.findings.iter().map(Finding::id).collect();
    let mut sorted = ids.clone();
    sorted.sort_unstable();
    assert_eq!(ids, sorted, "findings are emitted in id order");
    for finding in &model.findings {
        assert!(
            finding.id().starts_with(&format!("{}:", finding.rule())),
            "{} does not carry its own rule",
            finding.id()
        );
        assert!(!finding.label().is_empty());
    }
}

#[test]
fn the_package_path_seam_is_consumed_on_the_live_tree() {
    // T-009 plan §6.6: `p:@nputer/parser` carries `path: lib/parser`, and
    // that is the ONLY way any component edge into the parser can exist
    // (the app imports the package, never the files). If this stops
    // holding, every C-0x -> C-06 edge silently vanishes.
    let graph = live_graph();
    let seam = graph
        .packages
        .iter()
        .find(|p| p.path.is_some())
        .expect("the repo has at least one file: dependency with a repo-internal path");
    let model = live_model();
    let through_seam: usize = model
        .edges
        .iter()
        .flat_map(|e| e.file_edges.iter())
        .filter(|fe| fe.package.as_deref() == Some(seam.id.as_str()))
        .count();
    assert!(
        through_seam > 0,
        "{} carries path {:?} but materializes no component edge",
        seam.id,
        seam.path
    );
    let owner = model
        .file_component
        .values()
        .next()
        .expect("non-empty mapping");
    assert!(!owner.is_empty());
}

#[test]
fn drift_flags_land_only_on_ids_the_findings_name() {
    let model = live_model();
    let named: BTreeSet<String> = model
        .findings
        .iter()
        .flat_map(|f| match f {
            Finding::D1 { from, .. } => vec![from.clone()],
            Finding::D2 { .. } => vec![UNMAPPED_ID.to_string()],
            Finding::D3 { component, .. } => vec![component.clone()],
            Finding::D4 { ids, .. } => ids.clone(),
            Finding::D5 { from, .. } => vec![from.clone()],
        })
        .collect();
    let flagged: BTreeSet<String> = model.drift_ids().into_iter().collect();
    assert_eq!(flagged, named, "a drift flag with no finding behind it is a lie");
    let mut ordered: Vec<String> = flagged.into_iter().collect();
    ordered.sort_by(|a, b| compare_component_ids(a, b));
    assert_eq!(model.drift_ids(), ordered, "flags come back in id order");
}

#[test]
fn a_registry_directory_that_is_a_symlink_is_refused_not_followed() {
    #[cfg(unix)]
    {
        use std::os::unix::fs::symlink;
        let holder = common::TempTree::new("arch-symlink-registry");
        std::fs::create_dir_all(holder.root().join("docs/architecture")).unwrap();
        symlink(
            common::repo_root().join("docs/architecture/components"),
            holder.root().join("docs/architecture/components"),
        )
        .unwrap();
        assert!(
            matches!(
                read_registry(holder.root()),
                Err(RegistryError::DirMissing(_))
            ),
            "the registry is repo content; a link to one is not"
        );
    }
}

// ------------------------------------------------- the declared topology

/// The declared cycles this repository KNOWINGLY still carries, each
/// written exactly as `CycleReport::paths` renders it.
///
/// EXACT-SET semantics, BOTH directions. A cycle that appears and is not
/// listed here reds; an entry left here after its cycle is gone reds too.
/// An allowlist that can only ever be too small is a rule that rots
/// quietly, which is the failure `arch::cycles` exists to prevent.
///
/// **THE LIST IS EMPTY AND THAT IS THE POINT — DO NOT ADD TO IT TO MAKE
/// A RED GO AWAY.** Since T-127-s6 (2026-08-29) this repository declares
/// no cycle at all, so `arch cycles --root ../..` exits 0 and this
/// assertion compares two empty sets. An entry appearing here again is a
/// deliberate, dated exception to @human's no-cycles ruling of
/// 2026-08-25 and needs the ruling moved, not this constant edited.
///
/// The one entry this ever held was `C-08 -> C-09 -> C-08`, which
/// predated that ruling by nine days (`T-033-s10`). It was retired by
/// re-partitioning C-08/C-09's `paths:` — `board-model.ts` and
/// `task-detail.ts` to C-17, `Board.tsx` to C-18 — with **no import
/// severed and no file moved on disk**. That move also moves the two
/// live-registry fixtures `app/test/architecture-dogfood.test.ts` and
/// `app/test/map-dogfood-render.test.tsx` (C-12's `app-map` since
/// T-149), which is why the work took a fence three cards were cut to
/// carry: T-127, then `T-127-s1`, then `T-127-s6`.
///
/// The positive control for the empty case is the body below it: with no
/// reported cycle the removal set is empty and it asserts the LIVE tree
/// is acyclic, so this pair does not go vacuous the day the last red
/// goes away.
const KNOWN_DECLARED_CYCLES: &[&str] = &[];

#[test]
fn the_live_registry_declares_exactly_the_cycles_this_crate_still_allows() {
    let components = read_registry(&common::repo_root()).expect("registry");
    let report = cycles::cycles(&components);
    assert!(
        !report.truncated,
        "the live registry must be small enough to enumerate whole"
    );
    assert_eq!(
        report.paths(),
        KNOWN_DECLARED_CYCLES,
        "the DECLARED component graph moved. A NEW cycle here is @human's \
         no-cycles ruling of 2026-08-25 being broken - fix the registry, \
         never this list. A MISSING one means a cycle was fixed and its \
         allowlist entry was left behind - delete the entry."
    );
}

#[test]
fn the_live_registry_minus_one_hop_per_reported_cycle_is_acyclic() {
    // POSITIVE CONTROL against the LIVE corpus rather than a fixture: the
    // gate has to be able to answer GREEN about this tree, not only RED,
    // or "no cycles" is a sentence it can never say. Dropping the closing
    // hop of every reported cycle in memory must leave nothing behind —
    // and on the day the last cycle is fixed the removal set is empty and
    // this body asserts the live tree itself, so it does not go vacuous
    // when the red goes away.
    let mut components = read_registry(&common::repo_root()).expect("registry");
    let before = cycles::cycles(&components);
    let mut dropped = 0usize;
    for cycle in &before.cycles {
        let from = cycle[cycle.len() - 2].clone();
        let to = cycle[cycle.len() - 1].clone();
        for component in components.iter_mut().filter(|c| c.id == from) {
            let was = component.depends_on.len();
            component.depends_on.retain(|d| *d != to);
            dropped += was - component.depends_on.len();
        }
    }
    assert_eq!(
        dropped,
        before.cycles.len(),
        "every reported hop must exist in the registry it was read from"
    );
    let after = cycles::cycles(&components);
    assert!(
        !after.has_cycle(),
        "the enumeration claims to be complete, so removing one hop per \
         cycle must leave an acyclic graph: {after:?}"
    );
}

#[test]
fn a_cycle_reintroduced_into_the_live_registry_is_caught_and_named_today() {
    // T-127's criterion: the gate SHALL make a reintroduced cycle fail,
    // and it SHALL fail TODAY. `C-06 -> C-01` is declared and `C-01`
    // declares nothing, so one added line closes a walk that does not
    // exist in this tree — the cheapest mistake a future `depends_on:`
    // edit could make.
    let mut components = read_registry(&common::repo_root()).expect("registry");
    let before = cycles::cycles(&components);
    assert!(
        components
            .iter()
            .find(|c| c.id == "C-06")
            .expect("C-06 is declared")
            .depends_on
            .iter()
            .any(|d| d == "C-01"),
        "the control rests on C-06 -> C-01 being declared"
    );
    let c01 = components
        .iter_mut()
        .find(|c| c.id == "C-01")
        .expect("C-01 is declared");
    assert!(
        !c01.depends_on.iter().any(|d| d == "C-06"),
        "the back edge must not already exist, or this proves nothing"
    );
    c01.depends_on.push("C-06".to_string());

    let after = cycles::cycles(&components);
    assert!(after.has_cycle());
    assert_eq!(after.cycles.len(), before.cycles.len() + 1);
    assert!(
        after.paths().contains(&"C-01 -> C-06 -> C-01".to_string()),
        "the new cycle must be named as a path: {:?}",
        after.paths()
    );
    assert!(
        cycles::render(&after, ".").contains("cycle  C-01 -> C-06 -> C-01\n"),
        "and printed as one"
    );
}
