---
id: T-295-s10
title: "The merge verb's drill step refuses a verdict whose assigned corrections are all wording and say in as many words that they carry no block — the role file's step 5b allows exactly that shape, so the verb stops on a verdict it should read as having nothing to drill"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: done
suggested_by: "the architect seat at the T-314-s6 merge, 2026-09-14"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was measured

At the T-314-s6 merge (2026-09-14) the verdict at the bench tip fc4e3bad assigned two corrections, both wording — a notes claim withdrawn and a count corrected — and said of each that it carries no mutant block, which is the shape the verifier role file's step 5b prescribes for a correction with no property to pin. The verb's drill step refused: the newest verdict assigns corrections and carries no mutant block, a correction whose body has to be recovered from a transcript being the thing the step exists to prevent. The step reads correction count against block count and treats every shortfall as a missing body; the role file distinguishes an explained shortfall (a wording correction that says so) from an unexplained one, and the verb does not. The seat ruled through and finished the tail by hand, the fourth false stop of the verb this weekend after the counts (T-295-s8), the mid-merge drill (T-295-s7) and the heading shape (T-311-s7, landed).

## Acceptance criteria

- WHEN the newest verdict assigns corrections THE drill step SHALL read, per correction, whether the verdict states it carries no block, SHALL drill each block it finds and SHALL treat a stated no-block correction as nothing to drill, refusing only an unexplained shortfall — a correction with neither a block nor the statement; pinned by bodies over a verdict with two stated wording corrections (the step passes and prints both as wording), a verdict with one block and one stated wording correction (one drill, no refusal), and a verdict with a correction that has neither (refused by name).
- WHEN the step passes on stated wording corrections THE plan's line for the step SHALL name each such correction as wording with no drill, so a seat reading one line per step sees why nothing was drilled.

## Implementation notes

Built 2026-09-14 by claude-opus-5@subagent in lane T-295-s10, on
`tools/e2e/scripts/merge.mjs` and `tools/e2e/tests/merge.spec.ts` and
nothing else. Code at `73751fd7`; every figure below is measured there
unless it names another ref.

**What the step did, and what it does now.** `drillSteps` read one COUNT
against another — corrections assigned against mutant blocks present —
and treated every shortfall as a body nobody wrote. It is now a
per-correction reading: each correction the verdict announces is asked
whether a block names it and whether the verdict says it needs none;
every block is drilled exactly as before; a stated no-block correction is
nothing to drill; and the refusal is kept for the one shape it was
written for, a correction with NEITHER, named in the refusal text.

Four new symbols carry it, all in `tools/e2e/scripts/merge.mjs`.
`correctionEntries` reads the two announcement shapes this board has
written — a heading (`#### CORRECTION 3 ...`) and a bold lead
(`**Correction 3 ...**`), either of them a list item — skipping fenced
lines, and folds repeats of one correction into one entry.
`correctionKey` folds an announcement and a block's own `correction:`
field to one string, on the ordinal where there is one and on the leading
phrase where there is not. `statedNoBlock` reads the statement per
SENTENCE and attributes it two ways at once: to the correction whose
stretch of the verdict it sits in, and to every correction whose ordinal
it names. `correctionShortfall` attributes a block by name and then by
count, and returns the wording set and the unexplained set.

**The announcement reader is deliberately conservative and the statement
reader deliberately generous.** A missed announcement costs a step that
cannot say which corrections it read; an invented one costs a false stop,
and a false stop is what this card is. So an announcement needs a heading
or bold marker — a bare prose line beginning "Correction 3 was applied"
is a sentence ABOUT a correction — while the statement is read in every
spelling the board has actually used, with one shape deliberately outside
it: "no block names a line number" is a claim about the blocks a verdict
DOES carry and is not a statement that it carries none.

**Criterion 1.** Per-correction reading, every block still drilled, a
stated no-block correction nothing to drill, refusal only on a correction
with neither. Pinned by three bodies, each with the control where the
STATEMENT is the only thing that moves: two stated wording corrections
plan `drill:none` and refuse with the statements struck out; one block
beside one stated wording correction plans one drill and refuses for
correction 2 ALONE with the statement gone; a correction with neither is
refused BY NAME beside a correction that has a block and one that said so,
and plans when it gains the statement. A fourth body drives the two
attribution shapes and a fifth the assigning guard.

**Criterion 2.** The step's own plan line names each wording correction —
`WORDING, no block by the verdict's own words: <name> / <name>` — on the
`drill:none` step when there is no block and on the FIRST drill step when
there is. `printStep` prints `step.title` for every step, so that line is
the seat's one line per step. The names also reach the runner as the
step's own `wording` list rather than as a re-parse.

**In-fence follow-through.**
- The runner's line for a step that drills nothing said "the newest
  verdict assigns no correction" whatever the reason. On a verdict whose
  corrections are all wording that sentence is FALSE — the verdict
  assigns two — so the runner now says which of the two reasons it is,
  off the step's own `wording` list. This is criterion 2's sentence at
  run time; it is formatting over a list the plan pins, and no body
  reaches it (see the suggestion below).
