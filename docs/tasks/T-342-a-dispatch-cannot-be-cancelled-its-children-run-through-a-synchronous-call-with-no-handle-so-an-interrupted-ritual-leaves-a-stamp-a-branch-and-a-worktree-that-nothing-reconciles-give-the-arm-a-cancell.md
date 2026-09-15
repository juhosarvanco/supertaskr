---
id: T-342
title: "A dispatch cannot be cancelled: its children run through a synchronous call with no handle, so an interrupted ritual leaves a stamp, a branch and a worktree that nothing reconciles — give the arm a cancellable child and a named interrupted outcome, and reconcile a partial mutation through the seat-job contract rather than by killing anything"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the Codex architect's lean-dispatch proposal of the same day; the seat checked the dispatch arm's child-spawning calls and T-329's fence before ruling that this does not fit inside that card"
blocked_by: [T-329, T-341]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Drafted 2026-09-15 at the owner's request, which asked whether dispatch cancellation belongs to T-329 or needs a dependent card of its own. THE ANSWER IS A DEPENDENT CARD, and it was reached by reading rather than by preference.

T-329 owns the seat's background jobs: their registration, their execution domain and controller, their ceilings, their reconciliation, their transfer and their uncertainty. Its consolidated criteria say the record layer signals nothing and that stopping belongs to the controller. That contract is the right one and this card does not duplicate or amend it.

But T-329's fence carries the run record, its spec, the arm's command entry and the dispatch convention chapter — and NOT the dispatch arm itself. The two things dispatch cancellation needs both live in the dispatch arm: a child that can be cancelled at all, and the reconciliation of a ritual interrupted part-way through its own mutations. Neither is a seat-owned background job. A dispatch child is a synchronous subprocess of the running command, not a registered job with a controller, so T-329's mechanisms do not reach it and widening T-329 to reach it would make that card two things at once.

The identifier here is provisional. Allocate it at filing, re-check overlap against cards filed since, and preflight then — no board preflight has been run against this draft.

## The finding

The dispatch arm runs its children through synchronous calls. A synchronous call returns a result or throws; it yields no handle, so there is nothing to cancel and nothing to ask about while it runs. An interrupted dispatch is therefore whatever the interruption happened to leave.

That matters because the ritual mutates as it goes. It stamps the card, cuts a branch and a worktree, writes a fence, reads the manifest back and cuts a bench. An interruption before the stamp leaves nothing. An interruption after the cut leaves a branch and a worktree that no lane owns, that the dispatch view will report as live, and that nothing reconciles.

The expensive step is the one most likely to be interrupted, because it is the one long enough for a seat to want to stop it.

## What would settle it

The arm runs its children so that a cancellation or an expiry reaches them, and reports an interrupted dispatch as its own outcome rather than as a success or a failure. Where nothing had yet been mutated, the outcome is a stopped dispatch with no lane claimed ready. Where mutation had begun, the arm reconciles what actually happened and reports what it could not establish, retaining the uncertainty rather than resolving it by assumption.

NOTHING IS KILLED BY PATTERN. A process is stopped only through the controller that owns it and only with ownership evidence, which is T-329's contract and is used here rather than restated. A worktree carrying work that was not there before is never removed to tidy up; it is reported.

Termination and collection stay separate events: a cleanup that returns success while an owned writer is unresolved is the failure this card exists to prevent. Repeated cancellation and reconciliation are safe, unrelated processes survive, and a child that reports after its dispatch was abandoned cannot restart it.

A deadline, if one is configured, has an explicit expired outcome and a defined retry path. It authorizes nothing: an expiry never becomes a green baseline and never bypasses the keeper.

## Acceptance criteria

- WHEN a dispatch child is started THE arm SHALL retain a handle through which a cancellation or an expiry can reach that child, and SHALL report an interrupted dispatch as an outcome distinct from a success and from a failure.
- WHEN a dispatch is cancelled before any mutation THE arm SHALL report a stopped dispatch, SHALL claim no lane ready, and SHALL leave no stamp, branch, worktree, fence or bench behind.
- WHEN a dispatch is cancelled after a mutation has begun THE arm SHALL report which mutations it established, SHALL name what it could not establish rather than assuming it, and SHALL remove no worktree that carries work the ritual did not itself create.
- WHEN the arm stops an owned child THE stop SHALL go through that child's owning controller with its ownership evidence, and the arm SHALL match no process by name, pattern or process group.
- WHEN a cancellation or reconciliation is repeated THE outcome SHALL be the same as performing it once, unrelated processes SHALL survive it, and a result arriving from an abandoned child SHALL update the record without restarting the dispatch.
- WHEN a configured deadline expires THE arm SHALL report an expired outcome with its retry path, and that outcome SHALL confer no baseline admission and SHALL bypass no check.

## Implementation notes

## Verdicts
