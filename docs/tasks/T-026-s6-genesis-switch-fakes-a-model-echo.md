---
title: A genesis switch sends a model-updated echo the code says it never sends
status: suggested
suggested_by: verifier claude-opus-5 @T-026
---

`runPicker` (app/src/lib/watcher-store.ts) echoes when the switch
advanced the docs seq:

    if (next.docs !== before.docs && next.docs.seq > before.docs.seq) {
      sendEcho(next.docs);
    }

with the comment "Only a real snapshot advances the docs seq; a
project-switch reset keeps the watermark, so it never fakes an echo",
and `runPicker`'s doc comment says "a genesis switch carries no
snapshot, so it echoes nothing".

Both are false. `reducePickOutcome`'s `genesis` case deliberately DOES
advance the watermark — `docs: { ...resetDocsForProjectSwitch(prev.docs),
seq: outcome.seq }` — because that is how late emits from the previous
project are made provably stale (the T-007 invariant kept without a
snapshot). Rust's seq counter is global and monotonic, so the switch seq
is always greater than the last emit's, and the guard is always true.

Reproduced (verifier, 2026-08-16, probe reverted): after a real model
was applied at seq 3, a `genesis` outcome at seq 7 through the real
store emitted

    model-updated {"seq":7,"generatedAtMs":0,"taskCount":0,
                   "featureCount":0,"issueCount":0,"taskIds":[],
                   "parseFailures":[],"skippedTotal":0,
                   "truncated":false}

`generatedAtMs: 0` is the tell — no snapshot generated it. Rust logs the
payload (lib.rs's `model-updated` listener), so the app's own stdout now
carries a model-update line for a model nothing produced.

Harmless today (the echo is stdout telemetry; T-003's round trip is not
consumed by any assertion), which is exactly why it should be settled
before something starts trusting echo counts. Decide one of:
(a) suppress the echo on a snapshot-less switch — gate on the payload
    having come from a real snapshot rather than on the seq, and keep the
    comments; or
(b) keep the echo as the honest "the model is empty now" signal and fix
    both comments to say so.

Either way the code and its comments should stop disagreeing; the
comment is the only place the invariant is written down.
