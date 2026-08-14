---
title: Validate task id format and empty backbone names
status: suggested
suggested_by: verifier claude-fable-5 @T-002-verify
---

Two lenient spots found while verifying T-002, neither demanded by its
acceptance criteria: (1) task `id` accepts any non-empty string —
`id: banana` parses with zero issues, while `feature` is already
validated as `^F-\d+$`; duplicate detection, blocked_by references and
board grouping all assume well-formed `T-NNN` ids. Mirror the feature
check with `^T-\d+$` as an invalid-field issue. (2) A backbone line
`- F-01:` (empty name, no description) yields a silent FeatureRecord
with name `''` — the board would render a nameless column; worth a
roadmap-error or warning. Both are single-regex additions to
lib/parser/src/task.ts and roadmap.ts.
