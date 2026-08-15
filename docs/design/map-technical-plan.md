# nputer — architecture map: technical plan

Handoff for the coding session (Claude Code). Prepared 2026-08-15 with Juho.
Scope: **only the architecture map** ("Google Maps of the codebase") inside
nputer. Everything else in the app is out of scope for this document.

Decisions already made (do not reopen):

- **v1 ships intent + reality overlaid.** Declared components (architect-
  authored) AND a code-derived graph (indexer) from day one; drift is a v1
  feature, not a follow-up.
- **Indexer languages v1: TypeScript (incl. TSX/JS) and Rust** — nputer's own
  stack, so the map dogfoods on nputer's repo immediately.
- **Graph data lives as plain files in the repo** (`docs/architecture/…`),
  regenerated deterministically, diffable, readable by agents. The app is a
  lens over those files, same as the board is a lens over task files.

## 0.0 Promotion revisions (architect claude-fable-5, 2026-08-15)

This document was reviewed and promoted into the record; the three
decisions above are now ADR-013 (intent+reality v1, languages) and
ADR-014 (committed deterministic graph files). The following revisions
were applied at promotion — where a section below conflicts with this
list, this list wins:

1. **Derivation and all frontmatter parsing move to TypeScript
   (ADR-015).** The original §5.5 put `load_architecture` and the
   derived model on the Rust side; that contradicts the built pattern
   (T-003: Rust is a contained file shipper, parsing lives where TS
   runs) and would fork the convention's one hardened frontmatter
   parser (@nputer/parser, ADR-009). The indexer stays Rust and emits
   `graph.json` ONLY; component files are parsed by @nputer/parser
   (new ComponentRecord module, T-008); the intent⨝reality⨝tasks
   join is pure TS in the app (T-011). §5.5 is revised accordingly.
2. **Delivery rides the existing docs pipeline.** Component files
   (`docs/architecture/components/*.md`) are inside the watched docs/
   tree already; the T-003 collector gains `.json` under
   `docs/architecture/` for `graph.json`. The collector's 1 MiB/file
   cap governs the indexer's size budget (§3.2): the symbol budget is
   sized so `graph.json` stays under the cap; exceeding it is a
   defined degraded state, never a silent drop.
3. **Repo paths corrected to the real layout** (ADR-011): the crate
   is `app/src-tauri/crates/nputer-index` (a Cargo workspace is
   introduced inside app/src-tauri — the Rust sibling of ADR-011's
   decision, recorded there); frontend map code is `app/src/…`;
   there is no `src/routes/**`. The pane switcher the map needs in
   the shell is app-shell territory and is declared in T-012's
   touches.
4. **`touches` uses the repo's slug vocabulary, not globs** (§4.3
   revised): component→task intersection goes through the
   ARCHITECTURE.md slug mapping (components declare `touch_slugs`),
   with the optional `component:` task field as the future fine-
   grained path. Task status comes from frontmatter `status:` (the
   pipeline maintains it) — verdict-text parsing is not required.
5. **Volatile fields are omitted from the committed graph** (§3.1
   alternative chosen): no `commit`, no `index_ms` in `graph.json`;
   stats live in the CLI/report output only.
6. **Churn shells out to `git`** (no `git2` dependency — smaller
   surface, ADR-003 spirit).
7. **Source watching extends the containment story explicitly**:
   walking code paths inherits T-003's symlink/canonicalization rules
   and the `ignore` crate's gitignore handling; watch scope beyond
   docs/ is part of T-009's containment criteria, not hand-waved.
8. **The C-id registry is re-chartered by T-008's dogfood files**:
   component files use the SAME C-namespace as ARCHITECTURE.md —
   existing ids keep their meaning (C-01…C-07); finer-grained app
   components get new ids. The design handoff's hero-mock names stay
   indicative.
9. **The task list in §8 is superseded** by the promoted task files
   docs/tasks/T-008…T-015 (feature F-06, decomposed through the full
   rules); §8 remains as drafting record.
