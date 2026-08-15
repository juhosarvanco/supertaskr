# ADR-016: Provenance renders as two marks; the three-way distinction lives in text

Date: 2026-08-15 · Status: accepted · Decided in: human directive
(design-review exchange), amends the dashboard design-of-record and
supersedes T-004's three-mark ReviewBadge

## Context
The convention records three review-provenance tiers (independent ·
same-model · self-verified) and the built board rendered three
distinct marks. The Claude Design pass proposed collapsing cards to
two marks and asked for confirmation; the map spec kept three and
offered dropping the middle. The human decided: two everywhere.

## Options considered
Three marks everywhere (architect recommendation — preserves the
independent/same-model visual distinction); the design's split
(two on cards, three on map); chosen: two everywhere.

## Decision
Exactly two visual marks on every surface: **solid disc + check** =
someone other than the builder's session checked the work
(independent OR same-model); **half disc** = self-verified. The
independent-vs-same-model distinction remains first-class DATA
(review: frontmatter, stamps) and is always visible in TEXT — card
detail panel, map panel, hover labels, session registry — never in
the mark. The unverified state (no done review) shows no mark on
cards; overlay surfaces may show the design's hollow ring.

## Consequences
The honesty floor the marks guarantee is builder-checked vs
self-checked; finer trust reading requires one hover or click.
dashboard.md's card-badge rule is amended (the never-identical rule
narrows to: self-verified never looks like checked). T-006 changes
the built ReviewBadge from three marks to two and updates its tests;
T-012 applies the same to map nodes and collapses the provenance
overlay legend to checked / self / unverified.
