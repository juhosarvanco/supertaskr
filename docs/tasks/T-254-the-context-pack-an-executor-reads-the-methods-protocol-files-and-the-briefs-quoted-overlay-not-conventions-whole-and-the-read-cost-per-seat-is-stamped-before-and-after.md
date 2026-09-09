---
id: T-254
title: The context pack — an executor reads the method's protocol files and the brief's quoted overlay, not CONVENTIONS whole, and the read cost per seat is stamped in the record before and after
feature: F-04
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: "@human (2026-09-08): \"I'm thinking ways how to reduce token use and time. If there is any sense for them to only read what is relevant to their task\" — and \"This sounds good\" on the seat's one-sentence suggestion (rooms/loop-efficiency.md item 28)"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/executor.md, method/roles/verifier.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## Why this card exists

An executor's standing read (executor.md step 1) is its card plus
STATE, ARCHITECTURE and CONVENTIONS — about 160 KB before its own
files, three quarters of it CONVENTIONS, re-read at every compaction and
by the verifier's phase 2. Most of CONVENTIONS is rules a gate enforces
(the fence hook, the landing gate, the docs gate): a rule a gate
enforces does not have to be read to be obeyed. The brief already
quotes bullets by heading rather than restating them (dispatch-brief's
`section` and `rawBullet`); this card finishes that mechanism. GSD Core
hands each agent "exactly what it needs" and budgets every prompt file
(T-245); the lane protocol bullet itself says the generic rules live in
method/lane-protocol.md.

## Acceptance criteria

- WHEN `brief.mjs --task <id>` assembles a brief THE brief SHALL carry a
  CONTEXT PACK: the method files the seat's role names, the CONVENTIONS
  bullets the card's gates and fence cite (quoted by heading, byte-exact,
  through the existing `section`/`rawBullet` readers), and the component
  entries for the touched slugs — and SHALL say, in the brief, that
  CONVENTIONS in full is the architect's read, not the seat's.
- WHEN the pack omits a bullet a gate later enforces THE gate still
  refuses (the safety net is the gates, not the reading); the card's
  report SHALL name every such refusal as a pack gap, and the pack's
  bullet set SHALL be derived from the gates' own citations, never
  hand-listed.
- WHEN executor.md and verifier.md step 1 are read THE step SHALL say
  "the brief's pack" where it says CONVENTIONS today; the method eval
  gate SHALL run and the bump SHALL carry its eval block.
- WHEN the merge is recorded THE checkpoint SHALL stamp the read cost
  per seat — the token meter at the seat's first edit, read off the
  notification — for one lane before this card and one after, with the
  clock, so the saving is a reading and not a claim.
- IF a card's gates cite no bullet THEN the pack SHALL say so and the
  seat SHALL read the role's method files alone — never silently fall
  back to the whole document.

## Implementation notes
<!-- executor appends before finishing -->

Executor: claude-opus-5@subagent, lane `task/T-254-the-context-pack` at
worktree /Users/ujju/Projects/nputer-T-254, base
6dabfca4d710bd53cbfc49cf5810191743f7d55e.

## What moved

**`tools/e2e/scripts/dispatch-brief.mjs`** — `assembleBrief` now emits a
CONTEXT PACK after the contract's thirteen rows and OUTSIDE them. It is
not a fourteenth row on purpose: the contract table is normative and a
row is a method version bump, which is not this lane's to take. Six new
exports carry it — `GATE_SOURCE_DIRS`, `PACK_TRANSCRIPTION_LIMIT`,
`gateSources`, `bulletByOpening`, `conventionHeadings`,
`citedConventionBullets`, `methodNamed`, `packRecs`.

