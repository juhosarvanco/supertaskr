---
id: T-320-s3
title: "The launch receipt compares the requested model against the observed one and never the effort, so the day a template carries an effort per role a seat could run at another and the merge would pass it"
feature: F-04
milestone: 4
size: XS
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-320, filed from the lane on 2026-09-14 as what the lane noticed and did not do"
blocked_by: [T-318]
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-320 built the receipt with requested model and effort beside observed
model, tokens and seconds, and the merge keeper refuses a model the
completion contradicts. It does not refuse a contradicted EFFORT,
because no template in this tree carries one: the requested effort reads
`not configured` everywhere, the completion reports none, and a
comparison would have been a guard over an empty field.

That is honest today and wrong the day T-318 lands the shared effort
control. The requested effort will then be a real value the project
chose, and a seat running at another one will change what a lane costs
and what it produces with nothing reading the difference.

## What would settle it

When an effort per role exists, extend the receipt's mismatch reading to
it on the same terms as the model: an observed value that contradicts
the requested one refuses by name, an unobserved one is news, and
`not configured` on either side is neither. The observed grammar
already has room for a key.

## Implementation notes

## Verdicts
