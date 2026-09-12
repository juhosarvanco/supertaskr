---
id: T-308
title: "A new procedural rule's source card carries its reason, its impact and its review condition — rule 8 of the docs protocol extended to standing procedural instructions, forward-looking only, with the rulebook bullet staying concise and citing the card"
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "the owner's ruling of 2026-09-12 on the Claude seat's proposal as adjusted by the Codex orchestrator: distinguish the incident's impact from the rule's ongoing cost, use a review condition rather than an expiry, and keep the detail on the cited card"
blocked_by: []
touches: [method/docs-protocol.md, method/tasks/TASK-FORMAT.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Rule 8 of the docs protocol requires every standing machine, a gate, a keeper, a hook, a band, to ship with the observation under which it retires. The rulebook's prose rules have no such requirement: a bullet cites the card that produced it and carries at most one worked example, and the rule-review sitting the owner adopted on 2026-09-12 has to reconstruct, from git and memory, what the incident cost and what would make the instruction unnecessary. The rulebook is past its warning line.

## Acceptance criteria

- WHEN a card produces a new standing procedural instruction for the rulebook THE card SHALL carry a section naming the reason and the impact of the incident, measured where a measurement exists and qualitative where none does, and a review condition stating what evidence or implementation change would justify simplifying or removing the instruction, and the rulebook bullet SHALL cite that card and carry no more than it does today.
- WHEN the review condition is read THE text SHALL name a condition to review under, never an automatic expiry, and retiring an instruction SHALL never retire the requirement behind it: interface requirements and product invariants are not treated as incident workarounds.
- WHEN the rule lands THE method version SHALL bump with its release note and evaluation block, and no existing card or bullet SHALL be backfilled.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
