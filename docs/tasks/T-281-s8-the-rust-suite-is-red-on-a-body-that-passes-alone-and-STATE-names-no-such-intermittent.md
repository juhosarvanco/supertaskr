---
id: T-281-s8
title: "The Rust suite reds on a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded under the full run and PASSES alone — an intermittent that docs/STATE.md does not name, so the next seat will attribute it to its own diff"
feature: F-01
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [app/src-tauri/tests/agent_runner.rs, docs/STATE.md]
builder:
verifier:
built_by:
verified_by:
review:
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
