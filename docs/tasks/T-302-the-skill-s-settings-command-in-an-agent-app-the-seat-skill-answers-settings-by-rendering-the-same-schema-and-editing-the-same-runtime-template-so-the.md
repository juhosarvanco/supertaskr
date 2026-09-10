---
id: T-302
title: The skill's settings command — in an agent app the seat skill answers `settings` by rendering the same schema and editing the same runtime template, so the three surfaces never disagree
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-299]
touches: [method/skills/, method/adapters/, tools/e2e/tests/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The seat skill is the surface inside Claude Code, Codex and the other agent apps; superpowers reaches fourteen harnesses with one skill set and no settings at all.

## Acceptance criteria

- WHEN the skill receives a settings request THE answer SHALL render the profile and the switches from the schema with the explanations and readings, and an edit SHALL go through the same constraint check the CLI uses (the CLI itself, called by the skill), never a second implementation.
- WHEN the three surfaces render the same template THE three outputs SHALL agree line for line on the switches and their explanations, checked by a body that renders all three.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