- The first drill step's line says the count the step actually READ where
  that differs from the heading count. A verdict announcing its
  corrections in bold heads none of them, and a line reporting
  `0 correction heading(s)` beside two corrections read is a figure a
  seat has to re-derive. The pinned phrase itself is unchanged.

**Figures, every one at `73751fd7`.**
- The board: 798 cards under `docs/tasks/`. Running the base reader and
  this one over every card's newest verdict, EXACTLY TWO answers move.
  `T-314-s6` — this card's own subject — goes from `drill:refused` to
  `drill:none` with both corrections named as wording. `T-282` goes the
  other way, from planned to refused: its correction 4 carries no block
  and no statement, which is criterion 1's third case found in the wild.
  738 verdicts are refused before and after, for the reasons they already
  were (no dated entry, not an approval).
- The population the shortfall can reach: 83 cards whose newest verdict
  approves, 48 of those assigning corrections, 81 corrections read across
  them, 13 stated wording. 25 of those 48 carry at least one block —
  the set the old rule let through unread — and exactly 1 of the 25 now
  refuses, which is `T-282`.
- 5 bodies added to `tools/e2e/tests/merge.spec.ts`, 35 before and 40
  after. The scoped e2e reading at `3cd92c78` graded 627 bodies.

**The drills, 7 mutants at `73751fd7`, each planted in
`tools/e2e/scripts/merge.mjs`, run against
`tools/e2e/tests/merge.spec.ts`, restored, and the restoration proved by
sha256 `a6755509aa00707502f75d8431b9861ade92f6dd8cc65225fc466f4d9ab2d564`
after every one.** GREEN is 40 passed, exit 0.
- M1, the statement reader answers nothing: exit 1, 4 failed / 36 passed.
  Not red alone, and that is the reading: four arms rest on the statement.
- M2, the ordinals REPLACE the stretch the statement sits in (the reader
  as it was two hours into this lane): exit 1, RED ALONE, 1 / 39, on
  `which correction a no-block statement is ABOUT ...`.
- M3, a verdict that assigns no correction is read for corrections anyway:
  exit 1, RED ALONE, 1 / 39, on `a verdict that assigns NO correction ...`.
- M4, the drill-nothing line drops the corrections it is about: exit 1,
  RED ALONE, 1 / 39, on `a verdict whose corrections are ALL wording ...`.
- M5, the refusal does not name the corrections it refuses for: exit 1,
  4 failed / 36 passed — three of the four are control arms asserting a
  name is present.
- M6, a block whose label matches nothing covers nothing: exit 1, RED
  ALONE, 1 / 39, on `a block and a stated wording correction ...`.
- M7, the fold matches on a bare prefix with no token boundary: exit 1,
  RED ALONE, 1 / 39, on `which correction a no-block statement is ABOUT ...`.

**Commands, with exit codes.** `npm run typecheck` from `tools/e2e/`:
exit 0. `node tools/e2e/scripts/gate-run.mjs e2e --owning
tools/e2e/scripts/merge.mjs tools/e2e/tests/merge.spec.ts` from the
repository root: exit 0, `SCOPED-GREEN`, 627 bodies over the 8 owning
specs, at `3cd92c78`; re-run at the final tip, recorded in the report.
`gate-run.mjs --owed-set --range <base>..<tip>` answers suites `["e2e"]`
with the e2e leg narrowed to those 8 specs and `whole: false`.

**The standing gates, derived from this lane's own diff.** GRAPH REGEN
FIRES: the diff touches `.mjs` and `.ts` outside `docs/`. BOOT GATE
does not: nothing under `app/src-tauri/**`, `app/src/**` or either
manifest. DOCS GATE does not: no path under `docs/` that a code suite
reads is in the code diff — the card itself is, and the gate is the
integrator's to run at the merge. METHOD EVAL GATE does not: nothing
under `method/**` and no citation-grammar line added under
`docs/tasks/`.

**Where the brief was wrong: nowhere I could measure.** Its base,
worktree, branch, port, fence, tier and lane list all re-derived at this
tip. Two of its statements are worth marking as EVIDENCE that the tree
qualifies rather than as facts it carried: the seat's note that the drill
step "reads the newest verdict's corrections against its mutant blocks
and treats every shortfall as a missing body" is true only where the
block count is ZERO — with one block present the base step ran no
shortfall check at all, so the refusal criterion 1 asks for is an
ADDITION and not only a narrowing, and `T-282` is the one live verdict
that meets it.

**What the merge owes, said loudly because this fence cannot pay it.**
`npm run capabilities:check` from `tools/e2e/` answers STALE at this tip
— committed 100770 bytes against a fresh generation of 101331 — because
five bodies were added. The census file and `docs/INDEX.md` are outside
this card's fence, so the lane could not have fixed it; the integrator
runs `npm run capabilities` as the LAST write before the merge commit,
which is the same thing the T-300-s7 and T-314-s6 merges carried. The
graph is CURRENT at this tip (`index --check`, exit 0, 203 files, 2593
symbols, 2488 edges), so GRAPH REGEN has nothing owed before the merge's
own re-derivation.

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14): to planned at priority 2 — the verb's drill stopped the T-314-s6 merge on the shape the role file allows; dispatched right after T-295-s9 merges, sharing its fence.

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Phase 2 of the guarded bench, at the lane tip `f7161421`, base
`14ff31af`. Three corrections: two are bodies committed on this bench in
the commit after this verdict, each with a mutant block below; the third
is wording and **carries no mutant block, and this sentence is that
statement in as many words**, so the shortfall between three corrections
and two blocks is not read as a body nobody wrote.

