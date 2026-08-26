---
id: T-141-s1
title: The CYCLE census has an exact-set both-directions ratchet in cargo and the DRIFT census has none — so `unmapped` opens and closes with `cargo test` byte-identical, and the only tripwire is two React fixtures
status: suggested
suggested_by: executor claude-opus-5 @T-141
---

**MEASURED IN BOTH DIRECTIONS NOW, WHICH IS WHAT MAKES THIS FILEABLE
RATHER THAN A RESTATEMENT.** T-139's checkpoint recorded that `cargo
test` was **518 passed / 0 failed / 4 ignored, exit 0** both before and
after the merge that CREATED this repository's second D2. T-141 closes
that D2 and `cargo test --no-fail-fast` from `app/src-tauri` is
**518 / 0 / 4, exit 0** again, summed from the eighteen `test result:`
lines and cross-checked against the eighteen `running N tests` headers
(522 = 518 + 4). **The Rust side is byte-identical across the creation
AND the closure of unclaimed territory.**

## The asymmetry has a mechanism, and it is deliberate on one side only

`app/src-tauri/crates/nputer-index/tests/arch.rs` holds both halves:

- `the_live_registry_declares_exactly_the_cycles_this_crate_still_allows`
  pins `KNOWN_DECLARED_CYCLES` with **EXACT-SET semantics, BOTH
  directions** — its own comment says *"A cycle that appears and is not
  listed here reds; an entry left here after its cycle is gone reds
  too"*. That is a ratchet.
- `the_mapping_is_total_over_the_committed_graph` reads the same live
  registry and the same committed graph and asserts only that the
  mapping is TOTAL and that the buckets PARTITION. It **explicitly
  permits `owner == UNMAPPED_ID`** and its partition arithmetic adds
  `model.unmapped.len()` in. A file in the bucket is a legal state to it,
  by construction.

So the crate that WRITES the drift census pins the cycle census and
tolerates the drift census. `arch drift` exits **0** without `--fail-on`,
and nothing wires it.

## The whole tripwire is two React fixtures, and their fence is not the registry's

What noticed, both times, is
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — **fourteen assertions across six
bodies**, measured at T-141 by moving them. Both files sit under
`app/test/**`, which is C-05's `app-shell`; the registry they are
watching lives in `docs/architecture/components/`. **A lane fenced on the
registry cannot see its own red, and a lane fenced on `app-shell` cannot
fix the registry that caused it.** T-127-s1 is the standing precedent —
that card exists because an acyclic re-partition of C-08/C-09 moved these
exact two fixtures from outside their fence.

## AND THE STANDING REASON FOR LEAVING THE GATE UNWIRED DOES NOT COVER THIS ARM

CONVENTIONS says `arch drift --fail-on undeclared|unmapped|any` *"stays
unwired while the registry carries live undeclared edges by design"*.
**That reason is specific to `undeclared` and does not transfer to
`unmapped`.** The registry really does carry undeclared rows on purpose —
`C-10 -> C-14` is the cycle T-125 owns and `C-05 -> C-15` is routed to
`T-126-s3` item 4 — so `--fail-on undeclared` would red on states this
project has decided to hold. **No such decision exists for `unmapped`.**
Both D2s this repository has ever had were treated as things to close and
both were closed: T-033 claimed `tests/dispatch_lanes.rs` a day after
T-110 created it, and T-141 claimed `tests/graph_budget_bench.rs` one
merge after T-139 created it. **The `unmapped` arm is separable from the
`undeclared` arm and is the one whose blocking reason has lapsed.**

## What this card is NOT

It is **not** a proposal to red on a D2 at the moment of creation.
T-141's own finding is that both D2s were created by a MERGE and closed by
a LATER HAND, because picking an owner is a disposition an integrator may
not take at a checkpoint. A gate that reds at the merge would force the
integrator into exactly that disposition, or block the merge on a card
that does not exist yet. The disposal shapes worth weighing are therefore:

1. `--fail-on unmapped` as a CI step, accepting that a merge which creates
   a D2 goes red until a follow-up card lands — the strictest, and the one
   that conflicts with "a checkpoint takes no dispositions".
2. A Rust pin with the same EXACT-SET both-directions shape as the cycle
   allowlist: a `KNOWN_UNMAPPED` const, empty today, that reds when a file
   ENTERS the bucket **and** reds when a stale entry is left behind. This
   keeps the disposition with the card and moves the tripwire off the
   React fixtures, which is the actual defect.
3. Do nothing and record that two React fixtures are the tripwire, which
   is the status quo and is at least now written down twice.

**Option 2 is the one that matches how this repository already handles
the cycle census**, and the allowlist comment in `arch.rs` is a
ready-made template including its own delete-me clause.

`touches:` would be `[crate-index]` at minimum, plus `app-shell` if the
fixtures' comments are updated to point at the new pin. **NOT built at
T-141** — the card that produced this observation forbids fixing it and
scopes it to a ruling, and a new Rust assertion would owe a POISON DRILL
that T-141 does not otherwise owe.
