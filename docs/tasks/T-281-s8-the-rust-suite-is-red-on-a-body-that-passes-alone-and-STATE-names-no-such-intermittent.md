---
id: T-281-s8
title: "The Rust suite reds on a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded under the full run and PASSES alone — an intermittent that docs/STATE.md does not name, so the next seat will attribute it to its own diff"
feature: F-01
milestone: 4
size: S
priority: 1
status: verifying
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs, app/src-tauri/src/agent/mod.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

Measured on the T-281 bench at `d086c73`, through the blessed runner:

    gate-verdict suite=rust exit=101 bodies=654 targets=18 verdict=RED reason=suite-reported-failure

One body, in `app/src-tauri/tests/agent_runner.rs`:

    test a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded ... FAILED
    panicked at tests/agent_runner.rs:3623:5:
    assertion failed: matches!(agent::send_turn(&h.watch, &h.agent, "answer".into()),
        SendOutcome::NoSession)
    test result: FAILED. 94 passed; 1 failed; 1 ignored

**Attributed, not guessed.** `git diff --name-only bceb22f..d086c73 --
app/ lib/ '*.rs' '*.toml'` is empty — T-281's fence touches no Rust input
at all — and the test body reads no `method/` file, so the role-file
changes cannot reach it. **Re-run once, alone: it PASSES.** So it is an
intermittent under the parallel run, not a regression.

`docs/STATE.md`'s "NOTHING IS BROKEN LOCALLY" paragraph enumerates the
designed non-zero readings (`npm run health` 3, the two breaching bands)
and names no Rust intermittent. STATE is the file a verifier reads
precisely so it does not misattribute a red to the diff in front of it —
and this seat spent a measurement doing exactly that attribution by hand.
The next one will too.

Two things are owed, and they are different:

1. **Name it in STATE** if it stays intermittent, with the derive command
   and the "passes alone" reading, so the attribution is a lookup rather
   than an investigation.
2. **Find out why it is order-dependent.** A turn-sending test that
   depends on what ran before it is either sharing state through a
   fixture root or racing a watcher — and `SendOutcome::NoSession` going
   the wrong way is exactly the shape a leaked session between tests
   produces. Naming it in STATE without this is banking a hazard, which
   is what STATE's own contract says a record is for.

## Amendment (the architect seat, 2026-09-09T11:58Z — promoted to planned p1 after the runner reproduced it)

Run 34347086580 on 0a1c7cf (the first run carrying the free-disk step) died at the cargo suite on this very body — 94 passed / 1 failed — before the free-disk step or the floor was reached. Red once on a bench under the parallel run and once on the runner, green alone: not a local accident. STATE.md leaves this card's fence (STATE is the checkpoint's; the seat names the intermittent there itself if the fix does not land first) and the runner module joins it, since the fix may live where `send_turn` decides `NoSession`.

- WHEN the cargo suite runs under the full parallel run, on this Mac and on the runner, THE body SHALL pass deterministically — the race, the shared state or the timing assumption it depends on found and removed, named in the notes with the measurement that showed it (the body run alone, then under the full suite, ten times each, all green).
- WHEN the fix lands THE test SHALL still refuse a hostile session id — the assertion's subject is unchanged; only its arrangement moves.
- IF the flake is in the test's own arrangement (a `recv_timeout`, a shared dump directory, a port) THEN the fix stays in the test file; IF it is in the runner THEN the notes SHALL say which state two tests shared.


## Implementation notes (executor claude-opus-5@subagent, 2026-09-09, lane at `1b5061ec`)

**The race, named: the end of a turn was published through TWO pieces of
shared state, in the wrong order, and the gap between them was the
flake.** Not a `recv_timeout`, not a shared dump directory, not a port,
not a global — and not, as this card's third criterion supposed, state
that two *tests* shared. The sharing is between `spawn_turn`'s worker
thread and every caller of the module, and one body happened to be the
one that asked both questions in a row.

