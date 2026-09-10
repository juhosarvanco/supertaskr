---
id: T-307-s5
title: "A room Resolution is inside the entry rule's scope and the room format gives it nowhere to put a date — the rule asks a section for something its own format cannot express"
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-307, measured at b78f9f507aba638617462ea284d5c02913360977, 2026-09-10"
blocked_by: []
touches: [method/rooms/ROOM-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `b78f9f507aba638617462ea284d5c02913360977`

T-307's new bullet in `method/rooms/ROOM-FORMAT.md` opens *where a turn
or a Resolution records what the owner settled* and requires the entry to
say what was settled **and when**. A turn can: the same file's turn
format puts a date in the heading, which is where MF-11's date cascade
looks first. A Resolution cannot. Its four required sub-fields are
Question, Decision, Why and Changed, none of them a date, and the
frontmatter block above it carries `type`, `task`, `status` and
`max_rounds` and no dated field at all.

So the one section the rule names by name is the one section the format
gives no place to obey it, and a Resolution that carries no date in its
prose falls into the undated class T-307-s2 measured: invisible to the
eval, by construction.

## The shape that would work

Either a fifth Resolution sub-field — a date beside Question and
Decision — or a dated frontmatter field the close writes. The first is
smaller and sits where the writer already is; the second is machine
readable without parsing prose, which is what the cascade would rather
have.

WEIGH AGAINST BOTH: this file ships nothing to a genesis'd project
(`KIT_FILES` excludes it deliberately), so the change is this
repository's method text only and costs no migration. And it closes half
of T-307-s2 without any git call, which is that card's expensive option.
