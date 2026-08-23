---
id: T-103
title: The probe path has no escalation, no registration and no bound — a SIGTERM-immune probe means Busy forever, outlives the app, and the pins around it cannot fail
feature: F-03
milestone: 4
priority: 59
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

Absorbs (seventh triage, 2026-08-24): T-013-s3, T-070-s5 — files removed in this commit.

> **DRAFTER'S NOTE — remove before landing.** Every code claim below was
> re-read at HEAD `4d2f03c` and every one reproduces, including the two
> the findings quote as source blocks. Line numbers have drifted
> (`run_with_timeout` is at 932, `kill_group_now` at 1137,
> `terminate_group_async` at 1345, `child_slot.lock()` at 1762 and 2200,
> the zombie body at 755) so this card cites SYMBOLS throughout, per
> CONVENTIONS' own rule.

Absorbs: T-043-s3, T-043-s5, T-043-s4, T-043-s6 (sixth triage,
2026-08-20). All four files removed in this commit.

**T-043 gave the TURN's child a grace, a SIGKILL and a
group-membership check. The PROBE's child got none of it, and the
consequence is not a slow start — it is a dead genesis.**

## ONE — the timeout kills without escalating, then waits forever

`run_with_timeout` is the whole of the timeout handling for both
one-shot probes — the `$SHELL -l -c` login probe and `<binary>
--version`. Its `Ok(None)` arm, verbatim at `4d2f03c`:

    if Instant::now() >= deadline {
        kill_group_now(pid);   // SIGTERM to the group. That is all.
        let _ = child.wait();  // …then block, with no deadline of its own.
        return None;
    }

`kill_group_now` sends **SIGTERM and nothing else** — verified: its
whole unix body is one `signals::kill_group(pid, signals::SIGTERM)`.
There is no grace, no SIGKILL, no second look. **So a probe that ignores
SIGTERM is not killed, and the very next line waits for it without a
bound.** The `probe_timeout` (10 s in production) bounds how long the
probe may RUN; it does not bound this function.

**`start_genesis` takes the single-flight latch (`begin_turn`) before it
resolves, and `TurnInFlight` releases on Drop — which never happens if
the call never returns.** Every later `genesis_start` answers `Busy`,
for the life of the app process, with no error, no event, and nothing on
screen that says why.

**A second, smaller hole in the same loop**: the `Err(_) => return None`
arm returns without killing and without reaping, so a `try_wait` error
abandons the child outright.

## TWO — the probe child is invisible to the exit reap

`child_slot` is written in exactly one place — inside `run_turn` — and
read in exactly two, `AgentState::reap_for_exit` and `agent::cancel`
(all three verified at `4d2f03c`). **`run_with_timeout` spawns its own
child into its own process group (`process_group(0)`) and registers it
nowhere.** So the app-exit hook has nothing to signal for a probe, and
combined with ONE, a probe that ignores SIGTERM survives BOTH the
timeout and the app's exit.

**This lands on the exact sentence T-043 spent the card correcting.**
Criterion 7 narrowed the guarantee to *no orphaned descendant that stays
in the group* — a real narrowing, in the `setsid()` direction. It did
not narrow it in THIS direction, and this direction is a plain
same-group child of our own process that no exit path can see. The
corrected sentence in `agent/mod.rs`, `lib.rs` and T-025 §5 is therefore
still slightly wider than the mechanism, for a second and independent
reason.

**Reachability, stated honestly, for both.** The two programs that reach
`run_with_timeout` are the user's `$SHELL` (absolute, executable, and
name-checked to zsh/bash/sh since T-060) and the resolved agent binary
run with `--version`. None of the three shells ignores SIGTERM by
default, so this needs an unusual machine — a wrapper script installed
as `/bin/zsh`, a `--version` path that is not the CLI, a stopped
process. **Low likelihood, unbounded consequence, small fix.**

## THREE — the synchronous SIGTERM cannot be observed, and the criterion over-claims

T-043's criterion says `genesis_cancel` shall *"return promptly, send
SIGTERM synchronously, and retain background escalation"*, citing one
body for all three. **Drill, inline at tip `677b46a`**: delete the
synchronous send from `terminate_group_async` — verified still present
at `4d2f03c` as `signals::kill_group(handle.pid, signals::SIGTERM)`
above the `thread::spawn`, under the comment *"Synchronously, before
this returns: the cancel's whole promise"* — leaving the background
thread untouched. **60 passed; 0 failed; 1 ignored; exit 0. Green.** The
reason is structural: the spawned thread's very first act is the same
`kill_group`, so the child is signalled either way, microseconds apart.
The cited body measures only that `cancel` RETURNS in under 300 ms (it
measured 0 ms; it reds at 918 ms under a different mutant) — it says
nothing about whether the signal preceded the return.

**The line is nevertheless load-bearing in a way no test can reach.**
`std::thread::spawn` panics on failure. Under thread exhaustion the
synchronous send is the ONLY SIGTERM that goes out; without it the
cancel panics having signalled nothing. **That is precisely why it must
not be deleted, and precisely why a body asserting it cannot be written
cheaply.**

