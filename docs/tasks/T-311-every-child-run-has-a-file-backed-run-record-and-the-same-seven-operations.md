---
id: T-311
title: "Every child run has a file-backed run record and the same seven operations, native subagent or foreign process, writer or read-only participant — start, observe, send, wait, collect, continue, stop — with an exclusive writer reservation per resource taken atomically before a writer launches, acknowledgements persisted from the harness's own output or from the child's file, and an uncertain record reconciled before any replacement"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: done
suggested_by: "ADR-025 decision 1, approved by the owner on 2026-09-12; card 2 of its plan; the recovery day of 2026-09-11, when two executors stopped at a quota and their state had to be reconstructed from their worktrees; the Codex orchestrator's review of 2026-09-12, which found the first draft would have refused the loop's own two-spawn bench"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/lane-protocol.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent, verifier phase 2, 2026-09-12

Guarded tier, two spawns. Measured on the bench `supertaskr-V-T-311`
detached at **a98e5a06**, base **f608f5fa**. Every figure below names the
ref it was taken at; the battery figures were taken BEFORE this verdict
commit and are not re-derived by it.

**The three sealed inputs, cited:**

- attack set — `sha256:2b29a2f9354b984c13dabb0f9e2620ec697e9477afddb5c678452619faf50da1`
- ground — `sha256:ba3885df5eca219f84f12f9a0c3f67252acb83289791038fe7cf762636204c7d`
- the card at f608f5fa — `sha256:4755a60a1e9e30cda9f889071549049bd075db08ec6a8b36f2f190429c0da052`

Each re-hashed on this bench against the saved file before a line of the
diff was opened; all three match the stamps file.

**The frame I actually had, stated rather than promised.** Two spawns, a
property of the spawn and not a discipline I kept: phase 1 wrote the
attack set at the base with no shell and no diff, and I am a fresh spawn
that has never held its frame. The brief's duties section named no
executor-derived specific — no mutant count, no path count, no suite
figure — so phase 1's blindness held above the line. Two disclosures I
owe anyway. First, I ran `git log --oneline f608f5fa..a98e5a06` while
orienting and therefore read two commit SUBJECTS before the diff body;
the attack set was already written and sealed, so nothing it contains was
shaped by them, but a later reader should know I saw them. Second, **the
brief carried no CONTEXT PACK** — it named the mode, the bench, the
sealed inputs and the card, and then instructed me to open
`docs/CONVENTIONS.md` at the sections the brief, the ground and
`docs/INDEX.md` name rather than end to end. My role file calls a brief
with no pack a dispatch fault whose remedy is to read the document whole
and say so. I followed the brief's own instruction instead of that
remedy, and I say so here: I read `docs/CONVENTIONS.md` only at the
sections the diff touches and at the build-and-test bullets, never end to
end. **PACK GAP, named as one.** It cost me nothing I can identify — the
gates the diff implicates all ran — but it is the dispatcher's to close.

---

### The battery, at a98e5a06, whole as the guarded tier keeps it

`node tools/e2e/scripts/gate-run.mjs parser app rust e2e`, from
`tools/e2e/`, `SUPERTASKR_E2E_PORT=15311`, exit **0**:

| suite | exit | bodies | targets | verdict |
|---|---|---|---|---|
| parser | 0 | 389 | 1 | GREEN |
| app | 0 | 1171 | 1 | GREEN |
| rust | 0 | 655 | 18 | GREEN |
| e2e | 0 | 1039 | 1 | GREEN |

**The count moved by exactly what was claimed, which is the control the
attack set reserved for this.** The ground records e2e at **1022** bodies
at the base; 1039 − 1022 = **17**, and the diff adds sixteen bodies to
`run-record.spec.ts` and one to `brief.spec.ts`. `brief-flush.spec.ts`
gained twelve NOT_AN_ARM entries and no body, which is why it adds none.
So no new body is skipped, `.only`-ed or outside the runner's glob.

`node tools/e2e/scripts/docs-gate.mjs` over the four fenced paths: exit
**0**. It reports `budget WARN — docs/CONVENTIONS.md is 156380 bytes
against its 146878-byte warn line`; the warn predates this lane (the
ground records the file already past the line at the base) and the lane
filed T-311-s3 for it rather than deleting a hazard to fit. That is the
right move and I do not hold it against the diff.

---

### A row per acceptance criterion, with the evidence that decided it

