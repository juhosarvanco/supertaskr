---
id: T-281-s8
title: "The Rust suite reds on a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded under the full run and PASSES alone — an intermittent that docs/STATE.md does not name, so the next seat will attribute it to its own diff"
feature: F-01
milestone: 4
size: S
priority: 1
status: done
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs, app/src-tauri/src/agent/mod.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

## Verdicts

2026-09-09 — claude-opus-5@subagent (verifier, phase 2 of the two-spawn bench;
review mode independent): **APPROVED WITH ASSIGNED CORRECTIONS** — the race is
real, named from the base text, and REMOVED rather than masked; the assertion's
subject is untouched; the fence, the stamp and the census all hold; and one
correction is assigned, a wording repair that owes no mutant block.

Judged at the lane tip `fb8379d2468c2f06033ea093e1420cf57d2fecff`, on the bench
worktree `/Users/ujju/Projects/nputer-V-T-281-s8`, detached. Base for every
comparison: the dispatch stamp `1b5061ec94a533ddb60d370541c96be05584baed`.
**Every figure below is bound to the ref it was measured at**; the verdict and
the two cards I file are commits after it, so re-derive rather than assume.

attack set: sha256:74f5defabdfa15ef5b6e433f23ed31e147cda737e18fe52ed9e7c0e93c355d8f (attack-set-T-281-s8.md)
ground truths: sha256:c959e2cc93acf62dbc6c534422947f3e95897db4be981a98cc48115531736833 (ground-T-281-s8.md)
ground truths: sha256:3b3d83fa850c41645872207419421b4f19c4b8b364bb547bad10c03594f178f7 (ground-T-281-s8-addendum.md)

All three verified with `shasum -a 256` before anything else was opened, against
`$S/stamps-T-281-s8.txt`. I re-derived the sealed ground independently: a
`git clone --shared` of the base hashes both fenced files to
`cd2f1869…3d09111` (`tests/agent_runner.rs`) and `e6a4d95b…7fe0fec6`
(`src/agent/mod.rs`), the values the ground file states.

