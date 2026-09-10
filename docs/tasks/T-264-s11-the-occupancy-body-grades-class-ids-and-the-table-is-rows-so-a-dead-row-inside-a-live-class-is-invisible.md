---
id: T-264-s11
title: The occupancy body grades class IDS and the survivor table is ROWS — a dead row inside a live class is invisible, and the pre-rename table carried two of them
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: verifier claude-opus-5@subagent, at T-264-s3's bench, 2026-09-10 — measured while re-deriving the class table base against tip
blocked_by: []
touches: [tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

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

## Acceptance criteria

- WHEN the survivor table is graded THE occupancy body SHALL require
  every ROW of `KEPT_CLASSES` to have classified at least one hit, not
  merely every id.
- WHEN a row is deliberately empty THE row SHALL say so in the table
  itself, and the body SHALL red on a row that is empty without saying so.
- The body SHALL carry a data mutant shown failing first: a row whose
  pattern is changed to one the tree does not contain reds by name, while
  its sibling rows under the same id keep that id occupied.
