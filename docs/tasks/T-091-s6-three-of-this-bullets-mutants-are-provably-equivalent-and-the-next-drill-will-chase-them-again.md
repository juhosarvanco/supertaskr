---
id: T-091-s6
title: Three obvious mutants of the RANGE RULE bullet are provably EQUIVALENT, and the next drill will spend an hour rediscovering that
status: suggested
suggested_by: verifier claude-opus-5 @T-091-verify
---

**A SURVIVING MUTANT AND AN EQUIVALENT MUTANT LOOK IDENTICAL FROM THE
GREEN RUN, AND ONLY ONE OF THEM IS A DEFECT.** T-091's verify pass ran
21 document mutants against the new reader. Eighteen were killed. The
three that survived were each proven EQUIVALENT — the mutated document
means exactly what the original meant, so the reader is right to stay
green — and each proof took a separate measurement. **They are recorded
here because nothing else in the tree records them, and the next person
to drill this bullet will derive the same three and have to prove them
again from scratch.**

| mutant | why the reader is RIGHT to stay green | proved by |
|---|---|---|
| `` `$(git merge-base A B)..B` `` → `` `$(git merge-base A B)...B` `` in the DEFINITIONALLY sentence | `A...B` is `$(merge-base A B)..B`; with A already the merge base of the pair, `merge-base(A, B)` **is** A, so the extra dot is a no-op | `git diff --name-only` over both spellings at `4683566`, `fed70a2`, `634c405`, `bdada11` — identical sha256 on all four; `merge-base(base, M^2) == base` at two of them |
| `git merge-tree --write-tree M^1 M^2` → `git merge-tree M^1 M^2` in the printed recipe | since git 2.38 the two-commit form defaults to `--write-tree`; the flag is decorative on this machine | identical first-line tree oid at `4683566`, `fed70a2`, `634c405` on git **2.50.1 (Apple Git-155)**, and identical exit **1** at `bdada11` |
| `` `94ee306` through `ddcc8bb` `` → `` `94ee306` through `4683566` `` | `ddcc8bb` is a **non-merge** commit three first-parent commits above `4683566`, which is the newest merge in the range, so both spellings select the SAME 31 first-parent merges | `git rev-list --first-parent --merges` over both ranges — same count **31** and identical sha256 over the sorted hash list |

**THE MEANING-CHANGING NEIGHBOUR OF EACH IS KILLED, WHICH IS WHAT MAKES
THE EQUIVALENCE CLAIM SAFE RATHER THAN A CONVENIENT EXCUSE.** Changing
the identity's RIGHT endpoint instead (`..B` → `..A`) reds with per-merge
detail — *"three-dot identity FAILS at 4683566: `A...B` returns 12 paths
and `$(git merge-base A B)..B` returns 48"* — and moving the range's LEFT
endpoint (`94ee306` → `94ee306^`) throws by name. **An equivalence class
is only a defence when its boundary has been probed**, and all three
boundaries were.

**THE ASK.** Record the three classes where a drilling verifier will
meet them. Two dispositions, and this file does not choose:

1. **In the bullet**, as one sentence beside the recipe: the two
   spellings git treats as identical, and the fact that the range's
   right-hand endpoint is a checkpoint rather than the last merge. Fence
   `[docs/CONVENTIONS.md]`. It makes the document more honest and slightly
   longer, and it goes stale if git's default ever changes — which is the
   objection.
2. **In `tools/e2e/scripts/range-rule.mjs`'s header**, as a
   DRILLING NOTES block. Fence `[tools/e2e]`, cheaper, and it sits beside
   the code a drill actually runs — but a verifier who mutates the
   DOCUMENT may never open the reader, which is the objection to this one.

Disposition 2 is the smaller change and the one this pass would take;
disposition 1 is the one that reaches the reader who has the document
open. Size XS either way. **Neither is a blocker on anything.**
