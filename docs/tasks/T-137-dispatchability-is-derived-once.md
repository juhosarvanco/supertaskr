---
id: T-137
title: Dispatchability is derived once and consumed three ways — the board, the architect's own command, and the gate; today nothing tells a terminal session what to dispatch next
feature: F-02
milestone: 4
priority: 5
size: M
status: planned
blocked_by: [T-134]
touches: [lib-parser, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**@human's requirement, 2026-08-26**: `blocked_by` accurate **everywhere**,
and **especially for the architect session**, so it always has a precise
view of priority and execution order.

## The gap, verified rather than assumed

**Nothing answers *"what is dispatchable, in what order, given the live
lanes."*** Checked at `15a963d`: `tools/e2e/scripts/brief.mjs` is
`--task <T-NNN>` — it briefs **one** card. `T-111` builds the **board**,
which is an app surface **a terminal session cannot consume**.

**So the architect computes its dispatch order by hand.** It did so
repeatedly on 2026-08-25/26, with a shell loop, and got it wrong twice in
one command — a filename glob that matched a suggestion file instead of a
card, and a stale blocker set that hid four dispatchable cards.

## THE DUPLICATION ALREADY EXISTS ON MAIN, AND THE ARCHITECT MISSED IT

**Found by `T-134`'s lane, not by the architect who filed this card.**
`tools/e2e/scripts/dispatch-brief.mjs` — landed by `T-133` hours before —
**already carries `slugMapFromFields`, `expandFenceEntry`, `pathsOverlap`
and `fenceOverlaps`**: the same join off the same authoritative field.

**So the map is not duplicated; the FUNCTION is, and there are two on main
before this card starts.** The divergences all run one way — that copy
treats `ci` as a path and therefore disjoint from everything, does not
reject `docs/tasks/`, and has no own-file carve-out.

**This card's first act is therefore a MIGRATION, not a construction**,
and `T-134` routed it as R1 with a decision attached: `tools/e2e`'s own
manifest declares that the package *"imports neither app nor parser"*, so
pointing it at `@nputer/parser` reverses a recorded choice rather than
filling a gap. **Rule on that explicitly; do not just import.**

## The shape, and why it is one derivation rather than two

**A card is dispatchable iff**: its `status:` admits dispatch; **every
named blocker is `done`**; and **its fence is disjoint from every live
lane's**. The third term is why this cannot be a static query — the lane
list moves, and **`method/roles/executor.md` row 5 rules the live worktree
list authoritative over the board's `status:` whenever the two disagree.**

**All three consumers want the same fact**: the board renders it, the
architect orders by it, the gate asserts on part of it. **Two
implementations of one fact will disagree** (T-057) — and this project has
ruled that way more often than on anything else.

**THEREFORE THE DERIVATION LIVES IN THE SHARED MODEL**, importable by a
React view and by Node, not inside either. `T-111` is being told to route
its placement rather than build a board-local copy.

## Acceptance criteria

- **ONE DERIVATION, IMPORTED BY BOTH.** IF `T-111` has landed a board-local
  implementation by the time this runs THEN this card **moves** it and says
  what moved, rather than adding a second.
- **THE LANE TERM SHALL COME FROM THE LIVE WORKTREE LIST, FILTERED ON THE
  BRANCH, NEVER THE PATH.** Detached scratch worktrees sit at lane-shaped
  paths and have outnumbered real lanes better than two to one; at one
  point **eleven entries stood against three lanes, four of them detached
  checkouts of a single lane** — a path filter would have reported one lane
  as five.
- **FENCE DISJOINTNESS SHALL BE COMPUTED OVER EXPANDED PATH SETS, NOT
  TOKENS** — `T-134` is the mechanism and is this card's blocker.
  `T-111-s1` records the token-comparison defect from the other side.
- **THE ARCHITECT'S CONSUMER SHALL BE A COMMAND THAT WRITES NOTHING**,
  runnable from the integration checkout, emitting the dispatchable set in
  priority order **with each card's blocking reason named when it is not
  dispatchable** — that is the half `T-111`'s title calls *"and WHY the
  rest are not"*, owed to the terminal as much as to the screen.
- **EVERY EMITTED FIGURE SHALL CARRY THE REF IT WAS DERIVED AT**, and a
  live fact — the lane list — SHALL carry a timestamp and never a commit.
  `T-133` established both and its own rejection was for getting it wrong
  on three lines; **reuse its provenance machinery rather than restating
  it.**
- **THE GATE FROM `T-136` SHALL BE REWIRED TO THIS DERIVATION OR
  DELETED**, stated either way — a narrow staleness check surviving beside
  a general one is the second implementation this card exists to prevent.
- **A PIN SHALL DRIVE THE CASE THAT MOTIVATED IT**: a card whose blockers
  are all `done` must read dispatchable, and one whose fence collides with
  a live lane must not — **and the second SHALL fail against the pre-fix
  tree**, since nothing computes it today.

Verification: headless — `npx vitest run` from `lib/parser/` and
`npm test` from `tools/e2e/`, exits **unpiped from `$?`**, counts derived.
**POISON DRILL on every new assertion**, producer mutated and never the
assertion, restores proved per-path by sha256, detached worktree
**OUTSIDE the repository at a SHORT path**. **Uniqueness of kill SHALL be
measured against the whole suite.** **Build `lib/parser` before any app
suite.** Ask GRAPH REGEN rather than predicting and **ask again after any
write**. @human: none — the requirement is stated; this is its mechanism.