#### The frame I actually had

Two spawns, as the tier requires. Phase 1 wrote the attack set with no
tools and no diff; this spawn is a fresh one that never held phase 1's
context. The dispatcher's postscript carried ground rules and paths only
and named no executor-derived figure — no mutant count, no path count, no
suite reading — so phase 1's blindness was not broken above the line. I
read the card at its base, then the sealed inputs, then the role file,
then the DIFF, then the specs, and the executor's report LAST. I did not
open `docs/ROADMAP.md`.

**The brief carried no CONTEXT PACK**, which `roles/verifier.md` step 0
names as a dispatch fault. I say so rather than pretend otherwise, and I
contained it the way that step allows: I read `docs/STATE.md` and
`docs/INDEX.md` whole, and opened `docs/CONVENTIONS.md` at the two
sections steps 1 and 4 need — *Build & test* for the fence's commands and
the census-currency rule, *Gotchas* by grep for this fence's entries —
rather than end to end.

#### The sealed inputs, by digest

| input | sha256 |
|---|---|
| the attack set | `6b7b930db2a9ba450fccdd68a0faba00960b9276c0e1997f336906a2c982f2f7` |
| the ground | `c210eb25d3a0519cb35f3165ea5193f970833978757b8ef3410db00dfcf08454` |
| the ground's measurement transcript | `d2f70eb555785e7a9f3d71d5a47611214ac886a77236c5d5059cd058211d585d` |
| the card at `14ff31af` | `f8225f2210563034231c0079045837796ee433bf70c496da0a89567255222350` |

All four re-computed on this bench and matching the stamp file.

#### A pre-commitment of mine that measured FALSE

Phase 1 pre-committed (P1) that criterion 1's third pin — a correction
with neither a block nor the statement, refused by name — is **degenerate
as evidence**, because the base refuses every shortfall. It is not. At
the base the shortfall check ran **only inside `read.blocks.length === 0`**,
so a verdict carrying one block and a forgotten body took no shortfall
check at all and planned its drill. The third pin is therefore an
ADDITION to the gate and not a narrowing of it, its fixture reds at the
base, and the one live verdict in the shape is `T-282`'s. I record the
prediction and its refutation rather than quietly dropping it.

#### Criterion by criterion

