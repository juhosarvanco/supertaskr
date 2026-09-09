---
id: T-285-s4
title: "A fence wake is a LEVEL and not an EDGE — the 16 cards WOKEN today un-wake the moment those three worktrees are removed, so a park can be resurfaced and re-forgotten without anybody having read the row"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-285 phase 2, 2026-09-09, measured at ce46115 on the bench /Users/ujju/Projects/nputer-V-T-285"
blocked_by: [T-285]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

Class parent: T-285. Disposition hint: probably a small amendment to
`ruleWake`'s fence arm rather than a card of its own — but it needs a
ruling on what "dispatched" means over time, and that ruling is the
architect's, not a lane's.

## What was measured

T-285's fence form answers *"has a lane been dispatched whose expanded
fence overlaps this card's"* by reading the LIVE lane list —
`laneWorktrees(worktreePorcelain(root), ...)`, the same reading the
view's THE LIVE LANES section takes. That is a coherent choice and the
body arms the same list the render spends; this is not a defect in what
was built.

It does mean the condition is a LEVEL and not an EDGE. Measured at
`ce46115`: `brief.mjs --dispatch --full` lists **16 of 129** parked
cards as WOKEN, and every one of them is held by `T-280`, `T-281-s8` or
`T-285`. When those three lanes merge and their worktrees are removed,
all sixteen rows disappear — the cards return to STILL PARKED with no
record anywhere that their condition ever held.

The card T-285 was filed against says a parked card *"resurfaces only
when a human re-reads the folder"*. A wake that exists only while a
worktree exists resurfaces the card only for whoever renders the view
inside that window. If nobody does, the card was woken and re-forgotten,
which is the same failure with a shorter period.

## What would settle it

Three readings, and the choice is a ruling rather than a preference:

- **Level, as built.** The condition is *a lane is live on this ground*.
  Cheap, honest, and the seat cutting the lane is exactly the reader the
  card's own text names. The cost is the window above.
- **Edge, from history.** *A lane HAS BEEN dispatched* — derivable from
  the integration log's dispatch stamps rather than from worktrees.
  Durable, and it never un-wakes; the cost is that the WOKEN list only
  grows, so it needs its own disposal act.
- **Level, with the window closed elsewhere.** Keep the reading and make
  the merge the moment the wake is spent: the integrator's checkpoint
  reads the WOKEN list before tearing the worktree down. No code change
  in this module at all — a protocol step in `roles/integrator.md`.

The third is the cheapest if it holds, and it is outside this fence,
which is why this is a suggestion and not a correction.
