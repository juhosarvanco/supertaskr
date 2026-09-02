---
id: T-237-s4
title: A push now waits on the network up to twice and nobody has measured what it costs — the 15-second timeout is a bound picked in a lane, not a figure read off this repository
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A NUMBER NOBODY MEASURED, GUARDING A COST NOBODY MEASURED EITHER.**
T-237 gives `gh` a `GH_TIMEOUT_MS` of 15 000, and the reason for HAVING a
timeout is sound and is written down: this hook runs inside the seat's
own `Bash` call, so a `gh` waiting on an unreachable host would hang the
session rather than the push. What is NOT measured is the value.

Two facts are missing and both are cheap to get:

1. **What a real `gh run list` costs against this repository**, warm and
   cold. Until that is known, 15 000 is neither generous nor tight — it
   is a round number, and a round number in a timeout is how a guard
   acquires an intermittent.
2. **How often the second call happens.** `gh run view` runs only when
   the last verdict was a failure, so the worst case is two serial round
   trips on exactly the push a seat is most impatient about — the one
   pushing a fix over a red.

The two calls are independent — one names the run, the other reads its
jobs — so the second could be started as soon as the first has an id, or
the whole arm could be given ONE budget rather than one per call. Neither
was built, because a concurrency change to a guard is worth exactly as
much as the measurement that motivates it, and this lane had none.

There is a third, smaller item beside it: `push-guard.mjs` now spends
that budget on EVERY push, including a lane push for a branch CI never
runs on. The answer for such a branch is an empty run list, which is
silent and correct — so this is a cost question, not a correctness one,
and it should be decided by the same measurement.

## Acceptance criteria

- THE timeout SHALL carry a measured figure: the observed latency of
  `gh run list` against this repository, warm and cold, recorded beside
  the constant with the date and host it was read at (a live-environment
  fact, per the method's figure rule).
- WHERE the measurement shows the two calls are worth overlapping THE
  arm SHALL overlap them and SHALL keep one overall budget, so a push
  cannot wait two full timeouts.
- A body SHALL show a `gh` that never answers costing the budget and
  then ALLOWING — the timeout is an inability and never a verdict — and
  SHALL show a `gh` that answers promptly NOT paying it, so the bound is
  proven to be a bound rather than a delay.
- Verification: headless.
