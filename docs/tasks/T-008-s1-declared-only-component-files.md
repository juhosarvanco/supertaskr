---
title: Author component files for C-02/C-03/C-04 once locations are decided
status: suggested
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
