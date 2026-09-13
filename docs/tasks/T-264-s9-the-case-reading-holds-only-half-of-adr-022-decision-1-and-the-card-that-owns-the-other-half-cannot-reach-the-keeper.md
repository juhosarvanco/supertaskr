---
id: T-264-s9
title: The rename scan's case reading holds only ADR-022 decision 1's IDENTIFIER half — the prose half has no tree-wide body, and T-265-s2, which owns the three sites that fail it, has a fence that cannot reach the keeper
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent, at T-264-s3's lane, 2026-09-10 — decided while landing T-265-s3's case criterion, and routed rather than landed as a red another card owns
blocked_by: [T-265-s2]
touches: [tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

ADR-022 decision 1 is one sentence with two halves: **capital S in
prose, lowercase `supertaskr` as an identifier.** T-265-s3's third
acceptance criterion asks the rename scan to check BOTH, and names
`T-265-s2` as the ruling for the second one.

T-264-s3 landed the IDENTIFIER half: `caseFindings` reds on a capital-S
spelling inside a backtick code span or glued into an identifier, and
the tree-wide body over the whole corpus is green and drilled (a planted
code span and a planted identifier each red it by name; correct prose —
a hyphenation, a possessive, a full stop and decision 2's all-caps
environment prefix — does not).

**THE PROSE HALF HAS NO TREE-WIDE BODY, and the reason is a fence rather
than a difficulty.** A body that reds on a lowercase `s` opening a prose
sentence would red today on README.md, CLAUDE.md and AGENTS.md — which
is not a defect this corpus owns but exactly the finding `T-265-s2` was
filed for. Landing that body inside T-264-s3 would have stopped the line
on another card's work. And `T-265-s2`'s own `touches:` line is those
three documents and nothing else, so that card cannot add the body
either: whoever fixes the sites cannot arm the check, and whoever arms
the check has nothing to point it at until the sites move.

So the two halves need one more commit after `T-265-s2` lands, and this
card is it.

## Acceptance criteria

- WHEN `T-265-s2` has landed THE scan SHALL carry a reading for
  decision 1's PROSE half — a lowercase `supertaskr` opening a prose
  sentence — and the tree-wide body over the same corpus SHALL be green.
- WHEN the prose reading is added THE detector SHALL be shown firing on
  a planted sentence and NOT firing on a legitimate identifier, a code
  span, a fenced block and a heading that names a command, before the
  tree-wide body is believed.
- IF the reading cannot separate a sentence opening from a list item, a
  table cell or a line continuation THEN it SHALL report the ambiguous
  site rather than pass it, and the card SHALL say which shapes it
  refuses to judge.
- The three root documents SHALL NOT be edited here: they are
  `T-265-s2`'s, and a card that fixes the sites it is meant to detect
  proves nothing about the detector.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the prose half of the naming rule has no tree-wide body; absorbs T-264-s4, T-264-s11 and T-265-s2, which own the failing sites. Not dispatched by this sitting.