**THE FRAME I ACTUALLY HAD, stated because the role file requires it and
because it was not clean.** Phase 1 was a real separate spawn: the attack set
says on its face it was written with no tools, and it is hashed. Phase 2's
brief, however, is hand-written by the seat and **carries executor-derived
specifics in its duties section — the mechanism ("a two-state publication in
spawn_turn", "settle()'s poll returned between the two and send_turn answered
Busy"), the code-and-notes sha `b0a44c1`, the port, and that the stamp re-ran
nothing.** That is phase 1 broken above the line, and I say so rather than
pretend otherwise. Two mitigations, both real: the attack set was sealed and
hashed before any of it, and §3 of that set had already named this family
(R-B, "the test raced ITSELF … a genuine runner-side ordering bug, the one
hypothesis where a fix in `mod.rs` is legitimate") without any of it. What the
leak cost is the independence of my *first* reading of the diff, not the
independence of the attack set or of any measurement below, all of which I ran
myself (T-210).

**THE BRIEF CARRIED NO CONTEXT PACK** and says so. Under this bench's
`method/roles/verifier.md` step 0 that is a dispatch fault, and there I read
`docs/CONVENTIONS.md` WHOLE — all 2,011 lines — rather than by bullet. I also
read `docs/STATE.md` and `docs/ARCHITECTURE.md` whole, and this bench's
`verifier.md` (which carries T-281's step 5b; T-283's step 6 is not on this
bench and I followed the base's text).

**AND ONE OF THE BRIEF'S GROUND RULES IS FALSE AT THIS TIP.** It states that
`docs/STATE.md` at the bench names this intermittent. It does not:
`grep -n -i 'intermittent|flake|flaky|passes alone|T-281' docs/STATE.md` at
`fb8379d` returns one line, 60, an unrelated GRAPH derive command. Obligation
(1) of the original finding — name it in STATE — is therefore still
undischarged repo-wide. It is correctly NOT this lane's: the card's own
amendment puts STATE outside this fence, and a STATE edit in this diff would
have been a fence break.

**WHAT I JUDGED ON.** The card at the base (`git show 1b5061e:` — sha256
`06b3211511831435d5c182646474657c9a3f09c7ffb5edb0086f0e46b9afbf53`, the ground
file's value), the patch `1b5061e..fb8379d`, the tree at the tip, and runs I
performed. The executor's report and the card's notes were opened LAST, after
every finding below except the load figures was written to
`$S/findings-T-281-s8.md`; the load figures were taken afterwards and could not
have been shaped by the notes, since the diff's own comment already stated the
1-in-720 reading before I read either.

### Fence, stamp, graph — all hold

`git diff --name-only 1b5061e..fb8379d` is exactly five paths: the two fenced
`.rs` files, this card, and `T-288`/`T-289`, both NEW and both
`status: suggested`. No `Cargo.toml`, no `Cargo.lock`, no `.cargo/config.toml`
(the repository has none), no `ci.yml`, no `docs/STATE.md`, no
`docs/CAPABILITIES.md`, no graph artifact. **No live fence is touched**: not
T-280's (`gate-run.mjs`, the two hooks, `docs-scan.mjs`, `gate-run.spec.ts`,
`push-guard.spec.ts`, `CONVENTIONS`), not T-285's (`dispatch-brief.mjs`,
`brief.spec.ts`, `TASK-FORMAT.md`, `brief.mjs`), not T-283's (`executor.md`,
`verifier.md`, `lane-protocol.md`).
- **Stamp**: `METHOD_SNAPSHOT_VERSION = "0.1.14"` at `kit.rs:37` at the tip;
  `kit.rs` is not in the diff. Unmoved.
- **Graph**: `mod.rs` is a `.rs` under `app/src-tauri/src` edited IN PLACE — no
  add, no move. The regen fires and is the INTEGRATOR's at the merge; the bench
  correctly carries no regenerated `graph.json`. I did NOT re-run
  `index --check` here, deliberately: this bench has built with cargo, so its
  `target/` sits inside the walk and its number would be about the bench
  (CONVENTIONS, the GRAPH BAND clause).
- None of the six cards this branch will carry — the lane's three and my own
  three — uses the ASCII left-arrow the card grammar forbids, and every one of
  their statuses is in the parser's vocabulary. Asked of the gate, not eyeballed:
  `docs-gate.mjs` reports *every live task card's frontmatter parses, with a
  legal status*.

### The kill set, refused by READING (a green run buys every one of these)

| | | |
|---|---|---|
| K1 sleep | PASS | no `thread::sleep` added. The new body spin-polls under a deadline whose exhaustion PANICS — the one exception the set allowed. |
| K2 recv_timeout | PASS | `git diff \| grep -c recv_timeout` = **0**. Untouched. |
| K3 retry loop | PASS | no loop wraps any assertion; the hostile-id body's arrangement is unchanged. |
| K4 serialization | PASS | no `#[serial]`, no `serial_test`, no `--test-threads`, no config or workflow file in the diff. |
| K4a new global | PASS | no `static`/`OnceCell`/`OnceLock`/`lazy_static`/`Mutex::new` added to `mod.rs`. |
| K5 assertion loosened | PASS | `assert!(matches!(send_turn(..), SendOutcome::NoSession))` became `match send_turn(..) { NoSession => {}, other => panic!(..) }`. The accepted set is EXACTLY `{NoSession}` on both sides — not widened, only diagnosed. `SendOutcome`'s variant list at the tip is byte-identical to the base. |
| K6 ignored/gutted | PASS | exactly ONE real `#[ignore = ` attribute at base and at tip — `real_cli_smoke_records_the_stream_schema`, the env-gated real smoke; the other six grep hits are doc-comment prose. Rust reports 1 ignored on both sides. |
| K7 renamed/moved | PASS | all **132** top-level `fn` names at the base are present at the tip, exactly **one** added. The body under test keeps its exact name. |
| K8 moved elsewhere | PASS | measured, below — no new intermittent, and no slowdown. |
| K9 reproduction never shown | see MEASUREMENTS | |

**M6, the census invariant, honestly stated**: base 96 `#[test]` / 1 ignored →
tip **97** / 1 ignored. The set's literal "must still be 96" is broken by an
ADDITION, which is not K6 or K7; the containment that matters — all 96 base
names survive, ignored still 1 — holds, and the added body is the pin. The
rust leg goes 654 → 655 bodies for the same reason.

### §3 — which hypothesis the BASE text confirmed, and which it eliminated

The attack set named two families and demanded I say which the base confirmed.

**R-A (a session leaked in through state two tests shared) — ELIMINATED, from
the base text, before the diff was read.** `harness()` does call
`std::env::set_var(CANARY, CANARY_VALUE)` — process-global, and cargo runs
these 96 bodies as threads in ONE process — but it writes the SAME value every
time, so no body's answer can turn on who won it. `HTTPS_PROXY` is genuinely
raced by the `an_oversized_path_or_allowlist_pair_meets_the_bound_on_the_production_channels`
family's `set_var`/`remove_var` pair, and cannot reach `send_turn`'s decision.
Every fixture root is unique by construction —
`temp_dir()/supertaskr-t025-<tag>-<pid>-<now_ms>`, removed by `Harness::drop` —
so there is no shared dump directory and no shared registry. There are no
ports, sockets or fixed addresses in the file at all. And `mod.rs` holds no
`static`/`OnceCell` session state whatsoever: every `Arc<Mutex<..>>` is a field
of an `AgentState` each test builds for itself.

**R-B (the body raced ITSELF through the runner) — CONFIRMED.** `send_turn`'s
FIRST line is `let Some(flight) = agent.begin_turn() else { return
SendOutcome::Busy }`, and `begin_turn` is a compare-exchange on the `running`
`AtomicBool`; the two `NoSession` returns are further down, behind the `inner`
mutex. At the base, `spawn_turn`'s worker wrote the terminal phase UNDER that
mutex, dropped the guard, and released the latch only when the thread ended —
so "terminal phase visible" and "latch free" were two publications with the
closure's whole tail between them. Any caller that polls `status()` and then
sends can land in the gap and be told `Busy`, which is exactly the reported
symptom. **The race is internal; no second test shared state.**

That is the case my attack set pre-committed to accepting as discharging
criterion 3 — *"the race is internal to `start_genesis`/`send_turn`, here is
the window"* — provided the notes SAY it plainly rather than inventing a
second test. They do, in as many words: *"not, as this card's third criterion
supposed, state that two tests shared."* **Criterion 3 is DISCHARGED.**

And the rarity has a mechanism, which is the part worth keeping: `settle()`
polls with a 20 ms `thread::sleep`, an eternity beside a window measured in
microseconds, so it wins by accident nearly always — while the window's own
content, a `println!` whose `format!("{error:?}")` runs through
`sanitize_for_log` and then takes a stdout lock **ten test threads are
contending for**, is what widens it under the full parallel run and only there.
That is why this body reds under `cargo test` and never alone.

### §4 — security sweep (mandatory; REJECTED-level if any fires)

- **S1 the hostile id is still refused, BOTH halves — PASS.** Every other
  assertion in the body is untouched: the `RejectedSessionId` envelope and its
  four `why` checks, the absence of `SessionRegistered` and of `Completed`,
  `Phase::Failed` / `native_session_id: None` / `last_error`, the registry
  entry with `native_session_id: None` and `status: "idle"`, the raw
  `sessions.json` not containing `dangerously`, `!turn_dump(2).exists()`, and
  turn 1's argv carrying neither `--resume` nor anything hostile. Only the
  `send_turn` assertion's DIAGNOSIS moved.
- **S2 no widening of what `send_turn` accepts — PASS.** `send_turn` is not in
  the diff at all: every `mod.rs` hunk lands inside `spawn_cold_start` or
  `spawn_turn`. Proved mechanically below — `send_turn`'s brace-matched body is
  byte-identical between base and tip.
- **S3 no new global — PASS.** The only added statements are two `drop(flight)`
  and comments.
- **S4 no widened error echo — PASS.** No `SendOutcome` variant carries a
  session id in any arm, so the new `{other:?}` cannot echo the hostile value;
  it is a test-only panic besides.
- **S5 no `unsafe` — PASS.**
- **S6, mine, beyond the set: LOCK ORDER AND DEADLOCK.** `TurnInFlight::drop`
  is `self.0.store(false, Ordering::SeqCst)` and NOTHING else, so dropping the
  latch while holding `inner` (in `spawn_turn`) or `cold` (in
  `spawn_cold_start`) acquires no lock and inverts no order. The happens-before
  the comment claims is sound: latch store → mutex RELEASE → any observer's
  mutex ACQUIRE → that observer reads the terminal phase, and `status()` does
  take that same mutex. The other direction is bounded, not deadlocked: a
  `send_turn` that wins the latch inside the window blocks on the mutex until
  `drop(guard)` one line later. Unwind safety holds because the closure OWNS
  `flight`, so a panic anywhere still drops it — which is what the comment
  claims and what the code does.
- **The comment's named referents are real**, checked rather than assumed:
  `cold_start_status()` exists in `agent/mod.rs` and `settle_cold` in
  `tests/agent_runner.rs`, and in `spawn_cold_start` the `cold` guard is
  acquired before the match and is still alive at `drop(flight)` — so *"still
  inside the lock the terminal phase was written under"* is TRUE as written.

### MUTANTS AND CONTROLS — every one run by me (T-210), never read off the report

**A disclosed arrangement note.** For the load work I ran the COMPILED
`agent_runner` binary directly from `<checkout>/app/src-tauri` — the same
binary `cargo test` executes — so that N copies can run concurrently without
cargo's lock. Two bodies fail under that invocation at EVERY ref I built (base,
tip and all four mutants) and are artifacts of it rather than of the diff:
`the_no_real_cli_guard_is_on_without_anything_being_set` and
`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`,
the T-060 pair that re-execs itself and reads cargo-supplied environment. Both
are `--skip`ped in the load runs and named here. Every `cargo test` figure is
the unmodified CI invocation. All mutants were built in
`git clone --shared` checkouts under the scratchpad, each with its own
`target/` INSIDE itself — never in this bench, never in the lane (CONVENTIONS,
POISON DRILL).

