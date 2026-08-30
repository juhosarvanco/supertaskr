---
id: T-111-s12
title: A column-zero `- ` inside a docs/CONVENTIONS.md bullet splits that bullet silently — the guard that catches it only runs for the handful of phrases some reader happens to pass to conventionsBullet, and POISON DRILL is not one of them
feature: F-01
milestone: 4
priority: 6
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-111-s10
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY `T-111-s10`'S OWN DRILL, WHICH IS THE ONLY REASON IT WAS
LOOKED FOR.** That lane added ~6.1 KB to the POISON DRILL bullet and was
warned in its brief that `rawBullet` THROWS on an opener change. It does
— measured — **but only for the five or six phrases a reader actually
passes it.** The lane then asked the obvious follow-up: what catches a
column-zero `- ` inside a bullet nobody calls `conventionsBullet` for?
Three readers say nothing.

## What was measured, in a detached drill worktree at `e967701`

Stem `t111s10drill`, one stem on the worktree and the results, detached,
`git status --porcelain` empty at every step, every mutation read back
with `git diff` before its run, every restore proved sha256-identical
against HEAD.

| mutant | one side | observed |
|---|---|---|
| **M1** `- POISON DRILL (` -> `- POISON RITUAL (` | the document | **KILLED** — `brief.mjs` ROW 9 loses `POISON DRILL` and gains `POISON RITUAL`. The document is genuinely read; a green suite over it is not vacuous. |
| **M2b** `- THE RANGE RULE: WHICH TWO COMMITS` -> `- THE RANGE GUIDE: …` | the document | **KILLED** — `rawBullet` throws *"has 0 bullets containing \"THE RANGE RULE:\", expected exactly one"*. The opener guard is live where a caller exists. |
| **M3b** two spaces -> `- ` at column zero on a line INSIDE the POISON DRILL bullet | the document | **SURVIVED** `npm run lint:docs` (exit 0) and `brief.mjs` ROW 9 (15 named bullets before and after, `POISON DRILL` still listed). |

**AND THE FIRST TWO ATTEMPTS AT THIS FINDING WERE BOTH FALSE KILLS**,
which is why the row above is stated so narrowly. `rangeRuleBullet()`
was called with no argument, so it threw `undefined.split` under the
mutant AND under the clean tree; and `conventionsBullet(md, "POISON
DRILL")` throws at EVERY ref, because that phrase appears in three
bullets — `git show <ref>:docs/CONVENTIONS.md` gives **3** at `39f2302`
and **3** at `e967701` alike, so nothing about it moved. Both were
caught only by running the POSITIVE CONTROL on the restored tree. This
is docs/CONVENTIONS.md's own poison SHAPE TEN happening inside a drill
of docs/CONVENTIONS.md.

## What is NOT established

The mutant was **not** run under `npm test` from tools/e2e/, from app/,
or under `cargo test`: the drill worktree had only `tools/e2e`
installed, and playwright's own preflight refuses to load a config
without `app/node_modules` — which is the *"THE APP SUITE NEEDS A BUILD
BEFORE IT CAN BE DRILLED"* clause of the very bullet being edited,
arriving on schedule. So the claim here is **three dependency-free
readers and `lint:docs` do not catch it**, not *"nothing catches it"*.
Closing that gap is this card's first job and it is cheap.

## Why it matters

`docs/CONVENTIONS.md` is a code input for four suites (the DOCS GATE
derives 23 readers across them). A silent bullet split changes what
every bullet-shaped reader believes the file contains — and the two
readers that DO refuse, `rawBullet` and `conventionsBullet`, refuse only
when the phrase they were handed stops identifying exactly one bullet.
That is a guard keyed to the caller list, not to the document, so it
grows a hole for every bullet no reader happens to name. The bullets
with the most prose are the ones most likely to gain a stray `- ` and
the least likely to be on that list.

## Acceptance criteria

- THE lane SHALL first re-run M3b under the FULL owed suite set with the
  drill worktree properly built (lib/parser, then app, then tools/e2e),
  and record whether anything reds — the finding above is explicitly
  partial and this criterion is what closes it.
- WHERE nothing reds, THE gate SHALL gain a check that no line inside a
  named bullet begins at column zero with `- ` unless it opens a bullet
  the document intends — derived from the document rather than from a
  list of phrases, so it holds for every bullet and not only the named
  ones.
- THE check SHALL carry a positive control that plants the split and
  requires the red, per `A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`.
- THE lane SHALL NOT weaken `rawBullet` or `conventionsBullet`: they are
  correct about what they check and this card is about what nothing
  checks.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
