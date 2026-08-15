---
id: T-013
title: Semantic zoom T1/T2 + overlays
feature: F-06
milestone: 4
priority: 6
size: M
status: planned
blocked_by: [T-012]
touches: [app-map]
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN a component is expanded THE node SHALL become a container
  showing its files grouped by directory with intra-component edges
  and stub edges to collapsed neighbors, without moving unexpanded
  siblings more than necessary (the T1 rule of T-012's seven-rule
  layout: the container grows down within its own column and pushes
  only that column; siblings do not move).
- WHEN a file is selected THE panel SHALL list its symbols and their
  resolved edges (T2 in-panel; no canvas symbols in v1).
- THE churn overlay SHALL join the overlay control T-012 ships
  (status · provenance · drift), rendered per the design's
  map-behavior screen (3px bottom bar, width = share of the busiest
  component, raw count at the mark slot, hottest one step darker,
  declared-only shows —, never amber), with the legend following;
  churn derives from shelling out to git (ADR-013/§0.0-6) and IF the
  project is not a git repo THEN the churn overlay SHALL be disabled,
  not broken.
- IF an expanded component's files exceed the render budget THEN the
  container SHALL paginate or group deeper (defined degraded state),
  never freeze the canvas.

## Implementation notes

## Verdicts
