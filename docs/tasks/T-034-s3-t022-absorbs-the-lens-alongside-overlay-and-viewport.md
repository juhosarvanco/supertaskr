---
id: T-034-s3
title: T-022 absorbs the lens alongside overlay and viewport — the seam now has four members, not three
status: suggested
suggested_by: executor claude-opus-5 @T-034
---

T-012's plan §3 flagged a seam: the design bundle says the map pane's
view state is "persisted per project", but that is app-preference state
and T-022 owns it ("one store, one precedence order"), so T-012 shipped
`overlay`, `selection` and `viewport` as SESSION-EPHEMERAL `useState`
inside `MapView`, with a note that T-022 (or a follow-up) absorbs them.

T-034's criterion 1 repeats the ruling verbatim for the new member —
"lens view-state is session-ephemeral until T-022 (the T-012
overlay-state precedent)" — so `lens` is now the FOURTH item on that
seam and the one a user will notice first, because it is the only one
that changes what the pane is *about* rather than how it is tinted.

The concrete list T-022 should absorb, with today's homes:

| state | today | default each launch |
|---|---|---|
| `lens` | `MapView.tsx` `useState<MapLens>` | `architecture` |
| `overlay` | `MapView.tsx` `useState<MapOverlay>` | `status` |
| `viewport` (architecture) | `MapView.tsx` `useState<Viewport>` | identity |
| `viewport` (tasks) | `TasksLens.tsx` `useState<Viewport>` | identity |

Two things worth deciding at the same time rather than after:

- **The two viewports are separate on purpose.** The lenses have
  different coordinate spaces (192×66 nodes on a 216px pitch vs 240×58
  cards on a 300px pitch), so sharing one pan/zoom would teleport the
  reader on every switch. If they persist, they persist as two.
- **The bundle's list is longer than what exists.** README's state
  section also names `pins`, `expandedComponentIds` and
  `selectedFilePath` as persisted-per-project; those belong to T-015 and
  T-013 and do not exist yet. T-022's precedence order should be written
  so adding them later is a row, not a redesign.

This is a one-line reconciliation on T-022's criteria (add `lens`), not
a task of its own — filed so it cannot be missed the way T-049-s2's
criterion mismatch nearly was.
