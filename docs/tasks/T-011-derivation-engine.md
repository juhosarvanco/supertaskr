---
id: T-011
title: Derivation engine — intent ⨝ reality ⨝ tasks (TypeScript)
feature: F-06
milestone: 2
priority: 4
size: M
status: verifying
blocked_by: [T-008, T-009]
touches: [app-map]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- THE app SHALL compute, in pure DOM-free TypeScript (ADR-015, the
  T-004 selector pattern): file→component mapping (first-by-id glob
  match; no match → unmapped), component edges with relation
  {confirmed, planned, undeclared} per plan §4.2, status rollup per
  §4.3 as revised (touch_slugs ∪ component: field; frontmatter
  status only), provenance rollup (weakest of done tasks) per §4.4,
  and drift findings D1–D5 with stable ids.
- WHEN a task or component file changes on disk THE derived model
  SHALL update through the existing live snapshot path (no new IPC).
- IF graph.json is absent THEN THE model SHALL degrade to declared
  components only (all planned, "index not run" flag); IF
  components/ is absent THEN to inferred pseudo-components grouped
  by top directory, flagged inferred — no crash, no blank in either
  direction.
- Unit tests SHALL cover every rollup rule, every drift rule, both
  degraded states, and ADR-009 hostile keys; a fixture asserting
  this repo's expected findings SHALL pass (the dogfood check).

## Implementation notes

2026-08-15, executor claude-fable-5, branch t011-derivation (worktree
/Users/ujju/Projects/nputer-t011). Spec of record: plan §4 as revised by
§0.0 items 1+4, ADR-013/014/015/016, T-009 plan §6.6 (the package.path
seam — consumed here), T-008's ambiguous_mapping charter. Headless
throughout; port 1420 never touched; zero new dependencies (runtime OR
dev — see node-builtins.d.ts below).

