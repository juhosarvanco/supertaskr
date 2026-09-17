---
id: T-344
title: "The dispatch grant lives in the shipped runtime template, so recording an owner's approval costs a full code publication and the generated kit carries this project's authorization: move the active grant to one authoritative operational store at one designated integration checkout, updated by a command that validates, writes atomically and retains history, and leave the shipped template carrying no grant"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: done
suggested_by: "the architect seat on 2026-09-16, on the owner's requirement that a routine grant revision trigger no suites, commits, pushes or CI, and on the owner's scoping ruling of the same day; the kit half was found by the seat while checking the cost and corrected in wording after the Codex orchestrator's review"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, method/runtime/supertaskr.yaml, method/runtime/process-schema.yaml, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/reference/15-settings.md, app/src-tauri/src/agent/kit.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## Filing provenance

Filed 2026-09-16 by the architect seat. The owner's requirement is the
card's whole reason and is quoted in effect rather than paraphrased:
routine grant revisions must trigger no suites, no commits, no pushes and
no CI. The scope below is the owner's ruling of the same day and is not
the seat's preference.

THE FENCE IS EMPTY ON PURPOSE. The reader and the admission both live in
the dispatch arm, the most contended file on this board, and the store's
own home is a preparation question. Establish the owning files and a
supported route at promotion and write the fence then. Preflight then
too; none has been run against this card.

## The finding

Two halves, both measured rather than argued.

**AN APPROVAL COSTS A CODE PUBLICATION.** The grant block sits in the
runtime template, which is a genuine code input: the parser's settings
reader declares it, four end-to-end specs and the arm read it, and the
Rust kit embeds it. Measured at this tip by deriving the owed set over a
probe commit that changed the template and nothing else: FOUR SUITES,
with the end-to-end leg at 22 of 42 spec files. So recording that the
owner approved one more card costs the same publication a code change
costs — roughly twenty minutes of local battery and a runner cycle in the
half-hour band.

THAT COST IS NOT CEREMONY AND MUST NOT BE SKIPPED WHILE THE GRANT LIVES
THERE. A template change really can red bodies: T-330 exists because
fixtures copied the live template and the approved grant failed
twenty-two of them. The repair is to stop the datum being a code input,
never to stop looking at it.

AND NO TRACKED PATH CAN OWE ZERO, which is why moving the file inside the
repository cannot reach the requirement. Measured over two further probe
commits: a tracked file that nothing reads and lies under no package root
is UNPLACEABLE and takes the fail-closed whole battery, while the
friendliest case — a documentation file nothing reads — still owes the
end-to-end suite, because the census, the index and the board-reading
bodies walk that directory. One suite is the floor for anything tracked,
and a grant can never be in the friendliest class anyway, because the arm
reads it by definition.

**AND THE GENERATED KIT CARRIES PROJECT AUTHORIZATION.** The kit's
snapshot table embeds the runtime template whole, through an
include-the-file-at-compile-time directive, and the only test on that
entry asserts the PATH rides the kit and never its content. So a binary
built from the source as it now stands embeds this project's approval
block — its mode, its order and eight card identifiers pinned to blobs
that exist in no other repository — into the kit it generates.

THE WORDING OF THAT HALF IS DELIBERATELY NARROW, and the seat's first
statement of it was withdrawn for being wider. What is established is
that project-specific authorization is contaminating a reusable template.
What is NOT established is that any existing binary or already-created
project received it, or that a foreign card identifier would successfully
authorize any work. The contamination is the finding; the blast radius is
unmeasured and the card claims none.

## What would settle it

THE SCOPE IS THE OWNER'S AND IS NARROWER THAN THE SEAT FIRST DREW IT.

**One designated integration checkout, one authoritative store.** The
active grant lives in exactly one place, belonging to the checkout that
coordinates dispatch, and successor sessions in that checkout inherit it
by finding it rather than by being told. There is no second copy and no
synchronization between copies.

**Worker lanes receive admissions from the coordinator.** A lane does not
consult a grant of its own and does not hold one. What reaches a lane is
the admission the coordinator already decided.

**An unsupported location refuses, clearly and by name.** Reading the
store from a lane worktree, a detached checkout or anywhere that is not
the designated integration checkout is answered with a refusal that says
which location it was and why it is not the one — never with a silent
"no grant" and never with a guess. This follows the pause record's
existing rule, which is the strongest sentence in that reader: an
unreadable record is never "nothing is paused", because the one case
where guessing costs most is the one where the owner asked the loop to
stop. An unverifiable grant is closer to no grant than to an approved
one.

**Deferred, explicitly and not by omission**: transfer of authority
between hosts, and reconciliation of competing grant histories. The card
builds neither. Where either would be needed the answer is the clear
refusal above, so the gap is visible rather than silently filled.

**MOVING THE FILE IS NOT THE SAME AS BREAKING THE COUPLING, and this tree
has already been bitten by the difference.** An untracked store is still a
file, and a body that reads it is still coupled to it. That is precisely
what T-330's rejection was: the reader took a root, and eight call sites
did not name one, so fixtures that were supposed to be controlled read
the live configuration anyway. The runtime records this card sits beside
are read through a root today — the pause reader joins a relative runtime
path to the root it is given — so the shape is right and the defect, when
it comes, will be at the call sites rather than in the reader.

SO THE CARD OWES TWO BOUNDARIES AND NOT ONE. That a routine update never
enters publication, and that no fixture consumes the active grant. The
second is proved the way T-330 proved it: plant a real grant in the
designated store and show the fixtures decided by their own
authorization fixture and not by it.

