---
id: T-002
title: "`streak week` — the one-glance week view"
feature: F-02
milestone: 1
priority: 1
size: M
status: planned
blocked_by: [T-001]
touches: [C-02, src/week.rs, src/main.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN `streak week` runs THE system SHALL print one row per habit
  present in the store for the current week — columns Mon..Sun, `x`
  for done and `.` for not — followed by the habit name, using the
  store rules of ARCHITECTURE.md Interfaces (week starts Monday,
  ISO 8601).
- THE full output SHALL fit one 80×24 terminal: up to 20 habit rows
  plus header; WHEN more habits exist THE system SHALL truncate and
  end with one `+N more` line.
- WHEN the store is missing or empty THE system SHALL print
  `no habits yet — log one with: streak done <habit>` and exit 0.
- THE output SHALL be plain ASCII with no ANSI escapes when stdout is
  not a TTY (deterministic in tests and pipes).
- IF the terminal width cannot be detected THEN THE system SHALL
  assume 80 columns.
- IF the store holds a date later than today inside the current week
  THEN THE system SHALL render it as done on that day and never
  panic (hand-edited files are legal input).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
