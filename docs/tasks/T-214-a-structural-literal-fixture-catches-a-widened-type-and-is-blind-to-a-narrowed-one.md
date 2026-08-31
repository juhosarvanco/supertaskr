---
id: T-214
title: A structural-literal fixture catches a WIDENED prop type and is structurally blind to a NARROWED one — board-truth's header claims "the same guarantee" and it is measurably one-directional
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: [T-185]
suggested_by: executor claude-opus-5@subagent @T-185-s2 (2026-08-31) — measured in-lane with two one-sided drills, not taken because the repair cannot be green before its blocker lands
touches: [app-shell]
builder:
review:
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

## What to do, and why it was not done in the lane that found it

**Inline the literal at both use sites** (`board-truth.test.tsx:906`
and `:942` at `70d09ad`) instead of binding it to a `const`. A fresh
object literal at the assignment turns excess-property checking back
on, closing the direction the header claims is already closed, and it
buys no import and no component edge — so the trade the header defends
survives intact.

**T-185-s2 could not take it**: that card's whole contract was to be
green BOTH before and after T-185 lands, and an inlined literal
carrying `notLanes`/`truncated` reds under excess-property checking at
any tree where those fields are not yet in the type. Hence
`blocked_by: [T-185]`.

**AND THE SCOPE IS THE FILE, NOT THE CONSTANT.** `NO_LANES` is one of
several structural literals in that describe block (`ASSEMBLED` is
another). Whoever takes this should ask which of them are checked
against a type that can narrow, and fix the header's sentence in the
same commit — a comment that overstates a guarantee is the half that
gets read.
