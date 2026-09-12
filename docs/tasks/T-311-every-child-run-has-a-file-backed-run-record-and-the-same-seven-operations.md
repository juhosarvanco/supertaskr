---
id: T-311
title: "Every child run has a file-backed run record and the same seven operations, native subagent or foreign process, writer or read-only participant — start, observe, send, wait, collect, continue, stop — with an exclusive writer reservation per resource taken atomically before a writer launches, acknowledgements persisted from the harness's own output or from the child's file, and an uncertain record reconciled before any replacement"
feature: F-04
milestone: 4
size: L
priority: 1
status: planned
suggested_by: "ADR-025 decision 1, approved by the owner on 2026-09-12; card 2 of its plan; the recovery day of 2026-09-11, when two executors stopped at a quota and their state had to be reconstructed from their worktrees; the Codex orchestrator's review of 2026-09-12, which found the first draft would have refused the loop's own two-spawn bench"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/lane-protocol.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

A child's assignment is recorded in several places (the dispatch stamp, the brief file, the seat's ledger) but in no single recoverable state. The loop deliberately starts two children at once for one card, the executor and the tool-less phase-one verifier, and a consultation starts several; only the executor writes the lane. The seat waits on a child with the bounded wait arm (T-298) and learns of its end from the harness's notification; a native child's questions arrive in its output, a process child's in the ask file; nothing records who was started for which attempt, and nothing prevents a second writer for one lane while the first still runs (the T-247 race). A scope grant after the stamp is applied by a fresh executor by rule, and nothing enforces it.

### The two things a record separates

- **The work served** (a card, a consultation) from **the resource the child may write** (a lane worktree or clone, a bench). Every child has a record; only a child granted write ownership of a resource takes that resource's exclusive writer reservation. A read-only participant (phase one, a consultation participant, a reviewer) has a participant record and no reservation, so an executor and a tool-less phase one for the same card run concurrently, as today.
- **A native child** (spawned by the seat's own harness; the seat performs the spawn and the arm binds the attempt to the harness's task or session id) from **a process child** (launched by the arm through an adapter, T-312 and T-316). Both have the same record and the same operations; the capability mapping below says how each is done.

### The operations, each with its success result and its refusal

| operation | native child | process child | refusal |
|---|---|---|---|
| start | the arm reserves the resource (writers only) and writes the record `reserved`; the seat spawns; `--run bind` attaches the harness's task or session id and the record becomes `started` | the arm reserves, launches through the adapter, attaches session id and process identity, `started` | the resource already reserved; an assignment the adapter cannot honour; a bind that names an id already bound |
| observe | derived from the lane's ask file, stamps and marker, and the harness's task state | the same, plus the process table | never a heartbeat; an unknown state is `unknown`, not `running` |
| send | the answer is written to the ask file bound to attempt id and question id (`written`); delivered through the harness's message to that task (`delivered` when the harness confirms receipt) | written to the ask file; `delivered` when the child's next read is evidenced, or when the child is continued with the answer as its prompt | a send to an attempt that is not `running` or `blocked`; a scope grant after the stamp, which requires a fresh attempt |
| wait | `reserved`, `started`, `running`, `blocked` (an unacknowledged question), `finished`, `failed`, `stopped`, `unknown` | the same | a ceiling reached is reported, never treated as finished |
| collect | the final output, the usage or `unknown`, the resulting ref, the report's path — for finished, failed and stopped runs alike | the same from the adapter's stream and files | a collect before the state is terminal |
| continue | resume the same task after confirming the prior execution and its owned jobs ended, retaining its reservation or atomically reacquiring a released one; or an explicit replacement attempt | the same checks, then `resume` through the adapter with the session id; or a replacement | uncertain prior execution; another attempt owns the resource; the assignment or a post-stamp scope grant requires a fresh executor |
| stop | the harness's own stop for that task id, never a signal to the shared harness process; owned background jobs (a detached suite, its port) confirmed gone | the process and its owned jobs confirmed gone | `stopped` is written only after termination is established |

