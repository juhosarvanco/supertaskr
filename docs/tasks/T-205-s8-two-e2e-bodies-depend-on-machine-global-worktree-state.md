---
id: T-205-s8
title: Two session-economics bodies assert the assembler exits 0, so ANY live worktree whose id has no card reds them — the suite's answer depends on machine-global state no ref controls
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/e2e/tests/session-economics.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE SAME TREE MEASURED GREEN AND THEN RED WITH NO COMMIT BETWEEN
THEM.** At `c08f260`, `gate-run e2e` was **619 bodies GREEN** at
2026-09-02T10:39:44Z. At the SAME ref, roughly four and a half hours
later, the same suite reported **2 failed / 617 passed**. Nothing in the
repository changed. What changed was the machine: a peer seat cut
`/Users/ujju/Projects/nputer-T-216-s8` on
`task/T-216-s8-unjudged-push-refused`, and **no card on the board
declares `T-216-s8`** — its siblings `T-216-s4` and `T-216-s7` exist and
it does not.

`brief.mjs` is right to refuse: *"a lane whose fence cannot be read is a
fence nobody can be disjoint from"* is `T-209`'s guard doing its job, and
exit 1 is the correct answer to the question it was asked. **The defect
is on the test side.** These two bodies —

    tests/session-economics.spec.ts:179  the recommended seat is a function of the CARD…
    tests/session-economics.spec.ts:365  the advisory line is NOT a contract row…

— both assert `expect(run.status).toBe(0)` against a real invocation of
the assembler in the real checkout, so they inherit `git worktree list`,
which is machine-scoped and belongs to no ref. **A body whose answer
depends on which OTHER lanes a colleague happens to have open is not
measuring the property it names.** Neither body is about lane
disjointness at all: 179 is about the recommendation being a function of
the CARD and not the environment — which is exactly the property it
fails to have — and 365 is about the advisory line's POSITION relative to
row 13.

**MEASURED, and the attribution is a control rather than a reading.**
Run alone at the T-205 tip `48285b5`: 2 failed, 8 passed. Run alone at
the base `c08f260`, where the T-205 diff does not exist: **the same 2
failed, the same 8 passed, the same `T-216-s8` cause.** The diff is
exonerated by measurement.

**WHY IT MATTERS BEYOND ONE STRAY WORKTREE.** This is the third member of
the family `docs/CONVENTIONS.md` already names — the SCRATCH RULE, the
PORT RULE and the E2E PORT rule all exist because *a defaulted
machine-scoped surface is a collision waiting for a second seat*. The
worktree list is the same class and has no rule. Under concurrent lanes,
which this project runs by design, a suite that reads it will red for
whoever measures last, and it will be attributed to their diff.

## Acceptance criteria

- THE two bodies SHALL assert the property each names without depending
  on the checkout's live worktree list — by driving the assembler against
  a controlled lane set, or by asserting on the recommendation and the
  advisory position independently of the run's exit code.
- A BODY SHALL demonstrate the isolation: with a planted undeclared lane
  present, the two bodies still pass, and the assembler's own refusal is
  still exercised somewhere that MEANS to exercise it.
- THE FIX SHALL NOT weaken `brief.mjs`'s refusal, which is correct
  (`T-209`) and is the half that must not move.

## Read beside

`tools/e2e/tests/session-economics.spec.ts`,
`tools/e2e/scripts/dispatch-brief.mjs` (the lane list is derived from
live worktrees), `T-209`, and `docs/CONVENTIONS.md`'s SCRATCH RULE /
PORT RULE family — one class, three spellings, and this is the fourth.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-225-s2 merge (6691fc5)

The architect seat. Two benches paid a red e2e leg for it this sitting: any live lane cut after the bench ref reds session-economics. Fence narrowed from tools/e2e to the one spec file.
