---
id: T-048-s5
title: The bounded frame has a floor — under ~250px of window height the interview's content stops being reachable, and no minimum window size is set
status: suggested
suggested_by: verifier claude-opus-5 @T-048
---

A bounded frame trades "the page grows" for "the pane scrolls", and that
trade is right — but it has a floor, and below the floor the trade
inverts: the growing page could always be scrolled to reach everything,
while a bounded frame whose scroll region has run out of room cannot.

Measured in the served bundle with T-024's `streak` fixture, genesis
screen, after T-048. `reach` = the last artifact row (`docs/ARCHITECTURE
.md`, 40px tall) scrolled into view with `scrollIntoView({block:
"nearest"})` and then clipped against every ancestor with
`overflow-y != visible` and against the viewport:

| viewport | page / vp | pane region | last row visible | verdict |
|---|---|---|---|---|
| 1920x1080 | 1080 / 1080 | 796 / 766 | 40 / 40 | fine |
| 1280x720 | 720 / 720 | 796 / 406 | 40 / 40 | fine |
| 800x600 (the app's own window) | 600 / 600 | 858 / 286 | 40 / 40 | fine |
| 640x480 | 480 / 480 | 886 / 166 | 40 / 40 | fine |
| 800x400 | 400 / 400 | 858 / 86 | 40 / 40 | fine |
| 800x360 | 360 / 360 | 858 / 46 | 40 / 40 | fine — the last size that works |
| 1280x250 | 250 / 250 | 796 / **44** | **1 / 40** | the row cannot be brought into view |
| 1280x200 | **225 / 200** | 796 / **44** | **0 / 40** | the frame stops holding as well |

Two things happen at the bottom. The pane's scroll region hits a **44px
floor** and stops shrinking, and `genesis-pane-slot` is
`overflow: hidden`, so once the slot is smaller than the pane the
clipped remainder has no scrollbar anywhere — `scrollIntoView` cannot
recover it. Below ~225px the column can no longer absorb the header and
the heading either, so `document.scrollHeight` exceeds the viewport
again (225 vs 200) and the frame's own claim fails.

**How much this matters: not much, and it should be said plainly.** The
floor sits at roughly 250–360px of viewport height. The app opens at
800x600 and every viewport from 360px up measures clean, including all
three the task names. Before T-048 these sizes "worked" only in the
sense that the whole page scrolled — which is the bug the task exists to
fix. Nobody is reviewing this app in a 250px window.

**Why file it anyway.** `app/src-tauri/tauri.conf.json` sets
`width: 800, height: 600` and **no `minWidth` or `minHeight`**, so the
floor is reachable by dragging. A bounded frame is the kind of layout
that wants a declared minimum, and one line closes it:

1. **`"minHeight": 400` (and a `minWidth`) in `tauri.conf.json`** —
   puts the window's own contract above the floor, cheapest and most
   honest. 400 clears the measured floor with margin.
2. **Let the pane's region shrink to 0 rather than 44px, and give
   `genesis-pane-slot` a scroll region instead of `overflow: hidden`** —
   fixes the mechanism rather than fencing it, and is the same shape as
   T-048-s2's remedy for the map canvas. More work, and it belongs with
   whoever owns the pane's composition (T-027).
3. **A lane assertion at one small viewport** — reads the last
   artifact's clipped-visible height and fails if a row can never be
   brought fully into view. Converts a silent floor into a loud one.

Related: T-048-s2 is the same failure mode one screen over (an
`overflow: hidden` box with no scroll region below it), and T-048-s1
holds the decision about whether the whole shell gets bounded — if it
does, every screen inherits this floor and remedy 1 stops being
optional.
