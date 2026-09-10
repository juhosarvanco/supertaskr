---
id: T-298
title: Right-sizing at triage, the model per role from the runtime template, and bounded waiting in the arm — a card is the smallest unit that carries its own test cycle; every dispatch names its model from the template's role defaults (Opus 5 by default, the user's to change); the arm's waits are marker-driven with a ceiling
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/roles/orchestrator.md, method/runtime/supertaskr.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Superpowers' measured run put all 26 reviewers on the top tier because one dispatch named no model, and two-thirds of its wait calls were short polls that timed out; our dispatches name models by hand and our waits are hand-typed sleeps.

## Acceptance criteria

- WHEN a card is triaged THE orchestrator's rule SHALL be stated once: a card is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate, and a card larger than that is split before dispatch.
- WHEN the arm dispatches any seat THE model SHALL be read from the runtime template's role defaults and printed in the brief; an absent default SHALL refuse the dispatch, never inherit the session's model; the template's defaults SHALL read Opus 5 for every role.
- WHEN the arm waits on a lane, a bench or a battery THE wait SHALL be on a marker file or a pid with a stated ceiling, and a body SHALL show the ceiling reached reported rather than hung.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
