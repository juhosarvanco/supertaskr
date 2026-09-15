---
id: T-329
title: "The seat's own background jobs belong to no attempt, so nothing records, reconciles or transfers them at a milestone or a handoff"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the six waiters that outlived the session boundary; filed on the owner's word after the Codex orchestrator's review"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/conventions/dispatch-and-scratch.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

Six polling waiters started by the architect seat outlived the session by many hours: five polled a process pattern their own command line contained, one waited for a marker line the gate never prints. ADR-025's stop operation is implemented for an ATTEMPT's owned jobs (the run record reconciles them and refuses to mark an attempt stopped while termination is uncertain), and the wait arm is bounded by construction. The seat's own jobs, a watcher on a closing check, an ask watcher, a CI watch, are started outside both: no owner, no purpose, no completion condition, no ceiling anyone reads, and no site that reconciles them at a milestone or a handoff. Guidance alone did not prevent the recurrence.

## What would settle it

A separate lifecycle card, consumed later by T-323 and not absorbed into it. Recording stays apart from stopping: the record layer registers and reconciles and signals nothing; a native task is stopped through its harness and a process job through its controller, and the record reports uncertainty. A seat job has a seat or session identity and a job id in the existing runtime location and record conventions, never a dummy attempt, a consumed admission or a reserved lane. Launch intent is recorded, the returned handle bound, an interruption between the two reconciled; a pid is usable for stopping only with its process incarnation; an unknown native-handle state stays unknown. A job's lifetime names its purpose, the lane, check or run it belongs to, its completion condition and its ceiling; cleanup stops the watcher whose purpose ended, never the build or the remote run it observed, and completion includes collecting the result and recording the terminal state. Bounded native waits and notifications stay allowed; the wait arm is required for custom process polling; unbounded pattern polling is refused. A clean boundary requires every ended-purpose job reconciled; a necessary live watcher may be transferred explicitly to one successor owner; unknown jobs prevent a claim of quiescence and never justify indiscriminate termination. The mechanism accounts for registered launches and says so; a command started outside it is a procedural bypass; the registry is reconciled with the harness's owned-task inventory where one exists and an empty registry claims nothing. Where stopping or collecting a native task remains the seat's own act, it is labelled procedural with the evidence the seat supplies. Bodies: normal completion, expiry and cancellation, an interrupted launch, pid reuse, an unknown native job, repeated cleanup, a successor transfer that leaves one owner.

## Implementation notes

## Verdicts