**The update path keeps four properties.** A revision validates before it
writes — the approval and its instant recorded, the block through the
parser's reader, the cards it names resolvable. It checks the revision it
expects against the revision on disk and writes nothing if they differ.
It writes atomically. It retains the superseded revision as history, in
the shape the parser's reader already validates: a list of earlier
grants, each read whole, each required to sit below the current revision.
And it is recoverable — the history is not the only copy.

**Reuse the primitives, leave an extension point, build no framework.**
The tree already carries atomic-write, locking and validation helpers;
this card uses them rather than introducing storage of its own, and
shapes its interface so a later card can take it up. IT DOES NOT BUILD A
GENERAL OPERATIONAL-RECORD FRAMEWORK, and neither a settings migration
nor a metrics migration is a prerequisite. The seat's first draft of this
card asked for machinery a second datum could use without a second
migration; that was corrected on review as the kind of generality that
grows a card. The runtime template does also carry the role model and
effort selections, which are project selections in a shipped file for the
same reason — but they wait for their own card and their own design. This
one moves the grant.

**The shipped template carries no grant, and a body says so about the
KIT.** The assertion belongs against the kit's embedded content, not
against this project's live file. Two bodies once asserted the live tree
was the explicit no-grant state and T-330 retired them correctly — they
were asking a good question of the wrong artifact.

## The rationale the criteria deliberately do not carry, recorded 2026-09-17

**WHY THE PUBLICATION CRITERION IS ONE LINE.** An earlier draft wrote the
whole account of rejected alternatives into it. That is rationale and
belongs here. The bypasses exist: the pre-push hook is skippable by git's
own design, and GitHub's documented commit-message markers skip a
workflow run as platform behaviour. Two reasons not to use them.
`.github/workflows/ci.yml` declares a schedule trigger and a scheduled
run answers the whole battery on the default branch, so a skipped push's
tree is graded later and detached from the change that caused it. And a
generic bypass verifies nothing about whether the change qualifies for
it, which is the property this card exists to build.

**WHY TWO OF THESE CRITERIA ARE NOT SEPARATE CARDS.** The refusal on a
missing snapshot is right for a store that has been used and wrong for a
project that has never had one, so initialization has to be a distinct
authorized destination-refusing operation rather than a special case of
reading. And the interruption clause covers the gap between the journal
append and the snapshot replacement, but not the case where the write
became durable and only its ACKNOWLEDGEMENT was lost; a retry there must
recognise the intended state as already current rather than mint another
revision. Both are gaps in this contract, not work beside it.

**ON REUSING HELPERS.** Reuse is required, and it is not a licence to
assume: check that a helper actually meets the durability or concurrency
property being relied on before relying on it.

**ON THE MEASURED FLOOR, QUALIFIED.** Probe commits measured at
`e4050bd2` established that an unplaceable tracked path takes the whole
battery and that the least expensive measured case still selected one
suite. THAT IS A PROPERTY OF THE MACHINERY AS MEASURED, not an
architectural impossibility established by examples. It is why moving the
grant within the repository does not reach the requirement under today's
derivation; it is not a proof that no derivation could.

**ON PROVENANCE VERSUS APPROVAL.** The store carries who approved and
when. That records the approval; it does not establish it, and this card
must not silently claim the stronger guarantee T-339 is filed to build.
Name the procedural check this command actually performs, and say plainly
that it is procedural until that binding lands.

**NO HISTORY-GROWTH BENCHMARK IS ASKED FOR.** The read boundary is
implemented directly — the snapshot is opened, the journal is not — and
demonstrated by the current-only criterion. No revision-count experiment
is part of this contract.

## How this stands with T-339

The two cards share one contract and must not become two designs.

T-344 owns WHERE the grant lives and HOW it is updated. T-339 owns WHAT
IS CHECKED — the order and the card map read against each other in both
directions, and the block bound to something outside itself.

This move HELPS T-339 without discharging it: the record gains a
retained revision chain and a designated home, which are things a reader
can check. It does not make the grant unforgeable, because an agent with
write access to the store can still write it. T-339's promised guarantee
is auditability and drift detection rather than prevention, and its text
already says so.

T-339 is amended at its promotion to read the store this card builds
rather than the template block. Its criteria otherwise stand.

## Acceptance criteria

