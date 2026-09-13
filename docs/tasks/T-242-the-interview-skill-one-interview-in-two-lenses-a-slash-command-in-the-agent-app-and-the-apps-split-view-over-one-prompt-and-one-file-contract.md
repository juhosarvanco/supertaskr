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

## Amendment of 2026-09-13 — native interview delivery at the current stage (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — native interview delivery at the current stage. This card delivers the native-harness interview over the existing canonical banks and project-file contract, preserving the shipped app behavior and adding no in-app steering conversation. Before dispatch, its delivery draft names the discoverable entry, every required pack file, the fresh-project installation or materialization path when the app is absent, and the exact corresponding implementation and test fence. A shipped mechanism used by that route is a landed prerequisite; an unlanded installer is not assumed available. A fresh-project body exercises the delivered entry and its actual referenced files outside the source checkout. The prompt-parity body checks the canonical interview source consumed by both paths, with a control that catches either path using a different source; harness-specific kickoff context is not required to be byte-identical. The interview always completes to files. Until T-243's external-open entry lands, it reports that limitation and gives the existing manual way to open the folder in the mirror; it does not print an unimplemented command. The automatic-open integration is rechecked when T-243 lands. The current skill-pack and honestly measured harness-coverage criteria remain. This is a scope decision, not a complete fence: the seat brings a concrete delivery-and-fence draft before this card is cut.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
