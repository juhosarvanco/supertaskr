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

## NOTE FROM `T-112-s4`'s LANE, 2026-08-31 — the fourth criterion has no file it may be written in

`T-112-s4` held `board-model.ts` and `select-board.test.ts` — two of this
card's named files — and **did not touch either**, so nothing here is
stale on account of that lane. What it changed is the diagnosis.

**A body that constructs a `hydrateJoin` reading and holds it against the
board's `DispatchReading` has to import BOTH `dispatch-store.ts` (C-15)
and `board-model.ts` (C-17). No test file in this repository may do that
today**: C-15 declares no `app/test/**` path at all, and no other
component's test file declares C-15 either, so the import would be the
undeclared component edge `arch drift` caught at T-169. Filed as `T-190`.
This card's `touches: [app-board, app-dispatch]` does not by itself solve
it, because a slug expands to the registry as it stood at dispatch — so
either take `T-190` as a `blocked_by`, or have the dispatch name the test
file in `touches:` directly. The mechanism is written out in
`C-18-board-root.md` and in `T-112-s6`.

**AND THE STRUCTURAL CAUSE IS THE SAME ONE.** This card asks how two
shapes for one fact drift apart unnoticed. The answer is not only that
`board-model.ts` does not import `dispatch-store.ts` — it is that
**nothing does**, so neither a compiler nor a suite is positioned to
notice. That is C-15's missing test path again, and it is why the
criterion demanding the equivalence be held BY CONSTRUCTION is the right
criterion and is currently unbuildable.

## Read beside

`T-126-s2` (where the join runs — this card is inside the boundary that
ruling names), `T-112-s4` (the registry gap that leaves this whole seam
without a test path), and `T-033-s11` (two implementations of one fact,
measured).

## THE PRODUCER CHAIN IS THREE LAYERS DEEP AND EVERY ONE OF THEM PRESERVES BOTH FACTS ON PURPOSE

Added at the same sitting, after following the fields back to their
source. **This is not a TypeScript-side oversight; it is a complete,
argued producer chain whose last boundary discards the result.**

- **`lanes.rs`** sets `truncated` in two places — on a read error and on
  the entry ceiling — and its doc comment says a repository that exceeds
  the ceiling *"gets a FLOOR with `truncated: true`."* That file also
  carries an **argued rejection of the obvious repair**: truncating as the
  collection is built is called *"the WRONG one"*, because truncating
  before the sort *"returns whichever entries the filesystem happened to
  hand back first, which trades a deterministic answer for a smaller
  `Vec`."* The flag exists so a bounded answer can still be an HONEST one.
- **`join.rs`** partitions the scan and its `LaneRegistration::of` comment
  reads: *"`None` for every entry that is not a lane — those are **carried
  whole** in `DispatchJoin::Joined::not_lanes` rather than dropped."*
- **`hydrateJoin`** carries both across the wire verbatim.
- **`DispatchReading` has nowhere to put either**, and the board renders
  from that.

**So a design decision argued at length in Rust — that a truncated answer
must announce itself rather than silently shrink — is undone at the
TypeScript boundary by a type with two fewer fields.** Three sites say
"never dropped" and "the answer is a floor"; the fourth drops them.

That is the strongest available argument that the loss is UNINTENDED, and
it narrows this card's first decision considerably: deleting the fields
at the producer would mean deleting `lanes.rs`'s determinism argument
too, which is almost certainly wrong. **The likely correct answer is that
`DispatchReading` grows both fields and the board gains its note** — but
the lane should still make the case rather than inherit this one.
