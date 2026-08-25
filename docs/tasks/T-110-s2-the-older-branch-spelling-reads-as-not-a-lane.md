---
id: T-110-s2
title: The older tNNN- branch spelling reads as "not a lane", and whether that is right is a ruling nobody has made
status: suggested
suggested_by: executor claude-opus-5 @T-110
---

**Addressed to the PLANNER or the ARCHITECT** — it is a question about
what a lane IS, not about the reader that answers it.

T-110's positive shape accepts exactly `task/T-<digits>-<slug>`, which
is what `docs/CONVENTIONS.md`'s LANE PROTOCOL bullet spells and what the
card's own problem statement quotes (`ref: refs/heads/task/T-NNN-<slug>`).
Anything else is reported as `WorktreeEntry::NotALane` with a typed
reason — reported, never dropped.

**But the same bullet says both branch spellings are live in this
repository and the older one is not a mistake to fix**: derived at
`4d2f03c`, 69 branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`. So a
worktree checked out on `t042-genesis-switch` would be shown by the
board as *not a lane*, with `notTheLaneNamespace` as its reason.

## Why this is filed rather than fixed

Three arms, and picking one from inside the lane would be inventing:

- **(a) Leave it.** The old spelling belongs to branches that ran and
  finished; `git worktree list` has never held one in this session, and a
  reader that accepts only the current protocol is a reader that tells
  you when someone has departed from it.
- **(b) Widen the grammar** to a second shape, `t<digits>-<slug>` with
  the id built as `T-<digits>` — five lines, and it makes an entry that
  is genuinely a lane read as one.
- **(c) Widen and MARK it**, so the row carries which spelling it
  matched. This is the only arm that lets the board say *"this lane is on
  the old spelling"*, which is a fact worth showing exactly once.

The cost of getting it wrong is asymmetric and that is the argument for
ruling rather than defaulting: under (a) a real lane reads as a stray
worktree, and the board's whole point is that a stray worktree is news.

The trigger is written into the module's own header
(`app/src-tauri/src/dispatch/lanes.rs`, the "WHAT THIS DELIBERATELY DOES
NOT DO" list), so whoever changes the grammar meets this question in the
file rather than in a card.

Fence: `[app-dispatch]` — the grammar and its tests are both inside it.
