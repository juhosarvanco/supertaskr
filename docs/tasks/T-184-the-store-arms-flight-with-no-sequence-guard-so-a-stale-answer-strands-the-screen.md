---
id: T-184
title: The store arms flight with no sequence guard and a command that never answers leaves the latch true for ever — T-171 made the screen honest and left the store permanently able to strand it
status: verifying
suggested_by: "executor claude-opus-5@subagent @T-171, routed from inside the lane; its blind verifier judged this one LOAD-BEARING and said it should be carded"
touches: [app-agent]
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

## Implementation notes

### What was decided, at the three decision points the card set

**1. What the sequence token IS.** `GenesisTurn.status` — the runner's
own per-turn measurement, which is the field `flightOf` already puts in
front of the flags on the render side. The guard is that same inference
moved to the ARMING side: an answer names a turn, the store looks that
turn up, and a claim about a turn whose status has moved off `running`
is refused. No seq counter was added and no turn-number bookkeeping was
invented; a turn number alone says WHICH turn and not whether it is
still live, which is why the status and not the number is the token.

**2. What an out-of-sequence answer DOES.** It is refused and RECORDED,
never silently dropped. The record names the turn, that turn's status at
the moment of refusal, and which of the two arming sites refused it. It
is non-fatal by construction: nothing renders it and nothing branches on
it, so it can only ever add an explanation.

**3. The liveness half — BOTH are in scope, and they got different
shapes because they are different defects.** A late answer is stale
EVIDENCE and can be weighed against the turn it names, so it takes a
guard. A command that never answers is an ABSENCE — there is nothing to
weigh, the `await` never returns, and the caller's latch is never
released — so it takes a BOUND. The bound is derived from the one
Rust-side wait a command body can contain rather than picked, and the
derivation is checked by a body against the runner rather than left in a
comment.

### The asymmetries a verifier should attack

- **The disarming direction is deliberately UNGUARDED.** A status that
  says idle or failed is applied exactly as before. The argument is that
  a disarming claim can only release a screen, never strand one, so
  requiring evidence for it would buy nothing and could keep a stranded
  claim alive. If that argument is wrong, this is where it is wrong.
- **An UNKNOWN turn still arms, and so does a RUNNING one.** No evidence
  is not contrary evidence. A guard that refused unknown turns would
  break every first turn, whose answer routinely beats its own `started`
  event off a runner thread. There is a body for that arm specifically,
  because it is the half a too-eager guard would silently take.
- **The guard is scoped to the flight claim and to nothing else in the
  status fold.** The session id, version strings and project dir still
  land from a stale pull. That is a choice, not an oversight.
- **`lastOutcome` is left alone on a refused answer.** Writing the
  refused `accepted` into the screen's notice slot would read as a
  failure report for a turn that in fact succeeded.
- **The bound is on the flight-arming commands only.** `cancelGenesis`
  is invoked fire-and-forget with no latch behind it, and the store's
  claim in that scenario was armed by a real `started` whose own
  runner-side deadlines still answer for it.

### The known RED this lane hands off, and why it is not a regression

`T-171`'s DOM body *"A STRANDED CLAIM IS REFUSED"* now fails — on its
own POSITIVE CONTROL, the line asserting that the fixture really
reproduces the stranded claim. It cannot any more: that fixture strands
the store by pulling a `running` status over a turn that has already
completed, and that is precisely the route this card closes. The body's
subject (the screen refuses a stranded claim) is untouched and still
worth having; only its way of manufacturing the precondition is gone.

**It is measured, not inferred**: the same body passes at this lane's
base commit with only the store file reverted, and fails with it
restored.

That body lives in `app/src/genesis`'s test set, which is
`app-interview`, not this card's `app-agent`. The repair is routed
rather than taken — see below. **A one-line change makes it green again
and keeps its meaning**: `stranded` is still reachable, by a status pull
naming a turn this webview holds no events for, so the fixture needs a
different turn number rather than a different idea.

### Where the acceptance criteria stopped at the fence

Criterion 4 asks for the pair END TO END, and its screen half is a DOM
assertion in `app-interview`. The store half is built here and driven
through the real module singleton, the real event channel and the real
status pull, with only the IPC boundary mocked — the same walk that
stranded `T-171`'s fixture, asserted against the store. The DOM half is
routed with the fixture repair, as one card, because they are one edit
in one file.

### Routed, not taken

- **`app-interview`** — re-express `T-171`'s strand fixture so it
  manufactures the claim by a route this card leaves open, and add the
  screen half of criterion 4 in the same body.
- **`app-shell`** — the liveness defect has a SIBLING outside this
  fence. `runIndexRepo` and `runPicker` in the shell store take a latch
  synchronously, `await` an unbounded command, and release in a
  `finally`. That is the same shape, so a command that never answers
  leaves the button dead for the rest of the session.
- **`T-183` is untouched.** It is a live card in the tree with its own
  criteria, and this lane built its own card only.
