---
id: T-286
title: "The docs gate checks a card's frontmatter for YAML and a legal `status:` and nothing else, so an illegal `size:` walks past it and reds four shell-frame bodies as \"Expected 60, Received 61\" — the exact three-layers-from-the-cause shape the DOCS GATE bullet exists to prevent"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-278-s2, 2026-09-09, at 297a1a9"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## Measured, in this lane, on this lane's own card

T-278-s2's executor filed a suggested card carrying `size: XS`. The
shipped parser's vocabulary is `TASK_SIZES = ['S', 'M', 'L']`
(lib/parser/src/types.ts), so that card does not parse.

- `npm run lint:docs` from tools/e2e: **exit 0**, printing *"every live
  task card's frontmatter parses, with a legal status."*
- The graded e2e leg at 297a1a9: **exit 1, four bodies red**, all in
  `tools/e2e/tests/shell-frame.spec.ts`, every one of them reporting
  `getByTestId('parse-error-details').locator('li')` — *Expected: 60,
  Received: 61*. Three of the four are the frame-holds-at-every-screen
  matrix; the fourth is the error-strip ceiling.

Fourteen and a half minutes of suite to learn that one card's `size:`
field held two letters instead of one.

## The mechanism

`taskCardIssues` (tools/e2e/scripts/docs-scan.mjs) walks every live task
card and pushes an issue for exactly four things: no closed frontmatter
block, frontmatter that does not parse as YAML, frontmatter that is not
a mapping, and a `status:` that is missing or outside the vocabulary.
It then reports *"every live task card's frontmatter parses, with a
legal status"* — which is TRUE, and is not the claim a reader takes from
it.

`parseTaskCard` (lib/parser/src/task.ts) refuses a card on **fourteen**
distinct field conditions, of which the gate checks one: `title`,
`id` (presence and shape), `feature` shape, integer fields, `size`
vocabulary, list-shaped fields and their entries, `suggested_by`
shape, and the `model[@session]` shape of the attribution fields.

**Every one of the other thirteen is a card that walks the docs gate and
reds a code suite three layers away** — which is precisely the class the
DOCS GATE bullet in docs/CONVENTIONS.md was written for, naming two
prior instances (9c64cd8, two backticked titles, *"a scroll-containment
body reported Expected \"60\""* — the SAME body; and fede266, a
`status:` outside the vocabulary, which is the one condition the gate
went on to cover).

## What a fix decides

- WHETHER the gate calls the shipped parser instead of re-implementing a
  subset of it. That is the honest fix — one vocabulary, one refusal —
  and it costs the gate a dependency on `@supertaskr/parser`'s built
  `dist`, which is an ordering question the gate does not have today.
- OR whether `taskCardIssues` gains the remaining thirteen conditions,
  which is a second copy of `parseTaskCard` and goes stale the day a
  field is added (T-057's rule).
- Either way the gate's SENTENCE must stop over-claiming: *"parses, with
  a legal status"* is what it checks, and a reader takes it for *"the
  parser will accept these cards"*.

## Read beside

The DOCS GATE bullet in docs/CONVENTIONS.md (which carries 9c64cd8 and
fede266 as its own worked examples), T-084 (the gate), T-090 (the CI
step), and T-278-s2 — whose executor supplied the third instance by
hand and paid the full suite to find it.
