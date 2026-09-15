---
id: T-329
title: "The seat's own background jobs have an execution domain, controller and owner, so completion, cleanup and supported transfer are reconciled without confusing another environment's processes with this one's"
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

## Amendment provenance

Consolidated on 2026-09-15 on the owner's yes, from the Codex orchestrator's lean-handoff review bundle of the same day. The architect seat verified that bundle before putting it to the owner: its manifest checked seven of seven, and its snapshots of this card and of T-309 are exact git blob contents at `150f38eb1cabc517c548be49460b2174f2daf6ac`.

As filed earlier on 2026-09-15 this card carried NO acceptance criteria at all: its obligations lived only as prose under its finding and its settling section. Those are superseded by the canonical acceptance-criteria section below, and every obligation they carried was checked into it one at a time — the record layer signalling nothing; no dummy attempt, consumed admission or reserved lane; launch intent and handle binding with the interruption between them; process incarnation; an unknown native-handle state left unknown; purpose, completion condition and ceiling; never stopping the build or the remote run a watcher was observing; collecting the result and recording a terminal state; bounded native waits, the wait arm required for custom polling and unbounded pattern polling refused; explicit transfer to one successor; unknown jobs preventing a claim of quiescence; an empty registry claiming nothing; procedural labelling of what the arm cannot itself enforce; and the pid-reuse and repeated-cleanup bodies. The consolidation adds execution-domain and controller identity, which the earlier text did not carry.

The title changed in the same act. Status, priority and fence are unchanged. Size stays provisional and the tier is the arm's at dispatch. The earlier wording is recoverable from this file's own history.

## What was measured

The original finding records six seat-owned polling waiters that survived the previous coordinator. Attempt-owned jobs already have reconciliation in the run record; those waiters were outside an attempt. T-329's existing proposal covers registration, bounded waiting, cleanup and transfer.

The owner later relayed a successor's report that it was running in a Linux container on a lane branch while the handoff expected the local integration checkout. This draft does not claim an independent inspection of that container. It exposes an additional requirement: process and native-task handles belong to an execution domain and controller. A numeric PID copied into another environment cannot identify the original job there.

## Acceptance criteria

- WHEN a seat-owned job is registered THE record SHALL identify its job ID, owning session, execution domain and controller, purpose, associated work or observed run, completion condition and ceiling; a process handle SHALL include its process incarnation, and a native handle SHALL identify its issuing controller. The record SHALL use the existing runtime-record conventions without inventing a card attempt, consuming an admission or reserving a lane. Bodies SHALL distinguish identical numeric handles issued by different execution domains and shall keep an unknown domain explicit.
- WHEN launch is interrupted between intent registration and handle binding THE record SHALL retain the intent and require reconciliation before a replacement launch; WHEN completion is observed THE record SHALL retain the controller evidence and collect the result before marking the job terminal. Bodies SHALL cover interruption before binding, normal completion, cancellation requested without confirmed termination, and repeated observation.
- WHEN the seat reconciles or stops a job THE operation SHALL address its owning controller and execution domain, never reinterpret a foreign or unknown-domain handle in the current machine's process table; the record layer SHALL signal nothing, and an unavailable controller SHALL leave state unknown rather than infer death. Bodies SHALL cover PID reuse, an unrelated local process with the same PID as a foreign job, an unknown native handle, and a known local completed job as the positive control.
- WHEN a job's purpose ends or its ceiling is reached THE seat/controller path SHALL stop and collect the watcher as appropriate and record the actual outcome, without stopping the build or remote CI run it was observing. Bounded native notifications and waits SHALL remain supported; custom process polling SHALL use the bounded wait arm rather than an unbounded process-pattern loop. The record SHALL distinguish procedural controller actions from actions the arm itself can enforce, pinned by expiry and cancellation bodies.
- WHEN a necessary live watcher is transferred THE record SHALL name the intended successor and establish that the receiving controller can address the same job, retain the source owner until transfer is acknowledged, and leave one active coordination owner after acknowledgement. An unsupported or uncertain transfer SHALL remain pending without implying termination or authorizing a replacement writer. Bodies SHALL cover acknowledged transfer, interruption before acknowledgement, repeated transfer and an unsupported destination. This criterion requires no new cross-host transport.
- WHEN a milestone or seat release is assessed THE report SHALL reconcile registered jobs and available harness inventory, naming unregistered or unprobeable work where observable; an empty registry alone SHALL not prove quiescence. Unknown jobs SHALL prevent a clean-boundary claim, while a supported, explicitly acknowledged transfer SHALL be reported as live transferred work. Commands outside the registered launch path SHALL be labelled a procedural coverage limitation, not claimed as intercepted.
- WHEN a late notification arrives for ended work THE record SHALL update completion evidence without authorizing a new dispatch or restarting the job; repeated cleanup SHALL be idempotent and SHALL preserve unrelated jobs. The documented controller/record boundary SHALL remain compatible with attempt-owned reconciliation and with later consumption by the handoff arms and T-323.

## Implementation contract

Keep recording separate from signalling. Extend existing runtime records and seat/wait entry points rather than create another ledger. Execution-domain identity must distinguish controller namespaces; a hostname alone is not sufficient. Do not copy credentials into records or add a remote process service to satisfy this card. Legacy records lacking domain identity remain readable as uncertain and gain no implied local ownership.

The card's delivered API is registration, listing, reconciliation and supported transfer of seat jobs. Packet generation belongs to T-309; receiving a packet belongs to the proposed resume-seat card. Preserve every original lifecycle obligation through the canonical criteria above.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
