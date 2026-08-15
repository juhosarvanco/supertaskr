# State

Updated: 2026-08-15 by architect (map promotion), claude-fable-5
@chat-session

## Just completed
F-06 (architecture map) PROMOTED into the record. Juho delivered two
map documents (technical plan + design handoff, prepared externally);
architect review found them strong with one architectural
contradiction and three record collisions — all fixed at promotion:
- Docs received as-is (baseline commit), moved to
  docs/design/map-technical-plan.md + map-design-handoff.md; the
  plan carries a §0.0 revision list (derivation → TypeScript, real
  repo paths, slug-based touches, delivery via the docs pipeline
  under the 1 MiB cap, volatile fields omitted, churn via git
  shell-out, C-registry rules, CLI stays Node shelling to the
  nputer-index binary).
- ADR-013 (intent+reality v1; drift slice pulled forward from
  Horizon), ADR-014 (committed deterministic graph files), ADR-015
  (indexer Rust / parsing+derivation TS — the contradiction fix).
- Tasks T-008…T-015 decomposed (feature F-06, milestone 2 proposed,
  below the slice line; T-009 and T-012 are L → planning pass before
  dispatch). New component C-07 (nputer-index) and slugs app-map /
  crate-index in ARCHITECTURE.md.
- SEQUENCING RESOLVED (rooms/map-sequencing.md, @human 2026-08-15):
  milestone 2 = the map VERTICAL SLICE (T-008 → T-009 → T-011 →
  T-012); milestone 3 = F-03 in-app genesis; F-06 remainder
  (T-010/T-013/T-014/T-015) = milestone 4. Milestone 2 starts only
  after T-006 closes milestone 1.

Milestone 1 unchanged: SIX of seven done; T-006 awaits the external
design token sheet (docs/design/design-handoff.md v3).

## In progress / broken right now
Nothing building, nothing broken. Board free.

## Next up (1–3)
1. @human: return the T-006 token sheet (closes milestone 1) · run
   the real-input checklist below. Then dispatch the milestone-2
   frontier: T-008 (lib-parser) + T-009 planning pass (L, crate-index)
   — disjoint touches, parallel-safe.
2. Architect triage of the EIGHTEEN open suggestions:
   T-001-s1/s2/s3, T-002-s1/s2/s3, T-003-s1/s2/s3, T-004-s1/s2,
   T-005-s1/s2/s3/s4, T-007-s1/s2/s3.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

For the @human — the consolidated real-input checklist (visual-
confirmation precedent, T-001/T-007):
1. Three picker dialog flows on the real screen (valid pick → live
   board · docs-less pick → named empty state, keep-current works ·
   cancel → no change).
2. One real mouse click on a resolved blocker link in the detail
   panel → re-targets, does NOT close (the T-005 rejection's repro).
3. Real-key Escape / Enter / Space on the panel.
4. Linux run (T-001-s3): Linux halves of T-001/T-003 still
   machine-unverified.

## Open questions
None — rooms/map-sequencing.md resolved 2026-08-15.