| # | criterion | verdict | the reading that decided it |
|---|---|---|---|
| 1a | the step reads, PER CORRECTION, whether the verdict states it carries no block | **MET, with correction 2** | `correctionEntries` + `statedNoBlock` + `correctionShortfall` in `tools/e2e/scripts/merge.mjs`; body *"which correction a no-block statement is ABOUT is read from the ordinals it names AND from the stretch it sits in"*. The per-correction binding is real — my A1/A2 attacks (one statement, two corrections) refuse correctly. Correction 2 below is the one place the binding leaks: the ordinals are harvested from the whole SENTENCE, so a sentence whose other clause names a correction that HAS a body excuses it too. |
| 1b | it SHALL drill each block it finds | **MET, with correction 1** | `drillSteps` still ends in `read.blocks.map(...)`; body *"a block and a stated wording correction is ONE drill and no refusal"*. Correction 1 below: with `--blocks-absent` and a PARTIAL shortfall the new branch returns one acknowledged step and drills nothing, against this function's own docblock and the usage text this diff edited. |
| 1c | a stated no-block correction is nothing to drill | **MET** | Body *"a verdict whose corrections are ALL wording and SAY SO is nothing to drill"*: `drill:none`, `problem` undefined, `wording` length 2, and the control with the statements struck out refusing. Independently: the whole board swept, base reader against this one, `T-314-s6` is the one verdict that moves from `drill:refused` to `drill:none`. |
| 1d | refusing ONLY an unexplained shortfall | **MET, with correction 2** | Bodies 1-3's controls, and my own probes: a statement inside a fence does not excuse (`drill:refused`); `"No block names a line number."`, the one confusable class the ground measured, does not excuse; prose merely mentioning *wording* and *block* does not excuse. The leak is correction 2's clause boundary. |
| 1e | pin — two stated wording corrections, the step passes and prints both as wording | **MET** | `a verdict whose corrections are ALL wording and SAY SO is nothing to drill, and the step's line names each one`. RED at the base (base answers `drill:refused`). |
| 1f | pin — one block and one stated wording correction, one drill, no refusal | **MET** | `a block and a stated wording correction is ONE drill and no refusal, and the drill's own line still names the wording one`. RED at the base on the title assertions. |
| 1g | pin — a correction with neither, refused by name | **MET** | `a correction with NEITHER a block nor the statement is refused BY NAME, beside corrections that have one`; refuses naming CORRECTION 3, does not name the one with a block nor the one that said so. RED at the base, which plans `drill:1` and runs no shortfall check. |
| 2 | the plan's line names each such correction as wording with no drill | **MET, with correction 2** | The `drill:none` title and the first `drill:` title both carry `WORDING, no block by the verdict's own words: <name> / <name>`, `printStep` prints `step.title` for every step, and the names also reach the runner as the step's own `wording` list rather than a re-parse. Correction 2 below: on `T-300-s7`, a live card, the line names a correction as wording on the same line that re-drills that correction's block. |

#### What I attacked, and what held

Every letter-satisfying attack phase 1 wrote, run against the tip. What
held:

- **The arithmetic and global-scan attacks (A1, A2).** The reading is per
  correction and not a sum. One statement over two corrections refuses
  and names the bare one; a statement in a preamble that names no ordinal
  excuses nobody.
- **The loose-recogniser attack (A5).** `NO_BLOCK_SAID` is five patterns
  over the phrasings the board has written, and the second requires the
  phrase to END its clause — which is what separates *"No block."* from
  *"No block names a line number"*, the one confusable class the ground's
  M12 found in the corpus. Measured: neither of that class's live
  spellings excuses, and neither does ordinary prose carrying *wording*
  and *block*.
- **The self-reference attack (A6).** `fencedLines` is walked in BOTH
  readers, so an announcement inside a mutant block's own `old`/`new`
  text is not a correction and a statement inside a fence does not
  excuse. I drove both and both refuse. (An HTML comment is not fenced
  and does excuse — a finding below, not a correction.)
- **The brittle-recogniser attack (A7).** The opposite failure, and the
  one that matters most here: I ran the tip's reader over all **799**
  cards under `docs/tasks/`. 83 newest verdicts approve, 48 assign
  corrections, 81 corrections are read, 13 are stated wording across nine
  cards — `T-264-s3`, `T-282`, `T-295-s9`, `T-296`, `T-299-s6`,
  `T-300-s6`, `T-300-s7`, `T-314-s6`, `T-317` — and every one is
  recognised. That is nine real phrasings, not three invented ones.
- **The demotion attack (A9).** `refuse()` is untouched, so a refusal is
  still a `Step` carrying a `problem`, `runStep` returns `EXIT.FOUND` and
  the tail loop stops the run. Nothing was downgraded to a warning.
- **The zero-correction path (A13) and the assigning guard.** An
  approving verdict that assigns none is not read for corrections at all;
  body *"a verdict that assigns NO correction is not read for
  corrections, however often it writes the word"*, with the control that
  the same paragraph under an assigning heading IS read.
- **Boundaries (C3, C7, S2).** Emphasis, backticks, upper case, an em
  dash lead-in, a non-breaking space and a statement wrapped across two
  source lines are all recognised — `plainProse` joins the paragraph
  first. A verdict of 400 corrections and 124 KB plans in **11 ms**; a
  90 KB pathological single line in **2 ms**. No regex is built from
  verdict-derived content and no pattern nests a quantifier, so there is
  no injection point and no catastrophic backtracking.
- **Idempotence (C8).** Same input, same decision, same line.

#### The whole-board sweep, which is the strongest evidence here

Running the base reader — recomputed from `newestVerdict`,
`verdictState`, `readMutantBlocks` and `assignsCorrections`, none of
which this diff touches — against the tip's `drillSteps` over every card
under `docs/tasks/`, **exactly two answers move**, and they are the two
the notes name:

- `T-314-s6`, this card's own subject: `drill:refused` to `drill:none`,
  both corrections named as wording on the step's own line.
- `T-282` (`status: done`, so the refusal is latent): `drill:2` to
  `drill:refused`, because its CORRECTION 4 carries no block and no
  statement. Criterion 1's third case found in the wild, and correct.

I derived this independently of the lane, and it agrees with the notes
figure for figure.

#### The findings that ARE corrections

**Correction 1 — `--blocks-absent` now stands in for the blocks a verdict
DOES carry.** The acknowledgement branch used to be reachable only inside
`read.blocks.length === 0`; the per-correction shortfall moves it outside
that guard, and the branch still `return`s a single `drill:none` step. So
a verdict with two committed bodies and one unexplained correction, run
with `--blocks-absent <its own sha>`, comes back acknowledged with
**neither body drilled** — against this very function's docblock ("Blocks
that ARE present are drilled either way") and against the usage text this
diff itself edited ("it is not a blanket, and blocks that are present are
drilled anyway"). Reproduced on this bench by calling the exported
`drillSteps` with three corrections, two blocks and a matching
`verdictSha`/`blocksAbsent` pair: one step, id `drill:none`, no `block`
on it. No body at the base or at the tip passes `blocksAbsent` at all,
which is why it slipped. The correction confines the flag to the shape it
was written for and refuses a partial shortfall by name instead.

**Correction 2 — the ordinals a no-block statement credits are the whole
SENTENCE's, so one clause excuses a correction another clause says has a
body.** `statedNoBlock` splits a paragraph into sentences, tests each for
the no-block phrasings, and then credits every ordinal the SENTENCE
names. A verdict preamble that says both things in one breath therefore
credits both corrections. This is not hypothetical: `T-300-s7`'s own
newest verdict opens its corrections section with *"Correction 1 adds the
keeper the amendment's other half never got; correction 2 is a wording
repair and carries no block."* Run against that live card, the tip's step
prints, on the line that re-drills correction 1's block, `WORDING, no
block by the verdict's own words: Correction 1 — the recorded cut must
survive the LANE's own HEAD moving ... / Correction 2 — ...`. One line
that both drills a correction and says it carries no block. And the same
mechanism buys a false pass: with correction 1's block removed and
nothing else changed, the step plans `drill:none` — a correction with
neither a block nor a statement, waved through — and the control that
strikes correction 1's ordinal out of that one sentence flips it to
`drill:refused`. The correction reads the ordinals from the clause the
phrase is in, splitting on the semicolon and on nothing else, which is
the boundary the measured instance uses and the one boundary that leaves
both shapes the lane pinned (`T-295-s9`'s preamble and `T-317`'s
cross-naming sentence) working.

