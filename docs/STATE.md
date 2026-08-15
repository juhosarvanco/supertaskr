# State

Updated: 2026-08-15 by integrator (T-011 merge — the map's semantic
layer is complete), claude-fable-5 @fresh

## Just completed
T-011 (derivation engine, M, app-map) done and merged, APPROVED
first-pass (same-model). The derivation engine exists: pure DOM-free
TypeScript in app/src/lib/architecture/ ({glob,graph,derive}.ts) joins
intent (component files via C-06) ⨝ reality (graph.json, validated at
an untrusted boundary) ⨝ tasks into file→component mapping, edge
relations {confirmed/planned/undeclared/observed}, status + provenance
rollups, and drift findings D1–D5 — with both degraded modes (no
graph → declared-only + indexNotRun; no components → inferred
pseudo-components) and ADR-009 hostility pinned by 135 new tests
(46 glob + 30 graph + 50 derive + 9 dogfood). Merge was zero-conflict:
the branch was byte-identical to pre-T-017 main everywhere it mattered
and graph.json auto-resolved to main's T-017 regen. Pre-regen suite
state was the forecast exactly — 252/256 with only the four dogfood
pins red (the reconciliation trigger, not a defect); lib/parser
132/132 + tsc + build, cargo 100 + 2 ignored, app build clean.

THE DOGFOOD FINDINGS ON MERGED MAIN (the map's launch data; regenerated
graph 59 files / 308 symbols / 535 edges, 197,398 bytes):
- **D1 undeclared_dependency ×4**: C-05→C-06 (5 file edges — five
  app/test/** files import @nputer/parser; registry omits the dep
  because no C-05 *source* file does), C-05→C-09 (3 — tests exercise
  the detail panel), C-08→C-05 (3 — the T-008-s2-predicted `cn` pair,
  half 1), C-09→C-05 (1 — half 2).
- **D2 unmapped_files ×1, four files**: the three engine files
  (app/src/lib/architecture/ — claimed by no component; C-12 declares
  app/src/architecture/**: the T-011-s1 tension) + T-017's
  app/src/lib/verdicts.ts (no registry literal claims it; C-05's only
  app/src/lib literal is utils.ts). Honest pins until T-012's registry
  amendment drains them.
- **D3 declared_only ×4**: C-01 + C-11 (structurally non-code →
  T-011-s2), C-07 + C-12 (self-clear at T-010/T-012).
- **No D4, no D5.** Relation table: 24 edges — 7 confirmed /
  8 undeclared / 9 planned.
Fixture reconciled at integration with enumerated deltas (dated
addendum in the task file): mapping 49→59 files, C-05 15→21,
+["unmapped", 4]; D1:C-05→C-06 fileEdges 2→5; new D2:unmapped; table
20→24 (C-05→C-08 confirmed 3→4, C-08→C-09 confirmed 5→6, four new
unmapped edges: C-05→un 7, C-08→un 1, C-09→un 1, un→C-06 1); drift
+unmapped. Changed, never loosened — every count and content exact.
Full suite green after: app 256/256, lib/parser 132/132, cargo 100+2.

STANDING INTEGRATOR PRACTICE (T-009-s1, third exercise, keep until
T-014's `--check` lands): any merge touching *.ts/tsx/js/jsx outside
docs/ makes the committed graph.json stale — regenerate with
`NPUTER_UPDATE_GOLDEN=1 cargo test --release -p nputer-index --test
self_graph -- --ignored`, confirm byte-determinism, commit with the
checkpoint. Done here: 51→59 files, 230→308 symbols, 407→535 edges,
regenerate-twice byte-identical (sha256 4d60f936…), ignored self-check
green. The rider unique to this merge — reconciling the dogfood
fixture the regen moves — is done and documented above; future regens
hit that fixture too, so its maintenance contract (top of
app/test/architecture-dogfood.test.ts) is now part of this practice.

## In progress / broken right now
Nothing in flight. Nothing broken.

## Next up (1–3)
1. THE SLICE'S LAST CARD: T-012 (map view, L, app-map) — fully planned
   (c8ba301: seven-rule layout, overlay partition, rail, index_repo
   seam), architect-approved. BOTH gates now cleared: T-011 merged
   (this checkpoint) and app-shell free (T-017 landed). Awaiting the
   explicit @human size-L dispatch word — the map renders when it
   lands. AT DISPATCH the architect decides T-011-s1 (amend C-12's
   paths to claim the engine, or move the engine under
   app/src/architecture/**) — that decision plus a verdicts.ts claim
   drains the D2 group above.
2. Suggestion triage backlog: T-008-s1 (C-02/03/04 intent globs —
   architect), T-008-s2 (umbrella cn edges — architect), T-008-s3
   (numeric-alias id warning), T-009-s1 (ratify as standing rule or
   keep interim until T-014), T-009-s2 (URL-scheme specifier gate),
   T-009-s3 (cargo-audit lane → T-020's CI), T-017-s1 (remaining
   unbroken-text surfaces), T-017-s2 (verdict-block overflow parity),
   T-017-s3 (verdict-splitter column-0 anchor); NEW with this merge:
   T-011-s1 (engine location vs C-12 paths — flagged architect
   decision AT T-012 dispatch), T-011-s2 (non-code components amber
   forever under D3), T-011-s3 (T-016 done-with-no-stamp → C-06
   unreviewed), T-011-s4 (name the glob/gitignore deviations),
   T-011-s5 (derivation edge blemishes), T-011-s6 (src node-import
   tripwire).
3. @human outstanding items unchanged: the launch-screenshot judgment
   (T-006 criterion 2, both schemes) and the consolidated real-input
   checklist (picker flows, blocker-link click, real-key
   Esc/Enter/Space, Linux run).

## Open questions
None.
