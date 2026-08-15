---
id: T-012
title: Map view T0 + detail panel + pane switcher
feature: F-06
milestone: 2
priority: 5
size: L
status: planned
blocked_by: [T-011]
touches: [app-map, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Size L: planning pass required before dispatch. Spec of record:
docs/design/map-technical-plan.md §6 (as revised §0.0) +
docs/design/map-design-handoff.md; token values arrive from the
design pass before or with this task's planning pass.

## Acceptance criteria
- WHEN the map pane opens on this repo THE app SHALL render every
  declared component as an SVG node with status fill (existing
  --status-* tokens), provenance mark (done components), drift ring
  when findings exist, and edges styled by relation {confirmed solid,
  planned faint, undeclared dashed --warning}, laid out
  deterministically (bundled elkjs; same graph → same picture), with
  legend, search, and overlay toggles per design handoff §4.6.
- THE shell SHALL gain a pane switcher (board | map) — app-shell
  territory, declared here in touches; board behavior unchanged.
- WHEN a node is clicked or keyboard-activated THE detail panel
  (T-005 primitive, pointerdown dismissal inherited) SHALL show the
  §6.3 contents; empty sections render placeholders, never errors.
- THE warning amber SHALL be distinguishable at a glance from
  building/verifying amber in BOTH schemes, including composed on one
  node (building + drift ring) — screenshot check, light and dark.
- IF prefers-reduced-motion is set THEN pulse and transitions SHALL
  be disabled (static equivalents).
- IF a node or edge state has no designed treatment THEN the task is
  not done (design handoff §9).
- Tokens-only styling (no arbitrary values); new --map-* / --warning
  tokens land in tokens.css as values from the design pass, mechanism
  unchanged.

## Implementation notes

## Verdicts
