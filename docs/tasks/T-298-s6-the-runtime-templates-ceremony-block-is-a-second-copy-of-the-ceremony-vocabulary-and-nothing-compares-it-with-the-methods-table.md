---
id: T-298-s6
title: "The runtime template carries a SECOND copy of the ceremony vocabulary — method/runtime/supertaskr.yaml's ceremony block lists S, M and L and nothing in this tree compares it with the method's own ceremony table, so T-298-s3's XS row landed on one side and the two are silently out of step"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-298-s3, measured at 4e24160be293ab6a34d2a0043a55db76a7557176, 2026-09-14"
blocked_by: []
touches: [method/runtime/supertaskr.yaml, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

method/runtime/supertaskr.yaml has a `ceremony:` block declaring
`S: [executor]`, `M: [executor, verifier, integrator]` and
`L: [plan, executor, verifier, integrator]`. method/tasks/TASK-FORMAT.md
has a ceremony table whose rows are the same vocabulary in prose. They
are two copies of one fact, and T-298-s3 moved one of them: its XS row
went into the table, and the yaml block still lists three sizes.

**WHICH OF THEM IS READ, MEASURED RATHER THAN ASSUMED.** A git grep for
the word across tools/, app/, lib/, .claude/ and .github/ at the ref in
suggested_by finds no reader of the yaml block at all. The arm's row 11
reads the TABLE (ceremonyRows in tools/e2e/scripts/dispatch-brief.mjs),
and the app's own brief derivation reads the table too (ceremony_row in
app/src-tauri/src/dispatch/brief.rs). So the yaml block is not wrong in
any way a run can feel today — it is a copy with no reader and no
checker, which is the state every vocabulary in this tree has a keeper
for except this one.

That is the shape MF-05 already answers for the statuses, the sizes and
the review modes: two declarations of one closed set, compared
mechanically, red when they diverge. This block has no such comparison,
and the divergence T-298-s3 created is the first evidence that nothing
would notice.

The executor did not edit the yaml: the ask of 2026-09-14 ruled that a
file outside the fence stays outside it and that the seat decides the
widening, and this card is that decision brought back with the reader
named.

## Acceptance criteria

- WHEN the method's ceremony table and the runtime template's ceremony
  block declare different size sets THE tree SHALL red naming both sides
  and the values only one of them carries.
- WHEN the two agree THE same check SHALL pass, and it SHALL read both
  sets from their own files rather than restating either.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
