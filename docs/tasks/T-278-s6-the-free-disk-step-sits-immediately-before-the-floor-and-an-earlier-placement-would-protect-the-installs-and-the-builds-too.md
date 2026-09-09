---
id: T-278-s6
title: "The free-disk step sits immediately before the floor, so every install and build in the job still runs on the disk the image arrived with — an earlier placement would protect them too, and only the ledger this lane adds can say whether it needs to"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-278-s2, 2026-09-09, at 2e9233d"
blocked_by: [T-278-s2]
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278-s2's third criterion says the free-disk step "SHALL sit before"
the floor, and this lane spelled that as IMMEDIATELY before, which is
the strongest pin a derivation can make and the one `diskGuardProblems`
already uses for the floor itself. It is also the LATEST position that
satisfies the criterion.

## What that leaves unprotected

On run 34334103318 (cc41ff3, image 20260831.293.1) the job reached the
floor with 188,156 KiB free on a 72G disk at 100% use. Everything
before the floor — the apt install (268 MB by its own log), three
`npm ci` runs, the app bundle, the cargo target and a 79.5 MB Chromium
download — therefore completed on a disk that was already essentially
full. They SURVIVED. Nothing in the tree says they would survive an
image 200 MB fuller, and the failure mode then is an ENOSPC inside
`cargo test` or `npm ci`, which is exactly the "one body's stderr"
red T-278 exists to stop — with the remedy sitting three steps too
late to run.

## Why it was not moved here

Two reasons, both worth restating rather than re-deriving:

1. The criterion pins the placement RELATIVE TO THE FLOOR, and the
   spec's derivation is adjacency, which is what makes the "moved"
   mutant nameable by index. An earlier placement needs a different
   derivation ("before the floor, and before the first heavy step"),
   which is a change to the pin rather than to the step.
2. **The condition is unmeasured.** No run has ever died before the
   floor. T-278-s2's own disposition hint is the rule here — decide it
   with the first real headroom figure in hand — and the disk ledger
   T-278-s2 adds is precisely the instrument: its FIRST reading is the
   image's arrival, printed beside `ImageVersion`, and its per-step
   deltas say how much of the disk each install actually needs.

## What a fix decides

- WHETHER the step moves to immediately after the checkout (before the
  apt install), or stays and gains a second, earlier sibling.
- WHETHER the parity derivation then pins "before the floor AND before
  the first heavy step", and what the moved-mutant becomes.
- What the arrival readings from the first runs after T-278-s2 say: a
  runner that arrives with 20 GiB free needs neither placement, and one
  that arrives with 184 MiB needs the early one.

## Read beside

T-278-s1 (the floor's own re-derivation from a measured reading),
T-278-s2 (this lane), and the disk-ledger section of
tools/e2e/tests/workflow-parity.spec.ts.
