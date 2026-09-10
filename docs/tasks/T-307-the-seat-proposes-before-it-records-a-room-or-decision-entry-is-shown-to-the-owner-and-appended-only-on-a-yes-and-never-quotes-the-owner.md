---
id: T-307
title: "The seat proposes before it records — an entry for a room or a decision record is shown to the owner in the conversation and appended only on the owner's yes; entries paraphrase a ruling with its date and never quote the owner, who appears as the owner; the method text states the rule once and an eval holds it"
feature: F-01
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the owner, 2026-09-10: the seat had appended sections to rooms on its own judgment and quoted the owner's messages; the owner asked to be shown what will be added before it is added, endorsed the proposed-then-appended form as the right model, and asked for it as a rule"
blocked_by: []
touches: [method/roles/orchestrator.md, method/rooms/ROOM-FORMAT.md, method/docs-templates/decisions/000-template.md, tools/method-evals/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-10 the architect seat appended six sections to one room on its own judgment and quoted the owner's chat messages in rooms and decision records; the owner later found the quotes unfit for a public reader and asked to be shown every addition first. From that moment the seat proposed each entry in the conversation and appended it only on a yes, paraphrasing rulings with their date — and the owner called that the right model and the language right. The rule lives today only in the seat's memory notes; nothing in the method states it and nothing holds it.

## Acceptance criteria

- WHEN the orchestrator's role file is read THE rule SHALL be stated once: an entry for a room or a decision record is proposed to the owner in the conversation, verbatim as it will be written, and appended only on the owner's yes; cards, checkpoints, STATE and the seat's own ledger are the seat's records and need no ask.
- WHEN a ruling is recorded in a room or a decision record THE entry SHALL paraphrase the ruling with its date and SHALL NOT quote the owner's message; the owner SHALL appear as the owner, never by name — stated once in ROOM-FORMAT.md and in the decision template.
- WHEN the method eval gate runs THE rule SHALL have an eval that fails on a room entry carrying a quoted message or a personal name, seen failing before it is believed.
- The method stamp SHALL be bumped at the merge (the role file and the templates are kit files); the one line pointing CONVENTIONS' records bullet at the rule is the integrator's write at the merge, outside this fence, so this lane can run beside T-295, which holds CONVENTIONS.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
