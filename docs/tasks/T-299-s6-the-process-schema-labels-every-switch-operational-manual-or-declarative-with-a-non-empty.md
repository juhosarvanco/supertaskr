---
id: T-299-s6
title: "The process schema labels every switch `operational`, `manual` or `declarative` with a non-empty `manualAction` for the manual ones — an operational label requires behavioural evidence that changing the value changes the arm's behaviour, not only a read site — the terminal lists the label and refuses to edit a declarative switch with its file unchanged, and the reference carries the labels; the app adopts the labels in its authorized amended T-301 resumption after this card lands, and the skill adopts them in T-302"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the recovery candidate of 2026-09-11 carried these labels inside an expanded T-301; the owner ruled on 2026-09-12 that the app is a mirror first and that the pieces of that candidate return as small cards; the Codex orchestrator's review of 2026-09-12 on evidence for operational labels"
blocked_by: [T-317, T-300-s6]
touches: [method/runtime/process-schema.yaml, lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

The schema's `reads:` field names `processLedger` for most switches, which the schema itself explains means no arm branches on them; a user of the terminal cannot tell an executable control from a recorded intention. The arm has a read-site scanner over its own source (`switchReadSites`), pinned by a brief spec body; a read site shows the value is read, not that changing it changes behaviour. The recovery candidate's labelling counted six operational rows and relabelled one switch the arm reads as declarative; that count and that relabelling are claims for this lane's bench, not facts carried over. Refusing to edit a declarative switch is a new product behaviour.

### Acceptance criteria

- WHEN the schema declares a switch THE row SHALL carry `implementation` as one of `operational`, `manual` or `declarative` and `manualAction` as a string, non-empty and actionable for a manual switch and empty otherwise; the parser SHALL refuse a missing or unknown label and an empty manual action.
- WHEN a switch is labelled `operational` THE lane SHALL show behavioural evidence: a body that changes the value and observes the switch's documented effect in the arm, beside the read site the scanner finds; a change in the displayed value alone SHALL NOT establish an operational effect. Missing evidence SHALL trigger inspection and an appropriate body, not automatic demotion. A `declarative` label SHALL be supported by inspection establishing that the promised effect is not implemented; a documented action performed by a person or seat SHALL be classified as `manual` with its actionable instruction. An unresolved classification SHALL remain an acceptance finding and SHALL NOT be concealed by assigning `declarative`. The count of operational switches is this lane's finding, not a figure fixed in advance.
- WHEN the terminal lists a switch THE label and, for a manual switch, the action SHALL be shown beside the value; WHEN an edit names a declarative switch THE command SHALL refuse with the code `declarative` and leave the template byte-identical, pinned by a body; the reference SHALL carry the labels.
- WHEN this card lands THE notes SHALL identify T-301 and T-302 as the remaining label consumers. Under the proposed sequence, T-301 SHALL resume only after T-317, T-300-s6 and this card are merged on its resumption base and its separately authorized amendment includes displaying each label and the manual action before the new brief is frozen; T-302's dispatch contract SHALL likewise include label adoption and this landed prerequisite. This card does not authorize editing either card or an active lane. If T-301's brief is already frozen or its work has finished, the seat SHALL name and obtain authorization for a separate app-label follow-up before claiming the adoption is assigned. The method version SHALL bump with its release note and evaluation block.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
