---
id: T-312
title: "A Codex worker runs under the shared run record — hook-guarded executor and verifier launches, lifecycle operations and exact candidate collection, coordinated by a Codex seat"
feature: F-04
milestone: 4
size: L
priority: 1
status: planned
wake: 2026-09-14
suggested_by: "ADR-025 decisions 2 and 5, approved by the owner on 2026-09-12; card 3 of its plan; the owner's ruling of 2026-09-12 that a Codex child's fence is the sandbox plus the path checks, accepted on this demonstration and not before"
blocked_by: [T-311]
touches: [tools/e2e/scripts/adapter-codex.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/adapter-codex.spec.ts, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/brief-flush.spec.ts, lib/parser/src/model-session.ts, lib/parser/test/model-session.test.ts, method/runtime/supertaskr.yaml, docs/CONVENTIONS.md, docs/conventions/architecture.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md, tools/e2e/tests/brief.spec.ts, method/roles/orchestrator.md, method/roles/verifier.md, method/skills/supertaskr-seat/SKILL.md, tools/e2e/scripts/codex-tool-hook.mjs, tools/e2e/tests/codex-tool-hook.spec.ts, docs/conventions/lanes.md]
builder: gpt-5.6-sol@fresh
verifier: gpt-5.6-sol@fresh
built_by:
verified_by:
review: independent
---

### What was measured

The Codex CLI on this host (`codex exec`, version 0.153.4) takes a working directory, a model, an effort configuration, a sandbox policy (`read-only`, `workspace-write`, `danger-full-access`) with configurable additional writable roots, JSON event output with usage, an output file for the final message, and `exec resume <session-id> <prompt>`. A linked worktree keeps its branch refs in the shared `refs/heads`, so a sandbox that lets a lane commit lets it move any ref; a shared clone carries its own refs. The merge verb finds a lane by `refs/heads/task/<id>-*` in the integration repository and the bench by the worktree inventory; a clone is in neither until something puts it there. The model-session parser reads any non-`fresh` suffix as a resumed session. The recovery sitting of 2026-09-11 ran Codex children unrestricted; that is not a fence.

## Acceptance criteria

