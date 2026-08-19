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
  (+ `-- --selftest`; CI's FIRST step — exit 0 clean, 1 the gate RAN
  and found something, 3 the gate COULD NOT run, 2 reserved and
  unused, legended at the end of this bullet) ·
  `npm run boot:check` (spawns `tauri dev` and
  asserts the two `[nputer]` startup lines; NOT part of `npm test` —
  it opens a real window). Beside a live app, give it a scratch port:
  `NPUTER_BOOT_PORT=14521 npm run boot:check` (T-046 — see PORT RULE;
  1420 is refused, not borrowed). Exit 0 booted · 1 the boot failed,
  with the child's last output quoted · 2 the port is busy · 3 the
  override was refused. THE TOKEN LINT HAS THREE CODES, AND THIS IS THE
  SECOND ROW T-078 PROMISED — written at T-080's merge, by the
  integrator whose merge is what made the promise come due, because
  T-080's own approved diff does not reach this file. **0** the gate ran
  and found nothing, naming both corpora and their counts. **1** the
  gate RAN and FOUND something: a hit in the tree, or a selftest
  failure, which is a hit against the gate's own evidence. **3** the
  gate COULD NOT RUN, so the run is not a claim about the tree at all —
  every throw out of `token-scan.mjs` lands here and the wrapper prints
  `lint-tokens: GATE COULD NOT RUN` followed by a line saying so in as
  many words. **2** is deliberately UNUSED, reserved for `usage` — the
  meaning `index --check` gives it — so adding flag validation later
  renumbers nothing a checkpoint has quoted; 3 is that gate's number for
  THIS meaning, which is the only reason to prefer it over 2. The
  AUTHORITY is the frozen `EXIT` object in
  tools/e2e/scripts/token-scan.mjs, which owns the codes beside the gate
  that produces them, and the wrapper IMPORTS it rather than re-typing
  the numbers.
  WHAT THIS ROW REPLACED, because an older checkpoint quotes it: until
  T-080 the two answers SHARED code 1 (T-058, measured on Node
  v22.22.0). CONTROL derives its corpus from `git ls-files`, so with git
  off PATH the lint printed `lint-tokens: cannot derive tracked CONTROL
  corpus` and exited 1 — the code a real violation already used, in the
  step CI runs FIRST against a bare checkout, while the two neighbouring
  gates that legend their codes in this section each already RESERVED
  one for it. THE CATCH IS TOTAL AND IS NEVER A RESCUE: exit 3 still
  FAILS the step, and `process.exit` inside the scanner is not
  interceptable by the wrapper, so a genuine hit cannot be relabelled as
  a gate that did not run. ONE HOLE REMAINS, NAMED RATHER THAN PAPERED
  OVER (T-080-s4): a parse error in the gate's own two files means Node
  never links them, so the wrapper's `try` never runs and the process
  exits 1, not 3. READ THE MESSAGE, NOT THE CODE is still the advice —
  the three outcomes look nothing alike on stdout.
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
  ONE READ-ONLY COMMAND ANSWERS EVERY QUESTION ABOUT 1420, AND NOTHING
  ELSE MAY BE USED: `lsof -nP -iTCP:1420 -sTCP:LISTEN` names the holder,
  its pid and its STACK in one line. **Never bind-probe 1420 to learn
  whether it is held** — on 2026-08-19 two independent agents did,
  hours apart, both to demonstrate the same fact, both harmlessly, and
  both unnecessarily; the second bound `0.0.0.0:1420` as well. The
  prohibition is on the syscall, not the intent: holding 1420 for a
  sub-millisecond window to prove it is busy is still taking 1420 from
  the human. The rule above governs the LANE's tooling, which is why
  this is stated separately — it governs the hand.
  THE FACT THEY WERE DEMONSTRATING, RECORDED SO NOBODY DEMONSTRATES IT
  AGAIN: the human's vite listens on **`[::1]:1420` — IPv6 loopback —
  and nothing listens on IPv4**, so an IPv4-only probe of 1420 comes
  back FREE while the app is running (measured 2026-08-19: `node`, one
  socket, `TCP [::1]:1420 (LISTEN)`). **A free IPv4 probe is not
  evidence the app is down**, and any check that concludes otherwise is
  wrong rather than lucky. `tauri-boot-check.mjs` already probes `::1`
  THEN `127.0.0.1` and carries a comment naming this hazard; that is the
  shape to copy, and scratch ports must be probed on BOTH stacks for the
  same reason.
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
  which reports rather than gates.
  ONE TYPOGRAPHIC RULE GOVERNS EVERY EDIT TO THIS SECTION, and it lives
  in THIS bullet because this is what the next editor of ci.yml opens
  (measured at T-054, promoted out of that card's implementation notes
  at T-078): the four per-package bullets separate their commands with
  U+00B7 MIDDLE DOT, and the derivation reads separated segments only
  until the first one that does not open with a backtick. **A MIDDLE DOT
  therefore belongs BETWEEN commands, or AFTER the last one — NEVER
  inside a command's parenthetical**, where it ends the list early and
  every command behind it quietly leaves CI parity. This clause NAMES
  that character without typing it, and the section's in-parenthetical
  legends use commas for the same reason; the tools/e2e bullet's own
  `Exit 0 booted` legend sits after its LAST command rather than beside
  its own, which is structure and not decoration. THE COST, MEASURED
  TWICE — once in T-054's draft and again at T-078 against this wording:
  putting that separator inside the `index --check` parenthetical drops
  the section's exposed commands from NINETEEN to SIXTEEN, taking
  `cargo audit`, `index --watch` and `arch` with it. AND THE TRUNCATION
  IS NOT MOSTLY SILENT, which is what tells you how to check your own
  edit: the derivation runs in BOTH directions, so every command the
  SPEC claims and the doc stops exposing reds BY NAME — that mutation
  fails the lane 2 of 14 at exit 1, naming all three keys. It is silent
  in exactly ONE case, a command the DOC gains that the spec does not
  yet claim; so a NEW command is the edit to enumerate rather than
  eyeball. Change a command here, change it there, or the lane fails.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  nputer-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.5) and noted here.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
