---
id: T-124-s3
title: A SECOND watcher-shaped flake — the result-only-denial tail body reds under the loaded cargo suite and is green in every isolated run, and nothing has filed it before
status: parked
suggested_by: verifier claude-opus-5 @T-124-verify
---

> **NOT REPRODUCED IN 15 CLEAN RUNS, AND THAT IS DELIBERATELY NOT ENOUGH
> TO CLOSE IT** (architect, 2026-08-25, at main `43803fe`). `T-088-s4`'s
> controlled experiment showed the machine's 8.7 GB / 78 173-file build
> cache made the lib suite run 3.5x slow and redded the watcher body 4
> times in 5; after a `cargo clean` the suite went **455/0/3 for fifteen
> consecutive runs**, mean lib **3.97 s**, with **zero failures of any
> body** — this one included.
>
> **THE ARITHMETIC IS WHY THIS CARD STAYS OPEN.** At the pooled 1-in-9
> rate recorded on the degraded cache, the chance of seeing zero reds in
> 15 clean runs is **0.17** — a genuine defect at that rate survives this
> sample 17 times in 100. The sibling body it was grouped with
> (`agent_runner.rs:2926`, 1 in 3) sits at **0.0023** and IS settled;
> this one is not, and the difference is the rate, not the evidence.
> **Fifteen runs is exactly the sample size that proves nothing here.**
>
> **WHAT WOULD SETTLE IT**: forty clean runs, or a mechanism. Until then
> the honest statement is "not observed on a clean cache, sample too
> small to distinguish from the cache artifact" — and the tempting move,
> closing three findings on one clean sweep, is precisely how a real
> defect gets filed away. Whoever picks this up should ALSO re-derive the
> original tally, since every figure on this card was measured on the
> degraded machine.

**FOUND BY T-124'S VERIFIER, IN CODE T-124 NEVER TOUCHED.** The first
full `cargo test --no-fail-fast` of the verification pass came back
**420 passed / 1 failed / 3 ignored, exit 101** over 15 `test result:`
lines. The failing body is
`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`
in `app/src-tauri/tests/agent_runner.rs` — T-113's, added at `55f9b1b` —
and it fails on its POSITIVE CONTROL, not on the property it pins:

    the ring relayed the CLI's own stderr, so this tail is LIVE and the
    absences below mean something: ""

`stderr_tail` came back EMPTY, so the assertion that the ring carried
the fixture CLI's own sentence
(`transport closed before the session could be saved`) failed before
either of the two absences below it was reached.

## The tally, honest and stated as a range

| what ran | where | runs | result |
|---|---|---|---|
| `cargo test --no-fail-fast` | lane worktree | **4** | **1 red** (420/1/3, exit 101) · 3 green (421/0/3, exit 0) |
| the named body alone | lane worktree | 6 | 6 green |
| `cargo test -p nputer --test agent_runner` | drill worktree, LANE's rust | 14 | 14 green (76/0/1) |
| `cargo test -p nputer --test agent_runner` | drill worktree, **MAIN's** rust (`ce8b8e7`) | 14 | 14 green (75/0/1) |

The one red landed on the run with the highest observed system load
(load averages `7.50 8.04 9.34`, with another lane's node process at 97%
CPU); every later run was under a quieter machine. **Green in isolation,
red under the loaded full suite** is the same asymmetry `T-088-s4` shows,
and it locates the cause in concurrency with the rest of the suite rather
than in the body.

## It is not T-124's, and that is derived rather than assumed

`app/src-tauri/src/agent/runner.rs` — which owns the stderr ring and the
`ExitNonZero` path this body reads — is a **0-file diff** on
`task/T-124-adapter-spelling`: sha256
`43b3d72bab5e055451f574d46d494004bbf5449c4c1d2aeb6fddf5f760426009` at
main `ce8b8e7` and at the tip `e896865`, identical. T-124's whole Rust
diff is `const` data, two pure string functions and three test bodies.

**THE ONE COUPLING WORTH NAMING** rather than dismissing: T-124 adds a
body to the same integration binary, taking it from 76 to 77 bodies run
in parallel. Whether that marginal concurrency matters is UNMEASURED —
14 matched runs of that target on each side were green — but it is the
only mechanism by which this lane could touch this failure at all, and a
reader should meet it here instead of re-deriving it.

## Why it is worth a card

`T-088-s4` has been the project's only known intermittent for weeks and
the pipeline reasons about the cargo suite as "green except that one".
**That sentence is now false**, and a second unfiled intermittent is
exactly the thing that gets attributed to whatever lane is nearest —
the failure mode the DOCS GATE bullet describes, arriving from the
concurrency direction instead. `T-088-s4` did NOT fire in any of this
verifier's four full runs; this one did.

The likely mechanism, named so the next reader has somewhere to start
rather than as a diagnosis: the stderr pump has to drain the child's
FIFO before the exit is observed, and under load it can lose that race,
so the ring is empty when `ExitNonZero` is assembled. If that is right
the defect is in the RUNNER (a tail that can be silently empty) and not
in the body, and the body is simply the only thing that asserts the ring
carried anything at all. **Fence `[app-agent]`.**

Amnesty triage 2026-08-29 (triage seat): PARKED — DELIBERATELY NOT CLOSED, and kept separate from the other two intermittents because the evidence says they are separate. The card's own arithmetic is the reason: at the pooled 1-in-9 rate observed on the degraded cache, fifteen clean runs show zero reds 17 times in 100, so the clean sweep that settled T-088-s4 proves nothing here. Every figure on this card was measured on the degraded machine and needs re-deriving with it. RESURFACES: the next app-agent dispatch, which SHALL either run the forty clean runs the card names or record that it did not; or the first time this body costs a verdict or a merge. Do NOT retire it on a clean sweep — that is the exact move T-088-s4 recorded itself making wrongly, on circular arithmetic, within the hour.
