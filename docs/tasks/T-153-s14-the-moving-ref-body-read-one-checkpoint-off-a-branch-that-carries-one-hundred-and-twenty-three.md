---
id: T-153-s14
title: The MOVING-ref body read ONE Checkpoint off a branch that carries a hundred and twenty-three, on a runner whose ref state reproduces green everywhere else — the only body of the twenty-nine still red on a pull_request checkout
feature: F-01
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: [T-153-s13]
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-153-s9
builder:
verifier:
built_by:
verified_by:
review:
---

## What is left over from T-153-s9

`T-153-s9` fixed the integration-branch resolution and proved it on a
real `pull_request` checkout: run `33275876129`, head `cbaa33f5d803`,
**28 of the card's 29 bodies green**, every step before the e2e lane
green including `index --check` and the whole-tree docs gate. One body
did not close, and its failure is a DIFFERENT cause from the one that
card names.

`brief.spec.ts`'s *"a figure read from the MOVING integration ref is a
LIVE fact — two reads at ONE ref disagree"* builds its second read by
dropping the newest `Checkpoint:` line and everything above it, so it
needs a second `Checkpoint:` below. On that run it reported:

    main carries only one Checkpoint here, so a second read cannot be
    built out of it

Before the fix, the same body on the same event died earlier and
differently — inside `git()` with `fatal: ambiguous argument 'main'`
(run `33272976860`, T-153-s6's lane, same body). So this precondition
failure is not the old defect wearing a new message; it is what the old
defect was hiding.

## Why it is a card and not a correction

**THE RUNNER'S REF STATE DOES NOT REPRODUCE IT**, and that was measured
rather than assumed. The state was rebuilt exactly — a fresh clone of the
remote, `git checkout --detach refs/remotes/pull/5/merge` at the run's own
head, the local `main` deleted, `main` verified NOT to resolve, the same
`refs/remotes/origin/*` set — and driven through that clone's own copy of
these scripts:

    integrationRef origin/main
    481 first-parent lines, 123 Checkpoints, newest at index 0

The precondition holds there and the body passes. GitHub confirms the
base independently: `cbaa33f5d803`'s first parent is
`f63f8a0dc0c12cba642ddb3ba2245f6b7c587436`, which is `origin/main` at
fetch time and is itself a `Checkpoint:` commit with a hundred and
twenty-two more behind it.

So the runner read a log its ref state does not explain, and no
hypothesis available from outside the runner distinguishes:

1. **A short READ, not a short branch** — `execFileSync` handing back a
   truncated stdout for a ~100 KB, 481-line pipe. This repository has a
   live, carded intermittent of exactly this family on Linux: `T-161`,
   a child's output racing its exit, filed the same night off main's
   first green-run attempt. Different language and different call, same
   shape. **If this is it, the defect is not in the body at all** and the
   remedy belongs beside `T-161`'s.
2. **A different revision than the reproduction resolved** — something in
   the runner's repository making one of the three candidate spellings
   answer with a commit whose first-parent chain is short.
3. **A genuine property of that checkout** nobody has named yet.

Guessing between them is how a body gets "fixed" by being weakened.

## What is already in place

`T-153-s9` left the precondition DISCLOSING, at commit `3f374a0`: it now
names the branch, the ref it resolved to, the first-parent line count,
the Checkpoint count, the index of the newest one and the head line. **A
single `pull_request` run of that code answers the question.** It has not
been run: the next CI cycle died at `install cargo-audit` before reaching
the e2e lane, which is `T-153-s13` and is why this card is blocked on it.

## Acceptance criteria

- THE lane SHALL read the disclosure off a real `pull_request` run and
  state which of the three readings above the numbers support.
- WHERE the read is short, the fix SHALL be to the READ and the body
  SHALL be left alone; where the branch really is short on that checkout,
  the body SHALL keep its experiment and gain a subject it can build on
  BOTH event types — never a skip, because a body that goes quiet on the
  one instrument a lane can fire is the hole `T-153-s9` was written to
  close.
- THE fix SHALL be proven on a `pull_request` run per body, and the
  reproduction that failed to reproduce here SHALL be re-run after it.

**FENCE.** `tools/e2e`.