**Correction 3 — two sentences now promise more than the step delivers,
and they are the sentences a seat reads to learn what the flag does.
THIS CORRECTION CARRIES NO MUTANT BLOCK: it is a wording repair with no
property to pin, and it is said here in as many words rather than left as
a shortfall between three corrections and two blocks.** With correction 1
applied, `--blocks-absent` on a partial shortfall STOPS rather than
drilling, so `drillSteps`'s docblock sentence *"Blocks that ARE present
are drilled either way"* and the usage text's *"it is not a blanket, and
blocks that are present are drilled anyway"* both overstate: what is true
is that the flag never stands in for a block, and a verdict that carries
blocks either has them drilled or is stopped. Say that in both places.
The integrator applies this as prose at the merge.

#### The findings that are NOT corrections

1. **A no-block statement inside an HTML comment excuses.** `fencedLines`
   covers code fences; an HTML comment is ordinary paragraph text, so
   `<!-- Wording; it carries no mutant block. -->` under a bare correction
   plans `drill:none`. No verdict on this board uses HTML comments, and a
   comment in a verdict is still the verifier's own words, so this is
   noted rather than assigned.
2. **Two corrections numbered alike fold into one, and the second inherits
   the first's statement.** `correctionEntries` folds repeats by key,
   which is deliberate and documented — a verdict comes back to a
   correction it has already announced. The cost is that a verdict that
   mis-numbers two different corrections both "Correction 2" excuses the
   bare one. Mis-numbering is a defect of the verdict, and the fold is
   what makes the count honest in the shape that actually occurs.
3. **A correction that is stated wording AND carries a block whose label
   matches nothing is still reported as wording on the line.** The
   name pass runs before the statement check, so a name-matching block
   always wins; only a mislabelled block leaves the correction "stated".
   Correction 2 removes the live instance of this class; the residue
   needs a verdict that both mislabels a block and declares the same
   correction wording, which no card does.
4. **The step's line is one line however long it gets.** 400 stated
   corrections render a 44,896-byte plan line. The criterion's "each" is
   honoured literally; the shape a seat reads is not. Not worth a card at
   the sizes this board writes (the largest live verdict assigns four).
5. **The count fallback can credit a bare correction with another
   correction's second block.** Two blocks both labelled "correction 1"
   beside a bare correction 2 plans two drills and no refusal. This is the
   documented fallback working as designed — there ARE two committed
   bodies and only a label missed — and both blocks are drilled either
   way, so nothing goes unchecked.
6. **`T-295-s12` is a good card and its finding is real.** No body drives
   the verb as far as its drill step, so the run-time half of this
   change — `runStep`'s new sentence — is graded by nothing. The lane
   declares it under `In-fence follow-through` and files the card rather
   than stubbing two legitimate gates, which is the right handling.

#### The in-fence follow-through, graded

Both entries are listed, both are inside the stamped manifest
(`tools/e2e/scripts/merge.mjs`), neither adds an acceptance criterion,
and each moves about ten lines counted as added plus removed — inside
`roles/executor.md` step 5's three limits.

- The runner's line for a step that drills nothing: the base sentence
  *"the newest verdict assigns no correction"* is FALSE on a verdict whose
  corrections are all wording, and it now says which of the two reasons it
  is, off the step's own `wording` list rather than a re-parse. It is
  criterion 2's sentence at run time; it is graded by no body, which the
  lane states and files as `T-295-s12`. **No finding.**
- The first drill step's line saying the count the step actually READ
  where it differs from the heading count: a verdict announcing its
  corrections in bold heads none of them, so `0 correction heading(s)`
  beside two corrections read is a figure a seat would have to
  re-derive. Pinned by the body's `"2 correction(s) read"` assertion and
  by `"3 correction heading(s), 1 block(s)"` where the two agree.
  **No finding.**

