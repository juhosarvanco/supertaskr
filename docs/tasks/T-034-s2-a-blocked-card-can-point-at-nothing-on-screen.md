---
id: T-034-s2
title: A blocked card can point at nothing on screen — parked and suggested blockers are invisible on the lens
status: suggested
suggested_by: executor claude-opus-5 @T-034
---

The tasks lens draws exactly the population the BOARD draws as real
cards: everything except `suggested` and `parked`. That decision is
deliberate and recorded in T-034's notes — the board makes the same cut,
suggestions mostly have no id (so they cannot be a `blocked_by` target),
and 31 open suggestion files would double the canvas.

The cost is a small explainability hole, and it is exercised by
T-034's own DOM fixture:

    T-050  "Parked until the world moves"   status: parked   (NOT drawn)
    T-051  "Behind a parked one"            blocked_by: [T-050]

`T-051` renders as the dashed terracotta **blocked** ghost — correctly,
because a parked blocker is neither done nor in flight — but there is
**no edge and no node** anywhere on the canvas explaining why. The card
says "blocked" and the picture says "by nothing".

The same shape applies to a DANGLING `blocked_by` (an id no task
declares). The parser already flags that as a `dangling-reference`
issue, so it is at least named somewhere; a parked blocker is not an
issue at all, so nothing names it.

On this repo's live tree the hole is currently EMPTY — every one of the
27 drawn edges resolves to a drawn task, and no real task is blocked by
a parked one — so this is a trap, not a defect.

Three ways to close it, cheapest first:

1. **Say it on the card.** `blocked` becomes `blocked by T-050 (parked)`
   when every unmet blocker is undrawn. One string, no layout change,
   and the panel already carries the full `blocked_by` list.
2. **Draw undrawn blockers as ghost stubs** — an id-only chip at the
   left edge of the card's wave, no box. Honest picture; new undesigned
   furniture.
3. **Draw parked tasks as real cards** with the board's collapsed-row
   treatment. Most faithful to "nothing is ever dropped"; adds nine
   isolated wave-0 cards to this repo and makes T-034-s1 worse.

Option 1 is the one that costs nothing and removes the whole class.