**M1 — revert the ONE hunk the notes name as the cause.** `let _flight =
flight; // released when this thread ends` restored at the top of `spawn_turn`'s
closure and the `drop(flight)` removed; read back with `git diff`, and the
residual `git diff 1b5061e` confirms the mutated `spawn_turn` is BYTE-IDENTICAL
to the base's — the shape the causal story implicates.
**RESULT: `a_settled_turn_has_already_released_the_single_flight_latch` reds 6
of 6 runs, ALONE, on an idle machine, in 0.06 s each.** One red kills the
mutant. The fix is load-bearing.

**M4 — death AT THE SITE.** The M1 failure is the intended one and nothing
else dies with it: `tests/agent_runner.rs:3412:30`, *"the terminal phase was
published while the single-flight latch was still held: a caller that polls
status and then sends gets Busy for a turn that is over"*. One body, one
assertion, no cascade.

**CTL-2 / A2 — the solo controls at the tip** (arming absent: no contention).
The pin body 10 runs / 10 pass; the hostile-id body 10 runs / 10 pass.

**CTL-3 — untouched siblings.** In CI's own arrangement at the tip — 5 full
workspace `cargo test` runs and the four-suite battery — NO body failed at all.
Under the 12x amplification below, the only bodies that fail at the tip are the
two the lane itself filed as `T-288`/`T-289`, and they fail at the base at
comparable rates. Nothing new started flaking, so **K8 does not fire**.

