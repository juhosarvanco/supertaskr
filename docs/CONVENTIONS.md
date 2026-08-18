# Conventions

## Build & test
- Fresh-clone ORDER (T-003, ADR-011): lib/parser FIRST — `npm ci` +
  `npm run build` from lib/parser/ — then set up app/. The app
  depends on `@nputer/parser` via `file:../lib/parser`: its build
  needs the parser's dist/ (fails with a clear TS2307 if missing),
  and the symlink resolves the parser's deps via the parser's own
  node_modules, so its `npm ci` must have run.
- lib/parser (C-06), run from lib/parser/: `npm ci` ·
  `npx vitest run` (suite) · `npx tsc --noEmit` (types) ·
  `npm run build` (emits dist/, gitignored). The suite's smoke test
  parses this repo's live docs/ tree and requires zero issues.
- app/ (C-05), run from app/: `npm install` (setup) ·
  `npm run build` (typecheck + frontend build — the fast gate) ·
  `npm test` (vitest — model-store unit tests, T-003) ·
  `npm run tauri dev` (run the desktop app) · `npm run tauri build`
  (package).
- app/src-tauri (C-05 Rust half + the C-07 workspace), run from
  app/src-tauri/: `cargo test` (watcher/collector unit tests, T-003;
  + nputer-index crate suite, T-009 — bare `cargo test` runs both
  workspace crates via default-members) ·
  `cargo run -p nputer-index -- index --check --root ../..` (T-014's
  GRAPH-CURRENCY GATE, and a CI step since T-054 — exit 0 current, 1
  STALE, 2 usage, 3 the gate could not run) · `cargo audit` (T-020 —
  RUSTSEC advisories against the exact `=` pins) ·
  `cargo run -p nputer-index -- index --watch --root ../..` (keeps the
  graph current headless at the app watcher's 250 ms debounce; it runs
  until stopped, so it is LOCAL ONLY and never a CI step) ·
  `cargo run -p nputer-index -- arch --root ../..` (components, observed
  edges and drift flags, read from the COMMITTED graph — a REPORTER
  rather than a gate, so LOCAL ONLY too; `arch drift --fail-on
  undeclared|unmapped|any` is its gating form and stays unwired while
  the registry carries live undeclared edges by design). THE `--root` IS
  LOAD-BEARING on all three: the default root is the CURRENT DIRECTORY,
  so without it they look for app/src-tauri/docs/architecture/graph.json,
  and `index --check` then exits 1 — a FALSE RED, now reproduced
  deliberately by four sessions running. IT IS NOT DISTINGUISHABLE BY THE
  HEADLINE, which says STALE either way; read the SECOND line. A false
  red says `committed: MISSING at docs/architecture/graph.json`; a real
  one prints both byte/file/symbol/edge counts and a `+`/`-`/`~` file
  diff naming what moved.
- AUDIT GATE POLICY (human ruling 2026-08-16, closing T-020-s2): the
  gate is VULNERABILITIES — they exit non-zero and stop the lane
  (proven: a crafted lock pinning `time 0.1.44` → exit 1,
  RUSTSEC-2020-0071). Informational warnings stay NON-gating. Today's
  baseline, audited 2026-08-16 over 472 locked crates with cargo-audit
  0.22.2: **0 vulnerabilities / 17 informational warnings** — 16
  `unmaintained` + 1 `unsound`, all transitive under Tauri v2's
  GTK3/glib stack plus `proc-macro-error` and the `unic-*` family,
  nothing ours to re-pin. Warning-count drift is reviewed BY EYE
  against that baseline, not enforced by exit code; `--deny warnings`
  would red CI permanently for no actionable signal.
- tools/e2e (the real-input E2E lane, T-020 — the repo's THIRD npm
  package, self-contained per the ADR-011 family), run from tools/e2e/:
  `npm ci` · `npm test` (the lane — Playwright drives the app's dev
  bundle in HEADLESS Chromium with trusted input; workers 1, retries 0,
  no skips) · `npm run typecheck` · `npm run lint:tokens`
  (+ `-- --selftest`) · `npm run boot:check` (spawns `tauri dev` and
  asserts the two `[nputer]` startup lines; NOT part of `npm test` —
  it opens a real window). Beside a live app, give it a scratch port:
  `NPUTER_BOOT_PORT=14521 npm run boot:check` (T-046 — see PORT RULE;
  1420 is refused, not borrowed). Exit 0 booted · 1 the boot failed,
  with the child's last output quoted · 2 the port is busy · 3 the
  override was refused.
