---
id: T-169
title: An assignment violation is flagged on the board — the model the human assigned either did the task or the card says so loudly, because D5 ruled assignment BINDING
feature: F-04
milestone: 4
priority: 4
size: S
status: building
blocked_by: []
touches: [lib-parser, app-board]
suggested_by: "@human's D5 ruling (2026-08-30): of course the models the human assigns to different tasks do those tasks as assigned — recorded in rooms/cockpit-or-mirror.md"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing.** D5 is ruled in @human's own words: assignment is BINDING.
Where a spawn path can force the model, the adapter forces it; where
it cannot (a hand-pasted brief, an adapter whose CLI takes no model
flag), nputer VERIFIES — and this card is the verification's teeth.

## Acceptance criteria

- THE parser SHALL derive a per-card assignment verdict from the
  fields it already reads: WHEN `builder:` names a model and
  `built_by:` names a DIFFERENT model, that is a VIOLATION; likewise
  `verifier:`/`verified_by:`. The comparison is on the MODEL half of
  `model@vehicle` — the vehicle (subagent, cli, a hand-driven app) is
  legitimate variation D5 does not constrain; the seat SHALL state the
  exact comparison rule at the definition site. An EMPTY assignment
  constrains nothing; an empty execution field on a `done` card is
  its own (existing) incompleteness, not this verdict's.
- THE board SHALL surface a violation the way it surfaces a parse
  error: visibly, per card, with both values shown — never a silent
  substitution. The word used SHALL be honest about what is known:
  the fields disagree; WHY is a human question.
- THE live board SHALL be censused at the lane's ref: every current
  violation enumerated (expected: zero — derive, never assume) and
  the census pinned the fence-census way, with named exceptions only
  if @human rules one acceptable ON the card, dated.
- GUARD RULES: a fixture card with a mismatched builder pair must
  flag (positive control), a matching pair and a
  same-model-different-vehicle pair must NOT, and the clean live
  board must census clean — mutants disposed per the POISON DRILL
  bullet.

## Fence note at filing

`touches: [lib-parser, app-board]` — collides with T-112
(app-dispatch, app-board) if both dispatch at once; the lane list is
the authority at dispatch time.
