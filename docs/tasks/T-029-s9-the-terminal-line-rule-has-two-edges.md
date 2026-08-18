---
id: T-029-s9
title: The "terminal line is the verdict" rule has two edges — a recovered 401 still latches when no result line is written, and a genuine auth failure that names its status only in the diagnostic is no longer typed
status: suggested
suggested_by: verifier claude-opus-5 @T-029
---

T-029-s6's close (`runner.rs:1338`, `auth_status = api_error_status;`)
is correct and this is not a request to revert it. Both edges below were
**measured on branch tip `4540821`** through the real `run_turn`, and
one of them was measured against `307319b` as well so the direction of
the change is a comparison rather than a claim.

## Edge 1 — the residual false POSITIVE (unchanged by the fix)

    init · api_retry{error_status:401} · text delta · exit 1   (NO result line)
    => AuthFailed { status: Some(401), message: "the agent CLI could not authenticate" }

This is s6's own complaint — a 401 the CLI recovered from, relabelling
an unrelated death — surviving in the shape where there is no terminal
line to clear the status. It is the flip side of the row-5 counter-pin
(`auth-403-no-result`), and the executor's rule is coherent: with no
terminal verdict, the last error status is the only evidence there is.

**But this stream carries its own discriminator, and it needs no
vocabulary T-029-s5 records as unverified**: a `TextDelta` arrived
AFTER the diagnostic. Model text produced after an auth error is direct
evidence the CLI got past it. Row 5's stream has no delta; this one
does. The runner already tracks relayed text (`pending`, `relayed`), so
"was any model text emitted after the last status-bearing diagnostic"
is a field away.

Narrow — it needs the CLI to recover from a 401 and then die without
writing a `result` line (a crash, an OOM, a SIGKILL mid-turn). Not
introduced by the fix; pre-existing and merely not reached by it.

## Edge 2 — the new false NEGATIVE (introduced by the fix, and the right trade)

Same probe, both refs, one line apart:

    init · api_retry{error_status:401}
         · result{is_error:true, terminal_reason:"api_error",
                  result:"Failed to authenticate. API Error: 401 OAuth
                          access token has been revoked."}          · exit 1

    307319b (pre-fix)  => AuthFailed { status: Some(401), message: "Failed to
                                       authenticate. API Error: 401 OAuth
                                       access token has been revoked." }
    4540821 (post-fix) => ExitNonZero { code: Some(1), stderr_tail:
                          "api_retry: authentication_failed 401\nFailed to
                           authenticate. API Error: 401 OAuth access token
                           has been revoked." }

A genuine auth failure that names its status ONLY in the diagnostic is
no longer typed. **This does not touch the observed CLI**: the
transcribed `auth-error` scenario carries `api_error_status: 401` on its
own `result` line and classifies `AuthFailed` at BOTH refs (verified in
the same run). The narrowing bites a shape 2.1.226 does not produce.

And it degrades in the safe direction: the full auth sentence still
arrives in `stderr_tail`, so the user sees "401 OAuth access token has
been revoked" as the pre-T-029 relayed blob, with Try again restored.
Losing a true positive to a blob is strictly better than the false
positive it replaced, which REMOVED the retry affordance and sent a user
with a working login to `claude login`.

**The ask is disclosure, not a change.** The fix's comment says the
terminal line is the turn's own verdict; it does not say the consequence
— that an auth failure which fails to repeat its status on that line
stops being typed. A future CLI version that moves the status is a
silent loss of the flagship affordance with no test watching for it. One
sentence in the comment beside `auth_status = api_error_status;`, and
ideally a pin asserting the transcribed shape still carries
`api_error_status` on its result line, converts an undocumented
dependency on a wire detail into a stated one.
