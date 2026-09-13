---
id: T-300-s7
title: "The settings listing's tree-readings body assumes a card merged since the newest checkpoint, so the closing check reds on every push made between a checkpoint and the next merge — the listing is right (an empty window reads UNREAD by design), the body's precondition is a fact about the calendar"
feature: F-04
milestone: 4
size: S
priority: 1
status: planned
suggested_by: "the Claude seat, the closing check on the range from origin/main to 37dfff4c66bbcd488383a43c0be1ffd5f55eb6b4, 2026-09-12"
blocked_by: []
touches: [tools/e2e/tests/cli.spec.ts, tools/e2e/scripts/settings.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The checkpoint of 2026-09-12 was committed at 37dfff4c and the closing
check ran on the docs-only range behind it (three cards' sections, the
record, STATE). The parser and app legs were GREEN at 389 and 1171; the
e2e leg was RED at exit 1 on one body of `tools/e2e/tests/cli.spec.ts`,
"the listing goes to the PROJECT'S OWN tree for its readings — the
measured column is not a rendering of numbers somebody handed in"
(T-300's verifier correction 1). Its first assertion is a precondition:
`treeReadings(repoRoot).size` must be greater than zero, with the
message "has recorded meters, so at least one loop band prices here —
the arrangement this body needs is present". It received 0. The whole
suite at f608f5fa, one commit earlier, had passed 1022 bodies including
this one.

The cause is not the tree and not the reader. `treeReadings` prices the
loop bands exactly as `npm run health` does: the window is the merges
since the newest `Checkpoint:` commit (`recentCheckpoints(1)`), and
`loopReadings` returns no reading for an empty window — by its own
comment, "an EMPTY window has no worst card, so it reads UNREAD rather
than 0". At 37dfff4c the newest checkpoint is 2026-09-12T13:06:27Z and
the newest record in `docs/checkpoints/meters.jsonl` is T-303-s1's at
12:08:45Z, so the window is empty, the listing correctly shows every
switch against the seat's estimate, and the body's precondition is
false. It was true at f608f5fa only because the previous checkpoint
(2026-09-10) sat behind the T-300 and T-303-s1 merges.

So the body's subject depends on the calendar: it passes whenever a
merge has landed since the newest checkpoint and reds in the gap between
a checkpoint and the next merge — which is precisely when a checkpoint
is pushed. The docs gate lists STATE and the checkpoints as code inputs,
so every checkpoint push owes this spec, and every checkpoint push made
before the next merge will red the closing check the same way. The push
guard then refuses the checkpoint, correctly, on a RED token.

## Why it is a card and not a hand edit

The listing is behaving as designed and the reader is the health
reporter's own; what is wrong is a body that asserts an arrangement the
checkout does not always carry instead of constructing it. This project
routes a body's logic through a lane with its mutants, and the seat's
follow-up on main is reserved for a comment line (T-287's follow-up).
The push of 37dfff4c is held until the next merge appends a record
inside the window, at which point the same closing check goes green with
no change to the tree — a fact this card exists to make visible rather
than rely on.

## Acceptance criteria

- WHEN the body proves that the measured column comes from the tree's own readings THE arrangement SHALL be one the body constructs — a fixture tree carrying a meters file and a `Checkpoint:` commit older than its newest record — so that the priced column is asserted on every run of the suite regardless of when the integration checkout's newest checkpoint landed; the bare control (a project with no readings shows none) SHALL stay.
- WHEN the integration checkout's newest checkpoint is newer than every meters record THE body SHALL still assert something true of that checkout: that `treeReadings` answers an empty map and the listing shows every switch as the seat's estimate naming the window, with no reading borrowed from the fixture; a body that skips in that state SHALL be refused by the verifier.
- WHEN this card lands THE closing check on a docs-only range pushed straight after a checkpoint SHALL be green on this spec, demonstrated once on a real checkpoint commit or on a fixture reproducing 37dfff4c's state, and named in the notes.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 1, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.
