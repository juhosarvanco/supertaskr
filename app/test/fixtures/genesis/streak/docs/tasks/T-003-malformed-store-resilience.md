---
id: T-003
title: Malformed-store resilience — hand-edited files never crash
feature: F-01
milestone: 1
priority: 2
size: S
status: planned
blocked_by: [T-001]
touches: [C-01, src/store.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN parsing the store THE system SHALL skip any line that is not
  `YYYY-MM-DD<TAB><habit>` and count the skips; parsing behavior is
  identical in `done` (idempotency read) and `week`.
- THE system SHALL treat CRLF line endings and a trailing blank line
  as clean input, not malformed (hand-edited reality; CONVENTIONS
  gotcha).
- IF one or more lines were skipped THEN THE system SHALL print
  exactly one stderr summary `skipped N malformed line(s)` per
  invocation — never one warning per line, never a crash, and stdout
  stays unpolluted.
- IF the store is not valid UTF-8 THEN THE system SHALL exit 1 with a
  one-line stderr message naming the store path (never a panic).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
