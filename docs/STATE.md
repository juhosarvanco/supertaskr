# State

Updated: 2026-08-15 by integrator (T-012 merge — MILESTONE 2
COMPLETE), claude-fable-5 @fresh

## Just completed
T-012 (map view T0 + detail panel + pane switcher, L, app-map +
app-shell) done and merged, APPROVED first-pass (same-model). THE
MILESTONE 2 CLOSER: the map slice's four cards — T-008 (component
files) → T-009 (TS indexer) → T-011 (derivation engine) → T-012 (map
view) — are all through the full pipeline, and the architecture map
now exists: the seven-rule deterministic layout (pure TS, zero new
dependencies — elkjs rejected by amendment), sixteen node states on
measured tokens, edges styled by relation, the overlay segmented
control (status · provenance · drift; churn waits for T-013), ADR-016
two-mark provenance on nodes, the drift ring as a stroke that never
moves the box, the T-005-pattern component panel with task re-target,
search, the turn-to-teal delight, and honest degraded modes. The shell
gained the 72px rail (board | map), and the delivery path landed:
collector accepts .json under docs/architecture/, zero-argument
`index_repo` (spawn_blocking seam in index_cmd.rs) with live
loop-termination pinned — one write → one snapshot; unchanged tree →
nothing. Merge was zero-conflict at merge-base 7ca2ec1; pre-regen
suites were the forecast exactly (lib/parser 132/132 + tsc + build;
app build + 375/375; cargo 109 + 2 ignored). The §2 registry
amendments (C-12 claims its engine in place — T-011-s1 resolved as
option a at dispatch; C-05 claims shell/** + verdicts.ts) drained D2
to empty BEFORE the map's own code was even indexed.

THE MAP'S LAUNCH DATA (dogfood findings on merged main, post-regen
graph 75 files / 425 symbols / 749 edges, 272,762 bytes):
- **D1 undeclared_dependency ×4**: C-05→C-06 (8 file edges — eight
  app/test/** suites import @nputer/parser under the umbrella; three
  are the map's own new tests), C-05→C-09 (3 — tests exercise the
  detail panel), C-08→C-05 (4 — the T-008-s2 `cn`/verdicts family),
  C-09→C-05 (2 — same family, other half).
- **D2 unmapped_files: NONE** — zero unclaimed territory; the amended
  registry claimed everything the branch added.
- **D3 declared_only ×3**: C-01 + C-11 (structurally non-code —
  T-011-s2's amber-forever question), C-07 (no TS matches a Rust
  crate; self-clears at T-010).
- **No D4, no D5.** Relation table: same 23 rows, tally now
  **12 confirmed / 4 undeclared / 7 planned** — indexing the map's own
  code flipped C-12→C-05 (4: utils + button), C-12→C-09 (4:
  panel-dismissal, task-detail, TaskDetailPanel) and C-12→C-10 (1:
  watcher-store) from planned to CONFIRMED, and grew C-12→C-06 1→4,
  C-05→C-12 6→20, C-05→C-10 5→8. C-12→C-07 and C-12→C-11 honestly
  stay planned (no TS import can confirm a Rust crate or token file).
Both dogfood fixtures reconciled at integration with every delta
enumerated (dated addenda in architecture-dogfood.test.ts and the
map hero's 59→75 hint) — changed, never loosened.

STANDING INTEGRATOR PRACTICE (T-009-s1, fourth exercise, keep until
T-014's `--check` lands): any merge touching *.ts/tsx/js/jsx outside
docs/ makes the committed graph.json stale — regenerate with
`NPUTER_UPDATE_GOLDEN=1 cargo test --release -p nputer-index --test
self_graph -- --ignored`, confirm byte-determinism, commit with the
checkpoint. Done here: 59→75 files, 308→425 symbols, 535→749 edges,
regenerate-twice byte-identical (sha256 6dfeafd8…), ignored self-check
green, full app suite green after reconciliation. The ceaa949 ordering
lesson held its fourth test: fixture edits BEFORE the final regen (the
fixtures' own loc lives in the graph), and this time TWO fixtures
moved — the derivation dogfood AND the map hero's committed-graph
hint; both are now part of the practice's checklist.

## In progress / broken right now
Nothing in flight. Nothing broken.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live) · the launch-shot re-judgment (T-006's
   pending screenshot predates the rail — light + dark now include
   it) · the standing real-input checklist (picker flows,
   blocker-link click, real-key Esc/Enter/Space) · a Linux run.
2. MILESTONE 3 DECOMPOSED (T-023…T-029, ADR-017): T-023 (genesis
   kit, method lane) dispatchable IMMEDIATELY; T-026 unblocks at
   T-018's merge; T-025/T-027 are L (planning passes at dispatch);
   T-021 recommended into the app-shell lane before T-025 (the ACL
   pin). First slice: T-023+T-024+T-026 — hand-driven genesis
   rendered live.
3. Next architect triage, the full suggestion backlog: T-008-s1/s2/s3,
   T-009-s1 (ratify as standing rule or keep interim until T-014),
   T-009-s2, T-009-s3, T-011-s1 (**RESOLVED** by T-012's option-a
   amendment — mark it so), T-011-s2/s3/s4/s5/s6, T-012-s1 (map tasks
   lens) /s2 (touch-then-reindex third leg) /s3 (collector cap
   single-source) /s4 (layoutKey separator hygiene), T-017-s1/s2/s3.
4. Milestone-4 queue re-enters after F-03: T-010 (Rust lang), T-013
   (semantic zoom + churn), T-014 (CLI/--watch/--check), T-015 (pins)
   + hardening T-018–T-022 — with T-018/T-021/T-022 now dispatchable
   fillers (app-shell is free again).

## Open questions
None.
