---
id: T-018
title: Watcher never silently lies or dies
feature: F-02
milestone: 4
priority: 9
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-003-s1 (residual), T-003-s3, and T-003-s2's reporting
half (the scale work itself stays parked). Triage 2026-08-15.
Schedule alongside milestone 2: graph.json rides this same collector
under the same caps.

## Acceptance criteria
- WHEN docs/ appears or is replaced under the open project root THE
  watcher SHALL re-arm itself (root sentinel; recovery today is a
  manual re-pick nobody would know to do).
- WHEN the collector skips a path (>1 MiB, non-UTF-8, depth/file-cap)
  THE snapshot SHALL carry the skipped paths + reasons and THE
  frontend SHALL surface them in the existing parse-error chip family
  — a skipped existing record must not read as a deletion.
- WHEN the 2000-file cap truncates THE snapshot SHALL set a truncated
  flag surfaced as a quiet footer note (design's "symbols truncated"
  pattern).
- IF the sentinel or skip-reporting paths fail THEN the existing
  watch SHALL be unaffected (additive telemetry, never a new failure
  mode) — pinned by cargo tests.

## Implementation notes

## Verdicts
