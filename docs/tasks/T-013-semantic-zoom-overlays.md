---
id: T-013
title: Semantic zoom T1/T2 + overlays
feature: F-06
milestone: 2
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
  siblings more than necessary (ELK interactive hints; spatial
  stability per plan §6.4).
- WHEN a file is selected THE panel SHALL list its symbols and their
  resolved edges (T2 in-panel; no canvas symbols in v1).
- THE overlays status · provenance · drift · churn SHALL be
  toggleable with the legend following the active overlay; churn
  derives from shelling out to git (ADR-013/§0.0-6) and IF the
  project is not a git repo THEN the churn overlay SHALL be disabled,
  not broken.
- IF an expanded component's files exceed the render budget THEN the
  container SHALL paginate or group deeper (defined degraded state),
  never freeze the canvas.

## Implementation notes

## Verdicts