- WHEN a routine grant revision is recorded THE update SHALL run no test suite, create no commit, perform no push and start no continuous-integration run, and a body SHALL demonstrate each of those four by observation rather than by assertion.
- WHEN a revision is recorded THE command SHALL validate before writing — the approval evidence and its instant present, the block accepted by the parser's own reader, every card the order names resolvable on the board with the approved version it claims — and SHALL write nothing when any of those fails; THE card SHALL name the procedural check this command actually performs on the approval and SHALL NOT present the presence of a provenance field as evidence that the owner approved it.
- WHEN a revision is recorded THE command SHALL compare BOTH the expected prior revision AND the expected prior content against the store, under the same concurrency protection that guards the write itself, and SHALL write nothing, naming what differed, when either differs; two writers SHALL NOT both pass an earlier unprotected check and overwrite one another.
- WHEN a revision is written THE write SHALL be atomic, so that a reader meets either the whole prior revision or the whole new one and never a partial record.
- WHEN the store is written THE current authorization SHALL live in its own self-contained snapshot carrying the effective policy, the approved cards and their versions, the revision, the provenance and any applicable limits or revocation state, and the SUPERSEDED revisions SHALL live in a separate history journal; the snapshot SHALL be readable without reading the journal.
- WHEN the loop starts, when an admission is decided and when the grant is displayed THE reader SHALL open the current snapshot ONLY, SHALL NOT open or print accumulated history, and a body SHALL demonstrate each of those three paths leaving the journal unread; the journal SHALL be opened only for an explicit historical query or a recovery.
- WHEN the current snapshot is missing or unreadable THE reader SHALL REFUSE pending an explicit recovery, and SHALL NOT reconstruct authority from the journal automatically; the journal holds SUPERSEDED revisions, so it is neither authoritative on its own nor necessarily a copy of the grant that was last in force, and a body SHALL demonstrate the refusal rather than a silent restoration.
- WHEN no snapshot exists THE creation of one SHALL be an explicit authorized writer operation that refuses an existing destination under the same write protection as any other write; a routine read SHALL NEVER create or restore authority, a missing snapshot AFTER PRIOR USE SHALL NOT be treated as a fresh project, and an explicit recovery SHALL identify the intended authorization rather than inferring it from the journal's last entry.
- WHEN an update is interrupted between the journal append and the snapshot replacement THE recovery SHALL be defined and demonstrated: a journal entry alone SHALL NOT be evidence that a new grant became active, success SHALL be reported only after the intended state is durable, a retry SHALL NOT append a duplicate, and the latest effective authority and its provenance SHALL be unambiguous at every point.
- WHEN an update has become durable but its acknowledgement is lost THE retry SHALL report that the identical intended state is already current, or SHALL report a conflict or an uncertain outcome without mutating again, and SHALL NOT create a new revision because the caller missed the success; a matching revision number alone SHALL NOT be accepted as evidence that the intended state is the one in force.
- WHEN the store is read from anywhere that is not the designated integration checkout THE reader SHALL refuse, naming the location and why it is not the designated one, and SHALL NOT answer "no grant"; a body SHALL demonstrate the refusal from a lane worktree and from a detached checkout.
- WHEN a lane requires an admission THE admission SHALL reach it from the coordinator, and a body SHALL demonstrate that a lane consulting a store of its own is refused rather than served.
- WHEN cross-host transfer or a competing grant history is met THE answer SHALL be the explicit refusal above, and the card SHALL record both as deferred by the owner's ruling rather than as unhandled.
- WHEN the legacy grant is migrated THE migration SHALL carry the exact approved grant WITHOUT widening it, SHALL preserve existing admissions, consumed approvals, pauses and revocations, and WHEN the operational store is missing or unreadable after migration THE reader SHALL NOT silently restore the broader legacy authorization the template carried.
- WHEN the kit is generated THE embedded runtime template SHALL carry no dispatch grant, and a body SHALL assert that over the KIT's own embedded content and SHALL be shown to fail against a kit built from a template carrying one.
- WHEN the active grant is present in the designated store THE fixtures SHALL NOT consume it, and a body SHALL plant a real grant there and demonstrate that fixture dispatches are decided by their own authorization fixture; every call site reaching the store SHALL name its root rather than defaulting to the live one, and a body SHALL be shown to fail against a call site that defaults.
- WHEN this card is built THE work SHALL reuse the atomic-write, locking and validation helpers this tree already carries rather than introduce storage of its own, and SHALL leave an extension point a later card can take up; a general operational-record framework, a settings migration and a metrics migration SHALL NOT be prerequisites, and the card SHALL name what a later card would have to add to move the role model and effort selections through the same path.
- WHEN this card lands THE runtime template SHALL no longer be the home of the active grant, and a body SHALL demonstrate that a template carrying a grant block is not read as authority.
- WHEN the publication dependency is removed THE removal SHALL be the datum leaving the publication path, and the update SHALL introduce no generic hook or continuous-integration bypass.

## Implementation notes

## The fence, and the representation, settled 2026-09-17

THE FENCE IS EIGHT PATHS, derived against the tree at `49fa58ca` and
reviewed. What each is for:

- the dispatch arm — the store's path constants beside the pause record's, the snapshot reader, the succession reader, and the single admission site that reads the template's block today
- `brief.mjs` — the CLI entry for the update command
- the runtime template — the grant leaves it
- the process schema — its declaration that the template is the approval's home, and its consumer table naming every grant field against the function that reads it
- `brief.spec.ts` and `cli.spec.ts` — the CLI and arm bodies, and the focused grant check
- `gate-run.spec.ts` — the dispatch-block-reader derivation, whose subject changes
- the agent kit — the body asserting the kit's embedded template carries no grant

THE PARSER'S OWN SOURCE IS DELIBERATELY NOT IN THE FENCE. Whether the
store's validation can be reached without touching the reader is an
implementation possibility to demonstrate rather than a settled fact. If
the lane finds it cannot, that is a fence widening through the ask file,
which is the normal mechanism and cheaper than a dead entry.

THE REPRESENTATION IS THE IMPLEMENTER'S AND IS SETTLED HERE rather than
escalated: a YAML current snapshot at `.supertaskr/dispatch-grant.yaml`
carrying the same block shape the existing reader accepts, and a JSONL
journal at `.supertaskr/dispatch-grant-history.jsonl`, one superseded
revision per line. They are different objects with different jobs — the
snapshot is validated on every read and should go through the reader that
already exists; the journal is appended to and read only for audit or
recovery, where one line per revision appends in constant time and a torn
final line is detectable. TWO CONSTRAINTS ON WHATEVER IS BUILT: the
existing block reader still requires a `history` field, so a compatibility
representation carries `history: []` and never loads the archive; and the
store wrapper must reject missing grant content and validate its project,
location and format metadata, and must NOT inherit the existing reader's
permissive fallbacks for an absent template or schema. An absent
operational store is not a permissive state.

THREE THINGS THE FENCE WORK ESTABLISHED, each corrected once already:

