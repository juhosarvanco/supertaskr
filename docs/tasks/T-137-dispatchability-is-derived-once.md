---
id: T-137
title: The architect cannot reach the analysis the app already has — waves, critical path and worst blocker are pure, one import from portable, and blind to the live lanes
feature: F-04
milestone: 4
priority: 4
size: M
status: building
blocked_by: [T-134]
touches: [lib-parser, app-map, tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human, 2026-08-26:** *"'what is dispatchable, in what order, given the
live lanes' — this is a core feature of our product. The architect session
needs precise knowledge of the technical roadmap, task list, task priority
and dispatch order, and it needs to be able to update and adapt as new
tasks are added, and to plan and generate new tasks as development moves
forward."*

## MOST OF THIS IS ALREADY BUILT, AND THE CARD IT REPLACED SAID OTHERWISE

**The first draft of this card claimed the derivation did not exist. It
does.** `app/src/architecture/task-waves.ts` — C-12, `app-map` — already
computes, and its own header says *"Everything here is PURE"*:

| it already has | export |
|---|---|
| dependency waves over `blocked_by` | `layerWaves` |
| **the critical path**, longest chain, CPM sense | `criticalPath` |
| how much each card holds up, transitively | `transitiveHolds` |
| **the worst blocker** | `worstBlocker` on the model |
| **whether a card is dispatchable** — `ready \| waits \| blocked \| underway` | `readSchedule` → `ScheduleState` |
| the sentences the pane renders | `criticalPathText`, `worstBlockerText`, **`readyNowText`** |

**`ready` IS "dispatchable", and `worstBlockerText` is the `WORST BLOCKER
T-065` @human saw in the app weeks ago.** F-06's ROADMAP entry already
claims this: *"the tasks lens lays the board's cards out in dependency
waves over `blocked_by`, with a critical path and a worst blocker — so
F-06 now answers 'what is holding the release'."*

**So this card is an EXTRACTION plus ONE new dimension plus a CONSUMER.
It is not a construction, and anyone who scopes it as one will rebuild
what exists.**

## Exactly what keeps it out of a terminal — measured, both of them

**ONE: a single app-local import, used on a single line.**

    task-waves.ts:2    import { rejectedVerdictCount } from "@/lib/verdicts";
    task-waves.ts:641  rejectedCount: rejectedVerdictCount(task.sections.verdicts),

Everything else it imports is `@nputer/parser/pure` — already the shared
model. **One function, one call site, is the whole of what pins a pure
module inside a React app.**

**TWO: it is blind to the live lanes.** `grep -cE "worktree|lane|fence|touches"`
over that file returns **0**. It answers *"what is unblocked"* and cannot
answer *"…and free to start right now"*, because the fence term does not
exist in it. **That half is genuinely new and is the reason this card
is not merely a file move.**

## Acceptance criteria

- **THE PURE ANALYSIS SHALL MOVE, NOT BE COPIED.** One implementation
  (T-057). The map pane SHALL import what it used to own, and this card
  SHALL state what its `import` line became. **IF `rejectedVerdictCount`
  cannot follow, THEN pass its result in rather than reaching for it** —
  a pure function does not import a lens.
- **THE LANE TERM SHALL BE ADDED AND SHALL BE THE ONLY NEW ANALYSIS.**
  A card is startable iff its schedule reads `ready` **and** its fence is
  disjoint from every live lane's. **Fence disjointness comes from
  `T-134`'s expansion over paths, which is why that card blocks this one**
  — token comparison answers this wrong on 25 live pairs.
- **THE LANE LIST SHALL COME FROM `git worktree list` FILTERED ON THE
  BRANCH, NEVER THE PATH**, and SHALL be a LIVE fact: timestamped, never
  stamped with a commit. `T-133` built that provenance machinery and was
  rejected once for getting it wrong on three lines — **reuse it rather
  than restating it.**
- **THE TERMINAL CONSUMER SHALL WRITE NOTHING** and SHALL emit, in
  priority order: what is startable now; what is merely unblocked but
  fenced, **naming the lane that holds it**; what is blocked, **naming the
  unmet blocker**; and the critical path and worst blocker as the pane
  already computes them. **"And WHY the rest are not" is owed to the
  terminal exactly as `T-111` owes it to the screen.**
- **`blocked_by` SHALL NOT BE TOUCHED, CLEARED OR "REPAIRED".** It is a
  DECLARATION and the app has always resolved it correctly.
  **`T-136` was rejected for proposing otherwise**, and the architect
  destroyed four accurate declarations acting on the same false premise
  before @human's question surfaced it. Dangling blockers measure zero.
- **THE ROADMAP DIMENSION SHALL BE REPORTED, NOT INVENTED.** `feature:`,
  `milestone:` and `priority:` are already on every card and already in
  the parser's model. **Surface them; do not derive a second notion of
  progress** — `docs/ROADMAP.md` is hand-written prose and this card does
  not make it generated.
- **ADAPTATION IS BY CONSTRUCTION, NOT BY A FEATURE.** Because every
  answer is derived at call time from the cards and the worktree list, a
  card added a minute ago is in the next answer with no bookkeeping.
  **State that as a property and pin it**: a fixture that gains a card
  changes the output with nothing else edited.
- **GENERATION IS OUT OF SCOPE AND SHALL BE SAID SO.** @human named
  planning and generating new tasks in the same breath; that is the
  architect's judgement, not a derivation. **What this card can honestly
  give it is the input** — what is startable, what is held and by whom.
  IF a mechanical gap-finder is wanted THEN route it as its own card.

Verification: headless — `npx vitest run` from `lib/parser/`, `npm test`
from `app/`, `npm test` from `tools/e2e/`, exits **unpiped from `$?`**,
counts derived (Playwright prints `Running N tests`; cross-check it).
**The map pane must keep working** — the extraction's whole risk is a
silent behaviour change in C-12, so its existing bodies are the control
and SHALL be run and stated. **POISON DRILL on every new assertion**,
producer mutated and never the assertion, restores per-path by sha256,
detached worktree **OUTSIDE the repository at a SHORT path**. **Uniqueness
of kill SHALL be measured against the whole suite.** **Build `lib/parser`
before any app suite.** Ask GRAPH REGEN rather than predicting and **ask
again after any write** — this card moves a file between packages, so the
graph will move. **Ports are machine-wide while rule 4 partitions by
CHECKOUT (`T-132-s6`)** — explicit port, re-probed before binding.
@human: none — the requirement is stated; this is its mechanism.
