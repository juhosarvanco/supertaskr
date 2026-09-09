---
id: T-281
title: The verifier COMMITS the bodies its corrections assign, on the bench, with a text-anchored MUTANT BLOCK the merge verb's drill step reads — the integrator re-drills and never rewrites, and a correction lifted from a transcript is a thing of the past
feature: F-06
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: "@human (2026-09-09): decision 1 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md) — \"1 yes\""
blocked_by: []
touches: [method/roles/verifier.md, method/roles/integrator.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Nine merges on 2026-09-09 each carried two to five assigned
corrections. In every case the verifier had already WRITTEN the body
that pins the correction and run it both ways on its bench — and then
described it in the verdict, sometimes verbatim, sometimes not. The
integrator (the architect seat) recovered the bodies from the
verifier's transcript file (T-167-s13, T-244), or rewrote them from the
description (T-241, T-203-s1), or lifted them from a verdict that
carried them (T-238-s1, T-254), and drilled each with a mutant it had
to construct itself. That was 20–30 minutes of the seat's context per
merge, the single largest consumer of the architect's attention after
the merges themselves, and the recovery from a transcript is fragile
by construction (a JSONL parse of tool inputs, keyed on guessed
strings).

The verifier already commits on the bench: its verdict and the cards
it files. The bodies are one more commit there. What is missing is the
rule and the reader.

## Acceptance criteria

- WHEN a phase-2 verdict assigns a correction THE verifier SHALL commit
  the body that pins it on the bench, in the spec file the property
  lives in, in a commit named for the correction — AFTER the verdict
  commit, so the verdict's figures still name the tip they were
  measured at — and SHALL have run the body RED against an
  implementation lacking the property and GREEN against one carrying
  it, both recorded in the verdict.
- WHEN a verdict assigns a correction THE verdict SHALL carry a MUTANT
  BLOCK for it in one fixed layout: the file, the exact old text and
  the exact new text (each matching the file once, never a line
  number — a line number is a coordinate in a mutable object), the
  body's name, and the failure message expected; a block naming a line
  number SHALL be refused by the reader.
- WHEN the integrator merges THE merge verb SHALL read every block off
  the card's newest verdict, plant each mutant on the MERGED tree, run
  the owning spec, require the named body RED alone with the message,
  restore the site and prove it by sha256 — and SHALL stop before the
  commit on a survivor, a body that reds more than itself, or a block
  whose anchors do not match once.
- THE integrator SHALL NOT rewrite a body the verifier committed; where
  a correction needs a code change beside the body (the verdict names
  it), the integrator performs the code change and the committed body
  is what proves it.
- WHEN verifier.md and integrator.md are read THE contracts SHALL say
  the above once each; the method eval gate SHALL run and the bump
  SHALL carry its eval block.
- WHEN the checkpoint is recorded THE record SHALL stamp the merge
  minutes per correction for one sitting before and one after, with
  the clock.

## Implementation notes

Built in the lane `/Users/ujju/Projects/nputer-T-281` on
`task/T-281-the-verifier-commits-its-bodies`, cut from
`bceb22faea205f1759d91c0eb16f3c13c6927497` (the dispatch stamp).

### WHAT THE READING COST, per file, before the first edit

The checkpoint's "after" reading for the context pack. Read WHOLE:
the brief 51,504 · this card 3,631 · docs/STATE.md 8,322 ·
docs/ROADMAP.md 11,878 · docs/ARCHITECTURE.md 9,300 ·
docs/NORTH_STAR.md 5,059 · method/roles/verifier.md 13,176 ·
method/roles/integrator.md 16,390 · tools/e2e/scripts/merge.mjs 27,964.
That is 147,224 bytes read whole.

Read in PART, with what was taken: tools/e2e/tests/cli.spec.ts (53,903)
— its head, every test name through one grep, and the merge and undo
bodies, about 16,000 bytes · docs/CAPABILITIES.md (65,947) — the
header, the section index and the `## cli` section, about 4,500 ·
method/tasks/TASK-FORMAT.md (43,184) — the frontmatter block and the
verdict-format lines, about 2,000 · four method-eval headers (mf-02,
mf-04, mf-05, mf-08), about 8,000. Roughly 30,500 bytes of 163,034.

**NOT read: docs/CONVENTIONS.md end to end — 129,450 bytes.** The pack
carried 17 bullets, of which 9 were transcribed into the brief and 8
cited by address; four of those addresses were opened by hand while
working (GRAPH REGEN, METHOD EVAL GATE, and the two the drills needed),
about 3,000 bytes. **PACK GAPS: none.** No gate refused anything this
lane did, and nothing this lane needed from that document was missing
from the pack or from an address it named. method/lane-protocol.md
(49,274) was likewise not opened: the brief's rows 4 and 11 transcribed
rules two, three and six, and nothing else was needed.

So the seat read about 178,000 bytes to build a card whose fence is four
files, against roughly 356,000 had CONVENTIONS and the lane protocol
been read whole.

### THE SHAPE, and why each piece is where it is

**The block is TEXT-ANCHORED because the tree moves between the verdict
and the merge.** A line number is a coordinate in a mutable object;
`readMutantBlocks` refuses one in every shape it takes — a `line:` key,
a `path:123` or `path:123:4` tail on `file:`/`spec:`, and `line 40` or
`lines 40-52` written into any field. The refusal names what it refused.

**The layout is FIXED, including the ORDER of the five keys.** A reader
that took them in any order would accept five layouts, and the only
review a block gets before a merge trusts it is somebody's eye.

**Both fences must sit at column zero.** An indented fence is a markdown
code block inside something else — a list item, or `verifier.md`'s own
printed example, which a verdict may quote while explaining itself. A
reader that took those would refuse a whole verdict for a quotation.
The mistake is still loud rather than silent: a verdict that assigns
corrections and yields no block is REFUSED by `drillSteps`.

**One bad block refuses the WHOLE read.** The alternative — drill what
parsed, mention the rest — is the shape that reports a clean drill over
a correction nobody checked.

**`plantMutant` swaps by FUNCTION, never by string.** `$&`, `$1` and
`$'` are substitution syntax in a string replacement, so a `new` text
carrying one would be planted as something else entirely. Pinned.

**`failingBodies` reads WHICH bodies redded, off the run's own report.**
"RED ALONE" is a claim about a SET; a summary line saying `1 failed`
cannot answer it. Two dialects, both parsed: Playwright's numbered
`file:L:C` line — and the numbered part is load-bearing, because the
progress line playwright prints as it STARTS each body has the same
shape — and Vitest's `FAIL <file> > <name>`, read distinctly because
vitest prints a failure twice, once in the run and once under its own
failed-tests summary.

**The restore happens BEFORE the grade**, in a `finally`, so a grade
that throws still leaves the site as it was; then sha256 proves it, and
a mismatch is its own stop naming both hashes.

**The drill is the LAST step before the STOP.** Every setup step
precedes it because it runs a spec; nothing follows it because it
decides whether the commit may happen.

**A VERDICT WRITTEN BEFORE THIS RULE ASSIGNS CORRECTIONS AND CARRIES NO
BLOCK, and every verdict on this board is that shape.** Run against the
four real verdicts on disk at this ref, the reader finds the newest entry
in every one and reads its heading shape correctly — including
`### VERDICT 2026-09-09 ...` — and then refuses three of them, because
they assign corrections and carry none. A refusal with no way through
would make every in-flight card unmergeable, which is a behavioural
regression this merge would have introduced. The way through is
`undo.mjs`'s own shape and not a blanket: `--blocks-absent` takes the
run's OWN verdict sha, so it cannot be typed once and reused, it lands in
the run's output, and it turns the refusal into NEWS on stderr rather
than into silence. A block that IS present is drilled regardless, and a
prefix shorter than seven characters, a different sha, or an empty string
are each refused as "not a blanket override".

**And the drill reads the block's spec off the MERGED tree before it
plants anything.** Criterion 1 puts the body commits AFTER the verdict
commit, so what has to be merged is the bench TIP. A merge given the
verdict sha leaves the bodies behind, and without this check the drill
would plant, run a whole spec, and report "the named body did not red" —
which reads like a defect in the correction rather than a merge that
left the body behind. This was found by building it, not by reasoning:
the flag is still spelled `--verdict` and room 17's sentence still says
the verdict commit. Filed as T-281-s3.

### THE DRILLS — fifteen mutants, graded on their KILL SETS

Driven by `drill-T-281.sh` in the scratch directory; log
`drill-T-281-log.txt`. Each mutant was planted at a site matching
exactly once, the WHOLE of `tests/cli.spec.ts` was run, and the run was
required to kill the set the mutant DECLARES — never a fixed count of
one, which verifier.md 2b is explicit is a property of a well-chosen
mutant and not an invariant. Every restore compared sha256 against the
pristine copy: all PROVED, and the two files mutated (`merge.mjs`,
`verifier.md`) hash identical to their pre-drill values at the end of the
run. FAILED=0.

| mutant | what it relaxes | body it kills |
|---|---|---|
| M1 | the newest verdict becomes the oldest | the NEWEST-verdict read |
| M2 | a `path:123` tail stops being a line number | the LINE NUMBER refusal |
| M3 | the five keys are accepted in any order | the FIXED layout |
| M4 | an anchor matching twice takes the first | match-exactly-once |
| M5 | failing names are no longer distinct | both reporter dialects |
| M5b | the numbered-line requirement is dropped | both reporter dialects |
| M6 | a mutant killing two bodies is allowed | the five grades |
| M7 | the site is never restored | the whole plant/run/restore loop |
| M7b | the body-present check is truncated to one character | the same |
| M8 | a forgotten block stops being noticed | the forgotten-block refusal AND the acknowledgement (both, by construction) |
| M8b | the correction count stops being printed beside the block count | the forgotten-block refusal |
| M9 | the drill is planned first instead of last | the drill's position |
| M11 | colour is no longer stripped from a run's report | both reporter dialects |
| M12 | the acknowledgement stops naming the verdict and becomes a blanket | the acknowledgement |
| M10 | the layout `verifier.md` publishes drifts one key | published-equals-parsed |

M10 is a DATA mutant, planted in the method text rather than in code,
because that is where the property lives (verifier.md 2b).

**Kill-set containment: no body's kill set contains another's.** M8 kills
two bodies because it relaxes the branch both decide; M8b and M12 are
what keep either from being the other's restatement — kill(forgotten) is
{M8, M8b}, kill(acknowledgement) is {M8, M12}, and neither contains the
other. Every other mutant kills exactly one body. **THE DRILL PASSES
FOUND FOUR REAL WEAKNESSES AND ALL FOUR ARE FIXED IN THE DIFF, not
written round.** (1) The
fixed-layout body proved "one bad block refuses the whole read" using a
block whose fault was a LINE NUMBER, so M2 killed both bodies and the
line-number body's kill set sat inside the layout body's; the bad half
is now a layout fault. (2) The reporter body pinned neither the
numbered-line requirement nor the distinct read — both mutants SURVIVED
it — because its fixtures happened to make both properties invisible;
the playwright fixture now carries a passing body's progress line and
the vitest fixture carries the duplicate vitest really prints. (3) The
ANSI strip was UNPINNED code — no fixture carried an escape code, so
removing the strip entirely survived every body; the reporter body now
carries a coloured failure line, because a harness with `FORCE_COLOR`
set colourises even through a pipe and the codes would land inside the
name the whole "red alone" comparison comes down to. (4) The
acknowledgement's own branch, added late, had no drill until M12.

### THE THREE REFUSALS, SHOWN — with the positive control shown first

`refusals-T-281.mjs` drives the REAL `runMutantDrill` against THIS
checkout with the REAL playwright runner — nothing stubbed — and
`mergeverb-T-281.sh` drives the whole `merge.mjs` verb end to end
against scratch git fixtures. Logs `refusals-T-281-log.txt` and
`mergeverb-T-281-log.txt`.

The control runs FIRST, because a drill step that refused everything
would be indistinguishable from one that works: a well-formed block
whose body reds alone with its message returns 0, and the site is
restored and proved.

  1. **A SURVIVOR.** A mutant planted in a comment leaves cli.spec.ts
     green; the drill returns 1 with *"THE MUTANT SURVIVED"* and the
     site restored.
  2. **A STALE ANCHOR.** An `old` text the tree no longer carries
     returns 1 with *"matches ... 0 time(s)"*, and the spec is never
     run at all.
  3. **A BLOCK NAMING A LINE NUMBER.** `drillSteps` plans exactly one
     step, `drill:refused`, naming the coordinate.

Through the verb itself, on scratch fixtures, each case leaves
`MERGE_HEAD` present and the merge staged: line number exit 1, stale
anchor exit 1, a verdict assigning corrections with no block exit 1,
and — the control — a verdict assigning none reaches the STOP at exit 0
saying *"assigns no correction, so nothing is re-drilled"*.

### CRITERION BY CRITERION

1. **MET in the method text, which is where it lives.**
   `verifier.md` step 5b requires the commit, the spec file, the
   commit named for the correction, the position after the verdict
   commit and the reason for it, and both readings recorded. No program
   can enforce a commit the verifier has not made yet; what the diff
   adds is the reader that makes its absence LOUD — the merge refuses a
   verdict assigning corrections with no block, and refuses a block
   whose named body is not on the merged tree.
2. **MET.** The layout, the anchors matching once, and the line-number
   refusal, with the reader pinned by four bodies and five mutants.
3. **MET.** `drillSteps` + `runMutantDrill` in the tail, last before
   the STOP; five refusals implemented (survivor, reds-more-than-itself,
   the wrong body, a red without the message, a run that broke) plus the
   anchor and body-present refusals; restore proved by sha256; the merge
   stays staged on every one. **ONE STOP CONDITION HERE IS BEYOND THE
   CRITERION AND IS SAID SO**: a verdict that assigns corrections and
   carries NO block. It is what makes criterion 2 enforceable rather than
   aspirational, and it is what forced the `--blocks-absent`
   acknowledgement, because without it this merge would have made every
   card whose verdict predates the rule unmergeable.
4. **MET in the contract** — `integrator.md` step 2b, stated once, with
   the code-change-beside-the-body case and the reason (the verifier's
   RED reading cannot be retaken, because the implementation it was
   taken against no longer exists).
5. **MET.** Each file states its half once and neither states the
   other's; the layout `verifier.md` publishes is compared key for key
   against `MUTANT_KEYS`; each file names the other's lettered step so
   the method-eval corpus resolves it. Method evals `10 model-free`
   exit 0 and `--selftest` `10 model-free, POSITIVE CONTROL` exit 0.
6. **NOT this seat's, and NOT done.** The checkpoint stamps the merge
   minutes per correction before and after. What this lane owed was to
   make the reading possible, and T-281-s2 asks for the machine-time
   half of the same measurement.

### WHAT IS OWED AT THE MERGE AND IS OUTSIDE THIS FENCE

- **THE CENSUS.** Ten spec names were added to `tools/e2e/tests/cli.spec.ts`,
  so `docs/CAPABILITIES.md` is stale and owes `npm run capabilities` from
  tools/e2e/ IN THE MERGE COMMIT. `merge.mjs` plans it (`movesSpecNames`),
  and the two `git add` steps stage it.
- **THE METHOD VERSION BUMP.** `method/**` moved, so the stamp goes past
  0.1.12 — three files outside this fence (docs/CONVENTIONS.md's
  first-gotcha stamp, its version paragraph, and
  method/interview/plan-interview.md's own line). The bump carries this
  block, taken at this lane's tip with `node tools/method-evals/run.mjs --bump`:

      Method evals: model-free exit 0, model-in-loop exit 3.
      Corpus: 10 model-free, 4 model-in-loop.
      Runner: NONE
      THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.
      Say that in the commit rather than omitting the line: a bump whose
      eval result is absent and one whose eval was skipped read the same.
      Pass rates and token spend are in the run above, at this ref. Do not
      transcribe them from an earlier run — that is the corpus's own RC-04.

- **GRAPH REGEN** fires on the trigger (`.ts`/`.mjs` outside docs/) and is
  a NO-OP by construction: `tools/` is `.supertaskrignore`d out of the
  walk. Ask the gate rather than trusting that sentence.
- **BOOT GATE: NOT OWED.** No path under `app/src-tauri/**`, `app/src/**`
  or either manifest is in this diff.
- **THE RUST LEG IS NOT OWED.** `app/src-tauri/src/agent/kit.rs` pins
  `roles/planner.md` and no other role file, checked at this ref.
- **THE FENCE TOUCHES NO PARSER, APP OR RUST SOURCE.** The parser and app
  suites are owed only because this lane FILES CARDS: the docs gate reads
  `docs/tasks/` as a code input for `lib/parser`, `app` and `tools/e2e`.
  They were run and are green.

### THE SUITES

Run ONCE, at the tip that carries the code, these notes and the four
suggested cards, per T-279's order — code, notes and cards, the suites,
the stamp. Their counts, exits and refs are in the executor's report; the
`verifying` stamp is a separate commit that moves only the status line
and re-runs nothing.

### SUGGESTIONS FILED

- **T-281-s1** — the drill's vitest dialect is pinned by a fixture
  somebody typed; no real vitest failure has ever produced it.
- **T-281-s2** — the drill runs one WHOLE spec per correction and the
  cost at a real merge has never been measured.
- **T-281-s3** — `--verdict` now has to be handed the bench tip; the
  flag's name, the step's title and room 17's sentence all still say the
  verdict commit.
- **T-281-s4** — whether a verdict assigns corrections at all is decided
  by a text predicate over prose a model wrote.

### ONE RED THIS LANE CAUSED AND FIXED

The first full e2e leg at `e4dab01` came back **RED: 1 failed, 773
passed, 774 bodies** — `token-scan.spec.ts` *"the gate distinguishes
clean, found-something and could-not-run"*, and the cause was this
lane's: a LITERAL U+001B at byte 17891 of `tools/e2e/scripts/merge.mjs`,
inside the regex that strips colour from a run's report. The escape is
now SPELLED (`\u001b`) rather than typed; behaviour is byte-identical and
`lint:tokens` reads *"clean (TOKEN 182 files ...; CONTROL 1377 tracked
text files)"*. **Class**: a literal control character written into
tracked text by a hand that meant an escape sequence. **Sweep**: the
token lint IS the sweep — it walks all 1,377 tracked text files, and it
is clean at this tip.

### CHECKED, AND NOT A FINDING

`brief.mjs --role verifier` and `--role integrator` exit 3 with *"found 0
tables headed # / The brief carries"*. That is TRUE AT THE BASE TOO:
`method/roles/executor.md` is the only role file carrying the contract
table, at `bceb22f` and at this tip alike. Not caused by this lane.

### WHERE THE BRIEF WAS WRONG, AND WHERE IT WAS RIGHT

The brief's base row named `9ba3b7b9a7237aa5a101dbe3c878421c710531ab` as
the base (the newest checkpoint) while the lane was actually cut from
`bceb22faea205f1759d91c0eb16f3c13c6927497`, the dispatch stamp — the
brief says as much in its own integration-tip row, and the dispatch
instructions name the stamp. Not a fault, but the two rows disagree and
the reader has to know which is the lane's.

The brief named the suites this lane owed as cli.spec.ts, the method eval
gate and the e2e leg. **That set is short by two**: filing suggested
cards puts paths under `docs/tasks/` in the diff, and the docs gate then
names `npm test from app/` and `npx vitest run from lib/parser/` as well.
Derived from the gate at this tip, not remembered — which is the rule the
gates row states.

## Verdicts

### VERDICT 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

**Tip judged** `d086c73` (the `verifying` stamp). **Base** `bceb22f`.
Bench `../nputer-V-T-281`, detached, port 25281.

**The two sealed inputs, verified by sha256 before anything else was opened:**

- `attack-set-T-281.md` — `sha256:6b73c752a6b7dc65388f9248ba4eef0e8941acb742d9d87b3dd6a9333161f6ff`
- `ground-T-281.md` — `sha256:b7238a06f296a2409a0e2be807a3b7f8a49c415546d6e2e97123cb6b90a921d9`

Both matched. My conduct was read from `verifier.md` **at the base**
(`git show bceb22f:method/roles/verifier.md`), not from the tip's copy,
which is the diff under judgement.

#### The frame I actually had, as step 0 requires

**This brief was hand-written by the seat and carried NO CONTEXT PACK.**
`verifier.md` step 0 calls that a dispatch fault and directs the seat to
read `docs/CONVENTIONS.md` whole and say so. I did **not** read it whole:
the brief explicitly instructed me to read it by named bullets only (the
DOCS GATE, THE BLESSED GATE-RUNNER, the METHOD EVAL GATE, the PORT and
SCRATCH rules). I followed the brief and I am recording the departure
rather than hiding it. I read `docs/STATE.md` and `docs/ARCHITECTURE.md`
as the standing set requires.

**PHASE 1 WAS BROKEN ABOVE THE LINE, AND I SAY SO RATHER THAN PRETENDING
OTHERWISE.** My brief's duties section named executor-derived figures
before I had opened anything — *"the report says 9d7cb43 with cli.spec 45,
parser 389, app 1171, e2e 775"*. `verifier.md` step 0 names exactly this:
a brief whose duties section carries suite figures has already broken
phase 1. The mitigation available to me was to **re-measure every one of
those figures myself at my own tip before opening the report**, which I
did, and to write my findings out to `findings-T-281.md` before the report
was opened. Phase 1's attack set was written tool-less at the base, and
its hash is cited above.

The ordering I kept: sealed inputs → base `verifier.md` → STATE and
ARCHITECTURE → the card at the base → the diff and every attack → findings
written → **only then** the executor's report and the implementation notes.

#### The battery, run ONCE at my own tip `d086c73`, through the blessed runner

| suite | exit | count | verdict |
|---|---|---|---|
| `gate-run.mjs parser` | 0 | **389 bodies** | GREEN, `ref=d086c73` |
| `gate-run.mjs app` | 0 | **1171 bodies** | GREEN, `ref=d086c73` |
| `gate-run.mjs rust` | **101** | **654 bodies** | **RED**, `ref=d086c73` — see below |
| `gate-run.mjs e2e` (port 25281) | 0 | **775 bodies** | GREEN, `ref=d086c73` |
| `cli.spec.ts` alone | 0 | **45 passed** | — |
| `tools/method-evals/run.mjs` | 0 | **10 model-free** | unchanged from the base's 10 |
| `run.mjs --selftest` | 0 | **10 model-free, POSITIVE CONTROL** | — |

Every figure the report claimed at `9d7cb43` re-derives at `d086c73`:
45 / 389 / 1171 / 775. Confirmed by re-measurement, not by reading.

**THE RUST RED IS NOT THIS DIFF, AND IT IS NOT NAMED IN STATE.** One body:
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs:3623`), 94 passed / 1 failed in its
target. Attributed: `git diff --name-only bceb22f..d086c73 -- app/ lib/
'*.rs' '*.toml'` is **empty** — the diff touches no Rust input at all — and
the test body reads no `method/` file. **Re-run once, alone: it PASSES.**
An intermittent, and `docs/STATE.md` names no such intermittent. Filed as
**T-281-s8**. The executor's "the Rust leg is not owed" is correct for the
diff; the red is the tree's, not the lane's.

#### The fence, the stamp, the records

- `git diff --name-only bceb22f..d086c73` = **9 paths, every one inside the
  fence**: the four fenced files, this card, and four new `docs/tasks/`
  cards. No `CONVENTIONS.md`, no `executor.md`, no `lane-protocol.md`, no
  `workflow-parity.spec.ts`, no `ci.yml`, no `gate-run.mjs`, no
  `dispatch-brief.mjs`, no `kit.rs`, no `plan-interview.md`.
- **The method stamp still reads 0.1.12** at all three sites inside the
  lane (`CONVENTIONS.md:501`, `plan-interview.md:26`, `kit.rs:37`). The
  bump is the integrator's, and the card carries its eval block. Correct.
- The stamp commit `d086c73` is **exactly one status line**.
- `docs/CAPABILITIES.md` sha256 is `6f4db752…`, **identical to the base** —
  not regenerated inside the lane. Correct; the regen is the merge's.
- No `.only`, `.skip` or `.fixme`. No literal U+001B in any fenced file.

#### What I attacked and what held

Thirteen of the sixteen mutants my set named were **killed**, each by one
body, on a whole `cli.spec.ts` run with the landing read from `git diff`
rather than from the mutator: the anchor count (`hits !== 1` → `hits === 0`),
all three line-number refusals separately (`LINE_KEYS`, the `path:42` tail,
the prose `line 40` form), the reds-more-than-itself grade, the survivor
grade, the literal splice turned into `new RegExp(old)`, newest-verdict
turned into first-verdict, the runner argv given a `-g` filter, the message
check, and the body-present pre-check.

Attacks that held, checked directly rather than read: the **positive
schema** refuses `lineNumber:`, `at:`, `note:`, `L:` and a `file:` with a
`:42` tail (it is a schema, not a blacklist); `old`/`new` are **byte-exact**
(an anchor differing only by indentation matches nothing); the replacement
is a **function** replacement, so `$&`, `$'` and `$1` are planted and never
expanded; the drill runs the **whole owning spec** with no `-g`, so "red
alone" is observable; two blocks are two steps, planted one at a time; the
drill is the **last step before the STOP** on every shape of merge, with
T-244's `capabilities`/`graph` order untouched; the drill performs **no git
write** and **no shell** (`spawnSync` with an argv array); a misspelled
`## Verdicts` heading **refuses** rather than reading as zero blocks; the
never-rewrite row carries **no hedge**; and the grammar is stated **once**,
in `verifier.md`, with a body comparing the published layout to the
reader's own `MUTANT_KEYS`. That last one closes the drift my set predicted.

**One departure from phase 1's pre-commitments, stated plainly.** The
attack set's §4 lists *"the merged tree left mutated after an aborting
drill (M12 surviving with no body)"* as REJECTED-level. M12 **does** survive
(below). But the parenthetical is a test, not the defect: the `finally`
**is present and correct** — I drove an aborting drill and the site was
restored — so "the merged tree left mutated" is **false of this diff**. Only
its fence is missing. Rejecting a correct implementation for an unfenced
guard would be rejecting a defect that does not exist, and this card's own
machinery exists precisely to turn that into an assigned body. Correction 1.

---

### CORRECTION 1 — the `finally` that restores the site after an ABORTING drill is unfenced

`runMutantDrill` wraps the run in `try { … } finally { writeFileSync(file,
pristine); }`, which is the right shape and the one that matters most on
this card: if a run **throws** — a runner not installed, a spawn that dies,
a Ctrl-C — the mutant otherwise stays on the MERGED tree and the
integrator's next `git add` commits it. **Measured: removing the
`try`/`finally` wrapper while leaving the happy-path restore in place
leaves all 45 bodies GREEN.** The executor's own M7 ("the site is never
restored") pins the *happy* path only; no body drives a throwing run.

**THE BODY THAT PINS IT** — committed on the bench in `tools/e2e/tests/cli.spec.ts`
after this verdict commit, in a commit named for this correction:

```ts
test("an ABORTING drill still restores the site — the merged tree is never left mutated", () => {
  // THE WORST FAILURE THIS STEP CAN HAVE. The drill writes a mutant into
  // a file on the MERGED tree. If the run throws — a runner that is not
  // installed, a spawn that dies, a Ctrl-C — and the restore is not in a
  // `finally`, the mutant STAYS, and the integrator's next `git add` puts
  // it in the merge commit. The mechanism built to protect the merge
  // becomes the thing that poisons it.
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-abort-"));
  try {
    const source = "export function f() {\n  return enumerated;\n}\n";
    mkdirSync(path.join(root, "src"), { recursive: true });
    writeFileSync(path.join(root, "src", "a.mjs"), source);
    mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
    writeFileSync(
      path.join(root, "tools", "e2e", "tests", "brief.spec.ts"),
      'test("the body that pins it", () => {});\n',
    );
    const block = {
      correction: "C1",
      file: "src/a.mjs",
      spec: "tools/e2e/tests/brief.spec.ts",
      body: "the body that pins it",
      message: "m",
      old: "  return enumerated;",
      new: "  return everything;",
    };
    let sawOnDisk = "";
    expect(() =>
      runMutantDrill({
        block,
        projectRoot: root,
        run: () => {
          sawOnDisk = readFileSync(path.join(root, "src", "a.mjs"), "utf8");
          throw new Error("the runner died mid-drill");
        },
      }),
    ).toThrow("the runner died mid-drill");
    expect(sawOnDisk, "the mutant really was on disk when the run died").toContain(
      "return everything;",
    );
    expect(
      readFileSync(path.join(root, "src", "a.mjs"), "utf8"),
      "and the site is restored ANYWAY — this is what the `finally` buys",
    ).toBe(source);
    // THE POSITIVE CONTROL: the same drill whose run returns normally is
    // restored too, so this body is about the ABORT and not about restoring.
    runMutantDrill({
      block,
      projectRoot: root,
      run: () => ({ code: 1, output: "  1) [chromium] › tests/brief.spec.ts:1:1 › the body that pins it \n    Error: m\n  1 failed" }),
    });
    expect(readFileSync(path.join(root, "src", "a.mjs"), "utf8")).toBe(source);
  } finally {
    removeGitFixture(root, FIXTURE);
  }
});
```

**CHECKED BY ME BOTH WAYS.** GREEN at `d086c73` (the property is there).
RED against an implementation lacking it — the `try`/`finally` collapsed to
two straight statements — **alone: 1 failed / 47 passed**, printing
``and the site is restored ANYWAY — this is what the `finally` buys``.
**No code change is owed.** This correction is the fence, not the fix.

```mutant
correction: CORRECTION 1 — the aborting drill's restore is unfenced
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/cli.spec.ts
body: an ABORTING drill still restores the site — the merged tree is never left mutated
message: and the site is restored ANYWAY — this is what the `finally` buys
--- old
  try {
    result = (input.run ?? spawnSpec)(runner);
  } finally {
    writeFileSync(file, pristine);
  }
--- new
  result = (input.run ?? spawnSpec)(runner);
  writeFileSync(file, pristine);
```

---

### CORRECTION 2 — SECURITY: a block's `file` and `spec` are not confined to the project root

**This is the security sweep's finding, and it is the one correction that
needs a code change.** A mutant block is TEXT carried on a card on a lane
branch. `runMutantDrill` resolves it with `path.join(projectRoot,
block.file)` and **writes there**, with no containment check of any kind —
the reader has no path rule at all.

**MEASURED, not reasoned.** With `projectRoot` a fixture root and
`file: "../VICTIM.txt"` naming a file **outside** it:

```
victim      : /var/folders/…/T/VICTIM-sec-t281-1ATcxj.txt
block.file  : ../VICTIM-sec-t281-1ATcxj.txt
OUT: restored and PROVED by sha256: ../VICTIM-sec-t281-1ATcxj.txt 0944cd89…
OUT: C-EVIL: "b" RED ALONE in tools/e2e/tests/brief.spec.ts, with the message the block names
exit code   : 0            <- EXIT.CLEAN. The merge proceeds.
victim DURING the spec run : "PWNED\n"
victim AFTER               : "SECRET LINE\n"
```

The write lands outside the repository, is **live for the whole spec run**,
and the drill reports a clean re-drill. `block.spec` escapes the same way:
`spec: tools/e2e/../../../OUTSIDE.spec.ts` is read with `readFileSync` and
handed to playwright's argv. The reader accepts `file: ../../etc/x` and
`file: /etc/x` outright. An absolute path is contained only by accident —
`path.join` folds it under the root — which is luck, not a rule.

**THE CODE CHANGE THE INTEGRATOR PERFORMS** (the block below anchors on
this exact text, so write it verbatim). In `readOneBlock`, immediately
**before** the existing `for (const key of MUTANT_KEYS)` loop that applies
`PROSE_LINE`:

```js
  for (const key of ["file", "spec"]) {
    const value = /** @type {string} */ (fields[key]);
    if (path.isAbsolute(value) || path.posix.normalize(value).startsWith("..")) {
      return {
        problem:
          `a mutant block's \`${key}: ${value}\` resolves outside the project root. A block is ` +
          "text off a card, and the drill WRITES the file it names — a path that leaves the " +
          "repository is a write on the integrator's machine",
      };
    }
  }
