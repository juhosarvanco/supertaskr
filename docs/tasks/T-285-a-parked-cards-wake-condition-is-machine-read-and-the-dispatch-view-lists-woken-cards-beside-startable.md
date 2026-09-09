---
id: T-285
title: A parked card's wake condition is machine-read — a `wake:` field naming a card, a date or the fence, with the fence as the default — and the dispatch view lists WOKEN cards beside STARTABLE and flags parked cards that carry no condition at all
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: "@human (2026-09-09): decision C of the backlog review — \"Are the parked cards still in the priority queue in some way or are they just forgotten?\" — they are forgotten; ruled yes to a machine-read wake condition"
blocked_by: [T-282]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/tasks/TASK-FORMAT.md, tools/e2e/scripts/brief.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the third sitting of 2026-09-09 the board carried 129 parked
cards. Sixty-two of them state a wake condition in prose ("unpark with
the second adapter", "unpark at the design pass that owns the map
screen"); none states it in a field, and the dispatch view derives
STARTABLE from planned cards only, so no parked card has ever appeared
in it. orchestrator.md already says PARKED IS A CONDITION, NOT A SHELF
and names the default event — the fence's component is next
dispatched — but nothing reads the condition, so a parked card
resurfaces only when a human re-reads the folder, which the amnesty
of 2026-08-29 did once for 140 cards. The card parser preserves
unknown frontmatter keys, so the field needs no parser change.

## Acceptance criteria

- WHEN a parked card carries `wake:` naming a card id THE view SHALL
  list it as WOKEN once that card's status is done; naming an ISO date,
  once the clock has passed it; naming `fence`, once any lane is
  dispatched whose expanded fence overlaps the parked card's; and WHEN
  the field is absent THE `fence` form SHALL be the default, as
  orchestrator.md states.
- WHEN `brief.mjs --dispatch --full` renders THE view SHALL carry a
  WOKEN section listing each parked card whose condition holds, with
  the condition and the record that satisfied it, each figure carrying
  its provenance, and SHALL change no card — waking is the seat's act
  (promote, or re-park with a new condition).
- WHEN a parked card carries neither a `wake:` field nor a prose
  condition THE view SHALL count and name it under PARKED WITHOUT A
  CONDITION — a flag for the human, never a closure.
- WHEN TASK-FORMAT.md is read THE encoding SHALL be stated once, and
  existing parked cards SHALL NOT be rewritten — their prose conditions
  stand and the seat adds the field at the next triage that touches
  them.
- A body SHALL show a parked card with `wake:` naming a card listed
  WOKEN when that card is done and absent when it is not, a body the
  date form on both sides of the clock, and a body the default form
  where a dispatched lane's fence overlaps and where it does not; each
  body SHALL be seen red on a board that lacks the arrangement.

## Implementation notes

Built at `488e495` (the dispatch stamp) in lane
`task/T-285-the-wake-field-on-parked-cards`, worktree
`/Users/ujju/Projects/nputer-T-285`, port 15285.

**WHAT WAS BUILT, AND WHERE.** The whole derivation is in
`tools/e2e/scripts/dispatch-brief.mjs`, in one section beside the
triage clusters and shaped like them: `readWake` interprets the field,
`cardBody` + `PROSE_WAKE_PATTERN` answer the prose question,
`parkedBoard` builds the column, `ruleWake` rules one card, and
`wakeRecs` renders the section as stamped records. `brief.mjs` gains
one import name and one statement; `method/tasks/TASK-FORMAT.md` gains
the encoding; `tools/e2e/tests/brief.spec.ts` gains eight bodies.

**THE FIELD NEEDED NO PARSER CHANGE**, as the card said:
`lib/parser/src/task.ts` preserves unknown frontmatter keys into
`extra`, so `wake:` arrives in the fields `frontmatterFields` already
returns and nothing re-parses frontmatter by hand.

**THE FENCE FORM BORROWS THE ONE EXPANDER.** `ruleWake` asks
`fenceOverlaps` over `expandFenceEntry` — the same pair the dispatch
order and the triage clusters spend — and takes the shared tokens out
of that function's own answer rather than walking the two fences again.
The slug face therefore works without being taught, which the fence
body drives: a parked card fencing `app-board` against a lane fencing a
path inside the component that slug expands to.

**THERE ARE THREE ANSWERS AND NOT TWO.** `held`, `waiting`, and
`unknown` — the vocabulary `fenceLedger` and the parser's `unusable`
already use: no wake proved and none ruled out. A lane whose card this
checkout cannot read holds an UNKNOWN fence, never an empty one (T-143
criteria 1 and 2), so a fence condition measured against a board with a
hole in it comes back `unknown` NAMING the hole. Folding that into
`waiting` is how a card stays parked because a file could not be
opened, which is the shelf this card exists to stop.

**AN UNPLACEABLE VALUE IS REPORTED, NEVER DEFAULTED.** The default is
what the ABSENCE of the field means; `wake:` written and left blank, a
list, `soonish`, and the date-shaped `2026-02-30` all come back
UNREADABLE and are named. Answering `fence` to any of them would hide a
half-written card behind a correct-looking answer.

**THE PROSE TEST, STATED.** A line of the card's BODY — never its
frontmatter — carrying the word `unpark` or the word `wake`,
case-insensitively, bounded on the left, so `awake` is not a condition
and neither is the `parked` every parking note spells about itself. The
same sentence is in TASK-FORMAT.md beside the encoding, and the body
drives both boundaries plus the frontmatter one.

**WHICH STAMP EACH ROW CARRIES IS A FUNCTION OF ITS FORM** (this
module's contract rule 3). A `card` condition is a read of the BOARD
and carries the ref; a `date` condition is a read of the CLOCK and a
`fence` condition is a read of the LANE LIST, and neither is a function
of the tree, so both are stamped live with a time and a host.

**MEASURED, AT THE LANE TIP, BY THE VIEW ITSELF** (live figures — the
lane list and the clock move, so re-derive rather than quote): 129
parked cards; 16 WOKEN; 17 carrying a condition that was read and does
not hold; 96 declaring no `touches:` at all, so the DEFAULT condition
names them no ground and no lane can ever satisfy it; 90 stating no
condition at all. The section is 10504 bytes of a 137460-byte
`--dispatch --full` answer, and one line of the default view.

**WHERE THE CARD IS WRONG.** Its first paragraph says sixty-two parked
cards state a wake condition in prose. Measured at `488e495` with the
prose test above, the figure is 39 — 129 parked less the 90 the view
counts as stating nothing at all. Two readings of "states a condition"
can differ, which is exactly why the test is now written down in the
method text rather than left to a count nobody can reproduce.

**THE COUNTED CLASS.** `THE DEFAULT CONDITION NAMES NO GROUND` is the
one class the view counts rather than spells, and it is counted because
its sentence is identical on all 96 members: printing each would be the
per-card byte cost T-225 proved is this answer's real capacity. The ids
are still named, on one line, because the remedy is per card. That
finding is filed as **T-285-s1**.

**THE FENCE WIDENING.** The card's fence as dispatched could not
satisfy criterion 2: `brief.mjs`'s `--dispatch` arm renders three
things and each is an explicit call, so a section living only in
`dispatch-brief.mjs` is exported and unreferenced — the shape T-282-s1
was filed for that same morning. The ask was written at the START of
the lane (fast path A), GRANTED by the seat at 12:38Z and landed at
13:03:51Z as main commit `97d5276`; the manifest was re-expanded and
the card's `touches:` line amended by the seat, not by this lane. The
wiring is UNGUARDED where T-282's clusters are behind `--full`, and the
difference is the question each answers: the default view is *what can
I start?*, and a parked card whose condition now holds is a candidate
for exactly that.

**THE KILL SET — seven mutants, seven reds**, each run against the
body it targets and the file restored byte-for-byte after each (the
restore proved by `diff -q` against a pristine copy). M3's first
spelling did not apply — its needle matched three sites — and it is
recorded here as UNMEASURED-then-remeasured rather than as a survivor:

| # | mutant | body | exit |
|---|---|---|---|
| M1 | the card form always holds | NAMING A CARD HOLDS ONCE | 1 |
| M2 | the date compares strictly after | NAMING A DATE HOLDS ON BOTH SIDES | 1 |
| M3 | a blind lane reads as no overlap | THE DEFAULT CONDITION IS THE FENCE | 1 |
| M4 | an unplaceable value falls back to the default | THE THREE FORMS ARE READ OFF THE FIELD | 1 |
| M5 | the prose test loses its left boundary | PARKED WITHOUT A CONDITION COUNTS | 1 |
| M6 | the counted line ignores the full dial | THE WAKE VIEW'S DEFAULT IS ONE COUNTED LINE | 1 |
| M7 | the wiring statement removed from brief.mjs | THE WOKEN SECTION REACHES THE RENDERED ANSWER | 1 |

**GATES, DERIVED FROM THIS DIFF.**

- METHOD EVAL GATE — FIRES (`method/tasks/TASK-FORMAT.md`).
  `node tools/method-evals/run.mjs` exit 0, 10 model-free evals;
  `--selftest` exit 0, 10 evals, POSITIVE CONTROL. **The method stamp
  does not move**, so no version bump is performed. The `--bump`
  block, for the integrator's record: *Method evals: model-free exit 0,
  model-in-loop exit 3. Corpus: 10 model-free, 4 model-in-loop. Runner:
  NONE. THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on
  it.*
- GRAPH REGEN — fires at the merge (`.mjs`/`.ts` outside docs/).
  `cargo run -p supertaskr-index -- index --check --root ../..` says
  **graph.json is CURRENT** at this tip — 1198602 bytes, 201 files,
  2560 symbols, 2453 edges — so this diff moves no graph.
- DOCS GATE — FIRES. The three new suggestion cards under
  `docs/tasks/` are code inputs; `docs-gate.mjs` names all three suites
  (`npm test` from app/ and tools/e2e/, `npx vitest run` from
  lib/parser/), which is why the battery below is the full four legs
  rather than a scoped e2e run.
- BOOT GATE — NOT OWED: the diff touches no `app/src/**`, no
  `app/src-tauri/**` and neither manifest.
- **`cargo test` IS OWED AND NO TRIGGER NAMES IT** (the METHOD EVAL
  GATE bullet's own residual): `method/tasks/TASK-FORMAT.md` is in
  `KIT_FILES` in `app/src-tauri/src/agent/kit.rs` via `include_str!`,
  and two cargo bodies read `method/` off disk and assert against it.
  The rust leg is run below for that reason.

**OWED AT THE MERGE, AND NOT DONE HERE.** `npm run capabilities:check`
is **STALE** — committed 70120 bytes against a fresh generation of
70947 — because this lane adds eight spec names to the behaviour
census. `docs/CAPABILITIES.md` is outside this fence, and the project's
own rule puts the regeneration in the MERGE commit. **The integrator
owes `npm run capabilities` from tools/e2e/ in the merge commit**; a
merge without it lands a census that is false about its own suite.

**SUGGESTED CARDS FILED.** T-285-s1 (the default condition is inert for
96 of 129 parked cards), T-285-s2 (nothing REFUSES an unplaceable
`wake:` value), T-285-s3 (the condition reaches the terminal and not
the mirror — the parser hands `wake:` back untyped).

**THE FIX PASS, RECORDED RATHER THAN HIDDEN.** The first graded battery
read parser RED at 389 bodies — `lib/parser/test/fence.test.ts`'s live-
board census, and the offending card was T-285-s1, which this lane had
filed with `touches: [docs/tasks]`. `lib/parser/src/fence.ts` refuses
that path by name (`UNFENCEABLE_PATHS`) because it is where every
dispatch stamp lands. The card is now `touches: []` and says why in its
own body: naming ninety-six individual files is what lane-protocol rule
5 would ask for, and the honest answer is that a triage pass is an
ARCHITECT duty rather than a dispatchable lane. Nothing in this lane's
own three fenced files moved for it. The battery below is the reading
after that correction; the first reading was parser RED 389, app GREEN
1171, rust GREEN 654, e2e GREEN 811, all at `9f9df64`.


## Verdicts
