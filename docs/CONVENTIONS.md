# Conventions

Compacted under ADR-019 (docs/rooms/governing-docs.md): every bullet
is a RULE with its provenance citation and at most one worked example;
the instance narratives — re-measurements, second examples, the story
of a rule broken after it was written — live on the card or record the
citation names. Landings: 2026-08-27 (the record is
docs/checkpoints/2026-08-27-adr019-compaction.md), T-162 (2026-08-30)
and T-236 (2026-09-02, whose pre-compaction text is
`git show 3170247:docs/CONVENTIONS.md`).

## Build & test
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
  `npm run build` (emits dist/, gitignored). The suite's smoke test
  parses this repo's live docs/ tree and requires zero issues.
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
- AUDIT GATE POLICY (human ruling 2026-08-16, closing T-020-s2): the
  gate is VULNERABILITIES — they exit non-zero and stop the lane
  (proven: a crafted lock pinning `time 0.1.44` → exit 1,
  RUSTSEC-2020-0071). Informational warnings stay NON-gating. The
  baseline, audited 2026-08-16 over 472 locked crates with cargo-audit
  0.22.2: **0 vulnerabilities / 17 informational warnings**, all
  transitive under Tauri v2's GTK3/glib stack and nothing ours to
  re-pin. Warning-count drift is reviewed BY EYE against that baseline,
  not enforced by exit code; `--deny warnings` would red CI permanently
  for no actionable signal.
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
  and T-080's cards). THE CATCH IS TOTAL AND IS NEVER A RESCUE: exit 3
  still FAILS the step, and `process.exit` inside the scanner is not
  interceptable by the wrapper, so a genuine hit cannot be relabelled as
  a gate that did not run. ONE HOLE REMAINS, NAMED (T-080-s4): a parse
  error in the gate's own two files means Node never links them, so the
  wrapper's `try` never runs and the process exits 1, not 3. READ THE
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
  STAGED. Publishing the package is @human's (T-266); the proof that it
  installs is a local `npm pack` tarball, run inside the lane.
- THE BLESSED GATE-RUNNER (T-202): `node tools/e2e/scripts/gate-run.mjs
  parser|app|rust|e2e` from the repo root is the ONE spelling for a
  graded reading; its `gate-verdict` line carries the exit code, the
  BODY COUNT and the ref. READ THE COUNT, NEVER THE CODE.
  **AND SINCE T-271 ONE SEAT MAY GRADE NARROWER THAN A LEG — THE
  EXECUTOR, WHILE IT ITERATES, AND NO OTHER** (the browser leg is ten of
  the battery's eleven minutes, measured on T-224's fix passes). Give
  that command `e2e --owning <changed path>...` and it grades ONLY the
  spec files that OWN those paths: every spec that reads a changed file,
  over a STATIC IMPORT GRAPH rooted at the specs and NEVER a spec's
  name, plus the docs-walk bodies the DOCS GATE's own reader map names
  when a docs path moved. Same refusals, and a verdict line naming the
  SUBSET beside its body count rather than the leg's name alone.
  **THE VERIFIER'S ONE RUN AND THE INTEGRATOR'S RUN BEFORE THE PUSH ARE
  THE OWED SET FOR THEIR OWN RANGE** — `--range <base>..<tip>` at the
  bench's tip, `@{upstream}..HEAD` at the push — and NOT this hand-typed
  form: a cross-spec red, the class T-264's executor found four of by
  running everything, must land inside the lane's ceremony rather than
  on merged main where the answer is the revert play, and the range form
  is what keeps that true while costing the range's own paths instead of
  the whole battery (T-280, superseding this bullet's four-legs sentence
  by the later @human ruling of 2026-09-09; the bench's report names the
  set and its derivation). **THE HAND-TYPED FORM STILL MINTS NOTHING**:
  `--owning`'s subset verdict is worded `SCOPED-GREEN` or `SCOPED-RED`,
  which the push guard REFUSES as a token, so a scoped run POISONS a
  stale green rather than leaving it standing. The difference is who
  chose the paths — a seat, unaudited, against two commit ids the guard
  re-derives for itself. A changed path the derivation CANNOT PLACE is
  exit 2 naming the path, and the full leg is owed: this form can only
  ever be wrong by running too MUCH. The other three legs are seconds
  each and are still run whole when they are owed at all.
- **AND IT NOW MINTS A TOKEN THAT GATES YOUR PUSH** (T-203). Each run
  also writes that same verdict to a token beside the fence manifest in
  `.supertaskr/`, keyed on `HEAD^{tree}` per suite, and `push-guard.mjs`
  refuses a push whose four suites are not all GREEN against the tree
  being pushed. **So the battery is run LAST, after every commit** —
  otherwise the token names a tree that is no longer yours. The refusals
  are distinct and each prints its remedy: `token-incomplete` (a suite
  never ran), `token-red` (a suite RAN AND FAILED), `token-unmeasured`
  (the runner DECLINED TO GRADE — no toolchain), `token-stale` (wrong
  tree), `token-unkeyed` (tracked files were dirty when it was minted).
  **A checkout without cargo cannot push, deliberately**: an unrun suite
  is unmeasured, and that is disclosed at the refusal rather than hidden
  behind a wrong label.
- **AND SINCE T-280 A PUSH OWES THE SET ITS OWN RANGE OWES, NOT THE
  BATTERY BY DEFAULT.** About a dozen four-suite batteries ran on the
  integration checkout in one night of 2026-09-09 — roughly 3.5 machine
  hours, two of them colliding on the solo lock — and around half were
  for commits that moved no source under any package: dispatch stamps,
  card promotions, a checkpoint, a guide page. **THE OWED SET IS
  DERIVED, NEVER LISTED**, by one function with three arms composed:
  the PACKAGE ROOTS (each graded suite's own `cwd` in the runner's
  registry, longest prefix wins, plus the `file:` dependency edges read
  off the manifests — so a change under `lib/parser/` owes the app suite
  too); the STATIC IMPORT GRAPH rooted at the spec files (T-271's, which
  narrows the end-to-end leg to the specs that own the changed paths);
  and the DOCS GATE's own reader map, whose readers are FILES and are
  placed through those same package roots — which is how a document read
  by the parser's census owes the parser suite with nobody writing that
  down. Give the blessed runner `--range <base>..<tip>` and it grades
  exactly that set and writes the token with the set, the range and the
  INPUTS the derivation read. **THE PUSH GUARD RE-DERIVES THE SAME SET
  FROM THE PUSH'S OWN RANGE** — `@{upstream}..HEAD`, both endpoints
  resolved to object ids, the upstream checked to be an ANCESTOR because
  THE RANGE RULE below bans a two-dot diff between divergent tips — by
  spawning that same function rather than holding a second copy of it,
  and refuses a token whose measured set does not cover it as
  **`token-partial`**, naming the missing suites and the missing SPEC
  FILES. Additive: no earlier reason is renamed, and an entry that
  recorded no scope graded the whole leg and covers any subset.
  **IT FAILS CLOSED, AND THAT IS THE WHOLE SAFETY ARGUMENT.** A path
  under no package root that no spec reaches and the docs gate cannot
  place, a reader the map cannot put in a package, an import edge that
  will not resolve, no upstream to range against, a runner this checkout
  does not have, an answer the guard cannot parse — every one of them
  makes the owed set THE WHOLE BATTERY, with the reason recorded in the
  token and printed at the refusal. **AND "THE WHOLE BATTERY" MEANS FOUR
  WHOLE LEGS, WHICH IS A CLAIM ON TWO AXES AND NOT ONE.** The SUITE axis
  is which legs ran; the SPEC axis is whether the one scopable leg ran
  whole. This arm gave the range form the power to mint a plain `GREEN`
  for a NARROWED end-to-end leg — recording what it graded in the
  entry's `scope` — so "four suites GREEN at this tree" stopped implying
  "the battery ran". A token whose end-to-end entry carries a `scope` is
  therefore refused as **`token-partial`** EVEN WHERE NO RANGE COULD BE
  DERIVED: a scoped GREEN says nothing failed among the spec files it
  ran, and it never says the leg ran. That sentence cost a rejection —
  the fallback shipped reading the verdict word alone, and a bench
  measured it passing a push whose end-to-end entry had graded 16 of 39
  spec files. This mechanism can only ever be wrong by owing too MUCH.
  A docs path NOTHING reads is the one positive
  empty answer: the reader map is derived from the whole source corpus,
  so "no code suite reads this document" is a measurement, not a gap —
  and it is exactly the case the dozen wasted batteries were.
  **CI STILL RUNS THE WHOLE BATTERY AFTER EVERY PUSH**, on a machine
  that is not yours, and `workflow-parity` keeps it on four legs: the
  local rule narrows what a SEAT must measure before pushing, and
  narrows nothing about what the runner then measures.
- **THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314, AND THE BYPASS THAT
  LEAVES IS CLOSED BY PROCEDURE** (ADR-025 decision 3, approved by the
  owner on 2026-09-12 with the v1 limitation accepted the same day). `.claude/hooks/pre-push` is a git `pre-push` hook, installed by
  `brief.mjs --take-seat` by pointing `core.hooksPath` at the tracked
  hooks directory — refusing BY NAME, and changing nothing, where a
  different hooks path is configured, where the checkout's own active
  hooks would be deactivated, or where the only way through would be a
  SHARED configuration change in a repository with other worktrees. It
  judges EACH PROPOSED UPDATE on the two objects git hands it, the
  remote's OLD object and the local NEW one: the range is
  `<old>..<new>`, the token is required to match the PUSHED commit's
  tree — an ADDITIONAL binding and never a substitute — and the
  range-derived owed set and the unchanged-tree check are asked exactly
  as the bullets above ask them. One unqualified update refuses the
  WHOLE push, because a `pre-push` hook has one exit code for the whole
  invocation; an update shape this guard has no rule for, a deletion or
  a ref outside `refs/heads/`, is refused by name. The `PreToolUse`
  guard above is UNCHANGED and stays as a second net.
  **A DELIBERATE BYPASS IS CLOSED BY PROCEDURE IN V1, WHICH THE OWNER
  ACCEPTED ON 2026-09-12 AND WHICH IS WRITTEN HERE RATHER THAN
  PRETENDED AWAY**: `git push --no-verify` skips every client-side hook
  by git's own design, and a push from a checkout where the hook was
  never installed runs nothing at all. Neither is closeable from inside
  a hook — a client-side hook is advice the client can decline — so
  what closes them is the procedure: take the seat, which installs it,
  and read the seat verbs' own line, which reports a checkout without
  the hook as UNGUARDED. **THE RUNNER'S OWED SET ON THE PUSHED RANGE
  REMAINS THE PUBLIC CHECK**, on a machine that is not yours: the local
  hook narrows the window in which an ungraded tree can reach the
  remote, and replaces nothing about what the runner then measures.
  **A PROTECTED RECEIVING GATE AND CREDENTIAL ISOLATION ARE SEPARATE
  PROPOSALS** (T-310) — they are what would close the bypass at the far
  end, where declining is not the client's to do, and they are not part
  of this one.
- **AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back FIRST. The
  rule was earned, recorded ONLY in checkpoint records, and then broken
  three times by seats able to quote it: the T-146 class, and the reason
  a MECHANISM belongs in a governing document while a record takes the
  INSTANCE.
- **A GATE READ THROUGH A PIPE REPORTS THE PIPE**, so a hard failure
  reads as a clean pass: `false | tail -1` exits 0, and `pipefail` is not
  on by default. **Redirect to a file, capture `$?`, THEN look.** One
  seat read exit **254** as green four times. Related and load-bearing:
  **there is no root `package.json`** — every script lives in
  `tools/e2e/`, `app/` or `lib/parser/`, so a bare `npm test` at the root
  fails in a way that looks like a suite result.
- **PASS THE DOCS GATE SEPARATE LITERAL PATHS.** zsh word-splits an
  unquoted COMMAND SUBSTITUTION but NOT a variable, so handing it a
  variable gives the gate every path as ONE argument and it answers
  *"1 path(s)"* — plausible, and wrong.
- **A LINE NUMBER IS A FIGURE** — a coordinate in a mutable object that
  fails SILENTLY, still pointing at a real line, just the wrong rule.
  Two citations were falsified by merges in a single night, both true
  when written. **Cite a rule by its ORDINAL and its own capitals.**
- **AND A DISTANCE TO A MOVING TIP CANNOT BE STATED AT ALL IN A DOCUMENT
  COMMITTED TO THAT TIP'S BRANCH** — with or without a ref, because
  **pinning is itself a commit and the commit moves the number**: a
  sentence measuring 348 shipped at 349, the delta being exactly the
  commit carrying it. **THREE FORMS SURVIVE: both endpoints pinned to
  fixed shas, the derive command with NO answer beside it, or
  omission.** A past reading bound to a named occasion is HISTORY and
  cannot go stale; a present-tense value can. **AND HERE IS WHY THE
  PEOPLE WRITING THIS RULE DOWN KEEP BREAKING IT**: `main` is the
  natural way to write "and it is still true NOW", and "now" is the one
  thing a committed document cannot hold — five instances landed on one
  card in one sitting, twice inside a table built to demonstrate the
  rule. So when you reach for a moving symbol, you are reaching for a
  tense, not a ref: say `currently` in words with NO figure beside it,
  or pin the sha and let the sentence be about that commit forever.
- **THIS SHELL'S `grep` IS A SHIM.** It carries `-I` and REJECTS
  `--include`, so a habit-formed invocation fails on a flag that works
  everywhere else. Use `command grep`; sweep NULs with `perl -0777`.
- **A PUSH NO LONGER CANCELS THE RUNNING CI JOB (T-294), AND NOBODY
  WAITS ON IT.** ci.yml's concurrency group is the COMMIT, so two pushes
  hold two groups: each pushed tree gets its own run and its own verdict.
  **T-237's REFUSAL IS RETIRED WITH THE CANCELLATION IT WAS ABOUT**, and
  so is `SUPERTASKR_CANCEL_CI` — there is nothing left to acknowledge, and
  a variable that clears a refusal nothing raises is the override hatch
  this guard ships none of. The guard now ANNOUNCES a run in flight,
  naming it and its head sha: **two verdicts are live at once and they
  arrive in whatever order they finish**, so read them BY HEAD SHA and
  never by their order. Batching still buys something — with T-203's
  token gate each push owes its own range's owed set — but it buys
  tokens, not a queue.
- **AND THEN READ IT.** `gh run list --limit 5` after a batch, and
  `gh run view <id> --log-failed` on anything red (`--attempt 1` when a
  red was re-run green). **Since T-237 the guard ANNOUNCES the newest
  verdict at every push** — run id, failing step, and whether the pushed
  tree reaches that step's package — and discloses an unreachable `gh`;
  the reading is still yours, and it buys nothing if nobody looks: main
  sat RED for roughly five hours across two failures while a seat pushed
  over both, reporting "all four suites green" — true locally, and not
  the claim that mattered (the 2026-09-01 records). **A LOCAL BATTERY
  AND CI ARE DIFFERENT MEASUREMENTS AND ONLY ONE OF THEM RUNS ON A
  MACHINE THAT IS NOT YOURS.**
- **NEVER TYPE A PATH YOU CAN DERIVE.** `find`, `git ls-files`, or the
  `scripts` block of the relevant `package.json` answers "where does this
  live" in one command. Three paths were INVENTED in a single sitting,
  one of them inside a VERIFIER'S BRIEF, so an agent spent part of its
  blind phase correcting its own instructions; each surfaced as an exit
  1 that was a stack trace rather than a verdict. **And this bullet is
  itself pinned**: the runner is NAMED once in this file and a body
  requires exactly that, so cite it by description here rather than by
  filename.
- **FIT A BYTE-BANDED DOCUMENT IN ONE WRITE, NOT IN A LOOP.** Draft into
  a scratch file, `wc -c` it, cut to the target, THEN write —
  `docs/STATE.md` was once edited SEVEN times in one sitting to fit its
  warn line, every edit re-triggering the specs that read it. **And when
  it will not fit, the answer is not a smaller sentence**: a MECHANISM
  belongs in a governing document, a record takes the INSTANCE, and
  shaving words is how a rule ends up in neither (T-146, T-225).
