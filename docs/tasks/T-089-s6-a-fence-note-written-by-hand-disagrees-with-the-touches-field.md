---
id: T-089-s6
title: Two hand-written fence claims disagree with the touches field a program would read — one card's criteria exceed its own fence, and one card's fence note misses a declared overlap
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

F-04 exists because dispatch hygiene is done by eye. Two live instances,
both found while T-089 was checking its own fence, and they fail in
OPPOSITE directions — which is why one rule does not catch both.

## One: a card whose criteria reach outside its declared fence

`T-087` declares `touches: [app-shell]`. Its acceptance criteria include
*"CONVENTIONS SHALL gain the ambient-declaration gotcha"*, and its body
adds *"The DOCS GATE fires on the CONVENTIONS edit — run what it owes."*
So the card requires an edit to `docs/CONVENTIONS.md` while declaring a
fence that does not include it.

The orchestrator's overlap check reads `touches:` (TASK-FORMAT,
parallelism guardrails), so T-087 and T-089 look disjoint to it and are
not. Dispatched together, whichever lands second either conflicts on
CONVENTIONS or has its edit silently dropped by a resolution nobody
reviewed. **The failure is not the executor's**: it would be obeying its
criteria.

## Two: a fence note that is right about the risk and wrong about the set

`T-089`'s own body carries `FENCE NOTE: cannot run beside T-052 or T-087
(both reach method/ or CONVENTIONS)`. Derived at `4d2f03c`:

- `T-052` — `touches: [method/, docs/CONVENTIONS.md]`. Correct, and
  DECLARED.
- `T-087` — `touches: [app-shell]`. The note is right about the risk and
  the reason ("reaches CONVENTIONS") and could not have got there from
  `touches:`; it is a hand observation about the card's BODY.
- `T-086` — `touches: [docs/CONVENTIONS.md]`, unblocked, promoted in the
  same triage batch as T-087. A DECLARED overlap with T-089, and the note
  does not mention it. Its whole subject is a sentence in
  `docs/CONVENTIONS.md`, so the collision is certain rather than
  possible.

So the hand-written note caught the undeclared collision and missed the
declared one, which is the exact inversion of what the field is for.

## What follows for F-04

The frontier reader must derive overlap from `touches:` — that part is
already the plan. The two instances say two more things:

1. **A derived frontier would have caught T-086 and missed T-087.** So
   the frontier's answer needs to be stated as *"disjoint by the declared
   fences"*, never as *"safe"*.
2. **`touches:` needs a check of its own**: a card whose acceptance
   criteria name a path outside its own fence is a defect the architect
   can fix before dispatch, and it is mechanically findable — the
   criteria are text and the fence is a list. That is a cheap lint over
   `docs/tasks/*.md` and it belongs beside the frontier, not inside it.

Immediate, whatever F-04 does: **`T-087`'s `touches:` should gain
`docs/CONVENTIONS.md`** before it is dispatched, and `T-089`'s fence note
should have named `T-086`. Neither is an executor's edit to make.
