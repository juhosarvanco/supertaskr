---
id: T-315-s1
title: "Native desktop workers use shared run records and automatic fence checks"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: verifying
blocked_by: [T-303-s1, T-311, T-314]
touches: [.codex/hooks.json, tools/e2e/scripts/native-codex-hook.mjs, tools/e2e/scripts/native-codex.mjs, tools/e2e/tests/native-codex.spec.ts, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md]
builder: gpt-5.6-sol@fresh
verifier: gpt-5.6-sol@fresh
built_by:
verified_by:
review: independent
---

## Acceptance criteria

- **Admission and binding.** Before native spawn, the arm SHALL admit the approved card/base/fence/model/effort and atomically reserve its writer resource through T-311. A real native identity SHALL bind to that attempt. The bridge SHALL map every supported subagent tool event to the bound attempt using supported event or task identity. Parent `session_id`, cwd, a task name and transcript parsing SHALL NOT stand in for agent identity. Missing, duplicate or conflicting attribution SHALL persist a hold and refuse native writer eligibility. A second tool-using native writer SHALL be refused until distinct simultaneous routing is demonstrated; a no-tools phase-one participant may coexist only under its existing procedural restriction.
- **Shared cwd and resource authority.** The assigned worktree in the run record SHALL be the authority; the hook's shared session cwd SHALL not select a fence. The brief SHALL give absolute resource paths and every writer command SHALL name its working resource explicitly. Before supported worker operations, the monitor SHALL bind the event to its admitted resource and refuse or hold unknown attribution. After actual completion it SHALL check that assigned resource cumulatively against its canonical fence. Admission SHALL still check live reservation collisions. The monitor SHALL disclose that it does not detect every arbitrary shell write outside the assigned repository; shared cwd is not a sandbox. This is a repository safeguard, not OS filesystem or read isolation.
- **Automatic completion checks.** Synchronous `PostToolUse` SHALL inspect the full admitted-base-to-workspace change set after actual completion of Bash/unified exec and apply-patch operations. It SHALL include committed, staged, unstaged and untracked paths; additions, deletions, modes/types and both rename endpoints. Tracked files SHALL never be hidden by output policy. Ignored/untracked outputs SHALL be enumerated and allowed only by a coordinator-owned named policy; unexpected ignored files are findings. A checker error, unreadable authority, missing completion or unsupported mandatory event SHALL persist a hold and SHALL NOT be called clean. No model turn or product suite is required merely to inspect paths.
- **Hold and stop semantics.** An out-of-fence result SHALL preserve the candidate, persist an attempt-scoped hold and make later supported operations plus collect/continue refuse. It SHALL NOT auto-revert, auto-widen or trust worker-written authority. A PreToolUse denial or PostToolUse block is hook behavior only. Native interruption is a request to the harness, not proof of cessation. Releasing the hold or writer reservation SHALL require T-311 reconciliation of native task state and every registered owned job. Unknown remains unknown. Before collect or continue, the arm SHALL independently inspect the frozen base through the exact reported commit plus staged, unstaged, untracked and explicitly governed ignored residue, modes/types and both rename endpoints. An active or unreadable hold, unknown owned job, incomplete operation or out-of-fence result SHALL refuse collection; prior callback success alone SHALL NOT satisfy this final gate.
- **Bodies and live proof.** Model-free bodies SHALL cover exact routing, a parent event, an unbound child, a conflicting second writer, two disjoint identities, shared-cwd misrouting, patch source/destination, shell-created and ignored violations, tracked generated output, checker failure, unreadable hold, yielded completion and interrupt without job cessation. A real Luna-low desktop control SHALL prove project loading/trust, native attribution, allowed and refused paths, persistent hold and actual yielded completion. Only then may a fresh Sol extra-high verifier accept the mechanism for landing.

## Implementation notes

### Criteria echo

- [x] Admit the approved card, base, fence, model and effort before native spawn; reserve one writer atomically, bind the returned native identity, and refuse ambiguous or conflicting writer attribution without using cwd, parent session, task labels or transcripts as identity.
- [x] Treat the run record's absolute worktree as resource authority, require explicit writer working directories, route supported worker operations to the admitted resource, retain collision checks, and disclose that this repository safeguard is not an operating-system sandbox.
- [x] After actual Bash/unified-exec and apply-patch completion, synchronously inspect the complete admitted-base-to-workspace state, including committed, staged, unstaged, untracked, governed ignored, mode/type changes and both rename endpoints; persist a hold on any incomplete, unreadable or unsupported result.
- [x] Preserve out-of-fence candidates under an attempt-scoped hold, refuse later supported operations and collect/continue until T-311 reconciliation proves native and owned-job state, and make collection independently recheck the exact reported candidate rather than trusting callback success.
- [x] Add model-free bodies for every listed routing, writer, cwd, patch, shell, ignored/generated, failure, hold, yielded-completion and interrupt-with-live-job case; leave the real Luna-low desktop control explicitly pending for the coordinator and fresh Sol extra-high verifier.

Prepared against cfc18176bb4a4bda27f1d389ffd9cc117a6d5f4e from the native contract review. The reviewed contract is filed under the owner-approved native-first scope; dispatch still requires its pinned grant and actual monitored launch. Size is provisional from the monitor, lifecycle integration and its one guarded verification cycle. Re-estimate after the actual implementation map is settled.

The native hook entry is tools/e2e/scripts/native-codex-hook.mjs, under an existing tracked parent. The local configuration is .codex/hooks.json. Its parent is tracked by the neutral .codex/README.md bootstrap at 88cd61603789; structural preflight uses the resulting tree before dispatch. Do not commit the current machine-specific diagnostic configuration. Ship only the portable product definition after review.

