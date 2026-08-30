---
id: T-163-s3
title: The C-11 ruling's last live copy is a sentence in docs/CONVENTIONS.md that still says C-11 carries two slugs — the suite halves are discharged, the governing doc was outside every fence that fixed them
feature: F-06
milestone: 4
priority: 18
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-163
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163's LANE AT `89af57a`, ROUTED RATHER THAN FIXED:
`lib/parser` is outside T-163's fence** (asked of `decide` in
`.claude/hooks/lane-fence.mjs`, which answers
`block / outside-the-fence` for `lib/parser/test/fence.test.ts`).
**CORROBORATES `T-163-s2` RATHER THAN DUPLICATING IT** — same cause,
different package, therefore a different fence and its own card.

## The cause, once

@human's architecture ruling of 2026-08-30 took C-11's `touch_slugs:`
from `[app-shell, app-board]` to `[]`. C-11 was the ONLY component in
the registry carrying more than one slug (derive:
`git grep -h '^touch_slugs:' docs/architecture/components/`). Bodies
that reach into the LIVE registry for a doubly-claimed component
therefore lose their subject, whatever spelling carries the ruling.

## The two bodies, measured

`npx vitest run` from lib/parser/ at `cec6cde` — **2 failed / 313
passed, 1 failed file of 15, exit 1**. The smoke test over the live
docs/ tree is GREEN, so this is not a parse problem.

1. `test/fence.test.ts`, describe *"slugPathIndex — the map is READ from
   touch_slugs:, never built"*, body *"C-11 carries two slugs, so
   app-board and app-shell share its paths"* —
   `expect(doubleClaimed.map((c) => c.id)).toEqual(['C-11'])`, Received
   `[]`. The body then asserts `c11.touchSlugs` equals
   `['app-shell', 'app-board']`, which is the field the ruling changed.
   **The whole body is about the fact that was ruled away.**
2. `test/fence.test.ts`, describe *"THE TWO PINS THE CARD ASKS FOR, each
   measured against BEFORE"*, body *"PIN TWO (a): two live planned cards
   whose slugs differ and whose paths meet at C-11"* —
   `expect(seen.verdict).toBe('overlapping')`, Received `'disjoint'`.
   It drives T-112 `[app-dispatch, app-board]` against T-114
   `[app-shell]` and expects witnesses
   `['app/src/assets', 'app/src/styles']` via `app-board|app-shell`.
   **That pair is exactly what the ruling makes disjoint** — the
   `disjoint` it now returns is the ruling working, not the comparator
   failing.

Note what body 2 is FOR: it is the pin proving `compareFences` catches
an overlap that `tokenEquality` misses. That property is untouched and
still worth pinning; only its live instance is gone. Its sibling
*"PIN TWO (b)"* — T-128 against T-134, containment through
`method/` — is GREEN and unaffected, and is the model for what a
surviving live instance looks like.

## The shape of the fix

The same treatment T-163 applied inside its own fence to
`app/test/select-board.test.ts`'s three equivalent bodies: **state the
ruled fact on the live half (including the assertion that the pair now
comes back disjoint, so the ruling is pinned rather than merely
tolerated), and move the MECHANISM onto a synthetic registry that still
carries the shape — one component, two slugs.** That file already builds
synthetic cards (`synthetic('T-907', […])`) and has a `components`
fixture to extend, so the cost is small. Result there: 83 passed,
nothing loosened, every moved assertion keeping a positive control.

**Do not delete body 1 outright.** Its subject — *is there a
doubly-claimed component in this registry?* — is now a NEGATIVE worth
asserting: after this ruling, `components.filter((c) =>
c.touchSlugs.length > 1)` being empty is a property somebody could
silently undo, and a body asserting it empty is how the ruling stays
ruled.

## A standing gotcha this uncovers, for whoever can reach CONVENTIONS

