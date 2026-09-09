---
id: T-281-s9
title: "The planter refuses a MUTANT BLOCK whose `new` text already occurs elsewhere in the file, though the `old` anchor named the site exactly once — the site is known from the old anchor, and the integrator drilled T-271's second block by hand"
feature: F-06
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "the architect seat, 2026-09-09, at the T-271 merge: block 2 of the verdict (old `return scoped.verdict === … ? EXIT.GREEN : EXIT.RED;` → new `return EXIT.GREEN;`) planted at the unique old site and then refused with \"after the swap the `new` anchor matches gate-run.mjs 3 time(s), so the mutant's own site cannot be named either\""
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

At the T-271 merge the integrator re-drilled the verdict's three MUTANT
BLOCKs with the merged tree's own `runMutantDrill`. Blocks 1 and 3
planted, ran, redded the named body alone and restored by sha256.
Block 2 planted at its unique `old` site and was then refused: its
`new` text, `return EXIT.GREEN;`, occurs three times in
tools/e2e/scripts/gate-run.mjs after the swap, and the planter names the
mutant's site by the `new` text. The site was never in doubt — the
`old` anchor matched exactly once and the swap happened there — so the
seat drilled the block by hand at that site: the body redded alone with
the block's own message ("a RED subset may NEVER answer at the GREEN
code", 1 failed / 56 passed), and the file was restored and proved.

A mutant that turns a distinctive line into a common one is the usual
shape of a "collapse to the trivial branch" mutant, so this refusal will
recur. Class parent: T-281.

## Acceptance criteria

- WHEN a block's `old` anchor matches exactly once and its `new` text
  matches more than once after the swap THE planter SHALL name the site
  by the `old` anchor's position and proceed, restoring from the
  pristine copy by sha256 as it does today.
- WHEN the `old` anchor itself matches zero or more than one time THE
  refusal SHALL stand unchanged.
- A body SHALL show a block whose `new` text is common (`return
  EXIT.GREEN;`) drilling to completion, seen red on a planter that
  refuses it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
