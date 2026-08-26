---
id: T-111-s7
title: task-waves.ts's readSchedule is a SECOND derivation of whether a blocker still binds, and it folds a dangling blocker into "blocked" — the exact fold T-111-s4 says not to make
status: suggested
suggested_by: executor claude-opus-5 @T-111
touches: [app-map]
---

**T-111 did not create this divergence and could not repair it.**
`app/src/architecture/task-waves.ts` is C-12's — slug `app-map` — and
T-111's fence is `[app-board, app-shell]`. Recorded and routed, per
`roles/executor.md`.

## The two derivations

    app/src/architecture/task-waves.ts   readSchedule(status, blockedBy, statusOf, self)
    app/src/lib/board-model.ts           selectDispositions(model, dispatch, topmost?)

Both answer *"does this card's `blocked_by` still bind?"* and both answer
it by asking each blocker's own status rather than trusting the field —
so **the good news first: the map's tasks lens has been deriving this
correctly all along**, and a card blocked by a landed card has read
`ready` on the map for as long as `readSchedule` has existed.

**THAT IS THE THIRD SURFACE IN THIS APP THAT ALREADY RESOLVES THE IDS**,
after `task-detail.ts`'s `BlockerLink` and now `board-model.ts`'s
`UnmetBlocker` — which is `T-136`'s rejection restated as an inventory:
the failure that card was filed against lived in a hand-written shell
query, never in a rendering surface and never in the data.

**They agree on the rule and disagree on the vocabulary**, in three places:

1. **`missing` is FOLDED.** `readSchedule`'s own header states it: *"A
   dangling reference is treated as unmet AND not in flight: nothing can
   be said about when it lands, so the honest reading is `blocked`, never
   `ready`."* The disposition is right and the WORD hides which of two
   very different things happened. `T-111-s4`'s trap paragraph is about
   exactly this: *"A card blocked by a card that does not exist is a
   different state from one blocked by a card still open… Do not fold the
   three into 'blocked' — a dangling blocker is a defect in the card, not
   a reason to wait, and the board should say which it is."*
   `selectDispositions` carries `binding: "open" | "missing" | "parked"`
   and a clause per binding.
2. **`parked` is not a binding of its own** in `readSchedule` — a parked
   blocker lands in the same bucket as an open one, so a wait with no
   scheduled end reads like a wait with one.
3. **`waits` versus `blocked`** is `readSchedule`'s OWN distinction and
   the frontier has no equivalent: it splits on whether every unmet
   blocker is in flight, which is a genuinely useful thing the frontier
   does not say. **The merge should keep it**, not discard it.

## Why this is a real T-057 exposure and not tidiness

The two live in different components and answer for different surfaces, so
today nothing forces them to agree. **The rule they share is one
sentence** — *a blocker is met when its card is `done`* — and it is
written twice. `merging` is the near-miss: both treat it as unmet today,
and one edit to either makes the map and the board disagree about whether
a card is dispatchable, with no test in the repository able to see it.

## The shape, and its order relative to `T-111-s5`

**`T-111-s5` moves the frontier to `lib-parser`. This card should land
AFTER it, and then it is a deletion rather than a refactor**: `readSchedule`
keeps its `waits`/`underway` vocabulary and consumes the shared
`UnmetBlocker[]` for the binding half, so the "is it met" sentence exists
once. Taken before the move it would only relocate the duplicate.

Fence `[app-map]`, plus whatever `T-111-s5` settles. **`map-task-waves.test.ts`
pins `readSchedule` today, so the merge has a suite waiting for it** —
which is more than the frontier had before this card.
