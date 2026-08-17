---
id: T-051-s5
title: The minHeight guard measures a one-node map, so the floor's real headroom is 8px and nothing watches it
status: suggested
suggested_by: verifier claude-opus-5 @T-051
---

T-051's floor guard and T-051's own measurement table render **two
different maps**, and only the shorter one is guarded.

`tools/e2e/tests/window-contract.spec.ts:249` builds its natural-height
table by arriving at the map through `openBoard(page)` — the lane's own
`boardFixture`. That payload produces a **one-node** map whose natural
height is **320px**. The test's own failure message says so out loud;
driving `minHeight: 600` through it prints:

    the tallest screen that must fit is the no-plan card at 663px
    (all of them: {"genesis":302,"front door":475,"no-plan card":663,"map":320})

The criterion-3 table two tests down (`:308`) reaches the map through
`repoBoard(1)` — this repo's own `docs/` tree — which produces an
**eleven-node** map. Measured on `task/T-051-window` at f60b3e8, headless
Chromium, dev bundle on a scratch port:

    map(repo tree)  natural @1024 = 692     nodes 11
    map(repo tree)  @1024x691: page 692/691   ← does not fit
    map(repo tree)  @1024x692: page 692/692   ← the exact threshold
    map(lane fixture) natural @1024 = 320     nodes 1

So the declared floor of **700 clears the map the table actually renders
by 8px**, not by the margin the card's derivation implies. T-051's notes
list the natural heights as

    genesis 302 · front door 475 · map ≤600 · no-plan card 663 ← binding

and call 663 "the binding constraint … with 37px to spare". On the tree
the sibling test renders, the binding constraint is the **map at 692**,
with **8px** to spare, and `map ≤600` is not a measurement of it.

Nothing is broken today: at 1024×700 the repo-tree map measures
`page 700/700` and criterion 3 holds. What is missing is the guard. The
map's height is node-count driven and node count grows with
`docs/ARCHITECTURE.md`; the first component that pushes it past 700 puts
a screen's own overflow back inside the window's legal range **and the
lane stays green**, because the only test that watches the floor is
looking at a one-node map 372px shorter.

This is the same weakness T-051 caught and fixed for the BOARD row
mid-build — the lane fixture fit inside the window, so "the last card is
reachable" passed without anything scrolling — left unfixed one row
down.

**Remedy, cheapest first:**

1. Drive `:249`'s map measurement from `repoBoard(...)` like `:308`
   does, with the same out-loud guard the board row got ("this fixture
   really is the tall one"). One import and two lines.
2. Or assert the floor against the tallest measurement of ANY screen the
   criterion-3 table renders, so the two tests cannot describe different
   apps.
3. Either way, record the real number: the map is 692 at 1024 today, and
   that is the figure a future floor has to clear.
