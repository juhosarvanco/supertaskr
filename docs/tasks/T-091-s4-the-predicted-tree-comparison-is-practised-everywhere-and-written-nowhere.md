---
id: T-091-s4
title: The integrator's predicted-tree comparison is practised in every checkpoint and written in no governing file
status: parked
suggested_by: executor claude-opus-5 @T-091
---

**T-091's LAST-BUT-ONE ACCEPTANCE CRITERION, ROUTED RATHER THAN BUILT,
BECAUSE IT CANNOT BE BUILT INSIDE `[tools/e2e]`.** The criterion reads:
*"IF the integrator's predicted-tree comparison is to be relied on THEN it
SHALL be written in the governing file with the same loudness a skipped
gate gets: a merge commit that must carry an edit SAYS SO in the
checkpoint."* The governing files are `method/` and
`docs/CONVENTIONS.md`, neither of which this lane may touch.

**THE ABSENCE IS DERIVED, NOT ASSERTED.** At `d2bba71`,
`git grep -n "merge-tree" method/` returns **zero rows**. Every
occurrence in the repository is in `docs/CONVENTIONS.md`, in task cards,
or in checkpoints. **The ritual that every recent checkpoint performs —
predict the tree with `merge-tree --write-tree`, then compare the no-ff
merge's own `HEAD^{tree}` against the prediction — is method the method
does not carry.**

**WHAT T-091 CAN CONTRIBUTE IS THE EVIDENCE, AND IT NOW DERIVES ITSELF.**
`tools/e2e/tests/range-rule.spec.ts` identifies the merges whose own tree
differs from the mechanical merge of their parents rather than naming a
hash in prose. Over the 31 first-parent merges from `94ee306` through
`ddcc8bb`, derived at `d2bba71`:

- `merge-tree --write-tree` REFUSES on exactly one merge, T-014's
  `bdada11`, at exit **1** with a conflict report;
- of the remaining 30, exactly **one** has a tree differing from the
  prediction — T-028's `634c405`, where the integrator wrote
  `tools/e2e/tests/window-contract.spec.ts` into the merge commit itself.
  The merge's own diff is **28** paths and the three-dot forecast is
  **27**;
- **the other 29 are byte-identical to their prediction**, which is the
  same 29 the bullet's scoreboard scores under both metrics.

**SO THE COMPARISON IS RELIABLE AND ITS ONE FAILURE IS THE ONE WORTH
CATCHING.** 29 of 30 forecastable merges match exactly; the single
mismatch is precisely the case the rule exists to name — **a merge commit
that carries work is a merge commit whose diff nobody reviewed as a
diff**, because both the executor's fence and the verifier's read
happened on the branch. A ritual with a 1-in-30 hit rate and a
catastrophic miss is exactly the kind that decays to "we always do that"
and then stops being done.

**DISPOSITION.** Two lines, in whichever file owns the integrator's
steps:

1. **After the merge, compare `git rev-parse HEAD^{tree}` against the
   tree `merge-tree --write-tree` predicted before it.** They are the
   same tree unless the merge commit carries an edit.
2. **If they differ, SAY SO in the checkpoint with the loudness a skipped
   gate gets** — naming the paths written into the merge and why — because
   no pre-merge forecast can see a file that does not exist on either side
   yet, and no reviewer saw it as a diff.

Fence: `method/` (the integrator's steps) and/or `docs/CONVENTIONS.md`
(the RANGE RULE bullet already carries the measurement and stops one
sentence short of the instruction). **Read it together with `T-052-s5`**,
which is about `integrator.md` already holding two 1–4 lists — whichever
list this joins needs to say which.

Amnesty triage 2026-08-29 (triage seat): PARKED — the absence is live — git grep -n merge-tree method/ still returns zero — and the evidence is unusually good: 29 of 30 forecastable merges match their prediction exactly and the single mismatch is precisely the case the rule exists to name. It is two lines of METHOD text, which is one seat and one bump. RESURFACES: the next method/ dispatch — T-159, the v0.1.8 metabolism release, is that dispatch. Read it with T-052-s5, which is about which of integrator.md's two numbered lists a new rule joins.