No checkout-currency change is presumed necessary: native capability evidence belongs to the native inspection/admission path unless a concrete owning call requires otherwise. Do not create a second scheduler. The frozen external bootstrap is separate from candidate code and must remain active until the product replacement is independently verified and actually loaded.

Live native loading and direct agent_id attribution were observed after the desktop restart on 2026-09-24. That resolves the earlier unknown event-source premise; it does not establish holds, background-job reconciliation, concurrent routing or complete native delivery. Model-free controls should cover those mechanisms without repeated model qualification sessions. The real callback control is deliberately small; mandatory per-turn receipts are not reintroduced.

T-329 remains the separate seat-owned-job proposal. This work integrates the existing attempt-owned T-311 lifecycle only.

### Built mechanism

The portable project hook now routes synchronous native desktop events through one T-311 attempt record. Native launch admission validates the exact Git root, approved base, canonical lane fence and ignored-output policy before the existing exclusive writer reservation is taken. The coordinator explicitly binds the actual SubagentStart callback identity; the recorded start turn, admitted canonical task and child's completed exact `CODEX_THREAD_ID` probe must agree before the bind closes. A no-identity callback is accepted as a parent event only when its session and turn have been positively recorded as coordinator continuity; missing or invalid worker attribution persists a hold.

The assigned worktree is the resource authority. Bash admission uses the documented `tool_input.command` payload and requires the command to begin with an explicit absolute `cd` to that worktree; it does not rely on an undocumented hook `workdir`. Apply-patch admission checks every absolute source and move destination. PreToolUse persists an inflight operation only after a clean cumulative check. Its exact PostToolUse counterpart reruns the check after actual completion and stores the real callback receipt.

The cumulative check covers committed, staged and unstaged raw diffs, untracked paths and changes in ignored residue outside the coordinator-owned named policy. It records additions, deletions, modes/types and both rename endpoints. Tracked paths never inherit an ignored-output exception. Checker failures and unreadable authority persist holds. If the attempt document cannot carry its own hold, a one-shot sidecar beside that attempt preserves `unknown` and is absorbed into the real hold list before a repaired record can process another event. A missing PostToolUse stays inflight until T-311 reconciles native cessation and every owned job; release then records an explicit `actualPostCallback: false`, `outcome: unknown` receipt before an independent clean check. SubagentStop and Interrupt remain observations and do not claim cessation or stopped jobs.

Collect and continue require the exact reported 40-character commit, completed lifecycle reconciliation, no active hold, no incomplete operation, no owned job and a fresh independent cumulative check. Native replacement through `continue --replace` is refused; a new native identity needs a fresh start. The run report discloses that this is a repository safeguard rather than operating-system write or read isolation.

### Model-free evidence

- `native-codex.spec.ts`: 12/12 passed. These bodies cover the portable hook, exact binding and parent continuity, unbound children, writer collision, two disjoint identities, explicit shared-cwd resource selection, every apply-patch endpoint, shell-created and ignored violations, tracked generated files, raw mode/type and rename data, checker failures, unreadable holds, yielded completion with a missing callback, interrupt with a live job, and exact-ref collect/continue.
- `run-record.spec.ts`: 44/44 passed, including the native binding tuple and continuation-ref parser body.
- `brief.spec.ts --grep "ARM THIRTEEN"`: 1/1 passed, including stable refusal of an incomplete native assignment.
- `npm run typecheck`: passed. `npm run lint:tokens`: clean. `git diff --check`: clean.

Each protected behavior was also run once with a narrow deliberate mutant and returned exit 1 for the intended assertion before the source was restored: hook coverage without Interrupt; relaxed impostor routing; an overbroad unbound probe; non-exclusive reservation creation; routing to every bound identity; trust in an undocumented hook workdir; checking only one patch endpoint; skipped untracked paths; hidden tracked paths; swallowed checker errors; a missing callback labelled successful; an optional final reported ref; a parser that discarded the continuation ref; an incomplete native assignment admitted as non-native; a bind detached from both callback and probe identity; and an unreadable authority without its durable sidecar. A first mutation that removed only the direct callback equality survived because the completed probe still rejected the impostor; the tightened two-correlation mutant is the one that demonstrated the body's discrimination. After restoration, the core hashes were `e1544d0be9733458ccc1546dbaf81175167de2e1dcf50b39b23d0abb32fa676c` for `.codex/hooks.json`, `00acbcb8dde4b5bb2d0475a7498390cb0fece384f9300b678f74738b5af16cf6` for `native-codex.mjs`, `b14253923f01a7b36881d78a6584b8fe1417977ae50a7081878c69ee5b2c482b` for `run-record.mjs`, and `34c214e3d3311cb3e91a2ee26568b1d095fc5a1526ee43e711d3f5749cc983dc` for `brief.mjs`.

The first full `e2e` graded reading at source commit `20b4bc0679eca26e08333023d8ab381499567d05` ran 1,266 bodies: 1,261 passed and five failed. Three failures produced the bounded fix pass above: the run arm's three redundant bind flags were not announced to the arm census, and the native fixture's synthetic `docs/tasks` path looked like an unlinked repository docs reader to two census bodies. The remaining failures were the live T-205-s5 verifier-fence collision and the protected generated census. The post-fix graded reading is reported in the executor handoff so its result can remain evidence about an unchanged commit.

### Pending independent evidence

The real Luna-low desktop control remains pending for the coordinator, as required by the acceptance criterion. The generated capabilities/index census also remains pending: the protected `npm run capabilities` attempt returned exit 3 with `EACCES` for `docs/CAPABILITIES.md`, which is outside this executor's exact fence. The coordinator retained that refusal and will perform the normal generated-artifact fence expansion and fresh generation/verification step. No protected-file retry or bypass was made here.

## Verdicts
<!-- Fresh independent verifier appends; no predecessor verdict is altered. -->
