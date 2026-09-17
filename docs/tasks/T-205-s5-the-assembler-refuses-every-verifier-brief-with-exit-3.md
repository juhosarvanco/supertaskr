---
id: T-205-s5
title: The project's own brief assembler refuses EVERY verifier brief with exit 3 — it looks for the thirteen-row contract table in the role file it was asked for, and only executor.md has one
feature: F-06
milestone: 4
size: L
tier: guarded
priority: 2
status: done
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/verifier.md, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

Absorbs: T-254-s4, T-271-s3, T-296-s10 (2026-09-13, the pile-2 sitting, the owner's approval of 2026-09-13). The three files are removed in the same commit as this line; their obligations sit in the criteria below tagged with their source, and each full text is kept under its absorbed heading. Priority 3 becomes 2 (T-296-s10's, the highest of the sources); size M becomes L because the table, the assembler's second role, the pack and the bench's naming of it are one construction; the wait on T-311-s5 (roles/verifier.md was that lane's fence and gained step 5a there) is discharged — T-311-s5 merged at 19ce8447 before this fold landed, so the table is placed around step 5a as merged. T-254-s4's own blocker T-254 is done. T-185-s1, T-205-s2 and T-225-s10 stay parked and untouched; T-112-s8 is parked with this card as its wake.

**MEASURED IN T-205's LANE, AND IT PREDATES THAT LANE.**

    node tools/e2e/scripts/brief.mjs --task T-205 --role verifier
    brief: COULD NOT RUN
      dispatch-brief: found 0 tables headed # / The brief carries /
      Assembled from / If it is absent, expected exactly one ...
    exit 3

`dispatch-brief.mjs` reads the row set out of the role file it was
handed. **`method/roles/executor.md` is the only role file that carries
the table**; `roles/verifier.md` has never carried one, at the lane's
base ref or after it (`git show <base>:method/roles/verifier.md | grep
-c "The brief carries"` = 0 both ways), so the refusal is not this
lane's doing.

**WHY IT IS NOW A BLOCKING GAP RATHER THAN A CURIOSITY.**
`roles/executor.md`'s contract table says in as many words that *"a
verifier's or integrator's brief follows the same thirteen-row contract,
substituting the role-specific rows"*, and `roles/orchestrator.md` 5b
requires a brief to be assembled BY THE PROJECT'S OWN ASSEMBLER — *a
rule that depends on a reader remembering has a failure mode; a rule
that depends on a construction does not*. Every verifier brief on this
project is therefore hand-written today, which is precisely the
condition under which four briefs in one sitting broke a rule they had
QUOTED. **And T-205 has just added a two-spawn dispatch for the verifier
that nothing can assemble**, so the newest contract is the one furthest
from a construction.

## Acceptance criteria

- `--role verifier` SHALL assemble rather than exit 3, reading the row
  set from the ONE place it lives and substituting the role-specific
  rows named there (4, 11, 12) against `roles/verifier.md`.
- A ROLE FILE that carries no table SHALL NOT be read as a contract of
  its own, and the substitution SHALL be DERIVED from the role file
  rather than hardcoded per role.
- ROW 3 SHALL apply `roles/verifier.md`'s own reading step — its ONE
  subtraction and no invented addition — the property
  `tools/e2e/tests/brief.spec.ts` already pins for that file.
- THE assembled verifier brief SHALL be the TWO-spawn pair
  `roles/orchestrator.md` 5d mandates, or SHALL say in the artifact that
  it is the single-message fallback. Never silently the second.
- WHEN roles/verifier.md carries its contract table THE table SHALL be written there as the deliverable the assembler already reads, deciding which rows a verifier's brief has that an executor's does not (the bench's two spawns, the attack set's and ground's digests, the blind phase's property) and which it does not need; the table SHALL be placed around, never rewording, the sentences T-311-s5 adds at step 5a and the sentences specs already pin; and the role file's reading restrictions (its one subtraction, criterion 3) SHALL stand unchanged. (absorbed from T-271-s3)
- WHEN the pack is assembled for `role: "verifier"` THE method-file lines SHALL be exactly what `methodNamed` reads off roles/verifier.md, asserted both directions as the executor arm already is, so the producer mutant measured at 5dca625 (dropping roles/executor.md from the verifier's pack) reds by name rather than incidentally. (absorbed from T-254-s4)
- WHEN the brief assembler is asked for the verifier role of a card THE render SHALL carry a context pack derived from the card's fence by the same reader map the executor's pack uses, and SHALL exit 0; WHEN the bench verb renders phase 2 THE render SHALL name the pack's path beside the sealed inputs, and an integration body SHALL show that the named pack is actually produced and readable at the ref the render names, and that a fence whose rule reaches the verifier's pack changes it — never a plausible path alone. (absorbed from T-296-s10)

## Blocked by `T-225-s2`

That lane holds `tools/e2e/scripts/brief.mjs` and
`tools/e2e/scripts/dispatch-brief.mjs` — this card's whole fence — and a
fence is not shared. It waits for that lane to land.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. Every verifier brief the assembler produces is refused at exit 3; waits behind T-239 on dispatch-brief.mjs by fence.

## Absorbed from T-254-s4 — The pack's verifier-seat half is never assembled: no body drives packRecs for role=verifier, and the front cannot reach that role at all, so half of \"the method files the seat's role names\" ships unexercised (kept whole)

Title as filed: "The pack's verifier-seat half is never assembled: no body drives packRecs for role=verifier, and the front cannot reach that role at all, so half of \"the method files the seat's role names\" ships unexercised"

Filed as: status suggested, priority 4, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], suggested_by "T-254's verifier (phase 2), 2026-09-09, from a mutant that survived: a filter correct for the executor and wrong for the verifier passed all five new bodies".

### What was noticed (T-254-s4)

T-254's criterion 1 asks the pack to carry *"the method files the seat's
ROLE names"*, and `packRecs` implements exactly that — it resolves
`methodNamed(ctx.roleMd, roleRel, ctx.root)` off whichever role file the
seat holds. Measured at `5dca625`, the two roles genuinely differ:

    executor  5 files, 129,027 bytes   interview/decomposition.md, lane-protocol.md,
                                       roles/orchestrator.md, roles/verifier.md,
                                       tasks/TASK-FORMAT.md
    verifier  3 files,  83,358 bytes   roles/executor.md, roles/orchestrator.md,
                                       tasks/TASK-FORMAT.md

**But nothing exercises the second row.** All five of T-254's new bodies
build their context with `context({ taskId })`, which defaults to the
executor, and the fifth body reads the two role files directly through
`roleText` rather than through an assembled pack. So the per-role half of
the criterion rests on reading the code.

The mutant that showed it, planted at the producer and read back from
`git diff`:

    const method = methodNamed(ctx.roleMd, roleRel, ctx.root)
      .filter((m) => m.rel !== "method/roles/executor.md");

That is a no-op for an executor seat — `executor.md` is self-excluded from
its own pack anyway — and silently drops `roles/executor.md` from a
verifier's pack, which is the one method file a verifier most needs. **All
five bodies passed.** A blunter mutant (hardcoding the executor's role
file for both roles) IS caught, but only incidentally: it reds the
empty-pack body because that body's fixture root has no
`method/roles/executor.md` to read, which is a missing file rather than
the property.

### And the front cannot reach the role either (T-254-s4)

`node tools/e2e/scripts/brief.mjs --task T-251 --role verifier --root .`
exits **3** — `dispatch-brief: found 0 tables headed # / The brief
carries / …` — because `method/roles/verifier.md` carries no contract
table. **This is pre-existing and not T-254's doing**: the same command
exits 3 at the base `6dabfca` too, and it is recorded here only so the
next seat does not mistake it for a regression this card introduced. It
does mean the verifier's pack cannot be inspected end to end today, which
is why the gap above went unnoticed.

### What would close it (T-254-s4)

A body that assembles the pack for `role: "verifier"` and asserts its
method-file lines are exactly what `methodNamed` reads off
`method/roles/verifier.md` — the same both-directions shape the executor
arm already has (`expect(named).toBe(method.length)`), which is what makes
the executor half mutation-tight. Whether the front should also serve a
verifier brief is a larger question and belongs to whoever owns the
contract table, not to this card.

### Corroboration (the architect seat, 2026-09-09T10:05Z, at the T-279 merge) (T-254-s4)

Two readings of this card's claim, both at 2e9233d–9763afc: (1) `brief.mjs --task T-271 --role verifier` and `--task T-281 --role verifier` both exit 3 with "found 0 tables headed # / The brief carries / Assembled from / If it is absent, expected exactly one" — the arm cannot render a verifier brief at all, because method/roles/verifier.md carries no contract table (executor.md's is at its line 250); (2) T-279's phase-2 verifier disclosed in its verdict that its brief carried no context pack and read STATE whole and CONVENTIONS by bullet instead, naming it a dispatch fault by verifier.md step 0. The seat's phase-2 prompts are hand-written for that reason: the pack T-254 built reaches the executor and never the verifier. Promote when verifier.md is free (T-281 holds it).

