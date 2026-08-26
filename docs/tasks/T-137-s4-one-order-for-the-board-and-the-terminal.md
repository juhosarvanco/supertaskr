---
id: T-137-s4
title: The board and the terminal now agree about what is READY and still disagree about what is FIRST — `T-111-s5` option (a), with the measurement that makes it cheap
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [app-board, lib-parser]
---

**`T-111-s5` NAMED THE ONE DECISION `T-137`'s CRITERIA DO NOT SETTLE, AND
`T-137` COULD NOT TAKE IT.** Where the column ORDER lives. s5 recommended
option (a) — move `selectBoard`'s milestone-1-first / priority-asc / id-asc
rule into the parser so the board becomes a view over a shared order.

**`T-137` TOOK OPTION (c) KNOWINGLY AND SAYS SO.** `selectBoard` and
`topmostUndoneByColumn` live in `app/src/lib/board-model.ts`, which is
C-08 `app-board` — outside `T-137`'s fence `[lib-parser, app-map,
tools/e2e]`. So the terminal got `byDispatchRank` in `lib/parser/src/lanes.ts`:
milestone asc, then `priority:` asc, then id asc, all three read off
frontmatter the parser already models. **Two orders, one fact**, recorded
here rather than argued away.

**WHAT `T-137` DID TO MAKE THE UNIFICATION CHEAP.** `readDispatchOrder`
takes `options.order` — an explicit id order — exactly the way
`selectDispositions` takes `topmost` as a parameter. It is pinned (`a
caller with its own order overrides it`). So option (a) is now: move the
comparator and the grouping into the parser, have `board-model.ts` import
them, and have the CLI pass `topmostUndoneByColumn(model)`. **No caller
has to change shape.**

**AND THE PART THAT IS STILL GENUINELY MISSING.** `orchestrator.md` step 4
dispatches *"among the topmost undone tasks of each feature COLUMN"*, and
`byDispatchRank` has no column grouping at all. So the terminal's order is
a strict-priority list where the board's is a per-column frontier. **They
can disagree today, and nothing tells a reader which one they are looking
at.** That is the argument for doing this rather than leaving it.
