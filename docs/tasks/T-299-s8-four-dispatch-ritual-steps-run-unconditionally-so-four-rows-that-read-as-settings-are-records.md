---
id: T-299-s8
title: "Four steps of the dispatch ritual run whatever their rows say, so `dispatch.keeper_at_base`, `dispatch.preflight`, `verify.ground` and `verify.separate_bench` are records rather than controls — the ritual reads its own rows, and each one earns an operational label with a body"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent at T-299-s6, which labelled the four rows declarative after inspection and did not implement the readings: the repair adds behaviour rather than a label, and the card that assigns labels is not the card that changes what the arm does"
blocked_by: [T-299-s6]
touches: [method/runtime/process-schema.yaml, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The dispatch ritual's step list is a frozen array, and four of its steps
name a switch that nothing reads: step one is the keeper spec at the base,
step five the card preflight, step eight the verifier's bench, and the
ground truths phase two judges on are taken by the same render whatever
`verify.ground` says. Each of those four rows describes exactly what the
ritual does at the value this project runs, and each promises a second
value that no arrangement can reach.

T-299-s6 labelled all four `declarative` on that inspection, which is the
honest reading of the tree as it stands: nothing reads them and no seat is
instructed by them, so editing one moves the template and changes nothing.
Two of them are FLOOR and so can never take a second value, which makes
the label the whole of what a reader can be told about them.

The repair is not a relabelling. It is the ritual reading its own rows
where a second value is reachable — `dispatch.keeper_at_base` and
`verify.ground` are the two that are not floor — and reporting the skip
rather than performing it silently, the way the phase-one step already
does: a step this arm skipped on purpose and a step it forgot look the
same on disk. The two floor rows stay records and should say so.

## Acceptance criteria

- WHEN the dispatch ritual reaches a step whose switch is not FLOOR THE
  step SHALL read that switch and either perform its work or record a skip
  naming the switch that decided it, and the row SHALL then carry
  `implementation: operational` with a body that changes the value and
  observes the ritual's own act rather than a resolver's return.
- WHEN a step's switch is FLOOR THE row SHALL keep the label inspection
  gives it, and the notes SHALL say which rows those are and why a floor
  row cannot earn an operational label.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
