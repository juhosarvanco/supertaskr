---
id: T-112
title: A card hands you its brief — the contract transcribed, for any agent, CLI or app
feature: F-04
milestone: 4
priority: 5
size: M
status: verifying
blocked_by: [T-111]
touches: [app-dispatch, app-board]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-089-s3 — files removed in this commit.

The slice's last act, and the one that makes the follower-first ruling
real. `genesis_kickoff` is the working precedent: it assembles a
kickoff for a human to paste into their own terminal, and ADR-017
point 5 makes hand-driven a first-class mode rather than a fallback
nobody built. **Dispatch gets the same instrument before it gets a
spawn**, for the same reason — any model, any CLI, and, as this
session measured, any agent that exists only as a desktop app and can
never be spawned at all.

**T-089 wrote the contract this card transcribes**: a 13-row normative
table in `method/roles/executor.md`, each row naming what it carries,
what it is assembled from, and what a session guesses when the row is
absent. That card was **rejected once for exactly the failure this one
must not repeat** — its verifier tried to follow the table by hand and
five of thirteen rows did not yield their content, while the card's own
example brief silently went elsewhere on four of them. The fix wrote
the missing sources, including a `## The report` spec that had not
existed. **This card's assembler is the second reader of that table,
and it will find whatever the hand-walk missed.**

