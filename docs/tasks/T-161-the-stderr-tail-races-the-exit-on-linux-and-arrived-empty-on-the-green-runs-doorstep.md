---
id: T-161
title: The typed-failure stderr tail races the child's exit on Linux — it arrived EMPTY at the first green-run attempt, on code five prior ubuntu runs passed
feature: F-03
milestone: 4
priority: 21
size: S
status: building
blocked_by: []
touches: [app-agent]
suggested_by: integrator nputer-4e @the first green-run attempt, run 33274798983
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-30, integrator)** on the CI-green
standing authorization: it redded the first green-run attempt.

## The evidence

Run 33274798983 (main @ f63f8a0, the first push after every carded
Linux red was fixed):
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail` panicked at
tests/agent_runner.rs:1393 — `stderr_tail.contains("credentials
expired")` over a tail the panic message printed as **EMPTY** — with
81/1/1 in the file and every later step skipped. The same body, on
byte-identical runner code, passed the ubuntu cargo step at least
FIVE times before (runs 33255912812, 33256467475, 33257012982,
33259394002, 33260414204): nothing in the merges between touched
`app/src-tauri/src/**` — the diff since the last green cargo step is
registry/fixtures/tools-e2e/docs only. This is an INTERMITTENT, not
drift.

A rerun of the failed job was fired immediately as the second
measurement (2026-08-30, same run id, attempt 2) — its result stands
in the checkpoint record that cites this card, green or red.

## The mechanism to confirm (hypothesis, stated as one)

The fake's `nonzero` scenario writes `credentials expired` to stderr
and exits 3. The runner types the failure with a stderr TAIL captured
from the pipe. On Linux, a child's exit can be observed before the
last pipe write is drained — whether the tail is read to EOF or
snapshotted at exit-observation decides whether this is a real race
in `runner.rs`'s capture or a fixture race in the harness. THE LANE
MEASURES FIRST: read the capture path, say which side owns the race,
and prove it with a reproduction (a deliberately slow-flushing child)
rather than a timing guess.

## Acceptance criteria

- THE lane SHALL name the owner of the race (product capture vs test
  harness) from the code, with the reproduction that proves it.
- THE capture SHALL be made exit-order-independent (read stderr to
  EOF before typing the failure, or the equivalent the code's own
  shape supports) — never a sleep, never a retry loop in the test.
- THE fix SHALL keep the tail BOUNDED (the existing cap survives) and
  the turn semantics unchanged (typed failure, session resumable).
- A regression body SHALL pin the race's shape (slow-flushing child
  still yields the full tail) and be mutation-proven (capture
  reverted to the racy form -> the body reds).
- THE fix SHALL be proven where it fired: cap 2 CI cycles on the
  lane's branch, per-body reads, run ids on the card.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

## CORROBORATION (2026-08-30, standing triage sitting #4) — the SECOND CI sighting

CI run **33328885168**, main at `27f609d` (the T-163-s4 close tip),
cargo step: `a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`
**FAILED**, `85 passed; 1 failed; 1 ignored` in
`tests/agent_runner.rs`, panicking at `tests/agent_runner.rs:1485` with
`ExitNonZero { code: Some(3), stderr_tail: "" }` — **the tail EMPTY
again**, the same shape as the first sighting at run 33274798983.

Two facts that sharpen the card and are recorded rather than inferred:

- **It is still INTERMITTENT, confirmed on the successor run.** The same
  body is green at `b60b06d` (run 33329824890, full battery, the session
  close tip) with nothing in the diff touching the capture path. Read
  with `gh run view <id> --log-failed`; the attribution was made at this
  seat and the successor run was reported independently by the outgoing
  integrator session.
- **The line number moved and the mechanism did not** — 1393 at the
  first sighting, 1485 here. The card's own citation rule applies to its
  own evidence: cite
  `a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`, never the
  line.

**The cost is now measured rather than predicted**: this red skipped
every step behind cargo, including the e2e lane and the boot gate, so
one intermittent hides a whole battery's worth of signal from the push
it lands on.
