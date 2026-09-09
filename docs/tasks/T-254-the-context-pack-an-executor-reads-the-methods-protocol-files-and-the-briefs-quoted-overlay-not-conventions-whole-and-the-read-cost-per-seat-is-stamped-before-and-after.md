---
id: T-254
title: The context pack — an executor reads the method's protocol files and the brief's quoted overlay, not CONVENTIONS whole, and the read cost per seat is stamped in the record before and after
feature: F-04
milestone: 4
size: M
priority: 2
status: done
suggested_by: "@human (2026-09-08): \"I'm thinking ways how to reduce token use and time. If there is any sense for them to only read what is relevant to their task\" — and \"This sounds good\" on the seat's one-sentence suggestion (rooms/loop-efficiency.md item 28)"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/executor.md, method/roles/verifier.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2)

**APPROVED WITH ASSIGNED CORRECTIONS.** Tip judged
`5dca625ba66679f9f1deb5820ef8124d0191a38a`, base
`6dabfca4d710bd53cbfc49cf5810191743f7d55e`, on the detached bench
`/Users/ujju/Projects/nputer-V-T-254`, e2e port 25254.

**The four sealed inputs, verified by `shasum -a 256` before anything else
was opened:**

    8829def7e02ccd3d8df8edc47fa5831f907a6c75ece5d088d5e378def87727d4  attack-set-T-254.md
    6adf474fad63f11ad4070159dda288b6300bb7a2ae523a25fc55332c1c9f1b84  ground-T-254.md
    99138ee69be3e59463a2838599fbf063342fde428a0c4bd36ac93a63f3fc1154  ground-T-254-brief-T-251-at-base.txt
    5a37b30381d631177899bae2639e2e731bcce5090b7b014b4e2476bfb9753f54  ground-T-254-brief-T-258-at-base.txt

All four matched. Phase 1 reports `tool calls made: 0` — it kept the
property BY INSTRUCTION, which this harness cannot enforce, and this
verdict says so (T-261).

**THE FRAME I ACTUALLY HAD, disclosed rather than implied.** Two spawns,
and my brief named the tip, the base, the fence, the port and the ground
rules. **It ALSO named executor-derived specifics before I opened
anything — "the 13-of-25 bullets, the 63 bodies, the seven mutants, the
'PACK GAPS: none'" — which is phase 1 broken above the line** even though
each was framed as a CLAIM to re-measure. I re-derived all four
independently at my own tip before reading the report, and all four hold;
the disclosure is owed regardless. I also read the three commit SUBJECTS
from `git log --oneline` while resolving the structural check, before my
findings were written. My findings were written to
`findings-T-254.md` (sha256
`4c7a0654b79664ab517e60fa9065bfac014996c770896dc8cf194e7a8595adc0`)
BEFORE the report, the implementation notes or the suggested cards' bodies
were opened.

**§0, THE STRUCTURAL CHECK — outcome (a).** `brief.mjs` is not in the
diff. It imports `assembleBrief` from `dispatch-brief.mjs`, and
`assembleBrief` now calls `packRecs`, so the pack reaches the front
untouched. Verified by running the criterion's literal command, not by
reasoning: `node tools/e2e/scripts/brief.mjs --task T-251 --root .` exits
0 at 49,496 bytes with the pack at lines 195-218. Not (b) — no front
edit. Not (c) — not dead code. **The fence holds**: all eight changed
paths are inside it; no `docs/CONVENTIONS.md`, no `plan-interview.md`, no
`kit.rs`, no gate file, no regenerated census, no record rewritten.

**WHAT I RE-MEASURED, and it all reproduces.** 13 cited bullets of 25
named headings, 35 tracked gate sources, 69,590 bytes named — re-derived
independently through the module's own exports. `brief.spec.ts` 63 passed
(source bodies 50 -> 55). Method evals `10 model-free` exit 0, `--selftest`
10 POSITIVE CONTROL exit 0 — **identical to the base output in the sealed
ground truth**, so the card's eval block is TAKEN, not typed; `--bump`
exit 3 reproduces the block on the card character for character.

