---
id: T-248-s2
title: J1 misses the phrase T-248's own Why section names — "ignore your instructions" does not fire, because the pattern requires a previous/prior/all quantifier between the verb and the noun
feature: F-06
milestone: 4
size: S
priority: 10
status: planned
suggested_by: the T-248 blind verifier (claude-opus-5@subagent), 2026-09-08, measured at 1c60da3 on the bench
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
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

## Triage (2026-09-08, the wave sitting)

Promoted as one lane for the injection scan's two named gaps, F-06
milestone 4, S, p10, guard-class. Absorbs T-248-s3 (the bidi override
and isolate class, rendered as invisible by the excerpt renderer and
matched by no pattern).

Absorbs: T-248-s3 (2026-09-08) — bidi overrides and isolates are the
trojan-source channel: disclosed in INVISIBLE_SOURCE's own comment,
undetected by any pattern; the file is removed in this commit, this
line is the surviving record.

## Acceptance criteria

- WHEN a docs path carries "ignore your instructions" (the phrase T-248's
  own Why section names), or the same verb with `my`, `these`, `the`
  or no quantifier between it and the instruction noun THE scan SHALL
  fire J1 (or a sibling pattern with its own id), each form pinned by a
  firing positive and a silent negative near-miss.
- WHEN a docs path carries a bidi override or isolate (U+202A–U+202E,
  U+2066–U+2069) THE scan SHALL fire a named pattern for the class, and
  the excerpt SHALL render the character as its code point; the
  INVISIBLE_SOURCE comment SHALL stop saying the class is unmatched.
- IF the false-positive census over this repository's own docs/ moves
  by more than the two hits T-248 recorded THEN the card SHALL name
  every new hit and say which are true — the advisory stance stands.
- Every new pattern owes T-248's own control shape: a firing positive,
  a silent negative, a mutant that neuters the pattern read from
  `git diff`, restoration by sha256.
