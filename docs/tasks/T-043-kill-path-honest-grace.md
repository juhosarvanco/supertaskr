---
id: T-043
title: The kill path — an honest grace and an honest scope
feature: F-03
milestone: 3
priority: 6
size: S
status: planned
blocked_by: []
touches: [app-agent]
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
Serialize app-agent BEHIND T-039, which is building on the same
component.

Verified despite the S size: the kill contract is what ADR-002's
"killing anything is safe" cashes out to, and a poll that cannot exit
early is the kind of defect that reads as correct. Executor +
adversarial verifier.

## Acceptance criteria
- WHEN a turn's child dies promptly after SIGTERM THE grace SHALL end
  when the child is REAPED, not when the grace expires: the poll
  learns the reap (`child.try_wait()` in the escalation loop, or a
  reaped-predicate passed into `terminate_group`), leaving the
  pid-only `kill(pid, 0)` form where it is the right probe. Today
  `pid_alive` is true for a ZOMBIE and `run_turn` only calls
  `child.wait()` AFTER `terminate_group` returns, so the full grace is
  always paid. The verifier's measurement is the failing→passing pin:
  `VGRACE: grace=3s latch free after 3.035s (child dies on first
  SIGTERM)` — after the fix the latch SHALL free well inside the
  grace (T-025-s7).
- WHEN the app quits mid-turn THE main thread SHALL NOT hold for the
  full grace when the child is already dead: `reap_for_exit`'s path
  exercises the same reaped-aware poll, pinned through its existing
  seam. Production `kill_grace` is 5 s and this is ~5 s of dead app on
  every quit-mid-turn (T-025-s7).
- THE SIGTERM→SIGKILL escalation SHALL be unchanged for a child that
  ignores SIGTERM — still SIGKILLed after the full grace and reaped
  with no zombie — and `terminate_group_async`'s background thread
  SHALL keep its current semantics; the existing kill tests stay
  green.
- THE kill guarantee SHALL be stated at its true scope: T-025 §5's
  sentence SHALL read "no orphaned grandchildren THAT STAY IN THE
  GROUP", and its silences list SHALL name the `setsid()` escapee
  beside the SIGKILL-of-app orphan already there, with the verifier's
  measurement transcribed (`child_alive=false escapee_alive=true
  child_pid=72417 escapee_pid=72418 escapee_pgid=72418`) so the next
  reader gets evidence rather than a claim. Documentation only — no
  descendant sweep is built (T-025-s5).
- A DESCENDANT SWEEP SHALL be recorded as a deliberate non-goal: the
  only reliable window is BEFORE the kill (after the direct child dies
  the escapee is reparented and the chain is gone), and exposure is
  nil while no allowlisted verb daemonizes. Revisited by whichever
  task first widens the Bash allowlist (T-025-s4, parked).
- THE T-025 plan-text off-by-one SHALL be corrected in the same sweep:
  §3's "(13 files, ~60 KB)" parenthetical SHALL read 14, matching the
  enumeration the snapshot actually ships and the parity walk pins —
  no test encodes the wrong number, so this is truth maintenance, not
  a fix (T-025-s3, first half).

Verification: headless — cargo tests against the fake CLI, including a
timing assertion on the prompt-death path. No real model calls, no
network. @human: the `tauri dev` quit-the-app orphan check already on
the visual list gains its answer here — after this task the ~5 s hang
should be gone, and the human's check becomes a confirmation rather
than a tolerance.

## Implementation notes

## Verdicts
