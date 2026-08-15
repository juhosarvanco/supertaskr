# State

Updated: 2026-08-15 by integrator (T-008 merge — first milestone-2
merge), claude-fable-5 @fresh

## Just completed
T-008 (component files convention + parser) done and merged — the
first milestone-2 merge, APPROVED first-pass (same-model). The
component registry is live: 9 components declared across 9 files in
docs/architecture/components/ (the shared C-namespace now spans 12
ids — C-08…C-12 subdivide the app along real import seams, incl. the
declared C-08↔C-09 cycle); C-02/03/04 are OMITTED honestly — planned-
only, no doc decides their code locations, so globs would be invented
intent (architect territory, filed T-008-s1). ComponentRecord ships
in @nputer/parser through BOTH entries (node + pure; conservative
pattern-overlap detection with the honesty pin verifier-ruled HOLDS;
first-by-numeric-id comparator exported for T-011). Parser suite is
now 125 tests. Post-merge suite green in ADR-011 order: lib/parser
125/125 + tsc + build, app build + 94/94, cargo 20/20 (src-tauri
untouched); live registry re-parsed 0 issues through the built dist
after the checkpoint edits.

## In progress / broken right now
T-009 (TS indexer, L — planned via its own planning pass) BUILDING in
parallel in its own worktree (touches crate-index + app-shell,
disjoint from this merge). Nothing broken.

## Next up (1–3)
1. T-009 verdict → merge; T-011 (derivation) unblocks when both
   T-008 and T-009 are merged.
2. T-016 DONE and merged (1f1009a) — method is v0.1.4; the triage
   encoding is ratified law. Remaining hardening fillers
   (T-017…T-022) all declare app-shell or wait on it, so they queue
   behind T-009's app-shell claim (Cargo plumbing) — next filler
   dispatches when T-009 merges.
3. NEW suggestions for next triage: T-008-s1 (C-02/03/04 intent
   globs — architect), T-008-s2 (undeclared C-08/C-09 → C-05 edges
   via the shared cn helper WILL light drift amber on our own
   registry when the map lands — architect decision: declare /
   restructure / accept), T-008-s3 (numeric-alias id warning).
   @human outstanding items unchanged: the launch-screenshot judgment
   (T-006 criterion 2, both schemes) and the consolidated real-input
   checklist (picker flows, blocker-link click, real-key
   Esc/Enter/Space, Linux run).

## Open questions
None.