## Absorbed from T-271-s3 — No verifier brief can be assembled at all — method/roles/verifier.md carries no contract table, so brief.mjs --role verifier exits 3 with \"found 0 tables\ (kept whole)

Title as filed: "No verifier brief can be assembled at all — method/roles/verifier.md carries no contract table, so brief.mjs --role verifier exits 3 with \"found 0 tables\"

Filed as: status suggested, priority 30, size S, touches [method/roles/verifier.md], suggested_by "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3".

Measured in T-271's lane while checking whether that card's criterion 5
("the executor's and verifier's briefs carry the scoped spelling") was
met. `node tools/e2e/scripts/brief.mjs --task T-271 --role verifier`
exits **3** — COULD NOT RUN — with:

    dispatch-brief: found 0 tables headed # / The brief carries /
    Assembled from / If it is absent, expected exactly one

`method/roles/executor.md` carries that table and assembles cleanly;
`method/roles/verifier.md` carries none, so the one command this
repository has for assembling a brief cannot assemble a verifier's.
Every verifier this method has dispatched was therefore briefed by hand
against a contract nothing derives, which is the class the executor's
own table exists to close.

**This is not T-271's to fix**: verifier.md is T-281's live fence, and
T-271's manifest names three unrelated paths.

Disposition hint: the table is the deliverable, not the code — the
assembler already handles any role whose file carries one. Whoever
writes it owns deciding which rows a verifier's brief has that an
executor's does not (the bench's two spawns, the attack set's hashes,
the blind phase's property) and which it does not need.

