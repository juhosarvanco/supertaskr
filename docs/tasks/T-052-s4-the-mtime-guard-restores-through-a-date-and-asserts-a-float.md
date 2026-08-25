---
id: T-052-s4
title: The P6 mtime-restore defect reproduces on demand in an already-healed worktree, which is what makes its fix verifiable in place
status: suggested
suggested_by: executor claude-opus-5 @T-052
---

> **READ `T-120-s3` FIRST — IT IS THE PRIMARY ACCOUNT AND IT IS FULLER
> THAN THIS ONE.** T-120's lane found the same defect independently,
> within the same hour, and characterised it further: the `Date`
> rounding, the one-token fix, a 50-of-50 probe showing fresh writes
> almost always carry a sub-millisecond mtime, and a three-checkout
> table. **This file is not a second report of that defect.** It keeps
> only the one thing it adds, and it exists so triage sees both.

**THE DUPLICATION IS ITSELF THE FINDING.** Two independent lanes hit
`tools/e2e/tests/token-scan.spec.ts:201` on their first full `npm test`
from `tools/e2e/`, both spent a diagnosis on it, and both correctly
concluded it was not theirs. That is the cost this defect charges per
fresh worktree, paid twice in one evening — and it is the argument for
dispatching the one-token fix rather than parking it a second time.

## What this lane adds: it reproduces WITHOUT a fresh checkout

`T-120-s3` closes with *"HOW TO REPRODUCE, since the obvious way does
not work"* — cut a fresh worktree, install, run once, because
*"re-running in a worktree that has already gone red proves nothing"*.
That is true of re-running. It is not true of the defect.

**The precondition is one file's mtime, and you can set it.** Measured
at T-052's tip in a worktree that had ALREADY healed itself:

    node -e "const fs=require('fs'); const f='tools/e2e/fixtures/shell.ts';
             const m=(fs.statSync(f).mtimeMs + 0.1958)/1000;
             fs.utimesSync(f, m, m);"
    npx playwright test tests/token-scan.spec.ts

| fixture mtime | result |
|---|---|
| whole milliseconds (healed) | **10 passed**, three consecutive runs |
| fractional millisecond, set as above | **1 failed / 9 passed**, named, same Expected/Received shape |

So it is not a flake and not once-per-checkout-only: **it is a
deterministic function of one file's mtime precision, and the precision
is settable.** Three greens then a red on demand, in one worktree,
without cutting anything.

## Why that matters for the card that fixes it

`T-120-s3` argues the fix *"belongs to a card that can cut a fresh
checkout to prove the fix"*, on the reasoning that a healed worktree
cannot re-red. **It can**, so the fix is provable in place: set the
fractional mtime, watch it red, apply the one-token change, set it
again, watch it green. That removes the fresh-worktree prerequisite from
the card's cost — a `npm ci` in three packages plus a cold build — and
turns the proof into a POISON DRILL of the ordinary kind, one side only,
on a file whose content never changes.

**The fix itself is `T-120-s3`'s and is not restated here** beyond
noting this lane's independent probe agreed: `utimesSync` round-trips a
sub-millisecond value exactly when it is given seconds as a number, so
the strict `toBe` can stay. Fence `[tools/e2e]`.

**Restoration proof for this lane's own probing**:
`tools/e2e/fixtures/shell.ts` was left byte-identical to
`HEAD:tools/e2e/fixtures/shell.ts`, sha256 `2e55d8e5…`, with a
whole-millisecond clock and a clean `git status`; the full E2E suite is
145/145 at exit 0 afterwards.
