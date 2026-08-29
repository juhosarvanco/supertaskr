---
id: T-127-s1
title: The surviving declared cycle C-08 -> C-09 -> C-08 cannot be removed from inside T-127's fence, and until it is, one command on main exits 1 by design
feature: F-06
milestone: 4
priority: 5
size: M
status: planned
blocked_by: []
touches: [docs/architecture/components/, app-shell, lib-parser]
suggested_by: executor claude-opus-5 @T-127
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29, and the board already
depends on it.** `docs/STATE.md`'s opening paragraph names this card by
id: *"`cargo run -p nputer-index -- arch cycles --root ../..` is exit 1
by design — the declared cycle `C-08 -> C-09 -> C-08` stands until
`T-127-s1` lands."* Every session is briefed on a red command, and the
briefing ends when this card does. That is the strongest promotion signal
in the backlog: a standing exception in the first document every session
reads, held open by one unbuilt criterion.

T-127's criterion 3 — *"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL
BE GONE, AND NO IMPORT SHALL BE SEVERED TO DO IT"* — is the one thing
that card did not build, and the reason is a fence rather than a
difficulty: the smallest acyclic re-partition reds two live-registry
fixtures under `app/test/**`, which is C-05's `app-shell`. This card
carries the fence the work needs.

## Acceptance criteria

- WHEN the registry is re-partitioned THE declared-cycle census SHALL be
  ZERO, derived at the lane's own ref rather than compared against a
  named pair — T-127's criterion was written over the census and stayed
  true under a history that moved, and that property SHALL be preserved.
