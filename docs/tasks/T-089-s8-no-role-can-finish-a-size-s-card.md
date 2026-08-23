---
id: T-089-s8
title: The size-S ceremony tier abolishes the integrator, and the new lane protocol gives the integrator two jobs nobody else may do
status: suggested
suggested_by: verifier claude-opus-5 @T-089-verify
---

Found by hand-assembling a brief for a real size-S card (`T-096`,
`touches: [lib-parser]`) while verifying T-089. Row 11 of the new
dispatch-brief contract names two sources and, on a size-S card, they
contradict each other.

`method/tasks/TASK-FORMAT.md`, Ceremony by size:

> | S | executor + tests. **No verifier, no separate integrator.** |

`method/lane-protocol.md` rule 4:

> **The executor never touches the integration branch.** No commit, no
> merge, no push, no branch move…

`method/lane-protocol.md` rule 6:

> **The integrator removes the worktree** — after the merge and the
> checkpoint, not before. The executor never removes its own…

So on a size-S card: the executor may not merge, and there is no
integrator to merge; the executor may not remove its worktree, and there
is no integrator to remove it. A brief assembled to row 11 for a size-S
card carries all three sentences and is self-contradictory on its face.

**Half of this pre-existed and half is new.** `roles/executor.md` step 2
already said *"Never touch main"* before T-089 generalised it, so the
merge half is old. Rule 6 is new, and it closes the last exit: previously
nothing said the executor could not clean up after itself.

## Which way it should go is a real choice, not an oversight to patch

1. **The size-S executor IS its own integrator.** Say so in the ceremony
   row — *"the executor merges and checkpoints its own work"* — and make
   rules 4 and 6 conditional on the tier. Cheapest, and matches what
   "no separate integrator" was probably always meant to say.
2. **Size S keeps a merging role, just not a verifying one.** Then the
   ceremony row is wrong and should read *"executor + tests, then
   integrator; no verifier"*.
3. **Size S does not get a lane at all** — built on the integration
   branch directly, which is the only reading under which rules 4 and 6
   are simply not addressed to it. This contradicts lane-protocol rule 1
   ("one task, one branch, one worktree") unless that rule is scoped too.

Arm 1 is the likely answer, but it is the architect's, and whichever wins
has to move BOTH files — the ceremony table and the lane protocol — or
the contradiction just changes address.

## Check while you are there

Whether any size-S card in this repository actually ran this way, and
what happened to its worktree — because the answer is what says whether
arm 1 is a codification or a change. Derived at `b416efb`: none of the
live lanes is size S (`T-013`, `T-064` and `T-070` are all M), so the
sample is historical. `git log --diff-filter=D --name-only` over removed
worktrees is not a thing; the record is in the checkpoints, which state
whether the integrator removed a worktree it did not create.