- **RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT BEFORE YOU BELIEVE
  IT.** A local green proves it passes *on the machine that wrote it*,
  which is the weakest claim available. Five variables reproduce a
  runner's git environment — no global identity, no `init.defaultBranch`,
  nothing this developer configured years ago, and no identity git
  invented for itself:

      GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
        GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=user.useConfigOnly \
        GIT_CONFIG_VALUE_0=true npm test

  **THE LAST THREE ARE LOAD-BEARING AND THE FIRST TWO CANNOT DO THEIR
  WORK** (T-239-s4's class, measured at `0f6b37f`; published by T-256):
  the two `GIT_CONFIG_*` variables suppress config FILES only, and with
  no configured identity git AUTO-DETECTS one from `getpwuid` and the
  hostname, refusing only where it judges the result bogus — which is a
  property of the HOST. On a hostname carrying a dot git reads a domain
  and COMMITS, so the two-variable recipe answers GREEN here and
  reproduces no runner red; a runner's hostname carries none and git
  exits **128**, *"Please tell me who you are"*.
  `user.useConfigOnly=true` is git's own switch for *do not
  auto-detect*, and the `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` triple is
  how one key reaches every git a SUITE spawns (`-c
  user.useConfigOnly=true` is the spelling for a single command).
  **AND UNSET ANY `GIT_AUTHOR_*`/`GIT_COMMITTER_*` YOU CARRY** —
  measured: they outrank the switch and hand the commit an identity
  anyway.
  It would have caught both of the CI reds this rule was written from,
  in seconds, before either push. A suite green here and red there is
  not flaky; it is measuring the machine. **DO NOT CLOBBER `HOME` TO GET
  THERE.** The first version of this rule did (`HOME=$(mktemp -d)`) and
  reddened 54 browser bodies, because Playwright caches its browsers
  under `~/`: git's config and its auto-detected identity are the whole
  of what is wanted, and the wrong recipe was caught by running it —
  this bullet's own point applied to itself, twice now.
- **PIN THE DEFAULT BRANCH IN EVERY GIT FIXTURE**: `git init -b main`,
  never bare `git init`. `init.defaultBranch` is MACHINE config — this
  developer's says `main`, the CI runner's says `master` — so an
  unpinned fixture builds a different repository on each, and the
  landing gate then resolves a different ref, judges a different range
  and reaches a different verdict. Green here, red there, and the diff
  explains nothing; the asymmetry between the fixtures that pinned it
  and the three new ones that did not is what made it look like a
  platform bug.
- One-time dev-tool setup, outside the repo and never a repo dep:
  `npx playwright install chromium` from tools/e2e/ (browsers cache in
  ~/Library/Caches/ms-playwright, ~/.cache/ms-playwright on Linux —
  hundreds of MB, deliberately outside the tree) and
  `command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked`
  for `cargo audit`, run from app/src-tauri/ (fetches the RUSTSEC
  advisory DB — the one network-touching command; guarded since
  T-153-s13, because the cargo cache restores ~/.cargo/bin and a
  restored binary once stopped every run at this step).
- **THE DISPATCH RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE
  MANIFEST BACK, then cut the next.** T-209's guard refuses a dispatch
  against a lane whose fence it cannot read — *an unread fence is not
  "disjoint from everything"* — and refused four at once when a seat cut
  all four before arming any. **AND STAMP `status: building` BEFORE YOU
  CUT** (T-226): cards that stamped after the cut met a three-way
  conflict at the merge that cards stamped before did not. Moved here
  from docs/STATE.md — a MECHANISM belongs in a governing document
  (T-146).
- **E2E PORT — DERIVE IT PER LANE: `SUPERTASKR_E2E_PORT=15000+<card number>`.**
  The default 14520 is MACHINE-WIDE, so every concurrent lane takes the
  same one; `E2E_PORT` binds NOTHING. `lsof` to zero rows before binding,
  and never 1420. Third member of this family, beside the SCRATCH RULE and
  the PORT RULE, one class and one remedy — **a construction beats a
  check** (lane-protocol rule 4, T-217).
- **SCRATCH RULE — NAME EVERY SCRATCH FILE FOR THE LANE THAT OWNS IT**
  (`<purpose>-<card id>.<ext>`, e.g. `battery-T-216-s1.sh`). **The
  scratchpad is ONE directory shared by every seat a session spawns**, so
  a defaulted filename is a machine-scoped surface exactly like a port,
  and `method/lane-protocol.md` rule 4 already rules the class — *derive
  from the lane, never default*; the spelling is here because the class
  was ruled and the spelling was not, the same gap the PORT RULE below
  closes for ports. Measured (T-216-s5): an executor and a verifier each
  wrote `battery.sh`; the executor drove the VERIFIER'S bench at the
  verifier's ref, and `gate-run`'s solo lock, refusing two legs and
  naming the holding pid, was the only thing in the tree that recorded a
  second runner at all. **The collision is symmetric and the fault is
  the DISPATCHER'S**: whoever hands two seats one directory owns it.
- **THE VERIFIER'S BENCH IS TWO SPAWNS, AND THIS BULLET IS THE
  SPELLING, NEVER THE SHAPE.** `method/roles/orchestrator.md` 5d states
  the shape once — phase 1 as its own spawn with no file, git or shell
  tools, what is pasted into it, what it may return — and this bullet
  carries only what 5b leaves to a project: the names and the commands.
  Phase 1's return is SAVED, under the SCRATCH RULE above, as
  `attack-set-<card id>.md`; a defaulted name is the collision that rule
  exists for and two benches at once is when it happens. Hash it the way
  the POISON DRILL below already hashes — `shasum -a 256 <file>`, and
  there is no `sha256sum` on this platform. The verdict appended to the
  card CITES that digest on a line of its own, `attack set:
  sha256:<hex> (<file>)`, so a later reader re-runs one command and gets
  a yes or a no instead of an impression; a REFUSAL is saved, hashed and
  cited identically, because a bench that returned a question is a bench
  whose answer somebody has to be able to find. **A verdict whose cited
  digest does not match the saved file is REFUSED and the pass is
  re-run** — `MF-09` in the method eval gate holds that refusal and
  DEMONSTRATES it, running the comparison against three implementations
  that lack the property (a presence check, a prefix compare, a
  fail-open missing-file branch) and requiring each to be caught. **THE
  WIRING LANDED WITH `T-205-s1`**: `node
  tools/method-evals/verdict-digest.mjs` hands every `attack set:` line
  on the board to MF-09's judge — VERIFIED, REFUSED (exit 1), or
  UNAVAILABLE (exit 3, never a pass: a bare filename and no root named
  at the call) — and `MF-10` runs it in this gate over the board and
  over committed fixtures. **WHAT IS STILL A HAND STEP IS REACHING THE
  SCRATCHPAD**: the checker takes roots only from the call — `--scratch
  <dir>`, repeatable, or `SUPERTASKR_ATTACK_SET_DIR` — never a default
  (rule 4). Do it by hand at the merge — the landing card as the
  argument, `--scratch` on the dispatching session's scratchpad, exit
  read unpiped — until `T-205-s6` gives sealed sets a home in the tree.
- **THE SEAT PROPOSES BEFORE IT RECORDS, AND THIS BULLET IS THE
  POINTER, NEVER THE RULE** (T-307, 2026-09-10). An entry for a room or a
  decision record is shown to the owner in the conversation, verbatim as
  it will be written, and appended only on the owner's yes; the entry
  paraphrases the ruling and dates it, never the owner's words, and the
  owner appears as the owner. The rule is stated once, in
  `method/roles/orchestrator.md` 8b and `method/rooms/ROOM-FORMAT.md`
  (the decision template carries it because it rides the genesis kit and
  the room format does not); MF-11
  (`tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs`) holds it
  over entries dated on or after 2026-09-11 — the day after the rule
  landed, because the sitting that asked for it wrote six entries that
  day and records are never restyled. Cards, checkpoints, STATE and the
  seat's ledger are the seat's own records: written, and nobody asked.
- PORT RULE: 1420 belongs to the human's live `tauri dev`. The lane
  runs its own vite on `SUPERTASKR_E2E_PORT` (default 14520),
  `reuseExistingServer: false`; setting it to 1420 THROWS at config
  load by design, and the boot check bind-probes its port and aborts
  (exit 2) if anything holds it. The boot check moves off 1420 with
  `SUPERTASKR_BOOT_PORT` (T-046; default 1420, so unset is exactly the old
  behavior), which also threads the matching `--config` — `devUrl` AND
  `beforeDevCommand` with `--strictPort` — through to `tauri dev` as
  CLI flags; tauri.conf.json is never edited. Setting `SUPERTASKR_BOOT_PORT`
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
  whether it is held** — two agents did on 2026-08-19, harmlessly and
  unnecessarily. The prohibition is on the syscall, not the intent:
  holding 1420 for a sub-millisecond window to prove it is busy is still
  taking 1420 from the human. The rule above governs the LANE's tooling,
  which is why this is stated separately — it governs the hand.
  **THAT SENTENCE IS WHERE THE LANE/HAND DISTINCTION IS STATED, AND IT
  IS LOAD-BEARING** (T-093): the hand's other rules are gathered in
  A CITATION NAMES A SYMBOL, NOT A LINE under Gotchas, and this clause
  is the pointer that keeps them findable. Two more sit here, because
  they are about this command and how it gets typed.
  **NEVER PUT A BACKTICK INSIDE A SHELL STRING** — single-quote a
  command name, or omit it; a heredoc quoted as `<<'EOF'` suppresses
  substitution too. In `sh`, `bash` and `zsh` a backtick is COMMAND
  SUBSTITUTION, so this repository's own house style, a command name in
  backticks, IS the hazard: copying that spelling into a shell LABEL is
  the natural motion and the one motion that executes, SILENT when the
  substitution succeeds (T-082's own executor started a real model turn
  that way). Same precedent as the 1420 probe: the rule is on the
  SYSCALL.
  **`lsof` IS THE AUTHORITY AND A `bind()` PROBE IS THE CONFIRMING HALF,
  NEVER THE PRIMARY.** On a port holding client-side TIME_WAIT peers,
  `lsof` returns ZERO ROWS while a plain `bind()` without `SO_REUSEADDR`
  still fails EADDRINUSE (a real false red, on port 14768); and
  UNFILTERED `lsof` is equally blind, since TIME_WAIT sockets have no
  owning process, so dropping `-sTCP:LISTEN` buys nothing. For 1420
  there is no bind half at all — read the port and stop.
  THE FACT THEY WERE DEMONSTRATING, RECORDED SO NOBODY DEMONSTRATES IT
  AGAIN: the human's vite listens on **`[::1]:1420` — IPv6 loopback —
  and nothing listens on IPv4**, so an IPv4-only probe of 1420 comes
  back FREE while the app is running. **A free IPv4 probe is not
  evidence the app is down.** `tauri-boot-check.mjs` probes `::1` THEN
  `127.0.0.1` and carries a comment naming this hazard; that is the
  shape to copy, and scratch ports must be probed on BOTH stacks.
- CI (.github/workflows/ci.yml) is a thin invoker of exactly these
  commands, ENFORCING since the repo's first push (2026-08-29).
  tools/e2e/tests/workflow-parity.spec.ts DERIVES its expectations from
  the bullets above (T-045): every command they list is a workflow step
  VERBATIM, except the ONE deliberate divergence below — a commented
  mapping in that spec, and a lane failure if either side drifts:
  `npx playwright install
  --with-deps chromium` in place of the one-time local `npx playwright
  install chromium` — the Linux system libs a fresh runner lacks. IT IS
  AN ENVIRONMENT DIFFERENCE, and that is the whole list (T-054 and
  T-045-s1 closed the two that were only CI spelling a documented
  command twice; T-256 closed app/'s install).
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
  `Exit 0 booted` legend sits after its LAST command. THE COST is a
  DELTA of FIVE exposed commands (T-054, T-078, ADR-019 phase 5).
  AND THE TRUNCATION IS NOT MOSTLY SILENT: the derivation runs in BOTH
  directions, so a command the SPEC claims and the doc stops exposing
  reds BY NAME, and **a command the DOC gains that the spec does not yet
  claim is the case it is LOUDEST about** (the sentence that once said
  the opposite here is retracted, T-090 absorbing T-084-s2). **WHAT IS
  SILENT IS A SHAPE, NEVER A DIRECTION**: a command the derivation
  cannot SEE — an INDENTED bullet and a fenced block, both named by
  `structuralProblems`, and a command in a bullet carrying no
  `run from <dir>/:` marker, invisible by construction and pinned by a
  fixture in the spec. **So a NEW command is still the edit to ENUMERATE
  rather than eyeball.** Change a command here, change it there, or the
  lane fails.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  supertaskr-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.31) and noted here.
  **A VERSION'S NOTE HERE IS ITS DATE, ITS CARD AND ITS THEME; WHAT
  MOVED IS THE RELEASE'S OWN RECORD** (ADR-019's law applied to this
  changelog at T-162): the per-clause itemisation is RECORD-shaped, and
  the AUTHORITY for what a version says is `method/` itself at that tag.
  v0.1.31 (T-322, 2026-09-14) — the UNATTENDED-OPERATION release: a rejected verdict or a CI red is attributed before anything acts; a repair continues on evidence and parks with a wake condition; the health check is specific to the action; a quota refusal becomes a recorded retry instant (the wait verb gains a wait-until-instant form); a reserved decision becomes a marked question entry the order and the cut read; the return brief (`brief.mjs --since`) derives from the records and the runner's runs; the keep-awake rule lands and the stop list names only the grant's stops.
  v0.1.30 (T-143-s5, 2026-09-14) — the STALENESS-BY-CREATION release: the docs gate's staleness derivation (staleStateRecords, the one helper the docs gate and the push checks consume) compares a checkpoint record against the commit that CREATED it rather than its latest touch, so an append to an already-checkpointed record no longer demands a STATE commit whose only content is a clock; a record created without its STATE regeneration still reds by name, the same-commit tie still passes, the reading stays committed history, and a record git names no creating commit for falls back to its latest touch; docs-protocol.md rule 4 argues the rule once, both halves — the creation obliges, never every later touch, and an amendment that changes a fact or a hazard the state document summarises still updates it, conduct no program keeps.
  v0.1.29 (T-324, 2026-09-14) — the ADMISSION release: every admission the arm makes — the lane cut, a child start, a re-entry or continuation, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; an admission is explicit (a card the grant names) or derived (a repair the recovery policy allows, bound to its parent work and the failure evidence); the three approval modes and the two recovery values are enforced at those boundaries, a pause distinguishes new work from the admitted candidate's verification and integration, optional limits are read and reported as advisory and enforced by nothing, a successor coordinator inherits the grant from the block; the dispatch block's switches become operational in the process schema and the orchestrator's step 5 says a dispatch inside the current grant is approved by the grant.
  v0.1.28 (T-319, 2026-09-14) — the DISPATCH BLOCK release: the runtime template gains an optional dispatch block — the approval mode (each, until a named card, standing), the recovery policy (none, repairs) and the grant that sets them with its revision, order, endpoint, card blobs, optional advisory limits, revocation and history — declared once in the process schema as its own section of sixteen rows, every row labelled declarative because nothing admits or refuses by it until T-324; the parser library's process-settings module reads the block through the pure entry as one typed value validated against the declaration, a named refusal and never a partial value, with the explicit no-grant state (approval each, recovery none, no grant, revision 0) when the block is absent; the settings reference renders the section from the declaration; this project's own template carries no grant.
  v0.1.27 (T-298-s3, 2026-09-14) — the XS release: the size vocabulary gains XS in the parser's legal set and the task format's frontmatter block, preserving S, M and L, so the bounded tier the tier table selects on XS is reachable end to end from a card that lives in the tree; the ceremony table gains an XS row restating the bounded line (executor only, the keeper scoped, the push owing its range), written lightest-first; the lightest ceremony row and the tier table's bounded size are pinned as one invariant read from both documents rather than a typed letter.
  v0.1.26 (T-299-s6, 2026-09-13) — the LABELS release: every process switch carries an implementation label, `operational`, `manual` or `declarative`, with a manual switch's action beside it; an operational label is proved by a body that changes the value and observes the arm behave differently; the terminal shows the label beside the value and refuses to edit a declarative switch with its file unchanged; the reference carries the labels.
  v0.1.25 (T-311-s5, 2026-09-13) — the READERS release: the task format names the criteria heading's depth in words and a body keeps every card to it; the advisory seat reader and the card preflight hold one heading rule, so both answer the same criteria for the same card; the verifier role file spells the verdict entry's one shape with the date first, and the merge verb's newest-verdict reader finds a dated depth-three entry wherever its date sits, a correction block's heading excluded.
  v0.1.24 (T-311, 2026-09-12) — the RUN RECORD release: every child run, native subagent or foreign process, writer or
  read-only participant, runs under a file-backed run record and the same seven operations; a writer reserves its resource exclusively before launch, and an uncertain record is reconciled before any replacement.
  v0.1.23 (T-299, 2026-09-11) — the PROCESS AS SETTINGS release: method/runtime/process-schema.yaml declares every
  switch once (the loop room's inventory and the floor) under three profiles, and the runtime template's process: section names the profile.
  v0.1.22 (T-298, 2026-09-11) — the RIGHT-SIZING release: the triage rule stated once (orchestrator 2), the model per
  role read from the runtime template and printed in the brief (5b), every wait bounded and performed by the arm (5f).
  v0.1.21 (T-296, 2026-09-10) — the THREE TIERS release: bounded, standard and guarded chosen by the arm from
  the card against the guard-class list; phase 1 and phase 2 rendered by the arm; the standard verifier's mode stated once.
  v0.1.20 (T-295, 2026-09-10) — the ARM MERGES release: `brief.mjs --merge <id>` performs the
  integrator's ritual from the verdict and stops with the merge staged; integrator.md states the widening beside the re-drill.
  v0.1.19 (T-307, 2026-09-10) — the PROPOSE-BEFORE-RECORDING release: a room or decision
  entry is shown to the owner verbatim and appended on a yes; entries paraphrase and never quote; an eval holds it.
  v0.1.18 (T-293, 2026-09-10) — the STANDING READ release: a seat reads STATE and a
  generated one-line index of the other four governing documents, nothing else standing (ADR-024).
  v0.1.17 (T-264-s3, 2026-09-10) — the RENAME release: the runtime template is
  supertaskr.yaml, the kit and the launcher spell the product name, no spelling of the old one survives outside a ruling.
  v0.1.16 (T-285, 2026-09-09) — the WAKE FIELD release: a parked card's `wake:`
  condition is machine-read and the dispatch view lists WOKEN cards beside STARTABLE.
  v0.1.15 (T-283, 2026-09-09) — the IN-FENCE FOLLOW-THROUGH release: an executor
  performs an XS finding inside its fence and the verifier grades it.
  v0.1.14 (T-281, 2026-09-09) — the MUTANT BLOCK release: the verifier commits
  the bodies its corrections assign and the merge re-drills them.
  v0.1.13 (T-279, 2026-09-09) — the ONE GRADED RUN release: a lane runs its
  owed suites once, at its final code-and-notes commit; the stamp is exempt.
  v0.1.12 (T-254, 2026-09-09) — the CONTEXT PACK release: the seats read
  the brief's pack, not CONVENTIONS whole; itemised on T-254's card.
  v0.1.11 (T-241, 2026-09-09) — the SEAT release: the architect's hand
  work ships as a skill pack the kit carries; itemised on T-241's card.
  v0.1.10 (T-265, 2026-09-08) — the RENAME release: the kit, its
  adapters and its templates carry the product's ruled name (ADR-022);
  itemised on T-265's card.
  v0.1.9 (T-229, 2026-09-02) — the CONTROL release: a positive control
  is demonstrated failing, not asserted; itemised on T-229's card.
  v0.1.8 (T-159, 2026-08-30) — the METABOLISM release: one bump owning
  every method-text change ADR-020 and its reviews earned, plus the
  parked riders whose resurfacing condition named it; itemised on
  T-159's card and in docs/checkpoints/2026-08-30-T-159.md.
  v0.1.7 (ADR-019, 2026-08-27) — method/docs-protocol.md added, the
  three-tier governing-docs contract; itemised in
  docs/checkpoints/2026-08-27-adr019-compaction.md.
  **WHAT A BUMP IS OWED FOR — SETTLED HERE, BECAUSE "FORMATS" HAS BEEN
  READ BOTH WAYS AND A LANE CANNOT DECIDE IT FROM INSIDE ITS OWN
  FENCE** (T-145-s2; T-104 ruled the call belongs to triage BEFORE
  dispatch). The trigger is NOT the word *format*. **Two tests, either
  one sufficient.** (1) **SHIPPED BYTES** — the change alters a file the
  kit MATERIALIZES into another project; derive that set from
  `KIT_FILES` in app/src-tauri/src/agent/kit.rs at your own ref, never
  from a directory name — the boundary runs THROUGH method/, and
  lane-protocol.md and roles/integrator.md are not in the table while
  every adapter and template is. (2) **GRAMMAR** — the change alters
  what a card, a room, a brief or a role may SAY: a field, a status, a
  normative table, a contract row. **An adapter takes test 1 and fails
  test 2** and is still owed a bump; **a purely editorial change to an
  unshipped method file — a typo, a reflow, a citation repair — is owed
  none** and rides the next one. Deciding this before dispatch is
  triage's, and a card whose fence cannot reach all three stamps CANNOT
  take it: say so on the card.
  **A BUMP IS A THREE-FILE COMMIT AND THE THIRD FILE IS RUST** (T-078-s3
  arm 1, taken at T-089). The three are: this stamp; the `(v<version>`
  stamp in method/interview/plan-interview.md's Output heading; and
  `METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs, which
  `snapshot_version_matches_the_live_method_stamps` checks BOTH docs
  against, off disk, on every `cargo test`. So a fence of
  `[method/, docs/CONVENTIONS.md]` can change method/ and CANNOT bump
  it: moving either stamp alone reds that test by name (T-089 measured
  both sides, exit 101 each). **The two asserts are ORDERED**: a
  const-only bump reds on the plan-interview arm and NEVER reaches the
  CONVENTIONS arm, so fixing only the file a panic names yields a SECOND
  red — move both doc stamps and the const in ONE commit. **THREE
  PLACES ARE PINNED AND AN OPEN SET IS NOT — CITE THE SHAPE, NOT THE
  TALLY.** Every other occurrence of the version is a REFERENCE no test
  reads: **a reference that CLAIMS THE CURRENT VERSION goes stale and
  moves with the bump; a FIXTURE that merely needs some version string
  does not**, and moving those is churn. **DERIVE THE LIST, NEVER QUOTE
  IT**: `git grep -n "0\.1\.[0-9]"` from the repo root prints every one
  at your own ref. **AND THEY ARE NOT ALL INSIDE ANY ONE FENCE**: a
  `[method/, docs/CONVENTIONS.md, app-agent]` fence reaches the three
  pinned places and this file's references, and does NOT reach
  docs/ARCHITECTURE.md, the component file or the app suites. Route
  what you cannot reach.
  **AND THE VERSION STAMP IS NOT THE ONLY THING PINNED IN THAT FILE —
  ITS BANKING TABLE IS TRANSCRIBED INTO TYPESCRIPT AND ASSERTED CELL BY
  CELL** (T-159). `BANKING_MAP` in app/src/genesis/genesis-derive.ts is
  a verbatim copy of method/interview/plan-interview.md's stage table,
  and `every_cell_of_the_9_row_table_matches_plan_interview_md_verbatim`
  in app/test/genesis-derive.test.ts reds on ANY change to ANY cell — so
  the canonical bump fence can move the file's version stamp and CANNOT
  move a row of its table. **The reader is in `app/`, so a
  `method/`-only lane will not run it by reflex** — run `npm test` from
  app/ whenever your diff touches that table, and read the assertion.
  **A BUMP NOW OWES A FOURTH THING, AND IT IS NOT A FILE** (T-155,
  ADR-020 decision 2). The METHOD EVAL GATE below is RUN against the new
  method text and its result is RECORDED IN THE BUMP'S OWN COMMIT
  MESSAGE; `node tools/method-evals/run.mjs --bump` prints the block and
  names the runner that produced it. A stamp proves the three files
  moved together and nothing else — it is satisfied perfectly by a
  rewrite that degrades every session the method produces; a fourth
  FILE would go stale between bump and merge and be a figure with no
  keeper, where a commit message is stamped at the ref it was measured
  at. **AND THE MODEL-IN-LOOP HALF ONLY RUNS HERE**: token-expensive and
  nondeterministic, so not on the per-merge trigger, which leaves the
  bump as the ONE moment it is owed — and the `--bump` block says
  whether the evals ran or were skipped, because the two read the same
  afterwards.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
- THE MERGE INTO MAIN IS @human'S GATE, BY DESIGN AND NOT BY ACCIDENT
  (ADR-020 decision 4, ratifying what T-145's denial discovered). A
  session's `git merge` into the integration branch is EXPECTED to be
  refused by the permission layer; the refusal is the gate working,
  and the route is @human performs the merge. No workaround is
  legitimate — `commit-tree`/`update-ref` bypass the gate's intent —
  and the rule is the T-145 executor's own sentence: a coordinator's
  authorization is not the permission system's consent. Ordinary
  commits at @human's explicit direction are not merges and do not
  contend with this gate.
- THE ARM MERGES, AND THE SEAT RULES (T-295, ADR-024 decisions 3 and 4):
  `node tools/e2e/scripts/brief.mjs --merge <T-NNN>` is the ONE spelling
  for the integrator's ritual, and it performs the steps in this order
  with every step's exit printed: the fence WIDENED on the integration
  branch for any spec the newest verdict's MUTANT BLOCKs name that the
  card does not already admit (its own commit, ahead of the merge,
  because the landing gate reads a merge's fence from its FIRST PARENT
  — T-281-s10); the lane branch moved to the BENCH TIP, which is the
  detached `-V-<id>` worktree's HEAD and NOT the verdict sha, since the
  verifier commits its correction bodies after writing the verdict;
  `git merge --no-ff --no-commit`; the conflicts, which get exactly
  three answers and no fourth — this card's own file taken from the
  LANE, a single end-of-file append whose MERGE BASE is empty kept from
  both sides with the closing restored, and everything else NAMED as a
  fence finding and stopped, never resolved; the `done` stamp; each
  assigned correction applied as the block's `old` text where the tree
  carries its `new`; the four cheap keepers; the method stamp when
  method text moved; the census and the graph AFTER the corrections and
  never before; the docs gate, whose FIRES is NEWS and whose STALE
  stops; the re-drill of every block, scoped by the FIX DIFF — the
  block's own spec, with the specs the fix diff OWNS derived and READ
  (a block whose spec is not among them pins a property the correction
  did not move, which is said), and `--drill-wide` to run that whole
  owning set instead: the stronger RED ALONE claim, priced at eight
  minutes for one block over thirteen specs against a ritual whose
  target is five; the counts graded against the ones the verdict claims; the
  message written FROM the verdict's own sentences; and the `## Meters`
  blocks appended to `docs/checkpoints/meters.jsonl`, one JSON object
  per line carrying the card, its size, its tier, the seat, the source,
  the merge and the block's own text whole. **IT STOPS WITH THE MERGE
  STAGED AND IT NEVER PUSHES**: the commit, the checkpoint and the push
  stay the seat's, and a step it refuses is the seat's to rule rather
  than the verb's to work around. Every dial is DERIVED — the lane
  branch off `git for-each-ref`, the worktree off `git worktree list`
  and never off this document's spelling (a lane cut before a rename
  was not found by a script that read the bullet), the seats off the
  card's own fields — so the seat types one card id. **THE FOUR CHEAP
  KEEPERS, each a step with its own exit**: a line this merge REMOVES
  under `method/` or `docs/` that a spec pins VERBATIM (thirty
  characters is the floor); a line it ADDS carrying a forbidden
  spelling — the rename scanner's own classifier, a secret shape, an
  email address, this machine's home directory, or the seat's whole
  account or git name; an `XS` card whose diff outside its own card file
  exceeds FORTY changed lines (the bound is stated here so the tier work
  has something to read, and it is a number to be moved by measurement);
  and the card's own `--preflight`.
  **AND SINCE T-296 THE XS-BOUND KEEPER BUMPS RATHER THAN REFUSES.** Its
  subject is a MIS-SIZING and not a defect — the card was classified
  `bounded` before the work existed and the work turned out bigger, and
  nothing about the merged tree is wrong — so the step passes, says the
  card is bumped, and the reading appended to the bands carries
  `standard` rather than the tier the dispatch stamped. Refusing here
  would stop a finished lane at its last step over a fact for the NEXT
  triage. The other three still refuse, and a card of any other size is
  still not this keeper's to judge.
  **AND SINCE T-295-s4 THE FORBIDDEN-SPELLING KEEPER CLASSIFIES A
  SYNTHETIC FIXTURE**, on the rename class's own model and bounded by
  that card's amendment of 2026-09-13. It exists because the keeper
  stopped four merges in two days, three of them on the one synthetic
  fixture identity a new spec body added, and each was ruled through by
  hand — the shape of a keeper on its way to being turned off. THE
  RECOGNITION RULE: a matched value is kept only where `FIXTURE_CLASSES`
  in that file names BOTH the value — by an anchored pattern, a literal
  and never a shape — AND the site it may sit at, a `files` token ending
  in `/` being a directory and the rest whole paths. A spec filename, a
  comment calling something a fixture and placement in a test directory
  qualify NOTHING on their own, so an arbitrary credential-shaped value
  is refused in exactly the file whose one enumerated credential is kept;
  an address entry is admissible only at a domain the standards reserve
  for documentation and testing; and no entry covers the home or name
  classes, whose values are DERIVED FROM THE LIVE MACHINE rather than
  from a shape, so a home path stays forbidden. The exception is PER
  MATCHED VALUE AND PER CLASS — keeping one synthetic instance suppresses
  nothing else on the same line, in the same block or in the same file —
  and **every use is announced**, on the step's own output and in the
  spelling an acknowledged drill uses: a kept spelling is news, never
  silence.
