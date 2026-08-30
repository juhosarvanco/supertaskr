---
id: T-154-s4
title: The guard frees a checkout git records as mid-merge, and no ruling names that carve-out
feature: F-04
milestone: 4
priority: 30
size: S
status: suggested
blocked_by: []
touches: [.claude, docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-154-s2
builder:
verifier:
built_by:
verified_by:
review:
---

**A CRITERION THE EXECUTOR ADDED, DECLARED RATHER THAN SLIPPED IN, AND
IT WANTS A RULING.** @human's ruling of 2026-08-30 named three
carve-outs for the lane-less seat: `docs/tasks/` stays unfenceable, a
card's own file is outside every fence, and the integration seat's
ordinary writes (`docs/STATE.md`, `docs/checkpoints/`, the dispatch and
closing stamps) are never a lane's to veto. `T-154-s2` implements those
three from the manifest and from one constant compared against
docs/CONVENTIONS.md — and adds a fourth that no ruling names:

> a checkout git itself records as mid-merge, mid-rebase, mid-revert or
> mid-cherry-pick is free of every live lane's fence
> (`INTEGRATION_IN_PROGRESS_MARKERS` in `.claude/hooks/lane-fence.mjs`).

**THE ARGUMENT FOR IT, WHICH IS WHY IT SHIPPED.** Resolving a merge
conflict is an Edit, and the conflicted paths of a lane's merge are BY
CONSTRUCTION inside that lane's fence — the lane is live until the
integrator removes its worktree, which happens after the merge
(lane-protocol rule 6). Without this criterion the guard refuses the
integrator the one act that CONSUMES a fence, and a guard that forbids
merging is a guard somebody turns off — which is the failure mode
`T-154-s2`'s own cost paragraph is about.

**THE ARGUMENT AGAINST IT, WHICH IS WHY THIS CARD EXISTS.** The card
that dispatched it said the carve-outs were to be *"the ruling's
carve-outs as criteria, never hook judgement"*, and this one is the
hook's. It is mechanical — git writes and removes the marker itself,
the hook only stats it — but mechanical is not the same as ruled, and
a guard that grows criteria from inside is the shape the ruling was
protecting against.

## What a ruling decides

- WHETHER the criterion stands. If it does, it belongs in the ruling's
  own list rather than in an executor's note — and in
  `method/lane-protocol.md` beside `T-154-s3`'s sentence.
- IF it does NOT stand, the integrator needs another route through a
  conflicted merge, and the honest candidates are: remove the lane's
  worktree before resolving (which loses the lane's own tree mid-merge),
  or resolve through a tool the hook does not see (which is limit 1
  being used as a bypass, and says out loud that the guard is advisory).
- The marker set is the narrow question inside the wide one: `MERGE_HEAD`
  alone would cover the merge play, and the four cover the revert play
  (`REVERT_HEAD`) and the two rebase directories as well.
