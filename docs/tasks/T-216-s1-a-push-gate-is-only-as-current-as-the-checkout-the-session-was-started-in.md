---
id: T-216-s1
title: A push gate is only as current as the checkout the SESSION was started in — an absent hook cannot announce itself, so the catcher has to live where the guard is not
feature: F-06
milestone: 4
priority: 1
size: S
status: building
suggested_by: executor claude-opus-5@subagent @T-216
blocked_by: []
touches: [.claude, tools/e2e, .github]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
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
worktree SHARES REFS.** From the session worktree at `4ec229c`, `main`
resolves to whatever the integration branch currently points at — a commit
its own HEAD does not contain. **In a stale CLONE the same query consults a
stale `main` and answers wrongly**, which is the guard asking the stale
thing whether it is stale. State that limit or inherit it silently.

*(The card was filed naming a specific value for that resolution. It has
moved twice since and is not restated here: **a ref is a figure and goes
stale like one**, which is the same correction T-216 itself took for a
line number.)*

### AND ANCESTRY IS NOT MERELY LIMITED — IT IS THE WRONG QUESTION

Added by the dispatch audit, 2026-09-01, measured at `06ca1c5`:

    git merge-base --is-ancestor 4ec229c 06ca1c5   -> YES, ancestor
    git rev-list --count 4ec229c..06ca1c5          -> 344

*(Both rows said `main` when written and the count read 344. `main` has
moved five times since, to 348. **Third instance of one defect on one
card** — the criterion, the amendment's demonstration table, and this
audit block, each written by the seat that had just corrected the
previous one. Pinned to the sha the line already named.)*

**The motivating checkout PASSES an ancestry test.** Being an ancestor of
the tip is not a defect a stale checkout has — it is the definition of
one. A catcher built on *"is this HEAD reachable from the integration
tip?"* would have answered **fine** for the exact session whose pushes went
ungated all sitting, and would have been another keeper incapable of
failing on its own motivating instance — the second time that trap has
been laid on this card's subject.

**Whatever the mechanism asks, it cannot be reachability alone.**
DISTANCE, or the registration itself, or the hook file's presence — the
card does not prescribe which, but it now forbids the one that measurably
does not work.

## What a first cut might ask

Not prescribed — the mechanism is the card's to choose:

- Does the checkout a session's `.claude/settings.json` was loaded from
  register every hook the integration branch registers?
- How FAR is that checkout's HEAD from the integration tip, asked
  somewhere the answer cannot come from the stale side? (Not *is it
  reachable* — the audit above measures that question answering "fine"
  for the motivating instance.)
- Where the answer is no, is it LOUD — at arm time, before the sitting,
  rather than at the push it failed to guard?

## Amendment, 2026-09-01, after dispatch — two corrections to the criteria below

**A FIGURE WENT STALE INSIDE THE CRITERION ADDED TO FORBID STALE FIGURES.**
The reachability criterion was written naming a literal distance:

    git rev-list --count 4ec229c..06ca1c5  -> 344   (fixed sha: stable)

**The typed number was already wrong against a moving symbol**, and it is
now DERIVED in the criterion rather than stated. **A figure in an
acceptance criterion is a figure like any other: it carries its ref or it
goes.** This is T-216's own line-number correction, re-earned one card
later by the seat that wrote it.

**AND THE TABLE THAT DEMONSTRATED IT CONTAINED A ROW WITH NO REF, WHICH
DECAYED WHILE THIS CARD WAS BEING WRITTEN.** The original table carried a
`4ec229c..main` row. It read 346 when written, 347 when the verifier
re-stamped it, and 348 an hour later — because `main` moves with every
commit this dispatch itself makes. The rows anchored to a fixed sha never
moved. **The row is deleted rather than re-pinned**: it measured nothing
the stable rows do not, and a demonstration of "carry your ref" that has
to be re-pinned to stay true is making the opposite point.

**A CATCHER NOTHING INVOKES SATISFIED EVERY CRITERION.** A blind phase-1
attack set, written before any implementation existed, found that criteria
1, 2 and 4 all pass against a correct catcher that is never called. The
card had no criterion requiring it to be WIRED; there is now one.

Also corrected: the reachability bullet is the **fourth** criterion. Both
dispatch briefs called it the fifth, counting past `Verification:
headless`.

**AND A MEASURED FACT THE CARD DID NOT HAVE — "REGISTERED" IS NOT A PROXY
FOR "RUNS".** This is a NOTE and deliberately not a sixth criterion; the
card is size S and has already grown once. Judge the built catcher against
it anyway.

There are TWO ways a checkout can fail to consult the guard, and from
outside they are indistinguishable:

    A. no Bash matcher registered at all      -> nothing is invoked
    B. matcher registered, hook FILE absent   -> node starts, exits 1

Measured at the integration seat, `CLAUDE_PROJECT_DIR` resolving correctly
and only the `.mjs` missing — **one fault, not two**:

    exit = 1  ("cannot find module")

**THE PORTABLE HALF IS THE EXIT CODE: 1 IS NOT 2, SO THE HARNESS DOES NOT
BLOCK.** That is what the argument rests on and it is independent of path,
platform and node version. The stderr byte count is NOT portable and is
deliberately not quoted here as a bare number — it is
`701 + len(path)` on node v22.22.0, exact at four path lengths and
re-derived independently at three. Two seats measured 881 and 761 and both
were right, at paths of 180 and 60 characters. **A byte count carries its
path the way a figure carries its ref.**

**Arm B fails open while looking fully configured.** A catcher that reads
`.claude/settings.json` and finds the registration present would pass a
checkout in arm B. The measured motivating instance is arm A; **arm B is
the one that survives an inspection of the registration.**

*(Letters are local to this note. The verification's own ground truth
labels these arms differently — this note's arm B is that document's arm
C. **Map by description, never by letter.**)*

`docs/CONVENTIONS.md` currently asserts this shape needs two faults at
once and that the process never starts. Both are false, and that document
defect is routed as **T-232** rather than folded in here.

## Acceptance criteria

- A body SHALL demonstrate the measured instance: a checkout registering
  no `Bash` matcher, a push made from it, and the fact that no guard was
  consulted established mechanically rather than by absence of output.
- The catcher SHALL be shown to fire from OUTSIDE the stale checkout —
  a control that only works when the stale checkout cooperates is the
  defect restated.
- WHERE an ancestry query is used, the stale-clone limit SHALL be stated
  in the artifact, not only in this card.
- The catcher SHALL NOT rest on reachability alone. A check that passes
  for a HEAD which is an ancestor of the integration tip SHALL be shown
  to REFUSE the motivating instance, whose HEAD is an ancestor of the
  tip and hundreds of commits behind it. **The distance SHALL be DERIVED
  at the ref under test and never typed**, because a distance measured
  against a moving symbol is stale before it is read. A test asserting
  only "an unreachable HEAD is caught" is degenerate against this card
  and SHALL be treated as absent.
- The catcher SHALL be WIRED, not merely present. A body SHALL establish
  that the ordinary act it guards — cutting a session, opening a sitting,
  running CI — actually INVOKES it, and SHALL fail if the catcher is
  removed from that path while its own file remains. A correct catcher
  that nothing calls satisfies every criterion above and is the exact
  defect this card exists to end.
- Verification: headless.
