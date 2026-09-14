---
id: T-295-s10
title: "The merge verb's drill step refuses a verdict whose assigned corrections are all wording and say in as many words that they carry no block — the role file's step 5b allows exactly that shape, so the verb stops on a verdict it should read as having nothing to drill"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the architect seat at the T-314-s6 merge, 2026-09-14"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14): to planned at priority 2 — the verb's drill stopped the T-314-s6 merge on the shape the role file allows; dispatched right after T-295-s9 merges, sharing its fence.
