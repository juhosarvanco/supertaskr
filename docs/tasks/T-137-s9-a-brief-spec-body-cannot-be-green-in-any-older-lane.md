---
id: T-137-s9
title: TAKEN AND FIXED — a brief.spec body joined the MACHINE-wide lane list to the CHECKOUT's card index, so it reddened every older lane the moment a new one was cut
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [tools/e2e]
---

**OBSERVED, WITH ITS POSITIVE CONTROL, INSIDE ONE LANE.**
`tools/e2e/tests/brief.spec.ts:706` — *"a brief assembled at this ref
names the lanes the repository holds, and no others"* — reds:

    Expected substring: "T-141 touches:"
    Received:           "T-141: no live card, fence UNKNOWN"

**THE MECHANISM IS A JOIN ACROSS TWO CLOCKS.** `git worktree list` is
SHARED by every worktree of the repository, so a lane sees lanes cut after
its own base. `docs/tasks/` is the running TREE's, so it holds only the
cards that existed at that base. The body asserts that every live lane's
`touches:` is named — which is impossible for a lane whose card is newer
than the tree the suite is running in.

**THE POSITIVE CONTROL IS IN THE SAME LANE AND THE SAME TREE.** `T-137`'s
first full `tools/e2e` run, at 19:21 EEST, was **204/204 exit 0**. Its
second, at 19:53 EEST on the same tree plus two committed doc writes, was
**204 passed / 1 failed**. Between them, `T-141`'s lane was cut at
`2a922ce`. **Nothing in the tree changed the answer; a sibling worktree
did.**

**THIS IS NOT A FLAKE AND "RUN IT AGAIN" DOES NOT CLEAR IT.** The body
stays red for as long as a newer lane is live, in every older lane, and it
is exactly the shape `docs/STATE.md` warns about elsewhere: a body whose
title says nothing about the cause and whose remedy looks like the remedy
for a flake.

**THE DERIVATION ITSELF IS ALREADY CORRECT** — `dispatch-brief.mjs` prints
`T-141: no live card, fence UNKNOWN`, which is the honest answer and the
one `lane-protocol.md` rule 7 asks for. **Only the ASSERTION is wrong.**

## TAKEN — this card is its own discharge, and the TRIAGE still owns the disposition

**`status:` STAYS `suggested` DELIBERATELY.** The repair landed in
`T-137`'s lane; the DISPOSITION of a suggestion card is the triage's, not
the executor's, and a flat card stamped `rejected` would also be counted
as a rejected TASK by the board's own census and drawn as one by the map.
Read this section as the discharge and dispose of the card accordingly.

**THE ARCHITECT REACHED THE SAME FINDING INDEPENDENTLY, HALF AN HOUR
LATER, AND HANDED THE DECISION TO `T-137`'s LANE** on the ground that
`tools/e2e` is that card's fence and nobody else could touch it, and that
"what is dispatchable given the live lanes" meeting a checkout boundary is
that card's own subject one layer over. **`T-138`'s verifier hit the same
red and correctly refused to attribute it**, measuring that the base tree
failed identically and that `T-141` landed 23 minutes after that lane's
tip.

**IT WAS TAKEN, AND OPTION 1 IS WHAT SHIPPED** — with the deterministic
half of option 3 beside it. The body now partitions `ctx.lanes`:

- a lane whose card **this checkout** resolves must have its `touches:`
  named, as before;
- a lane whose card it **cannot** resolve must be reported as
  `<id>: no live card, fence UNKNOWN`, must NOT be given a fence, and
  must raise a finding;
- the partition is asserted TOTAL, so no lane falls out of both halves;
- and the unresolvable branch is ALSO driven off the file's existing
  porcelain FIXTURE (`T-901`, a real lane in it that no card declares),
  so that half is pinned whether or not a newer lane happens to exist.

**NARROWER IS NOT WEAKER: the unresolvable side had NO assertion at all
before this, and now has four.** The DERIVATION never needed a change —
`dispatch-brief.mjs` has always printed the right sentence and raised the
right finding. Only the assertion was wrong.

**POISON DRILL, two arms, both on the PRODUCER, whole-suite uniqueness:**

    A19  the unresolvable branch prints a fence anyway   exit 1, 1 body, unique
    A20  the unreadable fence stops raising a finding    exit 1, 1 body, unique

Both restored by sha256 to a byte-identical file. `tools/e2e` is
**205/205 exit 0** afterwards with `T-141` live.

**WHAT IS NOT DISCHARGED, AND IT IS THE GENERAL SHAPE.** This is the same
class as `T-132-s6`: **a MACHINE-scoped fact joined to a CHECKOUT-scoped
one, with nothing in the code marking the seam.** A port number and a
worktree list are machine-scoped; a card index, a fence and a graph are
checkout-scoped. Two instances now, in two different files, found weeks
apart, each diagnosed from scratch. **Nothing names the class**, and a
convention bullet that did would have made both diagnoses a lookup. That
belongs at `docs/CONVENTIONS.md`'s seat, which already carries a queue.
