---
id: T-089-s9
title: Two size-S integration residuals — the executor's own step 2 still says "never touch the integration branch", and a size-S executor is told to checkpoint without being told what one is
status: suggested
suggested_by: verifier claude-opus-5 @T-089-verify
---

Found on the second-pass re-walk of the brief contract, assembling a
brief for `T-100` (size S, `touches: [app-shell]`). `T-089-s8` is closed
and both files it named agree; these are what the fix did not reach.

## One — the third place

`method/lane-protocol.md` rule 4 now carves out the smallest tier: a
size-S executor "plays integrator for its OWN work … it merges,
checkpoints and removes its own worktree". Rule 6 matches, and
`tasks/TASK-FORMAT.md`'s ceremony row S matches. Three copies, agreed.

`method/roles/executor.md` step 2 is the fourth and is unchanged:

> Work only in your git worktree / branch, per ../lane-protocol.md.
> **Never touch the integration branch.**

Stated as an absolute, with no size-S exception, in the file the executor
reads before anything else. `per ../lane-protocol.md` subordinates it
only for a reader who follows the pointer before believing the sentence
that follows it — and the sentence that follows it is the categorical
one. A size-S executor that obeys step 2 cannot do what the ceremony
table now requires of it.

**Fix:** one clause on step 2 — "…except the size-S self-integrate
(../lane-protocol.md rule 4)" — or delete the second sentence and let the
pointer carry it, which is what the pointer is for.

## Two — "checkpoint" is an instruction with no definition in reach

The size-S executor is told, in three places now, to CHECKPOINT. Nothing
it is given says what a checkpoint is. The ritual — STATE.md rewritten,
ROADMAP ticked, ARCHITECTURE updated if an interface moved, an ADR if a
non-obvious decision got made, the task file stamped, derived artifacts
regenerated, all as ONE commit distinct from the merge — lives in
`roles/integrator.md` step 3, and a size-S executor is never dispatched
as an integrator and never pointed at that file.

Row 11 of the brief contract names the sources for the deliverable:
ceremony table + `lane-protocol.md` + the executor's own role file.
**`roles/integrator.md` is not among them**, so a brief assembled exactly
to the contract tells a size-S session to checkpoint and hands it no
definition. It will invent one, and the last column of row 11 is what it
guesses: "the session guesses the ceremony, and guesses upward."

**Fix:** add `roles/integrator.md` (the checkpoint ritual) to row 11's
source column, and have lane-protocol rule 4's carve-out cite it by name
where it says "checkpoints". Both are one phrase.

## Why they are one card

Same tier, same fix window, same reader. Whoever takes the size-S
self-integrate to its conclusion has to answer both: what the executor
may touch, and what it must do when it touches it.
