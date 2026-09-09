---
id: T-281
title: The verifier COMMITS the bodies its corrections assign, on the bench, with a text-anchored MUTANT BLOCK the merge verb's drill step reads — the integrator re-drills and never rewrites, and a correction lifted from a transcript is a thing of the past
feature: F-06
milestone: 4
size: M
priority: 2
status: building
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

**And the drill reads the block's spec off the MERGED tree before it
plants anything.** Criterion 1 puts the body commits AFTER the verdict
commit, so what has to be merged is the bench TIP. A merge given the
verdict sha leaves the bodies behind, and without this check the drill
would plant, run a whole spec, and report "the named body did not red" —
which reads like a defect in the correction rather than a merge that
left the body behind. This was found by building it, not by reasoning:
the flag is still spelled `--verdict` and room 17's sentence still says
the verdict commit. Filed as T-281-s3.

### THE DRILLS — twelve mutants, each RED ALONE, restored, sha256-proved

Driven by `drill-T-281.sh` in the scratch directory; log
`drill-T-281-log.txt`. Each mutant was planted at a site matching
exactly once, the WHOLE of `tests/cli.spec.ts` was run, and the run was
required to report `1 failed` naming the intended body. Every restore
compared sha256 against the pristine copy: all PROVED, and the two files
mutated (`merge.mjs`, `verifier.md`) hash identical to their pre-drill
values at the end of the run.

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
| M8 | a forgotten block stops being noticed | the forgotten-block refusal |
| M9 | the drill is planned first instead of last | the drill's position |
| M10 | the layout `verifier.md` publishes drifts one key | published-equals-parsed |

M10 is a DATA mutant, planted in the method text rather than in code,
because that is where the property lives (verifier.md 2b).

**Kill-set containment: no body's kill set contains another's.** Each
mutant kills exactly one body, and the reporter body is killed by two
mutants that kill nothing else. **THE FIRST DRILL PASS FOUND TWO REAL
WEAKNESSES AND THEY ARE FIXED IN THE DIFF, not written round.** (1) The
fixed-layout body proved "one bad block refuses the whole read" using a
block whose fault was a LINE NUMBER, so M2 killed both bodies and the
line-number body's kill set sat inside the layout body's; the bad half
is now a layout fault. (2) The reporter body pinned neither the
numbered-line requirement nor the distinct read — both mutants SURVIVED
it — because its fixtures happened to make both properties invisible;
the playwright fixture now carries a passing body's progress line and
the vitest fixture carries the duplicate vitest really prints.

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
   stays staged on every one.
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
