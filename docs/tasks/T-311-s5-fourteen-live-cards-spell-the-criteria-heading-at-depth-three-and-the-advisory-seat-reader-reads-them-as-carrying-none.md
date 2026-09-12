---
id: T-311-s5
title: "Fourteen live cards spell the criteria heading at depth three; the advisory seat reader requires depth two and read T-311's seven criteria as none, while the card preflight accepts either depth — one spelling, named by the task format and kept by a body"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-311, reported in its notes after the stamp at a98e5a067ca815b984d133ed8b311366899499f4 and filed by the seat, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/session-economics.mjs, tools/e2e/tests/session-economics.spec.ts, method/tasks/TASK-FORMAT.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The task format names the section `## Acceptance criteria`. Measured on the
integration checkout at the T-311 dispatch: 491 live cards spell it so and 14
spell it `### Acceptance criteria` — T-093, T-112-s3, T-177, T-208, T-229-s4
and the nine cards of the 2026-09-12 planning batch (T-299-s6, T-300-s6,
T-311 to T-317), which were drafted in one file and inherited one depth.

Two readers disagree about them. The card preflight's heading pattern accepts
any depth from two, so those cards preflight green and their criteria are
checked. The advisory seat reader in the session-economics module compares
the heading as an exact string at depth two, so for T-311 it read the seven
criteria as none, reported "the card carries no acceptance criteria", and
answered TRY — the stronger seat, so nothing was lost this time. The parser
library documents the section as depth two as well. A card with criteria that
one reader sees and another does not is a card whose signals depend on which
tool asked.

## Acceptance criteria

- WHEN a card's criteria section is read by the advisory seat reader THE heading SHALL be matched by the same rule the card preflight uses, so both answer the same criteria for the same card; a body drives both readers over a card at each depth and requires agreement.
- WHEN the task format is read THE one spelling SHALL be stated there with the depth named, and a body over the live cards SHALL red naming any card at another depth — with the fourteen measured here listed as the known set at this ref so the body is green at landing and reds on the fifteenth; whether those fourteen are repaired is the owner's ruling, recorded on this card, since records are appended and not rewritten.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
