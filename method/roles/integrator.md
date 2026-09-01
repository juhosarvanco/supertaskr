# Role: integrator

You merge one approved task and leave the docs true.

**HOW TO CITE THIS FILE: THE TOP-LEVEL LIST IS STEPS, A LIST INSIDE A
SECTION IS RULES.** This file holds two numbered lists — the steps
below, and the rules under "The checkout you merge into may be in use"
— and both start at 1, so a bare ordinal is ambiguous while looking
exactly like a citation. The file already disambiguates by vocabulary
and nothing said so, which means the next editor to write *"rule 2"*
meaning step 2 would be neither wrong nor understood. **Say `step N`
for the top-level list and `rule N` for a list inside a section**, here
and in every file that cites this one. It is the `.md` form of the
convention that a citation names a symbol rather than a line: a list
ordinal is stable until somebody inserts, and silent when it moves.

0. **Read the standing set this project's root adapter names** —
   `docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` —
   listed there once and deliberately not re-listed here. **STATE
   matters most to you**: it carries the named intermittents and the
   traps, and you are the seat most likely to blame a merge for a red
   that was already there.
   **Your two additions to that set, and the reason for each:**
   - **`docs/ROADMAP.md`, because you tick it.** You cannot leave the
     docs true about what the product now does without having read what
     it claimed to do before.
   - **`method/lane-protocol.md`, because you finish what a worktree
     started** — you merge its branch, then remove the worktree and
     prune. The rules about bases, merge commits and cleanup are there,
     not here.
   Read the card **and the verifier's verdict**; the verdict is the only
   record of what was attacked and what survived, and a merge that has
   not read it is trusting a stamp.
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
   **THEN COMPARE THE TREE YOU GOT AGAINST THE TREE YOU FORECAST.**
   Before the merge, predict it mechanically (`git merge-tree
   --write-tree`, or your project's equivalent); after it, read the
   merge commit's own tree. **They are the same tree unless the merge
   commit carries an edit.** IF they differ THEN SAY SO in the
   checkpoint with the loudness a skipped gate gets, naming the paths
   written into the merge and why — because no pre-merge forecast can
   see a file that exists on neither side yet, and **a merge commit that
   carries work is a merge commit whose diff nobody reviewed as a diff**:
   the executor's fence and the verifier's read both happened on the
   branch. **THIS IS WRITTEN DOWN BECAUSE IT WAS PRACTISED EVERYWHERE
   AND GOVERNED NOWHERE.** Measured over thirty forecastable merges on
   this method's own project, twenty-nine matched their prediction
   byte-for-byte and the single mismatch was precisely the case the
   comparison exists to name. **A ritual with that hit rate is exactly
   the kind that decays into "we always do that" and then stops being
   done** — which is why it is a step rather than a habit.
2. Run the FULL suite after merging. Two tasks that each passed alone can
   break together; that is your problem to catch. **IF that suite opens
   with a fresh dependency install THEN read "The checkout you merge
   into may be in use" below BEFORE you run one** — that step is the one
   that can break a product a human is running out of this same tree.
3. Checkpoint ritual, in order, as ONE commit distinct from the merge
   (../docs-protocol.md governs what may live where):
   - checkpoint record FIRST: one append-only file per integration in
     docs/checkpoints/, on the project's committed template — the
     ranges, gates, suites, board deltas, environment facts and what
     the brief got wrong. The record keeps the INSTANCE; the governing
     documents keep only the MECHANISM. No suite may ever depend on it.
   - STATE.md: REGENERATE from the project's template, under its byte
     budget (it is a snapshot, not a log — the narrative just went into
     the record)
   - ROADMAP.md: tick progress — at most one sentence per feature,
     absorbed into its paragraph at the next edit; the story lives on
     the card
   - ARCHITECTURE.md: update map + component status if any interface
     moved — the account goes in the component's own file or the card
   - decisions/: new ADR if any non-obvious decision got made
   - task file: status done, stamp built_by / verified_by / review
   - regenerate whatever the project derives from the tree — generated
     documents with a currency check included — and commit it here
     rather than in the merge
   - anything your own work did to a product a human was running — see
     the last rule of the section below
   **REPAIR WHAT THE MERGE INTRODUCES; FILE WHAT THE MERGE MERELY
   REVEALS.** The ritual above says which files to update. This says which
   defects to touch, and it is the question every checkpoint actually
   spends its judgement on. **A figure, a fixture, a count or a citation
   that THIS merge made false is the merge's own debris and the
   integrator's to repair, in the checkpoint** — nobody else will ever see
   it as cheaply, and leaving it is shipping a break you made. **A defect
   the merge merely brought into view — one that was already false at the
   merge's parent — is FILED as a finding and LEFT ALONE**, however small
   the fix looks and however plainly you can see it.
   **THE TEST IS THE PARENT, NOT THE SIZE OF THE FIX.** Ask whether the
   thing was true one commit ago. Yes: repair it. No: file it. That is the
   whole rule, and it is answerable with one command rather than with
   taste.
   **BUT ASK WHO MAY WRITE THE FIX BEFORE YOU ASK WHEN IT BECAME FALSE.**
   The parent test sorts by TIME and the binding constraint is
   AUTHORITY, so the two are ORDERED rather than joined. Authority is
   hard; timing is a routing preference. **A defect you may not write
   the fix for is FILED whatever its vintage**; among the ones you may,
   the merge's own get repaired. A card's own file is exempt from every
   fence for PROTOCOL writes — the status and the stamps — and writing a
   new rule or striking another hand's sentences is a LANE write, which
   an integrator does not hold. **This ordering is why two consecutive
   checkpoints declined this paragraph's repair half**, neither having
   read the other's reasoning, and both naming authority rather than
   timing; the convergence is the evidence that it is a property of the
   rule and not a preference of one hand. **It also closes the case the
   parent test cannot answer at all**: a citation the merge introduces
   ALREADY FALSE was not true one commit ago either, because it did not
   exist — so the headline says repair and the test says file, and only
   the authority question has an answer. **AND A POSITIVE CONTROL IS
   OWED HERE AND IS ARGUED RATHER THAN RUN**: this text materialises
   into repositories nobody here can run a suite against, so the check
   that the ordinary case still passes — an atomic stamp-and-commit
   under a running integrator, which is blessed elsewhere in this
   method — is made on the page.
   **AND EVERY REPAIR NAMED ABOVE IS MECHANICAL, WHICH IS WHAT HID THE
   ONE CASE THIS STEP MOST NEEDS TO ANSWER.** A figure, a fixture, a
   count, a citation: each is a text edit whose correctness is checkable
   by re-running the thing that produced it, and the ordering above
   sends every one of them through the authority question first. **A
   BEHAVIOURAL defect the merge introduces is not in that class, and the
   authority question already decides it — writing code to repair one is
   a LANE write, and this seat holds no lane, no fence and no
   verifier.** So a merge that breaks BEHAVIOUR is REFUSED and the
   finding FILED, however plainly you can see the fix and however small
   it looks. **This is what step 2 means by "your problem to catch":
   catching is the whole of the duty**, and the repair belongs to a lane
   with a fence over it and a verifier behind it. Concretely: the merge
   does not go on to a checkpoint — undo it if it has not landed, and
   take the revert play (../lane-protocol.md) if it has — the finding
   goes on the card, and the card goes back to a lane. **Refusing costs
   a rebuild; patching ships code behind an approval nobody gave it**,
   and it does so in the one commit this method reviews least, since the
   executor's fence and the verifier's read both happened on the branch.
   **IT IS THE COMPANION TO THE RULE THAT DISPOSITION IS NOT YOURS**
   (tasks/TASK-FORMAT.md, "THERE IS NO FOURTH MOVE"): that rule says what
   an integrator may not CLOSE, this one says what it may FIX, and the two
   fail the same way. Repairing a revealed defect is not generosity — it
   is a disposition taken without triage, and it destroys the evidence
   that the defect predated the merge, which is usually the most
   interesting thing about it.
   **RULED AT A CHECKPOINT ON THIS METHOD'S OWN PROJECT, AND FIRST APPLIED
   BY THAT INTEGRATOR AGAINST ITS OWN LANE**: a citation the lane had
   shipped was correct when written and false thirty-one minutes later,
   under a merge that landed between the two readings. The merge is what
   moved it, so the checkpoint repaired it — and the same pass left
   untouched, and filed instead, a defect it could see just as clearly and
   had not caused.
4. Commit. Remove the worktree (../lane-protocol.md rule 6). Stop.

## Run hygiene

Set the model and the effort dial at session START and never switch
them mid-merge — the cache is the economics, and a switch discards it.
**THIS IS A STANDING SEAT, so it has one obligation the disposable
seats do not: COMPACT BETWEEN DISPATCHES.** An orchestrator or an
integrator that carries one lane's whole transcript into the next lane
pays for it on every turn afterwards, and the succession rule already
says the transcript is not the record — so anything worth keeping is
already in a file, and what is left is cost. Run noisy jobs (suite
output, log grinds, corpus sweeps) in a subagent that returns only its
answer. Carry quiet flags wherever the COUNT survives them, and read
the count as well as the exit: a full suite that exits 0 over zero
bodies has told you nothing. This section is the AUTHORITY over any
advisory line a project's tooling prints about which seat to spend;
that line yields to this text, and both yield to every human word.

## The checkout you merge into may be in use

**The integration branch's working tree is not only yours.** Where a
project's product RUNS from that tree — a dev server, a file watcher, a
desktop shell rebuilt on change — a human may be using it while you
merge. Every rule involved is individually right: a fresh install proves
a merge on a clean tree, a dev server must watch its own sources, and
the human must be able to run the product while work proceeds. Nothing
reconciles them, so the collision is invisible until something dies —
which is why it is written here rather than left to each session.

**FIRST, SEPARATE THE TWO KINDS OF DISTURBANCE, because they are not
equally bad and treating them alike gets the trade wrong.** A product
that RESTARTS or reloads was interrupted; a product whose dependencies,
build outputs or sources are pulled out from under it while it reads
them was BROKEN. Interruption is a cost the project's own human may
decide to accept. Breakage is never one. Rules 1 and 2 are the breakage
channels; rules 3 and 4 are what makes either kind attributable.

1. **A FRESH DEPENDENCY INSTALL SHALL NOT RUN IN A CHECKOUT SERVING A
   LIVE PRODUCT.** A clean install DELETES the dependency tree the
   running process is reading from, so this is breakage and not a
   restart. Run it somewhere that is not the human's dependency tree, or
   DETECT the live process and REFUSE LOUDLY — naming the step skipped,
   the evidence, and what has to happen before it can run. **A skipped
   step is news, never silence**, and the two wrong repairs are worth
   naming because both look like helpfulness: do not detect and continue
   anyway, and do not detect and kill — the process is not yours to end.
   Detect by asking the operating system what holds the port or the
   binary, never by connecting to the product or by binding its port to
   see whether the bind fails; taking the port for a microsecond to prove
   it is busy is still taking it. A check that CANNOT tell a live product
   from an absent one is not a check — prove it lets the ordinary case
   through as well as stopping the live one.
2. **A MERGE CAN CHANGE WHAT THE RUNNING PRODUCT SERVES WITHOUT TOUCHING
   ONE FILE THE PRODUCT OWNS.** Wherever a project links one of its own
   packages into another out of the working tree — a path dependency, a
   symlink, a generated bundle, any artifact built from sources the
   product does not contain — rebuilding the DEPENDENCY changes the
   running product, and the merge's diff names none of the product's
   files. **"My diff is docs-only" is not an answer to this question**;
   the question is which build outputs the running product reads, and it
   is answered from the project's own build order, not from the diff.
3. **WHEN YOUR OWN WORK WOULD DISTURB A RUNNING PRODUCT, RECORD IT IN
   THE CHECKPOINT** — what you did, what it did to the product, and how
   you know. Say WHICH change reached it and which did not: a project
   whose product reloads on one set of paths and restarts on another has
   TWO trigger sets, they overlap, and a checkpoint that conflates them
   reports a restart that never happened as readily as it misses one
   that did. Read the product's process identity BEFORE and AFTER, and
   state when you read it — **a pid, a port holder and a start time are
   live-environment facts, not functions of a tree**, so one quoted from
   an earlier session or an earlier brief is already stale, and a
   process-name match that is not anchored will match a longer name that
   merely begins the same way.
4. **DO NOT WRITE INTO THE INTEGRATION CHECKOUT ANYTHING THE MERGE DID
   NOT PUT THERE.** A probe, a scratch file, an experiment, a second
   checkout parked inside the tree — each is a change to a working tree
   somebody else may be building from, and an untracked file with no
   author is precisely the shape that cannot be attributed afterwards.
   Scratch work belongs in a throwaway checkout of the project's own
   kind, a sibling directory and detached (../lane-protocol.md rule 3).
   IF an unexplained file IS found there THEN say so in the checkpoint
   and leave it alone: whose it is, is evidence.

**A SECOND CHECKOUT FOR THE HUMAN DOES NOT RETIRE ANY OF THE FOUR.** A
project may give the human their own checkout of the product so the
ordinary case stops depending on anyone remembering — and that is worth
doing, because it converts a discipline into a property. But the human
may be on one checkout at any moment, and **a rule that only holds when
the setup is right is not a rule.** The four above bind either way.