- A CITATION NAMES A SYMBOL, NOT A LINE (fourth triage, 2026-08-19).
  Four of that triage's forty-six findings cited line numbers that no
  longer resolved — every one drifted DOWNWARD by a later merge into the
  same file, while the finding's SUBSTANCE reproduced exactly, so the
  reader's first impression was "this was fixed" when nothing had been.
  Cite a path plus a FUNCTION, TEST or CONSTANT name: that survives the
  merges a line number does not, and it is what a reader can search for.
  Search from the repo ROOT — `git grep` run from a subdirectory silently
  scopes itself to that subdirectory and returns nothing, which reads
  like a refutation rather than a miss. Measured, on this file's own
  `POISON DRILL` bullet: from the ROOT, `git grep -c "POISON DRILL"`
  finds this file, its cards under docs/tasks and a test under app/test;
  run from app/, the same search finds the app/ one and NONE of the
  others. CITE THE SHAPE, NOT THE TALLY — that file count was four when
  T-078's verifier measured it and five one commit later, when the
  finding correcting it was itself filed. A hit COUNT is a line number by
  another name: it drifts under other people's merges, and the mechanism
  it illustrates never does.
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
- THE FOUR WALKS — which one sees this file? (T-078, closing an open
  question every integrator was re-deriving.) This repo walks its own
  tree FOUR different ways and no two of them agree. The AUTHORITY column
  is where each answer actually lives; read THAT rather than trusting the
  row, which is a signpost and cannot be a gate.

  | walk | authority (the file that decides) | what it sees |
  |---|---|---|
  | the GRAPH — `nputer-index` | `.nputerignore`, plus `Lang::for_extension` and `walk_root` in app/src-tauri/crates/nputer-index/src/{graph,walk}.rs | `.ts .tsx .mts .cts .js .jsx` anywhere not ignored; `.git` and node_modules hard-skipped whatever the ignore files say; symlinks skipped outright |
  | lint TOKEN — P1–P4, over MASKED source | `TOKEN_ROOTS`, `TOKEN_EXTENSIONS`, `SKIP_DIRS`, `TOKEN_EXCLUDED_FILES` in tools/e2e/scripts/token-scan.mjs | `.ts .tsx .mjs` under app/src, app/test, tools/e2e, minus the two lint implementation files by NAME |
  | lint CONTROL — P5, over RAW bytes | `git ls-files -z` minus `SKIP_DIRS` minus `CONTROL_BINARY_EXTENSIONS`, same file (T-058) | every TRACKED first-party text file — docs, method, .github, Rust, both lockfiles, dotfiles and extensionless fixtures included |
  | the PARSER's live docs | lib/parser/src/project.ts, pinned by lib/parser/test/smoke.test.ts | docs/tasks/`T-*.md` and docs/architecture/components/`C-*.md`, both FLAT and non-recursive, plus docs/ROADMAP.md |

  WHAT THAT MEANS AT A DIFF, which is when the question is always asked:
  a new `.ts` under tools/ is seen by TOKEN and CONTROL and NOT by the
  graph (tools/ is `.nputerignore`d). A new `.rs` is seen by CONTROL
  ONLY — the indexer deliberately does not collect Rust
  (`Lang::Rust` maps to no extension). A new `.md` under docs/ is seen by
  CONTROL, and by the PARSER only if it is a flat `docs/tasks/T-*.md` or
  `docs/architecture/components/C-*.md`. THIS FILE is seen by CONTROL
  only: the parser never reads it, which is why an edit here cannot move
  the parser suite. **BUT TWO LIVE READERS SIT OUTSIDE ALL FOUR WALKS,
  AND THIS LIST IS CLOSED AT TWO** (T-078-s6 — naming one and stopping is
  the one-sidedness the POISON DRILL bullet below warns about, and a
  reader who trusts a half list edits into the half it omitted). ONE, the
  E2E lane parses the "Build & test" section — see the CI bullet there —
  so an edit to a command bullet can red
  tools/e2e/tests/workflow-parity.spec.ts. TWO, the CARGO suite reads
  this file off disk on every `cargo test`:
  `snapshot_version_matches_the_live_method_stamps` in
  app/src-tauri/src/agent/kit.rs asserts it still carries the
  `currently v<METHOD_SNAPSHOT_VERSION>` stamp from the FIRST gotcha
  above, against a Rust `const` in that same file. So the method version
  in gotcha one is an ENFORCED PIN, not bookkeeping, and bumping it is a
  commit whose third file is Rust — which is why a
  `[docs/CONVENTIONS.md, method/]` fence cannot carry a format bump
  (T-078-s3).
  AND THE COUNTS ARE PRINTED, NEVER PINNED. `npm run lint:tokens` reports
  both corpora on every run and no test fixes either number, so they move
  with the tree: at `e4a5ae7` they are **TOKEN 118 / CONTROL 496**, and
  the widely-quoted **529** is the count at T-058's merge `7c6c5aa`, 33
  tracked docs/tasks files ago (46 removed, 13 added, nothing outside
  docs/tasks — `git diff --no-renames --name-status 7c6c5aa e4a5ae7 --
  docs/tasks` re-derives that in one second, and the tree checks it:
  143 − 46 + 13 = 110). DERIVE THE COUNT AT YOUR OWN REF — a figure
  copied out of a checkpoint is a figure about a different tree, and this
  one has already been carried one commit too far once: STATE attributes
  529 to `9b15f7d`, where the tree is actually at 521 because that commit
  removed the eight discharged suggestion files. **THOSE EIGHT ARE
  EXACTLY THE GAP** between the range above and `9b15f7d..e4a5ae7`, which
  is `38 removed` — the number this sentence carried until T-078-s4
  measured it, derived one commit shy of the ref it was quoted at.
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
  rules. **THE TRIGGER IS DELIBERATELY WIDER THAN THE WALK, AND THE
  REGEN IS A NO-OP UNLESS AN INDEXED FILE MOVED** (T-054-s1, closed
  here). No suffix rule can match the walk: see THE FOUR WALKS above —
  `.nputerignore` excludes docs/, tools/ AND the indexer's own fixture
  trees, so a diff confined to `tools/**` MATCHES this trigger and CANNOT
  move the graph by construction. Two worked examples, both measured
  rather than reasoned: T-054's own branch (a `.ts` file under tools/,
  `index --check` CURRENT before and after) and T-058's merge (the same
  again, two regens byte-identical to the bytes already committed). DO
  NOT NARROW THE WORDING TO CHASE THE WALK — a trigger that restates
  `.nputerignore` goes stale the day that file changes, and over-firing
  is the SAFE direction. **ASK THE GATE INSTEAD OF PREDICTING**: `cargo
  run -p nputer-index -- index --check --root ../..` from app/src-tauri
  answers "did an indexed file move?" in about a second, and it is the
  same command the CI step runs. A regen that changes nothing costs a
  minute and PROVES it; a regen skipped on a guess proves nothing.
  WHAT RETIRED is the obligation to hand-run the byte-comparison
  afterwards: `cargo run -p nputer-index -- index --check --root ../..`
  is a written CI step, and **the INTEGRATOR RUNS IT BY HAND at the
  checkpoint and records the verdict there** — that hand run is the
  confirmation the property actually has TODAY. **The CI step becomes
  the ENFORCING copy at the repo's FIRST PUSH, and not before**
  (T-054-s4, closed here): `git remote` returns ZERO remotes — verified
  at the fourth triage and again at T-078 — and ci.yml has never executed
  a single step on a runner, so anything written here in the present
  tense about "a gate" is written in the FUTURE tense in fact. BE FAIR
  ABOUT WHAT DOES HOLD IT MEANWHILE, because it is considerably more than
  nothing: the regen obligation is retained in full, a failing regen reds
  on its own, deleting the CI step reds
  tools/e2e/tests/workflow-parity.spec.ts by name, and the hand run is
  the same command with the same exit codes. It is a written ritual with
  three independent tripwires — not yet a gate. WHAT DID NOT RETIRE is
  the regen — `--check` DETECTS a stale graph, it never produces a fresh
  one, so the integrator still regenerates and still commits the result;
  a green CI is what will prove they did. WHY THE CHECKPOINT AND NOT THE
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
  fail, RUN its suite, and require the RED. MUTATE ONE SIDE ONLY: the code
  under test OR the assertion, never a literal the two SHARE; and confirm
  the mutated TEXT is what you intended rather than only that a
  substitution COUNT was non-zero. Then restore, and PROVE the
  restoration rather than asserting it: `git show HEAD:<path> | shasum
  -a 256` against the working file, or an empty `git diff -- <path>`.
  RECORD the count and the restoration proof in the notes, the verdict
  or the checkpoint — "133-for-133" is the shape (T-027), "drills run"
  is not. IF a body cannot be poisoned — it asserts a constant, or every
  mutation is one the test already makes — THEN say so and name it,
  because a body that cannot red is the finding. WHY: an assertion that
  cannot fail is indistinguishable from one that passes, and this
  practice caught SIX vacuous assertions in a single night (T-057 fixes
  what it found; this is the rule that found it). WHY ONE-SIDEDNESS IS A
  RULE AND NOT A STYLE NOTE (T-078, measured on the drill's own verifier):
  a global substitution of a message literal over
  `tools/e2e/tests/workflow-parity.spec.ts` reported THREE substitutions,
  applied all three correctly, and left the suite GREEN at 14 passed,
  exit 0 — the literal lives once in the producer and once in each of two
  assertions, so the mutation moved both sides at once and the test still
  agreed with itself. A SYMMETRIC MUTATION PRODUCES A GREEN
  INDISTINGUISHABLE FROM A VACUOUS ASSERTION: the exact failure the drill
  exists to detect, wearing the drill's own costume. The older lesson
  ("count your substitutions, never assume a mutation landed", T-054)
  would NOT have caught it, because three was the true count. The same
  failure one level deeper, the same session: a `perl -0777` mutation of
  a DOC reported one substitution and changed nothing observable, because
  without a UTF-8 output layer perl emitted a raw byte instead of the
  character. The count was right and the TEXT was wrong. So READ THE
  MUTATION BACK — `git diff` it — before you run the suite. It stays a
  DISCIPLINE rather than a gate because nothing can automate "would this
  have
  failed" — which is precisely why it has to be written where a verifier
  reads it instead of remembered. WHAT THE DRILL CANNOT SEE (T-057,
  measured on the card whose own subject was assertions that cannot fail):
  poisoning proves a body RUNS and that its value MATTERS; it does NOT
  prove the body is not a DUPLICATE of another. T-057's replacement
  positive was the same `bank()` call as a test three cases above it —
  same seq, same turn, same prime, same matcher, same expected value,
  differing only in an inert content string, and character-identical once
  that string was rewritten, with the file still green at 58/58 — yet it
  reds under an expected-value poison, so the discipline passed it. It
  kills no mutant of its own: removing the project-rebaseline clause reds
  the switch test and leaves this one green. That is a shape DISTINCT from
  the four catalogued "matcher moved, value fixed" violations, and note
  where the fault lay — the CRITERION named a positive the suite already
  had, so a CARD can specify a duplicate into existence and a faithful
  executor will build it. SO: after the drill reds, ask the second
  question — does any OTHER test already drive this exact call?
  THE TWO SHAPES A VALUE POISON PASSES NOW HAVE ORDINALS (fourth triage,
  2026-08-19; two lanes found one each in the same week and both have
  landed). Cite them by number — other cards do:
  **SHAPE FIVE — the assertion SET has no cardinality or coverage floor,
  so deleting an assertion deletes its own failure.** Measured on
  `tools/e2e/scripts/token-scan.mjs`'s `selftest()` (T-058-s2, absorbed
  by T-080): four deletions applied one at a time each left the selftest
  GREEN at a smaller printed number, and the sharpest removed the only
  positive sample for each of the four TOKEN patterns and stayed green in
  the lint, the selftest and the lane alike. A printed count is not a
  pin. FIVE IS LISTED FIRST BECAUSE IT HAS A MECHANICAL REMEDY: a
  coverage floor per pattern id, or a cardinality pin, makes a deletion
  fail against something that did not move with it — the shape
  `MUST_TOKEN_COVER` already uses one rung up, for the same reason.
  **SHAPE SIX — a body that reds under an expected-value poison while
  killing no mutant another test does not already kill.** Measured on
  `app/test/interview-model.test.ts` (T-057-s1, absorbed by T-072): the
  duplicate positive described above, character-identical to a test three
  cases up once one inert string was rewritten, with the file still
  passing 58 of 58. It is not vacuous in the poison sense, which is
  exactly why the discipline passed it. SIX HAS NO MECHANICAL REMEDY —
  the drill has to ASK. Both are DISTINCT from the four already
  catalogued, which share the one tell these do not: the matcher moved,
  never the value.
