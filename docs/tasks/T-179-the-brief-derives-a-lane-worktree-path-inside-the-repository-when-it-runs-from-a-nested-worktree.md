---
id: T-179
title: The brief derives a lane worktree path INSIDE the repository when it is run from a nested worktree — row 4 prints it under the heading "absolute, per lane-protocol rule three", which is the rule it breaks
feature: F-04
milestone: 4
priority: 9
size: S
status: building
blocked_by: []
suggested_by: architect/integrator seat @T-112-s3's dispatch (2026-08-30) — found by reading the brief it emitted
touches: [tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: none found.** `command grep -rli "worktree path" docs/tasks/`
at `2370144` finds no card owning this; the nearest neighbour is the
`--root` hazard in `docs/CONVENTIONS.md` (a command answering confidently
and wrongly because of WHERE it ran), which is the same genus one tool
over and is a doc bullet rather than a card. Filed rather than
corroborated for that reason.

## The measurement, at `2370144`

`node scripts/brief.mjs --task T-112-s3` run from a nested worktree
(`/Users/ujju/Projects/nputer/.claude/worktrees/adoring-nash-028cf4`)
emitted, in ROW 4:

    worktree (absolute, per lane-protocol rule three):
      /Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-112-s3
      <- docs/CONVENTIONS.md lane bullet worktree spelling

That path is **inside the repository**. `method/lane-protocol.md` rule
three says in as many words: *"The worktree is a sibling directory, never
a path inside the repository"* — and the brief prints the violating path
under a heading that cites the rule.

The dispatching seat cut the lane at the correct sibling path
(`/Users/ujju/Projects/nputer-T-112-s3`) because it read the rule rather
than the row, and corrected the executor in its launch prompt. **A seat
that trusted the brief would have created exactly the case rule three
exists to forbid** — and rule three's own text says why that is not
cosmetic: a worktree under the root is a second copy of every file to
every walker, and it becomes an untracked directory in the integration
checkout's status, so a wildcard stage there stages a whole second
project.

## The mechanism

CONVENTIONS publishes the worktree spelling as `../nputer-T-NNN` — a
RELATIVE path, resolved by the brief against the checkout it ran in. From
the integration checkout `/Users/ujju/Projects/nputer` that resolves to
the intended sibling. From a nested worktree it resolves one level inside
`.claude/worktrees/`, and nothing notices, because the spelling is
correct and only the base moved. **This is rule three's own stated
failure — *"a RELATIVE worktree path resolves against whatever directory
the dispatching shell happens to sit in"* — arriving through a DERIVED
row instead of through a typed command**, which is worse: a typed command
is the typist's, and a derived row carries a provenance stamp that invites
trust.

It is live now rather than hypothetical: the architect/integrator seat
runs from a nested worktree by construction in this harness, so every
brief that seat generates carries the wrong path.

## What a fix decides

1. **Whose base?** The honest candidate is the REPOSITORY's main
   worktree (`git rev-parse --path-format=absolute --git-common-dir`'s
   parent, or `git worktree list`'s first entry) rather than the running
   checkout — a lane is a sibling of the REPOSITORY, not of whoever
   dispatched it.
2. **Or refuse.** A brief that cannot tell where the repository's own
   root is could emit NOT DERIVED with its source, which is the shape
   this command already uses for rows it cannot derive — better than a
   confident wrong path, and it is the tool's own established idiom.
3. **And the same question is owed for every other row derived from a
   relative spelling** — the sweep is the deliverable, not just this
   row. Record it EVEN IF EMPTY (CONVENTIONS, A FIX NAMES ITS CLASS AND
   ITS SWEEP).

## Disposition hint

Small and self-contained in `tools/e2e` — outside the graph walk, so
dispatchable under any graph-budget hold. It contends with any other live
`tools/e2e` lane, which is the only reason it is not trivially parallel.

## TRIAGE (2026-08-31, standing triage sitting #5 — called by a BAND) — PROMOTED F-04 p9, and its evidence tripled overnight

Filed after one sighting. By this sitting **every executor dispatched
tonight reported it independently** — `T-112-s3`, `T-140-s4`, `T-172`,
`T-177` each opened their brief, read ROW 4's worktree line, and found
it naming a path inside the repository under a heading citing the very
rule it breaks. Four lanes, four correct reports, zero lanes that
actually cut themselves in the wrong place.

**THAT IS THE ARGUMENT FOR FIXING IT AND ALSO THE REASON IT IS NOT
URGENT**: the brief is wrong, and every reader so far has been careful
enough to catch it. The dispatching seat corrected each of them in the
launch prompt, which is a discipline standing in for a construction —
exactly the trade this project keeps converting the other way.

It is fenced `[tools/e2e]`, outside the graph walk, and contends only
with whatever else holds that package.
