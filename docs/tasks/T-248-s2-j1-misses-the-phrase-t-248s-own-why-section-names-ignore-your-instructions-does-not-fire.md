---
id: T-248-s2
title: J1 misses the phrase T-248's own Why section names — "ignore your instructions" does not fire, because the pattern requires a previous/prior/all quantifier between the verb and the noun
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: the T-248 blind verifier (claude-opus-5@subagent), 2026-09-08, measured at 1c60da3 on the bench
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-248's Why section ends: nputer has "nothing that reads prose for
'ignore your instructions'". After T-248 it still has nothing that reads
prose for that exact phrase. J1's source requires one of
`previous|prior|earlier|above|preceding|all` BETWEEN the verb and the
instruction noun, and `your` is not in that set.

## The measurement

Derive at your own ref rather than trusting this card:

    node -e "import('./tools/e2e/scripts/docs-gate.mjs').then(m=>{
      for (const s of ['ignore your instructions',
                       'ignore all previous instructions',
                       'ignore the instructions you were given'])
        console.log(m.scanInjection(s).length ? 'HIT ' : 'MISS', s); })"

At `1c60da3`: MISS, HIT, MISS. Running the gate on T-248's own card
reports `0 hit(s) in 0 of 1 path(s)` — and there is no exclusion list
anywhere in the gate, so this is a pattern gap and not a suppression.

## Why it is a card and not a defect

The card's criterion one names three classes — imperatives addressed to
`you` with tool or role words, hidden Unicode, HTML comments — and all
three are covered with controls. J1 is a FOURTH class the executor added
beyond the card's letter, so its width is nobody's criterion. This card
is the width.

## Acceptance criteria

- WHEN the possessive form is used — `ignore your instructions`,
  `disregard your instructions` — THE scan SHALL report a hit.
- WHEN the quantifier is displaced rather than absent — `ignore the
  instructions you were given` — THE scan SHALL report a hit, or the
  pattern's stated ceiling SHALL name that shape as out of reach.
- The widening SHALL be measured against this repository's own docs/
  before it lands: the false-positive count with the derive command
  beside it, in the same shape T-248 used.