| # | criterion | verdict | the evidence that decided it |
|---|---|---|---|
| 1 | one record per attempt carrying every field; the writer's exclusive reservation taken ATOMICALLY before launch; a participant takes none; a body runs an executor and a tool-less phase one for one card at once | **MET, with correction 1 on the word `atomically`** | `run-record.spec.ts:165` — two records coexist for one card, `writer` true/false, `reservation` null for the participant, the reservation file names the executor, and the control shows a second WRITER refused `RESOURCE_RESERVED` while the participant is not. `:230` refuses the assignment field by field with `none` typed. `:981` pins one JSON document per attempt under the runs directory. The fields are populated from distinct real sources — the brief digest computed from the brief's bytes (`sha256:` + 64 hex asserted), harness/model/effort asserted as three separate values, and the permission boundary DERIVED from the fence manifest rather than typed. **But `atomically` was pinned by nothing**: see finding 1. |
| 2 | bind by the harness's task or session id before `started`; a body interrupts between reservation and bind, shows no second writer can start, and shows the attempt RECONCILED rather than assumed stopped | **MET** | `:267` — a started record is `reserved` before any bind, an empty id refuses, one harness id cannot serve two live attempts (`BIND_ID_TAKEN`) with a different-id control. `:314` is the interrupt in its real shape: `start` returned and nothing else ran. A second writer is refused; `reconcile` answers `undetermined`, NOT `ended`; `stopRun` refuses `STOP_UNCERTAIN`. The attack set's sharpest prediction here (A2.5 — reconcile early-returning `unknown` for an unbound attempt, leaving a reservation nothing can ever move) **does not land**: `reconcile` names the un-probeable source explicitly and the body drives the way out — the seat's own reading of its harness, `RUN-DONE gone`, establishes termination, the record is `stopped`, the reservation is gone and a replacement starts. |
| 3 | a question recorded with its id; the answer moves written → delivered → acknowledged with the evidence of each; a tool-less phase one's acknowledgement from its own OUTPUT; an interrupt after delivered re-delivers on continue; a post-stamp grant refused, requiring a fresh attempt | **MET** | `:376` — delivery before writing refuses (`SEND_NOT_WRITTEN`), the three states are asserted one at a time, `acknowledgedAt` is null after delivery, the acknowledgement is taken from the HARNESS OUTPUT and the evidence kinds are asserted in order `["written","delivered","acknowledged: harness-output"]` with the original text retained. `:434` drives a REAL child process: delivered survives the continue as `delivered`, `redeliveries` becomes 1, and the control shows an acknowledged answer re-delivered NOT AT ALL. `:479` reads the stamp off the card IN THE RESOURCE and the boundary off the fence manifest, passes the ordinary mid-build widening, and refuses `GRANT_AFTER_STAMP` for both `send` and `continue` once the card is stamped. **A3.4/S-5 (an acknowledgement the arm reads back from its own instruction) is addressed at the source**: the token is LINE-INITIAL and `answerBlock`'s own instruction spells it mid-line. The lane's notes say a body caught that; I confirm the guard is in the regex, not the prose. |
| 4 | collect for finished, failed and stopped alike; stop that task only, owned jobs confirmed gone, never the shared harness process | **MET** | `:538` — finished and failed both collected with `usage: "unknown"` PRESERVED rather than rounded to 0 (P-9's demand), partial refs collected, `COLLECT_NOT_TERMINAL` refused before terminality, and the stopped run collected with its own usage. `:591` — a live child refuses `STOP_NOT_TERMINATED`; an owned PORT still listening holds the stop even after the process is gone; only then is `stopped` written. The negative half — A4.4's "what was signalled?" — is answered **structurally rather than by a spy**, which is stronger: the module holds NO path that could signal, asserted by a source read for `process.kill(`, `.kill(`, `SIGTERM`, `SIGKILL`, `pkill`, and a record naming this process or its parent refuses `STOP_SHARED_HARNESS` by name. A4.5/S-6 (pid reuse) is answered by recording the process START TIME beside the pid and comparing it, and `isRecordablePid` refuses 0 and −1 — the two pids the ground measured as reaching a process group and every process this user may signal. |
| 5 | reconcile before any replacement; ONE body showing both halves; a reservation that can never be released fails the second | **MET** | `:676`, driven by a real child process against the PRODUCTION `reconcile` with `defaultRunIo` — so P-4's predicted degeneracy (two bodies that never constrain one implementation) **does not land**: the same function, the same io, the same record, before and after the child exits. Live ⇒ `live` and `CONTINUE_PRIOR_LIVE`; gone ⇒ `ended`, the replacement takes a NEW attempt id, keeps the history and the resource moves to it. A5.2's timeout-based liveness is absent: nothing in `reconcile` reads a clock. |
| 6 | a process child blocked on a question keeps its reservation and resumes only after the prior execution ended, in that order; a second body for release, atomic reacquisition and the refusal | **MET** | `:727` drives TWO real child processes end to end: the first asks and exits, the assignment is `blocked` (not `finished`) with the execution ended and the reservation STILL HELD — which is A6.4's predicted collision between AC-5 and AC-6, and it does not land, because `observeRun` keys `blocked` on the unacknowledged QUESTION rather than on liveness. The second process reads the answer (exits 3 if it cannot), acknowledges from its own FILE, completes, and only then is the reservation released. `:794` covers the reacquisition and `CONTINUE_RESOURCE_TAKEN`. |
| 7 | the protocol names the record; the flush guard knows the new verbs; the method version bumps with note and evaluation block; no adapter, daemon, heartbeat or scheduler | **MET, the version clause carried to the merge** | `:949` pins the protocol section and asserts it is PRODUCT-AGNOSTIC (it may not spell `.supertaskr`) while the project's own spelling exists in CONVENTIONS — two halves of one rule rather than a gap. `:903` asserts the operation set, refuses a stray dial, and reads the source for `setInterval(`/`setTimeout(`/`setImmediate(` — so A7.5's "poll loop with a nice name" cannot enter. The flush guard is armed IN BOTH DIRECTIONS: I dropped `--replace` from `brief.mjs`'s `FLAGS` literal and `brief-flush.spec.ts` went **1 failed / 5 passed**. The method version is NOT bumped in this lane and should not be — the ground records the bump as the integrator's write at the merge, and `merge.mjs` step `bump:owed` refuses a merge that touches `method/` with no `--bump <old>..<new>`. **The integrator owes that bump with its release note and evaluation block; the gate that enforces it is armed, and this row is the reason it must not be waved.** |

---

### The drill, read from `git diff` and never from a mutator's report

Every mutant below was planted by hand, its landing confirmed with `git
diff`, drilled with `gate-run.mjs e2e --owning tools/e2e/scripts/run-record.mjs`
(16 bodies at the tip), and reverted with `git checkout --`.

| mutant | what it changes | reading |
|---|---|---|
| M-1 | `openSyncExclusive` becomes `existsSync` then `openSync(file, "w")` | **SURVIVED — exit 0, 16 bodies GREEN** |
| M-5 | `sendAnswer` sets `acknowledged` on delivery | KILLED — 2 failed / 15 passed (`:376`, `:434`) |
| M-D4 | `--replace` dropped from `brief.mjs`'s frozen `FLAGS` | KILLED — `brief-flush.spec.ts` 1 failed / 5 passed |

M-5's two kills are not a containment failure: neither body's kill set
contains the other, because `:376` asserts the three states and their
retained evidence and `:434` asserts the re-delivery a lost
acknowledgement owes. They are different clauses of criterion three.

---

### FINDING 1 — the word `atomically` was pinned by nothing (correction 1, committed)

**The implementation is correct and the guard was missing, which is the
harder of the two to see.** `takeReservation` really is one
`openSync(file, "wx")`, held in its own named function. But every body in
`run-record.spec.ts` takes its reservations ONE AFTER ANOTHER, and a
check-then-write refuses a second caller exactly as an exclusive create
does when nothing is concurrent. So no body could tell the two apart, and
M-1 — the T-247 race with a smaller window rather than with none — passed
the whole suite. This is the attack set's pre-commitment P-1, landing.

**The correction is a body, and it is committed on this bench after this
verdict.** It has two halves and the reason for each is a measurement I
took on this host before writing a line of it.

The **deterministic half is a dangling symlink**, because the two
primitives disagree about exactly one thing on this platform. Measured at
the bench: `existsSync` FOLLOWS a dangling link and answers `false`,
while `open(O_CREAT|O_EXCL)` refuses to follow one and throws `EEXIST`,
and `open(O_CREAT)` follows it and writes through to the target. So with
a dangling link planted at the reservation path, an exclusive create
REFUSES the reservation and a check-then-write sails past it and writes
the reservation outside the reservations directory altogether. That is a
real property, not a grep for a flag.

The **second half is a real race**, because the property is about
concurrency and a body that never runs two writers at once has measured a
syscall rather than a race. Twelve processes pre-warm, spin on a barrier
and reach for one resource at one instant; exactly one may hold it.

**AND I OWE THE CONTROL I PROPOSED, SO HERE IS WHAT IT COST ME TO GET
IT RIGHT.** My first version of this body was the race alone, and it
**PASSED under M-1** — 17 bodies green, the mutant alive. The reason is
worth writing down: each racer did a different amount of first-time work
AFTER the barrier (arming the runtime directory, creating the
reservations directory, the first pass through the code path), which
spread twelve processes over milliseconds — far wider than the window a
check-then-write opens. A standalone harness that raced a bare
check-then-write with no warm-up had separated cleanly (one holder in
10 rounds of 10 for `wx`; three to ten for the check), and I nearly
shipped that measurement as evidence about THIS code. Pre-warming each
racer and, more importantly, adding the deterministic symlink half is
what made it a control. **The first form of this control could not fail,
and I found that by running it rather than by reasoning about it.**

Readings, both ways, on this bench:

- **RED** against an implementation lacking the property (M-1 planted):
  exit 1, **1 failed / 16 passed**, and the failing body is mine —
  `Error: the reservation is an existence check in front of a write: it
  followed a link \`existsSync\` could not see and wrote the reservation
  outside the reservations directory`. The kill set is exactly one body
  and it contains no other, which is what makes it load-bearing rather
  than a restatement.
- **GREEN** against the implementation as the lane wrote it: exit 0,
  **17 bodies**.

```mutant
correction: the reservation's atomicity is pinned by nothing
file: tools/e2e/scripts/run-record.mjs
spec: tools/e2e/tests/run-record.spec.ts
body: the reservation is the EXCLUSIVE CREATE ITSELF, not an existence check in front of a write — the one place a check-then-write and an `O_EXCL` open answer differently
message: the reservation is an existence check in front of a write
--- old
function openSyncExclusive(file) {
  return openSync(file, "wx");
}
--- new
function openSyncExclusive(file) {
  if (existsSync(file)) throw Object.assign(new Error("EEXIST"), { code: "EEXIST" });
  return openSync(file, "w");
}
```

---

### FINDING 2 — an attempt id and a work id reach `path.join` unvalidated (correction 2, body NOT committed, and the shortfall is explained)

This is the security sweep's finding, and it is concrete and
reproducible. `workOf`'s pattern is `/^(.+)-a\d+$/`: everything before
the suffix is accepted, including a path. Measured at a98e5a06 on this
bench:

    recordPath("/tmp/ROOT", "../../../etc/evil-a1")  ->  "/etc/evil-a1.json"
    recordPath("/tmp/ROOT", "../../escape-a1")       ->  "/tmp/escape-a1.json"

The id reaches that path from two places: `--attempt <id>` on the command
line, which `runPlan` passes to `workOf` for SHAPE but not for charset;
and the assignment document's `id` field, which `readAssignment` accepts
as any non-empty string and `nextAttemptId` turns into `<id>-a<n>`. A
record then lands outside `.supertaskr/runs/` entirely — which is both a
write outside the runtime directory and, more mundanely, a record nobody
will ever find again, in a module whose entire purpose is that a record
can be found again.

**I considered REJECTED and did not rule it, and the reasoning belongs in
the verdict rather than in my head.** My role file puts security findings
at REJECTED level, and a path traversal on a new input path is squarely
that shape. What holds me back is the trust boundary, which this lane
actually got right where it matters: the one id an untrusted party
writes — the question id a CHILD puts in its ask file — IS validated, by
`ID_PATTERN` (`[A-Za-z0-9][A-Za-z0-9._-]{0,63}`), it is matched only
line-initially, and it never reaches a path. The two unvalidated ids are
both typed by the SEAT, into its own checkout, where it could write the
same file directly. No privilege boundary is crossed. So this is a
hardening gap and a violation of the module's own stated doctrine —
refuse rather than guess — rather than an exploitable hole, and a
correction is the proportionate answer. A reader who disagrees with that
line has everything needed to disagree with it.

**The change it asks for** is a charset on both ids, in the two places
the module already refuses things:

    workOf:         /^([A-Za-z0-9][A-Za-z0-9._-]{0,127})-a\d+$/
    readAssignment: refuse an `id` that does not match /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

**The body is written and drilled both ways, and it is NOT committed.
The shortfall is deliberate and this paragraph is it.** A body committed
here would be RED at this bench's tip by construction, because the
property is one the implementation does not yet carry; a red body cannot
be re-drilled by the merge's step 2b, and it would stop the merge verb
without telling the integrator what stopped it. So the body below is
handed over as the acceptance test the fix must turn green, and it
carries **no mutant block** — there is no site to mutate until the
validation exists. Two corrections, one block, and that is why.

Readings, both ways, on this bench:

- **RED** at a98e5a06 as the lane wrote it: exit 1, **1 failed / 17
  passed**, `Error: the attempt id "../../../etc/evil-a1" reached the
  filesystem unvalidated`.
- **GREEN** with the two-line charset above added to `run-record.mjs`:
  exit 0, **18 bodies**. The validation was reverted immediately and is
  not in this bench's tree.

The body:

```ts
test("an attempt id and a work id are a CHARSET, never a path fragment — an id that would leave the runs directory is REFUSED", () => {
  const b = bench("id-charset");
  try {
    for (const id of ["../../../etc/evil-a1", "../escape-a1", "/absolute/evil-a1", "runs/../../escape-a1", "a b-a1"]) {
      let refused: unknown;
      try { recordPath(b.root, id); } catch (err) { refused = err; }
      expect(refused, `the attempt id ${JSON.stringify(id)} reached the filesystem unvalidated`).toBeInstanceOf(RunRecordFinding);
    }
    let started: unknown;
    try {
      startRun(b.root, { assignment: assignment(b, { id: "../../../tmp/evil" }), at: "2026-09-12T00:00:00.000Z", io: io() });
    } catch (err) { started = err; }
    expect(started, "an assignment whose work id is a path fragment started a run").toBeInstanceOf(RunRecordFinding);
    // THE POSITIVE CONTROL: the ids this project actually uses still resolve, INSIDE the runs directory.
    const runs = path.join(b.root, ".supertaskr", "runs");
    for (const id of ["T-311-a1", "T-311-s4-a12", "T-900-a1"]) {
      expect(recordPath(b.root, id).startsWith(runs), `${id} does not resolve under the runs directory`).toBe(true);
    }
    expect(
      startRun(b.root, { assignment: assignment(b), at: "2026-09-12T00:00:01.000Z", io: io() }).record.attempt,
      "the control assignment could not start",
    ).toBe(`${WORK}-a1`);
  } finally { b.cleanup(); }
});
```

---

### The rest of the security sweep, and what held

No dependency was added; `package.json` is untouched in this range. No
secret, token or environment value is copied into a record — the brief's
DIGEST is stored and not its bytes, which S-8 asked for. The one probe
that shells out is `lsof` with an argv array and no shell. Three things I
attacked and did not fail the diff on, recorded so the next reader does
not have to find them again:

- **S-4, injection through the ask file into a prompt.** The arm takes no
  action because of ask-file content beyond recording a question id and
  matching an acknowledgement id; question TEXT is never rendered into
  any prompt by this module. The answer text this arm writes is the
  SEAT's own, appended verbatim — so a seat that wrote a line-initial
  `RUN-ACK <id>` into its own answer would acknowledge on the child's
  behalf. The arm's own instruction line is safe by construction (the
  token is mid-line), and the untrusted half is handled; I name the seat
  half as a sharp edge rather than a defect.
