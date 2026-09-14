---
id: T-203-s2
title: "`docs/CONVENTIONS.md`'s legend for `token-unkeyed` still reads *tracked files were dirty*, and the reason now also refuses a run that SPANNED a commit — a refused seat reads the wrong remedy"
feature: F-06
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-203-s1, from inside the fence that could not reach the file, 2026-09-09"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-203-s1` widened `token-unkeyed`. It now fires for three things, not
one: tracked files modified when the battery ran, an entry that recorded
no tree at write time (a token minted by the previous runner), and — the
new one — an entry whose two trees disagree, meaning **a commit landed
while the suite was running**.

The gate-runner bullet in `docs/CONVENTIONS.md` still legends it as

    `token-unkeyed` (tracked files were dirty when it was minted)

which is one of the three. A seat refused for the spanning case reads
that line, checks `git status`, finds a clean tree, and has been sent to
look at the wrong thing — which is precisely the failure the split
between `token-red` and `token-unmeasured` was made to avoid one line
further up the same bullet.

**IT COULD NOT BE FIXED IN THE LANE THAT CAUSED IT.** `T-203-s1`'s fence
was `gate-run.mjs`, `gate-token.mjs` and `gate-run.spec.ts`;
`docs/CONVENTIONS.md` is outside it, and the guard's own detail sentence
(which IS correct and does name the spanning case) was the only place
the executor could put the words.

## Class parent

`T-203` — the verdict token's own card, which owns the refusal names and
whose bullet this is.

## Disposition hint

Promote small and land it AT THE MERGE of `T-203-s1` if the integrator
is already in the file; otherwise a one-line card. The change is a
parenthesis: name all three cases, or say "the key does not describe
what the suites ran against" and let the guard's own detail enumerate.
Worth checking `docs/reference/10-gates.md` in the same pass — it names
`token-stale` "and their kin" and may be fine as written.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains docs/conventions/ whole, because neither its text, its fence nor its title names a chapter — the lane narrows it to the chapter its rule lives in as its own act. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