- One-time dev-tool setup, outside the repo and never a repo dep:
  `npx playwright install chromium` from tools/e2e/ (browsers cache in
  ~/Library/Caches/ms-playwright, ~/.cache/ms-playwright on Linux —
  hundreds of MB, deliberately outside the tree) and
  `cargo install cargo-audit --locked` for `cargo audit`, run from
  app/src-tauri/ (fetches the RUSTSEC advisory DB — the one
  network-touching command).
- PORT RULE: 1420 belongs to the human's live `tauri dev`. The lane
  runs its own vite on `NPUTER_E2E_PORT` (default 14520),
  `reuseExistingServer: false`; setting it to 1420 THROWS at config
  load by design, and the boot check bind-probes its port and aborts
  (exit 2) if anything holds it. The boot check moves off 1420 with
  `NPUTER_BOOT_PORT` (T-046; default 1420, so unset is exactly the old
  behavior), which also threads the matching `--config` — `devUrl` AND
  `beforeDevCommand` with `--strictPort` — through to `tauri dev` as
  CLI flags; tauri.conf.json is never edited. Setting `NPUTER_BOOT_PORT`
  to 1420 REFUSES loudly (exit 3, before anything is probed or spawned),
  the same rule as the lane's throw: neither override may become a
  second way to contend for the human's app. The `--` in
  `npm run tauri dev -- --config …` is load-bearing — npm eats a bare
  `--config` after the script name and leaves the JSON as a stray
  positional (measured on npm 11.12.1). Nothing in the lane ever
  contacts a server it does not own.
- CI (.github/workflows/ci.yml) is a thin invoker of exactly these
  commands — dormant until the repo's first GitHub push.
  tools/e2e/tests/workflow-parity.spec.ts DERIVES its expectations from
  the bullets above (T-045): every command they list is a workflow step
  VERBATIM, except the TWO deliberate divergences below — each one a
  commented mapping in that spec, and a lane failure if either side
  drifts. (1) `npm ci` for app/ where local setup says `npm install` —
  lockfile-exact installs in CI, everywhere. (2) `npx playwright install
  --with-deps chromium` in place of the one-time local `npx playwright
  install chromium` — the Linux system libs a fresh runner lacks.
  BOTH ARE ENVIRONMENT DIFFERENCES, and that is now the whole list:
  T-054 closed the two that were only CI spelling a documented command a
  second way (T-045-s1). The token lint runs as
  `npm run lint:tokens -- --selftest` then `npm run lint:tokens` from
  tools/e2e — still the job's FIRST step, ahead of every `npm ci`,
  because `npm run` needs no installed node_modules (it only extends
  PATH; measured on npm 11.12.1 against an uninstalled tools/e2e) — and
  still two steps, because `--selftest` short-circuits the walk. The
  boot check runs as `xvfb-run -a npm run boot:check` from tools/e2e:
  the wrapper is real, since a headless runner has no display, but what
  it wraps is now the documented command rather than a second spelling
  of it. CI also runs `cargo install cargo-audit --locked` (the one-time
  dev-tool setup above, per run because a fresh runner has no
  ~/.cargo/bin), and it deliberately does NOT run `npm run tauri dev` or
  `npm run tauri build` — one opens a window and the other packages a
  bundle; the xvfb boot step covers the dev path — nor
  `cargo run -p nputer-index -- index --watch --root ../..`, which runs
  until stopped, nor `cargo run -p nputer-index -- arch --root ../..`,
  which reports rather than gates. Change a command here, change it
  there, or the lane fails.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  nputer-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.5) and noted here.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
- This project was planned in a long chat session before the folder
  existed; the chat is NOT the record — if it isn't in this folder,
  it didn't happen (succession rule).
- Tauri v2 applies the CSP (app/src-tauri/tauri.conf.json) at serve
  time — it never appears in dist/index.html (that was v1 behavior);
  don't "fix" its absence there.
