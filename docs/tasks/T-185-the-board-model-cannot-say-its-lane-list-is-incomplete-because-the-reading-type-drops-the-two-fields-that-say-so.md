---
id: T-185
title: The board cannot say its lane list is incomplete — `DispatchReading` drops `notLanes` and `truncated`, the two fields whose own doc comments forbid dropping them, and a test comment claims the two types are one shape
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [app-board, app-dispatch]
suggested_by: architect/integrator seat @ the architecture sitting of 2026-08-31, measured while ruling T-126-s2 — found by checking a claim rather than by reading code
builder:
review:
---

**FOUND BY CHECKING A CLAIM THAT TURNED OUT TO BE FALSE, WHICH IS THE
ONLY REASON IT WAS FOUND.** The sitting set out to test whether
`T-126-s2`'s third shape had been un-refuted by new test coverage. It had
not. But the measurement walked into this on the way, and this is the
larger finding.

## Two types for one fact, in two files, and nothing makes them agree

`app/src/lib/dispatch-store.ts:267` — what `hydrateJoin` **produces**:

    | { kind: "joined";
        rows: ReadonlyMap<string, DispatchRow>;
        notLanes: readonly WorktreeEntry[];
        truncated: boolean }
    | { kind: "unavailable"; because: LaneScanRefusal; sentence: string }

`app/src/lib/board-model.ts:660` — what the board **renders from**:

    | { kind: "joined"; rows: ReadonlyMap<string, DispatchStamp> }
    | { kind: "unavailable"; sentence: string }

**Three differences, and two of them are dropped facts:**

1. `rows` is keyed to `DispatchRow` on one side and `DispatchStamp` on
   the other.
2. **`notLanes` does not survive.** Its own doc comment at the producer
   reads *"Worktrees that are not lanes: reported, never dropped."* It is
   dropped.
3. **`truncated` does not survive.** Its own doc comment reads *"The
   reader hit its entry ceiling: the answer is a floor."* The board
   renders that floor as though it were the whole.

**`board-model.ts` does not import `dispatch-store.ts` at all** — it
imports `@nputer/parser/pure` and `./verdicts` and nothing else. So the
two shapes are structurally unrelated and no compiler, on any edit, can
notice them diverging further.

## The measurement: both fields are produced and read by NOTHING

- `notLanes` occurs **three times in the whole of `app/src`**, all of
  them inside `dispatch-store.ts`: two type declarations and one
  assignment in `hydrateJoin`. There is no consumer.
- The dispatch scan's `truncated` likewise has no consumer. Every other
  `truncated` in `app/src` is a **different fact** — `shell.docs.truncated`
  is the docs tree, and `truncatedSymbols` / `truncatedFiles` belong to
  the architecture graph.

`hydrateJoin` carefully carries both fields across the wire and hands
them to a boundary that has nowhere to put them.

## WHY THIS IS NOT A MATTER OF TASTE: the project already ruled the case

`app/src/App.tsx:660` renders a visible note when the DOCS tree is
truncated — *"docs truncated · showing first N files"* — carrying T-018's
"quiet truncation note" comment. **So this repository has already decided
that a truncated read must say so on screen.** The dispatch scan's
truncation gets no note, and could not have one, because the type it
reaches has no field for it.

The user-visible consequence is exact: **the board cannot tell @human
that its lane list is a floor rather than a count**, and cannot report a
worktree that is not a lane. Both silences are invisible from inside the
board, which is the property that makes this worth a card rather than a
comment.

## And a false claim in a test, which is how the drift is currently hidden

`app/test/select-board.test.ts:867` reads:

    /** A `DispatchReading` from rows, in the shape `hydrateJoin` produces. */

It is **false**, and provably so: the fixture beneath it builds
`{kind:"joined", rows}` with neither `notLanes` nor `truncated`, and
`DispatchJoin` requires both. Were the two types one shape, that fixture
would not compile. **The claim lives in prose, so the compiler cannot
reach it** — the same failure family as `T-033-s11`'s two engines
disagreeing about one registry, arriving here as one comment asserting an
equivalence between two types that were never connected.

`app/test/detail-assignment.test.tsx:150` builds the same degenerate
`NO_LANES` value, so **no test in the repository has ever constructed a
reading with a populated `notLanes` or with `truncated: true`.**

## What a fix decides

1. **Whether the loss is intentional.** It may be: the board may have no
   business rendering non-lane worktrees. **If so, say it at the site and
   delete the fields at the producer** — a field produced for no reader,
   with a comment forbidding its being dropped, is worse than either
   honest alternative. If it is not intentional, `DispatchReading` grows
   the two fields and the board gains its note.
2. **Whether the two types should be ONE.** `T-057`'s rule points that
   way, but they sit on opposite sides of a real boundary and the row
   types genuinely differ. An adapter that is *named* as the lossy step
   is the third option and probably the right one.
3. **The comment goes either way.** Whatever is decided, a prose claim of
   type equivalence must not be what holds it — that is the defect this
   card is partly about.

## Acceptance criteria

- THE `notLanes` and `truncated` facts SHALL either reach a consumer or
  be removed at the producer, and whichever is chosen SHALL carry its
  reason at the site.
- WHERE the lane scan is a floor rather than a count, the board SHALL say
  so, consistent with the docs tree's existing truncation note — or the
  card SHALL state why the two cases differ.
- NO comment SHALL assert that two types are one shape; if an equivalence
  is load-bearing, a body SHALL hold it by CONSTRUCTING one from the
  other rather than by describing it.
- A body SHALL construct a reading with a populated `notLanes` and one
  with `truncated: true` — **neither has ever existed in this suite**, and
  a positive control SHALL prove each body reds without the fix.
- Verification: headless, the app suite.

## Read beside

`T-126-s2` (where the join runs — this card is inside the boundary that
ruling names), `T-112-s4` (the registry gap that leaves this whole seam
without a test path), and `T-033-s11` (two implementations of one fact,
measured).
