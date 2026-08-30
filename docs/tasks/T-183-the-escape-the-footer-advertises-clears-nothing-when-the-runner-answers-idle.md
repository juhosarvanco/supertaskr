---
id: T-183
title: ⌘. cannot clear the state its own label advertises — `cancelGenesis` resets nothing when the runner answers `{kind:"idle"}`, so the escape the footer offered @human did nothing on the walk
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-171, routed from inside the lane; corroborated by that card's blind verifier"
touches: [app-agent]
---

**ROUTED OUT OF `T-171`, WHICH COULD NOT REACH IT.** That card's fence is
`app-interview`; this lives in `app/src/lib/agent-store.ts`, and the
lane's own `.nputer/lane-fence.json` does not carry it. The verifier
re-derived the boundary independently rather than accepting the excuse.

## What @human actually saw

The footer that would not stop saying *"planner is thinking…"* also
offered the way out: **"⌘. to stop"**. `T-171` has now made the footer
honest — it no longer claims a turn that is not running. **It did not
make the escape work**, and the escape is the half @human reached for.

`cancelGenesis` resets nothing when the runner answers `{kind:"idle"}`.
So on the walk the chord was pressed against a store that had nothing to
cancel, answered idle, and left every flag exactly where it was.

## Why this is worth its own card rather than a line on T-171

`T-171` fixed the SCREEN's honesty: the state is now derived from the
runner's per-turn status, so a stranded claim is refused and the ending
renders. **A user who hits the stall today gets a truthful screen and
still has no working control** — and the control is the one the screen
names.

**AND IT IS THE SMALLER HALF OF A PAIR.** `T-184` carries the store
arming flight with no sequence guard; this card carries the store
refusing to disarm. They are the same surface from two directions and
should probably be one lane — the filer's recommendation is that
whichever is dispatched first reads the other, and that triage considers
folding them.

## What a fix decides

1. **What `cancel` MEANS when the runner says there is nothing to
   cancel.** The honest answer is probably that the STORE still clears
   its own claim — the runner's idle is evidence the store's flags are
   stale, which is exactly the inference `T-171`'s `flightOf` already
   makes on the render side. Making the store agree with the screen is
   the small version of this fix.
2. **Whether cancel is idempotent and safe to press twice**, since a
   user who pressed it once with no effect will press it again.
3. **What the user is told.** A chord that silently does nothing is the
   failure family `T-171` was written against; a chord that says *"there
   is nothing running"* while the footer says there is would be worse.
   After `T-171` those two can finally agree.

## Acceptance criteria

- WHEN the runner answers `{kind:"idle"}` to a cancel THE store SHALL
  clear its own flight claim rather than leaving it set, and a body
  SHALL pin that with a positive control proving the claim was set
  first.
- THE cancel path SHALL be safe to invoke twice in succession.
- A body SHALL drive the pair END TO END — a stranded claim, a cancel,
  and a screen that afterwards says nothing is running — because the
  defect is only visible where the store and the screen meet.
- Verification: headless, the app suite; `T-171`'s own DOM bodies are
  the neighbours to read first.
