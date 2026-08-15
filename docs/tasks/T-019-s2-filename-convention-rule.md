---
title: Validate the task filename convention itself (files whose names encode no id)
status: suggested
suggested_by: executor claude-fable-5 @T-019
---

T-019's id ↔ filename check deliberately compares only when BOTH sides
exist: a declared id and a filename that encodes one. A file like
docs/tasks/T-banana.md with `id: T-901` is collected (the flat glob is
`^T-.*\.md$`), passes id format, and slips the mismatch check because
its basename encodes no id — the narrowest reading of the criterion,
chosen so the check never guesses. That leaves the NAMING convention
(`T-NNN[-sN]-slug.md`, TASK-FORMAT.md) itself unpoliced for id-bearing
records; id-less suggestions are legitimately free-form beyond the
`T-` prefix, so any rule must exempt them (the live tree's dominant
pattern). If the architect wants the convention enforced, a fourth
validateProject rule ("id-bearing task file whose basename encodes no
id" → issue) is a few lines in lib/parser/src/validate.ts plus tests —
but it tightens what filenames are legal, so it should be a deliberate
decision, not a silent widening. Touches lib-parser only.
