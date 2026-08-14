---
id: T-002
title: Task-file parser
feature: F-02
milestone: 1
priority: 2
size: M
status: verifying
blocked_by: []
touches: [lib-parser]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE system SHALL parse every docs/tasks/T-*.md into a typed model
  (frontmatter fields per method/tasks/TASK-FORMAT.md + body sections)
  and every docs/ROADMAP.md backbone line into feature records.
- WHEN a task file has malformed frontmatter THE system SHALL return a
  structured validation error naming file and field, and continue
  parsing the rest.
- IF two task files share an id THEN THE system SHALL report a
  duplicate-id error listing both paths.
- THE parser SHALL be a pure library with unit tests covering: valid
  task, missing required field, duplicate id, suggested + parked
  statuses, model@session syntax in builder/verifier.

## Implementation notes

Built by claude-fable-5 @T-002 (executor), 2026-08-14, branch
t002-task-parser.

What was built — `lib/parser/` (C-06), self-contained package
`@nputer/parser` (private, TypeScript ESM, Node >=22), no CLI, no app
code, no root workspace (T-001 runs in parallel; touches disjoint).
String-level parsers are pure functions (parseTaskFile, parseRoadmap,
parseModelSession, splitSections, extractFrontmatter);
parseProject/parseTaskDirectory add a thin read-only fs layer. Typed
model in src/types.ts: TaskRecord (every TASK-FORMAT.md frontmatter
field + the three body sections), FeatureRecord (ROADMAP backbone
lines, wrapped continuation lines joined), ParseIssue (discriminated
union — collect-don't-throw), ModelSession with policy
default|fresh|resume per the session syntax, accepting both the
compact builder form `codex@S3` and the stamped form
`codex/gpt-5.2 @S3` (space before @).

Spec interpretations the verifier should check deliberately:
- Requiredness is status-aware: every file needs title + valid status;
  id is required except on status: suggested (TASK-FORMAT defines a
  suggestion as a minimal file — id not in its list; architect
  renumbers at triage); feature/milestone/priority/size required
  except on suggested/parked; suggested_by required on suggested.
- Field-level issues do not suppress an otherwise-identified task: the
  record is returned alongside its issues so the board can render the
  card with its errors. Broken YAML / missing identity → issues only.
- Duplicate ids: both records stay in the result; the duplicate-id
  issue (files: [first, second], filename order) is the signal —
  flagging, not hiding.
- Unknown frontmatter keys are preserved in TaskRecord.extra, no error
  (archaeology rule: never silently delete).
- feature ids validated as ^F-\d+$; backbone name/description split on
  the first spaced em dash; no em dash → description ''.
- yaml-error/missing-frontmatter issues name the file and carry the
  YAML parser's detail; only field-level issues can name a field (a
  syntax error has no single field). Both shapes are tested.

Verification per criterion (all run in lib/parser/):
- npm install → clean, 0 vulnerabilities. npx tsc --noEmit → clean.
- npx vitest run → 5 files, 38 tests, all green:
  criterion 1 (typed model + body sections + backbone records) →
  task.test.ts, roadmap.test.ts, smoke.test.ts;
  criterion 2 (malformed frontmatter → structured issue naming
  file/field, rest continues) → task.test.ts malformed cases +
  project.test.ts broken-project fixture (T-202 broken YAML flagged,
  T-201/T-203 still parsed);
  criterion 3 (duplicate id → issue listing both paths) →
  project.test.ts dup-project fixture;
  criterion 4 (unit tests: valid task, missing required field,
  duplicate id, suggested + parked, model@session in builder/verifier)
  → task.test.ts, model-session.test.ts.
- npm run build → dist/ compiles; runtime check via node import of
  dist/index.js parsed this repo: issues 0, tasks T-001…T-007,
  features F-01…F-05.
- Tests run against fixtures under test/fixtures/ (deterministic);
  test/smoke.test.ts additionally parses the LIVE docs/ tree and
  requires zero issues.

Dependencies (justification, for the verifier's additions check):
runtime yaml@^2 — the format's own examples carry inline comments and
flow sequences; hand-rolling YAML edge cases is bug farming; zero
transitive deps. Dev: vitest@^3 (runner matches the project's Vite
stack, ADR-007, runs TS with no build step), typescript@^5,
@types/node@^22. package-lock.json committed.

Build/test commands for CONVENTIONS.md (integrator; run in
lib/parser/): npm install · npm test · npm run typecheck ·
npm run build (emits dist/, gitignored).

Suggestion filed: docs/tasks/T-002-s1-cross-reference-checks.md
(model-level referential integrity — out of T-002 scope).

## Verdicts
