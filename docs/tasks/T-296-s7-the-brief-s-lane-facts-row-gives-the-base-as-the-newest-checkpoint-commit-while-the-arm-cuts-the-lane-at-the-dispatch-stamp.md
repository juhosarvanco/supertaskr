---
id: T-296-s7
title: "The brief's lane-facts row gives the base as the newest checkpoint commit while the arm cuts the lane at the dispatch stamp — the row reads a rule the arm superseded, and every lane since T-239 has been handed a base its own worktree contradicts"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the seat (2026-09-10): the T-296 executor's report named row 4's base as the newest Checkpoint (1b255d1c) while the lane was cut at the dispatch stamp (9dc05597); the lane trusted git rev-parse and said so"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The dispatch brief's lane-facts row derives its base commit from `git log --first-parent` on the integration branch, taking the newest commit whose subject opens with `Checkpoint:` — the DISPATCH FROM THE LAST CHECKPOINT bullet in docs/CONVENTIONS.md. Since T-239 the arm cuts the lane at the DISPATCH STAMP it commits in its own step, and the seat's facts and the fence manifest name that stamp as the base. At the T-296 dispatch the row said the rename-sitting checkpoint and the worktree said the stamp, and the executor reported the disagreement rather than acting on it. A lane that trusted the row would diff from the wrong base and hand its verifier a range that carries other cards' merges.

## Acceptance criteria

- WHEN the brief is assembled for a lane the arm cut THE lane-facts row SHALL give the base as the dispatch stamp the arm committed — the commit the worktree was created at — and SHALL name its derivation; WHEN no lane exists yet (the `--task` form before a cut) THE row SHALL say which commit a cut WOULD start from and why.
- WHEN docs/CONVENTIONS.md's dispatch bullet is read THE rule SHALL say that the arm cuts at its own stamp and that the checkpoint rule describes the seat's timing of dispatches, not the commit the row reports; a body in brief.spec.ts SHALL red when the row's base and the worktree's `git rev-parse HEAD` at the cut disagree on a fixture.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
