---
id: T-214
title: A structural-literal fixture catches a WIDENED prop type and is structurally blind to a NARROWED one — board-truth's header claims "the same guarantee" and it is measurably one-directional
feature: F-04
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
suggested_by: executor claude-opus-5@subagent @T-185-s2 (2026-08-31) — measured in-lane with two one-sided drills, not taken because the repair cannot be green before its blocker lands
touches: [app-shell]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE CLAIM AND THE MEASUREMENT DISAGREE.**
`app/test/board-truth.test.tsx`'s own header argues — correctly, and
this card does not propose reversing it — that its props are written as
STRUCTURAL LITERALS and never imported, because importing
`DispatchReading` for a fixture would buy a C-05 -> C-17 component edge.
It then says TypeScript checks them contextually, *"which is the same
guarantee without the edge"*.

**IT IS NOT THE SAME GUARANTEE.** Every one of those literals is bound
to a `const` before it reaches a JSX prop, so it is not FRESH at the
assignment and excess-property checking never runs on it. The
contextual check catches a field ADDED to the type. It cannot catch a
field REMOVED from the type, a field misspelled, or a field that has
gone stale — those sit in the fixture at exit 0, indefinitely.

## Measured at T-185-s2, one side only, restored sha256-identical

Against `NO_LANES` (the constant T-185-s2 repaired), typing
`notLanes:` as `notLane:`:

- at a tree WITHOUT T-185's widened type — `npm run build` from app/
  **exit 0**. Nothing in the program constrains the key at all.
- at a tree WITH it (`66ef51c`) — **exit 2**, two `TS2322`s. The type
  catches it only because the typo makes a REQUIRED field missing, not
  because the extra key is rejected.

## Two options, and the blocker binds only one of them

**OPTION 1 — inline the literal at both use sites**
(`board-truth.test.tsx:906` and `:942` at `70d09ad`) instead of binding
it to a `const`. A fresh object literal at the assignment turns
excess-property checking back on, closing the direction the header
claims is already closed, and it buys no import and no component edge —
so the trade the header defends survives intact. **This is the option
`blocked_by: [T-185]` is about**: an inlined literal carrying
`notLanes`/`truncated` reds under excess-property checking at any tree
where those fields are not yet in the type, so T-185-s2 — whose whole
contract was to be green BOTH before and after T-185 lands — could not
take it.

**OPTION 2 — assert the key set at runtime.** A body comparing
`Object.keys(NO_LANES)` against the expected set is in-fence, needs no
import and no edge, and is **green at both trees** — so it is not
blocked by T-185 at all, and it catches a stale or misspelled key that
`tsc` will never see in either direction. It is weaker in one way
(it pins the constant rather than the type) and stronger in another
(it does not wait).

**T-185-s2 SAID "THE" REPAIR WHERE IT MEANT "ONE" REPAIR**, and the
correction is why this section is two options: the blocker is a
property of inlining, not of the goal. Whoever takes this picks; the
`blocked_by` above should be re-read as binding option 1 only.

**AND THE SCOPE IS THE FILE, NOT THE CONSTANT.** `NO_LANES` is one of
several structural literals in that describe block (`ASSEMBLED` is
another). Whoever takes this should ask which of them are checked
against a type that can narrow, and fix the header's sentence in the
same commit — a comment that overstates a guarantee is the half that
gets read.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**`blocked_by` cleared at the seat**: T-185 is done, and the card itself
ruled the blocker bound option 1 only. `review: independent` set (a
fixture guard). Take option 2 — assert the key set at runtime — unless
the lane measures option 1 cheaper.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.

## Implementation notes

**NEITHER OPTION AS WRITTEN — a third was measured cheaper than option 1
and stronger than option 2, and the card's own sentence licenses the
pick.** Both constants are now ANNOTATED with the arm of the prop type
they are written for, reached through `ComponentProps<typeof Board>`:
the type comes from `Board`, which this file has imported since T-017
over the C-05 -> C-18 edge `C-05-app.md` already declares, so it buys no
C-17 import and no new component edge — the trade the header defends
survives intact. An annotated declaration IS a fresh literal, so
excess-property checking runs, which is option 1's guarantee at three
lines instead of a 28-line JSX prop, two orphaned doc comments and a
`NO_LANES` duplicated across two bodies.

**THE THREE OPTIONS, MEASURED RATHER THAN ARGUED** (all at `4c16b37`,
`npm run build` from `app/`, mutants applied ONE at a time and restored
sha256-identical):

| mutant | before | option 2 (runtime keys) | the annotation |
|---|---|---|---|
| stale key in `NO_LANES` | exit 0 | suite RED | `TS2353` |
| stale key in `ASSEMBLED.brief` | exit 0 | suite GREEN — **survives** | `TS2353` |
| stale key in a nested `provenance` | exit 0 | suite GREEN — **survives** | `TS2353` |
| `notLanes` -> `notLane` | exit 2, two `TS2322` at the USE sites | suite RED | `TS2561`, at the typo, naming the field it meant |
| `truncated` dropped | exit 2 | not its business | `TS2741` |

Option 2 was measured to survive both NESTED mutants and to pin a
hardcoded key list rather than the type, so it is the weakest of the
three; option 1 was built and drilled green before being rejected on
cost. **Option 1's blocker is spent either way**: T-185 has landed, so
freshness no longer reds on `notLanes`/`truncated`.

**FOR THE VERIFIER, THE THREE THINGS WORTH AIMING AT.**
(a) The guard is not silently removable: deleting the two annotations
alone reds the build with three `TS2322`s, because `as const` went with
them and `kind` widens to `string`. (b) The anti-vacuity control is the
pre-T-214 shape with the same stale key — exit 0, zero `error TS`. (c)
`as const` was NOT the line suppressing the check: measured, the stale
key reds `TS2353` under the annotation whether it stays or goes, and the
doc comment now says so, because a reader who blamed the assertion would
have deleted the wrong line.

**THE ENFORCER IS `npm run build`, NOT THE APP GATE**, and this is the
residual worth saying out loud: `gate-run.mjs`'s `app` entry is `npm
test` — `vitest run`, which does not typecheck. Measured: a mutant that
reds the build leaves the app gate GREEN at 1141 bodies. `ci.yml` runs
`app build` as its own step ahead of `app suite`, so the teeth are real;
a lane reading only the gate-runner will not see them. The section
header now carries this sentence.

**SWEEP, AND IT IS NOT EMPTY** — filed as `T-214-s1`. The class is a
structural-literal fixture bound to an unannotated `const` before it
reaches a typed prop or parameter. A scan of `app/test/**` and
`app/src/**` returned 16 further candidates; the two in-fence ones the
lane could drill (`watcher-store.test.ts`'s `at()` arrows,
`startup-recovery.test.ts`'s spread-built `withPick`) are MEASURED blind
to the same planted key at exit 0. The rest were routed, not built.
