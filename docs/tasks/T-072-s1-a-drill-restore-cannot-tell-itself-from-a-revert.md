---
id: T-072-s1
title: The poison drill's restoration proof cannot tell a restore from a revert of uncommitted work
status: suggested
suggested_by: executor claude-opus-5 @T-072
---

CONVENTIONS' POISON DRILL bullet prescribes both halves of the
restoration: *"Then restore, and PROVE the restoration rather than
asserting it: `git show HEAD:<path> | shasum -a 256` against the working
file, or an empty `git diff -- <path>`."* **Both prescribed proofs are
proofs against HEAD, and both are satisfied perfectly by a restore that
threw away work HEAD has never seen.**

**MEASURED, ON THIS CARD, AT THE COST OF THREE EDITS.** The drill helper
restored with `git checkout -- app/src/genesis/interview-model.ts` while
the implementation was still an uncommitted working-tree change. The
mutation was applied and read back correctly, the suite red on exactly
the intended body, and then the restore reverted the file to
`e83ee1d` — the branch point — silently discarding the three edits the
drill existed to test. **The sha256 matched `git show HEAD:<path>`
exactly and `git diff --stat` was empty**, so both prescribed proofs
reported success at the moment the work was lost. It was caught by the
harness echoing the file's new contents back, not by either proof.

**The failure is structural, not clumsy.** A drill restores to a KNOWN
GOOD state; `git checkout --` restores to HEAD; those are the same state
only when the work under test is committed. Everything else in the
bullet is about the mutation — one-sidedness, the substitution count,
reading the mutated text back — and the restoration clause inherits an
assumption nothing states.

**The remedy is one clause, and it costs nothing.** *DRILL AT A COMMIT.*
Commit the work first, then mutate: `git checkout --` and both
prescribed proofs become correct by construction, and the sha256 is
suddenly a real check rather than a tautology about the file you just
overwrote. The alternative — snapshot to a scratch copy and restore from
that — works too and is what a drill against a deliberately dirty tree
needs, but it needs its OWN proof (`cmp` against the snapshot), because
`git show HEAD:` cannot see it.

**IT ALSO EXPLAINS A CLASS OF SILENT DAMAGE THAT WOULD NOT BE CAUGHT.**
Had the discarded file been one the mutated suite does not exercise, the
drill would have reported a clean red, a clean restoration and a green
re-run, and the loss would have surfaced at the verdict or later. The
three roles the bullet addresses — executor, verifier, integrator — all
drill, and only the integrator reliably has everything committed
already.

Belongs beside the restoration sentence in CONVENTIONS' POISON DRILL
bullet, which is `T-084`'s fence at the time of writing.
