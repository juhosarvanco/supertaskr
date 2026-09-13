---
id: T-320
title: "The express path inside the bounded tier: from an outcome sentence and a named fence the arm creates a compact XS card, measures its eligibility, runs the executor with the configured model reaching the launch and a receipt naming requested beside observed, and records dispatch overhead, executor time, check time and request-to-delivery time separately — an ineligible change is refused by name and re-triaged through the existing path"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-13, from the Codex orchestrator's lean-delivery plan v2 and its reconciliation review of the same day, filed on the owner's ruling; filing authorizes no development"
blocked_by: [T-298-s3, T-319]
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/card-preflight.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/run-record.spec.ts, method/tasks/TASK-FORMAT.md, method/roles/orchestrator.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-13 a change of half a minute to three minutes of editing (a one-line restore, a spec helper swap such as T-314-s6, a wording amendment) travels the same road as a guarded lane: a card filed by hand, a dispatch of eleven steps, an executor (a standard S lane's executor ran 29 minutes and about 262K tokens on T-300-s6), a bench, a verdict, a merge and a closing check — two to three hours to delivery for an edit whose risk is bounded by the fence and the keepers. The bounded tier exists in the schema (20 minutes and 80K, no bench) and is unreachable until T-298-s3 lands, because the parser refuses XS. The dispatch arm already renders the brief from the card (the dispatch verb's own rendering, no typed prompt), the preflight already measures the fence and the guard-class map, and the run record (T-311) already carries a child run's requested and observed values. Today the only launch route for a Claude subagent is the seat's own spawn from the rendered prompt, with the model the arm stamped on the card from the template's roles (dispatch-brief.mjs takes the builder's and the verifier's models from the template by role); no effort value is configured anywhere yet (T-318 adds the shared effort control), and the observed model, tokens, tool uses and seconds arrive in the harness's completion notification, which the seat copies into the meters by hand. What is missing is smaller than a workflow product: a compact card shape the arm can create from an outcome sentence and a fence, an eligibility measurement, a launch receipt tying requested to observed, and the time measurements. T-204 (planned, measured 2026-08-31) overlaps this fence and is re-triaged against what has landed before either dispatches. The plan's targets are measured objectives: under one minute of dispatch and record overhead, and roughly two to five minutes to a local candidate for an eligible edit; check time and publication time are recorded separately and are not part of the target.

## Acceptance criteria

- WHEN the seat gives the arm an outcome sentence and a named fence THE arm SHALL create a compact XS card carrying every required field of the task format and both standing sections (notes and verdicts), with the outcome sentence as its criterion in EARS form and the fence as its touches, SHALL preflight it with the existing preflight, and SHALL create it only inside an active window (T-319) that names it or names the card it corrects — the compact card is generated BEFORE the approval it needs and enters the window's record by the same approval; an outcome sentence alone authorizes no work, pinned by a body that offers a sentence outside any window and requires the refusal by name.
- WHEN a change already belongs to an active card with a safely resumable writer (a correction round, a re-entry) THE arm SHALL reuse that card and its run record rather than creating a compact card or a second writer for the express label, pinned by a body.
- WHEN eligibility is measured THE arm SHALL require, and print as measured findings: an active window; every path inside the fence; a relevant keeper or owning spec present for the path; no guard-class path (the guard-class map of the conventions, T-296); reversible (a tracked file, no rename, no deletion, no generated file); and SHALL refuse an ineligible change by name — a superficially small change to one line of a guard-class file is the demonstration's refused control.
- WHEN an eligible change is launched THE flow SHALL run the executor only, as the bounded contract permits (no bench, no phase 1), with the configured model from the template's roles reaching the launch through the current route (the seat's spawn from the arm's rendered prompt, with the model the arm stamped) and the receipt in the run record naming the requested model and effort (effort recorded as not configured until the template carries one) beside the observed model, tokens and seconds from the completion, requested and observed kept as separate fields, a missing observation recorded as unknown and never substituted; a body plants a completion whose observed model differs from the requested one and requires the receipt to say so and the flow to refuse the merge by name.
- WHEN a check fails or the executor discovers scope beyond the outcome sentence THE flow SHALL preserve the candidate (branch and run record kept), withdraw the express label on the card by a dated append, and re-triage the card through the existing path (a standard or guarded lane), pinned by a body.
- WHEN the demonstration runs on a real eligible change THE notes SHALL record, separately and from stamped instants, dispatch and record overhead (from the outcome sentence to the lane cut), executor time (to the candidate), check time (the owed set), publication time (merge to push) and the request-to-delivery total, and SHALL state whether the plan's targets were met, as measured objectives and not as a stopwatch body that flakes — a slow run recorded is not the objective achieved.
- WHEN the seat coordinates an express change THE seat SHALL NOT be its implementer: the role file says the seat edits no code under the express label, and a coordinator edit at a merge keeps the standing comparison against verified content (T-295-s9), pinned by a method eval on the role file's text.

## Implementation notes

## Verdicts
