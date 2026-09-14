# Commands, packages and CI

Every command this repository publishes, the package it runs from, the order a fresh clone builds in, and the workflow that invokes exactly these.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- Fresh-clone ORDER (T-003, ADR-011): lib/parser FIRST — `npm ci` +
  `npm run build` from lib/parser/ — then set up app/. The app
  depends on `@supertaskr/parser` via `file:../lib/parser`: its build
  needs the parser's dist/ (fails with a clear TS2307 if missing),
  and the symlink resolves the parser's deps via the parser's own
  node_modules, so its `npm ci` must have run.
  **AND SINCE T-317 tools/e2e NEEDS THAT BUILD BEFORE ITS SCRIPTS, not
  only before its suite**: `dispatch-brief.mjs` imports the process
  settings reader from the parser's built browser entry by path (the
  package still declares no dependency on the parser), so a tree with no
  `lib/parser/dist` refuses at load naming this order.

- lib/parser (C-06), run from lib/parser/: `npm ci` ·
  `npx vitest run` (suite) · `npx tsc --noEmit` (types) ·
  `npm run build` (emits dist/, gitignored).
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- app/ (C-05), run from app/: `npm ci` (setup) ·
  `npm run build` (typecheck + frontend build — the fast gate) ·
  `npm test` (vitest — model-store unit tests, T-003) ·
  `npm run tauri dev` (run the desktop app) · `npm run tauri build`
  (package). THE SETUP SPELLING IS `npm ci` AND CI RUNS THE SAME WORDS
  (T-256, absorbing T-216-s6): `npm install` rewrites
  app/package-lock.json, which every lane fence leaves read-only, so it
  dies **exit 243 EACCES** with node_modules already populated and
  nothing warning — measured on three lanes in one night. `npm install`
  belongs OUTSIDE a lane and nowhere else: changing a dependency, or the
  app launcher's own step, where a fresh `npm ci` would destroy a live
  app's node_modules (the relaunch bullet below).

