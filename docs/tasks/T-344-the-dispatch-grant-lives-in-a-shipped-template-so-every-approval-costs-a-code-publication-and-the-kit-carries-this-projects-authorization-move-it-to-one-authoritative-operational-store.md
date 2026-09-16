---
id: T-344
title: "The dispatch grant lives in the shipped runtime template, so recording an owner's approval costs a full code publication and the generated kit carries this project's authorization: move the active grant to one authoritative operational store at one designated integration checkout, updated by a command that validates, writes atomically and retains history, and leave the shipped template carrying no grant"
feature: F-04
milestone: 4
size: M
priority: 1
status: planned
suggested_by: "the architect seat on 2026-09-16, on the owner's requirement that a routine grant revision trigger no suites, commits, pushes or CI, and on the owner's scoping ruling of the same day; the kit half was found by the seat while checking the cost and corrected in wording after the Codex orchestrator's review"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, method/runtime/supertaskr.yaml, method/runtime/process-schema.yaml, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/gate-run.spec.ts, app/src-tauri/src/agent/kit.rs]
builder:
verifier:
built_by:
verified_by:
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

SIZE: the frontmatter says M, which was inherited rather than derived. The
seat's reading against this fence is L. Whoever verifies should grade
against what the work actually is.

## Verdicts
