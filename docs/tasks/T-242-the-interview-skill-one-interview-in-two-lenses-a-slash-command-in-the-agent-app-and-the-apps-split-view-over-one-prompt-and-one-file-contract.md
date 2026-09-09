---
id: T-242
title: The interview skill — one interview in two lenses, a slash command in the agent app and the app's split view, over one prompt and one file contract, so the board materializes beside the chat whichever window holds it
feature: F-03
milestone: 4
size: M
priority: 1
status: planned
suggested_by: "@human (2026-09-03): \"Should we move the interview also to Claude or Codex as a skill or in other format?\" — ruled with ADR-021 (rooms/cockpit-or-mirror.md RE-RULED)"
blocked_by: []
touches: [method/interview/plan-interview.md, method/interview/decomposition.md, method/adapters/CLAUDE.md, method/adapters/AGENTS.md, tools/e2e/tests/interview.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-021 decision 3: the interview ships as ONE interview in two
lenses. ADR-017 already makes chips come from the watcher seeing files
and never from what the model said, so a skill-driven interview with
the app open beside it IS the split view with the vendor holding the
chat half. This card makes the skill form real without forking the
interview: one prompt (method/interview/plan-interview.md's banks), one
file contract (the five governing docs and the first cards landing
where genesis lands them), and the app's runner reading the same
prompt so the two lenses cannot drift.

## Acceptance criteria

- WHEN a Claude Code session invokes the interview skill in a folder
  with no plan THE system SHALL ask the banks in plan-interview.md's
  order and write each banked answer to the SAME paths the app's
  genesis writes (derive the paths from the runner's own code, never
  restate them here), so the app's watcher renders the chips unchanged.
- WHEN the skill and the app's runner are compared THE prompt text
  SHALL come from ONE file — a test SHALL fail if the two read
  different bytes.
- WHEN the interview ends THE system SHALL land the board (docs/tasks
  with the first cards) and print the one line that opens the mirror
  on this folder — T-243's entry — and IF the app is not installed
  THEN THE interview SHALL still complete to files (terminal-forever).
- WHEN skill packs are present in the opened project (T-167) THE
  skill-driven interview SHALL load and stamp them exactly as the app's
  does.
- WHEN the agent is Codex THE prompt-file form SHALL be measured before
  it is claimed; IF unmeasured THEN the report SHALL say so and ship
  the Claude form alone.
- The method eval gate SHALL run since method/ moves.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
