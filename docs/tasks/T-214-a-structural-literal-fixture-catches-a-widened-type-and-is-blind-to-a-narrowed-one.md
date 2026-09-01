---
id: T-214
title: A structural-literal fixture catches a WIDENED prop type and is structurally blind to a NARROWED one — board-truth's header claims "the same guarantee" and it is measurably one-directional
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
suggested_by: executor claude-opus-5@subagent @T-185-s2 (2026-08-31) — measured in-lane with two one-sided drills, not taken because the repair cannot be green before its blocker lands
touches: [app-shell]
builder:
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