10. **Sequencing is NOT decided here.** Where F-06 sits relative to
   F-03 (in-app interview) and what visibly moves down is open in
   rooms/map-sequencing.md — ADR-013 records the scope decision, the
   room records the ordering one.

---

## 0. Why this pane exists (the one-paragraph brief)

The board answers "what is being built"; the map answers "what the system
*is*, how far along each part is, and where reality has quietly diverged from
the plan". It is not documentation. It is a **progress heatmap over a live
model of the code**, with two layers that never existed side by side before:
the **intent layer** (components + dependencies the architect declared) and
the **reality layer** (files, symbols and dependencies parsed from the code).
Where they agree, the map is solid. Where the code has grown an edge the
architecture doesn't know about, or a file no component claims, the map lights
it **amber (drift)**. Status color per component is derived from the tasks that
touch it, so the architecture fills in teal top-down as the board completes.
Review provenance rolls up too: a component built entirely under self-verified
tasks must never look as trustworthy as one checked by independent eyes.

Design principles inherited from nputer that constrain everything below:

1. **Boring files.** Every input and every persisted output is a plain file in
   the repo. Nothing the map knows lives only inside the app.
2. **Lens, not editor.** The app reads; the architect (a session) writes the
   intent files; the indexer (a Rust crate the app embeds and the CLI exposes)
   writes the reality file. The app itself writes at most the optional layout
   file when the user drags a node.
3. **Deterministic outputs.** Same repo state → byte-identical `graph.json`.
   Sorted keys, sorted arrays, no timestamps in the diffable payload.
4. **Tokens only.** All map colors resolve to `tokens.css` custom properties;
   status uses the existing six-status family; new tokens are proposed in §9.
5. **Local-first, strict CSP.** No remote fetches. Layout engine (elkjs) is
   bundled. Fonts are the app's fonts.

---

## 1. Model: three layers, three zoom tiers

### 1.1 Layers

| layer | source | who writes it | file |
|---|---|---|---|
| **Intent** | component files (one markdown file per component, frontmatter + prose) | architect/planner session | `docs/architecture/components/C-xx-<slug>.md` |
| **Reality** | parsed code: files, symbols, dependency edges | indexer (`nputer-index` crate; runs in-app and via CLI) | `docs/architecture/graph.json` |
| **Derived** | intent ⨝ reality ⨝ tasks: component rollups, status, provenance, drift, unmapped | app, at load, in memory (never persisted) | — |

Plus one optional persisted file: `docs/architecture/layout.json` — pinned
node positions, written only when the user drags something. Absent by default.

`ARCHITECTURE.md` stays the human overview (prose, diagram of record, links to
component files). The map does **not** parse prose; it parses component files.
Rationale: mirrors the task convention (one file, frontmatter, parseable with
the existing frontmatter parser), keeps ARCHITECTURE.md free-form for humans.

### 1.2 Zoom tiers (semantic zoom, not just scale)

- **T0 — components.** One node per declared component (+ one synthetic
  "unmapped" node when needed). Edges = declared dependencies ∪ observed
  file-level dependencies rolled up to component pairs. This is the pane's
  default view and the "blueprint coming to life" screenshot.
- **T1 — files inside a component.** Expanding a component shows its matched
  files (grouped by directory) and the file→file edges within it plus stubs to
  other components. Other components stay collapsed around it.
- **T2 — symbols of a file.** Selecting a file lists its exported/declared
  symbols and their edges **in the detail panel** (not on the canvas in v1).
  Canvas-level symbol nodes are a later enhancement.

Zoom is discrete (expand/collapse), pan/scale is continuous. Layout must stay
spatially stable across expand/collapse and across re-indexes (§6.4).

---

## 2. Intent layer: component files

Path: `docs/architecture/components/C-<nn>-<slug>.md`. One component per file.

```markdown
---
id: C-03
name: Board renderer
layer: ui                 # free-form label, used for grouping/lanes; optional
paths:                    # globs relative to repo root, gitignore-style
  - src/board/**
  - src/components/TaskCard.tsx
depends_on: [C-02, C-05]  # declared, directional: this component → those
decisions: [ADR-007, ADR-008]   # linked decision records (ids resolve to docs/decisions/*)
status: auto              # auto | planned | building | verifying | rejected | done | merging (override; default auto)
---
Renders the story map board from the parsed model. Owns column layout,
card faces, slice line, ghost/parked treatments. Never writes.
```