CONVENTIONS' **DECLARING A COMPONENT** gotcha says declaring a component
moves THREE live-registry fixtures (`lib/parser/test/smoke.test.ts`,
`app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx`). **MOVING A `touch_slugs:` FIELD
IS A DIFFERENT EDIT AND MOVES A DIFFERENT SET, AND NOTHING SAYS SO.**
Measured at T-163, which moved exactly one field: the three fixtures
that gotcha names were ALL GREEN and needed nothing, while four other
places moved —

    lib/parser/test/fence.test.ts        (2 bodies, this card)
    app/test/select-board.test.ts        (3 bodies, fixed in T-163's lane)
    tools/e2e/tests/brief.spec.ts        (3 bodies, T-163-s1 + T-163-s2)
    docs/ARCHITECTURE.md                 (the prose slug block, T-163-s1)

— in three packages plus a governing doc, and no single card fence in
this repo's vocabulary reaches all four. That belongs beside the
DECLARING A COMPONENT gotcha, derived rather than transcribed if
somebody can see how; T-163's fence could not reach
`docs/CONVENTIONS.md` either.

DISCHARGED-NOT-DECLINED (2026-08-30, integration seat, the T-163 flip-set landing): the finding was real and the landing consumed it — performed in the merge window per the lanes-need-green-bases rule (a complement lane could not legally be cut from the red window this fix closes), with the executor's diagnosis on this card as the map and the select-board rewrite as the model. Every live half now states the ruled negative; every mechanism moved onto a synthetic registry carrying the shape. Evidence: the 2026-08-30-T-163 checkpoint record.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 18 — RETITLED AND REFENCED ONTO THE HALF THE DISCHARGE COULD NOT REACH

**THE FILED HALF IS VERIFIED DISCHARGED, at the sitting rather than on
the stamp's word.** Re-derived at `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`:
the fence suite's live body now reads *"no component carries two slugs —
the T-163 ruling stays ruled, and the shared-path mechanism holds
synthetically"* and asserts the doubly-claimed set is empty; the brief
spec carries the same treatment in two places, each with a synthetic
registry keeping the shape. Nothing about the two `lib/parser` bodies is
owed.

**AND THE HALF THIS CARD ITSELF WARNED ABOUT IS THE ONE LEFT STANDING.**
Its closing section said, in as many words, *"T-163's fence could not
reach docs/CONVENTIONS.md either"* — and that is exactly where the
ruling's last live copy is. Two things there, found by this sitting's
own sweep and derived rather than argued:

**One — a live false sentence.** The SHIPPED PARTITION bullet closes
with *"`non_code:` IS A DIFFERENT AXIS AND IS NEVER SUBSTITUTED: C-11 is
`non_code: true`, carries two slugs, and ships."* Derive the component's
own field with

    grep -h '^touch_slugs:' docs/architecture/components/C-11-design-tokens.md

and it answers the empty list. `non_code: true` still holds and so does
"ships"; the middle clause is false, and it is the clause the example
rests on. **What the repair has to decide, and it is not a find-and-
replace**: the bullet's first clause makes a registry SLUG the test for
shipped, and C-11 now claims none — so a tokens change enters a lane by
its own bare path and the example has to say what carries "ships" once
the slug is gone. That reasoning is this card's ask, not its answer;
whoever takes it derives it rather than adopting this paragraph.

**Two — the missing gotcha this card already wrote.** The DECLARING A
COMPONENT bullet names three live-registry fixtures. Moving a
`touch_slugs:` field is a different edit that moves a different set, and
nothing says so — T-163 moved exactly one field, found all three of that
bullet's fixtures green and needing nothing, and moved four other places
in three packages plus a governing doc. The list is in this card's own
body above, measured at that lane.

## Acceptance criteria

- THE stale clause SHALL be repaired against the component's own field
  DERIVED at the lane's ref, not against this card — the field is
  authoritative and this body is a stamp.
- THE repaired example SHALL still make the bullet's point, which is
  that `non_code:` is a different axis from shipped-ness. IF the ruling
  has cost the bullet its example THEN the lane SHALL say so and pick
  one that survives, rather than leaving a sentence that is true and
  illustrates nothing.
- THE bullet naming the fixtures a component DECLARATION moves SHALL
  also say that moving a `touch_slugs:` field moves a DIFFERENT set, and
  SHALL name that set by derivation where a derivation exists rather
  than transcribing the list this card measured — a transcribed set goes
  stale exactly the way the clause above did.
- THE lane SHALL re-derive, before writing, whether any other clause in
  the file still assumes a doubly-claimed component, and record the
  answer even when it is none — a negative sweep recorded is worth more
  than a sweep nobody can tell happened.
- THE lane SHALL NOT edit any component file, spec or suite. Those halves
  are discharged, stated above with what discharged them; this card is
  the governing document and nothing else.
- Verification: headless. The suites that read this document run green
  at the lane's ref, and the DOCS GATE's owed set is derived rather than
  assumed.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
