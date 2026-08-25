---
id: T-033-s3
title: The non-code D3 story — C-01 and C-11 are permanent, C-15 is honest, and the downgrade arm cannot be built inside T-033's fence
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

T-033's criterion 2 wants the D3 findings for C-01 and C-11 either
downgraded to informational or recorded as accepted, *"per the recorded
decision"*. No decision was recorded (`T-033-s1`), and the downgrade arm
is not buildable inside `touches: [docs/architecture/components/,
lib-parser, app-map]`. Both halves of that are derived below.

## THE LIVE D3 SET IS THREE, AND ONLY TWO OF THEM ARE THIS STORY

At `25a9e2c`, `arch drift --root ../..` reports `declared_only=3`:
**D3:C-01, D3:C-11, D3:C-15**. `T-011-s2` (absorbed into T-033) listed
four — C-01, C-07, C-11, C-12 — and predicted C-07 and C-12 would "clear
on their own". They did: C-12 at T-012's merge, **C-07 at T-010's**, the
only D3 in this ledger ever cleared by a change to the WALK rather than
by a file being written.

- **C-01 (`method/**`) and C-11 (`app/src/styles/**`,
  `app/src/assets/**`) are STRUCTURAL.** Markdown, CSS and font binaries;
  `Lang::for_extension` answers `Some` for `ts`, `js`, `tsx`, `jsx` and
  now `rs`, and for nothing either component owns. Their amber is
  permanent noise unless something changes, which is exactly the case
  T-011-s2 opened.
- **C-15 (dispatch) is NOT that case and should not be swept in with
  them.** Its globs match no file because the code is not written yet —
  it was declared before its directory exists, deliberately, on
  `docs/design/dispatch-technical-plan.md`'s D2. Its D3 is the honest
  not-yet-built signal the map is for, and T-110 is building against that
  fence right now. Any `non_code:` field must NOT reach it; and note the
  dogfood already pins the distinction by name — *"C-15 is DECLARED-ONLY,
  never a defect"*.

So criterion 2's target set is exactly two, and the third D3 has to
survive whatever is done, which is a constraint the card does not state.

## WHY THE DOWNGRADE ARM IS OUT OF FENCE — three separate reasons

Criterion 2 arm (a) is *"C-06 parser field + derivation + rendering, each
a small additive change with tests"*.

1. **The field and the derivation and the renderer are all in fence** —
   `lib/parser/**` is C-06 (`lib-parser`), and `app/src/architecture/**`
   plus `app/src/lib/architecture/**` are C-12 (`app-map`). That part is
   buildable.
2. **THE TESTS ARE NOT.** Every app test in this repository lives in
   `app/test/**` — 49 entries, zero `*.test.*` files anywhere under
   `app/src` — and `app/test/**` is C-05's `app-shell`. A card fenced
   `[app-map]` can change the map engine and cannot test it. Filed
   separately as `T-033-s5` because it is a fence-design fact, not a
   T-033 fact.
3. **A downgrade CHANGES THE DERIVED FINDING SET**, which moves
   `architecture-dogfood.test.ts` (`findings`, `drift`, `declaredOnly`)
   and `map-dogfood-render.test.tsx` (the D3 rings on C-01 and C-11 are
   asserted by name). Both are under `app-shell`, **held LIVE by T-123**
   at `338a7e2`. That is T-010's ruling situation exactly, and T-010
   ruled it: widening there *"is not a fence question, it is two live
   lanes on one fence"*.

## THE ACCEPT ARM IS FULLY IN FENCE, AND ITS COST IS ZERO FIXTURES

Recording acceptance in C-01's and C-11's prose changes no frontmatter
field, so it changes no parsed record, no derived value and no fixture.
**Measured, not reasoned:** editing a component file's BODY on this
branch left `npm test` from `app/` at **940/940, exit 0**, and the only
live-tree assertion on any component's prose in the repository is
`lib/parser/test/smoke.test.ts`'s `expect(parser?.responsibility)
.toContain('hardened frontmatter parser')` on C-06 — nothing renders or
asserts C-01's or C-11's. So whichever way this is ruled, the accept arm
is a one-commit change on a free fence.

## SUGGESTED

Rule decision (2). If it is the downgrade, dispatch it as
`[lib-parser, app-map, app-shell]` and note that the field must
distinguish "will never contain indexed code" from "does not contain it
yet", or C-15's honest signal goes out with the noise. If it is
accept-and-record, it is in fence for any card holding
`docs/architecture/components/` and costs nothing else.