Rules the parser enforces (and the parse-error chip reports, non-blocking):

- `id` unique, pattern `C-\d{2,}`; `name` required; `paths` non-empty.
- `depends_on` ids must exist (dangling → parse warning, edge drawn to a
  placeholder node so it's visible, never dropped).
- A file matched by more than one component's `paths` → **first match by
  component id order wins**, and the overlap is reported as a warning
  (`ambiguous_mapping`). Deterministic, visible, non-fatal.
- `status: auto` (default) means derive from tasks (§4). Any other value pins
  the color and marks the node "pinned" in the panel.

Body prose = the component's responsibility; shown verbatim in the panel.

Why globs and not a folder-per-component convention: real repos don't map 1:1
onto folders, and asking the architect to declare `paths` is a useful planning
discipline (it also feeds `touches` sanity checks later).

---

## 3. Reality layer: `graph.json`

Written by the indexer. Deterministic. Committed to the repo (it is
regenerated; conflicts resolve by re-running the indexer).

### 3.1 Schema (v1)

```jsonc
{
  "schema": 1,
  "root": ".",                       // repo-relative; always "."
  "commit": "a1b2c3d",               // HEAD short sha at index time, or null if not a git repo
  "languages": ["ts", "rust"],
  "files": [                         // sorted by path
    {
      "id": "f:src/board/Board.tsx", // stable id = "f:" + path
      "path": "src/board/Board.tsx",
      "lang": "ts",                  // ts | js | rust
      "hash": "blake3:…",            // content hash; enables incremental
      "loc": 212,
      "symbols": [                   // sorted by name, then line
        {
          "id": "s:src/board/Board.tsx#Board",
          "name": "Board",
          "kind": "function",        // function | class | interface | type | enum | const | struct | trait | impl | mod | macro
          "exported": true,
          "range": [12, 140]         // 1-based start/end lines
        }
      ]
    }
  ],
  "packages": [                      // external deps referenced (sorted)
    { "id": "p:react", "name": "react", "ecosystem": "npm" },
    { "id": "p:serde", "name": "serde", "ecosystem": "cargo" }
  ],
  "edges": [                         // sorted by (from, to, kind)
    { "from": "f:src/board/Board.tsx", "to": "f:src/model/parse.ts", "kind": "import", "symbols": ["parseModel"] },
    { "from": "f:src/board/Board.tsx", "to": "p:react", "kind": "import" },
    { "from": "s:src/board/Board.tsx#Board", "to": "s:src/model/parse.ts#parseModel", "kind": "call", "confidence": "resolved" }
  ],
  "unresolved": [                    // imports the resolver could not place; sorted
    { "from": "f:src/x.ts", "specifier": "./missing", "reason": "not_found" }
  ],
  "stats": { "files": 84, "symbols": 512, "edges": 903, "index_ms": 340 }
}
```

Edge kinds v1: `import` (module-level, both langs; TS `import`/`export from`/
`require`/dynamic `import()`; Rust `use`/`mod`/path refs across files),
`call` (symbol→symbol, best-effort, `confidence: resolved | heuristic`),
`type_ref` (TS type positions; Rust type paths). Only `import` is required for
the map to work; `call`/`type_ref` feed T2 and the drift rules only when
`resolved`.

Ids are content-free (path + name), so they survive re-indexing and diffs read
as "edge added/removed", never as churn.

`stats.index_ms` and `commit`: **omitted from the committed file**
(decided at promotion, §0.0 item 5) — the committed payload is pure
content, so an unchanged tree diffs to zero lines. Timings and the
indexed commit go in the CLI report / in-app note only.

### 3.2 Size discipline

nputer-scale repos produce a few hundred KB. For large repos (>5k files) the
indexer emits `symbols: []` for files beyond a configurable budget and sets
`stats.truncated_symbols: true`; the map degrades to file-level detail with a
visible note. Never silently drop files or edges.

---

## 4. Derived layer: what the app computes at load

Inputs: component files, `graph.json`, the already-parsed task model
(`touches`, `status`, `built_by`, `verified_by`, review provenance, verdicts),
optional `layout.json`.

### 4.1 File → component mapping

For each `graph.json` file: first component (by id order) whose `paths` glob
matches → `file.component = C-xx`. No match → `component = "unmapped"`.
Component with zero matched files → flagged `declared_only`.

### 4.2 Component-level edges

Observed: for every file→file `import` edge with `component(from) ≠
component(to)`, add/increment an observed component edge `(A → B, count)`.
Declared: from `depends_on`. Merge into one edge set with a **relation** each:

| declared | observed | relation | drawing intent |
|---|---|---|---|
| yes | yes | `confirmed` | solid |
| yes | no  | `planned` | faint/dotted — declared, not yet realized in code (normal early in a build) |
| no  | yes | `undeclared` | **drift** — amber, dashed; counted against the *source* component |

Edges to/from `unmapped` are always `undeclared`.

### 4.3 Status per component (when `status: auto`)

*(Revised at promotion — see §0.0 item 4.)* Task set = tasks whose
`touches` slugs intersect the component's declared `touch_slugs`
(slug→component mapping per ARCHITECTURE.md; this repo's tasks use
slugs, not path globs), plus tasks carrying an explicit `component:`
field naming this id. Task status is read from frontmatter `status:`
— the pipeline maintains it; no verdict-text parsing. Rollup, first
rule that fires wins:

1. any task `rejected` → `rejected`
2. any task `verifying` → `verifying`
3. any task `building` → `building`
4. any task `merging` → `merging`
5. ≥1 task and all `done` → `done`
6. otherwise → `planned`

The panel always lists the tasks behind the rollup, newest first, so the
color is explainable.

### 4.4 Provenance per component

Weakest provenance among `done` tasks touching it: `independent` >
`same_model` > `self`. Exposed as `component.provenance` and drawn with the
same honesty-trio marks the cards use (§9). If there are no done tasks, no
mark.

### 4.5 Drift findings (v1 rules, each with an id, all reported in the panel)

- `D1 undeclared_dependency` — observed component edge with no declaration.
- `D2 unmapped_files` — files matched by no component (grouped; count).
- `D3 declared_only_component` — component whose globs match nothing.
- `D4 ambiguous_mapping` — file matched by more than one component (warning).
- `D5 dangling_depends_on` — declared dependency on a non-existent id.
- (reserved) `D6 layer_violation` — if `layer` order is declared in
  `docs/architecture/layers.md` later; not v1.

A component "has drift" if it is the source of any D1 or has D3/D5, or is the
synthetic unmapped node with D2. **Drift is an overlay flag, not a status**:
a `done` component can be amber-ringed. Colors: drift uses the *warning*
amber, distinct from *building/verifying* amber (see §9 — this distinction is
a hard requirement from the T-006 handoff §3.4).

### 4.6 Churn (v1, cheap)

From `git log --since=90d --name-only` (via `git2` or shelling out): commits
per file → per component; exposed as an optional overlay. If not a git repo,
overlay is disabled, not broken.

---

## 5. Indexer: `nputer-index` (Rust)

Location: `app/src-tauri/crates/nputer-index` (workspace member; the
workspace is introduced inside app/src-tauri at T-009 — the Rust
sibling of ADR-011). No tauri dependency in the crate (ADR-015). Used
by (a) a thin Tauri command in the app, (b) its own small binary
(`nputer-index`), which the future Node CLI (C-02, ADR-007) shells
out to per ADR-003 — `nputer index` is Node wrapping this binary,
not a Rust CLI.

### 5.1 Pipeline

1. **Walk** — `ignore` crate (respects `.gitignore`, `.nputerignore` optional
   extra excludes); collect `.ts .tsx .js .jsx .mts .cts .rs`.
2. **Hash** — blake3 per file; consult cache (`<app-data>/index-cache/<repo-hash>/`)
   keyed by path+hash → skip parse if unchanged. (Cache is app-side and
   disposable; the committed `graph.json` is the truth.)
3. **Parse** — tree-sitter (`tree-sitter-typescript` for ts/tsx, `tree-sitter-
   javascript` for js/jsx, `tree-sitter-rust`). Per language an *extractor*
   produces: symbols (declarations with export flag and range), import
   specifiers (with imported names), and call/type-ref candidates by name.
4. **Resolve** —
   - TS/JS: relative specifiers → try exact, `+.ts/.tsx/.js/.jsx/.mts/.cts`,
     `/index.*`; honor `tsconfig.json` `baseUrl` + `paths` (nearest tsconfig
     up the tree); bare specifiers → package node (name = first segment, or
     `@scope/name`); `.d.ts` preferred only if no source sibling. Unresolvable
     → `unresolved[]`, never dropped.
   - Rust: build the module tree from `mod x;` declarations and `#[path]`,
     starting at each crate root (`Cargo.toml` `[lib]`/`[[bin]]`, defaults
     `src/lib.rs`, `src/main.rs`); resolve `use` paths `crate::`, `super::`,
     `self::`, and workspace crate names to files; external crates → package
     node (`ecosystem: cargo`). Re-exports (`pub use`) recorded as `import`
     with `reexport: true`.
   - Calls: within a file, name → local symbol; else name → imported symbol
     if the import is resolved; else no edge (or `heuristic` if a unique
     exported symbol of that name exists across the repo — behind a flag,
     off by default to protect precision).
5. **Emit** — sort everything, serialize with a stable pretty-printer (2-space,
   trailing newline). Write only if bytes differ.

### 5.2 Watch mode

Reuse the app's existing markdown file watcher; add code paths. Debounce
300 ms; on change, re-index changed files only, re-emit, and the frontend
store reloads (existing live-update path). `nputer index --watch` does the
same headless (for users whose agents run in a terminal while the app is
closed).

### 5.3 Check mode (CI/agents)

`nputer index --check` exits non-zero if the committed `graph.json` differs
from a fresh index (like `cargo fmt --check`), and `nputer arch --check` (see
CLI below) exits non-zero on drift findings above a configurable severity.
This is how the map's honesty becomes enforceable later; v1 only needs the
exit codes and a plain-text report.

### 5.4 Determinism & perf budgets

- Golden tests: fixture repos under `crates/nputer-index/tests/fixtures/`
  (`ts-basic`, `ts-paths-alias`, `rust-workspace`, `mixed`) with committed
  expected `graph.json`. Property test: index twice → identical bytes.
- Budget: nputer's own repo < 500 ms cold, < 50 ms incremental single-file;
  10k-file repo < 10 s cold on a laptop. Parse in parallel (`rayon`).

### 5.5 Public API (Rust)

```rust
pub struct IndexOptions { pub root: PathBuf, pub cache_dir: Option<PathBuf>, pub languages: Vec<Lang>, pub symbol_budget: usize, pub heuristic_calls: bool }
pub fn index(opts: &IndexOptions) -> Result<Graph>;            // full or incremental (uses cache)
pub fn write_graph(graph: &Graph, path: &Path) -> Result<bool>; // returns true if file changed
pub fn diff(a: &Graph, b: &Graph) -> GraphDiff;                 // for --check and later time machine
```

Tauri command: `index_repo() -> IndexReport` (zero-argument, roots at
the resolved project dir — ADR-010/012 pattern; the webview never
supplies a path). There is NO `load_architecture` command — *(revised
at promotion, §0.0 item 1)*: component files and `graph.json` reach
the frontend through the existing docs snapshot pipeline, and the
derived model (mapping, relations, rollups, drift) is computed in
pure TypeScript (T-011), where the one hardened frontmatter parser
lives. The frontend is still a renderer over pure functions; the
functions are TS, not Rust.

---

## 6. App: the map view

### 6.1 Frontend architecture

- `src/architecture/model.ts` — types mirroring the Rust `ArchitectureModel`.
- `src/architecture/store.ts` — loads via Tauri command, subscribes to live
  updates, holds UI state (expanded set, selection, active overlays, search).
- `src/architecture/layout.ts` — ELK wrapper (elkjs bundled; `layered`
  algorithm, direction configurable, default `RIGHT`), input sorted by id so
  output is deterministic; merges `layout.json` pins.
- `src/architecture/MapView.tsx` — SVG canvas (pan/zoom via a single
  `transform`), nodes, edges, overlays.
- `src/architecture/MapPanel.tsx` — the detail panel; reuse the T-005 drawer
  primitive so cards and components open the same way.
- `src/architecture/overlays/*.ts` — pure functions `model → per-node visual
  props` for status (default), provenance, drift, churn, verdicts.

Rendering choice: **SVG in v1** (dozens to low hundreds of nodes at T0/T1;
token colors as CSS custom properties; the existing pulse keyframe works
unchanged; `prefers-reduced-motion` handled centrally). Revisit WebGL only if
T2-on-canvas or 5k+ node views become a real requirement.

### 6.2 Interactions (v1)

- Hover node → highlight its edges + neighbors, dim the rest (CSS class, no
  animation).
- Click node → panel; Enter/Space when focused does the same. Nodes are in
  tab order (roving tabindex), arrow keys move along edges.
- Double-click / Enter-on-expand-affordance → expand to T1; Esc collapses.
- Click edge → panel shows the file-level edges behind it (with counts and
  the drift relation).
- Search (⌘K-style field in the pane header): components, files, symbols;
  result → select + center.
- Overlay toggles (segmented control): status · provenance · drift · churn.
  Status is always the base fill; other overlays add rings/marks/edge styling.
- Legend: always visible, compact, driven by the same overlay definitions.
- Drag node → position pinned into `layout.json` (only write path in this
  pane; debounced; the file is small and human-readable).
- Reduced motion: no pulse, no transitions on expand/collapse.

### 6.3 Panel contents (component)

Name + id · status chip + provenance mark · responsibility (prose) · declared
dependencies / dependents · observed dependencies with counts and relation ·
**drift findings** (each with id, explanation, and the files behind it) ·
tasks touching it (status, model badge, review badge; click → card detail
panel) · decision records (links) · files (grouped by dir; click → T2 symbol
list) · churn sparkline (if git). Empty sections render a placeholder, never
an error (T-005 rule).

### 6.4 Layout stability rules

- Sort ELK inputs; fix ELK options (`nodePlacement.strategy=BRANDES_KOEPF`,
  fixed spacing) so the same graph → same picture.
- Expanding a component grows it in place; siblings shift minimally (ELK
  incremental option `interactive` for the top level).
- Pins from `layout.json` override; unpinned nodes still auto-lay-out around
  pinned ones (ELK `FIXED` position constraint).
- New components appear at the frontier (end of the layered order) rather
  than reshuffling existing ones — enforced by seeding ELK with previous
  positions as `interactive` hints kept in memory across reloads.

### 6.5 Empty & degraded states

- No `docs/architecture/components/` → pane shows "no architecture declared"
  + what it looked for + (if graph exists) the reality graph alone, grouped by
  top-level directory as provisional pseudo-components (clearly labeled
  "inferred", dashed).
- No `graph.json` → declared components only, all `planned`, with a one-line
  "index not run" note and a button that runs `index_repo`.
- Parse errors in component files → existing parse-error chip; last valid
  model stays on screen.
- Huge graph → symbol truncation note (§3.2).

---

## 7. CLI surface (power path; the app calls the same code)

- `nputer index [--watch] [--check] [--root .]` — write/verify `graph.json`.
- `nputer arch` — print components with status, provenance, drift summary
  (plain text; agents will read this).
- `nputer arch deps <C-xx|path>` — who depends on it / what it depends on
  (declared vs observed).
- `nputer arch drift [--fail-on undeclared|unmapped|any]` — findings list +
  exit code.

Keep output plain and stable; sessions will grep it.

---

## 8. Task decomposition — SUPERSEDED at promotion by docs/tasks/T-008…T-015 (F-06); kept as drafting record

Format follows nputer's task convention: frontmatter (id, feature, priority,
size, status, builds/verifies) + EARS acceptance criteria + `touches`. Feature:
**F-0x Architecture map**. Priorities are the intended build order.

