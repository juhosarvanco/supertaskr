---
id: T-086-s1
title: The two Rust intermittents are not one condition — the hostile-session-id body reds in a FAST checkout while the watcher body stays green
status: parked
suggested_by: executor claude-opus-5 @T-086
---

Absorbs: T-102-s3 (Amnesty triage 2026-08-29 (triage seat)) — the same body in the same place, from a second independent seat: T-102's drill saw a_hostile_session_id... red in a detached worktree with its own small CARGO_TARGET_DIR — the configuration the target-dir hypothesis calls green — with a same-mutant re-run minutes later as the control. It argues the same conclusion this card derives and adds the cheap arm nobody has run: hold the target dir small and vary --test-threads.

`docs/STATE.md` files
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs:2926`, T-039's, last touched by
T-124) as a third intermittent and offers a hypothesis about WHY, with
the hedge already attached:

> it redded in the SAME run as the watcher body above and in neither of
> the two runs where the watcher body was green, which points at the same
> underlying condition — this checkout is slow under load and two bodies
> in it have deadlines. **That is a hypothesis with two data points, not
> a diagnosis**, and it wants the same controlled experiment T-110 ran for
> `T-088-s4` rather than another sighting.

**THIS IS THE THIRD DATA POINT AND IT SEPARATES THEM.** T-086's lane ran
three full bare `cargo test` runs in a FRESH lane worktree
(`/Users/ujju/Projects/nputer-T-086`, its own small `target/`, branch
`task/T-086-closed-reader-list` at `2db5047`, base `c4c15c8`), and the
FIRST one was the red — nothing discarded on the way to a number:

| run | exit | `test result:` lines | totals | lib suite time | `startup_arm_watches_the_initial_root` | `a_hostile_session_id…` |
|---|---|---|---|---|---|---|
| 1 | **101** | 4 (cargo stops at the failing target) | 235 passed / **1 failed** / 1 ignored | **3.97s** | **ok** | **FAILED** |
| 2 | 0 | 16 | **455** passed / 0 failed / 3 ignored | 3.97s | ok | ok |
| 3 | 0 | 16 | **455** passed / 0 failed / 3 ignored | 3.93s | ok | ok |

**THE SEPARATING FACT IS IN ROW 1.** The hostile-session-id body failed
while the `docs_watch` body it is supposed to share a condition with was
GREEN, in a run whose lib suite finished in **3.97s** — not merely inside
T-124's green band (every green under 9.5s, every red over 14.6s) but
down in the **3.82–3.93s** band T-110 measured for an ISOLATED, fresh
target dir. So this body reds in the fast case, where `T-088-s4`'s cliff
cannot be what is crossing a deadline. **The shared-cause conjecture is
refuted, not weakened**, and the two intermittents want two
explanations.

**WHAT STILL REPRODUCES EXACTLY, so the finding is a separation and not a
new sighting.** STATE's other half held to the digit: run alone the body
is **5 green in 5** — 0.18s, 0.45s, 0.23s, 0.18s, 0.24s against STATE's
0.26–0.41s — via
`cargo test -p nputer --test agent_runner a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`.
It is load-sensitive; what it is NOT is a symptom of a big target dir.
And it cannot be T-086's: that lane's whole diff is markdown, **zero
`.rs` paths**, so no Rust assertion can have moved.

**THE TALLY ACROSS BOTH CHECKOUTS IS NOW 2 RED IN 6**, and both reds were
the FIRST full run of their session — T-052's integration in main's 8.7
GB checkout, and this lane in a fresh small one. That ordering is worth
more than the ratio: it is the shape of a cold cache or a cold FS cache,
not of a slow one.

**THE ASK.** The `T-088-s4` treatment STATE already prescribes, aimed at
the RIGHT variable now that the target dir is excluded: run the body
under the full parallel suite with the FIRST-run condition controlled
(warm the test binaries with a throwaway run, then measure), and read
what the assertion is actually waiting on at
`app/src-tauri/tests/agent_runner.rs:2926` — `send_turn` returning
`SendOutcome::NoSession` after a rejected session id, which is a
handshake and not a wall-clock deadline in the way the watcher body is.
If it has no deadline of its own, "two deadline-bearing bodies" was the
wrong frame from the start.

Fence: `app-agent` (`app/src-tauri/src/agent/**` plus
`tests/agent_runner.rs` under T-010's registry settlement). Out of
T-086's `[docs/CONVENTIONS.md]` fence entirely, which is why this is a
suggestion and not an edit.

Amnesty triage 2026-08-29 (triage seat): PARKED — the separation stands and docs/STATE.md already carries it as a standing hazard with the right reading instruction (run the body alone before attributing anything). What the card asks for is an EXPERIMENT, not a fix — hold the target dir small and vary --test-threads — and no verdict or merge has yet been harmed by this body, which is the trigger T-088-s4's own parking note taught this board to wait for. RESURFACES: the next app-agent dispatch — the experiment is one flag on a suite that lane runs anyway; or the first time this body costs a verifier a false REJECTED or an integrator a false red at a checkpoint, which is the T-088-s4 trigger and it is armed here too.