Three residuals are known and open (`T-089-s9`): row 9 is row 8's
untwinned twin; row 5's slug↔path map is named but not located
(`docs/ARCHITECTURE.md` plus each component's `touch_slugs:`); and row
11 tells a size-S executor to "checkpoint" while no source it names
defines one. **This card SHALL NOT silently paper over them** — where
the table is still ambiguous, the assembler either resolves it against
a named source or reports the row as unassemblable.

## Acceptance criteria

- THE app SHALL gain one command assembling the executor brief for one
  card, **transcribing T-089's table row by row**, returning a typed
  outcome. The command's argument surface SHALL be the narrowest that
  works — ADR-012's "narrowness lives in the command's own signature" —
  and anything crossing the boundary SHALL be justified rather than
  defaulted to a path. **The IPC census moves and SHALL be corrected at
  both ends, never widened**; `acl_pin.rs` SHALL be a 0-file diff at 92
  grants, because an app command is not a webview grant.
- **EVERY ROW OF THE TABLE SHALL BE ACCOUNTED FOR IN THE OUTPUT**, and a
  pin SHALL assert each is present and non-empty: role, card id and
  path, the read-first set, the lane, the fence, setup, the gate
  commands read from the project's own CONVENTIONS, the standing
  disciplines, the prohibitions, the deliverable, the report spec, and
  the correction clause. IF a row cannot be assembled from its named
  source THEN the outcome SHALL say **which row and which source**, and
  the card SHALL file it against `T-089-s9` rather than inventing a
  value.
- THE brief SHALL carry the lane commands for that card — worktree and
  branch in the project's own spellings — and **the command that finds
  the commit to cut from**, so a human never has to remember DISPATCH
  FROM THE LAST CHECKPOINT. Per the plan's ruling the brief carries the
  *command*, not the resolved answer: **no git subprocess in this
  card.** T-013 spent a rejection on a git subprocess getting its
  program from the opened project; this slice does not need one.
- **THE BRIEF SHALL BE ASSEMBLED FROM FILES AND NEVER FROM WHAT A MODEL
  SAID.** A pin SHALL prove it the way T-028's completion detection was
  proved: hand the assembler a card object that throws on any field it
  is not entitled to read, and require a brief.
- **THE VERIFIER'S BRIEF SHALL WITHHOLD THE EXECUTOR'S REASONING, and
  this is the card where the program finally beats the practice.**
  `verifier.md` forbids the verifier the executor's notes; `executor.md`
  puts those notes in the file the verifier reads. Three leak paths are
  documented (`T-089-s2`): the card body, the verdict, and — measured
  this session — the architect's own brief relaying the executor's
  reasoning. A human cannot un-read; the assembler can simply not send.
  A pin SHALL prove the exclusion by construction: give the assembler a
  card whose implementation-notes section throws on read, and require a
  verifier brief.

  **AND THE CLAIM THAT THE LEAK IS UNAVOIDABLE IS FALSE** — three
  verifiers declared exposure unavoidable "via a single `cat`" and each
  was one command from not having it. **The interim discipline is
  `T-121`'s and this card SHALL NOT restate it**; read it there and
  cross-reference, because a rule with two implementations is two
  chances to disagree (T-057) and this paragraph has already been one
  of them.

  **CORRECTED 2026-08-24, seventh triage.** An earlier revision of this
  criterion named `sed -n '1,86p'` as the boundary. **T-121 measured
  that number and refuted it in both directions** over all 166 flat
  cards: of the 88 carrying `## Implementation notes`, **41 have it at
  or before line 86** — so the read leaks the reasoning anyway — and
  **47 have it after**, where it truncates the criteria the verifier
  exists to attack. Exactly two land where the number works. The
  boundary must be **derived** (the first `## Implementation notes` or
  `## Verdicts` heading), not numeric. The architect wrote the wrong
  number into this card and relayed it through five briefs, which is
  the same defect T-085 and T-086 exist to fix — a claim retracted in
  one place and still asserted in another.
- THE detail panel SHALL render the brief in a copyable block **only for
  a card whose T-111 disposition is `dispatchable`** — a brief for a
  card you must not dispatch is an invitation to break the fence — and
  SHALL render the disposition's reason instead when it is not.
- IF the assembler cannot read something the brief requires THEN it
  SHALL return a typed outcome naming what was missing, and the panel
  SHALL render that instead of a partial brief. **A brief with a
  silently missing gate list is worse than no brief** — this session
  produced three briefs with stale figures and every one cost a lane
  real time.
- IF a card is dispatched by hand from this brief THEN nothing in the
  app SHALL need to be told: the lane appears through T-110 when the
  worktree lands. A pin SHALL drive that end to end over a fixture
  repository.

Verification: headless — `cargo test` from app/src-tauri for the
assembler and its typed refusals; one app-side DOM test for the
copyable block and for its absence on a fenced card; the IPC census
re-derived from both ends and intersected; `acl_pin.rs` quoted with its
sha256. The DOCS GATE fires; run what it owes. **@human, and it is the
slice's closing evidence: one hand-driven dispatch of a real card using
only this brief, into any agent — the measured proof that the pasted
brief and a spawned one are indistinguishable to the repository.**

PLANNING PREP (2026-08-30, integrator, @human's ruled night order —
derivation only, no dispatch): the flip pairs at 558d660. Direct slug
sharers among planned cards: ONE — T-031-s1 (app-board). But the slug
map shares C-11 between app-board (C-08,C-09,C-11,C-17,C-18) and
app-shell (C-05,C-10,C-11,C-16), so T-112's expansion overlaps EVERY
app-shell card's through C-11 — nineteen planned cards flip with it
(derive: the awk-over-touches sweep in this note's checkpoint record).
Consequence for the dispatch decision: T-112 runs alone against the
whole shell train; its natural slot is a quiet-shell window right
after a checkpoint, and T-031-s1 (the double sharer) should be ruled
before or absorbed into it. The C-11 sharing itself is the lever — if
design tokens moved to their own never-fenced slug, app-board and
app-shell would decouple and T-112's collision surface would drop
from ~19 to 1. That is an architecture ruling, not a lane's act:
@human decides dispatch timing, or the C-11 split first.

CORRECTION 2026-08-30 (T-163's lane, at `71ce2422089c` — the note above
is STALE from this ref forward and is kept rather than rewritten,
because a retraction that erases what it retracts leaves nobody able to
check it). **THE C-11 SPLIT HAPPENED**: @human ruled it, T-163 executed
it, and `docs/architecture/components/C-11-design-tokens.md` now carries
`touch_slugs: []` — design tokens claim NO slug at all rather than a
never-fenced one, for the reason argued at that field. The lever the
note describes has been pulled, so the figure it stamps no longer holds.

**RE-DERIVED AT `71ce2422089c`, BOTH SIDES AT ONE REF**, by sweeping
every flat `docs/tasks/T-*.md` at `status: planned` through
`fenceOverlaps` in tools/e2e/scripts/dispatch-brief.mjs — the SAME
comparator the dispatch brief's row 5 uses, rather than the note's own
awk-over-touches sweep, which is why the before-figure below is not the
note's **~19** either. 325 flat cards read, 67 of them planned;
T-112's `touches:` is `[app-dispatch, app-board]`, unchanged.

| C-11's `touch_slugs:` | planned cards whose fence overlaps T-112's |
|---|---|
| `[app-shell, app-board]` (before) | **27** |
| `[]` (after) | **2** |

**AND THE TWO SURVIVORS ARE NOT THE SAME KIND OF SURVIVOR**, which the
bare count hides. `T-031-s1` overlaps on `the same entry` — it declares
`app-board` itself, and it is the ONE direct sharer the note already
named; that row is exactly what the note predicted would remain.
`T-163` overlaps on `app/test`, through `app-board`'s own expansion, and
it is a LANE that stops existing the moment this correction merges — so
the standing answer to "what still flips with T-112" is **ONE card,
T-031-s1**, which is the note's own prediction met. Of the 25 rows that
left, every one left for the same reason and the comparator said so in
as many words: `both reserve app/src/assets/**` — C-11's own territory,
reached from an `app-shell` fence that never meant to reserve it.

**THE BEFORE-FIGURE DISAGREES WITH THE NOTE AND THAT IS RECORDED RATHER
THAN RECONCILED AWAY**: 27 against ~19, two sweeps of the same question
at two refs (`558d660` then, `71ce2422089c` now) through two different
comparators. The note routes its reader to its checkpoint record for its
sweep; this correction routes to `fenceOverlaps`. Where they differ, the
comparator the FENCE is actually computed with is the one a dispatch
decision has to trust.

**WHAT THIS DOES NOT DECIDE**: T-112's dispatchability. The note's
advice to rule or absorb `T-031-s1` before dispatching stands unchanged
— the split removed the C-11 train, not the direct sharer — and @human
still owns the timing.

THE COLLIDER RULING, 2026-08-30 (standing triage sitting #3, architect
seat, `@ 51fa31c0964c`): **`T-031-s1` IS SEQUENCED BEHIND THIS CARD,
NOT ABSORBED INTO IT. THIS CARD DISPATCHES FIRST.** The note above asks
for exactly this ruling and it is now taken; the reasoning is written in
full on `T-031-s1` and summarised here so a dispatcher reading only this
card gets the answer.

Absorption was weighed and refused on the merits. The two contracts are
unrelated — this card assembles a brief from files and renders it; that
card is the board's containment pass, anchoring the verdict splitter at
column 0 in the shell-owned module that card names, giving two surfaces
`break-words`, and replacing a class pin with a property assertion.
**Read the surfaces on `T-031-s1` and not here**: naming that module's
path in this card's body is itself a fence claim this card cannot make,
which the preflight refused on when this note first tried it. And
absorption would have made this card WORSE OFF: `T-031-s1`'s fence is
`[app-board,
app-shell, tools/e2e]`, so folding it in would push this card's
`[app-dispatch, app-board]` to include `app-shell` — re-acquiring the
whole shell train that the C-11 split removed, and undoing the
27-to-1 improvement the correction above measured. Clearing the last
collider by widening the fence is not clearing it.

**SO THIS CARD'S COLLISION SURFACE IS UNCHANGED AND ITS LAST NAMED
COLLIDER NOW HAS A WRITTEN ORDER.** What remains before dispatch is
@human's timing call, which this seat does not take, and the ordinary
`brief.mjs --task T-112` fence check against whatever lanes are live at
that moment — which at this base is not empty: `T-143-s3` holds
`app-board` right now, and `node scripts/brief.mjs --task T-112` from
the e2e package exits 1 naming it. That is a lane, not a card, and it
clears when the lane lands.


## Implementation notes

**STATUS `verifying`, stamped in this lane only.** Branch
`task/T-112-the-brief`, worktree `/Users/ujju/Projects/nputer-T-112`.
Ceremony row M: executor -> verifier -> integrator, so the verifier
fields are left empty and nothing is merged from here.

### Where the assembler lives, and the one criterion that is NOT built

`app/src-tauri/src/dispatch/brief.rs` (new, inside C-15's own
`app/src-tauri/src/dispatch/**`) holds the whole assembler and 28 pins.
**It is a plain `pub fn`, not a `#[tauri::command]`, and that is
criterion 1's routed half rather than an omission.** Registration is
`app/src-tauri/src/lib.rs`'s `generate_handler!` list and BOTH ends of
the IPC census are `app/test/crescendo-dom.test.tsx`; both files are in
`docs/architecture/components/C-05-app.md`'s `paths:`, so both are
`app-shell`, and this card's `touches:` is `[app-dispatch, app-board]`.
Widening the fence from inside the lane is the one repair this role may
never make, so it is recorded and routed as **`T-112-s1`** — the same
disposition `T-110` took (`T-110-s1`) and `T-126` discharged, one card
over, and `dispatch/mod.rs` already carries that sentence.
`method/tasks/TASK-FORMAT.md` names this class exactly: *a card whose
criterion and whose fence disagree is a DEFECTIVE CARD, not a hard call
for the lane*.

**Because nothing is registered, the IPC census does NOT move**, which
is what criterion 1's own second clause requires either way: an app
command is not a webview grant. Re-derived at `8ee848e` from both ends
and intersected, with the two censuses' own regexes: FRONTEND **13**,
RUST **17**, intersection **13**, frontend-only **empty**. Rust-only:
`dispatch_lanes`, `pick_genesis_folder`, `pick_project_folder`,
`start_genesis_here`. `acl_pin.rs` is a **0-file diff** against the base
`4e08d29` (`git diff --name-only` returns nothing for it), its
`EXPECTED_GRANTS` array holds **92** entries at this ref, and its
sha256 is
`81f9e4acbbe7f55e0de185e3643b2445ec287ee35f286ecdfe7e4b99839da653`.

### The thirteen rows, and what fed each

The row SET is not written down anywhere in this lane: `read_contract`
parses the table out of `method/roles/executor.md` at run time, so a
fourteenth row appears in the output with no edit here — and a row with
no assembler is reported by NUMBER and SOURCE rather than dropped
(pinned by growing the live table in a body). A table this module cannot
parse is an `Err`, never `Ok(vec![])`: an empty contract would make
every downstream *every row is present* assertion vacuously true, which
is poison shape TEN.

| row | fed from |
|---|---|
| 1 Role | `method/roles/<role>.md` — its `# ` heading and its opening line, quoted |
| 2 Task | the card's `id`/`path`/`title`/`status`/`size`/`feature`/`milestone` through `CardSource`, plus the role file's own confirm-understanding sentence; a verifier's brief also gets the DERIVED notes boundary |
| 3 Read-first set | `CLAUDE.md`/`AGENTS.md` (first that names any `docs/*.md`), with the role file's reading step **APPLIED** — subtraction and addition both derived from the role file's own sentences |
| 4 The lane | `docs/CONVENTIONS.md`'s lane bullet (integration branch, branch, worktree, create command, all backtick-extracted and `T-NNN`-substituted), its DISPATCH FROM THE LAST CHECKPOINT bullet, and `method/lane-protocol.md` rules two and three |
| 5 The fence | the card's `touches:`; `lanes::read_lanes`'s live list (a FILE read of `.git/worktrees`); the slug map from each `docs/architecture/components/C-*.md`'s own `touch_slugs:` FIELD; disjointness computed as SETS through that map |
| 6 Setup | CONVENTIONS' `Fresh-clone ORDER` bullet and its `A FRESH WORKTREE HAS NOTHING INSTALLED` sub-bullet |
| 7 Commands | CONVENTIONS' four `run from <dir>/:` bullets, backtick-delimited, stopping at the first middle-dot segment that does not open with a backtick — the document's own rule, transcribed |
| 8 Gates | every top-level CONVENTIONS bullet stating `at any merge whose diff touches`, name plus TRIGGER |
| 9 Standing disciplines | every top-level CONVENTIONS bullet opening with an upper-case run — **row 8's clause borrowed; see the residual below** |
| 10 Prohibitions | CONVENTIONS' PORT RULE bullet, `lane-protocol.md` rule four, the `lsof` COMMAND for the live half, and the other checkouts from the same file read |
| 11 The deliverable | `method/tasks/TASK-FORMAT.md`'s ceremony row for THIS card's size (qualified rows matched, so the letter alone does not decide it), `lane-protocol.md` rule six, and the role file's step 6 |
| 12 The report | the brief's own role file's `## The report` bullets — `executor.md` for an executor, `verifier.md` for a verifier |
| 13 The correction clause | the contract table's own row 13, plus the role file's *a brief is evidence, never authority* and *every figure carries the ref* rules |

### The T-089-s9 residuals, surfaced

**`T-089-s9` NO LONGER EXISTS** — `T-104` absorbed it at the seventh
triage and removed the file, so *file it against `T-089-s9`* had no
holder. Filed as **`T-112-s2`** instead, which says so.

- **Row 9 is row 8's untwinned twin — OPEN.** Row 8's source names its
  enumeration; row 9's is the bare *the project's CONVENTIONS*. The
  mechanism above is therefore BORROWED, and the symptom is measured
  rather than predicted: a named bullet whose name runs through a
  lower-case word is cut at that word, so CONVENTIONS' merge-into-main
  bullet comes back as `THE MERGE INTO MAIN IS`. **The independent
  reader in `tools/e2e/scripts/dispatch-brief.mjs` cuts the same name at
  the same word**, which is what makes it the contract's defect. Carried
  on the row as a `residual` and asserted by
  `row_nines_borrowed_mechanism_truncates_a_name_and_the_symptom_is_asserted`
  rather than repaired: repairing it means inventing a rule row 9 does
  not state, which is the paper-over this card forbids.
- **Row 11's `checkpoint` — OPEN.** All three sources row 11 names use
  the word; none defines it. The size-S ceremony row routes to
  `lane-protocol.md` rules 4 and 6, neither a definition; the definition
  is in `method/docs-protocol.md` and `roles/integrator.md`, which row 11
  does not name. Carried on the row as a `residual`.
- **Row 5's slug/path map — CLOSED AT THIS REF, and said so rather than
  filed.** Row 5 now locates it and names which copy wins.
  `row_fives_residual_is_closed_at_this_ref_and_the_document_says_so`
  reds if that clause ever leaves the column.

### The pins the card asks for, by name

- **Assembled from FILES**: `HostileCard` panics on any field outside
  `ENTITLED_FIELDS` and a brief still comes back
  (`a_card_that_refuses_every_unentitled_field_still_yields_a_brief`).
  **With its positive control** — refusing an ENTITLED field makes the
  same call panic, caught with `catch_unwind`, so the guard is shown
  capable of firing.
- **Verifier blindness BY CONSTRUCTION**:
  `ImplementationNotes`/`Verdicts`/`Body` are outside the entitled set
  for EVERY role — there is no flag anyone can set wrong — and
  `NotesThrowCard` panics on a notes read while a verifier brief is
  required out the other side. The brief's rendered text is also
  asserted not to contain the fixture notes' own bytes.
  `FrontmatterCard` parses no body section at all, so the bytes never
  enter the struct.
- **The derived notes boundary**: `notes_boundary` answers 5 on a card
  whose notes come early and 405 on one whose notes come late — the two
  directions `T-121` measured against the number this criterion used to
  carry. The verifier's brief names the HEADINGS and carries no digit;
  the cross-reference to `T-121` rides in the line's provenance, and the
  **interim discipline itself is not restated here**.
- **No git subprocess**: row 4 emits
  `git log --first-parent --format='%H %s' main | grep -m1 ' Checkpoint:' | cut -d' ' -f1`
  — both moving parts file-derived, the composition named as the
  assembler's own — and a body asserts no 40-hex run appears anywhere in
  row 4. `no_subprocess_in_this_file` sweeps the production half of this
  module for the process API, with its needles shown capable of matching.
- **Never a partial brief**: any unassemblable row takes the whole answer
  to `Unassemblable`, listing every affected row with its source column
  and the path tried. Asserted against a source that refuses
  `docs/CONVENTIONS.md`, **with the positive control that the same call
  assembles when nothing refuses**.
- **The copyable block only for `dispatchable`**: `selectBriefPanel`
  consumes `selectDispositions` — **its first consumer in `app/src`** —
  and renders the disposition's own REASON otherwise. Proved for
  `fenced` and for `blocked`, each with the positive control that the
  same card with no lane live comes back copyable.
- **End to end over a fixture repository**: assemble the brief in a
  temp-directory repo, perform by hand exactly what row 4's create
  command leaves on disk (`.git/worktrees` bookkeeping), and the lane
  appears through T-110's reader with nothing told to anything — then the
  re-assembled brief names its own lane. Nothing in the Rust suite reads
  this repository's `.git`.

### Commands, exit codes read from `$?` unpiped

| command | cwd | exit |
|---|---|---|
| `npm ci` then `npm run build` | lib/parser/ | 0, 0 |
| `npm install` then `npm run build` | app/ | 0, 0 |
| `npm ci` | tools/e2e/ | 0 |
| `node scripts/brief.mjs --task T-112` | tools/e2e/ | 0 |
| `npx vitest run` (336 passed / 16 files) | lib/parser/ | 0 |
| `npx tsc --noEmit` | lib/parser/ | 0 |
| `npm test` (1060 passed / 49 files) | app/ | 0 |
| `cargo test` (251 + 86 + 197 + 10 + 4 + 16 passed, 2 ignored) | app/src-tauri/ | 0 |
| `npm run lint:tokens` (TOKEN 159 files, CONTROL 976) | tools/e2e/ | 0 |

The cargo cache cliff was watched rather than assumed: the lib suite's
own time is **4.21s**, well inside the under-9.5s green band, so
`startup_arm_watches_the_initial_root` is not near it. No `cargo clean`
was run; other lanes were live.

### The drill — 17 for 17, plus one measured survivor

Detached scratch worktree at `/tmp/t112d`, cut at this lane's own commit
`8ee848e`, with `CARGO_TARGET_DIR=/tmp/t112d/target` — inside itself and
named `target`, the walk-safe form. One stem derived from the lane
(`t112d`) spent on the worktree, the target dir and the driver script.
Every mutant is ONE-SIDED production source, `git diff --numstat` read
back before each suite ran, restored with
`git restore --source=8ee848e --staged --worktree --` and proved by
sha256 on all three files, worktree clean afterwards.

**17 of 17 killed.** Twelve Rust: an empty contract table returning
`Ok`; every field entitled; a partial brief; row 3 unapplied; row 4's
command losing its marker; a no-card lane called DISJOINT; the command
read not stopping at a non-backtick segment; a gate with no trigger; the
notes boundary as a number; a verifier brief with no marker; the
ceremony row taken as the table's first; and row 2 reading the
implementation notes. Five TypeScript: the disposition gate letting a
fenced card through; a typed refusal dropping WHICH ROW and WHICH
SOURCE; a dropped residual; a dropped provenance; and the block
rendering with no lane channel. Each killed by 1 to 3 named bodies.

**AND ONE MUTANT SURVIVES, WHICH IS THE FINDING.** Deleting the two
lines that thread `dispatch` and `brief` out of `Board.tsx` left
`npm test` from app/ at **49 files / 1060 tests, exit 0**.
`C-18-board-root.md` declares no `app/test/**` path, and no other board
test file may import `Board` without an undeclared component edge — the
defect `arch drift` caught at T-169. Routed as **`T-112-s4`** with the
measurement. Every JUDGEMENT was kept out of the component for exactly
this reason; what survives is plumbing that has nowhere testable to go.

### Where the brief and the card were wrong

1. **The card's criterion 1 orders work outside its own `touches:`** —
   the IPC census and the registration are both `app-shell`. Routed as
   `T-112-s1`; the fence was not widened.
2. **`T-089-s9` does not exist** — absorbed into `T-104` and removed at
   the seventh triage — so *file it against `T-089-s9`* names no holder.
   `T-112-s2` is the holder.
3. **Only TWO of the card's three residuals are open at this ref.** Row
   5's is closed in the document; a body keeps that claim honest.
4. **`brief.mjs`'s row 3 does not apply the role file's reading step** —
   it prints both adapters' lists, ROADMAP still in and TASK-FORMAT
   still out, which is the internally-inconsistent brief the table's own
   rules section names. Routed as `T-112-s3`.
5. **The brief's live facts had already moved.** Its row 5 named
   `T-167-s1` as a live lane; that lane landed during this build and
   `git worktree list` no longer carries it. Its row 4 stamped a base of
   `11e94867dd84` and an integration tip of `2e4b76ff8950`; re-derived at
   this lane's tip the newest `Checkpoint:` on main is
   `4e08d293b0fcd14c` and that is also the tip. Live facts, re-read
   rather than trusted — which is what row 13 asks for.
6. **The verification line's *IPC census re-derived from both ends and
   intersected* was performed and the census did not move**, because the
   half that would have moved it is routed. Reported rather than
   silently satisfied.

### The standing gates, derived at the tree this tip WILL have

Derived through the RANGE RULE's executor form —
`TREE=$(git merge-tree --write-tree 4e08d293b0fcd14c HEAD)` (exit **0**,
tree `6a8efca345d0`) then `git diff --name-only 4e08d293b0fcd14c "$TREE"`
— which is the forecast that does not move when this notes commit lands.
**13 paths**: eight under `app/`, five flat `docs/tasks/T-112*`. The
pre-merge two-dot form against the same left-hand ref returns 44 and
carries main's own newer work in reverse, which is exactly the lie that
rule exists to prevent; it is named here because it was run and
discarded.

| gate | trigger matched? | result |
|---|---|---|
| GRAPH REGEN | **FIRES** — `.rs` and `.ts`/`.tsx` outside docs/ | verdict REPORTED below; the regen is the integrator's |
| BOOT GATE | **FIRES** — `app/src-tauri/**` and `app/src/**` | `NPUTER_BOOT_PORT=14112 npm run boot:check` from tools/e2e/, **exit 0**, both `[nputer]` lines seen (`project folder:` and `window "main" created`). Port read with `lsof -nP -iTCP:14112 -sTCP:LISTEN` at zero rows immediately before spawning; 1420 was READ and never probed, and its holder is `node` pid 59723 on `[::1]:1420` |
| DOCS GATE | **FIRES** — 5 paths under `docs/` are code inputs | `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only …)` **exit 1** (has a verdict), owing three suites; all three run below at exit 0. `npm run lint:docs` from tools/e2e/ (the whole-tree half) **exit 0** |
| METHOD EVAL GATE | **NOT OWED** — no `method/**` path in the forecast | — |
| AUDIT GATE | declares no merge-diff trigger, so it is not one of these | — |

Suites the DOCS GATE named, all re-run AFTER the cards landed:
`npm test` from app/ **exit 0** (49 files / 1060 tests), `npx vitest run`
from lib/parser/ **exit 0** (16 files / 336 tests), and `npm test` from
tools/e2e/ **exit 0 — 321 passed** on `NPUTER_E2E_PORT=14512` (read at
zero rows first). **The live-lane class did not fire**: `T-154-s2` holds
`tools/e2e` and no body redded on it. The lane restored all seven of its
control-byte plant targets — `git status --porcelain` is empty after the
run.

**GRAPH REGEN's VERDICT, REPORTED RATHER THAN ACTED ON.**
`cargo run -p nputer-index -- index --check --root ../..` from
app/src-tauri/ exits **1** and it is a REAL red, not the `--root`
false one: the second line prints both sides rather than
`committed: MISSING`. Committed `1037788 bytes · 198 files · 2095
symbols · 2292 edges`; fresh `1038884 bytes · 199 files · 2065 symbols ·
2333 edges`. `files +1 -0 ~10`, `edges +47 -6`.

**AND THE REGEN IS NEWS BEYOND ITS OWN GATE, SO IT IS SAID LOUDLY.** The
fresh index lands at **1038884 of 1040000 bytes — 1116 left**, and
`stats.truncated_files` moves `Some(2) -> Some(4)`. One of the newly
truncated files is `app/src-tauri/src/docs_watch.rs`, whose symbols go
**55 -> 0** in the fresh index. That is the budget hazard `docs/STATE.md`
already names as live (`T-140-s4`, `T-140-s1`, @human's) arriving at this
merge rather than a new defect, and nothing is filed for it here because
the class is already held — but the integrator should read those two
numbers before regenerating.

**ONE INHERITED RED, ATTRIBUTED.** `npm run capabilities:check` from
tools/e2e/ exits **1** — *committed 25444 bytes, a fresh generation is
25528*. It is not this lane's: the generator's inputs are
`tools/e2e/tests/*.spec.ts` and the merge forecast above contains no
`tools/e2e` path and no `docs/CAPABILITIES.md`. It is
`T-153-s8`'s card by name — *the generated capabilities census is stale
on main and no gate can say so*.
