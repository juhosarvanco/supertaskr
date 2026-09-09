---
id: T-281-s5
title: "The drill's sha256 restore proof cannot be made to fail — deleting the comparison outright leaves every body green, because the restore blindly rewrites an in-memory copy the proof then compares against itself"
feature: F-04
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`runMutantDrill` restores the planted site with `writeFileSync(file,
pristine)` and then proves the restore by comparing
`sha256(readFileSync(file))` against `sha256(pristine)` taken before the
plant. The comparison is against the right thing — the merged tree's own
pre-plant bytes, not a recomputation of the mutated text — so it is not
the circular proof the class usually is.

**But it cannot fail.** The restore writes the exact in-memory string the
`before` hash was taken from, so the two agree by construction. Measured
at the verifier's bench: disabling the `after !== before` branch entirely
leaves **all 45 bodies green**, and no arrangement reachable through the
`run` seam makes the branch fire — whatever the runner does to the file
during the run is overwritten by the restore before the hash is taken.

A guard that cannot fail is decoration, and a later reader will trust it
for more than it does. AC-3 asked for "restore the site and prove it by
sha256", and the letter is met; what is missing is any arrangement in
which the proof does work.

Worth deciding between three answers, none obviously right:

1. **Make it reachable** — verify the write through a seam the drill can
   be handed, so a body can supply a restore that does not take, and the
   proof then has something to catch.
2. **Verify against the tree rather than against memory** — compare the
   restored file to `git show :<path>` or the merged tree's blob, which
   catches a class the current shape cannot: a `pristine` that was
   already wrong because the file changed between the read and the plant.
3. **Say what it is** — keep it as a cheap assertion against filesystem
   and concurrency faults and stop calling it a proof, so nobody budgets
   confidence it does not carry.

Not a defect in the merge's behaviour: the restore itself is correct and
the `finally` around it is now pinned (T-281 CORRECTION 1). This is about
what the *proof* establishes.
