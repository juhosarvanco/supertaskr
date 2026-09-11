---
id: T-299-s5
title: "The merge verb's own refusal on a forbidden combination is proved by no body — the load-or-refuse in the merge's main is the one that guards an irreversible act, and the spec it belongs in was outside T-299's fence"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-299 phase 2, measured at f0e96179595213f0cb587bc11e0068e7085039b4, 2026-09-11"
blocked_by: []
touches: [tools/e2e/tests/merge.spec.ts, tools/e2e/scripts/merge.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-299 put a load-or-refuse at the head of the merge verb's `main`: the
process settings are read once, and a combination the schema's
constraints forbid returns `CANNOT_RUN` before a worktree is removed, a
branch is moved or a merge is staged. The bench ran it and it holds — a
forbidden override on the integration checkout refused at exit 3, named
both unsatisfied pairs with both values and the repair, and left HEAD,
the lane branch and the working tree untouched.

**No body proves any of that.** The dispatch side's refusal has one, and
it compares the fixture tree either side of the refusal. The merge
side's has none: `tools/e2e/tests/merge.spec.ts` carries no reference to
the loader, the finding class or the section, and the only things
`brief.spec.ts` imports from the merge verb are `keeperSteps`,
`regenPlace` and `tailPlan` — the pure functions, never `main`. So the
try/catch that stops the merge could be deleted and the whole battery
would stay green.

This is the refusal that matters most, because it is the one standing in
front of acts that cannot be taken back. The dispatch side's refusal
costs a re-run; the merge side's costs a staged merge under a
configuration nobody can satisfy.

## Why it was not fixed in the lane

The property lives in the merge verb's own spec, and that file was
outside T-299's fence. T-299-s1 already records the other half of the
same fence pressure — three merge-side bodies that had to be written in
`brief.spec.ts` because the fence named that file and not this one. The
two belong in one sitting.

## What would settle it

A body in `tools/e2e/tests/merge.spec.ts` that drives the merge verb's
`main` against a checkout whose `process:` section carries a forbidden
override, and requires three things: the exit is `CANNOT_RUN`, the
message names both switches and both values, and the tree either side of
the call is identical — the same tree comparison the dispatch side's
body already makes. The positive control is the same checkout with the
override removed, which must plan its steps normally.
