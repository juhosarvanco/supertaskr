---
id: T-060-s3
title: BLOCKER — the guard's own lift window races the guard's own pin, and it is 100% red at the thread counts CI uses
status: suggested
suggested_by: verifier claude-opus-5 @T-060
---

**This is T-060's blocking finding.** The executor recorded the hazard
honestly ("not race-proof") and reasoned it was survivable because no
other test asserts on `$SHELL`. It checked the wrong variable. The race
is on **`NPUTER_NO_REAL_CLI`**, it is between two tests this card
introduces, and it is not a theoretical window — it is a **100% failure
at `--test-threads` 5, 6 and 8, and 87% at 4**, which is the vCPU count
of the `ubuntu-24.04` runner `ci.yml:127` runs bare `cargo test` on.

## The two bodies

`tests/agent_runner.rs:1989-2009`, inside
`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`,
mutates the variable **process-wide** for the duration of a resolve:

    std::env::set_var("NPUTER_NO_REAL_CLI", "0");
    let lifted = resolve_cli(&cfg, adapter::planner_adapter());
    std::env::set_var("NPUTER_NO_REAL_CLI", "1");
    …
    std::env::remove_var("NPUTER_NO_REAL_CLI");

`tests/agent_runner.rs:1829`, inside
`the_no_real_cli_guard_is_on_without_anything_being_set`, asserts the
variable is **unset** — which is the entire point of that test, since
the property being pinned is "nothing has to be set":

    assert_eq!(std::env::var(NO_REAL_CLI_VAR).ok(), None,
      "the guard must hold with the variable UNSET - if a suite has to \
       set it, a suite can forget it");

libtest runs both on threads of one process. The window is ~a resolve
plus a handful of assertions wide, and the second test lands in it.

## Measured, on this machine (10 cores), same binary, same tree

Runs of `target/debug/deps/agent_runner-8f158d95898ecfd1` from
`app/src-tauri` (cargo's own cwd), counting only failures at `:1829`:

| `--test-threads` | failed |
|---|---|
| 1 | 0 / 6 |
| 2 | 3 / 15 |
| 3 | 0 / 10 |
| **4** | **13 / 15** |
| **5** | **10 / 10** |
| **6** | **10 / 10** |
| **8** | **15 / 15** |
| 10 (this box's default) | 0 / 15 |
| 16 | 0 / 15 |
| 32 | 0 / 15 |
| default, no flag | 0 / 25 |

Verbatim, `--test-threads=8`:

    thread 'the_no_real_cli_guard_is_on_without_anything_being_set'
      panicked at tests/agent_runner.rs:1829:5:
    assertion `left == right` failed: the guard must hold with the
      variable UNSET - if a suite has to set it, a suite can forget it
      left: Some("0")
     right: None

    test result: FAILED. 47 passed; 1 failed; 1 ignored; 0 measured;
      0 filtered out; finished in 3.45s

**Why the executor's `cargo test` was green, and why that is the trap.**
The default thread count is the machine's core count. This box has 10,
and 10 happens to sit in a quiet band. A 4-core box — `ubuntu-24.04`,
which `ci.yml:55`/`:127` uses with a bare `cargo test` — sits in the
loud one. The card's "319 passed, exit 0" is real and reproduces here;
it is also a property of this hardware, not of the test.

## Why it is a blocker rather than an accepted cost

1. It is not rare. At the thread count CI actually uses it is the
   common case, not the tail.
2. The test it breaks is the card's own **tripwire** — the one body
   whose job is to notice if the guard ever stops holding. A tripwire
   that cries wolf on a 4-core box is one an integrator learns to
   re-run until it is green, which is exactly how a real guard failure
   would get through.
3. It is introduced by this card. Neither body existed before.

## What would close it

Any of these, and the third is the one that removes the class:

- Serialize the two bodies on a shared `static Mutex` — cheapest, but
  it leaves a process-global mutation that the next test author must
  know about.
- Have the tripwire assert only the DERIVED answer
  (`running_as_cargo_test_binary()`), not the variable's absence — but
  that weakens the pin, because "nothing has to be set" is the
  property.
- **Run the lifted arm in a CHILD PROCESS.** Re-invoke the test binary
  with `NPUTER_NO_REAL_CLI=0` and a `--exact` filter, and nothing
  process-global is mutated at all. This also removes the
  `std::env::set_var`-in-a-threaded-program hazard that Rust has been
  moving toward marking `unsafe`, and it makes the discriminating half
  safe by construction rather than by the fixture-shell argument
  T-060-s1 had to invent.

Note that the same shape sits in `src/agent/runner.rs:2200-2204`
(`the_real_cli_arms_are_forbidden_from_a_test_binary`), in the LIB test
binary. It is harmless today only because no other lib unit test reads
that variable — which is precisely the argument that failed here.
