---
id: T-011
title: Derivation engine — intent ⨝ reality ⨝ tasks (TypeScript)
feature: F-06
milestone: 2
priority: 4
size: M
status: planned
blocked_by: [T-008, T-009]
touches: [app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE app SHALL compute, in pure DOM-free TypeScript (ADR-015, the
  T-004 selector pattern): file→component mapping (first-by-id glob
  match; no match → unmapped), component edges with relation
  {confirmed, planned, undeclared} per plan §4.2, status rollup per
  §4.3 as revised (touch_slugs ∪ component: field; frontmatter
  status only), provenance rollup (weakest of done tasks) per §4.4,
  and drift findings D1–D5 with stable ids.
- WHEN a task or component file changes on disk THE derived model
  SHALL update through the existing live snapshot path (no new IPC).
- IF graph.json is absent THEN THE model SHALL degrade to declared
  components only (all planned, "index not run" flag); IF
  components/ is absent THEN to inferred pseudo-components grouped
  by top directory, flagged inferred — no crash, no blank in either
  direction.
- Unit tests SHALL cover every rollup rule, every drift rule, both
  degraded states, and ADR-009 hostile keys; a fixture asserting
  this repo's expected findings SHALL pass (the dogfood check).

## Implementation notes

## Verdicts
