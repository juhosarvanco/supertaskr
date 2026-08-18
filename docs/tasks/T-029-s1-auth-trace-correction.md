---
id: T-029-s1
title: The auth trace in STATE.md and T-029's notes is wrong about stderr_tail — correct it before a fourth session inherits it
status: suggested
suggested_by: executor claude-opus-5 @T-029
---

`docs/STATE.md`'s @human section and T-029's architect trace both state
that on a revoked login the screen "shows no detail at all", because
`stderr_tail` is empty and `failureDetail` returns `null`. **Three of
those five steps are false, and the claim is now written down in two
places a future session will read as fact.**

`stderr_ring` (`app/src-tauri/src/agent/runner.rs:1078`) is not a stderr
ring. It has THREE writers and only one is stderr: the stderr thread
(`:1088`), the `result` line's own text when `is_error` (`:1194`), and
the in-band `api_retry` diagnostic (`:1204`). T-025 wired those in
deliberately and named its test after it —
`an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`,
which asserted `stderr_tail.contains("401")` and passed on main.
Measured on `bdecad8`:

    ExitNonZero { code: Some(1), stderr_tail:
      "api_retry: authentication_failed 401\nFailed to authenticate.
       API Error: 401 OAuth access token has been revoked." }

So the screen DID show the 401 — as an escaped one-line blob
(`sanitize_for_log` escapes the newline) under "the planner exited with
code 1", with a Try again button. The defect was real and the priority
was right; the DIAGNOSIS was wrong. T-029's criterion had it right in
its own words ("a TYPED outcome rather than a relayed blob").

**Why this is worth a card rather than a shrug.** STATE.md's own open
question asks whether a card's numbers are a claim to verify or a brief
to implement — this is the same question about a TRACE, and it is the
first instance where the trace was produced by reading merged code and
still came out wrong, because it stopped at a variable's NAME. The
correction belongs in STATE.md (the @human paragraph tells the human
"nothing points at the login", which was never true) and in T-029's
notes if that section is ever consolidated.

Two lines of fix. No code.
