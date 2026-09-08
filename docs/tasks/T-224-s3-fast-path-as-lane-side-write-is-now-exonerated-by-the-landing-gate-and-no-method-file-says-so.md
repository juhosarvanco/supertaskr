---
id: T-224-s3
title: Fast path A's LANE-SIDE write is now exonerated by name at the landing gate, and neither method file that prescribes it says so — the grant's second write is a line a landing check has to recognise
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-224's lane, 2026-09-08 — found while building the arm, and OUT OF FENCE for it (method/ is T-265's while both lanes are live)
blocked_by: []
touches: [method/lane-protocol.md, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`method/lane-protocol.md`'s fast path A prescribes TWO writes: *"the
amendment goes onto the integration branch AND into the lane's working
copy of the card, in that order"*, and
`method/tasks/TASK-FORMAT.md`'s field clause states the same pair from
the field's side. Both name the readers they were written for — the
expansion, the write-time guard, and a landing check that reads the
integration branch.

`T-224` added a THIRD reader of that same line, and it reads the pair
rather than either copy: the landing gate now judges whether a card's
`touches:` LINE moved inside a lane's own committed range. The lane-side
half of a legitimate grant IS such a move — an unsynced lane commits, in
its own merge-base-to-tip range, a line its base does not carry — so the
gate exonerates it by comparing the tip's line against the integration
branch's own copy, character for character. The dispatch brief for
`T-224` asserted the opposite ("a fast-path-A grant never appears in a
lane's own range"), which is true of the two OTHER deliveries and false
of the one these files prescribe; the arm is built to the files.

## What to build

- One clause in fast path A saying the lane-side write is a line a
  LANDING check must recognise, and that what makes it recognisable is
  that it equals the integration branch's copy exactly — which is the
  same "character for character" the grant's read-back already demands,
  now load-bearing for a second reader.
- The FIELD clause in `tasks/TASK-FORMAT.md` names its readers; a third
  one has arrived and the sentence that enumerates them should say so.
- **A version bump is triage's call, not this card's** — the trigger
  test is `method/`'s own (SHIPPED bytes / GRAMMAR), and a fence of
  `[method/lane-protocol.md, method/tasks/TASK-FORMAT.md]` cannot carry
  a bump: its third file is Rust (`T-078-s3`). Decide before dispatch.
