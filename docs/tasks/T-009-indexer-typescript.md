---
id: T-009
title: Indexer crate — walk, hash, TypeScript/JS extraction
feature: F-06
milestone: 2
priority: 2
size: L
status: planned
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

Size L: planning pass required before dispatch (ceremony per
TASK-FORMAT). Spec of record: docs/design/map-technical-plan.md §3,
§5 (as revised §0.0) + ADR-014/015.

## Acceptance criteria
- WHEN run on a TS/JS repo THE indexer (app/src-tauri/crates/
  nputer-index, workspace member, no tauri dependency) SHALL emit
  graph.json per plan §3: files, symbols (with export flag + range),
  resolved import edges, package nodes, unresolved specifiers —
  volatile fields omitted (ADR-014).
- THE output SHALL be byte-identical across two consecutive runs on
  an unchanged tree (golden fixtures ts-basic, ts-paths-alias, mixed
  + a determinism property test).
- WHEN a tsconfig.json declares baseUrl/paths THE resolver SHALL
  honor them (nearest tsconfig up the tree).
- IF a specifier cannot be resolved THEN THE indexer SHALL record it
  in unresolved[] with a reason and continue — never drop, never
  fail the run.
- WHEN one file changes THE incremental path SHALL re-parse only that
  file (< 50 ms on this repo; < 500 ms cold; symbol budget sized so
  graph.json stays under the docs collector's 1 MiB cap, with the
  over-budget state visible in stats, never silent).
- Walking SHALL respect .gitignore via the ignore crate and inherit
  T-003's symlink/canonicalization containment rules for every path
  it reads (tested with an outside-tree symlink).

## Implementation notes

## Verdicts
