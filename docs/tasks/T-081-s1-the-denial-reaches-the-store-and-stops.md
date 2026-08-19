---
id: T-081-s1
title: The live denial reaches the store and stops there — nothing renders it yet
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

T-081's second criterion reads *"THE denial SHALL reach the frontend at
the moment it arrives, carrying the tool name and the CLI's own
`message`"*. It does: `RunEvent::Denied` crosses the `genesis-turn`
channel and `reduceGenesisEvent` lands it on `GenesisTurn.denials` in
arrival order. **No component reads that field.**

That is a FENCE fact, not an oversight. T-081's `touches:` is
`[app-agent]`, which ARCHITECTURE defines as `app/src-tauri/src/agent/**`
plus `app/src/lib/agent-store.ts`. The chat a human would see a denial in
is C-13 — `app/src/genesis/InterviewChat.tsx` and
`app/src/genesis/interview-turns.tsx`, area `app-interview`. A card
fenced to the runner and its store cannot build the notice, and building
it anyway would be the scope creep the role forbids.

**The gap is visible in the card's own @human line**, which asks
*"whether a live denial notice reads as information rather than alarm"*.
Nothing exists to judge. Until a C-13 card lands, the honest description
of what T-081 shipped is: the fact now exists, in order, on the right
turn, bounded and stripped — and it is invisible.

**Where it goes when someone takes this.** `interview-turns.tsx`'s
`PlannerTurn` already renders mid-stream furniture from the same turn
object — `planner.activity[planner.activity.length - 1]` is the last tool
label beside the pulse dot. `denials` is the same kind of datum on the
same object and wants the same neighbourhood. Two things the builder
should know rather than rediscover:

- **A denial is not a failure.** The transcribed turn carried two and
  completed. Rendering them in the failure treatment would say the
  opposite of what the runner measured, and `FailureBlock` is the wrong
  component for exactly that reason.
- **The list can name one tool twice** (see `T-081-s2`), and each entry
  may have a null `toolName` or an empty `message`. A renderer that
  assumes both fields are present will print "undefined".