## Absorbed from T-296-s10 — The verifier's brief renders no context pack — `brief.mjs --task <id> --role verifier` exits 3 with zero four-column tables, so every phase-2 verifier since the tiers has read the conventions by the index fallback and said so in its verdict (kept whole)

Title as filed: "The verifier's brief renders no context pack — `brief.mjs --task <id> --role verifier` exits 3 with zero four-column tables, so every phase-2 verifier since the tiers has read the conventions by the index fallback and said so in its verdict"

Filed as: status suggested, priority 2, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], suggested_by "the seat (2026-09-12): the T-300 verifier's verdict names the gap as a dispatch fault the role file defines; the recovery sitting of 2026-09-11 reproduced the same exit 3 for its T-303-s1 verifier and fell back to the indexed conventions".

### What was measured (T-296-s10)

The bench verb renders phase 2 from the sealed inputs and the card at the base, and hands the verifier ground rules and paths; the CONTEXT PACK that carries the rules a fence implicates is the dispatch brief's, rendered for the executor role. Asked for the verifier role, the brief assembler exits 3 and reports zero tables with the required four-column header where it expected one, so no pack reaches the bench. The verifier role file calls a missing pack a dispatch fault and prescribes the fallback: open the conventions at the sections the index names and say so. The T-300 verifier did exactly that on 2026-09-12 and opened two bullets of a document past its warn line; the recovery's T-303-s1 verifier did the same on 2026-09-11. The rule the pack exists to keep, that a seat reads what its fence implicates and nothing more, is kept by the verifier's discipline rather than by the arm.

### T-296-s10's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the brief assembler is asked for the verifier role of a card THE render SHALL carry a context pack derived from the card's fence by the same reader map the executor's pack uses, and SHALL exit 0.
- WHEN the bench verb renders phase 2 THE render SHALL name the pack's path beside the sealed inputs, and a body SHALL show a fence whose rule reaches the verifier's pack.

### T-296-s10's Implementation notes (as filed, empty)
<!-- executor appends before finishing -->

### T-296-s10's Verdicts (as filed, empty)

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes

Built 2026-09-17 by claude-opus-5@subagent in the lane, cut at
03c6a2dc975ea540baf79a55a775fff246f89991.

**THE REFUSAL WAS FOUR REFUSALS, NOT ONE.** Driving every deriver
against a verifier context at the base showed the contract table was
only the loudest: rows 2, 12 and 13 each threw for a reason of their
own, and row 11 did not throw at all — it quoted `verifier.md` step 6,
which is that file's FINDINGS step, under the heading "status to
stamp". A repair that had only widened the table read would have
turned one exit 3 into three, and the fourth would have shipped as a
plausible line about the wrong obligation.

**WHERE THE ROW SET NOW COMES FROM.** `contractSource` is a fallback
chain and neither half is a role name: a role file that carries the
table is its own contract, and one that carries none is answered by
the one place the contract does live, found by scanning this method's
role files for it. Two of them carrying one refuses by name — two
tables are two row sets. `roleSpecificRows` reads 4, 11 and 12 out of
the contract's own "substituting the role-specific rows" sentence
rather than from a list in the module, and the assembled brief PRINTS
which rows those are and which file they were read against, so a
reader can re-derive the substitution instead of trusting it.

**WHAT EACH ROW NEEDED.** Row 13's rules section governs the WHOLE
brief and lives beside the table, so it is read from the contract, not
from the seat's file. Row 2's confirmation instruction is searched
whole-file — the generalisation `readSubtractions` already records one
screen below — and where a role file spells none, the row transcribes
the contract row's own words rather than composing a sentence. Row 11
finds the exit-write step by the marker the instruction opens with,
and prints the absence plainly where a role file marks none. Row 4
gains the bench and the two-spawn pointer wherever the role file says
its pass is two spawns, and SAYS that this artifact is one message.

**WHAT `verifier.md` GAINED, AND WHY IT IS NOT SCOPE CREEP.** The
contract makes every row REQUIRED and calls rows 11 and 12
role-specific, so a role file that answers neither cannot be briefed
at all. Two additions, both pure insertions with nothing reworded: a
`## The report` section, which is the file row 12's source column
names, written as pointers to the steps that own each item rather than
as second statements of them; and one sentence inside step 5 saying
the verifier stamps NO frontmatter field, which is what
`roles/integrator.md` already says and is this seat's exit write. The
file's reading restrictions are untouched, step 5a is untouched, and
the diff removes nothing.

**THE BENCH HALF.** `benchPlan` renders the VERIFIER seat's pack
whatever role the arm itself holds, `runBench` writes it between the
seal and the brief — a brief written first would name a path nothing
had produced — and phase 2 names it beside the sealed inputs under its
own heading, saying plainly that it is not under the seal.

**FOR THE VERIFIER.** The card's third criterion says `verifier.md`
has ONE subtraction; at this ref it has TWO, `docs/CONVENTIONS.md` and
`docs/ROADMAP.md`, and the property `brief.spec.ts` pins is "exactly
the documents its own `do NOT read` sentences name", which is what row
3 applies. Neither is in the adapter's list, so the applied set is
unchanged either way. The card's fifth criterion is conditional on
`verifier.md` carrying a thirteen-row contract table; it does not, by
the first two criteria's own design, and the assembler would refuse
two such tables by name.

### In-fence follow-through

