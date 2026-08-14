---
id: T-007
title: App opens nputer's own repo
feature: F-02
milestone: 1
priority: 7
size: S
status: planned
blocked_by: [T-003, T-004]
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN the app launches with no argument THE system SHALL open the
  nputer repo it lives in and render this board — these seven cards —
  live.
- THE system SHALL also accept any folder via a picker and render it
  if it contains docs/ in the convention layout.
- IF the chosen folder has no docs/ THEN THE system SHALL show a
  friendly empty state naming what it looked for (no crash, no blank).

## Implementation notes

## Verdicts
