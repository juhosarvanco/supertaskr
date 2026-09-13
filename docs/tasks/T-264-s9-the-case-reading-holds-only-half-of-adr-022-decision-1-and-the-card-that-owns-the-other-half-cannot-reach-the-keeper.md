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

Absorbs: T-264-s11 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review): the same fence. Supersession of 2026-09-14: where the finding below reads as if this card's commit would also carry T-264-s4's two configuration strings, it does not — under pile 2 batch 3a T-264-s4 is absorbed into T-265-s2 with app/src-tauri/tauri.conf.json in that card's fence, and this card stays blocked by T-265-s2 and absorbs T-264-s11 only.

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
- WHEN the survivor table is graded THE occupancy body SHALL require
  every ROW of `KEPT_CLASSES` to have classified at least one hit, not
  merely every id.
- WHEN a row is deliberately empty THE row SHALL say so in the table
  itself, and the body SHALL red on a row that is empty without saying so.
- The body SHALL carry a data mutant shown failing first: a row whose
  pattern is changed to one the tree does not contain reds by name, while
  its sibling rows under the same id keep that id occupied.
  (the bullets above are absorbed whole from T-264-s11, pile 2 batch 3a, 2026-09-14; all three as filed, the deliberately empty row included)

## Absorbed from T-264-s11 — The occupancy body grades class IDS and the survivor table is ROWS — a dead row inside a live class is invisible, and the pre-rename table carried two of them (kept whole)

Title as filed: "The occupancy body grades class IDS and the survivor table is ROWS — a dead row inside a live class is invisible, and the pre-rename table carried two of them"

Filed as: status suggested, priority 8, size S, touches [tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts], wake None, suggested_by verifier claude-opus-5@subagent, at T-264-s3's bench, 2026-09-10 — measured while re-deriving the class table base against tip.

### The finding (T-264-s11)

`every enumerated survivor class is occupied — a class nobody hits has
stopped meaning anything` collects the class IDS the scan classified into
and requires each id in `KEPT_CLASS_IDS` to be among them. `KEPT_CLASSES`
is a list of ROWS, and several ids own more than one row: at T-264-s3's
tip `verbatim-quotation` is two rows and `naming-history` is one, and the
per-row check beside the id check asks only that a row's `files` list is
non-empty — never that the row MATCHES anything.

So a row that has stopped hitting the tree is invisible for as long as
one sibling row under the same id still hits. That is not hypothetical:
at this card's base the `method-source` id owned three rows, and two of
them — the one scoped to `app/src/genesis/genesis-derive.ts` and the one
scoped to a backticked directory inside `app/src-tauri/src/agent/kit.rs`
— matched nothing at all, while the id read as occupied because the
third row did. Measured at `130f4c4c`: the census names neither file.

The body's own comment says a class nobody hits has stopped meaning
something. A row nobody hits has stopped meaning something in exactly the
same way, and it is the row — not the id — that carries the ruling, the
file scope and the comment explaining why the survivor is held. A dead
row is a ruling the tree no longer needs, still standing, still widening
what the classifier will say yes to.

The remedy is to grade the table at the granularity it is written at:
require every ROW to be hit, and give a row that is deliberately empty an
explicit way to say so, so that "this ruling is spent" is a written
decision rather than a silence.

### T-264-s11's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the survivor table is graded THE occupancy body SHALL require
  every ROW of `KEPT_CLASSES` to have classified at least one hit, not
  merely every id.
- WHEN a row is deliberately empty THE row SHALL say so in the table
  itself, and the body SHALL red on a row that is empty without saying so.
- The body SHALL carry a data mutant shown failing first: a row whose
  pattern is changed to one the tree does not contain reds by name, while
  its sibling rows under the same id keep that id occupied.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the prose half of the naming rule has no tree-wide body; absorbs T-264-s4, T-264-s11 and T-265-s2, which own the failing sites. Not dispatched by this sitting.
