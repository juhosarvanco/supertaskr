---
id: T-295-s16
title: "The rename half of the keeper still classifies a WHOLE LINE, so one kept quotation keeps a fresh leftover sitting beside it — the per-value hole the other classes just closed, in the class that was the model for closing it"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-295-s4, 2026-09-14, applying that card's per-value rule to the class it was modelled on"
blocked_by: [T-295-s4]
touches: [tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts, tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-295-s4's amendment made the secret, address, home and name classes
judge PER MATCHED VALUE: keeping one synthetic instance suppresses
nothing else on the same line. The rename class, which was the model
for having a classifier at all, still judges the whole line. Its
classifier takes a line and a file, tests each kept class's pattern
against the ENTIRE line, and answers with a class id or nothing; the
merge keeper turns that into a boolean for the line.

So a line in a file a kept class names, carrying the quoted fragment
that class exists for AND another occurrence of the pre-rename
identifier that no class covers, is kept whole. That other occurrence is
exactly what an unfinished rename looks like, and it reaches a merge
with the keeper's blessing. The kept classes are narrow on purpose —
their patterns are quoted fragments rather than the bare name, so that a
new leftover in the same file is still a survivor — and judging the
whole line gives that narrowness away again one line at a time.

Nothing has landed through this hole that this card can point at. It is
the same hole the amendment argued about the other classes, in the class
whose narrowness the amendment cited as the model, and it is cheap to
close because the occurrences are enumerable.

## Acceptance criteria

- WHEN a line carries an occurrence of the pre-rename identifier that a
  kept class covers AND another occurrence that no class covers THE
  classifier SHALL answer that the line holds an unclassified survivor,
  in tools/e2e/scripts/rename-scan.mjs, pinned by a body in
  tools/e2e/tests/identifier-rename.spec.ts with the control where every
  occurrence on the line is covered.
- WHEN the merge keeper asks that classifier THE answer SHALL refuse the
  line, and the refusal SHALL say that the line carries both a kept
  occurrence and an unclassified one, pinned in
  tools/e2e/tests/merge.spec.ts.
- WHERE closing this re-classifies a line already in the tree THE card
  SHALL name every such line and say whether it is a survivor or a new
  class, because a whole-tree scan that suddenly reports findings is a
  reading nobody can act on.

## Implementation notes

## Verdicts