- **An atomic-replace helper DOES exist in this repository** — `write_atomic` in the agent kit, temp sibling then rename, used by the session registry. It is Rust. No suitable JavaScript one has been identified, so write a small one; do NOT invoke the Rust helper to satisfy a reuse criterion, and note it establishes atomic publication only, not this card's locking, acknowledgement or retry obligations.
- **The store's reader and writer must not import the run-record module.** That module imports the dispatch arm, and the arm's own comment at its admission ledger says it imports nothing back because a cycle "would be a load-order bug nobody could see from either file". A direct exclusive-create at the write site is smaller and safer than exporting a one-line wrapper.
- **Exclusive creation is not atomic publication.** Creating the destination exclusively and then filling it in place still lets a reader see a partial snapshot. Publish a complete snapshot under the same protection that makes the creation exclusive.

AND ONE CONSTRAINT THAT SHAPES THE VERIFICATION. After this lands the
store is untracked and local, and a runner has none — an ordinary grant
revision has no publication range at all, which is the point of the card.
So the focused check's one live-tree call cannot simply be retargeted at
the store; the live validation belongs to the operational command, which
runs where the store is, and the suite keeps its controlled drills through
the IO seam that check already has. The same applies to the derivation
body: do not retarget a publication-owed selection test at a datum that
can never appear in a range.

THE FENCE WAS WIDENED BY ONE PATH ON 2026-09-17, during the lane, on the
executor's ask and the seat's grant. `tools/e2e/tests/run-record.spec.ts`
joins it. THE SEAT'S FENCE HAD MISSED A CONSUMER: `run-record.mjs`'s
`admissionAt` calls `grantState(root)`, and while that module already names
its root — which is what the fixture-isolation criterion asks of every call
site — its bench plants the grant by writing a block into the bench's own
copy of the runtime template. After this card the template is no longer
read as authority, so that helper would plant nothing and twelve bodies at
three admission boundaries would stop measuring the refusals they were
written for. The executor found it by deriving `grantState`'s call sites
rather than by trusting the fence; the seat verified all three claims
against the tree before granting — the call at `run-record.mjs`, the
helper writing the template in the spec, and the count of twelve.

A SECOND WIDENING FOLLOWED MINUTES LATER, same lane, same mechanism:
`tools/e2e/tests/brief-flush.spec.ts`. The fence now names ten paths. The
end-to-end leg's first red was that spec's arm-list guard, which derives
`brief.mjs`'s own frozen flag literal and requires every flag to be either
driven by a live arm or argued into the not-an-arm list with a reason. The
update command adds six flags, so the guard fired on its first run — doing
exactly what it was built to do, catching a flag nothing announced.
Verified at the tree before granting: the body, the two lists and the
regex that reads the literal are all where the executor said.

THE EXECUTOR PUT A DESIGN CALL TO THE SEAT RATHER THAN DECIDING IT, and it
was right to. Its six entries go in the not-an-arm list rather than making
the grant's read a driven arm, because this card's eleventh criterion has
the store REFUSE anywhere that is not the designated integration checkout
— and that guard runs in a lane worktree and on the verifier's detached
bench, where the arm would answer a refusal on standard error rather than
a sized answer. A size guard cannot measure a refusal. Making it a driven
arm would mean the store answering in exactly the two places the card says
it must not. The seat's ruling is the not-an-arm list, each entry carrying
its own reason; the read's CONTENT is graded in the spec the fence already
carries.

A THIRD WIDENING, and the lane reported it the moment the leg found it
rather than batching it: `docs/reference/15-settings.md`. The fence names
eleven paths. The schema's own dispatch-block declaration said the grant's
home is the runtime template and its read-site table named the block's
reader — both false after this card — so the executor corrected the
declaration's `effect:` field, which is RENDERED into a generated
reference chapter. The chapter is now stale by exactly one line, derived
rather than described: the executor generated the page to a scratch file
and diffed it against the committed one, and the rest is byte-identical.

IT BELONGS TO THIS LANE AND NOT TO THE MERGE, which the seat verified:
`merge.mjs` carries no reference to that page at all, so the integrator
does not regenerate it the way it regenerates the graph, the census and
the index. It is a hand-run regeneration committed with the schema change
that moved it. The executor also named and rejected the alternative of
reverting its `effect:` edit, correctly — a shipped declaration that says
the approval lives in the template is worse than a stale page, and the
schema is in this fence precisely so that sentence can be made true.

THE WIDENINGS MOVED THIS CARD'S BLOB, so the grant was re-pinned to
revision 3 in the same commit. A fence lives in frontmatter and frontmatter
is not mechanical drift, so a widening during a lane always owes a
re-pinning; that is the mechanism working rather than a cost to avoid.

SIZE: the frontmatter says M, which was inherited rather than derived. The
seat's reading against this fence is L. Whoever verifies should grade
against what the work actually is.

## What this command checks, and what it does not, recorded at the build

THE CHECK THE UPDATE COMMAND PERFORMS ON AN APPROVAL IS PROCEDURAL, and
naming it is the point of this section. Before it writes anything the
command requires that the record is COMPLETE and INTERNALLY CONSISTENT:
an approver and an instant are written down; the block is accepted by the
parser library's own reader against the shipped declaration; and every
card the order names exists on the board at a version this repository can
still produce, with the blob compared against git's own hash of the file
and the object database asked for the approved bytes where the card has
moved. The write is then compared against the revision AND the content it
expects, under the lock that guards the write itself.

