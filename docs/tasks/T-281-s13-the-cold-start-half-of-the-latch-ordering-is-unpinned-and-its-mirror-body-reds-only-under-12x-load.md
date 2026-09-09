---
id: T-281-s13
title: "spawn_cold_start's half of T-281-s8's latch ordering is unpinned — reverting that hunk alone reds nothing in the target, and the mirror body written to pin it reds 3 times in 180 runs under 12x oversubscription and never in the ordinary suite, which is too weak for a merge to drill"
feature: F-01
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281-s8, 2026-09-09, at fb8379d"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

T-281-s8 moved `drop(flight)` under the lock that publishes the terminal
phase in `spawn_turn`, and — as the class sweep its notes name — in
`spawn_cold_start` too. The planner half carries a pin,
`a_settled_turn_has_already_released_the_single_flight_latch`. The
cold-start half carries none, and the bench measured both halves. Every
figure below is bound to the refs named beside it; re-derive rather than
quote.

- **Revert the `spawn_cold_start` hunk alone**, leaving the `spawn_turn`
  fix in place: the whole `agent_runner` target is GREEN, **10 of 10
  full-target runs** (94 passed / 0 failed / 1 ignored / 2 skipped).
  Nothing in the suite kills that hunk.
- **Revert the `spawn_turn` hunk alone**, for contrast: its pin reds **6
  of 6 runs, alone, on an idle machine**, in 0.06 s each. That is what a
  pin proportionate to its defect looks like.

## The mirror body, and why it is not enough

The verifier wrote the exact mirror of the planner-side pin —
`a_settled_cold_start_has_already_released_the_single_flight_latch`,
spin-polling `cold_start_status()` with no sleep, then asking again, with
`Busy` as the defect — and graded it against BOTH implementations before
proposing it (`T-210`; `method/roles/verifier.md`'s *ask of your own
suggestions what you ask of the diff*):

| arrangement | against the fix | against the reverted hunk |
|---|---|---|
| the body alone, idle, 10 runs | 10 green | **10 green — it does not red** |
| the full target, idle | 95 passed / 0 failed | 94+1 passed / 0 failed |
| 12x oversubscription, 180 target runs | — | **3 red**, with the intended message |

So it is not vacuous: under twelve concurrent copies of the whole target
it does die, saying *"the terminal cold-start phase was published while
the single-flight latch was still held"*. **But 3 in 180, and only under
12x, is not a pin a merge can drill**: `method/roles/integrator.md` step 2b
re-runs a correction's mutant and reads the result, and this one would
report SURVIVED almost every time. It was therefore NOT assigned as a
correction and NOT committed — the honest move, and the reason this card
exists instead.

## Why the window is so much smaller here — the load-bearing part

In `spawn_turn` the base-shape gap between *terminal phase visible* and
*latch free* contained the tail `println!`: a `format!("{error:?}")` run
through `sanitize_for_log`, and then a lock on stdout that ten test
threads are contending for. That contention is the amplifier, and it is
why this whole class shows up under the full parallel run at all.

In `spawn_cold_start` all three `println!`s sit INSIDE the `cold` guard's
own scope, so the gap there is the drop of `outcome` and `emitter` and
nothing else — shorter than the poller's own path back out of the lock,
out of the loop, into `cold_start` and through the compare-exchange. It
is reachable only when the scheduler preempts the worker inside those two
drops, which is what the 3-in-180 reading is.

## What a fix would have to do

Three candidates, none of them measured:

- **land the mirror body anyway**, with its own doc comment recording that
  it is a load-sensitive pin and what its measured rate is, so nobody
  reads a green run as proof. Cheap, honest, and weak;
- **assert the ORDERING as written rather than as observed** — a source
  assertion in the shape
  `the_only_production_path_to_the_transcript_is_the_bounded_one`
  (`agent/mod.rs`) already uses, requiring `drop(flight)` to appear before
  the guard's scope ends in both spawners. It pins what a reader can
  check and says so;
- **record that the ordering is held by reading only**, which is what
  CONVENTIONS' POISON DRILL asks for in as many words: *IF a body cannot
  be poisoned THEN say so and name it.*

The second is the strongest and the third is the cheapest. The point of
this card is that today the file says none of them.
