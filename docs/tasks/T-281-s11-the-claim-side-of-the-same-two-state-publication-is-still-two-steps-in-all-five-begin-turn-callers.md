---
id: T-281-s11
title: "T-281-s8 ordered the RELEASE of the single-flight latch against the terminal phase; the CLAIM is still two steps — all five begin_turn callers take the latch and publish Running later, and send_turn puts a disk probe between them"
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281-s8, 2026-09-09, at fb8379d"
blocked_by: []
touches: [app/src-tauri/src/agent/mod.rs, app/src-tauri/tests/agent_runner.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

T-281-s8 established the rule for the END of a turn: the terminal phase
and the single-flight latch are published as ONE step, so nobody can
observe the phase without also seeing the latch free. Its own notes state
the general shape — *a caller learns the state of the runner from TWO
pieces of shared state*, `Inner.phase` under the `inner` mutex and the
`running` `AtomicBool` — and that shape has two ends. The card fixed one.

At the START, every one of the five `begin_turn()` callers in
`app/src-tauri/src/agent/mod.rs` claims the latch FIRST and publishes
`Phase::Running` LATER:

    start_genesis · resume_genesis · fresh_genesis · send_turn · cold_start

so for the length of that gap `status()` answers a NON-`Running` phase
while the runner is already claimed, and a caller that polls the phase and
then acts is told `Busy` for a turn it cannot see. It is the mirror image
of the defect T-281-s8 removed, produced by the same two observables in
the same module.

**And the claim-side gap is the LONGER of the two.** In `send_turn` the
work between `begin_turn()` and `guard.phase = Phase::Running` includes
`runner::resolve_cli`, which probes the filesystem; in `cold_start` it
includes the docs-tree check and the same resolve. The window T-281-s8
closed contained a `println!`; this one contains disk I/O, and that one was
observed 1 time in 720 on this machine and once on the CI runner.

## Why it is a suggestion and not a finding

Nothing has been seen to red on it. The webview's own polling cadence is
far coarser than the window, and no test body asks the question — which is
exactly what was true of the release side until T-281-s8 reproduced it.
The honest statement is that the hazard is derived from the code and has
not been measured.

## What the work would be

1. Reproduce first, the way T-281-s8 did: a body that claims the latch on
   one thread and polls `status()` on another, and requires that a
   non-`Running` reading implies a free latch. If it cannot be made to
   fail, that is the finding and it is recorded.
2. If it reproduces, publish the claim as one step too — set the phase
   under the same lock acquisition that the caller will read, before any
   probing — or make the ONE observable both questions are answered from
   explicit, so the pair cannot drift apart again.
3. Whichever way it goes, the module gets a sentence saying which of the
   two ends is ordered, because today a reader of `spawn_turn`'s comment
   will reasonably conclude both are.
