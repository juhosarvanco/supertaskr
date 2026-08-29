---
id: T-155-s7
title: The new suite reads the governing documents and the DOCS GATE's derivation cannot see it
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-155
---

`tools/method-evals/lib/fixture-root.mjs` copies `docs/CONVENTIONS.md`,
`docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/STATE.md`,
`docs/NORTH_STAR.md` and `docs/architecture/` into the throwaway root
MF-01 assembles a brief against, and `fixtures/review-claims.mjs` reads
`docs/CONVENTIONS.md` in three of its four derivations. MF-06 even
DECLARES `docs/CONVENTIONS.md` in its `reads:` field. The suite is a
governing-document reader by any reading of the DOCS GATE bullet, and a
`docs/` edit really can red it: MF-01 runs `brief.mjs`, whose rows derive
from CONVENTIONS and ARCHITECTURE, so a bullet edit is capable of taking
that eval to exit 1.

**The gate's derivation does not see it, and it is not silent about
nothing — it is silent.** Measured with `node
tools/e2e/scripts/docs-gate.mjs --census` from the repo root, in a
detached drill cut at this lane's tip and again at its base:

| ref | docs-shaped sites | files | resolve into docs/ | root-holding files | derived / unlinked / unlinkable |
|---|---|---|---|---|---|
| `78aabe5` | 141 | 28 | 20 in 15 files | 39 | 21 / 0 / 18 |
| `0712ca3` | 145 | 29 | 20 in 15 files | 39 | 21 / 0 / 18 |

The new tree adds four docs-shaped sites in one file and moves NOTHING
else: the reader count stays at 22 across four suites, and the unlinked
count stays at zero, so no tripwire fires and no census reports a
residual. The literal arm cannot classify it because the paths are
elements of a `LIVE_DOCS` array spent through `path.join(repoRoot, rel)`
with `rel` a loop variable, and the call arm cannot because the function
being handed the root is `cpSync`.

**This is `T-091-s2`'s class arriving exactly where that card predicted
it.** That finding records the same shape from the other direction —
`range-rule.spec.ts` keeps a zero-argument `conventionsText()` spelling
ON PURPOSE so the gate can see it, and says *"the next reader written the
other way will be invisible too, and this workaround is a shape nobody
will know to copy"*. Nobody knew to copy it. The DOCS GATE bullet's own
sentence is the other half: *"a reader list cannot be closed by prose,
because prose is not what adds the next one"*.

**AND THERE IS A SECOND HALF THAT MAKES THE OBVIOUS FIX WRONG.** `SUITES`
in `tools/e2e/scripts/docs-scan.mjs` is the four packages, and
`tools/method-evals` is none of them. `docs-input-gate.spec.ts` asserts
`READERS.every((r) => r.suite !== undefined && r.command !== undefined)`,
so teaching the scanner to SEE this reader without giving it a suite
would red the lane by that assertion — correctly, because the gate could
then name a reader and not the command that runs it. The two halves have
to move together.

## The shape of the work

Three arms, and the disposition is genuinely open:

1. **Give the suite a suite.** Add `{ dir: "tools/method-evals", command:
   "node tools/method-evals/run.mjs" }` to `SUITES` and teach the scanner
   the array-of-literals site shape. Widest, and it makes the gate name a
   real command a `docs/CONVENTIONS.md` edit owes.
2. **Adopt `T-091-s2`'s workaround here** — spell the docs paths so the
   literal arm sees them — and still owe arm 1 for the suite mapping.
3. **Record it as out of scope and say so in the scanner**, the way
   `.nputerignore` is asserted in the DOCS GATE spec so that "we decided"
   cannot be read as "we forgot".

Arm 3 is the cheapest and the honest floor; it should not be taken
silently. Related but distinct from `T-155-s1` (no CI step) and
`T-155-s2` (outside the TOKEN corpus and every typechecked program):
those are about what checks the suite, this is about what the suite
checks and who is told.
