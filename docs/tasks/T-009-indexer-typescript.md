---
id: T-009
title: Indexer crate — walk, hash, TypeScript/JS extraction
feature: F-06
milestone: 2
priority: 2
size: L
status: building
blocked_by: []
touches: [crate-index, app-shell]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Size L: planning pass COMPLETE (below; architect-approved 2026-08-15).

## Acceptance criteria
- WHEN run on a TS/JS repo THE indexer (app/src-tauri/crates/
  nputer-index, workspace member, no tauri dependency) SHALL emit
  graph.json per plan §3: files, symbols (with export flag + range),
  resolved import edges, package nodes, unresolved specifiers —
  volatile fields omitted (ADR-014).
- THE output SHALL be byte-identical across two consecutive runs on
  an unchanged tree (golden fixtures ts-basic, ts-paths-alias, mixed
  + a determinism property test).
- WHEN a tsconfig.json declares baseUrl/paths THE resolver SHALL
  honor them (nearest tsconfig up the tree).
- IF a specifier cannot be resolved THEN THE indexer SHALL record it
  in unresolved[] with a reason and continue — never drop, never
  fail the run.
- WHEN one file changes THE incremental path SHALL re-parse only that
  file (< 50 ms on this repo; < 500 ms cold; symbol budget sized so
  graph.json stays under the docs collector's 1 MiB cap, with the
  over-budget state visible in stats, never silent).
- Walking SHALL respect .gitignore via the ignore crate and inherit
  T-003's symlink/canonicalization containment rules for every path
  it reads (tested with an outside-tree symlink).

## Implementation plan (size-L planning pass — planner session claude-fable-5, 2026-08-15)

Drafted read-only by the planning session; the architect reviews this section, inserts it into docs/tasks/T-009-indexer-typescript.md, and commits it — nothing below is in effect until that commit.

Planning pass, not a debate room: no contested architectural fork remains (Rust-vs-TS split, committed-files, and delivery-over-the-docs-pipeline are ADR-013/014/015; sequencing is rooms/map-sequencing.md — the binary and Rust language support are milestone 4). This section settles every decision a fresh executor would otherwise guess. Spec of record: docs/design/map-technical-plan.md §3 + §5 **as revised by §0.0** (items 1, 2, 3, 5, 7 bind here); criteria above are unchanged. Repo facts cited below were verified against the working tree and crates.io on 2026-08-15.

**Frontmatter changes made by this pass:** `touches` gains `app-shell` — this task edits app/src-tauri/Cargo.toml (workspace introduction) and Cargo.lock, which are the app crate's build plumbing; the guardrail only works if touches tells the truth (T-004 precedent). `blocked_by` stays empty: nothing here needs T-008 (lib-parser, disjoint), and the crate has no dependency on anything unbuilt.

### 1. Workspace scaffolding (the Rust sibling of ADR-011)

app/src-tauri/Cargo.toml keeps its existing `[package]` (the tauri app stays the **root package**) and gains:

```toml
[workspace]
members = ["crates/nputer-index"]
default-members = [".", "crates/nputer-index"]
resolver = "2"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- **`cargo test` keeps working verbatim** for both crates: with `default-members` listing both, bare `cargo test` from app/src-tauri runs the app's tests and the new crate's (verified empirically in a scratch workspace during this pass — both suites run, no `--workspace` flag needed). CONVENTIONS' command stays `cargo test`; its description line gains "+ nputer-index" (executor drafts the one-line CONVENTIONS edit for the integrator, T-003 pattern).
- `resolver = "2"` stated explicitly (it's what the edition-2021 root implies; explicit beats inherited).
- **`[workspace.dependencies]` for serde/serde_json only** — both crates use them; centralizing prevents version skew. The app's `[dependencies]` entries for these two switch to `{ workspace = true }` (features preserved). Everything else stays per-crate: tauri/tauri-build/notify/dialog remain app-only; the new crate's deps stay local to it. No third-crate speculation.
- **Cargo.lock stays where it is** (app/src-tauri/Cargo.lock is the workspace lock); it grows by the new crates' subtrees, nothing existing changes. `target/` is shared automatically.
- **Zero tauri dependency in the new crate (ADR-015), and zero app-crate code diff**: the app does NOT depend on nputer-index in T-009 (that edge arrives with T-012's `index_repo`). Consequence the verifier can check mechanically: `cargo tree -p nputer-index` contains no tauri anywhere; `git diff` under app/src-tauri/src/, tauri.conf.json, capabilities/ is empty; app and parser npm suites are untouched.
- New crate manifest: `name = "nputer-index"` (lib target `nputer_index`), `edition = "2021"`, `publish = false`, description per ARCHITECTURE C-07. **No `[[bin]]`** — the binary is T-014's (milestone 4, per the sequencing room). No MSRV pinned (repo pins none anywhere; toolchain 1.95 in use).

### 2. Crate architecture

```
app/src-tauri/crates/nputer-index/
  src/lib.rs          public API + pipeline orchestration
  src/graph.rs        schema types (§3.1), id scheme, sort comparators
  src/walk.rs         ignore-crate walker + containment
  src/hash.rs         blake3 wrapper ("blake3:" + 64 lowercase hex)
  src/cache.rs        disposable parse cache (load/store/invalidate)
  src/parse.rs        tree-sitter setup, grammar-per-dialect selection
  src/extract/mod.rs  per-language extractor contract + shared types
  src/extract/ts.rs   TS/TSX/JS/JSX extractor (all four dialects)
  src/resolve/mod.rs  resolution driver + unresolved taxonomy
  src/resolve/ts.rs   relative/paths/bare resolution (§6 below)
  src/resolve/tsconfig.rs  nearest-tsconfig discovery + JSONC read
  src/emit.rs         stable serializer, size budget, write_graph
  src/error.rs        IndexError (hand-rolled Display, no thiserror)
  tests/…             see §8 (fixtures live under tests/fixtures/)
