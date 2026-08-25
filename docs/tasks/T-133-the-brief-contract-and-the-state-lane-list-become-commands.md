---
id: T-133
title: Two written contracts that nobody follows become two commands — a brief whose rows cannot be filled without naming their source, and a STATE whose lane list is derived rather than typed
feature: F-02
milestone: 4
priority: 4
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
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
