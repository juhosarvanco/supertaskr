---
id: T-169-s2
title: A stamp naming the assigned model AND a second model — honoured or flagged? A lane interpreted @human's D5 ruling and the question belongs to @human
status: parked
suggested_by: "T-169's blind verifier (2026-08-30), correction 3: route the T-020/T-024 judgement to @human"
touches: [lib-parser]
---

PARKED at standing triage sitting #3, 2026-08-30 (architect seat),
`@ 51fa31c0964c` — **THE SEAT DOES NOT RULE THIS ONE AND WILL NOT.**
The card is a question about @human's own D5 ruling ("the models the
human assigns do those tasks as assigned"), and a triage seat answering
it would repeat the exact move the blind verifier routed rather than
took: a lane interpreting a human's ruling. One word is owed and it is
not this seat's word. STATE already carries it among @human's open
items ("`T-169-s2` (one word)").

**RE-DERIVED AT THIS BASE:** the two stamps the question hangs on are
still live and still read HONOURED by the landed rule —
`git grep -n 'built_by: claude-fable-5 @fresh' docs/tasks/T-020-*.md
docs/tasks/T-024-*.md` finds them, and `assignment.ts`'s rule 4 (every
assigned model satisfied by SOME executed model) is unchanged at this
ref. So the card's premise holds and nothing has decided it under us.

**RESURFACES:** @human answers, here or in session. The answer lands as
a dated ruling on this card and, if **flagged**, promotes it as the
one-clause card its own body specifies — which is the card's own
condition, kept verbatim rather than replaced. Nothing else brings it
back: no lane, no sitting, and no seat may substitute for the word.

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

## @human RULED, 2026-08-30, in session: HONOURED

**"The cards can name two models, that is fine."** A stamp naming the
assigned model AND a second model is HONOURED — disclosure, not
substitution. The landed behaviour (`assignment.ts` rule 4: every
assigned model satisfied by SOME executed model) is CORRECT and needs no
change; `T-020` and `T-024` stay clean.

**This card is DISCHARGED as a question and stays `parked` as the
record of it** — there is no work to promote, and the one-clause change
its body specified for the "flagged" branch is not owed.

**AND @human RAISED THE LARGER QUESTION IN THE SAME BREATH, WHICH IS NOT
THIS CARD'S**: whether the assignment is ENFORCED at all — *"Is the
decision of the model honored by Claude and Codex?"* — and the direction
that nputer itself should run the architect session and route tasks to
subagent sessions with the correct model. That is D5's enforcement half,
it is NOT built, and it is filed as **`T-180`** rather than folded in
here. This card is about how a two-model STAMP is READ; `T-180` is about
whether anything makes the assignment true in the first place.
