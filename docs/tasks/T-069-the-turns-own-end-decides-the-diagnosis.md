---
id: T-069
title: The turn's own end decides the diagnosis, and everything parsed gets relayed
feature: F-03
milestone: 3
priority: 12
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

Absorbs: T-029-s8, T-029-s9 (fourth triage, 2026-08-19). The suggestion
files are removed in the same commit as this card.

ONE CLOSURE, TWO REMAINING EDGES. T-029's second executor bound both
classifications to the turn's TERMINAL state rather than to anything
merely seen: the `Result` arm of `run_turn` assigns
`auth_status = api_error_status;` unguarded, and the classification
closure guards `ToolDenied` with `result_is_error &&
!permission_denials.is_empty()`. Both hold, both were re-verified, both
are correct, and T-029-s6/s7 are discharged on that card. What is left
is what the DECLINED diagnosis leaves behind, and what the narrowing
cost that nobody wrote down.

THE DECLINED DIAGNOSIS RELAYS NOTHING. The `result` line's text reaches
the diagnostic ring only under `if is_error`, so a turn whose terminal
line says `is_error: false` contributes no text to `stderr_tail`. With
an empty stderr — which the 2.1.226 auth smoke measured as the real
CLI's behaviour — the tail is the empty string, `failureDetail` returns
null for an empty trimmed detail, and `FailureBlock` renders no detail
span. Measured through the real `run_turn`: both `denied-then-end-turn`
and a fatal denial carrying `is_error: false` produce
`ExitNonZero { code: Some(1), stderr_tail: "" }`, so the screen reads
exactly "the planner exited with code 1" and nothing else. **The
information was parsed**: `permission_denials` was read into a bounded,
control-stripped, typed `Vec<String>` and then dropped on the floor.
That is this family's own spine — a fact known and typed inside the
process, delivered nowhere a user can see it — surviving in the corner
of the task that closed it everywhere else.

THE TRADE WAS RIGHT AND IS UNDOCUMENTED. The fix's comment says the
terminal line is the turn's own verdict. It does not say the
consequence: an auth failure that names its status ONLY in the
diagnostic is no longer typed. Measured one line apart at `307319b`
(pre-fix, `AuthFailed`) and `4540821` (post-fix, `ExitNonZero` with the
full auth sentence in the tail). This does not touch the observed CLI —
the transcribed `auth-error` scenario carries `api_error_status` on its
own `result` line and classifies `AuthFailed` at both refs — so the
narrowing bites a shape 2.1.226 does not produce, and it degrades in the
safe direction. But a future CLI version that moves the status is a
silent loss of the flagship affordance with no test watching for it.

## Acceptance criteria
- WHEN a turn's `result` line carries `permission_denials` but the
  classifier DECLINES to claim them, the parsed denial names SHALL reach
  the diagnostic ring anyway, so `ExitNonZero`'s tail names them. The
  `api_retry` note is the precedent: the ring already carries
  diagnostics the classifier does not act on. RELAYING is not
  DIAGNOSING — the distinction the fix's own comment draws — and the
  comment SHALL say so beside the new push.
- THE comment beside `auth_status = api_error_status;` SHALL disclose
  the false NEGATIVE the assignment introduced, and a pin SHALL assert
  the transcribed 2.1.226 shape still carries `api_error_status` on its
  own `result` line, so a CLI that moves the status REDS instead of
  silently dropping the typed auth failure.
- THE residual false POSITIVE — a recovered 401 with NO result line at
  all, which still classifies `AuthFailed` — SHALL be closed using
  evidence the stream already carries and NOT vocabulary T-029-s5
  records as unverified. Model text emitted AFTER the last
  status-bearing diagnostic is direct evidence the CLI got past the
  error, and the runner already tracks relayed text. IF the
  discriminator is judged too speculative THEN it SHALL be declined IN
  WRITING, naming the `auth-403-no-result` counter-pin as the reason —
  that stream has no delta and must keep classifying `AuthFailed`.
- REGRESSION pins SHALL DISCRIMINATE, not merely pass: the control row
  (a stream identical to the failing one minus the 401 diagnostic) and
  an `api_retry` 401 followed by a text delta and no result line.

Verification: headless, driving the real `run_turn` through
`RunnerConfig::binary_override` with a scripted CLI. No real CLI, no
model, no network. Rust-only diff — no TypeScript, no manifest, no
capability, no IPC surface.

## Implementation notes

## Verdicts
