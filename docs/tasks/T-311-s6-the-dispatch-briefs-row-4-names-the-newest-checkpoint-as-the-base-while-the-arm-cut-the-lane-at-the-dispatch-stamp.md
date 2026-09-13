---
id: T-311-s6
title: "The dispatch brief's row 4 names the newest checkpoint as the base commit while the arm's own step 4 cut the lane at the dispatch stamp — one brief, two bases, and the executor had to choose by reading the repository"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "executor claude-opus-5@subagent @T-311, its correction clause at a98e5a067ca815b984d133ed8b311366899499f4, filed by the seat, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The T-311 brief, rendered by the dispatch arm at 2026-09-12T12:45:40Z, says
in row 4 "base commit: 254cf7b6", derived as the newest `Checkpoint:` commit
on main, and prints a create command substituting that hash. The same arm's
step 4, one arm earlier in the same run, cut the lane worktree at the
integration checkout's HEAD after the dispatch stamp, f608f5fa, and the
dispatch log names that hash as the base. Row 5 of the same brief names
f608f5fa as the lane's tip. So the brief carries two commits called the base,
and the executor resolved it the right way — the repository wins, `git
rev-parse HEAD` in the lane — and reported it in its correction clause.

The base rule permits the cut: a non-merge commit after the checkpoint
qualifies when its own gates are green, and the dispatch stamp is exactly
that. Row 4 simply quotes the rule's anchor as if it were the cut. A brief
whose base line the executor must correct on every dispatch is a line that
teaches executors to distrust the brief.

## Acceptance criteria

- WHEN the dispatch arm has cut the lane THE brief's row 4 base line SHALL name the commit the cut used, with the newest checkpoint stated beside it as the rule's anchor and the reason the later commit qualifies; a body drives the arm on a fixture where the stamp follows the checkpoint and requires row 4's base to equal the cut's hash.
- WHEN no stamp follows the checkpoint THE two SHALL coincide and the line SHALL say so, pinned by the same body's control.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 2, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.