None. Every remedy noticed while building either fell under a
criterion or reached a path outside the manifest, and the one that
did the latter is filed as `T-205-s21`.

## Verdicts

### 2026-09-17 — APPROVED — claude-opus-5@subagent

Phase 2 of the guarded bench, at the lane tip `11f30881b8a8`, graded
against the diff `03c6a2dc..11f30881`. Every figure below was measured
on the detached bench at that tip on port 25205 unless it names another
ref.

**THE FRAME I ACTUALLY HAD — two spawns, and one of them was not what
its own contract promises.** I am a second spawn: I received phase one's
sealed artifact and the lane, and I hold file, git and shell tools.
I verified both digests myself before relying on either — attack set
`a8943307a08da953b493f861ac2f8278387501a5194aa1e3984f24bb671fd02d`
(54805 bytes), ground truth
`8ee3809c7f14582f7d503f7ae46d397cbf0c50a428acdaa224c0dd0edf58e734`
(11590 bytes). **PHASE ONE DISCLOSED THAT IT HELD THE FULL TOOL SURFACE
THOUGH ITS BRIEF AND `roles/orchestrator.md` 5d BOTH SAY IT HAS NONE**,
and reports it honoured the contract anyway, using two tool calls. That
is a DISPATCH FAULT in the bench construction, not in this card: 5d buys
the blindness with the TOOL GRANT, and a grant that is merely asked for
is the promise 5d exists to replace. It is recorded here and filed under
"what the integrator owes" below.

**Phase one's contamination (g) is discharged, and its five attacks are
BLIND.** M11 showed the phase-1 brief was rendered at step 11 of the
same dispatch that cut the lane at step 4, by main's pre-repair arm, at
the base. I re-derived the mechanism rather than taking the reading:
`renderPhase1` is handed `cardText: cardAtBase`, which is
`git show <base>:<card>`, and the step's own detail line says "rendered
from <card> at <base> and nothing else". So A4.1, A4.2, A4.4, A7.1 and
A7.5 are blind predictions. **Pre-commitment 9 does NOT fire**, and it is
recorded as answered rather than discounted.

---

#### The headline

The card's most load-bearing claim is TRUE and I reproduced it rather
than accepting it. Driving the BASE module (`git show 03c6a2dc:` of the
assembler) against the BASE `verifier.md` with a table-only repair — the
thirteen table lines of `executor.md` pasted in and nothing else changed
— produces **three refusals, and ships a fourth silently**:

    (1) row 2   method/roles/verifier.md step 1 no longer carries a
                "Confirm your understanding" sentence
    (2) row 12  no section headed "## The report"
    (3) row 13  no section headed "### Rules that govern the whole brief"
    (4) row 11  DID NOT THROW. It rendered:
                  status to stamp: 6. Improvement ideas that are NOT
                  failures: file as status: suggested tasks with
                  suggested_by set ...

Row 11's line is `verifier.md`'s improvement-ideas step printed under the
heading "status to stamp" — a plausible sentence about the wrong
obligation, exactly as the notes say. **A table-only repair would have
turned one exit 3 into three and shipped the fourth as prose nobody
would have questioned.** That is the finding that justifies the size of
this diff, and it holds.

#### What I measured, and where

All at `11f30881b8a8` on the bench unless stated.

**The reproduction, verbatim (pre-commitment 5 / X1).** The published
command, four ways:

    brief.mjs --task T-205    --role verifier   exit 1   57870 bytes
    brief.mjs --task T-205-s5 --role verifier   exit 0   57791 bytes
    brief.mjs --task T-205-s5 --role executor   exit 0   55407 bytes
    brief.mjs --task T-205    --role executor   exit 1   55492 bytes

**Not one of them is exit 3.** The two exit 1s are FOUND, carrying the
two fence-overlap findings between this card and T-205 — this lane's own
live worktree, which clears when it merges — and they still emit a whole
brief. `tools/e2e/scripts/brief.mjs` is NOT in the diff, so AC-1 was met
without touching the front and X1's alternative branch (an undeclared
surface write) does not arise either. **Pre-commitment 5 is satisfied.**

**M6(iii), which phase one named as the reading that decides AC-5's
"never rewording" limb, and which I took because the grounds did not.**
I extracted every string literal of twelve characters or more from all
tracked `.ts`/`.mjs`/`.js` sources, flattened whitespace, and kept those
that occur in `verifier.md` at the base: **22 pinned literals**, from
`.claude/hooks/`, `lib/parser/src/`, `tools/e2e/scripts/`, three spec
files and a method eval. **0 are broken at the tip.** And the stronger
check: of the base file's lines, **0** are absent-or-out-of-order at the
tip. The change to `verifier.md` is a **pure insertion** — nothing
reworded, nothing reordered, nothing displaced. The most load-bearing
pin is `"THE PASS IS TWO SPAWNS"`, which the assembler uses as a
locator; it survives byte-identical.

**M9, also untaken at the base.** The artifact is
`process.stdout.write(answer.text)`; every refusal is `console.error`.
**The two streams are never folded.** So the artifact/log distinction
holds as phase one assumed, and A4.2 is graded on the saved bytes. The
frame sentence sits at **line 55 of a 235-line artifact**, inside ROW 4
— a seat reading top-down meets it before starting work, not in a
footer.

