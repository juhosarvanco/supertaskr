---
id: T-143-s7
title: "A whole-tree finding takes the docs gate's zero away from a code-only path list, and the bodies that red under it name neither the finding nor the file — the cause is one line of lint:docs and no line of the suite"
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-143-s5, which re-read the asymmetry its own parent card recorded and left untouched, because the parent's criteria scope to the staleness reading and not to how a finding is reported"
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The docs gate's whole-tree checks — the record staleness reading, the
governing-document byte budgets, the generated index's currency and the
task-card frontmatter census — all add to the same `found` counter the
diff-shaped checks add to. So a path list carrying NO docs path at all,
which the gate is supposed to answer with a clean exit, cannot reach zero
while any whole-tree finding stands anywhere in the checkout.

T-143-s5's own opening section measured that happening: at `4d3dd8f`
three bodies in `tools/e2e/tests/docs-input-gate.spec.ts` went red
together, all of them asserting that a code-only path list reaches the
reader as exit 0, and their titles name exit codes and empty lists —
never a record, never the state document, never the checkpoint whose
regeneration was missing. `npm run lint:docs` printed the cause in one
line. The suite printed three failures about something else. A seat then
spent a gate run and a clone measurement establishing that the reds
belonged to the tree rather than to its own lane.

That card's disposition B has now moved the staleness reading, so this
particular whole-tree finding fires far less often. The ASYMMETRY is
untouched, and there are four whole-tree checks behind it.

## Acceptance criteria

- WHEN the docs gate answers a path list that carries no path under docs/ AND a whole-tree finding stands THE line a reader stops at SHALL name that finding and the check it came from, so the exit is attributable without running a second command; pinned by a body over a planted whole-tree finding, with the control where no such finding stands and the same line is absent.
- WHEN a body asserts that a code-only path list reaches the reader as a clean exit THE assertion message SHALL carry the whole-tree findings that were standing when it ran, so a red attributes itself instead of sending its reader to a third command; a body SHALL be shown failing with a planted finding and its message read.
- WHEN the change lands THE four whole-tree checks SHALL be derived from the gate rather than listed, so a check added later joins the reporting without a second edit, and a body SHALL red when a whole-tree check reaches the exit without reaching that line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
