---
id: T-088-s4
title: The docs-watcher tests bound an FSEvents wait on a wall clock, so the size of the build cache decides whether the suite is green — recv_emit wants a deterministic rendezvous
feature: F-02
milestone: 4
priority: 12
size: M
status: verifying
blocked_by: [T-153]
touches: [app-shell]
suggested_by: integrator claude-opus-5 @T-088
builder: claude-opus-5
verifier:
built_by: "claude-opus-5 @fresh (executor lane)"
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29.** The card's own armed
unpark trigger fired and went on firing — three red in six full-suite
runs at ONE integration, over trees whose Rust is byte-identical — and
`docs/STATE.md` now carries it as the FIRST standing hazard every
session must be briefed about. The briefing cost is being paid on every
dispatch and twice per integration, which is the interruption the
parking note said it was waiting for. The record below is kept verbatim,
including its own two retractions: it is the measurement, and the
correction history is half of what it teaches.

`blocked_by: [T-153]` is not ceremony. T-153 is live in
`app/src-tauri/src/docs_watch.rs` RIGHT NOW, holds `app-shell`, and its
finding 1 proposes the same shape from a different direction — *"recv
until an emit satisfies the predicate (or quiescence), bounded by the
existing timeout"*. That fix keeps the wall-clock bound this card is
about, so the two do not collide in intent; they collide in the file.
Read T-153's landing before starting, and re-derive what survives it.

## Acceptance criteria

- WHEN a docs-watcher test waits for an emit THE wait SHALL be a
  deterministic rendezvous rather than a wall-clock deadline, fixed at
  the HELPER rather than at any one body — the card measures 20 call
  sites across 11 bodies in that module, plus six further `recv_timeout`
  waits at 5 and 10 seconds.
- THE deliberate 1200 ms NEGATIVE wait SHALL keep a bound, because a
  rendezvous cannot express "and nothing arrives"; the diff SHALL say
  which waits are which and why.
- THE bound SHALL NOT simply be widened. A wider deadline buys a slower
  suite that fails anyway on a slower machine; this card refuses that
  arm twice and the refusal is a criterion, not advice.
- WHEN the change lands THE lane SHALL report `cargo test
  --no-fail-fast` from `app/src-tauri/`, unpiped, with the lib suite's
  own `finished in` beside every run, taken under DELIBERATE load rather
  than on an idle machine — this card's own control shows a green run on
  an idle machine proves nothing, and the healthy/degraded bands
  (every green under 9.5s, every red over 14.6s, nothing between) are
  the reading to compare against.
- IF a wait that needs fixing sits outside `app-shell` THEN it SHALL be
  recorded and routed rather than made.

## The record, kept verbatim

