---
id: T-296-s6
title: "The keeper at the base is vacuous for a fence of method text alone, because the owner map connects no method path to the specs that read it"
feature: F-01
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-296, 2026-09-10"
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

ADR-024 turns `dispatch.keeper_at_base` on so that a lane is never cut
onto a red baseline. T-296 implements it correctly and it answers nothing
for the population it was priced for.

`deriveOwning` resolves a changed path to its owning specs through static
imports and a docs-reader map. The docs-reader map covers `docs/` and the
import graph covers code; neither reaches `method/`. So every method path
resolves to an empty owning set, the scoped runner refuses the reading
rather than grading it, and the dispatch records the keeper question as
UNANSWERED. Measured during T-296's verification: a card fencing
`method/roles/verifier.md` produced `the derivation cannot place
method/roles/verifier.md (no spec in this lane reaches it through a static
import, and it is not a spec)`.

The lane's arm handles this honestly — it prints a note rather than
treating an ungraded run as a pass — and it could not do better inside its
fence, since the derivation lives outside it. But `brief.spec.ts` and
`card-preflight.spec.ts` DO read the method files, verbatim, to pin their
sentences; that reading is exactly the edge the owner map is missing.

## Acceptance criteria

- WHEN a spec reads a file under method/ THE owner derivation SHALL record that spec as owning that path, by the same reading that already derives the docs readers.
- WHEN a lane whose fence names only method text is cut THE keeper at the base SHALL grade the specs that pin those files, and a red baseline SHALL refuse the cut naming the body.
