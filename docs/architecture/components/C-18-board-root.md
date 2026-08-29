---
id: C-18
name: Board root
layer: app
paths:
  - app/src/components/board/Board.tsx
depends_on: [C-06, C-08, C-09, C-17]
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-board]
---
The board's composition root: the one file that mounts the columns and
opens a card into the detail drawer. It is the ONLY file on the board
side that reaches both the card faces (C-08) and the drawer (C-09), which
is precisely why it is its own node.

**WHY A NODE OF ITS OWN, AND WHY FOLDING IT INTO C-05 IS REFUSED —
MEASURED RATHER THAN PREDICTED (T-127-s1, at `95cf2d0`).** `Board.tsx`
was C-08's, and it is the single file that made `C-08 -> C-09` true; the
return hop is the drawer reading the card faces and the board model.
Splitting the model out (C-17) is not enough on its own, because the
composition root still points down at both halves. The obvious economy is
to fold it into the shell instead of declaring a fifteenth component —
and that trades one cycle for another: `BoardCrescendo.tsx` (C-13) imports
`Board`, so C-05 would gain `C-13 -> C-05` beside the declared
`C-05 -> C-13`. Run, not forecast:

    cycle    C-05 -> C-13 -> C-05
    verdict  DECLARED CYCLE  1 cycle(s) among 14 components
    exit 1

**NO IMPORT WAS SEVERED AND NO FILE MOVED ON DISK** (T-127's own
constraint, carried through T-127-s1 to T-127-s6). `Board.tsx` still
imports what it always imported; only its owner changed. Its four
declared dependencies are all observed — the seam is drawn where the code
already was.

**THE SLUG IS `app-board`** for C-16's reason, stated in full in
`C-17-board-model.md`: this file is C-08's today, so `app-board` is
exactly who may edit it, and a new word would silently narrow every live
card that already reads `[app-board]`.
