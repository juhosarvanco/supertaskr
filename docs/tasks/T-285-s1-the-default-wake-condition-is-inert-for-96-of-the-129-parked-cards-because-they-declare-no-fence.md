---
id: T-285-s1
title: "The default wake condition is INERT for 96 of the 129 parked cards, because the default is the card's own fence and those cards declare none — orchestrator.md's `PARKED IS A CONDITION, NOT A SHELF` reaches a quarter of the shelf"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-285, 2026-09-09, measured at 488e495 by the view T-285 built"
blocked_by: [T-285]
touches: []
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-285 made the parked column's wake condition machine-read, and the
first run of the view it built is this finding. Measured at `488e495`
with four lanes live, by `brief.mjs --dispatch --full`:

- 129 parked cards
- 18 WOKEN
- 15 carrying a condition that was read and does not hold
- **96 declaring no `touches:` at all**
- 90 stating no condition at all — neither a `wake:` field nor a prose
  line

The default condition, which `method/roles/orchestrator.md` and
`method/tasks/TASK-FORMAT.md` both name, is *the card's fence's
component is next dispatched*. A card with no fence gives that
condition no ground, so **no lane can ever satisfy it**: those 96 cards
are parked with a condition that cannot fire, which is the rejection
nobody wrote down that TASK-FORMAT's own sentence is about. The view
counts and names them under THE DEFAULT CONDITION NAMES NO GROUND
precisely so this is a worklist rather than a discovery.

T-285 deliberately rewrote none of them — its criterion 4 says existing
parked cards are not rewritten and the field is added by the seat at
the next triage that touches the card. That rule is right for a lane
and it does not schedule the triage, which is what this card is for.

**AND THIS CARD DECLARES NO FENCE, WHICH IS A FINDING AND NOT AN
OVERSIGHT.** The ground the pass touches is `docs/tasks`, and
`lib/parser/src/fence.ts` refuses that path by name — `UNFENCEABLE_PATHS`
— because it is where every dispatch stamp and every integrator's
status write lands, so a lane holding it would hold the board itself.
`method/lane-protocol.md` rule 5 answers that refusal with *"Name the
individual files instead"*, which is exactly right for the four live
cards that do it and unusable for ninety-six. The consequence is that
**this is an ARCHITECT TRIAGE duty rather than a dispatchable lane** —
which is what TASK-FORMAT.md already calls triage — and the card is
filed to schedule it, not to be cut into a worktree. The parser's own
live-board census caught the first spelling of this card fencing
`docs/tasks` and refused it; that refusal is the evidence for this
paragraph.

## Acceptance criteria

- WHEN a triage pass over the 96 cards THE DEFAULT CONDITION NAMES NO
  GROUND line names THE seat SHALL, for each, either add a `wake:`
  field naming a card, a date or a fence it actually declares, or add
  the `touches:` the default needs, or reject the card with one line of
  reasoning — and never leave it parked with an unfireable condition.
- WHEN the pass finishes THE view's own count of cards declaring no
  fence SHALL be the record it is measured against, re-derived at the
  pass's own ref rather than quoted from this card.
- WHEN a card is re-parked THE new condition SHALL differ from the old
  one, because parking twice with the same note is how a shelf forms
  (TASK-FORMAT.md).

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