**M8, which the grounds left open.** The script that renders phase 2
from the sealed inputs is `renderPhase2`, and the bench verb is
`benchPlan`/`runBench` — all three in `tools/e2e/scripts/dispatch-brief.mjs`,
which **IS** in the fence. **X2 drops entirely**: AC-7's second limb
needed no path the lane could not touch.

**A7.1, the one-command check phase one asked to be run first.** The two
roles' packs differ exactly as M5 says. Verifier: `roles/executor.md`,
`roles/integrator.md`, `roles/orchestrator.md`, `tasks/TASK-FORMAT.md`.
Executor: `interview/decomposition.md`, `lane-protocol.md`,
`roles/orchestrator.md`, `roles/verifier.md`, `tasks/TASK-FORMAT.md`.
Not byte-identical, and the verifier's is not the executor's.

**A1.1's discriminator.** I assembled both roles for the same card and
diffed rows 4, 11 and 12 after case-insensitively normalising the words
`executor`/`verifier`. All three differ substantially — 23, 11 and 17
differing lines. **No row is the executor's obligation wearing the
verifier's name.**

**Row 3, both roles.** The verifier's emits two SUBTRACTS lines and **no
ADDS line**; the executor's emits the same two subtractions **plus**
`the role file ADDS: tasks/TASK-FORMAT.md`, and its applied set carries
it. The property is a real both-directions derivation, not a negative
substring.

**The data mutants.** D1: a distinctive word changed in a NON-substituted
contract row (row 7) reaches the assembled brief — the row set is READ,
not copied. D2, adapted because the lane wrote no table: a changed cell
in the `## The report` section — the deliverable the assembler does read
off `verifier.md` — moves the render. D3: the substitution set follows
the contract's own sentence, `[4,11,12]` becoming `[4,12]` when the
parenthetical moves. D4: `verifier.md`'s text under the role name
`reviewer` still finds the contract and marks the same three rows
role-specific against `method/roles/reviewer.md`. D5: the four damages
each refuse distinguishably — a dropped column header, a deleted row
("numbered consecutively from one; row 7 reads \"8\""), two tables
("found 2 tables ... expected exactly one"), and an absent substitution
sentence, which refuses on the verifier side where it is needed.

**Pre-commitment 6 — no base refusal became a silent pass.** I damaged
the contract five further ways and every one still refuses: the rules
section renamed, the evidence bullet removed, the evidence bullet
DUPLICATED ("2 bullets carry ... expected exactly one"), the figure-rule
bullet removed, the table heading renamed. Two base refusals were
deliberately relaxed — row 2's absent confirmation sentence and row 11's
absent exit write — and **neither is silent**: each prints the absence in
the artifact and transcribes the contract row's own words rather than
composing a sentence, and a body pins that. I record them as
relaxations-with-disclosure rather than as regressions.

**The suites, whole, on this bench.** parser **454** bodies GREEN;
rust **662** bodies / 18 targets GREEN; app **1171** bodies GREEN;
e2e **1253 passed in 11.7m — 0 failed, 0 flaky** (I read the failed
count, not the last line). `npm run typecheck` from `tools/e2e/`
separately, because **`gate-run` does not typecheck**: exit 0.
`lint:tokens` exit 0; `lint:docs --census` exit 0; method evals **13
model-free, exit 0**; `index --check` **CURRENT** (1230259 bytes, 203
files, 2631 symbols, 2505 edges), exit 0. Every figure the notes state
reproduces.

**The push-guard family and the fence mechanism.** `docs/CONVENTIONS.md`
is mode **644** on this bench because this card's fence carries it; a
fenced lane without it has 444 and hits T-333's double-copy EACCES. All
of `push-guard.spec.ts` is green here, plus the push-guard bodies in
`checkout-currency.spec.ts`, `gate-run.spec.ts`, `lane-fence.spec.ts`
and `workflow-parity.spec.ts`. **T-333's mechanism is confirmed from the
opposite direction, and the pass is a consequence of the fence rather
than luck.** On T-343: I could not find a body naming that card in any
spec, so I cannot re-measure it by name; what I can report is that the
whole e2e leg ran alone on this bench with no concurrent work and
returned 1253/1253 with no flaky line.

#### The criteria

**AC-1 — MET.** The published command assembles at exit 0 (and at exit 1
FOUND for T-205, for a live fence overlap that is not a refusal). The row
set is read from `method/roles/executor.md`, the one place it lives, and
the brief SAYS so; rows 4, 11 and 12 are marked role-specific and read
against `method/roles/verifier.md`. D1 shows the row set is read rather
than copied. Not graded on an exit code alone: the evidence is artifact
content and the refusal messages.

**AC-2 — MET.** `contractSource` decides on a CONTENT test
(`carriesContractTable`) and a scan of the tree, never on a role name;
`roleSpecificRows` parses the numbers out of the contract's own sentence
and throws rather than returning an empty set. D4 and drill V1 together
are the control phase one owed: a name-keyed implementation reds, and
the derived one answers `reviewer` correctly.

**AC-3 — MET, by the property that was already pinned.** The existing
body — the one that applies the role file's reading step and still shows
what the adapter itself named, driving `readSubtractions` and carrying
its own positive control — is the yardstick, it exists, and it passes.
**Pre-commitment 2 does not fire.** The card discloses honestly that the
criterion says "ONE subtraction" while the file has TWO
(`docs/CONVENTIONS.md` and `docs/ROADMAP.md`); neither is in the
adapter's named set, so the applied set is identical either way. A3.0's
ambiguity is real and the lane resolved it in the open.

