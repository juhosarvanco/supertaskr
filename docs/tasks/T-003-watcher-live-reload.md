---
id: T-003
title: Docs watcher + live reload
feature: F-02
milestone: 1
priority: 3
size: M
status: verifying
blocked_by: [T-001, T-002]
touches: [app-shell, lib-parser]
builder: claude-fable-5
verifier:
built_by: "claude-fable-5 @fresh"
verified_by:
review:
---

## Acceptance criteria
- WHEN any file under docs/ changes on disk THE system SHALL re-parse
  and push the updated model to the frontend within 1 second.
- WHILE the watcher is running THE system SHALL survive rapid
  successive writes (editor save bursts) without crashing or
  duplicating events (debounce).
- IF a changed file fails to parse THEN THE system SHALL keep showing
  the last valid state and surface a non-blocking parse-error badge.

## Implementation notes

Executor claude-fable-5, 2026-08-14, branch `t003-watcher-live-reload`.

### What was built
Live-reload pipeline, parsing where TypeScript runs (the webview), Rust
as a dumb contained file shipper — the app stays a pure lens:

- **Rust watcher** (`app/src-tauri/src/docs_watch.rs`): notify-based
  debounced watcher (250ms, `notify-debouncer-mini`) over
  `<project>/docs`, spawned at setup. Every surviving batch collects a
  full snapshot of the docs tree (`.md` files, recursive, sorted,
  project-relative POSIX paths) and emits ONE `docs-changed` event.
  Full-state pushes make create/rename/delete race-free by construction
  (the frontend converges on disk truth; no per-file event bookkeeping).
  Identical-content snapshots are suppressed (byte equality against the
  previous emit), so event storms that settle on the same bytes push
  nothing. Caps: 1 MiB/file, 2000 files, depth 16 — a pathological repo
  cannot balloon the IPC payload.
- **Snapshot command** (`docs_snapshot` in `lib.rs`): the frontend's one
  pull at startup; same payload shape, same shared `AtomicU64` seq
  counter as the watcher (managed `WatchState`, the minimal internal
  equivalent of suggestion T-001-s1 — which stays open; no override
  handling, no standalone `get_project_dir`).
- **Parser pure entry** (`lib/parser/src/files.ts`, `src/pure.ts`, new
  `./pure` subpath export): the root entry re-exports project.ts
  (`node:fs`) and cannot load in a browser bundle, so the webview
  imports `@nputer/parser/pure`. New pure export
  `parseProjectFromFiles(files, {tasksDir?, roadmapFile?})` assembles a
  `ProjectParseResult` from in-memory `{path, content}` pairs, mirroring
  parseProject exactly (same filename filter, deterministic path order,
  identical duplicate-id message, missing roadmap -> io-error issue);
  plus helper `isTaskFilePath`. Root entry unchanged for node consumers;
  disk layer untouched. Deep-equal mirror tests pin the equivalence.
- **Frontend store** (`app/src/lib/docs-model.ts` pure reducer +
  `app/src/lib/watcher-store.ts` Tauri glue): state =
  `{seq, projectDir, lastGood: Map, model, failures}` via
  `useSyncExternalStore`. `applySnapshot` drops stale/duplicate seqs by
  identity (no re-render, no echo), tracks per-path last-good content,
  and substitutes it when a file's current content hard-fails (task
  file: no record established; roadmap: zero features AND >=1 issue) —
  soft issues on a parsable record are NOT failures (flagging, not
  hiding). Deletions drop records (not failures). After each applied
  snapshot the store emits a `model-updated` echo event with counts,
  which Rust logs — making the change->parsed-model round trip
  observable on stdout (that is the measurement channel below).
- **UI** (`App.tsx`): minimal model panel (project dir, counts line,
  task rows) + the criterion-3 badge: an inline header chip
  (`N parse error(s)`, existing `--destructive` token, tooltip with the
  parser message) plus a compact details strip noting
  "(showing last valid state)". Non-blocking: content renders normally
  beneath. No new tokens needed; no arbitrary values (checked).
