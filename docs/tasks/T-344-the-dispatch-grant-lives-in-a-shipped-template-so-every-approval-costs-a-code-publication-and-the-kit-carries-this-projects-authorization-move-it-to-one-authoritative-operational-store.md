---
id: T-344
title: "The dispatch grant lives in the shipped runtime template, so recording an owner's approval costs a full code publication and the generated kit carries this project's authorization: move the active grant to one authoritative operational store at one designated integration checkout, updated by a command that validates, writes atomically and retains history, and leave the shipped template carrying no grant"
feature: F-04
milestone: 4
size: M
priority: 1
status: suggested
suggested_by: "the architect seat on 2026-09-16, on the owner's requirement that a routine grant revision trigger no suites, commits, pushes or CI, and on the owner's scoping ruling of the same day; the kit half was found by the seat while checking the cost and corrected in wording after the Codex orchestrator's review"
blocked_by: []
touches: []
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

**The update path keeps four properties.** A revision validates before it
writes — the approval and its instant recorded, the block through the
parser's reader, the cards it names resolvable. It checks the revision it
expects against the revision on disk and writes nothing if they differ.
It writes atomically. It retains the superseded revision as history, in
the shape the parser's reader already validates: a list of earlier
grants, each read whole, each required to sit below the current revision.
And it is recoverable — the history is not the only copy.

**The machinery is general, not grant-shaped.** The runtime template also
carries the role model and effort selections, which are project
selections in a shipped file for the same reason and will want the same
treatment once their design is settled. Build the operational-record
mechanism so a second datum can use it without a second migration and
without touching the shipped template twice. This card moves only the
grant.

**The shipped template carries no grant, and a body says so about the
KIT.** The assertion belongs against the kit's embedded content, not
against this project's live file. Two bodies once asserted the live tree
was the explicit no-grant state and T-330 retired them correctly — they
were asking a good question of the wrong artifact.

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
- WHEN a revision is recorded THE command SHALL validate before writing — the approval and its instant present, the block accepted by the parser's own reader, every card the order names resolvable on the board — and SHALL write nothing when any of those fails.
- WHEN a revision is recorded against an expected prior revision THE command SHALL compare that expectation against the store and SHALL write nothing, naming both revisions, when they differ.
- WHEN a revision is written THE write SHALL be atomic, so that a reader meets either the whole prior revision or the whole new one and never a partial record.
- WHEN a revision supersedes another THE superseded revision SHALL be retained as history in the shape the parser's reader already validates, and a body SHALL demonstrate a reader accepting a record whose history carries earlier revisions and refusing one whose history carries a revision at or above the current.
- WHEN the store is lost THE retained history SHALL be recoverable from a copy the store is not the only holder of, and a body SHALL demonstrate the recovery.
- WHEN the store is read from anywhere that is not the designated integration checkout THE reader SHALL refuse, naming the location and why it is not the designated one, and SHALL NOT answer "no grant"; a body SHALL demonstrate the refusal from a lane worktree and from a detached checkout.
- WHEN a lane requires an admission THE admission SHALL reach it from the coordinator, and a body SHALL demonstrate that a lane consulting a store of its own is refused rather than served.
- WHEN cross-host transfer or a competing grant history is met THE answer SHALL be the explicit refusal above, and the card SHALL record both as deferred by the owner's ruling rather than as unhandled.
- WHEN the kit is generated THE embedded runtime template SHALL carry no dispatch grant, and a body SHALL assert that over the KIT's own embedded content and SHALL be shown to fail against a kit built from a template carrying one.
- WHEN this card lands THE operational-record mechanism SHALL be usable by a second datum without a second migration, and the card SHALL name what a later card would have to add to move the role model and effort selections through it.
- WHEN this card lands THE runtime template SHALL no longer be the home of the active grant, and a body SHALL demonstrate that a template carrying a grant block is not read as authority.

## Implementation notes

## Verdicts
