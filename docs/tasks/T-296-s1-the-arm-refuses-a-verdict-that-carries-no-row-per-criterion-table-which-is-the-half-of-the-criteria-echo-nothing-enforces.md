---
id: T-296-s1
title: "The arm refuses a verdict that carries no row per acceptance criterion — the half of the criteria echo that nothing enforces, so a verdict can still approve a card without saying which criteria it approved"
feature: F-01
milestone: 4
size: S
priority: 2
status: parked
wake: T-262
suggested_by: "executor claude-opus-5@subagent @T-296, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

The loop room's cheap keeper five has two halves and T-296 landed one of
them. The executor's criteria echo is now stated in `method/roles/executor.md`
and the verifier's row per criterion in `method/roles/verifier.md`, but
the room's own sentence for that keeper ends "the arm refuses a verdict
without the table", and nothing does. A verdict that says APPROVED
without one has not said which criteria it is approving, and the class it
removes — the unexamined criterion — is invisible afterwards by
construction.

The shape is a merge keeper beside the four `keeperSteps` already plans:
read the newest verdict entry off the merged card, count the acceptance
criteria the card declares, and refuse when the verdict carries no row
for one of them. The counting is the whole difficulty: a criterion is an
EARS line under `## Acceptance criteria` (`session-economics.mjs` already
derives those), and a row is a table line naming it. Keep the refusal on
the COUNT rather than on a matching of prose, and say what it could not
find.

## Acceptance criteria

- WHEN the merge reads a verdict THE arm SHALL count the card's acceptance criteria and the verdict's criterion rows, and SHALL refuse when the verdict carries fewer rows than the card carries criteria, naming both counts.
- WHEN a card carries no acceptance-criteria heading THE keeper SHALL say so and judge nothing, rather than refusing a card it cannot count.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-262; the arm refuses a verdict with no row per criterion, which is the same machine-readable verdict shape.
