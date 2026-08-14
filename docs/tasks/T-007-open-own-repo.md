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

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder):
APPROVED. Headless verification throughout at the human's explicit
direction — zero screen control, zero native dialogs driven, zero
windows opened; the live instance on :1420 (node pid 84310) verified
identical before and after this session. The dialog-widget flows the
executor recorded as human-verifiable-later are carried forward below,
per the T-001 visual-confirmation precedent.

Suites reproduced from wiped node_modules/dist, ADR-011 order:
lib/parser `npm ci` + `npx vitest run` **78/78** + `npx tsc --noEmit` +
`npm run build` all clean (and lib/parser is a zero-byte diff — the
"untouched" claim is literal); app `npm ci` + `npm run build` exit 0 +
`npm test` **61/61** (41 baseline preserved + 16 store + 4 DOM);
src-tauri `cargo test` **20/20 four consecutive runs** (claim was
flake-free across 3; held across my 4).

The central claim — a new native dialog with ZERO new webview surface —
VERIFIED at every layer reachable headlessly:
- (a) tauri.conf.json zero diff; the ADR-010 CSP string sits verbatim
  in a debug binary I built from this tree (`strings`: 1 hit).
- (b) capabilities/ zero diff; gen/schemas/capabilities.json REGENERATED
  BY MY OWN BUILD = exactly `{default: {..., local:true,
  windows:["main"], permissions:["core:default"]}}`, no `remote` key.
  gen/schemas/acl-manifests.json: `dialog` namespace registered (so
  denial is a real ACL decision, not absence), `fs` namespace ABSENT,
  no opener.
- (c) my own webview-layer denial probe, not a re-run of the
  executor's: the shipped authority reconstructed from the shipped
  artifacts through tauri's own resolver
  (`Resolved::resolve(acl-manifests.json, capabilities/default.json)`,
  the same routine tauri-build runs), installed into a MockRuntime app
  with the real `tauri_plugin_dialog::init()` registered, and probed
  with real InvokeRequests from the local origin: `plugin:dialog|open`
  /save/message/ask/confirm ALL denied ("not allowed"); six
  `plugin:fs|*` commands unreachable; `plugin:opener|open_url` still
  absent (T-001 fix regression check); `docs_snapshot` reachable as the
  positive control; authority-level cross-check: no dialog/fs/opener
  command resolves under the grant set while `plugin:event|listen`
  (core:default) does. Bonus finding in the app's favor: from REMOTE
  origins even the app's own commands are rejected (local-only
  capability, no `remote` key) — probed with https://evil.example.com.
- (d) fs is genuinely type-only: no `.plugin(tauri_plugin_fs` anywhere
  in src (grep), fs absent from the compiled ACL manifests, fs commands
  unreachable (probe). Upstream reason confirmed in the dialog crate's
  source: `pub use tauri_plugin_fs::FilePath` + an error From impl.
- (e) one CORRECTION to the executor's evidence, in their favor but
  worth recording: the "no dialog/fs grant strings in the binary" check
  is VACUOUS — even the granted `core:default` does not appear in
  `strings` output (tauri 2.11 embeds the resolved ACL as code, not
  identifier strings; only the config JSON, hence the CSP, is
  string-findable). The claim is true but evidentially empty; the
  compiled schemas + runtime probe above are the real evidence. ADR-010's
  "config or strings" note holds for the CSP half only → recorded in
  suggestion T-007-s2.

Pick-pipeline seam attacks (my own cargo probes, real watcher threads
on scratch trees, all reverted after): validate→arm TOCTOU — a root
valid at validation and DELETED before the thread processes the Rearm
is refused by the thread's own gate, ack carries the typed Err, project
dir unchanged, the OLD watch still emitting afterwards with seq
continuity; a rearm refusal maps to `Error{path, message}` with nothing
mutated; a dead rendezvous (ack channel lost) maps to the timeout arm,
nothing mutated; docs/-as-symlink pick attempted while a project is
ARMED (executor's variant was unarmed) → NoDocs, old watch alive;
same-folder re-pick (smallest choice 7, which the executor left
untested) → fresh snapshot, higher seq, baseline refreshed, watch still
live. Executor's own 13 T-007 cargo tests all reproduce.

Resolution order verified END-TO-END in child processes of the test
binary (no app launches): cwd inside a scratch git repo WINS over the
exe's repo (order, not just membership — T-003's debug-binary-with-cwd
protocol preserved); cwd outside any repo + exe inside the worktree →
exe walk-up resolves the worktree (the packaged-.app-in-a-checkout
case); the binary COPIED outside every repo and run from / → None.
Adjacent-feature judgment on the REMOVED silent cwd fallback: T-001's
criterion reads "log the resolved project folder path (default: the
repo the app lives in)" — the happy path still resolves and logs
exactly that (dev-mode resolution probe-verified); the cwd fallback
lived only in T-001's implementation notes, probed there as a no-panic
edge, and no criterion or later contract depends on it (T-003's
protocol requires cwd walk-up from a GIT REPO, which is preserved and
first). The replacement — explicit "none resolved" log + functional
empty state + pick — closes the gap T-003's notes flagged (packaged
app silently watching /docs forever). Implementation detail replaced
by strictly more honest behavior; T-001/T-003 contracts intact.

