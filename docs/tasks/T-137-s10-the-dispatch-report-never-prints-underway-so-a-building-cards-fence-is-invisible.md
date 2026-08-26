---
id: T-137-s10
title: The dispatch report computes `underway` and never prints it, so a card whose `status:` says somebody is building it — and whose `touches:` declares a fence — is absent from the report entirely
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [tools/e2e]
---

**RAISED BY THE ARCHITECT WHILE DERIVING ITS OWN DISPATCH, AND
RE-MEASURED HERE RATHER THAN TAKEN ON ITS WORD.** The architect's framing
was that this is the DUAL of the rework's R1 — *"a hold must not vanish
because one side of the join is absent"* — and that framing is REFUSED
below, with the repository's own sentences. What survives the refusal is
a real and much smaller reporting gap, which is this card.

## WHAT IS TRUE, MEASURED AT `9d0700e` ON `Mac.lan`

`readDispatchOrder` computes `DispatchOrder.underway` and
`tools/e2e/scripts/dispatch-order.mjs`'s `dispatchReport` never emits it.
Derived by running `node tools/e2e/scripts/brief.mjs --dispatch` and
listing its `# ` section headers:

    THE LIVE LANES · STARTABLE NOW · UNBLOCKED BUT FENCED · UNFENCEABLE
    WAITING · BLOCKED · THE CRITICAL PATH AND THE WORST BLOCKER

**Seven sections and no `UNDERWAY`.** `T-135` — `status: building`,
`touches: [crate-index, method/tasks/TASK-FORMAT.md]` — therefore appears
**zero times** in the whole report (`grep -c 'T-135 '` returns 0), and
the string `TASK-FORMAT` appears **zero times** as well.

**WHY THAT MATTERS TODAY AND NOT IN THE ABSTRACT.** `T-105`, `T-128` and
`T-131` all declare `touches: [method/, docs/CONVENTIONS.md]`, and
`method/` CONTAINS `method/tasks/TASK-FORMAT.md`, so `compareFences`
reports them overlapping with T-135's declared fence by containment. A
session reading `--dispatch` to pick one of the three is not told that a
card claiming to be under construction has declared that ground. The
architect reports nearly dispatching against it.

## WHY THE ARCHITECT'S FRAMING IS REFUSED — this is NOT R1's dual

R1 was: **a lane is PROVED live** (a worktree on a task branch exists on
disk right now) and only its FENCE is unreadable, so claiming disjointness
is a lie about a proved writer. The claimed dual is: **nothing is proved
live at all**, and the proposal is to manufacture a hold out of a `status:`
field. Four of the repository's own sentences rule against it:

1. **The card's criterion 2** defines the term as *"disjoint from every
   live LANE's"*, and criterion 3 requires the lane list to come from
   `git worktree list` and to be **a LIVE fact: timestamped, never
   stamped with a commit**. A hold derived from `status:` is a TREE fact
   wearing a live stamp — the exact shape `T-133` was rejected for.
2. **`method/roles/executor.md` row 5** ranks the worktree list ABOVE
   `status:` where they disagree, and both examples it gives are of the
   BOARD under-reporting (*"a card reading `planned` beside a live
   worktree is a lapsed stamp"*, *"`verifying` is lane-local"*). Neither
   licenses fencing on a stamp with no worktree.
3. **`lane-protocol.md` rule 7** answers "which lanes exist" from the
   repository's worktrees and branches — and the repository's own reading
   of it is decisive: `T-111`'s branch was KEPT after its worktree was
   removed, and that checkpoint states **"AFTER THIS CHECKPOINT THERE ARE
   ZERO LANES."** A kept branch with no worktree is not a lane.
4. **`docs/STATE.md` says it in capitals, twice**: *"ONE CARD IS `status:
   building` WITH NO LANE, AND THAT IS ALSO ON PURPOSE"* and *"NO LANE
   HOLDS A FENCE. THE WHOLE BOARD IS FREE."* And **`T-135-s4` is already
   filed** recording that this card's `status:` has no true value, because
   T-135 was dispatched in halves.

**So `crate-index: FREE` is not a false green; it is the answer to the
question the ledger asks.** Manufacturing a hold would fence three cards
behind a lane that does not exist — the false NEGATIVE the `own-lane`
state exists to prevent, one step over.

## THE REPAIR, AND THE ONE JUDGEMENT IT NEEDS

Print the `underway` set, with each card's DECLARED fence and the plain
sentence that **nothing reserves it**, so the reader sees the claim and
its status in one place instead of inferring the absence. Two options:

- **(a) a seventh section** — `ALREADY UNDERWAY — and what each one
  DECLARES, which is not the same as what any lane HOLDS`. Cheapest, and
  it makes the distinction the architect asked for visible without moving
  a single ruling.
- **(b) a line in `THE LIVE LANES` block** naming every `building` card
  with no lane, as the counterpart of this rework's `IS A LANE WITH NO
  CARD IN THIS CHECKOUT` line. Tighter, and it puts both halves of the
  join's disagreement in one block — which is what `T-111`'s
  `InFlightLane.disagrees` already does for the board.

**(b) is recommended**: it is the same shape, in the same block, and it
keeps the report's section list matching the card's criterion 4.

## WHY THIS WAS NOT TAKEN INSIDE T-137

`tools/e2e` IS inside T-137's fence, so the fence is not the obstacle.
The obstacle is criterion 4, which ENUMERATES what the terminal consumer
shall emit — startable, fenced naming the lane, blocked naming the
blocker, and the critical path and worst blocker. Adding a section is
additive, but this was a REWORK against a specific verdict (R1 the ruling,
R2 the pin), and neither names this. Widening a rework's scope is how a
second rejection happens.
