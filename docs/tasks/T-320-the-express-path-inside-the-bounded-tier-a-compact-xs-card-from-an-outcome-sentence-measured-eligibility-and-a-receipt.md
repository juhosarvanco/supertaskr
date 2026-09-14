---
id: T-320
title: "The express path inside the bounded tier: from an outcome sentence and a named fence the arm creates a compact XS card, measures its eligibility, runs the executor with the configured model reaching the launch and a receipt naming requested beside observed, and records dispatch overhead, executor time, check time and request-to-delivery time separately — an ineligible change is refused by name and re-triaged through the existing path"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 2
status: verifying
suggested_by: "the architect seat on 2026-09-13, from the Codex orchestrator's lean-delivery plan v2 and its reconciliation review of the same day, filed on the owner's ruling; filing authorizes no development"
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/card-preflight.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/merge.spec.ts, tools/method-evals/evals, method/tasks/TASK-FORMAT.md, method/roles/orchestrator.md, docs/CONVENTIONS.md, docs/conventions/architecture.md, docs/conventions/lanes.md, docs/conventions/dispatch-and-scratch.md, tools/e2e/tests/brief-flush.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## What was measured

On 2026-09-13 a change of half a minute to three minutes of editing (a one-line restore, a spec helper swap such as T-314-s6, a wording amendment) travels the same road as a guarded lane: a card filed by hand, a dispatch of eleven steps, an executor (a standard S lane's executor ran 29 minutes and about 262K tokens on T-300-s6), a bench, a verdict, a merge and a closing check — two to three hours to delivery for an edit whose risk is bounded by the fence and the keepers. The bounded tier exists in the schema (20 minutes and 80K, no bench) and is unreachable until T-298-s3 lands, because the parser refuses XS. The dispatch arm already renders the brief from the card (the dispatch verb's own rendering, no typed prompt), the preflight already measures the fence and the guard-class map, and the run record (T-311) already carries a child run's requested and observed values. Today the only launch route for a Claude subagent is the seat's own spawn from the rendered prompt, with the model the arm stamped on the card from the template's roles (dispatch-brief.mjs takes the builder's and the verifier's models from the template by role); no effort value is configured anywhere yet (T-318 adds the shared effort control), and the observed model, tokens, tool uses and seconds arrive in the harness's completion notification, which the seat copies into the meters by hand. What is missing is smaller than a workflow product: a compact card shape the arm can create from an outcome sentence and a fence, an eligibility measurement, a launch receipt tying requested to observed, and the time measurements. T-204 (planned, measured 2026-08-31) overlaps this fence and is re-triaged against what has landed before either dispatches. The plan's targets are measured objectives: under one minute of dispatch and record overhead, and roughly two to five minutes to a local candidate for an eligible edit; check time and publication time are recorded separately and are not part of the target.

## Acceptance criteria

