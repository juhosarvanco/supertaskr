---
id: T-061-s4
title: A typed-exit assertion in the Rust suite reads an EMPTY stderr tail once under parallel load — observed red, then 5-for-5 green in isolation, on a branch with a zero diff under app/
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

**Observed failing once, during T-061's build**, on a branch whose
`git diff --stat 2036fb2..HEAD -- app/ lib/ crates/` is EMPTY — so
nothing in this lane can be the cause.

`cargo test --no-fail-fast` from `app/src-tauri/`, summed over fifteen
`test result:` lines: **351 passed / 1 failed / 3 ignored, exit 101**.

    ---- a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail stdout ----
    thread '...' panicked at tests/agent_runner.rs:1321:13:
    [nputer] agent: turn 1 failed: ExitNonZero { code: Some(3), stderr_tail: "" }

The body (`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail` in
`app/src-tauri/tests/agent_runner.rs`) asserts two things about the
typed error:

```rust
assert_eq!(code, Some(3));
assert!(stderr_tail.contains("credentials expired"), "{stderr_tail}");
```

The **code was right** — `Some(3)`, so the child ran, failed, and was
reaped with the exit status the scenario intends. The **tail was
empty**. The runner typed the failure correctly and lost the child's
last words, which is precisely the half of `ExitNonZero` that exists so
a failure is legible.

**Reproduction attempts, recorded because the negative result is the
finding.** The same test, alone, five consecutive runs:

    cargo test --test agent_runner -- --exact a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail
    ok, ok, ok, ok, ok   (5/5, 0.25-0.39s each)

The immediate re-run of the whole suite: **352 passed / 0 failed / 3
ignored, exit 0**. So it is a race that needs the parallel load of the
full binary — 72 other tests in `agent_runner.rs` alone, each spawning
`fake_agent` — and it is not reproducible by asking for it.

**WHY IT IS WORTH A CARD RATHER THAN A SHRUG.** It is a
**capture race in a diagnostic**, and diagnostics are what this
repository has repeatedly found itself unable to read at the moment it
needed them — the whole argument for T-046's failure tail is that *a
gate whose failure is not legible is half a gate*. A `stderr_tail` that
is empty a fraction of the time is a `stderr_tail` that will be empty on
the run that matters. And the failure mode when it bites in production
is silent: `ExitNonZero { code: Some(3), stderr_tail: "" }` is a
perfectly well-formed typed error that says nothing.

**Where to look.** The suspicion is an ordering between reaping the
child and draining its stderr pipe: if the wait returns and the reader
is torn down before the pipe's buffered bytes are read, the tail is
empty while the code is correct. That is consistent with the symptom
(code right, tail empty) and with it needing load to appear. This is a
hypothesis from one observation, not a diagnosis — whoever takes this
should read `app/src-tauri/src/agent/runner.rs`'s exit path rather than
this paragraph.

**What would make it falsifiable.** A stress arm — the same scenario N
times in one binary, or the body run with the machine deliberately
loaded — is the only way to know a fix worked, because a single green
run is what this test already gives 99% of the time. `T-063`'s lesson
applies in the other direction here: a body that passes because the race
did not happen is indistinguishable from one that passes because the
race is fixed.

**One tally, for whoever measures.** Observed once in the two full
`cargo test --no-fail-fast` runs this session (one red, one green), plus
five isolated greens. That is 1 failure in 7 executions of the body, and
the single failure is the only one under parallel load — so the rate
under load is unknown and one-for-two is not an estimate.
