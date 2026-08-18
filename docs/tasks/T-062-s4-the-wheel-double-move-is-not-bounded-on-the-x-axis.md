---
id: T-062-s4
title: T-062-s2's "small constant, not a doubling" holds only on the Y axis — horizontally the wheel double-move is an exact doubling, up to 376px
status: suggested
suggested_by: verifier claude-opus-5 @T-062
---

**A correction to T-062-s2, measured while verifying it.** s2's
mechanism, its 354px figure and its trade are all right. Its BOUND is
not: it was measured on one axis at one viewport, and the other axis is
where the effect is large.

## What s2 says

> The native component is clamped by the canvas's own overflow — 54px is
> the entire scrollable range at that viewport — so it is a small
> constant added to the pan, not a doubling. At viewports where the
> canvas is not shrunk (1280x840, 1024x700 — measured 666/666 and
> 526/526) `scrollTop` cannot move at all and the wheel behaves exactly
> as before.

## Measured — same rig, both axes, all three viewports

Served bundle, headless Chromium, this repo's own graph, `page.mouse.wheel`
over the canvas, reading `scrollTop`/`scrollLeft` and the transform:

| viewport | max scrollTop | max scrollLeft | `wheel(0,300)` | `wheel(300,0)` |
|---|---|---|---|---|
| 1280x840 | 0 | **0** | pan −300 only | pan −300 only |
| 1024x700 | 0 | **152** | pan −300 only | pan −300 **and scrollLeft 152** |
| 800x600 | 54 | **376** | pan −300, scrollTop 54 (**354**) | pan −300, **scrollLeft 300** (**600**) |

So:

- **1024x700 does not "behave exactly as before".** The canvas is not
  shrunk vertically there, but it IS overflowing horizontally by 152px,
  and a horizontal wheel now moves the graph 452px instead of 300.
- **At 800x600 the horizontal case is an exact doubling** — a 300px
  horizontal wheel produced `scrollLeft` 300 on top of a −300px pan —
  and it stays a doubling until the 376px range is exhausted. 376 is
  **seven times** the 54px s2 cites as "the entire scrollable range".

The vertical figures reproduce s2 exactly (54 at 800x600; zero at both
larger viewports), and `wheel(0,-300)` returns both components to zero,
so the effect is symmetric and not a drift. The Y-axis half of s2 is
sound.

## Why it matters more than the arithmetic

The horizontal overflow is not a small-viewport artefact: the graph is
wider than the pane at the DECLARED MINIMUM, where the app is supported.
So the axis on which the double-move is largest is also the axis on which
it is reachable in a supported window — and horizontal panning is the
map's primary gesture on a wide graph.

It does not change s2's conclusion (deleting graph is worse than an
overshooting pan, and `overflow-auto` is what the criterion names). It
does change what the reader is told the cost is, and it strengthens s2's
own proposed closer: a non-passive `wheel` listener registered through a
ref, so the pan handler can `preventDefault` and stay authoritative on
both axes.

## For whoever takes s2

Read the two together. The fix is the same one; the measurement to keep
is this table, because it is the one that shows the wheel wrinkle is a
1024x700 phenomenon and not only an 800x600 one. Read with **T-034-s1**
(wave 0 at 1440x3818), where both axes overflow at once.
