---
id: T-223-s3
title: "The disclosed-limit body survives a data mutant that empties the RANGE instead of widening the fence — both routes end in the same allow, and one merge-base assertion separates them"
status: building
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
review: independent
suggested_by: verifier claude-opus-5@subagent @V-223
---

`landing-gate.spec.ts`'s *"THE DISCLOSED LIMIT, MEASURED: a lane moves
local `main` with `update-ref` and this gate follows it"* moves `main` to
a commit whose card is WIDER and asserts the push is then allowed, is not
an announced cannot-compare, and reaches the remote. **There is a second
route to that same allow, and the body's closing assertions do not
exclude it.**

## Measured, one side only, at `58c8001` in the verifier's bench

Data mutant, applied to the body's own fixture and read back from
`git diff -U0`:

    -  git(fx.root, "update-ref", "refs/heads/main", wide);
    +  git(fx.root, "update-ref", "refs/heads/main", laneTip);

`npx playwright test tests/landing-gate.spec.ts` → **24 passed, exit 0.
SURVIVES.**

## Why both routes end in an allow

Measured at the base `28924c7` against `laneLandingVerdict` directly, in
a throwaway repository, before this card's diff existed:

| `main` points at | verdict | code | reason |
|---|---|---|---|
| the widened commit | allow | `landing-gate-inside-the-fence` | `1 path(s), merge-base <the original main>` |
| the LANE TIP | allow | `landing-gate-inside-the-fence` | `0 path(s), merge-base <the lane tip>` |

Moving `main` onto the lane's own tip makes the merge-base the tip, so
`rangePaths` returns NOTHING and every path is trivially inside any
fence. The fence is never widened; the RANGE is emptied. Both are real
consequences of the same disclosed limit, and limit 6 in the hook's
header covers both — but the body's name says *the gate follows the moved
ref to a wider fence*, and that is the half it should be pinned to.

## The one-line strengthening, and it can fail

Add, immediately after the second push:

    expect(git(fx.root, "merge-base", "main", "HEAD").trim(),
      "the allow came from an EMPTIED range, not from a widened fence")
      .toBe(narrow);

Checked against the rule that a proposed control must be able to fail:
under the mutant above the merge-base is the lane tip, so the assertion
reds; in the body as written it is `narrow`, so it passes. It costs one
line and no new fixture.

**NOT A DEFECT IN THE DIFF THAT SHIPPED IT.** The companion data mutant —
making the moved-to commit's card NARROW instead of wide — kills that
body ALONE (1 failed / 23 passed), so it does bind to the fence declared
at the moved ref. This is a sharpening of a body that already
discriminates.

## TRIAGE, 2026-09-02 — PROMOTED, placement fields written at the seat

One `merge-base` assertion after the second push, shown able to fail
against the data mutant that empties the range — T-229's class at the
size of one line. Fence: the spec alone.
