---
id: T-048-s2
title: The map canvas clips instead of scrolling — harmless today, a trap for whoever bounds the frame
status: suggested
suggested_by: executor claude-opus-5 @T-048
---

`MapView.tsx:490` gives the canvas `min-h-0 flex-1 overflow-hidden`. It
can shrink, and when it does it **hides** the overflow: there is no
scroll region anywhere between the canvas and the document.

Today that is harmless by accident. The shell's column is
`min-h-screen`, so the canvas never has to shrink — at 800x600 the map
page simply grows to 726px and you scroll the document to see the rest.
Measured in the served bundle, before and after T-048: `map 800x600 →
page 726/600, main 726, rail 726`, unchanged.

It stops being harmless the moment anything bounds that column. T-048
measured exactly that while ruling out the unconditional fix: with
`h-screen` on the shell column, `div.map-canvas-grid` reads **446/320
with `overflow-y: hidden`** at 800x600 — 126px of graph gone, and no
scrollbar anywhere on the page to bring it back. Nothing goes red: the
lane has no assertion about the canvas's height, and jsdom has no
layout, so every suite in the repo stays green while a quarter of the
map disappears at the app's own window size.

That is a silent-failure shape worth closing on its own terms, before
someone (T-027, or T-048-s1's global bound) trips it:

1. **Give the canvas a scroll region** — `overflow-auto` instead of
   `overflow-hidden`, so a bounded frame scrolls the graph rather than
   truncating it. Cheapest; changes nothing today because the canvas is
   never smaller than its content today.
2. **Fit to frame** — scale or re-lay the node positions to the
   available box. Nicer, and it is the behaviour a map pane arguably
   wants; considerably more work, and it is a design decision (T-012's
   layout is deterministic and pinned by tests).
3. **Assert the current contract** — a lane spec that reads
   `map-canvas-grid`'s `scrollHeight` vs `clientHeight` and fails if
   content is ever hidden. Does not fix anything, but converts a silent
   failure into a loud one, which is the minimum.

Note the mirror image: the genesis pane got this right from T-024
(`overflow-y-auto` with an unbroken `min-h-0` chain), which is why
T-048's fix is two classes rather than a rewrite. The map has the chain
and not the scroll region; the genesis screen had the scroll region and
not the chain. Same family of bug, opposite half missing.
