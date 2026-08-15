---
id: T-008
title: Component files convention + parser
feature: F-06
milestone: 2
priority: 1
size: M
status: planned
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE parser (@nputer/parser, node AND pure entries) SHALL read
  docs/architecture/components/*.md into typed ComponentRecords:
  id (^C-\d{2,}$, unique), name, optional layer, paths (non-empty
  glob list), depends_on, decisions, status (auto | the six task
  statuses), touch_slugs (per ADR-015/§4.3 of the plan), body prose.
- WHEN two components' paths match the same file THE model SHALL keep
  first-by-id and record a structured ambiguous_mapping warning.
- IF a component file is malformed, duplicates an id, or names a
  missing id in depends_on THEN THE parser SHALL emit a structured
  issue (file + field, or dangling id) and continue parsing the rest;
  dangling depends_on edges are preserved for placeholder rendering,
  never dropped.
- THE nputer repo SHALL gain its own component files (≥5, same
  C-namespace as ARCHITECTURE.md per ADR-013 §0.0-8 — existing ids
  keep their meaning, finer app components get new ids) parsing with
  zero issues; ARCHITECTURE.md links them.
- ADR-009 SHALL hold on every new collection keyed by file-derived
  strings (hostile-key tests included).

## Implementation notes

## Verdicts
