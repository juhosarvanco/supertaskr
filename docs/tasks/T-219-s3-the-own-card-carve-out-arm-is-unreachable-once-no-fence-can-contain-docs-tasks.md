---
id: T-219-s3
title: "T-219 made `carveOutFor`'s own-card arm unreachable for every possible manifest — the exact defect its own header was ordered first to avoid, and the ordering argument is now false"
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**Guard-class, and found by the card that caused it.** `T-219` made
`expandFence` refuse any token whose domain CONTAINS `docs/tasks`. That
is correct and is not in question here. Its side effect is that
`carveOutFor`'s FIRST arm — the one answering for a lane's own card file
— can no longer be selected by any write, which is precisely the
condition that arm was ordered first to avoid.

## The header's own argument, now false

`carveOutFor` in `.claude/hooks/lane-fence.mjs` carries it:

> THE OWN-FILE TEST COMES FIRST THOUGH `docs/tasks` WOULD CATCH IT
> ANYWAY … Every card lives under the unfenceable directory, so ordered
> the other way this branch would answer for nothing that reaches it —
> **an arm no write can select is an arm no mutation can kill**, and the
> ruling names it as a criterion in its own right.

The ordering is still right. What moved is underneath it: **the arm is
now unreachable in BOTH orders.**

## Why, in two steps that compose

The lane-less seat consults `carveOutFor` only for a path some live
lane's manifest RESERVES (`manifest.paths`). So the own-card arm needs a
manifest whose `paths` contains a card file.

1. **A card file enters `paths` only through a domain containing
   `docs/tasks`** — and `T-219` refuses every such token.
2. **`expandFence` moves a card's OWN file out of `paths` into
   `excluded`** regardless, so even a card naming its own file by name
   does not reserve it.

`carveOutFor`'s first arm reads `manifest.excluded`, and the seat never
reaches `carveOutFor` for those paths. The two facts compose to: **no
manifest can select that arm.** Inside the LANE the same write is
answered by `always-writable` before any carve-out is consulted, so the
arm is dead there too.

## Measured at `T-219`'s lane tip

Through the real hook against the real fixture, with a lane fencing
`[tools/e2e, <its own card>, <another card>, docs/STATE.md,
docs/checkpoints, docs/ROADMAP.md]`:

    the lane's OWN card, asked from the seat   -> allow, code `not-a-lane`
    ANOTHER card under docs/tasks, same seat   -> allow, code `protocol-carve-out`
                                                  ("no card may fence it")

The second arm survives **only because a lane may still fence another
card BY NAME**, which is the spelling rule 5 prescribes in the same
breath as the refusal. The first has no such escape: a lane's own file
is carved out of its own fence by construction.

`tools/e2e/tests/lane-fence.spec.ts`'s *the carve-outs each free a
DIFFERENT write* now asserts `not-a-lane` for that write, with the
reason on the assertion, **so this card landing will red that body by
name** — which is the intended tripwire and not a conflict.

## What to build

- DECIDE, and record the decision rather than only the code: either the
  arm is REMOVED (the hook's own rule — *an allow no mutation can kill
  is an allow no test can prove, so it is gone rather than left inert* —
  which is what it did to the `../` allow), or it is made REACHABLE by
  consulting `carveOutFor` for a path no lane reserves.
- WHICHEVER IS CHOSEN, the header's ordering paragraph SHALL be rewritten:
  it argues from a premise (`docs/tasks` would catch it anyway, so order
  matters) that T-219 retired.
- IF the arm is removed THEN `tools/e2e/tests/lane-fence.spec.ts`'s
  `not-a-lane` assertion becomes the permanent pin and its comment
  pointing here SHALL be updated; IF it is made reachable THEN that
  assertion SHALL move back to `protocol-carve-out` and a body SHALL
  prove the arm is selected by a write that exists.
- A POSITIVE CONTROL SHALL show the chosen arrangement failing under a
  mutant, since a dead arm and a working one are indistinguishable from
  a green suite — which is how this survived to be found by a card about
  something else.
- Verification: headless.

## Read beside

`T-219` (the refusal that caused this, and where it was measured),
`T-154-s2` (the seat-side carve-outs and @human's ruling of 2026-08-30),
`method/lane-protocol.md` rule 5.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 2, at T-219's merge (64fed70)

The architect seat. Guard-class, filed by the lane that caused it: the
own-card carve-out arm of `carveOutFor` can no longer be selected by any
manifest, so the header's "an arm no write can select is an arm no
mutation can kill" now describes its own first arm. Blocker cleared —
T-219 is done. Criteria: the hook SHALL either remove the unreachable
arm with its header rewritten to say why, or make it reachable by a
manifest shape the parser can still produce, and in either case a body
SHALL red under a mutant of whichever arm remains; the write that used
to select it (a lane writing its own card) SHALL still be allowed, with
the reason on the assertion.
