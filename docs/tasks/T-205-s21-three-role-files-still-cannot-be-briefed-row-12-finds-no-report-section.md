---
id: T-205-s21
title: "Three of this method's five role files still cannot be briefed: `--role integrator`, `--role orchestrator` and `--role planner` all exit 3 on row 12, because only executor.md and verifier.md carry a `## The report` section"
feature: F-06
milestone: 4
size: S
tier: guarded
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-205-s5, 2026-09-17, measured at 03c6a2dc975e after that card's repair landed in its lane"
blocked_by: [T-205-s5]
touches: [method/roles/integrator.md, method/roles/orchestrator.md, method/roles/planner.md, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-205-s5 removed the refusal that reached every role: the contract
table is read from the one place it lives, and a role file carrying
none is no longer read as a contract of its own. Measured in that
lane after the repair, with `brief.mjs --task T-205-s5 --role <role>`:

    verifier      exit 0
    integrator    exit 3
    orchestrator  exit 3
    planner       exit 3

All three now fail for exactly one reason, and it is the same one:

    dispatch-brief: no section headed "## The report" — this module
    quotes that section rather than restating it, so a renamed heading
    is a hard failure.

Row 12's source column names *"this role file's `## The report` spec
and the dispatching role's"*, and the contract calls row 12
role-specific, so the section is read against the brief's own role
file. Only `executor.md` carried one; `verifier.md` gained one in
T-205-s5, which is what made its brief assemblable. The remaining
three role files carry no such section, so the contract's own row 12
has no source in them.

**THIS IS THE METHOD TEXT'S GAP, NOT THE ASSEMBLER'S.** Every role
that reports owes a statement of what its report carries, and two of
these three are roles this project actually dispatches. The remedy is
three `## The report` sections written where each role's own
obligations live, each a pointer to the steps that own them rather
than a second statement of them.

**NOT T-205-s5's TO FIX**: those three role files are outside that
card's manifest, and its criteria name the verifier role alone.

## Acceptance criteria

- WHEN the brief assembler is asked for the integrator role of a card
  THE render SHALL exit 0 and carry row 12 from that role file's own
  `## The report` section.
- WHEN the brief assembler is asked for the orchestrator role of a card
  THE render SHALL exit 0 and carry row 12 from that role file's own
  `## The report` section.
- WHEN the brief assembler is asked for the planner role of a card THE
  render SHALL exit 0 and carry row 12 from that role file's own
  `## The report` section.
- EACH new section SHALL be placed around, never rewording, the
  sentences the specs already pin in those three files, and SHALL point
  at the steps that own each item rather than restating them.
- A body in `tools/e2e/tests/brief.spec.ts` SHALL assemble every role
  this method publishes and assert each one exits with a full row set,
  so a role file added later without a report section is a red rather
  than a refusal nobody meets until a dispatch.

**FENCE NOTE.** `tools/e2e/tests/brief.spec.ts` is T-205-s5's live
fence while that lane runs, which is why this card is blocked on it.

## Implementation notes

## Verdicts
