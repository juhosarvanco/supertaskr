---
id: T-017
title: Board tells the whole truth — panel + card-face completeness
feature: F-02
milestone: 4
priority: 8
size: M
status: planned
blocked_by: []
touches: [app-board, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-004-s1, T-005-s1, T-005-s2, T-005-s3, T-006-s3, T-006-s4.
Triage 2026-08-15. app-shell only for the header data-panel-exempt
attribute.

## Acceptance criteria
- THE task cards and ghost cards SHALL contain pathological unbroken
  titles (break/clamp utilities; token-backed) without bleeding
  across columns.
- WHEN a parked row is expanded THE parked tasks SHALL open in the
  existing detail panel via their cardRef (the one population the
  board cannot inspect today).
- THE detail panel SHALL render Implementation notes as a
  collapsed-by-default disclosure section (@human-confirmed taste
  call; verbatim, mono, scrollable like verdicts).
- WHEN the theme toggle (or other header controls marked
  data-panel-exempt) is pressed WHILE the panel is open THE panel
  SHALL stay open.
- THE card face SHALL show the design's `rejected ×N` count derived
  from verdictEntries() in selectBoard (no parser change), AND
  verdict-block tinting SHALL be first-match-wins on the header
  paragraph (an APPROVED entry mentioning "REJECTED" tints approved)
  — both pinned by tests.
- IF a card has zero verdicts THEN no count renders (absence, not 0).

## Implementation notes

## Verdicts
