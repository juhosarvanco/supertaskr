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
   duplicate findings arrive attributed to whoever is nearest. It also
   becomes an untracked directory in the integration checkout's own
   status, so a session that stages by wildcard there stages a whole
   second copy of the project.
   **STATE THE PATH ABSOLUTELY, OR VERIFY THE WORKING DIRECTORY FIRST.**
   This is a clarification of the sentence above rather than a new rule,
   and it is written because the rule has been obeyed and broken by the
   same command: a RELATIVE worktree path resolves against whatever
   directory the dispatching shell happens to sit in, `git` has no
   opinion about where a worktree lands, and there is no error — so a
   sibling path typed one directory too deep silently creates the inside
   case this rule forbids. Whoever cuts the lane owns this, and a lane
   that discovers it should report the real path rather than move itself.

4. **NO SEAT BUT THE INTEGRATOR'S WORKS IN THE INTEGRATION BRANCH'S
   CHECKOUT.** No commit, no merge, no push, no branch move, **no
   dependency install and no test-suite run** against that checkout. If
   the lane needs something that exists only there, it waits for the
   integrator or opens a room. **The one exception is the smallest
   ceremony tier**: a size-S card has no separate integrator
   (tasks/TASK-FORMAT.md), so its executor plays integrator for its OWN
   work once its tests pass — it merges, checkpoints and removes its own
   worktree. Every larger tier keeps the two roles in different hands.
   **A SIZE-S CARD MAY STILL OWE A VERIFIER**, and the two questions are
   separate: the ceremony table gives an S card touching shipped code a
   verifier while leaving self-integration in place. Where it does, the
   executor waits for the VERDICT before playing integrator. "No separate
   integrator" has never meant "no verification"; read the table's row,
   not the tier letter.
   **THIS RULE SAID "THE EXECUTOR" UNTIL THE SEAT IT NEVER NAMED BROKE IT
   TWICE IN ONE SESSION.** `architect` appeared nowhere in this file nor
   in roles/orchestrator.md, and the seat that dispatches, triages and
   files cards is the one that writes to that checkout most often — so it
   read a rule addressed to somebody else and obeyed it exactly. **A
   prohibition that enumerates seats grows a hole for every seat added
   after it.** The complement of ONE seat has none, which is why the rule
   is now spelled that way round.
   **THE TEST RUN IS THE ADDITION AND IT IS THE WORSE HALF.** An install
   is the destructive case everyone anticipates. **A test run only READS,
   so it looks harmless — and it is the one that actually collided.**
   Every other shared surface a lane can corrupt obstructs or confuses;
   **this one CERTIFIES.** An integrator's suite result is what a merge is
   signed off on, and a second runner corrupts it in both directions at
   once: a spurious RED the integrator spends its time investigating, or a
   spurious GREEN that prompts no second look at all. **Nothing in the
   tree records that a second runner was present** — status is clean, no
   lock exists, and the checkout looks idle.
   **THE REMEDY IS TO SEPARATE THE WRITE FROM THE VERIFICATION, NOT TO
   FORBID THE CHECKOUT.** A blanket "never touch it" is wrong and will be
   ignored, because it is contradicted by practice every day: an atomic
   commit is safe, and has been performed under a running integrator at
   that integrator's own request. **What collides is the long-lived suite
   run.** So a seat with standing to write there writes DIRECTLY and
   briefly, and runs its gate-owed suites **in a checkout of its own** — a
   sibling detached worktree (rule 3) carrying its own installed
   dependencies. That checkout is cut and installed once and costs nothing
   afterwards; the first card on this method's own project to be gated
   from outside the integration tree is the card that added this clause.
   **DETECT-AND-REFUSE IS THE BACKSTOP AND IS DELIBERATELY NOT SPECIFIED
   HERE.** roles/integrator.md rule 1 already carries that shape in full,
   with the positive control that makes it a check rather than a ritual —
   read it there rather than re-deriving it. Note what it does and does
   not cover: it detects a live PRODUCT, and a live INTEGRATOR is a
   different holder needing a different probe. **Build that probe only if
   the clause above and the habit beside it leak.** It is machinery; the
   other two are a clause and a habit, and machinery is the expensive
   answer to a problem the cheap ones have not yet failed at.
   **RECORDED WITH ATTRIBUTION, BECAUSE AN UNATTRIBUTED RULE READS AS
   ADVICE.** Both violations are the ARCHITECT's, hours apart in one
   session on this method's own project. **(a)** Staging into the
   integration checkout's index while an integrator held it; that
   integrator spent about four minutes deciding whether the tree was safe
   to write. **(b)** Running the full end-to-end suite in that checkout
   while a *second* integrator worked there: **2 failed / 169 passed** — a
   thirty-second click timeout, and an `Invalid package config` naming a
   manifest that was valid and that the checkout's own status reported
   untouched. **Re-run alone: 171 / 171, exit 0.** Both failures were
   collision artifacts and neither was a defect. **The finding about (a)
   was filed three hours before (b) was committed**, by the same seat,
   which is the fact that decides the shape of this rule: the seat had
   read the finding, agreed with it, and still could not see itself in a
   sentence that named the executor.

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
   checkpointed.** **WHETHER THERE IS A VERDICT TO PRESERVE IT FOR
   DEPENDS ON THE CEREMONY TABLE'S ROW, NOT ON THE TIER LETTER.** An S
   card whose diff is outside shipped code has none, and its worktree may
   go as soon as the checkpoint lands. An S card that took a verifier has
   one, and the sentence at the top of this rule binds it exactly as it
   binds M and L: the worktree survives until the verdict, because a
   worktree deleted before the verdict destroys the only reproducible
   copy of what was measured.

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
