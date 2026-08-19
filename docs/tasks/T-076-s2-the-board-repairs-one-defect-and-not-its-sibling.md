---
id: T-076-s2
title: The board repairs duplicate-id and not aliased-id, and nothing says so
status: suggested
suggested_by: executor claude-opus-5 @T-076
---

Measured while writing T-076's backbone `duplicate-id` message, which
now states a board consequence and therefore had to be true rather than
plausible. `selectBoard` keys its columns on the EXACT feature id string
and skips a repeat — `app/src/lib/board-model.ts:248-249`, "duplicate
backbone id: first wins, issue already flagged" — so the two roadmap
defects land in opposite places:

- an exact duplicate (`F-01` twice) collapses to ONE column: the first
  declaration wins and the second bullet's name and description are
  discarded. The parser reports it; the board repairs it.
- a padding alias (`F-1` beside `F-01`) renders TWO columns, and task
  routing at `board-model.ts:272-274` is an exact-string
  `byFeature.get(task.feature)`, so a mis-padded task does not even
  reach `unmapped` — it reaches the WRONG REAL COLUMN. The parser
  reports it; the board does not repair it.

`git grep idSlotKey -- app/src` returns nothing: there is no slot
normalization anywhere on the app side, so `aliased-id` is purely
advisory as far as the board is concerned, and `app/test/select-board.test.ts`
has no `F-1`-beside-`F-01` case at all. That is defensible — a parser
flags and a renderer renders — but it is currently undocumented, and the
`aliased-id` message asserts the split-column harm as a fact while
nothing pins it on the side where it happens.

Two things worth deciding together: whether `selectBoard` should route
by slot when the parser has already reported the alias (repairing both
defects rather than one), and whether the board should gain the
`F-1`/`F-01` pin either way. Related to but distinct from T-077, which
is about what the app RENDERS about these issues; this is about what it
DOES with them. Outside T-076's fence (`app/src/**`).
