---
id: T-202-s3
title: A solo-guard body that FAILS leaves its lock file in tmpdir(), because the release sits after the assertions instead of in a finally — the same hygiene wart T-202-s1 fixed in its own body, still live in the one beside it
feature: F-06
milestone: 4
size: S
priority: 5
status: planned
suggested_by: verifier claude-opus-5@subagent @V-T-202-s1, measured at 18c88e3, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured

`tools/e2e/tests/gate-run.spec.ts:526` — *"a solo suite is REFUSED while
another run holds the lock, rather than queued behind it"* — acquires the
solo lock, asserts, and releases on the LAST line of the `try`:

    const answer = JSON.parse(probe.stdout || "{}");
    expect(answer.ok).toBe(false);
    expect(String(answer.reason)).toContain("REFUSING rather than waiting");
    if (first.ok) first.release();

A failing `expect` throws before that release ever runs, and the `finally`
below it removes only the fixture directory, not the lock — which lives
in `tmpdir()`, not in the fixture. Its spawned probe has no release
either, so when a mutant makes the probe's acquire SUCCEED, the child's
lock is left behind as well.

Measured while drilling `T-202-s1` at `18c88e3`, in a bench detached at
that tip. Two one-sided mutants of `gate-run.mjs` that red this body —
mixing `process.pid` into the key, and disabling the refusal branch —
each left lock files behind in
`/var/folders/8h/…/T`, counted as the set difference of
`nputer-gate-run-*.lock` before and against after: the pid-keyed mutant
left **2**, the refusal-disabled mutant left **1**. All three held DEAD
pids afterwards, and were removed by hand.

## Why this is not already fixed

`T-202-s1` found and fixed exactly this in the body it ADDED — its notes
say so in its own words, and its remedy is the shape to copy: the release
runs from the `finally`, and the spawned probe gives back anything it was
granted. The body above it was outside that card's ask and kept the wart.
Re-measured at the same tip to be sure the fix is real and the gap is
real: a mutant that reds ONLY the new body leaves **zero** lock files;
the two that red this one leave two each.

## Why it is small

A leaked lock holds a dead pid, and a dead holder is RECLAIMED rather
than wedging the gate — `gate-run.spec.ts:557` proves that, and it is why
this is litter and not a defect. It also only appears when the body
FAILS. It is filed because the machine-scoped directory is the very
surface `T-202-s1` is about, and because the same class in the same file
was judged worth fixing one body away.

## What is asked

Move the release into the `finally` and have the probe return any lock it
was granted, matching the body added by `T-202-s1`.

## Acceptance criteria

- With a mutant that reds this body, the set of `nputer-gate-run-*.lock`
  files in `tmpdir()` is unchanged across the run — demonstrated by
  taking that set before and after, not asserted.
- The body still reds under that same mutant; the hygiene fix must not
  cost the assertion.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 5, at the T-202-s1 merge (0856ed7)

The architect seat. The same release-after-assertions wart T-202-s1 fixed in its own body, one body above it; gate-run.spec.ts is free now.
