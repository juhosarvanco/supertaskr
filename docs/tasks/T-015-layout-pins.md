---
id: T-015
title: Layout pins (drag → layout.json)
feature: F-06
milestone: 4
priority: 8
size: S
status: planned
blocked_by: [T-012]
touches: [app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN a node is dragged THE position SHALL persist to
  docs/architecture/layout.json (debounced single-file write — the
  map's only write path, per ADR-014) and survive re-index and app
  restart; unpinned nodes SHALL auto-lay-out around pins (ELK FIXED
  constraints).
- IF layout.json is malformed THEN THE map SHALL ignore it, surface
  the existing parse-error chip, and fall back to auto layout — no
  crash, no partial pinning.
- Pinned nodes SHALL show the faint pin hint from the design spec;
  un-pinning (affordance per design) SHALL remove the entry, and an
  empty layout.json SHALL be deleted rather than committed.

## Implementation notes

## Verdicts
