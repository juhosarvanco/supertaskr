---
id: T-033-s9
title: The live registry cannot pin "non_code is never inferred" — every D3 on this tree is flagged, so the inferring mutant survives both dogfood fixtures
status: parked
suggested_by: executor claude-opus-5 @T-033
---

Measured by T-033's own poison drill, and filed because it is a standing
gap rather than a defect in what shipped.

## THE MEASUREMENT

Drill M5b, one-sided, producer only: in `app/src/lib/architecture/derive
.ts`, replace `informational: component.nonCode` with `informational:
true` — the exact inference the field exists to forbid, and the one
decision (2) argues about at length.

    app/test/architecture-derive.test.ts   4 failed / 52   RED
    app/test/architecture-dogfood.test.ts  10 passed / 10  GREEN
    app/test/map-dogfood-render.test.tsx   8 passed / 8    GREEN

**Both live-registry fixtures survive it.** The reason is arithmetic:
after T-033 the only two components with an empty file list are C-01 and
C-11, and both are flagged. On this tree "read the flag" and "infer the
flag" return the same answer for every component that exists, so no
assertion over the live registry can tell them apart.

## WHY IT IS NOT ALARMING, AND WHY IT IS STILL WORTH A CARD

The property IS pinned — twice, in `architecture-derive.test.ts`
(*"non_code NEVER comes from an empty file list"*, with a synthetic
unflagged component that has no files) and in `lib/parser/test/
component.test.ts` (*"A NOT-YET-BUILT COMPONENT DOES NOT INFER IT"*).
Unit fixtures are the right home for a property the live tree cannot
exhibit.

**What is missing is the WARNING.** The live fixtures currently read as
though they cover this, and they do not. The gap closes on its own the
next time a component is declared before it is built — which this
repository does routinely (C-07 from T-009 to T-010, C-12 until T-012,
C-13, C-14, C-15 from T-088 until T-110 merged seven hours before this
lane ran). **C-15 was that component when the ruling was written and had
stopped being it by the time the ruling was built**, which is precisely
how the coverage disappeared without anybody choosing to remove it.

## OPTIONS

- (a) **Nothing, plus a comment** — the unit pins are real; say in both
  dogfood fixtures that this property is NOT theirs. Cheapest, honest.
- (b) **A permanent synthetic case** in the dogfood: derive the live
  registry PLUS one fabricated unflagged file-less component, and assert
  its D3 stays non-informational. Costs a fixture that is no longer purely
  "this repo through its own engine", which is that file's whole charter.
- (c) **Nothing at all** — accept that the guard lives in unit tests and
  that a future declared-before-built component restores live coverage for
  free. Defensible; the risk is that the next executor reads the live
  fixture as coverage, which is the risk this file exists to record.

## PARKED — eleventh triage, 2026-08-26

Real and still true; not now. **UN-PARK WHEN:** the next card that edits either dogfood fixture — it takes the two-line comment with it. Still true (only C-01 and C-11 carry `non_code:`), and the property is pinned twice in unit fixtures, so this is a warning rather than a hole.
