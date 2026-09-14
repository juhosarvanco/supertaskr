---
id: T-316
title: "A Codex seat launches Claude children under the run record — the adapter turns an assignment's harness, model, effort and permission configuration into a headless `claude -p` launch with the fence hook the process inherits and the JSON stream into the record; both adapters honour the same requirements; the coordinator's own network and credential boundary is explicit; send and interrupted-answer recovery work through it; and one coordinator handoff is performed with work parked"
feature: F-04
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "ADR-025 decisions 2 and 8, approved by the owner on 2026-09-12; card 6 of its plan; the owner's goal that either harness dispatches lanes in either harness"
blocked_by: [T-315]
touches: [tools/e2e/scripts/adapter-claude.mjs, tools/e2e/scripts/adapter-codex.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/adapter-claude.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/runtime/supertaskr.yaml, docs/CONVENTIONS.md, docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

### What was measured

The Claude CLI on this host runs headless with `-p`, `--output-format stream-json`, `--model`, `--session-id` and `--resume`, and effort is a model configuration the harness documents with model-dependent support; a headless process reads the repository's `.claude/settings.json`, so the write-time fence hook should apply to it, which has not been measured under a Codex seat's sandbox; a Codex seat's `workspace-write` sandbox denies network by default.

## Acceptance criteria

- WHEN a Codex seat starts a child whose harness is Claude THE adapter SHALL launch `claude -p` from the lane with the brief, the requested model and effort, a session id and the JSON stream, bind session id, process identity and stream to the run record, and on the child's end collect the final message, the usage or `unknown`, and the resulting ref; both adapters SHALL honour the same requirements: the requested harness, model, effort and permission configuration, refusal by name of an unsupported assignment, no substitution at quota exhaustion, and the requested and the runtime-reported values recorded separately.
- WHEN the child writes outside its card's paths THE fence hook SHALL refuse the write, demonstrated from inside a Codex seat's session with the ref recorded; WHEN the seat's sandbox would deny the child the network or its credentials THE launch SHALL be refused by name with the boundary the seat lacks, never widened silently.
- WHEN the seat sends, continues or stops a Claude child THE operations SHALL follow T-311's process-child transitions: `send` records the answer for a running or blocked attempt and delivery is evidenced by the child's ask-file read or by an answer passed to `--resume`; `continue` resumes the named session only after the prior execution and owned jobs have ended and the writer reservation is retained or atomically reacquired; `stop` confirms the process and its owned jobs are gone. Bodies SHALL cover interruption after delivered and before acknowledged with redelivery under the same question id, and a child process ending with a question while its assignment remains blocked, followed by answer, same-session resume, completion and reservation release.
- WHEN one card is dispatched by a Codex seat, built by a Claude child, verified by a Claude phase two and merged by the Codex seat THE closing check and push SHALL pass, and the records SHALL name the harness, model, effort and usage of each child.
- WHEN the sitting ends THE Codex seat SHALL hand the seat back with work parked, in the packet form, and the receiving seat SHALL take it with the verb and recheck the live state before writing; the method version SHALL bump with its release note and evaluation block.

## Amendment of 2026-09-13 — the Claude hook's demonstrated boundary (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — the Claude hook's demonstrated boundary. The write-refusal criterion applies to the tool operations actually routed through the lane fence in the demonstrated launch configuration. Qualification records the resolved project configuration, hook source and lane manifest used by the headless child, and demonstrates an allowed in-fence write and a refused out-of-fence write through the actual child tool path. A missing, disabled or unjudging hook does not qualify that path, pinned by a negative control. The demonstration also probes an out-of-fence shell write and records whether that channel is judged; it does not generalize a tool-hook refusal into OS write confinement. The adapter refuses an assignment requiring a stronger boundary than the configuration establishes. The accepted procedural limitation for ordinary Claude tool use remains; no read-secrecy or tamper-proof-control guarantee is added.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