- **Tests added**: parser `test/files.test.ts` (11 — incl. deep-equal
  mirrors against parseProject on the disk fixtures, ADR-009 hostile
  paths); app `test/docs-model.test.ts` (13, pure reducer: last-good
  retention/recovery, never-good, roadmap fail, deletion, stale-seq
  identity, soft-issue non-failure, proto paths) run by a minimal
  vitest setup (`vitest.config.ts`, node env, no jsdom — justification:
  parser already standardizes vitest, and criterion 3's logic lives in
  a DOM-free reducer precisely so it is unit-testable); Rust
  `docs_watch::tests` (7: recursive collect/sort/relative paths,
  missing docs, oversize skip, symlink never followed incl. escape
  attempt, snapshot equality, seq monotonicity, log sanitizer).

### Wiring choice (app -> parser) + rationale
`"@nputer/parser": "file:../lib/parser"` in app/package.json (npm
symlinks it; lockfile records the link). Chosen over the root npm
workspace ARCHITECTURE anticipated because it keeps both packages'
CONVENTIONS commands valid verbatim (`npm ci` per package still works —
npm does not walk up from workspace member dirs, so a root workspace
would have silently broken them) and the diff minimal. Cost: app builds
need `lib/parser` built first (clear TS2307 if missing), and vite needs
`server.fs.allow` for the symlink real path (added). Root workspace
remains the right move when a third package or CI wants single-install;
that switch is integrator/ADR territory, not this task's need —
flagging it as possibly ADR-worthy rather than deciding it here.

### New IPC surface + containment story (ADR-010)
- CSP: **unchanged** (invoke/events ride the already-admitted
  `connect-src ipc: http://ipc.localhost`; zero config diff — verify
  `git diff` on tauri.conf.json/capabilities is empty).
- Capabilities: **unchanged**, `core:default` only. Empirical fact for
  future tasks: app-defined commands need no capability entries in
  Tauri v2 (the ACL governs plugin/core namespaces) — `docs_snapshot`
  invoked successfully under bare `core:default`; narrowness therefore
  lives in the command itself:
- `docs_snapshot` command: takes NO arguments; reads only
  `<resolved project>/docs`; symlinks (file or dir) skipped outright
  via `symlink_metadata` BEFORE any read; every file additionally
  canonicalized and prefix-checked against the canonicalized project
  dir; docs/ itself refused if a symlink; non-UTF-8/oversized skipped.
  The webview cannot request arbitrary paths — contained by
  construction, tested (`symlinks_are_never_followed` exercises an
  outside-tree exfiltration attempt).
- `docs-changed` (Rust -> webview): pushes docs file contents — data
  already destined for rendering; same containment as above.
- `model-updated` (webview -> Rust): Rust only `println!`s it, after
  control-character escaping + 800-char truncation
  (`sanitize_for_log`), so repo-derived strings cannot smuggle
  terminal escapes or flood stdout. No parsing, no action taken on it —
  a compromised webview gains one sanitized log line, nothing else.
- Untrusted content rendering: React text nodes only — zero
  `dangerouslySetInnerHTML`/eval in the diff (grepped).
- ADR-009 sweep of own diff: every collection keyed by file-derived
  strings is a `Map`/`Set` (files.ts, docs-model.ts, docs_watch.rs uses
  Vec+sort); no computed-key writes to plain objects.

### Verification per criterion (macOS 15/Darwin 25.6, node 22.22.0, rustc 1.95.0)
Suites first: lib/parser `npm ci` + `npx vitest run` -> **78/78**
(67 pre-existing + 11 new) + `npx tsc --noEmit` clean + `npm run build`
clean. app `npm run build` (tsc + vite) exit 0; `npm test` -> **13/13**;
`cargo test` in src-tauri -> **7/7**.

Live protocol: scratch project = `git init` + full copy of this repo's
docs/ (35 .md files) in a temp dir; vite dev (`npm run dev`) serving;
`app/src-tauri/target/debug/nputer` launched with cwd = scratch root
(debug binary loads the dev URL; project resolution via .git walk-up
correctly picked the scratch repo — startup log
`[nputer] project folder: <scratch>` + `watch: watching <scratch>/docs
(debounce 250ms)`). Frontend pulled snapshot seq=1 and echoed
`taskCount:13 featureCount:5 issueCount:0` — the copied live tree
parses clean end-to-end. Same boot then repeated with the canonical
`npm run tauri dev` in app/ against the worktree itself: both `[nputer]`
startup lines, watcher line, seq=1 echo with the same counts.