## FOUR — the body the card calls its foundation never asserts the zombie

`a_zombie_answers_pid_alive_and_that_is_why_the_grace_needed_two_limbs`
is currently GREEN for a weaker reason than it claims. Three things,
all verified verbatim at `4d2f03c`:

1. **The comment forbids what the loop condition does.** It says
   spinning must not `try_wait`, because that would reap the zombie
   being measured — and the loop condition IS a `try_wait`. Harmless
   only because the child has not usually died in the microseconds
   between the `kill` and the first evaluation; if it has, the child is
   reaped there and the assertion below reds spuriously.
2. **The loop can never iterate twice** — it ends in an unconditional
   `break` — so `deadline` is unreachable dead code and the 10 s bound
   it appears to provide does not exist. The body is really
   `sleep(500); sleep(200)`.
3. **Nothing asserts the child is actually a zombie.** `pid_alive` is
   `kill(pid, 0)`, equally true for a process still running. If the
   `sleeper` fixture became slow to die, or 700 ms stopped being enough
   on a starved runner, the body would stay GREEN while measuring *an
   alive process answers `kill(pid,0)`* — a fact nobody doubts —
   instead of the zombie fact the whole two-limb design rests on.

**Measured, so the report is not speculation**: instrumenting the body
to sample `ps -o stat=` immediately before the assertion, three runs
each printed `stat="Z"`. **It really is a zombie today. The body just
does not check.**

## Acceptance criteria

- **THE PROBE PATH SHALL ESCALATE THE WAY THE TURN PATH DOES**: reuse
  `terminate_group_owning` with the probe's own grace instead of the
  bare `kill_group_now`, so a probe that ignores SIGTERM is SIGKILLed
  and the function returns.
- **`run_with_timeout` SHALL NOT BLOCK WITHOUT A BOUND on any path**,
  the deadline arm and the `Err(_)` arm included; the `Err(_)` arm SHALL
  kill and reap rather than abandon.
- **A PROBE THAT WILL NOT DIE SHALL PRODUCE A TYPED OUTCOME, not
  silence** — the resolver's caller must be able to tell "the probe
  refused to die" from "the probe said nothing", because today both are
  `None`.
- **THE SINGLE-FLIGHT LATCH SHALL BE PROVEN RELEASED** on that path: a
  body driving a SIGTERM-immune probe fixture SHALL show a subsequent
  `genesis_start` NOT answering `Busy`. This is the criterion the whole
  card exists for; a fix without it is a fix nobody can check.
- **THE PROBE CHILD SHALL BE REACHABLE BY THE EXIT HOOK, or the
  guarantee SHALL be narrowed in writing** — in the same comment blocks
  T-043 corrected (`agent/mod.rs`, `lib.rs`, T-025 §5) — to say the
  guarantee covers TURN children only. One or the other, not silence.
- **THE SYNCHRONOUS-SEND CRITERION SHALL BE CORRECTED RATHER THAN
  CHASED**: narrow it to what is observable (returns promptly, retains
  background escalation) and record at the call site that the
  synchronous send exists for the `spawn`-panics path, not for latency.
  IF a body is written for it instead THEN it SHALL be shown to red on
  deletion, and its flakiness SHALL be measured rather than assumed.
- **THE ZOMBIE BODY SHALL ASSERT THE ZOMBIE**: poll until the child is
  dead-but-unreaped and assert THAT state (a `ps -o stat=` starting with
  `Z`, or an observed reap), delete the unreachable `deadline`, and fix
  the comment so it describes the code. THE `try_wait` IN THE LOOP
  CONDITION SHALL GO — the comment already forbids it.
- **THE FIXED ZOMBIE BODY SHALL BE SHOWN TO RED when the fixture is not
  a zombie** — plant a still-running child and require the failure —
  because "expected alive, got alive" is satisfied by the very
  confusion this body exists to rule out (CONVENTIONS' negative-control
  rule, applied to a positive).
- IF the lifted-guard shape appears in any new body THEN CONVENTIONS'
  LIFTING A SAFETY GUARD rule applies in full: the lifted arm proven to
  terminate IN A FIXTURE, and the guard's state asserted before anything
  is exercised.

Verification: headless — bare `cargo test` from app/src-tauri with the
total summed from the `test result:` lines and the exit read unpiped,
plus a census of surviving processes at the end (`ps -Ao pid,ppid,command`),
because this card's whole subject is children that outlive their
parents. **POISON DRILL on every new or changed assertion**, one side
only, producer mutated: remove the escalation and require the
Busy-forever body RED; plant a non-zombie and require the zombie body
RED. Mutated text read back with `git diff` before each run; restores
per-path, proved by sha256 at the drill's own commit. The BOOT GATE
trigger fires on `app/src-tauri/**` — run the boot check on a scratch
port and record the exit and both `[nputer]` lines. **No `pkill` at any
point**, and the two long-lived `nputer-T-060` `fake_agent` orphans are
left alone (T-043-s1). @human: none.
