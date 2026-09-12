---
id: T-309
title: "The handoff packet is the method's succession format at every change of coordination ownership — a compact required core under method/, the role files' succession sections pointing at it, attachments optional, required at coordination handoffs only"
feature: F-01
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the owner's ruling of 2026-09-12 on the Claude seat's proposal as adjusted by the Codex orchestrator: the packet carries authorization and does not create it; hashes prove integrity only; historical facts are rechecked live before takeover; a compact core with optional attachments; generation of facts by the arm later"
blocked_by: []
touches: [method/HANDOFF-FORMAT.md, method/roles/orchestrator.md, method/roles/integrator.md, method/roles/planner.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The role files' succession sections say a departing seat leaves what a successor needs and do not fix its form. On 2026-09-11 and 2026-09-12 the two seats handed the project to each other three times with a packet of the same shape, a HANDOFF.md with hashed files, and each successor resumed; how much reconstruction each needed was not measured, and the
format is worth having without that figure. The shape is worth one canonical format; the recovery packets were thorough, and the required core must be small so the format never becomes the minimum workload of a seat change.

## Acceptance criteria

- WHEN coordination ownership changes, in either direction and including same-provider succession, THE outgoing seat SHALL write a packet whose required core carries: the scope already authorized by the owner with its source and the next action; the checkpoint and exact refs; active attempts, pending questions and unfinished work; ownership and the checks the successor makes before takeover; the confidentiality boundaries; the selected model profile revision, or `none configured` or `unknown`, with the concrete current assignments where available, active overrides and the reported budget state. Attachments are optional and never include verifier-only material.
- WHEN a successor receives a packet THE successor SHALL verify its hashes, state its understanding before acting, recheck the live state the packet reports before claiming a seat or writing, and take the seat with the existing seat verbs; the packet records the handoff and is not the ownership mechanism.
- WHEN the outgoing seat cannot produce a packet THE successor SHALL reconstruct one from the checkpoint, the refs and the live state, labelled a recovery packet, and SHALL pass the existing ownership checks before writing; missing handoff material implies no permission and never makes recovery impossible.
- WHEN the format lands THE role files' succession sections SHALL point at it rather than describe it, a subagent launch SHALL owe no packet, and the method version SHALL bump with its release note and evaluation block.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
