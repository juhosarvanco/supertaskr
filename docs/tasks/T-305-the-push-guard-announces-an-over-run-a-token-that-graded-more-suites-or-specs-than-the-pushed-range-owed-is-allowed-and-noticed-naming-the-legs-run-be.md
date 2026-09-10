---
id: T-305
title: The push guard announces an over-run — a token that graded more suites or specs than the pushed range owed is allowed and NOTICED, naming the legs run beyond the owed set, so a seat that still runs the whole battery by habit is told
feature: F-04
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-294]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-10 the seat ran four whole legs for ranges that owed two specs, four times, after T-280 had made the push owe its range; nothing said so.

## Acceptance criteria

- WHEN the guard judges a token whose graded set exceeds the range's owed set THE push SHALL be allowed and a notice SHALL name each suite or spec graded beyond the set with the minutes the owed set would have taken — seen on a planted token.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
