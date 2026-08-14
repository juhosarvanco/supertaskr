---
id: T-005
title: Card detail view
feature: F-02
milestone: 1
priority: 5
size: M
status: planned
blocked_by: [T-004]
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN a card is clicked THE system SHALL open a detail panel showing
  acceptance criteria, blocked_by (with blocking cards linked),
  touches, verdict history verbatim, and the built_by / verified_by /
  review stamps.
- WHILE the detail panel is open THE system SHALL reflect live file
  changes to that task (via T-003).
- IF the task body lacks a section THEN THE panel SHALL show it as
  empty rather than erroring.

## Implementation notes

## Verdicts
