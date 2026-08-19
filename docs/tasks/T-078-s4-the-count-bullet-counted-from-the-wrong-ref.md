---
id: T-078-s4
title: The bullet that says "derive the count at your own ref" derived one from the wrong ref — 38 removed should be 46
status: suggested
suggested_by: verifier claude-opus-5 @T-078-verify
---

`docs/CONVENTIONS.md`'s THE FOUR WALKS bullet, in the sentence that
closes it, says:

> the widely-quoted **529** is the count at T-058's merge `7c6c5aa`, 33
> tracked docs/tasks files ago (38 removed, 13 added, nothing outside
> docs/tasks)

**Measured: 46 removed, not 38.** The net (`33`) and the additions
(`13`) are right; the removals are the count over a different range.

    git ls-tree -r --name-only 7c6c5aa -- docs/tasks | wc -l   ->  143
    git ls-tree -r --name-only e4a5ae7 -- docs/tasks | wc -l   ->  110
    git diff --no-renames --name-status 7c6c5aa e4a5ae7        ->  A=13 D=46 M=10
    git diff --no-renames --name-status 9b15f7d e4a5ae7        ->  A=13 D=38 M=7

143 − 46 + 13 = 110, the tree. 143 − 38 + 13 = 118, which is nothing.
**`38/13` is the count over `9b15f7d..e4a5ae7`**, and the eight-file
difference is exactly the eight discharged suggestion files `9b15f7d`
itself removed — the same eight the next sentence of the same bullet
correctly invokes to explain why STATE's "CONTROL 529 at `9b15f7d`" is
really 521.

So the bullet whose thesis is **"DERIVE THE COUNT AT YOUR OWN REF — a
figure copied out of a checkpoint is a figure about a different tree"**
made the identical off-by-one-commit-range mistake, against the
identical commit, two sentences from where it names it. That is what
makes this worth a card rather than a silent fix: the failure mode is
reproducible enough to catch its own author inside its own paragraph.

`nothing outside docs/tasks` does hold: every add and delete in
`7c6c5aa..e4a5ae7` is under `docs/tasks/` (the one rename is a move into
`docs/tasks/rejected/`), and the only other change is a modification to
`docs/STATE.md`, which cannot move a file count.

**The ask.** One integer: `38` → `46`. Worth considering alongside it,
because this is the second decorative count in the same branch to be
wrong (see T-078-s5): a derived quantity written into prose has no gate,
and every one of them is a future T-078-s2. Either state the two counts
the shipped lint PRINTS (`TOKEN 118 / CONTROL 496 at e4a5ae7`, which is
checkable in one second) and drop the deltas, or give the delta as a
command a reader can run rather than as a number they must trust.
