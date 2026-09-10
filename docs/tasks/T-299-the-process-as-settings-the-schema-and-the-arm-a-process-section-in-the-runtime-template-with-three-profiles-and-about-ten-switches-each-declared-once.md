---
id: T-299
title: The process as settings, the schema and the arm — a `process:` section in the runtime template with three profiles and about ten switches, each declared once in a schema with its explanation, its effect, its constraints and the band it is measured by; the arm reads the section at dispatch and merge and refuses a combination the constraints forbid
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/runtime/supertaskr.yaml, method/runtime/process-schema.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The runtime template already carries role defaults; the loop's options ruled in ADR-024 are switches with dependencies (the tiers need the fence hook and the owed-set token) and a floor that cannot be switched off (the fence, the token and guard, the landing gate, records never rewritten).

## Acceptance criteria

- WHEN the runtime template is read THE `process:` section SHALL name a profile (fast, standard, guarded-everything) and the switches under it, and the schema beside it SHALL carry, per switch, what it does, how it changes the loop, what it needs on, whether it may be turned off, and which band measures it — the ONE source every renderer reads.
- WHEN the arm dispatches or merges THE tier rules, the phase-1 spawn, the whole-suite net, the regenerations' place, the cheap keepers and the model per role SHALL be read from the section, and a body SHALL show each switch changing the arm's behaviour and a forbidden combination refused by name.
- WHEN a switch is ignored by the arm THE body for that switch SHALL red — one mutant per switch, planted where the arm reads it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

**The switch inventory** — every step of the ceremony as a switch with its old and ruled values, costs and constraints — is recorded in docs/rooms/loop-cost-and-speed.md (appended 2026-09-10) and is this card's input; the schema SHALL carry every row and the floor.
