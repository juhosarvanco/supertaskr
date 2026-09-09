---
id: T-291
title: The docs gate refuses record-class text in a living document — a card id argued past a rule's first line, a measurement, a "ratified at", a date beside a sentence — and the genesis templates carry the standard's shape so a new project's files are born this way (ADR-023)
feature: F-01
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "@human (2026-09-09): \"Rule A–D as proposed\" — decision C of docs/rooms/foundation-files-standard.md"
blocked_by: [T-290]
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts, method/docs-templates/CONVENTIONS.md, method/docs-templates/STATE.md, method/docs-protocol.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

ADR-019 assigns records to the records and rules to the governing documents, and no gate enforces the class: CONVENTIONS swelled to twelve times its siblings by carrying history beside its rules. The docs gate already walks the governing documents for budgets and frontmatter; the class is one more reading of the same text. Blocked by T-290 so the keeper lands on a file that already obeys it — a keeper landed first would red the tree it exists to protect.

## Acceptance criteria

- WHEN the docs gate reads a governing document THE gate SHALL refuse record-class text by named shapes — a `T-NNN` argued in prose beyond a rule's first line, a measured figure with a unit, "ratified at", "measured", a date beside a sentence — naming the file, the bullet's opener and the shape, and SHALL say where the text belongs (the reference chapter or the card).
- WHEN a rule names its keeper and its card in its first line THE gate SHALL accept it — the card id and the keeper are the rule's own provenance, never a record.
- THE shapes SHALL be data in docs-scan.mjs beside DOC_BUDGETS, each with the reason it is a record shape, and a body SHALL red when a shape is removed (a data mutant) and when a planted record sentence in a scratch governing document is not refused.
- WHEN genesis writes the five files THE templates in method/docs-templates SHALL carry the standard's one-line statement of each file's class and its budget, so a new project's CONVENTIONS is born as rules with keepers.
- WHEN method/docs-protocol.md is read THE class rule SHALL be stated once, citing ADR-023; the method eval gate SHALL run and the bump SHALL carry its eval block.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
