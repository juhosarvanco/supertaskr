---
id: T-015-s1
title: touches [app-map] alone cannot add a test to this repository, so any card fenced that way is unbuildable
status: suggested
suggested_by: executor claude-opus-5 @T-015
---

**Addressed to the PLANNER**, which is the role that owns `touches:`.
This is a dispatch defect rather than a code defect, and it is the reason
T-015's lane built nothing.

## The measurement

`[app-map]` resolves to **C-12 and nothing else**. ARCHITECTURE says the
slug prose is *"a SIGNPOST AND NOT THE MAP"* and that the AUTHORITY is
each component file's own `touch_slugs:`; read that way,
`docs/architecture/components/C-12-map-pane.md` claims exactly two globs:

    app/src/architecture/**
    app/src/lib/architecture/**

Now enumerate every test collector this repository has —
`find . -name "vitest.config*" -o -name "playwright.config*"` outside
`node_modules`, measured at `d46f71f`:

| collector | what it collects | claiming component | slug |
|---|---|---|---|
| `app/vitest.config.ts` | `include: ["test/**/*.test.{ts,tsx}"]` | C-05 — `app/test/**` AND `app/vitest.config.ts` are both in its `paths:` | `app-shell` |
| `tools/e2e/playwright.config.ts` | `testDir: "./tests"` | none; `tools/e2e` is path-fenced, as T-090's `touches:` shows | not `app-map` |
| lib/parser (no config; package defaults) | `lib/parser/test/**` | C-06 | `lib-parser` |
| cargo | Rust only | C-05 / C-07 | `app-shell` / `crate-index` |

There is no fourth, and C-12 claims none of them. **A card fenced
`[app-map]` cannot add one test, cannot widen an include, and cannot
touch the config that would let it.** It can only edit code that nothing
runs.

## Why this is not hypothetical, and why the repository already knows it

Both prior map lanes carried `app-shell` for exactly this reason:

- **T-012** declared `touches: [app-map, app-shell]` and named
  `app/test/**` explicitly in its own *"Expected diff surface,
  exhaustively"* bullet.
- **T-013** was DISPATCHED `[app-map]`, widened to `[app-map, app-shell]`,
  and its integrator ruled the widening **RIGHT** — *"a fence that is too
  WIDE can only ever cause more serialization; a fence that is too NARROW
  is the one that misleads the next dispatch."*

T-015 was dispatched `[app-map]` anyway, which is the third map card in a
row to meet this and the second to meet it as a blocker. The value of
writing it down is that the ruling currently lives in one lane's verdict
prose, where the next dispatch does not read it.

## The fence T-015 actually needs

    touches: [app-map, app-shell]

- `app-map` — `app/src/architecture/**`, `app/src/lib/architecture/**`:
  the layout.json contract, rule 5's pin skip and ghost slot, the
  map-owned source module, the drag handlers, the pin hint.
- `app-shell` — `app/test/map-*.test.ts*` (the suite), and
  `app/src-tauri/src/lib.rs` (one `generate_handler!` line for the write
  command; see `T-015-s2`).

**`App.tsx` is NOT needed** — see `T-015-s2` for why the map can own its
own source module. **`app/src/styles/**` is not needed either**; the pin
hint and the ghost resolve through tokens the map already ships.

If the drag is to be proven under trusted input, `tools/e2e` joins the
list — that is `T-015-s4`, and it is separable, so the fence above is
sufficient for a lane that discloses the residual instead.

## The general form, which is worth more than this card

A slug whose components claim **no path any test collector reads** is a
fence in which no card can be verified. Today that is true of `app-map`,
`app-interview` (`app/src/genesis/**`) and `app-agent`'s TS half — every
one of them has its tests in `app/test/**` under C-05. Either C-05 stops
claiming `app/test/**` and each pane's suite is claimed by the pane
(`app/test/map-*` -> C-12, `app/test/genesis-*` -> C-13, …), or every
pane card must be dispatched with `app-shell` and the serialization is
accepted. **The first is the better shape** — it makes the dogfood file
counts honest about who owns which suite, and it lets pane lanes run
concurrently for the first time — but it moves live-registry fixtures, so
it is a card and not a tidy-up: CONVENTIONS' *"DECLARING A COMPONENT
moves THREE live-registry fixtures"* gotcha applies to re-claiming paths
just as much (`lib/parser/test/smoke.test.ts`,
`app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx`).

Note the second-order effect if the first option is taken: `app/test/**`
currently attributes to C-05, so C-05's file count and its status rollup
both change, and the map would start reporting a truer picture of itself.
