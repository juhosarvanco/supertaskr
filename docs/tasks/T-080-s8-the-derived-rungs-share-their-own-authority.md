---
id: T-080-s8
title: All three derived corpus rungs take their expectation from the same git listing as their subject, so a tree that loses a directory silences every one of them
status: suggested
suggested_by: verifier claude-opus-5 @T-080
---

T-080's floor is built on the right asymmetry — the expectation comes
from `trackedFiles()` while the subject comes from `corpus(CONTROL)`, so
`SKIP_DIRS` and `CONTROL_BINARY_EXTENSIONS` appear on ONE side only and
the check can fail. That holds, and it is measured four ways in the
verdict. **But all three rungs draw both sides from the same
`git ls-files` call, and a group that leaves that listing takes its own
row with it.**

Measured non-destructively at `9c64cd8` by pointing `GIT_INDEX_FILE` at
a COPY of the worktree index with `method/` dropped (real index
untouched, 531 tracked entries at that ref throughout — the tracked
list is a function of the tree, so read every figure here as `9c64cd8`). The selftest reds with exactly
**two** failures, and both are LITERAL rows:

    CONTROL includes method/ (0 files)
    CONTROL includes tracked text format method/runtime/nputer.yaml

Every derived rung is silent. `byTop` generates one row per top-level
group PRESENT, so `method/`'s rung C row does not fail — it does not
exist. `byClass` does the same: `.yaml` drops to **0 tracked files**, its
rung A row vanishes, and the only reason anything noticed is that a
hand-written name pin happens to cover the one `.yaml` file in the tree.
A class whose files all live under a vanishing directory and that no
name pin covers would leave no row and no failure at all.

Two consequences. **First, the six literal `CONTROL includes <root>/`
rows are not "dominated" and the notes should stop calling them that.**
They are the only assertions in the module that survive their own
subject's disappearance, which is poison shape five displaced from the
SOURCE into the TREE. Keeping them is right; the argument for them is
stronger than the one recorded. **Second, the honest cheap floor is a
non-emptiness row on the authority itself** — `trackedFiles().length > 0`
and, better, one derived row asserting that each name in a short list of
required top-level groups is still present in `byTop`. That converts
"the row vanished" into "the row failed", which is the whole shape of
the defect T-080 exists to close, applied one rung further out than the
card reached.