**AC-4 — MET, both limbs, and the second is exercised rather than
degenerate.** The artifact carries `THE FRAME YOU ACTUALLY HAVE: this
artifact is ONE message, so on its own it is the single-message fallback
and never the pair method/roles/orchestrator.md 5d mandates`, in the
saved bytes, early. **Phase one pre-committed (4) that an unforced
fallback branch is UNEXERCISED.** The condition that forces it here is
named and structural rather than conditional — this command emits one
artifact, always — so the disclosure is unconditional and cannot be
omitted, which is stronger than a branch that must be reached. What is
never taken by THIS command is the FIRST limb; the pair is the bench's
two files, and the sentence says exactly that. **I record the shape
plainly rather than calling a disjunction met and moving on.**

**AC-5 — MET by construction, with its trigger deliberately and
correctly UNMET.** This is the one row where a grader could differ, so I
measured the lane's argument instead of accepting it. The criterion is a
`WHEN roles/verifier.md carries its contract table` conditional. I put
the thirteen-row table into `verifier.md` on disk and asked the
assembler what happens:

    integrator    REFUSES — 2 role files carry a contract table
                  (method/roles/executor.md, method/roles/verifier.md)
                  and method/roles/integrator.md carries none
    orchestrator  REFUSES — the same
    planner       REFUSES — the same

**Satisfying AC-5's literal trigger would refuse three more role files
by name**, and would make `verifier.md` its own contract (`own: true`),
which is precisely what criteria 1 and 2 forbid. The criteria as written
are internally inconsistent; the lane resolved the inconsistency in
favour of criteria 1–2, said so in the notes, and filed the residue as
T-205-s21. Its other limbs are met absolutely: M6(iii) shows 22 pinned
literals unbroken and 0 lines displaced, the reading restrictions are
untouched, and the deciding limb is discharged by the `## The report`
section, which names the bench's two spawns, the sealed digests and the
blind phase's property, plus one step-5 sentence that handles the row a
verifier does NOT need — the executor's frontmatter stamp — explicitly
rather than carrying it over. Phase one's A5.1, A5.2 and A5.3 and its D2
were all written against a table that does not exist; A5.1 and A5.3 are
therefore MOOT, and A5.2's substance is answered by M6(iii) rather than
by the table it was aimed at.

**AC-6 — MET, and the mutant reds BY NAME.** Drill V3 plants T-254-s4's
exact producer filter and the failure is
`the verifier's pack is not the set its own role file names`, with the
diff showing `- "method/roles/executor.md"` absent. **Requirement (iv),
kill-set containment, holds: 1 failed, 255 passed — the executor arms
stay green.** M5 shows the two roles' sets differ, so **pre-commitment 3
does not fire**.

**AC-7 — MET.** The pack is derived from the card's fence by the reader
map the executor's uses (the bullets are those cited by the fenced
scripts), it exits 0, phase 2 names the pack's path and its ref beside
the sealed inputs and says plainly that it is not under the seal, and
drill V2 demonstrates the fence-reaches-the-pack body is a real control.
X2 does not fire (M8).

#### Phase one's attack set, by identifier