- A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL (T-060-s1's sibling
  T-060-s2, written down here at T-078 — the INSTANCE was fixed on
  T-060's branch and the RULE was written in neither this file nor
  method/ — a grep of both for it returned zero hits three triages later,
  which is how a rule goes unwritten while everyone believes it exists;
  ARCHITECTURE describes the GUARD, never how to test one). A test
  that asserts something is REFUSED must first prove the fixture would
  otherwise have been ACCEPTED; otherwise it cannot tell refusal from
  absence. Measured: `assert_eq!(which_in("relbin", adapter), None)` —
  T-060's criterion that a relative PATH element yields no candidate —
  passed with the pre-T-060 VULNERABILITY restored, because
  `relbin/claude` did not exist relative to the test process's working
  directory and both implementations refused it for different reasons.
  COUNTING THE ASSERTIONS WOULD NOT HAVE SHOWN IT; ONLY MUTATING THE
  PRODUCER DID. A bare "expected nothing, got nothing" is satisfied
  equally by refused-for-the-right-reason, refused-for-the-wrong-reason
  and there-was-nothing-there, and only the first is the property. For a
  PATH-SHAPED fixture the control has to be BUILT the way the producer
  builds it, not merely written to look similar — the fixed body in
  `app/src-tauri/src/agent/runner.rs` plants the file under the test's
  own working directory, asserts the ABSOLUTE spelling resolves, and only
  then asserts every relative spelling does not. ITS SIBLING FROM THE
  OTHER DIRECTION, oral tradition until this bullet and stated here so a
  reader meets both: A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT
  PIN THAT CONSTANT (T-063 — every deadline assertion advanced the clock
  BY `STARTUP_DEADLINE_MS`, so the whole family stayed green at
  `8_000_000`; one test now pins the literal and is the only thing that
  reds). One lesson, two faces: an assertion that moves with the thing it
  is checking is checking nothing.