#### The security sweep (step 3, mandatory)

The lane's whole effect is a new way for an assigned correction to pass
undrilled, so the recogniser is a trust boundary and verdict text is data
written by a spawn. **Injection:** no `RegExp` is built from
verdict-derived content, no pattern nests a quantifier over
attacker-sized input, and the 90 KB pathological probe answers in 2 ms —
no ReDoS. **Shell:** nothing verdict-derived reaches a child process or a
shell; no new dependency. **Path handling:** a wording correction carries
no `file` key into any read or write, and no path is derived from a
correction name. **Log forging:** correction names reach `step.title`,
`step.warning` and `io.out`; `plainProse` collapses all whitespace, so
no newline or carriage return can forge a plan line — an ANSI escape
sequence would survive into the terminal, which is worth knowing and is
not new surface this diff opened. **Secrets, home paths, the pre-rename
identifier, a synthetic git identity:** none in the diff; the new
fixtures build no repository and set no `user.email`. **Privilege
escalation by prose** is the real risk class here, and it is the subject
of corrections 1 and 2.

#### Architecture and adjacent features (step 4)

The four new symbols are pure functions in `tools/e2e/scripts/merge.mjs`
with no I/O, no imports added, and no reach into the parser library entry
— `merge.mjs`'s import list is unchanged. `newestVerdict`,
`readMutantBlocks`, `assignsCorrections`, `correctionHeadings`,
`correctionFor`, `correctionSteps`, `runMutantDrill` and `drillScope` are
untouched in shape, and the whole-board sweep is the evidence that no
adjacent answer moved: `T-311-s5`'s newest-verdict reader, `T-295-s9`'s
overlapping-anchor counter and the correction step's state table all
answer exactly as they did. The census is STALE at this tip and the
integrator owes `npm run capabilities` as the last write before the merge
commit, which the lane states on the card.

#### The assigned corrections

Three corrections. Corrections 1 and 2 are bodies committed on this
bench in the commit after this verdict, in
`tools/e2e/tests/merge.spec.ts`, each run both ways before it was
committed. Correction 3 is wording and says below, in as many words,
that it carries no mutant block.

**Correction 1 — `--blocks-absent` stands in for the blocks a verdict
DOES carry.** Committed on this bench after this verdict. The body is
*"--blocks-absent acknowledges a verdict carrying NO block at all, and
never stands in for the blocks one DOES carry"*. It drives the exported
`drillSteps` over a verdict with three corrections, two committed blocks
and one bare correction, with a matching `verdictSha`/`blocksAbsent`
pair, and requires the step to refuse rather than return one
acknowledged step; and it carries its own arming as a control — the SAME
flag and the SAME sha over a verdict that carries no block at all is
still acknowledged, as news and not as a stop, so what moved between the
arms is the presence of the blocks and nothing else. Read **RED**
against the implementation lacking the property — the tip as it stands —
at **2 failed / 40 passed, exit 1**, failing on *"a PARTIAL shortfall is
not the shape this flag acknowledges: two committed bodies must not be
waved past"*, expected `["drill:refused"]`, received `["drill:none"]`;
and **GREEN** against one carrying it at **42 passed, exit 0**, with
`npm run typecheck` from `tools/e2e` exit 0 in both states.

**Correction 2 — the ordinals a no-block statement credits are the whole
SENTENCE's, not its own clause's.** Committed on this bench after this
verdict. The body is *"the ordinals a no-block statement credits are its
OWN clause's, so a sentence naming a correction that HAS a body does not
excuse it"*. It builds `T-300-s7`'s measured preamble shape — one
sentence, two clauses, one ordinal in each — and requires three things:
that the correction the other clause names is refused BY NAME when it
carries no block, that the step's own line does not call a correction it
is DRILLING a wording one when it does, and, as the arming control, that
one clause naming both ordinals still credits both. Read **RED** against
the implementation lacking the property — the tip as it stands — at **2
failed / 40 passed, exit 1**, failing on *"correction 1 carries neither
a block nor a statement, and the clause that said so was about
correction 2"*, expected `["drill:refused"]`, received `["drill:none"]`;
and **GREEN** against one carrying it at **42 passed, exit 0**.

With both corrections applied I re-ran the whole-board sweep: the same
**two** answers move and no others, the live stated-wording count falls
from 13 to 12 — the one that goes is `T-300-s7`'s correction 1, which
was never wording — and `T-300-s7`'s own plan line now names only
correction 2 as wording while it re-drills correction 1's block.

**Correction 3 — two sentences promise more than the step will deliver
once correction 1 is applied, and they are the sentences a seat reads to
learn what the flag does. THIS CORRECTION CARRIES NO MUTANT BLOCK: it is
a wording repair with no property to pin, and it is said here in as many
words so the shortfall between three corrections and two blocks is not
read as a body nobody wrote.** `drillSteps`'s docblock says *"Blocks
that ARE present are drilled either way"* and `usageText` says *"it is
not a blanket, and blocks that are present are drilled anyway"*. With
correction 1 applied, a partial shortfall named by the flag STOPS rather
than drilling, so both sentences overstate. What is true in every state
is that the flag never stands in for a block: a verdict that carries
blocks either has them drilled or is stopped, and the flag reaches only
a verdict that carries none. Say that in both places. The integrator
applies this as prose at the merge.

