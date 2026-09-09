---
id: T-283
title: An executor performs an XS finding that lies INSIDE its own fence in the lane it is in, names it in the notes, and the verifier grades it as part of the diff — the filing rule routes out only what the fence forbids
feature: F-06
milestone: 4
size: S
priority: 2
status: building
suggested_by: "@human (2026-09-09): decision A of the backlog review — \"Could the sessions themselves do the tasks instead of doing the whole ceremony from the beginning?\" — ruled yes for findings inside the lane's own fence"
blocked_by: [T-279, T-281]
touches: [method/roles/executor.md, method/roles/verifier.md, method/lane-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the third sitting of 2026-09-09 the board carried 353 sub-cards
(T-NNN-s<n>): 81 merged, 70 planned, 124 parked, 78 still suggested.
Every one of the fifteen filed the night before is size S, and every
one that merged went through the whole lane — dispatch, build, the
two-spawn bench, merge, battery, push — about two hours of wall clock
for changes that were often ten to thirty lines. The filing rule
(executor step 5, verifier step 6: anything you noticed but did not do,
file it and let it go) does not create the findings; it routes them out
of the lane so the diff stays inside the fence. For a finding whose
remedy lies wholly INSIDE that fence the routing buys nothing: the same
files, the same verifier, the same bench would have graded it in the
same pass, and instead it waits in a pile that grows five cards for
every one closed.

## Acceptance criteria

- WHEN an executor notices, while building, a defect or omission whose
  remedy lies wholly inside its armed fence, needs no new acceptance
  criterion, and moves fewer than about twenty lines THE executor SHALL
  perform it in the lane, and the implementation notes SHALL list it
  under a heading "In-fence follow-through" with the lines it moved and
  the property it restores — no card is filed for it.
- WHEN the remedy touches a path outside the fence, or would add a
  criterion, or exceeds that size THE executor SHALL file it as a
  suggested card exactly as today — the fence decides, never the
  effort.
- WHEN the verifier reads the diff THE follow-throughs SHALL be graded
  as part of it: each gets its own attack lines and, where a property
  lives, its own mutant; a change the notes' follow-through list does
  not name SHALL be a finding (undeclared surface), and a REJECTED
  verdict may cite a follow-through alone.
- WHEN executor.md, verifier.md and lane-protocol.md are read THE rule
  SHALL be stated once, beside the filing rule it narrows, with the
  reason (a two-hour lane for a twenty-line change is the cost the
  board is paying) and the three limits (inside the fence, no new
  criterion, the size); the method eval gate SHALL run and the bump
  SHALL carry its eval block.
- IF a lane's follow-throughs exceed three THEN the notes SHALL say so
  and the seat SHALL read it at triage as a sign the card was
  under-specified — a fact for the next card, never a refusal of the
  lane.
- IF a follow-through reds an existing body THEN the executor SHALL
  revert it and file the card instead — a follow-through never widens
  what the verifier must re-derive beyond the fence's own suites.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