**T-M01 · Component files convention + parser** (S) — touches:
`src-tauri/src/model/**`, `docs/architecture/components/**`, `docs/ARCHITECTURE.md`
- THE parser SHALL read `docs/architecture/components/*.md` into typed
  components (id, name, layer, paths, depends_on, decisions, status, body).
- IF a component file is malformed THEN the parse-error chip SHALL report it
  and the last valid model SHALL remain.
- WHEN two components' `paths` match the same file THEN the model SHALL keep
  first-by-id and record an `ambiguous_mapping` warning.
- THE nputer repo SHALL ship with its own component files (dogfood; ≥5).

**T-M02 · Indexer crate: TypeScript** (L) — touches: `src-tauri/crates/nputer-index/**`
- WHEN run on a TS/JS repo THE indexer SHALL emit `graph.json` per §3 with
  files, symbols, resolved import edges, packages, and unresolved specifiers.
- THE output SHALL be byte-identical across two consecutive runs on an
  unchanged tree (golden + property tests).
- WHEN a `tsconfig.json` declares `paths` THEN aliased imports SHALL resolve.
- WHEN one file changes THEN incremental re-index SHALL re-parse only that
  file (< 50 ms on the nputer repo).

**T-M03 · Indexer crate: Rust** (M) — touches: `src-tauri/crates/nputer-index/src/lang/rust/**`
- WHEN run on a Cargo workspace THE indexer SHALL resolve `mod`/`use` paths
  across files and crates and emit symbols (fn/struct/enum/trait/impl/mod).