**Full four-suite battery at my tip**, through the blessed runner:
`parser exit 0 bodies=389 GREEN` · `app exit 0 bodies=1171 GREEN` ·
`rust exit 0 bodies=654 targets=18 GREEN` · `e2e exit 0 bodies=747 GREEN`.
**The lane did not run the rust leg** (it says so, and it is not owed by
this diff); I ran it and it is green. `capabilities:check` STALE exit 1
and `index --check` CURRENT exit 0, both as expected. Docs gate FIRES
exit 1 naming three suites — all three run green above.

**AC-1 — MET except one clause.** The pack is in the front's stdout; the
architect's-read sentence is in the EMITTED artifact, not only the source;
`section`/`rawBullet` are untouched (the producer diff is 343+/0-, purely
additive); the component entries are exactly the touched slugs' and match
ARCHITECTURE's slug map (`lib-parser -> C-06`; `app-shell -> C-05, C-10,
C-16`); the method files are per-role by construction and IDENTICAL at
base and tip, so the pack adds no method-read obligation. Byte-exactness
holds in the sense the repository can keep: 4 of 13 bullets transcribed,
every one an exact substring of the whitespace-flattened document (0
misses, checked with `indexOf`), and 9 cited by address — I ran all ten
emitted `grep` commands and every one resolves. **Everything outside the
pack is byte-identical** between base and tip in the same checkout, once
the ref stamp and clock are normalised: the only residue is the margin
block's own size disclosure and this card's status moving
`building -> verifying`. No collateral drift in the shared readers.

**The clause NOT met: "the CONVENTIONS bullets THE CARD'S gates and fence
cite."** The bullet set is corpus-wide. T-251 (`touches:
[.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]`)
and T-258 (`touches: [method/roles/verifier.md]`) produce **byte-identical
pack regions** — `diff` exit 0 on two cards with disjoint fences. The lane
measured this itself, named it "the finding rather than the result", and
filed `T-254-s1`; that is the honest disclosure the method asks for. It is
still a criterion clause marked MET that is not delivered, and per this
project's own rule a criterion the lane cannot meet as written is REFUSED
WITH EVIDENCE rather than reported met with the gap filed beside it.

**AC-2 — the derivation is REAL, and its denominator is not.** Phase 1
asked me to state which happened on the anti-hand-list data mutants, so:
**deleting a live citation (`THE FOUR WALKS` in `docs-scan.mjs`) moved the
pack 13 -> 12, and adding one (`A NEGATIVE ASSERTION NEEDS A POSITIVE
CONTROL`) moved it 13 -> 14 and the new bullet appeared.** A hand list
survives both; this one moved both ways. Not a list. The safety net also
holds: **no gate file is in the diff at all**, and the fence hook refuses a
write outside a live lane's fence identically at base and tip (control
run, reported: from this detached bench the hook answers
`not-judged-detached` at BOTH refs, so I drove the lane arm instead and it
refused identically at both).

**AC-3 — MET, and the step-number trap was resolved the right way.** The
STANDING-READ step is the one substituted: `verifier.md` step **0**, not
the literal "step 1" the criterion names, and `executor.md` step 1. STATE
and ARCHITECTURE survive in both. The verifier keeps its route to the
document — *"This subtraction is about VOLUME and never about scope: step
1 below still runs the full commands that document publishes."* Nothing
else in either contract moved. Reverting either role file to base reds
exactly one body, so the change is pinned.

**AC-4 — discharged as far as a lane can.** The token meter exists only in
the completion notification and a lane cannot read its own; the lane gives
BYTES, says so plainly, and **invents no token figure**. Its figures carry
a named ref (`9c1a5fa`) and a wall clock. Its model — "read with the pack"
= card + STATE + ARCHITECTURE + the 69,590 bytes of named bullets — is the
PESSIMISTIC bound, assuming the seat follows every address; it yields
59,716 saved, net 48,141 after the brief's growth. My own measurement on
the optimistic model (the pack region stands in for the document) gives
187,927 -> 70,124 bytes, **117,803 saved (62.7%)**, at base 6dabfca and tip
5dca625 in this bench. **The lane under-claimed.** The checkpoint's
before/after stamp remains the integrator's.

**AC-5 — MET in mechanism.** Removing the notice reds exactly the body
that covers it, and — the T-210 hole phase 1 feared — a globally broken
derivation does **not** hide behind the AC-5 alibi: forcing the gate scan
to return `[]` reds three bodies INCLUDING the empty-pack body, because
that body asserts the live repository is neither empty arm. The branch is
per-REPOSITORY rather than per-card, which follows from the AC-1 clause
above and is driven honestly by a synthetic no-hooks fixture.

**SECURITY SWEEP — PASSES.** No `child_process`, `eval`, `new Function` or
`require` added. `methodNamed` resolves through a fixed grammar and then
requires git-tracked membership: six hostile spellings — including
`../../../etc/passwd.md`, `method/../../../secrets.md` and
`....//....//etc//passwd.md` — resolved to nothing, while the legitimate
`roles/orchestrator.md` resolved. No path is built from card-controlled
data: `touches` reaches only a Map lookup. The one new `RegExp` runs over
~20 KB role files with a single quantifier (polynomial, not catastrophic);
the CONVENTIONS scans are `String.includes` and one `split`. The pack
splices document text into an agent prompt, but the pre-existing rows
already quote the same document verbatim, so no new surface class; the
docs gate's injection scan reports 0 hits.