1. **<=1s change->model**: 5 timed trials (python appends a line to
   `docs/tasks/T-005-*.md`, recording wall-clock ms just after write;
   3s apart). Stdout chain per trial:
   `docs-changed: seq=N ... at_ms=<emit>` then
   `model-updated: recv_at_ms=<recv> payload={"appliedAtMs":<applied>...}`.
   Deltas write->appliedAtMs (model committed in frontend):
   **395 / 308 / 295 / 287 / 296 ms — max 395ms**, dominated by the
   250ms debounce window; emit->applied (IPC + parse + commit) was
   28–44ms on a 35-file tree. PASS with 600ms headroom.
2. **Save bursts, no crash, no duplicates**: scripted burst of **61
   writes in 854ms** — 30 append saves 10ms apart to one file, 10
   atomic editor-style saves (`write tmp + os.replace`), 20 interleaved
   writes across 5 files, ending by creating a new task file T-950 as a
   content sentinel. Result: **4** `docs-changed` pushes (seq 7–10),
   each echoed as applied **exactly once** (no seq applied twice — the
   store's identity guard additionally pins this in unit tests), one
   trailing `6 fs event(s) coalesced, content unchanged - suppressed`
   line (the rename-churn residue correctly suppressed by byte
   equality), final echo `taskCount:14` with `T-950` present (final
   disk state landed), process alive (pgrep), and a follow-up single
   edit (seq=12) round-tripped normally. PASS.
3. **Parse failure -> last valid state + badge**: stdout half —
   breaking T-950's frontmatter (never-closed `---`) produced seq=13
   echo `parseFailures:["docs/tasks/T-950-burst-sentinel.md"]` with
   `taskCount` **still 14**, `T-950` still listed, `issueCount:0`
   (failing content's issues do NOT leak into the model); an edit to a
   DIFFERENT file while broken (seq=14) updated the model with the
   failure persisting (one broken file never blocks the rest); fixing
   it (seq=15) cleared `parseFailures`; a brand-new never-parsable
   T-951 (seq=16) was flagged with `taskCount` unchanged and its
   issues surfacing (`issueCount:1`, nothing valid to show instead);
   deleting it (seq=17) cleared everything. DOM half (same bundle
   served by the same vite dev server to a plain browser, where the
   store exposes a DEV-only harness — T-001's same-bundle precedent):
   applying a good-then-broken payload pair showed the badge chip
   (`1 parse error`, `--destructive` border/text, tooltip = parser
   message), the details strip with "(showing last valid state)", and
   the task row STILL rendering the last-good title — not the broken
   content; a stale-seq payload was fully ignored (no render, no
   echo); the fixed payload cleared the badge and rendered the new
   title. Screenshot taken: header chip + details strip + intact
   2-task list, nothing obscured. The harness is compiled out of
   production bundles (grep of built assets: 0 hits for
   `__nputerDocsHarness`; `model-updated` echo present). PASS.

Reproduce quickly: build parser (`cd lib/parser && npm ci && npm run
build`), `cd app && npm install && npm run build && npm test`,
`cd src-tauri && cargo test`; live: `npm run dev` in app/, then run
`src-tauri/target/debug/nputer` (built by `cargo build`) with cwd set
to any git repo containing a docs/ tree, watch stdout, edit files.
`npm run tauri dev` does the same against this repo.

### Dependency justifications (verifier checks additions)
- Rust `notify-debouncer-mini 0.7` (+ `notify 8.2` transitive):
  the debounce criterion's core; small purpose-built companion of the
  de-facto standard fs-watch crate, both crates.io. Hand-rolling
  debounce was the alternative — rejected: upstream's is tested and
  the task's added logic (equality suppression, seq ordering) stays
  ours and unit-tested.
- npm `vitest` (app devDep): minimal JS runner for the reducer tests;
  same runner the parser already uses, zero config beyond a 10-line
  vitest.config.ts. No jsdom, no other additions.
- npm `@nputer/parser` (file: link): the wiring itself.

### Build/test command changes (for the integrator -> CONVENTIONS)
- lib/parser: unchanged, but **app builds now require parser dist**:
  run `npm run build` in lib/parser before app `npm install`/build
  (fresh clones; the file: symlink resolves `yaml` via the parser's own
  node_modules, so parser `npm ci` must have run too).
- app/: `npm test` now exists (vitest, 13 tests) and belongs in the
  suite next to `npm run build`; `cargo test` in app/src-tauri now
  runs 7 real tests and belongs in the suite as well.

### Flags for the verifier
- The <=1s and burst evidence rides the `model-updated` echo printed by
  Rust — verify the mechanism itself (store emits AFTER committing
  state; Rust stamps its own receive clock; both clocks are the same
  machine's).
- Debug-binary-with-cwd is how "run against a scratch project" was
  achieved; a packaged .app launched from Finder has cwd `/` and would
  fall back to watching `/docs` (idle) — pre-existing T-001-s1 gap,
  sharpened by this task, not widened (see also T-003-s1).
- The dev harness (`window.__nputerDocsHarness`) is `import.meta.env.DEV`
  + non-Tauri gated; confirm absence in your own prod build.
- Roadmap failure predicate is heuristic (0 features AND >=1 issue) —
  a mid-edit save of a roadmap WITH a surviving backbone bullet but a
  malformed line counts as soft issues, not failure (model updates,
  issues listed). Deliberate: matches the parser's flag-don't-hide
  stance; the EARS criterion reads "fails to parse", and a roadmap
  yielding records did not fail.
- Watcher lifecycle edge (docs/ replaced wholesale or absent at start)
  goes idle rather than re-arming — filed as T-003-s1.
- app/tsconfig now includes test/ so `npm run build`'s tsc typechecks
  the tests too (kept the fast gate honest).

### Suggestions filed
- `T-003-s1-watcher-rearm.md` — re-arm the docs watch when docs/
  appears or is replaced; ties into T-001-s1's packaged-app cwd gap.

## Verdicts

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder): APPROVED

Suites reproduced from wiped node_modules/dist: lib/parser `npm ci` +
`npx vitest run` **78/78** (67 pre-existing + 11 new) + `npx tsc
--noEmit` + `npm run build` all clean; app `npm ci` + `npm run build`
exit 0, `npm test` **13/13**; src-tauri `cargo test` **7/7**. The
fresh-clone ordering claim verified by doing it wrong first: app build
WITHOUT parser dist fails exactly as flagged (TS2307 on
`@nputer/parser/pure`) — CONVENTIONS needs the parser-before-app note
the executor drafted.

Criterion probes (my own, debug binary cwd-launched against a scratch
git repo; timing = write syscall → `appliedAtMs` in the echo; mechanism
verified: store commits state, then echoes — echo-vs-Rust-receive
deltas were 1–2ms):
- **≤1s**: 36-file tree max 283ms (first-after-boot 735ms). Scaled:
  500 files max 344ms, 1200 max 384ms, 2000 files (the cap) max 442ms
  — file COUNT never threatens the budget. The boundary is total
  BYTES: ~19MB of .md under docs/ → 845ms, ~29MB → 1062–1085ms, the
  only >1s breach observed. That needs ≥ ~25MB of markdown (this
  repo's docs/: ~0.25MB); degradation is graceful (latency only, no
  crash, no loss), so filed as T-003-s2 rather than rejecting.
- **Debounce/burst**: my own shapes — 12 atomic-rename saves (tmp +
  rename) 15ms apart; create+modify+delete inside ONE 250ms window;
  20 writes straddling windows over 2.4s; rename A→B→A inside a
  window and across windows; mass-create of 464/700/800 files; mass-
  delete of ~2000. Full session ledger: 67 `docs-changed` pushes,
  every seq echoed exactly once (zero duplicates, zero missing,
  strictly increasing), 35 identical-content batches suppressed,
  process alive throughout, final model = disk truth every time.
- **Badge/last-good**: broken YAML, missing frontmatter, empty file,
  broken roadmap → record count unchanged, last-good rendered,
  failure flagged, zero issue-leak; edits to OTHER files apply while
  one stays broken; fix clears; deleting a never-good file clears.
  DOM half (served bundle, dev harness): badge chip `1 parse error`
  with parser-message tooltip, details strip "(showing last valid
  state)", intact task rows beneath (screenshot); stale seq → no
  render, no echo; a task title carrying `<img onerror>`/`<script>`
  renders as inert text — no element created, no execution. Harness
  confirmed absent from the production bundle (grep of dist assets: 0
  hits; `model-updated` echo present). Edge recorded, not a failure:
  content that turns non-UTF-8 or >1MiB is skipped by the Rust
  collector, so its record silently leaves the model like a deletion
  — no badge (T-003-s3).

Security sweep — PASS:
- IPC surface: exactly one command, `docs_snapshot`, zero caller
  arguments (State injection only), single `generate_handler` entry.
  The Tauri v2 no-ACL claim verified in artifacts:
  `gen/schemas/acl-manifests.json` holds core namespaces only;
  `capabilities.json` is exactly `{default: ["core:default"],
  local:true, windows:["main"]}` with NO `remote` key → IPC reachable
  only from the app's own local webview, which under `script-src
  'self'` runs only bundled code; the command returns nothing the
  webview doesn't already receive via events.
- ADR-010 zero-diff confirmed beyond config: the CSP string sits
  verbatim in the compiled binary (`strings`), zero opener/shell/fs
  permission traces.
- Containment attacked live: file symlink AND dir symlink inside
  docs/ pointing at outside task-shaped content never entered the
  model; docs/ itself replaced by a symlink → collector refuses
  ("not a plain directory") and ships an empty tree even though
  notify arms on it — the defense correctly lives at the read layer.
  Residual, accepted: a hardlink inside docs/ would ship (git cannot
  produce hardlinks from a hostile clone — no repo-borne vector);
  the symlink_metadata→read TOCTOU window needs local write access
  that already implies model control.
- Echo path: `sanitize_for_log` escapes all `is_control` chars (ESC
  and 8-bit CSI included) and truncates at 800 chars; it is the only
  place untrusted content reaches stdout, and no other log line
  carries file content. Note: Unicode bidi format chars (U+202E) are
  not control chars and pass through — cosmetic log reordering at
  worst.
- Pure lens holds: no fs writes/exec/network/`unsafe` outside
  cfg(test) in the new Rust; no
  localStorage/fetch/WebSocket/dangerouslySetInnerHTML in app src;
  the model lives only in the store.
- ADR-009: every file-keyed collection in the diff is a Map/Set
  (files.ts, docs-model.ts) or Vec+sort (Rust); hostile
  `__proto__`/`constructor` paths pinned inert by tests in both
  packages.
- Dependencies: notify-debouncer-mini 0.7 + notify 8.2 tree
  (fsevent/inotify/kqueue/windows backends, rustix, tempfile) — the
  standard maintained fs-watch stack, checksummed from crates.io;
  npm adds are vitest 3.2.7's stock tree (34 packages, zero install
  scripts) plus the `@nputer/parser` file: link recorded `link:true`.

Boundary: diff touches only app/**, lib/parser/**, docs/tasks/T-003-*.
Parser root entry is additive-only — all pre-existing exports intact
("unchanged for node consumers" is accurate in effect, though the new
pure functions are exported from the root barrel too, not "./pure
only"). The browser bundle empirically never resolves node:fs (the
served bundle parsed my payloads in a plain browser). Adjacent T-001
behavior intact: canonical `npm run tauri dev` boots with both
`[nputer]` startup lines, the watcher line, and a clean seq=1 echo
(14 tasks · 5 features · 0 issues) against this worktree.

Suggestions filed (non-blocking): T-003-s2 (snapshot cost scales with
total tree bytes — measured knee, plus silent membership truncation
past the 2000-file cap), T-003-s3 (surface collector-skipped files so
silent drops become badges).
