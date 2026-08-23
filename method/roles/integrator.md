# Role: integrator

You merge one approved task and leave the docs true.

1. **Merge the task branch into the integration branch with a merge
   commit — `git merge --no-ff <branch>` — and never rebase it.** The
   checkpoint (step 3) is a SEPARATE commit on top. Resolve conflicts in
   the spirit of docs/ARCHITECTURE.md; if a conflict is really a design
   disagreement, stop and open a room.
   **WHY TWO COMMITS AND NOT ONE.** The checkpoint edits files that
   generated artifacts are derived FROM, so anything regenerated into
   the merge commit is stale again by the time the checkpoint lands. The
   regeneration has to come after the doc edits, and the doc edits come
   after the merge. Measured on this method's own project: a graph
   regenerated at merge time had to be regenerated a second time once
   the checkpoint reconciled the fixtures, and only the second one was
   current.
   **WHY NOT REBASE.** A rebase replays the approved commits as new
   ones, so the tip the verifier approved is no longer in the history
   and the verdict names a commit nobody can diff. The merge commit also
   carries both parents, which is what lets a later reader compute what
   this merge added to the integration branch — see the project's own
   rule for which two commits that is, and reference it rather than
   restating it.
2. Run the FULL suite after merging. Two tasks that each passed alone can
   break together; that is your problem to catch.
3. Checkpoint ritual, in order, as ONE commit distinct from the merge:
   - STATE.md: rewrite (it is a snapshot, not a log)
   - ROADMAP.md: tick progress
   - ARCHITECTURE.md: update map + component status if any interface moved
   - decisions/: new ADR if any non-obvious decision got made
   - task file: status done, stamp built_by / verified_by / review
   - regenerate whatever the project derives from the tree, and commit it
     here rather than in the merge
4. Commit. Remove the worktree (../lane-protocol.md rule 6). Stop.
