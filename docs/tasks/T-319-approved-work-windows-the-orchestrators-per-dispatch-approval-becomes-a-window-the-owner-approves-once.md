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
