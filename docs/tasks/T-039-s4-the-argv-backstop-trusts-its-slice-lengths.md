---
id: T-039-s4
title: The assembled-argv backstop trusts its slice lengths — an argv longer than its template goes unchecked
status: suggested
suggested_by: verifier claude-opus-5 @T-039
---

T-039's production backstop is `adapter::check_no_data_borne_flag`
(`adapter.rs:289`), called from `AgentAdapter::argv` on every assembly.
Its stated job, in its own doc comment and in
`SessionIdRejection::FlagInValuePosition`, is to be "the structural
backstop for a future template that substitutes somewhere new".

It zips two slices:

    for (at, (slot, arg)) in template.iter().zip(assembled.iter()).enumerate()

`zip` stops at the SHORTER of the two. Measured by the verifier, calling
the `pub` function directly:

| template | assembled | result |
|---|---|---|
| `["--resume", "{session_id}"]` | `["--resume", "abc", "--dangerously-skip-permissions"]` | **`Ok(())`** |
| `["--resume", "{session_id}"]` | `["--resume"]` | `Ok(())` |

A flag sitting past the template's length is never looked at. The TEST
pin has the guard the production function lacks — `adapter.rs:453`
asserts `template.len() == assembled.len()` before its own loop — so the
two copies of the same rule disagree about what they check.

**Unreachable today, and that is the whole point.** `argv` builds
`assembled` by `template.iter().map(…)`, so the lengths are equal by
construction and no current call can reach the gap. But an
infallible-looking guard that silently skips part of its input is
precisely the shape of the bug T-039 exists to close: T-025's bypass pin
also looked like it covered a class, and the class it missed was the one
that mattered. A future template that APPENDS a substituted value rather
than replacing a slot one-for-one — the obvious way to add
`--model {model}` or a second id — would walk past this backstop while
it stayed green.

Two things, both small:

1. **Make the length agreement part of the check**, not an assumption:
   return `FlagInValuePosition` (or a new `LengthMismatch`) when
   `template.len() != assembled.len()`, so the production function is at
   least as strict as its own pin. One `if`, one unit row.
2. **Say what the backstop actually covers.** It catches the LEADING-DASH
   class only. A substituted value that widens a grant without beginning
   with `-` passes it — verified: template
   `["--allowedTools", "{session_id}", …]` assembled with `Bash(*)` in
   the slot returns `Ok(())`. That is correct for T-039, whose criterion
   4 is specifically about elements beginning with `-`, and the session-id
   allowlist is what actually makes the class impossible. But the doc
   comment promises a broader guarantee than the code delivers, and the
   next person to add a substituted slot will read the promise.

Neither is a defect in T-039's criteria — criterion 4 asked for the
leading-dash rule over the fully assembled argv, and that is exactly what
was built and pinned. This is about keeping the backstop honest about its
own reach before something leans on it.
