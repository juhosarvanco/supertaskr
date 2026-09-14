---
id: T-320-s6
title: "The express path's own eligibility gate and the guard-class map's own file are not guard-class, so an express change can widen the map or edit the gate that decides eligibility, with no bench and no verifier"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-320, filed at the phase-2 bench on 2026-09-14 from a measured probe of the landed eligibility arm"
blocked_by: []
touches: [docs/conventions/architecture.md, method/tasks/TASK-FORMAT.md, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-320's eligibility reads the guard-class map from the conventions
rather than keeping a copy, which is what its third criterion asks for
and what a data mutant in the map proves. What the map does not cover is
the thing the express path just made reachable.

Measured at the lane's tip by driving the landed `expressPlan` over
three fences, with every requirement but the admission reported MET in
each case:

- `docs/conventions/architecture.md` — the file that HOLDS the map.
- `tools/e2e/scripts/dispatch-brief.mjs` — the file that holds
  `expressEligibility`, the gate itself.
- `tools/e2e/scripts/card-preflight.mjs` — the express path's own fourth
  step.

The map's candidate rule covers a script under `tools/e2e/scripts/`
whose own NAME carries gate, guard, fence, lock, push or landing, and
none of these three does; `docs/` is named by no class at all. So under
any grant, a one-line express change to the eligibility gate, or to the
map the gate reads, takes the short road: no bench, no phase one, no
verifier. The map's own bullet gives the argument against exactly this —
the builder of a cage is not its inspector, and a one-line change to a
guard can retire the guard in silence — and the eligibility's own
guard-class finding quotes that sentence back.

Before this card there was no way to dispatch an untriaged XS lane from
a sentence, so the gap cost nothing. It costs something now.

## What would settle it

Add the express path's own decision surface to the guard-class map on
the same argument the gate runners are there under — the arm that
measures eligibility, the preflight it re-derives with, and the document
that holds the map — and let the candidate rule name them rather than
leaving the rule keyed to a filename. Whether that is a new class or an
entry under an existing one is the conventions' question, not this
card's. The bodies that keep the map already exist; what changes is
which paths it covers.

## Implementation notes

## Verdicts
