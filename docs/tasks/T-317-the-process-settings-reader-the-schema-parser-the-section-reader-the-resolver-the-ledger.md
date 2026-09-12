---
id: T-317
title: "The process settings reader — the schema parser, the section reader, the resolver, the ledger and the constraint findings — moves out of the dispatch arm into lib/parser as a pure module exported through the browser entry `@supertaskr/parser/pure`, the arm importing it and re-exporting its symbols unchanged, the generated reference byte-identical, so the terminal, the app screen and the skill can read one implementation"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: building
suggested_by: "the owner's rulings of 2026-09-12: T-300 first, then an ordinary card extracts the shared reader; the reader lives in the parser library; the Codex orchestrator's review of 2026-09-12: the app imports the parser's pure entry"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/src/pure.ts, lib/parser/src/index.ts, lib/parser/test/process-settings.test.ts, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/architecture/components/C-06-lib-parser.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

The schema parser, the template section reader, the resolver, the ledger and the constraint findings live inside `dispatch-brief.mjs` (T-299); the terminal command (T-300) imports them from there and plans its own edit with its own helpers. The app imports only `@supertaskr/parser/pure`, the browser-safe entry; the root entry is filesystem-backed. Edit planning is not part of the reader: it stays with the terminal command (T-300-s6) and later with the follow-up card that runs the command from the app.

### Acceptance criteria

- WHEN the module lands in the parser library THE five symbols SHALL be exported through `@supertaskr/parser/pure` with the same names and behaviour they have in the arm, with no filesystem access in the module, and the arm SHALL import them and re-export every symbol it exports today, so every current importer and test is unchanged; a body SHALL exercise the public browser entry, not only the module.
- WHEN the library's tests run THE parser and the resolver SHALL be pinned by the same cases the arm's spec pins today, moved or shared, and the brief spec bodies that compare the hand parser to a real YAML parser SHALL stay green.
- WHEN the terminal command's reference is regenerated after the move THE page SHALL be byte-identical; any behaviour change is a separate decision and not this card's.
- WHEN the graph is regenerated THE app-to-parser edge SHALL be the only edge the app gains and the parser component's record SHALL name the module.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
