# ADR-013: Architecture map v1 ships intent + reality overlaid; drift is a v1 feature

Date: 2026-08-15 · Status: accepted · Decided in: human directive
(map planning session with Juho → docs/design/map-technical-plan.md),
promoted by architect review

## Context
The architecture-map pane was planned as a status heatmap over
ARCHITECTURE.md (docs/design/dashboard.md pane 2). Architecture-drift
detection sat in the Horizon tier (docs/future.md, truth maintenance).
The map planning session decided the pane is only worth building if it
can show where code diverges from plan — which requires a code indexer
from day one. Indexer languages v1: TypeScript (incl. TSX/JS) and Rust
— nputer's own stack, so the map dogfoods on this repo immediately.

## Options considered
Heatmap-only v1 (declared components + task status, indexer later):
cheaper, but the pane is documentation with colors and the drift
promise stays vapor. Chosen: intent layer (declared component files)
AND reality layer (indexed graph) overlaid, drift derived where they
disagree.

## Decision
V1 renders both layers. Drift findings (undeclared dependency,
unmapped files, declared-only components, ambiguous mapping, dangling
depends_on) are first-class, amber, explainable per finding. The
architecture-drift slice of Horizon truth maintenance is thereby
pulled forward into F-06; the rest of truth maintenance stays parked.

## Consequences
A real indexer component exists (C-07, nputer-index). The warning
amber must be visually distinct from building/verifying amber (design
handoff hard requirement). Feature scope, not sequence: WHERE F-06
sits relative to F-03 is decided in rooms/map-sequencing.md, not here.