| Attack | Verdict |
|---|---|
| A1.1 case-swapped rows | **DOES NOT FIRE** — rows 4/11/12 differ by 23/11/17 lines after role-word normalisation |
| A1.2 the "one place" quietly duplicated | **DOES NOT FIRE** — D1: a word changed in the contract's row 7 reaches the render |
| A1.3 rows hardcoded as integers | **DOES NOT FIRE** — D3: the set follows the contract's own sentence; no list in the module |
| A1.4 exit code does not discriminate | **DOES NOT FIRE** — the exit vocabulary discriminates (M2) and no cited body asserts on an exit alone |
| A2.1 derivation-shaped name, lookup body | **DOES NOT FIRE** — D4 answers `reviewer`; drill V1 reds a name-keyed implementation |
| A2.2 derived from the wrong part of the file | **DOES NOT FIRE** — the substituted rows carry the two-spawn shape, the digests and the blind phase's property |
| A2.3 the refusal becomes a silent pass | **DOES NOT FIRE** — nine damages, nine refusals; two relaxations, both printed and body-pinned |
| A2.4 fixture and reader share a helper | **DOES NOT FIRE** — bodies parse the live `verifier.md` off the tree, and the one git fixture MOVES the document's own table rather than retyping it |
| A3.0 the "ONE subtraction" ambiguity | **REAL, AND DISCLOSED BY THE LANE** — graded by the already-pinned property, as pre-committed |
| A3.1 row 3 is step 0 pasted whole | **DOES NOT FIRE** — row 3 is a closed document set, shorter than the executor's |
| A3.2 negative-substring test | **DOES NOT FIRE** — the set is asserted both directions; the executor's ADDS line is the discriminator |
| A3.3 row 3 typed against a moved standing set | **DOES NOT FIRE** — derived from the adapter files at the ref |
| A4.1 one artifact, two headings, called a pair | **DOES NOT FIRE** — the render claims the fallback, never the pair; 5d rules the shape out and I read 5d myself |
| A4.2 the disclosure is a log line | **DOES NOT FIRE** — M9: streams never folded; the sentence is at line 55 of 235 |
| A4.3 the unreachable branch | **PARTIALLY FIRES, ON THE OTHER LIMB** — the fallback is always forced and always said; the PAIR limb is what this command never takes. Recorded, not waved past |
| A4.4 the pair is produced and phase 1 leaks | **DOES NOT FIRE** — phase 1 is `git show <base>:<card>`, and says the ref it was read at |
| A5.1 the table is decoration | **MOOT** — no table was written |
| A5.2 placed around by displacing | **DOES NOT FIRE** — 0 base lines displaced, 22 pinned literals intact |
| A5.3 thirteen rows, three `s/executor/verifier/` | **MOOT** — no table was written |
| A5.4 restrictions stand, render contradicts them | **DOES NOT FIRE** — row 3's applied set is the restrictions applied, cross-checked against step 0 |
| A6.1 the mutant reds for the fixture's reason | **DOES NOT FIRE** — V3 reds by name, one body, executor arms green |
| A6.2 expectation computed by the subject | **PARTIALLY FIRES — see findings** |
| A6.3 the typed expectation is stale | **DOES NOT FIRE** — the body carries the current set plus a typed `toContain`, and drops the brittle byte total |
| A7.1 the executor's role forced | **DOES NOT FIRE** — the packs differ; V2 reds the arm's-own-role shape |
| A7.2 exit 0 over an empty pack | **DOES NOT FIRE** — 20 named bullets, all cited by the fenced scripts |
| A7.3 `existsSync` on a file just written | **PARTIALLY FIRES — see findings** |
| A7.4 a control that cannot fail | **DOES NOT FIRE** — V2 is the demonstration phase one owed; it reds |
| A7.5 render names one path, body reads another | **DOES NOT FIRE** — the body asserts the render CONTAINS the path it reads |
| X1 the front still exits 3 | **DOES NOT FIRE** — measured verbatim; and the front is untouched |
| X2 AC-7 needs a write the fence forbids | **DOES NOT FIRE** — the bench verb is inside the fenced module (M8) |
| X3 it assembles only on a built bench | **CONFIRMED AS A CONDITION, NOT A DEFECT — see findings** |

#### Findings that changed no row

1. **A6.2 partially fires, and it is worth the next seat knowing.** The
   both-directions comparison in the pack body uses `methodNamed` as its
   expectation, which is the producer. A mutation INSIDE `methodNamed`
   moves both sides together. What saves the body is its second arm — a
   TYPED `toContain("method/roles/executor.md")` plus the assertion that
   the executor's pack does NOT contain it — which is exactly the typed
   expectation phase one asked for, and which V3 exercises. The criterion
   literally defines its expectation as `methodNamed`'s output, so this
   is the criterion rather than a tautology; but only the typed arm is
   independent of the producer, and only that arm should be cited.

2. **A7.3 partially fires.** The integration body reads the pack off
   disk and compares its bytes to `plan.packText`, and asserts phase 2
   contains both the path and the ref — so it is not `existsSync` on a
   file written a line ago, and the render's claim and the read are bound
   by a real assertion. What it does NOT do is re-derive at the named ref
   in a separate process. The pack is a scratch artifact and is never in
   the object store, so "at the ref the render names" cannot mean what it
   means for a committed file; I record the gap rather than inventing a
   bar the artifact's nature cannot meet.

3. **X3 is a real condition of the repair.** This bench was fresh — no
   `node_modules` anywhere, no `lib/parser/dist`, no `app/dist`. The
   command refuses at load until `lib/parser` is built. That is
   pre-existing and `docs/CONVENTIONS.md` already names it ("since T-317
   tools/e2e NEEDS THAT BUILD BEFORE ITS SCRIPTS"), so it is a condition
   to state rather than a defect to reject. After the documented order —
   parser `npm ci` + build, app `npm ci` + build, e2e `npm ci` — every
   figure above reproduced.

4. **The brief's byte count is not a function of the ref alone.** The
   notes state 57731 bytes; I measure **57791** at `11f30881b8a8`. The
   render embeds the checkout's own path (`repository: ...`) and the
   card's live `status:` value, and the notes' figure was taken at
   `005426e6` from the lane checkout while this one is from the bench.
   The difference is the arrangement, not a defect — but a byte count of
   a brief needs the checkout named beside the ref to be reproducible,
   and neither figure carried it.

5. **Two governing documents sit over their warn lines**, both
   pre-existing and neither in this fence: `docs/STATE.md` at 8807 bytes
   against 8465 (fail at 10158), and
   `docs/conventions/dispatch-and-scratch.md` at 10401 against 10100
   (fail at 12120). `STATE.md` grows at every checkpoint, so this is
   worth the integrator's eye before the next one.

6. **T-205-s21's claim is exact.** I ran it: `--role integrator`,
   `--role orchestrator` and `--role planner` all exit 3, all for the
   single reason `no section headed "## The report"`, while `--role
   verifier` exits 0. Three role files went from refusing for four
   reasons to refusing for one, and the card that says so is filed and
   well-formed.

#### DISPATCH FAULTS AND PACK GAPS

- **The phase-1 tool grant is a promise, not a construction.** Phase one
  reported holding Read, Write, Edit, Bash, Agent and roughly 120
  deferred tools while both its brief and `roles/orchestrator.md` 5d say
  it has none. 5d's own argument is that "no wording prevents the second
  pair, because the wording is not the leak" — the same reasoning applies
  to the tool grant, and this bench did not make it. Phase one honoured
  it voluntarily and disclosed it, which is the only reason the pass
  stands. **This is the highest-value thing I found tonight and it is
  not about this card's diff.**
- **No pack gap.** My phase-2 brief carried the ground rules, the paths,
  both digests and the lane. Nothing I needed was missing, and I opened
  no document by the index fallback.
- Phase one's frame carried four disclosed leaks (an adapter quoted in
  full, a memory index, a git snapshot with five commit subjects, and a
  calibration list of failure shapes). They are disclosed per attack in
  its artifact. They sharpened X1, X3, A2.4, A5.1 and A5.2; none of those
  five changed a row in a way the leak decided, because each was settled
  by a measurement rather than by the attack's framing.