- **`releaseReservation` removes an UNREADABLE reservation file.** When
  the JSON does not parse, `readReservation` answers `null`, the
  ownership check is skipped and the file is removed. `releaseIfOurs`
  is safe (it returns early on `null`), so the reachable route is
  `continue --replace` and `start`'s failure path, both acting on their
  own resource. Narrow, but it is "unreadable treated as absent" on the
  one file that decides who may write a lane. Filed as **T-311-s4**
  rather than folded in here.
- **`reservationPath` resolves but does not realpath.** `path.resolve`
  normalises `.`, `..` and a trailing slash — I measured all three
  collapsing to one reservation file — but a symlinked spelling of one
  resource is two reservations. The ground records the only live symlink
  on this host as `/tmp → /private/tmp` and nothing under `~/Projects`
  symlinked, so this is latent rather than live, and canonicalising a
  path that may not exist has its own failure mode. Not a defect at this
  ref; worth knowing.

And one clause I will not claim was tested, because the attack set
pre-committed me to saying so (P-6): **"the operations must be usable by
T-312 and T-316 without change" is a forward claim.** What exists is
better than the fake adapter I demanded — the process path is driven end
to end by REAL child processes through question, exit, answer, resume,
acknowledgement, completion and release, and the probes are injected
through `RunIo` — but no adapter-facing interface type is declared, so
nothing at this ref can falsify "without change". Recorded as evidenced
in part and unfalsifiable in the rest, not as passed.

### The declared surface

The diff touches the eight paths `touches` names, plus the card and three
`status: suggested` cards filed under step 6. There is no `In-fence
follow-through` heading in the notes and I found no change that would
have needed one: the `dispatch-brief.mjs` widening of `AwaitPlan`'s kind
is what `waitRun`'s reuse of the bounded-wait loop requires, and the
`--ceiling` message in `brief.mjs` moved because a third arm now reads
it. No undeclared surface.