**CTL-5 — wall clock, the K4 tell.** Full-workspace `cargo test`, default
threads: base **45, 35, 36, 35, 35** s; tip **35, 35, 34, 35, 35** s. No slowdown, so no
hidden serialization behind the absence of a `#[serial]` attribute.

**M2 — revert ONLY the `spawn_cold_start` hunk, leaving the `spawn_turn` fix in
place. RESULT: the whole target is GREEN, 10 of 10 full-target runs** (94
passed / 0 failed / 1 ignored / 2 skipped). **Nothing in the suite kills that
hunk**: the cold-start half of the sweep is unpinned. Reported as a finding and
filed as a card; why it is not assigned as a correction is immediately below.

**THE CONTROL I PROPOSED AND THEN WITHDREW — and the reason changed once I
measured it properly, so both readings are here.** I wrote the exact mirror of
the executor's pin, `a_settled_cold_start_has_already_released_the_single_flight_latch`
— spin-poll `cold_start_status()` with no sleep, then ask again, `Busy` is the
defect — and graded it against BOTH implementations before proposing it, which
is this seat's own obligation (`T-210`; verifier.md's *ask of your own
suggestions what you ask of the diff*):

| arrangement | against the FIX | against M2 (the property ABSENT) |
|---|---|---|
| the body alone, idle, 10 runs | 10 green | **10 green — it does not red** |
| full target, idle | 95 passed / 0 failed | 94+1 passed / 0 failed |
| 12x oversubscription, 180 target runs | — | **3 red**, with the intended message |

