---
id: T-014
title: nputer-index binary — watch + check modes
feature: F-06
milestone: 4
priority: 7
size: M
status: planned
blocked_by: [T-009]
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE crate SHALL ship a small `nputer-index` binary (the future Node
  CLI shells out to it — ADR-015/ADR-003; this task builds no Node
  code) with: `index [--root .]` (write graph.json), `--check` (exit
  non-zero when the committed graph differs from a fresh index, with
  a plain-text diff summary), `--watch` (keep graph.json current
  headless, debounced, same containment rules as the app watcher).
- THE binary SHALL print component/drift summaries (`arch`,
  `arch drift [--fail-on undeclared|unmapped|any]`) as plain, stable,
  greppable text with documented exit codes.
- IF graph.json is stale THEN `--check` SHALL exit non-zero; IF drift
  findings meet the --fail-on severity THEN `arch drift` SHALL exit
  non-zero — both verified in a fixture repo.
- WHEN `--watch` runs with the app closed THEN a source change SHALL
  update graph.json within the debounce window; two concurrent
  writers (app + --watch) SHALL converge (byte-identical output makes
  last-write safe — asserted, not assumed).

## Implementation notes

## Verdicts
