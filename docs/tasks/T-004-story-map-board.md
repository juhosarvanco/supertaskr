---
id: T-004
title: Story map board (read-only)
feature: F-02
milestone: 1
priority: 4
size: L
status: planned
blocked_by: [T-001, T-002]
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE board SHALL render backbone features as column headers in
  ROADMAP order, task cards beneath ordered by priority (1 = top),
  and a milestone slice line separating milestone 1 from later.
- THE board SHALL color cards by status (planned gray, building amber,
  verifying pulsing, rejected red, done teal), render
  status:suggested as dashed ghosts at column bottom, and collapse
  parked into a row per feature.
- WHEN the underlying files change THE board SHALL update in place
  without a full page reload (via T-003 push).
- IF a card's feature does not exist in the backbone THEN THE board
  SHALL render it in an "unmapped" column rather than dropping it.
- Cards SHALL show id, title, size, model badge when set, and the
  verification badge distinguishing independent / same-model /
  self-verified per docs/design/dashboard.md.

## Implementation notes

## Verdicts
