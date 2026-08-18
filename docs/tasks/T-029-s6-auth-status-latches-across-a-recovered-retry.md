---
id: T-029-s6
title: A RECOVERED api_retry 401 latches and misdiagnoses an unrelated failure as AuthFailed — the screen removes Try again and says `claude login`
status: suggested
suggested_by: verifier claude-opus-5 @T-029
---

**Reproduced, not inferred.** In `run_turn`
(`app/src-tauri/src/agent/runner.rs`), `auth_status` is a MONOTONE LATCH.
The `Diagnostic` arm sets it from any in-band `error_status`, and the
`Result` arm only ever overwrites it when the result line carries an
`api_error_status` of its own:

    StreamLine::Diagnostic { note, error_status } => {
        if error_status.is_some() { auth_status = error_status; }

    StreamLine::Result { .. api_error_status .. } => {
        if api_error_status.is_some() { auth_status = api_error_status; }

So a 401 seen ANYWHERE in a turn survives to the classification closure,
which fires on `exited_badly || result_is_error` regardless of what
actually killed the turn.

The comment above that closure asserts the property that fails: *"a
transient `api_retry` the CLI recovered from classifies nothing: a
successful turn never reaches this closure at all."* True for a turn that
SUCCEEDS. The unhandled case is the third one — a turn that survives the
retry and then dies of something else.

That case is not exotic. The fixture's own transcribed line is the CLI
announcing its retry machinery: `"attempt":1,"max_retries":10,
"retry_delay_ms":508`. A 401 that is retried ten times exists because
some of those retries succeed — an OAuth access token refreshed
mid-turn is the ordinary path.

Measured against the branch tip `c3f86ad`, driving the real `run_turn`
through `RunnerConfig::binary_override` with a scripted CLI:

| stream | classified as |
|---|---|
| init · `api_retry` 401 · text delta · `result{is_error:true, terminal_reason:"error_during_execution", result:"Error: ENOSPC…"}` · exit 1 | `AuthFailed { status: Some(401), message: "Error: ENOSPC: no space left on device, write '/Users/x/docs/NORTH_STAR.md'" }` |
| init · `api_retry` 401 · text delta · `result{is_error:false, result:"Here is your first question."}` · exit 1 | `AuthFailed { status: Some(401), message: "the agent CLI could not authenticate" }` |
| **control** — identical but with NO 401 line | `ExitNonZero { code: Some(1), stderr_tail: "Error: ENOSPC" }` |
| init · `api_retry` 401 · `result{is_error:true, terminal_reason:"refusal", permission_denials:[{tool_name:"Bash"}]}` · exit 1 | `AuthFailed { status: Some(401), message: "I was not permitted to run the tools this stage needs." }` |

The control discriminates: the 401 line alone flips the classification.

**Why this is worse than the blunt failure it replaced.** For
`authFailed`, `failureAction` (`app/src/genesis/interview-model.ts`)
returns `retry: false`, so `FailureBlock` REMOVES the **Try again**
button, prints `claude login` as the command, and offers "Drive it by
hand". For a full disk or a transient denial, Try again is the action
that would have worked, and it is the one taken away. The rendered
detail is the failure's own text, so the block contradicts itself: the
headline reads "your CLI's login has expired" directly above "Error:
ENOSPC: no space left on device".

The last row is the sharpest: a REAL tool denial — the exact shape this
task added `ToolDenied` for — is shadowed by a stale 401 and reported as
an auth failure. The task's own new classification loses to the bug.

**The close is one line.** In the `Result` arm, drop the `is_some()`
guard so a terminal result line without `api_error_status` CLEARS the
stale status:

    auth_status = api_error_status;

Verified on the branch: all four rows above then classify as
`ExitNonZero` / `ToolDenied { denials: ["Bash"], terminal_reason:
Some("refusal") }` respectively; a 403 diagnostic with no result line at
all still classifies `AuthFailed`; and the whole shipped cargo suite
stays green — **307 passed, 3 ignored, 0 failed**, including
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`,
because the real transcribed auth failure carries `api_error_status: 401`
on its own result line.

A regression pin belongs with it: the control row above is the test that
discriminates, and no shipped test currently puts a diagnostic 401 in
front of an unrelated failure.