So it is not vacuous — under 12x it dies, at
`tests/agent_runner.rs`'s cold-latch assertion, saying *"the terminal cold-start
phase was published while the single-flight latch was still held"*. **But a
control that reds 3 times in 180 runs and only under 12x
oversubscription is not a pin a merge can drill**: `roles/integrator.md`'s step
2b re-runs a correction's mutant and reads the result, and this one would report
SURVIVED almost every time. Assigning it would hand the next seat a body that
looks broken. **So I do not assign it and I do not commit it** — the finding
goes to a card, with both readings on it.

WHY the window is so much smaller here, from the code: in `spawn_turn` the
base-shape gap between *terminal phase visible* and *latch free* contained the
tail `println!` — a `format!("{error:?}")` through `sanitize_for_log` plus a
lock on stdout that ten test threads contend for, which is the amplifier that
makes this class visible under the full parallel run at all. In
`spawn_cold_start` all three `println!`s sit INSIDE the `cold` guard's own
scope, so the gap there is the drop of `outcome` and `emitter` and nothing else
— shorter than the poller's own path back out of the lock, out of the loop, into
`cold_start` and through the compare-exchange, and reachable only when the
scheduler preempts the worker inside it. The sweep is correct and welcome; what
it lacks is an instrument proportionate to it.

### THE ASSIGNED CORRECTION — one, and it owes no mutant block