- app/src-tauri (C-05 Rust half + the C-07 workspace), run from
  app/src-tauri/: `cargo test` (watcher/collector unit tests, T-003;
  + supertaskr-index crate suite, T-009 — bare `cargo test` runs both
  workspace crates via default-members) ·
  `cargo run -p supertaskr-index -- index --check --root ../..` (T-014's
  GRAPH-CURRENCY GATE, and a CI step since T-054 — exit 0 current, 1
  STALE, 2 usage, 3 the gate could not run) · `cargo audit` (T-020 —
  RUSTSEC advisories against the exact `=` pins) ·
  `cargo run -p supertaskr-index -- index --watch --root ../..` (keeps the
  graph current headless at the app watcher's 250 ms debounce; it runs
  until stopped, so it is LOCAL ONLY and never a CI step) ·
  `cargo run -p supertaskr-index -- arch --root ../..` (components, observed
  edges and drift flags, read from the COMMITTED graph — a REPORTER
  rather than a gate, so LOCAL ONLY too; `arch drift --fail-on
  undeclared|unmapped|any` is its gating form and stays unwired while
  the registry carries live undeclared edges by design) ·
  `cargo run -p supertaskr-index -- arch cycles --root ../..` (T-127 —
  reads the REGISTRY ONLY, so a stale graph cannot redden it; exit 0
  acyclic, 1 a declared cycle named as a path, 2 called wrong, 3 the
  registry could not be read; ANSWERS ACYCLIC exit 0 since T-127-s6
  (2026-08-29) broke the last declared cycle — the ENFORCING copy is
  `cargo test`'s exact-set census) ·
  `cargo run -p supertaskr-index -- arch blast <path|slug> --root ../..`
  (T-135 — dependents derived from the committed graph at read time, a
  REPORTER like `arch`, LOCAL ONLY). THE `--root` IS
  LOAD-BEARING on all five: the default root is the CURRENT DIRECTORY,
  so without it they look for app/src-tauri/docs/architecture/graph.json,
  and `index --check` then exits 1 — a FALSE RED, now reproduced
  deliberately by four sessions running. IT IS NOT DISTINGUISHABLE BY THE
  HEADLINE, which says STALE either way; read the SECOND line. A false
  red says `committed: MISSING at docs/architecture/graph.json`; a real
  one prints both byte/file/symbol/edge counts and a `+`/`-`/`~` file
  diff naming what moved.

- tools/e2e (the real-input E2E lane, T-020 — the repo's THIRD npm
  package, self-contained per the ADR-011 family), run from tools/e2e/:
  `npm ci` · `npm test` (the lane — Playwright drives the app's dev
  bundle in HEADLESS Chromium with trusted input; workers 1, retries 0,
  no skips) · `npm run typecheck` · `npm run lint:tokens`
  (+ `-- --selftest`; CI's FIRST step — exit 0 clean, 1 the gate RAN
  and found something, 3 the gate COULD NOT run, 2 reserved and
  unused, legended at the end of this bullet) ·
  `npm run lint:docs` (T-090 — the DOCS GATE's NAMED form and a CI step;
  it runs that gate's WHOLE-TREE half and judges no diff, so it answers
  with the four codes the DOCS GATE bullet legends, and the DIFF half
  stays the integrator's hand run) ·
  `npm run capabilities:check` (T-153-s8 — the CENSUS-CURRENCY GATE and a
  CI step. docs/CAPABILITIES.md is GENERATED from the test names in
  tools/e2e/tests/, and CLAUDE.md sends every session to it first on the
  strength of that; until this step existed the census went stale
  repeatedly with no instrument in between — the occasions are
  ENUMERATED on that card. It writes nothing and byte-compares — exit 0
  CURRENT, 1 STALE naming the regeneration command, 2 called wrong, 3
  the gate could not run) ·
  `npm run capabilities` (T-138-s1 — REGENERATES that document, and it is
  the command `--check` names when it reds. LOCAL ONLY and never a CI
  step: run inside the runner a generator rewrites the very file the
  check judges, exits 0 and gates nothing — the known-vacuous keeper
  NORTH_STAR's bar prices as a stop-the-line defect. The regeneration
  lands in a COMMIT, in the SAME commit as whatever moved a test name.
  **WHOSE COMMIT: THE INTEGRATOR'S, AT THE MERGE — the same owner the
  GRAPH REGEN bullet names for the graph** (T-201, absorbing T-218 and
  T-216-s2): since T-210 a lane's fence leaves docs/CAPABILITIES.md
  read-only, so a lane that adds, renames or removes a test body REPORTS
  the stale census in its handoff and the integrator regenerates it in
  the merge commit, before the checkpoint; when the integrator forgets,
  CI's census-currency step reds on that push — e67cb44 on 2026-09-01,
  repaired at cf9d462) ·
  `npm run boot:orphan-drill` (T-061 — the shipped procedure that proves
  the boot check's child-exit path signals its captured process group and
  leaves no orphaned vite listener; LOCAL ONLY, deliberately, and the CI
  bullet says why) ·
  `npm run boot:check` (spawns `tauri dev` and
  asserts the two `[supertaskr]` startup lines; NOT part of `npm test` —
  it opens a real window). Beside a live app, give it a scratch port:
  `SUPERTASKR_BOOT_PORT=14521 npm run boot:check` (T-046 — see PORT RULE;
  1420 is refused, not borrowed). Exit 0 booted · 1 the boot failed,
  with the child's last output quoted · 2 the port is busy · 3 the check
  REFUSED to run before probing or spawning anything. THE ORPHAN DRILL
  ANSWERS IN THE SAME FOUR CODES: 0 clean, 1 the leak, 2 called wrong, 3
  the drill could not run. **CODE 3 HAS TWO REASONS** (T-061-s5):
  `SUPERTASKR_BOOT_PORT` is 1420 or not a port at all, OR the committed
  build config the scratch-port overlay is DERIVED from cannot be read —
  deliberately no fallback for the second, because the only value to
  fall back to is the committed port, 1420. Both refusals happen before
  anything is probed or spawned. THE TOKEN LINT HAS THREE CODES (T-078's
  second row, written at T-080's merge): **0** the gate ran and found
  nothing, naming both corpora and their counts; **1** the gate RAN and
  FOUND something — a hit in the tree, or a selftest failure; **3** the
  gate COULD NOT RUN, so the run is not a claim about the tree at all —
  every throw out of `token-scan.mjs` lands here and the wrapper prints
  `lint-tokens: GATE COULD NOT RUN`. **2** is deliberately UNUSED,
  reserved for `usage` — the meaning `index --check` gives it. The
  AUTHORITY is the frozen `EXIT` object in
  tools/e2e/scripts/token-scan.mjs, which the wrapper IMPORTS rather
  than re-typing (until T-080 the two answers SHARED code 1 — T-058's
  and T-080's cards).
  READ THE
  MESSAGE, NOT THE CODE — the three outcomes look nothing alike.
  THE LANE WRITES INTO TRACKED FILES WHILE IT RUNS, AND ONE OF THEM IS
  UNDER docs/ (T-093): `npm test` plants a control byte into seven
  tracked files across four packages and restores them, sha256-proved
  (the list is owned by tools/e2e/tests/token-scan.spec.ts's *"one
  runtime-built control byte reds all seven first-party roots at exact
  byte offsets"* and is deliberately NOT copied here). docs/ is the tree
  the app's watcher is armed over, so the lane run in the MAIN checkout
  beside a live `npm run tauri dev` writes docs/NORTH_STAR.md twice
  within milliseconds under the human's board. RUN THE LANE IN A
  WORKTREE and it touches nothing the human sees.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- `npx supertaskr <verb>` (T-244, C-02) IS A FRONT, NEVER A FIFTH
  PACKAGE. `node tools/e2e/bin/supertaskr.mjs --help` at the repo root
  lists the verbs; each dispatches to a command this section already
  names and EXITS WITH THE CHILD'S CODE, unchanged — a front that
  summarised an exit could turn a red gate green.
  **THIS BULLET DELIBERATELY CARRIES NO `run from <dir>/:` MARKER AND
  THAT IS NOT AN OVERSIGHT**: the CI-parity derivation reads those
  markers, and giving this one a marker would demand a workflow step for
  a command whose whole job is to run another command CI already runs —
  one cause, two red steps. The shape is the one
  `tools/e2e/tests/workflow-parity.spec.ts` names as invisible by
  construction, chosen here on purpose and pinned by a fixture there.
  WHAT IT ADDS over typing the underlying command is two refusals it
  makes BEFORE spawning anything: a verb needing an install says so with
  the one command that builds it, derived from the four command bullets
  above; and a verb whose script resolves its own repository root is
  REFUSED from an installed copy rather than answering confidently about
  `node_modules/`. THE VERB SET IS NOT TRANSCRIBED HERE — it is the table
  in `tools/e2e/scripts/cli.mjs`, checked against this document, against
  `brief.mjs`'s own arms and against docs/ARCHITECTURE.md's C-02 line by
  `tools/e2e/tests/cli.spec.ts`, which also NAMES the two C-02 verbs
  nothing fronts (`init` is genesis, ADR-017; `verify` is the two-spawn
  bench). TWO VERBS ARE NEW RATHER THAN FRONTS: `undo <card>` reverts a
  card's merge with `git revert -m 1` after listing every later merge on
  the same fence and refusing while one is unnamed, and `merge <card>`
  walks the integrator's ritual in its order and stops with the merge
  STAGED.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/13-surfaces.md (T-290), verbatim.

- One-time dev-tool setup, outside the repo and never a repo dep:
  `npx playwright install chromium` from tools/e2e/ (browsers cache in
  ~/Library/Caches/ms-playwright, ~/.cache/ms-playwright on Linux —
  hundreds of MB, deliberately outside the tree) and
  `command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`
  for `cargo audit`, run from app/src-tauri/ (fetches the RUSTSEC
  advisory DB — the one network-touching command; guarded since
  T-153-s13, because the cargo cache restores ~/.cargo/bin and a
  restored binary once stopped every run at this step).

- CI (.github/workflows/ci.yml) is a thin invoker of exactly these
  commands, ENFORCING since the repo's first push (2026-08-29).
  tools/e2e/tests/workflow-parity.spec.ts DERIVES its expectations from
  the bullets above (T-045): every command they list is a workflow step
  VERBATIM, except the ONE deliberate divergence below — a commented
  mapping in that spec, and a lane failure if either side drifts:
  `npx playwright install
  --with-deps chromium` in place of the one-time local `npx playwright
  install chromium` — the Linux system libs a fresh runner lacks.
  SINCE T-294 CI IS A JOB GRAPH, NOT ONE JOB, AND WHAT IT RUNS IS THE
  OWED SET OF THE PUSHED RANGE (ADR-024 decision 4). The first job spawns
  the blessed gate-runner's own `--owed-set --range <base>..<tip>` arm on
  the runner — cited by description, because that runner is NAMED once in
  this file and a body requires exactly that; it is the SAME derivation
  the push guard requires a token to cover — and every
  leg is a `needs:` on that answer, so a suite the range does not owe is
  a SKIPPED JOB rather than a job that starts and finds nothing to do.
  THE END-TO-END LEG IS SHARDED across runner jobs BY OWNING SPEC
  (T-271's map): one matrix, one runner per shard, and the lane step is
  `npm test -- ${{ matrix.specs }}` — the doc's own `npm test` with that
  shard's spec files appended. The rust leg and the boot check are NEVER
  split and share one runner: their cost is a cargo build that sharding
  would pay N times. The `checks` job — the token lint, the docs gate,
  the types and the census check — runs on EVERY push whatever the range
  owes, because each reads the whole tree rather than a package. ONE RUN
  PER PUSH, KEYED BY ITS COMMIT: the concurrency group is `github.sha`,
  so two pushes hold two groups and neither can cancel the other, and
  nobody waits on the previous run; `cancel-in-progress` stays true and
  now supersedes only a second run over the SAME commit, whose tree is
  byte-identical. THE WHOLE FOUR SUITES RUN NIGHTLY ON MAIN, on a
  schedule trigger — the owed set gives up the CROSS-SPEC RED and that
  is where the class is caught. A RED NIGHTLY OPENS A FINDING naming the
  merge commit the bisection attributes it to, and the bisection is
  `--owed-set` per merge commit in the range since the last GREEN
  nightly: the run prints that recipe and a seat files the card, because
  filing it needs a write grant this workflow deliberately does not
  carry.
  The token lint runs as `npm run lint:tokens -- --selftest`
  then `npm run lint:tokens` from tools/e2e — the job's FIRST step,
  ahead of every `npm ci`, because `npm run` needs no installed
  node_modules and `token-scan.mjs` is zero-dependency — and two steps,
  because `--selftest` short-circuits the walk. THE DOCS GATE runs as
  `npm run lint:docs` from tools/e2e and CANNOT hold the token lint's
  position — do not "fix" the ordering (T-090): `docs-gate.mjs` imports
  `yaml`, the SAME package lib/parser parses task cards with so a block
  parses for both or for neither (T-057), so it sits immediately after
  tools/e2e's `npm ci`; `scripts/docs-scan.mjs` stays zero-dependency
  so the constraint belongs to the wrapper alone. The boot check runs as
  `xvfb-run -a npm run boot:check` from tools/e2e — a real wrapper,
  since a headless runner has no display, around the documented command.
  CI also runs
  `command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`
  (the dev-tool setup above — guarded: the cargo cache restores
  ~/.cargo/bin and a restored binary is the happy path, T-153-s13), and
  it deliberately does NOT run `npm run tauri dev` or
  `npm run tauri build` — one opens a window and the other packages a
  bundle; the xvfb boot step covers the dev path — nor
  `cargo run -p supertaskr-index -- index --watch --root ../..`, which runs
  until stopped, nor `cargo run -p supertaskr-index -- arch --root ../..`,
  which reports rather than gates, nor
  `cargo run -p supertaskr-index -- arch cycles --root ../..`, which
  answers ACYCLIC since T-127-s6 (the enforcing copy is `cargo test`'s
  exact-set census, T-127), nor
  `cargo run -p supertaskr-index -- arch blast <path|slug> --root ../..`,
  which reports like `arch` (T-135), nor `npm run boot:orphan-drill`
  (T-061-s5, ruled here): a REGRESSION drill rather than a release
  gate, and it doubles the boot step's cost.
  THE CENSUS-CURRENCY GATE runs as `npm run capabilities:check` from
  tools/e2e, immediately AFTER `npm run typecheck` (T-153-s8): not in
  the token lint's bare-checkout position, because it IMPORTS a `.mjs`
  out of tests/ where scripts import `yaml`; after `npm run typecheck`
  because the generator reads the same spec files `tsc` validates. CI deliberately does NOT run `npm run capabilities`,
  the GENERATOR: run in the runner it rewrites the file the check
  judges, exits 0, and certifies its own output. The regeneration stays
  a hand run, and `--check` prints it by name.
  ONE TYPOGRAPHIC RULE GOVERNS EVERY EDIT TO THIS SECTION, and it lives
  in THIS bullet because this is what the next editor of ci.yml opens
  (T-054, promoted at T-078): the four per-package bullets separate
  their commands with U+00B7 MIDDLE DOT, and the derivation reads
  separated segments only until the first one that does not open with a
  backtick. **A MIDDLE DOT therefore belongs BETWEEN commands, or AFTER
  the last one — NEVER inside a command's parenthetical**, where it ends
  the list early and every command behind it quietly leaves CI parity;
  this clause NAMES that character without typing it, the section's
  in-parenthetical legends use commas, and the tools/e2e bullet's own
  `Exit 0 booted` legend sits after its LAST command.
  **WHAT IS
  SILENT IS A SHAPE, NEVER A DIRECTION**: a command the derivation
  cannot SEE — an INDENTED bullet and a fenced block, both named by
  `structuralProblems`, and a command in a bullet carrying no
  `run from <dir>/:` marker, invisible by construction and pinned by a
  fixture in the spec. **So a NEW command is still the edit to ENUMERATE
  rather than eyeball.** Change a command here, change it there, or the
  lane fails.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.
