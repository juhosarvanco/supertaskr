---
id: T-300-s6
title: "`npx supertaskr settings` reads through lib/parser's process settings module and keeps no reader, resolver or constraint engine of its own — its edit planning, the YAML formatting of one departure, stays explicitly the command's — and its public surface, exit vocabulary and generated reference are unchanged"
feature: F-04
milestone: 4
size: S
tier: standard
priority: 2
status: building
suggested_by: "the owner's ruling of 2026-09-12 that T-300 lands first and adopts the shared reader in a follow-up; the Codex orchestrator's review of 2026-09-12 on the planning boundary"
blocked_by: [T-317]
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts, docs/reference/15-settings.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

### What was measured

T-300 landed on 2026-09-12 importing the resolver from the arm and planning its edit with its own small helpers, which already call the shared constraint function; the verifier's two corrections pinned that the listing reads the project's own tree and that a departure is listed at the resolved value. Formatting a YAML edit is not a second reader.

### Acceptance criteria

- WHEN the command lists, edits or renders THE rows, the resolved values and the constraint refusals SHALL come from the parser library's module through its browser entry, and the command SHALL keep no parser, resolver or constraint engine of its own; its edit planning SHALL stay the command's, named as such in the notes; its `main(argv, io)` seam, its command forms, its exit vocabulary and the generated reference SHALL be unchanged and byte-identical, pinned by the existing bodies.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
