---
id: T-137-s9
title: A brief.spec body asserts over the LIVE lane list and the tree's own cards at once, so it reds in every lane whose base predates a newer lane's card
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

**THREE OPTIONS.**

1. **Assert per lane, conditionally**: a lane whose card is in this tree
   names its `touches:`; a lane whose card is not names itself as
   `no live card, fence UNKNOWN`. Keeps the pin's whole value and is
   total. Recommended.
2. **Assert only over lanes whose card the tree holds.** Simpler, and it
   silently stops checking the case the card is about.
3. **Drive the whole body from the porcelain FIXTURE** the same file
   already defines, and keep the live join as a separate, weaker body
   that asserts the two sets agree only where they can.

`T-137` did not repair this. It is inside that card's fence, but
rewriting another card's assertion from inside a lane, without that
card's context, is not a repair an executor makes.
