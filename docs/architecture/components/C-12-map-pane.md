---
id: C-12
name: Map pane
layer: app
paths:                    # decided location (plan §6.1 as revised by §0.0-3); code arrives with T-011/T-012
  - app/src/architecture/**
  - app/src/lib/architecture/**   # T-011's engine, claimed in place (T-011-s1 option a, decided at T-012 dispatch)
depends_on: [C-05, C-06, C-07, C-09, C-10, C-11]
decisions: [ADR-013, ADR-015]
status: auto
touch_slugs: [app-map]
---
The architecture map (F-06): intent (component files via C-06) and
reality (graph.json from C-07) overlaid, with drift first-class. Pure
TS derivation — mapping, edge relations, status/provenance rollups,
drift findings — feeding an SVG canvas and a component panel; data
arrives on C-10's live-update path.