> **SETTLED BY CONTROLLED EXPERIMENT, 2026-08-25, architect, at main
> `82c69a8`, on @human's instruction. THIS IS NOT A FLAKE AND NEVER WAS.**
> Every earlier account on this card — including its own title, which is
> left wrong on purpose so the correction is legible — treats it as a
> load-sensitive race and reports honest tallies (1-in-8, 3-in-12,
> 3-in-5, 1-in-3). **Those tallies were erratic because they mixed
> checkouts**, which T-110's integrator diagnosed and this measures.
>
> **THE EXPERIMENT.** Ten bare `cargo test --no-fail-fast` runs in the
> MAIN checkout, five either side of a single `cargo clean`, each
> recording its own unpiped exit, its pass/fail summed across every
> `test result:` line, the lib suite's own `finished in`, and the
> 1-minute load average AT THE START of the run:
>
> | | red rate | mean lib suite | load during runs |
> |---|---|---|---|
> | **before** (target 8.7 GB / 78 173 files) | **4 of 5 — 80%** | **13.66 s** | 3.45–3.83 |
> | **after** (target 2.3 GB, freshly built) | **0 of 5 — 0%** | **3.94 s** | 5.59–6.74 |
>
> **THE LOAD RAN THE WRONG WAY, WHICH IS WHAT MAKES THIS CONCLUSIVE.**
> The after-phase ran under HIGHER load than the before-phase and still
> went green five for five. A load-sensitive race cannot behave that way;
> the "concurrent load" in this card's title is refuted by its own
> control.
>
> **THE DISTRIBUTION IS BIMODAL WITH NOTHING IN THE GAP**, reproducing
> what T-110's and T-124's integrators each reported from ordinary suite
> output. Before: one run at **8.37 s** (green), four at **14.70–15.19 s**
> (all red). After: **3.80, 3.94, 3.95, 3.95, 4.05** — a tight cluster.
> **Even the before-phase GREEN run was degraded**: 8.37 s against a
> healthy 3.94 s. Every figure this project recorded for this suite over
> two days was taken on a slow machine, so no earlier "green" reading
> should be treated as a baseline.
>
> **THE COST OF THE FIX IS 38 SECONDS.** `cargo clean` removed 78 173
> files in **6 s** (cargo reported **21.8 GiB**, against `du -sh`'s
> **8.7 G** — the two disagree and only cargo's figure counts what it
> actually deleted). The cold rebuild via `cargo test --no-run` took
> **32 s** and produced a **2.3 GB** target. That is the whole price.
>
> **THE MECHANISM IS STILL UNEXPLAINED, AND THAT IS STATED RATHER THAN
> GLOSSED.** A test binary should not run 3.5x slower because the
> directory beside it holds 78 000 files instead of a fresh build's set.
> Accumulated incremental-compilation state is the obvious suspect and it
> is NOT verified here. **The correlation is controlled; the causation is
> not.** Anyone who explains it should write the explanation on this card.
>
> **THIS IS SYMPTOM RELIEF WITH A HALF-LIFE.** The cache will re-accumulate
> and the cliff will return, so a green suite after a clean is not
> evidence the defect is fixed. **The durable fix is the one arm (a)
> already recommends below** — a deterministic rendezvous instead of a
> wall-clock bound — which removes the cliff's ability to matter at any
> cache size. Arm (a) stands, and **DO NOT "FIX" IT BY WIDENING THE
> TIMEOUT** still stands: a wider bound buys a slower suite that fails
> anyway on a slow enough machine.
>
> **A COROLLARY WORTH MORE THAN THIS CARD — AND IT HAS NOW BEEN
> MEASURED.** Three other intermittents were filed while the machine was
> in this state: `T-124-s3`, the `agent_runner.rs:2926`
> hostile-session-id body recorded in T-052's checkpoint, and the "flake"
> tallies in tonight's checkpoints. **Ten further clean runs were added
> to the five above — 15 consecutive runs on the fresh cache, 455/0/3
> every time, mean lib 3.97 s, zero failures of ANY body.** Not one of
> the three reproduced.
>
> **THE ARITHMETIC, because "it did not reproduce" is worth different
> amounts for each of them.** If each observed rate had held on a clean
> cache, the chance of seeing ZERO reds in 15 runs would be:
>
> | body | rate observed on the degraded cache | P(0 in 15 clean) |
> |---|---|---|
> | this one | 4 in 5 | **0.0000** |
> | `agent_runner.rs:2926` hostile session id | 1 in 3 | **0.0023** |
> | `T-124-s3` result-only denial | 1 in 9 (pooled) | **0.17** |
>
> So **this body is settled**, while `T-124-s3` is not. At one in nine,
> fifteen clean runs is exactly the sample size that proves nothing: a
> genuine 1-in-9 defect survives it 17 times out of 100. **Do not retire
> `T-124-s3` on this evidence**; it needs its own run of forty or a
> mechanism.
>
> **AND THE HOSTILE-SESSION-ID SETTLEMENT WAS WRONG — RETRACTED WITHIN
> THE HOUR BY T-086's LANE.** The paragraph above claimed it settled "at
> better than 400-to-1". **It is not settled.** T-086's executor, on a
> CLEAN cache, saw `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
> (`agent_runner.rs:2926`) red **1 time in 4** — and the decisive detail
> is that it redded while the watcher body was **GREEN** and the lib
> suite finished in **3.97 s**, squarely inside the healthy band this
> card establishes. **A clean cache does not stop it.**
>
> **THE ARITHMETIC, REDONE HONESTLY.** Pooling both samples gives **1 red
> in 19 clean runs = 0.053**. At that true rate, the chance my fifteen
> runs showed zero is **0.44** — so seeing nothing was the coin landing
> the ordinary way, not evidence of absence. The 0.0023 figure above was
> computed against the DEGRADED-cache rate of 1-in-3, which assumed the
> very thing under test: that the cache was the cause. **It was circular
> and it read as decisive.**
>
> **THIS IS EXACTLY THE FAILURE THE PARAGRAPH ABOVE WARNED AGAINST**, in
> the same commit that warned against it: *"the tempting move — one clean
> sweep, three findings closed — is how a real defect gets filed away."*
> Three findings were reviewed; one was correctly held open, one was
> correctly settled, and one was filed away on circular arithmetic. **The
> lesson is not "be more careful" but a rule: a re-measurement can only
> settle a finding whose MECHANISM the intervention addresses.** The
> cache explains a body that fails on a wall-clock bound; it never
> explained a session-id body, and nobody checked whether it should have.
> `T-086-s1` carries the refutation and its fence is `[app-agent]`.

> **UNPARKED 2026-08-25 AT T-010's CHECKPOINT — THE ARMED TRIGGER FIRED,
> EXACTLY AS WRITTEN.** *"UNPARK THE MOMENT IT REDS A VERDICT OR A MERGE
> — not a lane's own re-run … but the first time it costs a verifier a
> false REJECTED or an integrator a false red at a checkpoint."* It cost
> one. `cargo test --no-fail-fast` from `app/src-tauri/`, run after the
> checkpoint's doc writes at T-010's merge `d64c673`, exited **101** with
> **407 passed / 1 failed / 3 ignored** over 15 `test result:` lines, and
> the single failure was this body with the same message at the same
> line: *"expected a docs-changed emit: Timeout"*, `src/docs_watch.rs`.
> **THAT IT WAS NOT THE MERGE IS DERIVED, NOT ASSUMED**: the merge's own
> diff over `app/src-tauri/src/**` is **0 files** — 32 of its 33
> `app/src-tauri/**` paths are under `crates/nputer-index/**` and the
> 33rd is `Cargo.lock` — and the SAME suite had already run
> **408 / 0 / 3, exit 0**
> at that merge, on byte-identical Rust. The immediate full re-run was
> **408 / 0 / 3, exit 0** again, and the body alone re-ran green.
> **AND IT FIRED TWICE MORE AT THE SAME CHECKPOINT**, same body, same
> message. **THE FINAL TALLY AT THIS ONE INTEGRATION IS 3 RED IN 6
> FULL-SUITE RUNS** — three at 408 / 0 / 3 exit 0, two at 407 / 1 / 3 and
> one at 406 / 2 / 3, over trees whose Rust is byte-identical — beside **4
> isolated re-runs of the named body, all green**, and one module-scoped
> run at 52 / 1. That is an order of magnitude above the **1-in-8** rate
> that supported parking, and the two tallies must be kept apart rather
> than added: T-088's is 1 red in 2 full runs on 2026-08-24. The load condition
> was the ordinary one this file predicted: three lanes live (T-123,
> T-110, T-031, one of them drilling) plus the human's `tauri dev`, on the
> largest merge this repository has taken. **A CHECKPOINT CANNOT NOW
> CLOSE THIS SUITE WITHOUT RE-RUNNING IT**, which is precisely the cost
> the parking note said was already being paid on every dispatch — it is
> now being paid twice per integration. Status returns to `suggested`
> so triage makes the call; **the fix is NOT the integrator's** and could
> not be made here anyway — the fence is `[app-shell]`, held live by
> T-123. The two arms below stand unchanged, (a) still recommended, and
> **DO NOT "FIX" IT BY WIDENING THE TIMEOUT** still stands.
>
> **AND THE FINDING IS WIDER THAN THE BODY IT NAMES — A SECOND MEMBER OF
> THE SAME CLASS WENT RED AT THIS SAME CHECKPOINT.** A third full run,
> over the final tree, exited **101 at 406 / 2 / 3** with
> `docs_watch::tests::docs_created_after_a_docsless_startup_arms_and_emits`
> failing beside it, **at the SAME panic site, `src/docs_watch.rs:1523`,
> with the same message**. So the mechanism is not one body but one
> HELPER: `recv_emit` — `rx.recv_timeout(Duration::from_secs(10))
> .expect("expected a docs-changed emit")` — a wall-clock bound on
> FSEvents delivery, called at **20 sites across 11 test bodies** in that
> module, beside six further `recv_timeout` waits in the same tests at 5
> and 10 seconds and one deliberate **1200 ms NEGATIVE** wait, which is
> the one place a longer bound would be actively WRONG. **Arm (a) should
> therefore widen a HELPER and not a body, and those eleven callers are
> the blast radius to quote.** A module-scoped re-run reproduced it in the
> same window (`cargo test -p nputer --lib docs_watch::tests`, **52 passed
> / 1 failed**), while the two bodies re-run in isolation are green every
> time — which locates the cause in concurrency with the rest of the
> suite rather than in either body. This is exactly what the parking note
> meant by *"a REAL regression arriving during a busy window reads exactly
> like this"*: the class is now two bodies wide.
>
> **PARKED at the eighth triage, 2026-08-25 — and the trigger is
> ARMED rather than hypothetical.** A timeout-based assertion that reds
> under load is a real test defect, and the condition that produces it is
> now the ORDINARY case: five lanes ran concurrently on the night this
> was parked, against the one or two this suite was written under.
> **UNPARK THE MOMENT IT REDS A VERDICT OR A MERGE** — not a lane's own
> re-run, which every session has so far handled correctly with an honest
> tally, but the first time it costs a verifier a false REJECTED or an
> integrator a false red at a checkpoint. **UNPARK ANYWAY AT THE NEXT
> PLANNING PASS** if that has not happened, because a flake nobody has
> been bitten by is still a flake every session must now be briefed
> about, and that briefing cost is already being paid on every dispatch.
> Promotion is deliberately NOT taken tonight for one reason: every
> observation so far is an honest tally of 1 in 8 with no verdict harmed,
> so the evidence supports a fix but not an interruption. **DO NOT
> "FIX" IT BY WIDENING THE TIMEOUT** — that converts a visible flake into
> a slow suite that still fails on a loaded machine; the honest close is
> a deterministic rendezvous, which is what the surrounding code already
> uses everywhere else.

**Observed at T-088's merge `bd5864b`, 2026-08-24.** Bare `cargo test
--no-fail-fast` from `app/src-tauri/` exited **101** with exactly one
failure:

    ---- docs_watch::tests::startup_arm_watches_the_initial_root ----
    panicked at src/docs_watch.rs:1523:14:
    expected a docs-changed emit: Timeout

**IT CANNOT BE THE MERGE, AND THAT WAS DERIVED RATHER THAN ASSUMED.**
`git diff --name-only 9b03ae6..bd5864b -- app/src-tauri/` is **0 files**
and the merge carries **0** manifests or lockfiles, so no Rust byte and
no dependency moved. A Rust test cannot change behaviour across a diff
that contains no Rust.

**THE HONEST TALLY, stated the way T-061-s4's was**: 1 red in **2** full
suite runs; the immediate full re-run was **382 passed / 0 failed / 3
ignored, exit 0** over 15 `test result:` lines, identical to main's
figure and to both of the lane's own runs. The failing test alone was
then re-run **5 times: 5 green, 0 red**. So the honest statement is *one
red in eight observations of this body*, not "it is fine".

**THE CONDITION IS THE PART WORTH FILING.** The red landed while
**three lanes were running suites concurrently** — T-088 integrating,
T-113 and T-090 both in Phase 1 — on top of the human's live `tauri
dev`. The body arms an FSEvents watch on a temp directory and waits for
a debounced `docs-changed` emit; the debounce is 250 ms and the
assertion is a bounded wait that reports `Timeout`. That is a wall-clock
race against machine load, and this repository now routinely runs three
lanes at once, so the condition is becoming ORDINARY rather than
exotic. A timing test that only reds when the machine is busy is
worst-behaved exactly when a checkpoint is being written.

**Why it matters more than one flake.** The T-061-s4 kill-path flake is
the only other one on record here, and every checkpoint since has had to
state whether it fired. A second one in the same crate means "was the
red mine?" is now a question every integrator must answer under load,
by hand, from a suite that gives no signal about which kind of failure
it is. The cost is not the re-run; it is that a REAL regression arriving
during a busy window reads exactly like this.

**Two arms, and the first is honest rather than clever.** (a) Give the
wait a load-tolerant bound — the deadline is a constant this body can
own, and CONVENTIONS already warns that *a test parametrised by the
constant it checks cannot pin that constant* (T-063), so the bound and
the pin must stay separate. (b) Mark the timing-sensitive watcher bodies
as a named group so a checkpoint can state "the flaky group ran N times,
all green" instead of re-deriving the question each time. **Recommend
(a) first**, with the measurement that decides the number taken under
deliberate load rather than on an idle machine. Fence `[app-shell]`
(`app/src-tauri/src/docs_watch.rs` is C-10's, whose slug is `app-shell`).
It owes `cargo test`.

## Implementation notes
<!-- executor appends before finishing -->

**Built by executor claude-opus-5 on branch
`task/T-088-s4-the-fsevents-wait-is-bound-to-a-wall-clock`, worktree
`/Users/ujju/Projects/nputer-T-088-s4`, cut at `dd6b723`.** One file
changed: `app/src-tauri/src/docs_watch.rs`.

### THE MECHANISM, which this card asked anyone who found it to write here

The card says in as many words that the cause is unexplained — *"A test
binary should not run 3.5x slower because the directory beside it holds
78 000 files… Accumulated incremental-compilation state is the obvious
suspect and it is NOT verified here. The correlation is controlled; the
causation is not."*

**It is not the cache, and it was never a race in the body. It is a
missing rendezvous at SPAWN, and the code confessed to it in a comment.**

`spawn_watcher_thread` returns the instant `std::thread::spawn` returns.
The startup arm runs *afterwards*, inside `run_watcher`, before its
control loop is entered. So `live_state(Some(root))` handed a body a
watcher that **might not be armed yet**, and the body's own comment said
so:

> // The initial arm is asynchronous (no rendezvous at spawn), so the
> // very first write can race the baseline collect and be suppressed;
> // let that window pass, then a further change MUST emit.

Its mitigation was `std::thread::sleep(DEBOUNCE * 4)` — one second of
wall clock, betting the race had been won.

**When that bet lost, the write was MISSED, not delayed.** No bound,
however wide, collects an event that was never generated. That single
fact explains every observation on this card:

- **why widening never helped** — the card refuses that arm twice on
  instinct; this is the reason it was right;
- **why the distribution is bimodal with nothing in the gap** — a body
  either armed in time (healthy ~3.94 s suite) or waited out the entire
  10 s `EMIT_BUDGET` over an emit that was never coming. 3.94 + 10 =
  13.94 against measured reds of **14.70–15.19 s**. The gap in the
  distribution *is* the budget;
- **why the cache correlated without causing** — a large `target/` makes
  the machine slow enough to schedule the spawned thread late. Cache size
  is one of many ways to lose the race, which is why cleaning helped and
  why the cliff kept returning;
- **why isolated re-runs of the named body were green every time** — a
  lone body wins the race essentially always.

**AND THE CLASS IS EXACTLY TWO BODIES, DERIVED RATHER THAN GUESSED.**
Exactly two of the 24 `live_state` call sites pass `Some(root)` — i.e.
arm at startup:

    grep -c '= live_state(Some' app/src-tauri/src/docs_watch.rs   -> 2

and they are precisely the two bodies this card names as red:
`startup_arm_watches_the_initial_root` and
`docs_created_after_a_docsless_startup_arms_and_emits`. Every other body
arms through `apply_pick` / `apply_genesis_pick`, which have carried an
`ack` rendezvous since T-007 and T-026 — *"what the surrounding code
already uses everywhere else"*, exactly as this card put it.

### THE FIX

`WatchCtl::Ping { ack }` (`#[cfg(test)]`) is a **barrier on the watcher's
control loop**. `run_watcher`'s loop is single-threaded and FIFO over ONE
channel that carries both control messages and the debounced fs batches
(`spawn_watcher_thread` hands the debouncer a clone of the same `tx`), so
an answered `Ping` proves every message enqueued before it has been
HANDLED — and a `Ping` sent immediately after the spawn proves the
startup arm is done, because that arm runs before the loop is entered.
`live_state` now blocks on it, so all **24** call sites get the
rendezvous, not just the two that were failing.

It is `#[cfg(test)]` because the shipped binary has no caller for it; the
FIFO ordering the rendezvous rests on is identical in both builds.

### THE WAIT TAXONOMY — which waits are which, and why (criterion 2)

Census re-derived at my own refs: **before = `dd6b723`**, **after =
`293915f`**.

| wait | before | after | disposition |
|---|---|---|---|
| `recv_until` helper (`EMIT_BUDGET` 10 s) | 21 call sites / 11 bodies | 21 call sites / 11 bodies | `recv_timeout` → **`recv()`**; `EMIT_BUDGET` **deleted, not widened** |
| body-level `recv_timeout` on a **synchronous** sink | 4 (at 5 s) | 0 | → **`try_recv()`** — strictly stronger |
| body-level `recv_timeout`, failure-mode guards | 2 (10 s, 5 s) | 2 | **KEEP** — classified in the diff |
| the deliberate **NEGATIVE** wait | 1 (1200 ms) | 1 | **KEEP** — the card's own exception |
| `settle()` / `sleep(DEBOUNCE * 4)` | 5 call sites + 1 inline | **1** | 5 removed; the survivor serves the negative |
| `live_state` arm rendezvous | 0 | **1 helper, 24 sites** | new |

**The three bounds that survive, and why each is not the thing this card
removed:**

1. **the 1200 ms NEGATIVE wait** — a rendezvous cannot express *"and
   nothing arrives"*. Note the direction of its load sensitivity: a
   slower machine gives a spurious emit MORE time to appear, so it gets
   *stricter* under load, never flakier. The `settle()` above it is part
   of the same assertion.
2. **`status_rx` (5 s)** — the assertion IS *"`project_status` does not
   block"*. That is a negative in disguise; waiting without a bound would
   assert nothing.
3. **`entered_rx` (10 s)** — a test-internal thread handshake with no
   filesystem, no debouncer and no watcher in it. `recv()` would be a
   rendezvous, but the regression it guards (`apply_picked_folder` never
   sending `Rearm`) leaves `entered_tx` alive, so the suite would HANG
   instead of failing.

**The four `try_recv` conversions are the finding inside the finding.**
The card counts *"six further `recv_timeout` waits at 5 and 10 seconds"*
as one class. Four of the six are not FSEvents waits at all: their sink
is called **synchronously by `handle_fs_batch` on the test's own thread**,
so the emit is already in the channel before the wait is reached. Their
bound described a bug it could not survive. `try_recv()` is strictly
stronger — it now pins the synchronous contract — and it is the spelling
those same bodies already use for their negative side
(`assert!(rx.try_recv().is_err())`).

### WHAT THIS COSTS, stated rather than left to be found

A watcher that is **alive but permanently silent** now hangs a positive
wait instead of failing it. Accepted, for two reasons: the window that
actually produced silence is closed by the barrier, so reaching it means
the watcher is broken rather than late; and the loud failure a real
regression most often takes — a panicking or exiting watcher thread —
still lands immediately via the channel disconnect, **measured at 0.02 s
against the 10 s the deleted deadline needed** (drill D1 below).

### EVIDENCE

**My own baseline first, because this worktree's `target/` was cold at
dispatch.** Cold `cargo test --no-run`: **exit 0**, `target/` **2.4G**.

| run | tree | exit | targets | totals | lib `finished in` | `target/` |
|---|---|---|---|---|---|---|
| A baseline | `dd6b723`, unmodified | **0** | 18 | 601 / 0 / 4 | **4.37 s** | 2.4G |
| B after | `293915f` | **0** | 18 | 601 / 0 / 4 | **4.49 s** | 3.3G |

**Criterion 4 — `cargo test --no-fail-fast` from `app/src-tauri/`,
UNPIPED, exit read from `$?` before any pipe, under DELIBERATE load.**
Eight CPU burners on a 10-core machine, on top of an ambient load already
above the card's own controlled experiment (that experiment ran at
3.45–3.83 and 5.59–6.74):

| run | exit | 1-min load AT START | targets | totals | lib `finished in` |
|---|---|---|---|---|---|
| 1 | **0** | **10.69** | 18 | 601 / 0 / 4 | **4.29 s** |
| 2 | **0** | **20.96** | 18 | 601 / 0 / 4 | **4.41 s** |
| 3 | **0** | **22.50** | 18 | 601 / 0 / 4 | **4.43 s** |

At **3–6x the load of the card's own control**, the lib suite clusters in
**0.14 s** and sits far inside the healthy band (green under 9.5 s, red
over 14.6 s). The card's degraded readings were 14.70–15.19 s.

### DRILLS

All in a detached scratch worktree at a named commit with its own
`CARGO_TARGET_DIR` inside itself, per CONVENTIONS:
`/private/tmp/nd-T-088-s4` (stem derived from the card id),
`CARGO_TARGET_DIR=/private/tmp/nd-T-088-s4/target`. No `cargo clean` was
run anywhere — three sibling lanes were live. Every mutation is ONE SIDE
ONLY (always the code under test, never an assertion and never a shared
literal), read back through `git -C <dir> diff` with its line count
printed BEFORE the verdict (shape TEN), restored with both sides named
(`git restore --source=<ref> --staged --worktree`), and proven by sha256.

**THE MECHANISM CONTROL — the pair that settles the card.** One mutation,
applied identically to both trees: a `std::thread::sleep(3s)` at the top
of `run_watcher`, which is what a loaded machine does to a freshly
spawned thread, only deterministically.

| drill | tree | exit | result | wall |
|---|---|---|---|---|
| **M1** | new (`293915f`) + late arm | **0** | **59 passed / 0 failed** | 26.32 s |
| **M2** | old (`dd6b723`) + late arm | **101** | **57 passed / 2 FAILED** | 37.02 s |

M2's two failures are **exactly the two bodies this card names**, both at
the old `recv_until`'s panic site `src/docs_watch.rs:1861`:

    waited 10s for a docs-changed emit where the tree carries `startup v3`;
      emits seen meanwhile: []
    waited 10s for a docs-changed emit where the late docs/ tree is collected;
      emits seen meanwhile: []

**`emits seen meanwhile: []` is the whole proof: not one emit ever
arrived.** The event was missed, not late — which is why a wider bound
was always going to buy a slower red. And M2 − M1 = **10.7 s**, one
`EMIT_BUDGET`, reproducing the card's own bimodal gap on demand.

**POISON DRILLS.**

| drill | mutation (code under test) | scope | exit | result | wall |
|---|---|---|---|---|---|
| **D1** | `run_watcher` returns before serving its loop | 1 body | 101 | **0 passed / 1 FAILED** — *"watcher thread died before answering the barrier: RecvError"* | **0.02 s** |
| **D2a** | `handle_fs_batch` stops emitting | `a_vanished_root_never_panics_the_batch_handler` | 101 | **0 / 1 FAILED** — *"the batch handler emits synchronously: Empty"* | 0.03 s |
| **D2b** | same | `a_dead_sentinel_leaves_the_existing_watch_fully_working` | 101 | **0 / 1 FAILED** — same message | 0.02 s |
| **D2c** | same | `an_empty_docs_dir_emits_exactly_once…` | 101 | **0 / 1 FAILED** — *"the arm transition must emit exactly once, synchronously: Empty"* | 0.01 s |
| **D3** | startup arm skipped ONLY for a root that already has `docs/` | **whole lib suite, 0 filtered out** | 101 | **259 passed / 1 FAILED** | 5.33 s |

**D3 is poison shape SIX answered mechanically**, per CONVENTIONS' own
instruction — *name a mutation of the code under test that this body
kills, run the WHOLE suite under it, and require the failing-body count
to be ONE.* The count is **ONE**:
`docs_watch::tests::startup_arm_watches_the_initial_root`. That is the
non-duplication proof, in the reporter's own output.

**Restoration, proven by hash rather than asserted** (sha256 of
`app/src-tauri/src/docs_watch.rs`, before mutation and after restore,
identical in every drill):

    at 293915f: 5d21d3a9fc2e4ada4db3ee731db2b306f1e2c654b0022de42a0d87e07559b637
    at dd6b723: 5ea50baa05178773c8c9a46a9126029f79120e24d782defd0b74dbbbcfaad8ff

### WHERE THE CARD AND THE BRIEF WERE WRONG (the correction clause)

1. **The card's own headline finding is superseded by this lane's
   measurement.** *"THE SIZE OF THE BUILD CACHE decides whether a test
   passes"* is a true correlation and a false cause. The cause is the
   missing rendezvous at spawn; the cache is one of many ways to lose
   that race. **This matters beyond this card**: `docs/STATE.md`'s first
   standing hazard prescribes `cargo clean` as the remedy, and that
   remedy treats a symptom whose mechanism is now closed at the source.
2. **`blocked_by: [T-153]` is discharged — T-153 has LANDED.**
   `recv_emit` no longer exists; the helper is `recv_until`. The card's
   criterion survived the landing intact, because T-153 deliberately kept
   the wall clock (*"bounded by the existing timeout"*, its own finding 1).
3. **The census moved: the card says "20 call sites across 11 bodies";
   at `dd6b723` it is 21 call sites across the same 11 bodies.** T-153
   renamed the helper and added one site.
4. **The card treats its "six further `recv_timeout` waits" as one
   class; they are two.** Four are on a synchronous path where the emit
   is already queued — see the taxonomy above.
5. **The brief's KNOWN-STALE row is confirmed as declared** (`T-187`):
   it derives `base commit: f7366770…`, while this worktree was cut at
   `dd6b723`. No OTHER brief row contradicted the tree.
6. **The brief's own retraction is confirmed** (`T-199`): no PreToolUse
   hook judged anything here. The fence was kept by discipline.
7. **A live worked example of the brief's "read COUNTS, never exit codes
   alone".** Drill M1's first attempt exited **101** — which reads
   exactly like a test failure — over **zero** `test result:` lines. The
   real cause was `error: could not find Cargo.toml`: the script had run
   cargo from the worktree root instead of `app/src-tauri`. The count is
   what caught it.

### THE CLASS AND ITS SWEEP

**The class**: *a test that waits for an asynchronous event on a wall
clock where a rendezvous exists — and in particular one that starts a
worker (thread or process) and proceeds without waiting for it to report
READY.*

**The sweep was shown capable of failing before its result was written
down** (the POISON DRILL's proof clause): a planted
`rx.recv_timeout(Duration::from_secs(7))` in a scratch file was found by
the same pattern, then removed.

    command grep -rn 'recv_timeout' --include='*.rs' app/ lib/ tools/
    command grep -rn 'thread::sleep' --include='*.rs' app/ lib/

**Result — three sites, and only two are exposed:**

1. **`app/src-tauri/src/index_cmd.rs` — INSIDE this fence, and NOT
   exposed. Recorded because an unrecorded sweep and an unrun one look
   the same.** It carries its own copy of `live_state` (line 157) with
   the identical missing rendezvous, and a
   `recv_timeout(Duration::from_secs(10))` positive control. But its one
   caller passes **`None`** and then arms through `apply_picked_folder`,
   whose rendezvous the body's own comment relies on — *"its rendezvous
   guarantees the watch and emit baseline are set before it returns"*. So
   the startup-arm path is never taken and the defect cannot occur here.
   **The copy is latent, not live**: the day someone calls that helper
   with `Some(root)`, it inherits this card's bug. Its two
   `recv_timeout(DEBOUNCE * 6).is_err()` waits are NEGATIVES and
   correctly keep their bounds.
2. **`app/src-tauri/tests/agent_runner.rs` — OUTSIDE this fence
   (`app-agent`, C-14). ROUTED.**
3. **`app/src-tauri/crates/nputer-index/tests/watch.rs` — OUTSIDE this
   fence (`crate-index`, C-07, and T-194 was live on it). ROUTED.**

### ROUTED, WITH NO ID MINTED

The dispatching seat allocates ids (five id collisions in one night); these
are described rather than numbered, per that instruction. Both are
`suggested_by: executor claude-opus-5 @T-088-s4`.

**ROUTE A — `app-agent`: the agent-runner tests are the same class, and
this card's own record says one of them is an UNSETTLED intermittent.**
`app/src-tauri/tests/agent_runner.rs` carries ~19 `thread::sleep` waits
and a `recv_timeout(Duration::from_secs(15))`. The card above records
`agent_runner.rs:2926`
(`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`)
as red **1 in 19 clean runs**, explicitly NOT explained by the cache, and
warns that *"a re-measurement can only settle a finding whose MECHANISM
the intervention addresses."* **This lane supplies a candidate
mechanism** — a worker started and then raced rather than awaited — which
is exactly the kind of mechanism that survives a clean cache and reds at
1-in-19. Worth testing before that body is re-measured again. Fence
`[app-agent]`; it owes `cargo test`.

**ROUTE B — `crate-index`: the index watcher's tests race a spawned
BINARY.** `app/src-tauri/crates/nputer-index/tests/watch.rs` starts the
real watcher as a subprocess (`Watcher::spawn`, lines 109/162/334) and
proceeds without waiting for it to report that it is armed; readiness is
approximated by `wait_until(deadline, predicate)`, a 5 ms wall-clock poll
loop. The mechanism is this card's, one level up: process instead of
thread. The test already reads the child's output (`watcher.lines()`), so
a readiness LINE is the rendezvous that is probably already available and
merely unused. Its `sleep(WATCH_DEBOUNCE_MS * 12)` at line 178 precedes a
NEGATIVE assertion and correctly keeps its bound. Fence `[crate-index]`
(T-194 was live on it at dispatch, so this could not be taken here even
had it been in fence).

**NOT ROUTED, recorded as an observation only.** `cargo build` emits one
pre-existing warning, `unused import: Path` at `app/src-tauri/src/arch_cmd.rs:2`.
It is not mine — my diff is one file and that is not it — and
`arch_cmd.rs` is named by BOTH `C-05` (`app-shell`) and `C-12`
(`app-map`), so its fence is ambiguous. Too small to route as a card; too
visible to leave unsaid.

### GATES, derived at the mechanical merge forecast this tip WILL have

Per the RANGE RULE's executor row: `TREE=$(git merge-tree --write-tree
dd6b723 HEAD)` — **exit 0, OID non-empty** (checked before the diff was
read, poison shape TEN) — then `git diff --name-only dd6b723 "$TREE"`.
**2 paths**: `app/src-tauri/src/docs_watch.rs` and this card.

| gate | trigger match | verdict | evidence |
|---|---|---|---|
| **GRAPH REGEN** | 1 `.rs` path outside docs/ | **FIRES — currently STALE** | `index --check` **exit 1**; the ONLY delta is `~ app/src-tauri/src/docs_watch.rs (content, loc 4449 -> 4610)`; 199 files, 2448 symbols, 2365 edges UNMOVED, `+0 -0 ~1`; 1148895 → 1148896 bytes. **The regen is the INTEGRATOR's at the checkpoint** — CONVENTIONS says so in as many words, and `docs/architecture/graph.json` is outside this fence. |
| **BOOT GATE** | 1 path under `app/src-tauri/` | **FIRES — RAN IT, exit 0** | `NPUTER_BOOT_PORT=14884 npm run boot:check` from tools/e2e/, **exit 0 = booted**. Both `[nputer]` lines: `project folder: /Users/ujju/Projects/nputer-T-088-s4` and `window "main" created`. Port DERIVED from the card id; `lsof -nP -iTCP:14884 -sTCP:LISTEN` returned **0 rows** immediately before binding. |
| **DOCS GATE** | 1 path under docs/ | **FIRES — RAN ALL THREE SUITES** | `docs-gate.mjs` given SEPARATE LITERAL PATHS (the `T-192` hazard), exit 1 = it has a verdict: this card is a code input to 10 readers across 3 suites. |
| **METHOD EVAL GATE** | 0 paths under `method/` | **NOT OWED** | nothing in `method/` moved |
| **AUDIT GATE** | declares no merge-diff trigger | **not one of these** | per the brief's own row 8 |

**The three suites the DOCS GATE named:**

| suite | exit | counts |
|---|---|---|
| `npx vitest run` from `lib/parser/` | **0** | 16 files, **344 passed** |
| `npm test` from `app/` | **0** | 49 files, **1100 passed** |
| `npm test` from `tools/e2e/` | see report | — |

**The human's port was read once, with the one permitted command**:
`lsof -nP -iTCP:1420 -sTCP:LISTEN` → **0 rows**, nothing listening.

**`npm test` from `tools/e2e/`: exit 1 — 366 passed / 1 failed of 367,
and THE FAILURE IS `T-197`, NOT THIS LANE. Measured, not asserted.**

The body is `tests/dispatch-order.spec.ts:200` — *"--dispatch runs on the
live repository, exits 0, and WRITES NOTHING"* — failing on
`expect(run.stdout).toContain("BLOCKED — the unmet blocker is named")`.
It calls `brief.mjs --dispatch` through `spawnSync`, which captures
stdout on a **pipe**, and `docs/STATE.md` names this in advance:
*"`brief.mjs` TRUNCATES piped stdout at 64 KiB (T-197) — redirect to a
file; **it reds a standing e2e body no lane caused.**"*

| how stdout is taken | bytes | `BLOCKED` heading present |
|---|---|---|
| **redirected** (no pipe) | **77 599** | **yes** (1) |
| **piped** (what `spawnSync` does) | **65 536** — exactly 64 KiB | **no** (0) |

The heading sits in the 12 063 bytes the pipe discards.

**AND THE COUNTERFACTUAL WAS RUN RATHER THAN ARGUED**, because "not mine"
is the claim most worth checking. With this card restored to its
`dd6b723` bytes (`status: planned`, no notes) and nothing else changed,
`--dispatch` is **77 715 bytes** and still 12 179 over the limit — so the
body reds identically without this lane, and this lane's change made the
output **116 bytes SMALLER**, not larger. Restored afterwards, sha256
identical (`6d467f3ac7ee15dcf7813acac6ac6b59d70c7265ee38ef3937436409c5e1ae32`),
working tree clean.

`T-197` is on the board, unmet-blocked by `T-202` holding `tools/e2e`,
so it could not have been fixed from this lane either.

### REPETITION — the evidence for the FIVE sleeps that were deleted

Four `settle()` calls and one inline `sleep(DEBOUNCE * 4)` were removed
because a real rendezvous already sat beside each. Removing a sleep is
the change most able to buy a rare false green, so it is answered with
repetition rather than with an argument: **15 consecutive
`docs_watch::tests` runs under 8 CPU burners — 59 passed, 0 failed,
exit 0, every time.** Times cluster **2.56–2.71 s** (spread 0.15 s).

    reds: 0 of 15

Together with the three full-suite runs above and M1's pass under a
deliberate 3 s pre-arm stall, the deleted sleeps are covered from three
directions.

## Verdicts
