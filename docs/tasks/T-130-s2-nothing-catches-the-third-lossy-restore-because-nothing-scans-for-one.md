---
id: T-130-s2
title: Nothing catches the THIRD lossy restore, because the only guards are the two bodies that happen to assert their own
status: suggested
suggested_by: executor claude-opus-5 @T-130
---

**T-130 fixed both call sites and left the CLASS unguarded**, which is
the half of its own acceptance criterion that no code in this repository
can currently discharge: *"a fix applied only where a test happens to
complain leaves the same bug everywhere nothing is watching."*

## The derivation

`git grep -n utimesSync` from the repo root, at `b1ceedc`, returns
**exactly two code call sites**, both in
`tools/e2e/tests/token-scan.spec.ts` — the T-058 body's `finally` and the
P6 body's `finally`. Every other hit is prose under `docs/`. Both are now
correct, and both are guarded **by an assertion inside their own body**.

**That is the whole guard surface.** A third plant-and-restore body
written tomorrow — in `tools/e2e`, in `app/test`, anywhere — that spells
`utimesSync(target, stats.atime, stats.mtime)` is lossy on arrival and
**nothing reds**. It will be green in its own suite, because the lossy
write leaves the file on a whole millisecond and the defect erases its
own precondition; and it will red somebody else's mtime guard weeks
later, detached from its cause. That is the exact failure shape the
DOCS GATE bullet argues gates exist for.

## The shape of a remedy, in this repository's own vocabulary

The token lint already walks `app/src`, `app/test` and `tools/e2e` as
masked source and applies numbered patterns to it. A pattern in that
family — call it the next free id — could red on a `utimesSync` call
whose second or third argument reads as a `Date`-valued `stat` field
(`.atime` / `.mtime` / `.birthtime`) rather than a numeric one, and the
selftest's evidence floor would keep it honest: a positive sample (the
`Date` spelling) and a negative twin (the `ms / 1000` spelling) on
adjacent lines, exactly the way P6's own gated/bare pair works.

**Two things to check before building it**, because both would change the
answer:

1. **Is one pattern enough?** The rule the pattern would encode is *"do
   not hand a `Date` to an API that takes seconds"*, and `utimesSync` is
   the only such API in this tree today. A pattern that matches one
   symbol goes stale the day a second arrives; `futimesSync`,
   `lutimesSync` and their promise forms are the obvious neighbours and
   cost nothing to include.
2. **Does it belong to the lint at all, or to a derived body?** The
   `range-rule.spec.ts` precedent is the alternative: a test that
   ENUMERATES every restore site in the tree and asserts each one is
   non-lossy is stronger than a text pattern, because it cannot be
   evaded by spelling, and it fails loudly when a new site appears.
   T-130 leant that way but had no fence argument for building it inside
   a size-S card whose criteria were all about two specific bodies.

**Fence:** `[tools/e2e]` — FREE once T-130 lands.
