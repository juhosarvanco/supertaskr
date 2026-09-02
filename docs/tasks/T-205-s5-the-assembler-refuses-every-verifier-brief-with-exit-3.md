---
id: T-205-s5
title: The project's own brief assembler refuses EVERY verifier brief with exit 3 — it looks for the thirteen-row contract table in the role file it was asked for, and only executor.md has one
feature: F-06
milestone: 4
size: M
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

**MEASURED IN T-205's LANE, AND IT PREDATES THAT LANE.**

    node tools/e2e/scripts/brief.mjs --task T-205 --role verifier
    brief: COULD NOT RUN
      dispatch-brief: found 0 tables headed # / The brief carries /
      Assembled from / If it is absent, expected exactly one ...
    exit 3

`dispatch-brief.mjs` reads the row set out of the role file it was
handed. **`method/roles/executor.md` is the only role file that carries
the table**; `roles/verifier.md` has never carried one, at the lane's
base ref or after it (`git show <base>:method/roles/verifier.md | grep
-c "The brief carries"` = 0 both ways), so the refusal is not this
lane's doing.

**WHY IT IS NOW A BLOCKING GAP RATHER THAN A CURIOSITY.**
`roles/executor.md`'s contract table says in as many words that *"a
verifier's or integrator's brief follows the same thirteen-row contract,
substituting the role-specific rows"*, and `roles/orchestrator.md` 5b
requires a brief to be assembled BY THE PROJECT'S OWN ASSEMBLER — *a
rule that depends on a reader remembering has a failure mode; a rule
that depends on a construction does not*. Every verifier brief on this
project is therefore hand-written today, which is precisely the
condition under which four briefs in one sitting broke a rule they had
QUOTED. **And T-205 has just added a two-spawn dispatch for the verifier
that nothing can assemble**, so the newest contract is the one furthest
from a construction.

## Acceptance criteria

- `--role verifier` SHALL assemble rather than exit 3, reading the row
  set from the ONE place it lives and substituting the role-specific
  rows named there (4, 11, 12) against `roles/verifier.md`.
- A ROLE FILE that carries no table SHALL NOT be read as a contract of
  its own, and the substitution SHALL be DERIVED from the role file
  rather than hardcoded per role.
- ROW 3 SHALL apply `roles/verifier.md`'s own reading step — its ONE
  subtraction and no invented addition — the property
  `tools/e2e/tests/brief.spec.ts` already pins for that file.
- THE assembled verifier brief SHALL be the TWO-spawn pair
  `roles/orchestrator.md` 5d mandates, or SHALL say in the artifact that
  it is the single-message fallback. Never silently the second.

## Blocked by `T-225-s2`

That lane holds `tools/e2e/scripts/brief.mjs` and
`tools/e2e/scripts/dispatch-brief.mjs` — this card's whole fence — and a
fence is not shared. It waits for that lane to land.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. Every verifier brief the assembler produces is refused at exit 3; waits behind T-239 on dispatch-brief.mjs by fence.
