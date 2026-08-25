---
id: T-132-s3
title: Two of T-132's three violations have their rule-home outside T-132's fence — the brief contract and the reader half of the out-of-fence rule are unrecorded
status: suggested
suggested_by: executor claude-opus-5 @T-132
touches: [method/roles/orchestrator.md, method/roles/executor.md]
---

**Routed rather than reached, under `method/roles/executor.md`'s own rule
that a criterion which cannot be built inside the fence is not built.**

T-132's criterion reads: *"THE THREE VIOLATIONS SHALL BE RECORDED WHERE
THE RULE IS, not only here."* Two of the three rules live outside
T-132's `touches: [method/lane-protocol.md, method/roles/integrator.md,
method/tasks/TASK-FORMAT.md]`.

**1. THE BRIEF CONTRACT.** Verified present at `74feb67`:
`method/roles/orchestrator.md:30-31` — *"The brief is assembled to the
contract in roles/executor.md — every row, from the sources that row
names"* — with the sources named in `method/roles/executor.md`'s row 5
(the card's `touches:`; the repository's live worktree list on a task
branch, which takes precedence over the board; and the slug↔path map with
the `touch_slugs:` FIELD authoritative). **Every dispatch brief written on
2026-08-25 violated it**, not by omitting rows but by filling them from
the dispatcher's context instead of from the sources the row names — at
least one error per brief, a lane list wrong four times, and in the worst
case an assertion that a lane "notes" something the lane records nowhere.
**Neither file is in T-132's fence, so the violation is recorded in
T-132's card and nowhere near either rule.**

**2. THE READER HALF OF THE OUT-OF-FENCE RULE.** T-132 landed the
*writer* half in `method/tasks/TASK-FORMAT.md`, beside the
criteria-writing guidance, with its attribution. The *reader* half is
`method/roles/executor.md:126-128`, which is where the lane that performed
the out-of-fence deletion was reading. **A cross-reference from that
bullet to the new card-author clause is one sentence and is outside
T-132's fence.**

**AND THE THIRD VIOLATION IS RECORDED, so this suggestion covers two and
not three**: the stamp-after-cut error went in beside
`method/tasks/TASK-FORMAT.md`'s "THE DISPATCH STAMP HAS AN OWNER AND AN
ORDER" bullet, which is in fence.

**THIS SUGGESTION IS ALSO ITS OWN THIRD DATA POINT.** T-132's card argues
that a prose contract failed to bind the seat most responsible for it. The
seat that assembled T-132's own brief made **six** factual errors this
lane recorded (see T-132's implementation notes), every one of them
derivable from the tree in one command — which is the same failure a
fourth time, on the card written about it.

**Note the fence overlap for whoever dispatches this**: `T-128` is
`planned` with `touches: [method/, docs/CONVENTIONS.md]`, which under the
path-granularity ruling now covers both files named here. The two cannot
run concurrently as written.
