---
id: T-219-s4
title: "`readDispatchOrder` calls a fence with UNRESOLVABLE tokens startable whenever no lane is live — the residual of V-T-219's finding, one criterion away from the empty-`touches:` case it shares a site with"
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**Class parent: `T-219`**, and specifically V-T-219's rejection — *"`rule()`
reaches `compareFences` only through `holds`, and `holds` is empty when
the lane list is."* That verdict was about a card declaring NO
`touches:`, and T-219's fix pass closed exactly that. **The same sentence
is true of a fence whose tokens cannot be RESOLVED**, and that half was
measured, left, and filed here rather than taken, because it is a
different criterion and it moves another card's dispatchability.

## Measured at T-219's fix-pass tip

Over the live board through the built parser, with **no lanes handed in**
— the canonical dispatch moment:

    startable with NO lanes                                114
    would move under the criterion T-219 closed (tokens 0)   0
    would move under this one (unusable > 0)                 1
      T-164-s1  [planned]  unusable=["bin"]

`bin/` exists on disk and no component claims it, so `expandFence`
resolves it oracle-less to `unresolved` — which
`lib/parser/test/fence.test.ts`'s census body already records as a
standing, structural state rather than a defect of that card.

## Why it is the same defect

`lanes.ts` closes its own `unfenceable` sentence with *"A fence that
cannot be COMPUTED is not a fence that is free."* A fence carrying an
unresolvable token cannot be computed — that is what `unusable` MEANS,
and `compareFences` answers `unusable` for it the moment any lane is
live. With no lane live there is no comparison, so the card falls
through `holds.length === 0` and is reported startable, **while
`buildLaneFence` would refuse to arm it outright** (`fence.unusable.length
> 0` throws before anything else). Two halves disagreeing in the safe
direction by luck rather than by rule — which is the sentence T-227 was
filed about and T-219 exists to end.

## Why it was NOT taken in T-219's fix pass

- The verdict named ONE finding and said the rest was tested and holds.
  Widening a fix pass past its verdict spends a verification nobody gave.
- It changes what `brief.mjs --dispatch` reports can START for a card
  that is not this one's subject. That is a board-visible change and
  deserves its own dispatch, not a rider.

## What to build

- `rule()`'s `holds.length === 0` guard SHALL also require the fence to
  be COMPARABLE, not merely declared — the term beside the existing
  `fence.tokens.length > 0`.
- The `unfenceable` clause list SHALL gain a cause naming the
  unresolvable tokens, so the reason says which token and not merely
  that something was wrong; the existing `tokens.length > 0` clause for
  the hold path is the shape to reuse.
- A body SHALL hand in NO lane and prove a card with an unresolvable
  token is not startable, WITH the control that a card whose tokens all
  resolve still is — the pair T-219's own no-lane body uses.
- THE LIVE-BOARD EFFECT SHALL BE STATED in the notes at the ref it was
  measured at, because this moves a real card: derive it, never quote
  this card's figure.
- Verification: headless.

## Read beside

`T-219` and its `## VERDICT` (the rejection this is the residual of),
`T-227` (the two-halves-disagree shape), `T-164-s1` (the card the change
moves), `lib/parser/src/lanes.ts`'s `rule()`.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at T-219's merge (64fed70)

The architect seat. The residual of V-T-219's own finding, one
criterion over: a fence whose tokens cannot be RESOLVED is startable
when no lane is live, and the wider `unusable.length > 0` remedy was
measured to move T-164-s1 (planned, `touches: [bin]`) from startable to
unfenceable — so the card SHALL decide that case on the record (a
planned card whose only token resolves to nothing is not dispatchable,
and says why), not in passing. One lane with the sibling below.

## Absorbs: T-219-s2 (2026-09-02)

A bare dot token normalises to `.` and expands to a domain no
repository-relative path can match — the fence permits nothing,
collides with nothing and reports no issue. The same module, the same
class (`expandFence` answering confidently where it should refuse): a
third refusal, with its own body and a live-board census printed with
its control.
