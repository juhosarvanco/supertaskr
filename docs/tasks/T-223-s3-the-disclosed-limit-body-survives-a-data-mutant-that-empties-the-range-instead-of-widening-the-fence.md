---
id: T-223-s3
title: "The disclosed-limit body survives a data mutant that empties the RANGE instead of widening the fence — both routes end in the same allow, and one merge-base assertion separates them"
status: verifying
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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

## BUILT, 2026-09-02 — the assertion landed and the card's own mutant was re-spelled

The one-line strengthening is in, immediately after the second push, with
the comment that says which route it excludes. Measured in this lane, one
side at a time, restored by sha256 between drills:

| drill | spec state | result |
|---|---|---|
| none (base `695954f`) | as shipped | 24 passed, exit 0 |
| none (tip) | with the assertion | 24 passed, exit 0 |
| RANGE-EMPTYING, as this card spells it (one line) | base | **1 failed / 23 passed** — and NOT at a closing assertion |
| RANGE-EMPTYING, re-spelled (two lines) | base | 24 passed, exit 0 — **SURVIVES**, as this card claims |
| RANGE-EMPTYING, re-spelled | tip | **1 failed / 23 passed**, killed BY NAME at the new assertion |
| companion NARROW card, as this card spells it | tip | 1 failed / 23 passed — but on `git commit` refusing an EMPTY commit |
| companion NARROW card, re-spelled `[tools/e2e, .claude]` | tip | 1 failed / 23 passed, killed at "the gate did not follow the moved ref" |

**THIS CARD'S MUTANT DOES NOT SURVIVE AS SPELLED, AND THE FINDING IT
NAMES IS STILL REAL.** The body carries, two lines below the `update-ref`,
a self-check on the mutation step itself —
`expect(git(fx.root, "rev-parse", "main").trim(), "\`git update-ref\` did
not move main").toBe(wide)` — so moving `main` to `laneTip` while leaving
that line naming `wide` reds THERE, at the bookkeeping, never reaching the
closing assertions this card is about. Verified against `58c8001` itself:
the body at that ref is byte-identical here, so the "24 passed, SURVIVES"
reading cannot have come from the one-line diff as printed. The faithful
DATA mutant moves the data and lets the mutation's own self-check follow
it, touching no assertion about the gate's behaviour:

    -  git(fx.root, "update-ref", "refs/heads/main", wide);
    -  expect(git(fx.root, "rev-parse", "main").trim(), "`git update-ref` did not move main").toBe(wide);
    +  git(fx.root, "update-ref", "refs/heads/main", laneTip);
    +  expect(git(fx.root, "rev-parse", "main").trim(), "`git update-ref` did not move main").toBe(laneTip);

That one survives the shipped body at 24 passed, exit 0, and the new
assertion kills it alone with its own message. The strengthening this card
asked for is exactly right; only the mutant's spelling was wrong.

**AND THE COMPANION MUTANT WAS PASSING FOR A REASON NOBODY MEASURED.**
Rewriting the moved-to card as `[tools/e2e]` writes the SAME BYTES the
fixture already committed on `main`, so `commit()` fails on an empty
commit and the body dies in its own setup — 1 failed / 23 passed, the
count this card reports, from a fixture crash rather than from the gate
refusing. Re-spelled as `[tools/e2e, .claude]` — still narrow against
`docs/ARCHITECTURE.md`, but a real edit — the push IS refused and the body
dies at "the gate did not follow the moved ref", which is the claim. The
new merge-base assertion passes first under that mutant, so it masks
nothing.
