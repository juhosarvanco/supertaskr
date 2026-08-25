---
id: T-133
title: Two written contracts that nobody follows become two commands — a brief whose rows cannot be filled without naming their source, and a STATE whose lane list is derived rather than typed
feature: F-02
milestone: 4
priority: 4
size: M
status: verifying
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human adopted this on 2026-08-25** as items 1 and 2 of `T-131`'s five
process changes. **This card is the mechanical half; the prose half is
`T-132`'s.** They are separate cards because prose is exactly what failed.

## Why a check and not a rule

**Both of these are ALREADY written contracts, and both were violated all
night by the seat that owns them.**

`method/roles/orchestrator.md` says the brief *"is assembled to the
contract in roles/executor.md — **every row, from the sources that row
names**,"* and `executor.md`'s row 5 names those sources: the card's
`touches:`, **the repository's live worktree list on a task branch**, and
the slug↔path map with the authoritative field identified.

**Every dispatch brief written on 2026-08-25 violated that contract** —
not by omitting rows but by filling them from the dispatcher's context
rather than from the named sources. Measured consequences: at least one
error per brief; a lane list wrong four separate times; and in the worst
case an assertion that a lane *"notes"* something the lane records
nowhere, which a verifier would have ticked off as evidence.

**The prose was read closely enough to be quoted and still did not bind.**
That is the argument for a command. A rule that depends on a reader
remembering has a failure mode; a rule that depends on a construction does
not.

## What the two commands are

**ARM ONE — the brief contract, checkable.** A brief cannot be *validated*
after the fact, because a wrong figure and a right figure look alike. What
CAN be built is the thing that makes the right answer cheaper than the
remembered one: **a command that emits the contract's rows, each derived
from the source `executor.md` names for it**, so the dispatcher pastes
rather than recalls. The lane list from `git worktree list` filtered on
the branch; the fence from the card's own `touches:`; the slug↔path map
from each component file's `touch_slugs:`, which `executor.md` already
rules authoritative over the prose block.

**ARM TWO — STATE's volatile sections, derived.** STATE's lane list was
wrong repeatedly and four briefs copied the error forward. Counts, lane
lists and board state are all derivable; the narrative, the traps and the
owed @human looks are not. **The same command answers both arms**, because
the lane list is the row both consumers get wrong.

## Acceptance criteria

- **THE COMMAND SHALL DERIVE EVERY ROW FROM THE SOURCE `executor.md`
  NAMES FOR IT**, and SHALL NOT accept a value from anywhere else. **The
  set of rows SHALL be read from `executor.md` rather than transcribed
  into the tool** — a second list of rows is a second implementation
  (T-057), and it would go stale exactly the way the briefs did.
- **THE LANE LIST SHALL FILTER ON THE BRANCH, NEVER THE PATH.** Detached
  scratch worktrees sit at lane-shaped paths; the detached-to-lane ratio
  swung from 8:5 to 1:5 inside twenty minutes on 2026-08-25. **A pin SHALL
  drive a detached worktree at a lane-shaped path and require it absent
  from the output.**
- **EVERY EMITTED FIGURE SHALL CARRY THE REF IT WAS DERIVED AT.** This is
  the defect the card exists to stop; a tool that emits a bare number
  reproduces it faster than a human could.
- **THE PINS SHALL FAIL AGAINST THE PRE-FIX TREE** where the behaviour is
  new, and where a pin cannot fail today the card SHALL say so rather than
  ship a green that proves nothing (`T-080-s1`).
- **STATE SHALL LOSE ONLY WHAT THE COMMAND CAN ANSWER.** The narrative,
  the named intermittents and the owed @human looks stay. **IF removing a
  section would lose something no command can produce THEN keep it and say
  which** — a checkpoint that replaces judgement with a table is worse than
  one that repeats a count.
- **THE COMMAND SHALL BE RUNNABLE BY A DISPATCHER WITH NO LANE**, from the
  integration checkout, without writing anything. It is a read.

Verification: headless — `npm test` from `tools/e2e/`, exit read
**unpiped from `$?`**, count derived. **POISON DRILL on every new
assertion**, one side only, producer mutated and never the assertion,
mutated text read back with `git diff` before its run, restores proved
per-path by sha256, in a detached scratch worktree named for this lane and
**OUTSIDE the repository** — and note that the drill's pollution **outlives
its mutants**: a stale binary in the drill's target directory produced a
plausible, entirely false defect report on another lane the same night.
**A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.** Uniqueness of kill is a
claim to be **measured against the whole suite**, not asserted — a lane
tonight believed one poison killed one body when it killed three. **Ask
GRAPH REGEN rather than predicting, and ask again after any write**; a
regeneration has twice left every headline figure identical while the file
changed. **`npm run typecheck` from `app/` does not exist** and exits 1
with `Missing script`. @human: none.

## Implementation notes (executor claude-opus-5, lane `task/T-133-brief-and-state-derived`)

