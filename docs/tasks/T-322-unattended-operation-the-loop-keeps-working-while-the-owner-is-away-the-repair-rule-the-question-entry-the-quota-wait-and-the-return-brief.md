---
id: T-322
title: "Unattended operation: the loop keeps working while the owner is away — a rejected lane or a CI red becomes a repair dispatched inside the approval mode's scope, a decision the coordinator may not make becomes a question entry in its room while every unrelated card continues, a quota refusal becomes a wait and a retry, and the owner returns to one return brief naming what merged, what was parked and why, and what awaits a ruling"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 2
status: verifying
suggested_by: "the architect seat on 2026-09-13, from the owner's question the same evening about leaving the computer for hours; filing authorizes no development"
blocked_by: [T-324]
touches: [method/roles/orchestrator.md, method/rooms/ROOM-FORMAT.md, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/run-record.spec.ts, tools/method-evals/evals, docs/CONVENTIONS.md, tools/e2e/tests/brief-flush.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-13 the owner asked what happens when they leave the computer for five hours and a lane fails or a CI run reds: the fix must not wait for them. Under the loop as it stands, the standing authorization of 2026-09-12 told the seat to STOP at a rejected verdict, a spawn refused for quota, a record that must be shown before appending, and the in-card decisions; the seat filed the fix for the CI red at 8d26c8c5 (T-314-s6) and then waited for a word before promoting it. Everything that keeps the loop going in the owner's absence is today the seat's judgement and its ledger: which failure produces which repair, which decision may wait, what to do when a spawn is refused, and what to tell the owner on return. Four pieces of the architecture carry that instead. The approval mode and its scope (T-319, as amended the same evening) say which dispatches need no yes — the listed cards, or the listed cards and the repairs the work produces. The repair rule says what a failure produces: a REJECTED verdict is re-entered with the verdict as the executor's input, and a CI red on a body the merge added is attributed by name from the runner's log and filed as a repair card at priority 1 in the order's next slot. The question entry says where a reserved decision goes while the owner is away: the seat's QUESTION in the relevant room, marked as the seat's and never as a ruling — the ruling entry still waits for the owner's yes (T-307) — with every card that does not depend on it continuing and the dependent ones NOT STARTABLE with the question named. The return brief is the one page the owner reads on return: what merged with its CI conclusion by name, what was parked and why, the question entries awaiting a ruling, the lanes live, the repairs dispatched under the scope, each with its ref. Two operational facts belong in the conventions rather than in a body: the host must stay awake for the seat to run (the loop runs on the owner's machine), and a seat whose session dies is resumed by a replacement seat from the run record and the ledger (ADR-025). The wait verb exists (T-298); what is missing is the rule that a quota refusal is waited out and retried rather than stopped on, now that the owner has removed the budget limitation.

## The consolidation of 2026-09-14

On the owner's permission of 2026-09-14 to the shape the Codex orchestrator's pre-dispatch review asked for, the effective contract is consolidated into the canonical section below (the instruments read only that section). The subject as of this date: attribution before action; a progress rule that continues on evidence and parks on repetition, with a wake condition; a shared-health check specific to the proposed action; the quota wait's live route with a fake-clock acceptance; the question entry with its identifiers in the room, read by the dispatch order; and the return brief derived from existing records only. Blocked by T-324, the admission lifecycle. The dead coordinator's recovery stays T-323's. Every earlier bullet and the amendment of 2026-09-14 are kept under the History section.

Corrected the same day after the Codex orchestrator's review of the drafts (T-319-T-324-T-322-effective-contracts-codex-review-2026-09-14.md): infrastructure failures split into transient (wait and retry), needing action (authorized remedy or a parked resource with a wake, never a rerun on an unchanged condition) and unresolved; the quota retry as a scheduled instant the coordinator revisits while working, with the wait implementation's owning file (dispatch-brief.mjs) in the fence; the question state holding the lane cut and not only the display; the push evidence named as the runner's runs, with unknown as the honest answer where none exists. The former historical heading is renamed so the preflight's any-depth criteria rule does not re-enter it; the previous wording of this section is in the commit history.

## Acceptance criteria

- WHEN a lane's verdict is REJECTED, or a CI run on main reds, THE coordinator SHALL attribute before acting and SHALL record the attribution: an attributed regression (the failing bodies from the run's own log against the newest earlier run whose tested ref is an ancestor of the tip, and the diff between the two refs; where no such run exists, a bounded reproduction of base and candidate locally), a TRANSIENT infrastructure failure that a reset or a retry resolves (a runner outage, a quota window), an infrastructure failure that needs configuration, cleanup or an owner's action (the runner's disk floor, a billing block, a missing secret), or an unresolved cause; an attributed regression inside the recovery policy's scope becomes the repair (the rejected lane re-entered with the verdict as the executor's input, or a repair card at priority 1 naming the run, the body and the merge, admitted by derivation in the order's next slot); a transient failure becomes a wait and a retry; a failure needing action becomes authorized remedial work where the policy allows it (a cleanup the coordinator may perform), and otherwise parks the affected resource with a wake condition while permitted work continues — CI is never re-run while its billing or disk condition is unchanged; an unresolved cause becomes a diagnostic attempt inside the scope, and a question entry only when diagnosis cannot answer it; pinned by bodies over fixture logs: a missing parent run, a transient failure, a billing block, an attributed regression.
- WHEN a repair is attempted THE coordinator SHALL record on the failing card the failure evidence (the body or the stated failures, the run or verdict ref), the remedy attempted, and the demonstrated change in the failure state; a next attempt SHALL continue only when it is a materially different remedy with evidence behind it, or a verified part of the failure has been removed; it SHALL park when the proposed attempt repeats an ineffective remedy without new evidence, or no justified next action exists inside the scope; a parked problem carries a wake condition (new diagnostic evidence, or an owner decision) so a fresh coordinator does not restart the cycle; a new commit or a changed error string alone is not progress; pinned both directions: the same named failing body with demonstrated partial progress continues, repeated ineffective work with unchanged evidence parks.
- WHEN a decision is parked, or a red stands on main, THE shared-health check SHALL be specific to the proposed action: an attributed defect permits its designated repair while a feature landing whose delivery checks that red invalidates is held; unknown ownership of a live writer, or a verifier or seal that cannot be trusted, holds every affected action and no repair permission bypasses it; a bench or a seal not yet owed for the proposed stage is not a broken verification path; work proved independent of the parked decision continues; pinned by bodies: a repair allowed on an attributed red base, a feature held on that same red, an independent card continuing past a parked question.
- WHEN a spawn is refused for quota THE coordinator SHALL record the refused attempt and its next retry instant on the run record (the provider's reset instant when the refusal carries one, else a capped exponential delay), SHALL distinguish a quota refusal from an authentication or configuration failure (those park with a question), SHALL reconcile the old attempt's run record so no writer is created or lost by assumption, and SHALL revisit the recorded instant at each of its own boundaries while continuing other eligible work — the wait is a scheduled retry the coordinator returns to, never a block on its only control loop; where nothing else is eligible the wait verb's implementation in tools/e2e/scripts/dispatch-brief.mjs (awaitPlan, runAwait), reused and extended with a wait-until-instant form, holds until the instant; before retrying, the pause, the grant and the shared eligibility are re-read; models and accounts are never changed without the configured permission; pinned with a fake clock and a fixture refusal through the real route, never a long sleep or a paid probe.
- WHEN a decision the coordinator may not make arises THE coordinator SHALL append a question entry to the relevant room in the seat's own voice, marked as a question and never as a ruling, carrying a question id, the affected cards, the cause and its ref, and its state (pending, or resolved with the resolution's evidence); the dispatch order SHALL name the question id on each dependent card it holds as NOT STARTABLE, the lane cut SHALL refuse such a card by the same resolved question state rather than merely displaying it, and every card that does not depend on it is admitted; the ruling entry is still proposed verbatim and appended on the owner's yes (T-307); no task-parser field is added — the link lives in the room and the dispatch order reads it; pinned by a method eval on the question entry's shape and by bodies over the order and the cut.
- WHEN the owner returns THE return brief (`brief.mjs --since <instant>`) SHALL derive from existing records only — the cards, the rooms, the run records, the meters records, and the runner's runs (each push's run with its head sha, its creation instant and its conclusion is the push evidence this brief consumes) — what merged with its merge commit, its tested commit and the run's conclusion (a merged commit whose run finished after the instant is reported with its new conclusion, and an older green run is never proof of the current tip), what was parked and why, the question entries pending and resolved, the lanes live and their phase, the repairs admitted with their origin and attempt; where the runner's history is unreachable or a push left no run, the push details are reported as unknown, never inferred from a commit's timestamp; it SHALL say plainly what else it cannot know and SHALL copy no verifier-only material; pinned by one end-to-end fixture: park a question, refuse its dependent card, admit an independent one, resolve the question by an authorized entry, and recover the same state and the same brief in a fresh process, with a merged commit whose run finished after the instant and one push with no run.
- WHEN this card lands THE conventions SHALL carry the host keep-awake requirement at the loop's section as an operational rule with its derive command, and the orchestrator role file's stop list SHALL name only the stops the grant reserves.