- LIFTING A SAFETY GUARD TO DISCRIMINATE (T-060-s1, written down here at
  T-078 for the same reason — instance fixed, rule absent). A guard test
  needs a discriminating half or "refused" could just mean the fixture
  was broken; but the discriminating half of a SAFETY guard is by
  construction a deliberate REMOVAL of the safety, executed in the same
  process as every other test, with whatever ambient environment the
  developer has. THE STRONGER THE GUARD, THE MORE DANGEROUS ITS OWN
  DISCRIMINATOR. So, both of these, not either: the LIFTED arm SHALL be
  proven to TERMINATE IN A FIXTURE — pointed at one, not merely started
  at one — and the body SHALL assert the guard's STATE before it
  exercises anything. Measured: T-060's first draft of
  `the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
  lifted the guard while `$SHELL` was still the FAILING fixture, so
  resolution did what it is designed to do — fell through to the
  developer's own `PATH`, found the real CLI and executed it, inside the
  test written to prove that cannot happen. Both halves closed it: the
  lifted arm's shell now SUCCEEDS at `command -v` and names a planted
  binary, so the whole resolve stays inside the temp tree; and a
  pre-flight `real_cli_arms_forbidden()` assert fails harmlessly when the
  guard is already broken instead of two statements later on somebody's
  real machine — which is also what makes such a body safe to POISON
  DRILL at all. It applies to every guard this project has — the ACL pin,
  the containment rules, the session-id character class, the cleared
  environment — and most are safe only because their lifted behaviour
  touches fixtures. That is a property to CHECK, never to assume.
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