Acknowledgement: for a native child the acknowledgement is received in the harness's own output or events and the arm persists it with the original evidence retained; for a process child the child writes its acknowledgement line into the ask file. An answer `delivered` whose acknowledgement is lost stays `delivered`: it is re-delivered on continue and never assumed acknowledged.

Execution and assignment are separate facts. A confirmed launch becomes `started`; evidence
that it is executing makes it `running`. A child that ends its turn or process with an
unanswered question leaves the assignment `blocked`, with the question and the ended
execution recorded. Process exit alone never means `finished`. An answer may therefore be
sent to that blocked attempt and delivered in the resumed session's prompt. Its
acknowledgement returns the assignment to `running`. `finished` requires the assignment's
completion evidence and confirmation that the execution and its owned jobs have ended;
failure and explicit stop similarly retain their outcome evidence. Uncertain termination
is `unknown`, not a terminal state that releases ownership.

Reservation: a blocked writer retains its reservation, including while its process has
ended awaiting an answer. A record becoming `finished`, `failed` or `stopped` releases the
reservation. An authorized `continue` may resume the same attempt after atomically
reacquiring its released resource, but only if the previous execution and owned jobs have
ended, the assignment still permits resumption and no other attempt owns the resource.
The record retains earlier execution identities, outcomes and usage when binding the
resumed execution; continuation does not erase history. Read-only participants require no
writer reservation but still obey termination and independence checks. A record left
`unknown` is RECONCILED before any replacement, from the harness's task state, the process
table, the lane's marker and git state. Once termination is established, the arm records
the supported outcome and may release ownership; otherwise no replacement starts and the
record says why. A scope grant after the stamp still requires a fresh executor attempt.

### Acceptance criteria

- WHEN a child is started for a lane THE arm SHALL write one run record per attempt carrying the attempt id, the work served, the resource it may write or `none`, the role, the base ref, the brief's path and digest, harness, model and effort as separate fields, the working directory and its permission boundary, the deadline and the authorized budget, and the state; a writer SHALL take the resource's exclusive reservation atomically before its launch; a read-only participant SHALL take none; a body SHALL run an executor and a tool-less phase-one verifier for one card concurrently under two records.
- WHEN a native child is spawned by the seat THE arm SHALL bind it to its reserved attempt by the harness's task or session id before the record becomes `started`, and a body SHALL interrupt between the reservation and the bind and show no second writer for that resource can start and the attempt is reconciled, not assumed stopped.
- WHEN a question is asked THE arm SHALL record it against the attempt with a question id, the answer SHALL move through written, delivered and acknowledged with the evidence of each retained, a tool-less phase one's acknowledgement SHALL be taken from its own output, and a body SHALL interrupt after delivered and before acknowledged and show the answer re-delivered on continue; a grant after the stamp SHALL be refused for a resumed attempt and require a fresh one.
- WHEN a child ends in any terminal state THE arm SHALL collect its output, usage or `unknown`, partial refs and report for finished, failed and stopped alike; WHEN a child is stopped THE arm SHALL stop that task only, confirm its owned jobs are gone, and never signal the shared harness process.
- WHEN an attempt's state is uncertain THE arm SHALL reconcile before any replacement, a body SHALL show both properties: no second writer while the first might exist, and resumption once termination is established; a reservation that can never be released fails the second.
- WHEN a process child exits after asking a question THE assignment SHALL remain `blocked`, retain its writer reservation if any, accept an answer through `send`, and resume that session only after the previous execution and its owned jobs have ended; a body SHALL cover question, process exit, answer, same-session resume, acknowledgement, assignment completion and reservation release in that order. A second body SHALL cover an authorized continuation after release, successful atomic reacquisition, and refusal if another attempt acquired the resource first.
- WHEN this card lands THE lane protocol SHALL name the run record as the contract every child runs under, the flush guard SHALL know the new verbs, and the method version SHALL bump with its release note and evaluation block. No adapter is built here; the operations must be usable by T-312 and T-316 without change. No daemon, no heartbeat, no scheduler.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
