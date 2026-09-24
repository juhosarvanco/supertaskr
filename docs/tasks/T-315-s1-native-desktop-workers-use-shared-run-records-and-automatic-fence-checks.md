---
id: T-315-s1
title: "Native desktop workers use shared run records and automatic fence checks"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: building
blocked_by: [T-303-s1, T-311, T-314]
touches: [.codex/hooks.json, tools/e2e/scripts/native-codex-hook.mjs, tools/e2e/scripts/native-codex.mjs, tools/e2e/tests/native-codex.spec.ts, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/CAPABILITIES.md, docs/INDEX.md]
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

Prepared against cfc18176bb4a4bda27f1d389ffd9cc117a6d5f4e from the native contract review. The reviewed contract is filed under the owner-approved native-first scope; dispatch still requires its pinned grant and actual monitored launch. Size is provisional from the monitor, lifecycle integration and its one guarded verification cycle. Re-estimate after the actual implementation map is settled.

The native hook entry is tools/e2e/scripts/native-codex-hook.mjs, under an existing tracked parent. The local configuration is .codex/hooks.json. Its parent is tracked by the neutral .codex/README.md bootstrap at 88cd61603789; structural preflight uses the resulting tree before dispatch. Do not commit the current machine-specific diagnostic configuration. Ship only the portable product definition after review.

No checkout-currency change is presumed necessary: native capability evidence belongs to the native inspection/admission path unless a concrete owning call requires otherwise. Do not create a second scheduler. The frozen external bootstrap is separate from candidate code and must remain active until the product replacement is independently verified and actually loaded.

Live native loading and direct agent_id attribution were observed after the desktop restart on 2026-09-24. That resolves the earlier unknown event-source premise; it does not establish holds, background-job reconciliation, concurrent routing or complete native delivery. Model-free controls should cover those mechanisms without repeated model qualification sessions. The real callback control is deliberately small; mandatory per-turn receipts are not reintroduced.

T-329 remains the separate seat-owned-job proposal. This work integrates the existing attempt-owned T-311 lifecycle only.

Coordinator fence expansion (2026-09-24): docs/CAPABILITIES.md is the generated census of the in-scope test bodies. The executor requested it after the physical fence refused regeneration. Its attempt was reconciled before this first-parent expansion; fresh verification regenerates and checks it. Acceptance criteria and product scope are unchanged.

Coordinator generated-index expansion (2026-09-24): the census generator also updates docs/INDEX.md when the new native spec adds a capability section. Its changed count was preserved after the verifier monitor held the write. The verifier attempt and owned jobs are reconciled; this derived INDEX path joins the same generated-artifact fence. Criteria are unchanged.

## Verdicts
<!-- Fresh independent verifier appends; no predecessor verdict is altered. -->
