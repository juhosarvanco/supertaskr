---
id: T-900
title: The canned card the brief is assembled against
feature: F-01
milestone: 4
priority: 1
size: L
status: building
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder: method-evals@fixture
verifier:
built_by:
verified_by:
review:
---

A FIXTURE, NOT A BOARD CARD. It lives under `tools/method-evals/` and
never under `docs/tasks/`, so no board census counts it, no parser walk
reaches it, and the DOCS GATE's whole-tree frontmatter half never judges
it. It is copied into a throwaway fixture root by
`lib/fixture-root.mjs` and read there.

**The id is 900 on purpose**: high enough that the live board will not
reach it before this fixture is replaced, and legal under
`method/tasks/TASK-FORMAT.md` so that a brief assembled against it is
assembled the ordinary way rather than through a tolerated exception.

Every frontmatter field the brief's rows read is present and ordinary:
row 2 reads `id`/`title`, row 5 reads `touches:`, row 11 reads `size` to
find the card's ceremony row. `size: L` is chosen because L is the row
that owes every seat — planner, executor, verifier, integrator — so the
ceremony row the brief quotes is the fullest one and a row dropped from
the table is visible here.

## The shape

The fixture asserts nothing by itself. What asserts is the eval that
assembles a brief against it (`evals/mf-01-brief-assembles.mjs`) and
then DEGRADES the live method text inside the fixture root to prove the
assembly can fail.

## Acceptance criteria

- WHEN this card is copied into a fixture root THE assembler SHALL
  derive every contract row from it without hand-filling any.

## Implementation notes

## Verdicts
