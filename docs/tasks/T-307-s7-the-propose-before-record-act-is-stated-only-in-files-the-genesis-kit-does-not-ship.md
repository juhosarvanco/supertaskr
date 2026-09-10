---
id: T-307-s7
title: "The propose-before-record ACT is stated only in files the genesis kit does not ship — a scaffolded project gets the wording rule in its decision template and never learns it has to ask"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-307, measured at b78f9f507aba638617462ea284d5c02913360977, 2026-09-10"
blocked_by: []
touches: [app/src-tauri/src/agent/kit.rs, method/docs-templates/decisions/000-template.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `b78f9f507aba638617462ea284d5c02913360977`

T-307 puts the ACT — an entry is shown to the owner in the conversation,
verbatim as it will be written, and appended only on a yes — in
`method/roles/orchestrator.md`, and the WORDING in
`method/rooms/ROOM-FORMAT.md` and in the decision template. Read
`KIT_FILES` in `app/src-tauri/src/agent/kit.rs` at this ref: the table
ships `docs-templates/decisions/000-template.md`, and its own doc comment
says in as many words that the other role files and `rooms/ROOM-FORMAT.md`
are **deliberately** not included.

So of the three statements, exactly one reaches a scaffolded project, and
it is the one that says how an entry is worded. Nothing tells that
project's seat to ask first. The card's fourth criterion calls the role
file a kit file in passing; it is not one, and that is the assumption
this card exists to correct rather than a fault in the lane, which built
what the criterion asked.

A second, smaller half of the same reading: the template's new comment
says *the owner*, and no file the kit ships uses that word — `planner.md`
and `tasks/TASK-FORMAT.md` both say *the human*. `orchestrator.md` is
where *the owner* is glossed, and it does not travel.

## The shape that would work

NOT simply adding the two files to `KIT_FILES`. That table is derived
from the planner's driver contract and the exclusions carry reasons; the
comment names them.

The two candidates worth weighing are: a sentence of the ACT inside the
decision template itself, self-contained the way the wording rule already
is there — cheap, and it makes the template say two things instead of
one; or the ACT stated in `roles/planner.md`, which is the one role file
the kit does ship, with the templates pointing at it — which puts the
rule where a scaffolded project's only role file already is. Either way
the vocabulary question above is settled in the same edit.
