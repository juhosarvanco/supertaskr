---
id: T-113-s2
title: Concurrent lanes share ONE scratchpad directory, and the poison-drill convention names a fixed `drill` path inside it — two lanes drilling at once collide
status: suggested
suggested_by: executor claude-opus-5 @T-113
---

Measured on 2026-08-24 during T-113's lane, with T-088 and T-090 live in
parallel off the same base `9b03ae6`. This is an ENVIRONMENT fact rather
than a tree fact, so it carries the time it was read.

## What was observed

CONVENTIONS' POISON DRILL bullet requires arm (c): *"DRILL IN A DETACHED
SCRATCH WORKTREE AT A NAMED COMMIT, AND GIVE IT ITS OWN
`CARGO_TARGET_DIR` INSIDE ITSELF"*, and `method/lane-protocol.md`'s own
worktree bullet already records that *"the scratch directory is shared
(STATE's standing observation about prefixes), and so, it turns out, is
the worktree list."* That sentence is about READING the worktree list.
The stronger consequence is about WRITING:

1. **The scratchpad directory is one directory, not one per lane.** At
   13:33 it held this lane's `drill-m1.log`…`drill-m4.log` (13:08–13:10)
   interleaved with T-088's `drill-add.log`, `drill-run.log` and
   `drill.py` (13:29–13:31).

2. **A driver script written there is silently replaced.** This lane wrote
   a mutation driver at `<scratchpad>/mutate.py`; T-088 wrote its own
   driver to the same filename, and this lane's copy was overwritten in
   place. Harmless here only because this lane's drill had finished
   (mutations 13:08–13:10, sha256 restoration proofs 13:10, clean re-run
   13:11) before the overwrite.

3. **AND THE DRILL WORKTREE PATH COLLIDES OUTRIGHT, WHICH IS THE SHARP
   ONE.** Both lanes independently chose `<scratchpad>/drill`, and every
   lane worktree is a worktree of the SAME git repository, so
   `git worktree list` and the worktree REGISTRATION are shared too. Two
   lanes drilling in the same window means the second
   `git worktree add --detach <scratchpad>/drill <commit>` fails on a path
   that already exists — or, if the first lane deletes the directory
   without `git worktree remove`, the second inherits a stale registration
   and a prune it did not ask for. This lane's drill was added at 13:07
   and removed at 13:11; T-088's was added at 13:29. Eighteen minutes.

4. **A THIRD LANE THEN TOOK THE SAME PATH, WHICH TURNS ONE COINCIDENCE
   INTO A PATTERN.** At 13:42:53 `git worktree list`, read from THIS
   lane's worktree, returned five entries — main, the three lane
   worktrees, and
   `<scratchpad>/drill  f20f786 (detached HEAD)`, which is **T-090's**
   drill at T-090's own tip. So within one session three lanes
   independently chose the identical path, and the registry that would
   have refused the second of them is visible from all three. **The
   shared registry is the measured half**: a lane can SEE its siblings'
   scratch worktrees, which is the same fact `method/lane-protocol.md`
   already records, read here from the writing side.

## What is measured and what is REASONED, kept apart

The sharing is measured (points 1, 2 and 4 above). **The collision itself
was deliberately NOT provoked**: forcing it would mean running
`git worktree add` onto a path another live lane currently holds, and a
sibling lane's scratch worktree is that lane's property — the one thing a
fenced lane may not touch. That git refuses an add onto an existing,
registered path is documented behaviour, not a measurement taken here,
and this finding says so rather than dressing an inference as a reading.
Three lanes serially using one path is the observation; the collision is
the consequence, and it needs nothing more than the two overlapping in
time.

## Why it is not merely tidy

The failure is not a corrupted drill — it is a drill that cannot START,
arriving as a `git worktree add` error inside a session that is mid-way
through a mutation and has a restoration to prove. The lane most likely to
hit it is the one running the discipline correctly, and the error names a
path rather than a cause, so the session's first guess is that its own
earlier drill leaked.

## The fix, and it is one line of convention

Name the drill worktree after the CARD, not after the role:
`<scratchpad>/drill-T-NNN` (and, symmetrically, `<scratchpad>/drill-T-NNN/
.drilltarget`, which already lives inside it). Same for any driver script
a lane writes beside it. That makes the whole scratchpad collision-free by
construction under any number of parallel lanes, costs nothing, and needs
no coordination between sessions — which is the property that matters,
since lanes cannot see each other.

It belongs with whichever card next edits `docs/CONVENTIONS.md`'s POISON
DRILL bullet; **`T-090`'s fence (`[tools/e2e, .github/,
docs/CONVENTIONS.md]`) already contains it**, so absorbing it needs no
widening — the same argument STATE makes for handing `T-101-s3` to that
card.

## What is NOT claimed

Nothing here says a drill was damaged. This lane's restorations are proved
three ways at `55f9b1b` — an empty `git status` over the whole drill
worktree, a per-path sha256 against `git show 55f9b1b:<path>` for all
three touched files, and a clean re-run at 75/75 exit 0 matching the
baseline exactly — and the shared-directory overwrite happened twenty
minutes after that worktree was removed.