NONE OF THAT ESTABLISHES THAT THE OWNER APPROVED ANYTHING. The record
carries who approved and when; the presence of a provenance field is
evidence that somebody wrote a sentence down, and it is not evidence of
the approval that sentence describes. An agent with write access to the
store can write one. Binding the record to something outside itself is
T-339's, and this command must not be read as having done it. The arm
prints that sentence beside every grant it displays and beside every
revision it writes, so a reader who never opens this card still meets it.

## What a later card would have to add to move the role and effort selections

The runtime template still carries the model per role and the effort
selections, which are this project's choices sitting in a shipped file
for exactly the reason the grant was. Moving them travels the same path
and is NOT discharged here. What a later card would have to add, named so
the extension point is a claim rather than a hope:

- a datum descriptor of their own beside the grant's — the relative paths
  of a snapshot and a journal, a format number, a validator and a content
  extractor, which is the shape the update path already takes rather than
  a framework it would have to grow;
- a RESOLUTION RULE the grant does not need, because a selection must
  answer in every checkout while a grant must refuse outside one: the
  shipped template becomes the DEFAULT a project starts from and the
  store becomes the override, so a lane and a scaffolded project still
  resolve a model while an unverifiable grant still refuses;
- a reader at every consuming surface that names its root, since the arm,
  the CLI, the settings screen and the skill all render these today and
  each is a call site the store's own criterion covers;
- and a migration that carries the shipped values without widening them,
  proved the way this one is: the values in the store compared field by
  field against the template's.

A general operational-record framework is still not a prerequisite, and
neither is a settings migration nor a metrics migration.

## The store as built, for whoever reads this next

The current authorization is a self-contained YAML snapshot at
`.supertaskr/dispatch-grant.yaml` carrying a `store:` header the wrapper
validates — format, project, location and host — above the `dispatch:`
block the parser's own reader validates. The superseded revisions live in
`.supertaskr/dispatch-grant-history.jsonl`, one per line; the
immediately superseded snapshot is also retained whole beside it, so the
journal is not the only copy of the revision most likely to be wanted.
The lock is an exclusive create, taken before the compare and released
after the publish; the publish is a temp sibling, flushed, renamed, with
the directory flushed after it. The runtime directory's ignore file is
ensured before anything is written into it, because a store nothing
ignores is one wildcard `git add` away from being back on the publication
path the card removed it from.

THE LOCATION CHECK RULES OUT RATHER THAN RULES IN, and that is worth
saying plainly. It refuses a linked worktree, a detached head and a task
branch; what pins a store to ONE checkout is the location the snapshot
itself records, compared against the checkout reading it on every read.
So a fresh repository with no store is a checkout that MAY hold one,
which is the honest answer for every project this kit scaffolds, and a
store that travelled is refused by name.

## Verdicts

### 2026-09-17 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Verifier, phase 2, a fresh spawn on the detached bench
`../supertaskr-V-T-344` at the lane tip `ee11d037`, graded against the
diff `cb60d6d3..ee11d037`. Bench port 25344.

PHASE ONE'S PRE-COMMITMENT, CITED AS REQUIRED:
`attack-set-T-344.md`, sha256
`0ffb983de0a00e1e4811f1312dfa822c581ef0a633937dc5c9dd71b979044015`.
Nineteen criteria, one attack section each, plus a frame disclosure and
seventeen measurement requests. The grounds taken at the base before the
diff existed: `ground-T-344.md`, sha256
`85240a676b9c681c139e276ff654ee59a689fc3da0f776dc2403efa983fead2b`.

**THE PRE-COMMITMENT IS PARTLY CONTAMINATED AND ITS OWN FRAME SAYS SO.**
Phase one held file, shell and git tools and used none, which is a kept
discipline rather than a structural blindness; and the project's memory
index and several commit subjects reached it unrequested. It marked the
attacks those touched CONTAMINATED — A1.5, A2.2, A5.3, A10.5, A11.3,
A13.3, A14.4, A15.4. Those are graded below as disclosed guidance, not
as blind prediction, and each row that rests on one says so.

**WHAT DECIDED THE HARD ROWS WAS MEASUREMENT AT THIS BENCH, NOT THE
REPORT.** Phase one left seventeen requests; the grounds answered six.
Rather than grade the rest ungradable I took the readings myself, and
every figure below carries the ref or the arrangement it was taken at.

#### The three reds, checked rather than accepted

The leg at the lane tip reports 1231 collected, 3 failed, 1228 passed,
with `push-guard.spec.ts` at 5474, 5502 and 5534 failing `EACCES` on a
double copy of the conventions document. **THE ATTRIBUTION HOLDS AND I
DID NOT TAKE IT ON TRUST.** At this bench, `docs/CONVENTIONS.md` is mode
644 where the fenced lane has it 444, and the whole spec file runs
**123 passed, 0 failed, exit 0, 1.8m** here at `ee11d037` — the three
named bodies among them. The defect is lane-only and already filed as
T-333. It is not this diff's and nothing in this diff reaches it.

#### The rows — nineteen criteria, nineteen readings

