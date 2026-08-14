---
id: T-007
title: App opens nputer's own repo
feature: F-02
milestone: 1
priority: 7
size: M  # architect resize at dispatch, S→M: picker adds dialog IPC surface (ADR-010) — verifier required
status: verifying
blocked_by: [T-003, T-004]
touches: [app-shell]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN the app launches with no argument THE system SHALL open the
  nputer repo it lives in and render this board — these seven cards —
  live.
- THE system SHALL also accept any folder via a picker and render it
  if it contains docs/ in the convention layout.
- IF the chosen folder has no docs/ THEN THE system SHALL show a
  friendly empty state naming what it looked for (no crash, no blank).

## Implementation notes

Executor claude-fable-5, 2026-08-15, branch `t007-open-own-repo`.

### What was built
Project selection made honest and switchable; the board stays a pure
lens over whichever project is open:

- **Launch resolution** (`resolve_project_dir` in
  `app/src-tauri/src/lib.rs`) now returns `Option<PathBuf>`. Shipped
  resolution order: (1) `.git` walk-up from cwd — T-001's rule, what dev
  and cwd-launched binaries hit, kept first as the explicit-intent
  signal; (2) `.git` walk-up from the canonicalized executable path —
  what makes "the repo the app lives in" literal for a packaged .app
  living inside a checkout (its cwd is `/`, the T-001-s1 gap); (3) None
  — no silent fall-back to cwd anymore; the frontend lands on the
  friendly empty state with the picker instead of watching a nonexistent
  `/docs` forever. `.git` may be file or dir (worktrees count).
- **Re-armable watcher** (`app/src-tauri/src/docs_watch.rs`): T-003's
  watcher thread became a control thread owning the notify debouncer and
  draining one channel of `WatchCtl` messages — debounced fs batches
  plus `Rearm{root, ack}`. It stays alive with no project (idle-alive,
  the minimal internal slice of T-003-s1: re-arm exists, on pick; the
  docs/-appears-late sentinel remains open and is now small). Re-arm
  arms the NEW watch before unwatching the old, so failure at any step
  leaves the previous watch intact; on success it resets the
  emit-suppression baseline before acking. Emission goes through an
  injected sink (production: the `docs-changed` Tauri event), which is
  what makes the whole thread integration-testable without a Tauri
  runtime; the module no longer imports tauri at all.
- **Startup status** — `docs_snapshot` (still zero-argument) now returns
  tagged `ProjectStatus`: `noProject` | `noDocs{projectDir}` |
  `open{snapshot}`. A resolved repo WITHOUT docs/ shows the same
  friendly no-docs message as a bad pick, naming the path.