**WHAT WAS BUILT.** Two files under `tools/e2e/scripts/` and one spec.
`dispatch-brief.mjs` is the derivation and executes nothing on import;
`brief.mjs` is the runnable command, the `token-scan.mjs` / `lint-tokens.mjs`
shape and for that file's own stated reason. `tools/e2e/tests/brief.spec.ts`
holds twenty-one bodies. **Nothing outside `touches: [tools/e2e]` was
edited** — this card's own file and four filed suggestions are the whole
of the rest of the diff.

    node tools/e2e/scripts/brief.mjs --task T-133
    node tools/e2e/scripts/brief.mjs --state
    node tools/e2e/scripts/brief.mjs --task T-133 --state --full

Exit **0** assembled and nothing owed · **1** assembled and FOUND
something · **2** called wrong · **3** could not run — the house contract
`index --check`, `boot:check` and the DOCS GATE already share.

### Each acceptance criterion, met or routed

- **EVERY ROW FROM THE SOURCE `executor.md` NAMES, AND THE ROW SET READ
  RATHER THAN TRANSCRIBED — MET.** `contractRows()` parses the normative
  table, located by its four column headings and never by its contents,
  and throws by name on a renamed column, a wrong cell count, a row with
  no bold label, a duplicate label, an empty source cell or numbering
  that is not one-to-k. Derivers bind on the row's own bold LABEL rather
  than on its number, so an inserted row renumbers the table without
  moving an answer and a RENAMED row is reported by name. **The coverage
  runs both ways**: a row with no deriver prints `NOT DERIVED` with its
  source and is a finding; a deriver whose label the table no longer
  carries is a finding. That is SHAPE FIVE's remedy applied to a tool
  whose expectations are parsed rather than written.
- **THE LANE LIST FILTERS ON THE BRANCH — MET, and the fixture is no
  longer the strongest evidence.** `laneWorktrees()` is pure over the
  porcelain text and keeps only entries whose `branch` matches a pattern
  DERIVED from the spelling `docs/CONVENTIONS.md` publishes. The pin
  drives a fixture carrying a detached worktree at a lane-shaped path, a
  detached checkout NAMED after a card, and a worktree on a non-task
  branch at a lane-shaped path, with the real lane as the POSITIVE
  CONTROL — "T-902 is absent" is satisfied by a function that returns
  nothing, and only one of those is the property. **The live tree beat
  the fixture while this card was being built**: at 22:38 the list held
  `nputer-T-132-verify`; by 23:07 that was gone, `nputer-T-127-verify`
  had appeared, and by 23:12 there were FOUR detached T-127 checkouts at
  lane-shaped paths (`-verify`, `-verify-at1b51d61`, `-verify-drillPRE`,
  `-verify-drillPOST`). **A path filter would have reported T-127 as five
  lanes holding one fence five times.** The branch filter reported three
  lanes at every reading.
- **EVERY EMITTED FIGURE CARRIES ITS REF — MET, and it is structural
  rather than careful.** Output is built as RECORDS. A `value` with no
  provenance throws at render; a `note` may not contain a DIGIT at all,
  so the prose channel is closed to figures by construction. Two stamp
  kinds, and the split is `executor.md`'s own: a TREE fact (a count, a
  hash, a path list) carries `@ <ref>`; a LIVE-ENVIRONMENT fact carries
  `read <ISO> on <host>` and never a commit, which is the exception that
  rule names rather than trips over — and a worktree is a live fact by
  `docs/CONVENTIONS.md`'s own words.
- **THE PINS FAIL AGAINST THE PRE-FIX TREE — MEASURED for the one
  mutation whose subject exists on both trees, and SAID PLAINLY for the
  rest.** Three of the four mutants move code this card introduces, so on
  the pre-fix tree they cannot fail on a property — the module is not
  there, and a body that fails to import proves nothing (`T-080-s1`). M4
  mutates `docs/CONVENTIONS.md`, which exists on both. **At the fixed
  tree it kills three bodies; at the pre-fix tree `5036958` the identical
  mutation is 171/171 at exit 0 — ZERO killed.** Before this card the
  project's published lane branch spelling had no reader in any suite.
- **STATE LOSES ONLY WHAT THE COMMAND CAN ANSWER — the COMMAND is met and
  the EDIT is routed.** `--state` answers the lane list, the free/held
  fence ledger, the board census and the slug map, each stamped. It then
  states in prose that the narrative, the traps, the named intermittents,
  the rulings and the owed @human looks are NOT derivable, and prints
  `docs/STATE.md`'s own `##`/`###` headings beside the derived facts so a
  reader can see the sections it has no answer for rather than being told
  the list is complete. **`docs/STATE.md` is outside this fence**, so the
  edit itself is `T-133-s2`, which carries the section-by-section
  measurement.
- **RUNNABLE BY A DISPATCHER WITH NO LANE, WITHOUT WRITING — MET.** Zero
  dependencies (the frontmatter reader is minimal on purpose, and the
  spec measures it against `yaml` over **874** fields on every live card
  and every component file, 0 mismatches at `9ddca48`). The only port
  command is the one `docs/CONVENTIONS.md` permits for 1420, read-only. A
  body runs the CLI and asserts `git status --porcelain` and `HEAD` are
  byte-identical before and after.

### POISON DRILL — and the first attempt was VACUOUS, which is the finding