**DRILL — kill-set containment, never the count**, every landing read from
`git diff` (and from `git diff HEAD` for the two doc mutants, because
`git checkout <ref> -- <path>` stages and the plain probe reported a
silent zero on a mutant that had in fact landed). Kill sets:
`{2,3,4}` (scan -> []), `{1,2,3,4}` (document dumped), `{1}` (architect
sentence), `{1}` (components -> []), `{4}` (notice removed), `{5}` (either
role file reverted). **No kill set contains another**; every one of the
five new bodies is load-bearing and none is a restatement.
**Three mutants SURVIVED**, and they are the corrections below.

---

#### CORRECTION 1 — the pack's denominator is silent, and four live gate citations are dropped by it

`conventionHeadings` offers only the 25 openers `standingGates` +
`namedDisciplines` enumerate. **34 of docs/CONVENTIONS.md's 58 top-level
bullets are therefore ineligible for the pack no matter how many gates
cite them** — every bullet whose opener is BOLDED, which in this document
is the shouted, most load-bearing class. Four are cited by a gate TODAY
and appear in no pack:

    A PUSH CANCELS THE RUNNING CI JOB    .claude/hooks/push-guard.mjs:2584
    AND THEN READ IT                     .claude/hooks/push-guard.mjs:178, 661, 2538, 2672
    NEVER TYPE A PATH YOU CAN DERIVE     .claude/hooks/push-guard.mjs:1053
    SCRATCH RULE                         tools/e2e/scripts/dispatch-brief.mjs:3429, 4373

The last is cited by **the pack's own producer**. `push-guard.mjs` prints
the first to the seat verbatim when it refuses a push — the exact case
AC-2's safety net describes, and the pack never warned about it.

MUTANT (mine, survived): three well-formed citations of ineligible
bullets added to a tracked gate source left the pack at 13 bullets,
carrying none of them, with all five new bodies green. Compare the
eligible-heading mutant, which moved the set 13 -> 14. The pack's own line
— *"names 13 of its bullets"* against *"129,306 bytes at this ref"* —
gives the seat no way to learn that a third of the document was never a
candidate.

The remedy is EITHER to widen `conventionHeadings` to the document's own
bolded openers, OR to disclose the unreachable set in the pack. This body
pins it and **REDS at 5dca625** with
*".claude/hooks/push-guard.mjs cite(s) docs/CONVENTIONS.md's "A PUSH
CANCELS THE RUNNING CI JOB" bullet and the pack neither carries it nor
names it as out of reach"*:

