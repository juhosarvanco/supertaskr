---
id: T-205-s10
title: dispatch-order.spec.ts:80 compares its lane derivation against a HAND derivation of the live worktree list, so a sibling seat's lane branch that the pattern does not match reds it on a tree nobody touched
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205-s8, class sweep at ca64d7c, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/dispatch-order.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-205-s8` removed the machine-global worktree dependence from
`session-economics.spec.ts` and swept the rest of `tools/e2e/tests/` for
the same class. Two bodies survive it. This is one of them.

    tools/e2e/tests/dispatch-order.spec.ts:80
      "and the live repository AGREES with git worktree list, entry for entry"

The body runs `git -C repoRoot worktree list --porcelain` and compares
two derivations of the same text: `lanesFrom(...)`, which matches
CONVENTIONS' published `task/T-NNN-<slug>` pattern, against a hand-rolled
filter that takes **every** line starting `branch refs/heads/task/`. The
equality at line 94 holds only while every live lane branch on the
machine happens to carry a slug the pattern accepts.

**IT IS A CLAIM ABOUT THE MACHINE, NOT ABOUT THE REF.** A sibling seat
that cuts `task/T-241` with no slug — or any `task/…` branch the pattern
declines — makes `byHand` a superset of `derived` and reds this body in
every checkout on the machine at once, attributed to whichever diff
measured last. That is the same defect `T-205-s8` fixed next door and the
third instance of the family `docs/CONVENTIONS.md` already names with the
SCRATCH RULE and the PORT RULE.

The property the body means to keep is real and worth keeping — that the
derivation does not drift from git's own answer. What it must not do is
take the *input* from a surface no ref controls.

## Acceptance criteria

- THE body SHALL assert the agreement over a worktree list the suite
  controls — a fixture porcelain, or a fixture repository — so that no
  branch cut elsewhere on the machine can move its answer.
- WHERE the body still reads the live list, it SHALL disclose what it
  found rather than assert an equality against it.
- A POSITIVE CONTROL SHALL show the comparison still fires: a porcelain
  carrying a `task/…` branch the pattern declines reds the body.

## Read beside

`tools/e2e/tests/session-economics.spec.ts` at the `T-205-s8` tip — its
`laneFixture()` is the shape this can copy — `PORCELAIN_FIXTURE` already
in this same file at line 74, and `T-205-s8`'s card for the measurement.

## INTEGRATOR'S NOTE at the merge, 2026-09-02

Filed by the T-205-s8 lane as T-205-s6, an id the seat had already absorbed into another card at 866ac33 (its text lives there under an Absorbs heading); renumbered T-205-s10 at the merge so one id names one subject.