Detached scratch worktree at `9ddca48`, named for this lane, **outside
the repository** under the session scratch root. One side only: the
PRODUCER is mutated and never an assertion. No cargo, so arm (c)'s
`CARGO_TARGET_DIR` hazard does not arise; nothing in this lane compiles.

**THE FIRST DRILL PRODUCED FOUR GREEN "MUTANT" RUNS AND PROVED NOTHING.**
The drill script could not resolve `node`, so no mutation landed, and the
four mutant runs were four extra CONTROL runs at 192 green. Worse, the
restoration proof compared two EMPTY strings and printed `same=YES`:
`[ "$want" = "$got" ]` is TRUE when both are empty, so a check that
existed to prove a restore reported success having measured nothing.
**The `git diff` read-back is what caught it** — the mutated text was
read back before its run, as the POISON DRILL bullet requires, and it was
empty. The remedy was mechanical rather than careful: guards that ABORT
when the diff is empty or a hash is not sixty-four characters. **A second
cause hid behind the first**: `git` was not resolvable in that shell
either, so the guard then fired on an empty diff over a mutation that HAD
landed. Both are recorded because "the drill ran" and "the drill measured
something" are different claims, and only the read-back can tell them
apart.

**THE KILLS, MEASURED AGAINST THE WHOLE SUITE rather than asserted** —
a lane the same week believed one poison killed one body when it killed
three:

| arm | mutation, one side only | result |
|---|---|---|
| **CONTROL** | shipped | **192 passed, exit 0** |
| **M1** | `laneWorktrees` filters on `entry.path` instead of the derived branch pattern | **exit 1 · 2 failed / 190 passed** — the branch-filter pin and the live-worktree pin |
| **M2** | `render` returns the text without its stamp | **exit 1 · 3 failed / 189 passed** — provenance, the tree-vs-live split, and ARM TWO |
| **M3** | `contractRows` reads the role file off disk instead of the text it is handed | **exit 1 · 2 failed / 190 passed** — the follows-the-document pin and the throws-rather-than-empties pin |
| **M4** | `docs/CONVENTIONS.md` publishes `lane/T-NNN-<slug>` | **exit 1 · 3 failed / 189 passed** at the fix · **171/171 exit 0, ZERO killed** at the pre-fix tree `5036958` |

**M4 IS THE ONE THAT SAYS SOMETHING ABOUT THE REPOSITORY RATHER THAN
ABOUT THIS CARD.** It reds no `workflow-parity` body and no
`docs-input-gate` body, because those readers take the `Build & test`
section and the DOCS GATE bullet; the LANE bullet had no reader at all.
Three now read it.

Restoration proved per path by sha256 against `9ddca48` after every arm,
with `git status --porcelain` empty each time:

    docs/CONVENTIONS.md                    b0528df4e231d0ac949c85feaa9e080c21eb6ffe5746fdbb594968bc04f02e3c
    tools/e2e/scripts/dispatch-brief.mjs   d7deed4fb13544a9b432a8e49a901feb9ca31de4d28f175b3eab2e7799ffde91
    tools/e2e/scripts/brief.mjs            f50572fa0545715bac52cf7f51cd67e13bc2ae974bcbbf3bfdb04a56699e65ae
    tools/e2e/tests/brief.spec.ts          00429552acb53a1e932a0294dd8a254637592610c8369199ed7cf2912d1aabe9

The pre-fix arm's `docs/CONVENTIONS.md` was proved against `5036958`,
whose blob for that path is byte-identical to `9ddca48`'s (the same
hash above), because this lane does not touch it.

### What the tool found about the repository

- **NOTHING IS BROKEN.** At `9ddca48` the assembler settles every row:
  three live lanes, all three fences DISJOINT as SETS through the slug
  map, and the architecture doc's prose slug block agreeing with every
  component's `touch_slugs:` FIELD. Exit 0.
- **The board status a brief prints is a function of the TREE it is run
  in, and this lane is the worked example.** At this lane's tip `T-132`
  reads `planned`; on main at `e7db842` the same card reads `building`,
  because the dispatch stamp the architect skipped was written three
  hours after this lane was cut. Both readings are correct AT THEIR REF,
  which is why the stamp is not decoration.
- **Two derivations are deliberately WIDER than their subject**, both
  named in the module header rather than left to be discovered: row 9
  enumerates named bullets by TYPOGRAPHY because CONVENTIONS has no
  marker for a standing discipline (`T-133-s4`), and row 8 reports a
  bullet that names a gate while declaring no merge-diff trigger instead
  of dropping it.

### What I am least confident about

**The row-9 enumeration is a signpost derivation in a file that has three
stale signposts in one bullet already.** It cannot go stale in the usual
direction — it is read, not listed — but it can silently WIDEN when
somebody writes a new ALL-CAPS bullet that is not a discipline. `T-133-s4`
proposes the marker that would make it exact. Second: the module reads
`method/roles/<role>.md` for any role, and only the executor's row set
has derivers; a verifier's or integrator's brief follows the same
thirteen-row contract with role-specific rows substituted, and this
command would print `NOT DERIVED` for those rows rather than assembling
them. That is honest and it is not complete.
