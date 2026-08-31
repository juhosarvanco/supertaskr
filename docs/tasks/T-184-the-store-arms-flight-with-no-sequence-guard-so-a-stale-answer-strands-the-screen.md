---
id: T-184
title: The store arms flight with no sequence guard and a command that never answers leaves the latch true for ever — T-171 made the screen honest and left the store permanently able to strand it
feature: F-03
milestone: 4
priority: 2
size: M
status: verifying
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

## Implementation notes

### The lane read a STALE COPY OF ITS OWN CARD, which is T-187's class met live

This lane was cut before the triage sitting that absorbed `T-183`
landed. Its brief, its dispatch summary and the card in its worktree all
described the card as it stood at the base: `status: suggested`, no board
fields, no `absorbs:`, four criteria and a note that triage *might* fold
`T-183`. **The absorption was already intended and was reported to this
lane in its dispatch summary; the tree did not carry it yet, and the
lane's own contract makes the tree the authority.** So the arming and
liveness halves were built first, the disagreement was named rather than
guessed at, and the absorbed half was built after the lane took main in.

Recorded because `T-187` is exactly this card and nothing compared the
two automatically — the collision surfaced only when the merge forecast
conflicted.

**AND THE SAME CLASS BIT THIS LANE A SECOND TIME, ON IDS.** Its two
routed cards were filed as `T-185`/`T-186`, collided with a triage
sitting's own `T-185`–`T-188`, were renumbered to `T-189`/`T-190`, and
collided AGAIN — `T-189` taken on main while this lane built, `T-190`
reserved for another lane. They are `T-191` and `T-192`. Nothing derives
the next free id, so two seats filing concurrently both pick
maximum-plus-one and neither can see the other. Evidence is recorded on
`T-187`, which owns the class.

### What was decided, at the three decision points the card set

**1. What the sequence token IS.** `GenesisTurn.status` — the runner's
own per-turn measurement, which is the field `flightOf` already puts in
front of the flags on the render side. The guard is that same inference
moved to the ARMING side. No seq counter was added and no turn-number
bookkeeping was invented: a turn number alone says WHICH turn and not
whether it is still live.

**2. What an out-of-sequence answer DOES.** It is refused and RECORDED,
never silently dropped. The record names the turn, that turn's status at
the moment of refusal, and which arming site refused it. Non-fatal by
construction: nothing renders it and nothing branches on it.

**3. The liveness half — BOTH are in scope, with different shapes,
because they are different defects.** A late answer is stale EVIDENCE
and can be weighed against the turn it names, so it takes a GUARD. A
command that never answers is an ABSENCE — nothing to weigh, the `await`
never returns, the caller's latch is never released — so it takes a
BOUND. The bound is derived from the one Rust-side wait a command body
can contain, and the derivation is CHECKED by a body against the runner
rather than left in a comment.

### And the absorbed half settled on the same decision, which is the fold's own argument

`cancel` answering `{kind:"idle"}` now disarms. The reason is the one
the absorption section predicted: `idle` is the runner's measurement,
the store's flag is a claim, and the measurement wins — the same rule
as the arming guard, pointing the other way.

**It settles the TURNS and not only the flags, and that is the half a
plausible fix would have missed.** `flightOf` reads `turn.status ===
"running"` BEFORE any flag, so a cancel that cleared `sending`/`phase`
and left a turn stuck at `running` would still leave the footer claiming
a turn nobody is running. It would have looked like a fix and changed
nothing on screen.

**The idle disarm is itself guarded by the seq watermark**, because an
`idle` is a fact about the moment it was ASKED and can resolve after a
new turn has started. Obeying a stale one would cancel a live turn —
this card's own defect with the sign reversed.

### The asymmetries a verifier should attack

- **The DISARMING direction of the status pull is deliberately
  unguarded**, while the disarming direction of `cancel` IS guarded. The
  distinction: a status pull carries the turn it is about and cannot
  contradict a running turn's own events, whereas `idle` carries no turn
  at all and therefore reaches every turn in the list. If that
  distinction is wrong, this is where it is wrong.
- **An UNKNOWN turn still arms, and so does a RUNNING one.** No evidence
  is not contrary evidence. A guard refusing unknown turns would break
  every first turn, whose answer routinely beats its own `started`
  event. There is a body for that arm specifically.
- **The guard is scoped to the flight claim** and to nothing else in the
  status fold; session id, versions and project dir still land from a
  stale pull. A choice, not an oversight.
- **`lastOutcome` is left alone on a refused answer**, because a refused
  `accepted` in the notice slot reads as a failure report for a turn
  that succeeded.
- **`cancelGenesis` is NOT bounded** while the three flight-arming
  commands are. Nothing latches behind cancel, and `CancelOutcome` has
  no error arm for a bound to answer with.
- **A cancelled turn is settled to `cancelled` and the phase to `idle`
  even when the phase was `failed`.** That is the pre-existing branch's
  behaviour, kept rather than quietly widened; `lastError` survives.

### The known RED this lane hands off, and why it is not a regression

`T-171`'s DOM body *"A STRANDED CLAIM IS REFUSED"* now fails — on its
own POSITIVE CONTROL, the line asserting that the fixture really
reproduces the stranded claim. It cannot any more: that fixture strands
the store by pulling a `running` status over a turn that has already
completed, which is precisely the route this card closes. The body's
SUBJECT is untouched and still worth having; only its way of
manufacturing the precondition is gone.

**Measured, not inferred**: the same body passes at this lane's base with
only the store file reverted, and fails with it restored, the store file
byte-identical before and after.

That body is `app-interview`, not this card's `app-agent`. Routed rather
than taken. **A one-line change makes it green and keeps its meaning** —
`stranded` is still reachable by a status pull naming a turn this webview
holds no events for, so the fixture needs a different turn number rather
than a different idea.

### Where the acceptance criteria stopped at the fence

The END-TO-END criterion's screen half is a DOM assertion in
`app-interview`. Its STORE half is built here and driven through the real
module singleton, the real event channel, the real status pull and the
real cancel command, with only the IPC boundary mocked — the same walk
that stranded `T-171`'s fixture, asserted against the store. The DOM half
is routed with the fixture repair, as one card, because they are one edit
in one file.

### Routed, not taken

- **`T-191` (`app-interview`)** — re-express `T-171`'s strand fixture so
  it manufactures the claim by a route this card leaves open, and add the
  screen half of the end-to-end criterion in the same body.
- **`T-192` (`app-shell`)** — the liveness defect has a SIBLING outside
  this fence. `runIndexRepo` and `runPicker` in the shell store take a
  latch synchronously, `await` an unbounded command, and release in a
  `finally`; a command that never answers leaves the button dead for the
  session. Found by this card's own class sweep.