```ts
test("THE PACK'S DENOMINATOR IS THE DOCUMENT'S OWN — a gate citation the derivation cannot REACH is disclosed, never dropped", () => {
  // KILLED BY: a derivation whose candidate set is an enumeration built for
  // another purpose. `conventionHeadings` reads the standing gates and the
  // named disciplines — 25 openers of this document's 58 bullets — so a
  // bullet whose opener is BOLDED is not a candidate at all, and a gate that
  // cites one is answered with silence rather than with a pack gap. The pack
  // says "names N of its bullets" against the whole document's byte size, and
  // a seat reading that has no way to learn that a third of the document was
  // never eligible.
  const ctx = context({ taskId: "T-133" });
  const sources = gateSources(ctx.root);
  const reachable = conventionHeadings(ctx.conventions);
  const rendered = render(assembleBrief(ctx).recs);

  // THE DOCUMENT'S OWN SHOUTED OPENERS, read off the document rather than off
  // the enumeration under test — otherwise this body asks the derivation to
  // grade its own homework.
  const dropped: { opener: string; citers: string[] }[] = [];
  for (const b of ctx.conventions.split(/\n(?=- )/).filter((x) => x.startsWith("- "))) {
    const flat = b.replace(/\s+/g, " ").trim().slice(2);
    const m = /^\*\*([A-Z][A-Z'`’ ,\-]{7,70})/.exec(flat);
    if (m === null) continue;
    const opener = (m[1] as string).replace(/[ ,\-]+$/, "").trim();
    if (reachable.some((h) => opener.startsWith(h) || h.startsWith(opener))) continue;
    const citers = sources.filter((s) => s.text.includes(opener)).map((s) => s.rel);
    if (citers.length === 0) continue;
    dropped.push({ opener, citers });
  }
  expect(
    dropped.length,
    "no bolded bullet of this document is cited by a gate, so this body has no subject",
  ).toBeGreaterThan(0);

  // EITHER the pack carries it, OR the pack SAYS it cannot reach it. Silence
  // is the one answer a seat cannot act on.
  for (const d of dropped) {
    expect(
      rendered.includes(`pack bullet: ${d.opener}`) || rendered.includes(d.opener),
      `${d.citers.join(", ")} cite(s) docs/CONVENTIONS.md's ${JSON.stringify(d.opener)} bullet and ` +
        "the pack neither carries it nor names it as out of reach — the seat is told the pack is " +
        "derived from the gates' own citations, and this citation was dropped in silence",
    ).toBe(true);
  }
});
```

#### CORRECTION 2 — the component entries assert containment but never exclusion

The method-file arm already asserts both directions
(`expect(named).toBe(method.length)`); the component arm asserts only that
each expected entry is PRESENT. MUTANT (survived): making the component
loop iterate `ctx.comps` instead of the touched slugs' ids gives a
one-slug card (T-002, `touches: [lib-parser]`) **15 component entries
instead of 1**, and all five new bodies stay green — the pack widens the
seat's read back out and nothing notices. The mirror mutant (components ->
`[]`) IS caught, so only this direction is open. This body pins it; it
PASSES at 5dca625 and I ran the control that owes it — under the dump
mutant it reds with *"Expected - 0 / Received + 12"*:

```ts
test("THE PACK'S COMPONENT ENTRIES ARE THE TOUCHED SLUGS' AND NOTHING ELSE", () => {
  // KILLED BY: emitting the registry and letting the card's own entries be
  // found inside it. The method-file arm above already asserts this direction
  // (`expect(named).toBe(method.length)`); the component arm asserts only
  // containment, so a pack that named every component satisfies every existing
  // assertion — docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A POSITIVE
  // CONTROL, from the side where the positive control is the count.
  const ctx = context({ taskId: "T-133" });
  const withSlug = [...ctx.cards.values()].find((c) =>
    fieldList(c.fields, "touches").some((t) => ctx.slugs.has(t)),
  );
  expect(withSlug, "no live card fences a component slug, so this body has no subject").toBeDefined();
  const slugCtx = context({ taskId: (withSlug as NonNullable<typeof withSlug>).id });
  const expected = new Set<string>();
  for (const t of fieldList((withSlug as NonNullable<typeof withSlug>).fields, "touches")) {
    for (const id of slugCtx.slugs.get(t) ?? []) {
      const comp = slugCtx.comps.find((c) => c.id === id);
      if (comp !== undefined) expected.add(comp.file);
    }
  }
  expect(expected.size, "the touched slugs reach no component, so the count below proves nothing").toBeGreaterThan(0);
  const emitted = render(assembleBrief(slugCtx).recs)
    .split("\n")
    .filter((l) => l.startsWith("pack component: "))
    .map((l) => (/^pack component: (\S+) /.exec(l) as RegExpExecArray)[1] as string);
  expect(
    [...emitted].sort(),
    "the pack's component entries are not exactly the ones this card's touched slugs reach — a " +
      "pack that names components the fence does not touch has widened the seat's read back out",
  ).toEqual([...expected].sort());
});
```

#### CORRECTION 3 — the same brief says both things about docs/CONVENTIONS.md

ROW 3's APPLIED read-first set still emits
`docs/STATE.md docs/ARCHITECTURE.md docs/CONVENTIONS.md
docs/CAPABILITIES.md docs/NORTH_STAR.md tasks/TASK-FORMAT.md`, and 168
lines later the pack header says the whole of that third document is the
architect's read. **The delivered artifact contradicts itself on the one
question this card exists to settle**, and ROW 3 is inside this lane's own
fence. The lane found this and filed it as `T-254-s3`; a criterion-level
contradiction in the artifact the criterion is about is a correction
rather than a suggestion. This body pins it and **REDS at 5dca625**:

```ts
test("THE BRIEF DOES NOT SAY BOTH THINGS ABOUT docs/CONVENTIONS.md — ROW 3's applied set and the pack agree", () => {
  // KILLED BY: a brief that carries a pack AND still hands the seat the whole
  // document in ROW 3's APPLIED read-first set. Every row is individually
  // faithful — the adapter really does name the document, and the pack really
  // does stand in for it — and the assembled brief is still internally
  // inconsistent about the one question the pack exists to settle. That is the
  // class ROW 3 was rebuilt to close, arriving from the other side.
  const ctx = context({ taskId: "T-133" });
  const lines = render(assembleBrief(ctx).recs).split("\n");
  expect(
    lines.some((l) => l.startsWith("# THE CONTEXT PACK")),
    "this brief carries no pack, so there is nothing for ROW 3 to disagree with",
  ).toBe(true);

  const applied = lines.find((l) => l.trimStart().startsWith("READ FIRST, the role file's reading step APPLIED:")) ?? "";
  expect(applied, "ROW 3 emits no APPLIED read-first set").not.toBe("");
  expect(
    applied.includes("docs/CONVENTIONS.md"),
    "ROW 3's APPLIED read-first set hands the seat docs/CONVENTIONS.md bare while the pack below " +
      "tells it the whole document is the ARCHITECT'S read — the same brief says both, and the " +
      "seat is left to pick which row it believes",
  ).toBe(false);
});
```

#### CORRECTION 4 — the two role files claim a per-card pack that does not exist yet (wording only)

`executor.md` says the pack carries *"the bullets your own card's gates
and fence cite"* and `verifier.md` says *"the bullets the card's own gates
and fence cite"*. The pack is card-invariant in its bullet half — proven
by the byte-identical T-251/T-258 packs above — so both shipped CONTRACTS
over-claim what the mechanism does. Until `T-254-s1` narrows the
derivation, the sentence should say the bullets **the gates cite**, not
the card's. No new body: the demonstration is the identical packs.

#### CORRECTION 5 — one arithmetic slip in the notes (wording only)

The notes and report say *"13 bullets are cited and 12 are not"*. The 25
headings address **24 distinct bullets** (the code deliberately merges
`THE BLESSED GATE` and `THE BLESSED GATE-RUNNER` into one), so the true
split is **13 cited and 11 not**. The code is right and the prose is off
by one; the figure travels to the checkpoint, so it is worth fixing there
rather than in the record.

---

**Nothing else is a failure.** The three commits are coherent, the report
is unusually complete, and every claim in it that I re-measured — the
bullet counts, the gate-source count, the byte figures, the 63 bodies, the
eval block, "PACK GAPS: NONE" (true as the report scopes it: no gate
refused this lane) — reproduces at my tip. The deviations from the
criteria's letter that the lane DISCLOSED (the front is reached through
`assembleBrief`; the verifier's read step is 0; a long bullet is cited
rather than transcribed under T-225-s2; `bulletByOpening` exists because
`rawBullet` throws on an ambiguous heading) are each correct engineering
with the reason recorded, and I endorse all four.

Improvement ideas that are not failures are filed as `T-254-s4`, not
folded into this verdict.

**A NOTE ON PLACEMENT.** This card's implementation notes continue in
`##`-level sections AFTER the `## Verdicts` heading (the gates section, the
fence section, the live-environment section). This verdict is placed INSIDE
the Verdicts section, so those sections follow it as the siblings they
already were; nothing of the executor's was moved or rewritten.

