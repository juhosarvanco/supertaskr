---
id: T-008
title: Component files convention + parser
feature: F-06
milestone: 2
priority: 1
size: M
status: verifying
blocked_by: []
touches: [lib-parser]
builder: claude-fable-5
verifier:
built_by: claude-fable-5 @fresh
verified_by:
review:
---

## Acceptance criteria
- THE parser (@nputer/parser, node AND pure entries) SHALL read
  docs/architecture/components/*.md into typed ComponentRecords:
  id (^C-\d{2,}$, unique), name, optional layer, paths (non-empty
  glob list), depends_on, decisions, status (auto | the six task
  statuses), touch_slugs (per ADR-015/§4.3 of the plan), body prose.
- WHEN two components' paths match the same file THE model SHALL keep
  first-by-id and record a structured ambiguous_mapping warning.
- IF a component file is malformed, duplicates an id, or names a
  missing id in depends_on THEN THE parser SHALL emit a structured
  issue (file + field, or dangling id) and continue parsing the rest;
  dangling depends_on edges are preserved for placeholder rendering,
  never dropped.
- THE nputer repo SHALL gain its own component files (≥5, same
  C-namespace as ARCHITECTURE.md per ADR-013 §0.0-8 — existing ids
  keep their meaning, finer app components get new ids) parsing with
  zero issues; ARCHITECTURE.md links them.
- ADR-009 SHALL hold on every new collection keyed by file-derived
  strings (hostile-key tests included).

## Implementation notes

2026-08-15, executor claude-fable-5 @fresh, branch t008-component-files.

### What was built
New ComponentRecord module in @nputer/parser, template = the existing
task parser exactly (collect-don't-throw ParseIssue union, identity
gate, `yaml` via the shared extractFrontmatter, deterministic
path-sorted ordering, ADR-009 null-prototype/Map collections):

- `src/component.ts` — `parseComponentFile` (string-level; identity =
  valid `C-\d{2,}` id + name; `paths` required non-empty; `layer`
  optional; `depends_on`/`decisions`/`touch_slugs` default `[]`;
  `status` defaults `auto`, six pinnable task statuses allowed,
  task-only `suggested`/`parked` rejected; unknown keys preserved in
  null-prototype `extra`; body prose = `responsibility`, verbatim
  trimmed), `parseComponentSet` (internal shared engine: duplicate-id
  both-records-kept, dangling depends_on, provable glob overlap),
  `compareComponentIds` (NUMERIC id order — exported so T-011 reuses
  the "first by id wins" order instead of forking it).
- `src/files.ts` — `isComponentFilePath`, `parseComponentsFromFiles`
  (pure); `parseProjectFromFiles` gains `components` + `componentsDir`.
- `src/project.ts` — `parseComponentDirectory` (node); `parseProject`
  gains `components` + `componentsDir`. ABSENT components dir = legal
  "no architecture declared" state: `[]`, zero issues (unlike the
  required roadmap); an unreadable dir stays an io-error.
- `src/types.ts` — `COMPONENT_STATUSES`, `ComponentRecord`,
  `ComponentParseResult`, `ComponentSetResult`; ParseIssue gains
  `dangling-reference` {file, field, id} and `ambiguous-mapping`
  {ids, files, patterns} (index-aligned; ids[0] = winner); duplicate
  ids reuse the existing `duplicate-id` kind.
- Both barrels export the trio; `parseComponentDirectory` is node-only.
  Root API additive: `ProjectParseResult.components` is OPTIONAL
  because the app hand-builds empty model literals (docs-model.ts) —
  required would have broken the untouched app's typecheck; every
  parser entry point always sets it.

### ambiguous_mapping honesty note (read this, verifier)
The criterion's "two components' paths match the same FILE" needs a
file tree the parser does not have — file-level detection is T-011's
derivation (§0.0-1), which reports through this same issue kind. What
T-008 detects at parse time is only PROVABLE pattern-text overlap,
matcher-agnostic so no glob semantics are forked out of T-011:
identical normalized patterns (leading `./`/`/` stripped), and `P/**`
containing any pattern whose text starts with `P/`. Negated patterns
never participate; anything subtler (e.g. bare `dir` vs `dir/**`) is
deliberately NOT guessed — pinned by the "HONESTY PIN" test in
test/component.test.ts. A certain warning is never wrong; an uncertain
overlap is never faked.

### Dogfood registry + granularity reasoning
docs/architecture/components/ — nine files, same C-namespace as the
ARCHITECTURE.md table (§0.0-8): C-01 method (status pinned `done`: no
task slug maps to it and it is built at v0.1.3 — dogfoods the pin
feature), C-05 App as shell/umbrella whose paths deliberately do NOT
claim the children's files (literals + non-overlapping dirs; my own
overlap detector enforces this), C-06 lib-parser, C-07 nputer-index
(ADR-015 fixes its location, so declared-only is honest), and new ids
C-08 board pane / C-09 detail panel / C-10 docs watcher / C-11 design
tokens / C-12 map pane (plan §6.1/§0.0-3 fixes its location).
Subdivision granularity follows the real seams: import structure
(depends_on mirrors actual imports, incl. the real C-08↔C-09 cycle:
Board mounts the panel, the panel reuses TaskCard chrome) and the
slug vocabulary (touch_slugs from the ARCHITECTURE mapping; finer
components than the slugs can distinguish would rollup identically
anyway — §0.0-4 names the `component:` task field as the future
fine-grained path). C-02/C-03/C-04 are OMITTED: planned-only AND no
doc decides their code location, so any glob would be invented intent
— architect territory (ADR-004). Filed as T-008-s1.
ARCHITECTURE.md gained exactly one link line under the Components
table; nothing else in it changed.

### Per-criterion verification (all from the worktree)
1. Typed ComponentRecords, node AND pure entries: lib/parser
   `npx vitest run` → 8 files, 125/125 (78 existing + 47 new, zero
   modified); built-dist probe: node entry `parseComponentDirectory`
   on the live registry → 9 components / 0 issues; pure entry
   `parseComponentFile` works, `parseComponentDirectory` correctly
   absent from pure, `dist/pure.js` references node:fs in comments
   only (webview-proof: the app vite build passes).
2. First-by-id + ambiguous_mapping: tests pin winner-by-NUMERIC-id
   (C-09 beats C-100), both containment directions, normalization,
   negation/disjoint/same-id non-flagging, and the honesty pin above.
3. Malformed / duplicate / dangling: tests pin structured issues with
   file+field (or dangling id), parsing continues past broken files,
   and dangling edges preserved in `dependsOn` for placeholders.
4. Dogfood ≥5 with zero issues + ARCHITECTURE links them: live-tree
   smoke (`test/smoke.test.ts`) asserts zero issues repo-wide, the
   exact 9-id registry, C-06's record shape, and no dangling edges.
5. ADR-009: hostile frontmatter keys (`__proto__`/`constructor`/
   `prototype`) land as own enumerable data on null-prototype `extra`
   (descriptor + JSON probes), hostile body headings stay verbatim
   prose, hostile path names are inert Map keys, global prototypes
   unpolluted — all pinned in test/component.test.ts.
Suites (ADR-011 order): lib/parser `npm ci` + `npx vitest run`
(125/125) + `npx tsc --noEmit` (clean) + `npm run build` (clean);
app `npm ci` + `npm run build` (clean) + `npm test` (94/94) with app
source UNTOUCHED (`git diff --stat -- app` empty — cargo untouched by
construction, zero src-tauri diff). No screen control, no port 1420.

### Flag for the verifier
- The `components` field is optional-but-always-set; if that reads as
  a wart, the alternative was breaking the app's empty-model literals.
- `parseComponentSet` is internal (barrel-private) — the public trio
  mirrors the task parser's surface exactly.
- Suggestion filed: T-008-s1 (component files for C-02/03/04 when
  their locations are decided).

## Verdicts
