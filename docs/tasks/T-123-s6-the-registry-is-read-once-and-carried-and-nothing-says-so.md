---
id: T-123-s6
title: The registry is read ONCE and CARRIED into the post-ack re-read, the veto argument rests on it, and a mutant that re-reads it there survives the whole suite
status: suggested
suggested_by: verifier claude-opus-5 @T-123-verify2
---

**A DRILL SURVIVOR, and it is under the load-bearing half of criterion
6's argument.**

`apply_genesis_folder` (app/src-tauri/src/docs_watch.rs) reads the
registry once, before the `ArmGenesis` rendezvous, and CARRIES the
resulting `GenesisReachability` into the post-ack re-read:

    Some(snap)
        if !routes_to_genesis(&PlanProbe::from_docs_snapshot(&snap, probe.git), reach) =>

The rebuild's own note on that arm says why: *"A SECOND registry read
here could have flipped the answer back ON — which is precisely why
there is not one."* T-064's veto-only property is re-derived on exactly
that sentence, and criterion 6 requires whichever answer is true to be
PINNED.

**IT IS NOT PINNED.** Mutant, producer side only, applied in
`drill-T-123-verify2` at `338a7e2` with its own `CARGO_TARGET_DIR`, the
mutated text read back with `git diff` before the run:

    -   if !routes_to_genesis(&PlanProbe::from_docs_snapshot(&snap, probe.git), reach) =>
    +   if !routes_to_genesis(&PlanProbe::from_docs_snapshot(&snap, probe.git),
    +                         crate::agent::sessions::genesis_reachability(&canon)) =>

`cargo test --lib` → **exit 0, 158 + 123 passed, no body red.** The
carried value is replaced by a second, independent read of the same file
at a later moment, and the suite cannot tell.

The rebuild's own M7 mutates the carried value to a LITERAL
(`reach` → `Resumable`) and reds 2 bodies — that pins what the value
IS, not that it was read ONCE. The two are different properties and only
the first has a body.

**WHY IT IS A SUGGESTION AND NOT A DEFECT.** The mutant is
behaviourally identical on every fixture in the tree, because no fixture
changes `.nputer/sessions.json` inside the rendezvous window. The
veto-only property survives the mutant too: the arm can still only
produce `Picked`. So nothing is wrong today — what is missing is the
tripwire under a sentence the next reader will trust.

**THE FIX IS A FIXTURE, NOT A GUARD.** `relayed_state`'s `on_arm` hook
already runs arbitrary code exactly inside the window (T-064's own
relay). A body that writes a RESUMABLE planner entry into
`.nputer/sessions.json` from that hook, on a folder whose first reading
was `NoSession` and which gains a plan in the same window, separates the
two implementations: carried → `Picked` (the veto fires), re-read →
`Genesis`. Assert `Picked`, and the carry is pinned by a state rather
than by a comment.
