---
id: T-137-s1
title: The fixture reconciliation T-137's merge owes — three assertions, two files, all of them app-shell, measured rather than forecast
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [app-shell]
---

**FOR WHOEVER INTEGRATES `T-137`.** That card moves the pure schedule from
`app/src/architecture/` into `lib/parser/` and adds two source files and
two test files under `lib/parser/`. The GRAPH REGEN gate fires; the lane
committed no graph (a lane never does), so the reconciliation lands on the
integrator.

**IT WAS MEASURED, NOT PREDICTED.** The lane regenerated the graph in a
DETACHED scratch worktree holding its own tree, then ran the app suite
against it. Exactly three assertions move:

    app/test/architecture-dogfood.test.ts   fileComponent.size  183 -> 187
    app/test/architecture-dogfood.test.ts   ["C-06", 27]     -> ["C-06", 31]
    app/test/map-dogfood-render.test.tsx    "committed graph · 183 files" -> "… 187 files"

With those three applied and the graph regenerated: **`npm test` from
`app/` is 1013/1013, exit 0.** No other body moves.

**WHAT DOES NOT MOVE, WHICH IS THE HALF THAT GETS ASSUMED.** `C-12` holds
at **18** files, its file LIST is unchanged, and every edge row involving
it (`["C-12","C-06","confirmed",6]`, `["C-12","C-16","confirmed",7]`) is
unchanged — because the extraction leaves a module at
`app/src/architecture/task-waves.ts` that still imports the parser and
still imports `verdicts.ts`. `arch` moves on exactly two rows: the graph
header and C-06's file count. `edges=37`, `findings=4`,
`drift_components=4`, `arch drift` — all unchanged.

**ALSO COSMETIC AND NOT ASSERTED:** the `it()` title in
`architecture-dogfood.test.ts` reads *"all 183 files map"*. It is a title,
so nothing reds, and it is worth fixing in the same edit.

**WHY THE LANE DID NOT MAKE THIS EDIT.** `app/test/**` is C-05,
`touch_slugs: [app-shell]`, outside `T-137`'s fence `[lib-parser, app-map,
tools/e2e]` and held by `T-139`'s live lane for most of the build.
Widening a fence from inside a lane is the one repair an executor may
never make.