## The gates, derived against the MERGE'S TREE and not at the tip

`TREE=$(git merge-tree --write-tree $(git rev-parse main) HEAD)` exit 0,
then `git diff --name-only <main> "$TREE"` — **8 paths**, at main tip
`44a5ff66bb831138707022c2626ec3062957f504`. Read with `range-rule.mjs`'s
own trigger readers rather than by eye, and derived against the merge's
tree because this notes commit is the one that feeds the DOCS GATE: a set
derived at the tip before it would have missed the gate it triggers
(executor.md's report row states this exactly). **The path set does not
move when this commit lands** — it already contains this card.

| gate | verdict | derived on |
|---|---|---|
| GRAPH REGEN | **FIRES** | 1 of 8 — `tools/e2e/tests/brief.spec.ts` |
| BOOT GATE | NOT OWED | 0 of 8 |
| DOCS GATE | **FIRES** | 4 paths under `docs/` |
| METHOD EVAL GATE | **FIRES** | 2 paths under `method/` |

**GRAPH REGEN FIRES AND THE GATE SAYS NOTHING MOVED — ASKED, NOT
PREDICTED.** `cargo run -p supertaskr-index -- index --check --root ../..`
from app/src-tauri/, exit **0**: *graph.json is CURRENT … (1,198,602
bytes, 201 files, 2,560 symbols, 2,453 edges)*, budget 55.9%. That is the
case CONVENTIONS' own trigger bullet names — `tools/**` matches the
trigger and cannot move the graph, because `.supertaskrignore` excludes
it. The regen at the checkpoint is the integrator's either way.

**DOCS GATE, asked and answered**: `node tools/e2e/scripts/docs-gate.mjs`
over the four card paths, exit **1**, three suites named — and all three
run at this tip:

| leg | exit | bodies | verdict |
|---|---|---|---|
| `gate-run.mjs parser` @ `2727e63` | 0 | 389 | GREEN |
| `gate-run.mjs app` @ `2727e63` | 0 | 1171 | GREEN |
| `SUPERTASKR_E2E_PORT=15254 gate-run.mjs e2e` @ `2727e63` | 0 | 747 | GREEN |
| `SUPERTASKR_E2E_PORT=15254 gate-run.mjs e2e` @ `9c1a5fa` | 0 | 747 | GREEN |

Every live card's frontmatter parses with a legal status; the injection
scan reports 0 hits over the four paths. The RUST leg was not run and is
not owed: BOOT GATE is not owed and no crate moved.

**A LIVE FACT, READ RATHER THAN TRUSTED**: another session held the
gate-runner's solo lock while this lane's final e2e leg queued behind it
— a `gate-run.mjs e2e` and a four-leg battery in
`/Users/ujju/Projects/nputer`, read at 2026-09-09T07:05Z on Mac.lan with
`ps`. The leg ran to GREEN once the lock cleared.

## Corrections at the merge (the architect seat, 2026-09-09, T-254's verdict)

- C5 — the notes' figure "13 bullets are cited and 12 are not" is off by one: the 25 headings address 24 distinct bullets (THE BLESSED GATE and THE BLESSED GATE-RUNNER are one paragraph), so the split at 5dca625 is 13 cited and 11 not. The code was right; the prose travels to the checkpoint, so it is corrected here.
- C1 — the candidate set was the two enumerations' 25 openers, so the document's 34 BOLDED openers were never candidates and four gate-cited bullets reached no pack; `conventionHeadings` now adds the document's own bolded openers (read off the bullets, never listed) and `bulletByOpening` resolves a bolded opener. C2 — the component entries pinned for exclusion. C3 — ROW 3's APPLIED set no longer names docs/CONVENTIONS.md; a line says the pack stands in. C4 — both role files say "the gates cite (corpus-wide today; T-254-s1 narrows it)". The verifier's three bodies carried verbatim; each drilled RED ALONE at the merge.