| # | criterion | verdict | what decided it |
|---|---|---|---|
| 1 | no suite, no commit, no push, no CI, by observation | MET | `brief.spec.ts` "A ROUTINE GRANT REVISION RUNS NO SUITE…" run at this bench, green. It drives the real command in a real git fixture behind a PATH shim, PARSES each git subcommand rather than grepping, requires every verb used to be in a named read-only set, and asserts HEAD unmoved and `git status --porcelain` byte-identical. Phase one's A1.1/A1.3 (observation-by-mock, the absence being the absence of git) are defeated by the shim's own positive control; A1.2/A1.5 by the porcelain equality, which phase one itself called the cheapest decisive observable in the set. |
| 2 | validate before writing; the card names the procedural check | MET | I drove it: four `initGrantStore` calls at a fixture — empty `given_by`, empty `at`, a card not on the board, a blob this repository cannot produce — each refused `GRANT_STORE_INVALID` with **the store absent from disk afterward in all four**. Validation is the parser library's own `dispatchBlock` (each refusal carries that reader's own message), which defeats A2.2's lookalike; the board is the arm's own card index at the named root with the blob compared against git's own hash, which defeats A2.3. A2.4 is answered in as many words by the card's new section and by the sentence the arm prints beside every grant. FINDING below on A2.5 and on the absent body. |
| 3 | expected revision AND content, under the write's own lock | MET | `updateGrantStore` reads inside `withGrantStoreLock`, so A3.1's check-then-lock is defeated by construction. The body spawns a real second OS process against a held lock and gets `GRANT_STORE_LOCKED`, then the identical call with the lock free succeeds — the control A3.4 demanded. The content compare is caller-supplied against bytes on disk, not a self-stored digest (A3.2), and revision and content are separate refusals with separate messages (A3.3, A3.6). |
| 4 | the write is atomic | MET | The body polls from one process while a writer runs in another, and its CONTROL is the design the card's own notes reject — exclusive creation then an in-place fill, at the same chunk size and the same synchronous pace — asserted to yield `PARTIAL`. That is the only arming A4.4 allowed. `writeFileAtomic` puts its temp sibling in the destination's own directory and fsyncs the file and then the parent directory, which defeats A4.2 by construction rather than by the host accident the grounds recorded at M5, and answers A4.1's crash reader. |
| 5 | self-contained snapshot, superseded revisions in a separate journal | MET | A5.1's arrangement is run: the snapshot is read with the journal `chmod 000`. A5.2's decorative-fields attack I armed myself — a grant carrying `limits.tokens` and `limits.expires_at` writes and reads back from the snapshot, and a revocation round-trips end to end with `current` reading null. A5.3, which phase one marked CONTAMINATED, is defeated: after init+update the journal holds exactly the one superseded revision, and the already-current retry grows it by nothing. |
| 6 | three read paths open the snapshot only | MET | The journal is made unopenable and all three real entry points keep working, with the control taken FIRST (`readGrantJournal` must throw on it). I closed A6.4 — a module-load side effect — by observing a WHOLE process from spawn to exit: a fresh node process read the grant at revision 2 with the journal shut, exit 0. The reader STATs the journal for one bit and never opens it; the executor disclosed that rather than leaving it to be found, and `chmod 000` is exactly the arrangement that permits it. |
| 7 | a missing or unreadable snapshot refuses, pending explicit recovery | MET | A7.1 demanded a data-mutant table and I built one: zero length and truncated refuse `METADATA`; wrong types, permission denied and a DIRECTORY at the path refuse `UNREADABLE`, each naming its reason. C7 and C8 are demonstrated as ONE arc in one body — lose it, recover it by naming the intended revision, decide — which is what phase one's cross-cutting note required. A7.4 is defeated: nothing memoizes, and the refused read restores nothing. FINDING below on the seventh shape. |
| 8 | creating a snapshot is an explicit authorized write | **CORRECTION 1** | A8.1's TOCTOU is defeated — I ran four concurrent creations and exactly one won, three were told `GRANT_STORE_EXISTS`. **A8.2, which phase one called its sharpest attack on this criterion, LANDS.** A store created and never revised leaves no journal and no retained superseded snapshot, so losing its snapshot read as a checkout that had never held one — the fresh-project answer this criterion forbids. Measured, corrected and pinned below. |
| 9 | interruption between the journal append and the snapshot replacement | MET | The order is journal-then-snapshot and the journal holds SUPERSEDED revisions, so A9.4's contradiction dissolves rather than being fallen to: an entry says an old grant stopped being current, and until the rename the old one is still what the snapshot names. The body asserts exactly that, then retries with the REAL command and gets no duplicate. The dedupe is on the (superseded revision, superseded-by, digest) triple, never the number alone (A9.2). One commit point is named and demonstrated (A9.5). |
| 10 | a durable update whose acknowledgement was lost | MET | The digest is taken over the BLOCK and not the file, so a snapshot rewritten at a different instant compares equal — with a control that a WIDENED order digests differently, which is what stops A10.2's normalizing comparison. Identical payload answers `already-current` and mutates nothing; the same revision number carrying different authorization answers `GRANT_STORE_CONFLICT`. A10.5 is largely defeated because the digest covers `given_by`, so another provenance is a conflict rather than a false already-current. |
| 11 | refused outside the designated integration checkout, naming the location | MET | **A11.3 IS THE ROW THE GROUNDS WERE TAKEN FOR, AND THE BUILD DOES NOT FALL TO IT.** The location classifier only RULES OUT; what pins one store to one checkout is the `location:` the snapshot itself records, compared against the resolved root on every read — so a full clone of this repository sitting elsewhere on the same machine — the case phase one named as the one most likely to occur — is refused by name, with "no second copy" in the message. A11.1 does not apply: designation is derived from git, with no environment variable anywhere. A11.2 I drove on this case-insensitive filesystem: reading through an upper-cased path REFUSES rather than adopting, which is the safe direction. FINDING below on A11.6. |
| 12 | the admission reaches the lane from the coordinator | MET | Both arrangements A12.1 demanded are covered: a lane with a store planted in its own runtime directory and a lane with none, each refused `NOT_DESIGNATED` naming the location rather than answering "no grant". The lane is a real `git worktree add` on a task branch, which defeats A12.4. The coordinator decides the admission as a value carrying the revision it binds to. FINDING below on A12.2 and A12.3. |
| 13 | cross-host transfer and competing histories refused and recorded as deferred | MET | A13.2 asked whether the snapshot carries the identity of the checkout it was written for, and said its absence would make both this criterion and the eleventh softer than they read: it carries BOTH host and location, and both refusals are driven by a body. **A13.1 I armed myself** — two journal entries superseding one revision with different bytes produce exactly one finding naming the reconciliation as DEFERRED, and the historical query exits non-zero on it. A13.3 (CONTAMINATED) holds: the deferral sits in the card's canonical section, not under a heading of its own. FINDING below: no committed body arms that detector. |
| 14 | the migration carries the exact grant without widening | MET | A14.1's widening-by-default cannot occur: the block is carried VERBATIM rather than copied field by field, and the body still compares approval, recovery, order, card map, `given_by`, revision and the REVOCATION against the template's own reading. A14.4 — the `grant ?? templateGrant` fallback phase one called the exactly forbidden silent restoration — is refused in BOTH arrangements it asked for: snapshot corrupted with the legacy block still present refuses, and a template block with a store present reads as a stray. A14.3's plant is run: the pause record and a run record are byte-identical after. |
| 15 | the kit's embedded template carries no grant | MET | A15.1 and A15.2 are defeated: the assertion runs over the compile-time include's own content, through a line-shape detector rather than a substring search, with a third assertion that a comment naming the block is not read as the block. **A15.3 ASKED WHETHER A SECOND BUILD WAS PERFORMED. IT WAS NOT, SO I PERFORMED IT**: with a real grant block appended to the shipped template, `cargo test --offline --lib kit` at this bench reports `FAILED. 20 passed; 1 failed`, panicking at the body's own message about a grant riding into every project the kit scaffolds. The template was restored and the tree is clean. Baseline before the mutant: 21 passed, 0 failed, 28s. |
| 16 | fixtures do not consume the active grant; every call site names its root | MET | A16.2's "root-naming proved by grep" does not apply: there is no default root left to grep for. `grantState`, `readGrantStore`, `readGrantJournal`, `grantStoreLocation`, `initGrantStore` and `updateGrantStore` all REFUSE `GRANT_STORE_NO_ROOT` when called with none, and the refusal names the defect it prevents. That eliminates A16.3's mutant class by construction and defeats A16.4's geography worry structurally rather than by where the suite happens to run — which is a better answer than the decisive run phase one asked about at M14. A16.1's tension is resolved out loud in the bench fixture's own comment rather than silently. |
| 17 | reuse the helpers, leave an extension point, build no framework | **CORRECTION 2** | Reuse is real and was checked before it was relied on: validation is the parser's own reader and nothing else, locking is `open(O_EXCL)` written rather than imported to avoid a load-order cycle a body asserts is absent, and the report records reading `acquireSolo` and rejecting it as a check-then-write. A17.3 is defeated — the card's new section is specific rather than an echo. **But A17.2 lands on the prose**: the arm's own header names `updateOperationalStore` as the extension point and says it is written against a datum descriptor. No such function exists and the real one takes no descriptor. Corrected and pinned below. |
| 18 | the template is no longer the home of the active grant | MET | A18.1 asked what was chosen and required a body to assert the chosen one: REPORT was chosen, and the body asserts the stray. A18.2's arming is exactly right — a fixture whose template carries the block and whose store is EMPTY still answers unenforced at revision 0, and the control puts the IDENTICAL bytes in the store and shows them enforce, so the answer is about WHERE the block was. A18.3 and A18.4 are met in the open: the declaration stays and both the schema and the arm say plainly that the occupant moved and the coupling did not. |
| 19 | the datum leaves the publication path, no generic hook or CI bypass | MET | A19.3 is settled by name: no workflow, no hook and `gate-run.mjs` is not in the diff at all, so no new path-specific exclusion entered the derivation. A19.2's observable is driven and green. A19.1 is settled by the grounds rather than by argument — a tracked file at this path is UNPLACEABLE and takes the whole battery, and the runtime directory's ignore rule is a bare `*` — and the writer ENSURES that ignore file before writing. A19.4 is answered honestly: the selection body was NOT retargeted, and says so in its own words. |

