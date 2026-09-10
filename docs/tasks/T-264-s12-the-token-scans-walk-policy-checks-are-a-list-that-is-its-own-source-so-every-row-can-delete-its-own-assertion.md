---
id: T-264-s12
title: The token scan's walk-policy checks are a list that is its own expectation — every row in it can be deleted and the gate stays clean, which is the tautology this project has now cut twice in other modules
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: verifier claude-opus-5@subagent, at T-264-s3's bench, 2026-09-10 — generalised from an assigned correction whose drill measured one row of this list
blocked_by: []
touches: [tools/e2e/scripts/token-scan.mjs, tools/e2e/tests/token-scan.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`walkPolicyChecks()` in `tools/e2e/scripts/token-scan.mjs` builds the
gate's policy assertions as an array of `[what, ok]` pairs, and a large
part of that array is literal data: the tracked-text-format list, the
named single files, the root list. Each entry is BOTH the expectation and
the only record that the expectation was ever wanted, so deleting an
entry deletes its own assertion and the gate reports clean.

**Measured at T-264-s3's tip `56f422e2`.** Removing one row of the
tracked-text-format list left `npm run lint:tokens` at `exit 0`, printing
`lint-tokens: clean` over the same 1440 CONTROL files, and left
`tools/e2e/tests/token-scan.spec.ts` at 10 passed. Nothing in the tree
noticed that a policy check had stopped existing.

This is the same shape this project has now cut twice elsewhere and named
both times: `rename-scan.mjs`'s own header argues the class table must be
literal rather than learned from the corpus it judges, and T-264-s3's
seventh commit re-cut `the corpus reaches every tree the criteria name`
for exactly this reason, after a drill that dropped a root passed nine of
nine. The verifier's assigned correction at that lane closed ONE row of
this list — the runtime template T-269's criterion names — by deriving
the expected path from the compile-time embed instead of from the list.
Every other row is still open.

The general remedy is a floor: derive the set of rows the list must carry
from something outside the list — the tracked tree, another module's
constants, or a declared minimum count with its argument written down —
so that a deletion has to argue for itself. `controlFloorChecks` already
does this for one property and is the worked example inside the same file.

## Acceptance criteria

- WHEN a row is removed from `walkPolicyChecks`'s literal data THE gate
  SHALL red rather than report clean, for every class of row the file
  declares.
- WHEN a row is deliberately retired THE retirement SHALL be written in
  the module, so a deletion and a decision look different.
- Each new floor SHALL carry a data mutant shown failing first — one row
  removed, the gate red by name — planted where the arming is absent.
