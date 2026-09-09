---
id: T-271-s3
title: "No verifier brief can be assembled at all — method/roles/verifier.md carries no contract table, so brief.mjs --role verifier exits 3 with \"found 0 tables\""
feature: F-04
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3"
blocked_by: []
touches: [method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Measured in T-271's lane while checking whether that card's criterion 5
("the executor's and verifier's briefs carry the scoped spelling") was
met. `node tools/e2e/scripts/brief.mjs --task T-271 --role verifier`
exits **3** — COULD NOT RUN — with:

    dispatch-brief: found 0 tables headed # / The brief carries /
    Assembled from / If it is absent, expected exactly one

`method/roles/executor.md` carries that table and assembles cleanly;
`method/roles/verifier.md` carries none, so the one command this
repository has for assembling a brief cannot assemble a verifier's.
Every verifier this method has dispatched was therefore briefed by hand
against a contract nothing derives, which is the class the executor's
own table exists to close.

**This is not T-271's to fix**: verifier.md is T-281's live fence, and
T-271's manifest names three unrelated paths.

Disposition hint: the table is the deliverable, not the code — the
assembler already handles any role whose file carries one. Whoever
writes it owns deciding which rows a verifier's brief has that an
executor's does not (the bench's two spawns, the attack set's hashes,
the blind phase's property) and which it does not need.
