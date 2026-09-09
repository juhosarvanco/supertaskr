---
id: T-285
title: A parked card's wake condition is machine-read — a `wake:` field naming a card, a date or the fence, with the fence as the default — and the dispatch view lists WOKEN cards beside STARTABLE and flags parked cards that carry no condition at all
feature: F-06
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human (2026-09-09): decision C of the backlog review — \"Are the parked cards still in the priority queue in some way or are they just forgotten?\" — they are forgotten; ruled yes to a machine-read wake condition"
blocked_by: [T-282]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At the third sitting of 2026-09-09 the board carried 129 parked
cards. Sixty-two of them state a wake condition in prose ("unpark with
the second adapter", "unpark at the design pass that owns the map
screen"); none states it in a field, and the dispatch view derives
STARTABLE from planned cards only, so no parked card has ever appeared
in it. orchestrator.md already says PARKED IS A CONDITION, NOT A SHELF
and names the default event — the fence's component is next
dispatched — but nothing reads the condition, so a parked card
resurfaces only when a human re-reads the folder, which the amnesty
of 2026-08-29 did once for 140 cards. The card parser preserves
unknown frontmatter keys, so the field needs no parser change.

## Acceptance criteria

- WHEN a parked card carries `wake:` naming a card id THE view SHALL
  list it as WOKEN once that card's status is done; naming an ISO date,
  once the clock has passed it; naming `fence`, once any lane is
  dispatched whose expanded fence overlaps the parked card's; and WHEN
  the field is absent THE `fence` form SHALL be the default, as
  orchestrator.md states.
- WHEN `brief.mjs --dispatch --full` renders THE view SHALL carry a
  WOKEN section listing each parked card whose condition holds, with
  the condition and the record that satisfied it, each figure carrying
  its provenance, and SHALL change no card — waking is the seat's act
  (promote, or re-park with a new condition).
- WHEN a parked card carries neither a `wake:` field nor a prose
  condition THE view SHALL count and name it under PARKED WITHOUT A
  CONDITION — a flag for the human, never a closure.
- WHEN TASK-FORMAT.md is read THE encoding SHALL be stated once, and
  existing parked cards SHALL NOT be rewritten — their prose conditions
  stand and the seat adds the field at the next triage that touches
  them.
- A body SHALL show a parked card with `wake:` naming a card listed
  WOKEN when that card is done and absent when it is not, a body the
  date form on both sides of the clock, and a body the default form
  where a dispatched lane's fence overlaps and where it does not; each
  body SHALL be seen red on a board that lacks the arrangement.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
