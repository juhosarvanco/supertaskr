---
id: T-002
title: Task-file parser
feature: F-02
milestone: 1
priority: 2
size: M
status: done
blocked_by: []
touches: [lib-parser]
builder: claude-fable-5
verifier: claude-fable-5
built_by: "claude-fable-5 @fresh ×2 (build + rejection-fix sessions)"
verified_by: "claude-fable-5 @fresh (2 passes)"
review: same-model
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

Fix pass after 2026-08-14 rejection — fresh executor claude-fable-5,
same day, scope = the verdict's one security finding only. What
changed (src/task.ts): `extra` is now built with Object.create(null),
so hostile frontmatter keys (`__proto__`, and by the same mechanism
`constructor`/`prototype`) land as own enumerable data properties
instead of hitting Object.prototype's inherited `__proto__` setter.
The verdict's repro now prints `0 [ '__proto__' ] undefined` — key
preserved verbatim as data, zero issues (per the types.ts contract no
issue is required for unknown keys), nothing inherited, visible to
Object.entries/JSON.stringify; global Object.prototype stays clean.
Sweeping src for the same pattern found one sibling in the same file:
splitSections' heading map was a plain object literal, so a
`## __proto__` (or `## constructor`) body heading read an inherited
truthy value and minted a garbage section key ('[object Object]');
the map is null-prototype now and those headings are ignored like any
other unknown heading, per its doc comment. All other computed-key
sites hold ids in Maps (project.ts, roadmap.ts) or write fixed
literal keys — no further instances. Tests: the verifier's `it.fails`
probe flipped to a normal test and extended (own enumerable property,
value verbatim, no inherited state, enumeration/JSON visibility);
added a `prototype:` companion probe beside the verifier's
`constructor:` one, and a hostile-heading regression test in
task.test.ts. Verified (in lib/parser/): npx vitest run → 6 files,
67/67 green (previous 65 + the 2 new); npx tsc --noEmit → clean;
npm run build → clean; importing dist parses the live repo tree with
0 issues (T-001…T-007 + 3 suggestions, F-01…F-05). Nothing outside
src/task.ts and the two test files touched; status stays verifying
for re-verification.

## Verdicts

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder):
REJECTED — one security-sweep finding (REJECTED-level per
method/roles/verifier.md); the four acceptance criteria otherwise
verified green. The fix is one line plus a test.

Failure (security, src/task.ts:274): a crafted `__proto__:`
frontmatter key is neither preserved nor flagged — it mutates the
record instead. `extra[key] = value` on a plain object hits the
inherited `__proto__` setter, so the value becomes the PROTOTYPE of
`task.extra` rather than data. Repro, in lib/parser/ after
npm install && npm run build:

    node --input-type=module -e "
    import { parseTaskFile } from './dist/index.js';
    const r = parseTaskFile(['---','id: T-666','title: H',
      'feature: F-01','milestone: 1','priority: 1','size: S',
      'status: planned','__proto__:','  phantom_flag: pwned','---'
      ].join('\n'), 'x.md');
    console.log(r.issues.length, Object.keys(r.task.extra),
      r.task.extra.phantom_flag);"

Expected: `__proto__` kept as an own key of extra (types.ts contract:
"preserved verbatim … never silently deleted") OR an invalid-field
issue. Actual: `0 [] pwned` — zero issues, the field silently
vanishes, and extra now INHERITS attacker-chosen properties
(`extra.phantom_flag === 'pwned'`, `'phantom_flag' in extra` is true)
that Object.entries/JSON.stringify do not show — spoofable state for
any downstream `extra.<flag>` check. Contained: global
Object.prototype is NOT polluted (verified), and a bare
`constructor:` key IS preserved correctly; only `__proto__` breaks.
Fix direction: build `extra` with Object.create(null), or assign via
Object.defineProperty, or reject `__proto__` keys as invalid-field.
A probe asserting the correct behavior is committed at
test/verifier-probes.test.ts under an `it.fails` marker — the suite
stays green now and flips when the bug is fixed (remove the marker
then).

