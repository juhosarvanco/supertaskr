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
  the registry carries live undeclared edges by design) ·
  `cargo run -p nputer-index -- arch cycles --root ../..` (T-127 —
  reads the REGISTRY ONLY, so a stale graph cannot redden it; exit 0
  acyclic, 1 a declared cycle named as a path, 2 called wrong, 3 the
  registry could not be read; LOCAL ONLY while the declared
  C-08 <-> C-09 cycle is held open, the ENFORCING copy being
  `cargo test`'s exact-set census) ·
  `cargo run -p nputer-index -- arch blast <path|slug> --root ../..`
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
  `npm run lint:docs` (T-090 — the DOCS GATE's NAMED form and a CI step;
  it runs that gate's WHOLE-TREE half and judges no diff, so it answers
  with the four codes the DOCS GATE bullet legends, and the DIFF half
  stays the integrator's hand run) ·
  `npm run boot:orphan-drill` (T-061 — the shipped procedure that proves
  the boot check's child-exit path signals its captured process group and
  leaves no orphaned vite listener; LOCAL ONLY, deliberately, and the CI
  bullet says why) ·
  `npm run boot:check` (spawns `tauri dev` and
  asserts the two `[nputer]` startup lines; NOT part of `npm test` —
  it opens a real window). Beside a live app, give it a scratch port:
  `NPUTER_BOOT_PORT=14521 npm run boot:check` (T-046 — see PORT RULE;
  1420 is refused, not borrowed). Exit 0 booted · 1 the boot failed,
  with the child's last output quoted · 2 the port is busy · 3 the check
  REFUSED to run before probing or spawning anything. THE ORPHAN DRILL
  ANSWERS IN THE SAME FOUR CODES, which is why it needed no legend of its
  own: 0 clean, 1 the leak, 2 called wrong, 3 the drill could not run.
  **CODE 3 HAS TWO REASONS AND THIS LEGEND USED TO NAME ONE** (T-061-s5,
  measured at `9b03ae6` against the script's own header): `NPUTER_BOOT_PORT`
  is 1420 or not a port at all, OR the committed build config the
  scratch-port overlay is DERIVED from cannot be read. There is
  deliberately no fallback for the second, because the only value to fall
  back to is the committed port and on this repository that is 1420 — so
  a fallback would boot this check onto the human's app. Both refusals
  happen before anything is probed or spawned; that is what the code
  means, and it is why "the override was refused" was the wrong summary
  of it. THE TOKEN LINT HAS THREE CODES, AND THIS IS THE
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
  THE LANE WRITES INTO TRACKED FILES WHILE IT RUNS, AND ONE OF THEM IS
  UNDER docs/ (T-093). `npm test` here plants a control byte into seven
  tracked files across four packages and restores them; the list is
  owned by tools/e2e/tests/token-scan.spec.ts's *"one runtime-built
  control byte reds all seven first-party roots at exact byte offsets"*
  and is deliberately NOT copied here. That body proves its own
  restoration properly, sha256 per file plus an empty diff over all
  seven, so this is not a defect in it — what is unrecorded is the SIDE
  EFFECT while it runs. docs/ is the tree the app's watcher is armed
  over, so running the lane in the MAIN checkout beside a live
  `npm run tauri dev` writes docs/NORTH_STAR.md twice within
  milliseconds, and the human's board can observe a snapshot in which
  that file is one byte longer. It is the class T-081's checkpoint
  recorded from the other side, where merging an `app/src-tauri/**` card
  into a checkout with a live dev server restarts the human's window.
  RUN THE LANE IN A WORKTREE and it touches nothing the human sees.
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
  **THAT SENTENCE IS WHERE THE LANE/HAND DISTINCTION IS STATED, AND IT
  IS LOAD-BEARING** (T-093): the hand's other rules are gathered in
  A CITATION NAMES A SYMBOL, NOT A LINE under Gotchas, and this clause
  is the pointer that keeps them findable. Two more of them sit here,
  because they are about this command and about how it gets typed.
  **NEVER PUT A BACKTICK INSIDE A SHELL STRING** — single-quote a
  command name, or omit it; a heredoc quoted as `<<'EOF'` suppresses
  substitution too. In `sh`, `bash` and `zsh` a backtick is COMMAND
  SUBSTITUTION, so this repository's own house style, a command name in
  backticks, IS the hazard: copying that spelling into a shell LABEL is
  the natural motion and the one motion that executes, it is SILENT when
  the substitution succeeds because nothing errors and the output merely
  contains something nobody wrote, and it defeats the rule at the exact
  point the rule is being obeyed, arriving through a label rather than
  through any command anybody chose to run. T-082's own executor started
  a real model turn that way while building the card whose whole subject
  is that this happens — six assistant messages, ~2,485 output tokens,
  against a seven-day quota then 85% spent. Same precedent as the 1420
  probe above: the rule is on the SYSCALL, not the intent.
  **`lsof` IS THE AUTHORITY AND A `bind()` PROBE IS THE CONFIRMING HALF,
  NEVER THE PRIMARY.** On a port holding client-side TIME_WAIT peers,
  `lsof` returns ZERO ROWS while a plain `bind()` without `SO_REUSEADDR`
  still fails EADDRINUSE — a real false red, measured on port 14768.
  AND UNFILTERED `lsof` IS EQUALLY BLIND, which is the half a reader
  will get wrong: TIME_WAIT sockets have no owning process, so dropping
  `-sTCP:LISTEN` "to be safer" buys nothing. For 1420 there is no bind
  half at all — read the port and stop.
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
  still two steps, because `--selftest` short-circuits the walk.
  THE DOCS GATE runs as `npm run lint:docs` from tools/e2e and it CANNOT
  hold the token lint's position — do not "fix" the ordering (T-090).
  `token-scan.mjs` is deliberately zero-dependency and `npm run` only
  extends PATH, which is the whole reason the lint can run against a bare
  checkout ahead of every `npm ci`; `docs-gate.mjs` imports `yaml`, a
  tools/e2e devDependency chosen because it is the SAME package
  lib/parser parses task cards with, so a block parses for both or for
  neither (T-057). It therefore sits immediately after `npm ci` in
  tools/e2e and before that package's other steps, which is the earliest
  position its own dependency allows and still ahead of the 250MB browser
  download. `scripts/docs-scan.mjs` stays zero-dependency so this
  constraint belongs to the wrapper alone, and its header says so.
  The boot check runs as `xvfb-run -a npm run boot:check` from tools/e2e:
  the wrapper is real, since a headless runner has no display, but what
  it wraps is now the documented command rather than a second spelling
  of it. CI also runs `cargo install cargo-audit --locked` (the one-time
  dev-tool setup above, per run because a fresh runner has no
  ~/.cargo/bin), and it deliberately does NOT run `npm run tauri dev` or
  `npm run tauri build` — one opens a window and the other packages a
  bundle; the xvfb boot step covers the dev path — nor
  `cargo run -p nputer-index -- index --watch --root ../..`, which runs
  until stopped, nor `cargo run -p nputer-index -- arch --root ../..`,
  which reports rather than gates, nor
  `cargo run -p nputer-index -- arch cycles --root ../..`, whose red is
  DESIGNED to stand while the C-08 <-> C-09 ruling is held open (the
  enforcing copy is `cargo test`'s exact-set census, T-127), nor
  `cargo run -p nputer-index -- arch blast <path|slug> --root ../..`,
  which reports like `arch` (T-135), nor `npm run boot:orphan-drill`
  (T-061-s5, ruled here): it opens a window and builds the app, so it
  roughly DOUBLES the boot step's cost, and it deliberately SIGKILLs a
  process mid-boot, which on a shared runner is a different risk profile
  from a laptop. It is a REGRESSION drill rather than a release gate —
  the property it pins cannot drift without somebody editing
  `tauri-boot-check.mjs`'s exit path — so it takes the disposition
  `index --watch` and `arch` already have, and the ruling is written here
  rather than left to the next editor to re-derive.
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
  the section's exposed commands by FIVE, taking `cargo audit`,
  `index --watch`, `arch`, `arch cycles` and `arch blast` with it — a
  DELTA re-measured at ADR-019 phase 5 when the last two joined the
  bullet (it was THREE from T-054 through T-090), which is why the
  figure is stated as a DELTA and the endpoints are left to whoever
  asks the derivation. AND THE TRUNCATION
  IS NOT MOSTLY SILENT, which is what tells you how to check your own
  edit: the derivation runs in BOTH directions, so every command the
  SPEC claims and the doc stops exposing reds BY NAME — that mutation
  fails the lane 2 of 14 at exit 1, naming all three keys.
  **THE SENTENCE THAT USED TO SIT HERE WAS FALSE AND IS RETRACTED**
  (T-090, absorbing T-084-s2). It said the derivation *"is silent in
  exactly ONE case, a command the DOC gains that the spec does not yet
  claim"*. That is the case it is LOUDEST about. `deriveExpectedSteps`'
  `for (const key of doc.keys())` loop — the one that asks whether
  anything CLAIMS each command the doc lists — pushes a problem naming
  the command and both dispositions open to it. T-090 walked into it on
  purpose while adding `npm run lint:docs` to the bullet above, and the
  lane failed **1 of 14 at exit 1**: *"docs/CONVENTIONS.md 'Build & test'
  lists [tools/e2e] npm run lint:docs, which this spec has no entry for —
  add it to CI_SEQUENCE (verbatim or mapped, with the workflow step) or
  to LOCAL_ONLY with the reason CI does not run it."*
  **WHAT IS SILENT IS A SHAPE, NEVER A DIRECTION**: a command the
  derivation cannot SEE. T-045's verifier found two such shapes and
  `structuralProblems` now names both (an INDENTED bullet, a fenced
  block). The third is a command written into a bullet carrying no
  `run from <dir>/:` marker at all — invisible to every loop above by
  construction, because that marker is what makes a bullet a command
  list — and it is pinned by a fixture in the spec rather than left as a
  claim in prose. **So a NEW command is still the edit to ENUMERATE
  rather than eyeball**, for a better reason than the retracted one: not
  because the lane will stay quiet about it, but because the lane can
  only speak about commands it can see, and a new command is exactly the
  thing that arrives in an unread shape. Change a command here, change it
  there, or the lane fails.

## Gotchas
- method/ is the generic, product-agnostic convention — nothing
  nputer-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.7) and noted here.
  v0.1.7 (ADR-019, 2026-08-27): method/docs-protocol.md added — the
  three-tier governing-docs contract; the integrator's checkpoint
  ritual gains the record-first sequence; the adapter template names
  the generated capabilities census (completing T-145's fix and
  discharging T-138-s2); the kit's STATE scaffold points at the
  protocol.
  **A BUMP IS A THREE-FILE COMMIT AND THE THIRD FILE IS RUST** (T-078-s3
  arm 1, taken here at T-089 — it had been true and unwritten for six
  method versions). The three are: this stamp; the `(v<version>` stamp in
  method/interview/plan-interview.md's Output heading; and
  `METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs, which
  `snapshot_version_matches_the_live_method_stamps` checks BOTH docs
  against, off disk, on every `cargo test`. So a fence of
  `[method/, docs/CONVENTIONS.md]` can change method/ and CANNOT bump
  it: moving either stamp alone reds that test by name. Measured at
  T-089 in a fresh worktree, one side at a time — doc stamps to v0.1.6
  with the const untouched is **exit 101**, and the const to `0.1.6`
  with the docs untouched is **exit 101** as well, each naming the file
  it read. **The two asserts are ORDERED, and that is the trap this
  gotcha must carry rather than leave in a finding**: a const-only bump
  reds on the plan-interview arm and NEVER reaches the CONVENTIONS arm,
  so fixing only the file a panic names yields a SECOND red, not a green
  — move both doc stamps and the const in ONE commit. **THREE PLACES ARE
  PINNED AND AN OPEN SET IS NOT — CITE THE SHAPE, NOT THE TALLY.** The
  three above are the ones a red `cargo test` finds for you. Every other
  occurrence of the version is a REFERENCE no test reads — the
  genesis-kit gotcha below, the C-01 row in docs/ARCHITECTURE.md and that
  component's own file, a source comment in the genesis lens, and a
  scatter of `methodVersion:` FIXTURE literals in the TypeScript suites —
  and they split into two kinds wanting opposite treatment. **A reference
  that CLAIMS THE CURRENT VERSION goes stale and moves with the bump; a
  FIXTURE that merely needs some version string does not**, and moving
  those is churn. **DERIVE THE LIST, NEVER QUOTE IT**:
  `git grep -n "0\.1\.[0-9]"` from the repo root prints every one at your
  own ref, and this bullet deliberately states no count — a tally here
  goes stale under the next merge exactly the way the references it warns
  about do. **AND THEY ARE NOT ALL INSIDE ANY ONE FENCE**, which is the
  practical trap: a `[method/, docs/CONVENTIONS.md, app-agent]` fence
  reaches the three pinned places and this file's own references, and
  does NOT reach docs/ARCHITECTURE.md, the component file or the app
  suites. Route what you cannot reach.
- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.
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
  gathered HERE, because a session that has just been surprised by its
  own shell needs one place to read, and a hand rule filed among tooling
  rules is a rule nobody applies (T-093).
  **A MISS IS NOT A REFUTATION, AND THERE ARE AT LEAST THREE CAUSES.**
  An empty result is the answer you were hoping for, which is precisely
  why it is the one to distrust. Each cause is stated as a MECHANISM and
  never as a tool's message, because the message is not guaranteed to
  survive the shell: this harness resolves `grep` to a SHELL FUNCTION
  carrying `-I`, which STATE records, and the one line that would have
  given the game away never reached the transcript. IF another cause is
  found THEN it joins this list rather than replacing it.
  **ONE, THE SCOPE** — this bullet's own `git grep`-from-a-subdirectory
  sentence above, listed here as a member of the set and deliberately
  NOT restated: a rule written twice is two chances to disagree, and
  "four paragraphs up" would be a line number wearing a disguise.
  Re-running from the ROOT fixes this one, which is what makes the other
  two worse — they give the SAME answer from anywhere, over a file
  somebody has just edited.
  **TWO, A CONTROL BYTE IN THE FILE.** One literal NUL makes a file
  BINARY to every binary-skipping searcher while it still compiles,
  still renders and still passes its suites. Measured at `bc2d82a` in a
  detached drill worktree, one 0x00 planted into this file: the real
  `/usr/bin/grep -c` answered 1 at exit 0 and `-n` printed
  `Binary file … matches`, while the shell-function `grep` this harness
  installs answered EXIT 1 WITH NO OUTPUT over the same bytes — the same
  code a genuinely absent string gives. Same file, same needle, two
  opposite answers, and only one of them distinguishable from absence.
  WHAT TO RUN NEXT, rather than waiting for a `Binary file` line that
  may never arrive: `file(1)`, which said `data` there, and then
  `npm run lint:tokens` from tools/e2e, which needs no `node_modules`,
  runs against a bare checkout, and named the byte and its offset —
  `byte 22048: U+0000  [P5: …]` — at exit 1. THE GATE IS NOT THE GAP;
  the advice was.
  **THREE, A HARD WRAP ACROSS THE PHRASE.** Every governing document
  here is wrapped at about 70 columns, so a phrase search is a search
  for a line break you did not choose. Worked at `bc2d82a` on the CI
  bullet's retraction above, whose quoted sentence runs *"is silent
  in"* then *"exactly ONE case"* across a break: the head is found at
  exit 0, and extending the needle one word past the break returns
  nothing at exit 1. THIS CLAUSE DELIBERATELY DOES NOT TYPE THAT LONGER
  NEEDLE, because writing it here would satisfy the search it is about.
  **AND THE WRAP POINT MOVES**: T-093's card measured the same sentence
  at `4d2f03c` breaking one word earlier, ADR-019's compaction reflowed
  it, and the needle that worked then finds nothing now while the
  mechanism reproduces exactly — which is why the rule describes the
  WRAP and never a needle. WHAT TO RUN NEXT: shorten the needle until it
  cannot span a break, or search the COLLAPSED text, the way every
  mechanical reader of this file does before it matches anything.
  **`file --mime` IS NOT THE CHEAP VERSION OF THE GATE**, and briefs and
  verdicts have carried it as though it were. `charset=binary` is
  legitimate evidence for U+0000 and for almost nothing else: measured
  at `bc2d82a`, one U+000B planted into this file left `file --mime`
  reporting `text/plain; charset=utf-8` UNCHANGED and both greps still
  finding the needle at exit 0, while `npm run lint:tokens` named
  `byte 22048: U+000B` and exited 1. THE C0 SET P5 REJECTS IS
  `scanControlSource` in tools/e2e/scripts/token-scan.mjs — READ IT
  THERE, never transcribed into prose, because a set written twice is
  two chances to disagree. The cheap version of the gate IS the gate.
  **A COMMENT THAT RESTATES A MEASURED FIGURE IS A SECOND
  IMPLEMENTATION**, which is this bullet's own lesson one category over.
  Of T-074's six corrections exactly ONE had a mechanical reader, and it
  lived in a different npm package from the comment it contradicted,
  which is how the two disagreed for weeks. SO WHERE A FIGURE IS
  ASSERTED SOMEWHERE, CITE THE ASSERTION BY NAME INSTEAD OF RESTATING
  ITS VALUE: *"the lens takes the rest; `interview.spec.ts`'s `the split
  is 640 + the lens at >=1024` measures it"* cannot go stale, because
  the only thing it claims is that a test exists — a rename reds nothing
  and misleads nobody about a width. **THE GATE FOR THIS IS REFUSED IN
  WRITING**, so the next reader inherits the decision instead of
  re-deriving it: a lint that grepped comments for digit runs would fire
  constantly on prose that is fine, and the honest narrow version — flag
  a comment quoting a figure in the same file as an assertion of a
  DIFFERENT value — is worth a prototype only if a sixth instance turns
  up.
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
  THE FOURTH QUESTION, ANSWERED AT T-084 BECAUSE A VERIFIER ASKED IT IN
  THE FRONTMATTER: **"resolved by other work" is not a fourth move and
  `closed` is not a ninth status.** It is a DISPOSITION, and disposition
  belongs to TRIAGE — T-083's integrator ruled it and T-081's applied
  it, leaving a discharged finding at `status: suggested` because
  "discharging a finding is not the integrator's call to record as
  promoted, parked or rejected". So: a finding whose work was resolved
  elsewhere KEEPS `status: suggested` and records the discharge in its
  own body — a `closed_by:` line naming the commit is the shape
  `T-081-s7` uses — and TRIAGE then makes one of the three moves above,
  normally promotion (`Absorbs:` plus removal), which is what "resolved
  by other work" already means once the resolving task can name it.
  ADDING A STATUS IS A METHOD CHANGE, NOT A PARSE FIX: the vocabulary is
  ratified in method/tasks/TASK-FORMAT.md and lives in exactly one place
  in code, `lib/parser/src/types.ts`, which the DOCS GATE below READS
  rather than restates. Do not add a status to make one file parse — and
  note that a fence able to add one honestly would have to carry a
  method version bump, whose third file is Rust (T-078-s3).
- The genesis kit is ratified in method/roles/planner.md +
  method/interview/plan-interview.md (ratified v0.1.5, T-023 — a
  RATIFICATION record like the suggestion-triage bullet's own
  `(v0.1.4, T-016)`, NOT a claim about the current method version, which
  the first gotcha above owns): interview output
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
  | the GRAPH — `nputer-index` | `.nputerignore`, plus `Lang::for_extension` and `walk_root` in app/src-tauri/crates/nputer-index/src/{graph,walk}.rs | `.ts .tsx .mts .cts .js .jsx` **and, since T-010, `.rs`** anywhere not ignored; `.git` and node_modules hard-skipped whatever the ignore files say; symlinks skipped outright |
  | lint TOKEN — P1–P4 **and P6**, over MASKED source | `TOKEN_ROOTS`, `TOKEN_EXTENSIONS`, `SKIP_DIRS`, `TOKEN_EXCLUDED_FILES` in tools/e2e/scripts/token-scan.mjs | `.ts .tsx .mjs` under app/src, app/test, tools/e2e, minus the two lint implementation files by NAME |
  | lint CONTROL — P5, over RAW bytes | `git ls-files -z` minus `SKIP_DIRS` minus `CONTROL_BINARY_EXTENSIONS`, same file (T-058) | every TRACKED first-party text file — docs, method, .github, Rust, both lockfiles, dotfiles and extensionless fixtures included |
  | the PARSER's live docs | lib/parser/src/project.ts, pinned by lib/parser/test/smoke.test.ts | docs/tasks/`T-*.md` and docs/architecture/components/`C-*.md`, both FLAT and non-recursive, plus docs/ROADMAP.md |

  WHAT THAT MEANS AT A DIFF, which is when the question is always asked:
  a new `.ts` under tools/ is seen by TOKEN and CONTROL and NOT by the
  graph (tools/ is `.nputerignore`d); a new `.rs` is seen by CONTROL AND
  BY THE GRAPH, and it is a CODE INPUT to `cargo test` besides (T-010,
  `T-010-s1`). The AUTHORITY column has survived every change unmoved
  while this table's enumerations went stale three separate times, each
  caught by a lane and not one by a gate (`T-010-s1`, `T-079-s1`,
  T-086's retraction below): a signpost goes stale and the authority
  does not, which is this bullet's design and ADR-019's Law 2 in one
  row.
  A new `.md` under docs/ is seen by
  CONTROL, and by the PARSER only if it is a flat `docs/tasks/T-*.md` or
  `docs/architecture/components/C-*.md`. THIS FILE is seen by CONTROL
  only — the parser never reads it — **but live readers sit OUTSIDE all
  four walks and this file is one of the things they read, so an edit
  here can red a suite no row above can see** (T-078-s6, retracted and
  replaced at T-086: a reader list cannot be closed by prose, because
  prose is not what adds the next one). **WHICH READERS IS A
  DERIVATION, NEVER A SENTENCE**:
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root
  prints every derived reader with its suite, and the same gate run on
  your own diff — the DOCS GATE bullet below carries the one spelling —
  prints the suites your edit OWES. Run one of them before you hand
  off; do not count from this page, which has been wrong about it at
  every ref anyone checked. Two mechanisms stay named as SHAPES: the
  E2E lane parses the "Build & test" section (an edit to a command
  bullet can red workflow-parity.spec.ts), and the CARGO suite reads
  this file off disk on every run —
  `snapshot_version_matches_the_live_method_stamps` in
  app/src-tauri/src/agent/kit.rs asserts the
  `currently v<METHOD_SNAPSHOT_VERSION>` stamp in the FIRST gotcha
  above against a Rust `const`, so the method version is an ENFORCED
  PIN and a `[docs/CONVENTIONS.md, method/]` fence cannot carry a
  format bump (T-078-s3). AND THE COUNTS ARE PRINTED, NEVER PINNED:
  `npm run lint:tokens` reports both corpora on every run; DERIVE THE
  COUNT AT YOUR OWN REF — the transcribed figures this paragraph
  carried went stale twice before ADR-019's compaction deleted them
  (T-078-s4).
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
  committed graph — `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index
  --test self_graph -- --ignored` — and commit docs/architecture/graph.json
  **with the CHECKPOINT**.
  **`*.rs` WAS ADDED 2026-08-25 AND THE GAP IT CLOSES WAS LIVE FOR ONE
  NIGHT** (`T-123-s5`, architect, at main `8776326`). T-010's merge
  `d64c673` made `Lang::for_extension("rs")` answer `Some`, so Rust joined
  the walk — and this trigger still named only the four TS/JS suffixes,
  which is the ONE direction the "deliberately wider than the walk"
  argument below does not protect: a trigger wider than the walk
  over-fires harmlessly, a trigger NARROWER than the walk **misses a real
  movement**. Measured that night by T-123's rebuild, which asked the gate
  because this bullet told it to rather than reasoning from the suffix
  list: a Rust-only diff of three files moved the graph **+4 symbols and
  +1 edge** (890866 → 892093 bytes) while this trigger matched **0 of 9**
  paths. Two lanes with Rust-only diffs were in flight when it was found.
  THE STANDING LESSON IS THE ONE THE BULLET ALREADY GAVE: the suffix list
  is a signpost that goes stale the day a language is added, and
  `index --check` is the authority — **ASK THE GATE**, which is why the
  gap cost nothing. **"The merge's diff" is the PAIR OF COMMITS
  THE RANGE RULE above names, and it is not the same pair before the
  merge exists as at it** — that bullet states the reason once for both
  gates, and names the notation that spells the forbidden range while
  looking like a refinement of the prescribed one. **THE TRIGGER IS DELIBERATELY WIDER THAN THE WALK, AND THE
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
- THE LANE PROTOCOL — the generic rules are `method/lane-protocol.md`
  and are NOT restated here (T-089). That file rules one task/one
  branch/one worktree, the base commit, the sibling worktree, the
  executor never touching the integration branch, disjoint `touches:`,
  and who removes the worktree; it deliberately leaves every NAME to the
  project, and these are this project's:
  - integration branch `main`; branch `task/T-NNN-<slug>`; worktree
    `../nputer-T-NNN`, a sibling of the repo root and never a path
    inside it. Created with
    `git worktree add ../nputer-T-NNN -b task/T-NNN-<slug> <base>`, and
    the base is the bullet below. **BOTH BRANCH SPELLINGS ARE LIVE IN
    THIS REPO and the older one is not a mistake to fix**: derived at
    `4d2f03c`, 69 branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`,
    plus `main`. The two OVERLAP rather than succeed each other (the old
    set runs T-001…T-050, the new one starts at T-013 and T-028), so
    there is no cutover id to cite; derive the pair, never quote it.
  - the BRANCH IS KEPT after the merge and only the WORKTREE is removed
    (`git worktree remove`), which is why `git branch` lists every lane
    this repo has ever run and `git worktree list` lists only the live
    ones. `git worktree list` is therefore the authority on which fences
    are held right now — the board's `status: building` is not, while
    the dispatch stamp is lapsed (see the STAMP bullet's own history in
    method/tasks/TASK-FORMAT.md).
    **BUT READ IT AS ENTRIES ON A `task/T-NNN-*` BRANCH, NOT AS A ROW
    COUNT**, and this correction is measured rather than anticipated: at
    T-089's tip `git worktree list` returned SIX entries, of which one is
    `…/scratchpad/drill` on a DETACHED HEAD at `09ce637` — a transient
    poison-drill checkout belonging to T-064's lane, holding no fence and
    named after no card. A detached entry is not a lane. Filter on the
    branch, and expect other lanes' scratch worktrees to appear beside
    yours: the scratch directory is shared (STATE's standing observation
    about prefixes), and so, it turns out, is the worktree list.
    **AND ONE DETACHED ENTRY IS PERMANENT RATHER THAN TRANSIENT — THE
    HUMAN'S APP CHECKOUT `../nputer-app`** (T-052, @human's ruling of
    2026-08-25; the bullet below has the whole account). It is detached
    ON PURPOSE, it holds no fence, it is named after no card, and it is
    NOT a lane — the same reading a drill worktree gets, for a different
    reason. It needs no new rule here; it needs naming, so that the next
    session to derive the lane list does not count the human's app as a
    sixth lane or try to remove it after a merge. **DERIVE WHETHER IT
    EXISTS FROM `git worktree list`, NEVER FROM THIS FILE.** This
    sentence said it did not exist yet, and it was falsified within the
    hour by the lane that wrote it. A worktree's existence is a
    LIVE-ENVIRONMENT fact like a pid or a port holder, not a function of
    a tree, so a doc that claims one goes stale at somebody else's
    keystroke and a session that quotes the doc reports the wrong lane
    list.
  - A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING BUILT: no
    node_modules in any of the three packages, no `lib/parser/dist`, no
    `app/dist`, no `target/`. The fresh-clone ORDER at the top of this
    file covers parser-before-app and stops there. **THE APP'S OWN BUILD
    IS ALSO ORDER-DEPENDENT, and the suite does not say so**: several
    app test files read the built bundle off `app/dist`, so `npm test`
    from app/ on an unbuilt worktree fails a handful of bodies — every
    message about a build being stale or absent rather than about the
    tree — and is whole again after `npm run build`. DERIVE the counts
    at your own ref: the figures transcribed here went stale under
    suite growth (12-of-840-in-five when measured at `4d2f03c`). CI
    never sees it because ci.yml orders app build before app suite; a
    hand-run lane does.
- THE MAIN CHECKOUT IS SHARED WITH A HUMAN RUNNING THE APP, AND THE
  PIPELINE HAS KILLED IT THERE (T-052). Nine instances across
  2026-08-16/17 escalating from cosmetic to fatal, plus a tenth on
  2026-08-24 that is a CONFLATION rather than a kill. **The generic
  rules are `method/roles/integrator.md`'s "The checkout you merge into
  may be in use" and are NOT restated here** — that file rules the fresh
  install, the dependency-artifact channel, the checkpoint record and
  the no-scratch-files rule, and leaves every mechanism to the project.
  These are this project's mechanisms.
  **THE APP'S TWO TRIGGER SETS ARE DIFFERENT SETS.** `tauri dev`
  rebuilds and RELAUNCHES the binary on a change under
  `app/src-tauri/**`; a change under `app/src/**` goes to vite HMR and
  the window is never replaced — and the relaunch fires at the
  WORKING-TREE WRITE, seconds ahead of the commit an integrator would
  date it by (measured 2026-08-24). BOOT GATE's trigger is a THIRD set
  (what could stop the app BOOTING, not what reaches an open window);
  derive none from another.
  **ANCHOR THE PROCESS MATCH OR THE MEASUREMENT LIES**:
  `ps | grep 'target/debug/nputer'` matches `nputer-index` as a
  substring, so an integrator's own graph-gate run reads exactly like a
  relaunch — anchor with
  `ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
  **THE FRESH INSTALL IS THE ONE CHANNEL THAT CORRUPTS RATHER THAN
  INTERRUPTS.** `npm ci` removes `app/node_modules` while the human's
  vite serves out of it. A running vite SURVIVES the removal (measured
  at T-052: it serves already-transformed modules from memory and never
  re-reads the tree), but what the NEXT read needs is destroyed —
  `node_modules/.vite` is deleted and not recreated — and `tauri dev`
  is more than vite, so nothing licenses running the install beside a
  live app. The rule stands on the WINDOW, not on a kill; the
  measurement detail is T-052's card's.
  DETECT AND REFUSE, in the T-046 form: read the
  holder with `lsof -nP -iTCP:<port> -sTCP:LISTEN`, and for 1420 that is
  the ONLY command permitted (see PORT RULE) — **never bind-probe, and
  never connect**. On a hit, name the step you are skipping, the pid and
  socket you read, and what has to happen first. On no hit, PROCEED: a
  refusal that fires whether or not the app is up cannot tell the two
  apart, which is the NEGATIVE ASSERTION rule below applied to a
  procedure instead of to a test body.
  **`lib/parser/dist` REACHES THE RUNNING APP WITH NOTHING UNDER `app/`
  IN THE DIFF.** The app depends on `@nputer/parser` through
  `file:../lib/parser`, which npm installs as a SYMLINK, so the built
  `dist/` the running vite serves is the parser's own directory and not a
  copy. A lib-only merge that rebuilds it changes what the app is
  serving: instance 5 moved the board's model badges under the human with
  no file under `app/` touched. So the question is never "does my diff
  name a file the app owns" but **"which build outputs does the running
  app read"**, and the fresh-clone ORDER at the top of this file is where
  that is answered. A docs-only diff is not exempt either — an integrator
  who runs the install order runs the parser build.
  **A PROBE OR SCRATCH FILE IN THE MAIN CHECKOUT IS A VIOLATION** (the
  unexplained `zz-scope-probe.ts` of instance 9 is why the rule is
  written rather than assumed), **and a lane worktree parked INSIDE the
  tree is the same violation in a larger shape**:
  `git worktree add ../nputer-T-NNN` typed while the shell sits in
  `tools/e2e` lands in `tools/`, silently — git has no opinion about
  where a worktree goes. Cut worktrees with an ABSOLUTE path, or verify
  the cwd first. **NAME YOUR PATHS; never `git add -A` and never
  `git commit -a` in the main checkout** — a parked worktree makes
  `git add -A` a thousand-file stage. Scratch work belongs in a
  DETACHED sibling worktree with its own name, or outside the
  repository entirely; an unexplained file found here is RECORDED in
  the checkpoint and LEFT — its provenance is evidence, and deleting it
  destroys the only copy of the question.
  **@HUMAN'S RULING 2026-08-25 — THE SECOND CHECKOUT IS ADOPTED AND THE
  MECHANISM IS A DETACHED WORKTREE.** The criteria, quoted because they
  decide which arguments count: *"It doesn't bother me as a user if the
  app restarts. The only thing I'm concerned about is if something
  breaks or if development work suffers."* The restart is therefore not
  a cost; what survives is the fresh-install BREAKAGE channel above and
  cargo's target-dir THROUGHPUT channel, and the detached checkout
  closes both. Setup, when the tree is quiet:

      git worktree add --detach ../nputer-app main

  then the fresh-clone ORDER at the top of this file, inside it; it
  updates with one command, when the human chooses:

      git -C ../nputer-app checkout --detach main

  **BEING DETACHED IS THE FEATURE** — the app's code cannot move on its
  own, so the pipeline may merge all night; the app still OPENS
  `/Users/ujju/Projects/nputer` as its project, so the founding demo
  survives (code and watched folder are independent). In use since
  2026-08-25. Whether it exists, where 1420's holder runs from, and the
  two target-dir mtimes are LIVE-ENVIRONMENT facts — re-derive them
  (`git -C ../nputer-app rev-parse HEAD`, `lsof -p <pid>`), never quote
  them. **AND IT EXCUSES NOTHING ABOVE**: @human's ruling ratifies
  every rule in this bullet INDEPENDENTLY of the second checkout, so
  they bind whether or not `../nputer-app` exists. The measurement
  detail lives on T-052's card.
- DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  (T-014-s3, seven-for-seven): cut a task branch from the newest
  `Checkpoint:` commit on main. **READ THE REASON, NOT ONLY THE
  SENTENCE — THE TWO DISAGREE, AND THIS LANE IS THE INSTANCE** (T-089).
  The rule bans a MERGE commit, and the reason is a stale graph; a
  non-merge commit later than the checkpoint carries the checkpoint's
  graph and is safe ON THAT COUNT. **But "safe" is all its gates green,
  not only the graph**: a docs-only non-merge commit can still red a
  code suite through FRONTMATTER (the DOCS GATE), which no graph argument
  covers — so this holds by PRACTICE, verified (every non-merge
  first-parent commit between checkpoints on main is docs-only with green
  gates), NOT by property; nothing forbids a source commit between
  checkpoints. T-089 was itself dispatched from `4d2f03c`,
  which is FOUR docs-only commits after the newest checkpoint `2036fb2`
  and is not a merge — obeying the reason while failing the letter, with
  `index --check` exit 0 at the base. What the bullet means is: cut from
  a commit whose gates are green, which the newest `Checkpoint:` always
  is and a merge commit never is. A merge commit carries a graph the
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
  app/src-tauri/Cargo.toml) — **and "the merge's diff" is the PAIR OF
  COMMITS THE RANGE RULE above names, which is a DIFFERENT pair before
  the merge exists than at it.** That bullet carries this gate's own
  oldest worked example (T-027, re-measured at `dc3ef5b`: 9 paths
  against 36) and the twelve merges on which the wrong pair changed a
  gate's answer, eight of them this gate's. Then run
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
  suite twice. `9c64cd8`: two card titles opened with a backtick, a YAML
  plain scalar may not, both cards became unparseable, nothing errored,
  the board just got SHORTER and it surfaced as `Expected "60"` against
  `Received "62"` in four bodies about scroll containment. `fede266`: a
  finding filed with a `status:` outside the parser's vocabulary took
  `npm test` from app/ to 830 of 831 on a commit whose entire diff was
  ONE markdown file, and the NEXT executor found it rather than the
  verifier who wrote it (T-081-s9). **Both were found three layers from
  the cause by somebody who was not looking**, which is the argument for
  this gate: the failure mode is not that a suite goes red, it is that
  the red arrives detached from its edit and gets attributed to whatever
  lane is nearest.
  RUN IT — from the repo root, and this is THE ONE SPELLING, character
  for character the same string `tools/e2e/scripts/docs-gate.mjs`'s own
  header prints (T-057: a recipe in two places is two chances to
  disagree, and for six weeks these two disagreed):

      TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
      node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

  It is fed the RANGE RULE's own path list and deliberately computes no
  range of its own — a second opinion about which two commits the diff
  means is the failure that rule exists to prevent. Exit 0 nothing owed,
  1 the gate HAS a verdict (suites owed, or a live card the parser will
  refuse, or the root-anchor account and the tree disagree), 2 called
  wrong, 3 the gate could not run — the same four codes `index --check`
  and `boot:check` use.
  **THERE IS NO `xargs` IN THAT SPELLING AND THAT IS THE POINT** (T-090,
  absorbing T-061-s3; every figure below measured at `9b03ae6` on Darwin
  25.6.0 against `/usr/bin/xargs`, which `which -a xargs` confirms is the
  only one on this machine's PATH). A pipe through `xargs` destroys two
  of the four codes, in the direction the codes exist to prevent, and it
  destroys them DIFFERENTLY on the two platforms — so the doc prints a
  spelling that has no `xargs` layer at all rather than one that is wrong
  on one platform. THE MATRIX, each code produced deliberately and each
  observed code read from `$?` on an unpiped command:

  | the gate means | `$(…)` form, BSD | `$(…)` form, GNU | piped, BSD | piped, GNU |
  |---|---|---|---|---|
  | 0 nothing owed | **0** | **0** | 0 | 0 |
  | 1 has a verdict | **1** | **1** | 1 | **123** |
  | 2 called wrong | **2** | **2** | **1**, or **0** on an empty list | **123**, or **0** |
  | 3 could not run | **3** | **3** | **1** | **123** |

  THE BSD COLUMNS ARE MEASURED HERE; THE GNU ONES ARE NOT, AND SAYING SO
  IS THE POINT OF THE COLUMN. This machine has no GNU `xargs` and no
  container runtime to borrow one from (both probed at `9b03ae6`), so the
  GNU piped column is GNU findutils' DOCUMENTED mapping — utility exits
  1–125 become 123 — and it closes for real at the repo's first push,
  when the ubuntu runner executes the `npm run lint:docs` step for the
  first time. The `$(…)` column needs no second measurement to be honest
  about: it has no `xargs` process in it, so nothing platform-dependent
  stands between this gate's `process.exit` and the shell that reads it.
  **THAT ASYMMETRY IS THE ARGUMENT.** A spelling whose correctness has to
  be re-measured per platform is one nobody will re-measure.
  What BSD `xargs` does, measured one invocation per code over 1, 2, 3,
  4, 5, 100, 123, 125, 126, 127 and 255: every one collapses to **1**, as
  its own man page says (*"If any other error occurs, xargs exits with a
  value of 1"* — 126 and 127 are reserved for a utility xargs cannot
  EXECUTE or FIND, not for one that exits 126 or 127, and both were
  measured separately). And on EMPTY input it never invokes the utility
  at all, so the pipeline exits **0** — a range command that FAILED
  arrives as "nothing owed", silence wearing a clean gate's costume,
  which is the exact outcome T-084-s6 exists to remove, reached by the
  opposite mechanism from the one that clause used to describe.
  **AN EMPTY PATH LIST IS EXIT 2, NOT EXIT 0** (T-084-s6), and the `$(…)`
  form above is what makes that remedy reachable: a FAILED range
  substitutes to nothing, which is zero arguments, which is exit 2.
  THREE MORE SHAPES REACH EXIT 2 rather than a clean answer, each one
  measured being answered "not owed" at 0 before T-090: an argument that
  is EMPTY or BLANK (`"$(git diff …)"` on a failed range is a list of
  length ONE, so the zero-argument guard cannot see it, T-064-s7); an
  argument carrying NEWLINES (the same quoting, on a range that
  SUCCEEDED, hands the whole list over as one blob, T-064-s7); and a
  path that resolves OUTSIDE this repository, which is what `../../docs/…`
  typed from tools/e2e/ used to mean (T-101-s3). A `./`-prefixed or
  ABSOLUTE spelling is NOT refused — it is normalised to its
  root-relative form, printed, and answered, because it names a file this
  gate can identify. A PLAIN relative path away from the repo root is
  refused as ambiguous rather than guessed at, because resolving it
  either way just moves the false-clean to the other spelling.
  **`npm run lint:docs` FROM tools/e2e IS THE NAMED FORM AND CI'S STEP**
  (T-090). BE PRECISE ABOUT WHAT THAT BUYS, because the difference is the
  whole of what is still owed by hand: the CI step runs the WHOLE-TREE
  half — every live card's frontmatter, the root-anchor account, the
  unlinkable-reader tripwire — and judges NO diff, because a workflow has
  no "merge's diff" to be handed and this tool will not compute one. Both
  incidents this gate exists for (`9c64cd8`, `fede266`) are in the half
  CI now holds. THE DIFF HALF IS STILL A RITUAL: nothing but the
  integrator running the two lines above makes a merge answer for the
  suites it owes. IF it cannot run THEN say so LOUDLY in the checkpoint,
  naming the reason and the exit code; a skipped gate is news, never
  silence.
  `tools/e2e/tests/docs-input-gate.spec.ts` is the enforcing copy and it
  runs inside the lane TODAY, which makes this the one standing gate
  whose written form is already held by something other than discipline.
  THE READER SET IS DERIVED FROM THE TREE, NEVER LISTED — that is the
  whole mechanism, and a hand list is the defect T-058 and T-080 each
  spent a card on. `tools/e2e/scripts/docs-scan.mjs` finds every tracked
  source file that RESOLVES a path under docs/ against this repository's
  root, by either of two arms. A DOCS SITE: a path-forming call in the
  file whose first literal segment is `docs` AND whose base expression
  EVALUATES TO THE REPOSITORY ROOT — both halves load-bearing, either
  alone wrong. Or a CALL SITE: a call that HANDS the repository root to a
  first-party function which spends it on a docs path.
  **THE SECOND ARM IS NOT A REFINEMENT, IT IS THE DIFFERENCE BETWEEN A
  RIGHT ANSWER AND A WRONG ONE.** `lib/parser/test/smoke.test.ts` spells
  no docs path at all; it calls `parseProject(repoRoot)`, and
  `lib/parser/src/project.ts` spends that root on docs/tasks,
  docs/ROADMAP.md and docs/architecture/components. With the literal arm
  alone, a one-line edit to docs/ROADMAP.md owed `npm test` from
  tools/e2e (114/114, exit 0) while the parser suite went 262/263 at exit
  1 — the gate named a green suite while a red one went unmentioned.
  The site rule's first half is what keeps `tools/e2e/fixtures/shell.ts`
  out — it joins the REPO ROOT with a path ENDING in `docs`, but its
  first segment is `app`, so it reads a fixture tree. The second is what
  keeps `lib/parser/test/files.test.ts` out — it joins a base computed
  from `import.meta.url`, so any "mentions import.meta.url" heuristic
  calls it a reader, and it resolves to that suite's own fixtures
  directory.
  **A file that does BOTH and cannot be linked is REPORTED, never
  dropped**: silence is the outcome this gate exists to remove. The
  reporting arm follows IMPORTS as well as local bindings, because
  `import { repoRoot } from "../preflight"` is how most of this tree
  names its root and an arm that only read local bindings was vacuous
  one step out.
  **NO COUNT IS TRANSCRIBED INTO THIS BULLET, AND THAT IS THE POINT.**
  It used to carry the site census here as digits at a named ref, and
  claimed **twelve** root-anchored where the tree held **eleven** — at
  that ref, at the tip, and counted by hand. Nothing derived the figure,
  so it was green and wrong, and it had been relayed into two further
  documents before anyone re-measured. Run
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root: it
  prints the site census, the reader set with the arm that found each,
  the root-anchor classification and the residual, and it cannot be
  stale because it is not written down. **THE FIGURE THAT REPRODUCES IS
  THE ONLY KIND WORTH QUOTING**, and this bullet quotes none.
  THE FOUR SUITES the derived readers sit in, listed so a reader knows
  the shape and re-derivable so nobody quotes them: `npm test from app/`
  (the two dogfood bodies), `npx vitest run from lib/parser/` (its own
  live-tree bodies), `npm test from tools/e2e/` (two specs that walk the
  whole of docs/, graph and all) and `cargo test from app/src-tauri/`
  (docs/CONVENTIONS.md on every run, plus the component registry).
  **THE CARD THAT OPENED THIS SAID THE ANSWER WAS `npm test` FROM app/
  AND NOT THE PARSER SUITE AND NOT E2E; THE TREE SAYS ALL FOUR**, and
  the first of the two incidents above was caught BY the lane.
  THE TRIGGER IS WIDE AND THE ANSWER IS NARROW, deliberately, because
  the over-fire trap is real: a gate that says "run everything on any
  `docs/**`" is ignored within a week. On this tree EVERY path under
  docs/ reaches a reader — two lane specs walk all of it — so narrowing
  the TRIGGER would be a lie. What is proportional is the ANSWER, and the
  three below are EXAMPLES CARRYING THEIR REF rather than a table to
  quote — each re-derived by asking the gate at `c4c15c8`, which is the
  only thing that makes any of them worth writing: `docs/rooms/*.md` owes
  ONE command, `docs/CONVENTIONS.md` owes TWO and not the app suite, a
  flat `docs/tasks/T-*.md` owes THREE. **THEY ARE THE ANSWER'S SHAPE AND
  NOT ITS CENSUS** (T-086): a new reader landing in a fourth suite moves
  any of them without touching this page, which is exactly what happened
  to the walk table's reader sentence above. Ask the gate; do not
  predict.
  THE OTHER HALF IS THE FRONTMATTER, asked of the WHOLE TREE and not
  only of the diff, because a card broken three commits ago is still
  broken: every live flat `docs/tasks/T-*.md` must parse, and its
  `status:` must be in the parser's vocabulary. The gate READS that
  vocabulary out of `lib/parser/src/types.ts` rather than restating it,
  so this tree has exactly ONE status vocabulary (T-057 — a rule with
  two implementations is two chances to disagree) and a ninth status
  added there is honoured here with no edit. It names the FILE, the
  FIELD and the near miss; the count in a scroll-containment body never
  could.
  `.nputerignore` IS UNTOUCHED AND THAT IS DELIBERATE: it excludes
  docs/ because the graph is CODE-derived and docs/ is not code, so
  `index --check` is not the gate that missed this and indexing docs/
  would neither have caught either incident nor been correct. The
  exclusion is asserted in the spec so "we decided" cannot be mistaken
  for "we forgot".
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
  **DRILL AT A COMMIT** (T-072-s1) — commit the work FIRST, then mutate,
  because **A RESTORE CANNOT TELL ITSELF FROM A REVERT**: both proofs
  above are satisfied perfectly by a restore that threw away work HEAD
  never saw. Measured — `git checkout --` on a file whose implementation
  was still an uncommitted working-tree change reverted it to the branch
  point; the sha256 matched and `git diff --stat` was empty AT THE MOMENT
  THE WORK WAS LOST, and the harness echoing the file back is what caught
  it. Committing first makes both proofs correct by construction, which
  beats adding a third. The scratch-SNAPSHOT alternative — copy aside,
  mutate, copy back — works too and needs its OWN proof, `cmp` against
  the snapshot, because `git show HEAD:` cannot see it.
  RECORD the count and the restoration proof in the notes, the verdict
  or the checkpoint — "133-for-133" is the shape (T-027), "drills run"
  is not.
  **A COMPARISON IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
  NON-EMPTY** (poison shape TEN below), and **A COMMAND QUOTED AS PROOF
  IS SHOWN CAPABLE OF FAILING** (T-078-s11): a diff-based check NAMES ITS
  RANGE, and a search-based one is run once against a PLANTED HIT before
  its zero is written down. Worked: `git diff -U0 -- <path>` piped
  through two greps was offered as the STRONG form of a no-new-character
  check, and **`git diff` with NO RANGE compares the WORKING TREE to the
  INDEX** — so on a clean tree, the state at every commit boundary and
  the only one a reviewer can reproduce, that diff is 0 bytes and the
  grep says "no matches" whatever the branch added (`5b5e1c7`: exit 0, 0
  bytes, 0 lines). The claim was TRUE under an explicit range; the
  evidence offered for it was not evidence.
  **DRILL IN A DETACHED SCRATCH WORKTREE AT A NAMED COMMIT, AND GIVE IT
  ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF** (T-013-s7 arm (c), taken at
  T-013's merge — the standing advice above CREATES this hazard, and it
  has now bitten three agents). A scratch worktree has no `target/`, so
  the obvious economy is to symlink or share the parent's — and that is
  a trap that stays silent until after the drill is over. Several Rust
  bodies here resolve the repository from `env!("CARGO_MANIFEST_DIR")`,
  which is baked in at COMPILE time and which cargo does not fingerprint
  as an input, so the binaries the DRILL compiled — carrying the DRILL's
  path — are reused by the parent afterwards. Measured on T-013's lane:
  bare `cargo test --no-fail-fast` went **336 passed / 33 failed, exit
  101** with the drill worktree deleted, every failure naming a
  directory that no longer exists, and `cargo clean -p` plus a rebuild
  (12 704 files, 3.0 GiB) was the whole fix. **AND THE POLLUTION RUNS
  THE OTHER WAY TOO**, which is the half that matters to a drill: a
  mutant can look DEAD against a stale binary that never saw the
  mutation. Arm (c) costs one environment variable and one cold build,
  and it is the only arm that leaves the parent's cache untouched
  without a `cargo clean` to remember: measured at T-013's merge, the
  main checkout's `target/` mtime was **byte-identical before and after
  three mutants and four suite runs** in a drill rooted at
  `<scratch>/.drilltarget`. **DRILLING IN PLACE IS NOT THE REMEDY** —
  the in-place argument ("one manifest path throughout, so the hazard is
  absent by construction") is true of the INSTANCE and not of the CLASS,
  the mechanism being a compile-time constant cargo does not track
  rather than that one constant; and it substitutes a different hazard,
  since an interrupted drill leaves the branch dirty and any concurrent
  reader sees mutated source. Detached worktree **plus** its own target
  directory, not either.
  **AND THE SCRATCH IDENTITY IS DERIVED FROM THE LANE, NEVER CHOSEN**
  (T-092, measured across FOUR lanes on 2026-08-24/25). Start from the
  fact every session so far has had backwards: **THE SCRATCH DIRECTORY IS
  SHARED BETWEEN CONCURRENT SESSIONS** — the session UUID in its path
  makes it LOOK private and it is not, so expect a sibling's files beside
  yours exactly as the worktree-list bullet above tells you to expect a
  sibling's worktrees. Four sessions independently picked the same
  literal path, `<scratchpad>/drill`, and the same driver name; T-088 and
  T-090 were saved only by git refusing an existing path, and T-113
  reproduced it from a third seat. **Naming the WORKTREE per-lane is NOT
  enough** — T-110 used `drill-T-110` and still had its `drill.py` and
  `drill-results.json` overwritten by a sibling: the collision simply
  moved from the directory to the FILES beside it. So DERIVE ONE STEM
  FROM THE LANE ID, the way `../nputer-T-NNN` already derives the lane
  worktree from the card, and spend that one stem on the worktree, its
  `CARGO_TARGET_DIR`, the driver script AND every results file — one
  stem, every artefact, no exceptions — cut at a SHORT root (`T-133-s5`).
  **AND THE DRIVER'S GUARD SHALL RECOGNISE ITS OWN DRILL RATHER THAN THE
  SHARED PREFIX**: three sessions wrote that guard independently and all
  three guarded the prefix, so it answers *"is this A drill"* and never
  *"is this MY drill"* — which argues the convention was under-specified,
  not that the sessions were careless. **A DERIVED PATH IS A CONSTRUCTION
  AND A FIXED PATH IS THE DEFECT.** Nothing was corrupted in any of the
  four — every restoration was sha256-proved — but the protection was
  git's, not the discipline's, and git only ever refuses the DIRECTORY.
  **AND THE APP SUITE NEEDS A BUILD BEFORE IT CAN BE DRILLED.** A fresh
  worktree has no `app/dist`, and the test files that read the shipped
  bundle fail on its absence with a message about the build rather than
  about the tree — DERIVE the file count at your own ref: the two
  denominators this file used to transcribe disagreed with each other
  until ADR-019's compaction replaced both with this sentence. Build
  first, then baseline, then mutate. IF a body cannot be poisoned — it asserts a constant, or every
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
  the drill has to ASK. **AND THIS IS WHAT THE ASKING LOOKS LIKE ONCE IT
  IS ANSWERED** (T-072-s2; it replaces nothing above, it finishes it):
  do NOT ask "is this a duplicate?" — **name a mutation of the code under
  test that this body kills, run the WHOLE suite under it, and require
  the failing-body count to be ONE.** A count of one IS the
  non-duplication, mechanically; a count above one names the bodies that
  already cover you, in the reporter's own output. Worked on the file the
  shape was found in: two mutants each gave **1 failed / 832 passed of
  833**, naming that body and nothing else. **The honest failure mode is
  the point** — if no such mutant exists, THAT is the finding, and a
  reader holding only "the drill has to ASK" has no way to say it. Both
  are DISTINCT from the four already
  catalogued, which share the one tell these do not: the matcher moved,
  never the value.
  **THE CATALOGUE IS CLOSED AT ELEVEN AND EVERY ORDINAL IS MINTED HERE**
  (T-092). Cards CITE these numbers; minting a second one for a shape
  that already has one is the defect the catalogue exists to prevent.
  Each entry carries its TELL and whether it has a MECHANICAL REMEDY,
  because that distinction is what a reader acts on.
  **SHAPE SEVEN — a mutant NO BODY KILLS, because the mutant set was
  derived from the PINS rather than from the CRITERIA.** The exact dual
  of six — six is a body that kills no unique mutant, seven is a mutant
  no body kills — and seven is worth more, because a redundant body costs
  nothing and this costs the criterion. TELL: "zero survivors" reported
  against a mutant set every member of which aims at something a pin
  already names. NO MECHANICAL REMEDY, but a PROCEDURE: derive the
  mutants from the acceptance criteria **with the test file closed**, and
  mutate every clause the pins do not mention — a criterion's PLURAL
  first, since fixtures that happen to carry ONE of a thing are how this
  keeps arriving. Named by `T-076`; sighted independently at `T-069-s3`
  (corroborated from a second seat at `T-102`), `T-073-s4`, `T-077` and
  `T-080`, each carrying its own measurement. DERIVE THE SIGHTING COUNT
  AT YOUR OWN REF — `git grep -il "shape seven" -- docs/` from the repo
  root — it grows at every triage and a tally here is a line number in
  disguise.
  **SHAPE EIGHT — an assertion that SEARCHES a corpus has no uniqueness
  floor, so one duplicate anywhere in the corpus keeps it green with its
  own subject deleted.** `String::contains`, `toContain` and
  `.includes()` are satisfied by ANY occurrence anywhere, and a haystack
  that is a whole file is one anybody may add to. TELL: the assertion
  pins *that the string exists somewhere in the file* while every reader
  — the pinned constant's own doc comment included — takes it to pin *the
  sentence*. THE DRILL THAT SHOWS IT (T-092, with the predicate modelled
  exactly): rewriting the pinned sentence alone FAILS, so the pin looks
  fine; plant a second copy FIRST and then rewrite the sentence and it
  **PASSES** — green with its subject deleted. **The likeliest author of
  that second copy is documentation ABOUT the pin**, which is why the
  live-readers paragraph above writes `currently v<METHOD_SNAPSHOT_VERSION>`
  with a placeholder rather than the literal. Distinct from ONE-to-FOUR
  (the matcher moved and the value stayed; here nothing moved), from FIVE
  (there the assertion SET lost a member, here the HAYSTACK gained one)
  and from SIX (this body DOES kill a unique mutant, right up until a
  duplicate appears somewhere it never looks). MECHANICAL REMEDY: YES,
  which puts eight beside five — **NARROW THE HAYSTACK** to the line or
  section actually pinned, picking it out with an ANCHOR that is not the
  needle, and assert the ANCHOR's own uniqueness so it cannot quietly
  widen back into a whole-file search. A bare occurrence count
  (`… .count() == 1`) reds the same drill and is the cheaper half, but
  **it is a number with no keeper**: nothing in it says WHICH occurrence
  is the subject, so the first legitimate second copy reds it and the
  cheapest repair is to bump the 1 to a 2 — after which any two
  occurrences anywhere satisfy it, including zero in the right place.
  Prefer the anchor; reach for the count only where no anchor exists, and
  say which you chose. Worked twice:
  `snapshot_version_matches_the_live_method_stamps` (kit.rs), and
  `the_only_production_path_to_the_transcript_is_the_bounded_one`
  (agent/mod.rs), which cuts the file to its production half so the pin
  cannot find its own test module's literals — the remedy applied before
  the shape had a number.
  **SHAPE NINE — a mutation that MOVES a generated row between families
  leaves the cardinality invariant, so a COUNT floor is blind to it.**
  **The ordinal is RATIFIED here, not minted**: `T-080` and `T-083`
  already call it nine in landed text and `T-095` carries the shape, so
  giving nine to anything else would have made three citations wrong.
  TELL: it is an argument against FIVE's own remedy — a cardinality floor
  answers DELETION and says nothing about reclassification; the row
  migrates between families and the rungs net out, so "at least N checks"
  passes at every N (`T-080`, `T-095` §TWO carry the measurement).
  MECHANICAL REMEDY: YES, but a CONTENT floor rather than a count, and
  DERIVED FROM THE TREE rather than from a hand-written class list, or it
  goes stale the day a real new asset format arrives.
  **SHAPE TEN — an empty comparison reports AGREEMENT.** The producer
  fails, both sides come back empty, and `cmp` calls it a match: a green
  built out of two failures. TELL: a comparison nothing proved had
  anything on either side of it. Two sightings hours apart in one lane
  (`T-083-s3`) — a `git merge-tree --write-tree` that exited 1 where a
  tree OID was expected, and a comparison loop that word-splits under
  `bash` and not under `zsh` printing `BYTE-IDENTICAL (0 paths)`. **TEN
  IS EIGHT'S OPPOSITE END AND THEY ARE DELIBERATELY NOT FOLDED
  TOGETHER**: eight is a corpus that GAINED a member and wants an upper
  floor, ten is a corpus with NO members and wants a lower one, and a
  duplicate and a failed producer send a reader to different repairs.
  MECHANICAL REMEDY: YES, one line, and the drill bullet above carries it.
  **SHAPE ELEVEN — an order assertion whose WITNESS IS BUFFERED dates
  nothing.** A body claims A precedes B and picks as witness an event
  whose emission is DEFERRED, so the witness arrives late whatever the
  code does. Measured (`T-081-s5`): a text-delta witness is COALESCED by
  `flush_pending`, so the assertion passed under the very batching mutant
  it was written to detect; the fix was a witness EMITTED rather than
  buffered — an `Activity` line, which is what the real planner did. TELL,
  and it is the rule: **when a test asserts A precedes B, ask whether B's
  arrival time is a property of B or of the TRANSPORT. If the transport
  can hold B, B cannot date A.** NO MECHANICAL REMEDY — choosing the
  witness is the judgement; the only mechanical half is to name the
  witness's emission path in the body, so the next reader can check it
  without re-deriving the transport.
- A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE WAS RUN
  (T-078-s12). A defect found in one place is a defect of a CLASS until
  somebody looks. T-078's fix session found three of its own, fixed each
  where it stood, and in two cases left an identical sibling a few lines
  away — **both inside the subsection that announces the sweep**, and one
  outlived the branch that fixed the other. Both were one `git grep` from
  complete. So: NAME the class, run ONE search for it, and record the
  result **even when it is empty** — an unrecorded sweep and an unrun one
  are indistinguishable to the next reader, which is "a skipped gate is
  news" one layer up. **And the sweep is shown capable of failing before
  its zero is written down** (the POISON DRILL's proof clause), because a
  search that finds nothing is what a finished job looks like.
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
- LIFTING A SAFETY GUARD TO DISCRIMINATE (T-060-s1, written down at
  T-078). A guard test needs a discriminating half, but the
  discriminating half of a SAFETY guard is by construction a deliberate
  removal of the safety — THE STRONGER THE GUARD, THE MORE DANGEROUS
  ITS OWN DISCRIMINATOR. Both of these, not either: the LIFTED arm
  SHALL be proven to TERMINATE IN A FIXTURE — pointed at one, not
  merely started at one — and the body SHALL assert the guard's STATE
  before it exercises anything (T-060's first draft executed the
  developer's REAL CLI inside the very test written to prove that
  cannot happen; both halves closed it). It applies to every guard this
  project has, and most are safe only because their lifted behaviour
  touches fixtures — a property to CHECK, never to assume.
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
