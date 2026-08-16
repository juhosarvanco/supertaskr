---
id: T-025-s1
title: Auth failures arrive in band with subtype "success" — classify them instead of relaying a raw tail
status: suggested
suggested_by: executor claude-opus-5 @T-025
---

The one permitted real-CLI smoke (claude 2.1.226, run once off-suite)
turned the plan's §6 assumption into a measurement, and the measurement
was worse than the assumption. §6 says auth expiry "surfaces as
`ExitNonZero` with the CLI's own stderr tail relayed for T-027 to show".
Observed reality:

- stderr is **completely empty**;
- the failure is reported IN BAND on stdout: a
  `{"type":"system","subtype":"api_retry",…,"error_status":401,
  "error":"authentication_failed"}` line, then a `result` line whose
  **`subtype` still reads `"success"`** while `is_error` is `true` and
  `result` carries `Failed to authenticate. API Error: 401 OAuth access
  token has been revoked.`;
- the process then exits 1.

T-025 fixed the dead end inside its own fence: `classify_line` now reads
`is_error` (never `subtype`), in-band `system` errors become
diagnostics, and a nonzero exit reports the CLI's words when stderr is
silent. The `auth-error` fake scenario transcribes the observed lines as
a regression pin. So the user is no longer shown an empty string.

What is still open is CLASSIFICATION, which §10 listed as a genuine
silence and which this evidence makes cheap to close:

1. `api_error_status: 401` is a machine-readable signal sitting right
   there in the result line. A typed `AuthFailed { status, message }`
   variant would let T-027 render the ONE action that helps ("your CLI's
   login has expired — run `claude login`") instead of a stderr blob,
   and would let T-029 route straight to the hand-driven fallback rather
   than making the human read an error.
2. `terminal_reason: "api_error"` and `permission_denials: []` are two
   more in-band fields worth reading: the second would let a turn that
   died because the adapter's `--allowedTools` was too narrow say so by
   name, which is exactly the diagnostic a future adapter-flag change
   needs.
3. Whoever does this should decide whether `ExitNonZero` keeps carrying
   a `stderrTail` at all, or whether the field becomes a general
   `diagnostics` string fed from stderr AND the in-band lines (which is
   what it de facto already is after T-025's fix — the name is now
   slightly a lie).

Belongs with T-027 (which renders it) or T-029 (which routes on it).
Not urgent: nothing is lost today, it is only harder to read than it
needs to be.
