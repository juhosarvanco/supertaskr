---
id: T-163-s3
title: lib/parser's fence suite pins C-11's double claim as a live fact in two bodies, and the C-11 ruling reds both
feature: F-06
milestone: 4
priority: 1
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-163
blocked_by: []
touches: [lib/parser]
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
