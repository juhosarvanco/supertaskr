---
id: T-229-s7
title: lane-protocol rule 4's prose carries two more copies of the concurrency ceiling and no checker reads either
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [method/lane-protocol.md, app/test/select-board.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-229-s4`**, which this card is the residue of. That
card aimed `app/test/select-board.test.ts`'s ceiling body at the value's
HOME (`method/tasks/TASK-FORMAT.md`) as well as at
`method/roles/orchestrator.md`'s citation, so three copies — home,
citation and `CONCURRENCY_CEILING` — are now one fact checked once.

**A FOURTH AND A FIFTH SURVIVED, both in `method/lane-protocol.md` rule
4's STANDING, NOT THE SEAT clause**, and the census is on the parent
card:

- *"At tasks/TASK-FORMAT.md's ceiling of 3–5 concurrent lanes"* — the
  pointer T-229-s1 repaired. It names the home correctly now and still
  SPELLS the number.
- *"the exception above tells up to five executors to merge into one
  branch"*, two lines below — the ceiling's MAX, spelled as a word.

**WHY THE PARENT DID NOT TAKE THEM, deliberately rather than by
oversight.** Both paths were inside that lane's fence. The parent's
criterion named TASK-FORMAT and orchestrator by path, and the body's
regex is colon-anchored (`Ceiling:\s*(\d+)\s*[–—-]\s*(\d+)\s*concurrent`)
so it matches neither prose spelling; *"up to five"* is a word no
generic regex reaches at all. Widening the checker to a third spelling
and de-numbering a rule's prose are both design decisions, and the
absorbed rider asked for a two-word edit.

**THE DEFECT CLASS IS THE PARENT'S OWN**: a duplicate WITH a checker is
one fact checked twice, a duplicate WITHOUT one is two facts
(`tasks/TASK-FORMAT.md`'s Parallelism guardrails say it in those words).
Rule 4's arithmetic — *"up to five executors merging into one branch"* —
is an argument that stops being sound the day the ceiling moves, and
nothing would red.

## Acceptance criteria
- WHEN the concurrency ceiling changes in its home THE repository SHALL
  red — either because `method/lane-protocol.md` rule 4 no longer spells
  a number (preferred: the clause cites the home and states its argument
  without the value) OR because a checker reads that spelling too.
- IF the clause keeps a number THEN a body SHALL compare it to
  `CONCURRENCY_CEILING`, and a data mutant moving only that copy SHALL
  be shown to red it.
- WHEN the clause is rewritten THE rule's argument SHALL survive
  unchanged — the reconciliation it draws between the smallest tier's
  exception and the ceiling is the point, not the arithmetic.
