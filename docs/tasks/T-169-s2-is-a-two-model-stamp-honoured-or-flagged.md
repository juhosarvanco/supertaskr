---
id: T-169-s2
title: A stamp naming the assigned model AND a second model — honoured or flagged? A lane interpreted @human's D5 ruling and the question belongs to @human
status: suggested
suggested_by: "T-169's blind verifier (2026-08-30), correction 3: route the T-020/T-024 judgement to @human"
touches: [lib-parser]
---

`T-020` and `T-024` stamp `built_by: claude-fable-5 @fresh (WIP …) +
claude-opus-5 @fresh (completion)` against `builder: claude-fable-5`.
The landed rule (assignment.ts rule 4: every assigned model satisfied
by SOME executed model) reads them HONOURED — the assigned model did
the work and a second model finished, which the executor argued is
"the loudest possible disclosure of what happened", the opposite of a
silent substitution. The blind verifier AGREED with that reading and
still routed it: it is @human's own ruling ("the models the human
assigns do those tasks as assigned") being interpreted by a lane, it
reaches no @human queue on its own, and the card's escape hatch
(@human-dated exceptions) was deliberately not used.

THE QUESTION, one word: is a stamp naming the assigned model AND
another model **honoured** (disclosure, not substitution — the landed
behaviour) or **flagged** (the assignment named ONE model and two
ran)? IF flagged, the fix is one clause in `satisfiesAssignment`'s
caller and exactly two live cards (T-020, T-024) light up.

RESURFACES: @human answers, here or in session; the answer lands as a
dated ruling on this card and, if "flagged", promotes it as a
one-clause card.