- WHEN the seat gives the arm an outcome sentence and a named fence THE arm SHALL create a compact XS card carrying every required field of the task format and both standing sections (notes and verdicts), with the outcome sentence as its criterion in EARS form and the fence as its touches, SHALL preflight it with the existing preflight, and SHALL admit it through the same admission the arm makes for every lane cut (T-324): under the `all` mode the grant admits it; under `each` its approved blob needs the per-dispatch approval that mode requires, consumed once; under `until` it is admitted only as a derived repair of a card the grant lists, inside the recovery policy, and refused otherwise by name; with no grant (T-319's explicit no-grant state) it is refused by name — the compact card is generated BEFORE its admission and the admission binds its blob and its reservation; an outcome sentence alone authorizes no work, pinned by a body per mode and one for the no-grant state.
- WHEN a change already belongs to an active card with a safely resumable writer (a correction round, a re-entry) THE arm SHALL reuse that card and its run record rather than creating a compact card or a second writer for the express label, pinned by a body.
- WHEN eligibility is measured THE arm SHALL require, and print as measured findings: an admission the grant permits; every path inside the fence; a relevant keeper or owning spec present for the path; no guard-class path (the guard-class map of the conventions, T-296, read from wherever T-290 lands it); reversible (a tracked file, no rename, no deletion, no generated file); and SHALL refuse an ineligible change by name — a superficially small change to one line of a guard-class file is the demonstration's refused control.
- WHEN an eligible change is launched THE flow SHALL run the executor only, as the bounded contract permits (no bench, no phase 1), with the configured model from the template's roles reaching the launch through the current route (the seat's spawn from the arm's rendered prompt, the model passed explicitly as the harness's own parameter) and the receipt in the run record (T-311's operations, the reservation taken after the admission) naming the requested model and effort (effort recorded as not configured until the template carries one) beside the observed model, tokens and seconds from the completion, requested and observed kept as separate fields, a missing observation recorded as unknown and never substituted; a body plants a completion whose observed model differs from the requested one and requires the receipt to say so and the merge verb to refuse the merge by name.
- WHEN a check fails or the executor discovers scope beyond the outcome sentence THE flow SHALL preserve the candidate (branch and run record kept), withdraw the express label on the card by a dated append, and re-triage the card through the existing path (a standard or guarded lane), pinned by a body.
- WHEN the demonstration runs on a real eligible change THE notes SHALL record, separately and from stamped instants, dispatch and record overhead (from the outcome sentence's instant to the lane cut), executor time (to the candidate), check time (the owed set), publication time (merge to push) and the request-to-delivery total (from the outcome sentence's instant to the push of the merge, with the runner's conclusion instant recorded beside it as a separate figure), and SHALL state whether the plan's targets were met — under one minute of dispatch and record overhead, roughly two to five minutes to a local candidate for an eligible edit, check and publication time outside the target — as measured objectives and not as a stopwatch body that flakes; a slow run recorded is not the objective achieved.
- WHEN the seat coordinates an express change THE seat SHALL NOT be its implementer: the role file says the seat edits no code under the express label, and a coordinator edit at a merge keeps the standing comparison against verified content (T-295-s9), pinned by a method eval on the role file's text.

## Former criteria — 2026-09-13, superseded by the re-check of 2026-09-14 (kept verbatim)

- WHEN the seat gives the arm an outcome sentence and a named fence THE arm SHALL create a compact XS card carrying every required field of the task format and both standing sections (notes and verdicts), with the outcome sentence as its criterion in EARS form and the fence as its touches, SHALL preflight it with the existing preflight, and SHALL create it only inside an active window (T-319) that names it or names the card it corrects — the compact card is generated BEFORE the approval it needs and enters the window's record by the same approval; an outcome sentence alone authorizes no work, pinned by a body that offers a sentence outside any window and requires the refusal by name.
- WHEN a change already belongs to an active card with a safely resumable writer (a correction round, a re-entry) THE arm SHALL reuse that card and its run record rather than creating a compact card or a second writer for the express label, pinned by a body.
- WHEN eligibility is measured THE arm SHALL require, and print as measured findings: an active window; every path inside the fence; a relevant keeper or owning spec present for the path; no guard-class path (the guard-class map of the conventions, T-296); reversible (a tracked file, no rename, no deletion, no generated file); and SHALL refuse an ineligible change by name — a superficially small change to one line of a guard-class file is the demonstration's refused control.
- WHEN an eligible change is launched THE flow SHALL run the executor only, as the bounded contract permits (no bench, no phase 1), with the configured model from the template's roles reaching the launch through the current route (the seat's spawn from the arm's rendered prompt, with the model the arm stamped) and the receipt in the run record naming the requested model and effort (effort recorded as not configured until the template carries one) beside the observed model, tokens and seconds from the completion, requested and observed kept as separate fields, a missing observation recorded as unknown and never substituted; a body plants a completion whose observed model differs from the requested one and requires the receipt to say so and the flow to refuse the merge by name.
- WHEN a check fails or the executor discovers scope beyond the outcome sentence THE flow SHALL preserve the candidate (branch and run record kept), withdraw the express label on the card by a dated append, and re-triage the card through the existing path (a standard or guarded lane), pinned by a body.
- WHEN the demonstration runs on a real eligible change THE notes SHALL record, separately and from stamped instants, dispatch and record overhead (from the outcome sentence to the lane cut), executor time (to the candidate), check time (the owed set), publication time (merge to push) and the request-to-delivery total, and SHALL state whether the plan's targets were met, as measured objectives and not as a stopwatch body that flakes — a slow run recorded is not the objective achieved.
- WHEN the seat coordinates an express change THE seat SHALL NOT be its implementer: the role file says the seat edits no code under the express label, and a coordinator edit at a merge keeps the standing comparison against verified content (T-295-s9), pinned by a method eval on the role file's text.

## Note of 2026-09-13 — the window dependency follows T-319's fate

The owner ruled on 2026-09-13 that this project's own loop runs without token or time limits under its regular ceremony (see T-319's note of the same day). The criterion that ties a compact card to an active window follows T-319: where no window class is wanted, the express path's authorization is the regular ceremony's dispatch approval, and that substitution is a re-triage item for the owner before this card is promoted, not a rewrite of the card.

## Attribution correction of 2026-09-13

The suggested_by field says this card was filed on the owner's ruling. It was not: the filing was the seat's own step-2 act on the Codex orchestrator's recommendation of 2026-09-13, which the owner relayed without ruling on it; the owner's rulings of that day concern limits and the ceremony, not this filing. The field's clause is withdrawn by this line and the field is left as written, because a record is appended and never rewritten.

## Amendment of 2026-09-13 — the express path does not depend on the window mechanism (the Codex orchestrator's review of the filed cards, 2026-09-13)

This section supersedes the window clause of the criterion that creates the compact card, the blocked_by entry on T-319 (now T-298-s3 alone, changed with this line) and the note of 2026-09-13; everything else stands. The compact card is created under the ordinary dispatch approval — the orchestrator's step 5 as the owner practises it, the standing authorization of 2026-09-12 included — and, where a window record exists and names it or the card it corrects, under the window; neither is a precondition of the other, and an optional budget control never blocks the fast path. The launch criterion's model-only route, with effort recorded as not configured, is an intermediate step: it completes no configurable effort, which stays with T-318 and its excluded launch follow-up.

## Re-check of 2026-09-14 against the landed authorization machinery (the owner's ruling of 2026-09-14)

The owner set the order after the lanes live today as T-290, then this card re-checked against T-290's resulting structure, then the T-312 rerun, keeping this card's speed objectives and its full request-to-delivery measurement. What landed since the card was filed and what it changes: T-319 (54c22d98) is the dispatch block — the approval mode `each`, `until` or `all`, the recovery policy, an explicit no-grant state — read through the parser's reader; T-324 (120b5c0a) is the admission lifecycle every lane cut, child start, re-entry and replacement writer passes through, bound to the grant's revision, the card's approved blob and the attempt's reservation, with derived admissions for repairs inside the recovery policy. The window clause the amendment of 2026-09-13 superseded is now answered by that machinery, so the criteria above name it: an express card is admitted the way any card is, per mode, and the bounded tier saves the bench and the phase-one pass, not the admission. The launch route is unchanged (the seat's spawn with the model passed explicitly; T-318 is still suggested, so effort stays recorded as not configured). The merge verb joins the fence because the receipt's requested-beside-observed refusal is the verb's to make. What is OWED at T-290's merge, before this card's dispatch: the fence's docs/CONVENTIONS.md entry re-pointed at the topic file that then carries the guard-class map and the dispatch bullets, and the third criterion's citation read again against that structure; T-204 (planned at 767a68ff) still overlaps this fence and its re-triage against what has landed is owed at the same sitting. The criteria of 2026-09-13 stand verbatim under their own heading; the status moves to planned by this line on the owner's order, blocked by T-290 for the structural re-check.

## Re-point of 2026-09-14 at T-290's merge (the architect seat, owed by the re-check of the same day)

T-290 landed docs/CONVENTIONS.md as the index over eleven chapters under docs/conventions/. The rules this card's criteria cite live in three of them, so the fence gains them beside the index: docs/conventions/architecture.md (the guard-class map, criterion 3), docs/conventions/lanes.md (the dispatch-from bullet and the lane rules the express cut obeys) and docs/conventions/dispatch-and-scratch.md (the port and scratch rules a compact lane derives). The express path's own conventions text, if any, lands in the chapter that owns its topic with the index line beside it, never in the index alone. The blocker on T-290 is cleared by this line; T-204's re-triage of 2026-09-14 stands and T-204 follows this card.

## Amendment of 2026-09-14, during the lane (the architect seat, on the executor's two asks)

Two readings of the criteria, recorded so the verifier grades them and not the letter. (1) The approval mode the card calls `all` does not exist in the schema: method/runtime/process-schema.yaml declares `each`, `until` and `standing`, and `standing` is the mode that admits without spending a per-card approval — the card's `all` is read as `standing` everywhere, the seat's misnaming from T-324's summary, and the bodies criterion 1 asks for are one per mode (each, until, standing) and one for the explicit no-grant state. (2) Criterion 6's demonstration on a real eligible change is the seat's to drive, on the integration branch after the merge and against the landed express path: three of its five measurements (the executor spawn, the merge, the push) are the seat's by construction, and a child spawned into a live lane is a standing hazard. The lane builds the shape — every instant the express flow needs stamped into the run record by the arm itself, and a printing arm that derives the five measurements and the target verdict from those stamped instants, body-pinned over a synthetic record — and its notes carry that shape with the refs it reads from and the figures its own lane's run produced; the seat runs the demonstration after the merge with the outcome sentence, the command line, the eligible change and the refused guard-class control the lane hands it on the card, and appends the arm's printed measurement block here as a dated note with the run's refs. The merge-side figures are not the lane's to take, and its report says so.

## Widening of 2026-09-14, during the lane (the architect seat, on the executor's ask)

The fence gains three paths. docs/INDEX.md and docs/CAPABILITIES.md, on T-290's precedent: the express bullet adds an opener to the dispatch chapter's index line and the lane adds bodies, so both generated files go stale and the docs gate reds six docs-input-gate bodies on that one cause until `npm run capabilities` runs in the lane; T-242, building beside this lane, fences the same two generated files for the same reason, so the two fences overlap on generated outputs and not on owned text — the second merge conflicts on them and the seat resolves it by regenerating both from the merged tree, which the merge's census step does in any case. tools/e2e/tests/brief-flush.spec.ts, on T-322's and T-324's precedent: its arm-list body reds by name on any of the eleven new flags nothing announces or excuses; the lane announces the one live arm and excuses the dials beside it in that file's own shape; no live lane holds the spec.

**Correction of the widening, the same day (the architect seat).** The two generated files are withdrawn from the fence: lane-protocol rule five is mechanical — the fence writer refuses a lane whose fence is not disjoint from every live lane — and T-242 holds docs/INDEX.md and docs/CAPABILITIES.md beside this lane, so the seat's grant of them was wrong and is withdrawn by this line; tools/e2e/tests/brief-flush.spec.ts stays. For the lane's own graded reading the executor regenerates both generated files in its working tree (`npm run capabilities`) so the docs gate reads a current index, and reverts them before the stamp commit rather than committing files outside its fence; the merge regenerates both from the merged tree, which is where they are owned. The widening section above stands as the record of what was granted and why it could not be written.

## Implementation notes

### 2026-09-14 — the executor's notes (claude-opus-5@subagent), measured at 12c1d2a8 unless a line says otherwise

**THE ARM IS A SHORT ROAD THROUGH THE ORDINARY RITUAL AND NEVER A SECOND
ROAD.** `tools/e2e/scripts/dispatch-brief.mjs` gains ARM FIFTEEN —
`compactCard`, `expressPlacement`, `expressReuse`, `expressEligibility`,
`expressPlan`, `runExpress`, `expressWithdrawal`, `expressMeasurements`
and `expressRecs` — and every step of it calls something that already
existed: the preflight is `card-preflight.mjs` through the same
`brief.mjs --preflight` invocation the ritual uses, the admission is
T-324's `admit` against the grant T-319's `grantState` reads, the
classification is `classifyTier`, the cut is `runDispatchLane`, and the
record is `run-record.mjs`. The command line is
`brief.mjs --express "<outcome sentence>" --fence <path[,path...]>`,
with `--express-withdraw <T-NNN> --why <text> --tier standard|guarded`
for the other direction.

**THE ARM ADDS NO SECOND ADMISSION.** `expressPlan` calls `admit` to
MEASURE whether the grant permits the change — a read that writes no run
record and therefore consumes no approval, since the ledger every mode
counts against is the run records themselves. The admission that BINDS is
the lane cut's, made by `dispatchLanePlan` as it is for every other card.
Criterion 1's four bodies drive the three modes the schema declares and
the explicit no-grant state.

**ONE DEPARTURE FROM THE ORDINARY CUT, AND IT IS THE CRITERION'S OWN.**
Under the no-grant state `admit` answers "made, and NOTHING was
enforced", which is right for a card a person filed and triaged. A
compact card has no such history — it was composed by a command out of a
sentence — so the express path refuses by name
(`EXPRESS_CODES.NO_GRANT`), which is what criterion 1 asks for and what
its own sentence means: an outcome sentence alone authorizes no work. The
ordinary cut is untouched, and a body asserts that by cutting one under
the same no-grant template.

**THE BLOB IS KNOWABLE BEFORE THE CARD EXISTS**, which is what makes that
refusal workable rather than a dead end: `hashObject` computes the
compact card's sha from its bytes without writing a file or storing an
object, `--dry-run` prints it, and an owner who wants a compact card can
approve exactly that sha in the grant before it is written.

**WHAT THE BOUNDED TIER SAVES.** The phase-one pass was already skipped
at `bounded`; the bench was not, and a detached worktree cut for a
verifier who is never spawned is a second checkout of the tree for
everything that walks it. `runDispatchLane` now skips it at that tier and
says so in a ledger row and a note, on the phase-one skip's own argument:
a worktree the arm skipped on purpose and one it forgot look the same on
disk.

**THE RECEIPT.** `run-record.mjs` gains `OBSERVED_TOKEN`, `readObserved`
and `launchReceipt`. The requested half is the ASSIGNMENT'S — model, and
effort reading `not configured` where no template declares one, which
`roleEffort` reads rather than assumes. The observed half is the
EXECUTION'S and comes from a line-initial `RUN-OBSERVED model=…
tokens=… seconds=…` in the completion and from nowhere else; nothing in
that path reads the assignment, which is what keeps the two halves from
agreeing by construction. A missing observation is `unknown`, an
`unknown` is never a mismatch, and `merge.mjs` gains a FLOOR keeper
(`keeper:receipt`, `receiptKeeperReport`) refusing a contradicted model
by name while reporting an unobserved one as NEWS.

**THE MEASUREMENTS ARE DIFFERENCES OF STAMPED INSTANTS.** The run record
gains an `instants` map. The express run writes `requested` and `cut`
into `instants-<card id>.json` in the lane's scratch directory for the
assignment to carry, because both happen before any child exists;
`observeRun` stamps `candidate` at the same instant it records the
outcome, so the two can never disagree; and the seat stamps `checked`,
`merged` and `pushed` through the existing collect verb's new
`--instant <name>=<iso>[,...]` dial, which refuses a half-read pair
rather than keeping it. `expressMeasurements` derives the five figures
and the target verdict, `runRecs` prints them, and an attempt with
nothing to measure prints nothing.

### The drills

Five mutants, each at the SITE the property lives, each restored by
`git checkout --` and each restore PROVED by sha256 against the reading
taken before the write. Every one was KILLED by the body it was aimed at.

- `guard-class-arm` — `expressEligibility`'s guard-class reading answers
  the empty set. Killed by the five-requirements refusal body.
- `receipt-forgery` — `launchReceipt`'s observed model is filled from the
  ASSIGNMENT, which is the forgery the receipt exists to make impossible.
  Killed by the planted-completion body.
- `bench-at-bounded` — the bounded tier's bench skip is disarmed. Killed
  by the executor-only body.
- `requirement-list-data` — a DATA mutant where the property IS data: the
  requirement list loses `guard-class`. Killed by the all-five-printed
  body.
- `no-grant-refusal` — the express path's one departure from the ordinary
  cut is disarmed. Killed by the no-grant body.

### In-fence follow-through

- **The bench skip at the bounded tier** — criterion 4 says the flow runs
  the executor only, and the ritual cut the bench whatever the tier.
- **The receipt keeper is FLOOR, not one of the three cheap ones** —
  `merge.keepers` switches T-295's three readings of the DIFF, and a
  receipt mismatch is not a property of the diff. Two standing bodies
  that pinned the keeper list moved with it, and both say why.
- **`--run collect --instant` and the record's `instants` map** — the
  seat's three instants had no door into a record, and a measurement
  taken off a stopwatch is what criterion 6 forbids.
- **`defaultDispatchIo().now`** — the clock became an injection point
  beside `run`, `read` and `write`, so the instant the express run stamps
  is drivable by a body rather than taken from the wall.
- **The withdrawal's own line goes out as a stamped value, flattened** —
  it carries dates and an attempt id, and the renderer refuses a NOTE
  that carries a digit, so the verb answered CANNOT RUN after it had
  already written the card.
- **The unwind takes the card back when the staging never happened** —
  the card is written and then staged, so a refusal between the two left
  an untracked compact card in the integration checkout, which the next
  merge counts as somebody's uncommitted work. A body injects a preflight
  refusal and requires the tree to come back as it was found.
- **The conventions bullet's bolded opener is short enough for the pack
  to resolve** — the pack captures a bolded opener up to a fixed width
  and then requires the bullet to open with exactly what it captured, so
  an opener longer than that width truncates MID-WORD and the pack throws
  the moment a script cites it. The opener is bolded to the rule, the
  rest of the sentence sits outside the bold, `dispatch-brief.mjs` cites
  it through `EXPRESS_BULLET_PHRASE`, and the pack carries 20 bullets
  where it carried 19 — so a seat whose fence implicates the express path
  meets the rule in its brief rather than going looking. That truncation
  is a hazard of the pack rather than of this bullet, and any bullet with
  a long bolded opener carries it.

### Figures, each with its ref

- 24 bodies added, at 12c1d2a8: brief.spec.ts 17, run-record.spec.ts 4,
  merge.spec.ts 2, card-preflight.spec.ts 1 — derive:
  `grep -c '^test("T-320' tools/e2e/tests/*.spec.ts`.
- The diff against the lane's base 4f6a940c — derive:
  `git diff --stat 4f6a940c..HEAD`.
- The context pack carries 20 cited bullets at 12c1d2a8 where it carried
  19 at the lane's base — derive: `brief.mjs --task T-320` and count the
  `pack bullet:` lines.
- docs/conventions/dispatch-and-scratch.md is 10401 bytes at 12c1d2a8
  against its 10100-byte warn line (fail at 12120), so the docs gate
  WARNS and holds; T-320-s1 is the move that settles it.
- docs/CONVENTIONS.md is 13662 bytes at 12c1d2a8 against its 16930-byte
  warn line.

### Criterion 6 — what this lane built and what it did NOT measure

The amendment of 2026-09-14 during the lane rules that the demonstration
on a real eligible change is the seat's to drive, on the integration
branch after this merge: three of the five measurements (the executor
spawn, the merge and the push) are the seat's by construction, and a
child spawned into a live lane is a standing hazard. **THE MERGE-SIDE
FIGURES WERE NOT TAKEN BY THIS LANE AND THIS LINE SAYS SO** rather than
leaving a reader to discover it.

What the lane built is the shape, and it is pinned rather than described:
every instant stamped by whoever holds it, the five measurements derived
from the record by `expressMeasurements` over `expressInstants`, and the
block printed by the run report. Two bodies drive it over FIXED instants
and assert arithmetic, so nothing here can flake; a third drives the
whole round trip — assignment, start, outcome, collect — and reads the
figures back off the record.

**THE HAND-OFF, so the demonstration is a matter of running it.**

- **The precondition, and it is the card's own criterion**: this tree is
  the explicit no-grant state, so the express path refuses everything
  until a grant exists. Run the command with `--dry-run` to print the
  compact card's blob, record a grant naming that card and that blob, and
  run it again. That sequence is not a workaround: it is criterion 1
  working, and the dry run exists so the owner can approve bytes that
  have not been written yet.
- **The outcome sentence to use**: `WHEN the collect verb stamps an
  instant THE run report SHALL name each instant that call stamped.`
- **The command line**:
  `node tools/e2e/scripts/brief.mjs --express "<that sentence>" --fence
  tools/e2e/scripts/run-record.mjs --requested <the instant you gave the
  sentence> --scratch <the scratch directory>` — with `--dry-run` first.
- **Why that change is eligible, MEASURED rather than asserted**: the
  arm was run over that sentence and that fence in this lane and answered
  fence MET, keeper MET (run-record.mjs is owned by several specs through
  static imports), guard-class MET (no class hit), reversible MET
  (tracked, present, no generator marker) — and admission NOT MET, which
  is the no-grant refusal above and the only thing the grant settles.
- **The blob is a function of the card's bytes and the bytes carry the
  DATE**, so the sha printed in this lane is not the sha the seat's own
  run will produce. Take it from that run's own dry run and record THAT
  in the grant.
- **The refused control, which the card names as the demonstration's
  own**: the same command with `--fence tools/e2e/scripts/gate-run.mjs`
  and a sentence about one line of it — for instance `WHEN the scoped
  runner refuses THE line SHALL name the flag that scoped it.` Run in
  this lane, the eligibility answered guard-class NOT MET, naming
  tools/e2e/scripts/gate-run.mjs and the `gate-runners` class it hit,
  with every other requirement but the admission met — which is the
  refusal the card asks the demonstration to show, and the express run
  writes no card into docs/tasks for it.
- **Where the figures land**: `--run collect --instant
  checked=<iso>,merged=<iso>,pushed=<iso>` on the attempt, then the run
  report's own `measurement …` lines and `measurement verdict:` line are
  the block to append here as a dated seat note with the run's refs.

### The reading this lane took, and the six reds it carries

**THE GRADED e2e LEG AT 12c1d2a8: 1191 bodies, 1185 passed, SIX FAILED,
verdict RED** — and the six are ONE cause, named rather than summarised.
`docs-input-gate.spec.ts` runs the real docs gate against this checkout,
and `docs-gate.mjs` exits 1 while the committed docs/INDEX.md is stale;
so every body asserting "exit 0 for a code-only diff" reds with the
staleness. The six are the hand-run exit codes, the exit matrix, the
empty-list trap, the census's own question, the advisory scan, and the
currency check itself.

**THE INDEX IS STALE BECAUSE THIS LANE'S CONVENTIONS BULLET ADDS AN
OPENER** to the dispatch chapter's index line — 7736 bytes committed
against 7747 fresh — and docs/INDEX.md is OUTSIDE this fence.
docs/CAPABILITIES.md is stale too, from this lane's own new bodies
(110629 against 113944), and no body reds on that one. The seat granted
both generated files and then WITHDREW the grant the same day, because
lane-protocol rule five is mechanical and T-242 holds both beside this
lane; the fence writer would not write a fence that is not disjoint. The
local regeneration the correction then asked for is refused by the same
hook for the same reason, which is recorded in the lane's ask file and
ruled (a): leave them, and the merge regenerates both from the merged
tree, which is the census step the merge performs in any case.

**WHAT THAT MEANS FOR THE VERIFIER**: the six are a property of the
generated index and not of this lane's code, they disappear the moment
`npm run capabilities` runs anywhere with the fence for it, and every
other body in the leg is green — including the twenty-four this card
added and the two standing bodies this lane moved.

**THREE EARLIER READS, SO THE PROGRESSION IS ON THE RECORD.** At
48caf6ac the same leg answered RED on EIGHT: the six above, plus
`brief-flush.spec.ts`'s arm-list body (eleven new flags nothing
announced — the stale-enumeration failure that body exists to catch) and
`gate-run.spec.ts`'s one-mention body (the express bullet named the
blessed runner a second time, where the document names it once and the
neighbouring bullet asks for a description). Both were mine, both are
fixed, and both are green at 12c1d2a8.

### Owed at the merge, not in this lane

- **The census and the generated index**, as the section above records:
  `npm run capabilities` is owed in the merge commit, it cannot be run
  here, and six bodies of the graded leg red until it is. T-320-s2 is the
  finding that the generator says none of this when it refuses.
- **The graph regeneration**, on the standing trigger: this diff moves
  .mjs and .ts outside docs/.
- **The docs gate's budget WARN** on the dispatch chapter, recorded above
  with its figure and its follow-up card.

## Verdicts

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Phase 2 of the two-spawn bench, guarded tier, on the bench worktree
detached at the lane's tip 0584d103, base 4f6a940c. The diff and the
specs were read before the executor's report, which is what the guarded
mode buys.

**The sealed inputs, cited by digest.** The attack set written at the
base with no tools and no diff:
`sha256:72e73718a830efaab1fb760ce6d213ab018ad7448ccf1a3abdc76a23f960ec84`.
The ground taken at the base, carrying the seat's addendum of eighteen
measurements M1 to M18:
`sha256:794e5d27ecf55761a42cabd7f39388650a8fb07c50ff9d2115a83670f1d787c8`.
The card at 4f6a940c, which is the contract both phases were written
against:
`sha256:8000d4fcd536e3ddd31d02ac50ee106c32a3ade00e004bcac885d5ea45d53aba`.
All three re-hashed on this bench and all three match.

#### The battery at the tip I was sent, 0584d103

`gate-run.mjs parser app rust e2e`, port 25320, every leg in the
foreground on this bench.

| leg | bodies | verdict |
|---|---|---|
| parser | 454 | GREEN |
| app | 1171 | GREEN |
| rust | 658 | GREEN |
| e2e | 1191 | RED on 6 |

The e2e count against the ground's base reading of 1167 is +24 and
nothing was removed. The six reds are the six the seat attributed, they
are all in one file, and body 542 names the cause itself: the committed
docs/INDEX.md is stale. Measured here with `capabilities:check` at
0584d103 — docs/INDEX.md committed 7736 bytes against a fresh 7747, and
docs/CAPABILITIES.md committed 110629 against a fresh 113944. Both
generated files are outside the lane's fence, the fence writer is
mechanical, and the merge regenerates both from the merged tree. The
attribution stands; the reds are not this diff's.

- docs-input-gate.spec.ts:766 the hand-run gate's exit codes
- docs-input-gate.spec.ts:892 the exit matrix
- docs-input-gate.spec.ts:953 the empty-list trap
- docs-input-gate.spec.ts:1075 the census's own question
- docs-input-gate.spec.ts:1581 the advisory scan
- docs-input-gate.spec.ts:2083 the committed index is CURRENT

Method evals at 0584d103: 13 model-free, all green (12 at the base plus
MF-13). `--selftest` reds on MF-09 alone — the same one eval the ground
records failing its own positive control at the base, and not MF-13,
whose degradation control passes.

#### A row per acceptance criterion, with its evidence

| # | criterion | verdict | the evidence, and what would have broken it |
|---|---|---|---|
| 1 | compact XS card from a sentence and a fence, preflighted, admitted per mode | MET | The field set the body asserts is derived from TWO sources and neither is the generator's own list: `method/tasks/TASK-FORMAT.md`'s frontmatter block intersected with the fields two thirds of the live board carries, with the distance from that threshold asserted so no card filed tomorrow moves a field across it. Both standing sections at depth two, the sentence verbatim as the one criterion, fence as `touches:`, `size: XS`, `tier:` left for the stamp. A sentence not already in EARS form is refused naming the method file, and a caller that hands in NO reading is refused too. The four admission bodies drive `standing`, `each` (a second dispatch refused `ADMISSION_APPROVAL_CONSUMED`), `until` (refused `ADMISSION_CARD_NOT_APPROVED` bare, admitted as a derived repair, refused `ADMISSION_RECOVERY_NONE` under recovery none) and the explicit no-grant state — each over a grant written as text into the template and read back through the landed parser reader, not a literal object. My drill: remove one required field from the composer and the body reds BY NAME. |
| 2 | reuse an active card with a resumable writer | MET | One body plus three controls that each break one arm — a FINISHED writer, no writer, a fence that does not cover — and a second body that separates the board's reading from the record's, so a done card with a stale running record is not reused and its active twin is. `runExpress` stops at step 1, writes nothing, and names the continuation. |
| 3 | eligibility measured and printed; ineligible refused by name | MET | Five findings printed whether met or not, in the card's own order, each carrying both what it requires and what was measured. Five arms each break ONE requirement and the body asserts that exactly one finding moved. The guard-class arm is run through the conventions' REAL map with an ordinary script as its admitted twin — the refused control has the twin the card's own demonstration needs. My drill is the one that matters here: a DATA MUTANT in docs/conventions/architecture.md, dropping the `gate-*` prefix from the gate-runners class, REDS the body. The refusal follows the document, not a copy. See correction 1 and the finding on what the map does not cover. |
| 4 | executor only; requested beside observed; the merge refuses a mismatch | MET | The bounded-tier body asserts on the COMMANDS the ritual ran — one worktree add and it is not the detached one, no phase-1 file written — with a non-bounded control that cuts the bench and writes the phase 1, so the assertion is about the tier. Both skips are a ledger row and a note. The receipt's observed half is read from a line-initial `RUN-OBSERVED` in the completion and from nowhere else; a planted completion naming another model produces a mismatch naming both values; a partial completion keeps what arrived and records the rest `unknown`; a sentence MENTIONING the token is not the token. `keeper:receipt` is FLOOR beside the card's preflight and survives `merge.keepers: off`. My drills: removing the keeper's own card filter reds by name, and making `unknown` count as a mismatch reds TWO bodies at both ends — so the false-refusal direction is pinned as well as the true one. |
| 5 | preserve, withdraw by a dated append, re-triage | MET | The withdrawal appends at the END of `## Implementation notes` — a section the ceremony may already append to, so `cardDrift` still reads mechanical and the card keeps the approval it was admitted under — leaves the line that put the label on standing, stamps the re-triaged tier, and names the branch and the run record as KEPT (or says no record was bound rather than rounding it to none). Four refusals, each a control: no reason, `bounded` as the re-triage target, a label already withdrawn, a card that never had one — plus the clean twin. |
| 6 | the five measurements from stamped instants, targets stated | MET as to the SHAPE, which is what this lane owed | Every figure is a difference of two instants the record carries, and the row names both. The dispatch's two ride in on the assignment, `observeRun` stamps the candidate at the same instant it records the outcome so the two can never disagree, and the seat's three arrive through `--run collect --instant`, which refuses a half-read pair rather than keeping it. Two bodies drive fixed instants and assert arithmetic — no stopwatch, nothing that can flake — and a third drives the whole round trip through the verbs and reads the figures back off the record. Two rows carry a target and three say the card sets none; a run three times over its target reports THE TARGETS WERE NOT MET and says in as many words that a slow run recorded is not the objective achieved; a record with no instants judges nothing and says so. My drill: fold the runner's conclusion into the total and the body reds by name. The merge-side figures are the seat's by the card's own amendment of 2026-09-14 and I have not graded the lane for figures it could not take. |
| 7 | the seat coordinates and does not implement | MET | MF-13 holds three clauses of `method/roles/orchestrator.md` — the non-implementer sentence, the one edit a coordinator does make, and the bound on it — and its `check()` runs its own discrimination set, requiring each clause removed alone to be caught by name, so a green over a one-file scope cannot mean only that the file was read. Its `degrade()` is the rewording somebody would actually make rather than a deletion. Both pass here. |

#### What I attacked and what held

The attack set's central demands were met at the sites they name.
**C1** — the required-field derivation shares no arrangement with the
generator. **C2** — the composed card's `## Verdicts` heading is the
merge verb's own spelling. **C3** — the grants are round-tripped through
the landed reader. **C4 and C5** — the guard-class refusal follows a
data mutant in the conventions and has an admitted twin. **C6** — each
of the five requirements refuses alone and the body asserts that only
one moved. **C8** — the mismatch's operands are the record's own two
fields and there is no third value to confuse them with. **C10** — the
eval reds against a role file lacking the sentence, and I saw it.
**C11** — the spawn count is asserted on the commands that ran, not on
the tier field. **C12** — the figures are recomputable from the record
alone, and a body does exactly that.

The SECURITY SWEEP found the outcome sentence's injection surface
closed. Probed at the tip by composing cards from hostile sentences: a
sentence carrying `---` and a frontmatter field, and one carrying
`## Verdicts` and a dated `###` heading, both compose a card with
exactly three headings and no forged verdict — the one-line rule, the
`- ` prefix on the criterion and `JSON.stringify` on the title close it
between them. A sentence carrying a census ordinal scoped to this
repository's history composes, and then the card's own claim reader
raises `CENSUS` on it — so the express path's fourth step refuses it and
unwinds, rather than letting it stop a merge two hours later. The
authorization block's own files and the merge verb are inside the guard
class and cannot be express-edited. What is NOT closed is the subject of
the finding that opens the list below.

#### Findings — none of them a refusal, all of them recorded

1. **THE EXPRESS PATH'S OWN DECISION SURFACE IS NOT GUARD-CLASS, AND
   NEITHER IS THE MAP IT READS.** Measured at the tip by driving the
   landed `expressPlan` over three fences: `docs/conventions/architecture.md`
   (the file holding the map), `tools/e2e/scripts/dispatch-brief.mjs`
   (the file holding `expressEligibility` itself) and
   `tools/e2e/scripts/card-preflight.mjs` (the express path's own fourth
   step) each answer fence MET, keeper MET, guard-class MET and
   reversible MET, with only the admission refused because this tree is
   the no-grant state. Under any grant, a one-line express change to the
   gate that decides eligibility, or to the map that gate reads, takes
   the short road with no bench and no verifier. The map's coverage is
   the conventions' business and outside this fence, so criterion 3
   passes on its own terms — it reads the map rather than copying it,
   which is the whole of what it was asked for. But the express path is
   what makes the gap reachable. Filed as T-320-s6.
2. **THE EXPRESS LABEL AND THE BOUNDED CONTRACT ARE NOT BOUND
   TOGETHER.** The eligibility's keeper requirement asks whether a spec
   OWNS each path; `classifyTier` asks whether a keeper PINS it, which
   the ritual answers by grading the scoped suite, and returns
   `standard` where it does not. So an express-eligible change whose
   owning suite is red at the base is cut WITH a bench and a phase one
   while its card carries the line saying it was dispatched
   executor-only under the bounded contract; the `verify.tier` switch at
   `guarded-for-every-card` reaches the same end more directly. Nothing
   outside the withdrawal reads the label, so no step of the dispatch and
   no keeper of the merge asks whether a labelled card took the road its
   label names. Criterion 4 holds as written and is pinned with a
   control; what is missing is the binding. Filed as T-320-s7. It is
   T-320-s4's finding seen from the other side.
3. **THE ORDERING ARTIFACT IS IMPLEMENTED AND UNPINNED.** Criterion 1's
   ordering clause is real rather than a call sequence: the blob is
   computed from the composed bytes before any file exists, and step 3
   re-hashes the card on disk and refuses when the two differ. That
   re-check is the one artifact that makes the order observable. My
   drill disarmed it — `if (false && onDisk !== plan.blob)` — and all
   seventeen T-320 bodies in brief.spec.ts stayed GREEN. The property
   holds; the guard on it is the kind of line a later edit deletes as
   dead. Recorded in T-320-s8.
4. **TWO SEAMS ARE ARGUED RATHER THAN DRIVEN.** No body hands a record
   the flow actually wrote to `receiptKeeperReport` — the merge-side body
   uses an object literal cast through `as unknown as`, though both ends
   assert the same two field names against a real record, so the seam is
   narrow. And the body that drives the whole express run stubs the
   hand-over for a stated reason, so the claim that the arm's measured
   admission and the lane cut's binding one ask about the same bytes is
   argued in a comment. I read the code and the claim is TRUE —
   `cardBlobSha` hashes the working-tree file, which the express arm
   staged and the dispatch stamp has not yet touched. Filed as T-320-s8.
5. **THE FENCE REQUIREMENT IS VACUOUS ON THE DEFAULT.** With no
   `--changed`, the changed set IS the fence's expansion, so requirement
   2's containment half is true by construction and only its unresolved
   half measures anything. The printed line says so honestly
   ("N changed path(s) all inside") and the body drives the outside case
   through `--changed`. Recorded, not filed: at eligibility time the
   change does not exist, and the arm offers the dial for a seat that
   knows.
6. **CRITERION 7 HAS NO ENFORCEMENT SURFACE, AND IT WAS NEVER ASKED FOR
   ONE.** Authorship of an edit is recorded nowhere the pipeline reads,
   so no keeper can tell a coordinator's edit from an executor's. MF-13
   holds the TEXT and says so itself, which is the criterion's own ask.
   What would give it one is an attributed writer on the run record's
   reservation, compared at the merge. Recorded against the day somebody
   wants the rule enforced rather than stated.
7. **THE WITHDRAWAL'S TRIGGER IS THE SEAT'S.** Nothing detects a failed
   check or a scope the executor discovered, and nothing re-reads the
   candidate's diff extent under the express label. Criterion 5 asks for
   the withdrawal act and pins it thoroughly; the detection half is
   advisory and is named here rather than left to be discovered.
8. **A FIELD NEWLY DECLARED REQUIRED DOES NOT PROPAGATE AT ONCE.** The
   compact card's field set is the method's declaration intersected with
   what two thirds of the board carries, so a field added to
   TASK-FORMAT.md today is not required of a compact card until the
   board catches up. That is a defensible reading — the derivation is a
   conjunction and the body asserts its threshold is half the board away
   from any boundary — and it is the price of not sharing an arrangement
   with the generator. Recorded so the next reader meets it.

#### My drills — six mutants at the sites, every restore proved by sha256

The executor drilled five and reports them all killed. These are mine,
aimed at the properties the attack set named, and one of them lived.

| # | mutant, at its site | aimed body | answer |
|---|---|---|---|
| 1 | `docs/conventions/architecture.md` — the gate-runners class loses its `gate-*` prefix. A DATA MUTANT where the property IS data | brief.spec.ts, the five-requirements refusal | KILLED |
| 2 | `compactCard` stops writing `priority:` | brief.spec.ts, the required-field body | KILLED, by name: "the compact card carries no `priority:`" |
| 3 | `runExpress` step 3 stops comparing the card on disk against the blob the admission was measured against — `if (false && onDisk !== plan.blob)` | every T-320 body in brief.spec.ts | **SURVIVED** — all seventeen green. Finding 3 |
| 4 | `expressMeasurements` ends the request-to-delivery total at the runner's conclusion where one is given | brief.spec.ts, the runner body | KILLED, by name |
| 5 | `receiptKeeperReport` reads every record in the directory rather than this card's | merge.spec.ts, the receipt keeper | KILLED, by name: "the keeper read a record belonging to another card" |
| 6 | `launchReceipt` counts an `unknown` observation as a mismatch — the FALSE-REFUSAL direction, which is the failure mode that makes a gate nobody can keep green | run-record.spec.ts and merge.spec.ts | KILLED, TWO bodies at both ends |

Every file was restored with `git checkout --` and the restore proved by
sha256 against the reading taken before the plant; the tree was clean at
0584d103 afterwards.

#### The corrections, and why each is one

Three. One is a body with a mutant block, committed on this bench after
this verdict; two are WORDING CORRECTIONS AND CARRY NO BLOCK, which is
said here in as many words because a block nobody can drill is worse
than a block nobody wrote.

**Correction 1 — the reversible finding names readers that do not do the
reading. A BODY AND A BLOCK.** The finding prints, to the seat, that
whether the edit turns out to be a rename or a deletion is read by "the
merge's own keepers and the XS bound". It is not. `xsBoundBump` reads
the changed LINE COUNT and BUMPS the tier, which is a different
question, and `merge.mjs` asks at no step whether a path was renamed or
deleted — I read it for every spelling `git diff` answers that question
by (`--diff-filter`, `--find-renames`, `--name-status`, `--summary`) and
the only one it carries is `--diff-filter=U`, which lists unmerged paths
at a conflict. Reversibility is the one requirement that cannot be
measured when it is measured, so the disclosure is the ONLY thing
standing in for a check, and a seat that reads "the merge's keepers read
that" stops looking. The sentence now says the fence-time reading is the
whole of the guarantee. The body pins BOTH halves — the sentence, and
the tree the sentence is a claim about: it reads `merge.mjs` for those
four spellings and requires none, with the one the verb does carry as
its positive control, so the day the merge starts reading renames the
body reds and the sentence has to move with it. Drilled on this bench:
the false claim planted back reds the body by name, and the restore is
proved by sha256 — `tools/e2e/scripts/dispatch-brief.mjs` is
`c4a403ee55e1a00fafc5508d94725f07239e89252afffa4ff766199c0548ad3b`
before the plant and after the restore.

```mutant
correction: 1 — the reversible finding's disclosure is true of this tree
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: T-320 C3 — THE REVERSIBLE FINDING'S DISCLOSURE IS TRUE OF THIS TREE: nothing re-reads a rename or a deletion after the executor writes, and the sentence says so
message: the disclosure does not say that nothing re-reads it afterwards
--- old
      "moment, and NOTHING RE-READS IT AFTERWARDS: the merge reads the diff for forbidden " +
--- new
      "moment; the merge's own keepers and the XS bound read that: the merge reads the diff for forbidden " +
```

**Correction 2 — `parseInstantDial`'s comment promises a refusal the
code does not make, and the CODE is right. A WORDING CORRECTION, AND IT
CARRIES NO BLOCK.** The comment says a name the arm does not recognise
is refused; the arm checks the shape of the pair and the readability of
the instant, and accepts any name. It must: the runner's own conclusion
is stamped as a seventh instant beside the six the measurements are
differences of, and a closed list would refuse the one figure the card
asks to be kept BESIDE the total. There is no behaviour to change and
therefore nothing a mutant could plant; the comment is corrected to the
rule the code keeps, and it now says why the name is open.

**Correction 3 — `expressMeasurements` describes a parameter by
something that happens somewhere else. A WORDING CORRECTION, AND IT
CARRIES NO BLOCK.** `@param {string} [input.runner]` is accepted and
deliberately turned into no row — which is exactly right, and the body
above it pins that the total does not move — but the line calls it
"recorded BESIDE the total", and the recording happens in the record's
own instants map, which `measurementRunRecs` prints above the rows. The
parameter stays: removing it would red the typecheck at the body that
drives it. The line now says what it is for and where the figure lands.

#### What the merge still owes, unchanged from the executor's notes

`npm run capabilities` in the merge commit, from the merged tree, for
both generated files; the graph regeneration on the standing trigger
(this diff moves .mjs and .ts outside docs/); and the docs gate's budget
WARN on the dispatch chapter, which T-320-s1 is the move that settles.
T-204's re-triage against what this card discharges is owed at the same
sitting by the card's own re-check.

#### Postscript — the readings at my OWN tip

Left for the commit that follows the corrections, because a figure
measured at the commit I was sent is stale at the tip my verdict
creates.
