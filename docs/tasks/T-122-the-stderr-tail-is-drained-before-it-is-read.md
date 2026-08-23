---
id: T-122
title: Two load-flaky bodies in the Rust suite, one shared reap mechanism — the stderr tail is read from a ring nothing waits on, and the grace poll called a group empty 28 ms in
feature: F-03
milestone: 4
priority: 65
size: M
status: planned
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** The
> anchor finding is titled for the body its executor observed **once**;
> the body that reproduces is a different one, and T-061's integrator
> recorded that correction on the file rather than silently retitling
> it. **This card carries BOTH, because merging them would lose one.**
> Also: `app/src-tauri/tests/agent_runner.rs` is claimed by no
> component's `paths:` glob (swept at `6b0cf47` over all twelve
> `C-*.md`); `[app-agent]` is the fence T-069 and T-081 both used for it
> in practice. Same row-5 residual as `T-115` and `T-116`.

Absorbs (seventh triage, 2026-08-24): T-061-s4 — file removed in this
commit.

Two bodies in `app/src-tauri/tests/agent_runner.rs` fail under the
parallel load of the full binary and pass when asked for directly.
Neither is caused by any lane that observed them, and **the tallies
below are not a rate** — three sessions measured three different ones on
trees whose diff under `app/`, `lib/` and `crates/` is empty.

## Arm 1 — the typed failure that lost the child's last words

Observed once during T-061's build, on a branch whose
`git diff --stat 2036fb2..HEAD -- app/ lib/ crates/` is EMPTY. Bare
`cargo test --no-fail-fast` from `app/src-tauri/`, summed over fifteen
`test result:` lines: **351 passed / 1 failed / 3 ignored, exit 101**.

    ---- a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail stdout ----
    panicked at tests/agent_runner.rs:1321:13:
    [nputer] agent: turn 1 failed: ExitNonZero { code: Some(3), stderr_tail: "" }

The body asserts `assert_eq!(code, Some(3))` and
`assert!(stderr_tail.contains("credentials expired"), "{stderr_tail}")`.
**The code was right** — the child ran, failed and was reaped with the
scenario's exit status. **The tail was empty.** The runner typed the
failure correctly and lost the half of `ExitNonZero` that exists so a
failure is legible. Five consecutive isolated runs: **ok, ok, ok, ok,
ok**. The immediate re-run of the whole suite: **352 / 0 / 3, exit 0.**

**AND THE SUSPECTED MECHANISM IS VISIBLE IN THE SOURCE, read at
`6b0cf47`.** `run_turn` spawns the stderr reader with
`std::thread::spawn(move || { … })` and **discards the JoinHandle**; it
then reads `let stderr_tail = stderr_ring.lock()…to_string();` after
`child.wait()` and `handle.mark_reaped()`. **Nothing waits for that
reader to reach EOF on the pipe.** The STDOUT side has exactly the
synchronisation stderr lacks: its thread sends on `line_tx`, the sole
remaining sender is dropped at spawn time, and the relay loop drains
`line_rx` until disconnect — so stdout's reader is known to have
finished and stderr's is not. **That is consistent with the symptom
(code right, tail empty) and with needing load to appear.** It is a
hypothesis from one observation plus a reading, not a diagnosis; whoever
takes this reads the exit path rather than this paragraph.

## Arm 2 — the body that actually reproduces

T-061's verifier ran bare `cargo test --no-fail-fast` **seven times** at
`cc14fc9`: **four green (352/0/3, exit 0), three red (351/1/3, exit
101)**. In all three reds the failing body was
`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`
(panic at `agent_runner.rs:1091`), and the arm-1 body **passed in all
seven**.

**At the merge `ea7ea0a` the integrator ran the same seven and got seven
green** — 352/0/3, exit 0, every run — on a tree whose
`git diff --name-only f306ee9..ea7ea0a -- app/ lib/ crates/` is **0
paths** and where `agent_runner.rs` was last touched by T-081 at
`6251d37`. **0 of 7 against 3 of 7, same command, same code, different
machine load.** That is the signature of a race, and it means neither
tally is the rate.

**Why it deserves more than a re-run.** The failing assertion is the
RUST MIRROR of T-061's own mechanism: `terminate_group_polling` in
`app/src-tauri/src/agent/runner.rs` reaps with `try_wait`, then asks
`signals::group_has_members(pid)`, and loops on a `POLL_INTERVAL` of
**25 ms** until the grace expires. It returned `group_empty: true`
**after 28 ms of a 900 ms grace** — the first poll iteration — while the
body had just asserted `pid_alive(grandchild_pid)`. Whether that is a
harness race about when the grandchild joins the group, or the emptiness
probe answering wrongly under load, is the open question. **The second
answer would matter to `reapOrphanedGroup` in
`tools/e2e/scripts/tauri-boot-check.mjs` too** — the code T-061 shipped,
and the code `T-119` is about — so the two cards share a mechanism and
should not both guess at it.