**`tools/e2e/tests/brief.spec.ts`** — five new bodies, named in the
suites section below. FIVE SPEC NAMES ARE ADDED, so `npm run
capabilities` is owed IN THE MERGE COMMIT and is the integrator's
(CONVENTIONS' capabilities bullet; docs/CAPABILITIES.md is outside this
lane's fence).

**`method/roles/executor.md` step 1 and `method/roles/verifier.md`'s read
step** — both now send the seat to the brief's pack, say the whole
document is the architect's read, state that the safety net is the gates
rather than the reading, and rule what a silent pack and a missing pack
each mean.

## THE DERIVATION, and why it is not a list

The pack's bullet set is DERIVED twice over and hand-listed nowhere.
The HEADINGS come off docs/CONVENTIONS.md through the two enumerations
this command already keeps (`standingGates` + `namedDisciplines`, 25
named bullets at this ref). The CITATIONS come off the gates' own
sources: every TRACKED `.mjs` under `.claude/hooks/` and
`tools/e2e/scripts/` (35 files at this ref) searched for each heading.
A heading a source names is in the pack; one no source names is out.
`bulletByOpening` is new because `rawBullet` finds a bullet CONTAINING a
phrase, which throws on a heading — "GRAPH REGEN" occurs in five bullets
of this document and "DOCS GATE" in four.

A LONG BULLET IS CITED, NOT TRANSCRIBED, under T-225-s2's standing law,
through the `citedRule` machinery already in the file. Transcribing the
13 cited bullets whole would put 69,590 bytes into the brief — the cost
moved rather than removed, and past one pipe buffer besides. Short
bullets (at or under `PACK_TRANSCRIPTION_LIMIT`, 2,000 bytes flattened)
are transcribed byte-exact, flattened, the way every other quotation in
this command is. That limit is a DECLARED constant, not a derivation:
there is nothing in either document to derive it from, and a figure
dressed up as derived would be worse than one stated plainly.

TWO WAYS A PACK CAN BE EMPTY ARE SAID APART, because they are two
different facts: a checkout that tracks NO gate source (every project
`method/` is copied into — including the method eval gate's own fixture
root, which is what found this) against gates that cite nothing. Both
send the seat to the role's method files and the card, and both say
"never fall back to the whole document" in as many words. The first
version of `gateSources` THREW on an empty corpus and reddened MF-01;
the eval was right and the code was wrong.

## THE MEASUREMENTS (criterion 4's half, at ref 9c1a5fa, 2026-09-09T06:36:29Z on Mac.lan)

docs/STATE.md 8,322 · docs/ARCHITECTURE.md 9,300 ·
docs/CONVENTIONS.md 129,306.

| card | card bytes | standing read today | pack block | the bullets the pack names | read with the pack | saving |
|---|---|---|---|---|---|---|
| T-254 (this one) | 3,006 | 149,934 | 11,501 | 13 of 25, 69,590 | 90,218 | 59,716 (39.8%) |
| T-022 (planned) | 4,855 | 151,783 | 13,385 | 13 of 25, 69,590 | 92,067 | 59,716 (39.3%) |
| T-032 (planned) | 6,025 | 152,953 | 14,523 | 13 of 25, 69,590 | 93,237 | 59,716 (39.0%) |

"Standing read today" is card + STATE + ARCHITECTURE + CONVENTIONS.
"Read with the pack" is card + STATE + ARCHITECTURE + the bullets the
pack names. The whole `--task` brief is 43,892 / 45,508 / 46,673 bytes
for the three cards, of which the pack is the block column.

**AND THE SAVING IS THE SAME NUMBER THREE TIMES, WHICH IS THE FINDING
RATHER THAN THE RESULT.** The corpus is the WHOLE gate source set, so
the bullet set is corpus-wide and not yet per-card: every card gets the
same 13 bullets today, and only the component entries move. Narrowing
the corpus to the gates that actually FIRE on a card's own fence is
`T-254-s1`, filed. The pack is already worth its 40% and says WHICH
bullets bind; it is not yet worth what a per-card derivation would be.

**MY OWN READ COST, PER FILE, BEFORE MY FIRST EDIT** (the card's own
irony, measured): brief 37,044 · card 3,006 · docs/STATE.md 8,322 ·
docs/ARCHITECTURE.md 9,300 · docs/CONVENTIONS.md 129,306 (read whole,
in four Read calls) · method/roles/executor.md 20,778 ·
method/roles/verifier.md (first 60 lines) · plus targeted reads of
dispatch-brief.mjs and brief.spec.ts. **165,978 bytes of standing
documents alone**, of which the pack this lane built would have named
69,590. docs/ROADMAP.md and docs/CAPABILITIES.md were NOT read whole —
CLAUDE.md names them and executor.md subtracts ROADMAP; CAPABILITIES was
consulted through its documented raw source (the spec names). Say that
plainly rather than claim a read that did not happen.

## THE BUMP IS THE INTEGRATOR'S, NOT THIS LANE'S

The method version bump is a THREE-FILE COMMIT — docs/CONVENTIONS.md's
stamp, method/interview/plan-interview.md's Output heading and
`METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs — and this
fence reaches none of the three. This lane changed two role files, which
takes CONVENTIONS' test 2 (GRAMMAR: it changes what a brief may say) and
test 1 for `roles/executor.md`+`roles/verifier.md` only as far as
`KIT_FILES` reaches. **The bump is the integrator's at the merge**, the
way T-241's seat performed it. THE EVAL BLOCK IT MUST CARRY, measured in
this lane at 9c1a5fa and ready to lift:

    Method evals: model-free exit 0, model-in-loop exit 3.
    Corpus: 10 model-free, 4 model-in-loop.
    Runner: NONE
    THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.
    Say that in the commit rather than omitting the line: a bump whose
    eval result is absent and one whose eval was skipped read the same.
    Pass rates and token spend are in the run above, at this ref. Do not
    transcribe them from an earlier run — that is the corpus's own RC-04.

Re-run `node tools/method-evals/run.mjs --bump` at the merge rather than
copying the block above if the runner is set by then: a replayed block is
not a measurement.

## PACK GAPS (criterion 2's report obligation)

**NONE.** No gate refused this lane over a rule the pack omits. The one
refusal-shaped event was the method eval gate's MF-01 reading exit 3
against its fixture root, which was this lane's own defect (the empty
corpus throwing) and not a rule the pack failed to name. Recorded here
because "no gaps" and "nobody looked" read the same.

## WHERE THE CARD AND THE REPOSITORY DISAGREE

- **Criterion 1 names `brief.mjs --task <id>` and the assembler is
  `dispatch-brief.mjs`.** `brief.mjs` is the front and is held by
  T-238-s1's live lane; it renders whatever `assembleBrief` returns, so
  the pack reaches `brief.mjs --task <id>` with no edit to that file.
  Verified by running the front, not by reasoning about it.
- **Criterion 3 says "verifier.md step 1"; the verifier's read step is
  numbered 0.** Its step 1 is *"Run the full test commands from
  docs/CONVENTIONS.md"* — a scope statement, not a read instruction, and
  left alone deliberately: the pack is about VOLUME, and the verifier
  still runs every command that document publishes. The read step (0) is
  what moved, which is the executor step 1 analogue the criterion means.
- **Criterion 1 says the bullets are "quoted by heading, byte-exact".**
  Taken as the card's own sentence says — *"the brief already quotes
  bullets by heading rather than restating them"* — and read against
  T-225-s2's standing law, which `brief.spec.ts` already enforces by
  name: a long bullet transcribed back into the brief REDS the existing
  *"THE TWO LONG PASSAGES ARE CITED BY ADDRESS"* body. So the quotation
  is byte-exact in both arms: the whole flattened bullet for a short one,
  and heading + size at this ref + opening capitals + a findable command
  for a long one. Nothing is paraphrased in either.

## THE SUITES, AT THIS TIP

Every exit read from `$?` unpiped, in the order run, at tip 9c1a5fa
(the notes and cards commit follows it; nothing below moves on a
docs-only commit except the docs gate, which is re-derived after).

| command | cwd | exit | count |
|---|---|---|---|
| `npm ci` | lib/parser | 0 | — |
| `npm run build` | lib/parser | 0 | — |
| `npm ci` | app | 0 | — |
| `npm run build` | app | 0 | — |
| `npm ci` | tools/e2e | 0 | — |
| `npm run typecheck` | tools/e2e | 0 | — |
| `SUPERTASKR_E2E_PORT=15254 npx playwright test tests/brief.spec.ts` | tools/e2e | 0 | 63 passed, 0 failed, 0 skipped |
| `node tools/method-evals/run.mjs` | lane root | 0 | 10 model-free |
| `node tools/method-evals/run.mjs --selftest` | lane root | 0 | 10 model-free, POSITIVE CONTROL |
| `node tools/method-evals/run.mjs --bump` | lane root | 3 | model-free 0; model-in-loop NOT RUN, `SUPERTASKR_EVAL_RUNNER` unset |
| `SUPERTASKR_E2E_PORT=15254 node tools/e2e/scripts/gate-run.mjs e2e` | lane root | 0 | `gate-verdict suite=e2e exit=0 bodies=747 targets=1 ref=9c1a5fa verdict=GREEN` |
| `node tools/e2e/scripts/brief.mjs --task T-254` | lane root | 0 | 48,619 bytes, 20 pack lines, 74.2% of one pipe buffer |

**THE PORT WAS 15254 THROUGHOUT** — never 1420, never 14520.
`--bump`'s exit 3 is the DESIGNED answer with no runner configured and is
not a red: it is the block the bump must carry, and it says so itself.

**THE FENCE TOUCHES NO PARSER, APP OR RUST SOURCE.** Nothing under
`lib/parser/src`, `app/src`, `app/src-tauri` or any crate moved. The
parser and app packages were installed and built because CONVENTIONS'
fresh-worktree rule orders them ahead of the lane's own suite, not
because this diff reaches them.

## THE DRILL

Seven mutants, each applied ALONE to the PRODUCER (never to an
assertion), each read back with `git diff` before the suite ran, each
restored with `git restore --source=HEAD --staged --worktree` and PROVED
by sha256 against `git show HEAD:<path> | shasum -a 256`. The suite is
`tests/brief.spec.ts` at `SUPERTASKR_E2E_PORT=15254`; the baseline is 63
passed.

| mutant | file | what moved | passed | bodies red |
|---|---|---|---|---|
| M1 | dispatch-brief.mjs | the pack's method-file loop iterates `[]` | 62 | 1 — THE CONTEXT PACK CARRIES THE METHOD FILES… |
| M2 | dispatch-brief.mjs | every source "cites" every heading (a hand list in disguise) | 61 | 2 — …DERIVED FROM THE GATES' OWN CITATIONS…, A PACK WITH NO BULLET SAYS SO… |
| M2b | dispatch-brief.mjs | `gateSources` drops the two-directory filter | 62 | 1 — …DERIVED FROM THE GATES' OWN CITATIONS… |
| M3 | dispatch-brief.mjs | `PACK_TRANSCRIPTION_LIMIT` 2,000 → 2,000,000 | 61 | 2 — A LONG BULLET IS CITED BY ADDRESS…, and the PRE-EXISTING THE TWO LONG PASSAGES ARE CITED BY ADDRESS… |
| M3b | dispatch-brief.mjs | the transcription is truncated to 400 bytes | 62 | 1 — A LONG BULLET IS CITED BY ADDRESS… |
| M4 | dispatch-brief.mjs | both empty-pack branches print the same sentence | 62 | 1 — A PACK WITH NO BULLET SAYS SO… |
| M5 | method/roles/verifier.md | the safety-net sentence is rewritten away | 62 | 1 — THE ROLE FILES SEND THE SEAT TO THE PACK… |

sha256 restored, all seven: dispatch-brief.mjs
`a40e42b65ffa6c06ead2aba99f06c49f1c9739f4d346af26d577a2d6ebc37c6f`,
verifier.md
`9f01c897035d0ac41b3fc9024ba21156f512b4e07595c45ef8f51cbf0dbbc9c9`.

**SHAPE SIX WAS ASKED, NOT ASSUMED** (CONVENTIONS' catalogue; T-072-s2's
form): every one of the five new bodies has a mutant it and it ALONE
kills — M1, M2b, M3b, M4, M5 each red exactly one body. M2 and M3 red
two, and the second is informative rather than a duplicate: M3's second
casualty is the PRE-EXISTING *"THE TWO LONG PASSAGES ARE CITED BY
ADDRESS"* body, which is the T-225-s2 law the pack's long arm was built
to obey — the two agree by construction, and that is the intended
coupling rather than a redundancy.

**THE POSITIVE CONTROL IS DEMONSTRATED FAILING, NOT ASSERTED.** Two of
the new bodies reddened during construction against implementations that
lacked the property and were repaired on the ASSERTION side, both for
reasons this document already names:

- the long-bullet absence check reddened on a CORRECT pack, because BOOT
  GATE and DOCS GATE both carry *"IF … cannot run THEN say so LOUDLY in
  the checkpoint, naming the reason"* and the sixty-percent slice of one
  is present through the transcription of the other — SHAPE EIGHT, an
  assertion that SEARCHES a corpus with no uniqueness floor. The remedy
  is the one that bullet names: NARROW THE HAYSTACK — `uniqueDeepPhrase`
  walks the window until it finds one occurring exactly once in the
  flattened document, and the body states the finding when none exists.
- the role-file body reddened on three of its four patterns because the
  method files are wrapped at about 70 columns and every phrase spans a
  break — A MISS IS NOT A REFUTATION, cause THREE. The step is now
  flattened before it is searched.

Both are recorded because a body repaired on the assertion side is
exactly the shape that should be visible to a verifier.

## Verdicts
