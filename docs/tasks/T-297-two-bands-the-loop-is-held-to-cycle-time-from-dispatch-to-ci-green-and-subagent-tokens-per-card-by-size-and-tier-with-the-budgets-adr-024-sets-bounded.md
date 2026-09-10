---
id: T-297
title: Two bands the loop is held to — cycle time from dispatch to CI green and subagent tokens per card, by size and tier, with the budgets ADR-024 sets (bounded 20 min/80K, standard 75 min/310K, guarded 100 min/450K), fed by the meters the arm appends at every merge and read at every checkpoint
feature: F-06
milestone: 4
size: S
tier: standard
priority: 2
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-295]
touches: [tools/e2e/scripts/health-bands.mjs, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts, docs/CONVENTIONS.md, docs/checkpoints/TEMPLATE.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Nothing measures the loop's cost; the health bands watch file sizes and triage counts. The `## Meters` blocks exist in every report and verdict and are read by nobody.

## Acceptance criteria

- WHEN the arm merges THE meters SHALL be appended to the bands' readings with the card, the size, the tier, the dispatch and CI-green times and the subagent tokens per seat; WHEN `npm run health` runs THE two bands SHALL read inside / drifting / breached against the budgets per tier.
- WHEN a checkpoint is written THE two bands SHALL be quoted with their derive command, and a breach SHALL be a finding about the process, never a gate on a lane.
- WHEN the rejection rate per tier is read beside CI reds THE band SHALL flag a tier whose rejections fell to zero while CI reds rose — the soft-verifier reading — seen on a planted history.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
