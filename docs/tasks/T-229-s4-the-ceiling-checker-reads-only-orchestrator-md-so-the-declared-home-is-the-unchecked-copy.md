---
id: T-229-s4
title: The concurrency ceiling's checker reads only orchestrator.md, so after T-229 the DECLARED home is the copy nothing checks
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [app/test/select-board.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-189-s2`.** **Disposition hint: promote and run it
with any card already inside `app/test/`; it is a four-line edit to one
body.**

`app/test/select-board.test.ts`, in *"the ceiling is a named constant
with its own assertion (criterion 5)"*, has a body *"and it matches the
LIVE orchestrator.md, which is the source it claims"* that regexes
`Ceiling: <n>–<n> concurrent` out of `method/roles/orchestrator.md` and
compares both numbers to the app's own `CONCURRENCY_CEILING`. T-229's
rider makes `method/tasks/TASK-FORMAT.md` the ceiling's declared HOME
and leaves orchestrator.md citing it — so the checker now joins the
CITATION to the code and reads the HOME not at all.

**MEASURED, because this was found by breaking it**: deleting the
number from orchestrator.md redded that body at `0c7227b` (app suite 1
failed / 1130 passed, `AssertionError: expected null not to be null`).
The lane restored the number and made the duplication explicit in both
files rather than widening its own fence, which is why nothing is red
today — but the value the method now calls authoritative is the one
with no keeper, and TASK-FORMAT's own new sentence says so out loud.

The edit is to read BOTH files in that body and require all three
values equal, so a project's code, its role file and its format file
move in one commit. `app/test/**` is outside T-229's fence, so it is
routed rather than taken. The body's own comment already warns that the
DOCS GATE cannot name this suite, because `method/` is not `docs/` —
which is why this drifts silently if nobody takes it.