- External crates SHALL appear as `cargo` package nodes.
- Golden fixture `rust-workspace` SHALL pass.

**T-M04 · Derivation engine** (M) — touches: `src-tauri/src/architecture/**`
- THE app SHALL compute file→component mapping, component edges with relation
  {confirmed, planned, undeclared}, status rollup per §4.3, provenance per
  §4.4, drift findings D1–D5, and churn (if git), exposed as one
  `ArchitectureModel` via `load_architecture`.
- WHEN a task touching a component changes status THEN the component's
  derived status SHALL update on the existing live-update path.
- Unit tests SHALL cover every rollup rule and every drift rule.

**T-M05 · Map view T0 + panel** (L) — touches: `src/architecture/**`, `src/routes/**`, `tokens.css`
- WHEN the map pane opens on the nputer repo THE app SHALL render every
  component as a node with status fill and provenance mark, and edges styled
  by relation, laid out deterministically (ELK), with legend and search.
- WHEN a node is clicked or activated by keyboard THEN the panel SHALL show
  §6.3 contents; empty sections SHALL render placeholders.
- Drift SHALL be visible on the node (ring) and on the edge (dashed, warning
  amber) using the tokens from §9; building-amber and warning-amber SHALL be
  distinguishable in both schemes (screenshot check).
