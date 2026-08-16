---
id: T-034
title: Map tasks lens — dependency waves, critical path, the pane's second lens
feature: F-06
milestone: 4
priority: 18
size: M
status: building
blocked_by: []
touches: [app-map]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-012-s1. Triage 2026-08-16: the design bundle's fully-drawn
second screen ("map · tasks" in
docs/design/claudedesign_handoff/"nputer app.dc.html"), fenced out of
T-012 by its own plan ("the lens control … is absent until a
tasks-lens task exists" — this is that task). blocked_by edges are
already parsed; no new data source. Serialize app-map with
T-013/T-015/T-032 at dispatch.

## Acceptance criteria
- THE map pane header SHALL gain the lens segmented control
  (architecture · tasks) per the design, working in both directions;
  lens view-state is session-ephemeral until T-022 (the T-012
  overlay-state precedent).
- WHEN the tasks lens is active THE pane SHALL render board tasks in
  dependency waves from blocked_by edges: critical path in the
  design's terracotta family (values extracted from source per the
  T-006 protocol), blocked/ready distinction on grey cards, and the
  summary strip (critical path · worst blocker · ready now) —
  tokens-only, both schemes.
- THE architecture lens SHALL be unchanged while the control sits on
  architecture — the existing map suites pass untouched.
- IF the task graph contains a cycle THEN the wave layout SHALL
  degrade defined-ly (cycle members render in one wave; the existing
  issue surfacing names it — T-030's parser-side cycle issue is the
  net), never hang or crash.
- Hostile titles render as text nodes only; the no-innerHTML grep
  gate extends to the lens files.

## Implementation notes

## Verdicts
