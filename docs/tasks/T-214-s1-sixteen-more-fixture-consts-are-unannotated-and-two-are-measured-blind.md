---
id: T-214-s1
title: Sixteen more structural-literal fixtures are bound to unannotated consts before reaching a typed parameter, and two of them are measured blind to a planted stale key
feature: F-04
milestone: 4
size: M
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-214 (2026-09-02)
blocked_by: []
touches: [app/test/watcher-store.test.ts, app/test/startup-recovery.test.ts, app/test/interview-model.test.ts, app/test/interview-chat-dom.test.tsx, app/test/interview-resume-dom.test.tsx, app/test/project-shell.test.tsx, app/test/architecture-derive.test.ts, app/test/map-search.test.ts, app/src/lib/dispatch-store.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-214`** — a structural-literal fixture bound to an
unannotated `const` is a REFERENCE by the time it reaches a typed prop or
a typed parameter, never a fresh object literal, so excess-property
checking never runs on it. The guarantee is then one-directional: a field
ADDED to the type reds, because the fixture is missing a required one,
while a field REMOVED from the type, a key gone stale and a misspelling
that is not also a required-field omission all sit at exit 0
indefinitely. T-214 closed that at `app/test/board-truth.test.tsx` by
annotating the two constants with types reached through the component's
own props. **This card is the sweep that card owed, and the sweep found
the class is not confined to one file.**

## The sweep, and it is capable of finding

Run in-lane at `4c16b37` over `app/test/**` and `app/src/**`: a scan for
an unannotated `const NAME = {` bound to a whole object literal, plus
arrows whose inferred return is an `as const` literal. It returned the
two board-truth constants BEFORE T-214's change and no longer returns
them after — so the scan discriminates, and the sixteen below are what
remains.

## Two are MEASURED blind, not read blind

Both are inside T-214's own fence, so the lane could drill them. A
`staleKeyNobodyRemoved: 1` planted at each left `npm run build` from
`app/` at **exit 0 with zero `error TS` lines** — the identical mutant
that reds `TS2353` at the repaired site.

- `app/test/watcher-store.test.ts` — the `at()` arrows inside *"the
  PREDICATE is true only when both halves are"* and *"the PREDICATE reads
  a `picked` reply's OWN snapshot"* return `({ kind: … }) as const` with
  an inferred return type, then hand the result to
  `switchIsOvertaken`.
- `app/test/startup-recovery.test.ts` — `withPick` in *"a folder the user
  just chose and had refused still wins the screen"* is built by SPREAD
  and passed to `store.selectScreen`. **A spread-built literal is the
  harder half of this class**: annotating the declaration is the remedy,
  because there is no freshness to restore by inlining.

## Four more are the same shape by reading, OUT of T-214's fence

`app/test/interview-model.test.ts` — the four `const error = { … } as
const` fixtures in *"a typed failure carries the ONE action that helps
(T-029)"*, each passed to `failureHeadline` / `failureAction` /
`failureDetail`. Not drilled: T-214's fence is `app-shell` and this file
is not in it, so the lane routed rather than measured. **Whoever takes
this measures them rather than inheriting the reading.**

## The remaining candidates, unclassified on purpose

The scan is syntactic and a candidate is not yet a defect — it is one
only where the value reaches somewhere a type is expected. These were not
read: `app/test/architecture-derive.test.ts:111`,
`app/test/map-search.test.ts:29`, `app/test/startup-recovery.test.ts:134`
(`SNAPSHOT`), `app/test/interview-chat-dom.test.tsx:769` and `:775`
(`REFUSED_COMPOUND` / `REFUSED_GLOB`, both SPREAD into an emitted event),
`app/test/interview-resume-dom.test.tsx:507`,
`app/test/project-shell.test.tsx:77` and `:104` (`handlers`, spread into
JSX, and the enclosing function's declared return type gives it a partial
check already), `app/src/lib/dispatch-store.ts:199`.

## What the remedy is, and the one thing it is not

T-214 measured three shapes. **Annotating the declaration** with the type
reached through the consumer — `ComponentProps<typeof X>` for a prop, the
function's own parameter type for a call — restores freshness, reaches
NESTED literals, and reports at the declaration. **Inlining at the use
site** buys the same check and was rejected there on cost. **A runtime
`Object.keys` assertion** was measured to survive both nested mutants and
pins a hardcoded key list rather than the type; it is the weakest of the
three and should not be reached for first.

**AND THE ENFORCER IS `npm run build`, NOT THE GRADED SUITE.** The `app`
entry in `gate-run.mjs` is `npm test` — `vitest run`, which does not
typecheck — so every guard in this class is invisible to a body count by
construction. Measured at T-214: a mutant that reds the build left the
app gate GREEN at 1141 bodies. CI runs `app build` as its own step ahead
of `app suite`, so the teeth are real; a lane that reads only the
gate-runner will not see them.