A caller learns a turn is over from `agent::status()`, which takes the
`inner` mutex and reads `phase`. It claims the runner through
`begin_turn()`, which CASes the `running` `AtomicBool` that `TurnInFlight`
owns. `spawn_turn` wrote the terminal phase under the mutex, dropped the
mutex, and then released the latch **when the thread ended** — so between
the two sat the tail of the closure: the `println!` that formats and
sanitizes the error, and every captured local's drop. A caller that polls
the phase until it leaves `Running` and then sends is racing that gap, and
`send_turn`'s first line answers `SendOutcome::Busy` when it loses.

That is exactly what `settle()` does — poll `status` every 20 ms, return
on the first non-`Running` read — and exactly what the body did on the
next line. `SendOutcome::Busy` is not `SendOutcome::NoSession`, so the
assertion at the old line 3623 failed. **It is a live app defect, not
only a test defect**: the webview polls `genesis_status` and re-arms its
send box on the same signal, so a person typing fast enough into a
settled interview could be told the runner was busy with a turn that had
already failed.

### The measurement, in four steps

| step | tree | command | result |
|---|---|---|---|
| 1. reproduce | base `1b5061ec` | `--exact` body × 720, under 12 concurrent copies of the whole target | **1 red in 720** at `tests/agent_runner.rs:3623`, the card's own assertion |
| 2. name the cause | base + a 50 ms `sleep` between the phase publication and the thread's end | `--exact` body × 10 | **10 red of 10** — the intermittent made deterministic |
| 3. name the outcome | as above, assertion rewritten to report what it got | `--exact` body × 1 | `no captured id means nothing to resume, got **Busy**` |
| 4. confirm the fix | fixed, same 50 ms stall re-injected at BOTH positions (inside the lock; and at the old site after `drop(guard)`) | `--exact` body × 10 each | **0 red of 20** |

The body alone never redded in 20 runs of the target and 40 runs of the
body on an idle machine; the load is the instrument, and 12× is what it
took here. CI's own runner needs no help — it took this red once already
(run `34347086580` on `0a1c7cf`), as did the T-281 bench at `d086c73`.

### The fix

`drop(flight)` moved **inside the lock that publishes the terminal
phase**, in `spawn_turn` and — the sweep — in `spawn_cold_start`, which
carries the identical shape (`cold_start_status()` is its phase reader and
`settle_cold` its poller). The two are now one step: whoever can see the
terminal phase acquired that mutex *after* the worker released it, so the
freed latch is visible to them too. The other direction is safe by the
same edge — a `send_turn` that wins the latch inside the window blocks on
the mutex until the worker drops it, then sets `Running` itself.

Nothing else moved. `send_turn` is untouched; the assertion's subject is
unchanged (a hostile session id is still refused, still unrecorded, still
never resumed) — only its diagnosis moved, from a bare
`assert!(matches!(..))` that reported one source line into an `other =>
panic!("… got {other:?}")` in the file's own idiom. The seat that met this
red twice had to rebuild the outcome from the module; the next one reads
it.

### The pin, and its poison drill

`a_settled_turn_has_already_released_the_single_flight_latch` is the
mirror of `a_turn_in_flight_refuses_a_second_one`: that body measures the
latch refusing while a turn is live, this one measures it already free the
instant the turn is over — the half nothing measured and the half that
reddened. Its poll deliberately does not sleep, which is the whole
instrument: `settle`'s 20 ms nap wins the race by accident nearly every
time. Drilled by restoring the old ordering: **20 red of 20**, naming the
defect in words. With the fix: **20 green of 20**. A 1-in-720 intermittent
is now a deterministic pin.

### What was NOT fixed, and is filed instead

The 8× oversubscription used to hunt this one reddened two *other* bodies
in the same file, and both survive this fix — 6 reds in 40 runs at 8×,
none of them this card's body. They are different defects with different
causes and they are filed as T-288 and T-289 rather than swept in here.
Neither has ever been seen at 1×: this card's body is the only one of the
three CI has actually taken.
