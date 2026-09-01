---
id: T-237
title: A PUSH CANCELS THE RUNNING CI JOB and the push guard does not know a run is running — the batching rule is a habit, and the last completed verdict is read by nobody at the moment it matters
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
suggested_by: "the architect seat, 2026-09-02 — item 10 of docs/rooms/loop-efficiency.md; the instance is the evening of 2026-09-01, when four runs were superseded by rapid pushes and main sat red for five hours while local batteries said green"
builder:
verifier:
built_by:
verified_by:
review: independent
---

**TWO RULES ARE HABITS AND ONE GUARD COULD HOLD BOTH.** docs/CONVENTIONS.md
says *"A PUSH CANCELS THE RUNNING CI JOB … BATCH THE PUSH"* and, one bullet
later, *"AND THEN READ IT — `gh run list` after a batch"*. Both are kept by
memory. The push guard already refuses a push whose four-suite token is
not green against the pushed tree (T-203) and whose graph is stale
(T-216); it knows nothing about the run that is ALREADY RUNNING on the
remote for the previous push, nor about the verdict of the last one that
completed.

## The two facts a push should meet, and what each buys

1. **A run for this branch is IN PROGRESS.** Pushing now cancels it, and
   the tree it was measuring never gets a verdict — which is how a red
   main is discovered two pushes late. The guard SHALL refuse, naming the
   run id and its elapsed time, unless the pusher passes an explicit
   `--cancel-ci` acknowledgement through the environment; the refusal's
   remedy is *wait for the run, then push*.
2. **The last COMPLETED run for this branch is FAILURE.** Pushing over a
   red is the ordinary way a red gets fixed, so this is NOT a refusal.
   The guard SHALL announce the run id, the failing step's name and
   whether the tree being pushed touches any path under that step's
   package — so a seat pushing a fix sees that it is pushing a fix, and a
   seat pushing something else sees that main is red under it.

## Limits, stated where the guard is documented

`gh` may be absent, offline or unauthenticated. Then the guard SHALL
announce that CI could not be asked and ALLOW — the T-203 token still
holds the local claim, and a guard that refuses every offline push is
a guard somebody turns off. The announcement is the disclosure, and a
positive control SHALL show it fires only when `gh` genuinely fails.

## Acceptance criteria

- WHEN a push to the integration branch is attempted while the newest
  CI run for that branch is `in_progress` or `queued` THE guard SHALL
  refuse, naming the run id and the remedy, and a positive control SHALL
  show the same push ALLOWED once that run is `completed`.
- WHERE the newest completed run is `failure` THE guard SHALL announce
  the run id, the failing step and whether the pushed tree reaches that
  step's package, and SHALL NOT refuse on that ground alone.
- IF `gh` is absent, offline or refuses THEN THE guard SHALL announce
  that CI was not asked and allow; a body SHALL prove the announcement
  is a discrimination by running once with `gh` reachable and once with
  it shadowed.
- THE two facts SHALL be read with argv arrays and no shell, from
  `gh run list --json` and `gh run view --json`, and the parsing SHALL
  refuse rather than guess on an unexpected shape.
- THE spec SHALL drive the wired hook through the command
  `.claude/settings.json` registers, not a path the spec typed (the
  push-guard spec's own existing shape).
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

T-203 (the token gate this extends), T-216 (the rooting), the CONVENTIONS
bullets *A PUSH CANCELS THE RUNNING CI JOB* and *AND THEN READ IT*, the
09-01 records (the five red hours), and docs/rooms/loop-efficiency.md
item 10.
