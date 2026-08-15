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

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder): APPROVED

Suites reproduced from fresh `npm ci` installs, ADR-011 order:
lib/parser **125/125** (arithmetic + diff confirm 78 pre-existing
untouched — smoke.test.ts is pure addition — + 46 component.test.ts
+ 1 smoke) + `tsc --noEmit` clean + build clean; app `npm ci` +
`npm run build` clean + **94/94**. Boundary exact: diff (merge-base
5483a98, `main...HEAD`) = lib/parser/** + docs/architecture/
components/** + ONE link paragraph in ARCHITECTURE.md + docs/tasks/
T-008-*; app/ has ZERO diff incl. src-tauri (cargo untouched by
construction); lockfiles/manifests zero-diff (no new dependencies).
Main advanced during the build (150b227, 991b609, 185d26c — docs-only);
overlap of the two file sets computed empty, so merge-base semantics
are safe. Headless throughout; port 1420 never touched.

Probed beyond the executor's tests (35 own probe groups against the
BUILT dist, scratch scripts outside the repo, removed after the run):
identity-gate edges (C-1/C05/c-05/C-05x/numeric-8 rejected with
invalid-field naming `id`, no record; C-00/C-100/C-99999 pass; ids
trimmed), status vocabulary (all seven accepted; suggested/parked/
Done/junk → invalid-field + fallback auto, record kept), defaults
(depends_on/decisions/touch_slugs `[]`, layer off, responsibility
trimmed verbatim), duplicate ids (both kept; triple → two issues,
files pairs correct), dangling depends_on (`dangling-reference`
{file, field, id}; edge PRESERVED — incl. a reference to a file
that failed identity), paths (missing → missing-field with record;
`[]`/scalar → invalid-field), duplicate YAML keys → collected
yaml-error (no throw), malformed YAML mid-directory on real disk →
rest parses, unreadable file → io-error naming it while siblings
parse, permutation determinism (deep-equal, issues included).

ADR-009 verified at descriptor level: `__proto__:` frontmatter key
lands as an OWN enumerable property of a NULL-PROTOTYPE `extra`
(Object.getPrototypeOf(extra) === null), nothing inherited, global
prototypes unpolluted, JSON/entries visible; constructor/prototype/
toString/hasOwnProperty/valueOf keys own data; hostile body headings
verbatim prose; hostile path names inert Map keys.

**Honesty-pin ruling: HOLDS.** The conservative contract is exactly
as stated and my adversarial sweep could not break it either way:
identical normalized patterns and `P/**`⊃`P/…` flagged (both
directions, `./`/`/` normalization, declared text reported, ids/
files/patterns index-aligned, ids[0] = numeric-order winner — C-09
beats C-100, comparator exported for T-011); NO false positive on
disjoint or prefix-trap pairs (`app/**` vs `apple/x`, `lib/parser/**`
vs `lib/parse/**`); `dir` vs `dir/**`, `*.ts` forms and bare `app`
correctly NOT guessed; negations never participate (either side,
even identical negations); same-id pairs stay duplicate-id only. No
glob matcher was forked in: the pure closure's ONLY external is
`yaml`. The T-011 handoff (file-level detection from derivation,
same `ambiguous-mapping` issue kind) is recorded in types.ts, in
component.ts and in this file. The criterion's WHEN-obligation is
met under the dispatch-sanctioned conservative reading; the
statement is true and the tests pin it. One nuance for the record:
identical declared territory warns even when the globs currently
match zero files — that is intent-level ambiguity and consistent
with a WHEN (not ONLY-WHEN) obligation.

Pure-entry webview proof, statically: import-closure walk of
dist/pure.js = 8 files (component/files/frontmatter/model-session/
pure/roadmap/task/types), no `node:` builtin reachable in code,
`node:fs` in comments only, project.js unreachable (control: the
node barrel DOES reach it). Barrel surface as specified — pure
exports parseComponentFile/parseComponentsFromFiles (+ comparator,
predicate, COMPONENT_STATUSES), parseComponentDirectory node-only;
pure and node deep-equal on identical inputs.

Dogfood registry audit: 9 files parse **0 issues** through the built
dist (independent run + whole-project parse + pure-vs-node cross-
check); ids C-01/05/06/07 keep their ARCHITECTURE meanings, C-08…C-12
subdivide the app, C-02/03/04 slots left reserved. C-05's umbrella
verified non-overlapping by an independent reimplementation of the
textual check AND real-tree inspection of the literals. C-07's path
is the ADR-015 location; touch_slugs match the ARCHITECTURE mapping
(C-01 `[]` is correct — no slug maps to method/). depends_on
spot-checked against real imports — 8/8 declared edges real, incl.
BOTH directions of the C-08↔C-09 cycle (Board.tsx imports
TaskDetailPanel; TaskDetailPanel imports TaskCard's exported classes
+ badges/ReviewBadge) and C-05's omission of C-06 verified honest
(no C-05-owned file imports @nputer/parser; only child components'
files do). **C-02/03/04 omission ruling: legitimate, not a criterion
gap** — the criterion asks ≥5 in the shared namespace (met at 9),
not table coverage; `paths` is required non-empty by the format,
no doc decides those code locations, and inventing globs would
breach ADR-004 single-writer. T-008-s1 is the right channel.

Security sweep: clean. No new dependencies (lockfiles zero-diff),
no eval/exec/dynamic regex (static anchored patterns only), no
path-traversal surface beyond the caller-provided dir contract,
collect-don't-throw holds on every hostile input tried, ADR-009
descriptor-level clean, no secrets in the diff.

Non-failures filed: T-008-s2 (undeclared C-08/C-09 → C-05 reality
edges via the shared `cn` primitive — decide before T-011 lights
them amber), T-008-s3 (numerically-equal id aliases C-05/C-005 pass
the identity gate as distinct components — cheap set-level warning).
