---
id: T-319
title: "Approved work windows: the orchestrator's per-dispatch approval becomes a window the owner approves once — a verbatim record naming the outcome, the cards at their approved revisions, the coordinator, the model settings, the ceilings per provider and account, the attempt limit and the expiry; the arm refuses a dispatch the window does not cover and reserves every attempt against it, and the coordinator stops at five boundaries with one consolidated question"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 2
status: verifying
suggested_by: "the architect seat on 2026-09-13, from the Codex orchestrator's lean-delivery plan v2 and its reconciliation review of the same day, filed on the owner's ruling; filing authorizes no development"
blocked_by: []
touches: [method/runtime/process-schema.yaml, method/runtime/supertaskr.yaml, lib/parser/src/process-settings.ts, lib/parser/src/pure.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-13 the seat's ledger records sixteen answers from the owner, four of them bound to a lane (a pre-dispatch ruling on heading depth, the declarative ruling, three pre-dispatch texts in one yes, the lane order) and the rest records and policy administration. The orchestrator role file's step 5 says the seat proposes each dispatch and waits for approval. The owner's standing authorization of 2026-09-12 (dispatch the filed cards in prerequisite order, one lane at a time, stop at four named events) and the delegated lane order of 2026-09-13 are blanket approvals of that step, and they live only in the seat's ledger and in chat. Nothing in the tree carries them: the dispatch arm cannot tell an authorized dispatch from an unauthorized one, the ceilings the owner named are the seat's memory, and a replacement seat after a compaction inherits them only through a checkpoint's prose. The lean-delivery plan v2 (kept beside the repository in the evidence directory) proposes a window contract: an outcome, two or three eligible cards with fixed scope, one coordinator, the permitted model settings, numeric ceilings per provider and account, an attempt limit and a permitted runtime, approved once; the coordinator runs inside it and stops at five boundaries with one consolidated question. The run record (T-311, run-record.mjs) already owns reservations, attempts and observed usage per child run; the tier budgets are the schema's; T-318 plans the template's budget and eligibility constraints per provider and account with the enforced-or-advisory label. A window is the missing record between the owner's yes and the arm's dispatch. The record class proposed here is a directory of window records under docs (its contract in a README, one file per window with frontmatter the arm reads), a records class beside tasks and decisions rather than a runtime file, because a window is proposed verbatim and approved on the owner's yes like a decision entry (T-307) and is never rewritten: activation, exhaustion, expiry and revocation are dated appends. The window approved by hand before this card lands (the repair window proposed for 2026-09-14) is transcribed into the class by the seat, as a records act, once the class exists.

## The consolidation of 2026-09-14

On the owner's permission of 2026-09-14 to the shape the Codex orchestrator's pre-dispatch review asked for, the effective contract is consolidated into the canonical section below, because the parser and the preflight read only that section and every amendment under its own heading was invisible to them. The subject as of this date: the dispatch block of the runtime template — approval mode, recovery policy, the grant with its revision, order, endpoint and card blobs, the pause, optional limits, and history — declared once in the process schema and read by the shared template reader of the parser library through the pure entry; that reader is this card's one reader and this card adds it (the earlier promise that no parser code is needed is withdrawn). The admission lifecycle, the three modes' enforcement, the recovery policy's enforcement and the pause are split out to T-324 under the orchestrator's sizing rule (one card per test cycle): this card's cycle is the parser's, T-324's is the arm's. Every earlier bullet and amendment is kept under the History section.

Corrected the same day after the Codex orchestrator's review of the drafts (T-319-T-324-T-322-effective-contracts-codex-review-2026-09-14.md): the explicit no-grant state and the migration rule; the complete validation contract (unique ids, order and cards agreement, the until id in the order, sha and instant shapes, positive and strictly rising revisions, duplicate keys refused); the exact optional limits fields, advisory and unenforced here; revocation as a field; no tamper-prevention claim; the card lands as readable configuration with the arm's exclusive-reader sentence moved to T-324; the reference renderer and its currency test added to the fence. The former historical heading is renamed so the preflight's any-depth criteria rule does not re-enter it; the previous wording of this section is in the commit history.

## Acceptance criteria

- WHEN the runtime template carries a dispatch block THE block SHALL have exactly these fields, declared once in the process schema beside the template: `approval` (one of each, until, standing), `recovery` (one of none, repairs), `grant` with `given_by`, `at` (an ISO instant), `revision` (a positive integer), `order` (unique card ids in dispatch order), `until` (a card id that belongs to the order, required when approval is until and forbidden otherwise) and `cards` (a map whose keys are exactly the order's ids and whose values are 40-hex blob shas of each card file at approval); an optional `revoked` with `at` and `by`, which makes the grant read as no current grant; an optional `limits` with exactly `tokens` (a map from provider to a positive integer) and `expires_at` (an ISO instant), both labelled advisory in the schema because nothing in this card enforces them, and any other key refused; and `history` (every earlier grant in order, each with its revision, every revision below the current); pinned by a parser test per field and per rule.
- WHEN the block is ABSENT THE reader SHALL return the explicit no-grant state — approval each, recovery none, no grant, revision 0 — and every read-only settings operation SHALL keep working exactly as before; an admission that needs approval refuses by name against that state (T-324); no grant is ever created by guessing a person, an instant or a past authorization, and an existing authorized way of working continues only through a migration grant the seat proposes verbatim and the owner approves (T-307); pinned by tests over an absent block and a template with the block removed.
- WHEN the shared template reader reads the block THE reader (the process-settings module of the parser library, exported through the pure entry as the settings reader already is, T-317) SHALL return it as one typed value validated against the schema's declaration and SHALL answer a named refusal, never a partial value, for an unknown field, a duplicate YAML key, an until mode without its card or with a card outside the order, an order and cards map that disagree, a malformed sha or instant, a non-positive revision, two grants with one revision, or a history whose revisions are not all below the current; the reader validates the sequence it is given and attributes each grant to its recorded given_by — it promises no tamper prevention from an integer, and the card says so; pinned by a test per refusal.
- WHEN this card lands without T-324 THE dispatch block SHALL be readable configuration and nothing more: its switches carry the declarative label in the schema (the owner's ruling of 2026-09-13 on labels: informational, controlling no execution) until T-324 makes them operational, and this card SHALL NOT claim that the arm admits or refuses anything by it; a grant, a pause or a revocation is a dated edit to the block that appends the previous grant to history and raises the revision, proposed verbatim and approved on the owner's yes (T-307), and which grant is current is decided by the validated block's revision and never by a date; pinned by a test with two same-day grants and by the schema's label.
- WHEN the generated settings reference is rebuilt THE existing renderer (renderReference in tools/e2e/scripts/settings.mjs) SHALL render the dispatch block from the schema's declaration as a structured section, never hand-written, and its currency test in tools/e2e/tests/cli.spec.ts SHALL hold, pinned by that test.

## History — the criteria as filed on 2026-09-13 and their amendments, superseded on 2026-09-14 (kept verbatim; the instruments read only the canonical section above)

### Former criteria — as filed on 2026-09-13 (superseded)

- WHEN a window is proposed THE record SHALL name the outcome, the coordinator (harness and model), the permitted model settings for each role by reference to the runtime template's roles, each eligible card by id AND by the blob sha of its card file at approval (its criteria and fence at that revision), numeric ceilings per provider and account (each labelled enforced, advisory or unknown), the attempt limit per card (one build plus one authorized correction or re-entry unless the record says otherwise), the permitted runtime (an activation instant and an expiry instant), and SHALL be proposed verbatim and approved on the owner's yes as a decision entry is (T-307); a record missing any field SHALL be refused by name by the arm's reader, pinned by a body per field.
- WHEN the dispatch arm plans a lane THE arm SHALL read the active window (at most one), SHALL refuse by name — before any side effect: no stamp, no worktree, no spawn — a dispatch of a card the window does not name, a card whose file differs from its approved blob by more than a mechanical append (a status stamp, a notes or verdicts append, a filed follow-up line), a window past its expiry or revoked, or a coordinator other than the record's, and SHALL record the dispatch as an attempt reserved against the window through the run record's own reservation (T-311's takeReservation and release), never through a second ledger; a crashed or uncertain writer keeps its reservation until it is reconciled.
- WHEN the next attempt's planning figure would exceed a ceiling THE arm SHALL refuse the dispatch by name with the remaining allowance and the figure, and a correction round or a re-entry SHALL obey the same remaining allowance; the accounting distinguishes observed usage (the harness's own count from a completion) from an estimate (a planning figure standing in for an unknown), and an unknown stays unknown rather than counting as zero, pinned by bodies for the refusal, the correction round and the unknown.
- WHEN the coordinator meets one of the five boundaries — a scope change the card's approved revision does not cover, a ceiling reached, an uncertain writer, an integrity failure the standing procedures do not address, a decision the record reserves to the owner — THE coordinator SHALL stop with one consolidated question naming the boundary, the cost so far and the remaining allowance, pinned by a body per boundary against the seat-facing report the arm prints; and the role file's step 5 SHALL say that a dispatch inside an active window is approved by the window and that every other dispatch still waits for the owner, the existing sentences kept and extended rather than reworded.
- WHEN the arm reports what it enforces THE report SHALL separate the refusals it tested (a card outside the window, a stale revision, an expired or revoked window, a ceiling exceeded on observed counts) from the coordinator's obligations the arm cannot check (scope interpretation, an unreported integrity problem, a provider's live usage the harness does not expose) and from advisory accounting; the conventions carry the rule and the record's spelling once, at the loop's section, and the README under the windows directory carries the record's shape.

### Note of 2026-09-13 — the owner's ruling on limits for this project's own loop

On 2026-09-13, shown a proposed repair window with token ceilings, a coordinator allowance and an expiry, the owner ruled that this project's own loop runs without token or time limits and keeps its regular ceremony: the standing authorization, one lane at a time, the seat proposing and the owner approving. This card therefore stays suggested as product direction — a window with ceilings is a choice a user makes in their own project through the template's per-provider constraints (T-318), never this loop's instrument — and its promotion needs the owner's separate ruling.

### Attribution correction of 2026-09-13

The suggested_by field says this card was filed on the owner's ruling. It was not: the filing was the seat's own step-2 act on the Codex orchestrator's recommendation of 2026-09-13, which the owner relayed without ruling on it; the owner's rulings of that day concern limits and the ceremony, not this filing. The field's clause is withdrawn by this line and the field is left as written, because a record is appended and never rewritten.

### Amendment of 2026-09-13 — ceilings and expiry are optional; a window is first a set of cards approved once (the Codex orchestrator's review of the filed cards, 2026-09-13)

This section supersedes the ceilings and runtime clauses of the criterion that names the record's fields, and the reading of the owner's ruling in the note of 2026-09-13; everything else stands. A window's required fields are the outcome, the coordinator, the model settings by reference to the runtime template's roles, the eligible cards at their approved revisions, and the attempt rule (one build; a REJECTED verdict returns to the owner, unless the record says otherwise). Numeric ceilings per provider and account and an expiry instant are OPTIONAL fields, each ceiling labelled enforced, advisory or unknown when present; the refusals on a ceiling and on expiry exist only for a window that carries one, and a window without them stands until a dated revocation. The owner's ruling of 2026-09-13 declined token and time limits for this project's own loop; whether the owner also wants a window without limits — one yes for a set of cards, the arm refusing a dispatch outside the set — is a separate choice that ruling did not make, and this card keeps it open. The standing authorization of 2026-09-12 and the delegated lane order are such a window today, held in the seat's ledger and in chat rather than in a record the arm reads.

### Amendment of 2026-09-13 — the card's subject is the dispatch approval mode, one switch with three values (the owner's ruling of 2026-09-13, on the seat's question)

This section supersedes the record's field list in the criteria above and the earlier amendment's optional-ceilings clause where they conflict; everything else stands. The owner wants three ways of approving dispatch, all of them: approval asked before every dispatch (the orchestrator role file's step 5 as written); a grant that runs until a named card and stops there; and a standing grant that runs until the owner says pause, honoured at the next dispatch and never mid-lane. Because the loop is settings (ADR-024 decision 6), the three are ONE switch declared once in the process schema — a dispatch approval mode with the values each, until a named card, and standing — read by the dispatch arm at every dispatch, with the current value and its grant (who gave it, when, and the named card where one applies) recorded in a tracked record the arm reads, so a fresh seat in either harness inherits the mode from the record and not from a checkpoint's prose. Token and time ceilings are a separate optional field, off by default and off for this project's own loop by the owner's ruling. The stops of the regular ceremony hold in every mode: a REJECTED verdict, a spawn refused for quota, a record that must be shown before appending, a scope change a card's approved text does not cover.

- WHEN the mode is each THE arm SHALL refuse a dispatch without a recorded approval for that card by name, pinned by a body; WHEN the mode is until a named card THE arm SHALL dispatch cards in the recorded order up to and including the named card and refuse the next one by name, pinned by a body; WHEN the mode is standing THE arm SHALL dispatch until a dated pause is recorded, SHALL refuse the dispatch that follows the pause by name, and SHALL never interrupt a lane in flight, pinned by bodies for the pause and for the lane in flight.
- WHEN the mode or its grant changes THE change SHALL be a dated append to the record, proposed verbatim and approved by the owner as any decision entry is (T-307), and the arm SHALL read the newest dated state, pinned by a body that appends a pause after a standing grant and requires the refusal.
- WHEN the arm reports the mode THE report SHALL name the mode, the grant's date and giver, the named card where one applies, and what the arm cannot check (scope interpretation, an unreported integrity problem), so that a mode is never mistaken for a guarantee about the work.

### Amendment of 2026-09-13, later the same evening — the standing mode names its scope (the owner's ruling on leaving the computer)

Adds to the amendment above; everything else stands. The owner's case: away for hours, a lane is rejected or a CI run reds, and the fix must not wait. So the standing grant carries a SCOPE with two values — the listed cards only, or the listed cards and the repairs the work produces: a fix card a lane's failure or a CI red files (priority 1, inside the standing order at the point the failure occurred), the re-entry of a rejected lane, and an express fix where the bounded tier is reachable (T-298-s3, T-320). WHEN the scope is listed-plus-repairs THE arm SHALL dispatch such a repair without a further approval and SHALL record on the repair card the failure it repairs, pinned by a body; WHEN a decision the mode does not cover arises — a room or decision entry that must be shown, a product-scope or design decision — THE coordinator SHALL park it and continue every lane that does not depend on it, and the pause SHALL apply only to that decision, pinned by a body that parks one decision and requires the next unrelated dispatch to proceed.

### Amendment of 2026-09-14 — recovery permission is a policy of its own, and the schema is in the fence (the Codex orchestrator's review of T-319 and T-322, relayed by the owner)

Adds to the amendments of 2026-09-13; where they conflict this section governs. The approval mode (each, until a named card, standing) says when work STARTS. Whether the coordinator may dispatch a correction round, a re-entry after a rejection, or a repair the work discovers is a SEPARATE recovery policy with two values — none, or the repairs necessary to the approved work — valid under every mode, so that a grant until a named card can carry its necessary repairs without granting indefinite standing permission; the standing-mode scope clause of 2026-09-13 is this policy under one mode and is superseded by it. WHEN the recovery policy is none THE arm SHALL refuse a repair dispatch by name and queue it as a question; WHEN it is the necessary repairs THE arm SHALL dispatch a repair only for a failure attributed to the approved work and SHALL record the failure it repairs on the repair card, pinned by bodies for each mode paired with each policy value. Both are switches declared once in the process schema beside the runtime template's value, which puts method/runtime/process-schema.yaml and method/runtime/supertaskr.yaml in this fence; the reader is the one the arm already has for the schema (T-317), and this card adds no parser code.

### Amendment of 2026-09-14, at promotion — the record is the runtime template's own dispatch block (the seat's step-2 triage; the preflight's DEAD FENCE ENTRY)

The fence token docs/windows/README.md is removed with this line: the preflight reads it as a dead entry, since nothing tracked sits under a windows directory, and the subject no longer needs one. The approval mode, the recovery policy and the grant that sets them (who gave it, when, the named card where one applies) are one dispatch block in the runtime template, method/runtime/supertaskr.yaml, declared once in the process schema beside it — both already in the fence — so the tracked record the arm reads is the template itself, and a change of mode or grant is a dated edit to that block proposed verbatim and approved on the owner's yes (T-307), with the dated line kept in the block's own history rather than a separate record class.

## Implementation notes

Built by claude-opus-5@subagent on 2026-09-14 in the lane worktree cut at
0d194f7cba67, landed at 163d0740. Every figure below is measured at that
tip unless it names another ref.

### What the card asked for, and what the fence allowed

The dispatch approval mode, the recovery policy and the grant that sets
them are ONE block of the runtime template, `dispatch:` in
method/runtime/supertaskr.yaml, declared once in
method/runtime/process-schema.yaml and read by the parser library's
process-settings module as one typed value through the pure entry.

**THE DECLARATION IS A NEW TOP-LEVEL SECTION OF THE SCHEMA RATHER THAN
TWO SWITCHES, AND THE FENCE IS WHY.** The obvious reading of "declared
once in the process schema" is a pair of switches, `dispatch.approval`
and `dispatch.recovery`, in the existing `switches:` block. That is not
available to this card. Two bodies outside its fence hold the switch set
closed, both in tools/e2e/tests/brief.spec.ts: one requires the schema's
switch ids to equal a typed list in that file exactly, and one requires
every non-floor switch to be a row of the switch inventory in
docs/rooms/loop-cost-and-speed.md or to be named by another switch's own
constraint. A new switch therefore owes an edit to that spec and to that
room, and the fence carries neither. The block is also not a switch in
shape: `approval` and `recovery` are two values out of sixteen fields,
and the rest are a grant, a revocation, ceilings and a history, none of
which has a profile column or a value set. So the schema gained a
`dispatch_block:` section of its own — sixteen rows, each declaring its
requirement, its shape, its value set, its absent value, whether it is
advisory, its implementation label and what it records. The switch set is
unchanged at 42 and both of those bodies stay green untouched.

The section is OPTIONAL to the schema parser, which is also forced: the
drill schema built inline in brief.spec.ts declares version, profiles and
switches only, and a required section would red it from outside the
fence. `ProcessSchema.dispatch` is therefore `DispatchDeclaration | null`,
and what is refused by name is READING a block against a schema that
declares none.

### Criterion by criterion

1. **The block's fields, declared once.** Sixteen rows under
   `dispatch_block:` — approval, recovery, grant and its six
   (given_by, at, revision, order, until, cards), revoked and its two,
   limits and its two, and history. `grant.until` is
   `required: with-until`, which the reader reads as required under
   `approval: until` and refused under every other mode; `revoked` and
   `limits` are `optional` and their own halves `with-parent`; every
   other row is `always`. The two limits rows and their container carry
   `advisory: true` because nothing in this tree enforces them. Pinned by
   a body per field and per rule in
   lib/parser/test/process-settings.test.ts, and over the SHIPPED schema
   in tools/e2e/tests/cli.spec.ts.

2. **The absent block.** The reader answers the explicit no-grant state —
   approval each, recovery none, no grant, revision 0 — and the two mode
   values come from the declaration's own `absent:` attribute rather than
   from a constant, so the one place that says what "no grant" means is
   the schema. The parser fixture deliberately declares `ask`/`refuse`
   instead, which no shipped file says: a reader carrying the words
   itself would answer `each`/`none` there and red. The shipped
   `each`/`none` is pinned separately over the live tree. Two bodies: a
   template that never had a block, and one a hand removed it from; both
   also assert that the profile, the offered profiles and the departures
   still read, and that the listing still renders every switch.

   This project's template carries NO block. It gains a comment saying
   the question was asked, in the same idiom as the empty `switches:`
   block beside it, and an EMPTY `dispatch:` block is refused — a block
   somebody emptied and a record nobody wrote are different things. No
   grant was created here: a migration grant is one the seat proposes
   verbatim and the owner approves (T-307).

3. **One typed value or a named refusal.** `dispatchBlock(templateYaml,
   schema)` answers `DispatchBlock` or throws; there is no partial value
   anywhere in it. Every refusal the criterion lists has a body of its
   own, each asserting that refusal's own sentence: an unknown field at
   every depth, a duplicate YAML key, `until` with no card, `until`
   naming a card outside the order, `until` under a mode that is not
   `until`, an order and a cards map that disagree in either direction, a
   malformed blob sha at three shapes, a malformed instant on each of the
   four instant fields, a non-positive revision at five shapes, two
   grants at one revision in both arrangements, and a history revision
   not below the current. Beyond the list: a repeated card id, a token
   ceiling that is not a positive integer, a missing required field per
   field, a mode outside its own set, an empty block, a value on the key
   line, and an indent the reader does not know.

   The reading is line-based like the schema parser beside it and for the
   same reason (a packaged script has no devDependencies), so the
   duplicate-key refusal is this module's to make; both suites compare
   the hand reading against a real YAML library on the same documents.

4. **Declarative, and no admission claimed.** All sixteen rows carry
   `implementation: declarative`, pinned by a body over the shipped
   schema that reds if any row claims otherwise. **This card lands the
   block as readable configuration and nothing more: nothing in this tree
   admits or refuses a dispatch by it, and nothing here claims it does.**
   T-324 owns admission. Which grant is current is decided by the
   validated block's revision and never by a date: the fixture dates the
   current grant at 09:30 and an earlier grant at 23:45 THE SAME DAY,
   with a third dated the day before, so a reader sorting by date would
   answer differently in two directions, and a reader taking the last
   written in a third.

5. **The reference chapter.** `referenceDispatchBlock` renders the
   section from the declaration alone — the block's prose, the label
   counts, the advisory list and the no-grant sentence all derived, never
   typed — and the chapter was regenerated through the command's own
   `reference --write` path. The existing currency body holds. A new body
   asserts the section is there and moves with the declaration (a data
   mutant on one row's own sentence), and runs the control where the
   arrangement is ABSENT: a schema with the section removed renders no
   dispatch section and still renders the switches.

### What was measured, and where

At 163d0740, through the blessed gate-runner, each leg run once:

- parser GREEN, exit 0, 452 bodies
- e2e GREEN, exit 0, 1091 bodies
- app GREEN, exit 0, 1171 bodies
- rust GREEN, exit 0, 655 bodies over 18 targets

THE OWED SET FOR THIS RANGE IS THE WHOLE BATTERY, AND FAIL-CLOSED IS WHY:
`gate-run.mjs --owed-set --range 0d194f7cba67..163d0740` cannot place
method/runtime/process-schema.yaml or method/runtime/supertaskr.yaml
("under no package root, no spec reaches it through a static import, and
not a document the DOCS GATE maps"), so the derivation widens to all
four legs. The scoped `e2e --owning` form refuses for the same five
paths and says the full leg is owed. Both were run rather than argued
around. Anyone dispatching a later card into method/runtime should expect
the same widening.

THE FIRST e2e RUN WAS AGAINST A DIST ONE EDIT STALE, AND IS DISCLOSED
RATHER THAN COUNTED. tools/e2e loads the parser's built browser entry by
path, and the run started before `npm run build` had been re-run over the
last two edits to the module (the until-value constant and a reworded
refusal). It answered the same 1091 bodies at exit 0; the GRADED reading
above is the second run, after the rebuild, and the dist was verified
current against both sources before it started.

Sizes: method/runtime/process-schema.yaml 33819 to 42142 bytes,
method/runtime/supertaskr.yaml 2856 to 4471,
lib/parser/src/process-settings.ts 26346 to 69201,
docs/reference/15-settings.md 31816 to 37262, docs/CONVENTIONS.md 163225
to 165648 (its warn line is 146878 and it was already past it at the
base; the fail line is 176253). Bodies: 24 to 60 in
lib/parser/test/process-settings.test.ts (36 added), 60 to 64 top-level
in tools/e2e/tests/cli.spec.ts (4 added).

### The gates

- DOCS GATE FIRES. `docs-gate.mjs` over the changed paths names
  docs/CONVENTIONS.md and docs/reference/15-settings.md as code inputs
  and owes `cargo test` from app/src-tauri/ and `npm test` from
  tools/e2e/. Both were run and are green above. `npm run lint:docs` is
  GREEN, so docs/INDEX.md is not stale. `npm run lint:tokens` is clean.
- GRAPH REGEN FIRES and the graph is STALE BY CONSTRUCTION. `index
  --check` answers exit 1 over exactly the three files this card touches:
  203 files unchanged, symbols 2593 to 2626, edges 2488 to 2505. It was
  NOT regenerated here: a regen moves six dogfood pins under app/test,
  which this fence does not carry, so the regeneration belongs to the
  merge where the conventions put it.
- THE CENSUS IS STALE IN THIS LANE AND THE MERGE OWES IT. The four new
  bodies in tools/e2e/tests/cli.spec.ts move docs/CAPABILITIES.md, which
  this fence does not carry — the file is read-only in the lane.
  `capabilities:check` reports STALE, committed 101115 bytes against a
  fresh 101547, and `npm run capabilities` refuses with EACCES on that
  path.
- BOOT GATE IS NOT OWED: the diff touches no path under app/src-tauri/,
  none under app/src/, and neither manifest. Nothing was listening on
  1420, read at 2026-09-14T01:28:20Z on Mac.lan.
- METHOD EVAL GATE FIRES: the diff touches method/**. The method stamp
  bump is the seat's at the merge and was deliberately not touched here.

### In-fence follow-through

None outstanding. Everything the criteria name landed inside the fence.

### Out of fence, and filed

- **T-319-s1** — the arm re-exports six of the reader's seven symbols, so
  the block cannot be read through the arm's own finding class.
  tools/e2e/scripts/dispatch-brief.mjs is outside this fence, and this
  card needs nothing from the arm because it claims no admission.
- **T-319-s2** — lib/parser/src/index.ts, the root entry, exports none of
  the dispatch symbols the browser entry now exports; the two barrels are
  hand-kept lists and nothing compares them.
- **T-319-s3** — a blob sha of forty digits reads as a NUMBER to a real
  YAML parser and as a sha to the hand reader. Measured while writing the
  fixtures: with all-digit shas the two readings of one document
  disagreed, and the fixture was changed to carry hex letters rather than
  the rule being changed.
- **T-319-s4** — `supertaskr settings` lists every switch and never the
  dispatch block, so the reference documents what the block IS and no
  command shows what a project's block SAYS. The listing reads a loaded
  process that carries the schema and the resolved switches only, and the
  loader is outside this fence.

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14 to the seat's recommendation): to planned at priority 2 — after the merge-verb repairs and T-298-s3, before the T-312 rerun, so that later lanes run under the approval mode and the recovery policy the arm reads; dispatched when its fence is free of T-298-s3 (brief.spec.ts) and T-295-s4 (CONVENTIONS).

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

GUARDED tier, the two-spawn bench. Phase 1 wrote the attack set blind, without
tools and without the diff; this phase holds tools, read the diff before the
executor's notes, and is not a continuation of that frame.

Sealed inputs, cited by digest (each re-measured on this bench before it was read):

- attack set — `sha256:19ae905de5a73f5bcbb65e235bd51953caaa38f1ed0a24bd30a7299bf9838742`
- ground — `sha256:da45753356f7974d88c05a505f6fcfc82441fd09b81269e66d27dd37e0f86872`
- the card at the base — `sha256:4703c15d6789fc658a27e75122297284a35505e448602d74f285075d0f3e7824`

base `0d194f7cba6755375ec1c8f20208555b88b7c46f`, tip `68284cee331379b6ec8d612a41651181a8201408`.
The base is spelled as the stamps file spells it; the dispatch postscript's copy
of that ref transposes two characters and resolves to no object here.

**The outcome in one line.** The card asked for a dispatch block declared once
in the process schema, read as one typed value through the parser library's pure
entry, refused by name and never partially, labelled declarative, and rendered
into the generated settings reference. All five criteria are MET. The two
structural forgeries the attack set was built to catch — a schema that is a
decorative copy of a TypeScript field list, and a reference section hand-written
behind a generator — are both absent, and each is refuted by a mutant that was
planted and seen to red at a named body. Three corrections are assigned, none of
them to a criterion: they close the one attribute of this card's own new
declaration that escaped its closed-set discipline, pin a decision the card names
and nothing recorded, and repair a sentence in the schema that now overstates
what an attribute does.

#### A row per acceptance criterion, with the reading that decided it

| criterion | verdict | the evidence |
|---|---|---|
| **AC1** — the block has exactly these fields, declared once in the schema beside the template; `until` required under `until` and forbidden otherwise; unique ids in `order`; `cards` keyed by exactly the order's ids at 40-hex blob shas; `revoked` with `at` and `by`; `limits` exactly `tokens` and `expires_at`, both labelled advisory, any other key refused; `history` every earlier grant below the current; pinned per field and per rule | **MET** | 16 rows under a new `dispatch_block:` section, one per field the criterion names, each declaring `required / shape / values / absent / advisory / implementation / what`. **Declared once is real, not claimed**: the reader takes the field set (which drives the unknown-key refusal at every depth), the mode value sets, the `absent:` values and the requiredness from the declaration. Proved by mutants on the SHIPPED schema, each seen to red: renaming `grant.given_by` and deleting the whole `grant.until` row each redded `THIS PROJECT'S TEMPLATE CARRIES NO GRANT…` (its control block's `given_by:` / `until:` became unknown fields) and the currency body. The parser fixture is the stronger proof: its declaration deliberately spells `ask`/`refuse`, words no shipped file says, so a reader carrying the vocabulary itself reds there. `until` is bodied in both directions; `order`/`cards` disagreement in both directions; the sha is `/^[0-9a-f]{40}$/` with bodies for short, non-hex and UPPER case — a decision, and the one the ground's M11 says every reader in this tree already takes. |
| **AC2** — an absent block answers the explicit no-grant state; every read-only settings operation keeps working exactly as before; no grant created by guessing; pinned over an absent block and a template with the block removed | **MET, and the "exactly as before" clause is no longer self-certifying** | The reader answers a whole object — `present:false`, approval and recovery from the declaration's own `absent:`, `grant`/`current` null, `revision` 0, `history` `[]` — deep-asserted key by key, never by falsiness. That the defaults come from the SCHEMA and not from code is proved by a mutant: `absent: each` changed to `standing` redded three bodies including the one over the live tree. The live template gained a COMMENT and no block; a grep of every added line finds no default, fallback or fixture yielding a non-`each` approval or a non-zero revision. **The "as before" referent is the ground's M4 serialisation**: I re-ran that harness unchanged at the tip against the real schema and the real template through the bench's own built browser entry — 1752 lines, 67560 bytes, `sha256:411976bf0fb645ce60f5938735b510843abed141f89a5aa856bc897d33f74f35`, BYTE-IDENTICAL to the base referent. 42 switches, `overrides: {}`, `constraintFindings: []`, the 42-row ledger, all unmoved. |
| **AC3** — the shared reader in the process-settings module, exported through the pure entry, returns one typed value validated against the declaration, and answers a NAMED refusal, never a partial value, for nine listed rules; no tamper-prevention claim | **MET** | `dispatchBlock(templateYaml, schema)` lives in `lib/parser/src/process-settings.ts` and is exported from `lib/parser/src/pure.ts` with its vocabulary and six types; the module still carries ZERO imports, so the pure entry's transitive closure is unmoved (the existing no-import body over that file still guards it). Every one of the nine rules has its own body asserting its own sentence, and history entries run through the SAME `readGrant` as the current grant — so the loosest-link attack (history validated more cheaply) is absent by construction, and an unknown field and a malformed instant are both bodied INSIDE a history entry. Never-partial measured, not assumed: a refusal on a malformed sha throws a `ProcessFinding` whose own enumerable keys are `[]` — no `{value, issues}` shape anywhere. The duplicate-key refusal is the module's own (the reading is line-based) and is bodied at the block level AND inside `cards`, each against raw YAML TEXT, with a real YAML parser run over the same document as the control. |
| **AC4** — readable configuration and nothing more; the declarative label in the schema; revision and never a date decides which grant is current; pinned by two same-day grants and by the label | **MET, and not vacuously** | All 16 rows are `implementation: declarative`, pinned over the SHIPPED schema by a body that lists any row claiming otherwise; a mutant relabelling one row `operational` redded that body ALONE. **No consumer branches on the block's values**: the only caller of anything new outside the library is `renderReference`, which branches on `schema.dispatch !== null` — the declaration's presence, not a value — and the reader `dispatchBlock` is called by no shipped surface at all. The currency body is the sharpest containment test on this card and it is built the hard way: the current grant is dated 09:30, the earlier grant at revision 1 is dated 23:45 THE SAME DAY and one more at revision 2 the day BEFORE, so a date-sorting reader answers rev 1, a reader taking the last written answers rev 2, and a reader taking the earliest written answers rev 1 — three wrong answers, all different from 3. The body asserts the fixture still HAS that property before asserting the answer. |
| **AC5** — the existing renderer renders the block from the declaration as a structured section, never hand-written, and its currency test holds | **MET** | `referenceDispatchBlock(decl)` is a function of the declaration alone: it iterates `decl.fields.values()`, and the label counts, the advisory list and the whole no-grant sentence are DERIVED from the rows rather than typed. The decisive control is the one a currency test structurally cannot run, and I ran it: renaming a field in the schema MOVED the rendered page and redded the currency body; so did deleting a row. A hand-edit of one word in the COMMITTED `docs/reference/15-settings.md` also redded it — so the currency body compares committed bytes to a fresh render with no write between, and its green is a pass rather than the self-consistency trap. The reference diff is ONE hunk, 158 lines appended, ZERO deletions: no existing section was reordered, re-wrapped or re-escaped. `settings.mjs reference --check` answers "is a current generation" at exit 0 at the tip. |

#### The pre-commitments phase 1 made, and how each resolved

Phase 1 recorded, before any diff existed, which criteria it considered degenerate.
Each is answered here rather than quietly dropped.

- **AC4 "close to degenerate"** — resolved in the build's favour. Its two positives
  are both present and both pinned over the shipped tree, and "there is no arm code"
  was never used as the evidence: I enumerated every consumer of every new symbol and
  read the one that exists. The date-inversion body is a control that CAN fail, which
  is what phase 1 said it would demand.
- **AC2 "degenerate unless `before` is pinned to a measured baseline"** — resolved by
  the M4 byte comparison above. The clause now has a referent taken before the diff
  existed, and the answer is identity.
- **AC2's "no grant by guessing"** — its testable projection holds; the rest is an
  obligation on a seat's conduct that this card cannot enforce, and the card says so.
  The live template's comment says it too, in the file where it matters.
- **AC5 "a self-consistency trap"** — resolved by the schema mutants. The currency
  test alone would indeed pass over a hand-written section; the section is not one.
- **AC1 "a counting criterion"** — judged by kill-set containment, not by the 40 bodies.
  Every mutant aimed at a rule killed the body for that rule and nothing else.

#### The drills — every mutant planted in a COMMITTED file, restored, and the restore proved by sha256

| mutant | planted in | what redded |
|---|---|---|
| a dispatch row relabelled `operational` | the schema | `EVERY ROW OF THE SHIPPED DISPATCH BLOCK IS DECLARATIVE…` — ALONE |
| `limits.tokens` advisory `true` to `false` | the schema | the same body — ALONE |
| `absent: each` to `absent: standing` | the schema | that body, `THIS PROJECT'S TEMPLATE CARRIES NO GRANT…` and the currency body — 3 |
| `grant.given_by` renamed | the schema | `THIS PROJECT'S TEMPLATE CARRIES NO GRANT…` and the currency body — 2 |
| the whole `grant.until` row deleted | the schema | the same 2 |
| one word hand-edited in the committed reference | the generated page | the currency body — ALONE |
| the `until`-forbidden-otherwise branch disabled | the reader | `REFUSES an \`until\` under a mode that is not \`until\`` — ALONE, 1 failed / 59 passed |
| the blob-sha pattern loosened to any 40 characters | the reader | `REFUSES a MALFORMED BLOB SHA…` — ALONE, 1 failed / 59 passed |
| the history below-current test `>=` weakened to `>` | the reader | NOTHING — and it is an EQUIVALENT mutant, not a survivor: an equal revision is a repeated revision, and the two-grants-at-one-revision loop runs BEFORE this one and refuses it there. Measured directly at the tip — a block whose history revision collapses onto the current one answers `TWO GRANTS AT REVISION`, never the below-current sentence. The defence is redundant rather than unpinned |

One restore failed on my own harness — the delete mutant's restore reinserted the
row at offset zero, because an empty replacement anchor matches everywhere. The
site was restored from git in the same minute and `method/runtime/process-schema.yaml`
is back at `sha256:54502221bd2ee77c99843a58b5245d81b135f781ecceb50a1b6cb439e4c1fa81`;
the tree was clean before the next reading. Recorded because an aborting drill
still owes its restore, and a restore done by hand is still a restore that has to
be said.

#### The unhappy paths and boundaries the criteria imply but do not spell out, measured at the tip

Every line below is a reading taken against the built browser entry with the real
schema, not an inspection of the source.

- `dispatch: null`, `dispatch: {}`, `dispatch: []` and `dispatch: standing` are all
  REFUSED, none of them collapsing into the no-grant state — the criterion's state is
  for an ABSENT block and this reader keeps the two apart. An emptied block is refused
  in its own words.
- A YAML merge key inside the block is refused rather than merged, so the unknown-key
  and duplicate-key rules cannot be walked around by an anchor. The ground's M2 says
  the live template uses none.
- A thousand approved cards read in 2 ms — the order-versus-cards cross-check is not
  a problem at any size a grant will have.
- `__proto__` as a card id pollutes nothing: `cards` and `limits.tokens` are `Map`s.
- A refusal names the rule and the path and quotes the offending VALUE; `given_by` —
  the one field that carries a person — is never echoed into a message.
- The reader holds no state and takes TEXT, never a path, so there is no cache to go
  stale and no traversal surface.
- A revision above 2^53 loses precision through `Number.parseInt`: two grants spelled
  9007199254740992 and 9007199254740993 read as one number and are refused as two
  grants at one revision. Fail-closed, so not a defect — but the sentence names the
  wrong rule, and the field's whole job is deciding currency.

#### The security sweep

- **Browser safety of the pure entry** — the new module imports nothing at all, so the
  entry's transitive closure is exactly what the ground's M3 measured. `crypto` was
  the live temptation for sha validation and the build used a regex. The gap the ground
  names at M13 stands unchanged and unaggravated: nothing in this tree would CATCH a
  builtin added to the barrel, which is T-317-s4's subject and not this card's.
- **ReDoS** — the three patterns are bounded with no nested quantifier over a repeat.
- **Prototype pollution** — measured above, absent.
- **PII** — no email address, no person's name, no home path and no machine path in any
  added line; the pre-rename identifier appears nowhere in the diff.
- **Deserialisation** — the reading is by hand over text; no loader options were widened
  and no tag set was touched.
- No secret, token, credential or network reach anywhere in the added code.

#### The figures, with the ref each was measured at

The whole battery through the blessed gate-runner at `68284cee`, on this bench's own
port, each leg once:

| suite | bodies | targets | exit | verdict | at the base (ground M6) |
|---|---|---|---|---|---|
| parser | 452 | 1 | 0 | GREEN | 416 |
| app | 1171 | 1 | 0 | GREEN | — |
| rust | 655 | 18 | 0 | GREEN | — |
| e2e | 1091 | 1 | 0 | GREEN | 1087 |

The counts move by exactly what the diff adds: 36 bodies in the parser spec and 4 in
the CLI spec. `lib/parser/dist` was verified CURRENT with `src` at the tip by building
to a scratch directory and comparing — every emitted file identical but the source maps,
whose only difference is the output path. So no reading here is a stale-dist green, which
is this project's own known failure mode on exactly this pairing.

#### The findings — none of them blocking

- **The declared `shape:` is rendered and never read.** The declaration drives the field
  set, the value sets, the absent values and requiredness; it does NOT drive which check
  runs on a field's value. Measured: `grant.at` declared `shape: text` instead of
  `shape: instant` still refuses `at: "yesterday"` as not an ISO instant — the schema
  moved and the reading did not. Sharper: a row ADDED to the declaration is half-read —
  `grant.note` declared `required: with-parent` made a grant WITHOUT a `note:` refuse by
  name, while a grant carrying `note: 12345` read with `note` validated by nothing and
  absent from the value the reader answers. A declaration that can make a reader demand a
  field it then drops is a seam, and the schema's own prose ("`shape` — what the value
  must BE") is what a maintainer would act on. Filed as **T-319-s5**; correction 3 records
  the limit in the schema meanwhile. Not a criterion failure: this card's criterion names a
  FIXED field set and every field in it is checked correctly today.
- **A trailing YAML comment on a value line is refused as a bad value.** `approval: standing  # the mode`
  is refused with "which is not one of its values" — the value rule named for what is
  really a comment. The block's own key line MAY carry one, and a whole-line comment
  inside the block is skipped, so the three spellings differ and nothing says why. It is
  fail-closed and it quotes the text, so nothing is misread; what is wrong is that a legal
  YAML line is refused by a sentence pointing at the wrong rule, in the one record an
  owner edits by hand. Filed as **T-319-s6**.
- **A refusal is a prose sentence and carries no stable code.** Nine rules, nine
  sentences, no tag a consumer could branch on; every body matches English. This joins
  the module's own established convention, which the ground records at M10 — the settings
  reader is the one reader in this library that does not use the `ParseIssue` union — so
  it is the right choice for this card and the wrong shape for the arm that T-324 will
  build. Recorded rather than assigned: choosing the vocabulary is that card's work, not
  a repair to this one.
- **A NEW ATTRIBUTE added to the declaration would render nowhere.** The reference's
  per-row bullets are a fixed sequence, exactly as the switch renderer's ten bullets
  already are at the base (the ground's M8 names that limit). Consistent with what was
  there; named so the next hand knows.
- **The four follow-ups the executor filed are accurate.** I checked the two that make
  a claim about code: the arm destructures six of the reader's seven symbols, and the
  root entry exports none of the dispatch vocabulary the browser entry exports. Both
  true as written. T-319-s3 is the executor finding an all-digit blob sha where its own
  two readings disagree, changing the fixture rather than the rule, and saying so — the
  honest move, and I reproduced the reading.

#### The assigned corrections — three, two of them carrying a mutant block

**Correction 1 — `advisory` joins the closed-set discipline the three attributes
beside it already keep.** `required`, `shape` and `implementation` are each refused
outside their own set; `advisory` was read as `processScalar(rest) === 'true'` and
nothing else. So `advisory: yes` — which a real YAML parser reads as TRUE — reads as
FALSE without a word, and the label AC1 asks the limits rows to carry goes missing
rather than being refused. Measured at the tip: the shipped schema with `limits.tokens`
written `advisory: yes` parsed, and that row answered `false`. The live tree is guarded
today only because a body compares the hand reading to a real YAML reading over the
shipped file; the module's own contract is not. The body is committed on this bench
after this verdict; it needs the code change the block names. Read **RED** against the
implementation lacking the property — 1 failed / 61 passed, exit 1, the named body alone,
on `advisory: yes: a label nobody can read parsed: expected undefined to be an instance
of ProcessFinding` — and **GREEN** against the implementation carrying it, 62 passed,
exit 0, with the parser typecheck clean.

**Correction 2 — the history's order is a decision, and it is pinned.** AC1 calls the
history "every earlier grant in order" and AC3's list of refusals does not carry an
out-of-sequence one, so "in order" is the order the FILE writes — which this reader
preserves. Measured at the tip: a history written `[2, 1]` read as `[2, 1]` with no
refusal, and nothing in the diff said whether that was the decision or the omission.
The correction needs NO code change; the body is the decision, and it reds if a later
hand sorts the list or refuses the sequence without moving the card. Read **RED**
against an implementation lacking the property — the reader with a `history.sort(...)`
planted after the read loop — at 1 failed / 61 passed, exit 1, the named body alone, on
`the history was re-ordered, or a descending sequence was refused: expected [ 1, 2 ] to
deeply equal [ 2, 1 ]`; and **GREEN** against the implementation as built, 62 passed,
exit 0.

**Correction 3 — the schema's own sentence about `shape` stops overstating what the
attribute does.** A WORDING REPAIR to a comment: **it pins no property and owes no
mutant block, and the block count below is short of the correction count for that
reason alone.** In `method/runtime/process-schema.yaml`, in the `THE FIELDS OF A ROW` comment
above `dispatch_block:`, two edits, each naming its line by its TEXT. Replace
the one line

    #   shape     what the value must BE. The set is closed and the reader

with these two

    #   shape     what the value IS, as this comment and the generated
    #             reference say it. The set is closed and the reader

and insert, immediately after the line

    #             (earlier grants in order, each shaped like `grant`).

these three

    #             The reader answers each field it knows BY NAME, so a
    #             shape edited here does not today move what the reader
    #             accepts — T-319-s5 is that seam.

The whole edit is inside a comment: the parser skips comment lines, the rendered
reference is a function of the parsed declaration, and I confirmed no spec in this
tree pins the sentence. Applying it moves no body and no generated byte.

```mutant
correction: the declaration's advisory label is the one attribute no closed set guards
file: lib/parser/src/process-settings.ts
spec: lib/parser/test/process-settings.test.ts
body: the dispatch block declaration > REFUSES an `advisory` that is neither `true` nor `false`, which a real YAML parser reads as a boolean anyway
message: a label nobody can read parsed
--- old
          else if (key === 'advisory') {
            const spelled = processScalar(rest);
            if (spelled !== 'true' && spelled !== 'false') {
              throw new Finding(
                `${at}: \`advisory: ${spelled}\` is neither \`true\` nor \`false\`. A spelling this ` +
                  'parser reads as false while a real YAML parser reads as true would drop, without a ' +
                  'word, the one label that says nothing in this tree enforces the field — and ' +
                  '`required`, `shape` and `implementation` are each checked against their own closed ' +
                  'set for exactly that reason.',
              );
            }
            curField[key] = spelled === 'true';
          }
--- new
          else if (key === 'advisory') curField[key] = processScalar(rest) === 'true';
```

```mutant
correction: the history's order is the record's own, and nothing pinned it
file: lib/parser/src/process-settings.ts
spec: lib/parser/test/process-settings.test.ts
body: the dispatch block reader > reads the history in the ORDER THE RECORD WRITES IT, neither sorting it nor refusing a sequence
message: the history was re-ordered, or a descending sequence was refused
--- old
        history.push(readGrant(entry, 'an earlier grant', null));
      }
    } else {
--- new
        history.push(readGrant(entry, 'an earlier grant', null));
      }
      history.sort((a, b) => a.revision - b.revision);
    } else {
```

Three corrections, two blocks. Correction 2's `old` text is ALREADY in the merged
tree, which is the "already applied" arm of the correction step; its block exists so
the drill has a mutant to plant.

**A note on how `body:` is spelled, because I measured it rather than assumed it.**
The merge's `failingBodies` reads a vitest run's `FAIL <file> > <describe> > <it>`
line and keeps everything after the file — the `×` line does not match its pattern at
all. So the name it compares against is the DESCRIBE PATH and not the bare `it(...)`
string, and both blocks above spell it that way. Measured on this bench by planting
each mutant and reading the run.

#### Filed, not assigned

- **T-319-s5** — the declared `shape:` is rendered and never read, and a row added to
  the declaration is required present and then dropped.
- **T-319-s6** — a YAML comment after a dispatch block value is refused as a bad value,
  and the refusal names the wrong rule.

Both are `status: suggested` with `suggested_by` naming this seat. Neither blocks
this merge.

#### What the merge still owes, and it is owed by construction

The census and the committed graph are STALE at this tip and are NOT regenerated on
this bench: the diff adds 40 bodies and moves symbols, and a graph regeneration moves
six dogfood pins under a path this fence does not carry. The executor's readings —
census 101115 bytes against a fresh 101547, `index --check` exit 1 over 203 unchanged
files with symbols 2593 to 2626 and edges 2488 to 2505 — are at `163d0740`; mine at my
own tip are in the postscript below. Both are stale for the same reason and the merge
regenerates both.

#### The readings at MY OWN tip, not the one I was sent

A figure measured at the commit I was sent is stale at the tip my verdict created,
so the whole battery was run again, through the blessed gate-runner on this bench's
own port, over the tree carrying this verdict, both committed correction bodies and
the two filed cards — at `d97dbdf5a7d30e61ea8ea32a48df347015de58f4`.

| suite | bodies | targets | exit | verdict | at the tip I was sent |
|---|---|---|---|---|---|
| parser | 454 | 1 | 1 | **RED**, by construction — read the paragraph below | 452, exit 0 |
| app | 1171 | 1 | 0 | GREEN | 1171, exit 0 |
| rust | 655 | 18 | 0 | GREEN | 655, exit 0 |
| e2e | 1091 | 1 | 0 | GREEN | 1091, exit 0 |

The parser count moves by exactly the two bodies this verdict commits.

**The parser leg's red is this verdict's own, and it is the RED reading step 5b
owes.** Correction 1 needs a code change a verifier does not commit — the block
carries it and the merge applies it — so at this tip the property is absent and the
body that pins it fails. It fails ALONE, and the claim is as wide as the whole
library suite rather than one spec: 1 failed and 453 passed of 454, over 17 files,
and the one failure is the body named by the mutant block above — the declaration's
refusal of an advisory label spelled neither true nor false.
The merge applies correction 1 before its regenerations and the leg is green from
that commit onward. Correction 2's body is GREEN at this tip, because its correction
needed no code change and its block exists only to give the drill a mutant to plant.
Nothing else in the battery moved: every other leg carries the same count and the
same exit as at the tip I was sent.

**Neither generated file was regenerated here, and both are stale by construction.**

- the census: STALE, committed 101115 bytes against a fresh 101547.
- the graph: `index --check` exit 1 — 203 files unchanged, symbols 2593 to 2626,
  edges 2488 to 2505, over three changed .ts files. A regeneration moves six
  dogfood pins under a path this card's fence does not carry, which is why it
  belongs to the merge and not to a bench.

Both readings are identical to the executor's at the lane tip: the two bodies this
verdict adds move no symbol and no census sentence.

`lint:docs` exit 0 (so `docs/INDEX.md` is not stale) and `lint:tokens` clean —
TOKEN 188 files, CONTROL 1596 tracked text files, six more than the base's 1590,
which is the four cards the lane filed and the two this verdict files.
`lib/parser/dist` was verified CURRENT with `src` at this tip by building to a
scratch directory and comparing: every emitted file identical but the source maps,
whose only difference is the output path. So no reading in this verdict is a
stale-dist green.

#### Three notes the integrator should not have to rediscover

**THE VERIFIER'S WRITE OWES NO FENCE WIDENING HERE.** Both correction bodies live in
`lib/parser/test/process-settings.test.ts`, which is already the card's own fence
token, and both mutant blocks plant into `lib/parser/src/process-settings.ts`, also
in the fence. The widening step exists for a verdict whose spec sits outside the
fence; this one does not, and the landing gate reading this merge's first parent
will find every path admitted.

**THE TWO AMENDMENTS OF 2026-09-14 ARE HONOURED, AND ONE OF THEM WAS OVERTAKEN BY
THE FENCE.** The promotion amendment put the record in the runtime template's own
`dispatch:` block, declared beside it, with no separate record class — which is what
landed. The recovery-policy amendment asked for the two modes as SWITCHES declared
once in the schema, and that spelling was not available: I checked the constraint
the notes cite rather than taking it on trust, and it holds — `tools/e2e/tests/brief.spec.ts`
carries a typed `PROCESS_SWITCH_IDS` list the schema's switch set must equal exactly,
and another body there requires every non-floor switch to be a row of
`docs/rooms/loop-cost-and-speed.md`; neither file is in this fence. The declaration
became a schema section of its own instead, the switch set is unchanged at 42, and
the M4 byte comparison above is the proof that nothing about the switches moved. The
same amendment's "this card adds no parser code" was withdrawn by the card's own
canonical section, so the reader is owed and was built.

**"THE SAME `readGrant`" HAS ONE ARGUED EXCEPTION.** A history entry's `until` is
optional where the current grant's is conditioned on the block's mode, because the
approval mode belongs to the block and not to a grant — an earlier grant may
legitimately carry an `until` under a block that now reads `standing`. What is still
checked for a history entry is that its own `order` carries the card it names. The
reader says this in a comment at the site; it is a decision rather than a gap, and
it is the one place the two readings differ.