- WHEN the seat starts a child whose harness is Codex THE adapter SHALL launch codex exec with the assignment's working directory, model, effort and explicitly named protection profile, feed it the rendered brief, and bind the session id, process identity and JSON event stream to the existing run record. On the child's end it SHALL collect the final message, usage from events or unknown, and resulting ref without scraping conversational prose. Detectably unsupported launch settings, unavailable models or efforts, and a missing binary SHALL be refused by name before assigned work starts, never substituted. Qualification probes SHALL be distinguished from work attempts. No protection profile SHALL be widened silently.
- WHEN an executor or phase-two verifier uses the owner-selected hook-based profile THE card SHALL demonstrate that role separately with exact CLI configuration, hook registration and source hashes, trust mechanism, working directory, network setting, filesystem permissions and Git layout. A real session SHALL edit and commit an allowed file, be refused on a forbidden patch, and run a minimal local browser check; a mixed allowed-and-forbidden patch and a rename across the fence SHALL be refused as a whole. The hook in tools/e2e/scripts/codex-tool-hook.mjs SHALL translate supported Codex inputs into the existing fence and push decisions, checking every patch source and destination rather than inventing another fence policy; tools/e2e/tests/codex-tool-hook.spec.ts SHALL discriminate allowed, forbidden, malformed and multi-path inputs. The recorded guarantee SHALL be hooks and file-permission safeguards against mistakes plus the pre-stamp path check and authoritative landing check, NOT OS filesystem or Git-ref isolation. Shell writes, hook failures, configuration changes, bypassed tool paths and deliberate bypass SHALL be named limitations. A committed out-of-card change SHALL be caught by the actual landing check. Filesystem read isolation is not claimed: each writer is instructed to read only its named inputs; the executor receives the old attack set and verdict for this rerun, but not the new attack set, ground, stamps, phase-two material or seat transcript. These read restrictions are procedural. Commands and outputs at the candidate ref SHALL support each demonstrated claim, and eligibility of one role SHALL NOT qualify another.
- WHEN the hook profile is selected for start or resume THE adapter SHALL verify the reviewed registration, current hook source identity and supported runtime settings and SHALL retain a startup receipt identifying the effective registration before releasing assigned work. Missing, changed, disabled, untrusted or unestablished registration SHALL refuse that launch or resume. Profile qualification SHALL include an allowed operation, an actual hook refusal and a hook-error control through the real runtime; an observed hook failure or missing required receipt during work SHALL make the attempt ineligible for ordinary completion, stop further delivery to it and require reconciliation through the run record before any continuation. The adapter SHALL NOT relabel a runtime hook error as a successful refusal: a hook fault may allow that operation to execute before the coordinator detects it. After such a fault, inspect the affected candidate and owned resources and record effects or uncertainty; the landing check alone cannot undo external side effects. Bodies in tools/e2e/tests/adapter-codex.spec.ts SHALL distinguish these outcomes. The policy promises detection and refusal of an unhealthy assignment, not a tamper-proof audit log, interception of every operating-system write, or prevention of every hook failure.
- WHEN Codex writers use independent repositories THE seat SHALL collect the exact reported executor commit into its canonical task branch and prepare the separately located verifier repository at that candidate. Each writer SHALL have separate Git objects and refs with no alternates or integration remote, and SHALL work on a branch recognized by the existing lane fence with its own valid manifest; a detached or unrecognized writer branch SHALL be refused for this profile rather than accepting a not-judged fence result; this layout avoids accidental shared-ref writes but is not an access-control boundary in the hook profile. The existing phase-one material, seals and fresh phase-two requirements SHALL apply. The seat SHALL collect the exact reported verifier tip, prove its relationship to the admitted candidate, check the authoritative fence and required evidence, and expose that tip to the existing merge and landing instruments. It SHALL NOT substitute the executor tip for a missing verified tip or silently replace a changed collection destination. A fixture SHALL exercise dispatch, executor build, exact candidate collection, verification in a separate repository with a correction commit, exact verified-tip collection and merge, proving that the corrected tip is integrated. Missing or mismatched tips and an out-of-fence candidate SHALL refuse. Both writer configurations SHALL pass the role-specific demonstration; existing eligible Claude worktree lanes SHALL remain compatible through fixtures.
- WHEN the seat sends, continues or stops a Codex child THE operations of T-311 SHALL work through the adapter: send records the answer for a running or blocked attempt; delivery uses the child's evidenced ask-file read or the resumed session's prompt; continue uses codex exec resume only after the prior execution and owned jobs have ended and the writer reservation is retained or atomically reacquired; stop confirms the process and its owned jobs are gone. A question SHALL leave the assignment blocked, not finished. A real writer's question-to-resume demonstration and bodies SHALL retain delivery and acknowledgement evidence, and the resumed launch SHALL retain the approved protection profile and re-establish its hook registration. The separate fresh verifier SHALL demonstrate its own writer lifecycle; native child launches are not qualified by this CLI demonstration.
- WHEN a role names a Codex model THE template SHALL retain its model string under roles and carry effort separately under the corresponding key in efforts, using the existing roleEffort reader; the @ suffix keeps its session meaning. The parser SHALL refuse a session suffix that spells an effort level, pinned by a body. The arm SHALL print harness, model and effort separately and record the resolved assignment; builder and verifier strings remain provenance. Assignment follows the user's configured choices or an explicit per-dispatch override, never a fixed implementation model imposed by this card.
- WHEN this card lands THE method text and docs/conventions/lanes.md SHALL describe the hook-based profile as the owner-selected safeguard against mistakes, with its observed limits, and SHALL NOT claim OS write isolation. A separately retained sandboxed profile, if any, SHALL remain distinctly named and eligible only for its own demonstrated capabilities; it is not an additional deliverable of this card. The method version SHALL bump with the release note and evaluation block. Landing authorizes no unrelated Codex work. The coordinator for this delivery is Codex; live Claude and mixed-harness demonstrations are deferred, while compatibility fixtures remain. The phase-one renderer in tools/e2e/scripts/dispatch-brief.mjs and its bodies in tools/e2e/tests/brief.spec.ts SHALL agree with method/roles/orchestrator.md, method/roles/verifier.md and method/skills/supertaskr-seat/SKILL.md: a fresh phase-one session receives only the frozen evidence packet and is instructed to use no tools, other files, browsing or delegation, requesting missing evidence from the coordinator. Tool removal and read isolation SHALL NOT be claimed; the separate fresh phase-two session, attack-set floor, seals, frame disclosure and non-sharing of the new set remain required. Workers SHALL run the checks their roles owe directly under the qualified hook profile; a coordinator test relay or separate isolated runner is not a prerequisite or deliverable of this card.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/architecture.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 triage on the owner's yes of 2026-09-14 to the seat's recommendation order, which names this card's rerun after the merge-verb repairs and the approval-mode cards): parked to planned at priority 1, the wake condition met — the configuration investigation's findings reached the owner on 2026-09-13 and the read-boundary amendment above records what they settled. The rejected lane's branch is kept as the ref evidence/T-312-lane-41ec2363 (its tip 41ec2363, the four cards it filed on it) beside evidence/T-312-bench-4e78e9bf, so the rerun cuts a fresh lane from main and reads the previous attempt as evidence. The rerun waits for its fence to be free: tools/e2e/scripts/merge.mjs (T-295-s10, then T-295-s4), method/runtime/supertaskr.yaml and docs/CONVENTIONS.md (T-319, then T-324 and T-322 in the owner's order).