One live hypothesis, offered as such: the pid space on this machine
allocates sequentially with a **99999** ceiling, and it wrapped mid-run
inside both the executor's and the verifier's sessions.

## What would make either arm falsifiable

**A single green run is what both bodies already give most of the time**
— `T-063`'s lesson from the other direction: a body that passes because
the race did not happen is indistinguishable from one that passes
because the race is fixed. **A stress arm is the only way to know a fix
worked.**

## Acceptance criteria

- **THE STDERR TAIL SHALL NOT BE READ FROM A RING NOTHING HAS WAITED
  ON.** `run_turn` SHALL establish that the stderr reader has reached
  EOF (or a stated, bounded deadline) before `stderr_tail` is taken, and
  the code SHALL say which, beside the read. **A bound is a decision, so
  if one is chosen it SHALL be named and SHALL sit below
  `docs_watch::MAX_ECHO_LOG_CHARS`** — a byte bound above the log cap is
  a dead bound (`T-102`'s fourth bullet).
- IF a deadline is used rather than an unconditional join THEN the
  timeout path SHALL be distinguishable from an empty tail: a turn whose
  stderr could not be drained in time SHALL NOT arrive as
  `stderr_tail: ""`, which is the very shape that says nothing. **The
  failure mode this card exists to remove is a well-formed typed error
  with no words in it.**
- **THE STDOUT SIDE'S SYNCHRONISATION SHALL NOT REGRESS.** The
  `line_tx` drop and the `line_rx` drain to disconnect are what make the
  stdout reader's completion known; this card adds the missing half for
  stderr and changes neither.
- **A STRESS ARM SHALL EXIST FOR EACH ARM, AND SHALL BE SHOWN TO
  DISCRIMINATE.** The same scenario driven N times in one binary, or
  under deliberate load, SHALL red against the pre-fix producer and
  green after. **A body that only ever passes is not evidence** — the
  card SHALL record the pre-fix failure rate of its own stress arm at
  its own ref, and IF the arm cannot be made to red against the pre-fix
  code THEN say so and name it, because a body that cannot fail is the
  finding (POISON DRILL).
- **THE 28-MILLISECOND OBSERVATION SHALL BE EXPLAINED OR EXPLICITLY
  LEFT OPEN.** Either `group_has_members` answered wrongly under load or
  the grandchild had not yet joined the group at the first poll; the
  card SHALL say WHICH it measured. **IF it is the probe THEN the same
  conclusion SHALL be routed to `T-119`**, whose `reapOrphanedGroup` is
  the JavaScript mirror of this poll — routed as a suggestion naming the
  fence, never edited from this lane (`tools/e2e` is not in this fence).
- IF the harness is the cause rather than the runner THEN the FIX IS
  THE HARNESS and the runner SHALL NOT be changed to accommodate it —
  and the body's message SHALL say what it actually observed, which
  today reads as "it abandoned it" for a state that may be "it was never
  there yet".
- **THE GRACE ASSERTION SHALL NOT BE PARAMETRISED BY THE GRACE**
  (CONVENTIONS: a test parametrised by the constant it checks cannot pin
  that constant — the whole `STARTUP_DEADLINE_MS` family stayed green at
  `8_000_000`). `the_production_kill_grace_is_five_seconds` already
  holds the literal for production; the same care applies to any new
  timing body.
- **NO FIGURE IN THIS CARD SHALL BE CARRIED FORWARD AS A RATE.** The
  card SHALL re-derive its own seven-run baseline at its own ref and
  state it with that ref. Three sessions produced 1-of-7, 3-of-7 and
  0-of-7 on effectively the same code; **quoting any of them as the rate
  is the error this card is partly about.**

Verification: headless — bare `cargo test --no-fail-fast` from
app/src-tauri, **run seven times**, each total summed from the fifteen
`test result:` lines rather than eyeballed, each exit read unpiped from
`$?`, all seven recorded. **POISON DRILL on every new or changed
assertion, one side only**, producer mutated and never the assertion:
remove the stderr drain and require the stress arm RED; shorten the
grace poll's first read and require the grace body RED. Every mutated
text read back with `git diff` before its run; restores per-path proved
by sha256 against the drill's own commit; **drilled in a detached
scratch worktree with its own `CARGO_TARGET_DIR` inside it** (POISON
DRILL arm (c)) — a shared target directory can make a mutant look dead
against a stale binary, which on a race is indistinguishable from a
fix. Then the shape-six check per new body. The BOOT GATE trigger fires
on `app/src-tauri/**` — run the boot check on a scratch port and record
the exit and both `[nputer]` lines; **1420 is the human's and is read
only with `lsof -nP -iTCP:1420 -sTCP:LISTEN`, never bind-probed.** The
DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none.
