---
id: T-278-s4
title: "The disk pair brackets the e2e lane and nothing compares its two readings, so a runner that fills DURING the lane still reds as one body's stderr — the case T-278's floor cannot reach"
feature: F-04
milestone: 4
size: S
priority: 11
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-278, 2026-09-09, at bench tip 4327aff"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278 gives the job a floor before the e2e lane and a reading after it, and
between them lies the one case neither names: a runner that clears the floor and
then fills while the lane runs. That run reds at the step called `e2e lane`, with
the reason inside one body's stderr — which is the sentence T-278's own card
opens with. The after-step does print `df` and the twenty largest entries in the
temp directory, but it prints them into a step that PASSED, so nothing in the job
says the word disk and `gh` still reports `e2e lane` as the failure the seat looks
up.

The measurement T-278 took says this case is not the one that happened — the four
red attempts were already at their edge before the lane started, and the lane's
own footprint peaks at about 223 MiB — so this is a residual and not a defect in
what landed. What would close it is a comparison rather than a third reading: the
before-step already computes a free figure in KiB, and an after-step that
recomputes it, subtracts, and refuses when the DELTA exceeds a stated budget (or
when free has fallen under the same floor) would turn a mid-lane fill into a red
whose step name is the diagnosis. Its `if: always()` is already the hard half.

Class parent: T-278. Disposition hint: decide it with T-278-s1's first real
headroom reading in hand — a runner that starts the lane with 20 GiB free cannot
reach this case, and one that starts with 2.5 GiB reaches it on any bad day.
