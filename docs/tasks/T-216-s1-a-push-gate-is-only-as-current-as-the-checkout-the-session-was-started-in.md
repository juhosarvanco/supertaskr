---
id: T-216-s1
title: A push gate is only as current as the checkout the SESSION was started in — an absent hook cannot announce itself, so the catcher has to live where the guard is not
feature: F-06
milestone: 4
priority: 1
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-216
blocked_by: []
touches: [.claude, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND ON T-216'S CARD, NOT BUILT THERE — and the split is that card's
own argued ruling.** T-216 fixes which TREE the push guard judges. This is
the other half of "the guard is a function of the wrong checkout": which
COPY of it ran, and whether one ran at all.

**Class parent: none — T-216 is the SIBLING it split from, not its
parent.** Disposition hint: promote, and dispatch it to a seat that can
touch the dispatch ritual or CI, because the fence above is almost
certainly wrong for the real remedy.

## The measured instance is on T-216's card

At the integration seat on 2026-09-01, hours after `T-203` landed the push
gate: the dispatching session's project directory was a git worktree at
`4ec229c`, hundreds of commits behind, whose `.claude/settings.json`
registers only the lane-fence hook and which carries no
`push-guard-hook.mjs` at all. **The guard never ran, across an entire
sitting of pushes.** Driven by hand it was correct in both checkouts;
nothing invoked it. What saved the tree was the habit of running
`gate-run --all` by eye — the exact substitute the guard exists to
replace.

## Why T-216 could not build this, argued rather than asserted

The candidate remedy offered on that card — *the guard announces its own
provenance* — **cannot reach its own motivating instance**, and T-216's
blind verifier reached the same conclusion independently from the
contract:

- A **stale** guard RUNS, so it can announce.
- An **absent** guard runs NOTHING, and ABSENT is the half that was
  measured.

Any announcement added to `push-guard.mjs` is emitted only by checkouts
that already carry it — exactly the checkouts that do not need it. Shipped
inside T-216 it would have been a keeper structurally incapable of failing
on the instance it was written for, which is `NORTH_STAR`'s known-vacuous
keeper and the class `T-229` exists to name.

**So the catcher must run where the guard is not**: at arm/dispatch time
(the seat that cuts a session comparing that session's project checkout
against the integration branch), in CI, or in the settings registration
itself. That is a different mechanism from a `PreToolUse` decision module,
which is why this is a card and not a paragraph in T-216's diff.

## The trap any implementation inherits

**An ancestry test is answerable from a stale WORKTREE only because a
worktree SHARES REFS.** Measured on that card: from the session worktree
at `4ec229c`, `main` resolves to `4c33125` — a commit its own HEAD does
not contain. **In a stale CLONE the same query consults a stale `main` and
answers wrongly**, which is the guard asking the stale thing whether it is
stale. State that limit or inherit it silently.

## What a first cut might ask

Not prescribed — the mechanism is the card's to choose:

- Does the checkout a session's `.claude/settings.json` was loaded from
  register every hook the integration branch registers?
- Is that checkout's HEAD reachable from the integration tip, asked
  somewhere the answer cannot come from the stale side?
- Where the answer is no, is it LOUD — at arm time, before the sitting,
  rather than at the push it failed to guard?

## Acceptance criteria

- A body SHALL demonstrate the measured instance: a checkout registering
  no `Bash` matcher, a push made from it, and the fact that no guard was
  consulted established mechanically rather than by absence of output.
- The catcher SHALL be shown to fire from OUTSIDE the stale checkout —
  a control that only works when the stale checkout cooperates is the
  defect restated.
- WHERE an ancestry query is used, the stale-clone limit SHALL be stated
  in the artifact, not only in this card.
- Verification: headless.
