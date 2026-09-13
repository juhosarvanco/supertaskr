---
id: T-034-s1
title: Wave 0 is a wall — 32 of this repo's 50 drawn tasks declare no blockers, and the canvas clips
status: parked
wake: T-032
suggested_by: executor claude-opus-5 @T-034
---

Measured against this repo's live `docs/tasks/` tree (81 tasks parsed,
0 issues, 50 drawn — parked and suggested are not cards):

    waves   0:32 · 1:7 · 2:3 · 3:6 · 4:2
    edges   27 (4 critical, 0 tangled)
    canvas  1440 × 3818

**Wave 0 holds 32 of the 50 cards** and at the 120px row slot that is a
3818px column inside a pane that is ~600px tall. The other four waves
together are 18 cards.

This is TRUE — most tasks in this project genuinely declare no
`blocked_by`, and the design's own caption says the point of the lens is
that "the run of grey reads as *nothing here can start yet*". A tall
wave 0 reads as "almost everything is unblocked", which is the honest
answer. But it is also, at this ratio, close to unreadable: the useful
part of the picture (the chains) is four narrow columns beside one very
long one.

Three directions, none of them obviously right:

1. **Nothing.** The canvas pans (wheel) and zooms (ctrl/pinch-wheel),
   exactly like the architecture lens. The picture is correct; the
   reader scrolls. Cheapest, and defensible.
2. **Wrap wave 0.** Let a wave spill into a second sub-column once it
   passes N rows. Reads far better; it is UNDESIGNED (the bundle draws
   waves as single columns) and it breaks the append-only property that
   rule 4's reasoning buys — a new task could reflow the wrap.
3. **Draw only the connected sub-graph**, with a count line for the
   rest ("+32 tasks with no declared dependencies"). Smallest picture,
   biggest honesty cost: this repo's board rule is that nothing is ever
   dropped (T-004 criterion 4).

**Read this WITH T-048-s2** (`the map canvas clips instead of
scrolling`). The tasks lens inherits that canvas verbatim —
`min-h-0 flex-1 overflow-hidden` — so the day anything bounds the
shell's column, wave 0's bottom is not merely long, it is gone with no
scrollbar. T-048-s2's option 1 (`overflow-auto`) fixes both lenses at
once and is two classes.

Triage 2026-08-17 (architect): PARKED — @HUMAN, one of the six T-034
judgments STATE already carries. The question is whether the lens is
USEFUL at this ratio, not whether it is correct; correct it
demonstrably is, and no measurement settles the rest.

RE-MEASURED at triage, and it has grown: **50 drawn cards → 52**, with
19 tasks now declaring a non-empty `blocked_by`. **And applying this
triage makes it measurably worse** — thirteen new cards, most of them
`blocked_by: []`, so wave 0 gains roughly ten more. That is recorded
here rather than left for the human to discover on screen.

**The mechanical half is NOT parked.** This file's own "read this WITH
T-048-s2" is now **T-062**, which gives the shared canvas
`overflow-auto` so a bounded frame scrolls the graph instead of
truncating it — the "gone with no scrollbar" half of this finding is
scheduled. What stays with the human is only the picture: nothing (it
pans and zooms, defensible), wrap wave 0 (reads better, undesigned,
breaks the append-only property), or draw only the connected sub-graph
(smallest picture, biggest honesty cost against T-004 criterion 4).

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-032; wave 0 is a wall: 32 of 50 drawn tasks declare no blockers and the canvas clips.
