---
id: T-301
title: The app's settings screen — the same profile and switches, rendered from the same schema with the same explanations and measured costs, editing the same runtime template through the app's file writer
feature: F-02
milestone: 4
size: M
tier: standard
priority: 3
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [app/src/, app/src-tauri/src/, app/test/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The mirror app renders the board off files; the settings are a file too. One schema, three renderers (T-300 the terminal, this card the app, T-302 the skill).

## Acceptance criteria

- WHEN the settings screen opens THE profile and the switches SHALL render from the schema with their explanations and the project's band readings, and a change SHALL write the runtime template through the app's existing file writer with the constraints enforced.
- WHEN the template changes on disk THE screen SHALL re-render from the file (the board's own arrival mechanism), and a body SHALL show a forbidden combination refused in the screen with the constraint's text.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
