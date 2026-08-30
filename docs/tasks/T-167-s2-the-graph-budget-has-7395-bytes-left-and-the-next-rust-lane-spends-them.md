---
id: T-167-s2
title: The committed graph is at 99.3% of its byte budget with 7395 bytes left — T-167 alone spent 8875 of them, so the next code lane is the one that runs out
feature: F-06
milestone: 4
priority: 1
size: M
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-167's LANE WHEN IT ASKED THE GRAPH GATE, WHICH PRINTS THE
BUDGET LINE BESIDE ITS VERDICT.** The finding is not about T-167's
diff; it is about the headroom every lane after it inherits.

## The measurement

`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri/`, run at T-167's tip `1c797df`:

    budget:      1032605 of 1040000 bytes (99.3%) - 7395 left
    floor:       214704 of 1040000 bytes (20.6%) - 1130 bytes/file
                 truncation can never reclaim, so at this tree's density
                 the budget stops degrading gracefully at about 920 files

The COMMITTED graph at that ref is 1023730 bytes — **16270 bytes of
headroom before this lane, 7395 after it**. One `.rs` module of ~600
lines plus four edited files spent more than half of what was left.
State the DELTA as the invariant and both endpoints as ref-bound
(CONVENTIONS, "a forecast is measured, never extrapolated"): re-derive
both numbers at your own ref with the command above, which takes about a
second and is the same command CI runs.

## Why this is priority 1 rather than a note

Nothing is red today and nothing will announce this in advance. The
budget line is printed by `index --check` on every run, including the
runs that exit 0 — so a lane that reads only the headline verdict
("current") never sees it, and the failure, when it comes, arrives inside
somebody else's merge as a gate they did not cause and their fence
forbids them to fix. That is the same shape as the graph-trigger gap
`T-123-s5` closed, and it cost that night nothing only because the rule
said ASK THE GATE.

The board's next dispatches include Rust-touching cards. Two of them
landing before this is addressed is enough.

## What the fix has to weigh, and what it must not do

The budget lives with the indexer (`crate-index`, C-07) — its constant,
its truncation policy, and its floor computation are all in
`app/src-tauri/crates/nputer-index/`. **Derive the authority from the
crate, never from this card.** Three shapes are available and they are
not equally honest:

1. **Raise the cap.** Cheapest, and it moves the cliff rather than
   removing it — but the floor line above says truncation stops helping
   at about 920 files at this tree's density, and the tree is at 190. A
   raise buys real runway.
2. **Shrink what is emitted per file.** Changes what the graph CAN
   answer; every consumer of `graph.json` — `arch`, `arch blast`,
   `arch cycles`, the app's map, the dogfood fixtures — is a reader with
   a pin. Costly and possibly correct.
3. **Narrow the walk.** The tempting one and the one to argue hardest
   against: `.rs` joined the walk at T-010 for a reason, and dropping
   files to fit a budget is a gate that reports "current" about a tree it
   stopped looking at.

Whatever is chosen, note that DECLARING nothing here moves the three
live-registry fixtures — this is a budget, not a component — but a change
to what the graph emits DOES move `app/test/architecture-dogfood.test.ts`
and `app/test/map-dogfood-render.test.tsx`, which are outside
`crate-index`. Route what the fence cannot reach.

## The cheap tripwire, if the fix is deferred

`index --check` already computes the number. A card could make the gate
exit non-zero — or print a loud line — below a named headroom, so the
lane that spends the last bytes finds out at its own build instead of at
somebody else's merge. That is smaller than any of the three above and
does not decide between them.
