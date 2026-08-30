---
id: T-140-s5
title: npm run build from app/ exits 2 at main on two unused locals in review-badge.test.tsx — the second tsc is the load-bearing gate T-073 named, and it has been red since T-169's merge
status: suggested
suggested_by: executor claude-opus-5 @T-140-s1
---

**FOUND BY `T-140-s1`'s LANE AND PROVEN INHERITED, not caused by that
lane's diff.** Measured both ways at the lane's base `ed42c44` — the
T-140-s1 dispatch stamp, one commit after `ef316c8` — with the working
tree stashed to the base and the exit read unpiped from `$?`:

    cd app && npm run build
    -> EXIT 2

    test/review-badge.test.tsx(5,1):  error TS6192: All imports in import
                                      declaration are unused.
    test/review-badge.test.tsx(98,7): error TS6133: 'ROADMAP_SRC' is
                                      declared but its value is never read.

Nothing else in the tree errors. The same two lines, and only those two,
appear with `T-140-s1`'s full diff applied.

## Why this is worse than a lint nit

`npm run build` from `app/` is `tsc && tsc -p tsconfig.test.json && vite
build`, and **`ARCHITECTURE.md`'s genesis interface bullet makes the
SECOND `tsc` load-bearing**: "the write surface lives in a second tsc
PROGRAM (`tsconfig.test.json`), and `npm run build`'s second `tsc` is the
load-bearing gate (T-073)". Because the three commands are `&&`-chained,
a failure in the second one means **`vite build` never runs**, so
`app/dist` is never produced — and CONVENTIONS' own standing hazard says
"an UNBUILT app tree fails `npm test` about `app/dist`". So one unused
import in a test file takes out the app build, the bundle, and a handful
of suite bodies that read the bundle, all with messages that point
somewhere else.

`T-140-s1`'s lane worked around it by running `npx tsc` and `npx vite
build` separately (both exit 0 over its own diff) and reported the
composite as red with this cause. **That workaround must not become the
practice.**

## What moved it

`git log -1 -- app/test/review-badge.test.tsx` names `604cf4b`, T-169's
integration commit. The file's own header block explains that a
provenance-rendering body was MOVED to its component at that merge (the
drift detector caught an undeclared C-08→C-09 edge and the fix was to move
the test rather than declare the edge) — the imports and the `ROADMAP_SRC`
constant the moved body used stayed behind.

## What this card would do

Delete the two dead declarations, or restore a use for them, and say which
— a constant a moved test left behind is a different fact from an import
nobody needed. **Then run `npm run build` from `app/` and read the exit
unpiped**, because that is the check that has been unread for as long as
this has been red.

## Fence

`app/test/review-badge.test.tsx` is in **no current fence** — it is
`app-board`'s territory (C-08/C-09), and `T-140-s1`'s manifest expands
through `crate-index + app-map + app-shell` and does not list it. That is
why the lane that found it could not fix it, and why this is a card rather
than a line in a checkpoint.
