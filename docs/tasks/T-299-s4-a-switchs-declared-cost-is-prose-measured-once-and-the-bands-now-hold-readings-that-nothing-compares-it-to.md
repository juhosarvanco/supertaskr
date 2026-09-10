---
id: T-299-s4
title: "A switch's declared cost is prose measured once by hand, the bands now hold real readings, and nothing compares the two — a cost that has drifted reads exactly like a cost that holds"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-299, measured at 689a66c3cf99c1963d170d9e47734746cdcf708a, 2026-09-10"
blocked_by: []
touches: [method/runtime/process-schema.yaml, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Every switch in the process schema carries a `cost:` and a `band:`.
The band is checked — a body requires it to be a band this project
actually keeps — and the cost is not checked at all. It is a sentence
copied from the loop room's table, measured once on 2026-09-09, and it
will be true for exactly as long as nobody changes anything.

The readings that would contradict it now exist. The bands parse
`docs/checkpoints/meters.jsonl`, every merge appends the lane's and the
verifier's meters, and the per-tier budgets are already held there. So a
switch claiming a step costs 15 to 20 minutes sits beside a file that
knows what that step cost on the last several cards, and the two never
meet.

## What a fix looks like

The cheap version is a band, not a keeper: a reading that reports the
switches whose declared cost is furthest from what the meters measured,
without an exit code, so a drift is visible at the checkpoint and nobody
has to keep prose true by hand. The expensive version is a machine
readable cost — a number and a unit rather than a sentence — and that is
a schema change worth arguing before it is made.

Start with the band. A cost nobody can compare is the thing to fix; a
cost format nobody asked for is not.

## Acceptance criteria

- WHEN the bands are read at a checkpoint THEY SHALL report the declared
  cost of each switch beside what this project's own readings measured
  for it, where a reading exists.
- WHEN no reading exists for a switch THE report SHALL say so rather
  than treating an absent reading as agreement.