- `prefers-reduced-motion` SHALL disable the pulse and transitions.

**T-M06 · Semantic zoom T1/T2 + overlays** (M) — touches: `src/architecture/**`
- WHEN a component is expanded THEN its files SHALL render grouped by
  directory with intra-component edges and stubs to other components, without
  moving unexpanded siblings more than necessary (interactive layout).
- WHEN a file is selected THEN the panel SHALL list its symbols and their
  resolved edges.
- Overlays status/provenance/drift/churn SHALL be toggleable; the legend SHALL
  follow the active overlay.

**T-M07 · CLI + watch + check** (S) — touches: `src-tauri/src/bin/**`, `src-tauri/crates/nputer-index/**`
- `nputer index --check` SHALL exit non-zero when the committed graph is
  stale; `nputer arch drift --fail-on any` SHALL exit non-zero on findings.
- `--watch` SHALL keep `graph.json` current with the app closed.

**T-M08 · Layout pins** (S, optional for v1) — touches: `src/architecture/layout.ts`, `docs/architecture/layout.json`
- WHEN a node is dragged THEN its position SHALL persist to `layout.json` and
  survive re-index and app restart; unpinned nodes SHALL lay out around pins.

Suggested milestone: M01 → M02 → M04 → M05 form the vertical slice that
produces the "blueprint coming to life" screenshot on nputer's own repo; M03,
M06, M07, M08 follow.

