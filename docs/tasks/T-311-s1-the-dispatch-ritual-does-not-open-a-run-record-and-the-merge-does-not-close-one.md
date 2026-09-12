---
id: T-311-s1
title: "The dispatch ritual does not OPEN a run record and the merge does not CLOSE one, so the record T-311 built is a document a seat has to remember to write beside the ritual that already knows every field it needs"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-311` built the record, the reservation and the operations, and wired
them to one arm a seat types. It did NOT wire them to the two arms that
already perform the ritual around a child's life.

`--dispatch-lane` derives, in one pass, every field an assignment
carries: the card, the role, the lane worktree, the base commit, the
brief's path, the model each seat runs, the port and the scratch stem. It
then cuts the lane, arms the fence and writes the brief — and stops. The
seat that dispatched has to write an assignment document by hand from
facts the arm already held, and run `--run start` beside it, or the child
runs with no record at all.

`--merge` is the same gap at the closing end: it knows the verdict, the
tip, the meters and the card, and it appends the readings to the bands —
while the attempt whose work it is merging stays open in the runs
directory with nothing collecting it.

## Why it is worth a card rather than a shrug

A record a seat must remember to write is a record that will be missing
on exactly the day it is needed, which is the day the seat is gone. The
recovery day that motivated `T-311` is that day.

It is a separate card because the wiring is not the record: the dispatch
arm's ritual is a named sequence with a printed ledger and a refusal at
the first step that fails, so adding a step to it moves an order that
other cards cite. That is a change to the ritual, argued on its own.

## The shape that would work

The assignment is derived from the dispatch plan rather than typed, the
`start` becomes a step of the ritual with its own ledger line, and the
bind is the step that follows the seat's own spawn. At the other end, the
merge collects the attempt it is merging and says so in its output. A
body that dispatches into a scratch repository and finds the record, and
one that merges and finds the attempt collected, are what make it real.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
