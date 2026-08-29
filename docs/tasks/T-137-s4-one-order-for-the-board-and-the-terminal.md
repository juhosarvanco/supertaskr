---
id: T-137-s4
title: The board and the terminal now agree about what is READY and still disagree about what is FIRST — `T-111-s5` option (a), with the measurement that makes it cheap
status: parked
suggested_by: executor claude-opus-5 @T-137
touches: [app-board, lib-parser]
---

Absorbs: T-111-s7 (Amnesty triage 2026-08-29 (triage seat)) — the third surface answering the same question with a third vocabulary: readSchedule agrees on the RULE — it asks each blocker's own status rather than trusting the field, which is why the map's tasks lens has always read correctly — and disagrees on the WORDS, folding a dangling blocker into "blocked" (the exact fold T-111-s4 forbids), giving parked no binding of its own, and carrying a waits/blocked distinction the frontier lacks and should KEEP.

Absorbs: T-137-s6 (Amnesty triage 2026-08-29 (triage seat)) — the same unification, one symbol over: rejectedVerdictCount and verdictEntries are still injected into the schedule rather than shared, so brief.mjs --dispatch prints "planned" where the pane prints "rejected ×2" for the same card. Same argument (T-057), same direction (move a pure total function down into lib/parser), and the caution it carries must travel with it — verdicts.ts's module comment records WHY it is its own module, and the reasoning has to move intact.

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

Amnesty triage 2026-08-29 (triage seat): PARKED — the owner of the finish-T-137's-unification class: three surfaces answer the same three questions with three implementations, and T-137 moved only the schedule. What survives is measured and made cheap on purpose — readDispatchOrder already takes options.order the way selectDispositions takes topmost, and it is pinned, so option (a) moves a comparator and a grouping with NO caller changing shape. The part still genuinely missing is the argument for doing it: orchestrator.md step 4 dispatches among the topmost undone tasks of each feature COLUMN, byDispatchRank has no column grouping at all, so the terminal's strict-priority list and the board's per-column frontier CAN disagree today and nothing tells a reader which one they are looking at. RESURFACES: the next app-board dispatch — T-112 is that card and is the board's most colliding one, so derive the flip pairs first. The absorbed map arm (readSchedule) adds app-map to the fence.
