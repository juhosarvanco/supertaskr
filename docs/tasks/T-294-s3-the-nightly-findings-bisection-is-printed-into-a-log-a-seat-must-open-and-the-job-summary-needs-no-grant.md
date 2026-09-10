---
id: T-294-s3
title: "The nightly red's bisection is printed into a step log a seat has to open, while the run's own SUMMARY is one click from the run page and needs no grant this workflow lacks"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-294, 2026-09-10"
blocked_by: [T-294]
touches: [.github/, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-294's nightly whole run catches the cross-spec red the owed set gives
up, and its `nightly-finding` job prints the bisection that attributes
that red to a merge: the range since the last green nightly, and the
owed set run per merge commit inside it.

It prints it to a STEP LOG. Reading it means opening the run, finding
the job, expanding the step. The standing lesson this pipeline already
paid for is that a reason which is merely findable is a reason nobody
reads: T-278's ENOSPC arrived once, indented inside one body's stderr,
across 4103 log lines, and three runs in a row were misattributed to a
landing-gate defect.

## Why this is small and why it was not done at T-294

`$GITHUB_STEP_SUMMARY` is a file the runner hands every step, and what a
step appends to it renders as markdown on the run's own page — no token
scope, no artifact upload, no action. The `permissions: contents: read`
block T-294 argues at length is untouched by it, which is exactly why
this is worth doing rather than the write grant that would let CI file
the card itself.

It was left out of T-294 because that card's criterion is that the run
SAYS a finding is owed and names the bisection, which the step does; the
surface it says it on is a separate, smaller question.

## A note on the size field

Sized `S` rather than `XS`, which is what ADR-024's bounded tier calls
this shape: the parser's own schema accepts `S | M | L` today and reds
the live-tree smoke bodies on anything else, and the field's widening is
T-296's. Re-size it when that lands.

## Acceptance criteria

- WHEN the nightly whole run is red THE finding job SHALL write its
  bisection to the run's own step summary as well as to its log, and the
  run page SHALL carry the range and the per-merge command.
- WHEN the workflow-parity spec reads that job THE derivation SHALL
  require the summary write, so a step that stops writing it reds by
  name.
- THE workflow's `permissions:` block SHALL be unchanged.
