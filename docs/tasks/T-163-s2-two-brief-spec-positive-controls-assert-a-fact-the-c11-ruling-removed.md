---
id: T-163-s2
title: Two brief.spec.ts positive controls assert that some component carries two slugs — the C-11 ruling removed the last one, so both bodies red with their subject gone
feature: F-06
milestone: 4
priority: 1
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-163
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163's LANE AT `89af57a`, ROUTED RATHER THAN FIXED: T-163's
own card names tools/e2e as outside its fence in as many words, and
greening somebody else's positive control to make one's own change look
clean is the move that rule exists to prevent.** T-163's criterion 1
anticipated ONE such pin and told the lane to stop and record if it
reds. There are TWO, and they red for the same reason.

## What happened

@human's architecture ruling of 2026-08-30 took C-11's `touch_slugs:`
from `[app-shell, app-board]` to `[]`. **C-11 was the only component in
this registry carrying more than one slug** — derive at any ref with
`git grep -h '^touch_slugs:' docs/architecture/components/`; every other
line holds exactly one slug, or none for C-01. Two bodies in
`tools/e2e/tests/brief.spec.ts` assert that such a component EXISTS, as
positive controls guarding derivations that would otherwise be two empty
lists agreeing. The ruling's whole content is that it stops existing, so
no spelling of the ruling can keep those controls green.

Measured with `NPUTER_E2E_PORT=14733 npx playwright test
tests/brief.spec.ts` from tools/e2e/ at `89af57a` — **3 failed / 27
passed**. The third failure is a different finding and is filed as
`T-163-s1`. These are the two:

1. *"the LEDGER SAYS WHAT IT IS ANSWERING, and the slugs that are not
   independent are DERIVED"* —
   `expect(wanted.length, "no component is shared, so the join proves
   nothing here").toBeGreaterThan(0)`; Expected `> 0`, Received `0`.
2. *"FENCE DISJOINTNESS IS COMPUTED AS SETS THROUGH THE MAP, not as a
   string compare"* — `expect(slugB, "no two slugs share a component
   here, so this body has lost its subject …").toBeDefined()`; Received
   `undefined`.

**THE DERIVING HALVES ARE GREEN, WHICH IS THE PART THAT DECIDES THE
FIX.** In (1) the two-sided join — `slugsSharingComponents` against the
spec's own independent re-walk of the component files — agrees exactly,
at `[]` on both sides. Nothing about either derivation is broken. What
has gone is the live SUBJECT both bodies reach for.

## The shape of the fix, and the precedent for it

The same class arose inside T-163's own fence, in
`app/test/select-board.test.ts`'s describe *"a fence is compared over
EXPANDED components, never slug strings (T-111-s1)"*, where three bodies
drove themselves from the live registry through `app-board` against
`app-shell`. That lane re-derived them rather than deleting them, on one
rule worth copying here: **the live half states the ruled fact (and
gains the assertion that the pair now comes back empty), while the
MECHANISM moves onto a synthetic registry that still carries the shape —
one component, two slugs.** `withRoadmap` plus that file's `component()`
helper builds one in four lines. Result: `npx vitest run
test/select-board.test.ts`, **83 passed**, nothing loosened, every
moved assertion carrying its own positive control.

`brief.spec.ts` already has fixture machinery of its own (`context({…})`
takes an injected porcelain, and neighbouring bodies build synthetic
lanes), so the same treatment should be cheap. **Do not weaken the
controls to `>= 0`** — that is the deletion this file's own comments
argue against, and it would leave the join provable by two empty lists,
which is exactly what those two lines were put there to stop.

## Why priority 1

This is not a latent defect: it is RED at T-163's branch tip and will be
red on `main` the moment that lane merges, in a suite CI runs. It also
sits inside `T-162`'s live fence (`tools/e2e`) at the time of filing,
which triage may want to know when it decides whether this is absorbed
or dispatched — a fact with a shelf life of hours, so derive the lane
list rather than trusting this sentence.

DISCHARGED-NOT-DECLINED (2026-08-30, integration seat, the T-163 flip-set landing): the finding was real and the landing consumed it — performed in the merge window per the lanes-need-green-bases rule (a complement lane could not legally be cut from the red window this fix closes), with the executor's diagnosis on this card as the map and the select-board rewrite as the model. Every live half now states the ruled negative; every mechanism moved onto a synthetic registry carrying the shape. Evidence: the 2026-08-30-T-163 checkpoint record.
