---
id: T-083-s4
title: One merge commit on main carries an edit neither parent has, so no pre-merge forecast could ever have seen it
status: suggested
suggested_by: executor claude-opus-5 @T-083
---

Found while measuring which pre-merge range predicts a merge's own diff,
over the 31 first-parent merges from `94ee306` to `ddcc8bb`. **Thirty of
them are pure merges. One is not.**

At **T-028's merge `634c405`**, `tools/e2e/tests/window-contract.spec.ts`
differs from BOTH parents: 13 insertions and 3 deletions against
main-before `a6eea36`, and 405 insertions against the branch tip
`a419773` (the file is main's; the branch never had it). And
`git merge-tree --write-tree 634c405^1 634c405^2` exits **0** — a clean
mechanical merge, no conflict — so the edit was not a resolution. The
merge commit's tree is the mechanical result **plus a hand edit to a
test file**.

Two consequences, one small and one worth writing down.

The small one: it is why T-083's RANGE RULE says no pre-merge form is
exact here. Three dots and `merge-tree` both forecast 27 paths at that
merge; the merge's own diff is 28. Every other merge in the range,
either form is byte-exact.

The one that matters: **the integrator's own integration-truth ritual is
built to catch exactly this and evidently did not run, or ran and was
not believed.** Recent checkpoints record `git merge-tree --write-tree`
predicting the tree BEFORE the merge and the no-ff merge producing *that
tree exactly* — T-080's checkpoint `cb3aa31` names the predicted hash
and says the merge produced it. At `634c405` that comparison would have
failed by construction. Whether the ritual postdates T-028 is checkable
and was not checked here; either way the lesson is the same one
`ADR`-free practice keeps relearning: **a merge commit that contains
work is a merge commit whose diff nobody reviewed as a diff**, because
both the executor's fence and the verifier's read happened on the
branch.

Nothing to repair in the tree — `634c405` is history and the file has
moved many times since. The suggestion is for the practice: keep the
predicted-tree comparison, and if a merge commit must carry an edit, say
so in the checkpoint with the same loudness a skipped gate gets.