---

## 9. Tokens the map needs (proposal for the design pass; names are the contract)

Reuses unchanged: `--status-*-bg/-fg` (six), `--border`, `--ring`,
`--muted(-foreground)`, `--card`, `--font-mono-stack`, `--pulse-duration`,
`--pulse-opacity-dip`.

New (values come back from the design handoff):

- `--warning` / `--warning-foreground` — **drift / contradiction amber**, must
  be distinguishable at a glance from `--status-building-bg` and
  `--status-verifying-bg` in both schemes. Also future home of truth-
  maintenance amber.
- `--map-canvas` — canvas background (may equal `--background`; kept separate
  so a subtle grid/dot pattern can be tokenized: `--map-grid`).
- `--map-node-border`, `--map-node-border-selected`, `--map-node-shadow`.
- `--map-edge`, `--map-edge-muted` (dimmed when another node is hovered),
  `--map-edge-planned` (declared, unrealized), `--map-edge-drift` (defaults to
  `--warning`).
- `--map-unmapped-bg/-fg` — the synthetic "unmapped" node and inferred
  pseudo-components (should read as "provisional", akin to ghost cards).
- `--map-group-bg` — expanded component container fill at T1.
- Provenance marks reuse the review-badge trio; if the design gives them
  tokens (`--provenance-independent/-same/-self`) the map uses the same ones.

