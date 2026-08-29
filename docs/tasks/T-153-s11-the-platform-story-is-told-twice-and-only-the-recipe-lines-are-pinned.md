---
id: T-153-s11
title: The platform story is told twice and only the recipe LINES are pinned — the DOCS GATE bullet and docs-gate.mjs's header can disagree about which xargs does what, and nothing reds
feature: F-01
milestone: 4
priority: 5
size: S
status: suggested
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5@subagent @T-153-s6
builder:
verifier:
built_by:
verified_by:
review:
---

T-057's lesson — a recipe in two places is two chances to disagree — is
held by `docs-input-gate.spec.ts`'s "ONE SPELLING, TWO PLACES", which
compares the two printed RECIPE LINES character for character and reds
on drift. That body is sound and stays sound.

**The PARAGRAPH around those lines is a second copy and nothing compares
it.** `docs/CONVENTIONS.md`'s DOCS GATE bullet and
`tools/e2e/scripts/docs-gate.mjs`'s header each narrate what a pipe
through `xargs` does to the four exit codes, on each platform. The
narration is what a reader acts on — it is the reason the recipe has the
shape it has — and the two copies are kept in step by hand.

## The evidence that this is not hypothetical

`T-153-s6` corrected both copies, by hand, in one commit: the bullet's
matrix claimed GNU gives **0** on an empty list (it gives **123**), and
the script's header stated GNU's remapping without stating that GNU also
RUNS the gate on an empty list — so a reader of the header alone would
still have carried the BSD-shaped assumption the card was repairing. Had
that lane edited only one file, every gate in this repository would have
stayed green with the two copies disagreeing about the platform.

## What a fix might look like — not prescribed, the card is the spec

Either direction closes it, and the choice is the builder's:

- Compare the CLAIMS, not only the lines: parse the platform sentences
  out of both copies (the dialect names, the empty-list behaviour, the
  code mapping) and require them to agree, the way `range-rule.mjs`
  parses the matrix today.
- Or give the narration ONE home and have the other copy point at it —
  the shape `DOC_BUDGETS` took in T-156 when two readers needed one
  table.

The first keeps both copies readable in place; the second removes the
drift surface entirely and costs a reader of the script a hop into the
document. Neither is free and this card does not decide it.

## Acceptance criteria

- THE two copies' platform claims SHALL be compared by something that
  reds, or reduced to one copy — a comment saying "keep these in step"
  is the state this card already describes.
- THE fix SHALL be proven by a drill: mutate ONE copy's claim about one
  dialect, observe the red, restore with a sha256 proof.
- WHERE the choice is the second direction, the DOCS GATE bullet's
  matrix stays in `docs/CONVENTIONS.md`: `range-rule.mjs` parses it
  there and `T-153-s6`'s per-dialect check reads it as the expectation
  side.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