- Tauri capability grants compile to code, not strings — `strings`
  on a binary proves NOTHING about ACL grants (vacuously "clean"
  even for granted permissions; only config JSON, e.g. the CSP, is
  string-findable). Prove the webview surface with regenerated
  gen/schemas/capabilities.json plus a runtime ACL probe (T-007
  verdict correction). Since T-021 that proof is PINNED, not
  re-derived per task: `app/src-tauri/src/acl_pin.rs` re-resolves the
  shipped gen/schemas through tauri's own resolver on every
  `cargo test` and fails with a `+`/`-` grant diff if the 92-grant
  `core:default` set moves. A deliberate grant is added by re-pinning
  EXPECTED_GRANTS in the same commit, with the sweep — never by
  deleting or muting the test (see ADR-012 for why the set stays
  empty of app grants).
- DECLARING A COMPONENT moves THREE live-registry fixtures, not two
  (T-024-s5, ratified at the 2026-08-16 second triage after the
  omission cost T-024 a rejection and the lesson recurred at T-025's
  merge): `lib/parser/test/smoke.test.ts` (the exact id array over
  this repo's live docs/ tree), `app/test/architecture-dogfood.test.ts`
  (ids, declared count, findings, the relation table, drift/
  declaredOnly) and `app/test/map-dogfood-render.test.tsx` (rendered
  node + edge counts). Reconcile all three, changed never loosened. A
  MERGE REGEN alone moves only the two app fixtures — the parser pin
  holds unless the REGISTRY itself changed. The knowledge used to live
  only in a T-008 commit message and behind a task fence reading "zero
  diff under lib/parser/**".
- UI work adds tokens to app/src/styles/tokens.css, never Tailwind
  defaults or arbitrary values — unmapped utilities are deliberately
  dead, and arbitrary values (`p-[13px]`) bypass enforcement (see
  suggestion T-001-s2).
- Suggestion-triage encoding is ratified in method/tasks/TASK-FORMAT.md
  (v0.1.4, T-016): promoted → absorbed into the promoted task ("Absorbs:"
  line) + suggestion file removed in the same commit; parked → in place,
  id now required; rejected → `git mv` to docs/tasks/rejected/ with a
  dated one-line reasoning. Flat `status: rejected` in docs/tasks/ stays
  a hard parse failure BY DESIGN (missing placement fields light the
  board's parse-error badge) — move the file, don't "fix" the parser;
  the flat-glob exclusion and the loud trap are both pinned in
  lib/parser/test/rejected-exclusion.test.ts.
- The genesis kit is ratified in method/roles/planner.md +
  method/interview/plan-interview.md (v0.1.5, T-023): interview output
  is INCREMENTALLY BANKED — the stage → artifact table in
  plan-interview.md is normative and gets transcribed by programs
  (T-024 stage inference, T-025 kit packaging); changing it is a
  method version bump, and code reading it must be kept in sync.
  "pushing back:" is a rendering hint, never load-bearing; the
  transcript is not record. docs-templates/ are scaffolded VERBATIM —
  examples live inside HTML comments. The trap that made those comments
  load-bearing is CLOSED since T-030 (2026-08-17, absorbing T-023-s1):
  parseRoadmap blanks every `<!-- … -->` span before matching lines, so
  a column-0 `- F-01:` example row inside a comment yields neither a
  phantom feature nor a roadmap-error, and the examples no longer have
  to be indented to stay invisible (pinned in
  lib/parser/test/roadmap.test.ts, template shape included). The
  templates stay comment-wrapped REGARDLESS — a comment is how an
  example says it is an example, and the parser's tolerance is a safety
  net, not a licence to ship live-looking rows in a scaffold.
- Outside-click/dismissal listeners must decide on pointerdown, never
  click — under trusted input the browser runs microtask checkpoints
  between listeners, so React's discrete-update flush lands
  mid-propagation and detaches the clicked node; a click-time
  listener then reads inside as outside and misdismisses (cost T-005
  a rejection). Synthetic clicks propagate synchronously and CANNOT
  reproduce it — no unit/jsdom probe will warn you. Reuse
  attachPanelDismissal (app/src/components/board/panel-dismissal.ts);
  its test pins the trusted event order headlessly, and since T-020 the
  real-input lane (tools/e2e) pins it under TRUSTED input — swapping
  those two strings back to `"click"` fails blocker-retarget,
  keyboard-activation and the at-press assertion, which is the whole
  reason that lane exists. The `data-panel-exempt` exemption is a
  SAFETY NET against accidental dismissal, not a guarantee that exempt
  controls stay pointer-reachable while a panel is open: the open panel
  occludes the header's exempt controls and keyboard reach is
  sufficient by design (human ruling 2026-08-16, closing T-020-s1;
  tools/e2e/tests/panel-exempt-controls.spec.ts pins the occlusion as a
  tripwire, so un-occluding it fails loudly).
- A RENDER-PHASE REF STAMP is legitimate only under three conditions,
  all three of them (T-042 criterion 4, the architect's ruling on
  T-024-s3; precedent T-012's render-time layout cache, live example
  `app/src/genesis/GenesisPane.tsx`'s `logRef` write and the header
  comment above it). The fold must be GUARDED — returning `prev` BY
  IDENTITY for the already-observed and stale cases, so a StrictMode
  double-render and every unrelated re-render are no-ops; BOUNDED —
  what it feeds must tolerate a discarded concurrent render, here a
  pulse window whose start moves by a few ms, cosmetic and
  self-healing; and DERIVED FROM PROPS THE RENDER ALREADY HAS — no I/O,
  no subscription, no second source of truth. Miss one and lift the
  state instead. Relocating such a log into a store is a change of
  SOURCE, not of mechanism, and it earns its cost when a SECOND
  CONSUMER appears — not before: T-027's planning pass proved there is
  none (its per-turn baseline diff is a different WINDOW over the same
  evidence, not the same log), and moving state across a component
  boundary to serve nobody is cost without benefit.
- GRAPH REGEN (T-009-s1's INTERIM rule, RETIRED at T-054 and replaced
  by this bullet — the retirement condition it carried, "when T-014's
  `index --check` becomes the gate", is met in the same commit that
  makes `index --check` a CI step): at any merge whose diff touches
  `*.ts/*.tsx/*.js/*.jsx` outside docs/, regenerate the committed
  graph — `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
  self_graph -- --ignored` — and commit docs/architecture/graph.json
  **with the CHECKPOINT**. **"The merge's diff" means
  `<main-before-the-merge>..HEAD`, never `<merge-base>..HEAD`** — see
  the BOOT GATE bullet below, which states the reason once for both
  rules. WHAT RETIRED is the obligation to hand-run the byte-comparison
  afterwards: CI now runs `cargo run -p nputer-index -- index --check
  --root ../..`, so the property is held by a gate instead of by a
  written ritual and twenty-nine conscientious regens. WHAT DID NOT
  RETIRE is the
  regen — `--check` DETECTS a stale graph, it never produces a fresh
  one, so the integrator still regenerates and still commits the result;
  a green CI is now what proves they did. WHY THE CHECKPOINT AND NOT THE
  MERGE: the checkpoint edits INDEXED fixture files
  (app/test/architecture-dogfood.test.ts and
  app/test/map-dogfood-render.test.tsx), so a graph regenerated into the
  merge commit is stale again the moment those are reconciled — measured
  at T-050, where `index --check` exits 1 at the merge and 0 at the
  checkpoint. The rule read "with the merge" for twenty-nine regens
  while every integrator did the other thing; this is the practice,
  written down (T-014-s3). IF the regen cannot run THEN say so LOUDLY in
  the checkpoint, naming the reason — a skipped gate is news, never
  silence.
- DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  (T-014-s3, seven-for-seven): cut a task branch from the newest
  `Checkpoint:` commit on main. A merge commit carries a graph the
  checkpoint has not regenerated yet (see GRAPH REGEN above), so a lane
  cut from one inherits a stale graph and a red `index --check` through
  no fault of its own. T-014 is the counter-example — cut from the merge
  `5927adc`, it inherited exactly that, and four sibling lanes were
  dispatched into the same window; T-027 is the seventh worked example
  the other way, cut from the checkpoint `e92056a` with a current graph
  and no inherited red. This rule is what makes the window HARMLESS; the
  CI gate above is what makes it VISIBLE. Both, not either.
- BOOT GATE (T-046, ratified at the 2026-08-16 triage on T-040-s1 +
  T-020-s3): at any merge whose diff touches `app/src-tauri/**`,
  `app/src/**` or either manifest (app/package.json,
  app/src-tauri/Cargo.toml) — **and "the merge's diff" means
  `<main-before-the-merge>..HEAD`, NEVER `<merge-base>..HEAD`; SIX
  consecutive integrators have derived this the hard way and every one
  had to reason it out afresh, so it is written here once.** The
  merge-base is the branch POINT, so `<merge-base>..HEAD` also contains
  everything MAIN did in the meantime — work that already passed this
  gate at its own merge. At T-027 the two derivations returned 9 files
  and 36; the extra 27 were T-014's indexer crate, already merged and
  already boot-gated, and the naive figure would have made a
  frontend-only merge look like it rewrote a Rust crate. It has never
  yet changed WHETHER the gate fires — both derivations fired all six
  times — but it changes what you tell the human the merge touched, and
  a trigger set that is 4× too wide is a checkpoint that lies. Then run
  the boot check —
  `NPUTER_BOOT_PORT=<free scratch port> npm run boot:check` from
  tools/e2e/ — and RECORD the result (exit code, both `[nputer]` lines)
  in the checkpoint. The four exit codes are legended in the tools/e2e
  commands bullet under "Build & test" above: 0 booted · 1 the boot
  failed · 2 the port is busy · 3 the override was refused.
  IF the check cannot run THEN say so LOUDLY in the
  checkpoint, naming the reason and the exit code — a skipped gate is
  news, never silence. It exists because `cargo run` is the ONE command
  this pipeline never issues: T-040, a one-line manifest regression that
  stopped the app launching at all, passed an executor, an adversarial
  verifier and an integrator, each of whom ran `cargo test`, `cargo
  build` and three consecutive full suites — all of which are perfectly
  happy with two binaries. THE EXECUTOR RUNS IT TOO, on the same
  trigger, before handing off (T-046 criterion 6): a red the executor's
  own fence forbids fixing is still news, and news at build time is
  cheaper than news after a merge — file it as a suggestion and say so
  in the notes. Running it is NOT screen control (@human ruling
  2026-08-16): the app opens and closes its own window; nothing is
  clicked, typed into, screenshotted, or read off the screen.
- POISON DRILL (ratified at T-054; until then it was pure oral
  tradition — "poison", "vacuous" and "mutation" appeared nowhere in
  this file or in method/roles/, verified at the 2026-08-17 triage): at
  any task that ADDS OR CHANGES a test body — the executor before
  handing off, the verifier before a verdict, the integrator before a
  checkpoint — MUTATE every new or changed assertion so that it ought to
  fail, RUN its suite, and require the RED. Then restore, and PROVE the
  restoration rather than asserting it: `git show HEAD:<path> | shasum
  -a 256` against the working file, or an empty `git diff -- <path>`.
  RECORD the count and the restoration proof in the notes, the verdict
  or the checkpoint — "133-for-133" is the shape (T-027), "drills run"
  is not. IF a body cannot be poisoned — it asserts a constant, or every
  mutation is one the test already makes — THEN say so and name it,
  because a body that cannot red is the finding. WHY: an assertion that
  cannot fail is indistinguishable from one that passes, and this
  practice caught SIX vacuous assertions in a single night (T-057 fixes
  what it found; this is the rule that found it). It stays a DISCIPLINE
  rather than a gate because nothing can automate "would this have
  failed" — which is precisely why it has to be written where a verifier
  reads it instead of remembered.
- THE E2E LANE'S HONEST SCOPE (T-049-s1, recorded rather than coded —
  arms 1 and 2 below stay available and were deliberately not taken):
  tools/e2e covers what a BROWSER can reach, and Tauri-gated
  affordances are jsdom-plus-@human territory. Two live instances,
  neither a defect and both correct about what a browser can do:
  `runPicker` opens with a not-Tauri early return, so an accelerator's
  ACTION is unobservable in the served bundle — the lane can prove a
  chord was CLAIMED, never that it was OBEYED — and both header buttons
  are gated behind `isTauriRuntime()`, so the one screen where they live
  is the one screen the lane cannot show. T-027 and T-028 made this
  bigger by adding whole screens whose actions are all IPC. So do not
  read a green lane as coverage of an IPC path: the Rust suite, the boot
  gate and @human's eye are what cover those. The two unused arms are a
  DEV-only attempt counter and rendering the gated pair disabled in
  browser mode; the recorded sentence was preferred over a second
  DEV-gated surface, which T-041's single-gate argument disfavours.
