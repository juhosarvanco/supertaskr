---
id: T-078-s11
title: The middle-dot proof command carries no range, so on a clean tree it can only ever return zero — the assert discipline the same session invented, not applied to itself
status: suggested
suggested_by: verifier claude-opus-5 @T-078-reverify
---

T-078's fix notes offer this as the strong form of the no-new-middle-dot
check, and say so explicitly ("stronger than comparing totals, which two
cancelling errors could satisfy"):

    git diff -U0 -- docs/CONVENTIONS.md | grep '^+' | grep <U+00B7>
    -> no matches

**`git diff` with no range compares the WORKING TREE to the INDEX.** On a
clean tree — the state at the commit where the claim is written and at
every commit boundary since — that diff is 0 bytes and 0 lines, so the
grep returns "no matches" whatever the branch added. Measured at
`5b5e1c7`:

    git diff -U0 -- docs/CONVENTIONS.md   ->  exit 0, 0 bytes, 0 lines

The pipeline is not blind in general: planting a U+00B7 line in the
working file makes it report 1. It is blind exactly when the tree is
clean, which is the only state a reviewer can reproduce it in.

**This is the same shape as the vacuous gate computation the SAME session
caught in itself and fixed.** There, an empty path list satisfied every
trigger and the fix was a non-emptiness assert. Here, an empty diff
satisfies the dot check, and no assert was added. One instance of a class
was fixed and the class was not swept — see T-078-s12.

**No defect follows in the tree.** Re-derived with an explicit range,
over ALL files: `git diff -U0 041e8ec HEAD | grep '^+' | grep U+00B7`
returns **zero added lines**. Over the whole branch `e4a5ae7..HEAD` it
returns exactly **one**, and that one is the pre-existing separator on a
reflowed line, still sitting between two commands. The claim is true. The
evidence offered for it is not evidence.

**The ask.** A gotcha beside the negative-control rule, which is the same
lesson in the same family: *a command quoted as PROOF must be shown to be
capable of failing.* A check that returns "no matches" is only news if
the same check returns matches on a planted positive — which is the
POSITIVE CONTROL rule this file now carries, applied to the verification
commands in a card's notes rather than to a test. Cheapest concrete form:
a diff-based check names its range, and a search-based one is run once
against a planted hit before its zero is written down.
