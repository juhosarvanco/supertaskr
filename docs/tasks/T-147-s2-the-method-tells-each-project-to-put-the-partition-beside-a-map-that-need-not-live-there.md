---
id: T-147-s2
title: The ceremony boundary tells each project to state its partition beside its slug map, and in this project the slug map is in a different document — the instruction cannot be obeyed literally by anyone whose map moved
feature: F-01
milestone: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-147
touches: [method/tasks/TASK-FORMAT.md]
---

**Class parent: none found.** Searched the live board for a card owning
the ceremony-boundary wording (`T-135`, `T-131`, `T-152`, `T-105`,
`T-104`) — `T-135` replaces the partition's BASIS and does not touch this
sentence, and the other four are about cost, row 11's home, unwritten
rules and the method snapshot. Filed rather than corroborated.

**Disposition hint: park behind `T-135`** unless a bump is already open —
it is one clause in a `KIT_FILES` file, so it cannot ride a lane whose
fence cannot bump the method version, and `T-135` may rewrite the
paragraph anyway.

## The finding, from inside T-147's lane

`method/tasks/TASK-FORMAT.md`'s **THE BOUNDARY IS READ OFF `touches:`**
paragraph says the partition is *"the PROJECT's to state in its own
conventions beside its slug map"*. **T-147's fence was
`[docs/CONVENTIONS.md]` and that file contains no slug map** — this
project's map is `docs/ARCHITECTURE.md`'s block, whose authority is each
component file's own `touch_slugs:` field. So the two halves of the
instruction name two different documents here, and the criterion had to
be satisfied by pointing at the map rather than by landing beside it.

**This is not an nputer accident.** The method's own docs-templates split
CONVENTIONS from ARCHITECTURE, so the document that holds a project's
conventions and the document that holds its component registry are
DIFFERENT files in every project this system creates. The sentence
assumes they are one.

## Why it matters more than a wording nit

The paragraph is doing precise work — it hands one decision to the
project and names where it lives so a dispatcher can find it. A location
that does not exist sends the dispatcher to the wrong file, and the
failure is silent: the reader concludes the project never stated its
partition, and falls back to the rule of thumb. That is exactly the
outcome T-147 was written to end.

## The repair, small

Say WHAT the statement must be beside rather than WHERE: the partition
belongs in the project's conventions and must be stated in the vocabulary
its slug map uses, with the map's own location named by the project. One
clause, and it makes the instruction obeyable by a project whose registry
lives anywhere.

**It is a `KIT_FILES` file, so under the partition T-147 just landed this
card takes a verifier** — the self-demonstrating case, and worth keeping
as one.
