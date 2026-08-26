---
id: T-111-s5
title: What T-111 landed in the board, and exactly what T-137 has to move — the move list, plus the ONE decision T-137's criteria do not settle
status: suggested
suggested_by: executor claude-opus-5 @T-111
touches: [lib-parser, tools/e2e]
---

**THIS CARD IS SUBORDINATE TO `T-137` AND EXISTS ONLY TO FEED IT.** T-137
landed on main at `cf470f5`, while this lane was building, and its first
acceptance criterion is *"IF `T-111` has landed a board-local
implementation by the time this runs THEN this card **moves** it and says
what moved, rather than adding a second."* **This is the "what moved"
half, written by the seat that built it, so T-137 does not have to
reverse-engineer it.**

The architect's mid-lane steer said the same thing in advance and this
lane acted on it: *build the board, but do not put a reusable fact
somewhere only the board can see it.*

## What exists, and where

All of it in `app/src/lib/board-model.ts` (C-08, `app-board`), pinned in
`app/test/select-board.test.ts` (C-05, `app-shell`):

| symbol | what it is |
|---|---|
| `selectDispositions(model, dispatch, topmost?)` | the derivation — six dispositions, each with a reason SENTENCE |
| `DISPOSITIONS`, `Disposition` | the closed six |
| `CardDisposition`, `UnmetBlocker`, `BlockerBinding`, `FenceClash` | the answer's shape |
| `DispatchReading`, `DispatchStamp`, `LaneHold`, `LaneJoinState` | the lane reader's answer, mirrored structurally |
| `InFlightLane`, `DispositionModel` | the model, with `headline` and `ceilingReached` |
| `normaliseTouchToken`, `touchTokensOverlap` | ONE normalisation, containment included, ceiling documented |
| `expandTouch`, `fenceClashes` | disjointness over EXPANDED component paths |
| `CONCURRENCY_CEILING` | `orchestrator.md` step 4's 3–5, asserted against the live doc |
| `topmostUndoneByColumn` | **the one board-shaped thing** — see below |

## What moves cleanly, and what does not

**EVERYTHING EXCEPT `topmostUndoneByColumn` MOVES UNCHANGED.** It was built
that way rather than found to be that way: no React, no DOM, no IO, and
the only import outside the module is the parser's TYPES
(`ComponentRecord`, `ParseIssue`, `ProjectParseResult`, `TaskRecord`,
`TaskStatus`). The lane reader's four states are mirrored STRUCTURALLY
rather than imported from `app/src/lib/dispatch-store.ts`, so nothing
carries a C-15 dependency across.

**`topmostUndoneByColumn` CANNOT MOVE AS IT STANDS.** `orchestrator.md`
step 4 dispatches *"among the topmost undone tasks of each feature
column"*, so the derivation needs a column ORDER — and this repository has
exactly one, `selectBoard`'s T-004 ordering. The frontier takes that order
as a PARAMETER, defaulted to `topmostUndoneByColumn(model)`, so the
coupling is one function and one default rather than a thread through the
body. `the column order is an INPUT, so the derivation is not board-local`
pins it, and drill arm A30 kills exactly that one body and nothing else.

**THE ONE DECISION T-137'S CRITERIA DO NOT SETTLE: where the ORDER lives.**
If the frontier moves and the order does not, a terminal session must
spell its own — which is T-057 one layer down, in the card whose whole
subject is T-057. Three options, and the recommendation is (a):

- **(a) MOVE THE ORDERING TOO.** `selectBoard`'s milestone-1-first,
  priority-asc, id-asc, file-asc rule becomes the parser's, and
  `board-model.ts` becomes a view over a shared order rather than the
  owner of one. It is the only option where the board and the architect
  can never disagree about which card is next. It touches T-004's
  behaviour, so it wants its pins moved with it — `select-board.test.ts`
  already has them.
- **(b) EXPORT THE COMPARATOR ALONE** and let each consumer group by
  column itself. Cheaper, and it leaves the grouping duplicated.
- **(c) LEAVE IT.** The board passes its order; the CLI passes its own.
  Two orders, one fact. **Not recommended, and named so the choice is
  visible.**

## Two more inputs T-137 will want, measured here

1. **The lane list must be filtered on the BRANCH, and this lane is the
   live proof.** At **12:12 EEST on 2026-08-26** the repository had **nine
   worktree entries and three lanes**: main's checkout, `../nputer-app`,
   `../arch-verify`, and **four detached scratch checkouts** — this card's
   drill at `/private/tmp/t111d` and T-134's two at `/private/tmp/t134b`
   and `/private/tmp/t134v`. A path filter would have reported six.
   T-137's criterion is right and the ratio it cites is not historical.
2. **`dispatch-brief.mjs`'s copy and this one differ in a way worth
   diffing before either wins.** T-137 names the duplication; here is the
   delta from this side. That copy's `pathsOverlap` strips a trailing
   `*`/`/` and tests separator-anchored containment — **the same rule this
   card reached independently**, which is the good news. What differs:
   this card's `expandTouch` reports a token's KIND (`slug` vs `path`) and
   the component ids it resolved through, so a `fenced` reason can say
   *"both expand through C-11, so this may be the coarse fence rather than
   a real overlap"*; and `fenceClashes` returns the shared PATHS rather
   than a boolean. **The reason text is the half `T-111`'s title calls
   "and WHY the rest are not", and it needs the provenance, not the
   verdict.** Whichever copy survives should keep that.
