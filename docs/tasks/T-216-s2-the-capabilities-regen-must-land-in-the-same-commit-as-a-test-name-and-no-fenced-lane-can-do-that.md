---
id: T-216-s2
title: The CAPABILITIES regen must land in the SAME commit as whatever moved a test name, and since T-210 no fenced lane can write that file — the bullet names the rule and not its owner
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-216
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-216, NOT FIXED THERE** — the file this proposes
to edit is outside that card's fence, which is the same wall the finding
is about. Disposition hint: this is probably ONE SENTENCE in a bullet that
already exists, so triage may want to ride it on the next card that opens
`docs/CONVENTIONS.md` rather than dispatch it alone. No class parent found.

## The two rules, and where they meet

`docs/CONVENTIONS.md`'s tools/e2e bullet, on `npm run capabilities:check`:

> The regeneration has to land in a COMMIT, and in the SAME commit as
> whatever moved a test name — otherwise the check reds on the next lane,
> layers from its cause

**It does not say WHOSE commit.** Before `T-210` that was harmless: a lane
could simply write `docs/CAPABILITIES.md`.

`T-210` made out-of-fence tracked files PHYSICALLY read-only. Measured in
this lane at `9eb3ec8`, fence `[.claude, tools/e2e]` + `docs/tasks`:

    -r--r--r--  docs/CAPABILITIES.md
    -r--r--r--  docs/CONVENTIONS.md
    -rw-r--r--  docs/tasks/T-216-….md
    -rw-r--r--  tools/e2e/tests/push-guard.spec.ts

So a lane that adds ANY `test("…")` to `tools/e2e/tests/` stales the
census it cannot regenerate. Reproduced here rather than reasoned: adding
seven bodies to `push-guard.spec.ts` took `capabilities:check` to

    capabilities: STALE — committed 40662 bytes, a fresh generation is
    41431 bytes; run npm run capabilities

and the regen is refused by the read-only layer, correctly.

## Why this is a documentation fix and not a code one

**The obligation is satisfiable — by the INTEGRATOR, at the merge**,
regenerating before the merge commit is written so the regen and the test
name really do share one commit. That is exactly the shape `GRAPH REGEN`
already has, and `push-guard.mjs`'s own `lane-cannot-regenerate` arm says
it in as many words for the graph:

> Refusing here would leave the lane no legal remedy, and the regen is the
> integrator's at the merge (docs/CONVENTIONS.md, GRAPH REGEN).

**The census has no such sentence anywhere.** The rule is written as
though addressed to whoever moved the test name, and since `T-210` that
person cannot obey it. The cost is a lane that believes it is done, an
integrator with no written trigger, and a CI red on the NEXT lane —
which is precisely the failure the bullet's own clause was written to
prevent.

## Acceptance criteria

- The tools/e2e bullet SHALL name the OWNER of the regeneration the way
  the graph rule does, and SHALL say that a fenced lane cannot perform it.
- The lane's own obligation — REPORT the stale census at handoff — SHALL
  be written where an executor reads it, not only here.
- No code change is required for this and none should be invented; if a
  mechanical trigger is wanted, that is a separate card and should be
  argued on its own cost.
