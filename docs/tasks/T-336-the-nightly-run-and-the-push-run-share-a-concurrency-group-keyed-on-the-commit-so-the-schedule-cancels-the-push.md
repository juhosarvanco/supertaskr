---
id: T-336
title: "The nightly run and the push run share a concurrency group keyed on the commit, so the schedule cancels the push whose verdict is the landing gate: key the group on the event as well as the commit, or give the scheduled run its own group, and prove a schedule and a push on one commit both reach a conclusion"
feature: F-04
milestone: 4
size: XS
tier: guarded
priority: 1
status: building
suggested_by: "the architect seat on 2026-09-15, from the cancellation of the T-331 landing push's own CI run; observed twice, on 2026-09-14 and 2026-09-15, and read from the runs' own event fields rather than inferred"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts, .claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Fence widening, 2026-09-15

Widened by the architect seat on the lane's ask, both halves in one act: the two paths added above, and the lane's own fence manifest rewritten to match.

WHY. The lane measured that criteria 1 to 3 sit wholly inside the original fence, and that the last criterion does not: the only thing in this repository that reads a run's conclusion and says anything to a seat is the pre-push guard, which the fence did not carry. Two of that criterion's three halves already hold and are already pinned — a cancelled run is deliberately out of the announced-red set, and it is in the non-verdict set so the newest-verdict search skips it. The half that does not hold is the naming: the guard reports a COUNT of runs that reached no verdict, never the cancelled run's identifier and never the displacing run's, and it prints even that only when the verdict it finally finds is not a success, so a cancellation sitting in front of a green is silent. The guard could not name the displacing run today in any case, because the run-list field set it asks for does not include the event, and after this card's own repair the displacing run is the newer run with the same commit AND the same event.

The seat verified each of those readings against the tree before ruling rather than taking them from the ask.

WHY NOT THE OTHER TWO ANSWERS. Ruling the criterion satisfied by its two holding halves would leave a criterion whose main clause — reported as a displacement naming the displacing run — is performed by nothing in the tree, which is the letter-over-purpose shape this project's whole verification apparatus exists to catch, and the shape that gets copied once it is allowed. Splitting it into a follow-up card is honest but spends a whole further lane on a build the ask scopes as a field added to a list, a derivation beside an existing one, a notice, and its bodies.

THE LIMITS OF THIS WIDENING, WHICH ARE PART OF THE GRANT. It is for the last criterion only. T-333's repair now sits inside this fence, and it is NOT to be performed here: that card is already filed with its own criteria, and performing it as a follow-through would orphan the card and put work in this diff that no criterion of this card asked for. The three lane-local reds it describes are still reported and still not this lane's. Nothing else outside the original fence is opened.

WHAT IT COSTS, RECORDED SO THE NEXT SEAT IS NOT SURPRISED. T-333's fence is now a subset of this card's, so T-333 cannot be dispatched while this lane is live. The widened fence stays disjoint from T-330, which is live beside this lane, and from T-332 and T-335.

## The finding

The workflow declares one concurrency group for every trigger it has, keyed on the workflow and the commit, with in-progress cancellation on. T-294 put the commit into that key so that a NEW push would stop cancelling the run of an older one, and for pushes it works. What it does not account for is another trigger arriving on the SAME commit: the nightly schedule grades whatever the tip is, and the tip is the commit the last push just created. Same workflow, same commit, therefore the same group — so whichever run starts later cancels the one already going, and the later one is the nightly.

Observed twice, both read from the runs' own `event` fields:

- 2026-09-14: the push run on `37d89ff7` created 12:56:49Z was cancelled; the schedule run on the same commit created 12:58:24Z succeeded.
- 2026-09-15: the push run on `ee5bae19` created 11:38:14Z was cancelled at 11:52:02Z, thirteen minutes into its end-to-end shard, with eight of its ten jobs already successful; the schedule run on the same commit created 11:51:43Z took over.

Two details make it worse than an occasional collision. The cron is written for the small hours, and both observed runs were delayed by the service into the working window, so the nightly arrives while a seat is pushing rather than while nobody is. And a cancelled run is neither green nor red: the standing instruction to keep a lane branch until CI is green waits on a verdict that will never arrive, and a seat reading only a run's conclusion sees a word that names no fault in the tree.

The tree itself was never in question on either occasion. What was lost is the push's own verdict, which is the evidence the landing gate reads.

## What would settle it

The group distinguishes the runs that must not cancel each other. Keying it on the event as well as the commit is the smallest change that does so; giving the scheduled run a group of its own is the same idea spelled differently. Either way a push and a schedule on one commit both reach a conclusion, and a push started while another push on the same commit is still running still collapses to one, which is the behaviour T-294 wanted.

The keeper reads the workflow rather than the prose: a body that enumerates the declared triggers and requires that no two of them can land in one cancelling group, so that adding a trigger later without widening the key reds by name rather than silently restoring this defect.

A seat that meets a cancelled run needs to know it is not a red. The cancellation is reported as its own outcome, naming the run that displaced it, rather than read as a failure of the tree or as a verdict still pending.

## Acceptance criteria

- WHEN two runs of this workflow are triggered by different events on the same commit THE concurrency key SHALL place them in different groups, and both SHALL reach a conclusion rather than one cancelling the other.
- WHEN two runs are triggered by the same event on the same commit THE in-progress cancellation SHALL still collapse them to one, which is the behaviour the commit-keyed group was introduced for.
- WHEN the workflow declares a trigger THE keeper SHALL derive the trigger set from the workflow itself and SHALL red by name where any two declared triggers could land in one cancelling group, so a trigger added later cannot silently restore this defect.
- WHEN a run is cancelled by another run THE outcome SHALL be reported as a displacement naming the displacing run, and SHALL NOT be read as a red tree or as a verdict still pending.

## Implementation notes

## Verdicts
