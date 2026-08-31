---
id: T-184
title: The store arms flight with no sequence guard and a command that never answers leaves the latch true for ever — T-171 made the screen honest and left the store permanently able to strand it
feature: F-03
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
suggested_by: "executor claude-opus-5@subagent @T-171, routed from inside the lane; its blind verifier judged this one LOAD-BEARING and said it should be carded"
touches: [app-agent]
absorbs: [T-183]
builder:
review:
---

**ROUTED OUT OF `T-171`, AND ITS VERIFIER SINGLED THIS ONE OUT.** Of the
three findings that lane routed, the verdict named this the load-bearing
one, in as many words: *"this card makes the screen honest while leaving
the store permanently stranded."*

## The mechanism, measured rather than theorised

`reduceGenesisOutcome` and `applyGenesisStatus` in
`app/src/lib/agent-store.ts` both ARM the interview's flight state **with
no sequence guard** — nothing checks that the answer arriving belongs to
the turn currently in play. A stale or out-of-order answer therefore
re-arms flight for a turn that has already settled.

**It was not found by reading. It stranded `T-171`'s own first DOM
fixture**, which is how the executor met it: the fixture went into a
state the screen could not leave, from a store re-arming behind it.

**And a third face of the same surface**: a command that never answers
at all leaves the UI latch true for ever, because nothing else ever
clears it. `flightOf` names that case rather than guessing at it — it is
a runner LIVENESS question, and this card is where it belongs.

## Why T-171 did not close it, and why that was right

`T-171`'s fence is `app-interview`; this is `app-agent`. The lane routed
rather than widened, and the verifier re-derived the boundary from
`.nputer/lane-fence.json` rather than accepting the claim.

**What `T-171` DID buy is the reason this card is now cheap**: the
screen no longer believes a claim a settled turn contradicts, so a
stranded store produces a *recoverable* screen instead of a permanent
one. This card removes the strand at its source; that one stopped it
from being fatal.

## What a fix decides

1. **What the sequence token IS.** The runner already carries a per-turn
   `status` that `flightOf` reads — whether the guard keys on that, on a
   turn number, or on a session-scoped id is the design question, and it
   should be the SAME token the screen already trusts rather than a
   second one invented here (T-057's two-implementations rule).
2. **What an out-of-sequence answer DOES.** Dropping it silently is one
   option and is probably wrong — this project's own doctrine is that a
   silent drop is worse than a named one. A recorded, non-fatal
   observation is the shape to consider.
3. **The liveness half.** A command that never answers is not the same
   as one that answers late, and the fix for the first is a bound rather
   than a guard. Say whether both are in scope; if only one is, say
   which and route the other.

## Acceptance criteria

- WHEN an answer arrives for a turn that is not the one in play THE
  store SHALL NOT arm flight, and a body SHALL prove it with the
  out-of-order answer constructed rather than described.
- THE guard SHALL key on a token the screen already trusts rather than
  introducing a second source of truth.
- WHERE a command can never answer, the store SHALL NOT be left claiming
  flight for ever; if the answer is a bound, the bound SHALL carry its
  reason at its site.
- A body SHALL prove the pair END TO END: a stale answer, and a screen
  that does not enter the state `T-171` had to teach it to leave.
- Verification: headless, the app suite. **`T-183` is this card's other
  half** — the store refusing to disarm, where this is the store arming
  without evidence — and whichever is dispatched first should read the
  other; triage may well fold them.

## ABSORBED AT STANDING TRIAGE SITTING #6 (2026-08-31): T-183 — the same surface, faced the other way

**Both cards asked for this in their own text**, and the filer's
recommendation was explicit on each: *"they are the same surface from two
directions and should probably be one lane."* This sitting agrees, and
the reason is mechanical rather than editorial — **they name the same
file, the same fence, and the same two functions.** `T-183`'s
`cancelGenesis` and this card's `reduceGenesisOutcome` /
`applyGenesisStatus` all live in `app/src/lib/agent-store.ts` under
`[app-agent]`. Two lanes could not run concurrently, and whichever ran
second would open a file the first had just rewritten.

**T-183's half, carried here intact**: `cancelGenesis` resets nothing
when the runner answers `{kind:"idle"}`, so the escape the footer
advertises — *"⌘. to stop"* — did nothing on @human's walk. That is the
store refusing to DISARM; this card carries the store ARMING without
evidence. **A guard that fixes only the arming leaves the user with no
working control, and a cancel that fixes only the disarming leaves the
next stale answer free to re-arm it.** Either alone is a half-fix that
looks whole.

**The folded card therefore owes four criteria, not three** — T-183's
two are added verbatim below and neither is softened by the merge:

- WHEN the runner answers `{kind:"idle"}` to a cancel THE store SHALL
  clear its own flight claim rather than leaving it set, and a body SHALL
  pin that with a positive control proving the claim was set first.
- THE cancel path SHALL be safe to invoke twice in succession.

**And the design questions compose rather than conflict.** T-183's first
question — what `cancel` MEANS when the runner says there is nothing to
cancel — has the same answer as this card's first: the token the SCREEN
already trusts. `flightOf` makes exactly that inference on the render
side already, so **making the store agree with the screen settles both
halves with one decision**, which is the strongest argument for the fold
and the one that would have been missed by running them apart.

`T-183`'s file is removed; this card is the survivor and its id is the
one to cite. **The executor SHALL read `T-171`'s DOM bodies first** —
they are what met this defect live.