---

## 10. Testing strategy

- Indexer: golden fixtures + determinism property + resolution edge cases
  (index files, extension-less imports, `paths` aliases, `pub use` chains,
  `#[path]`, bin+lib crates).
- Derivation: table-driven tests for every rollup/drift rule; a fixture where
  nputer's own repo is the input and expected findings are asserted (this is
  also the dogfood check — the repo should reach zero drift before launch).
- UI: Playwright screenshot of the T0 map on nputer's repo, light and dark,
  reduced-motion on/off; keyboard traversal test; panel empty-state test.
- Perf: budget assertions from §5.4 in CI (with generous CI multipliers).

---

## 11. Risks & mitigations

- **Precision of call edges.** Name-based resolution will be wrong sometimes.
  Mitigation: `import` edges are the backbone; calls carry `confidence`; the
  UI never draws `heuristic` edges at T0.
- **Glob discipline.** If architects write sloppy `paths`, everything is
  "unmapped". Mitigation: the D2 finding is loud and the panel offers the
  suggested glob (the common directory prefix of unmapped files) as copyable
  text; the interview's "adopt existing repo" flow can pre-fill components
  from top-level directories.
- **Layout jitter.** Mitigation: §6.4 rules + a screenshot-diff test on
  expand/collapse.
- **Big repos.** Symbol budget + T0-only rendering keep the pane usable;
  WebGL is a known escape hatch, not a v1 requirement.
- **`graph.json` merge conflicts.** Documented rule: never hand-edit; on
  conflict take either side and re-run `nputer index`.

---

## 12. Future hooks (do not build; do not preclude)

- **Time machine:** `graph.json` + component files are per-commit snapshots
  already; `diff()` exists; the scrubber replays them.
- **Runtime layer:** OpenTelemetry spans mapped onto symbol ids → observed
  call edges with counts/latency (an `observed_runtime` relation).
- **Agents as consumers:** `nputer arch` output today; an MCP/JSON query
  surface later so executors can ask "who depends on this" before editing.
- **Cross-repo edges:** package nodes are the seam (`p:*` ids).
- **Layer rules:** `layers.md` ordering → D6 violations → CI gate.
