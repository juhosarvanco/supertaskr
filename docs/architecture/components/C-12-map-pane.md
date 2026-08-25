---
id: C-12
name: Map pane
layer: app
paths:                    # decided location (plan §6.1 as revised by §0.0-3); code arrives with T-011/T-012
  - app/src/architecture/**
  - app/src/lib/architecture/**   # T-011's engine, claimed in place (T-011-s1 option a, decided at T-012 dispatch)
depends_on: [C-06, C-07, C-09, C-10, C-11, C-16]   # C-05 dropped at T-033, see below
decisions: [ADR-013, ADR-015]
status: auto
touch_slugs: [app-map]
---
The architecture map (F-06): intent (component files via C-06) and
reality (graph.json from C-07) overlaid, with drift first-class. Pure
TS derivation — mapping, edge relations, status/provenance rollups,
drift findings — feeding an SVG canvas and a component panel; data
arrives on C-10's live-update path.

**`C-05` LEFT `depends_on` AT T-033, AND THE MEASUREMENT IS WHY.** T-012's
§2 added it when the map's seven imports of `cn` and `verdicts` counted
as depending on the shell. C-16's extraction moved all seven, and this
edge measured **`planned observed=0`** the moment it did — a declared
dependency with nothing behind it, which the map draws as INTENT and
which was not intent but residue. It also closed a cycle: `C-05 -> C-12`
is declared and observed 32 times, so keeping this row would have left
`C-05 <-> C-12` standing under @human's *the registry holds no cycles*
rule for the sake of a dependency that no longer exists. Dropping it
costs nothing and asserts something true.
