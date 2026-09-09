---
id: T-283-s2
title: "T-283 rules what an executor does with a finding it NOTICES inside its own fence and says nothing about a card the board ALREADY carries inside that same fence — T-279-s5 sat wholly inside this lane's three files, needing two lines, and the lane left it because absorbing a filed card is a dispatch decision the rule never granted"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-283, 2026-09-09, at the dispatch stamp 677941a"
blocked_by: []
touches: [method/roles/executor.md, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-283's fence is `method/roles/executor.md`,
`method/roles/verifier.md` and `method/lane-protocol.md`. On the board at
`677941a` sits **T-279-s5**, `status: suggested`, whose `touches:` is
exactly `[method/roles/executor.md]` and whose remedy is a bullet added
to that file's `## The report` list — inside this lane's fence, well
under the size limit, and needing no new criterion because it already
has two of its own.

The rule as written did not reach it, and the lane obeyed the rule rather
than the arithmetic. Executor step 5 governs *"a defect or omission you
notice WHILE BUILDING"*: a finding, not an item of the board. Absorbing a
filed card is a different act with different consequences — that card
carries acceptance criteria a verifier blinded to this lane's card cannot
see, a `status:` somebody has to move, and a place in whatever the triage
sitting was counting. **The gap is real either way**: the same two lines
now wait for a second dispatch of the same file, which is the exact cost
T-283 was filed to stop, and a later lane will meet this the moment two
suggestions pile up on one method file.

Note also what the rule DOES imply, and which this card should not
disturb: an executor that performs an unfiled finding files nothing, so
nothing on the board ever describes it. Absorption is the opposite shape
— a record exists and must be resolved — and that asymmetry is the whole
question.

## Acceptance criteria

- WHEN a lane's armed fence wholly contains a card the board already
  carries as `suggested` THE method SHALL say whether the executor may
  perform it in the lane, and under which of step 5's limits.
- IF absorption is permitted THEN the method SHALL name what happens to
  the absorbed card's `status:`, who moves it, and how the notes declare
  it, so the verifier can tell an absorbed card from an undeclared
  change.
- IF absorption is refused THEN the method SHALL say so in as many words
  beside step 5, because the arithmetic argues the other way and a
  silence reads as permission.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
