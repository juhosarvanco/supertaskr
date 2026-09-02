---
id: T-237-s2
title: A `timed_out` or `startup_failure` run is a red the CI arm declines to call red — the announcement is keyed to the single conclusion the card named, and the other three reach a seat as "not read"
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

**THE CARD SAID `failure` AND THE BUILD OBEYED IT LITERALLY, WHICH IS
CORRECT AND IS NOT COMPLETE.** T-237's second criterion reads *"WHERE the
newest completed run is `failure`"*, so `FAILED_CONCLUSION` is the single
string `"failure"` and the full announcement — run id, failing step, and
whether the pushed tree reaches that step's package — fires only there.

GitHub's other terminal conclusions do not vanish; they land in the arm's
catch-all sentence:

    CI'S LAST VERDICT WAS NOT READ: run <id> concluded `timed_out`,
    which this guard reads as neither `success` nor `failure`.

That is honest and it is thin. A `timed_out` run IS main being red — a
suite that hung is a suite that did not pass — and a `startup_failure`
is a runner that never got as far as the code. Both currently cost the
seat a `gh run view` by hand, which is the manual step this whole arm
exists to remove.

**WHY IT WAS NOT WIDENED IN THE LANE.** Widening `FAILED_CONCLUSION`
changes what the guard SAYS about a tree, which is a change to a guard's
behaviour and therefore a card rather than an edit — and one of the four,
`cancelled`, must NOT be widened into, because under
`.github/workflows/ci.yml`'s `cancel-in-progress: true` a cancelled run is
usually **this guard's own subject** (a superseded push) rather than a
verdict about the tree. T-237 already counts and reports those
separately. So the widening is a judgement per conclusion, not a set
union, and it deserves its own argument.

## Acceptance criteria

- WHERE the newest run that reached a verdict concluded `timed_out` or
  `startup_failure` THE guard SHALL announce it with the same shape it
  gives `failure` — the run id, the failing step where one is named, and
  whether the pushed tree reaches that step's package — and SHALL NOT
  refuse on that ground.
- THE `cancelled` conclusion SHALL remain OUT of that set, and the
  reason SHALL be recorded where the constant is: a cancellation is the
  footprint of a superseded push and not a verdict about a tree.
- A body SHALL show each widened conclusion producing the full
  announcement AND a `success` producing silence in the same fixture
  shape, so the arm cannot pass by announcing everything.
- Verification: headless.
