---
id: T-254-s3
title: "ROW 3's applied read-first set still hands the seat docs/CONVENTIONS.md bare, one row after the role file it applies now says to read that document through the pack — the row is faithful and the brief is inconsistent, which is the exact class ROW 3 was rebuilt to close"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "T-254's executor, 2026-09-09, applying executor.md's own internal-consistency rule to the row its card moved"
blocked_by: [T-254]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
---

## What was noticed

`method/roles/executor.md`'s reading step now says to read
docs/CONVENTIONS.md THROUGH THE BRIEF'S CONTEXT PACK rather than end to
end. ROW 3 of the brief still prints the applied read-first set with
`docs/CONVENTIONS.md` in it, unqualified, because the row applies only
the role file's `do NOT read` subtractions and `ADDITION TO THAT SET IS`
additions — and this change is neither.

That is exactly the class the brief contract names against itself: *"a
brief that is internally inconsistent while every row is individually
faithful to its source"* — the sentence T-112-s3 rebuilt ROW 3 around.
Nothing is wrong today: the pack is printed lower down and says whose
read the whole document is. But a seat reading ROW 3 and stopping there
is told to read a document its role file qualifies, which is the same
shape as the defect ROW 3 exists to prevent.

The grammar was deliberately NOT reused in T-254: writing *"you do NOT
read docs/CONVENTIONS.md"* in the role file would have made
`readSubtractions` strike it from the applied set, which is false — the
seat DOES read that document, through the pack — and would have redded
three existing bodies that pin the subtraction reader's cardinality.

## Acceptance criteria

- WHEN a role file QUALIFIES a document rather than subtracting it THE
  applied read-first set SHALL carry the qualification beside the
  document, derived from the role file's own sentence.
- WHEN a role file states no qualification THE applied set SHALL be
  unchanged, and the brief SHALL say so — the positive control the
  subtraction reader already keeps.
- WHEN the qualification names the pack THE row SHALL point at the pack
  block by name rather than restating what the pack carries.