#### Findings that changed no row

- **A2.5 stands unaddressed and the criterion does not require it.** The
  instant is required present and ISO-shaped; it is compared to nothing —
  not to now, not to the prior revision's instant. An instant in the
  future or before its predecessor's is accepted.
- **NOTHING IN THE COMMITTED SUITE PINS THE SECOND CRITERION.**
  `validateGrantSnapshot` is called by no body and `GRANT_STORE_INVALID`
  appears in no spec. It is the largest untested surface in the diff. The
  criterion asks for a body nowhere in its own wording, so this is routed
  rather than corrected — but a regression there would pass every gate.
- **Three refusal codes are exercised by no body**: `INVALID`,
  `UNREADABLE` and `COMPETING_HISTORY`. I drove all three by hand and all
  three behave as written.
- **A seventh unreadable shape answers instead of refusing.** A dangling
  symlink at the store's path is followed by `existsSync` and reads as
  absent. Correction 1 closes it for any checkout with prior use —
  measured after the fix, a dangling symlink there refuses
  `MISSING_AFTER_USE` — and what remains is a checkout that never held a
  store, where absent is the honest answer. A leading byte-order mark is
  accepted, which is benign.
- **A11.6, and it is the criterion's wording rather than the builder's
  choice.** The build refuses on a detached HEAD, because the criterion
  asks for that demonstration in as many words. The grounds settle that
  detachment is a property of HEAD and not of location, so a detached
  HEAD IN the designated checkout is still the designated checkout and
  would be refused. The card's notes say plainly which three cases are
  ruled out, so nothing is hidden. Routed to the seat as a contract
  question, not graded against this lane.
