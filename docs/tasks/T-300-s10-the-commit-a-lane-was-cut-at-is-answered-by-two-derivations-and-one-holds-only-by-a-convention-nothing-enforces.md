---
id: T-300-s10
title: "The commit a lane was cut at is answered by two derivations — the arm's own `git rev-parse HEAD` after the stamp, and row 4's merge base of the lane branch against the integration branch — and the second holds only while a lane never merges the integration branch into itself, which nothing in the tree enforces"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300-s7, noticed while making row 4 name the commit the cut used; the card's criteria ask row 4 to name that commit and say nothing about where it is recorded"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/lane-fence.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Since T-300-s7 two places in the dispatch arm answer the question "which
commit was this lane cut at". The ritual's stamp step asks git for HEAD
immediately after the stamp and carries that hash through the run, and
the dispatch ledger prints it as `base hash:`. Row 4 of the brief answers
the same question a different way: the merge base of the lane's own
branch against the integration branch, which is the commit `git worktree
add` was handed and does not move when either ref advances.

The two agree today, and T-300-s7's own body asserts they agree across
three arrangements. They are still two implementations of one fact, which
is the shape lane-protocol rule 5 names: two chances to disagree, and the
disagreement would be invisible because each is right about a different
question when they part.

They part under one arrangement in particular. The merge base is the cut
only while the lane's branch never takes the integration branch into
itself. No lane in this repository has ever done that, and nothing in the
tree says it may not: a lane that ran a merge from the integration branch
would move its own merge base forward, and row 4 would then name a commit
the lane was not cut at, silently and with a provenance that re-derives
perfectly.

The repository already writes one file into the lane at dispatch that
nothing else writes and that the arm reads back two steps later: the lane
fence manifest. It carries the task id, the branch, the worktree and the
card, and it is written from the integration checkout at the moment the
cut is made. The cut's hash is a fact of exactly that shape.

## Acceptance criteria

- WHEN a lane is cut THE commit it was cut at SHALL be RECORDED by the writer that already writes the lane's manifest at dispatch, and row 4 SHALL read that record rather than derive the cut a second way; a derivation kept as a cross-check SHALL be reported as a disagreement rather than silently preferred.
- WHEN the recorded cut and a re-derivation disagree THE brief SHALL say so as a finding naming both commits, and a body SHALL drive that disagreement on a fixture where the lane's branch has taken the integration branch into itself.
- WHEN a brief is rendered for a lane whose manifest predates this record THE row SHALL fall back to the derivation it uses today and SAY that it did, so an old lane is answered rather than refused.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
