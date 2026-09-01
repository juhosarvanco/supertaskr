---
id: T-185-s1
title: The two dispatch shapes still agree only in prose — holding them equal BY CONSTRUCTION needs one body importing C-15 and C-17
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
suggested_by: executor claude-opus-5@subagent @T-185 (2026-08-31) — routed from inside the lane rather than widening its fence
touches: [app-dispatch, app-board, docs/architecture/components/C-15-dispatch.md, app/test/architecture-dogfood.test.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**CLASS PARENT: `T-185`, and this is its fourth acceptance criterion's
second half.** `T-190` (done) priced C-15's missing test path and
`T-198` (done) crossed it, so neither owns this; `C-15-dispatch.md`'s own
closing section states the residual in as many words and names T-185 as
the card that would take it. Filed as a sibling rather than as a
corroboration because the remaining work is a REGISTRY decision, not a
second sighting of a defect.

**DISPOSITION HINT:** promote behind an architect's ruling on whether
C-15 may declare `depends_on: [C-17]` for a test-only edge — the answer
decides the card, and no lane may decide it.

## What T-185 built, and the exact half it could not

`T-185` grew `DispatchReading` the two fields its producer's own doc
comments forbid dropping, and met the criterion's first clause: the
comment at `app/test/select-board.test.ts` that asserted the two types
were one shape is gone, replaced by the LIMIT rather than a louder claim.

What it could not build is the criterion's second clause — *"if an
equivalence is load-bearing, a body SHALL hold it by CONSTRUCTING one
from the other rather than by describing it."* A body that constructs a
`DispatchJoin` through `hydrateJoin` and hands it to `selectDispositions`
has to import **both** `app/src/lib/dispatch-store.ts` (C-15) and
`app/src/lib/board-model.ts` (C-17), in either direction, and every
direction is a cross-component edge the registry does not carry:

    C-15 depends_on: [C-10]        <- no C-17
    C-17 depends_on: [C-06, C-16]  <- no C-15

Derive it, do not trust this block:

    command grep -n '^depends_on:' docs/architecture/components/C-15-dispatch.md \
      docs/architecture/components/C-17-board-model.md

## Why the lane refused rather than performed it

`[app-board, app-dispatch]` expands to twenty paths, all under `app/`.
It reaches `app/test/dispatch-store.test.ts` — the file the import
belongs in — and reaches **neither** of the two files that would have to
move with it: `docs/architecture/components/C-15-dispatch.md`'s
`depends_on:` line, and `app/test/architecture-dogfood.test.ts`, which
is **C-12's** (`app-map`) and is the one place a drift census is
asserted. `C-15-dispatch.md` already rules the call: the import
*"is a cross-component edge C-15 does not declare and therefore an
architecture decision no lane may make on its own."*

## What this card needs, exactly

1. A ruling on the DIRECTION. C-15 -> C-17 puts the pin in C-15's own
   test file, which is where `T-198` put the wire-side bodies and where
   `C-15-dispatch.md` says it belongs. C-17 -> C-15 would make the board
   model depend on the mirror, which both modules' headers refuse in
   writing for a type alias — that refusal is about PRODUCTION code and
   this would be a test edge, which is exactly the distinction the ruling
   has to draw.
2. `touches:` reaching all four paths above, so the registry line, the
   dogfood fixture and the body land in ONE commit.
3. The body itself: build a `DispatchJoinWire` with a populated
   `notLanes` and `truncated: true`, run it through `hydrateJoin`, and
   assign the result to a `DispatchReading` — the assignment IS the
   assertion, and a field dropped on either side stops compiling.

## Read beside

`T-198` (the crossing that made C-15 collected, and the drill ledger
this card's body would extend), `T-190` (the wall it priced), and
`C-15-dispatch.md`'s own closing section, which is this card's spec.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**RULED: the edge is C-15 → C-17**, declared in C-15's registry entry as
a TEST-ONLY dependency with the reason beside it — the dispatch reading
is asserted against the board model; production `dispatch-store.ts`
imports nothing from C-17. The lane runs `arch cycles` and reconciles
`cargo test`'s exact-set census and the dogfood fixture in the same
commit; IF `arch cycles` names a cycle THEN the lane stops and routes.
The fence already reaches all four paths. `review: independent` set.
