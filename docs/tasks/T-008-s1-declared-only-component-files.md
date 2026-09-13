---
id: T-008-s1
title: Author component files for C-02/C-03/C-04 once locations are decided
status: parked
wake: T-165
suggested_by: executor claude-fable-5 @T-008
---

T-008's dogfood registry (docs/architecture/components/) covers C-01,
C-05–C-12 but deliberately omits C-02 (CLI), C-03 (runtime) and C-04
(daemon): they are planned-only AND no doc in the record decides where
their code will live, so any `paths` glob would be invented — and paths
are required non-empty, while intent files are architect territory
(ADR-004). C-07 was included because ADR-015 fixes its location. When
the architect decides the CLI/runtime/daemon layout (likely at their
first task decomposition), author their component files in the same
C-namespace so the map shows the full declared system; until then the
ARCHITECTURE.md table remains their only home and the map simply shows
fewer planned nodes than the table.

Triage 2026-08-16 (architect): PARKED — C-02/C-03/C-04 component
files wait on their layout decisions, which arrive with the F-04/F-05
decompositions (CLI/runtime/daemon territory; ARCHITECTURE rows still
planned). The table stays their only home until then; authoring
earlier would invent paths (ADR-004). Revisit at the F-04 planning
pass.

Re-affirmed at triage 2026-08-17 (third pass): unchanged and verified
— C-02, C-03 and C-04 still have no decided layout and no component
files, and ARCHITECTURE's Components table still stops at C-07, so the
table remains their only home. Read alongside T-033's decision (3),
folded there at this triage: that ruling settles where the arch JOIN
lives, and if it takes arm (b) — move `arch` to the Node CLI when C-02
exists — then C-02 gains a concrete reason to exist and its layout
decision arrives with it. Revisit at the F-04 planning pass, or at
that ruling, whichever lands first.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-165; the three component files wait on the layout the decomposition sitting decides, which the card says itself.
