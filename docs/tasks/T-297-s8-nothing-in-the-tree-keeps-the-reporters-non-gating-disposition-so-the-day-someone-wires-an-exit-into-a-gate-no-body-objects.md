---
id: T-297-s8
title: "Nothing in the tree keeps the reporter's non-gating disposition — the day somebody wires `npm run health`'s exit into a gate, no body objects, and a breach starts holding lanes back"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-297, 2026-09-11"
blocked_by: []
touches: [tools/e2e/tests/health-bands.spec.ts, tools/e2e/scripts/health-bands.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

"A breach is a finding about the process and never a gate on a lane" is
stated three times in the tree — in `docs/CONVENTIONS.md`, in
`docs/checkpoints/TEMPLATE.md`, and in the reporter's own header — and
kept by nothing. The verifier measured that the property HOLDS today:
a readings file planted so that a card breached its tier's budgets was
run through the card preflight, the push checks and the docs gate, and
none of the three moved; the reporter printed the reading and exited the
way it exits whenever a band is unkept, which is the exit it already had
before the plant. So this is not a defect. It is an unkept invariant,
and the two loop bands are the first ones in the reporter that read a
LANE'S OWN numbers, which makes them the first anybody would be tempted
to enforce.

The keeper is small because the disposition is simple: the reporter's
exit is consumed by no gate script, no push guard and no workflow step,
and a body can assert exactly that over the scripts that exist. It costs
one body and it converts three sentences of good intentions into
something that reds when it stops being true.

## Acceptance criteria

- WHEN a gate script, a push guard or a workflow step consumes the health reporter's exit THE suite SHALL red, naming the consumer.
- WHEN a readings file is planted so that a loop band breaches THE card preflight and the push checks SHALL be unchanged, seen on that planted file rather than asserted.
- WHEN the reporter breaches THE run SHALL still print the reading and its derivation, so the disposition is loud and non-blocking rather than quiet.
