---
id: T-129-s4
title: CONVENTIONS says a non-merge commit between checkpoints is safe "by practice, verified" — T-129's own base falsifies it, and the lane inherited a red index --check
status: suggested
suggested_by: executor claude-opus-5 @T-129
---

**MEASURED ON THIS LANE'S OWN BASE, and it is the shape the DISPATCH
bullet already predicts for a merge commit arriving at a commit the
bullet calls safe.**

CONVENTIONS' *DISPATCH FROM THE LAST CHECKPOINT* bullet bans cutting from
a **merge** commit, because *"a merge commit carries a graph the
checkpoint has not regenerated yet … so a lane cut from one inherits a
stale graph and a red `index --check` through no fault of its own"*. It
then permits a later non-merge commit, with this reasoning:

> a non-merge commit later than the checkpoint carries the checkpoint's
> graph and is safe ON THAT COUNT … this holds by PRACTICE, verified
> (every non-merge first-parent commit between checkpoints on main is
> docs-only with green gates), NOT by property; nothing forbids a source
> commit between checkpoints.

**The premise is what fails, not the reasoning.** A non-merge commit does
not carry "the checkpoint's graph" when a MERGE has landed between the
checkpoint and it. T-129 was cut from `ae16fbe`, and main's first-parent
chain there reads:

    ae16fbe  T-129 dispatch: status building        <- THE BASE
    e900fac  T-129: pathological nesting …
    ab6ddb9  T-127 amended …
    c87cfd8  T-128: four silent corruptions …
    a9ed33d  Merge T-102: the discriminator …       <- A MERGE, unheckpointed
    48ed848  T-127: the ruling on T-033-s10 …
    05dd4d9  Checkpoint: T-107 done                 <- the newest checkpoint

`a9ed33d` merged **three `.rs` files** (`agent/runner.rs`,
`bin/fake_agent.rs`, `tests/agent_runner.rs`, 947 insertions), and no
checkpoint regenerated the graph before four more non-merge commits
landed on top of it. So at `ae16fbe`:

    nputer-index index --check --root <a pristine ae16fbe tree>   ->  exit 1, STALE
      committed:   921608 bytes · 178 files · 1960 symbols · 1881 edges
      fresh index: 923899 bytes · 178 files · 1967 symbols · 1881 edges
      files +0 -0 ~3   (all three of a9ed33d's, `loc` and `symbols` moved)

**All four of the commits between the merge and this base are docs-only
with green gates individually — and the base is still red**, because the
gate is a property of the TREE and not of the last commit. The bullet's
verified practice checks the wrong thing: it asks whether each in-between
commit is docs-only, when the question is whether a MERGE sits below them
with no checkpoint between.

## Why it cost this lane something worth recording

The graph gate is one of three standing gates and it is the one an
executor is told to *ask rather than predict*. Asking it at the base
returns STALE naming three files the lane never opened — which is
"a false red on somebody else's work", the exact cost the RANGE RULE
bullet calls *"the one kind of noise nobody can dismiss by looking at
it"*. T-129 had to run the pre-fix/post-fix byte-identity comparison
**binary-against-binary over identical trees** rather than against the
committed graph, because the committed graph was not a valid baseline.
That is a real extra step, and a lane that had not noticed would have
attributed those three files to itself.

It also self-heals invisibly: `1ed6ae9 Checkpoint: T-102 done` landed on
main **while this lane was working**, so a session that re-derives an
hour later finds the gate green and the evidence gone.

## Arms

1. **CORRECT THE BULLET (cheapest).** The safe base is *the newest
   commit with no un-checkpointed merge below it*, which is a property
   anyone can check in one command:
   `git log --oneline --first-parent --merges <checkpoint>..<candidate>`
   — empty means safe. That replaces a verified-practice claim with a
   derivation, which is what this file asks of every other count.
2. **MAKE THE DISPATCHER ASK THE GATE.** The dispatch brief already
   carries the base as a hash; it could carry `index --check`'s exit at
   that hash beside it. A base whose gates are red is news at dispatch
   time, not at hand-off.
3. **DO NOT "FIX" IT BY REGENERATING FROM THE LANE.** `docs/architecture/
   graph.json` is not inside `crate-index`'s declared `paths:` (C-07 is
   `app/src-tauri/crates/nputer-index/**`), and the standing rule puts
   the regen on the integrator at the CHECKPOINT — where it belongs,
   since the checkpoint edits indexed fixture files.

Fence `[docs/CONVENTIONS.md]`, free at this filing. Read beside
`T-052-s1`, which asks the neighbouring question about turning a written
ritual into a gate.
