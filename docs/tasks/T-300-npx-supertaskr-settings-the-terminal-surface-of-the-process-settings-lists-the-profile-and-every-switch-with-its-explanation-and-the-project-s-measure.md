---
id: T-300
title: "`npx supertaskr settings` — the terminal surface of the process settings: lists the profile and every switch with its explanation and the project's measured cost, and edits the runtime template's section with the schema's constraints enforced"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 2
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The schema (T-299) is the source; the terminal is the first renderer because every seat and every CI runner has it.

## Acceptance criteria

- WHEN `settings` runs with no argument THE output SHALL list the profile and every switch with its state, its one-line explanation and the project's own band reading beside it (the seat's estimate until a reading exists), in the schema's order.
- WHEN `settings set <switch> <value>` runs THE template SHALL be edited only if the constraints allow it, and a forbidden value SHALL be refused naming the constraint; a body SHALL show both.
- WHEN the reference documents the command THE text SHALL be generated from the schema, never typed twice.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
