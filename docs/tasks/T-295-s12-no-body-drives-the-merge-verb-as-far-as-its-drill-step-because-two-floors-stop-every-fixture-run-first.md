---
id: T-295-s12
title: "No body drives the merge verb as far as its drill step, because keeper:preflight and graph:regen stop every fixture run before it — so the drill's own run-time output, the one half of the step a seat reads at a real merge, is pinned by nothing"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-295-s10, measured in that lane while trying to drive the verb end to end over the T-314-s6 shape"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`tools/e2e/tests/merge.spec.ts` drives the whole verb over a real
repository in several bodies, and not one of them reaches the drill step.
Two steps stand in front of it and both refuse in a fixture. The card
preflight is a FLOOR — it stands even with the cheap keepers switched
off — and in a fixture it reports that the arm is not in this project and
stops the run at exit 1. Giving the fixture an arm that answers clean
gets one step further: the graph regeneration then stops it at exit 3.
Measured in the T-295-s10 lane: with the preflight arm written into the
fixture the ledger ends `keeper:preflight:0 | graph:regen:3`, and without
it at `keeper:preflight:1`.

What that costs is not hypothetical. The drill step's run-time output is
the half a seat actually reads at a merge — which correction was drilled,
which carried no block and why nothing was drilled for it — and every
body about the step today reads the PLAN instead. The T-295-s10 lane
pinned the plan line and the step's own `wording` list, and had to record
its run-time sentence as formatting no body reaches. The same gap covers
the drill's own refusal text, its NOTE about a block whose spec the fix
diff does not own, and the acknowledgement warning.

The remedy is a fixture that can be driven past both floors and a body
that reads the run's own lines, not a stand-in that makes a gate lie: the
two floors are legitimate steps, and whatever lets a body past them
should be a declared arrangement of the fixture repository rather than a
silenced check.

## Acceptance criteria

- WHEN a body in `tools/e2e/tests/merge.spec.ts` drives the verb over a
  fixture arranged to reach the drill THE run SHALL reach the drill step
  and grade it, with the arrangement declared in the fixture rather than
  by disabling a step, and the body SHALL read the drill's OWN run-time
  lines.
- WHEN the verdict driven is one whose corrections are all stated wording
  THE run's output SHALL name each of them as carrying no block, with the
  control arm — the same verdict with the statements gone — stopping at
  the refusal.

## Implementation notes

## Verdicts
