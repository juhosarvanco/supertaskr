---
id: T-285
title: A parked card's wake condition is machine-read — a `wake:` field naming a card, a date or the fence, with the fence as the default — and the dispatch view lists WOKEN cards beside STARTABLE and flags parked cards that carry no condition at all
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: "@human (2026-09-09): decision C of the backlog review — \"Are the parked cards still in the priority queue in some way or are they just forgotten?\" — they are forgotten; ruled yes to a machine-read wake condition"
blocked_by: [T-282]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/tasks/TASK-FORMAT.md, tools/e2e/scripts/brief.mjs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tip judged `ce461156f9a3f9e61c4b1af383a23e107987a8f8`; base
`488e49511b5f43448fce754db2d733f757b60fd1`; bench
`/Users/ujju/Projects/nputer-V-T-285`, detached. Sealed inputs, verified
by `shasum -a 256` before anything else was opened:

- attack set `sha256:787d10019b500a945b3b75a62cc944c63a3cd13d37248d911bcae555094ed6d2`
- ground `sha256:78f00b08bdea259d1d33c306d54f4d9a5de3354205683bd479ef9696083eb3ba`
- ground addendum `sha256:d551337a7cfe4767ae7efb5e34093519f6a4349ec368be47467f2b55d8b54c76`

**THE FRAME I ACTUALLY HAD, stated because verifier.md requires it.**
Two spawns: phase 1 wrote the attack set tool-less at the base and it is
hashed above. This brief was hand-written by the seat and **carried no
context pack**, so `docs/CONVENTIONS.md` was read by the bullet rather
than through a pack — a PACK GAP, named here, not a defect in the work.
The brief's duties section named no executor-derived figure, so phase 1
stood above the line. **One leak, mine:** reading the card diff to check
the `touches:` widening (H2) put the first ~30 lines of the executor's
Implementation notes in front of me before my measurements were taken.
Every finding below was nevertheless derived from the attack set and
re-measured on the bench; the executor's report and the rest of the notes
were opened only after the findings were written, and every claim in them
was re-derived rather than accepted.

**THE FENCE.** `git diff --name-only 488e495..ce46115` lands eight
files and nothing else: the four fenced ones
(`tools/e2e/scripts/dispatch-brief.mjs`, `tools/e2e/tests/brief.spec.ts`,
`method/tasks/TASK-FORMAT.md`, and `tools/e2e/scripts/brief.mjs` since
the widening), this card, and three NEW suggestion cards. No
`dispatch-order.mjs`, no `health-bands.*`, no `gate-run.*`, no
`agent_runner.rs`, and nothing belonging to T-280, T-281-s8 or T-283.
The widening is legitimate and both halves are present: the lane's
`touches:` line is **byte-identical** to the seat's grant at `97d5276`
on main. One observation, not a finding: the widening reached the lane's
copy **inside the executor's own code-and-notes commit `ad2ae93`**
rather than as a separate seat commit, so the lane's history alone
cannot show whose hand typed it. The seat states it wrote it; nothing in
the tree contradicts that.

**THE CRITERIA, RE-MEASURED.**

1. *The three forms and the default.* All three read off the field and
   the default EXECUTES — this was the reject I was hunting (a default
   documented and never applied) and it is absent: all 16 currently
   woken cards are on the default form with no `wake:` field. Card form
   holds on `done` and on nothing else (driven over all eight status
   words). Date form compares `today >= raw` as two `YYYY-MM-DD`
   strings, so it is timezone-free by construction, and the clock is
   **injected** (`ctx.at`, the same value the `read <ISO>` stamp
   prints) — mutant M13 below proves it. **The sub-card truncation I
   expected did not happen**: `wake: T-225-s11` with `T-225` done and
   `T-225-s11` planned rules `waiting`, and the row is absent.
