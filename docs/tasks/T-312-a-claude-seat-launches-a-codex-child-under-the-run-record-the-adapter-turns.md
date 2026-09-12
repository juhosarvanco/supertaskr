---
id: T-312
title: "A Claude seat launches a Codex child under the run record — the adapter turns an assignment into a `codex exec` launch under a named permission configuration and the launch's JSON output into the record; each executor or verifier writer is confined to its assigned resource and git state, each guarantee demonstrated under that role's exact configuration; the executor candidate and verifier correction commits reach the merge through the arm's own instruments"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: building
suggested_by: "ADR-025 decisions 2 and 5, approved by the owner on 2026-09-12; card 3 of its plan; the owner's ruling of 2026-09-12 that a Codex child's fence is the sandbox plus the path checks, accepted on this demonstration and not before"
blocked_by: [T-311]
touches: [tools/e2e/scripts/adapter-codex.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/adapter-codex.spec.ts, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/brief-flush.spec.ts, lib/parser/src/model-session.ts, lib/parser/test/model-session.test.ts, method/runtime/supertaskr.yaml, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

The Codex CLI on this host (`codex exec`, version 0.153.4) takes a working directory, a model, an effort configuration, a sandbox policy (`read-only`, `workspace-write`, `danger-full-access`) with configurable additional writable roots, JSON event output with usage, an output file for the final message, and `exec resume <session-id> <prompt>`. A linked worktree keeps its branch refs in the shared `refs/heads`, so a sandbox that lets a lane commit lets it move any ref; a shared clone carries its own refs. The merge verb finds a lane by `refs/heads/task/<id>-*` in the integration repository and the bench by the worktree inventory; a clone is in neither until something puts it there. The model-session parser reads any non-`fresh` suffix as a resumed session. The recovery sitting of 2026-09-11 ran Codex children unrestricted; that is not a fence.

### Acceptance criteria

- WHEN the seat starts a child whose harness is Codex THE adapter SHALL launch `codex exec` with the assignment's working directory, model, effort, and the permission configuration named in the run record, feed it the rendered brief, bind the session id, the process identity and the JSON event stream to the record, and on the child's end collect the final message, the usage from the events or `unknown`, and the resulting ref without scraping conversational text; an assignment the runtime cannot honour (an unsupported sandbox, an effort the model lacks, a missing binary) SHALL be refused by name before any process starts, never substituted.
- WHEN the demonstration runs THE card SHALL name and demonstrate the exact configuration for each writer role, executor and phase-two verifier separately: sandbox policy, writable roots, network setting, working directory and protected paths. Each SHALL edit and commit inside its assigned resource while writes outside that resource, including to the integration repository's git directory and to the controls that judge it, are refused. The executor SHALL be unable to read verifier-only material; a verifier SHALL receive only the verifier material its brief authorizes, with that read access stated explicitly. An out-of-card change SHALL be caught by the landing gate at merge. Commands and outputs at the ref SHALL establish each claim; executor eligibility SHALL NOT imply verifier eligibility. A guarantee a configuration does not establish leaves that assignment ineligible; a changed layout requires its own demonstration.
- WHEN Codex writers use isolated clones THE executor candidate SHALL be collected by the seat outside the child sandbox into the integration repository's `refs/heads/task/<id>-<slug>` at the exact reported candidate commit; the arm SHALL prepare the phase-two bench at that candidate in a separately confined verifier clone and record its location and candidate ref. The existing phase-one material, seals and fresh phase-two requirements SHALL still apply. The verifier's verdict and correction commits SHALL be collected at the exact reported verified tip, checked against that candidate and the bench's evidence, and made available to the existing merge and landing instruments. The arm SHALL NOT substitute the executor tip for a missing verifier tip or give a Codex verifier write access to the integration repository through a linked worktree. A fixture SHALL run dispatch, executor build in its clone, candidate collection, verification in its own clone with a correction commit, verified-tip collection and merge, proving that the corrected, verified tip is integrated. Both writer configurations SHALL pass the role-specific demonstration above. The merge and dispatch scripts are in the fence for this path; existing eligible Claude worktree lanes remain compatible.
- WHEN the seat sends, continues or stops a Codex child THE operations of T-311 SHALL work through the adapter: `send` records the answer for a running or blocked attempt, delivery uses the child's evidenced ask-file read or the resumed session's prompt, `continue` uses `codex exec resume` only after the prior execution and owned jobs have ended and the writer reservation is retained or atomically reacquired, and `stop` confirms the process and its owned jobs are gone. A process ending with a question SHALL leave the assignment blocked, not finished; the adapter's body SHALL exercise T-311's question-to-resume sequence and retain delivery and acknowledgement evidence.
- WHEN a role names a Codex model THE template's roles block SHALL carry effort as its own field beside the model string, the `@` suffix keeping its session meaning; the parser SHALL refuse a session suffix that spells an effort level, pinned by a body; the arm SHALL print harness, model and effort in the model row and record them as separate fields; the card's builder and verifier strings remain provenance.
- WHEN this card lands THE fence rule for Codex children SHALL read: the demonstrated sandbox configuration plus the card's path check by the child before its stamp and by the landing gate at the merge; the method version SHALL bump with its release note and evaluation block. Landing this card authorizes no Codex lane; that is the owner's acceptance of the demonstration.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
