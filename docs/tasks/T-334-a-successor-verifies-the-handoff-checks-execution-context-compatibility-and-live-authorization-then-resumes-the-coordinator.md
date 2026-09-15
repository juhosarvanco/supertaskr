---
id: T-334
title: "A successor verifies the handoff, checks execution-context compatibility and live authorization, then resumes the coordinator through the existing seat instruments"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the Codex orchestrator's proposed lean-handoff plan of 2026-09-15, including the owner's request for capability-based compatibility rather than a blanket local/cloud refusal; not yet filed"
blocked_by: [T-329, T-309]
touches: [tools/e2e/scripts/handoff.mjs, tools/e2e/tests/handoff.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, tools/e2e/scripts/checkout-currency.mjs, tools/e2e/tests/checkout-currency.spec.ts, method/HANDOFF-FORMAT.md, method/roles/orchestrator.md, method/roles/integrator.md, method/roles/planner.md, docs/CONVENTIONS.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/records-and-rooms.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 on the owner's yes, from the Codex orchestrator's lean-handoff review bundle of the same day, where it stood as an unallocated draft. The architect seat allocated T-334 at filing: T-333 was taken the same day by the seat-fixture finding the T-331 lane raised, so the draft's placeholder identifier resolves here and nowhere else.

The fence below is the draft's proposal and has NOT been through a board preflight, which this project can only run against a card that is already a dispatch candidate. Preflight it at promotion, re-derive the fence and the docs obligations against the actual filing base, and check for overlap with cards filed since. Two overlaps are known already and are why this card cannot run beside them: it fences `tools/e2e/tests/brief.spec.ts`, which T-330 also holds, and `tools/e2e/scripts/brief.mjs`, which T-329 and T-309 also hold. Size M and priority 2 are proposals; the tier is the arm's at dispatch.

The checkout-currency files are fenced for the concurrent-claim control this card's seat-claim criterion requires. If implementation needs no change there, narrow the fence explicitly before dispatch rather than leaving a dead entry.

## What was measured

The owner's relayed successor report described a container lane checkout whose tip matched the local integration tip, but the existing seat arm refused its branch. The source handoff also referenced host-local evidence and runtime state. The report supports checking the actual prerequisites before claiming a seat; it does not support banning cloud environments or assuming that changing the branch makes the session compatible.

T-309 generates the packet and T-329 supplies job reconciliation. The missing consumer is a bounded preview/apply path which compares the packet with the successor's observed context and uses the current ownership and admission instruments.

## Acceptance criteria

- WHEN the resume preview reads a packet THE arm SHALL verify its supported format, complete manifest and allowed file references before treating its contents as handoff data; malformed paths, traversal, duplicate/ambiguous manifest entries, missing files, unexpected symlink targets and digest mismatch SHALL yield named refusals. Preview SHALL not claim a seat, change project or grant records, signal jobs, launch a worker or push. Bodies SHALL include a valid packet and each unsafe-reference class; digest validity SHALL not be treated as authorization.
- WHEN comparing continuation requirements THE arm SHALL compare repository/checkout identity, required evidence and runtime state, ownership domain, controller/harness capabilities and the approved publication/CI route against observed or referenced qualification evidence. It SHALL report satisfied, missing, unsupported or unknown requirements and hold only actions that depend on unmet requirements. Bodies SHALL include the same commit with missing source records, a local checkout on an incompatible branch, and a differently labelled environment with all requirements satisfied through a supported fixture route. No local/cloud label or matching commit SHALL replace these checks, and no branch, permission or delivery-mode change SHALL be performed to make them pass.
- WHEN source-owned jobs or holders belong to another execution domain THE arm SHALL use the supported source/controller evidence rather than consult the destination's process table as proof of their liveness; unavailable evidence SHALL remain unknown and SHALL prevent claiming exclusive continuation where an old writer may still exist. A body SHALL plant colliding PIDs in distinct domains and prove that no local process is signalled and no foreign holder is declared dead from local absence. This criterion builds no new remote controller or distributed ownership service.
- WHEN current state differs from the packet THE report SHALL name consequential Git, authorization, pause/revocation, attempt, job and CI changes and re-evaluate the next action against current records; a packet SHALL never revive superseded permission. A new commit alone SHALL not invalidate unrelated read-only preparation, and stale CI evidence SHALL not be relabelled as a verdict on the new commit. Bodies SHALL cover a newly recorded pause, changed grant, changed candidate, unavailable CI and a live competing holder.
- WHEN applying a compatible handoff THE arm SHALL claim the seat and verify hook installation through the existing take-seat path, without bypassing branch or ownership guards; repeated application by the same valid owner SHALL reconcile, and simultaneous competing claims SHALL leave at most one valid owner. If the current claim primitive cannot provide that result, the implementation SHALL repair the primitive within the granted fence or report the criterion unmet. Bodies SHALL reach successful hook/holder behavior and a competing-claim case, not only refusal output.
- WHEN a job transfer is present THE arm SHALL use T-329 to acknowledge only a supported transfer with one coordination owner, leaving unresolved transfers explicit and never restarting an uncertain writer. Late notifications SHALL update evidence without granting new work. WHEN the packet is missing or incomplete THE arm SHALL offer a labelled recovery view from available current records, without inferring that inaccessible source work ended or that missing approval was granted; reconstruction SHALL not depend on retrieving a whole transcript.
- WHEN resume completes THE arm SHALL emit a compact ready/blocked report, actionable differences, current model/profile information or unknown, and the next action covered by current authorization; it SHALL dispatch nothing as a hidden side effect. The role instructions SHALL point to this path, and continuation SHALL use normal admission and qualification checks. The next already-needed eligible coordinator transition SHALL record preparation, release, successor start, claim and earliest useful-action instants, required waiting and owner interventions, with actual token usage where available or unknown. The clean-transition five-minute objective SHALL be reported as a target, not a new gate or an assumed measurement.

## Implementation contract

Extend T-309's handoff module and the existing brief/seat entry points. Preserve the distinction between an observed execution context, a packet's requirements and evidence establishing the controller's capabilities. A machine-readable declaration alone is not proof that access or ownership is available. Do not include credentials in the packet or perform side-effectful capability probes.

Keep the earliest real demonstration on an already-qualified route. Controlled capability fixtures must permit a differently labelled environment when requirements are satisfied; this is a discriminator against hard-coded host bans, not proof of real cloud operation. T-316's existing handback can consume the path when its cross-harness prerequisites land; basic same-harness resumption does not wait for it.

Use runtime receipts and targeted reads, not another authorization ledger, transcript-summarization service, automatic session launcher or per-handoff battery. A handoff may complete while CI is pending; subsequent dispatch still obeys the existing CI and authorization prerequisites. The method change receives its normal bump and evaluation when implemented.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
