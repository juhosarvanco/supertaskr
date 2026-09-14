---
id: T-313
title: "A room consultation runs over the session contract — one frozen question and ref, one fresh read-only session per configured participant, positions collected by the seat from each child's own output and published together only after every participant has demonstrably ended; the coordinator never exposes a position before the reveal, each participant's actual read restriction is stated, and enforced non-access is claimed only where the demonstrated configuration establishes it"
feature: F-05
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "ADR-025 decision 6 and consequences, approved by the owner on 2026-09-12; card 4 of its plan; the first cross-provider interaction, chosen as the lowest-risk one"
blocked_by: [T-311, T-312]
touches: [tools/e2e/scripts/consult.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/consult.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/rooms/ROOM-FORMAT.md, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

The room format's first rule is that positions are written before either side sees the other's. Today a consultation is run by hand. A Claude child has no read sandbox and its harness keeps a transcript on disk; a Codex child's read confinement depends on its runtime's filesystem permissions. Withholding a path does not make a file unreadable.


What was measured, 2026-09-13 (the seat's pre-dispatch read, after the T-312 investigation; a factual refresh, no criterion changed): codex 0.153.4 confines a child's writes under `workspace-write` and confines no reads by any switch found. The native Claude spawn configuration examined (the harness's subagent) has not demonstrated enforced tool-less execution or context isolation: tool-lessness there is by instruction, and this day's phase 1 disclosed two injected context channels (the harness's git-status block and the seat's memory file). The Claude CLI exposes a built-in-tool restriction (`--tools ""` under `claude -p`); its suitability for PACKET mode, including MCP tools, automatically loaded context, memory and session history, remains unverified. Guarantees are recorded separately for each demonstrated launch configuration, and the "find another's position" demonstration is evidence of separation, never proof.

## Acceptance criteria

- WHEN the seat opens a consultation THE verb SHALL take the room, question, ref and configured participant list, freeze the common evidence into one packet with a digest, and record each participant's id, harness, model, effort and required permission and independence profile. It SHALL start one fresh read-only session per participant through T-311's operations and the eligible native path or T-312's adapter, collect each position from that child's own output into the seat's scratch, and publish the positions together only after every participant has demonstrably ended. Multiple participants MAY use the same harness or model; each SHALL have its own fresh session. Bodies SHALL cover two Claude participants, two Codex participants, and a mixed consultation. The coordinator SHALL NOT publish or deliberately expose any position before the barrier.
- WHEN a mode is chosen THE room entry SHALL state each participant's actual read restriction: PACKET mode gives the packet and no repository, with tool-less execution where the harness enforces it and otherwise the narrowest documented read profile; TREE mode gives a clean clone at the ref; for each participant the entry SHALL say whether non-access to other positions and to transcripts was enforced by the demonstrated configuration or is context separation only.
- WHEN a participant's liveness is uncertain at the reveal THE barrier SHALL hold until the attempt is reconciled under T-311; WHEN a participant fails THE others' positions SHALL be published as collected, and the failed one SHALL be re-run as a fresh session with the original frozen packet only, no published position included, or recorded absent; a body SHALL show one interruption recovered with no position lost or exposed early.
- WHEN a test participant is instructed to find another's position THE demonstration SHALL record its search and its outcome as evidence, labelled evidence, never as proof of non-access.
- WHEN the consultation is recorded THE room SHALL carry each position under its participant's id, model, harness and effort, the packet's digest, the mode and the guarantee each participant actually had, and the owner's ruling paraphrased when it comes; the method version SHALL bump with its release note and evaluation block.

## Amendment of 2026-09-13 — failure after reveal (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — failure after reveal. Once the successful participants' positions have been published, a failed participant is recorded absent unless its required independence profile can still be met by the demonstrated launch configuration. Supplying only the original packet does not establish non-access to positions already published in files or transcripts. Any later response without that guarantee is recorded separately as a follow-up with its actual context-separation limitation, never presented as a blind original position. A body covers failure followed by reveal under a configuration without enforced read isolation and records absence rather than claiming a blind retry. The verb validates each participant's required permission and independence profile before launching it; unavailable coverage is refused by name, not counted as a successful consultation.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