I checked both anchors with the very counter this verb uses before
writing them here. In `tools/e2e/scripts/merge.mjs` at this bench,
correction 1's `old` matches 0 sites and its `new` 1; correction 2's
`old` matches 0 and its `new` 1. Both are the OWED state the correction
step applies, neither anchor matches twice, and both `old` texts are
absent, so nothing here is the arrangement that step refuses.

```mutant
correction: correction 1 — --blocks-absent stands in for the blocks a verdict DOES carry
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: --blocks-absent acknowledges a verdict carrying NO block at all, and never stands in for the blocks one DOES carry
message: a PARTIAL shortfall is not the shape this flag acknowledges
--- old
    if (named !== undefined && named.length >= ACKNOWLEDGE_PREFIX && sha !== undefined && sha.startsWith(named)) {
      // THE ACKNOWLEDGEMENT IS THE WHOLE-VERDICT ONE AND CANNOT REACH A
      // PARTIAL SHORTFALL (T-295-s10's verdict, correction 1). This
      // function's own docblock says the flag never stands in for a
      // block, and at the base that held BY CONSTRUCTION: this branch
      // was reachable only inside `read.blocks.length === 0`. Reading the
      // shortfall per correction makes it reachable WITH blocks present,
      // where returning this one step leaves every committed body
      // undrilled — the one thing this step exists to stop.
      if (!nothingRead) {
        return refuse(
          "--blocks-absent acknowledges a verdict that carries NO mutant block at all, and " +
            `this one carries ${String(read.blocks.length)}: the bodies it DOES carry are ` +
            "drilled rather than waved past, and a correction that carries none is answered " +
            `by the verdict saying so in as many words. ${said}`,
        );
      }
      return [
--- new
    if (named !== undefined && named.length >= ACKNOWLEDGE_PREFIX && sha !== undefined && sha.startsWith(named)) {
      return [
```

```mutant
correction: correction 2 — the ordinals a no-block statement credits are the whole sentence's
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: the ordinals a no-block statement credits are its OWN clause's, so a sentence naming a correction that HAS a body does not excuse it
message: the clause that said so was about correction 2
--- old
      // THE CLAUSE, NEVER THE WHOLE SENTENCE (T-295-s10's verdict,
      // correction 2). One sentence carries two independent clauses about
      // two different corrections — "Correction 1 adds the keeper the
      // amendment's other half never got; correction 2 is a wording repair
      // and carries no block." is T-300-s7's own corrections preamble,
      // measured — and a sentence-wide harvest credits correction 1 with a
      // statement that says the opposite of it, then names a correction the
      // same plan is DRILLING as wording on the step's own line.
      for (const sentence of flat.split(/(?<=[.!?])\s+|\s*;\s*/)) {
--- new
      for (const sentence of flat.split(/(?<=[.!?])\s+/)) {
```

#### What I would have done differently, said once

Correction 1 confines the flag rather than teaching the acknowledgement
to lead a plan that still drills. The friendlier shape is the second
one — emit the acknowledgement and follow it with the drills — and it is
the shape the docblock's sentence already describes. I chose the
confining one because it is a single contiguous edit a merge can apply
mechanically, where the other hoists the drill mapping and is two sites.
A seat that prefers the other reading should take it; the body pins that
the committed bodies are not waved past, which both shapes satisfy, and
only the arm of it asserting `drill:refused` would move.

#### Step 7 — the gates at the tip MY OWN commits created

Every figure in this section is measured at
`9f34c6c54b278e1a9bbbde6f6b5f49ee258f6e3a` — this bench after the verdict
commit and the correction-bodies commit. Every figure ABOVE was measured
at the tip I was sent, `f7161421`, and stays true there; these name this
ref instead, because a count without its ref is wrong the moment anybody
writes again, and I wrote twice.

**The whole battery, at the tip I was SENT** (`f7161421`), which is the
reading that grades the lane:

| leg | bodies | exit | verdict |
|---|---|---|---|
| parser | 413 | 0 | GREEN |
| app | 1171 | 0 | GREEN |
| rust | 655 over 18 targets | 0 | GREEN |
| e2e | 1090 | 0 | GREEN |

**The whole battery again, at MY tip** (`9f34c6c5`):

| leg | bodies | exit | verdict |
|---|---|---|---|
| parser | 413 | 0 | GREEN |
| app | 1171 | 0 | GREEN |
| rust | 655 over 18 targets | 0 | GREEN |
| e2e | 1092 | 1 | RED, by design — two bodies, named below |

