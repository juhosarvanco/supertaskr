---
id: T-137-s6
title: The terminal's worst-blocker line says `planned` where the pane says `rejected ×N`, because the verdict classifier could not follow the schedule out of the app
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [app-shell, lib-parser]
---

**ONE WORD, AND IT IS THE ONE A HUMAN READS FIRST.** `T-137` moved the
schedule into `lib/parser` and handed `rejectedVerdictCount` IN as
`SelectScheduleOptions.rejectedCountOf`, defaulting to zero. The map pane
supplies it. The terminal consumer cannot: `rejectedVerdictCount` and
`verdictEntries` live in `app/src/lib/verdicts.ts`, which is **C-16,
`touch_slugs: [app-shell]`** — outside `T-137`'s fence and held by a live
lane while it built.

So `brief.mjs --dispatch` prints

    worst blocker: T-065 One wire, one shape … · planned, holds 2

where the pane would print `· rejected ×2, holds 2` if that card had a
verdict history. **Same card, same holds, one word** — and the command
says so in its own output rather than leaving it to be discovered.

**THE MOVE IS SMALL AND THE ARGUMENT IS `T-057`.** `verdicts.ts` is pure,
total, and reads only the raw `## Verdicts` markdown the parser already
carries on every `TaskRecord`. Moving `verdictEntries` and
`rejectedVerdictCount` into `lib/parser` makes `rejectedCountOf` the
DEFAULT instead of an injection, and the pane's `task-detail.ts` tinting
and the board's `rejected ×N` face count go on sharing the one classifier
they already share — one component further down.

**WHAT TO WATCH.** `verdicts.ts`'s module comment records WHY it is its
own module: the panel's tint and the board's count must share one
classifier, and `task-detail.ts` imports from `board-model.ts`, so the
shared family lives in C-16 to keep the graph acyclic. **Moving it to
C-06 does not break that** — everything already depends on the parser —
but the comment has to move with the reasoning intact.
