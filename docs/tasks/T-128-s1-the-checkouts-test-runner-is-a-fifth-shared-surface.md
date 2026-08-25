---
id: T-128-s1
title: The integration checkout's test runner is a fifth shared surface, and two concurrent suite runs corrupt each other's results in BOTH directions
status: suggested
suggested_by: architect claude-opus-5
---

**Observed 2026-08-25, caused by the architect, while an integrator held
the checkout.** `T-128` names four shared surfaces — the index, the ref
namespace, the scratch directory, and the board. **It does not name this
one, and this one produces wrong measurements rather than obstructions.**

## What happened

The architect ran the full suite in `/Users/ujju/Projects/nputer` while
T-129's integrator was working there. The run came back **2 failed / 169
passed**:

    accelerators.spec.ts:151      30s timeout on locator.click
    docs-input-gate.spec.ts:787   Error: Invalid package config
                                  tools/e2e/package.json

**Neither is a defect.** Checked immediately: that `package.json` is valid
JSON and `git status` reports it untouched. **"Invalid package config" on
a file that is provably fine is the signature of two npm/Playwright runs
in one directory**, and the 30-second click timeout is the same collision
seen from the other side.

## Why this is worse than the four already listed

**The corruption is SYMMETRIC and it is silent.** The architect's run was
spoiled, but so, potentially, was the integrator's — and an integrator's
suite result is what a merge is certified on.

Two failure directions, both bad:

- **A spurious RED** the integrator would investigate, and might attribute
  to a known intermittent. **`T-120-s3` is the trap here**: a red in
  `tools/e2e` is now habitually read as the fractional-millisecond
  intermittent. Neither of these two failures carried those digits, but a
  reader pattern-matching on "one e2e body red" would have filed it there
  and moved on.
- **A spurious GREEN**, which is worse, because nothing prompts a
  second look.

**Every other surface in `T-128` obstructs or confuses. This one
certifies.**

## What makes it hard to see

The four listed surfaces are all *git* state, and the project has built
reflexes for git state — check the index, filter the worktree list, name
your scratch directory. **A test runner is not git state, so none of those
reflexes fire.** The checkout looks idle: `git status` is clean, no lock
file exists, nothing is staged. The only evidence is a running process,
and the pre-write ritual does not look for one.

## The shape of a fix, not the fix

Three arms, cheapest first, none of them ruled:

1. **Detect and refuse**, the same way integrator rule 1 already detects a
   live product before a fresh install: ask the OS whether a suite is
   running in this checkout before starting one, and **refuse loudly**
   rather than continue. The precedent and the wording already exist.
2. **Give the architect its own checkout for reads.** The project already
   built a second checkout for @human's app for a structurally identical
   reason — *"a rule that only holds when the setup is right is not a
   rule."* A dispatcher that must run a gate's owed suites should not run
   them where a merge is being certified.
3. **State the priority explicitly**: while an integrator holds the
   checkout, it owns the runner. Everyone else waits or goes elsewhere.
   Cheapest of the three and it is only prose — which `T-131` argues is
   exactly the kind of rule that does not bind.

**Arm 1 is the one with precedent and a positive-control requirement
already written**: a check that cannot tell a live run from an absent one
is not a check, so it must be proved to let the ordinary case through as
well as stopping the concurrent one.

## Two facts worth keeping with it

- **The architect disclosed to the integrator immediately** rather than
  waiting for it to discover a red it could not explain, and asked it to
  re-run and declare both runs naming the first as possibly contaminated.
  **That disclosure is the only reason the contamination is attributable
  at all** — nothing in the tree records it.
- **This is the sixth instance of `T-128`'s class in one session**, and
  the second caused by the architect. The pattern holds: the lanes
  produced correct work all night and every defect was in the machinery
  around them.
