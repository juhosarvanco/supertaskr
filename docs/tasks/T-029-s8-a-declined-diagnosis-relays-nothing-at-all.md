---
id: T-029-s8
title: The s7 blind spot degrades to a BARE exit code — is_error false suppresses the ring push, so the screen says "exited with code 1" with no detail at all
status: suggested
suggested_by: verifier claude-opus-5 @T-029
---

**Measured, not inferred**, against branch tip `4540821` through the
real `run_turn`:

    denied-then-end-turn            => ExitNonZero { code: Some(1), stderr_tail: "" }
    a FATAL denial with is_error:false
      (result{is_error:false, terminal_reason:"refusal",
              permission_denials:[{tool_name:"Bash"}]} · exit 1)
                                    => ExitNonZero { code: Some(1), stderr_tail: "" }

T-029-s7's close is right and this is not a request to widen it. The
issue is what the DECLINED diagnosis leaves behind.

The second executor's justification for taking the narrow arm is that
the blind spot "degrades to `ExitNonZero` rather than `ToolDenied`" and
that "a relayed exit code keeps Try again". **Try again is indeed kept.
Nothing is relayed.** The `result` line's text is pushed into the
diagnostic ring only under `if is_error` (`runner.rs:1312-1318`), so a
turn whose terminal line says `is_error: false` contributes NO text to
`stderr_tail`. With an empty stderr — which the 2.1.226 auth smoke
measured as the real CLI's behaviour — the tail is the empty string.

`failureDetail` (`interview-model.ts:390`) returns `null` for an empty
trimmed detail and `FailureBlock` renders no detail span, so the screen
reads **exactly "the planner exited with code 1"** and nothing else.
That is the bare-exit-code screen the architect's original trace
described and the first executor corrected as NOT happening for auth —
it does not happen for auth, and it does happen here.

**The information was parsed.** `permission_denials` was read into a
bounded, control-stripped, typed `Vec<String>` and then dropped on the
floor. This is the card's own spine — *a fact that is known and typed
inside the process, and then delivered nowhere a user can see it* — in
a corner of the task that closed it everywhere else.

**The close needs no unverified vocabulary**, which is what makes it
different from the wider `terminal_reason` guard s7 correctly deferred:
push the parsed denial names into the diagnostic ring REGARDLESS of
`is_error`, so `ExitNonZero`'s tail carries "denied: Bash" even when
the classifier declines to claim the denial killed the turn. That
separates RELAYING from DIAGNOSING — precisely the distinction the
fix's own comment draws ("a classification is a claim about what killed
the turn") — and it costs one `push` beside an existing one. The
`stderr_ring` already carries diagnostics the classifier does not act
on; the `api_retry` note is the precedent.

Not blocking: an honest bare exit code beats the confident false cause
it replaced, and the direction of the trade is right. But "relayed" is
doing work in the executor's note that the code does not support, and a
reader meeting this in the field gets a screen with nothing on it.