```

**THE BODY THAT PINS IT** — committed on the bench after this verdict commit:

```ts
test("a mutant block's file and spec are CONFINED to the project root — no traversal, no absolute path", () => {
  // SECURITY. A block is TEXT off a card carried on a lane branch, and
  // the drill WRITES the file it names, on the integrator's machine, with
  // `path.join(projectRoot, block.file)`. A `../` segment leaves the
  // repository entirely, and the write is live for the whole spec run.
  for (const escape of [
    "../outside.mjs",
    "../../.git/hooks/pre-commit",
    "src/../../outside.mjs",
    "/etc/hosts",
  ]) {
    const read = readMutantBlocks(mutantBlockText({ file: escape }));
    expect("problem" in read, `${escape} is refused as a \`file\``).toBe(true);
    if ("problem" in read) expect(read.problem).toContain("outside the project root");
  }
  for (const escape of ["tools/e2e/../../../outside.spec.ts", "/tmp/outside.spec.ts"]) {
    const read = readMutantBlocks(mutantBlockText({ spec: escape }));
    expect("problem" in read, `${escape} is refused as a \`spec\``).toBe(true);
  }
  // THE POSITIVE CONTROL, run because a reader that refused every path
  // would be indistinguishable from this one: ordinary in-tree paths are
  // still accepted, and a dot PAIR inside a file name is not a traversal.
  const ok = readMutantBlocks(mutantBlockText());
  expect("problem" in ok, "an in-tree path is accepted").toBe(false);
  const dotted = readMutantBlocks(
    mutantBlockText({ file: "tools/e2e/scripts/a..b.mjs", spec: "tools/e2e/tests/b.spec.ts" }),
  );
  expect("problem" in dotted, "a dot pair inside a name is not a traversal").toBe(false);
});
```

**CHECKED BY ME BOTH WAYS.** RED at `d086c73` — the implementation lacks
the property — failing on ``../outside.mjs is refused as a `file` ``. GREEN
against an implementation carrying the code change above: **48 passed**.

```mutant
correction: CORRECTION 2 — a block's file and spec escape the project root
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/cli.spec.ts
body: a mutant block's file and spec are CONFINED to the project root — no traversal, no absolute path
message: ../outside.mjs is refused as a `file`
--- old
    if (path.isAbsolute(value) || path.posix.normalize(value).startsWith("..")) {
--- new
    if (false && path.isAbsolute(value)) {
```

---

### CORRECTION 3 — AC-4's never-rewrite prohibition is PROSE ONLY

`integrator.md` step 2b says it plainly and carries **no hedge today** — I
checked. What nothing observes is a hedge being **added**. A `T-221` data
mutant, planted where the property lives:

    Rewriting the body — unless it does
       not apply to the merged tree — makes the drill

**Measured: the method eval gate still reports 10, and `cli.spec.ts` still
reports 45 passed.** One clause refunds the card's whole saving, because
"does not apply" is exactly what a tired seat concludes at 11pm. The
existing published-layout body pins the *marker phrase's* presence, not the
absence of a hedge beside it.

**THE BODY THAT PINS IT** — committed on the bench after this verdict commit:

```ts
test("the integrator's never-rewrite rule carries NO hedge — the one clause that would refund this card", () => {
  // A T-221 DATA MUTANT, because the property lives in PROSE: no code
  // mutant can grade it. Inserting "unless it does not apply to the
  // merged tree" into the row leaves the method eval gate at 10 and every
  // other body in this file green — measured. One clause is the whole
  // saving refunded, because "does not apply" is exactly what a tired
  // seat concludes at 11pm.
  const integrator = readFileSync(path.join(repoRoot, "method", "roles", "integrator.md"), "utf8");
  const at = integrator.indexOf("THE BODY IS NOT YOURS TO WRITE");
  expect(at, "the row is there to be read").toBeGreaterThan(0);
  const ends = integrator.indexOf("3. Checkpoint ritual", at);
  expect(ends, "and it ends where the next numbered step begins").toBeGreaterThan(at);
  const row = integrator.slice(at, ends).toLowerCase();
  for (const hedge of [
    "unless",
    "if necessary",
    "when needed",
    "where needed",
    "may adapt",
    "discretion",
    "where appropriate",
    "does not apply",
  ]) {
    expect(row, `the never-rewrite row must not hedge with ${JSON.stringify(hedge)}`).not.toContain(
      hedge,
    );
  }
  // THE POSITIVE CONTROL: the row really is what is being read, so a body
  // that passed because it was reading an empty string would be caught.
  expect(row, "the prohibition itself").toContain("rewriting the body");
  expect(row, "and the corner it governs").toContain("the committed body is what proves it");
});
```

**CHECKED BY ME BOTH WAYS.** GREEN at `d086c73`. RED under the data mutant
above — **alone: 1 failed / 47 passed** — printing `the never-rewrite row
must not hedge with "unless"`. **No code change is owed.**

```mutant
correction: CORRECTION 3 — the never-rewrite row admits a hedge nothing notices
file: method/roles/integrator.md
spec: tools/e2e/tests/cli.spec.ts
body: the integrator's never-rewrite rule carries NO hedge — the one clause that would refund this card
message: the never-rewrite row must not hedge with "unless"
--- old
Rewriting the body — even to
   improve it, even where you can see a better assertion — makes the drill
--- new
Rewriting the body — unless it does
   not apply to the merged tree — makes the drill
```

---

### THE ORDER THESE MUST BE TAKEN IN — read this before drilling

**CORRECTION 2's CODE CHANGE COMES FIRST.** Its body is committed RED,
because the property is genuinely absent — that is what a code-change
correction looks like under this card's own rule. Until the code change
lands, `cli.spec.ts` on the merged tree is **47 passed / 1 failed**, and
planting CORRECTION 1's or CORRECTION 3's mutant would then show **two**
reds, which `gradeDrill` correctly refuses as REDS MORE THAN ITSELF. So:

1. Merge. Apply CORRECTION 2's code change verbatim (the block anchors on it).
2. Confirm `cli.spec.ts` is **48 passed**.
3. Then the drill re-runs all three blocks; each reds its own body alone.

This is `integrator.md` 2b's own corner — *"where a correction needs a code
change beside the body, the verdict names it"* — met for the first time, and
it is the one rough edge in an otherwise clean mechanism. Filed as **T-281-s7**.

### On the criteria

- **AC-1** met. The contract names the spec file, the per-correction commit
  and the after-the-verdict ordering, and the drill enforces the *purpose*
  of that ordering better than an ancestry check would: it verifies the
  named body is really on the MERGED tree and says so in one read when a
  merge was given the verdict sha instead of the bench tip.
- **AC-2** met, and the layout is stated once. The `file`/`spec` split is
  better than the criterion asked for.
- **AC-3** met. All three named refusals shown REFUSING by me, reproducibly,
  on my own fixtures — survivor, stale anchor, line-number block.
- **AC-4** met in the contract, and now fenced by CORRECTION 3.
- **AC-5** met: 10 model-free evals, exit 0, unchanged; the gate script is
  untouched; the bump is correctly left to the integrator with its eval
  block on the card.
- **AC-6 NOT MET, and correctly so.** The checkpoint record is the
  integrator's artifact and lives outside this fence; writing it here would
  have breached the fence. The executor said so plainly and filed the
  machine-time half as T-281-s2. The "after" figure is also vacuous until a
  merge has actually drilled a block — which this merge will be the first to
  do. It is owed at the checkpoint, from this merge's own clock.

### Suggested cards filed with this verdict

**T-281-s5** (the sha256 restore proof cannot be made to fail),
**T-281-s6** (a block whose `file` is its own `spec` mutates the assertion),
**T-281-s7** (a code-change correction's block must anchor on text that does
not exist yet), **T-281-s8** (the Rust intermittent nothing names).
None of these blocks the merge.