**The two reds are mine, they are deliberate, and they are the RED
reading step 5b requires.** 2 failed, 1090 passed, 17.8 minutes, and
both failures are in `tests/merge.spec.ts`: *"--blocks-absent
acknowledges a verdict carrying NO block at all, and never stands in for
the blocks one DOES carry"* and *"the ordinals a no-block statement
credits are its OWN clause's, so a sentence naming a correction that HAS
a body does not excuse it"*. They are corrections 1 and 2, committed here
against an implementation that lacks the property, which is the only way
to take the RED reading step 5b demands: a body committed without both
readings is a body nobody has graded. The verb applies every correction
BEFORE it drills, so both are green at the merged tree and the leg is
1092 of 1092 there. **A seat that picks this branch up before the merge
will see these two reds: they are this verdict's, not the lane's, and
they are healed by applying corrections 1 and 2.** No other red anywhere
— the named intermittent at this base, the push-guard body that reds when
two hook runs straddle a minute boundary (T-314-s5), did not fire, so
nothing here needs attributing to it.

`npm run capabilities:check` from `tools/e2e` — **exit 1, STALE**:
committed 100770 bytes against a fresh generation of 101583. It was
already STALE at the tip I was sent, at 101331, because the lane added
five bodies; my two correction bodies account for the remaining 252. The
lane REPORTS it and the integrator runs `npm run capabilities` as the
LAST write before the merge commit, regenerating `docs/CAPABILITIES.md`
and `docs/INDEX.md`, which is the convention `docs/CONVENTIONS.md`
publishes for a fence that leaves the census read-only. **The fresh
figure to expect at the merge is not this one** — it is taken over the
merged tree, which carries main's own moves as well.

`cargo run -p supertaskr-index -- index --check --root ../..` from
`app/src-tauri` — **exit 0, CURRENT**: 1216090 bytes, 203 files, 2593
symbols, 2488 edges; budget 1216090 of 2145959 bytes (56.7%), 929869
left; floor 240298 of 2145959 (11.2%). My two commits are one markdown
file and one spec file, and the committed graph carries no path under
`tools/e2e`, so the regeneration could not move for them and did not.

`npm run lint:docs` from `tools/e2e` — **exit 0**, every live task
card's frontmatter parses with a legal status, 0 findings over the
whole-tree half, so my verdict and the lane's filed card are both legal
prose to the board reader. The one WARN it prints is
`docs/CONVENTIONS.md` at 162655 bytes against its 146878-byte warn line
(fail at 176253), which stands at this base and is nothing this lane or
this verdict moved. `npm run lint:tokens` — **exit 0, clean** over 188
TOKEN files and 1587 tracked CONTROL files. `npm run typecheck` from
`tools/e2e` — **exit 0**, both with my bodies against the tip's
implementation and with the corrections applied.

`brief.mjs --preflight --task T-295-s10` — **exit 0** at this tip, so the
card's derivable claims still hold with the verdict on it.
`--preflight --task T-295-s12` answers **exit 3** and says why in as many
words: the parser's dispatch order carries no ruling for a card whose
status is `suggested`, so that run is a claim about the command and not
about the card. Not a finding.

I re-read the two fenced files at this tip. `tools/e2e/scripts/merge.mjs`
still hashes to
`a6755509aa00707502f75d8431b9861ade92f6dd8cc65225fc466f4d9ab2d564`, which
is the lane's own restore hash — I planted the base implementation beside
it and the two corrections into it while taking my readings, and every
one is backed out. `tools/e2e/tests/merge.spec.ts` has moved, as it must:
it hashes to
`1bf578e74d997ac6b5315a34983e0b7a45c6171452fc9a6c6f598c89d784f450` and
carries 42 bodies, 40 the lane's and 2 mine.

**And one more commit after that postscript**, because filing a finding
is a write too. `T-295-s13` is filed at
`6a29e1e8` — a partial shortfall the seat has read and accepted has no
way through once correction 1 confines the flag, and the friendlier shape
the docblock already describes is a card rather than a correction because
leading the plan with the acknowledgement is two sites and a correction is
one contiguous pair. The gates that one markdown file can move, re-run at
that ref: `npm run lint:docs` from `tools/e2e` **exit 0**,
`brief.mjs --preflight --task T-295-s10` **exit 0**,
`npm run capabilities:check` still **exit 1, STALE** at the same 100770
against 101583 — a card carries no test name, so the census figure is
unmoved by it. The four suite legs cannot move for a card either: no code
path reads `docs/tasks/T-295-s13-*`, and the board reader that does is
the docs gate above.

#### Integrator correction of 2026-09-14, at the merge (the architect seat, after the closing check)

Correction 1's guard as committed on the bench read `!nothingRead`, which refused a verdict that carries no block at all when its corrections are enumerable — the pre-rule shape the acknowledgement flag exists to reach — and the standing body in tools/e2e/tests/cli.spec.ts (a verdict written before the rule is acknowledged by naming its own sha) went red at the closing check of the merge f5789df2; the verifier's battery at its own tip ran without the code corrections applied, so the red could not show there. The guard now reads blocks present (`read.blocks.length !== 0`), which is what the correction's own refusal message says and what T-295-s13 describes; pinned on both sides by the standing body and by the verifier's body 1 (102 passed over the two specs at the corrected tree). One token and its comment, named in the commit; every other line of the file is the bench tip's two blocks and the wording correction.