#### What the integrator owes at the merge

1. **The census, which is STALE and is the only red thing in the tree.**
   `capabilities:check` exits 1: committed **120697** bytes, a fresh
   generation is **121649** (+952, the ten new bodies). Run
   `npm run capabilities` from `tools/e2e/` and commit the regeneration
   as the last write before the merge commit.
2. **The battery AFTER the merge commit, not on the staged merge** —
   `gate-run` keys its token to HEAD's tree.
3. **Six mutant drills.** This verdict assigns NO correction and carries
   six blocks anyway, because they are the evidence that the ten new
   bodies are load-bearing. The verb will re-drill each one: plant, run
   `brief.spec.ts`, require the named body RED ALONE, revert. Each cost
   about 2.9 minutes here, so budget roughly **18 minutes**. Every one of
   them ran on this bench at **1 failed / 255 passed**.
4. The two fence overlaps against T-205 clear when this lane merges;
   they are the reason `--task T-205 --role verifier` is exit 1 rather
   than exit 0 today, and they are not a defect.

#### The drills — six blocks, each RED ALONE

```mutant
correction: the contract lookup is not keyed on a role name
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: the contract FILE is found in the tree, and two of them is a SECOND ROW SET that refuses
message: the contract file is a constant in the module rather than a read of the tree — this fixture keeps the table under another role file's name and the lookup answered the old one
--- old
  const ownRel = `method/roles/${ctx.role}.md`;
  if (carriesContractTable(ctx.roleMd)) return { rel: ownRel, md: ctx.roleMd, own: true };
--- new
  const ownRel = `method/roles/${ctx.role}.md`;
  if (ctx.role === "executor") return { rel: ownRel, md: ctx.roleMd, own: true };
  {
    const md = readDoc("method/roles/executor.md", ctx.root);
    return { rel: "method/roles/executor.md", md, own: false };
  }
```

```mutant
correction: the bench renders the VERIFIER seat's pack whatever role the arm holds
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE BENCH WRITES THE VERIFIER'S PACK AND PHASE 2 NAMES IT — produced, readable, and a function of the fence
message: the bench rendered the pack for the arm's own role rather than for the seat it is briefing
--- old
    role: "verifier",
    roleMd: roleText("verifier", ctx.root),
--- new
    role: ctx.role,
    roleMd: ctx.roleMd,
```

```mutant
correction: the verifier's pack keeps roles/executor.md
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE PACK'S VERIFIER HALF is exactly what methodNamed reads off verifier.md, both directions
message: the verifier's pack is not the set its own role file names
--- old
  const method = methodNamed(ctx.roleMd, roleRel, ctx.root);
--- new
  const method = methodNamed(ctx.roleMd, roleRel, ctx.root).filter((m) => m.rel !== "method/roles/executor.md");
```

```mutant
correction: row 11 finds the exit write by its marker, never by a step number
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: ROW 11 quotes the SEAT'S OWN exit write, and the step it sits in is read rather than counted
message: row 11 did not quote the verifier's own exit write
--- old
  const exit = exitStampStep(ctx.roleMd);
--- new
  const exit = { label: "6", text: numberedStep(ctx.roleMd, 6) };
```

```mutant
correction: the frame comes from the role file's own sentence, not from the role name
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE FRAME IS SAID IN THE ARTIFACT — never silently the single-message fallback
message: the frame follows the ROLE NAME rather than the role file's own sentence — which is the hardcoded-per-role shape this card's second criterion forbids
--- old
  const found = flat.indexOf(BENCH_PASS_PHRASE);
  if (found < 0) return [];
--- new
  const found = flat.indexOf(BENCH_PASS_PHRASE);
  if (ctx.role !== "verifier") return [];
```

```mutant
correction: BOTH of row 13's rule lines are attributed to the contract
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: ROW 13's rules come from the CONTRACT, because they govern the WHOLE brief
message: a rule that governs the WHOLE brief is attributed to a role file that does not carry the section it was read from
--- old
    value(`and the rule behind it: ${evidence}`, tree(ctx, `${contract.rel} rules section`)),
--- new
    value(`and the rule behind it: ${evidence}`, tree(ctx, `method/roles/${ctx.role}.md rules section`)),
```

The last of the six is the drill the executor reported as D5b — the
mutant that mis-attributes only ONE of row 13's two rule lines and
survives a `toContain` over the whole render. **The tightening is real
and load-bearing**: with the body as the lane left it, that mutant reds
on the filter assertion rather than surviving. I verified the tightening
by planting the mutant, not by reading the comment that describes it.