**CORRECTION 1 — the pin's own failure message is garbled, and the message is
the point of the pin.** The panic string in
`a_settled_turn_has_already_released_the_single_flight_latch` carries a run of
fourteen spaces in the middle of its sentence — the residue of a wrapped
string literal that lost its `\` continuation — so the message a future seat
reads is *"…was still held:              a caller that polls…"*. That is
exactly what I saw printed when I killed M1, and it undercuts the lane's own
stated purpose: the notes say *"The seat that met this red twice had to
rebuild the outcome from the module; the next one reads it."* Repair, exact
text, no line number:

    OLD: "the terminal phase was published while the single-flight latch was still held:              a caller that polls status and then sends gets Busy for a turn that is over"
    NEW: "the terminal phase was published while the single-flight latch was still held: \
          a caller that polls status and then sends gets Busy for a turn that is over"

**CORRECTION COUNT 1, MUTANT BLOCK COUNT 0, and the shortfall is explained
rather than left to be inferred**: this is a wording change with NO PROPERTY TO
PIN, which `method/roles/verifier.md` 5b provides for in as many words. There
is no assertion whose subject moves, so a block would name a mutant that
measures nothing. **No body was committed for it and none is owed.**

### The four-suite battery, run ONCE at the tip I was sent, through the blessed runner

    gate-verdict suite=parser exit=0 bodies=389  targets=1  ref=fb8379d verdict=GREEN reason=ok
    gate-verdict suite=app    exit=0 bodies=1171 targets=1  ref=fb8379d verdict=GREEN reason=ok
    gate-verdict suite=rust   exit=0 bodies=655  targets=18 ref=fb8379d verdict=GREEN reason=ok
    gate-verdict suite=e2e    exit=0 bodies=794  targets=1  ref=fb8379d verdict=GREEN reason=ok

e2e on `SUPERTASKR_E2E_PORT=25281`. Counts read beside the exits, never the exits
alone. These four are byte-for-byte the counts the executor reports at
`b0a44c1`, independently re-derived here at `fb8379d`.

### §5 — the measurement, in CI's own arrangement

`cargo test` from `app/src-tauri/`, both workspace crates, DEFAULT test threads:

| arrangement | tree | runs | result |
|---|---|---|---|
| **A3-1** `agent_runner` target alone, sequential, idle | base `1b5061e` | **30** | **0 reds** |
| **A3-2** full workspace `cargo test` | base `1b5061e` | **5** | **0 reds**; exit 0 each; 45/35/36/35/35 s |
| **A1** full workspace `cargo test` | tip `fb8379d` | **5** | **0 reds**; exit 0 each; 35/35/34/35/35 s; 0 failing targets |

**In the idle arrangements the flake does not appear at all**, which is what the
attack set predicted and pre-committed to. It appears under load, and **CTL-1
IS AVAILABLE**: see the reproduction immediately below.

### A4 — THE REPRODUCTION, under a disclosed load amplification

12 concurrent copies of the whole `agent_runner` target on this 10-core Mac,
30 rounds = **360 target runs per tree**, 435 s for the base set. This is the
instrument, and it is stated as a deviation rather than laundered: it is not
`cargo test`, and 12x oversubscription is far past anything CI does.

**AT THE BASE `1b5061e` the card's own body REDS: 4 reds in 360**, and the panic
is byte-for-byte the one this card was filed on —
`tests/agent_runner.rs:3623:5`, *assertion failed: `matches!(agent::send_turn(&h.watch,
&h.agent, "answer".into()), SendOutcome::NoSession)`* — the same text the T-281
bench took at `d086c73` and CI run `34347086580` took on `0a1c7cf`.

**AND THE SAME 360 RUNS FOUND THE DEFECT IN A SECOND BODY THE LANE DID NOT
FIND**: `spawn_turn_resume_round_trip_with_the_prompt_on_stdin`, 1 in 360, at
`tests/agent_runner.rs:507:18` — ***"expected Accepted, got Busy"***. Different
body, different assertion, same cause: settle, then send, and be told `Busy` for
a turn that is over. That is an independent confirmation of the mechanism which
owes nothing to the notes, and it means the fix repairs a defect that bit at
least two bodies, not one.

**AT THE TIP `fb8379d`, the identical instrument, the identical 360 runs: 0 reds on the card's body and 0 on the second one.** The new pin `a_settled_turn_has_already_released_the_single_flight_latch` red 0 times in 360 under that load as well.

Three other bodies red under the same load and are NOT this card's — they are
the same at base and at tip, so the fix neither causes nor cures them:
  `the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists` — base 110/360, tip 73/360
  `a_cancelled_interview_leaves_a_dead_child_an_untouched_docs_and_a_resumable_project` — base 54/360, tip 40/360
  `a_relative_search_path_element_reaches_no_process` — base 5/360, tip 5/360

The first two are the lane's own `T-288` and `T-289`, independently reproduced
here. The third the lane did NOT file; I file it as `T-281-s12`.

**TWO K8 CANDIDATES, EXAMINED AND DISMISSED WITH REASONS RATHER THAN WAVED OFF.**
`the_exit_hook_reaps_the_turns_process_group` (3 at the tip, 0 at the base) and
`a_zombie_answers_pid_alive_and_that_is_why_the_grace_needed_two_limbs` (1 at
the tip, 0 at the base) are the only bodies that fail at the tip and not at the
base. I looked at both rather than report the asymmetry as noise. The first
prints *"quitting the app leaves no grandchild"* beside the runner's own
`turn 1 process group … left after 303 ms (reaped=true groupEmpty=false
sigkilled=true)` — a 300 ms reap grace not paid because a starved grandchild was
never scheduled to exit. Both are in the reap/grace family, which is exactly the
mechanism the lane's own `T-289` describes, and whose flagship body fails 110
times at the base against 73 at the tip. **There is no path from a latch
released one mutex earlier to a process-group reap deadline**: no `Busy`, no
phase, no `send_turn` anywhere in either. I record the asymmetry, attribute it
to that family rather than to the diff, and say plainly that 12x
oversubscription on a 10-core Mac is not an arrangement in which a starvation
body's rate is stable between two sets of 360 — the T-289 body's own 110-vs-73
is the scale of that instability.

**CTL-1 IS THEREFORE AVAILABLE, and it is the strongest form the set named**:
red at base, green at head, on the same instrument, in the same session, with
the base's red carrying the card's own assertion text. Approval rests on that,
on the mechanism confirmed from the base text (§3), and on M1 — never on green
runs alone.

### The three criteria, taken literally

**C1 — "the body SHALL pass deterministically … the race, the shared state or
the timing assumption FOUND AND REMOVED, named in the notes with the
measurement." MET, all three obligations.**
(a) *deterministic pass*: 5 of 5 full-workspace `cargo test` at the tip, the
four-suite battery GREEN, and the 12x amplification above.
(b) *found and REMOVED, not masked* — the one that matters, carried by reading
plus M1. Nothing in the kill set fires; the removal is two `drop(flight)`
statements whose effect is an ordering, verified sound (S6); and M1 shows the
property dies the instant the named hunk is reverted.
(c) *the notes NAME it with the measurement*: they do, in a seven-row table with
a tree and a command per row. The card asked for "ten times each, all green";
the notes give a STRONGER arrangement — the same 50 ms stall re-injected at both
candidate positions, 0 red of 20 — plus four ten-run batteries at the final
tree. I re-derived the plain form myself rather than accept it.

**C2 — "the test SHALL still refuse a hostile session id; the assertion's
subject unchanged, only its arrangement moves." MET.** The accepted set is
exactly `{SendOutcome::NoSession}` before and after; every other assertion in
the body is byte-identical; `SendOutcome`'s variants have not moved. Refused by
reading, as the set required — a loosened assertion is green by construction and
no number of runs could have told me.

**C3 — "IF it is in the runner THEN the notes SHALL say which state two tests
shared." DISCHARGED by the truthful answer.** The antecedent fired (the fix is
in `mod.rs`), and the notes decline the consequent's premise explicitly rather
than inventing a second test: no two tests shared state; the two pieces of
shared state are `Inner.phase` and `AgentState.running`, shared between the
worker thread and every caller. My attack set pre-committed, before any of this
was visible, to accepting exactly that — "because C3's antecedent is about
locating the flake, not about forcing a two-test story."

### Findings that are NOT failures — filed as cards, never folded into this verdict

Three, not two: the load run turned up one the lane never saw.

- **`T-281-s10`** — `spawn_cold_start`'s half of the ordering is unpinned
  (M2: 10 of 10 green with that hunk reverted), and the obvious mirror body
  CANNOT be made to fail (10 of 10 pass against the reverted code). The card
  carries both readings, the reason from the code, and three candidate
  instruments — including the honest one, recording in the file that the
  ordering is held by reading only.
- **`T-281-s11`** — the CLAIM side of the same two-state publication is still
  two steps. All five `begin_turn()` callers take the latch first and publish
  `Phase::Running` later, and in `send_turn` the gap contains
  `runner::resolve_cli`'s disk probe — a LONGER window than the one this card
  closed. Derived from the code and NOT measured, which the card says on its
  face.
- **`T-281-s12`** — `a_relative_search_path_element_reaches_no_process`'s own
  POSITIVE CONTROL does not arm under oversubscription: it asserts the tattle
  file exists the instant `resolve_cli` returns, and nothing orders the probed
  child's write against that return. Seen at the BASE ref, so it is not this
  lane's doing, and neither `T-288` nor `T-289` covers it.

### What I did not do, and why

- I did not run `index --check` at this bench: it has built with cargo, so its
  `target/` is inside the graph walk and the number would be about the bench,
  not the tree (CONVENTIONS' GRAPH BAND clause). The regen is the integrator's;
  the bench correctly carries no regenerated graph.
- I did not touch the lane worktree, the integration checkout or any other
  lane's tree. Every mutant was built in a `git clone --shared` under the
  scratchpad, each with its own `target/` INSIDE itself. Nothing was pushed.
  The bench is left standing.
- Port 1420 was read exactly once with the one permitted command
  (`lsof -nP -iTCP:1420 -sTCP:LISTEN`) and is HELD by the human's app (`node`,
  `[::1]:1420`, the same pid before and after my boot check). It was never
  probed, never bound, never contended.

### The standing gates, re-derived at this tip rather than read off the report

- **BOOT GATE — FIRES** (`app/src-tauri/**`), and I ran it myself rather than
  take the lane's word: `SUPERTASKR_BOOT_PORT=25281 npm run boot:check` from
  `tools/e2e/` — **exit 0**, both lines seen,
  `[supertaskr] project folder: /Users/ujju/Projects/nputer-V-T-281-s8` and
  `[supertaskr] window "main" created`, tree stopped on SIGTERM with no SIGKILL
  escalation. **A note for the seat: the brief's rule (a) says this gate aborts
  while 1420 is held. It does not** — the abort is on ITS OWN port, and
  `SUPERTASKR_BOOT_PORT` is what moves it; 1420 was held by the human's app
  throughout (`node`, pid unchanged before and after) and the check on 25281 was
  unaffected.
- **GRAPH REGEN — FIRES**, integrator's at the merge; the bench carries no
  regenerated graph, correctly.
- **DOCS GATE — FIRES** (six paths under `docs/` once my own three cards land),
  and it is run at MY tip in step 7 below.
- **METHOD EVAL GATE — NOW FIRES, AND IT DID NOT FOR THE EXECUTOR'S DIFF.** The
  report correctly derives it as NOT OWED at `fb8379d`: no `method/**` path, and
  no line matching the citation grammar. **This verdict adds the citation line**
  the grammar names, plus two ground-truth digests beside it, so the merge now
  owes `node tools/method-evals/run.mjs` with its exit recorded in the
  checkpoint. Named here because the integrator will otherwise inherit the
  executor's correct-at-the-time answer.

### The mechanical proof behind S2 and K5

Brace-matched out of both trees and compared byte for byte, so it is not a
reading:

    pub fn send_turn(     base 2306 B   tip 2306 B   IDENTICAL
    fn begin_turn(        base  227 B   tip  227 B   IDENTICAL
    pub fn status(        base  553 B   tip  553 B   IDENTICAL
    pub enum SendOutcome  base  456 B   tip  456 B   IDENTICAL

Every observable this card's assertion depends on — what `send_turn` accepts,
how the latch is claimed, how the phase is read, and the outcome vocabulary
itself — is unchanged. The whole diff to `mod.rs` is where the latch is
RELEASED, inside two spawner closures.

### Step 7 — the gates my own commits could move

This verdict and the three cards are WRITES, and prose is a code input here.
The gates they owe are run at the tip THOSE commits create, which is by
definition later than this entry, so their result is recorded in the bench
handoff `$S/verdict-T-281-s8.md` and in this seat's completion message rather
than inside the commit that would invalidate its own figure. What is owed, asked
of the gate rather than predicted: `node tools/e2e/scripts/docs-gate.mjs` on the
four card paths I write, and the three suites it names for them — `npx vitest
run` from `lib/parser/`, `npm test` from `app/`, and `npm test` from
`tools/e2e/`, all three through the blessed runner. The rust leg is not among
them: my commits touch no Rust.

Every figure in this entry is measured at `fb8379d2468c2f06033ea093e1420cf57d2fecff`
except where a base ref is named beside it.

— claude-opus-5@subagent (verifier, phase 2)
