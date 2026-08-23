# The lane

A lane is the isolated place one task gets built. One task, one branch,
one worktree, one session — and the integration branch is none of them.

**The names below are placeholders.** A project spells them once, in its
own CONVENTIONS, and every role reads that spelling instead of inventing
one: what the integration branch is called, the branch-name pattern, the
worktree-name pattern, and which commits qualify as a base. Nothing in
this file is a project's actual name.

## The rules

1. **One task, one branch, one worktree.** Two tasks never share a lane,
   and one task never spans two. A task that needs a second worktree was
   sliced too coarsely — split the task (interview/decomposition.md),
   never widen the lane.

2. **Cut the branch from the newest KNOWN-GREEN commit on the
   integration branch, and never from a merge commit.** A merge commit
   is the state *before* the integrator finished: whatever the checkpoint
   regenerates is still stale inside it, so a lane cut from one inherits
   a red gate it did not cause and its fence forbids it to fix. Which
   commits qualify is the project's to name — where a project
   checkpoints after every merge, the newest checkpoint is the base, and
   a later non-merge commit on the same branch is equally safe PROVIDED
   its own gates are green — a base is trusted for its green gates, not
   for being a checkpoint, and a non-merge commit can still trip a gate a
   graph check does not cover.
   **STATE THE BASE AS A HASH.** "Latest" names a different commit for
   every reader and a different one an hour later.

3. **The worktree is a sibling directory, never a path inside the
   repository.** A worktree under the repository's own root is a second
   copy of every file to everything that walks the tree — linters,
   indexers, test discovery, the project's own file watchers — and the
   duplicate findings arrive attributed to whoever is nearest.

4. **The executor never touches the integration branch.** No commit, no
   merge, no push, no branch move, no dependency install run against
   that checkout. If the lane needs something that exists only there, it
   waits for the integrator or opens a room. **The one exception is the
   smallest ceremony tier**: a size-S card has no separate integrator
   (tasks/TASK-FORMAT.md), so its executor plays integrator for its OWN
   work once its tests pass — it merges, checkpoints and removes its own
   worktree. Every larger tier keeps the two roles in different hands.

5. **Concurrent lanes have disjoint `touches:`** — the orchestrator's
   guardrail (tasks/TASK-FORMAT.md), and the executor's too. An executor
   whose work reaches outside its own `touches:` has found a dispatch
   error, not a licence: record it, route it, and build the part that
   fits. A fence is not widened from inside the lane it fences.

6. **The integrator removes the worktree** — after the merge and the
   checkpoint, not before. The executor never removes its own: a
   worktree deleted before the verdict destroys the only reproducible
   copy of what was measured. Whether the branch survives the worktree
   is the project's rule. **On a size-S card there is no separate
   integrator (rule 4, tasks/TASK-FORMAT.md): the executor IS the
   integrator and removes its OWN worktree — after it has merged and
   checkpointed, and with no verdict to preserve it for.**

7. **The lane list is a fact on disk, not a memory.** Which lanes exist
   is answered by asking the repository (its worktrees and branches),
   which is what makes the fence checkable by a session that was not
   present when the others were dispatched.

## Why the branch carries the dispatch stamp and the lane does not

`status: building` is written on the integration branch **before** the
branch is cut (tasks/TASK-FORMAT.md, lifecycle). The lane therefore
inherits the stamp in its own base commit and never writes that line at
all — which is the whole reason the order is fixed rather than
conventional. A stamp written inside the lane and a stamp written on the
integration branch are two edits to one line, and the merge has to be
resolved by hand.