```

Public API (settles §5.5 with deviations recorded):

```rust
pub enum Lang { Ts, Js, Rust }   // Rust variant present, inert until T-010
pub struct IndexOptions {        // construct via ..Default (root required)
    pub root: PathBuf,
    pub cache_dir: Option<PathBuf>,   // None = no cache, always full parse
    pub languages: Vec<Lang>,         // default [Ts, Js]
    pub max_graph_bytes: usize,       // default 1_000_000 — see §7
}
pub fn index(opts: &IndexOptions) -> Result<Graph, IndexError>;
pub fn stable_json(graph: &Graph) -> String;              // used by write_graph + goldens
pub fn write_graph(graph: &Graph, path: &Path) -> Result<bool, IndexError>; // true = bytes changed
pub const GRAPH_REL_PATH: &str = "docs/architecture/graph.json"; // the seam T-012/T-014 share
```

Schema types (`Graph`, `FileEntry`, `Symbol`, `Package`, `Edge`, `Unresolved`, `Stats`) derive Clone/Debug/PartialEq/Serialize/Deserialize — Deserialize now so T-014's `--check` diff summary needs no schema work later. Deviations from §5.5, with reasons: **`diff()` is deferred to T-014** (its only consumer; byte-compare covers staleness until then; shipping it now is dead untested code). **`symbol_budget: usize` is replaced by `max_graph_bytes`** — the binding constraint is bytes (the docs collector's 1 MiB/file cap, §0.0 item 2); a symbol count was a proxy for it. **`heuristic_calls` is dropped** — heuristic call resolution is not built in T-009 (below), and a flag that can only be false misleads; it returns when someone builds the feature (post-T-013). Internal workspace crate: adding fields later is free.

Error taxonomy — errors are for "the run cannot mean anything", never for per-file trouble:

```rust
#[non_exhaustive]
pub enum IndexError {
    RootInvalid(PathBuf),   // missing / not a dir / canonicalize failed
    Grammar(&'static str),  // a tree-sitter language failed to load (fail fast, startup)
    Serialize(String),      // serde_json failure (structurally unreachable)
    Write { path: PathBuf, source: std::io::Error }, // write_graph target only
}
```

Per-file read failures, non-UTF-8, oversize, parse errors: skip or degrade per §3/§5 below, counted in `stats`, never a run failure (criterion: "never drop, never fail the run"). Cache errors degrade silently to uncached. No `unwrap`/`expect` on file-derived data anywhere (the crate will be pointed at arbitrary hostile repos); tree-sitter always yields a tree (error nodes included) — files with syntax errors still emit whatever extracts cleanly.

### 3. Walk + containment

`ignore::WalkBuilder` on the canonicalized root, configured **exactly** (each setting is a determinism or containment decision — the committed graph must be reproducible on any machine, so no machine-local ignore source may participate):

- `follow_links(false)`; plus T-003's belt-and-suspenders: any entry whose `symlink_metadata` is a symlink is skipped outright (file or dir), and every accepted file is `canonicalize`d and prefix-checked against the canonical root before read — anything escaping is dropped. Root itself: canonicalize first (a symlinked root anchors to its real path, T-003/T-007 pattern); refuse a root that is not a plain directory (`RootInvalid`).
- `hidden(false)` — tracked hidden dirs may hold real code; instead hard-skip, unconditionally and regardless of ignore files: `.git` and `node_modules` (via `filter_entry`). node_modules is never first-party map content, and this also keeps un-gitignored repos sane.
- `git_ignore(true)`, `require_git(false)` — .gitignore files inside the tree are honored even if the root isn't a git repo (deterministic on export/tarball copies).
- `git_global(false)`, `git_exclude(false)`, `parents(false)`, `ignore(false)` — machine-local sources (global gitignore, .git/info/exclude, ignore files above root, generic `.ignore`) are all OFF. The ignore input set is exactly: in-tree .gitignore + in-tree `.nputerignore` (`add_custom_ignore_filename(".nputerignore")`, gitignore syntax, any directory level, highest ignore-file precedence per the crate).
- **File-type allowlist**: `.ts .tsx .mts .cts` (Lang::Ts) and `.js .jsx` (Lang::Js) — the §5.1 list verbatim. `.mjs/.cjs` are deliberately excluded (not in the spec list; zero in this repo); an import of one lands in `unresolved[]` rather than vanishing. **`.rs` is NOT collected in T-009** — decision: deferred entirely to T-010 rather than collected-but-unparsed, because a `lang:"rust"` file entry with `symbols: []` is indistinguishable from an empty file and would put a false "rust" in `languages`; T-010 registers the extension + extractor as a purely additive diff. `Lang::Rust` exists in the enum now (schema stability) and simply maps to no extensions until then.
- **Root means**: `IndexOptions.root`, canonicalized — callers resolve it (the app's resolved project dir in T-012, `--root` in T-014); the crate takes no other path input, and no path from the walk ever leaves the root. Emitted `root` field is always `"."` and every path in the payload is root-relative POSIX (T-003's `relative_posix` pattern) — no absolute paths, no machine identity in the output.
- Non-UTF-8 or unreadable files, and files over a 4 MiB per-file parse cap (availability control against pathological repos): skipped entirely, counted in `stats.skipped` (omitted when 0) — visible, never silent (the §3.2 never-drop rule is about the budget path, which keeps entries; mechanical unreadability is counted instead).
- Walk order is not trusted: results collected then sorted (§7).

**This repo's dogfood ignore file**: T-009 commits a root `.nputerignore` containing `docs/` — docs/ is the brain, not the codebase (its one .js design-handoff artifact must not become permanent unmapped-drift noise on the map). Deliberately NOT hard-coded in the crate: other repos may keep code wherever they like; the convention repo expresses its own layout as config.

### 4. Hash + incremental cache

- **blake3** over raw file bytes; `hash` field = `"blake3:<64 hex>"`. `loc` = `content.lines().count()`.
- **Cache location**: `<cache_dir>/<blake3(canonical root string)[..16]>.json` — one JSON file per indexed root (serde_json; no new dep, ~sub-ms at this scale). Caller supplies `cache_dir` (§5.5): the app will pass its app-data dir (T-012), the binary an XDG cache dir (T-014); `None` = no cache. The crate never invents a location — it has no tauri and no home-dir logic.
- **Content**: `{ cache_schema: u32, indexer_version: CARGO_PKG_VERSION, files: { path → { hash, extract: ExtractRecord } } }` where ExtractRecord is the per-file **pre-resolution** extraction output (symbols + import specifiers + call/type_ref candidates). Resolution is global and always re-runs (cross-file by nature, and cheap — in-memory over the walked set).
- **Invalidation**: `cache_schema` or `indexer_version` mismatch → discard whole cache. Per-file: walk defines the live file set; entries for files not in the walk are dropped; hash mismatch → re-parse that file only. Written atomically (temp file + rename, same dir). **Disposable by contract** (ADR-014: committed graph.json is the truth): deleting it must only cost a full re-parse — pinned by the cold-vs-warm byte-equality test (§8), which is also what makes T-014's concurrent-writers case safe later.
- **First run**: walk → hash+read all → parse all → resolve → emit; cache written at end. **Incremental**: walk → hash all (the invalidation check is the hashing) → parse changed only → resolve all → emit → compare bytes → write only if changed.
- **<50 ms budget arithmetic on this repo** (~47 TS/JS files, ~289 KB total source): walk ~5–10 ms, read+hash ~2 ms, parse 1 changed file ~2–5 ms, resolve <1 ms, serialize ~150 KB ~2 ms — ~20–30 ms in a release build, with walk dominating. The <500 ms cold budget is equally comfortable (~47 parses ≈ 100–250 ms). Both budgets are **measured on release builds** (tree-sitter's C grammars at `-O0` are several times slower; debug-profile numbers are not the criterion) — protocol in §8. **No rayon**: budgets are met single-threaded at this scale; the parse loop is embarrassingly parallel if a 10k-file repo ever demands it (that §5.4 allowance is not a T-009 criterion), and dropping the dep shrinks the verifier's review surface.

### 5. Parse + extract (tree-sitter)

**Dependencies to pin — exact `=` versions** (verified current + mutually compatible on crates.io today; grammar crates depend only on `tree-sitter-language ^0.1`, the ABI shim, so they are core-version independent):

| crate | pin | why |
|---|---|---|
| tree-sitter | =0.26.12 | core; `Language::from(LANGUAGE_*)` via the shim |
| tree-sitter-typescript | =0.23.2 | TYPESCRIPT + TSX grammars in one crate |
| tree-sitter-javascript | =0.25.0 | JS incl. JSX |
| ignore | =0.4.33 | walker (ripgrep's, the §5.1 named choice) |
| blake3 | =1.8.6 | hashing |
| jsonc-parser | =0.33.1 | tsconfig read; zero mandatory deps (verified); comments + trailing commas — **required**: app/tsconfig.json contains `/* … */` comments today |

serde/serde_json ride the workspace. Exact pins because grammar crates compile vendored C via `cc` build scripts — the single biggest supply-chain surface this task adds; the verifier reviews these trees at these versions and the pins keep the review binding (Cargo.lock checksums from crates.io). If the trio fails to compile together at exactly these versions, the executor stops and consults (do not silently float versions).

**Grammar selection**: `.ts/.mts/.cts` → TYPESCRIPT; `.tsx` → TSX; `.js/.jsx` → JAVASCRIPT (its grammar includes JSX). Languages loaded once at `index()` start; failure → `IndexError::Grammar` (fail fast, not per file).

**Extraction = hand-rolled cursor traversal, no .scm queries** — module-level-only extraction is a walk over `program`'s direct children plus one recursive candidate scan; three dialect query files plus depth-filtering of query matches would be more machinery for the same output. One extractor (extract/ts.rs) serves all four dialects; grammar node-kind differences are handled in one match table.

**Per-language extractor contract** (the trait T-010 implements for Rust): given source + lang, produce `ExtractRecord`:

- **Symbols** — module-scope declarations only: `function` (incl. `export default function`), `class`, `interface`, `type` (alias), `enum`, and module-scope `const`/`let`/`var` bindings (all three → kind `const`; the §3.1 kind vocabulary is closed and the map doesn't care about mutability). `exported` = declaration modifier, membership in any `export { … }` list, or default export. `range` = declaration node rows, 1-based inclusive (`[start, end]`, tree-sitter row + 1). Symbol id `s:<path>#<name>`. **Same-name module-level declarations merge into one symbol** (TS declaration merging — interface+const, namespace merging): kind = earliest declaration's (tie: kind name asc), `exported` = any, range = [min start, max end]. Merging makes names unique per file, so symbol ids never collide by construction. (Id grammar note for consumers, documented in graph.rs: paths may legally contain `#`; split `s:` ids on the LAST `#`.)
- **Import specifiers** — with imported names: static `import`, `export … from` / `export * from` (recorded as import edges with `reexport: true` — mirrors the plan's Rust `pub use` rule), string-literal `require(…)` and string-literal dynamic `import(…)` (non-literal arguments: not extracted, listed under not-extracted). Imported-name conventions on the edge's `symbols`: named imports as written (the source name, not the local alias), default import → `"default"`, namespace `* as ns` → `"*"`, side-effect import → no `symbols` field.
- **call/type_ref candidates**, minimally scoped: bare-identifier calls `f(…)` and `new F(…)` (call), and type-position identifiers (type_ref). Emission is gated by the resolved-confidence rule in §6 — only names that bind are emitted, always `confidence: "resolved"` (the only value T-009 writes; the field appears on call/type_ref edges per §3.1, never on imports). Member-access calls (`obj.m()`), namespace-qualified types (`ns.T`), and heuristic unique-name matching across the repo: **not built** (the §5.1 heuristic path is explicitly out; T2's consumer is T-013, milestone 4).

**Explicitly NOT extracted in v1** (so the verifier knows silence is by design): class/interface members and methods, nested/inner functions, local variables, decorators, JSX component-usage edges, re-exported names as symbol entries (edge-only — they have no local declaration range), non-literal require/import() arguments, triple-slash reference directives, `declare global` innards.

### 6. Resolve (TS/JS)

Resolution is a **pure function of the walked file set + tsconfig data + package.json data** — it never probes the filesystem (determinism; containment; speed). A specifier that would resolve to an unwalked on-disk file is honestly `unresolved` (see taxonomy).

Pipeline per specifier, from importing file F:

1. **Normalize**: strip a `?query` suffix (vite convention) before classification. Specifiers that are absolute paths or URL-schemed (`http:`, `https:`, `data:`) → `unresolved(unsupported)`.
2. **Asset gate**: if the (post-query) extension is in the closed asset list (css scss sass less json svg png jpg jpeg gif webp ico woff woff2 ttf otf mp3 mp4 wasm txt md) → `unresolved(asset)`. This keeps side-effect style imports (`import "./index.css"`) out of `not_found` — a healthy repo's unresolved list should carry no false alarms.
3. **Relative specifiers** (`./`, `../`): resolve against F's dir; candidate order below. Relative specifiers never consult `paths` (TS semantics). A candidate path that normalizes outside the root → `unresolved(outside_root)` — containment holds symbolically too.
4. **Non-relative**: nearest `tsconfig.json` up the tree from F (exact filename only — `tsconfig.node.json` etc. never participate; stop at root; per-directory result memoized). If it has `paths`: exact (starless) patterns beat single-`*` patterns; among `*` patterns the longest matched prefix wins; each substitution target tried in array order through the relative machinery, rooted at `baseUrl` (or the tsconfig's own dir when `baseUrl` is absent — TS 5 rule). All targets miss → fall through (TS behavior). Then plain `baseUrl` lookup if set. Then:
5. **Bare specifier → package node**: name = `@scope/name` (two segments) when scoped, else first segment; subpath dropped for identity (`react-dom/client` → `p:react-dom`); `ecosystem: "npm"`. `node:`-prefixed → name kept verbatim (`node:fs`), `ecosystem: "node"` (small honest extension of §3.1's vocabulary; this repo imports node:fs/node:path today). Package edges carry `symbols` like file edges.
6. **The file:-dep case — DECIDED: package-node it, with a `path`.** For a bare specifier, the nearest package.json up from F is consulted; if the dependency's version spec is `file:`/`link:`, the target is normalized against that package.json's dir and, when it lands inside the root, the package node gains `"path": "<repo-relative>"` — here: `{ "id": "p:@nputer/parser", "name": "@nputer/parser", "ecosystem": "npm", "path": "lib/parser" }`. Justification against the map's purpose: resolving *through* app/node_modules/@nputer/parser → ../../lib/parser to source files would (a) require following exactly the symlinks the containment rules forbid — whereas package.json's `file:../lib/parser` names the target declaratively, no link traversal — and (b) assert file-level edges the runtime doesn't have: the app imports the package's **built dist/** (gitignored, unwalked), and mapping `dist/pure.js` back to `src/pure.ts` is build-config guesswork. The package node with a repo-internal `path` states reality exactly, deterministically, and gives T-011's derivation the one join it needs (package.path ∩ component globs) to materialize the observed C-05→C-06 edge at component level. Seam note for the record: until T-011 consumes `path`, that edge renders as declared-unrealized ("planned") — mild, visible, honest; it must never render as drift (drift is observed-undeclared). Outside-root `file:` targets get no `path` (plain external package). npm `workspace:` protocol: not handled (no workspaces here; noted silence).
7. **Relative candidate order** (also used for paths/baseUrl targets): specifier ends `.js/.jsx` → try source substitution FIRST — `.js`→[.ts, .tsx], `.jsx`→[.tsx] — then as-written (TS NodeNext semantics; **load-bearing for the dogfood**: lib/parser imports `./types.js` meaning types.ts throughout). Ends `.mjs`→[.mts], `.cjs`→[.cts], then as-written. Ends `.ts/.tsx/.mts/.cts` → as-written only (app sets allowImportingTsExtensions). No recognized extension → append, in order: `.ts .tsx .js .jsx .mts .cts` (the §5.1 list verbatim), then `.d.ts`; then directory index: `<spec>/index` + the same extension order, `.d.ts` last. The ".d.ts preferred only if no source sibling" rule is thereby positional, not special-cased. Matching is byte-exact against the walked set (deterministic on case-insensitive filesystems, because the set — not the fs — answers).
8. **Unresolved taxonomy** (closed, snake_case): `not_found` (all candidates missed the walked set — includes imports of unwalked-extension files like `.mjs`), `outside_root`, `unsupported` (absolute/URL/data specifiers), `asset`. Sorted by (from, specifier, reason); never dropped, never fatal. tsconfig files that fail even JSONC parsing are treated as absent (resolution proceeds without paths; any alias miss surfaces loudly as `not_found`) — accepted v1 silence, no schema slot for config warnings; T-014's report is the future home.

Edge assembly: file→file `import` edges from resolved specifiers, `symbols` = sorted union across statements; dedupe key (from, to, kind); `reexport: true` survives dedupe only if ALL merged occurrences are re-exports (a plain import subsumes: the file genuinely imports it). call/type_ref edges emitted only when the candidate name binds to (a) a module-level symbol of F, or (b) a named import whose specifier resolved to a walked file and whose target file declares that exported name — `s:`→`s:` with `confidence: "resolved"`; otherwise no edge.

### 7. Emit + determinism + the size budget

- **Serializer**: serde_json `PrettyFormatter` with 2-space indent + trailing `\n`, LF only. Key order = struct declaration order matching §3.1's layout exactly (`schema, root, languages, files, packages, edges, unresolved, stats`; file: `id, path, lang, hash, loc, symbols`; symbol: `id, name, kind, exported, range`; package: `id, name, ecosystem, path?`; edge: `from, to, kind, symbols?, reexport?, confidence?`; unresolved: `from, specifier, reason`). This reads ADR-014's "sorted keys" as its purpose — a byte-stable, diffable order — rather than alphabetization, which would scramble the schema's id-first readability; byte-identity is the tested contract. Optional fields are omitted (not null) when absent/empty/false.
- **Sorted arrays** (byte-lexicographic String Ord, locale-free): files by path; symbols by name (unique per file post-merge); packages by id; edges by (from, to, kind); unresolved by (from, specifier, reason); languages lexicographic; edge symbol lists sorted unique.
- **Volatile fields OMITTED** (ADR-014, §0.0 item 5): no `commit`, no `index_ms`, no timestamps, no absolute paths, no cache identity. `root` is always `"."`. `stats` carries only content-determined values: `{ files, symbols, edges }` + optional `truncated_symbols: true`, `truncated_files: n`, `skipped: n`.
- **Determinism kill-list** (each is a test or a structural rule): fs walk order (sort after collect), HashMap iteration (BTreeMap or sort-at-emit only), parallelism (none), path separators (POSIX always), machine-local ignore sources (§3 config), cache state (cold-vs-warm byte equality is a pinned property), checkout location (no absolute paths ⇒ goldens are relocation-independent — tested).
- **`write_graph`**: serialize, read existing file, byte-compare, skip write when equal (return false), else atomic temp+rename write (return true). The no-op-on-equal is **load-bearing for T-012's delivery loop**: graph.json lives inside the watched docs/ tree, so an in-app index-on-change would otherwise emit a docs-changed snapshot for its own unchanged output; byte-identical determinism + write-only-if-changed is what terminates that loop. Pinned by test now, relied on later.
- **Ids** (§3.1): `f:<path>`, `s:<path>#<name>`, `p:<package>` — content-free, diff-stable.
- **Size budget, numbers**: `max_graph_bytes` default **1_000_000** — 48,576 bytes of headroom under the docs collector's hard `MAX_FILE_BYTES = 1_048_576` (docs_watch.rs), because a graph that lands exactly at the cap is one edit from silently vanishing out of the snapshot. Mechanics: serialize; if over budget, compute each file's serialized symbol-block cost from that pass, then drop symbol arrays (`symbols: []`) greedily from the largest symbol-block downward (tie: path asc) until the projected size fits; re-serialize; set `stats.truncated_symbols: true` + `stats.truncated_files: n`; also drop call/type_ref edges referencing dropped symbols (no dangling `s:` ids — this dependent drop is part of the defined degraded state, and import edges are file-level so drift derivation is never affected). Floor: all-files-truncated yet still over budget (files+edges alone; back-of-envelope ~2.5–3k files at ~300 B/file entry + ~200 B/edge pretty-printed) → emit the valid over-budget graph anyway with the flag set — never drop files or edges (§3.2); delivery then visibly degrades at the collector (its skip behavior, T-003-s3 territory), and paginated/summary formats are a post-v1 problem, room-worthy if a real repo hits it. **Expected on this repo**: ~46 files, ~200 import edges, a few hundred symbols ≈ 120–200 KB — the executor records the measured byte size in implementation notes.
- **This repo's graph.json is a T-009 deliverable**: the executor generates and commits docs/architecture/graph.json (TS/JS-only until T-010 regenerates it richer) — T-011's dogfood fixture needs it, and committing it makes this task's determinism claim concretely re-checkable by the verifier (regenerate → byte-identical). Generation runs through the test harness (below), since there is no binary yet.

### 8. Fixtures + tests

Location: `crates/nputer-index/tests/fixtures/<name>/`, goldens as `expected-graph.json` beside each fixture, compared as **bytes** (string equality, not JSON equality).

**Materialization rule**: tests copy each fixture to a temp tree first, renaming `_gitignore` → `.gitignore`, `_nputerignore` → `.nputerignore`, `_node_modules/` → `node_modules/` at copy time. Reason: committed dotted forms would really apply — the repo's root gitignore already ignores `node_modules/` and a fixture's own .gitignore would hide fixture files from git itself, breaking fresh clones. No symlinks are ever committed in fixtures (Windows checkout hazard); symlink tests build theirs at runtime (T-003's TempTree pattern, unix-gated). Add `tests/fixtures/.gitattributes` with `* -text` so fixture bytes (and therefore blake3 hashes in goldens) survive any autocrlf setting.

- **ts-basic**: relative imports (exact / extensionless / `/index`), default + named + namespace + side-effect imports, `export … from` and `export * from` (reexport flag), `export default function`, const arrow component, declaration merging (interface + const same name), `.d.ts` alongside source sibling (preference) and `.d.ts`-only, string-literal `require` and dynamic `import()`, non-literal `import(x)` (not extracted), bare npm + scoped `@scope/pkg` + subpath `pkg/sub`, `node:fs`, a css side-effect import (`asset`), a missing relative (`not_found`), a `../../escape` (`outside_root`), one `.tsx`, one `.jsx`, one `.js`, one `.mts`, one `.cts`. Golden committed.
- **ts-paths-alias**: tsconfig **with JSONC comments and a trailing comma** (the live app tsconfig has comments — this is dogfood-shaped), `baseUrl` + `paths` (`@/*` → `./src/*`, an exact starless alias, a multi-target array with first-miss-second-hit), a nested second tsconfig in a subdir proving nearest-wins, a paths-without-baseUrl case, an alias whose targets all miss (falls through to `not_found`), plus `.js`-specifier → `.ts` substitution (the lib/parser NodeNext pattern). Golden committed.
- **mixed**: TS/TSX/JS/JSX importing across dialects, a `file:` dep package.json pair exercising the `path` field (in-root) and a `file:` pointing outside root (no path), `.rs` files present on disk proving non-collection, `_node_modules` with a decoy package proving the unconditional skip, `_gitignore`d and `_nputerignore`d files proving both sources, a hidden (dot-)directory with a real .ts proving `hidden(false)`. Golden committed.
- **Determinism property tests**: per fixture — index twice → identical bytes; cold-cache vs warm-cache → identical bytes; two materializations at different temp paths → identical bytes. Plus a live self-check in the default suite: index THIS repo twice in-memory (no golden, no write) → identical bytes.
- **Resolution edge-case table**: table-driven unit tests in resolve/ (target ~25 rows: every candidate-order rule, paths precedence pairs, scoped/subpath/node:/asset/unsupported/outside_root, dedupe + reexport-survival, query-suffix strip).
- **Extractor units**: symbol kinds/exported/range/merging, import-name conventions, candidate gating (~15 cases). **tsconfig units**: JSONC tolerance, nearest-up memoization, absent-baseUrl rooting (~8). **Cache units**: schema/version invalidation, per-file re-parse selection, dropped-entry on delete, corrupt cache file → full parse (~6). **Emit/budget units**: optional-field omission, budget truncation determinism + dependent-edge drop + stats flags, write_graph no-op-on-equal + atomic write (~6).
- **Containment tests** (runtime scratch trees, unix-gated like T-003): outside-tree file symlink and dir symlink under a walked root → absent from graph, secret content never appears; symlinked root → canonicalized anchor; the criterion's "tested with an outside-tree symlink" lands here.
- **Perf harness**: `#[ignore]`d test, run explicitly as `cargo test --release -p nputer-index -- --ignored perf`: cold index of this repo and warm-cache single-file re-index, 5 trials each, printing measured max; asserts only generous 3× ceilings (1500 ms / 150 ms) so CI never flakes while order-of-magnitude regressions still fail. The real <500 ms / <50 ms criterion numbers are demonstrated by the executor on release builds and recorded in implementation notes, T-003-style (measured, machine-stated, trial-listed).
- **Self-graph tests**: `#[ignore]`d `self_graph_is_current` — regenerates this repo's graph and byte-compares against the committed docs/architecture/graph.json (the manual `--check` stand-in until T-014; root located manifest-relative, four levels up). With `NPUTER_UPDATE_GOLDEN=1`, this test (and the fixture goldens) rewrite their expected files — the mechanism by which the committed graph.json is produced in the first place. Ignored-by-default deliberately: the default `cargo test` must stay hermetic to unrelated TS edits (a T-011 builder touching app/src must not go red in src-tauri) and must never dirty the working tree.

Estimated suite growth: ~75–90 new Rust tests; cargo test rises from 20 to ~95+; parser (78) and app (94 + build) suites untouched by construction.

### 9. Out-of-scope fence (do not build)

- **No Rust-language extraction** — T-010 (milestone 4). No `.rs` collection either (decided §3).
- **No binary, no watch/check/CLI modes** — T-014 (milestone 4). The `#[ignore]`d self-graph test is the interim staleness check, not a check mode.
- **No derivation, mapping, globs, or component logic** — T-011 (TS, ADR-015). The crate never reads component files.
- **No Tauri command, no app wiring, no docs_watch.rs changes** — DECIDED: `index_repo()` ships with T-012 (it is one thin zero-argument command over this crate's API, worthless without the map pane consuming it, and T-012 already owns app-shell touches). Likewise the docs collector's `.json`-under-docs/architecture extension (§0.0 item 2) is T-012's app-shell work — T-009's obligation to that seam is only: graph.json at `GRAPH_REL_PATH`, under the cap, byte-stable.
- No heuristic call resolution, no rayon, no `diff()`, no layout/watch files, no schema fields beyond those listed in §7.

### 10. Dispatch note

Dispatch with explicit @human word (size L, per current STATE next-up). Runs disjoint from T-008 (lib-parser) — but this pass adds `app-shell` to touches (Cargo.toml/lock), so do not parallelize with any app-shell task. T-009 unblocks T-011 (with T-008) and, transitively, the milestone-2 slice's remaining chain (T-012); it also unblocks milestone-4 T-010/T-014.

**Executor reads**: this file top to bottom; map-technical-plan §3, §5, §0.0; ADR-013/014/015; T-003's implementation notes (the containment idiom being inherited); CONVENTIONS; ARCHITECTURE's C-07 row. **Expected diff surface, exhaustively**: `app/src-tauri/Cargo.toml` (workspace + workspace-dep switch), `app/src-tauri/Cargo.lock` (additions), `app/src-tauri/crates/nputer-index/**` (new), `docs/architecture/graph.json` (new, generated), `.nputerignore` (new, root), `docs/CONVENTIONS.md` (one-line cargo test note), this task file (notes). Zero diff anywhere else — app/src-tauri/src/, tauri.conf.json, capabilities/, app/src/**, lib/parser/**, package locks.

**Verifier's likely attack surface, flagged now**: (1) dependency review — four new direct crates plus `cc`/`tree-sitter-language` transitives, vendored C compiled by grammar build scripts; exact `=` pins are the contract, checksums from crates.io, `cargo tree -p nputer-index` shows no tauri; (2) determinism — regenerate the committed graph.json and fixture goldens from a clean checkout, byte-compare; rerun-with-warm-cache; confirm no machine-local ignore source can influence output (probe with a hostile global gitignore); (3) containment — symlink escape attempts against a live walk, `outside_root` specifier handling, no fs probing in resolve; (4) budget honesty — force truncation on a fixture, confirm flags + no dangling ids + never-dropped files; (5) hermeticity — default `cargo test` leaves the working tree clean and stays green after unrelated TS edits; (6) hostile-repo availability — non-UTF-8, >4 MiB, syntax-error, and BOM files skip/degrade with counts, no panic, no hang.

**Genuine silences, left open deliberately**: tsconfig `extends` chains are not followed (no dogfood need; a miss surfaces loudly as `not_found` — revisit when a real repo hits it); tsconfig parse failures have no schema slot (T-014's report is the future home); `.mjs/.cjs` and npm `workspace:` protocol excluded (spec-listed set; zero occurrences here); Windows path/casing behavior is defined (POSIX ids, set-matching) but has no CI lane (T-001-s3's Linux gap applies here too); per-file parse-error visibility (`parse_errors` flag per file) has no schema slot in v1.

## Implementation notes

## Verdicts
