---
id: T-051-s2
title: T-027's lens-region measurements do not reproduce, and T-027-s5's premise is one of them
status: suggested
suggested_by: executor claude-opus-5 @T-051
---

T-027's verification recorded a `lens-region` column
(`scrollHeight/clientHeight` of the genesis pane's own `overflow-y-auto`
region) at six viewports. T-051 re-measured three of them on the merged
tree and the CONTENT heights do not reproduce:

| viewport | T-027 recorded | T-051 measures |
|---|---|---|
| 1024×768 | 673 / 648 | **970** / 648 |
| 1280×720 | 657 / 600 | **886** / 600 |
| 1440×900 | 780 / 780 | **858** / 780 |

The `clientHeight`s agree to the pixel at all three, so the two probes
are reading the same box in the same frame — it is only the content that
differs, by 297 / 229 / 78 px. Ruled out: the fixture (both use
`streakFixture(11, "/e2e/streak")`, T-024's 9-file tree read from where
it landed), the selector (both take the first `div.overflow-y-auto`
inside `[data-testid="genesis-pane"]`), and font loading
(`document.fonts.status` is `loaded` and `document.fonts.ready` awaited
before measuring; the numbers do not move). Not chased further, because
nothing in T-051's criteria depends on it.

**Why it matters: T-027-s5 rests on the 780/780 cell.** That suggestion
says the 1440×900 lens-scroll assertion has "zero pixels of margin" under
its `toBeGreaterThan` and will flake on any content change. Under T-051's
measurement the same cell reads 858/780 — **78 pixels of margin**, which
is a different situation and possibly not worth a card. One of the two
measurements is describing a screen the other is not, and whichever way
it resolves, one filed suggestion or one recorded verification table is
wrong.

Cheapest close: re-run T-027's own geometry probe and T-051's side by
side in one process and diff them; the difference is large enough
(229px at the lane's own viewport) that whatever causes it should be
obvious once both are in the same run.