### Module layout (app/src/lib/architecture/ — pure, DOM-free, T-004 selector pattern)
- `glob.ts` — the gitignore-subset matcher: `matchSegment` (iterative
  `*`/`?` glob, no regexes anywhere), `claimsPath` (ordered pattern list,
  negation last-match-wins), `claimingPattern` (which declared text
  decided a claim — feeds D4 issues), `claimsDirContents` (directory
  ownership via a NUL probe segment — the package.path join's primitive).
- `graph.ts` — schema-1 TS mirror (GraphFile/Symbol/Package/Edge/
  Unresolved/Stats) + `parseGraph(text)`: the validating boundary.
  graph.json is repo content = untrusted: collect-don't-throw GraphIssue
  union (graph-unreadable / graph-entry / graph-reference), id↔path and
  id↔name integrity enforced (spoof-proof), referential integrity on
  every edge endpoint (f:/p:/s: must exist; dangling → skipped, loudly),
  package `path` containment (absolute/../backslash → dropped with
  issue), stats copied field-by-static-field (hostile keys can't ride).
  ADR-009: filesById/packagesById are Maps; `own()` reads through
  Object.prototype.hasOwnProperty.call (a crafted `hasOwnProperty` key
  can't shadow it; Object.hasOwn needs ES2022 lib the app doesn't target).
- `derive.ts` — the join: `deriveArchitecture({components, graph?,
  tasks})` → DerivedArchitecture. Exported pieces: `rollupStatus`,
  `rollupProvenance`, `UNMAPPED_ID`, all model types. First-match-by-
  NUMERIC-id via the IMPORTED `compareComponentIds` (T-008's export —
  no fork). No new IPC, no wiring: the model is a pure function of
  snapshot-parsed inputs, which is what makes criterion 2 hold on the
  existing T-003 path when T-012 calls it.

### Glob mechanism: hand-rolled, and why
Zero new runtime deps (dispatch preference; also the supply-chain
posture T-009 set). The live registry uses only literals and `dir/**`;
a full library would still need its semantics pinned test-by-test to be
trusted, so the tests ARE the spec either way — a 227-line matcher with
46 pinned semantic rows beats a dependency with unpinned corners.
Semantics implemented (documented in glob.ts, each unit-tested):
anchored-when-slash, unanchored-per-segment otherwise (`*.ts` at any
depth, bare `dist` claims the dir anywhere), `**` zero-or-more except
terminal `**` = one-or-more (`a/**` ≠ `a` — gitignore rule), consumed-
pattern prefix = subtree claim (`app/test` claims `app/test/x.ts`),
trailing `/` = dir-only, `!` negation last-match-wins, `?` single char,
character classes/braces/escapes deliberately literal (none in the
registry; additive later), byte-exact case-sensitive. No regex
construction from untrusted text; two-pointer/memoized matching, no
pathological backtracking. T-008's parse-time textual overlap check and
this matcher never disagree by construction: parse time only flags
matcher-agnostic certainties; file-level truth is computed here (the
negation fixture pins a case where parse time over-approximates and
derivation shows no real ambiguity).

### Decisions at genuine silences (the record)
1. **Rollup set excludes `suggested`/`parked`** (§4.3 names six
   committed statuses): an untriaged ghost or a deliberate not-now must
   not drag a done component to planned. They ARE listed in the panel's
   task list with `inRollup: false`. Unit-pinned.
2. **Provenance floor `unreviewed`**: a `done` task with no `review:`
   stamp ranks BELOW self-verified (nothing was checked at all);
   exposed as a fourth DerivedProvenance value rendering as ADR-016's
   no-mark state. Three-way review data preserved as data — ADR-016
   collapses marks at display time (T-012), never here. Fires live: see
   dogfood snapshot (C-06) and T-011-s3.
3. **Provenance counts `done` only** (§4.4 verbatim): merging tasks
   don't contribute even when stamped. Unit-pinned.
4. **`component:` task field** (§0.0-4's future fine-grained path):
   read from the parser's preserved `extra` (null-prototype — safe);
   accepts a string or list of strings, exact-id match, works on any
   status (a suggested task naming a component is listed, not rolled).
5. **D1 is declared×declared**: edges touching the synthetic unmapped
   node stay relation `undeclared` (§4.2 "always") but report through
   D2 — the plan's has-drift definition treats unmapped+D2 as its own
   clause, so D1 there would double-count. Unclaimed-territory edges
   remain visible on the canvas either way.
6. **Unowned repo-internal package paths are unclaimed territory**: a
   `file:`-dep path no component owns joins the D2 group (and the edge
   goes to the unmapped node) rather than vanishing — same honesty rule
   as unmapped files. Directory ownership = the component whose
   patterns would claim files created inside that directory (NUL-probe;
   `lib/parser/**` owns `lib/parser`, a literal file pattern owns no
   dir), first-by-numeric-id on overlap.
7. **D3 is assignment-based**: a component whose globs match files that
   ALL lose to a lower id ends up owning nothing → declared_only fires
   beside the D4 that explains why. §4.1 defines matching as the
   assignment; the pair of findings together is the explainable truth.
8. **Degraded no-graph mode**: criterion's "all planned" read as the
   EDGES (nothing observable → every declared edge planned) — statuses
   still roll from tasks, which need no graph; zeroing them would
   discard real task truth for no reason. D5 still fires (intent-only);
   D1–D4 need reality and don't. `declaredOnly` stays false (no graph
   to judge against); the `indexNotRun` flag carries the state.
9. **Inferred mode emits relation `observed`** (4th value, this mode
   only, documented on the type): with no intent layer there is nothing
   to confirm or contradict, so reality-only edges are not painted as
   drift and the `undeclared ⇒ amber` invariant stays safe for T-012 in
   every mode. Zero findings in inferred mode (drift = intent vs
   reality divergence; there is no intent). Pseudo-components `dir:<top>`
   from top-level dirs; root-level files group as `dir:.` "(repo root)";
   package joins land on the pseudo owning the path's top dir (skipped
   when that dir holds no indexed files).
10. **Path ordering is byte order** everywhere paths are sorted (file
    edge lists, unmapped group, pseudo-dir order) — the committed
    graph's own convention; id ordering is the numeric-aware
    comparators (compareComponentIds for components, numeric-desc for
    the newest-first task lists).
11. **Hostile-collision guards**: edge-map keys are NUL-joined (a
    dangling depends_on id is arbitrary YAML text and must not forge
    key collisions); a depends_on naming the literal string "unmapped"
    cannot launder an observed unmapped edge into `confirmed` (§4.2
    forcing pinned by test) and cannot duplicate the synthetic node.
12. **graph.ts schema stance**: schema 1 closed; unknown keys ignored
    (machine-generated versioned content, not archaeology); schema ≠ 1
    → graph-unreadable → the model degrades to no-graph mode rather
    than guessing. Symbol `kind` left open (T-010 adds Rust kinds);
    edge `kind` closed (semantics depend on it).
13. **app/test/node-builtins.d.ts**: the dogfood test needs node:fs/
    path/url types and the app deliberately ships no @types/node (the
    webview bundle must never grow node imports — a missing type
    package keeps that loud). Declared exactly the surface the test
    uses instead of adding the dep. Runtime is vitest's node env where
    the modules are real.

### THE DOGFOOD FINDINGS (live tree, committed 49-file graph — the s2 decision input)
Pinned verbatim in app/test/architecture-dogfood.test.ts (green):

**D1 undeclared_dependency — four, not the predicted two.** T-008-s2's
prediction materialized EXACTLY (its three C-08 files and one C-09 file
via the shared `cn` in app/src/lib/utils.ts), and the same umbrella
mechanism produces two more the prediction missed, both from C-05's
`app/test/**` claim:
- `D1:C-05->C-06` — app/test/select-board.test.ts and
  app/test/select-task-detail.test.ts import @nputer/parser (package
  join): the TEST tree consumes the parser but C-05 declares no C-06
  dependency (the registry deliberately omitted it because no C-05
  SOURCE file imports it — the tests do).
- `D1:C-05->C-09` — app/test/detail-presentation.test.ts →
  app/src/lib/task-detail.ts; app/test/panel-dismissal.test.ts →
  app/src/components/board/panel-dismissal.ts;
  app/test/select-task-detail.test.ts → app/src/lib/task-detail.ts.
  C-05's tests exercise the detail panel; C-05 declares C-08/C-10/C-11
  but not C-09.
- `D1:C-08->C-05` — TaskCard.tsx, badges/ModelBadge.tsx,
  badges/SizeBadge.tsx → app/src/lib/utils.ts (`cn`). The s2 pair, half 1.
- `D1:C-09->C-05` — TaskDetailPanel.tsx → app/src/lib/utils.ts. Half 2.

**D2 unmapped_files — none.** All 49 files map: C-05 15, C-06 19,
C-08 10, C-09 3, C-10 2. (Changes at the merge regen — table below.)

**D3 declared_only_component — four:** C-01 (method/: markdown, never
indexed), C-07 (Rust crate: TS-only graph until T-010), C-11
(styles/assets: css+fonts), C-12 (app/src/architecture/**: empty until
T-012). C-07/C-12 self-clear later; C-01/C-11 are structural → T-011-s2.

**D4 ambiguous_mapping — none** (file-level): the umbrella's
non-overlap claim survives contact with the real tree; derivation-level
`issues` is empty.

**D5 dangling_depends_on — none.**

**Full relation table (20 edges)**: confirmed — C-05→C-08 (3),
C-05→C-10 (5), C-08→C-06 (4), C-08→C-09 (5), C-09→C-06 (2), C-09→C-08
(3), C-10→C-06 (1); undeclared — C-05→C-06 (2), C-05→C-09 (3),
C-08→C-05 (3), C-09→C-05 (1); planned — C-05→C-01, C-05→C-11, C-06→C-01,
C-08→C-11, C-09→C-11, C-12→C-06, C-12→C-07, C-12→C-10, C-12→C-11.
**The T-009 §6.6 seam is closed**: every C-0x→C-06 edge is now observed
through `p:@nputer/parser`'s `path: lib/parser` — C-08 via Board.tsx +
ReviewBadge.tsx + SizeBadge.tsx + board-model.ts, C-09 via
TaskDetailPanel.tsx + task-detail.ts, C-10 via docs-model.ts (all three
confirmed), C-05 via the two test files (undeclared) — none silently
absent, none stuck planned.

**Live rollup snapshot** (as of this tree; NOT asserted in the fixture —
task-status churn including T-017-in-parallel and this task's own flip
would break it; unit tables carry the rule coverage):
- C-01 done (pinned; auto=planned) · prov — · 0 files · drift (D3)
- C-05 building · same-model · 15 files · drift (D1 source)
- C-06 planned (T-019 planned holds it back) · **unreviewed** (T-016
  done, no stamp → T-011-s3) · 19 files · no drift
- C-07 planned · same-model · 0 files · drift (D3)
- C-08 building (T-017) · same-model · 10 files · drift (D1 source)
- C-09 building (T-017) · same-model · 3 files · drift (D1 source)
- C-10 building · same-model · 2 files · no drift
- C-11 building · same-model · 0 files · drift (D3)
- C-12 building (this task) · prov — (no done tasks) · 0 files · drift (D3)

### Post-merge regen delta (for the integrator, per T-009-s1 practice)
This branch's own files enter the graph at the merge regen (verified by
transiently regenerating and running the real engine, then restoring
the committed graph byte-identically): 57 files / 512 edges; the 5 new
app/test/* files map to C-05 (count 20); the 3 engine files are
unclaimed until T-011-s1 is decided. Dogfood edits to apply if the
architect has NOT amended C-12's paths by then:
- D1:C-05->C-06 fileEdges gains architecture-derive.test.ts and
  architecture-dogfood.test.ts (count 2→4).
- New finding `D2:unmapped` [app/src/lib/architecture/derive.ts,
  glob.ts, graph.ts]; unmapped node appears; drift list gains
  "unmapped"; mapping test: 57 files, C-05 count 20, unmappedFiles no
  longer empty.
- New edges: C-05→unmapped undeclared (6: the four test files importing
  the engine), unmapped→C-06 undeclared (1: derive.ts importing
  @nputer/parser).
If C-12's paths ARE amended to claim the engine first (T-011-s1 option
a): no D2, no unmapped edges; instead C-12 loses D3:C-12, gains 3
files, and the engine's parser import lands as C-12→C-06 confirmed
(declared already), with C-05→C-12 undeclared (6) appearing from the
test files — the architect may want C-05's depends_on to gain C-12, or
accept that amber; either way the two new C-05→C-06 test-file edges
stand.

### Per-criterion verification
1. **Pure-TS derivation computes mapping/edges/rollups/provenance/
   D1–D5**: app/src/lib/architecture/* has zero DOM/Tauri/IO imports
   (derive.ts imports @nputer/parser/pure + sibling modules only);
   50-test derive table + 46-row glob table + 9-assertion dogfood pin
   every §4.1/§4.2/§4.3/§4.4/§4.5 rule including first-by-NUMERIC-id
   (C-09 beats C-100, via the imported comparator), stable finding ids,
   and the files behind each finding.
2. **Live-update path, no new IPC**: no wiring added or changed —
   `deriveArchitecture` is a pure function of the parsed docs snapshot
   (components + tasks) and graph text already delivered by the T-003
   pipeline (ADR-014 §0.0-2: collector gains .json at T-012); zero
   diff outside app/src/lib/architecture/** + app/test/** proves no
   alternative channel exists. Recompute-per-snapshot is the ADR-015
   consequence ("same budget family as the board's selectors").
3. **Degraded states**: no-graph → declared-only, every declared edge
   `planned`, `indexNotRun` flag, statuses still roll, D5-only; no
   components → `dir:<top>` pseudo-components flagged `inferred`,
   `observed` relations, zero findings; both absent → `empty` model.
   All unit-pinned, no throw on any tested hostile/absent combination.
4. **Unit tests cover every rollup rule, every drift rule, both
   degraded states, ADR-009 hostile keys; dogfood fixture passes**:
   135 new tests (46 glob + 30 graph boundary + 50 derive + 9 dogfood);
   hostile coverage: __proto__/constructor as file paths, package
   names, top-level dirs, touch slugs, component: refs, dangling ids;
   prototype-pollution probes assert clean prototypes after every run;
   JSON-boundary hostile keys (own-property __proto__, hostile stats)
   inert; containment probes on package paths.

### Suites (this machine, macOS Darwin 25.6.0, node 22, from fresh npm ci)
ADR-011 order — lib/parser: `npm ci` + `npx vitest run` **132/132** +
`npx tsc --noEmit` clean + `npm run build` clean (zero diff in
lib/parser/**). app: `npm ci` + `npm run build` clean (tsc + vite) +
`npm test` **229/229** (94 baseline + 135 new). app/src-tauri: bare
`cargo test` **100 passed + 2 ignored** (app 20 + index 68+3+7+2), zero
src-tauri diff (cargo untouched by construction). Diff surface vs main:
app/src/lib/architecture/{derive,glob,graph}.ts + app/test/
{architecture-derive,architecture-dogfood,architecture-glob,
architecture-graph}.test.ts + app/test/node-builtins.d.ts + docs/tasks/
T-011-* — nothing else; lockfiles/manifests zero-diff (no new deps).
Working tree clean; committed graph.json byte-identical to main's.

### Flags for the verifier
- The dogfood fixture reads the LIVE tree (lib-parser smoke-test
  discipline). Its expectations move ONLY at graph regen or registry
  edits — both integrator/architect-attended events; the post-merge
  delta above is the prepared edit. Task-status churn cannot move it
  (verified: T-017 flipping states in parallel changes nothing asserted).
- claimsDirContents' NUL probe: reasoning is in glob.ts — a NUL segment
  can't equal any committed literal, so only wildcard/ancestor claims
  match it. Probe adversarially if suspicious.
- The relation `observed` (inferred mode only) is a deliberate 4th
  value beyond §4.2's table — see decision 9; if you read §4.2 as
  binding in inferred mode, that's the place to push back.
- node-builtins.d.ts is the one file that could raise eyebrows —
  decision 13 explains why it beats @types/node.

### Suggestions filed
- T-011-s1 — engine location vs C-12 paths (the post-regen D2 decision).
- T-011-s2 — D3 permanently ambers non-code components (C-01/C-11).
- T-011-s3 — T-016 done-with-no-stamp → C-06 provenance `unreviewed`.

## Verdicts
