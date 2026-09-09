---
id: T-292
title: The two hottest modules split — dispatch-brief.mjs into the triage view, the startable derivation and the pack, and brief.spec.ts into topic specs like every other spec file — with no behaviour change, so cards fence a module (ADR-023 decision 4; ruling D)
feature: F-06
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-09): \"Rule A–D as proposed\" — decision D of docs/rooms/foundation-files-standard.md; the seat's F of the fence review"
blocked_by: [T-285, T-287]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/, tools/e2e/tests/, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/lane-fence.mjs, tools/e2e/scripts/session-economics.mjs, tools/e2e/scripts/card-figures.mjs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

At 6c7c7e6 tools/e2e/scripts/dispatch-brief.mjs is about 4,900 lines and tools/e2e/tests/brief.spec.ts about 5,000, and 17 and 12 planned cards fence them — the two atoms the fence cannot split. The fence's atom is the file (ruling D: the file stays the unit of ownership; section fences declined), so the remedy is smaller files: modules by the question they answer (the triage view — T-282's clusters and T-285's wake; the startable derivation; the pack; the fence expansion) and topic specs named as the census names them. A mechanical move: every export keeps its name and its callers, every body keeps its name.

## Acceptance criteria

- WHEN the split lands THE public surface SHALL be unchanged — every export dispatch-brief.mjs had is still importable from it (re-exported from the new modules) so no caller outside the fence moves — and every body name in brief.spec.ts SHALL survive verbatim in whichever topic spec now carries it; the capabilities census SHALL read CURRENT after regeneration with no sentence lost.
- WHEN a card names one of the new modules or topic specs in its touches THE dispatch view SHALL derive it disjoint from a lane holding a sibling module — a body SHALL show two fixture cards fencing two of the new files STARTABLE together where at the base they were not.
- WHEN the four legs run at the tip THE counts SHALL equal the base's, and the T-271 import graph SHALL place every new file (a spec that owns a module it imports; no unresolvable edge).
- IF a function cannot be moved without changing a call site outside the fence THEN it SHALL stay in dispatch-brief.mjs and the notes SHALL name it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