2. *The render.* `brief.mjs --dispatch --full` carries THE WOKEN PARKED
   CARDS with WOKEN, STILL PARKED, THE DEFAULT CONDITION NAMES NO
   GROUND, COULD NOT BE RULED and PARKED WITHOUT A CONDITION. On the
   real board at this tip: **16 of 129 woken, 17 waiting, 96 declaring
   no fence, 0 unruleable, 90 flagged**. Every rendered value carries
   its stamp — `unstampedLines` is empty on both arms — and the stamp is
   a function of the form: card ⇒ tree ref, clock and lane list ⇒ live.
   The section is BESIDE the base five, not folded into STARTABLE.
3. *The flag.* Counted and named, with the ids on one line. See the
   correction.
4. *No card rewritten.* `git status --porcelain` at the bench is empty
   before and after a full render, and twice more after a second. The
   sha256 of every card blob under `docs/tasks/` **except** this card
   and the three new ones is `6f8a7b15ca541337a0ec7e23239202e2d8ec55acc76c0a3215af5ed697c0d356`
   at BOTH refs; the tree goes 707 → 710 files; `git diff 488e495..ce46115 -- docs/tasks/`
   contains not one `+wake:` line. TASK-FORMAT states the encoding once,
   with the prose test written down beside it.
5. *The bodies.* Eight new, 66 → 74 top-level `test(` bodies, **none
   removed** — the base set is a subset of the tip's, checked by name.
   Each new body carries its own negative board inside it.

**THE DRILL — seven mutants, every landing read from `git diff`, every
one dead at the site.** Control first: unmutated, `brief.spec.ts` alone
is 81 passed, exit 0.

| # | mutant | body that died | kills |
|---|---|---|---|
| M10 | `status === WOKEN_BY_STATUS` → `!==` | NAMING A CARD HOLDS ONCE + the counted-line body | 2 |
| M11 | `fenceOverlaps(me, lane)` → `fenceOverlaps(me, me)` | THE DEFAULT CONDITION IS THE FENCE | 1 |
| M12 | date `>=` → `>` | NAMING A DATE HOLDS ON BOTH SIDES ("the day names its own start") | 1 |
| M13 | `at.slice(0,10)` → `"1970-01-01"` | NAMING A DATE ("a clock reading is stamped live") | 1 |
| M14 | unplaceable value falls back to the default | THE THREE FORMS ARE READ OFF THE FIELD | 1 |
| M15 | prose rule loses its `\b` | PARKED WITHOUT A CONDITION COUNTS | 1 |
| M16 | `no-ground` folded into `waiting` | THE DEFAULT CONDITION IS THE FENCE | 1 |

No mutant cascaded into an unrelated section's body and none crashed in
setup. M10's two kills are not contained in each other: one grades the
ruling, the other the count.

**THE SECURITY SWEEP.** The new section contains no `readFileSync`, no
`spawnSync`/`execSync`, no `process.env`, no `eval`/`new Function` and
no `Date.now` — a `wake:` value never becomes a path, a ref or an argv.
Card lookup is a `Map.get`, so `wake: __proto__` and `wake: constructor`
are ordinary unplaceable values. No ReDoS: the prose rule is 0.16 ms on
200 000 characters, `readWake` 0.24 ms on a 50 000-digit id, `unquote`
0.41 ms on a 200 000-character unterminated quote. A `wake:` value
carrying a newline WOULD split a row and forge a plausible HELD line —
but `frontmatterFields`, the one reader in this path, cannot produce a
newline-bearing scalar (block scalars come back as the literal `|`, a
plain multi-line scalar keeps only its first line), so the injection is
unreachable at the render site. Filed forward as `T-285-s5`.

**THE SUITES, ONCE, AT THIS TIP** through `gate-run.mjs` from the bench
root, port 25285:

| leg | exit | bodies | verdict |
|---|---|---|---|
| parser | 0 | 389 | GREEN |
| app | 0 | 1171 | GREEN |
| rust | 101 (gate-run 1) | 654 over 18 targets | **RED** |
| e2e | 0 | 811 | GREEN |