Verified green, independently (commands run in lib/parser/):
npm install → 0 vulnerabilities · npx vitest run → 65/65 (executor's
38 + 27 fresh verifier probes) · npx tsc --noEmit → clean ·
npm run build → clean; importing dist parses the live repo with
0 issues: tasks T-001…T-007 + 1 suggestion, features F-01…F-05.
- Criteria attacked beyond the executor's fixtures: boundary inputs
  (empty/whitespace file, unclosed frontmatter, close at EOF without
  newline, CRLF end-to-end, UTF-8 BOM); YAML abuse (duplicate keys,
  tab indent, 2^30 alias bomb → structured yaml-error in ~2 ms,
  unquoted `007` id); 13 field-abuse shapes (all produce
  field-scoped issues; the record is still returned when identity
  holds); suggested/parked requiredness incl. parked-without-id;
  model@session edges (`codex @ S3`, `@S3`, lone `@`, case-sensitive
  `@Fresh` → resume); roadmap edges (em dash at wrap start,
  en dash/hyphen not separators, first-em-dash split, triple
  duplicate → two issues, heading case/suffix, no trailing newline);
  fs layer (EISDIR, ELOOP symlink loop, EACCES → io-error and
  continue; three-way duplicate id → two issues naming the first
  file).
- Security sweep otherwise clean: yaml@2.9.0 `parse()` with default
  core schema (dates stay strings, unknown tags degrade to plain
  values, duplicate keys throw, maxAliasCount caps alias bombs); src
  is read-only (readdirSync/readFileSync only — no writes, exec,
  network, env access, or eval); runtime dependency tree is exactly
  yaml@2.9.0 with zero transitive deps; the only lockfile packages
  with install scripts are dev-side esbuild/fsevents (standard);
  every resolved URL is registry.npmjs.org; no secrets in the diff.
- Boundaries hold: the diff touches only lib/parser/ and
  docs/tasks/T-002-*; acceptance criteria unmodified by the
  executor; no root workspace; pure library per C-06/ARCHITECTURE
  (no CLI, no writes); adjacent T-001 territory untouched.

Suggestions filed, non-blocking: T-002-s2-preserve-raw-body (a
suggestion file's context paragraph is dropped from the model),
T-002-s3-validate-task-id-format (`id: banana` parses clean; empty
backbone names silent).

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder;
re-verification of fix commit 830d959): APPROVED.

- Original failure re-run against the rebuilt dist: the first
  verdict's repro now prints `0 [ '__proto__' ] undefined` — the key
  lands as an own ENUMERABLE data property with the verbatim value
  (own descriptor checked), nothing inherited (`'phantom_flag' in
  extra` is false), visible to Object.entries and JSON.stringify,
  `{...extra}` spread keeps it as own data, global Object.prototype
  clean.
- Second fix (splitSections KEYS) verified INCLUDING that the
  pre-fix bug existed: built the pre-fix tree (0a515ae) in a
  throwaway git worktree — the old code turned `## __proto__` /
  `## constructor` body headings into garbage section keys
  `'[object Object]'` and `'function Object() { [native code] }'`
  on the public parseTaskFile surface (both keys — one more than
  the fix notes claim). The fixed code ignores them like any
  unknown heading (also probed: hasOwnProperty/toString/valueOf
  and mixed-case variants); only known headings survive, issues 0.
- Sweep completeness confirmed by independent grep of src: the only
  untrusted computed-key write is the fixed `extra[key]`
  (null-prototype); `sections[current]` is constrained to three
  literal keys via the null-prototype KEYS map; `data[field]` reads
  use literal field names; id registries are real Maps
  (project.ts, roadmap.ts); nothing in src or tests assumes
  inherited methods on extra/sections. New angle probed: a hostile
  `__proto__:` frontmatter mapping cannot phantom-inject known
  fields either — yaml@2.9.0 stores it as an own key, so
  `data.status` stays undefined (result: missing-field
  status/title, no task) — identity is not spoofable.
- Test-file review: my `it.fails` probe was flipped to a positive
  test and extended (own descriptor + value, enumerability, `in`
  chain-walk, enumeration/JSON visibility) — strictly stronger, not
  weakened; companion `prototype:` probe and a hostile-heading
  regression test added. Commands (lib/parser/): npx vitest run →
  67/67 · npx tsc --noEmit → clean · npm run build → clean ·
  importing dist parses the live tree with 0 issues (10 tasks =
  7 + 3 suggestions, features F-01…F-05).
- Scope held: 830d959 touches only src/task.ts, the two test
  files, and this file's Implementation notes; acceptance criteria
  and the 2026-08-14 REJECTED verdict untouched; no shared docs;
  fix authored by a fresh executor session per the lifecycle rule.

Note for the integrator: builder and verifier are both
claude-fable-5 (separate sessions) — on done, stamp
`review: same-model`, not independent.
