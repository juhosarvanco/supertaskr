---
id: T-107-s2
title: noSession tells the user to start the interview and the button that does it is only conditionally on the screen
status: suggested
suggested_by: executor claude-opus-5 @T-107
---

**Found by T-107's criterion 6, which required enumerating every other
`StartOutcome`/`SendOutcome` arm and ruling on which name a fixable
problem with no offered fix. This is one of two the pass turned up.**
It is the same shape T-107 exists to fix, one arm over, and it is filed
rather than built for the reason T-082 filed T-107 rather than building
it: which affordance is right is a product decision.

`noticeSentence` in `app/src/genesis/InterviewChat.tsx` renders
`noSession` as, verbatim at `c4c15c8`:

    there is no planner session to answer; start the interview first.

**The sentence names the fix. The button that performs it is rendered by
a DIFFERENT condition that does not follow from this outcome.** In
`InterviewChat`:

    const notStarted = genesis.phase === "idle" && genesis.turns.length === 0;

and the block carrying **Start the interview** renders on `notStarted &&
offer === null && rejected === null`. `noSession` is a `SendOutcome` — it
comes back from `genesis_send_turn` — and nothing about that answer
implies `phase === "idle"`. A send refused while the store's phase sits
at `failed`, or with any turn in `genesis.turns`, puts the sentence on
screen with no button under it and no other route out of the pane.

**THE SISTER ARM `nothingToResume` IS THE CONTRAST AND IT IS WHY THIS ONE
IS FILED.** That arm reaches the screen only from `genesis_resume` on a
path where nothing started and no turn exists, so `notStarted` is
necessarily true and the button is necessarily beside it. T-107 ruled it
safe on exactly that derivation and ruled this one not safe on exactly
its absence — same enumeration, two different answers, which is what a
ruling is for.

## Two shapes, and this is a product decision

1. **Give the notice its own affordance**, the way `cliNotFound` and
   `unsupportedVersion` now have one. Costs a second **Start the
   interview** control that duplicates the one already on screen most of
   the time — two ways to do one thing, which is the duplication T-049
   spent a card removing one screen over.
2. **Make the existing block's condition follow from the outcome**
   rather than from the phase: render it whenever nothing is running,
   including after a failure. Smaller, and it fixes the sibling case
   nobody has named yet, but it changes when an existing block appears
   and therefore wants its own pin.

**Shape 2 looks right and is not obviously safe** — `notStarted` also
gates the auto-start effect, so widening the same expression would widen
a process spawn. Whoever takes this should split the two readings before
touching either.

Fence `[app-interview]` for shape 1; shape 2 is the same fence, since
`notStarted` is local to `InterviewChat.tsx`. A pin belongs in
`app/test/interview-chat-dom.test.tsx`, which is `[app-shell]` — see
`T-107-s4`, which is the same fence problem this card's parent hit.