## Parked 2026-09-13 — after the REJECTED verdict, for the seat's configuration investigation

The verdict of 2026-09-13 (bench `4e78e9bf`, verdict commit `b2827df0`, lane tip `41ec2363` on
`task/T-312-the-codex-adapter-under-a-named-configuration`) rejected the lane: the confinement
demonstration failed under the configuration the lane chose, the recorded refusals were the
patch tool's rather than the sandbox's, the notes pointed at scratch rather than at the ref,
and the tip fails the tools/e2e typecheck. The owner ruled on 2026-09-13 that the card is parked
with its evidence preserved while the seat runs a bounded configuration investigation (at most
twelve low-effort Codex runs, 600K input tokens, two hours, per-role findings, nothing
unestablished becoming eligible), and that the seat returns with the findings and the cost of
a rerun before any lane is started; the rerun is a separate authorization. The lane branch and
the bench worktree stand; the bench tip is held by the ref `evidence/T-312-bench-4e78e9bf`
because its verdict commits are reachable from the bench worktree alone. One measurement is
already on record in the seat's scratch (M9, 2026-09-13T10:19Z): with
`sandbox_workspace_write.exclude_slash_tmp` and `exclude_tmpdir_env_var` on, a child under
`workspace-write` wrote inside its own directory and was refused by the operating system's
sandbox on a sibling directory, on a seal-shaped file and on the temp root. The wake date is a
placeholder for the investigation's end; the real condition is the findings reaching the owner.
The four cards the lane filed (T-312-s1 to s4) remain on the lane branch until it lands or the
owner rules otherwise.


Note of 2026-09-13, later the same day: with the owner's permission, on the Codex orchestrator's check that both were clean, the lane worktree and the bench worktree were removed with plain `git worktree remove` so the parked fence no longer counts as live; the lane branch (tip `41ec2363`) and the ref `evidence/T-312-bench-4e78e9bf` hold every commit, and the ignored evidence both folders carried (`.supertaskr/gate-verdict.json` from each, the lane's lock and fence manifest, the test-results and generated schemas) is preserved in the seat's scratch under `t312-evidence/`. Either worktree can be recreated from its reference.

## Amendment of 2026-09-13 — the read boundary (approved by the owner on 2026-09-13, after the Codex orchestrator's review)

Amendment of 2026-09-13 — the read boundary. The clause "the executor SHALL be unable to read verifier-only material" is superseded. The tested writer configurations do not enforce filesystem read isolation for verifier-only material: a Claude subagent and a Codex child under `workspace-write`, as measured on this host on 2026-09-13, can read the sealed attack set, the ground, the stamps and the seat's transcript. The sha256 digests in the stamps protect the integrity of the verifier's challenges; neither they nor the phase-1 timing prevent an executor from reading them. Executor blindness to verifier-only material is therefore UNENFORCED and procedural: every executor is instructed not to open the scratch files named attack-set-*, ground-*, stamps-* and phase2-*, any `.supertaskr/reviews/` directory, and the seat's transcript directory, and the landing gate does not check it. For this card's rerun the owner has made sharing intentional: the rerun executor receives this card's existing attack set and verdict as named inputs, which authorizes reading no other private material. The investigation of 2026-09-13 supplies configuration evidence (two switches confine writes; a clone one level below the working directory commits); the rerun must demonstrate each claimed write, commit and integration-checkout boundary against its own candidate, and the fresh verifier judges beyond the shared set. The Codex adapter's confinement claims are about writes, commits and the integration checkout only. Accepted by the owner on 2026-09-13 for v1; reviewed when a runtime enforces read policy. The rerun is a separate authorization.

## Takeover scope — 2026-09-19, revised after hook qualification

The owner chose the hook-based route after reviewing its successful
qualification and the weaker guarantee relative to OS confinement. The
canonical criteria above replace the old write-confinement requirement for
this route. Earlier findings, rejected verdicts and the read-boundary
amendment remain historical evidence; their claims about what a future
configuration must enforce are superseded by this revision where they
conflict. No old verdict is regraded or rewritten.

The coordinator is Codex. Independent executor and verifier repositories,
exact candidate and correction collection, lifecycle records and fresh
verification remain required. Repository separation is layout, not an OS
access-control claim. The hook adapter must be demonstrated on its own
candidate; external qualification scaffolding does not qualify production
code. The proposed per-card assignments remain Sol high, following the
qualification configuration; they do not change global defaults.

The owner-agreed procedural phase-one restriction remains. The affected
method text must agree with it and with the hook-profile limitation. The
existing effort reader is reused. A matching ADR-025 clarification is
prepared alongside this draft, and is a records action rather than an
executor-authored owner ruling. Bootstrap launch and collection steps are
recorded separately; the product adapter is not claimed built.