- NO import SHALL be severed and NO source file SHALL move to achieve
  it. The paths move in the REGISTRY, not on disk. IF a fixer concludes
  a source file must move THEN it SHALL be routed as its own card rather
  than taken here (T-127's own words).
- THE partition SHALL be argued on the merits, not on minimality. The
  two-node re-partition this card measured is minimal and leaves
  "Detail panel" holding `board-model.ts`; the four-node extraction it
  proposes (a pure `Board model` component, the card faces, the panel,
  and a node for `Board.tsx` alone) is the architecturally honest shape
  and is **MARKED UNVERIFIED** — derived from the file graph and never
  run. WHICHEVER is taken SHALL be measured before it is written down.
- IF `Board.tsx` is folded into C-05 instead of getting its own node
  THEN the lane SHALL show it does not reintroduce a cycle — the refusal
  is measured: `BoardCrescendo.tsx` (C-13) imports `Board`, so C-05 would
  gain `C-13 -> C-05` beside the declared `C-05 -> C-13`.
- WHEN the registry moves THE three live-registry fixtures SHALL
  reconcile together and SHALL NEVER be loosened — `lib/parser/test/
  smoke.test.ts` (which pins the exact id array, so declaring a new
  component id moves it), `app/test/architecture-dogfood.test.ts` and
  `app/test/map-dogfood-render.test.tsx`. CONVENTIONS' DECLARING A
  COMPONENT gotcha governs.
- WHEN the change lands THE lane SHALL run `arch cycles --root ../..`
  unpiped and report its exit, AND `docs/STATE.md`'s standing exception
  SHALL be retired in the same integration — the paragraph exists only
  because this card is open.

## The record, kept verbatim

T-127's criterion 3 — *"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL
BE GONE, AND NO IMPORT SHALL BE SEVERED TO DO IT"* — is **NOT BUILT**,
because the fix lies outside `[crate-index, docs/architecture/components/]`
and a fence is never widened from inside the lane it fences
(`method/roles/executor.md`). Everything else the card asks for shipped.

## The census, derived at T-127's own ref `afe23c1`

**ONE declared cycle: `C-08 -> C-09 -> C-08`.** The card's own table says
*"On main today there are TWO — `C-08 ↔ C-09` and `C-05 ↔ C-12`"*; T-033
dropped `C-12 -> C-05` and the second one is gone. This is the criterion's
own design working: it is written over the CENSUS rather than over a named
pair, so it stayed true under a history that moved.

## What was measured, and why the boundary move is out of fence

The smallest re-partition of these two components' `paths:` that is
acyclic — `TaskDetailPanel.tsx` to C-08, `board-model.ts` to C-09, and
`C-08` dropped from C-09's `depends_on` — was applied on T-127's lane,
read back with `git diff`, and run:

| | before | after the re-partition |
|---|---|---|
| declared cycles (derived) | **1** | **0** |
| `arch` component edges | 36 | 36 |
| `npm test` from `app/` | **973 / 973, exit 0** | **6 failed / 967 passed, exit 1** |
| `npx vitest run` from `lib/parser` | 268 / 268 | **268 / 268, exit 0** |

The six failures are in exactly the two live-registry fixtures
`docs/CONVENTIONS.md` names — `app/test/architecture-dogfood.test.ts` (the
relation table, the findings list, the drift set: `expected [ 'C-10',
'C-12' ] to deeply equal [ 'C-10' ]`) and
`app/test/map-dogfood-render.test.tsx` (the 36-edge list). **Both sit
under `app/test/**`, which is C-05's `app-shell`.** The third fixture,
`lib/parser/test/smoke.test.ts`, holds only because no component ID
changed — it pins the exact id array, so any partition that DECLARES a new
component moves it too, and that fence is `lib-parser`.

The re-partition also materialises `D1:C-12->C-08` (`MapView.tsx` imports
`TaskDetailPanel.tsx`), so C-12's `depends_on` must gain `C-08` in the
same commit. That part IS inside `docs/architecture/components/`.

**Restored and proved**: `git diff` empty and sha256 identical per path
after the measurement.

## The partition to build, and the one that was only measured

The measured one above is minimal, not right: it leaves "Detail panel"
holding `board-model.ts` and "Board pane" holding the drawer. **The
architecturally honest fix is the ADP's sanctioned extraction, and it
needs FOUR nodes because the file order alternates twice**, derived from
the committed graph:

    board-model.ts, SliceLine, panel-dismissal, ReviewBadge, SizeBadge   (leaves)
      -> ModelBadge, task-detail.ts
        -> GhostCard, ParkedRow, TaskCard
          -> TaskDetailPanel
            -> FeatureColumn
              -> Board

- **`C-17 Board model`** (new): `app/src/lib/board-model.ts`,
  `app/src/lib/task-detail.ts`. Pure, React-free, four consumers
  (C-08, C-09, C-12 and the app suite). `depends_on: [C-06, C-16]`.
  Exactly C-16's shape one layer down.
- **`C-08 Board pane`**: the card faces — `FeatureColumn`, `GhostCard`,
  `ParkedRow`, `SliceLine`, `TaskCard`, `badges/**`.
- **`C-09 Detail panel`**: unchanged — `TaskDetailPanel.tsx`,
  `panel-dismissal.ts`.
- **a fourth node for `Board.tsx` alone**, which is the ONLY C-08 file
  that reaches the drawer. Folding it into C-05 instead is REFUSED and
  the reason is measured: `BoardCrescendo.tsx` (C-13) imports `Board`, so
  C-05 would gain `C-13 -> C-05` beside the declared `C-05 -> C-13` —
  a new cycle in place of the old one.

**MARKED UNVERIFIED** (tasks/TASK-FORMAT.md): the 4-node partition is
derived from the file graph and was NOT run against the suites. The
2-node one in the table above is what was measured.

## Fence

`[docs/architecture/components/, app-shell, lib-parser]` — the registry,
the two `app/test/**` fixtures, and the parser's id array if a new
component id is declared. No source file moves and no import changes;
if a fixer concludes one must, that is a third card (T-127's own words).
Nothing outside `app-board` is touched in `app/src`, and `app-board` is
NOT needed: the paths move in the registry, not on disk.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
