---
id: T-126-s9
title: Nothing CALLS the join — `T-126-s2` built it, and the two files that render `<Board>` are `app-shell`, so the drawer's dispatch block still cannot render outside a suite
feature: F-04
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "T-126-s2's executor, from inside the [app-board, app-dispatch] fence that reaches the join and neither of its callers"
blocked_by: []
touches: [app-shell, app-dispatch]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**F-04's DISPATCH BLOCK IS NOW ONE CALL SITE AWAY, AND THE CALL SITE IS
NOT IN ANY FENCE THAT COULD BUILD THE JOIN.** `T-126-s2` built the ruled
shape — `joinLanes(scan, board)` in `app/src/lib/dispatch-store.ts`,
fifteen bodies under it — and it changed nothing a user can see, for a
reason that is structural rather than an oversight.

## The chain, and where it stops, at `T-126-s2`'s tip

- `Board.tsx` takes `dispatch?: DispatchReading` and threads it VERBATIM
  to `TaskDetailPanel`, pinned in `app/test/board-truth.test.tsx` since
  `T-112-s1`.
- **Two files render `<Board>` and NEITHER passes it**:
  `app/src/App.tsx` (`<Board model={model} />`) and
  `app/src/genesis/BoardCrescendo.tsx` (`<Board model={docs.model} />`).
  Both are C-05's `app-shell`.
- `joinLanes` needs a `LaneScan`. The only producer is the registered
  `dispatch_lanes` command, and `dispatch-store.ts` has no door onto it.

## Two things are owed and they are not the same size

1. **A RULING, and it already has a card.** `T-126-s1` (parked) is the
   `DispatchLanesOutcome` wrapper the TS mirror does not know:
   `dispatch_lanes` answers `{kind:"noProject"} | {kind:"answered",
   scan}` and nothing here mirrors that. Its own parking note names the
   resurface condition — *"the first frontend call of `dispatch_lanes`"*
   — and says the choice belongs to whoever holds `[app-dispatch]` when
   it happens: mirror the wrapper, or fold "no project is open" into
   `LaneScan` as a sixth kind so ONE fence owns ONE type. `T-126-s2` held
   `[app-dispatch]` and deliberately did not take it, because its own
   dispatch was to build the ruled shape and nothing else; taking a
   second architecture decision to make a card's output visible is the
   move `T-112-s1` also declined and this family keeps declining on
   purpose.
2. **The wiring**, which is small once (1) is settled: the composition
   root reads lanes, joins them against the parsed board it already
   holds, and passes the result down.

**DO (1) FIRST AND IN ITS OWN CARD.** A lane that wires the root will
mirror the wrapper by reflex on the way past, which is precisely what
`T-126-s1` says deletes the finding instead of deciding it.

## The IPC census moves, and that is a THIRD file

`app/test/crescendo-dom.test.tsx` holds `frontendCommands()` against the
Rust handler list, and `dispatch_lanes` is deliberately absent from the
frontend side there today — T-126's own comment says so in as many
words. The first frontend call flips that entry, so the census fixture is
part of this card's diff and it is C-05's too.

## Fence

`[app-shell]` for `App.tsx`, `BoardCrescendo.tsx` and the census
fixture; `[app-dispatch]` for the door in `dispatch-store.ts`. Both are
needed in one lane: a door with no caller reopens `T-126-s1`'s finding
one card later, and a caller with no door does not compile.

## Two stale sentences this card's diff also owes, swept at `T-126-s2`'s tip

`T-126-s2` ran the class sweep its fix owes (*A FIX NAMES ITS CLASS AND
ITS SWEEP*) for sentences its change falsifies — the class being *"the
join is not in TypeScript / has no shape"*. Three sites carried one; it
repaired the one inside its fence (`TaskDetailPanel.tsx`'s `dispatch`
prop doc) and could reach neither of these:

- **`app/src-tauri/src/lib.rs`**, `dispatch_lanes`'s doc comment:
  *"the join stays reachable to Rust callers and is `T-126-s2`"*, under
  the heading **WHAT IT DELIBERATELY DOES NOT DO IS JOIN**. The heading
  is still true of the command; the trailing clause now points at a card
  that is built. `app-shell`, which this card already holds.
- **`docs/architecture/components/C-15-dispatch.md`**, the *WHAT THIS
  UNBLOCKS* section: *"the join goes to TypeScript behind a test path …
  It does not supply the path"*. Written before `T-198`, already carrying
  one blockquote correcting itself; it now needs a second. That file is
  `T-126-s3`'s standing class (*C-15's file and module header describe a
  wiring that no longer exists*) rather than this card's, and is noted
  here only so the sweep is recorded complete.

The sweep was shown capable of finding something before its remainder was
written down: the same grep over `no second copy` returns three live
sites in `app/src` and `app/src-tauri/src`.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-126-s2 merge

The architect seat. The door: nothing passes a dispatch prop to Board, and the shipped app does not render the block; F-04 product work, with T-126-s1 parked as its ruling. No dispatch follows today by the user's instruction.
