---
id: T-311
title: "Every child run has a file-backed run record and the same seven operations, native subagent or foreign process, writer or read-only participant — start, observe, send, wait, collect, continue, stop — with an exclusive writer reservation per resource taken atomically before a writer launches, acknowledgements persisted from the harness's own output or from the child's file, and an uncertain record reconciled before any replacement"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: building
suggested_by: "ADR-025 decision 1, approved by the owner on 2026-09-12; card 2 of its plan; the recovery day of 2026-09-11, when two executors stopped at a quota and their state had to be reconstructed from their worktrees; the Codex orchestrator's review of 2026-09-12, which found the first draft would have refused the loop's own two-spawn bench"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/lane-protocol.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

### The criteria echo, written before a line of the implementation

One line per acceptance criterion, in my own words, read off the card
and nothing else.

1. `start` writes ONE record per attempt carrying every field the
   criterion enumerates, a writer takes the resource's exclusive
   reservation ATOMICALLY before it launches, a read-only participant
   takes none, and a body runs an executor and a tool-less phase one
   for one card at the same time under two records.
2. `bind` attaches the harness's task or session id BEFORE the record
   becomes `started`, and a body interrupts between the reservation and
   the bind, shows no second writer for that resource can start, and
   shows the attempt RECONCILED rather than assumed stopped.
3. A question is recorded against the attempt with its own id; the
   answer moves written, delivered, acknowledged with the evidence of
   each retained; a tool-less phase one's acknowledgement comes from its
   own output; a body interrupts after delivered and before
   acknowledged and shows the answer re-delivered on continue; and a
   scope grant arriving after the stamp is REFUSED for a resumed
   attempt and requires a fresh one.
4. `collect` gathers the output, the usage or `unknown`, the partial
   refs and the report for finished, failed and stopped alike; `stop`
   stops that task only, confirms the owned jobs are gone, and never
   signals the shared harness process.
5. An uncertain state is RECONCILED before any replacement, and one
   body shows both halves: no second writer while the first might
   exist, and resumption once termination is established. A reservation
   that can never be released fails the second half.
6. A process child that exits after asking stays `blocked`, keeps its
   writer reservation, accepts an answer through `send`, and resumes
   only after the prior execution and its owned jobs have ended — one
   body covering question, exit, answer, same-session resume,
   acknowledgement, completion and release IN THAT ORDER; and a second
   body covering an authorized continuation after release, the atomic
   reacquisition, and the refusal when another attempt got the resource
   first.
7. The lane protocol names the run record as the contract every child
   runs under, the flush guard knows the new verbs, and the method
   version bumps with its release note and evaluation block (the bump
   is the merge's write, not the lane's). No adapter is built here, the
   operations stay usable by the two adapter cards without change, and
   there is no daemon, no heartbeat and no scheduler.


### What was built, and where each half lives

`tools/e2e/scripts/run-record.mjs` is the module: the record shape, the
eight states, the reservation, the six probes and every refusal, each
carrying a greppable CODE so a caller never has to match on a sentence.
`brief.mjs` gains ONE arm, `--run <verb>`, which parses the verb, refuses
a dial the verb does not read, calls the module and renders the record.
The header's writer count moved with it: the file says an arm that starts
writing has to move that count, and this is the fifth writer.

`method/lane-protocol.md` gains the section the card asks for — the run
record as the contract every child runs under, product-agnostic as that
file's own opening requires — and `docs/CONVENTIONS.md` carries the half
that file leaves to a project: where records live, what an assignment
must carry, the verbs and the exit codes.

### The decisions a reader would otherwise have to reconstruct

**THE ASSIGNMENT IS A DOCUMENT, NOT ELEVEN FLAGS.** What was missing was
a single recoverable state, so the eleven fields arrive as one JSON file
whose every field is required and whose missing field is a refusal that
names it. The word `none` is legal for the resource, the deadline and the
budget and must be TYPED: a defaulted budget is an unauthorised budget.

**THE RESERVATION IS AN EXCLUSIVE CREATE AND NOTHING ELSE.** One
`openSync(file, "wx")`, held in its own named function so the line the
whole atomicity rests on is greppable. A check-then-write would answer
the race with a smaller window rather than with none.

**THE ATTEMPT ID CARRIES ITS OWN WORK** — `<work>-a<n>` — so every verb
but `start` needs one flag to find a record, and two flags can never
disagree about which record is meant.

**A TOKEN IS LINE-INITIAL, AND THAT RULE WAS BOUGHT BY A BODY.** The
answer this arm writes into the ask file tells the child, in prose, which
line to write back. Without the line-initial rule the arm read its OWN
instruction back as the child's acknowledgement and marked an answer
acknowledged that nobody had read — which is exactly the assumption the
card forbids. The body that caught it is the one that asserts the
acknowledgement came from the harness's output rather than the file.

**THE THIRD COMPLETION VALUE IS `gone`.** `ok` and `failed` are the
assignment's outcome; `gone` says only that the execution is not there
any more, which is what a seat can honestly report when its harness lists
no such task. Without it an unbound attempt is a deadlock: a replacement
needs termination established, and a seat with no probe could never
establish it.

**AN UNBOUND ATTEMPT IS NOT `ended`.** The spawn happens BETWEEN the
reservation and the bind, so a record reading `reserved` with no
execution is the one moment a live child is invisible. Reading it as
un-started would authorise a second writer exactly there. It reconciles
as undetermined, and the way through is the seat's own reading of its
harness, passed as evidence.

**THIS ARM SIGNALS NOTHING.** A stop is the record of a termination that
has been established; the harness's own stop for that task is the seat's
act. A body asserts the module holds no path that could signal, and a
second refuses a record naming this process or its parent by name.

### For the verifier

- The native path is driven by the verbs with an INVENTED task id, and
  the process path by REAL child processes that end themselves. Each body
  says which it drives; no body sends a signal to anything.
- The stamp and the permission boundary are READ off the resource — the
  card in it and the fence manifest in the working directory — never
  typed into the assignment, so the grant-after-stamp refusal is derived.
- The bodies are split on purpose: the record, the states and every
  refusal are the module's spec, and the one body in the command's spec
  is the WIRING — that the arm parses a verb, performs it against the
  root it was handed, keeps a world refusal apart from a usage refusal,
  and will not share an invocation with another arm.
- The whole suite ran once at the tip of the code-and-notes commit. The
  drill is one mutant per body added, each shown red with its kill set
  and restored by hash; the report carries the block.

### What was noticed and NOT done

- The dispatch ritual does not yet OPEN a record and the merge does not
  close one: a seat has to run `--run start` beside the dispatch by hand.
  Filed as T-311-s1.
- Nothing enumerates the live attempts. The records are the roster on
  disk and `allRecords` reads them, but no verb prints it, so a seat that
  lost its session still has to list a directory. Filed as T-311-s2.
- `docs/CONVENTIONS.md` was already past its byte WARN line at this
  lane's base and this card adds a bullet to it. Filed as T-311-s3.
- The behaviour census and the generated index go stale the moment a new
  spec file lands, and both documents are outside this fence: the
  regeneration is the merge commit's step, as the state document says.

## Verdicts
