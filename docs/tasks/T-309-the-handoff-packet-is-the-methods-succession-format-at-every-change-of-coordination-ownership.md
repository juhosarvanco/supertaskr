---
id: T-309
title: "The arm generates a compact succession packet from existing records, names the capabilities needed to continue, and finishes the outgoing seat through the existing job and ownership instruments"
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "the owner's ruling of 2026-09-12 on the Claude seat's proposal as adjusted by the Codex orchestrator: the packet carries authorization and does not create it; hashes prove integrity only; historical facts are rechecked live before takeover; a compact core with optional attachments; generation of facts by the arm later"
blocked_by: [T-329]
touches: [method/HANDOFF-FORMAT.md, method/roles/orchestrator.md, method/roles/integrator.md, method/roles/planner.md, tools/e2e/scripts/handoff.mjs, tools/e2e/tests/handoff.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Amendment provenance

Amended on 2026-09-15 on the owner's yes, from the Codex orchestrator's lean-handoff review bundle of the same day, whose manifest and source snapshots the architect seat verified against the git blob contents at `150f38eb1cabc517c548be49460b2174f2daf6ac` before putting it to the owner.

What changed: the deliverable moves from format-only to format plus a working generator, and the title follows it; size S becomes a provisional M; a dependency on T-329 is added; and the four earlier acceptance criteria are superseded by the seven in the canonical section below, which keep the original scope and next-action, refs and checkpoint, active-work and questions, confidentiality, model/override/budget, verification and live-check, recovery, role-pointer and method-evaluation obligations, and extend them with generation and execution-context compatibility.

THE FENCE CHANGED, AND THE REMOVALS ARE NAMED RATHER THAN SILENTLY APPLIED. Dropped: `docs/conventions/app-and-ui.md` and `docs/conventions/merging.md`. Added: `tools/e2e/scripts/handoff.mjs`, `tools/e2e/tests/handoff.spec.ts`, `tools/e2e/scripts/brief.mjs`, `tools/e2e/tests/brief.spec.ts`, `tools/e2e/tests/brief-flush.spec.ts`, `docs/conventions/dispatch-and-scratch.md` and `docs/conventions/records-and-rooms.md`. The final docs obligations are re-derived from the docs gate at dispatch preparation rather than inherited from this line.

The attribution in the frontmatter above is the original of 2026-09-12 and is historical: it records who proposed the format, not who authorized this expansion. The expansion is the owner's decision of 2026-09-15.

ONE CORRECTION TO THE REVIEW THAT PROPOSED THIS AMENDMENT. It stated twice that an earlier development deferral on this card remains in force until the owner changes it. The architect seat could find no such deferral recorded anywhere: this card stood `status: planned` with no wake field and no blocker, it appeared in the derived dispatch view of 2026-09-15 as startable, and the only mention of it in the checkpoints is that it was filed on 2026-09-12. Nothing is deferred by this amendment. What now holds the card is the `blocked_by` dependency on T-329 added above, which is a real and derivable hold rather than a remembered one.

## What was measured

The original card records successful manually prepared packets but no measurement of successor reconstruction cost. The recent handoff needed a separate opening message, boundary file, ledger and scripts, with repeated state corrections. The owner also relayed a successor's report of an incompatible container checkout at the same commit. Matching repository content did not establish compatible ownership, access to local evidence or a usable delivery route.

This card makes the existing succession requirements compact and executable. It does not declare cloud sessions ineligible: it records the source context and the capabilities the next action requires. The separate resume-seat card performs the automated destination check.

## Acceptance criteria

- WHEN a handoff is previewed THE arm SHALL derive the proposed packet and unresolved prerequisites without writing project files, changing authorization, releasing the holder, signalling jobs or launching work. The preview SHALL distinguish observed facts, attributed evidence and the outgoing seat's assessment, with unavailable facts explicit; a body SHALL prove these side-effect boundaries.
- WHEN coordination ownership changes THE generated core SHALL carry the authorized scope and its source, next action and prerequisites, checkpoint and exact refs, ownership, active attempts and unfinished work, pending owner questions, confidentiality boundaries, selected model-profile revision or explicit none/unknown, available concrete assignments, overrides and reported budget state. It SHALL distinguish active configuration from an approved-but-unapplied change and from an unapproved proposal. Structured data and the readable summary SHALL be rendered from one snapshot, pinned by a correspondence body.
- WHEN the packet describes continuation requirements THE core SHALL identify the source repository/checkout and execution domain, required evidence and runtime records, ownership scope, required controller/harness capabilities, and the approved publication route with its CI coverage or explicit unknown. It SHALL describe resources by identity and purpose with locators, rather than assume a source-host path is readable elsewhere; it SHALL record no secret values. A matching commit or the labels local/cloud SHALL establish neither compatibility nor incompatibility. Bodies SHALL compare equal commits with missing required state and differently labelled contexts with equivalent declared requirements, without claiming an actual cloud route was demonstrated.
- WHEN the outgoing seat finishes THE arm SHALL retain a prepared packet, reconcile jobs through T-329, and invoke the existing release checks; unresolved writers or uncertain job ownership SHALL prevent a clean-boundary claim, while supported transfers SHALL remain visible as live transferred work. A finalized packet SHALL claim release only after release was observed. Bodies SHALL exercise successful release and interruption both before release and after release but before final packet publication, preserving a recoverable prepared artifact.
- WHEN a finalized packet is published THE arm SHALL write a complete versioned snapshot, its readable rendering and a manifest through staged publication; repeat invocation SHALL reconcile the same operation rather than blindly repeat cleanup or release. Optional attachments SHALL be explicitly selected, copied only within the permitted confidentiality boundary and identified by digest; no verifier-only contents SHALL be read or copied. Later observations SHALL create a new snapshot or receipt rather than silently alter an old one, pinned by interrupted-write and repeated-finish bodies.
- WHEN a successor follows the documented format THE instructions SHALL require integrity verification, a stated understanding, and live execution-context, authorization and ownership checks before any seat claim or project write; a missing or unsupported capability SHALL hold the dependent action without automatically switching branches, widening permissions or changing the delivery workflow. WHEN no packet is available THE instructions SHALL support a labelled recovery view from available checkpoint, refs and live records, granting no permission and preserving uncertainty about inaccessible source state. Hashes SHALL be described as integrity evidence only.
- WHEN this capability lands THE applicable role succession sections SHALL point to the canonical format and implemented handoff command rather than duplicate their rules; subagent spawning SHALL require no packet, and the command SHALL emit one paste-ready opening sentence and the packet path. Packet generation SHALL require no commit, push or whole battery of its own; preceding project edits SHALL keep their existing obligations. The method SHALL receive its normal bump, release note and evaluation block, and a fixture-backed successful invocation SHALL prove the arm reaches generation and release rather than merely a holder refusal.

## Implementation contract

Use a small `handoff.mjs` module called by `brief.mjs`. Gather run records through the existing call boundary and reuse relevant dispatch/return-brief derivations; do not add a circular import or another grant/board store. T-329 owns job lifecycle, and the existing seat operations own holder changes and hook behavior. Use the established uncommittable runtime-directory mechanism; an optional export does not imply upload or public publication.

The core files are `handoff.json`, `HANDOFF.md` and `MANIFEST.sha256`. Historical transcripts and scripts are not default attachments. Aim for a normal summary of roughly one page, but never omit a hold or uncertain owner to meet that target. Read-only live probes must be bounded; unavailable network/CI evidence is unknown, not a reason to launch paid work or try a push.

The compatibility description is provider-flexible. This card builds no cloud transport, distributed lease service or new publication route. It must retain the original packet, recovery, model-state and confidentiality obligations; the proposed resume-seat card automates consumption later.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
