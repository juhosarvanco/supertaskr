---
id: T-281-s10
title: "A verifier's correction body committed in a spec OUTSIDE the lane's fence is refused by the landing gate at the push — T-283's four bodies live in brief.spec.ts, the reader of the method files, and the merge carried them past a fence of three method files"
feature: F-06
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat, 2026-09-09, at the T-283 merge's refused push (b8f6bf8): PUSH REFUSED — the merge carries tools/e2e/tests/brief.spec.ts outside T-283's declared fence"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, .claude/hooks/landing-gate.mjs, method/roles/integrator.md, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-281's grammar has the verifier commit the body that pins each
assigned correction "in the spec file the property lives in". For a
lane whose fence is method text, that spec is outside the fence by
construction — the pins on executor.md live in brief.spec.ts, which
reads it. T-283's verifier committed four bodies there (f4c9c3f on the
bench); the merge carried them; the landing gate judged the merge over
the lane's range with the fence read from the first parent and refused
the push: `tools/e2e/tests/brief.spec.ts` outside `[executor.md,
verifier.md, lane-protocol.md]`. The four earlier grammar merges
(T-281, T-271, T-278-s2, T-282) never met it because each lane's own
spec was in its fence.

The seat's remedy at this merge: the fence widened on main for the
verifier's spec before the merge (fast path A, performed by the seat
for the verifier's write), the merge redone. That is the right
mechanism and the wrong place for it to be remembered by hand.

## Acceptance criteria

- WHEN a verdict's MUTANT BLOCKs name a `spec` outside the lane's fence
  THE merge verb SHALL widen the card's `touches:` on the integration
  branch by that spec before the merge commit, naming the verdict that
  owes it, so the landing gate reads the widened fence from the first
  parent — never the lane's copy, never the manifest.
- WHEN the landing gate reads a merge whose second parent carries a
  path outside the fence THE refusal SHALL say whether the path is a
  verdict-named spec (the verifier's write) or a lane write, so the
  integrator knows which remedy applies.
- WHEN integrator.md step 2b is read THE widening SHALL be stated as
  one of the merge's own steps, beside the re-drill.
- A body SHALL show the merge verb widening the fence for a
  verdict-named spec and NOT for a path the verdict does not name, seen
  red on a verb that lacks the step.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
