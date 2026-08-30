---
id: T-154-s4
title: The guard frees a checkout git records as mid-merge, and no ruling names that carve-out
feature: F-04
milestone: 4
priority: 30
size: S
status: parked
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
- AND THE WINDOW THE MARKER DOES NOT COVER. git clears it at the merge
  COMMIT and a conflict-free merge never writes one, while rule 6 keeps
  the worktree until after the checkpoint — so the criterion frees the
  CONFLICT and not the reconciliation that follows it. A ruling that
  keeps the criterion should say whether the integrator's post-merge
  writes are freed too, by an earlier worktree removal, or not at all.
  (Added at T-154-s2's verification, which measured the window on the
  card itself.)

## TRIAGE (2026-08-30, standing triage sitting #4) — PARKED, and ROUTED TO @human as a one-line ratification

**THE SITTING DELIBERATELY DOES NOT RULE THIS ONE.** The three
carve-outs are @human's own ruling of 2026-08-30; this card asks whether
a FOURTH, added by an executor from inside the lane, joins them. A seat
that adds criteria to @human's ruling on the ruling's own behalf is the
shape the ruling exists to prevent, so the sitting routes it instead.

**THE SEAT'S RECOMMENDATION, so @human answers yes or no rather than an
essay: KEEP IT.** Three facts, all re-derivable:

1. It is MECHANICAL, not judgement — git writes and removes the marker
   itself and `INTEGRATION_IN_PROGRESS_MARKERS` in
   `.claude/hooks/lane-fence.mjs:243` only stats it.
2. Without it the guard refuses the integrator the one act that CONSUMES
   a fence, and a guard that forbids merging is a guard somebody turns
   off.
3. The alternatives are worse and are already written on this card: lose
   the lane's tree mid-merge, or route around the hook and say out loud
   that it is advisory.

**IF @human keeps it**, it belongs in the ruling's list and in
`method/lane-protocol.md` beside `T-154-s3`'s sentence — at which point
this card joins the same method-release rider set. **The narrow question
inside it stays open either way**: `MERGE_HEAD` alone covers the merge
play; the four also cover revert and both rebase directories.

**RESURFACING CONDITION: @human answers.**
