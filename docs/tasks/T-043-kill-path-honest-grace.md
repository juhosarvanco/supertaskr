---
id: T-043
title: The kill path — an honest grace and an honest scope
feature: F-03
milestone: 3
priority: 6
size: M
status: planned
blocked_by: []
touches: [app-agent, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-025-s5, T-025-s7. Triage 2026-08-16: both are measured
properties of the same twenty lines (`terminate_group`/`pid_alive`,
runner.rs:573-630) and both were re-derived by T-025's verifier rather
than argued. One is latency the user feels on two paths; the other is
a sentence in the plan that is wider than the mechanism can be.
Re-derived after T-060 at checkpoint `7d94043` (architect triage
2026-08-18). The defect remains, but the original S card under-scoped the
proof: T-060 moved lines rather than kill semantics; the app-exit claim also
lives in `lib.rs`; and no permanent SIGTERM-resistant fixture exists. This is
M ceremony: executor, fresh adversarial verifier, integrator.

## Acceptance criteria
- WHEN a turn's direct child cooperates with SIGTERM THE child-owning path
  SHALL reap it DURING the grace poll rather than after `terminate_group`
  returns, and the turn latch SHALL release well inside the configured grace.
- EARLY release SHALL require BOTH the direct child reaped and its process
  group empty. If the child exits but a same-group grandchild ignores SIGTERM,
  the poll SHALL continue through the full grace and SIGKILL the survivor; a
  naive `child.try_wait()` followed by return is a regression.
- WHEN the direct child itself ignores SIGTERM THE system SHALL wait the full
  grace, SIGKILL it, reap it and leave no zombie.
- WHEN the app exits mid-turn with a cooperative group `reap_for_exit` SHALL
  complete well inside the grace through coordination with the worker that
  owns `Child`; production grace remains five seconds.
- `genesis_cancel` SHALL still return promptly, send SIGTERM synchronously,
  and retain background escalation. Concurrent cancel, exit and Drop
  observations SHALL remain idempotent.
- PERMANENT fake-agent scenarios and timing pins SHALL cover cooperative
  child/group, resistant direct child, and cooperative child plus resistant
  same-group grandchild. Tests SHALL own exact PIDs/process groups and SHALL
  guarantee cleanup even when an assertion or poison drill fails. The notes
  SHALL NOT claim the pre-task suite already covered resistant processes.
- THE kill guarantee SHALL be corrected everywhere it is live, not only in
  T-025 §5: T-025's acceptance/§5/silences, `agent/mod.rs`, `runner.rs` and
  `lib.rs` SHALL all say no orphaned descendants THAT STAY IN THE GROUP.
  Record the existing `setsid()` escapee measurement
  (`child_alive=false escapee_alive=true child_pid=72417
  escapee_pid=72418 escapee_pgid=72418`).
- A DESCENDANT sweep SHALL remain a deliberate non-goal. The selected CLI can
  create a new session and ancestry becomes undiscoverable after reparenting;
  the narrower current fact is that no planner-granted Bash pattern
  intentionally daemonizes. Revisit when that allowlist widens.
- THE T-025 plan-text off-by-one SHALL be corrected: §3's `(13 files, ~60 KB)`
  SHALL read 14, matching `KIT_FILES` and the parity walk.
- T-060's safety boundary SHALL hold during every test: no process-global
  mutation of `NPUTER_NO_REAL_CLI`, no ignored real smoke, no real CLI/model
  call, and no network. Use `binary_override`, the fake CLI and structural
  guard.
- EVERY new/changed test body SHALL be poisoned and shown red; process cleanup
  SHALL happen before deliberate failure or through an RAII guard, and all
  recorded PIDs SHALL be proven gone afterwards without broad `pkill`.

Verification: headless — bare cargo tests against the fake CLI plus repeated
timing bodies at test-thread counts 1, 4 and 8. Use a comfortably large grace
and broad relative bounds; prove old terminate-before-wait ordering reds the
prompt-death pins. Run offline audit and the boot gate because Rust app files
move. Graph regen does not fire unless an indexed TS/JS file moves. No real
model call or network. @human: the quit-mid-turn check becomes confirmation
rather than tolerance.

## Implementation notes

## Verdicts
