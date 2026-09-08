---
id: T-219-s10
title: "The live-board census asks COMPARABLE and never ARMABLE — a planned card whose only token is its own file passes every parser body while `readDispatchOrder` (since T-219-s6) and `buildLaneFence` both refuse it"
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: verifier claude-fable-5-1@subagent @V-T-219-s6, data mutant D2 at e74c12c, 2026-09-09
blocked_by: []
touches: [lib/parser/test/fence.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-219-s6`'s second triage item made the two readers of a fence agree:
a card whose `touches:` reserves nothing once the own-file carve-out is
taken is `unfenceable` in `readDispatchOrder`, as `buildLaneFence` had
always refused to arm it. The LIVE-BOARD census does not know. Planted
at `e74c12c` in a detached scratch worktree — **derive again, never
quote**:

    docs/tasks/T-991-v-planted-own-file.md
      status: planned
      touches: [docs/tasks/T-991-v-planted-own-file.md]

`npx vitest run` from `lib/parser/`: **385 passed / 3 failed of 388 —
identical to the unplanted baseline** (the 3 are the T-274 trio
attributed at the base). No body moved. The reason is the predicate:
`T-219-s4: every ready card the DISPATCH oracle sees has a COMPARABLE
fence` filters `task.status !== 'planned' || task.touches.length === 0`
and flags `fence.unusable.length > 0` — and an own-file-only fence has
`unusable: []` and `paths: []`. It is comparable and it arms nothing.
`lanes.test.ts` carries no live-board body at all
(`grep -n 'parseProject(' lib/parser/test/lanes.test.ts` is empty), so
nothing runs `readDispatchOrder` over the real board.

Today it is structural: the three live cards whose only token is their
own file (`T-108`, `T-159-s1`, `T-160-s4`) are all `done`, and no
planned card carries the shape. The day one is filed it sits on the
board un-dispatchable with no suite saying so until `brief.mjs
--preflight` meets it — the filing-time gap `T-219-s8` names, one shape
over.

## What to build

- The `T-219-s4` census body (or a sibling beside it) SHALL also flag a
  planned card whose fence is comparable and reserves NOTHING —
  `fence.unusable.length === 0 && fence.paths.length > 0` is the
  startable term `rule()` now uses, and the census should ask the same
  question `T-057`-style, off `expandFence`'s answer.
- WITH the planted control first, run through the identical predicate
  over the identical loop and SEEN found, per `A NEGATIVE ASSERTION
  NEEDS A POSITIVE CONTROL`; the planted card above is the fixture, and
  it was seen NOT found at `e74c12c`.
- Headless.

## Read beside

`T-219-s6` (the triage's second item and `rule()`'s fifth term),
`T-219-s4` (the census body this extends), `T-219-s8` (the filing-time
gap), the V-T-219-s6 verdict on `T-219-s6`'s card (data mutant `D2`).
