---
id: T-295-s14
title: "The fixture table names ONE synthetic identity and the suite plants a different one per card, so the next merge that adds a new fixture repository still stops on a value nobody argues with — the address entry enumerates values where the property it relies on is the DOMAIN"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-295-s4, 2026-09-14, while enumerating the addresses the new table keeps"
blocked_by: [T-295-s4]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, docs/CONVENTIONS.md, docs/conventions/app-and-ui.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-295-s4's table keeps the suite's one fixture identity across
tools/e2e/tests/ by naming that value exactly. The suite does not use
one identity. A grep at 74dc490c finds per-card addresses in
tools/e2e/tests/brief.spec.ts, tools/e2e/tests/gate-run.spec.ts,
tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/lane-fence.spec.ts
and tools/e2e/tests/git-fixture.spec.ts, each a card id at the same
reserved domain, plus one in app/src-tauri/src/churn.rs and one under
method/skills/. Every one of them is refused by the table as it stands,
so a lane that adds a fixture repository with its own identity meets the
same stop the three merges of 2026-09-13 and 2026-09-14 met.

The property the entry actually relies on is the DOMAIN, not the local
part: the standards reserve those names for documentation and testing,
so a value at one cannot be delivered to and cannot be a person. An
entry whose pattern is the reserved domain inside the suite's own spec
tree would end the class, and it is a WIDER exception than T-295-s4's
amendment admitted without argument — which is why that card enumerated
instead and this one is the place to argue it.

The alternative is the other direction: make the standing practice
mechanical, so every fixture repository uses the one identity the suite
already carries and the table keeps naming exactly it. That is a change
across many spec files and is the more invasive half.

## Acceptance criteria

- WHEN a merge adds a line planting a synthetic address at a domain the
  standards reserve, inside the suite's own spec tree THE keeper SHALL
  have a stated answer that does not require a table edit per card id,
  and the answer SHALL be argued in docs/CONVENTIONS.md's own merge-arm
  bullet rather than only in tools/e2e/scripts/merge.mjs.
- WHEN the same address sits outside that tree, or at a domain the
  standards do not reserve THE keeper SHALL refuse as it does today,
  pinned by a body in tools/e2e/tests/merge.spec.ts with the control
  where the arrangement is absent.
- WHERE the answer widens the exception beyond the values a table
  enumerates THE card SHALL state what an attacker gains by it, because
  the amendment this follows forbids claiming an arbitrary value
  harmless for sitting in a test.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes

## Verdicts
