---
id: C-17
name: Board model
layer: app
paths:
  - app/src/lib/board-model.ts
  - app/src/lib/task-detail.ts
depends_on: [C-06, C-16]
decisions: [ADR-008, ADR-016]
status: auto
touch_slugs: [app-board]
---
The board's pure model layer: the selectors that turn C-06's parsed
project into columns, slices, ghosts and parked rows, and the detail
derivation that turns one card into the drawer's presentation. React-free
by construction — `board-model.ts` imports the parser and `verdicts.ts`,
`task-detail.ts` imports the parser and `board-model.ts`, and neither
imports a component. Four consumers: the card faces (C-08), the drawer
(C-09), the board root (C-18) and the map pane (C-12).

**WHY THIS EXISTS — IT IS AN EXTRACTION, AND IT IS THE HALF OF THE
CYCLE FIX THAT DOES THE WORK (T-127-s6; @human's no-cycles ruling of
2026-08-25).** Not one byte of code moved and no import was severed. The
registry carried `C-08 -> C-09 -> C-08` from before the ruling: C-08 held
`Board.tsx` (which reaches the drawer) beside `board-model.ts`, and C-09
held `task-detail.ts` (which reads `board-model.ts`) beside the drawer, so
each component owned a file the other's files needed. **The underlying
files are a DAG** — over the whole committed graph the only file-level SCC
in this repository lies inside C-07 (`T-127-s3`), and none of these files
takes part in any cycle — so the tangle was the BOUNDARY's and the
sanctioned remedy is extraction, exactly as C-16 was extracted from C-05
at T-033.

**THE ALTERNATIVE WAS MEASURED AND REFUSED, NOT ARGUED AWAY.** The
minimal acyclic re-partition moves `TaskDetailPanel.tsx` into C-08 and
`board-model.ts` into C-09 and is also acyclic at 13 components — cheaper
by four red assertions (`T-127-s1` measured both). It leaves "Detail
panel" owning the board's model and "Board pane" owning the drawer:
names that no longer describe their contents, which is how this cycle was
born. T-127-s1's criterion asks for the partition argued on the merits
rather than on minimality, and both were run before the choice was made.

**THE SLUG IS DELIBERATELY `app-board` AND NOT A NEW WORD**, on C-16's
precedent and for C-16's reason. These two files are C-08's and C-09's
today, so `app-board` is exactly who may edit them; a new slug would
NARROW every live card whose `touches:` reads `[app-board]` as a side
effect of a registry tidy-up, and a fence that moves without a dispatch
is the one thing the slug table exists to prevent. `app-board` was
already a multi-component slug (C-08, C-09, C-11); it now holds five.
