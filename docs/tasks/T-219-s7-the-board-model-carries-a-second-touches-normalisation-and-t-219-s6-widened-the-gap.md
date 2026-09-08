---
id: T-219-s7
title: "`normaliseTouchToken` in the board model is a SECOND `touches:` normalisation, and T-219-s6 widened the gap from two diverging shapes to six — the app's fence view calls `lib/./parser` disjoint from a lane holding `lib/parser`"
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219-s6, class sweep at 90038e9, 2026-09-09
blocked_by: []
touches: [app/src/lib/board-model.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`docs/ARCHITECTURE.md` names it already — *"Two implementations compute
it (C-06's `slugPathIndex`, C-08's `expandTouch`), which is T-057's own
failure shape and `T-137` was the vehicle for unifying them"* — so this
card is a MEASUREMENT of that gap and the instance `T-219-s6` added to
it, not a new discovery.

`normaliseTouchToken` in `app/src/lib/board-model.ts` (C-08, `app-board`)
performs three of `normalizeFenceToken`'s seven steps: trim, collapse
repeated `/`, strip a trailing star run and a trailing `/`. It does NOT
convert backslashes, does NOT strip a leading `./` run, and since
`T-219-s6` does NOT resolve a dot segment. `touchTokensOverlap` and
`fenceClashes` compare with it, so the BOARD'S fence view and the
PARSER'S answer differently for the same pair of tokens — and the board's
answer is the permissive one.

## Measured at `90038e9` + T-219-s6's lane tip

Driven through `lib/parser/dist/fence.js` (the shipped function) against
`normaliseTouchToken`/`touchTokensOverlap` transcribed verbatim from
`app/src/lib/board-model.ts` at the same ref. **Derive it again; never
quote this table.**

| pair | parser | board model |
|---|---|---|
| `lib/./parser` vs `lib/parser` | overlapping | **disjoint** |
| `lib/x/../parser` vs `lib/parser` | overlapping | **disjoint** |
| `docs/./tasks` vs `docs/tasks` | overlapping | **disjoint** |
| `app/src/board/../../src-tauri` vs `app/src-tauri` | overlapping | **disjoint** |
| `./lib/parser` vs `lib/parser` | overlapping | **disjoint** |
| `lib\parser` vs `lib/parser` | overlapping | **disjoint** |
| `lib/parser` vs `lib/parser` | overlapping | overlapping |

**Six of seven diverge after `T-219-s6`; two of the seven — the last two
spellings — diverged before it.** So this card did not create the class,
it added four shapes to it, and that is the honest accounting.

## Why it was not taken in `T-219-s6`'s lane

`app/src/lib/board-model.ts` is `app-board` (C-08) and `T-219-s6`'s fence
is `[lib-parser]`. A criterion that cannot be built inside the fence is
not built (`method/roles/executor.md`), and widening a fence from inside
a lane is the one repair that role may never make.

## What to build

- `normaliseTouchToken` and `touchTokensOverlap` SHALL agree with
  `normalizeFenceToken` and the parser's `sharedDomain` on every shape in
  the table above, DERIVED at the lane's own ref rather than pinned from
  it.
- The honest remedy is the one `T-137` names and `T-057` demands — ONE
  implementation. `@supertaskr/parser` is already an app dependency and
  `fence.ts` is a browser-safe pure export, so `expandTouch`/`fenceClashes`
  CAN call it; whether they should is this card's question and not this
  finding's claim.
- A body SHALL demonstrate the divergence FAILING against the current
  implementation before the fix, per A NEGATIVE ASSERTION NEEDS A
  POSITIVE CONTROL.

## Read beside

`T-137` (the unification vehicle), `docs/ARCHITECTURE.md`'s slug-map
paragraph, `T-057` (one fact, one implementation), `T-111-s3` (the
vocabulary measurement both normalisations descend from).