Frontend criteria, real component tree headless (my own probe: REAL
App + store + docs-model + @nputer/parser with only the IPC boundary
mocked, synthetic MouseEvents): noProject startup → empty state naming
docs/tasks/ AND docs/decisions/ with a live pick affordance; pick
success → board renders the picked project and live-updates on
docs-changed (echo emitted — T-003 contract intact); bad pick →
empty state OVERLAYS the board naming the path, model intact
underneath (task count unchanged), background updates do NOT yank the
notice but DO update the model, keep-current returns to the latest
board; stale old-project payload dropped by identity; cross-project
broken payload → 0 tasks, failure badge, and NO old-project content
leaking (last-good isolation in the rendered DOM); cancel → provable
no-op with the picking guard holding invoke to exactly one call;
pick error → "could not open <path>: <message>", no keep-current when
nothing is open, re-pick affordance always present — no crash, no
blank on any outcome. Judgment on smallest choice 5 (overlay): the
criterion says "show a friendly empty state naming what it looked
for" — the overlay does exactly that; nothing in the criterion says
to close the current project, and the escape hatch is additive.
Criterion-compliant, not a stretch.

Declared deviations — both judged required infra, not creep:
vitest.config.ts expansion (.tsx include, `@` alias, jsx automatic) is
the minimum for the mandated DOM tests to compile and resolve App's
own imports, mirrors vite.config.ts, and changes nothing for the
pre-existing 41 tests (all green); tests in app/test/ (vs the
dispatch's app/src/test/ guess) follows where T-003/T-004 already put
docs-model.test.ts and select-board.test.ts — repo convention beats a
dispatch guess.

Dependencies — all justified, exactly as declared: Cargo.lock adds
exactly 4 crates, all crates.io-checksummed — tauri-plugin-dialog
2.7.2 (the task-mandated official plugin; crates.io shows it current
and maintained, updated 2026-07-18, ~13M downloads), rfd 0.16.0 (the
standard dialog crate it wraps), tauri-plugin 2.6.3 (plugin build
glue), tauri-plugin-fs 2.5.1 (the type-only transitive, above). npm
adds jsdom ^29.1.1 (devDep) + its stock tree: 36 packages, 100%
registry.npmjs.org, ZERO install scripts, zero lockfile deletions,
`npm ci` clean (lockfile↔manifest consistent), 0 audit
vulnerabilities; jsdom 29.1.1 is maintained (2026-04; a 30.x exists
since 2026-07 — not chasing a three-week-old major for a test dep is
fine). Correctly NO `@tauri-apps/plugin-dialog` npm package — the
webview has no business with the dialog API and doesn't get its
bindings.

Boundary: the 13 changed files are app-shell territory + T-007 task
docs only. Zero changes to board components, board-model, tokens.css,
index.css, lib/parser. No new tokens and no arbitrary values verified
in the BUILT CSS: EmptyState's utilities (max-w-96, gap-4, text-lg)
all compile through the token mechanism (`--spacing-unit`,
`--text-lg-*`). ADR-009 sweep: no computed-key writes to plain
objects in the diff; all rejected-pick strings render as React text
nodes; no dangerouslySetInnerHTML/eval/fetch/WebSocket/localStorage
in the diff; no `unsafe` in the Rust.

Non-blocking observations, recorded not held: (1) `pick_project_folder`
is guarded against double-invoke only webview-side — a compromised
webview could stack native dialogs (annoyance-only; no path ever
transits; each needs a human answer) → T-007-s3; (2) the rendezvous
holds the project mutex up to 10s, so a concurrent `docs_snapshot`
blocks behind a slow re-arm (serialization, not deadlock — the watcher
thread never takes that lock); (3) `[nputer] project folder picked:`
prints the user-picked path unsanitized — same class as T-001's
existing project-folder line (local user's own choice, not repo
content); (4) a lost re-arm ack reports "watcher re-arm timed out"
even when instant — cosmetic.

**Human-verifiable-later — carried forward explicitly (T-001
precedent; every layer beneath these clicks is machine-verified above
and in the executor's notes):** the three dialog-WIDGET flows on the
real screen: (1) "Open a project folder…"/"Open folder…" → native
dialog appears → choosing a convention-layout folder re-renders the
board live (fixture: any folder with a docs/*.md tree); (2) choosing a
docs-less folder → empty state names it, "keep current project"
returns to the untouched board; (3) Escape/cancel → no change. The
standing Linux caveat on T-001/T-003 window criteria (T-001-s3)
remains open and is unchanged by this task.

Suggestions filed (non-blocking): T-007-s2 (pin the webview ACL
surface with a permanent regression test + record that capability
grants are not `strings`-findable), T-007-s3 (Rust-side single-flight
guard for the picker).

Probe hygiene: all verifier probes (2 temp test files, a temp
dev-dependency, one mod line) reverted; `git status` clean at d19b5c3;
post-revert suites re-run green (cargo 20/20, app 61/61); no servers
started, no ports opened or killed by this session. :1420 for the
record: at session start the human's live instance was node pid 84310
LISTENING on [::1]:1420; at session end no listener exists and pid
84310 is gone. No command in this session addressed that process or
port (no kill, no bind; the node_modules wipes were inside this
worktree only) — the instance exited externally, presumably the
human's own doing; recorded here so the timeline is honest rather
than claiming "same pid before/after".