- **Picker** — new command `pick_project_folder()` (zero arguments,
  async): opens the native folder dialog VIA RUST
  (`tauri-plugin-dialog`'s Rust API, `DialogExt::dialog().file()
  .pick_folder`, bridged by a bounded channel), so THE WEBVIEW NEVER
  SUPPLIES A PATH; then `apply_picked_folder`: canonicalize → require a
  plain non-symlink `docs/` (T-003's rules) → rendezvous re-arm →
  only then commit the project dir, take a seq, snapshot. Typed
  `PickOutcome`: `cancelled` | `noDocs{path}` | `error{path,message}` |
  `picked{snapshot}`. Every early return provably mutates nothing.
- **Seq across switches**: the shared `AtomicU64` is global and
  monotonic, NEVER reset — that is what "resets the seq/snapshot flow"
  ships as: the frontend keeps its watermark and resets the MODEL on a
  projectDir change, so any late delivery from the previous project is
  provably stale and drops by the existing `seq <= applied` guard.
- **Frontend** (`app/src/lib/watcher-store.ts`): shell state
  `{phase, resolvedDir, rejectedPick, picking, docs}` around the
  untouched T-003 docs-model. Pure, unit-tested helpers:
  `resetDocsForProjectSwitch` (clears model/lastGood/failures, keeps the
  watermark), `reduceDocs` (stale-first guard, reset-on-projectDir-
  change, then the T-003 `applySnapshot` — a same-named file in a new
  project can never fall back to the OLD project's last-good content),
  `selectScreen` + `noDocsMessage` (screen + message selection).
  `pickProjectFolder()` maps outcomes: cancelled → no change; noDocs/
  error → `rejectedPick` notice only; picked → apply + clear. The
  dev-only browser harness keeps its T-003 contract.
- **UI** (`app/src/App.tsx`): exported `EmptyState` — "no board to
  show", the message ("no docs/ found in <path> — an nputer project
  keeps its board in docs/tasks/, decisions in docs/decisions/"), an
  "Open a project folder…" button (disabled while the dialog is up) and,
  when a rejection overlays a still-open project, a "keep current
  project" dismiss. Header gains "Open folder…" (Tauri-only, board
  screen only). Board/loading/browser branches unchanged in substance;
  `data-screen` attribute added for probing. No new tokens, no arbitrary
  values, board components untouched.

### New IPC surface, capability diff + containment (ADR-010)
- **CSP: unchanged** — zero diff in tauri.conf.json (verify `git diff`),
  string sits verbatim in the release binary (`strings` checked).
- **Capabilities: unchanged — `core:default` only, NO dialog permission
  added.** The narrowest set that makes this work is the EMPTY set,
  because the dialog is invoked exclusively from Rust: the ACL gates
  webview→IPC calls, and the webview never calls the plugin. Registering
  the plugin does add its commands to the ACL registry, so this was
  verified empirically, not assumed: a dev-only probe invoking
  `plugin:dialog|open` from the webview was rejected with
  `dialog.open not allowed. Permissions associated with this command:
  dialog:allow-open, dialog:default` (stdout-logged via the echo path;
  probe reverted). Compiled truth agrees: gen/schemas/capabilities.json
  (gitignored, regenerated with the plugin registered) still grants
  exactly `["core:default"]`, and the release binary contains no
  `dialog:allow-open`/`dialog:default`/`opener:default` grant strings.
  A compromised webview can invoke `docs_snapshot` (no args) and
  `pick_project_folder` (no args — at worst it pops a folder dialog the
  USER must answer; the path never transits the webview) and nothing
  else.
- **Containment on the picked root**: identical to T-003 because it IS
  T-003's collector — the picked path is canonicalized first (macOS
  `/tmp`-style symlinked roots resolve to their real path and all
  prefix checks anchor there), `docs/` itself must be a real non-symlink
  dir (`has_plain_docs_dir`, the shared gate for status, validation, and
  the thread's arming — defense in depth for the validate→arm TOCTOU
  window), internal symlinks are skipped with the canonical-prefix belt
  intact. Pinned by cargo tests on the PICK path specifically.
- The `Rearm` control message is internal (Rust-side channel), not IPC.

### Smallest choices (recorded)
1. Resolution order cwd-first, exe second, None third — cwd stays first
   so T-003's debug-binary-with-cwd protocol and dev behavior are
   unchanged; exe walk-up added rather than a cwd fallback because a
   packaged app's cwd (`/`) is noise, not intent.
2. Startup resolution does NOT require docs/ (walk-up only); a resolved
   docs-less repo lands on `noDocs` naming the path. Uniform with the
   criterion-c message, and truthful — the repo WAS found.
3. "Contains docs/ in the convention layout" = a plain, non-symlink
   `docs/` directory (T-003's watchable-project definition). An empty
   docs/ opens as an empty board; requiring docs/tasks/ would reject
   legitimate fresh projects.
4. Picked root that IS a symlink: canonicalized and opened at its real
   path (refusing outright would break `/tmp`-style paths); docs/-as-
   symlink refused outright (T-003 rule); vanished/unreadable pick
   folded into `noDocs` (it is "nothing usable found there"), re-arm
   failures into `error{message}`.
5. Bad pick while a project is open: the EARS text says "show a friendly
   empty state", so the empty state OVERLAYS the board (criterion-
   literal), while the project stays fully open underneath — watcher
   armed, model untouched (Rust rejected before any mutation) — with
   "keep current project" as the way back and background docs-changed
   deliveries deliberately NOT yanking the screen away.
6. Seq counter never resets (analysis above); the frontend reset
   preserves the watermark.
7. Same-folder re-pick: watch kept, baseline refreshed, fresh snapshot
   — a cheap manual refresh, no special casing.
8. Cross-project last-good isolation implemented as reset-on-
   projectDir-change inside the payload path (`reduceDocs`), not only in
   the pick handler — closes the race where a new project's first
   `docs-changed` event beats the pick response.

### Verification per criterion (macOS 15/Darwin 25.6, node 22.22.0, rustc 1.95.0)
Suites: lib/parser `npx vitest run` **78/78** + `npx tsc --noEmit` clean
(untouched package, re-run); app `npm run build` exit 0, `npm test`
**61/61** (41 baseline + 16 store/screen + 4 empty-state DOM); src-tauri
`cargo test` **20/20** (T-003's 7 preserved — one adapted to the new
`WatchState` constructor — + 13 new), 3 consecutive runs, no flakes.

- **(a) dev**: `npm run tauri dev` (temporarily on port 14207 — the
  human's live instance owns 1420 and was never touched; vite port +
  devUrl reverted after the probe, verify zero diff) → stdout:
  `project folder: /Users/ujju/Projects/nputer-t007` (cwd walk-up),
  `watch: watching …/docs (debounce 250ms)`, seq=1 echo
  `taskCount:18 featureCount:5 issueCount:0` with taskIds containing all
  of T-001…T-007. Board DOM verified on the same bundle in a plain
  browser (T-001/T-003 harness precedent): applying a 7-task F-02
  fixture flipped `data-screen` browser→board and rendered exactly 7
  F-02 card id spans; a follow-up cross-project payload with a broken
  roadmap yielded 0 tasks/0 features, `showingLastGood:false`, empty
  lastGood, and a stale old-project payload was ignored — the switch
  reset live in the real bundle.
- **(a) packaged**: `npm run tauri build` → .app; bundle binary run with
  cwd=$HOME (not a repo) → stdout resolved the WORKTREE via the
  executable walk-up, watcher armed, seq=1 echo (19 tasks incl. this
  suggestion); screenshot shows the real board — F-01/F-02/F-03
  columns, T-001–T-004 teal/done, T-005 amber `building` (the parallel
  T-005 dispatch, live), header "Open folder…" affordance. Same .app
  copied OUTSIDE any repo and run with cwd=/ → stdout
  `project folder: none resolved … pick a folder to open a project`,
  `watcher idle until a project folder is picked` (thread alive);
  screenshot shows the friendly empty state, not a broken window.
- **(b) picker**: invoking the command from the real packaged app
  (button click) opened the native macOS folder dialog titled "Open an
  nputer project folder" — webview → command → Rust-side dialog link
  verified live. The post-dialog pipeline is verified headlessly at the
  `apply_picked_folder` seam (everything except the OS dialog widget):
  cargo integration tests with a REAL watcher thread + REAL fs prove
  pick(valid root) → `Picked` snapshot (sorted, contained), watcher
  re-armed (writes to the new root emit with new projectDir and higher
  seq; the pick seq outranks all prior emits; first post-pick change
  emits — baseline correctness), old root's writes never surface after
  the switch, and pick-while-armed on a bad folder leaves the old watch
  emitting (criterion c's no-corruption, live). Store tests pin the
  frontend halves (reset, stale-drop, notice-only on rejection).
- **(c) no docs/**: cargo — nonexistent path, docs-less dir, and
  docs-as-symlink each → `NoDocs{path}` with `state.project_dir()`
  provably unchanged; store/DOM tests + the criterion message naming
  docs/tasks/ + docs/decisions/ pinned in three suites; packaged-app
  screenshot of the empty state (startup-noProject variant) captured.
- **Human-verifiable-later** (T-001 visual-confirmation precedent, at
  the human's explicit direction — screen-control verification was
  stopped mid-flight and the app instances were shut down headlessly):
  the three dialog-widget flows on the real screen — choose
  `<scratch convention folder>` in the open dialog → board re-renders
  and live-updates; choose a docs-less folder → empty state names it,
  "keep current project" returns to the board; press Escape → no
  change. Every layer beneath those clicks is machine-verified above;
  scratch fixtures for the human: any folder with a `docs/*.md` tree
  vs. any folder without one.

### Dependency justifications (verifier checks additions)
- Rust `tauri-plugin-dialog 2` — the official Tauri v2 dialog plugin,
  mandated by the task ("official tauri dialog plugin"); Rust-side API
  only. Pulls `rfd` (the standard Rust file-dialog crate it wraps) and
  `tauri-plugin-fs` as a TYPE-ONLY transitive (its `FilePath` enum);
  the fs plugin is NOT initialized — no fs commands exist anywhere.
  crates.io, checksummed.
- npm `jsdom` (devDep) — DOM environment for the mandated empty-state
  rendering tests; single package, per-file `@vitest-environment`
  pragma, node stays the default. No testing-library added — React 19's
  own `act` suffices for four assertions.
- NO `@tauri-apps/plugin-dialog` npm package — deliberately: the webview
  never touches the dialog API, so its JS bindings have no business in
  the bundle.

### Build/test command changes (integrator → CONVENTIONS if merged)
None. Commands are unchanged; `npm test` now also runs .tsx test files
(vitest.config include widened, `@` alias mirrored there).

### Flags for the verifier
- The empirical ADR-010 note from T-003 extends one step: registered
  PLUGIN commands are ACL-gated and DENIED under bare `core:default`
  (probe evidence above) while app-defined commands remain un-gated.
  Worth folding into CONVENTIONS' gotchas at some point (integrator's
  call).
- `docs_snapshot`'s return shape changed (bare snapshot → tagged
  `ProjectStatus`); its only consumer (watcher-store) moved in the same
  commit. The `model-updated` echo contract is untouched.
- The startup arm has no rendezvous (setup must not block): a write
  landing between watch-arm and baseline-collect can be suppressed
  until the next change. Not a live-reload gap — the frontend's startup
  pull happens after and reads the same bytes; the pick path DOES
  rendezvous. The startup-arm test tolerates exactly this window.
- `pick_project_folder` intentionally returns plain `PickOutcome` (no
  Result) and takes AppHandle, not State — Tauri's async-command macro
  constraint; State is fetched inside the blocking task.
- Bad-pick evidence rides typed outcomes, not absence of logs: assert
  `state.project_dir()` and the still-armed old watch (both tested).

### Suggestions filed
- `T-007-s1-persist-picked-project.md` — persist the last picked
  project across launches (runtime/C-03 territory; interacts with
  T-001-s1's override precedence).

## Verdicts
