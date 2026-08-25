---
id: T-088-s4
title: A watcher startup-arm test reds because the build cache had grown to 78,000 files — not a flake, and the title below is the wrong diagnosis kept for the record
status: suggested
suggested_by: integrator claude-opus-5 @T-088
---

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
> So **this body and the hostile-session-id body are settled** — the
> second at better than 400-to-1 — while **`T-124-s3` is NOT**. At one in
> nine, fifteen clean runs is exactly the sample size that proves nothing:
> a genuine 1-in-9 defect survives it 17 times out of 100. **Do not
> retire `T-124-s3` on this evidence**; it needs its own run of forty or
> a mechanism. Recorded this way because the tempting move — one clean
> sweep, three findings closed — is how a real defect gets filed away.

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