- BOUNDED WAITS, IN THIS PROJECT'S OWN SPELLING (T-298, ADR-024's room
  decision G): `method/roles/orchestrator.md` 5f states the rule — every
  wait is on a FACT with a CEILING and a hand-typed sleep is not a wait —
  and this bullet carries the command. From the repository root:

      node tools/e2e/scripts/brief.mjs --await <marker path> --ceiling <seconds>
      node tools/e2e/scripts/brief.mjs --await-pid <pid> --ceiling <seconds>

  Exits, read unpiped in the T-298 lane: 0 when the fact happened; 1 when
  the ceiling was reached and REPORTED (what it waited for, how long, how
  many asks, and that nothing was signalled or taken away); 2 for every
  usage refusal — no ceiling, no fact, two facts, a ceiling of zero or one
  that is not a number, the process group or the broadcast pid, and any
  attempt to share the invocation with another arm. The arm's own child
  processes carry no ceiling yet (T-298-s2).
- THE RUN RECORD, IN THIS PROJECT'S OWN SPELLING (T-311, ADR-025
  decision 1): `method/lane-protocol.md` states the contract — every
  child runs under one record, only a writer takes its resource's
  exclusive reservation, and an uncertain record is reconciled before
  anything replaces it — and this bullet carries the spellings that file
  leaves to a project. Records live under `.supertaskr/runs/<work>/<attempt
  id>.json` in the checkout the SEAT holds, and the writer reservations
  under `.supertaskr/runs/reservations/`, one file per resource, behind the
  same self-ignoring `.gitignore` as the fence manifest and the holder
  record — so a record is never a commit. An attempt id is `<work>-a<n>`
  and carries its own work, which is why the verbs need no second flag to
  find a record. From the repository root:

      node tools/e2e/scripts/brief.mjs --run start --assignment <path>
      node tools/e2e/scripts/brief.mjs --run bind --attempt <id> --session <harness id> [--pid <n>]
      node tools/e2e/scripts/brief.mjs --run observe|send|wait|collect|continue|stop --attempt <id>

  **THE ASSIGNMENT IS A DOCUMENT AND EVERY FIELD IS REQUIRED**, with the
  word `none` a legal value for the resource, the deadline and the budget
  and a MISSING field a refusal that names it: the work and its kind, the
  role, the resource, the harness, the model, the effort, the base ref,
  the brief, the working directory, the deadline and the authorized
  budget. The permission boundary and the ask file are DERIVED — from the
  fence manifest in the working directory and from the brief's own
  directory — because a boundary somebody typed is a claim about a
  manifest the write hook will read anyway. Exits, read unpiped: 0 when
  the operation was performed; 1 when it was REFUSED by the world (the
  resource already reserved, a prior execution that might still be
  running, a collect before the state is terminal, a wait that reached
  its ceiling), each naming a greppable code; 2 for every usage refusal.
  **THE GRAMMAR IS ONE GRAMMAR FOR BOTH KINDS OF CHILD**: `RUN-ASK <id>`,
  `RUN-ACK <id>` and `RUN-DONE ok|failed|gone`, written by a process child
  into its ask file and arriving for a native child in the harness's own
  output, which the seat hands to `--run observe --evidence`. `gone` is
  the honest third value — the execution is not there any more and what
  the assignment did is `unknown`.
- THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE (T-299,
  ADR-024 decision 6): `method/runtime/process-schema.yaml` is the ONE
  source. It declares each step of the loop as a SWITCH with what it
  does, how it changes the loop, which arm symbol reads it, what it needs
  on, whether it may be turned off, which band measures it, what this
  project measured it to cost, and its value under each of the three
  profiles — `guarded-everything` (the ceremony as it stood on
  2026-09-09), `standard` (what the ADR ruled) and `fast`. The runtime
  template's `process:` section names which profile this project runs,
  which profiles exist, and the switches it DEPARTS from; it carries no
  explanation of its own, because a second copy is a copy that goes
  stale. **THE ARM READS IT AT DISPATCH AND AT MERGE**: the tier rules,
  the phase-1 spawn, the whole-suite net, the regenerations' place, the
  cheap keepers and the model per role all branch on a switch, and a
  combination the schema's constraints forbid REFUSES the dispatch and
  the merge naming both switches and both values. **THE FLOOR IS NOT
  REFINABLE** — the fence and its write hook, the card preflight at
  dispatch, the owed-set token and the push guard, the landing gate, the
  docs gate, the method stamp and its eval gate, records never rewritten,
  the template's own roles block, a verifier that reads the diff before
  the notes, and the checkpoint: an override that turns one off is
  refused by name. **KEPT BY A BODY, NOT BY A MEMORY**: the e2e suite
  parses the schema with a real YAML library and requires that reading to
  agree with the arm's hand parser, derives each switch's read site from
  the arm's own source rather than from a table, and reds per switch when
  the arm stops reading it. **AND SINCE T-317 THE READER ITSELF IS THE
  PARSER LIBRARY'S** — `lib/parser/src/process-settings.ts`, exported
  through the browser-safe entry `@supertaskr/parser/pure`, with the arm
  importing it and re-exporting every symbol unchanged — so the terminal
  command, the app's settings screen and the skill render ONE
  implementation rather than a spelling each, and the app can render it
  at all. **AND SINCE T-299-s6 EVERY ROW SAYS WHAT MAKES IT TRUE**, in an
  `implementation:` field that is one of three words, because the
  `reads:` field answers a narrower question than a reader of a settings
  screen is asking and `processLedger` there reads as *"nothing"*.
  `operational` means the arm reads the row and branches on it, and the
  label is EARNED: the lane that assigns it shows a body that CHANGES the
  value and watches the arm answer differently, with every value of the
  row erased from the answers before they are compared — a read site
  shows the value is read, and a surface printing the value back shows
  less than that. `manual` means a person or a seat performs what the row
  names, and the row carries that instruction in a non-empty
  `manualAction:`. `declarative` means the row is a RECORD rather than a
  control: nothing reads its value and no instruction is addressed to a
  seat by it, so editing it alone changes nothing — **AND IT DOES NOT
  MEAN THE BEHAVIOUR IS ABSENT.** The fence hook, the docs gate and the
  landing gate all read `declarative` and are all in force; what they are
  not is settings, because they live in code and in CI configuration that
  never consults the schema. The parser refuses a missing or unknown
  label, an empty action on a manual row and an action on a row that is
  not manual; `supertaskr settings` shows the label beside the value and
  the action beside a manual one, REFUSES a `set` naming a declarative
  row with the finding code `declarative` at the exit its other refusals
  already take, and the generated chapter carries both. **AN UNRESOLVED
  CLASSIFICATION IS A FINDING AND NEVER A `declarative`**: the label is
  what a reader trusts when deciding whether editing a row is worth
  anything, and a row filed under it to end an argument is the one way
  this field can be worse than the absence it replaced. **AND SINCE
  T-319 THE DISPATCH APPROVAL LIVES IN THE TEMPLATE TOO, AS ONE BLOCK.**
  Where the record
  lives: `dispatch:` in `method/runtime/supertaskr.yaml`, declared once
  as the schema's own `dispatch_block:` section beside the switches and
  read by the parser library's `dispatchBlock` as ONE typed value — so
  the tracked record the arm reads is the template itself rather than a
  record class beside it, and a fresh seat in either harness inherits the
  approval from a file instead of from a checkpoint's prose. The block
  carries `approval` (each, until a named card, standing), `recovery`
  (none, or the repairs necessary to the approved work — a policy of its
  own, valid under every mode), and a `grant` naming who gave it, when,
  its revision, the approved cards in dispatch order and each card's blob
  sha at approval; `revoked`, `limits` and `history` are the rest.
  **HOW A GRANT CHANGES: BY A DATED EDIT AND NEVER BY A REWRITE.** A
  grant, a pause or a revocation appends the previous grant to `history:`
  and RAISES the revision, proposed verbatim and approved on the owner's
  yes as any decision entry is (T-307), and **which grant is current is
  decided by that revision and never by a date** — two grants at one
  revision are refused, because a date cannot break that tie. The reader
  answers a NAMED refusal and never a partial value: an unknown field, a
  duplicate YAML key, an `until` with no card or a card outside the
  order, an order and a cards map that disagree, a malformed sha or
  instant, a non-positive revision, two grants at one revision, a history
  not wholly below the current. It validates the sequence it is GIVEN and
  attributes each grant to its recorded `given_by`; it promises no tamper
  prevention from an integer. **THIS PROJECT CARRIES NO BLOCK**, and the
  reader says so in as many words — approval each, recovery none, no
  grant, revision 0 — because no grant is ever created by guessing a
  person, an instant or a past authorization; an existing authorized way
  of working reaches the template only through a migration grant the seat
  proposes verbatim and the owner approves. **AND SINCE T-324 THE BLOCK
  IS OPERATIONAL: EVERY ADMISSION THE ARM MAKES IS BOUND TO THE GRANT'S
  REVISION, THE CARD'S APPROVED BLOB AND THE ATTEMPT'S RESERVATION.**
  Four boundaries admit work — the lane cut (`--dispatch-lane`), a child
  start (`--run start`), a re-entry (`--run continue`) and a replacement
  writer (`--run continue --replace`) — and the grant is RE-READ at each,
  because an approval read once at the cut is one a revocation four hours
  later cannot reach. An admission is EXPLICIT (a card the grant names,
  bound to the grant's revision and to the card's approved blob, with the
  loop's own mechanical appends allowed: a status or tier stamp, a notes,
  verdicts or repair-ledger append, a filed follow-up line — anything else is a
  different card and refuses) or DERIVED (a repair the recovery policy
  allows, bound to its parent authorized work, the failure evidence, the
  PARENT grant's revision and its own blob at filing; it inherits that
  authorization and mints no grant, a repair's description establishes
  nothing, a repeated delivery event produces no duplicate repair, and a
  scope change re-evaluates it). The modes are enforced at those
  boundaries: `each` spends a card's own approval ONCE and refuses it
  presented again; `until` admits the prefix up to and including the
  endpoint and refuses the next card BY NAME, a parked endpoint being no
  more a delivered one than an undone card is; `standing` admits until a
  pause is recorded. `recovery: none` refuses a derived admission by name
  and records it as needing its own explicit approval; `recovery:
  repairs` admits a repair of approved work and never a product-scope
  change or a waived verification. **THE ADMISSION COMES BEFORE THE
  RESERVATION**, on the same argument that puts the reservation before
  the launch: a lock taken for work nobody admitted is a writer this loop
  had no authority to start. **THE LEDGER IS THE RUN RECORDS AND THERE IS
  NO SECOND ONE**: each record carries the admission it was started
  under, so what has been consumed is derived from `.supertaskr/runs/`
  rather than from a table beside it, and a retry of an interrupted
  admission RE-PRESENTS it rather than spending a second approval. **A
  PAUSE IS A RECORD IN THE RUNTIME DIRECTORY, NOT A ROW OF THE BLOCK**
  (T-324, and T-324-s1 is the card that would move it): the owner writes
  `.supertaskr/pause.json` — `version`, `at`, `by`, `scope` (`new-work`
  or `all`) and an optional `why` — beside T-238's holder record, ONE
  reader reads it (`readPause`), a record this reader cannot parse
  REFUSES rather than reading as silence, and the block itself is read
  through the parser's reader and through nothing else. It lives there
  rather than in the block because T-319's reader answers each declared
  field BY NAME and would refuse a whole block carrying a row it does not
  return — so a `pause:` row today would be a control that silently did
  nothing. Under `new-work` every new implementation attempt and re-entry
  is refused while the verification and integration of a candidate
  already admitted may start and finish; under `all` every further phase
  stops at its declared safe boundary — an executor at its stamp, a
  verifier at its verdict, a staged merge finished or aborted as the
  record says. An IMMEDIATE stop is a separate request through the
  applicable stopping mechanism and never a reading of the grant. **THE
  `limits` ROWS STAY ADVISORY AND THIS CARD DOES NOT ENFORCE THEM**: they
  are read and REPORTED BY NAME as advisory and unenforced, their absence
  imposes no ceiling, an expiry that has passed refuses nothing, and
  enforcement is deferred to a later card so that no control silently
  does nothing. **A SUCCESSOR COORDINATOR INHERITS THE GRANT FROM THE
  BLOCK** (T-238's seat): the same revision, the same order, the same
  blobs, continuing the order without the previous coordinator's
  identity, which is no part of an approval. **AND THE ARM'S REPORT KEEPS
  THREE THINGS APART** — the refusals it TESTED, the coordinator's
  obligations it CANNOT check (scope interpretation, an unreported
  integrity problem, a provider's live usage) and the advisory
  accounting — because a list that mixed them would let the second and
  the third borrow the first's authority. The switch inventory the schema
  was built from — every row with its old and ruled value, its measured
  cost and its constraint — is in `docs/rooms/loop-cost-and-speed.md`.
  **AND SINCE T-322 THE LOOP KEEPS WORKING WHILE THE OWNER IS AWAY.**
  `method/roles/orchestrator.md` 5g states the rules — attribute a red
  or a rejection before acting and record it; continue a repair on
  evidence and park it with a wake condition otherwise; check the shared
  conditions against the ACTION proposed; write a question entry rather
  than stop; treat a quota refusal as a recorded retry instant — and
  this bullet carries the two spellings and the one operational rule
  that is this machine's rather than the method's. From the repository
  root:

      node tools/e2e/scripts/brief.mjs --since <ISO instant>
      node tools/e2e/scripts/brief.mjs --await-until <ISO instant> --ceiling <seconds>

  The first is the return brief and the reds in its window attributed;
  the second is the wait verb's until-instant form, the same loop, the
  same interval and the same ceiling report as the marker and the pid.
  A question entry lives in `docs/rooms/`, a repair ledger under
  `## Repair ledger` on the failing card, and a refusal with its retry
  instant on the run record — three records that already existed, and
  no fourth. **THE HOST MUST STAY AWAKE OR THERE IS NO LOOP**: this
  pipeline runs on the owner's own machine, a sleeping Mac stops every
  seat mid-turn, and the seat holds the host awake for the span it
  expects to need — `caffeinate -i -t <seconds>` beside the app's own
  keep-awake request, both for the night on 2026-09-14. **DERIVE
  WHETHER IT IS HELD, NEVER ASSUME IT**: `pmset -g assertions` names
  every holder, and an idle-sleep assertion nobody holds is a loop that
  will stop at the first idle window rather than at a boundary.
- GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING (T-296, ADR-024
  decision 1): `method/tasks/TASK-FORMAT.md` names the guard-class
  CLASSES and is product-agnostic, so the mapping onto this repository
  lives here, beside the slug map. The arm reads BOTH and refuses when
  they disagree, either way round: a declared class this bullet does not
  map, or a name mapped here the method never declared. A fenced path
  under any of these makes a card `guarded` whatever its size — the
  builder of a cage is not its inspector, and a one-line change to a
  guard can retire the guard in silence. Classes OVERLAP by design (a
  class says what a file DOES, and `.claude/` holds several kinds); the
  arm reports every class a path hits. A token ending in `*` is a PREFIX,
  and the blessed gate-runner is matched by that shape rather than by its
  filename BECAUSE THIS DOCUMENT NAMES THAT RUNNER EXACTLY ONCE and a
  body requires exactly that — which is also the honester statement, since
  what makes a file guard-class is being a gate runner. **THE MAP:**
  `agent-hooks`: `.claude/`;
  `gate-runners`: `tools/e2e/scripts/gate-*`,
  `tools/e2e/scripts/docs-gate.mjs`, `tools/e2e/scripts/push-checks.mjs`;
  `fences-and-locks`: `tools/e2e/scripts/lane-fence.mjs`,
  `tools/e2e/scripts/lane-lock.mjs`;
  `landing-and-push-guards`: `.claude/hooks/landing-gate.mjs`,
  `.claude/hooks/push-guard.mjs`, `tools/e2e/scripts/merge.mjs`;
  `parser`: `lib/parser/`;
  `method-text`: `method/`;
  `ci-workflow`: `.github/workflows/`.
  **KEPT BY A BODY, NOT BY A MEMORY**: the e2e suite derives this
  repository's guard-class CANDIDATES from the tree by a rule that never
  reads this map — every tracked file under `.claude/`,
  `.github/workflows/`, `method/` or `lib/parser/src/`, plus every
  tracked script under `tools/e2e/scripts/` whose own name carries
  `gate`, `guard`, `fence`, `lock`, `push` or `landing` — and reds
  naming any candidate no class covers.
- A CITATION NAMES A SYMBOL, NOT A LINE (fourth triage, 2026-08-19):
  line numbers drift downward under later merges while the finding's
  substance reproduces, so a stale line reads as "this was fixed". Cite
  a path plus a FUNCTION, TEST or CONSTANT name — what survives merges
  and what a reader can search for. Search from the repo ROOT:
  `git grep` run from a subdirectory silently scopes itself there and
  returns nothing, which reads like a refutation rather than a miss.
  And CITE THE SHAPE, NOT THE TALLY — a hit count is a line number by
  another name.
  **THIS BULLET IS ONE OF THE TWO THAT GOVERN THE HAND** rather than the
  lane's tooling. The other is the PORT RULE's `lsof` clause, and the
  DISTINCTION IS STATED THERE, in the sentence beginning *"The rule
  above governs the LANE's tooling"*; the hand's remaining rules are
  gathered HERE, because a hand rule filed among tooling rules is a rule
  nobody applies (T-093).
  **A MISS IS NOT A REFUTATION, AND THERE ARE AT LEAST THREE CAUSES.**
  An empty result is the answer you were hoping for, which is precisely
  why it is the one to distrust. Each cause is stated as a MECHANISM and
  never as a tool's message, because the message is not guaranteed to
  survive the shell: this harness resolves `grep` to a SHELL FUNCTION
  carrying `-I`. IF another cause is found THEN it joins this list.
  T-093's card carries the measurements, at `bc2d82a`.
  **ONE, THE SCOPE** — the `git grep`-from-a-subdirectory sentence
  above. Re-running from the ROOT fixes this one, which is what makes
  the other two worse — they give the SAME answer from anywhere, over a
  file somebody has just edited.
  **TWO, A CONTROL BYTE IN THE FILE.** One literal NUL makes a file
  BINARY to every binary-skipping searcher while it still compiles,
  renders and passes its suites: the real `/usr/bin/grep` prints
  `Binary file … matches` at exit 0, while the shell-function `grep`
  this harness installs answers EXIT 1 WITH NO OUTPUT over the same
  bytes — the code a genuinely absent string gives. WHAT TO RUN NEXT:
  `file(1)`, which says `data`, and then `npm run lint:tokens` from
  tools/e2e, which needs no `node_modules` and names the byte and its
  offset at exit 1. THE GATE IS NOT THE GAP; the advice was.
  **THREE, A HARD WRAP ACROSS THE PHRASE.** Every governing document
  here is wrapped at about 70 columns, so a phrase search is a search
  for a line break you did not choose: the head of a wrapped sentence
  is found at exit 0, and the needle one word past the break returns
  nothing at exit 1. THIS CLAUSE TYPES NO NEEDLE, because writing one
  here would satisfy the search it is about — **and the wrap point
  moves** with every reflow, which is why the rule describes the WRAP
  and never a needle. WHAT TO RUN NEXT: shorten the needle until it
  cannot span a break, or search the COLLAPSED text, the way every
  mechanical reader of this file does before it matches.
  **`file --mime` IS NOT THE CHEAP VERSION OF THE GATE**:
  `charset=binary` is legitimate evidence for U+0000 and for almost
  nothing else — one U+000B planted into this file left `file --mime`
  reporting `text/plain; charset=utf-8` UNCHANGED and both greps still
  finding the needle, while `npm run lint:tokens` named the byte and
  exited 1. THE C0 SET P5 REJECTS IS `scanControlSource` in
  tools/e2e/scripts/token-scan.mjs — READ IT THERE, never transcribed
  into prose. The cheap version of the gate IS the gate.
  **A COMMENT THAT RESTATES A MEASURED FIGURE IS A SECOND
  IMPLEMENTATION** (of T-074's six corrections exactly ONE had a
  mechanical reader, in a different npm package from the comment it
  contradicted). SO WHERE A FIGURE IS ASSERTED SOMEWHERE, CITE THE
  ASSERTION BY NAME INSTEAD OF RESTATING ITS VALUE: *"the lens takes the
  rest; `interview.spec.ts`'s `the split is 640 + the lens at >=1024`
  measures it"* cannot go stale, because the only thing it claims is
  that a test exists. **THE GATE FOR THIS IS REFUSED IN WRITING**: a lint
  that grepped comments for digit runs would fire constantly on prose
  that is fine, and the honest narrow version — flag a comment quoting a
  figure in the same file as an assertion of a DIFFERENT value — is
  worth a prototype only if a sixth instance turns up.
- This project was planned in a long chat session before the folder
  existed; the chat is NOT the record — if it isn't in this folder,
  it didn't happen (succession rule).
- Tauri v2 applies the CSP (app/src-tauri/tauri.conf.json) at serve
  time — it never appears in dist/index.html (that was v1 behavior);
  don't "fix" its absence there.
- Tauri capability grants compile to code, not strings — `strings` on a
  binary proves NOTHING about ACL grants (vacuously "clean" even for
  granted permissions; only config JSON, e.g. the CSP, is
  string-findable). Since T-021 the webview-surface proof is PINNED, not
  re-derived per task: `app/src-tauri/src/acl_pin.rs` re-resolves the
  shipped gen/schemas through tauri's own resolver on every `cargo test`
  and fails with a `+`/`-` grant diff if the `core:default` set moves. A
  deliberate grant is added by re-pinning EXPECTED_GRANTS in the same
  commit, with the sweep — never by deleting or muting the test (ADR-012
  for why the set stays empty of app grants; T-007's verdict correction
  for the origin).
- DECLARING A COMPONENT moves THREE live-registry fixtures, not two
  (T-024-s5, ratified at the 2026-08-16 second triage after the
  omission cost T-024 a rejection): `lib/parser/test/smoke.test.ts` (the
  exact id array over this repo's live docs/ tree),
  `app/test/architecture-dogfood.test.ts` (ids, declared count,
  findings, the relation table, drift/declaredOnly) and
  `app/test/map-dogfood-render.test.tsx` (rendered node + edge counts).
  Reconcile all three, changed never loosened. A MERGE REGEN alone moves
  only the two app fixtures — the parser pin holds unless the REGISTRY
  itself changed.
  **MOVING A `touch_slugs:` FIELD IS A DIFFERENT EDIT AND MOVES A
  DIFFERENT SET** (`T-163-s3`). DERIVE that set, never transcribe it:
  `node tools/e2e/scripts/docs-gate.mjs docs/architecture/components/C-NN-*.md`
  names the owed SUITES at your own ref, and it names more suites than
  the two the three fixtures above live in; **the three above can all
  be GREEN while other bodies in those same suites red** (T-163 measured
  it moving one field), so run each suite the gate names IN FULL. One
  consumer sits outside every suite: docs/ARCHITECTURE.md's prose slug
  BLOCK copies this field and must move with it — `brief.mjs --task`
  compares the two and says in one line whether they agree at your ref.
- THE SHIPPED PARTITION, IN SLUGS (T-147 — the sentence
  method/tasks/TASK-FORMAT.md's ceremony boundary asks each project to
  state beside its slug map, so a size-S card's ROW is read off
  `touches:` rather than judged; the map is docs/ARCHITECTURE.md's
  block and its authority is each component's own `touch_slugs:`).
  **SHIPPED — every registry SLUG, and no list of them here**:
  `git grep -h '^touch_slugs:' docs/architecture/components/` prints
  the set at your own ref. **EVERY EMPTY LINE IN IT IS A COMPONENT NO
  SLUG CAN FENCE**, and each is why the SHIPPED clauses below do not
  stop at the slug set —
  `git grep -l '^touch_slugs: \[\]' docs/architecture/components/`
  names those components at your own ref, and THE COUNT IS NOT WRITTEN
  HERE because it has already moved once (`T-163-s3`). A slug is the
  usual SPELLING of "does it ship?", never the question itself — the
  question is whether the bytes REACH the product.
  **SHIPPED — any bare `method/` path that REACHES a `KIT_FILES` entry**
  (`git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs`), because the
  kit materializes those bytes VERBATIM into every project this system
  creates. Here the METHOD is the product, so the rule of thumb's
  premise — "`method/` is product-agnostic" — is false, and its
  conclusion drops the verifier from the highest-blast-radius bytes we
  ship (T-145 repaired the adapter every new project inherits, took no
  verifier under the fallback, and its drill measured `cargo test` GREEN
  with the defect restored). REACHES, not equals — a fence is a blast
  radius, so `[method/roles/]` ships (it may write `planner.md`) and
  `[method/roles/executor.md]` does not; narrow the fence and the
  ceremony narrows with it.
  **SHIPPED — a bare path into the `paths:` of a SLUGLESS component
  whose bytes REACH the built app** (T-163, @human's architecture
  ruling of 2026-08-30, which took C-11's `touch_slugs:` to `[]`; the
  FIELD is the authority — `grep -h '^touch_slugs:'
  docs/architecture/components/C-11-design-tokens.md`). A design-tokens
  change enters a lane as `touches: [app/src/styles]` or
  `[app/src/assets]` — its own bare PATH, in the spelling C-11's body
  publishes — and it SHIPS by the same REACHES test: `app/src/index.css`
  (C-05, slug `app-shell`) `@import`s `./styles/tokens.css` and
  `./styles/fonts.css`, and `fonts.css` `url()`s
  `../assets/fonts/*.woff2`, so those bytes are compiled into every
  build. **READING AN EMPTY `touch_slugs:` AS "NOT SHIPPED" IS THE TRAP
  THIS CLAUSE CLOSES**: the ruling removed a fence SPELLING, not a byte
  from the bundle — and it does NOT generalise to every empty line; C-01
  is slugless too, and its `method/**` ships only as far as the clause
  above says. Ask each slugless component's territory the REACHES
  question separately.
  **NOT SHIPPED — every bare path no SHIPPED clause above reaches**:
  `docs/**`, `.github/`, `tools/e2e` (YES to "is it code?", NO to "does
  it ship?" — the case this rule exists to settle), and the `method/`
  files the kit leaves behind, `lane-protocol.md` and
  `roles/integrator.md` among them. **`non_code:` IS A DIFFERENT AXIS
  AND IS NEVER SUBSTITUTED**: C-11 is `non_code: true`, claims NO slug,
  and ships anyway — neither field is the shipped-ness test.
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
  THE FOURTH QUESTION (T-084): **"resolved by other work" is not a
  fourth move and `closed` is not a ninth status.** It is a DISPOSITION,
  and disposition belongs to TRIAGE (T-083's integrator ruled it): a
  finding whose work was resolved elsewhere KEEPS `status: suggested`
  and records the discharge in its own body — a `closed_by:` line naming
  the commit is the shape `T-081-s7` uses — and TRIAGE then makes one of
  the three moves above, normally promotion. ADDING A STATUS IS A METHOD
  CHANGE, NOT A PARSE FIX: the vocabulary is ratified in
  method/tasks/TASK-FORMAT.md and lives in exactly one place in code,
  `lib/parser/src/types.ts`, which the DOCS GATE below READS rather than
  restates. Do not add a status to make one file parse — and a fence
  able to add one honestly would have to carry a method version bump,
  whose third file is Rust (T-078-s3).
- The genesis kit is ratified in method/roles/planner.md +
  method/interview/plan-interview.md (ratified v0.1.5, T-023 — a
  RATIFICATION record, NOT a claim about the current method version,
  which the first gotcha above owns): interview output is INCREMENTALLY
  BANKED — the stage → artifact table in plan-interview.md is normative
  and gets transcribed by programs (T-024 stage inference, T-025 kit
  packaging); changing it is a method version bump, and code reading it
  must be kept in sync. "pushing back:" is a rendering hint, never
  load-bearing; the transcript is not record. docs-templates/ are
  scaffolded VERBATIM — examples live inside HTML comments, and since
  T-030 parseRoadmap blanks every `<!-- … -->` span before matching
  lines, so a column-0 `- F-01:` example row inside a comment yields
  neither a phantom feature nor a roadmap-error (pinned in
  lib/parser/test/roadmap.test.ts). The templates stay comment-wrapped
  REGARDLESS — a comment is how an example says it is an example, and
  the parser's tolerance is a safety net, not a licence to ship
  live-looking rows in a scaffold.
- Outside-click/dismissal listeners must decide on pointerdown, never
  click — under trusted input the browser runs microtask checkpoints
  between listeners, so React's discrete-update flush lands
  mid-propagation and detaches the clicked node; a click-time listener
  then reads inside as outside and misdismisses (cost T-005 a
  rejection). Synthetic clicks propagate synchronously and CANNOT
  reproduce it — no unit/jsdom probe will warn you. Reuse
  attachPanelDismissal (app/src/components/board/panel-dismissal.ts);
  its test pins the trusted event order headlessly, and the real-input
  lane (tools/e2e) pins it under TRUSTED input — swapping those two
  strings back to `"click"` fails three bodies by name. The
  `data-panel-exempt` exemption is a SAFETY NET against accidental
  dismissal, not a guarantee that exempt controls stay pointer-reachable
  while a panel is open: the open panel occludes the header's exempt
  controls and keyboard reach is sufficient by design (human ruling
  2026-08-16, closing T-020-s1;
  tools/e2e/tests/panel-exempt-controls.spec.ts pins the occlusion).
- A RENDER-PHASE REF STAMP is legitimate only under three conditions,
  all three of them (T-042 criterion 4, the architect's ruling on
  T-024-s3; live example `app/src/genesis/GenesisPane.tsx`'s `logRef`
  write and the header comment above it). The fold must be GUARDED —
  returning `prev` BY IDENTITY for the already-observed and stale cases,
  so a StrictMode double-render and every unrelated re-render are
  no-ops; BOUNDED — what it feeds must tolerate a discarded concurrent
  render (a pulse window whose start moves by a few ms, cosmetic and
  self-healing); and DERIVED FROM PROPS THE RENDER ALREADY HAS — no
  I/O, no subscription, no second source of truth. Miss one and lift the
  state instead. Relocating such a log into a store is a change of
  SOURCE, not of mechanism, and it earns its cost when a SECOND CONSUMER
  appears — not before (T-027).
- THE FOUR WALKS — which one sees this file? (T-078, closing an open
  question every integrator was re-deriving.) This repo walks its own
  tree FOUR different ways and no two of them agree. The AUTHORITY column
  is where each answer actually lives; read THAT rather than trusting the
  row, which is a signpost and cannot be a gate.

  | walk | authority (the file that decides) | what it sees |
  |---|---|---|
  | the GRAPH — `supertaskr-index` | `.supertaskrignore`, plus `Lang::for_extension` and `walk_root` in app/src-tauri/crates/supertaskr-index/src/{graph,walk}.rs | `.ts .tsx .mts .cts .js .jsx` **and, since T-010, `.rs`** anywhere not ignored; `.git` and node_modules hard-skipped whatever the ignore files say; symlinks skipped outright |
  | lint TOKEN — P1–P4 **and P6**, over MASKED source | `TOKEN_ROOTS`, `TOKEN_EXTENSIONS`, `SKIP_DIRS`, `TOKEN_EXCLUDED_FILES` in tools/e2e/scripts/token-scan.mjs | `.ts .tsx .mjs` under app/src, app/test, tools/e2e, minus the two lint implementation files by NAME |
  | lint CONTROL — P5, over RAW bytes | `git ls-files -z` minus `SKIP_DIRS` minus `CONTROL_BINARY_EXTENSIONS`, same file (T-058) | every TRACKED first-party text file — docs, method, .github, Rust, both lockfiles, dotfiles and extensionless fixtures included |
  | the PARSER's live docs | lib/parser/src/project.ts, pinned by lib/parser/test/smoke.test.ts | docs/tasks/`T-*.md` and docs/architecture/components/`C-*.md`, both FLAT and non-recursive, plus docs/ROADMAP.md |

  WHAT THAT MEANS AT A DIFF: a new `.ts` under tools/ is seen by TOKEN
  and CONTROL and NOT by the graph (tools/ is `.supertaskrignore`d); a new
  `.rs` is seen by CONTROL AND BY THE GRAPH, and it is a CODE INPUT to
  `cargo test` besides (T-010, `T-010-s1`). The AUTHORITY column has
  survived every change unmoved while this table's enumerations went
  stale three times, each caught by a lane and none by a gate
  (`T-010-s1`, `T-079-s1`, T-086) — ADR-019's Law 2 in one row. A new
  `.md` under docs/ is seen by CONTROL, and by the PARSER only if it is
  a flat task card or component file. THIS FILE is seen by CONTROL only
  — the parser never reads it — **but live readers sit OUTSIDE all four
  walks and this file is one of the things they read, so an edit here
  can red a suite no row above can see** (T-078-s6, replaced at T-086: a
  reader list cannot be closed by prose). **WHICH READERS IS A
  DERIVATION, NEVER A SENTENCE**:
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root
  prints every derived reader with its suite, and the same gate run on
  your own diff — the DOCS GATE bullet below carries the one spelling —
  prints the suites your edit OWES. Run one of them before you hand
  off; do not count from this page. Two mechanisms stay named as
  SHAPES: the E2E lane parses the "Build & test" section (an edit to a
  command bullet can red workflow-parity.spec.ts), and the CARGO suite
  reads this file off disk on every run —
  `snapshot_version_matches_the_live_method_stamps` in
  app/src-tauri/src/agent/kit.rs asserts the
  `currently v<METHOD_SNAPSHOT_VERSION>` stamp in the FIRST gotcha
  above against a Rust `const`, so the method version is an ENFORCED
  PIN and a `[docs/CONVENTIONS.md, method/]` fence cannot carry a
  format bump (T-078-s3). AND THE COUNTS ARE PRINTED, NEVER PINNED:
  `npm run lint:tokens` reports both corpora on every run — DERIVE THE
  COUNT AT YOUR OWN REF (T-078-s4).
- THE RANGE RULE: WHICH TWO COMMITS "THE MERGE'S DIFF" MEANS, AND IT IS
  A DIFFERENT PAIR BEFORE THE MERGE EXISTS (T-083, correcting the single
  notation the two gate bullets below carried from T-046 to `ddcc8bb`).
  GRAPH REGEN and BOOT GATE both fire on "the merge's diff", and both
  are addressed to TWO readers: the INTEGRATOR, who has a merge commit,
  and the EXECUTOR, who does not — BOOT GATE assigns the executor in as
  many words ("THE EXECUTOR RUNS IT TOO, on the same trigger, before
  handing off"). ONE IDEA IN TWO POSITIONS: this rule is about WHICH TWO
  COMMITS YOU COMPARE and never about the notation, and it is the
  RIGHT-HAND endpoint that decides the left one.

  | you are | run this | why |
  |---|---|---|
  | AT the merge (integrator) | `git diff --name-only <main-before-the-merge>..<the merge commit>` | the merge commit already contains both parents, so this IS what the merge added to main |
  | BEFORE the merge (executor) | `TREE=$(git merge-tree --write-tree <main tip> HEAD)` then `git diff --name-only <main tip> "$TREE"` | there is no merge commit to point at, so BUILD the merge's tree and diff main against that — the same question, answered without writing a commit or moving a ref |

  **NEVER `<merge-base>..<the merge commit>`.** The merge-base is the
  branch POINT, so that range also carries everything MAIN did in the
  meantime — work that already passed this gate at its own merge.
  RE-MEASURED at T-027's merge `dc3ef5b`: the boot trigger matches **9**
  paths under the prescribed range and **36** under that one, and the
  extra **27** are T-014's indexer crate, already merged at `bdada11`
  and gated there. This bullet's oldest evidence, still exactly right —
  and right AT THE MERGE specifically, which is the distinction the rest
  of this bullet draws.
  **AND NEVER `<main>..HEAD` BEFORE THE MERGE**, which is the notation
  this rule used to hand to both readers. `git diff A..B` is `git diff A
  B`: a symmetric comparison of two divergent tips, so MAIN's own newer
  work comes back IN REVERSE, as though this branch had modified it.
  Measured on T-078's lane at main-before `d92dceb` and tip `d219482`:
  two dots return **76** paths, three dots and the merge-tree form
  return **16**, and the merge `fed70a2` itself changed **16**. A
  docs-only lane reads as having rewritten a Rust crate — the same lie
  this rule exists to prevent, produced by obeying it.
  **THE THREE-DOT FORM IS THE FORBIDDEN RANGE, SPELLED SO THAT IT LOOKS
  LIKE A REFINEMENT OF THE PRESCRIBED ONE.** `A...B` is DEFINITIONALLY
  `$(git merge-base A B)..B`. So `main...HEAD` IS `<merge-base>..HEAD`,
  the range banned by name two paragraphs up, and QUOTING THE BAN DOES
  NOT PROTECT YOU: this pipeline's own architect computed
  `d92dceb...d219482` in a dispatch brief while stating the rule
  correctly, and reached the right answer by the forbidden route.
  Reproduced on a fixture repository: before the merge, `A...B` and
  `$(git merge-base A B)..B` are BYTE-IDENTICAL under `cmp`. What makes
  three dots harmless before the merge is not the notation but the
  right-hand endpoint — HEAD is the BRANCH TIP there, merge-base(main,
  tip) is the branch point, and branch-point..tip is exactly the lane's
  own work. At the merge the same spelling COLLAPSES instead:
  `<main-before>` is an ANCESTOR of the merge commit, so
  merge-base(main-before, merge) IS main-before and three dots returns
  the prescribed set unchanged. WORKED AT T-080, all four figures at
  their own refs: `git merge-base --is-ancestor 99791ea 4683566` exits
  **0**, and at the merge `99791ea..4683566` and `99791ea...4683566`
  both return **12** paths; before it, against the branch tip instead,
  `99791ea..72bc98a` returns **60** and `99791ea...72bc98a` returns
  **12**. Same left-hand ref throughout, and the whole 48-path swing is
  the right-hand one. **The prescribed and the forbidden forms are
  indistinguishable exactly where this rule is addressed, and differ
  only where it used to say nothing** — so the ban has to name the
  PAIR, not the punctuation.
  **WHY `merge-tree` AND NOT THREE DOTS, since both are right before the
  merge.** Three dots answers "what has my branch changed since it was
  cut", which is a PROXY; `merge-tree` answers the gate's own question,
  "what will the merge's diff be", by building the merge's tree. Scored
  over the **31** first-parent merges on main from BOOT GATE's own merge
  `94ee306` through `ddcc8bb`, each pre-merge form against that merge's
  own later `M^1..M` diff. **A SCORE WITHOUT ITS METRIC IS NOT A
  FIGURE** — there are two metrics here and they disagree:

  | pre-merge form | PATH-FOR-PATH (`--name-only`, sorted, `cmp`) | BYTE-FOR-BYTE (whole patch, `cmp`) |
  |---|---|---|
  | `merge-tree --write-tree` | **29** of 31 | **29** of 31, the same 29 |
  | three dots | **30** of 31 | **24** of 31 |
  | pre-merge two dots | **3** of 31 | **3** of 31 |

  **THE ARGUMENT IS THE GAP BETWEEN THE COLUMNS, NOT EITHER COLUMN ON
  ITS OWN.** `merge-tree` scores the same under both metrics because it
  is not forecasting the merge, it IS the merge's tree: when it answers
  at all it answers in the merge's own bytes, and its two misses are the
  same two misses. Three dots is the only form whose two scores move,
  and the SIX merges it drops between them are six where it names
  EXACTLY the right paths and states them against the wrong baseline —
  `91ab46e`, `827511e`, `bdada11`, `64469dd`, `3b0d974` and `f4b38c8`,
  every one a merge where main and the branch had both touched the same
  file. **THAT SIX IS THE PROXY, MEASURED.** What diverges is less than
  "different content" and worse than "cosmetic", so state it exactly:
  one is blob hashes alone (`3b0d974`), three add only `@@` hunk-header
  line numbers because main inserted lines above the branch's own hunk
  (`91ab46e`, `827511e`, `64469dd`), one also moves context lines
  (`f4b38c8`), and only **2** of the 31 differ in a `+`/`-` line at all
  (`bdada11`, `634c405`). Right files, wrong coordinates: a branch diff
  is stated against the branch POINT, and the gate reads one stated
  against MAIN.
  **AND THREE DOTS' ONE EXTRA PATH WIN IS THE MERGE IT SHOULD HAVE
  REFUSED.** The single merge where three dots scores path-for-path and
  `merge-tree` does not is T-014's `bdada11`, where `merge-tree
  --write-tree` exits **1** and prints CONFLICT instead of a tree. Three
  dots hands back a clean-looking forecast for a merge nobody could
  perform without resolving it by hand — and is wrong on bytes there as
  well. A scoreboard that counts a refusal as a miss is scoring the
  wrong thing. **READ `merge-tree`'s EXIT CODE** — 0 is a tree, 1 is a
  conflict report, and a command substitution that swallows it hands you
  an EMPTY forecast wearing the costume of a clean gate.
  At T-028's merge `634c405` NEITHER form predicts under EITHER metric,
  because the integrator wrote into the merge commit itself
  (`tools/e2e/tests/window-contract.spec.ts` differs from BOTH parents
  there): no pre-merge forecast can see a file that does not exist on
  either side yet. That is the honest ceiling on the recommended
  command, and it is one merge in thirty-one.
  **RE-DERIVE BOTH COLUMNS RATHER THAN QUOTING THEM**, the way this
  bullet's flip list asks below. For each merge M the truth is `git diff
  M^1 M`; the three forecasts are `git diff M^1 $(git merge-tree
  --write-tree M^1 M^2)`, `git diff M^1...M^2` and `git diff M^1..M^2`;
  `cmp` each against the truth TWICE, once with `--name-only` through
  `sort` for the left column and once on the whole patch for the right.
  Forgiving `index` lines and nothing else is a THIRD metric — it lifts
  three dots to **25** and moves neither other row — and it needs its
  own label for exactly the same reason.
  **THE SENTENCE THAT SAID THIS NEVER CHANGES A GATE'S ANSWER IS FALSE,
  AND WAS FALSE LONG BEFORE ANYONE MEASURED IT.** It read: "It has never
  yet changed WHETHER the gate fires — both derivations fired all six
  times." Derived at `ddcc8bb` across those same 31 merges: the
  prescribed range says BOOT GATE is NOT owed **10** times and the naive
  range fires anyway on **8** of them; it says GRAPH REGEN is not owed
  **5** times and the naive range fires anyway on **5 of 5**. THIRTEEN
  FLIPS IN FIFTEEN CHANCES, over TWELVE distinct merges, chronologically
  and BY GATE — BOOT GATE at T-030 `59558de`, T-045 `3b0d974`, T-054
  `f58fc2b`, T-055 `20c45d4`, T-058 `7c6c5aa`, T-076 `79ae34a` (0 paths
  against 5), T-078 `fed70a2` (0 against 6) and T-080 `4683566` (0
  against 4); GRAPH REGEN at T-047 `3f2eb1e`, T-060 `91ab46e`, T-043
  `38886d3`, T-069 `7e3e8b5` (0 against 18) and T-078 `fed70a2` again (0
  against 18), which is the one merge that flips BOTH gates at once.
  Not "rarely": when the two derivations disagree at all, the naive one
  manufactures a gate run MORE OFTEN THAN NOT. THE MECHANISM is a lane
  fenced to ONE tree, cut from a checkpoint whose main then advanced in
  ANOTHER — the branch's own diff misses the trigger, main's advance
  carries it, and the naive range hands the branch main's work. Lanes
  are routinely fenced to one tree now, so this is the ORDINARY case and
  not an accident. DERIVE THE LIST, NEVER QUOTE IT — for each merge M,
  compare `git diff --name-only M^1..M` against
  `git diff --name-only $(git merge-base M^1 M^2)..M` and match each
  side against the gate's own trigger. Only FOUR of the twelve were on
  record when this correction was written: three named on T-083's card
  at `99791ea`, a fourth added by T-080's checkpoint `cb3aa31`. The
  other eight came back from that derivation, and three checkpoints
  running believed they were recording the first exceptions.
  **THE SENTENCE WAS NEVER TRUE — NOT FOR ONE COMMIT**, derived at
  T-083's merge `5c60e5a` because this bullet said "false for weeks"
  until someone checked: it was WRITTEN at `98f931e`, 2026-08-17
  05:50, and its earliest counterexample — T-030's merge `59558de` —
  landed at 02:21 the same morning, three and a half hours EARLIER and
  an ancestor of the commit that wrote it (`git merge-base
  --is-ancestor 59558de 98f931e` exits 0). "Weeks" was wrong in the
  other direction too: the repository was two days old. AN UNREFED
  DURATION GOES STALE EXACTLY THE WAY AN UNREFED COUNT DOES, and one
  `git log --format=%ci` settles both. THE FOURTH IS ALSO MIS-ATTRIBUTED
  WHERE IT IS RECORDED: `cb3aa31` lists T-076's flip under GRAPH REGEN,
  but at `79ae34a` GRAPH is 13 against 13 and it is BOOT GATE that goes
  0 against 5 — the numbers were right and the gate was not (T-083-s1).
  **EVERY ERROR MEASURED HERE IS IN THE OVER-FIRING DIRECTION.** At
  `ddcc8bb` there is NO merge where the naive range says a gate is not
  owed while the prescribed one says it is, and the pre-merge two-dot
  form only ever adds paths. So a wrong range wastes a boot check or a
  regen; it has not yet HIDDEN one. Do not read that as a licence — it
  is a property of this repository's history, re-derivable in a second,
  not a guarantee git gives you.
  **AND THE TWO COSTS DESERVE DIFFERENT WEIGHT**, because this rule used
  to be justified only by the smaller one. Presentation: it changes what
  you tell the human the merge touched, and a trigger set 4x too wide is
  a checkpoint that lies. Correctness: it changes WHETHER A GATE RUNS AT
  ALL — the twelve merges above. And the executor's failure is the worse
  of the two, because a lane reported as touching trees it never opened
  is a false red on somebody else's work, which is the one kind of noise
  nobody can dismiss by looking at it.
  **AND A FORECAST IS MEASURED, NEVER EXTRAPOLATED — ITS INVARIANT IS
  THE DELTA** (T-093, seventh triage). Three forecasts went stale in
  their ABSOLUTES in one session and none in its DELTA. The technique
  that holds: build the merge tree with the recipe above, wrap it in a
  throwaway `git commit-tree` so no ref moves, check THAT out detached
  with its own `CARGO_TARGET_DIR` (POISON DRILL below says why), and run
  the gate there. Reproduced against a main two merges later, both
  endpoints moved and the delta did not. So state the DELTA as the
  invariant and both ENDPOINTS as ref-bound, because a forecast checked
  by its delta alone would have reported "current" when it was not.
- GRAPH REGEN (T-009-s1's INTERIM rule, RETIRED at T-054 and replaced
  by this bullet — the retirement condition it carried, "when T-014's
  `index --check` becomes the gate", is met in the same commit that
  makes `index --check` a CI step): at any merge whose diff touches
  `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside docs/, regenerate the
  committed graph — `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index
  --test self_graph -- --ignored` — and commit docs/architecture/graph.json
  **with the CHECKPOINT**.
  **`*.rs` WAS ADDED 2026-08-25 AND THE GAP IT CLOSES WAS LIVE FOR ONE
  NIGHT** (`T-123-s5`): T-010's merge made `Lang::for_extension("rs")`
  answer `Some`, so Rust joined the walk while this trigger still named
  only the four TS/JS suffixes — the ONE direction the "wider than the
  walk" argument below does not protect, since a trigger NARROWER than
  the walk **misses a real movement** (T-123's rebuild measured a
  Rust-only diff moving the graph while this trigger matched 0 of 9
  paths). THE STANDING LESSON: the suffix list is a signpost that goes
  stale the day a language is added, and `index --check` is the
  authority — **ASK THE GATE**, which is why the gap cost nothing.
  **"The merge's diff" is the PAIR OF COMMITS THE RANGE RULE above
  names, and it is not the same pair before the merge exists as at it.**
  **THE TRIGGER IS DELIBERATELY WIDER THAN THE WALK, AND THE REGEN IS A
  NO-OP UNLESS AN INDEXED FILE MOVED** (T-054-s1): no suffix rule can
  match the walk — see THE FOUR WALKS above — because `.supertaskrignore`
  excludes docs/, tools/ AND the indexer's own fixture trees, so a diff
  confined to `tools/**` MATCHES this trigger and CANNOT move the graph
  by construction (T-054's branch and T-058's merge are the measured
  examples). DO NOT NARROW THE WORDING TO CHASE THE WALK — a trigger
  that restates `.supertaskrignore` goes stale the day that file changes,
  and over-firing is the SAFE direction. **ASK THE GATE INSTEAD OF
  PREDICTING**: `cargo run -p supertaskr-index -- index --check --root
  ../..` from app/src-tauri answers "did an indexed file move?" in about
  a second, and it is the same command the CI step runs. A regen that
  changes nothing costs a minute and PROVES it; a regen skipped on a
  guess proves nothing.
  WHAT RETIRED is the obligation to hand-run the byte-comparison
  afterwards: `index --check` is a written CI step and the ENFORCING
  copy since the repo's first push on 2026-08-29 (T-054-s4 closed at
  that push), and **the INTEGRATOR STILL RUNS IT BY HAND at the
  checkpoint and records the verdict there**. WHAT DID NOT RETIRE is
  the regen — `--check` DETECTS a stale graph, it never produces a fresh
  one. WHY THE CHECKPOINT AND NOT THE MERGE: the checkpoint edits
  INDEXED fixture files (app/test/architecture-dogfood.test.ts and
  app/test/map-dogfood-render.test.tsx), so a graph regenerated into the
  merge commit is stale again the moment those are reconciled (T-050:
  `index --check` exit 1 at the merge, 0 at the checkpoint). The rule
  read "with the merge" for twenty-nine regens while every integrator
  did the other thing; this is the practice, written down (T-014-s3).
  **AND THE PIN RECONCILIATION IS INTEGRATION-SEAT WORK: A LANE NEVER
  UPDATES THE PINS** (T-211). The dogfood fixtures a merge moves — the
  ids, the declared count, the relation table, the rendered node and
  edge totals — are reconciled AT THE CHECKPOINT, by whoever holds the
  integration checkout, never inside the lane whose merge moved them:
  **a lane re-pinning its own counts is asserting a total for a tree
  that does not exist yet**, stale the moment any other lane lands. A
  lane that finds a pin wrong states it in its notes and leaves the file
  alone. **READ THIS AS THE MERGE-MOVED CASE AND NOT AS DECLARING A
  COMPONENT ABOVE**, the one way a LANE legitimately writes those same
  files with its OWN diff; a MERGE REGEN alone moves only the two app
  fixtures. IF the regen cannot run THEN say so LOUDLY in the
  checkpoint, naming the reason — a skipped gate is news, never silence.
- THE LANE PROTOCOL — the generic rules are `method/lane-protocol.md`
  and are NOT restated here (T-089). That file rules one task/one
  branch/one worktree, the base commit, the sibling worktree, the
  executor never touching the integration branch, disjoint `touches:`,
  and who removes the worktree; it deliberately leaves every NAME to the
  project, and these are this project's:
  - integration branch `main`; branch `task/T-NNN-<slug>`; worktree
    `../supertaskr-T-NNN`, a sibling of the repo root and never a path
    inside it; bench worktree `../supertaskr-V-T-NNN`, the verifier's, cut
    DETACHED at the same base and never on a branch — a detached entry
    is not a lane and holds no fence, which is what keeps it out of the
    lane list (T-239 published this spelling; every bench on this
    machine already wore it and nothing stated it). Created with
    `git worktree add ../supertaskr-T-NNN -b task/T-NNN-<slug> <base>`, and
    the base is the bullet below. **BOTH BRANCH SPELLINGS ARE LIVE IN
    THIS REPO and the older `tNNN-…` one is not a mistake to fix**: the
    two sets overlap rather than succeed each other, so there is no
    cutover id to cite — derive the pair at your own ref (T-110-s2's
    card holds the census at `4d2f03c`).
  - the BRANCH IS KEPT after the merge and only the WORKTREE is removed
    (`git worktree remove`), so `git branch` lists every lane this repo
    has ever run and `git worktree list` lists only the live ones — and
    is therefore the authority on which fences are held right now; the
    board's `status: building` is not, while the dispatch stamp is
    lapsed (method/tasks/TASK-FORMAT.md's STAMP bullet). **READ IT AS
    ENTRIES ON A `task/T-NNN-*` BRANCH, NOT AS A ROW COUNT**: a detached
    entry is not a lane — a poison-drill checkout holds no fence and is
    named after no card — so filter on the branch and expect other
    lanes' scratch worktrees beside yours. **ONE DETACHED ENTRY IS
    PERMANENT — THE HUMAN'S APP CHECKOUT `../supertaskr-app`** (T-052; the
    bullet below has the account): detached ON PURPOSE, no fence, no
    card, NOT a lane; never count it or remove it after a merge. **DERIVE
    WHETHER IT EXISTS FROM `git worktree list`, NEVER FROM THIS FILE** —
    a worktree's existence is a LIVE-ENVIRONMENT fact like a pid.
  - A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING BUILT: no
    node_modules in any of the three packages, no `lib/parser/dist`, no
    `app/dist`, no `target/`. **THE ORDER A LANE RUNS BEFORE ITS SUITE
    IS THE ORDER tools/e2e's OWN PREFLIGHT DEMANDS**, and it refuses at
    config load naming whichever is missing: lib/parser `npm ci` + `npm
    run build` (its `dist/pure.js`), then app/ `npm ci` — **never `npm
    install` inside a lane**, which dies EACCES on the fenced lockfile
    (T-256) — then app/ `npm run build`, then tools/e2e `npm ci`, then
    the suite. **THE APP'S OWN BUILD IS ALSO ORDER-DEPENDENT, and the
    suite does not say so**: several app test files read the built
    bundle off `app/dist`, so `npm test`
    from app/ on an unbuilt worktree fails a handful of bodies — every
    message about a build being stale or absent rather than about the
    tree — and is whole again after `npm run build`. DERIVE the count
    at your own ref (12-of-840 when measured at `4d2f03c`). CI never
    sees it because ci.yml orders app build before app suite; a
    hand-run lane does.
  - **THE BRIEF IS ASSEMBLED BY THE ASSEMBLER, AND THIS IS THE SPELLING
    method/roles/orchestrator.md 5b POINTS AT** (`T-133-s3`: the RULE
    is product-agnostic and lives in the role file, the COMMAND is an
    supertaskr path and lives here). Run from the repository root:

        node tools/e2e/scripts/brief.mjs --task T-NNN

    and paste what it emits. Every row comes back with the source that
    row names and the ref or reading time it was derived at, and a row
    the command cannot derive is printed as NOT DERIVED with its source
    rather than filled in — a construction, where every brief written
    from memory on 2026-08-25 broke the clause after the one it quoted.
  - **THE FENCE IS A PROPERTY AT THE MOMENT OF THE WRITE, NOT ONLY A
    DISCIPLINE AT THE HANDOFF** (T-154, ADR-020 decision 1). After
    cutting the lane and before briefing the session, the dispatcher
    runs `node tools/e2e/scripts/brief.mjs --task T-NNN --write-fence
    <the lane worktree>`: it expands the card's `touches:` through the
    parser's ONE fence implementation and leaves the answer in the lane
    as `.supertaskr/lane-fence.json`. **AND THE STEP BEFORE IT IS THE
    PREFLIGHT** (T-160). **THE RITUAL IS EIGHT STEPS AND THE ORDER IS
    THE LAW**: stamp `building` on the integration branch and COMMIT,
    cut the lane worktree at that commit, PREFLIGHT, write the fence,
    READ THE MANIFEST BACK, cut the bench, assemble the brief to a file,
    derive the port and the scratch stem. That sentence read "derive the
    brief, PREFLIGHT the card, write the fence, stamp and cut" until
    T-239, an order no seat could perform — `--write-fence` is handed
    the worktree the CUT creates, and the stamp precedes the cut (the
    serial-ritual bullet above, method/roles/orchestrator.md 5b) — so it
    is CORRECTED here rather than argued beside. **ONE ARM PERFORMS ALL
    EIGHT AND REFUSES AT THE FIRST THAT FAILS**, naming the step, the
    command it ran and its exit in the four house codes, removing every
    worktree it cut and leaving the stamp standing (a stamp is a fact
    about the card, T-226):

        node tools/e2e/scripts/brief.mjs --dispatch-lane T-NNN --slug <slug>
          [--executor <seat>] [--verifier <seat>] [--scratch <dir>] [--dry-run]

    Run from the integration checkout by the seat that HOLDS it: it
    refuses a checkout that is not the integration one and a checkout
    another live session holds, before its first step. `--dry-run`
    prints the plan and performs nothing. The hand spellings below stay
    exactly what the arm runs, one at a time —
    `node tools/e2e/scripts/brief.mjs --task T-NNN --preflight` from the
    repository root re-derives at HEAD every claim the card makes that
    IS derivable (paths, the fence through the live slug map, stamped
    figures, `blocked_by:` against live statuses, `@ <hash>` ref stamps)
    and refuses the dispatch on any that no longer holds, in
    `--write-fence`'s refusal shape and exit codes; it judges no
    DESIRABILITY and says so. A discrepancy is corrected or ruled
    acceptable ON THE CARD, dated, with a `PREFLIGHT RULING (<date>):`
    line naming the finding's own SUBJECT — as a plain, unindented body
    line, because a ruling written as a `- ` list item, indented, or
    inside a fenced block is invisible to the reader (T-160's verdict,
    correction four). A failed preflight also GATES `--write-fence`. Not
    in "Build & test", for the reason the METHOD EVAL GATE gives about
    its own runner; wiring it into CI is a routed suggestion.
    A PreToolUse hook wired in `.claude/settings.json` then reads that
    file at every Edit/Write with no dependency a fresh worktree lacks.
    FOUR ANSWERS FOR A LANE, AND THE AUTHORITY IS `decide` IN
    `.claude/hooks/lane-fence.mjs` RATHER THAN THIS PAGE: a checkout not
    on a lane branch is ALLOWED — the integrator, the architect and
    every detached drill, the positive control that keeps a refusal
    distinguishable from an absence; a lane branch with NO manifest is
    REFUSED, a dispatch that skipped its step; a path inside the
    manifest or under the unfenceable `docs/tasks/` is allowed; anything
    else is refused, naming the fence, the path and the route. A card
    whose `touches:` no longer matches the manifest's stamp refuses with
    `re-expand`, so a fence cannot be widened from inside the lane —
    `method/lane-protocol.md` rule 5, made mechanical.
    **AND THE SEAT WITH NO LANE IS SEEN TOO** (`T-154-s2`; @human ruled
    those writes IN SCOPE on 2026-08-30): a checkout NOT on a lane branch
    — this one above all — is refused a write to any repository-relative
    path some LIVE lane's manifest reserves, read off git's own worktree
    administration with no subprocess. **THE CARVE-OUTS ARE CRITERIA AND
    NEVER THE HOOK'S JUDGEMENT**: `docs/tasks/` stays unfenceable (every
    manifest carries it as `alwaysWritable`, so the dispatch and closing
    stamps are safe), a card's own file is outside every fence —
    `expandFence`'s subtraction at dispatch and never an arm at the
    write, since `T-219-s3` removed the one no manifest could select —
    and this seat's own standing writes are never a lane's
    to veto — exactly `docs/STATE.md` and `docs/checkpoints`, no more.
    ONE CRITERION IS THE HOOK'S OWN: a checkout git records as
    mid-merge, mid-rebase, mid-revert or mid-cherry-pick is free,
    because resolving a lane's merge is an Edit inside that fence by
    construction. **AND IT CLOSES BEFORE THE LANE DOES**: git drops the
    marker at the merge COMMIT while rule 6 keeps the worktree until
    after the CHECKPOINT, so an Edit into a just-merged fence is refused
    for that window, where this project's verdict corrections land —
    remove the worktree before the reconciling writes (`T-154-s2`).
    **AND SINCE `T-249` IT SCREENS A READ, WHICH IS NOT A FENCE AND IS
    NOT WIDENED BY ONE**: `decide` asks `SECRET_SET` — ONE list in
    `.claude/hooks/lane-fence.mjs`, as DATA, seven entries, each
    carrying a `sample` the spec drives as that entry's own positive
    control and requires no OTHER entry to claim — FIRST for a read
    tool, and never reaches the fence. So a card whose `touches:` NAMES
    an env file, a private key, an ssh or cloud credential directory or
    a keychain export still may not read it: A FENCE WIDENS WRITES AND
    NEVER SECRETS, and the seat that needs a secret's SHAPE asks the
    human for a REDACTED sample in the transcript, where it is not a
    record. **READS ARE SCREENED, NOT FENCED** — a read OUTSIDE the
    lane's fence is ALLOWED, because a lane that may not read `docs/`
    cannot work, and a guard that kills lanes is a guard somebody turns
    off. **AND IT FAILS OPEN ON CLASSIFICATION**, the exact inverse of
    the lane arm's every-uncertainty-is-a-refusal: a path this hook
    cannot classify — no path in the request, a NUL in the target, a
    target resolving to a filesystem root — is ALLOWED and LOGGED,
    naming the path and the reason, because the one failure a fail-open
    guard must not have is silence. Its two answers, `secret-read` and
    `secret-unclassified`, are their OWN frozen set
    (`SECRET_READ_CODES`) and deliberately NOT members of the four
    below, which are the WRITE fence's limit codes and are published
    here entry for entry. Exactly ONE entry is DERIVED from the tree's
    own ignore files and records it — `*.local`, from `app/.gitignore`
    — which is all NINE tracked ignore files name between them,
    measured at `828621f5`; the spec re-derives at its own ref, so a
    new ignore pattern that goes uncovered reds by name. TWO
    OVER-REFUSALS ARE DELIBERATE AND DECLARED: `.env.example` is
    refused with every other `.env.*`, because a suffix is chosen by
    whoever named the file, and a project `.npmrc` is refused because
    an auth token sits in one beside its ordinary settings. **AND IT IS
    UNARMED AT THE HARNESS UNTIL `.claude/settings.json` MATCHES A READ
    TOOL**: that matcher reads `Edit|Write|NotebookEdit` at `T-249`'s
    tip, so `decide` answers correctly and nothing asks it. The hook's
    own header says so, and `lane-fence.spec.ts` carries the record of
    which world this is — asserting that sentence today and a real
    exit-2 refusal through the process boundary the moment a read tool
    is named.
    **THE LIMITS — A GUARD BELIEVED WIDER THAN IT IS IS WORSE THAN NO
    GUARD** — eight, numbered in `.claude/hooks/lane-fence.mjs`'s
    HONEST LIMITS header, whose count and four declining CODES
    `tools/e2e/tests/lane-fence.spec.ts` COMPARES against this page;
    the prose alone is by hand. (1) A Bash-mediated write — `sed -i`, a
    `>` redirect, a checkout — reaches disk without an Edit or a Write,
    so **TWO LAYERS FENCE A LANE AND NEITHER IS SUFFICIENT**
    (`method/lane-protocol.md` rule 5, `T-210`): this hook judges an
    Edit, including one into ANOTHER lane's tree, which never enters
    this lane's diff; the PHYSICAL layer leaves out-of-fence tracked
    files read-only, so a shell write takes `EACCES` unparsed — but
    only on an OPEN, never a rename-over (the canonical `sed -i`), a
    create, a delete or git, which also DISARMS the bit, and that
    residue is the landing gate's half. (2) A path in NO GIT CHECKOUT
    AT ALL is not judged (`not-a-repository`), and since `T-199` that
    is the WHOLE of it: the scratchpad and `/tmp` stay reachable. It
    read *outside the WRITING checkout* until `T-199`, which left EVERY
    lane write UNJUDGED; the root now comes from the TARGET. **THE
    RESIDUE**: a sibling lane's tree is judged by THAT LANE'S fence,
    and the hook has no term separating an architect reaching in from
    that lane's OWN executor. (3) A DETACHED checkout is not judged at
    all (`not-judged-detached`), which frees the poison drill and the
    human's app checkout. (4) A live lane whose manifest this seat
    cannot read reserves nothing (`not-judged-lane-list`). (5) It is
    ADVICE TO A COOPERATING HARNESS: a session that can edit
    `.claude/settings.json` disarms it. (6) is the mid-integration
    window above. (7) Containment compares BYTES and this volume does
    not, so `DOCS/ROADMAP.md` passes the lane-less seat where
    `docs/ROADMAP.md` is refused; the LANE arm has no such escape.
    (8) A request with no readable path is the one question the
    WRITER's cwd still answers — refused in a lane, DECLINED
    (`no-path-to-judge`) elsewhere, which a lane executor, sitting in
    the dispatching checkout, takes. Every decline carries
    `judged: false` and speaks on **stderr**. And **IT FAILS OPEN IN
    TWO SHAPES**: a script that cannot be LOCATED never starts — two
    faults, `CLAUDE_PROJECT_DIR` unset AND a cwd outside any checkout
    carrying the hook; and on ONE fault, a COMPLETE registration whose
    hook FILE is gone still spawns node, which exits 1 where blocking
    is 2, so nothing refuses while the checkout looks configured
    (`checkout-currency.spec.ts`, ARM B). **SO *"a PreToolUse hook
    enforces it"* IS A CLAIM ABOUT THE DISPATCHING CHECKOUT AND NEVER
    ABOUT THE LANE**: `.claude/settings.json` runs the hook out of
    `${CLAUDE_PROJECT_DIR:-.}`, the SESSION's project root, so a lane
    meets the DISPATCHER's copy — true only from `T-199` forward and
    only for a session started in a checkout carrying it; the arm-time
    catcher asks (`T-216-s1`, `checkout-currency.mjs`). The manifest is
    a RUNTIME file carrying a self-ignoring `.gitignore` beside it: one
    that reached the integration branch would hand every checkout one
    lane's permanently stale fence.
- THE MAIN CHECKOUT IS SHARED WITH A HUMAN RUNNING THE APP, AND THE
  PIPELINE HAS KILLED IT THERE (T-052 — ten instances across
  2026-08-16/24, itemised on that card). **The generic rules are
  `method/roles/integrator.md`'s "The checkout you merge into may be in
  use" and are NOT restated here** — that file rules the fresh install,
  the dependency-artifact channel, the checkpoint record and the
  no-scratch-files rule, and leaves every mechanism to the project.
  These are this project's mechanisms.
  **THE APP'S TWO TRIGGER SETS ARE DIFFERENT SETS.** `tauri dev`
  rebuilds and RELAUNCHES the binary on a change under
  `app/src-tauri/**`; a change under `app/src/**` goes to vite HMR and
  the window is never replaced — and the relaunch fires at the
  WORKING-TREE WRITE, seconds ahead of the commit an integrator would
  date it by. BOOT GATE's trigger is a THIRD set (what could stop the
  app BOOTING); derive none from another.
  **ANCHOR THE PROCESS MATCH OR THE MEASUREMENT LIES**:
  `ps | grep 'target/debug/supertaskr'` matches `supertaskr-index` as a
  substring, so an integrator's own graph-gate run reads exactly like a
  relaunch — anchor with
  `ps -eo pid,lstart,command | awk '$NF=="target/debug/supertaskr"'`.
  **THE FRESH INSTALL IS THE ONE CHANNEL THAT CORRUPTS RATHER THAN
  INTERRUPTS.** `npm ci` removes `app/node_modules` while the human's
  vite serves out of it; a running vite SURVIVES the removal, but what
  the NEXT read needs is destroyed (`node_modules/.vite` deleted and not
  recreated) and `tauri dev` is more than vite, so nothing licenses
  running the install beside a live app. The rule stands on the WINDOW,
  not on a kill.
  DETECT AND REFUSE, in the T-046 form: read the holder with
  `lsof -nP -iTCP:<port> -sTCP:LISTEN`, and for 1420 that is the ONLY
  command permitted (see PORT RULE) — **never bind-probe, and never
  connect**. On a hit, name the step you are skipping, the pid and
  socket you read, and what has to happen first. On no hit, PROCEED: a
  refusal that fires whether or not the app is up cannot tell the two
  apart, which is the NEGATIVE ASSERTION rule below applied to a
  procedure.
  **`lib/parser/dist` REACHES THE RUNNING APP WITH NOTHING UNDER `app/`
  IN THE DIFF.** The app depends on `@supertaskr/parser` through
  `file:../lib/parser`, which npm installs as a SYMLINK, so the built
  `dist/` the running vite serves is the parser's own directory: a
  lib-only merge that rebuilds it changes what the app is serving
  (instance 5). The question is never "does my diff name a file the app
  owns" but **"which build outputs does the running app read"** — the
  fresh-clone ORDER at the top of this file answers it, and a docs-only
  diff is not exempt, because an integrator who runs the install order
  runs the parser build.
  **A PROBE OR SCRATCH FILE IN THE MAIN CHECKOUT IS A VIOLATION** (the
  unexplained `zz-scope-probe.ts` of instance 9), **and a lane worktree
  parked INSIDE the tree is the same violation in a larger shape**:
  `git worktree add ../supertaskr-T-NNN` typed while the shell sits in
  `tools/e2e` lands in `tools/`, silently. Cut worktrees with an
  ABSOLUTE path, or verify the cwd first. **NAME YOUR PATHS; never
  `git add -A` and never `git commit -a` in the main checkout** — a
  parked worktree makes `git add -A` a thousand-file stage. Scratch work
  belongs in a DETACHED sibling worktree with its own name, or outside
  the repository; an unexplained file found here is RECORDED in the
  checkpoint and LEFT — its provenance is evidence.
  **@HUMAN'S RULING 2026-08-25 — THE SECOND CHECKOUT IS ADOPTED AND THE
  MECHANISM IS A DETACHED WORKTREE.** The criteria, quoted because they
  decide which arguments count: *"It doesn't bother me as a user if the
  app restarts. The only thing I'm concerned about is if something
  breaks or if development work suffers."* The restart is not a cost;
  what survives is the fresh-install BREAKAGE channel above and cargo's
  target-dir THROUGHPUT channel, and the detached checkout closes both.
  Setup, when the tree is quiet:

      git worktree add --detach ../supertaskr-app main

  then the fresh-clone ORDER at the top of this file, inside it; it
  updates with one command, when the human chooses:

      git -C ../supertaskr-app checkout --detach main

  **BEING DETACHED IS THE FEATURE** — the app's code cannot move on its
  own, so the pipeline may merge all night; the app still OPENS
  `/Users/ujju/Projects/supertaskr` as its project. Whether it exists,
  where 1420's holder runs from, and the two target-dir mtimes are
  LIVE-ENVIRONMENT facts — re-derive them (`git -C ../supertaskr-app
  rev-parse HEAD`, `lsof -p <pid>`), never quote them. **AND IT EXCUSES
  NOTHING ABOVE**: every rule in this bullet binds whether or not
  `../supertaskr-app` exists.
- DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  (T-014-s3, seven-for-seven): cut a task branch from the newest
  `Checkpoint:` commit on main. **READ THE REASON, NOT ONLY THE
  SENTENCE — THE TWO DISAGREE** (T-089, itself dispatched from a
  docs-only commit four after the newest checkpoint, obeying the reason
  while failing the letter). The rule bans a MERGE commit, and the
  reason is a stale graph: a merge commit carries a graph the checkpoint
  has not regenerated yet (GRAPH REGEN above), so a lane cut from one
  inherits a stale graph and a red `index --check` through no fault of
  its own — T-014 is the counter-example, T-027 the worked example the
  other way. A non-merge commit later than the checkpoint carries the
  checkpoint's graph and is safe ON THAT COUNT. **But "safe" is all its
  gates green, not only the graph**: a docs-only non-merge commit can
  still red a code suite through FRONTMATTER (the DOCS GATE), which no
  graph argument covers — so this holds by PRACTICE, verified, NOT by
  property; nothing forbids a source commit between checkpoints. What
  the bullet means is: cut from a commit whose gates are green, which
  the newest `Checkpoint:` always is and a merge commit never is. This
  rule is what makes the window HARMLESS; the CI gate above is what
  makes it VISIBLE. Both, not either.
- BOOT GATE (T-046, ratified at the 2026-08-16 triage on T-040-s1 +
  T-020-s3): at any merge whose diff touches `app/src-tauri/**`,
  `app/src/**` or either manifest (app/package.json,
  app/src-tauri/Cargo.toml) — **and "the merge's diff" is the PAIR OF
  COMMITS THE RANGE RULE above names, which is a DIFFERENT pair before
  the merge exists than at it** (that bullet carries this gate's oldest
  worked example, T-027, and the twelve merges on which the wrong pair
  changed a gate's answer, eight of them this gate's). Then run the boot
  check — `SUPERTASKR_BOOT_PORT=<free scratch port> npm run boot:check` from
  tools/e2e/ — and RECORD the result (exit code, both `[supertaskr]` lines)
  in the checkpoint; the four exit codes are legended in the tools/e2e
  commands bullet under "Build & test" above. IF the check cannot run
  THEN say so LOUDLY in the checkpoint, naming the reason and the exit
  code — a skipped gate is news, never silence. It exists because
  `cargo run` is the ONE command this pipeline never issues: T-040, a
  one-line manifest regression that stopped the app launching at all,
  passed an executor, an adversarial verifier and an integrator, each of
  whom ran `cargo test`, `cargo build` and three full suites — all
  perfectly happy with two binaries. THE EXECUTOR RUNS IT TOO, on the
  same trigger, before handing off (T-046 criterion 6): a red the
  executor's own fence forbids fixing is still news, cheaper at build
  time than after a merge — file it as a suggestion and say so in the
  notes. Running it is NOT screen control (@human ruling 2026-08-16):
  the app opens and closes its own window; nothing is clicked, typed
  into, screenshotted, or read off the screen.
- DOCS GATE (T-084 — the third standing gate, and the one the two above
  exclude BY CONSTRUCTION): at any merge whose diff touches a path under
  `docs/` that a code suite READS, run the suites that read it, and
  RECORD which and their results in the checkpoint. **"The merge's diff"
  is the PAIR OF COMMITS THE RANGE RULE names**, the same pair both
  gates above take, and a different pair before the merge exists than at
  it. `docs/` IS A CODE INPUT and neither trigger above can see it:
  GRAPH REGEN fires on `*.ts/*.tsx/*.js/*.jsx` OUTSIDE docs/, BOOT GATE
  on `app/src/**`, `app/src-tauri/**` or a manifest, so a commit whose
  whole diff is `docs/tasks/*.md` matches NEITHER — and it has redded a
  suite twice, `9c64cd8` (two card titles opening with a backtick, both
  cards silently unparseable, four scroll-containment bodies red) and
  `fede266` (a `status:` outside the parser's vocabulary, the app suite
  at 830 of 831 on a diff of ONE markdown file, T-081-s9), **both found
  three layers from the cause by somebody who was not looking**: the
  failure mode is a red that arrives detached from its edit and gets
  attributed to whatever lane is nearest.
  RUN IT — from the repo root, and this is THE ONE SPELLING, character
  for character the same string `tools/e2e/scripts/docs-gate.mjs`'s own
  header prints (T-057: a recipe in two places is two chances to
  disagree, and for six weeks these two disagreed):

      TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
      node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

  It is fed the RANGE RULE's own path list and deliberately computes no
  range of its own. Exit 0 nothing owed, 1 the gate HAS a verdict
  (suites owed, or a live card the parser will refuse, or the
  root-anchor account and the tree disagree), 2 called wrong, 3 the gate
  could not run — the same four codes `index --check` and `boot:check`
  use.
  **THERE IS NO `xargs` IN THAT SPELLING AND THAT IS THE POINT** (T-090,
  absorbing T-061-s3; BSD measured at `9b03ae6` against `/usr/bin/xargs`,
  the GNU piped column on ubuntu-24.04 by CI runs 33259394002 and
  33260414204, read in by T-153-s6). A pipe through `xargs` destroys two
  of the four codes, in the direction the codes exist to prevent, and
  DIFFERENTLY on the two platforms. THE MATRIX, each code produced
  deliberately and read from `$?` on an unpiped command:

  | the gate means | `$(…)` form, BSD | `$(…)` form, GNU | piped, BSD | piped, GNU |
  |---|---|---|---|---|
  | 0 nothing owed | **0** | **0** | 0 | 0 |
  | 1 has a verdict | **1** | **1** | 1 | **123** |
  | 2 called wrong | **2** | **2** | **1**, or **0** on an empty list | **123**, and **123** on an empty list |
  | 3 could not run | **3** | **3** | **1** | **123** |

  Under BSD the pipe HIDES a failed range as a clean gate (every utility
  exit collapses to **1**, and on EMPTY input the utility is never
  invoked so the pipeline exits **0**); under GNU the IDENTITY of the
  codes is destroyed instead, 1, 2 and 3 all arriving as 123, because
  GNU `xargs` RUNS the utility on empty input and maps the gate's own
  refusal at 2 to 123 — where this table, filled in from BSD, once
  predicted 0. `tools/e2e/scripts/xargs-dialect.mjs` PROBES the dialect
  at run time, two observables and never `process.platform`, so the
  bodies that execute the piped column read the column for the dialect
  they measured; the `$(…)` column has no `xargs` process in it at all.
  **THAT ASYMMETRY IS THE ARGUMENT**: a spelling whose correctness must
  be re-measured per platform is one nobody will re-measure.
  **AN EMPTY PATH LIST IS EXIT 2, NOT EXIT 0** (T-084-s6), and the `$(…)`
  form is what makes that reachable: a FAILED range substitutes to zero
  arguments. THREE MORE SHAPES REACH EXIT 2, each once answered "not
  owed" at 0: an argument that is EMPTY or BLANK (`"$(git diff …)"` on a
  failed range is a list of length ONE, T-064-s7); an argument carrying
  NEWLINES (the same quoting on a range that SUCCEEDED, T-064-s7); and a
  path resolving OUTSIDE this repository, which is what `../../docs/…`
  typed from tools/e2e/ used to mean (T-101-s3). A `./`-prefixed or
  ABSOLUTE spelling is normalised and answered; a PLAIN relative path
  away from the repo root is refused as ambiguous.
  **`npm run lint:docs` FROM tools/e2e IS THE NAMED FORM AND CI'S STEP**
  (T-090), AND IT BUYS HALF — the WHOLE-TREE half, judging NO diff,
  because a workflow has no "merge's diff" to be handed; both incidents
  above are in that half. THE DIFF HALF IS STILL A RITUAL: nothing but
  the integrator running the two lines above makes a merge answer for
  the suites it owes. **AND ITS EXIT 0 MEANS *I WAS NOT ASKED*, NEVER
  *NOTHING OWED*** (T-142-s1): read its LAST LINE, which names the half
  it answered. IF it cannot run THEN say so LOUDLY in the checkpoint,
  naming the reason and the exit code.
  `tools/e2e/tests/docs-input-gate.spec.ts` is the enforcing copy and
  runs inside the lane.
  THE READER SET IS DERIVED FROM THE TREE, NEVER LISTED — a hand list is
  the defect T-058 and T-080 each spent a card on — and **THE
  DERIVATION'S AUTHORITY IS `tools/e2e/scripts/docs-scan.mjs`'s OWN
  `THE DERIVATION` HEADER, NOT THIS PARAGRAPH** (T-162 corrected a
  superseded wording here; T-085 subsumed the old two-halves rule under
  ONE containment test so that a docs path written relative to a PACKAGE
  directory is SEEN). The SHAPE is two arms — a DOCS SITE, a
  path-forming call whose docs-shaped literal RESOLVES inside this
  repository's docs/; or a CALL SITE, a call that HANDS the repository
  root to a first-party function which spends it on a docs path
  (`lib/parser/test/smoke.test.ts` calls `parseProject(repoRoot)` and
  spells no docs path; with the literal arm alone a ROADMAP edit owed
  the e2e lane while the parser suite went red unnamed, T-084). Fixture
  readers stay out by the same test — `lib/parser/test/files.test.ts`
  resolves OUTSIDE `<root>/docs`. **A file that does BOTH and cannot be
  linked is REPORTED, never dropped**, and the reporting arm follows
  IMPORTS as well as local bindings. **NO COUNT IS TRANSCRIBED INTO THIS
  BULLET** — the census it once carried was green and wrong:
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root
  prints the site census, the reader set with the arm that found each,
  the root-anchor classification and the residual, and cannot be stale
  because it is not written down.
  **AND SINCE T-271 THIS READER MAP IS ALSO THE SCOPED LEG'S OWN
  DERIVATION.** When an EXECUTOR grades narrower than a leg (the blessed
  runner's own bullet above, its `--owning` form), the docs-walk bodies a
  changed docs path owes come from THIS map — the runner reuses it and derives no
  second one, which is T-057's rule applied where it would have bitten
  hardest — composed with the runner's own static import graph, because a
  reader here may be a SCRIPT rather than a body and the spec that owns
  THAT is the one importing it. **THE NARROWING IS THE EXECUTOR'S
  ALONE**: the verifier's one run is the full four legs, and the
  integrator runs the full battery last, on merged main before the push.
  THE FOUR SUITES the derived readers sit in, listed so a reader knows
  the shape and re-derivable so nobody quotes them: `npm test from app/`
  (the two dogfood bodies), `npx vitest run from lib/parser/` (its own
  live-tree bodies), `npm test from tools/e2e/` (two specs that walk the
  whole of docs/, graph and all) and `cargo test from app/src-tauri/`
  (docs/CONVENTIONS.md on every run, plus the component registry). The
  card that opened this named one suite; the tree says all four.
  THE TRIGGER IS WIDE AND THE ANSWER IS NARROW, deliberately: EVERY path
  under docs/ reaches a reader (two lane specs walk all of it), so
  narrowing the TRIGGER would be a lie, and what is proportional is the
  ANSWER — at `c4c15c8` ONE command for `docs/rooms/*.md`, TWO for this
  file, THREE for a flat task card, **the answer's SHAPE and not its
  census** (T-086). Ask the gate; do not predict.
  THE OTHER HALF IS THE FRONTMATTER, asked of the WHOLE TREE and not
  only of the diff: every live flat `docs/tasks/T-*.md` must parse, and
  its `status:` must be in the parser's vocabulary, which the gate READS
  out of `lib/parser/src/types.ts` rather than restating (T-057) — one
  status vocabulary, honoured here with no edit when a ninth is added
  there. It names the FILE, the FIELD and the near miss.
  `.supertaskrignore` IS UNTOUCHED AND THAT IS DELIBERATE: it excludes
  docs/ because the graph is CODE-derived, so `index --check` is not the
  gate that missed this; the exclusion is asserted in the spec so "we
  decided" cannot be mistaken for "we forgot".
- METHOD EVAL GATE (T-155, ADR-020 decision 2 — the FOURTH standing gate,
  and the one the three above exclude BY CONSTRUCTION): at any merge whose
  diff touches `method/**`, OR ADDS A LINE MATCHING THE CITATION GRAMMAR
  (`attack set: sha256:<hex> (<file>)`) under `docs/tasks/` — a verdict
  landing, the merge `MF-10` was built for — run the model-free eval set
  and RECORD its exit in the checkpoint. **"The merge's diff" is the PAIR OF COMMITS THE
  RANGE RULE names**, the same pair all three gates above take, and a
  different pair before the merge exists than at it.
  DERIVE THE HOLE RATHER THAN TAKING IT ON FAITH — match a
  `method/**`-only diff against the three triggers: GRAPH REGEN wants a
  code suffix OUTSIDE docs/, BOOT GATE wants `app/src/**`,
  `app/src-tauri/**` or a manifest, the DOCS GATE wants a path under
  `docs/`. A method-only diff matches NONE of them. The method files ARE
  pinned — `app/src-tauri/src/agent/kit.rs` compiles a subset of method/
  into the genesis kit and reds on a byte drift — but **A BYTE PIN AND A
  TESTED EFFECT ARE DIFFERENT CLAIMS**: a rewrite of a role file
  satisfies the pin by being committed, and changes what every session
  produces.
  RUN IT — from the repo root, and this is THE ONE SPELLING, character
  for character the same string `tools/method-evals/run.mjs`'s own header
  prints:

      node tools/method-evals/run.mjs

  Exit 0 nothing owed · 1 the suite HAS a verdict · 2 called wrong · 3 the
  suite COULD NOT RUN — the same four codes `index --check`, `boot:check`,
  the token lint, the DOCS GATE and `brief.mjs` use. The AUTHORITY is the
  frozen `EXIT` object in tools/method-evals/lib/exit.mjs, which the
  runner IMPORTS rather than re-typing the numbers. ZERO DEPENDENCIES
  AND NO INSTALL: like the token lint it reads no `node_modules`
  anywhere, so it answers against a bare checkout.
  THE TWO SETS ARE TWO COSTS, NOT TWO STYLES. `--set model-free` is
  deterministic, spends no tokens, and is the half THIS trigger owes.
  `--set model-in-loop` samples a nondeterministic process, so its
  verdict is a PASS RATE against a declared threshold; it is owed at a
  METHOD VERSION BUMP and on schedule, never per-commit (the first gotcha
  of this section). **A REPLAYED MODEL-IN-LOOP RUN IS NOT A
  MEASUREMENT**: the replay runner's pass rate is 1.00 by construction,
  and every result line and the `--bump` block name the RUNNER for
  exactly that reason. THE POSITIVE CONTROL IS PART OF THE SUITE AND IS
  RUN, NEVER ASSUMED: `--selftest` degrades each eval's own contract on
  a COPY and requires the eval to detect it — A NEGATIVE ASSERTION NEEDS
  A POSITIVE CONTROL applied to the checker.
  IT IS NOT IN "Build & test" ABOVE, DELIBERATELY, AND THE REASON IS
  MECHANICAL: `deriveExpectedSteps` in
  tools/e2e/tests/workflow-parity.spec.ts reads EXACTLY the
  `run from <dir>/:` bullets that section carries and reds by name on a
  fifth, so exposing the command there is a two-package edit — that spec
  plus ci.yml — which T-155's fence reached neither of; the command lives
  beside the gate it serves. Wiring it into CI is `T-155-s1`, and until
  that lands this gate is a written ritual with one tripwire. IF the
  suite cannot run THEN say so LOUDLY in the checkpoint, naming the
  reason and the exit code — a skipped gate is news, never silence.
  AND THIS GATE CLOSES THE TRIGGER HOLE, NOT THE CARGO ONE (`T-132-s2`'s
  residual, taken at T-159): a `method/**` diff now matches a trigger,
  and it still owes `cargo test` that no trigger names — `kit.rs`
  `include_str!`s a SUBSET of method/ into `supertaskr_lib`, and two cargo
  bodies read `method/` off disk and assert against it,
  `every_compiled_entry_matches_its_method_file_byte_for_byte` and
  `the_snapshot_table_covers_every_method_scaffold_file`. **THE
  BOUNDARY RUNS THROUGH `method/`, SO THE DIRECTORY NAME ANSWERS
  NOTHING**: DERIVE which paths from `KIT_FILES` at your own ref and run
  `cargo test` when your diff hits one; widening this gate's trigger to
  fire cargo stays that card's.
- HEALTH BANDS AT THE CHECKPOINT (T-156, ADR-020 decision 3; this bullet
  is the half that card's `[tools/e2e]` fence could not write, taken as
  `T-156-s1`) — **A REPORTER, NOT A FIFTH STANDING GATE, AND THE
  DISTINCTION IS THE POINT**: no tier acts on its answer, it declares no
  merge-diff trigger, and it is enumerated with `index --watch`, `arch`
  and the orphan drill rather than with the four gates above.
  RUN IT — from tools/e2e/, at every checkpoint:

      npm run health
      npm run health -- --readings <the checkpoint's captured output>

  **THE `--` IS LOAD-BEARING AND ITS ABSENCE IS LOUD** (the same npm
  behaviour the PORT RULE bullet measures): without it npm eats the flag
  and hands the script the bare path, which it refuses — *"this command
  takes flags, never paths"* — at exit 2. Four codes again: 0 clean, 1 a
  band is BREACHED, 2 called wrong, 3 the run could not read what it
  needed, and **3 takes precedence over 1** because a run that could not
  read three of its bands is not a claim about the tree however loud
  the breach it did read. The AUTHORITY is the frozen `EXIT` object in
  tools/e2e/scripts/health-bands.mjs, and the LIMITS are data in
  tools/e2e/scripts/health-bands.config.mjs, tuned by TRIAGE and never
  by the session that trips them — that file's header is the argument.
  **EXIT 3 IS THE DESIGNED ANSWER TODAY, NOT A BREAKAGE**: four bands are
  declared with no keeper and are named on every run, docs/STATE.md says
  so, and the two failures this bullet exists to prevent are reading
  that 3 as clean and "fixing" it.
  WHAT THE CHECKPOINT OWES, AND THE RECORD TEMPLATE CARRIES THE SHAPE
  (docs/checkpoints/TEMPLATE.md, Gates and Metrics): the CENSUS LINE and
  the EXIT, read unpiped, plus the readings that turn the three
  readings-authority bands from UNREAD into a reading — the output of
  `cargo test` and `index --check` from app/src-tauri/ and `npm test`
  from tools/e2e/, captured with a redirect and read from `$?` (a bare
  `| tee` hands you tee's status). The record's own `Gate runtime:`
  total is `machinery/gate-seconds`'s only reading, and its `Cold
  start:` and `Drift incidents:` lines are the two docs/NORTH_STAR.md
  indicators' only markers — **owed by the SESSION every time rather
  than by whoever noticed a problem**, because a denominator that
  collects successes only is worse than no band.
  **THE GRAPH BAND'S READING IS THE INTEGRATOR'S AND A LANE CANNOT HOLD
  IT HONESTLY**: `index --check` is `graph/budget-headroom-bytes`'s
  authority, and a worktree that has built anything with cargo has its
  own target directory inside the graph walk (`T-153-s3`, `T-111-s10`),
  so a lane's number is about the lane. Take it from the checkout the
  merge is integrated in, or record the band as not read and say which.
  **AND NOTHING MAY SCAN THE RECORDS FOR ANY OF THIS** (ADR-019's Records
  clause): the marker reaches the command hand-carried into `--readings`
  at the checkpoint that wrote it, never as a walk of docs/checkpoints/.
  **AND SINCE T-297 THE LOOP ITSELF IS TWO OF THE BANDS** (ADR-024
  decision 1, whose budgets they hold: 20 min/80K bounded, 75 min/310K
  standard, 100 min/450K guarded). `loop/cycle-budget-used` prices every
  card merged in this checkpoint's window from its own `T-NNN: dispatch
  stamp` commit to the merge that appended its reading;
  `loop/token-budget-used` sums the seats' own token figures out of
  their `## Meters` blocks. Both report the WORST card in the window as
  a SHARE of that card's own tier budget — one line has to hold three
  tiers whose budgets differ five-fold — and both go UNREAD rather than
  green when a card in the window cannot be priced whole: an unknown
  tier, a missing dispatch stamp, or a seat that stated no tokens, which
  is not a smaller number but a lower bound wearing a measurement's
  clothes. The cycle reading is a FLOOR and its derivation says so on
  every line it prints: the tree ends at the merge and CI green is
  minutes later in an API. The third reading is ADR-024's own —
  `loop/soft-verifier` flags a tier whose rejections fell to zero while
  its CI reds ROSE, on the conjunction only, and is wired, driven by the
  suite on a planted history, and UNREAD until a capture stamps a
  verdict outcome and a CI-red count on a reading.
  **A BREACH ON EITHER BAND IS A FINDING ABOUT THE PROCESS AND NEVER A
  GATE ON A LANE** — the disposition every tier of this reporter already
  has, restated because these two read a LANE'S OWN numbers and are the
  first ones anybody would try to enforce. The lane that overran is
  evidence, not the defect; the remedy is a card, and a tier repriced
  by triage rather than by the session it caught.
  **THE READINGS FILE IS THE ONE FILE UNDER docs/checkpoints/ THAT A
  PROGRAM READS, AND THE SENTENCE ABOVE IS NOT AMENDED** (ADR-024
  decision 3, captured by T-295): `docs/checkpoints/meters.jsonl` is
  written by the MERGE VERB, one JSON line per seat per merge, and never
  by a hand — while ADR-019's Records clause binds a suite, a gate or a
  generator, and the sentence above binds the hand-written MARKER LINES
  in a record, which still reach the command through `--readings` and
  are still walked by nothing. This reporter is none of those three and
  the loop bands parse no record's prose. The addendum that would say
  this inside ADR-019 is the owner's to write and is filed as a
  suggestion.
  WHAT THE CHECKPOINT OWES FOR THESE TWO: both readings QUOTED with the
  command that derived them — `npm run health`, from tools/e2e/ — in
  docs/checkpoints/TEMPLATE.md's Metrics section, which carries the two
  lines and the reason they are quotes rather than markers.
  THE CI DISPOSITION (`T-156-s1`): **LOCAL ONLY**, the disposition
  `index --watch`, `arch` and `npm run boot:orphan-drill` already have —
  it exits 3 at every ref while any band is unkept, so a step would red
  every push for no actionable signal (the AUDIT GATE POLICY's argument
  against `--deny warnings`); the readings that make it informative are
  the OUTPUTS of steps the job already runs; and a scheduled reporter
  would re-run the whole pipeline on a trigger workflow-parity does not
  pin ci.yml to. **Revisit this when the exit code can move** —
  `T-156-s4`'s subject — and not before.
  IT IS NOT IN "Build & test" ABOVE, DELIBERATELY, AND THE REASON IS
  MECHANICAL — the one the METHOD EVAL GATE bullet states, and the trap
  T-090 walked into while adding `npm run lint:docs`:
  `deriveExpectedSteps` in tools/e2e/tests/workflow-parity.spec.ts makes
  every command in those four bullets either a CI step or an argued
  `LOCAL_ONLY` entry, so adding `npm run health` to the tools/e2e
  command bullet alone reds that spec by name (`T-156-s1`). The doc half
  and the spec half are ONE commit across two packages, routed as
  **`T-156-s5`**; until it lands, this is the only place the command is
  written down.
- THE CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:` (T-182) — the
  commit that adds a record under `docs/checkpoints/` carries a subject
  beginning with that literal. **IT IS NOT A STYLE RULE: TWO RULES PARSE
  THE MARKER, AND BOTH DEGRADE IN SILENCE WITHOUT IT.** Consumer one is
  the DISPATCH bullet above, which picks a lane's base by it (its naming
  phrase is spelled around rather than quoted, because `rawBullet` in
  tools/e2e/scripts/dispatch-brief.mjs demands ONE bullet carry it).
  Consumer two is the triage band's window — `newestCheckpoint` in
  tools/e2e/scripts/health-bands.mjs, anchoring
  `triage/net-arrivals-per-window`. To both, an absent marker is
  indistinguishable from a night with no checkpoint: the window does
  not advance, the base names an older commit, and both keep reporting
  success — at `bd8a8e8` most record-adding commits carried no such
  subject (`git log --first-parent --diff-filter=A <range> --
  docs/checkpoints/` derives the count). **IT IS A CONVENTION HERE ONLY
  BECAUSE THE TRIGGER IS OUT OF FENCE**: the event to assert on is the
  COMMIT THAT ADDS A RECORD, already `T-167-s8`'s second trigger, so the
  guard joins there — **ROUTED to `T-167-s8`** with two facts:
  `--grep=^Checkpoint:` matches ANY line of a message, so a SUBJECT
  guard is strictly narrower than the band's own reader; and
  `newestCheckpoint` had no spec at `bd8a8e8`.
- POISON DRILL (ratified at T-054; until then "poison", "vacuous" and
  "mutation" appeared nowhere in this file or in method/roles/): at any
  task that ADDS OR CHANGES a test body — the executor before handing
  off, the verifier before a verdict, the integrator before a checkpoint
  — MUTATE every new or changed assertion so that it ought to fail, RUN
  its suite, and require the RED. MUTATE ONE SIDE ONLY: the code under
  test OR the assertion, never a literal the two SHARE; and confirm the
  mutated TEXT is what you intended rather than only that a substitution
  COUNT was non-zero — a symmetric mutation produces a green
  indistinguishable from a vacuous assertion, and a `perl -0777`
  mutation once counted one substitution and changed nothing observable
  (T-078), so READ THE MUTATION BACK with `git diff` before you run the
  suite. Then restore, and PROVE the restoration: `git show HEAD:<path>
  | shasum -a 256` against the working file. The generic judging rules —
  kill-set containment, the site the property lives, a DATA mutant where
  the property is data — are method/roles/verifier.md step 2b.
  **THE SHA256 IS THE PROOF AND AN EMPTY `git diff -- <path>` IS A
  COMPANION, NEVER AN ALTERNATIVE** (T-092-s4): `git checkout <commit>
  -- <path>` writes the INDEX as well as the worktree, so a following
  bare `git checkout -- <path>` restores FROM THE MUTATION'S OWN SOURCE
  and a rangeless `git diff` reports 0 bytes on the wrong file. Restore
  with `git restore --source=<commit> --staged --worktree -- <path>` and
  keep the hash. **DRILL AT A COMMIT** (T-072-s1): a restore cannot tell
  itself from a revert, and both proofs are satisfied by a restore that
  threw away work HEAD never saw; the scratch-SNAPSHOT alternative needs
  its OWN proof, `cmp` against the snapshot.
  **AND RESTORING A FIXTURE MEANS ITS BYTES AND ITS CLOCK** (T-079-s3,
  T-130-s1): sibling bodies read the MTIME, and `git diff --quiet`
  answers from the index's cached stat info. Restore the clock through
  the SECONDS form — `utimesSync(target, stats.atimeMs / 1000,
  stats.mtimeMs / 1000)` — never through a `Date`, which writes back a
  ROUNDED timestamp. **THE LOSSY FORM SELF-HEALS**: it leaves the file on
  a whole millisecond, so the next run rounds to a no-op and passes —
  **re-running until green is the defect's own healing mechanism, not
  evidence.** The same fixed point defeats a POISON of a clock assertion
  (T-153-s5), so **before poisoning an assertion over PERSISTENT state,
  put that state back to a condition the suite did not create.** The
  round-trip's precision is scoped by the libuv VERSION, not the
  platform (microseconds under v1.51.0; T-153-s5 carries both versions'
  bounds), so print `process.versions.uv` beside any figure that depends
  on it. A `ctime` move after a byte-exact restore was seen once and
  never reproduced; prove restoration BY HASH, immune either way.
  RECORD the count and the restoration proof in the notes, the verdict
  or the checkpoint — "133-for-133" is the shape (T-027), "drills run"
  is not.
  **A COMPARISON IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
  NON-EMPTY** (shape TEN), and **A COMMAND QUOTED AS PROOF IS SHOWN
  CAPABLE OF FAILING** (T-078-s11): a diff-based check NAMES ITS RANGE —
  `git diff` with NO RANGE compares the WORKING TREE to the INDEX, 0
  bytes on any clean tree — and a search-based one is run once against
  a PLANTED HIT before its zero is written down.
  **DRILL IN A DETACHED SCRATCH WORKTREE AT A NAMED COMMIT, AND GIVE IT
  ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF — AT `<scratch>/target`, NOT
  AT A NAME YOU CHOSE** (T-013-s7 arm (c); four agents bitten, T-145-s3
  the latest). Several Rust bodies bake `env!("CARGO_MANIFEST_DIR")` in
  at COMPILE time, which cargo does not fingerprint, so binaries the
  DRILL compiled are reused by the parent afterwards (T-013's card has
  the wreckage) and a mutant can look DEAD against a stale binary that
  never saw it. Where `cargo clean` is prohibited — it is, whenever
  another lane may be building — the recovery is to `touch` EVERY
  workspace `.rs` and rebuild (T-145-s3); touching only the file the
  panic NAMED yields a second red. The directory's NAME is not free:
  `.gitignore` excludes `target/` and nothing else, so a target dir
  under any other name is INDEXED and `index --check` answers
  confidently and wrongly with phantom files (T-111-s10, T-153-s3) —
  and **`files +0 -0` is the sentence a checkpoint decides on**.
  Skipping any directory carrying cargo's `CACHEDIR.TAG` is the CLASS
  fix and `crate-index`'s code. Drilling in place is not the remedy:
  true of the INSTANCE, not the CLASS, and an interrupted drill leaves
  the branch dirty for every concurrent reader.
  **AND THE SCRATCH IDENTITY IS DERIVED FROM THE LANE, NEVER CHOSEN**
  (T-092 holds the four-lane census). The scratch directory is SHARED
  between concurrent sessions whatever its UUID suggests, and naming the
  WORKTREE per-lane is not enough (T-110's driver and results files were
  overwritten by a sibling): DERIVE ONE STEM FROM THE LANE ID and spend
  it on the worktree, its `CARGO_TARGET_DIR`, the driver AND every
  results file, cut at a SHORT root (`T-133-s5`); the driver's guard
  SHALL recognise its OWN drill rather than the shared prefix. **A
  DERIVED PATH IS A CONSTRUCTION AND A FIXED PATH IS THE DEFECT.** And
  the app suite needs `npm run build` before it can be drilled — build,
  baseline, then mutate.
  IF a body cannot be poisoned — it asserts a constant, or every
  mutation is one the test already makes — THEN say so and name it: a
  body that cannot red is the finding (six vacuous assertions in one
  night, T-057). It stays a DISCIPLINE rather than a gate because
  nothing can automate "would this have failed". WHAT THE DRILL CANNOT
  SEE (T-057): poisoning proves a body RUNS and that its value MATTERS,
  not that it is no DUPLICATE — a CARD can specify a duplicate into
  existence and a faithful executor will build it — so after the drill
  reds, ask whether any OTHER test already drives this exact call.
  THE CATALOGUE OF SHAPES A VALUE POISON PASSES. Cite them by number —
  other cards do. **IT IS CLOSED AT ELEVEN AND EVERY ORDINAL IS MINTED
  HERE** (T-092); **ENTRIES LIVE HERE FOR FIVE THROUGH ELEVEN ONLY**
  (T-092-s5) — ONE to FOUR are the *matcher moved, value fixed* family,
  named before this catalogue existed, and their histories live in the
  cards. Each entry carries its TELL, whether it has a MECHANICAL
  REMEDY, and the card the instance lives on.
  **SHAPE FIVE — the assertion SET has no cardinality or coverage floor,
  so deleting an assertion deletes its own failure.** TELL: a printed
  count that falls with a deletion and stays green (T-058-s2, absorbed
  by T-080). MECHANICAL REMEDY: YES — a coverage floor per pattern id,
  or a cardinality pin, the shape `MUST_TOKEN_COVER` uses.
  **SHAPE SIX — a body that reds under an expected-value poison while
  killing no mutant another test does not already kill.** TELL: every
  mutant the body kills is already killed elsewhere (T-057-s1, absorbed
  by T-072). NO MECHANICAL REMEDY — the drill has to ASK, and the asking
  is (T-072-s2): **name a mutation of the code under test that this
  body kills, run the WHOLE suite under it, and require the failing-body
  count to be ONE**; a count above one names the bodies that already
  cover you, and if no such mutant exists THAT is the finding.
  **SHAPE SEVEN — a mutant NO BODY KILLS, because the mutant set was
  derived from the PINS rather than from the CRITERIA.** The dual of
  six, and worth more, because this costs the criterion. TELL: "zero
  survivors" against a mutant set every member of which aims at a pin.
  NO MECHANICAL REMEDY, but a PROCEDURE: derive the mutants from the
  acceptance criteria **with the test file closed**, and mutate every
  clause the pins do not mention — a criterion's PLURAL first. Named by
  `T-076`; `git grep -il "shape seven" -- docs/` counts the sightings.
  **SHAPE EIGHT — an assertion that SEARCHES a corpus has no uniqueness
  floor, so one duplicate anywhere keeps it green with its own subject
  deleted.** `String::contains`, `toContain` and `.includes()` are
  satisfied by ANY occurrence. TELL: the assertion pins *that the
  string exists somewhere* while every reader takes it to pin *the
  sentence* — plant a second copy FIRST and then rewrite the sentence
  and it PASSES (T-092). **The likeliest author of that second copy is
  documentation ABOUT the pin**, which is why the live-readers paragraph
  above writes `currently v<METHOD_SNAPSHOT_VERSION>` with a placeholder.
  MECHANICAL REMEDY: YES — **NARROW THE HAYSTACK** to the line or
  section pinned, with an ANCHOR that is not the needle, and assert the
  ANCHOR's own uniqueness; a bare occurrence count is a number with no
  keeper. Worked twice: `snapshot_version_matches_the_live_method_stamps`
  (kit.rs) and
  `the_only_production_path_to_the_transcript_is_the_bounded_one`
  (agent/mod.rs).
  **SHAPE NINE — a mutation that MOVES a generated row between families
  leaves the cardinality invariant, so a COUNT floor is blind to it.**
  RATIFIED here, not minted: `T-080` and `T-083` call it nine and
  `T-095` carries the shape. TELL: an argument against FIVE's remedy — a
  cardinality floor answers DELETION and nothing else. MECHANICAL
  REMEDY: YES, a CONTENT floor DERIVED FROM THE TREE, never a
  hand-written class list.
  **SHAPE TEN — an empty comparison reports AGREEMENT.** The producer
  fails, both sides come back empty, and `cmp` calls it a match. TELL:
  a comparison nothing proved had anything on either side (`T-083-s3`:
  a `merge-tree --write-tree` that exited 1, and a loop that word-splits
  under `bash` and not `zsh`). Eight's opposite end, deliberately not
  folded: a corpus that GAINED a member wants an upper floor, one with
  NO members a lower one. MECHANICAL REMEDY: YES, one line, carried by
  the proof clause above.
  **SHAPE ELEVEN — an order assertion whose WITNESS IS BUFFERED dates
  nothing** (`T-081-s5`: a text-delta witness COALESCED by
  `flush_pending` passed under the very batching mutant it was written
  to detect; the fix was a witness EMITTED rather than buffered). TELL,
  and it is the rule: **when a test asserts A precedes B, ask whether
  B's arrival time is a property of B or of the TRANSPORT; if the
  transport can hold B, B cannot date A.** NO MECHANICAL REMEDY — name
  the witness's emission path in the body so the next reader can check
  it.
- A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE WAS RUN
  (T-078-s12). A defect found in one place is a defect of a CLASS until
  somebody looks: T-078's fix session fixed three of its own where they
  stood and twice left an identical sibling a few lines away, one
  `git grep` from complete. So: NAME the class, run ONE search for it,
  and record the result **even when it is empty** — an unrecorded sweep
  and an unrun one are indistinguishable to the next reader. **And the
  sweep is shown capable of failing before its zero is written down**
  (the POISON DRILL's proof clause), because a search that finds nothing
  is what a finished job looks like.
- A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL (T-060-s2, written down
  at T-078). A test that asserts something is REFUSED must first prove
  the fixture would otherwise have been ACCEPTED: a bare "expected
  nothing, got nothing" is satisfied equally by
  refused-for-the-right-reason, refused-for-the-wrong-reason and
  there-was-nothing-there, and only the first is the property. For a
  PATH-SHAPED fixture the control is BUILT the way the producer builds
  it, not written to look similar — the fixed body in
  `app/src-tauri/src/agent/runner.rs` is the worked example. ITS
  SIBLING FROM THE OTHER DIRECTION: A TEST PARAMETRISED BY THE CONSTANT
  IT CHECKS CANNOT PIN THAT CONSTANT (T-063 — the deadline family
  stayed green at `8_000_000`; one test now pins the literal). One
  lesson, two faces: an assertion that moves with the thing it is
  checking is checking nothing.
  AND CENSUSES, NOT ONLY TEST BODIES (T-142): a crash is a finding; a
  ZERO is what you hoped for. Before a count reaches a card, brief or
  STATE, show the query able to answer otherwise: a ref where it is
  known non-zero, or one planted instance. WHY SILENT: frontmatter keys
  are snake_case and model properties camelCase, so a MODEL census for
  `blocked_by` and a FRONTMATTER one for `blockedBy` both return zero
  and read clean. A census about censuses.
- LIFTING A SAFETY GUARD TO DISCRIMINATE (T-060-s1, written down at
  T-078). A guard test needs a discriminating half, but the
  discriminating half of a SAFETY guard is by construction a deliberate
  removal of the safety — THE STRONGER THE GUARD, THE MORE DANGEROUS
  ITS OWN DISCRIMINATOR. Both of these, not either: the LIFTED arm
  SHALL be proven to TERMINATE IN A FIXTURE — pointed at one, not
  merely started at one — and the body SHALL assert the guard's STATE
  before it exercises anything (T-060's first draft executed the
  developer's REAL CLI inside the very test written to prove that
  cannot happen). It applies to every guard this project has, and most
  are safe only because their lifted behaviour touches fixtures — a
  property to CHECK, never to assume.
- THE E2E LANE'S HONEST SCOPE (T-049-s1, recorded rather than coded —
  the two arms below stay available and were deliberately not taken):
  tools/e2e covers what a BROWSER can reach, and Tauri-gated
  affordances are jsdom-plus-@human territory. `runPicker` opens with a
  not-Tauri early return, so an accelerator's ACTION is unobservable in
  the served bundle — the lane can prove a chord was CLAIMED, never that
  it was OBEYED — and both header buttons are gated behind
  `isTauriRuntime()`, so the one screen where they live is the one
  screen the lane cannot show. So do not read a green lane as coverage
  of an IPC path: the Rust suite, the boot gate and @human's eye cover
  those. The two unused arms are a DEV-only attempt counter and
  rendering the gated pair disabled in browser mode; the recorded
  sentence was preferred over a second DEV-gated surface, which T-041's
  single-gate argument disfavours.