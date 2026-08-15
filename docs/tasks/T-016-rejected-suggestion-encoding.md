---
id: T-016
title: Ratify the rejected-suggestion encoding (method v0.1.4)
feature: F-01
milestone: 4
priority: 1
size: S
status: done
blocked_by: []
touches: [method/, lib-parser]
builder: claude-fable-5
verifier:
built_by: claude-fable-5 @fresh
verified_by:
review:
---

Absorbs: T-006-s5. Triage 2026-08-15: dispatch FIRST among hardening
tasks — triage itself produces rejects that need the encoding settled.

## Acceptance criteria
- THE method (v0.1.3 → v0.1.4) SHALL define suggestion-triage
  encoding in tasks/TASK-FORMAT.md: promoted suggestions are absorbed
  into the promoted task (which lists the absorbed ids) and their
  files removed in the same commit; parked → status: parked in place;
  rejected → file moves to docs/tasks/rejected/ keeping
  status: rejected + a dated one-line reasoning. Rationale of record:
  on tasks `rejected` is retriable, on suggestions terminal — one
  status word must not carry both meanings in one directory.
- THE version bump SHALL be noted in docs/CONVENTIONS.md (replacing
  the interim gotcha with a pointer to the rule).
- THE parser suite SHALL gain a test pinning that docs/tasks/rejected/
  is excluded from the model (insurance for the flat-glob invariant).
- IF a rejected file is placed flat in docs/tasks/ THEN the parser
  SHALL surface it as a parse issue (status: rejected without full
  task fields stays illegal there — the trap stays loud).

## Implementation notes

2026-08-15, claude-fable-5 @fresh (S-tier: executor + tests, no
verifier — review left empty as the honest record).

What changed:
- method/tasks/TASK-FORMAT.md: "Triage encoding" block added directly
  after the architect-triage paragraph in the task-creation section —
  promoted → absorbed (`Absorbs:` line is the surviving record, file
  removed same commit), parked → in place with `id:` now required
  (placement fields stay optional), rejected → moves to
  docs/tasks/rejected/ keeping `status: rejected` + dated one-line
  reasoning — plus the rationale of record verbatim from this task.
- docs/CONVENTIONS.md: interim T-006 gotcha replaced with a pointer to
  TASK-FORMAT noting v0.1.4; the operative warning kept (flat
  `status: rejected` stays a loud parse failure by design — move the
  file, don't "fix" the parser).
- docs/ARCHITECTURE.md: C-01 status cell only, built (v0.1.3) →
  built (v0.1.4).
- lib/parser/test/rejected-exclusion.test.ts (7 tests) + fixture
  fixtures/rejected-project/ (flat T-501 + id-less rejected file under
  docs/tasks/rejected/). NO parser source changed — the tests pin
  behavior the parser already had (non-recursive readdir +
  /^T-.*\.md$/ on disk; isTaskFilePath rejecting nested names in the
  pure layer, already covered for generic subdirs in files.test.ts).

Version-string locations (exhaustive sweep for 0.1.3): the two live
locations updated are CONVENTIONS.md ("currently v0.1.4") and the
ARCHITECTURE.md C-01 cell. method/README.md and TASK-FORMAT.md carry
no version string (checked — none invented, per task instruction).
Left untouched as historical record or test data: docs/ROADMAP.md
milestone-0 checkbox, T-008 body prose, roadmap.test.ts +
valid-project fixture strings. Flagged for the next C-01 touch:
docs/architecture/components/C-01-method.md line 9 has "(v0.1.3)" in
a YAML comment — stale once this merges, but outside this task's
zero-diff boundary (dispatch scope), so noted rather than edited.

Per-criterion verification:
1. Triage encoding defined in TASK-FORMAT.md with all three arms +
   rationale of record — see the new block.
2. Version bump noted in CONVENTIONS.md; interim gotcha replaced with
   the pointer.
3. Exclusion pinned three ways: live tree (rejected/ non-empty, every
   file there keeps status: rejected, parseProject yields no task and
   no issue from under it), disk fixture (parseProject +
   parseTaskDirectory collect only the flat task, zero issues), pure
   layer on the same fixture bytes.
4. Loud trap pinned through parseProjectFromFiles: id-less flat
   rejected file → missing-field issues for id + feature + milestone +
   priority + size and no phantom record; with an id → the four
   placement issues and the record returned (flagged, not hidden).

Suites (lib/parser, ADR-011 order): npm ci clean · npx vitest run
132/132 green (125 existing + 7 new; smoke re-parses this worktree's
live tree with the edited docs, zero issues) · npx tsc --noEmit clean ·
npm run build clean. App suites not run: lib/parser src/ untouched
(test-only), so the app's @nputer/parser dependency is byte-identical.

## Verdicts
