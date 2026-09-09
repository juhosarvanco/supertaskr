---
id: T-238-s3
title: "`lane-fence.mjs`'s `gitDirOf` and `headRefIn` swallow every errno, so `not-a-repository` and `not-integration` stay silent allows under descriptor pressure — the third probe T-216-s8's attribution names, and the only one T-238-s1's fence could not reach"
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-238-s1
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE THIRD PROBE, LEFT STANDING BECAUSE A FENCE COULD NOT REACH IT.**
T-216-s8's attribution of the holder control's load-only red enumerated
every route to a SILENT ALLOW and found each one reached through a
filesystem probe that cannot tell *"it is not there"* from *"I could not
look"*. T-238-s1 repaired the two inside its own fence — `readHolder`'s
first line in `checkout-currency.mjs`, and `decideWith`'s
indexer-manifest check in `push-guard.mjs`, both of which now read the
errno and announce anything that is not `ENOENT`. The third is this one
and it was out of fence.

`gitDirOf` wraps `statSync` and `readFileSync` in bare `try`/`catch` and
returns `undefined` for every failure; `headRefIn` does the same around
its own `readFileSync`. So under `EMFILE` or `EACCES`:

- `findCheckoutRoot` answers *no checkout here*, and the push guard takes
  the silent `not-a-repository` allow — every arm below it unasked.
- `readHeadRef` answers *no branch*, and `holderVerdict` answers
  `not-integration`. T-238-s1 made THAT case announce (a checkout naming
  no branch holds no seat and now says so), so this half is covered from
  the other side — but it is covered by a sentence about a DETACHED
  checkout, which is not what happened.

## Acceptance criteria

- WHERE `gitDirOf` or `headRefIn` cannot read what it asked for, THE
  reader SHALL distinguish `ENOENT`/`ENOTDIR` from every other errno and
  say which, rather than collapsing both into `undefined`.
- THE callers SHALL keep their current answer for a genuine absence and
  SHALL NOT turn an inability into a silent allow; a body SHALL produce a
  non-`ENOENT` errno (`chmod 000` on the directory, the way
  `push-guard.spec.ts` and `checkout-currency.spec.ts` already produce
  one) rather than simulating it, with the readable case as its control.
- Verification: headless.

## Note at the merge (the architect seat, 2026-09-09, from the T-238-s1 executor after its verdict)

The criteria name only `gitDirOf` and `headRefIn`, but `findCheckoutRoot` in lane-fence.mjs carries its own bare-catch `statSync`; a lane taking this card widens it by that one function, or closes half of what it identifies.
