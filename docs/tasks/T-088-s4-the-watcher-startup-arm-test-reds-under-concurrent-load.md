---
id: T-088-s4
title: A watcher startup-arm test reds under concurrent load, and it is the second flake this suite has produced
status: suggested
suggested_by: integrator claude-opus-5 @T-088
---

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
