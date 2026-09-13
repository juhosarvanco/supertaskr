---
id: T-298-s9
title: "A verdict whose ONLY correction is the wording correction step 5b expressly allows carries no mutant block, and the merge's drill step reads a zero-block verdict as one that PREDATES the block rule — so the way through tells the seat to acknowledge a rule the verdict actually obeys"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-298-s3, measured at 8a10f28d20587b6d61ed4e67da7f8095700a1ddd, 2026-09-14"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

method/roles/verifier.md step 5b requires a mutant block per assigned
correction and then names the exception in its own words: "A CORRECTION
WITH NO PROPERTY TO PIN SAYS SO IN AS MANY WORDS. A wording change owes
no block, and the reader reports the correction count beside the block
count precisely so a shortfall is visible". So a verdict that assigns
exactly one correction, and that correction is a wording one, is a
CONFORMING verdict with one correction heading and zero blocks.

The merge's drill step cannot express that state. In
tools/e2e/scripts/merge.mjs the zero-block branch asks
`assignsCorrections` and, when the answer is yes, refuses with "assigns
corrections and carries NO mutant block — a correction whose body has to
be recovered from a transcript is the thing this step exists to end". The
only way through is `--blocks-absent <verdict sha>`, whose own stated
reason is "T-281: a verdict written BEFORE this rule existed carries no
block". A verifier who obeyed 5b exactly is therefore told to acknowledge
that its verdict predates a rule the verdict is in fact keeping, and the
acknowledgement it signs says the opposite of what happened.

**HOW IT WAS MEASURED, and not by reading the code alone.** The verdict
of T-298-s3, written on the verifier bench at the ref in `suggested_by`,
assigns one wording correction and says in as many words that it carries
no block. Asked of that card through merge.mjs's own exports,
`assignsCorrections` answers true, `correctionHeadings` answers 1 and
`readMutantBlocks` answers 0 blocks — which is precisely the input that
lands in the refusal branch above. The shortfall the reader is supposed
to make VISIBLE is instead the thing that stops the merge.

The repair is a ruling as much as a patch, which is why this is a card.
The check exists for a real failure — nine merges in one day whose
corrections had to be recovered from transcripts — so it must not simply
be relaxed. What is missing is a way for a verdict to DECLARE that its
correction count and its block count differ legitimately, so the drill
step can tell "a wording correction, said out loud" from "a body nobody
wrote". 5b already requires the verdict to say so in as many words; today
nothing reads that sentence.

## Acceptance criteria

- WHEN a verdict assigns corrections, carries no mutant block, and
  declares that the shortfall is a wording correction THE merge SHALL
  proceed and SHALL print the correction count beside the block count,
  rather than refusing or requiring an acknowledgement that names the
  verdict as pre-rule.
- WHEN a verdict assigns corrections and carries no block and makes no
  such declaration THE merge SHALL refuse exactly as it does today,
  naming what is missing.
- WHEN a verdict declares the shortfall for SOME corrections but carries
  fewer blocks than the corrections it did not so declare THE merge
  SHALL refuse, naming the corrections whose bodies are unaccounted for.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
