---
id: T-143-s2
title: The fence ledger and the contention deriver join on slug NAMES while a fence is a REGION, so a lane declaring a contained PATH leaves the slug reading FREE
feature: F-06
milestone: 4
priority: 3
size: M
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-143
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED WITH THE MEASUREMENT, NOT WITH THE ARGUMENT.** T-143 closed the
unreadable-card cause of FREE-when-held and disclosed this one in its
own Implementation notes as the honest omission. This card carries the
census and the two-halves-disagree reproduction so the next seat starts
from data rather than from `C-11`.

## What is still true after T-143

`fenceLedger` and `card-figures.mjs`'s `contention` both join a lane's
`touches:` TOKEN to a slug NAME by string identity. Neither calls
`expandFence`. `lib/parser/src/fence.ts` already implements the right
rule — `sharedDomain` makes containment overlap, and `expandFence`
resolves a slug to the union of its components' `paths:` — and the
`--task` half of the same command spends it.

**So the two halves of one command disagree about one set of files.**
Reproduced by T-143's verifier at `14075ac2ddd6`, with a live lane on
`T-159-s4` whose card is perfectly READABLE (no blindness anywhere in
the fixture):

    --state ledger        ->  app-interview: FREE
    --task fenceOverlaps  ->  OVERLAP — T-159-s4
                              app/src/genesis/genesis-derive.ts against
                              T-027 app-interview, both reserve
                              app/src/genesis/genesis-derive.ts and
                              app/src/genesis/**

`C-13` declares `paths: [app/src/genesis/**, …]` and
`touch_slugs: [app-interview]`; the lane's token sits INSIDE that
region; the ledger's key is a name, so it sees nothing.

## The live magnitude, derived rather than guessed

Censused over the whole board at `14075ac2ddd6` — 321 cards, 15
components, 8 slugs: **63 distinct `touches:` tokens, 55 of them not a
slug name, and 2 of those 55 overlap a slug's region by containment.**
Both belong to `T-159-s4` and both hit `app-interview`. So the hole is
SMALL today and it is not zero, and the size is a property of what the
board happens to declare this week rather than of the join.

## Why it was not taken inside T-143

Criterion 1 and criterion 2 of that card both open with a WHEN clause
about a card that CANNOT BE READ, and this instance has nothing
unreadable in it. Criterion 3 offers two arms and the lane took both.
The verifier ruled the criterion MET and routed the join rather than
widening the card from inside its own fence.

## What a fix would have to decide, and it is not obvious

1. **Does the ledger stay keyed by slug?** A region join could instead
   key by the DOMAIN both sides reserve, which is what
   `sharedDomain` already returns — closer to the card's own fix sketch
   item 2, *"emit verdicts, not availability"*.
2. **What does a path-only lane's row look like?** Today
   `app/src/genesis/genesis-derive.ts` gets its OWN row because
   `holders` keys on the raw token. A region join has to decide whether
   that row survives, folds into `app-interview`, or both.
3. **`contention` is the same join one file over** and moves with it, or
   the two implementations diverge — which is the `T-057` shape this
   card's parent spent its whole lane on.
4. **The pins are producer-side and cheap**: the T-143 bodies already
   build porcelain fixtures with readable and unreadable lanes; a region
   arm needs a lane whose token is CONTAINED by a slug's region and a
   positive control where it is not.

## Corroboration rather than duplication

This is the fifth instance of containment-is-overlap being the proximate
cause in this project (`method/lane-protocol.md` rule 5, `T-085`,
`T-111`'s eleven-token containment family, `T-138`'s *"Name the file"*,
`T-137`'s three `method/` cards against `T-135`, and T-143's own night).
It is NOT a new class — it is the one class this repository keeps
meeting, arriving in a join that had not been taught it yet.
