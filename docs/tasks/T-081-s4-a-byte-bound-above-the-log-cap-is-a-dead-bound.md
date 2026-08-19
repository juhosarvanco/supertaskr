---
id: T-081-s4
title: A byte bound above the log cap never bites, and one in the runner is already there
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

Every stream-borne string in `app/src-tauri/src/agent/runner.rs` travels
the same two steps: `sessions::truncate_utf8(raw, N)` for a BYTE bound,
then `docs_watch::sanitize_for_log` to escape control characters. The
second step has a cap of its own — `MAX_ECHO_LOG_CHARS` characters, plus
an explicit `…(truncated)` marker — and it lives in a different file.

**So whenever `N` exceeds that cap, the runner's own bound is dead for
ASCII text.** The length is decided by `docs_watch`'s constant, the
runner's number never bites, and a test asserting the runner's number is
measuring the wrong file's constant.

**There is a live instance.** `MAX_AUTH_MESSAGE_BYTES = 2048`, applied to
`TurnError::AuthFailed { message }`. An auth message longer than the log
cap is cut by `sanitize_for_log`, not by that constant. Nothing is broken
— both bounds are safe directions and the observed CLI message is about
70 bytes — but the constant's doc comment says *"this is headroom with a
hard stop"*, and the hard stop is somewhere else.

`MAX_DENIAL_BYTES = 128` is fine (far below the cap) and T-081 chose
`MAX_DENIAL_MESSAGE_BYTES = 768` deliberately below it, with the reason
in its doc comment. That makes three constants in one file governed by a
rule that is written down in exactly one of them.

**Two ways to close it, and they are not equivalent.** Either state the
rule once where the bounds live — *"a byte bound here must sit below
`docs_watch::MAX_ECHO_LOG_CHARS` or it is advisory"* — and assert it with
a test over the constants, which reds if either file moves; or invert the
order so the escape runs first and the byte bound last, which makes the
runner's number authoritative but changes what a truncated escape
sequence looks like at the cut. The first is a paragraph and a pin. The
second is a behaviour change and wants its own card.

Noticed while pinning T-081's message bound, which is why the choice of
768 is explained rather than round.