**THE RUST RED IS NOT THIS DIFF, and it is attributed by name.**
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
panicked at `app/src-tauri/tests/agent_runner.rs:1255` — *"returned
after 26 ms of a 900 ms grace"*. Re-run alone at this same tip it
**passes** (`1 passed; 95 filtered out`). This diff contains **no Rust
file at all**, and that test's file is the fence of the live lane
`T-281-s8`, whose own title is *the Rust suite reds under the full run
and PASSES alone*. **This is a second instance of T-281-s8's class, in
T-281-s8's own file** — recorded here rather than on that card, which is
live and outside this fence, so the seat can route it.
The notes' claim of `rust GREEN 654` at `9f9df64` is therefore a true
reading of an intermittent, not a false one; I could not reproduce it at
`ce46115` and say so rather than repeat it.

Method eval gate: `node tools/method-evals/run.mjs` exit 0, 10 model-free
evals; `--selftest` exit 0, 10 evals, POSITIVE CONTROL. The method stamp
is `v0.1.14` at both refs — unmoved, as it should be; the bump is the
integrator's and the card carries the `--bump` block.

**ASSIGNED CORRECTION 1 of 1 — the prose test cannot see the board's own
`UN-PARK WHEN:` spelling.** `PROSE_WAKE_PATTERN` is
`/\b(?:unpark|wake)/i`, so `UN-PARK` — hyphenated — does not match, and
`**UN-PARK WHEN:** <event>` is the amnesty triage's own template. **Nine
of the ninety cards this view flags as stating no condition at all carry
that line, in bold**: `T-031-s2`, `T-033-s1`, `T-033-s9`, `T-110-s2`,
`T-123-s2`, `T-124-s2`, `T-127-s3`, `T-135-s1`, `T-135-s2`. That is
precisely the failure this section's own comment says the predicate must
not have — *"a card whose author wrote a condition reported as having
written none"* — and it lands on the flag that is criterion 3's whole
product. **The remedy is two edits, both inside the fence**:
`/\b(?:un-?park|wake)/i` in `dispatch-brief.mjs`, and one clause in
TASK-FORMAT's prose-test sentence so the author and the reader still
read one sentence. **WIDENED NO FURTHER, AND THAT IS MEASURED RATHER
THAN CHOSEN**: `resurface` matches 69 of the same 90, because
TASK-FORMAT's own *"resurfacing condition"* is quoted in the parking
boilerplate — widening to it would empty the flag instead of sharpening
it. `until` is likewise refused: it fires on ordinary prose
(*"other cards, until the delay was noticed by hand"*).
Run RED against the implementation as landed — one body failed, the
other 81 passed, at *"the board's own hyphenated spelling is a
condition"* — and GREEN with both edits applied: 82 passed, exit 0, and
the live flag falls from **90 to 81**. The body is committed on this
bench after this verdict.

```mutant
correction: the prose test sees the board's own UN-PARK WHEN spelling
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE PROSE TEST SEES THE BOARD'S OWN `UN-PARK WHEN:` SPELLING — nine live parked cards write the condition that way and the flag calls them conditionless
message: the board's own hyphenated spelling is a condition
--- old
export const PROSE_WAKE_PATTERN = /\b(?:un-?park|wake)/i;
--- new
export const PROSE_WAKE_PATTERN = /\b(?:unpark|wake)/i;
```

**WHAT I FOUND AND DID NOT REJECT ON, pre-committed in the attack set
before any of it was visible.**

- **The flood did not happen, and the reason is a finding the executor
  already filed.** 16 of 129, not forty — because 96 parked cards
  declare no fence at all, so the default condition names no ground for
  three quarters of the shelf. `T-285-s1` owns that and is correct.
