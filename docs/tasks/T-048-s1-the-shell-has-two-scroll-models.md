---
id: T-048-s1
title: The shell now has two scroll models, and the choice is T-027's to make
status: suggested
suggested_by: executor claude-opus-5 @T-048
---

T-048 bounds the genesis column (`h-screen`) and leaves every other
screen a growing page (`min-h-screen`). That is a real fork in the
shell's layout, taken deliberately and scoped as narrowly as the
measurements allowed — but it is a fork, and it should be settled rather
than accumulated.

**Why it was scoped rather than made global.** T-048's criterion 4 froze
the other screens, and the unconditional version measurably moves two of
them (all figures from the served bundle, before → after):

| screen | what moves under an unconditional `h-screen` |
|---|---|
| board, 1280x720 and 800x600 | the rail is a stretch-height sibling of the column, so it goes **2202px → 720/600px**: the sidebar strip and its right border stop at the fold while the page still scrolls to 2202 |
| map, 800x600 | the canvas is `min-h-0 flex-1 overflow-hidden`, so it goes from a 726px page you can scroll to **446/320 clipped with no scrollbar anywhere** — 126px of graph unreachable |

So "bound the frame" is not a one-line change: it needs the rail to
become sticky or fixed, and it needs the board (and the map) to own a
scroll region of their own.

**Why that is worth doing anyway.** A desktop app whose header scrolls
away is unusual, and the board's header is app chrome — the wordmark,
the project path, the parse/skip chips, the theme toggle. Today, on a
tall board at 800x600, all of it scrolls off. The genesis screen now
behaves the other way. Two models in one shell is the kind of thing a
user feels without being able to name.

**Whose call.** T-027 builds the split view the genesis screen becomes,
and it is already holding the composition question (full-width pane vs
right half). The scroll model is the same question one level up: what is
the frame, and who inside it scrolls. Deciding it there, once, with the
rail and the board in scope, is cheaper than deciding it twice.

Shape of the work if it is taken: `main` and the column bounded
unconditionally; `PaneRail` given its own `h-screen` (or `sticky top-0`)
so the strip survives; the board's content wrapped in the same
`min-h-0 flex-1 overflow-y-auto` idiom the pane and the map already use;
the map canvas given `overflow-auto` or a fit-to-frame layout (see
T-048-s2, which is the sharp end of the same thing). Then the frame
holds everywhere and T-048's conditional collapses back to one class.

Not blocking anything: the conditional is two lines, it is measured, it
is commented at both ends, and `app/test/shell-frame.test.tsx` pins the
scoping so it cannot be flattened by accident.
