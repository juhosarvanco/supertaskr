---
id: T-203-s3
title: "The `gate-verdict` LINE carries the ref and not the tree, so the disagreement a spanning run creates is visible only to a process that opens the token — the seat watching the terminal sees a plain GREEN"
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-203-s1, considered and declined inside that fence, 2026-09-09"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

After `T-203-s1` the TOKEN carries both trees — `tree` (what the suite
started against) and `treeAtWrite` — and `push-guard.mjs` refuses their
disagreement. The printed `gate-verdict` line carries neither: it is
`suite= exit= bodies= targets= ref= verdict= reason=`.

So a seat that ran the battery, watched it go green in the terminal and
then tried to push meets its first news of the spanning run at the push
guard, minutes later, in a refusal. The runner already knew at write
time. **The line is printed LAST precisely so the last thing a reader
sees is the thing they should trust**, and today it is silent about the
one condition that will refuse them.

## Why `T-203-s1` did not just do it

Two reasons, both worth inheriting rather than rediscovering:

1. `REQUIRED_VERDICT_FIELDS` is pinned by a body against `T-202`'s
   criterion 3 list, which is typed into the spec independently of the
   runner so a requirement cannot be deleted together with its own test.
   Growing the REQUIRED set is `T-202`'s business, not a side effect of
   a token card. (Adding an OPTIONAL field to the printed line does not
   touch that pin — `parseVerdict` reads every `k=v` it finds.)
2. `tools/e2e/tests/brief-flush.spec.ts` carries a measured size for
   this line — *"gate-run.mjs 120 B for one suite"*, taken at `209e5d3`
   — inside the argument for why that script is not in the flush class.
   Two 40-character hashes roughly double it. It stays bounded and the
   membership argument survives, but the figure is part of a sweep and
   whoever moves the line should re-measure it in the same commit.

## Class parent

`T-203` — the verdict token; `T-202` owns the line's field set.

## Disposition hint

Low priority and genuinely optional: the token is the machine's channel
and it is now honest. If taken, print `tree=` (and only on disagreement,
`treeAtWrite=`) as NON-required fields, and re-measure the brief-flush
figure in the same commit.
