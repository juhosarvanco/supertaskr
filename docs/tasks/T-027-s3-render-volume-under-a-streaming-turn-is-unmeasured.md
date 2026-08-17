---
title: Render volume under a long streaming turn is unthrottled and has never been measured
status: suggested
suggested_by: executor claude-opus-5 @T-027
---

T-027's plan named this as a genuine silence and T-027 left it exactly
where it found it. Writing it down so the measurement gets taken by
somebody rather than by nobody.

**The shape.** Every `textDelta` on the `genesis-turn` channel produces
a new `GenesisState` (`reduceGenesisEvent` allocates a fresh turn array
and a fresh turn object), which notifies `useSyncExternalStore`, which
re-renders `InterviewChat` — and with it the whole transcript, because
`assembleTranscript` returns a fresh array every render and every
`PlannerTurn` is a fresh element. The runner coalesces deltas at 150 ms
(`runner.rs`'s `cfg.coalesce`, T-025 §4), so the ceiling is roughly
**6–7 renders per second for the duration of a turn**, each one
re-rendering every turn in the conversation.

**Why nobody has felt it yet, and why that is not evidence.** No agent
loop in this project has ever run against a real model
(T-025-s2 — the biggest unobserved thing in the project). Every stream
this screen has seen is a scripted fixture that lands in milliseconds.
A real stage-8 decomposition turn can run for minutes and produce
thousands of words, on a transcript that is by then seven questions
long.

**THE MEASUREMENT TO TAKE, stated precisely so it is a task and not a
worry:** drive T-025's `happy` scenario end to end and count renders per
turn and total commit time — a `useRef` counter in `InterviewChat` under
a React Profiler, or `performance.measure` around the commit phase.
Compare turn 1 (one turn on screen) against turn 7 (seven turns, one of
them 10k characters). **If renders-per-turn × transcript-size is what
grows, the fix is memoisation, not throttling** — `PlannerTurn` under
`React.memo` keyed on the turn object, which the store already gives for
free: `upsertTurn` copies only the turn that changed, so every OTHER
turn's object identity is stable across a delta. That is a one-line
change that costs nothing if the measurement says it is unnecessary.

**Do not throttle blind.** Throttling the render would put a second
coalescing window on top of the runner's 150 ms one and make the "no
dead air" property T-025 measured (every stream line reflected within
250 ms) untrue at the layer the user actually sees.

**The cheap adjacent guard, if a measurement task is too much:** the
memo above, plus a vitest unit asserting that a `textDelta` for turn N
leaves turn N-1's object identity untouched. That pins the property the
memo depends on, and it is true today.

Home: T-028 (the milestone closer, which is where the first real
observed run happens) or a small card of its own after T-025-s2.
