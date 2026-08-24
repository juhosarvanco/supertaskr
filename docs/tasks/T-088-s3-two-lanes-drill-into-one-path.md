---
id: T-088-s3
title: Two concurrent lanes drill into the SAME scratch path, and each driver's guard cannot tell them apart
status: suggested
suggested_by: executor claude-opus-5 @T-088
---

**Measured live on 2026-08-24, not anticipated.** T-088 and T-090 ran as
concurrent lanes. Both obeyed CONVENTIONS' POISON DRILL rule — *"DRILL IN
A DETACHED SCRATCH WORKTREE AT A NAMED COMMIT"* — and both independently
chose the literal path `<scratchpad>/drill`. Both then wrote a mutation
driver to `<scratchpad>/mutate.py`. The second one **overwrote the
first**, and `git worktree list` from inside T-088's lane showed a
`drill` worktree on a DETACHED HEAD at `f20f786` — T-090's tip, not
T-088's.

**THE SCRATCH DIRECTORY IS SHARED AND ITS PATH LOOKS PRIVATE.** It
carries a session UUID
(`/private/tmp/claude-502/-Users-ujju-Projects-nputer/<uuid>/scratchpad`),
which reads as session-scoped and is not: the directory held T-088's
`docs-gate-*.log` and `cargo-2.log` beside files T-088 never created
(`boot-check.log`, `demo-red.log`, `dig-1.log`, `bindprobe.mjs`). The
lane protocol already records the general fact — *"the scratch directory
is shared (STATE's standing observation about prefixes), and so, it
turns out, is the worktree list"* — but it records it as a REPORTING
nuisance (expect other lanes' worktrees in your `git worktree list`).
This is the same sharing as a WRITE hazard, which is a different claim.

**THE MECHANICAL GUARD DOES NOT COVER IT, AND THAT IS THE POINT.** After
T-085's `perl -i` accident, drill drivers gained a path refusal, and the
T-088 driver's was: absolute, and inside `<scratchpad>/drill`. T-090's
driver, written independently by another session, has the same check
against the same constant. **So each driver's guard passes on the OTHER
lane's drill worktree**, because the property it tests — "is this path
under the drill directory" — is true of both. The refusal was built to
answer *"is this the drill or the real tree"* and it silently answers a
weaker question: *"is this A drill"*.

**What actually kept it safe this time was git, not the discipline.**
`git worktree add` REFUSES a path that already exists, so the second lane
gets a loud failure at CREATE time. That protects the create and not the
mutate: a driver run while a sibling lane's drill occupies the path would
mutate the sibling's tree, its own restoration proof (`sha256` against
*its* commit) would be measured on a file it never should have touched,
and the sibling's suite could go red — or worse, green — for reasons
nothing in its transcript explains. T-088's drill was removed and pruned
before T-090's existed, and every one of its nine restorations proved
against `a2a691b`, so nothing was corrupted here. **This is a near miss
recorded as one, not an incident.**

**The fix is one line and it belongs in the CONVENTIONS bullet that
creates the hazard.** Name the drill after the LANE:
`<scratchpad>/drill-T-NNN`, and have the driver's refusal test that
specific path rather than a shared prefix. It costs nothing, it makes
`git worktree list` legible when two lanes are drilling (each entry
names its card, which the current detached entry does not), and it turns
the guard back into the question it was written to ask. Fence
`docs/CONVENTIONS.md`. Worth pairing with the lane-protocol sentence
about shared worktree lists, so the reporting note and the write hazard
are stated in one place instead of one implying the other.
