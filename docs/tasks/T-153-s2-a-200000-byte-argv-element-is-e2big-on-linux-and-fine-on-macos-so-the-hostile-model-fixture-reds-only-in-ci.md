---
id: T-153-s2
title: A 200 000-byte argv element is E2BIG on Linux and fine on macOS, so the hostile-model fixture reds only in CI — and the product hands that string to execve unbounded
feature: F-03
milestone: 4
priority: 20
size: S
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
suggested_by: executor claude-opus-5 @T-153
---

Found by the T-153 lane's CI run `33252279564`, on the step behind the
red that card removed. **It is C-14's fence, not T-153's, so it was
routed rather than fixed** (`touches: [app-agent]` —
`app/src-tauri/tests/agent_runner.rs` is that component's by its own
`paths:` field).

    test a_hostile_init_line_model_is_refused_and_a_real_one_round_trips ... FAILED
    [nputer] agent: turn 1 failed: SpawnFailed { os: "Argument list too long (os error 7)" }
    thread '...' panicked at tests/agent_runner.rs:181:5:
    timed out waiting for completed; saw: [ Failed { seq: 1, ... } ]
    test result: FAILED. 79 passed; 1 failed; 1 ignored

## THE MECHANISM, AND IT IS A PLATFORM DIFFERENCE RATHER THAN A RACE

The body's first fixture is `("oversize", "M".repeat(200_000))`
(app/src-tauri/tests/agent_runner.rs, the `for (tag, model)` loop in
`a_hostile_init_line_model_is_refused_and_a_real_one_round_trips`). That
string becomes one `--model <value>` **argv element**.

Linux caps a SINGLE argv element at `MAX_ARG_STRLEN` = 32 pages =
131 072 bytes, independently of the much larger total `ARG_MAX`; over it
`execve` returns `E2BIG`. macOS has no per-element cap of that shape —
its limit is on the total, at 1 MiB — so 200 000 bytes in one argument
spawns cleanly there and has done on every local run this repository has
ever made. 200 000 > 131 072, so the fixture is over the Linux cap by
construction and this is a **deterministic** red on Linux, not the
1-in-22 flake STATE's standing hazard names for
`a_hostile_session_id…`. Nothing in the body is timing-dependent; the
spawn simply cannot succeed.

The test then fails at `wait_completed`, because the turn `Failed`
instead of `Completed` — three layers from the cause, in the shape the
DOCS GATE bullet warns about.

## THE PRODUCT HALF, WHICH IS THE PART WORTH ARGUING ABOUT

The test is refusable as a fixture bug. The behaviour underneath is not
obviously one: **the `model` option reaches `execve` unbounded.** The
runner already refuses a hostile model on the way OUT (the registry
never records it, which is what the rest of this body proves); it does
not bound it on the way IN. So on Linux a user or a config with a
>128 KiB model string gets `SpawnFailed` — a turn that never starts —
where macOS gets the designed outcome, a turn that stands with the model
refused. The typed-failure family this project built (T-069/T-101/
T-102/T-107/T-113) exists so a failure never costs an affordance
falsely, and this one costs the whole turn on one platform only.

## Disposal

`touches:` `[app-agent]`. Three arms, and the first two are cheap:

- **(a)** Bound `model` where the argv is BUILT, in
  `app/src-tauri/src/agent/**`, and let the existing refusal path
  handle the rest. Then the fixture passes on both platforms because
  the product stopped handing execve something it cannot take, which is
  the honest fix.
- **(b)** Move the fixture under the Linux cap — e.g. 100 000 — and say
  in the body WHY the number is what it is. Cheapest, and it leaves the
  product half unanswered.
- **(c)** Keep 200 000 and assert the platform-split outcome
  explicitly. Worst of the three: it writes the divergence down as
  intended behaviour.

**(a) plus (b)'s comment is the pair that leaves nothing owed.** Derive
`MAX_ARG_STRLEN` at your own ref rather than quoting this card — it is
`getconf ARG_MAX` for the total and a kernel constant for the element,
and the two are not the same number.