- **A12.2 and A12.3 are unarmed.** No body drives a brief whose admission
  says refused while its inputs would compute admitted, and the
  admission travels as unauthenticated data without an integrity property
  being named or its absence recorded as deferred.
- **No body kills the real command at the real seam (A9.1).** The
  interrupted state is constructed — but it is reachable, byte-for-byte
  what the real append writes, and the RECOVERY driven is the ordinary
  command rather than a routine that exists only for the test.
- **No body drives the stale-lock reclaim**, which A3.5 named as
  unspecified. It is now specified in the code and in its message.
- **Phase one's M12 went unanswered** — no scan of every embedded kit
  entry for card identifiers and blob hashes. The fifteenth criterion is
  narrowly about the runtime template, so it decides nothing here.
- **The size line.** The executor says the work is L against the
  frontmatter's M and the card's own fence section agrees. Having read
  the whole diff I agree: a reader, a writer, a lock, an atomic publish,
  a journal, a location classifier, a five-verb CLI arm and fifteen
  bodies is not an M.
- **Nothing in the diff is unasked for.** Every one of the twelve paths
  is traceable to a criterion or to one of the three granted fence
  widenings. The one thing no criterion asked for is the retained
  superseded snapshot, and the card's own notes settle it.

#### The corrections

Both are committed on this bench after this verdict, and both were run
BOTH ways at `ee11d037` plus the verdict commit.

**CORRECTION 1 — A CREATED STORE IS PRIOR USE.** `initGrantStore` left
no evidence that survives the snapshot, so a checkout whose FIRST grant
was lost read as one that had never held a store: the explicit no-grant
state, under which every admission is made and merely reported
unenforced, and the next creation mints authority over an approval the
owner had already given. The fix writes a prior-use marker beside the
snapshot, after the publication so it never claims a use that did not
happen, and the reader stats it with the journal and the retained
superseded snapshot. Readings: with the fix, the thirteen store bodies
and then the remaining five run **13 passed** and **5 passed**, exit 0;
with the mutant planted, the new body reds — `1 failed, 1 passed`, exit
1, `Expected: "GRANT_STORE_MISSING_AFTER_USE" / Received: undefined`.

```mutant
correction: a created store is prior use
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: A STORE CREATED AND NEVER REVISED IS STILL PRIOR USE — losing the FIRST snapshot refuses, and is not read as a checkout that never held one
message: a checkout that LOST its first grant was read as one that never had one
--- old
  const usedBefore =
    existsSync(path.join(at, GRANT_USED_REL_PATH)) ||
    existsSync(path.join(at, GRANT_JOURNAL_REL_PATH)) ||
    existsSync(path.join(at, GRANT_SUPERSEDED_REL_PATH));
--- new
  const usedBefore =
    existsSync(path.join(at, GRANT_JOURNAL_REL_PATH)) || existsSync(path.join(at, GRANT_SUPERSEDED_REL_PATH));
```

**CORRECTION 2 — THE EXTENSION POINT NAMED A FUNCTION THAT IS NOT
THERE.** The arm's own header said `updateOperationalStore` is written
against a datum descriptor so a second datum takes up the same path by
passing one. The function does not exist; the real one is
`updateGrantStore` and it takes no descriptor — a second datum would
copy the path rather than parameterise it. Prose is a code input in this
repository, and a false mechanism claim in a fenced source file is a
defect rather than a typo. The comment now names the real function and
describes the extension point as the shape it actually has. Readings:
with the fix, **2 passed**, exit 0, 1.6s; with the mutant planted, the
body reds — `1 failed`, exit 1, with the message `the arm's
extension-point sentence names a function this file does not export:
\`updateOperationalStore\``. Both anchors were checked for uniqueness
before the mutant was planted: the old matched once, the new matched
none.

```mutant
correction: the extension point names the function it actually has
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE ARM'S EXTENSION POINT NAMES A FUNCTION THIS FILE ACTUALLY EXPORTS
message: the arm's extension-point sentence names a function this file does not export
--- old
 * `updateGrantStore` is the compare-append-publish path, and its parts —
--- new
 * `updateOperationalStore` is written against a DATUM DESCRIPTOR —
```

#### What I re-ran, because appending a verdict is a write

Appending a verdict is a write and prose is a code input here, so my own
commits owe their range's set. Measured at this bench on the working tree
that became the two commits below, with the tree otherwise identical to
`ee11d037`:

- `npm run typecheck` from tools/e2e — exit 0.
- `npm run lint:tokens` from tools/e2e — clean, TOKEN 190 files, CONTROL
  1673 tracked text files, exit 0.
- the store's bodies and their neighbours through Playwright at port
  25344 — the figures are in the corrections above.
- the remaining owed set for the range, run last and reported with its
  exit in the verifier's return.

THE READINGS THAT DECIDED ROWS, WITH THEIR ARRANGEMENTS:
`push-guard.spec.ts` whole at this bench, **123 passed, 0 failed, exit
0, 1.8m**, with `docs/CONVENTIONS.md` at mode 644 here against 444 in
the fenced lane. The kit crate at this bench, **21 passed / 0 failed /
28s** clean, and **20 passed / 1 failed** with a grant block appended to
the shipped template, panicking at the body's own message — the template
was restored and the diff against it is empty. The refusal tables for
the second, seventh and thirteenth criteria were driven against
throwaway git fixtures built from this bench's own method files.
