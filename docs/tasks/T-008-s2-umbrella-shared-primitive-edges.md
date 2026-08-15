---
title: Decide the umbrella shared-primitive edge story before T-011 lights it amber
status: suggested
suggested_by: verifier claude-fable-5 @T-008-verify
---

Real imports the dogfood registry does not declare: TaskCard.tsx,
badges/SizeBadge.tsx, badges/ModelBadge.tsx (C-08) and
TaskDetailPanel.tsx (C-09) all import `cn` from app/src/lib/utils.ts —
a file claimed by C-05's umbrella paths. Neither C-08 nor C-09 declares
depends_on C-05 (declaring it would also close a C-05→C-08→C-09→C-05
declared cycle through the umbrella). Every edge the registry DOES
declare checks out against actual imports; this is the one reality
edge pointing the other way.

Consequence: when T-009's graph.json + T-011's derivation land, the
map's undeclared-dependency drift finding fires on nputer's own
registry out of the gate — C-08→C-05 and C-09→C-05, amber. Options for
the architect to pick deliberately rather than meet as a surprise:
(a) declare the edges and accept the umbrella cycle, (b) move the
shared `cn` primitive (and app/src/components/ui/**) into a shared-
primitives component the children may depend on cleanly, or (c) accept
the amber as the map's first honest drift demo (ADR-013 makes drift a
v1 feature, so this is a legitimate choice, not a bug). Architect
territory (ADR-004); nothing in T-008's criteria requires registry
completeness against reality — that gap is precisely what the map is
being built to show.