- **The fence form is a LEVEL, not an EDGE.** It reads the LIVE lane
  list (`git worktree list`), so a card wakes while a lane is live and
  **un-wakes when that worktree is torn down**. Coherent — the body arms
  the same lane list the render spends, and the card's own text aims the
  condition at *"whoever cuts that lane"* — but the 16 rows standing now
  vanish when T-280, T-281-s8 and T-285 merge, whether or not anybody
  read them. Filed as `T-285-s4`.
- **A full ISO instant is not an ISO date here.** `wake: 2026-09-09T00:00:00Z`
  is reported unplaceable. It fails LOUD, into COULD NOT BE RULED, so no
  card is lost — recorded as a corroboration on `T-285-s2`, which
  already owns the class.
- Undefined inputs behave: `wake: T-999` ⇒ `unknown` naming the miss;
  `wake:` naming itself ⇒ `waiting`, no recursion; a list ⇒ unplaceable;
  `t-282`, ` T-282 `, `FENCE` normalise; `T-282 # comment` is reported
  rather than mis-resolved. Non-parked cards carrying `wake:` never
  reach the view. The empty board renders zeros without a crash.
- The default view gains the counted line and NOT the page. That is the
  T-225 dial applied, it is documented at the call site, and the wiring
  body drives both arms.
- The `--full` answer grows 126 808 → 138 001 bytes; the section is
  9 806 of them. Both refs are already over one pipe buffer and the
  margin block discloses it, so this changes no verdict about the view.

#### 2026-09-09, appended to the verdict above — the WOKEN figure RE-DERIVED at the verifier's own tip, and what re-deriving it proved

**A record, appended, not a rewrite.** verifier.md's figure case says a
count in a verdict is a claim about a tree and must be re-derived at the
tip the verdict's own commits create. Re-derived at `6eac9e5`:
**13 of 129**, against the **16 of 129** the verdict above measured at
`ce46115` at 13:55Z. **My commits added no parked card and changed no
code that counts one.** The lane list moved: `T-281-s8`'s worktree was
removed between the two readings, and the three cards it alone had
woken — **`T-167-s3`, `T-167-s4`, `T-180`** — left the WOKEN section
without anybody acting on them. They are back in STILL PARKED.

**That is `T-285-s4` happening, inside one verification pass, to three
real cards.** The suggestion was filed from the CODE — the fence form
reads the live worktree list, so a wake is a level and not an edge — and
it turned into a measured instance forty minutes later without being
looked for. It is recorded here because the verdict above cites it as a
non-failure, and a non-failure with a witness is a different weight of
claim than one without.

**THE FIGURE THE INTEGRATOR SHOULD CARRY** is neither 16 nor 13: it is
*"however many the lane list says at the moment of the read"*, and both
readings above are honest at their own instant. The WOKEN count is a
LIVE fact and the view stamps it as one — `<- read <ISO> on <host>` —
which is the module's own contract working exactly as written.

**THE SUITES AT THE VERIFIER'S OWN TIP `6eac9e5`**, owed because steps 5
and 6 were writes (verifier.md 7) and because `docs-gate.mjs` FIRES on
the four `docs/` paths and names three suites:

| leg | exit | bodies | verdict |
|---|---|---|---|
| parser | 0 | 389 | GREEN |
| app | 0 | 1171 | GREEN |
| e2e | 1 | 812 (811 passed, 1 failed) | **RED — the assigned correction body, and nothing else** |

The single e2e failure is
`THE PROSE TEST SEES THE BOARD'S OWN `UN-PARK WHEN:` SPELLING …` at
`tests/brief.spec.ts`, failing at *"the board's own hyphenated spelling
is a condition"*. **That is the assigned correction, committed RED on
purpose** (verifier.md 5b): the two in-fence edits named in the mutant
block turn it green, and the verifier has run them green — 82 passed,
exit 0 — before reverting them so the lane makes its own fix. Every
other body in the suite passes. `docs-gate.mjs` reports *every live task
card's frontmatter parses, with a legal status*, which covers the two
cards filed above. The method eval gate is exit 0 at this tip, 10
model-free evals.