## History — the criteria as filed on 2026-09-13 and their amendments, superseded on 2026-09-14 (kept verbatim; the instruments read only the canonical section above)

### Former criteria — as filed on 2026-09-13 (superseded)

- WHEN a lane's verdict is REJECTED, or a CI run on main reds on a body the merge added, THE coordinator SHALL, inside the approval mode's scope, produce the repair without a further approval — the rejected lane re-entered with the verdict as the executor's input, or a repair card filed at priority 1 naming the run, the body and the merge, promoted and dispatched in the order's next slot — and outside the scope SHALL queue it as a question entry; pinned by bodies over a fixture verdict and a fixture run log.
- WHEN a decision the coordinator may not make arises THE coordinator SHALL append a question entry to the relevant room in the seat's own voice, marked as a question and never as a ruling, and SHALL continue every card that does not depend on it; the dispatch order SHALL name the question on each dependent card it holds as NOT STARTABLE; the ruling entry SHALL still be proposed verbatim and appended on the owner's yes (T-307); pinned by a body that parks one decision and requires the next unrelated dispatch to proceed, and by a method eval on the room format's question-entry shape.
- WHEN a spawn is refused for quota THE coordinator SHALL wait with the wait verb until the window reopens, retry the same spawn, and record the wait, never abandoning the lane or the order; a stop on quota exists only where the approval mode's record says so; pinned by a body over a fixture refusal.
- WHEN the owner returns THE return brief (`brief.mjs --since <instant>`) SHALL list what merged with its CI conclusion by name, what was parked and why, the question entries awaiting a ruling, the lanes live and their phase, and the repairs dispatched under the scope, each item with its ref, and SHALL say plainly what it cannot know (a run still in progress, a lane's phase unreported); pinned by bodies over a fixture history.
- WHEN this card lands THE conventions SHALL carry, at the loop's section, the host keep-awake requirement and the resumption of a dead seat from the run record and the ledger (ADR-025), each as an operational rule with its derive command, and the orchestrator role file's stop list SHALL name only the stops the approval mode's record reserves.

### Amendment of 2026-09-14 — the repair loop cannot get stuck, the wait can actually wake, unrelated work checks the shared conditions first, and the dead coordinator is another card's (the Codex orchestrator's review of T-319 and T-322, relayed by the owner)

Supersedes the quota criterion and the last criterion above and adds to the first two; where they conflict this section governs. The blocked_by entry on T-319 is added with this line: the repairs this card dispatches are authorized by T-319's recovery policy, not by this card. A correction of the measured section's wording: the policy AUTHORIZES a repair; the coordinator still diagnoses the failure and chooses a valid fix by engineering judgement, and a repair is classified and verified like any other card — a small diff qualifies for the express path only by T-320's measured eligibility, never by its size.

- WHEN a repair is attempted THE coordinator SHALL record on the failing card the failure's signature (the red body's name or the rejection's stated failures, with the run or verdict ref) and each remedy attempted; WHEN a further attempt would repeat without progress — the same signature after a remedy, or two attempts with no new signature — THE coordinator SHALL park that problem with the record and continue eligible work, never spawning a fresh executor at the same failure; this is protection against getting stuck and no token ceiling; pinned by bodies over a fixture history with progress and one without.
- WHEN a spawn is refused for quota THE coordinator SHALL wait until the provider's stated reset instant where the refusal carries one, and otherwise SHALL check again with a delay that grows on each refusal, SHALL reconcile the refused attempt's run record before any retry, and SHALL record each wait; pinned by bodies over a fixture refusal with a reset instant and one without.
- WHEN a decision is parked and other cards could continue THE coordinator SHALL first check the shared conditions — main green on the runner or its red attributed to a named cause, the verification path intact (the bench verb and the sealed inputs answering), and every live writer's ownership known from the run record — and SHALL continue only where those permit; where one fails THE coordinator SHALL hold every dispatch and record why, pinned by a body per condition.
- WHEN a CI run on main reds THE coordinator SHALL attribute the red by name before treating it as a repair trigger — the failing bodies from the run's own log, compared with the previous run at the parent commit and with the merge's diff — and a red the comparison does not attribute to the merge SHALL become a question entry and not a repair, pinned by a body over two fixture logs.
- WHEN this card lands THE conventions SHALL carry the host keep-awake requirement at the loop's section as an operational rule with its derive command, and the orchestrator role file's stop list SHALL name only the stops the approval mode's record reserves; the resumption of a dead or quota-exhausted coordinator is NOT this card's — it is T-323's, a capability demonstrated by a restart and not a conventions entry.

## Widening of 2026-09-14, during the lane (the architect seat, on the executor's ask)

The fence gains tools/e2e/tests/brief-flush.spec.ts, whose arm-list body derives the command's flag set from brief.mjs and reds on a flag no announced arm drives and no entry excuses: the return brief's flag that criterion 6 names by its own words and the wait verb's until-instant form that criterion 4 names are announced or excused there with their reason, the same class T-324 was widened for at 6b131f69. No live lane holds the spec; nothing else widens.

## Implementation notes

### Unattended operation, built 2026-09-14 (claude-opus-5@subagent)

**WHERE IT LIVES AND WHY THERE.** One section of
`tools/e2e/scripts/dispatch-brief.mjs` — `failingBodies`, `parentRun`,
`attribute`, `repairEntry`, `repairLedger`, `remedyDigest`,
`progressRuling`, `sharedHealth`, `classifyRefusal`, `retryInstant`,
`dueRetries`, `questionEntry`, `readQuestions`, `questionHolds`,
`roomFiles`, `mergeEvidence`, `metersRecords`, `firstParentLine`,
`defaultRunnerIo`, `assembleReturnBrief`, `returnBriefRecs`. It sits
there for T-324's reason one card earlier: `run-record.mjs` and
`dispatch-order.mjs` both import that module and nothing imports either
of them back, so the arm is the one place the lane cut, the three
run-record boundaries and the dispatch order can all reach.
`assembleReturnBrief` takes the run RECORDS as an input rather than
reading them, because a read of `allRecords` there would be a cycle;
`brief.mjs` is the one module that imports both halves and gathers them,
which is the split T-324 already takes for the admission ledger.

**ATTRIBUTION ASKS ITS QUESTIONS IN ONE ORDER AND THE ORDER IS THE
RULE.** Infrastructure first, bodies second. A red whose cause is a
billing block has failing bodies in it too — every job "fails" when the
account is blocked — so a reader that started from the bodies files a
repair card against code that is fine. That is the seat's own 2026-09-14
reading (jobs failing in seconds with no steps were a billing block, not
the tree) turned into a branch. `INFRASTRUCTURE_SIGNS` is a table with
each row's CLASS on it rather than a chain of conditions, because the
difference between `transient` and `needs-action` is the whole point: one
is resolved by waiting and the other is not resolved by any amount of
repeating, and a row filed under the wrong class turns a billing block
into an infinite re-run.

**THE BASELINE IS THE NEWEST EARLIER ANCESTOR RUN AND EVERY WORD OF THAT
IS LOAD-BEARING.** Newest, because an older green tells you less; earlier
by the run's own creation instant, because a run started after this one
is not a baseline for it; ancestor decided by the REPOSITORY rather than
by a clock, because two branches' runs interleave in time and only one of
them is this tip's history. Where no such run exists the honest answer is
`unresolved` and the next act is the bounded local reproduction, which is
an INPUT here rather than a branch this module invents: the card names it
and the caller performs it.

**THE PROGRESS RULE IS MECHANICAL BECAUSE `remedyDigest` MAKES IT SO.**
"A new commit or a changed error string alone is not progress" is a
sentence until something erases shas, run ids, instants and digits before
two remedies are compared — after which "re-ran the suite at abc1234" and
"re-ran the suite at def5678" are one remedy tried twice. DEMONSTRATED
PROGRESS IS ASKED ABOUT FIRST, and that ordering is the criterion read
literally: the two ways an attempt earns its spawn are an OR, and the
criterion's own pin says which wins where both clauses could speak — "the
same named failing body with demonstrated partial progress continues".
The park clause is about work whose EVIDENCE is unchanged, and a removed
part of the failure is evidence that changed.

**THE LEDGER IS A CARD SECTION AND THE CEREMONY WAS TAUGHT TO ALLOW IT.**
`## Repair ledger` on the FAILING card, which is where the second
criterion puts it and where the return brief reads it back from. That
required one change to T-324's admission: `MECHANICAL_SECTIONS` gains the
heading, because a ledger appended to an approved card would otherwise
refuse the next explicit admission as `ADMISSION_CARD_BLOB_MOVED`. The
loop's own ceremony writing onto a card after the yes is exactly what
that enumeration is for.

**THE HEALTH CHECK IS SPECIFIC TO THE ACTION, AND THE TWO HARD HOLDS ARE
FIRST.** An unknown live writer and an untrusted verification path hold
every affected action and no repair permission bypasses either — a repair
merged past a seal nobody trusts is not a repair, and a second writer
over a resource somebody may still hold is the T-247 race with a reason
attached. A bench or a seal NOT YET OWED for the stage being proposed is
not a broken path, which is the distinction a blunter check gets wrong in
the direction that looks safe.

**THE WAIT VERB GAINED A FOURTH FACT AND NOT A SECOND WAIT.** `awaitPlan`
answers an `instant` kind; `runAwait` is untouched; `defaultAwaitIo` took
a CLOCK as its one argument so the SHIPPED probe is what a body drives
rather than the body's own arithmetic. The ceiling still bounds the
instant arm, deliberately: a reset instant a provider stated wrongly, or
one already past when the record was written, must not become the hang
the arm exists to remove.

**THE REFUSAL RIDES `stop` RATHER THAN A NINTH OPERATION.**
`method/lane-protocol.md` says the operations are the same seven for
every kind of child and that file is outside this fence, so the honest
move was to find the verb a refused spawn already belongs to. It is
`stop`: nothing is running, the reservation is released, the retry is a
NEW attempt, and stop's reconciliation is exactly the card's "no writer
is created or lost by assumption" — already refusing an uncertain record
before the classification is reached. The classification is made at every
stop and REPORTED, so a text this reader gets wrong is visible rather
than silent; only a `quota` kind schedules a retry, and the refusal count
is derived from the records on disk so a successor seat continues the
growth rather than restarting it.

**THE QUESTION ENTRY ADDS NO FIELD TO ANY CARD.** The link lives in the
room and `questionHolds` is the ONE derivation that both the dispatch
order's NOT STARTABLE rows and the LANE CUT'S REFUSAL read — which is
what makes the display and the refusal incapable of disagreeing. The cut
asks about the question BEFORE the grant, because they are different
questions and the refusal should name which: the grant says whether the
owner authorized this card, and a pending question says the owner has not
yet settled something it depends on.

**AND THE RETURN BRIEF DERIVES.** Cards (their repair ledgers), rooms
(the question entries), run records (the admissions, the retries, the
live writers), meters records (which seats produced each merge) and the
runner's runs. A merge is reported against the OLDEST run whose tested
sha is that merge or a commit newer than it on the same first-parent
line — because in this project a merge commit is almost never a run's
head sha, the checkpoint lands on top of it before the push. The search
runs FORWARD from the merge and never backward, which is "an older green
run is never proof of the current tip" as an algorithm. A push with no
run is UNKNOWN. `SUPERTASKR_RUNNER_RUNS` and `SUPERTASKR_RUNNER_LOGS`
replay the runner's answer from files: a body that drives this command as
a fresh process cannot inject a function into it, and a person
re-deriving somebody's return brief months later cannot re-ask a history
the runner has expired.

**AND THE HEALTH CHECK HAS TWO CALL SITES BECAUSE ONE OF THEM CANNOT
REACH THE RUNNER.** The dispatch order runs it per startable card with
its CI half honestly UNKNOWN: that arm's own size is compared across two
runs by `brief-flush.spec.ts` to derive its loss point, and a network
answer in the middle of it makes that comparison meaningless. The return
brief runs the same function with the CI half READ, because it is a
report rather than a decision and it already has the runner's answer.
T-322-s4 is the card for closing the gap that leaves.

### In-fence follow-through

- `docs/CONVENTIONS.md` is 174732 bytes at this lane's tip, a NET GROWTH
  of 1,708 bytes on the base's 173,024 against the owner's 2,000-byte
  allowance of 2026-09-14, with 1,521 bytes of head-room under the
  176,253-byte fail line. T-311-s3 is the open card for the document.
- The behaviour census is STALE by construction: this card adds thirteen
  bodies to the brief spec, four to the dispatch-order spec and four to
  the run-record spec, so a fresh generation is 108,830 bytes against the
  committed 105,999 (from `npm run capabilities:check` from tools/e2e, at
  this lane's tip). `docs/CAPABILITIES.md` is outside this fence and the
  regeneration is the merge's, which is where that write belongs.
- The graph is CURRENT at this tip (2,626 symbols, 2,505 edges): every
  file this card changed is a `.mjs` script or a spec, and the index
  covers neither.
- `MECHANICAL_SECTIONS` gained `Repair ledger` and the conventions'
  admission sentence gained the clause to match. That is a change to
  T-324's control made from inside this fence, argued in the constant's
  own comment and drilled: with the heading removed, the ledger append
  refuses the card's next admission as substantive drift.
- The fence was widened once during the lane, on the ask file, by the
  architect seat: `tools/e2e/tests/brief-flush.spec.ts`, whose arm-list
  body derives `brief.mjs`'s frozen flag set and reds on a flag no
  announced arm drives and no entry excuses. Both new flags are argued
  into that file's excuse list with their reasons — the wait's
  until-instant form because an entry in the arm list would make the
  suite sleep for however long the caller typed, and the return brief
  because it reaches a machine that is not this one.

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14 to the seat's recommendation): to planned at priority 2 — after T-319, which it is blocked by, and before the T-312 rerun; the owner's ruling of 2026-09-13 that the work must not stop for their absence runs on the seat's hand until this lands.
