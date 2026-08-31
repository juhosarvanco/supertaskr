---
id: T-192
title: The shell store takes a latch and then awaits an unbounded command — `runIndexRepo` and `runPicker` have the same never-answers shape T-184 bounded in the agent store, and a command that never answers kills their button for the session
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-184, found by that card's own class sweep — the class is named there and this is the sweep's non-empty result"
touches: [app-shell]
---

**ROUTED OUT OF `T-184`'S CLASS SWEEP.** That card fixed a liveness
defect and then asked the question this project requires it to ask: is
this a defect of a CLASS? It is, and the sweep found two siblings
outside the lane's fence. `T-184`'s fence is `app-agent`; these live in
`app/src/lib/watcher-store.ts`, which the registry gives to `C-10` and
therefore to `app-shell`.

## The shape, stated so it can be checked rather than believed

Both functions do the same three things in the same order:

1. take a single-flight latch SYNCHRONOUSLY (`shell.indexing`,
   `shell.picking`) and return early when it is already held;
2. `await invoke(...)` with no bound on how long the boundary may take;
3. release the latch in a `finally`.

**A `finally` runs when the promise SETTLES.** A rejected command is
handled — both have a `catch`. A promise that never settles at all is
not: the `finally` never runs, the latch is never released, the early
return then refuses every subsequent press, and the button is dead for
the rest of the session with no error anywhere.

This is the same defect `T-184` bounded in the agent store, and it was
named there in the same words: an absence is not a rejection, and the
only honest repair is to stop waiting.

## What is NOT being claimed

**No sighting.** This is a shape found by a sweep, not a defect anybody
has watched happen — unlike the agent-store half, which stranded a real
fixture. The sweep is recorded because an unrecorded sweep and an unrun
one are indistinguishable to the next reader; the priority this earns is
the filer's guess and triage's to set.

**The two are not equally exposed.** `runPicker` awaits a native folder
dialog, which is open for as long as a human leaves it open — so any
bound there is a bound on a HUMAN and is a different design question
from a bound on a subprocess. `runIndexRepo` awaits a subprocess with no
such excuse. Say which of the two is in scope, and if only one is, say
which and route the other.

## What a fix decides

1. **Whether the bound is shared with the agent store's or spelled
   again.** `T-184` exported its bound and the helper that applies it;
   whether the shell store imports those or states its own is a
   component-boundary question, and the answer that makes two
   implementations of one rule is the wrong one (T-057).
2. **What a bounded picker MEANS**, given the human on the other end.
   The honest answer may be that the picker is not bounded at all and
   its latch is released by a different mechanism.
3. **What the user is told.** A latch that releases silently leaves the
   user pressing a button that already failed once.

## Acceptance criteria

- WHERE a shell-store command can never answer, the latch it holds SHALL
  NOT be left held for the session, and a body SHALL prove it with the
  never-answering command CONSTRUCTED — a promise that neither resolves
  nor rejects — rather than described.
- A body SHALL prove a REJECTED command still behaves exactly as it does
  today, so the repair does not turn a refusal into an absence.
- A body SHALL prove a HEALTHY command is untouched, with its answer
  shown to have come from the command rather than from any bound.
- THE decision about `runPicker` SHALL be recorded either way — bounded,
  or deliberately not bounded with the reason at its site.
- Verification: headless, the app suite.
