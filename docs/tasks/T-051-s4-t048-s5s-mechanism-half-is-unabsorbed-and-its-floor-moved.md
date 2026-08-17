---
id: T-051-s4
title: T-048-s5's mechanism half is not absorbed, and the floor it measured no longer reproduces
status: suggested
suggested_by: executor claude-opus-5 @T-051
---

T-051 absorbs T-048-s5, but takes only its **remedy 1** — "declare a
`minWidth` and `minHeight` in `tauri.conf.json`", which it did
(1024×700). Its remedies 2 and 3 are untouched and the absorption will
remove the file that records them, so they are re-filed here rather than
lost:

- **remedy 2** — let the pane's scroll region shrink freely and give
  `genesis-pane-slot` a scroll region instead of `overflow: hidden`,
  which fixes the mechanism rather than fencing it. Same shape as
  **T-048-s2**'s remedy for the map canvas, and it belongs with whoever
  owns the pane's composition.
- **remedy 3** — a lane assertion at one small viewport that reads the
  last artifact row's clipped-visible height and fails if a row can
  never be brought fully into view. T-051's
  `tools/e2e/tests/window-contract.spec.ts` carries that `reach` probe
  and asserts `40/40` at the declared minimum and default, but **not**
  below the floor, so nothing watches the region the floor fences off.

**And the number T-048-s5 measured no longer reproduces.** s5 recorded
the pane's scroll region hitting a hard **44px** floor below ~250px of
viewport, with the last artifact row unreachable — `1/40` at 1280×250 and
`0/40` at 1280×200. Re-measured post-T-027 at the same width:

    1280x200 | page 302/200 | pane region 886/80  | last row 40/40
    1280x225 | page 302/225 | pane region 886/105 | last row 40/40
    1280x250 | page 302/250 | pane region 886/130 | last row 40/40
    1280x300 | page 302/300 | pane region 886/180 | last row 40/40
    1280x360 | page 360/360 | pane region 886/240 | last row 40/40

The region shrinks **linearly** (viewport − 120) with no floor at all,
and the row stays fully reachable at every height including the two s5
recorded as failing. T-027 restructured the screen — the pane is now a
flex child of `genesis-split` inside `genesis-pane-slot` — so the 44px
floor belonged to the pre-split full-width composition and went away
with it. What survives is s5's SECOND finding, moved: the genesis page
stops fitting below **~302px** (302 against a 300/250/225/200 viewport),
where s5 put it at ~225.

None of this weakens T-051's floor — 700 clears 302 by 2.3× and the old
250 by 2.8×, so the minimum is right either way. But **criterion 2 cites
the 250px figure as its justification**, and a next reader who goes
looking for the 44px collapse will not find it. Worth correcting in
whatever survives, so the pipeline's record of why the floor is where it
is stays true.
