---
id: T-203-s4
title: "The token samples the working tree at two MOMENTS, so an edit made and reverted DURING a run leaves both readings clean and the suite graded content no key names — the residual `T-203-s1` narrowed and did not close"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-203-s1, stated as that card's own residual rather than discovered later, 2026-09-09"
blocked_by: []
touches: [.claude/hooks/gate-token.mjs, tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, and it is a residual said out loud rather than a surprise

`T-203-s1` made the token read HEAD's tree and the tracked dirt BEFORE
the suite spawns as well as when the verdict is written, and refuses
when the two trees disagree. That closes the commit-lands-mid-run case
in both directions, including the tree that moves and moves back.

**IT IS STILL TWO SAMPLES OF A CONTINUOUS THING.** Edit a tracked file
after the suite starts, let some bodies run against it, and revert
before the runner writes: `HEAD^{tree}` never moved and `git status`
answers clean at both ends, so the entry is `tree == treeAtWrite`,
`dirty: false`, and it certifies content that no commit carries and no
reading ever saw. The pre-existing sibling is already written into
`trackedDirt`'s own header — an UNTRACKED new test file changes what a
suite executes without changing the key — and this is the same class
from the other side.

The window is smaller than the one `T-203-s1` closed and needs a seat
actively editing while a graded battery runs, which the conventions
already discourage. It is filed because a residual that is never written
down is rediscovered as a defect.

## The shapes available, so triage is not starting cold

- **A CONTENT DIGEST RATHER THAN TWO SAMPLES**: hash the tracked working
  tree (`git diff HEAD | shasum`, or `git stash create`'s tree) at both
  ends and record both. Same two-sample structure, but it sees an edit
  that a `--porcelain` check missed by timing, and it names WHAT changed.
- **A WATCH FOR THE DURATION**: honest and disproportionate — a file
  watcher inside the gate-runner is a second instrument to keep.
- **RECORD AND MOVE ON**: the residual is stated in the code's own
  header already; a card may simply be closed as accepted.

## Class parent

`T-203` — the verdict token, whose header already carries the untracked
half of this residual.

## Disposition hint

Lowest of the three `T-203-s1` filed, and a legitimate "accepted, closed"
outcome. If it IS taken, take the digest shape and put the residual's
own body beside it — the property is only worth having if a body
constructs the edit-and-revert.
