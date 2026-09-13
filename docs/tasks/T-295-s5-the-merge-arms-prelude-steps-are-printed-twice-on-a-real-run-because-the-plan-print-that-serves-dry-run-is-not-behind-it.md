---
id: T-295-s5
title: "The merge arm's prelude steps are printed TWICE on a real run — the plan print that exists to serve --dry-run sits ahead of the dry-run branch, so the seat reads five steps, their reasons and their commands over again before the first one runs"
feature: F-04
milestone: 4
size: S
priority: 3
status: parked
wake: T-284
suggested_by: "the T-295 verifier (phase 2), 2026-09-10, reading its own fixture transcript: precondition:clean, precondition:verdict, branch:move, merge and stamp each appeared twice before the tail began"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

`main` prints the prelude once so that `--dry-run` has a plan to show,
and the print is not behind the dry-run branch — so the real path prints
the same five steps a second time as it runs them. Measured on the
verifier's bench: the transcript of one run carried
`[precondition] a clean tree on main` at two places, each with its whole
`why` paragraph and its `run:` line, and the same for the four steps
after it.

The seat's RETURN is unaffected — that is the ledger, and it is one line
per step. This is the transcript above it, which is what a seat reads
when a step refuses, and a doubled plan is the shape that teaches a
reader to skim.

## Acceptance criteria

- WHEN the arm runs without `--dry-run` THE prelude SHALL be printed
  once, as each step runs.
- WHEN `--dry-run` is given THE plan SHALL still be printed whole, with
  the tail, and nothing SHALL run.
- A body SHALL pin the step-line count of a real run against the number
  of steps the plan holds.

## Implementation notes

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the prelude steps print twice on a real run because the plan print sits ahead of the dry-run branch.
