---
id: T-322-s5
title: "A question entry may name a card that does not exist, and the hold silently holds nothing: the link between a room and the cards it blocks is written by hand in prose and read by two consumers, and neither of them checks that the far end is there"
feature: F-04
milestone: 4
size: XS
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-322, measured while building the reader: questionHolds builds a map keyed on whatever the entry's Cards held line says, and no consumer compares those ids with the board"
blocked_by: [T-322]
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/tests/dispatch-order.spec.ts, tools/method-evals/evals]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322 puts the link between a reserved decision and the work it blocks in
the room entry, on purpose: no card gains a field, and a card released
from a question is released by editing one entry. The cost of that choice
is that the link is prose, typed by a seat, and read by two consumers —
the dispatch order's NOT STARTABLE rows and the lane cut's refusal.

Neither consumer asks whether the card ids are real. A typo, a card id
from a project the seat was reading a moment earlier, a sub-card that was
renamed: each produces an entry that LOOKS like a hold, reads like a hold
in the room, and holds nothing at all. The card it was meant to hold is
dispatched, which is the exact outcome the entry was written to prevent,
and the only sign is the absence of a row nobody expected to see.

The board is right there. Both consumers already have it.

## Acceptance criteria

- WHEN a question entry names a card THE dispatch order SHALL report a named id that no card carries, rather than silently holding nothing, and the report SHALL name the entry and the id.
- WHEN the method eval audits a question entry THE ids it names SHALL be checked against the board where the eval has one, so a typo reds where the record is written rather than where it fails to act.
- WHEN an entry names only unknown ids THE hold SHALL be reported as VACUOUS by name, because an entry that holds nothing is a decision nobody is waiting on and a reader should be told which of the two it is.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
