---
title: Rejected suggestions have no parseable in-place encoding
status: suggested
suggested_by: integrator claude-fable-5 @T-006-integration
---

TASK-FORMAT.md gives architect triage three outcomes — promote, park,
or "reject with one line of reasoning left in the file" — but the
parser's status-aware requiredness (task.ts: minimal files are
`suggested` and `parked` only) makes `status: rejected` on a minimal
suggestion a HARD parse failure: five missing-placement-field issues
and no task record, which would light the board's parse-error badge
and break the live-tree smoke test. Discovered at T-006 integration
while triaging T-006-s1 (moot — main 67cccd7 had already fixed it).
Interim encoding, recorded in CONVENTIONS: the rejected file was
`git mv`ed to docs/tasks/rejected/ with `status: rejected` and the
one-line reasoning intact — both task globs are deliberately flat
(isTaskFilePath and parseTaskDirectory), so nothing there is a model
input, and nothing was deleted.

Suggest: ratify or replace the interim encoding — either teach the
parser that a `rejected` file carrying `suggested_by` and no id (a
never-promoted suggestion) is minimal-legal and renders nowhere, or
bless docs/tasks/rejected/ in TASK-FORMAT.md as the triage-reject
destination. Touches lib-parser, method (format version bump either
way).
