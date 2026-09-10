---
id: T-298-s5
title: "A bounded wait never asks whether its fact is FRESH — a marker left behind by an earlier run satisfies the wait in milliseconds, and a pid that never existed is reported as a process that has left the table, so the two cheapest ways to get a false pass are both silent"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-298 phase 2, measured at 9169545120b54c6e0845efa6de1b65ed524bd3b6, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-298's bounded wait does what its criterion asks and it was measured
doing it: a marker that arrives ends the wait promptly with exit 0, a
marker that never arrives ends it at the stated ceiling with exit 1 and
a report, and the pid arm answers both ways too, leaving the process it
waited on alive and unsignalled.

What the arm never asks is whether the fact it is waiting on could
already have been true before the wait began. Two measurements, both
taken against the shipped arm:

- A marker file left behind by an earlier run satisfies a wait with a
  thirty-second ceiling in under a fifth of a second, and the report
  says `it happened` in the same words a real arrival gets. The code
  argues the early ask deliberately and the argument is sound — a poll
  loop that sleeps first spends an interval learning nothing — but
  nothing removes a marker before arming, nothing makes the path unique
  per run, and no reader downstream can tell a lane that finished from a
  lane whose previous attempt left its marker behind.
- A wait on a pid that never existed reports, after one ask and one
  millisecond, that the process has left the process table. A typo in a
  pid is therefore a wait that passes instantly. The liveness reader
  this arm reuses already returns a process row carrying a start time,
  so the arming ask can distinguish `it is not there now` from `it was
  never there` without a second mechanism.

Neither is a defect against the criterion, which is why this is a card.
Both are a caller discipline the arm could carry instead, and the same
sweep names the related exposure: a marker path an unrelated process can
create ends the wait early, so a wait's fact wants a path only its own
run writes.

## Acceptance criteria

- WHEN a marker wait is armed THE arm SHALL require the marker to be
  ABSENT at arming and SHALL refuse naming the path when it is already
  there, so a leftover from an earlier run cannot be read as an arrival.
- WHEN a pid wait is armed THE arm SHALL ask once whether the process is
  present and SHALL report a pid that was never there as a REFUSAL
  naming the number, distinctly from a process that was watched and then
  left the table.
- WHEN a body drives either arming check THE refusal SHALL be reached in
  the body's own injected time and against a fact the body itself
  planted, so the suite neither waits nor depends on the machine it runs
  on.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
