# State

Updated: 2026-08-17 by integrator (T-045 merge), claude-opus-5 @fresh

## Just completed
T-045 (the gates cover the rules they enforce — `tools/e2e` + `.github/`
+ `docs/CONVENTIONS.md`, M, milestone 4, F-02) done and merged. Built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. Six criteria, three
findings absorbed (T-020-s6, T-036-s1, T-038-s2), ten files.

**THE HEADLINE: THE STRONG ARM PAID FOR ITSELF IN ONE LINE OF YAML.**
Criterion 1 offered two arms — DERIVE the expected commands by parsing
`docs/CONVENTIONS.md` "Build & test", or keep the sixteen-entry array
and add a pointer. The builder took **DERIVE**, and the derivation
immediately found something no array could have found, because the array
was hand-written from the same assumption the workflow was:

- **The card said TWO documented divergences. There are FOUR.** Numbers
  1 and 2 (`npm install`→`npm ci` for app/; `npx playwright install
  --with-deps chromium`) were documented. Numbers 3 and 4 were **not
  written down anywhere**: `npm run lint:tokens` (+ `-- --selftest`)
  becomes two direct `node scripts/lint-tokens.mjs` invocations, and
  `npm run boot:check` becomes `xvfb-run -a node
  tools/e2e/scripts/tauri-boot-check.mjs` from the repo root. The
  verifier re-derived the count independently from the doc's sixteen
  commands against ci.yml's nineteen `run:` steps and got **FOUR, as the
  builder found**. `cargo install cargo-audit --locked` is correctly
  classed a CI-only ADDITION rather than a fifth divergence — CI runs it
  verbatim as the doc writes it.
- **And a command CONVENTIONS documented that no CI step ever ran.**
  `npm run typecheck` for tools/e2e. The lane's own typecheck was a
  documented gate the workflow skipped, and it was **invisible for
  exactly as long as the expectation was a mirror of the workflow** —
  a mirror agrees with what it reflects, including the omissions.
  Verified at the branch point rather than taken on trust: `6ed97cf`'s
  ci.yml contains no `npm run typecheck` anywhere.

**THE FIX WENT THE HONEST DIRECTION, and this is the part worth
carrying.** Faced with a doc and a workflow that disagreed, the task made
the **DOC true** and left the workflow's commands alone. Measured, not
asserted: ci.yml's **eighteen pre-existing `run:` strings are
byte-identical to `6ed97cf`**, and the only change is the three added
`e2e types` lines (plus one comment fix). The workflow was not edited to
suit the test. The new step is genuinely bound — delete it and the lane
reds with `missing verbatim step: [tools/e2e] npm run typecheck`.

**WHAT THE PARSE BINDS, because it is a real coupling.** A command
bullet is one marked `run from <dir>/:`; the commands are the
`·`-separated segments after that marker, taking the first backticked
span of each, and the list ENDS at the first segment that does not open
with a backtick — which is what lets the tools/e2e bullet's trailing
`Exit 0 booted · 1 the boot failed · …` legend be read as the prose it
is. Today that yields exactly four bullets and sixteen commands, each
with a disposition in the spec (`verbatim` 11, `mapped` 3, `local-only`
2), checked in BOTH directions: a doc command with no disposition fails,
and a disposition the doc no longer lists fails.

**THE VERIFICATION'S SCALE, recorded because it sets the bar for a
parser that is now load-bearing.** The derivation was **attacked
twenty-four ways**:
- **18 red LOUDLY and by name**: reordered bullets, a new command
  mid-list, a backticked PROSE segment mid-list (it forces a
  classification rather than guessing), an unbackticked prose segment
  mid-list, a `*` bullet marker (9 problems), a non-breaking space after
  the dash (9), a fifth `run from` bullet (3), a colon added after the
  dev-tool bullet's `run from app/src-tauri/` (2), `·` swapped for `,`
  (3), a command stripped of its backticks (3), a marker with zero
  commands (6, opening "lists no commands for [app]"), the CI bullet
  losing a divergence (2) or deleted entirely (9), the local-only claim
  turned to prose (2). **Renaming, emptying or DELETING the `## Build &
  test` header all THROW** the hard error.
- **3 correctly TOLERATED, checked rather than assumed**: a non-breaking
  space inside `run from`, inside a command's backticks, or either side
  of a `·` — whitespace normalisation makes all three parse identically,
  so no false alarm.
- **3 SILENT, and they are all ONE CLASS**: a command *arriving* in an
  unrecognised shape — an indented sub-bullet, a sub-bullet with its own
  marker, a fenced block. **Nothing already in the doc can vanish
  unseen**, and the replaced sixteen-entry array saw none of those
  shapes either, so this is a residue rather than a regression. Filed as
  **T-045-s4** with the three reproductions and a structural fix.
- **The non-vacuity guard FIRES.** The section replaced by one prose line
  yields **26 problems and two derived steps** — never a silent green.
  This is the property that matters most: a gate whose expectation is
  derived can fail by deriving nothing, and this one cannot.

**THE DRILL THAT FOUND A HOLE IN ITS OWN SUBJECT.** Worth carrying
verbatim because it is this task's thesis reproduced inside its own fix.
L7 (delete `app/test` from the lint's `WALK_ROOTS`) first came back
**exit 0, "10 walk-policy checks green"** — the positive checks were
GENERATED from `WALK_ROOTS`, so deleting a root deleted its own check.
**A gate that cannot notice its own scope shrinking is the exact failure
mode this whole task is about.** `MUST_COVER` is now a separate list —
the requirement, deliberately NOT derived from the policy that satisfies
it — and L7 re-run reds with `required tree app/test is walked (0
files)`. Two lists that must agree is the right shape exactly when one
of them is the thing under test.

**THREE CORRECTIONS THE VERIFIER MADE AGAINST THE BUILDER, none of which
moves a gate.**
1. **The differential label `files=51` is wrong; the true count of newly
   walked files was 52** (31 app/test + 21 tools/e2e), or 50 restricted
   to `.ts`/`.tsx`. The measured RESULT — `both=0 OLD-only=8 NEW-only=0`
   — is exact; only the label was off by one. (On merged main that count
   is now **55**; see the suites below.)
2. **T-036's exact-equality assertion is NOT carried forward, and that
   is a real narrowing.** T-036 asserted `expect(doc.permissions)
   .toEqual({contents: read})`; the generalised successor judges
   widenings, so a top-level **`permissions: {}` now passes** where it
   previously would not (measured: 0 failed / 9 passed). `actions:
   read`, `read-all`, `write-all` and `contents: write` all still fail.
   **The loss runs toward LESS privilege, never more**, it is documented
   in the spec's header, and it is pinned by fixture M7. Criterion 4's
   stated target is **"no unargued grant"**, not zero-allowlist — so
   this is recorded, not held against the criterion.
3. **The lint is "ahead of every `npm ci`", not literally the job's
   first step.** The apt and `rustc --version` steps precede it. The
   load-bearing half is exact and is what ci.yml's own comment claims
   ("runs before any install"); CONVENTIONS' CI bullet and the spec's
   DIVERGENCE-3 comment both overstate it slightly. **Left as
   committed** — see the judgment calls.

**THE PERMISSIONS RULES WERE PROVEN ON REAL FILES, not only fixtures.**
A real `.github/workflows/release.yml` with no block → **1 failed**, the
complaint NAMES `release.yml`, ci.yml not implicated. A `.yaml` second
workflow with a job-level `pages: write` → named. A job-level `packages:
write` planted in ci.yml → caught, while its redundant sibling
`contents: read` is correctly NOT reported (the assertion names the
widening, not the declaration). A job-level redundant `contents: read`
alone → **0 failed / 20 passed**, correctly silent. Both synthetic
workflows were removed; `.github/workflows/` is `ci.yml` alone, the
workflow stays dormant, and the repo still has no remote.
**The exception table ships EMPTY and can still be trusted**, which is
the interesting part: nothing in ci.yml needs more than `contents:
read`, so a row today would be a lie — its per-row machinery is proved
by fixtures instead (M8's triad: an argued row passes, a wrong-file row
does not transfer AND is reported stale, a removed grant leaves the row
stale), and `read-all`/`write-all` are judged as the pseudo-scope `*`.

**THE WIDENING IS THE DIFFERENCE BETWEEN A CAUGHT VIOLATION AND A SILENT
ONE**, demonstrated rather than argued: the same `text-red-500` planted
in `app/test` reads `lint-tokens: clean (38 files scanned under
app/src)` **exit 0** under main's script run in place, and reds with
`file:line` under the new one. Six near-miss classes planted in both new
roots (regex literal spelling the patterns, arbitrary variant, paren
variant, labeled tuple, line comment, block comment) are all silent. The
differential was re-derived from scratch by the verifier — the pre-T-038
line-based scan reconstructed verbatim from `986431e` — giving **both=0
OLD-only=8 NEW-only=0**, all eight being TypeScript LABELED TUPLES in
app/test across six files. **Before T-038 this widening would have
redded main on eight false positives; after it, none.** lib/parser stays
OUT (ADR-011, no UI ever) and that is ASSERTED, not merely omitted —
adding it reds. The lint's own script is excluded **by name, not by file
extension** (`.mjs` was added to the walked extensions on purpose so the
exclusion is a decision rather than an accident), and the exclusion is
load-bearing: removing it yields exactly **29** hits against the script.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order. **TWO of the dispatch's forecasts were wrong
because main moved, and both were DERIVED rather than trusted:**
- lib/parser `npm ci` (0 vulnerabilities) + `npm run build` clean +
  `npx tsc --noEmit` clean + `npx vitest run` **197/197 (10 files)** —
  as forecast; T-030 had already landed.
- app `npm install` (0 vulnerabilities), `npx tsc --noEmit` clean,
  `npm run build` exit 0 (**253 modules**), `npx vitest run`
  **535/535 (32 files)** — as forecast.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero compiler warnings**, summed across **11 test binaries**
  (105/0/0/32+1/68/3/7/0+1/2+1/0/0) — **NOT piped through `tail`**,
  written to a file with the exit code taken from `$?`. Unmoved, as a
  branch with zero Rust must be.
- tools/e2e `npm ci` + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14555 npm test` → **54 passed in 8.3s**, headless,
  one worker, retries 0, **no skips, no retries, no flakes**.
  **FIFTY-FOUR, NOT the forecast 50.** The forecast was the branch's own
  36 + 14; main had since taken T-050's `startup-recovery.spec.ts`
  (**+4**). Composition: workflow-parity **11**, workflow-permissions
  **9** (the branch's +14), boot-check-guard 6, startup-recovery 4,
  no-plan-card 4, genesis-screen 4, panel-real-keys 3,
  panel-exempt-controls 3, front-door 3, keyboard-activation 2,
  accelerators 2, trusted-canary 1, map-retarget 1, blocker-retarget 1.
- `npm run lint:tokens` → `clean (93 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **NINETY-THREE, NOT
  the forecast 90**, and the arithmetic reconciles exactly: 38 app/src +
  33 app/test + 23 tools/e2e = 94, **less the one by-name exclusion** =
  93. The +3 over the branch's 90 is main's: T-050 added
  `app/test/startup-recovery.test.ts`, `app/test/startup-screen.test.tsx`
  and `tools/e2e/tests/startup-recovery.spec.ts`. **The builder's own
  forward-looking forecast lands exactly**: it measured 92 over main's
  tree, and 92 + 1 for the branch's own new spec = 93. **Newly walked
  files are now 55** (33 app/test + 22 tools/e2e after the exclusion),
  up from the verifier's corrected 52 at branch point.
- `npm run lint:tokens -- --selftest` → **49 samples green, 14
  walk-policy checks green**, exit 0.

**THE LIVE INTERACTION THE DISPATCH FLAGGED WAS PROVED BY RUNNING, NOT
BY REASONING** — and this is the whole reason the CONVENTIONS
reconciliation mattered. `tools/e2e/tests/workflow-parity.spec.ts` is
the spec this branch rewrote to DERIVE its expectations by parsing
`docs/CONVENTIONS.md` "Build & test". After the merge it parses a
CONVENTIONS that ALSO carries T-030's Gotchas edit. It should be
indifferent (different section, ~66 lines apart) — and it is, measured:
the three derivation tests are green in the 54-test run —
**"the expected commands derive cleanly from docs/CONVENTIONS.md"**,
**"every CONVENTIONS command is a step, verbatim and in CI order"**, and
**"the workflow runs nothing beyond the derived commands and its
infrastructure"**. Two integrators touched that file within the hour and
the gate that reads it is green.

**BOOT GATE (T-046): DID NOT FIRE — stated explicitly, not silently
skipped**, per the CONVENTIONS bullet's "a skipped gate is news, never
silence". The trigger is a diff touching `app/src-tauri/**`,
`app/src/**` or either manifest (`app/package.json`,
`app/src-tauri/Cargo.toml`). **This merge's full changed set — branch
plus checkpoint — is ELEVEN files: `.github/workflows/ci.yml`,
`docs/CONVENTIONS.md`, three tools/e2e files, T-045's card, its four
suggestions, and `docs/STATE.md`. ZERO of them are under `app/` at
all** — not `app/src/`, not `app/test/`, not `app/src-tauri/` — so no
limb of the trigger is touched and the gate correctly stays dormant.
**One trap worth recording for the next integrator**, because the first
derivation here got it wrong: restricting `merge-base..HEAD` to the
trigger limbs returns `app/src/App.tsx` and `app/src/lib/watcher-store.ts`
and looks like a FIRE. **Those are MAIN's, not this merge's** — T-050's,
commit `371c65b`, already on main and already boot-gated at their own
merge. The correct set is `be182ce..HEAD` (what this merge ADDS), which
is empty under `app/`. **Both branch roles also declared the gate
untriggered in as many words**, which is the fourth consecutive clean
exercise of that limb. Nothing was spawned; no scratch port was used for
a boot check.

**1420 WAS NEVER BOUND, CONTACTED OR SIGNALLED.** It was OBSERVED with
`lsof` only: the human's vite is **pid 64249** holding `[::1]:1420` with
one established connection to their webview — **the same pid T-030's and
T-050's checkpoints recorded, so their app has still not been restarted.**
The e2e lane ran on scratch port **14555**, chosen after probing
14555/14556/14557 free and deliberately avoiding **14520** (T-045's
builder), **14533** (T-045's verifier) and **14542** (T-030's merge).
`lsof -nP -iTCP:14555` after the lane: **empty**.

**THE SHARED-WORKING-TREE SIDE EFFECT — AND THIS TIME THE HONEST ANSWER
IS "PROBABLY NOTHING", WHICH IS ITSELF THE DATA POINT.** Six previous
faces are catalogued in the open question below, and the sixth (T-030's)
was the widest: rebuilding `lib/parser/dist/` changes what the human's
vite serves through the `@nputer/parser` symlink even though no byte
under `app/src` moved. **This merge ran that same rebuild** — ADR-011's
fresh-install order requires it — plus `npm ci` in lib/parser and
tools/e2e (which delete and recreate `node_modules`) and `npm install`
in app/. **But the parser SOURCE is byte-unchanged since T-030's merge**,
so the rebuilt `dist/` carries the same content, and the app bundle
proves it: `index-RXeeD2qB.css` **41.30 kB** and `index-ChZ8PwVH.js`
**448.55 kB** — **both content-hashed names identical to T-030's merge.**
So the expected observable effect on their screen is **nil**, with one
caveat stated at the confidence it deserves: the `npm ci` reinstalls
briefly removed and recreated `lib/parser/node_modules` under a live
vite, and whether that produced a transient blip was **not observed**
(no screen control). **This is the first merge in seven whose honest
prediction is "your screen did not change."**

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **TWENTY-SECOND** exercise, and the cleanest example yet of the
distinction three integrators have now had to draw.
- **THE RULE FIRED. IT DID NOT "NOT APPLY".** The trigger is a diff
  carrying `*.ts/*.tsx/*.js/*.jsx` outside `docs/`, and this diff
  carries two: `tools/e2e/tests/workflow-parity.spec.ts` and
  `tools/e2e/tests/workflow-permissions.spec.ts`. So the ritual was
  RUN, not skipped.
- **AND THE REGEN IS A VERIFIED NO-OP.** `.nputerignore` line 4 is
  `docs/` and line 8 is `tools/`, so a diff confined to `tools/**`,
  `docs/**` and `.github/**` cannot move a single node. Proved rather
  than reasoned: **sha256
  `f80c1ba7e929ec71f18d01d21aee733bd1561d330a99fea70388ac1655b0f3ad`,
  398,546 bytes — IDENTICAL before the regen, after regen 1, and after
  regen 2**, with `git status --short docs/architecture/` empty
  throughout.
- **THE DISCRIMINATING EVIDENCE, and it is the opposite of T-030's.**
  The plain (non-golden) ignored self-check was run **BEFORE** the
  regen with `NPUTER_UPDATE_GOLDEN` confirmed UNSET at the shell:
  `self_graph_is_current ... ok`, **exit 0**. T-030's was **RED before
  its regen (exit 101)**. That before-state is what separates
  "fired-and-no-op" from "fired-and-moved", and it is cheap — one run.
  Re-run after both regens: still `ok`, exit 0.
- **NO FIXTURE EDIT, and the precedent is explicit.** The dogfood
  fixture's reconciliation log carries blocks for exercises 3, 4, 5, 6,
  9, 11, 12, 13, 16, 18, 19, 20 and 21 — **exercises 7, 8, 10, 14, 15
  and 17 have none**, because a byte-identical graph has nothing to
  reconcile. T-030's twenty-first block existed because the graph MOVED
  (symbols 667→670, edges 1063→1069) while no fixture assertion did;
  here **the graph did not move at all**, so a block would be a log
  entry about nothing. `app/test/architecture-dogfood.test.ts` and
  `app/test/map-dogfood-render.test.tsx` are both deliberately
  untouched — which also keeps this merge's changed set free of `app/`
  entirely, and therefore keeps the BOOT GATE derivation above simple.
- **The T-024 three-fixtures rule does not fire**: T-045 declares no
  component and changes no registry file.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. **No
GitHub API call, no remote creation — the workflow stays dormant** and
`git remote -v` is still empty.

**THE MERGE WAS CLEAN AND THE OVERLAP WAS PROVED, not assumed.** Merge
commit **`3b0d974`**, merge-base **`6ed97cf`**, ten files. Both changed
sets were enumerated and `comm -12` is **EXACTLY ONE FILE —
`docs/CONVENTIONS.md`** (10 branch files against 39 main-side files).
`git merge-tree --write-tree` was run FIRST and answered a single tree
with zero conflict markers; **the merged tree hash reproduced that
prediction exactly — `265a5b5eadf79b8cb56c5b955766973b7fc4b7f1`.**

**THE CONVENTIONS RECONCILIATION, CONFIRMED FIRST-HAND rather than taken
from T-030's note.** T-030's integrator enumerated it in advance and was
right: **T-030 edits the genesis-kit bullet in `## Gotchas`; T-045 edits
the CI bullet in `## Build & test`.** Verified here three ways rather
than trusted: (1) the hunk headers are `@@ -134,9 +134,16 @@` (main
side) against `@@ -68,13 +68,28 @@` (branch side) — **roughly 66 lines
apart, no shared hunk**; (2) the merged file diffed against EACH parent
shows exactly the OTHER side's single hunk and nothing else, which is
the algebraic proof that the merge is the union of both edits and
neither was dropped; (3) the merged file reads coherently end to end —
`## Build & test` now closes with the four-divergence CI bullet, and the
genesis-kit bullet's "CLOSED since T-030" text sits intact in
`## Gotchas` below it. **And the spec that PARSES this file is green**,
which is the check that could not be made by reading.

INTEGRATOR JUDGMENT CALLS, recorded.
- **CONVENTIONS: the branch's edit was VERIFIED ACCURATE HERE, not taken
  from the verdict**, and one known imprecision was LEFT AS COMMITTED.
  The four divergences were each re-checked against the merged ci.yml and
  each is real. The imprecision is the verifier's correction 3: the
  bullet says the lint is "the job's FIRST step" when apt and `rustc
  --version` precede it. **Left alone deliberately**, for three reasons:
  the load-bearing half ("ahead of every `npm ci`") is exact and is the
  half a reader acts on; the verifier already recorded the correction in
  the card, so the record is not silent; and **editing that bullet at a
  merge would change the exact text a green gate has just been measured
  against**, for a gain of one adjective. It is a candidate for the next
  triage's cheapest-fix pile, not for an unreviewed integrator edit.
- **ARCHITECTURE: NOT edited, and the check was real rather than
  assumed.** `tools/e2e/` is declared there as "dev tooling under no
  component — it drives the app from outside over HTTP, imports neither
  package, and is .nputerignored out of the map", so unlike C-05's and
  C-06's rows there is **no per-task running record to keep current**.
  Every claim it makes still holds after T-045, each verified: still the
  one CI job, still "a thin invoker of the CONVENTIONS commands" (and
  MORE so now that the typecheck hole is closed), still dormant, still
  `.nputerignore`d, and **still importing neither package** — swept, and
  the only `@nputer/parser` occurrence anywhere under `tools/e2e` is a
  string inside a preflight message. Applying the T-050 lesson that "a
  document which enumerates a key set has committed to maintaining it",
  ARCHITECTURE was swept for an enumeration of CI STEPS or of the
  divergences: **there is none** — that enumeration lives only in
  CONVENTIONS' CI bullet, which the branch updated.
- **THE STALE-POINTER SWEEP, which this task specifically invited.**
  T-045 MOVED the least-privilege assertion out of
  `workflow-parity.spec.ts` into `workflow-permissions.spec.ts`, so every
  pointer at the old home was checked. `.github/workflows/ci.yml` line 34
  (the T-036 rule comment) was **already corrected by the branch**; line 3
  still names workflow-parity for "validity, command parity, SHA pins,
  and the xvfb boot step" and is **still exactly right** — those four all
  stayed. The remaining hits are in **dated task cards** (T-020, T-036,
  T-038, T-041-s4, T-046), which are the record of what was true when
  they were written and are **deliberately not rewritten** (succession
  rule). No live doc points at the old home.
- **ROADMAP: NOT edited, and the test comes out the way it did for
  T-030, T-041, T-047 and T-048.** T-045 is milestone 4 and adds **no
  user capability** — it is a pipeline-gate correctness task. There is
  also **still no milestone-4 section to write it into** (ROADMAP
  carries Milestones 1, 2 and 3 only), and writing CI-gate internals
  into milestone 3's genesis narrative would overstate it.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives with cross-component blast radius. **Every choice
  here is local to a tree that ARCHITECTURE explicitly places under NO
  component**, and each was already argued in the card: the DERIVE arm
  (the criterion named both arms and required the taken one be recorded
  — it was), the two-spec split ("rules every workflow obeys" versus
  "facts about the one CI job"), the exception table shipping empty, and
  `MUST_COVER` being a second list rather than a derived one. **The one
  change that could have read as a contract move is the T-036 narrowing
  (a top-level `permissions: {}` now passes), and it was ruled against
  criterion 4's own stated target** — "no unargued grant", not
  zero-allowlist — with the loss running toward LESS privilege and
  pinned by fixture M7. (b) **Prong two is not vacuous.** ADR-011 holds
  and is the one this diff leans on hardest — the lint keeps lib/parser
  OUT by name and asserts it, the three packages were each installed and
  run with their own commands verbatim, and **zero manifests and zero
  lockfiles moved** (verified as a SET: the changed set restricted to
  `method/`, `capabilities/`, `app/src-tauri/` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json`/
  `tsconfig*.json`/`vite.config.ts`/`vitest.config.ts`/`tauri.conf.json`/
  `.nputerignore` returns **0 files**). ADR-014 holds (the graph rule
  fired, the regen proved deterministic across two runs and current by
  the indexer's own plain self-check). ADR-012 holds (no native surface
  moved, zero grants touched, the 92-grant `core:default` set unmoved and
  still green under `cargo test`). ADR-003 holds (no model call). ADR-002
  holds (all state in files). **ADR-009 was checked and its trigger is
  NOT present**: the new parsing code is test-only and reads exactly two
  repo-owned surfaces — `docs/CONVENTIONS.md` and
  `.github/workflows/*.y{a,}ml` — not untrusted input. (c) Prong three:
  the durable calls live in the card's criteria→evidence map, its seven
  proof obligations, the 24-way attack log and the verifier's three
  recorded corrections.

## Overnight grants — SECOND autonomous run (human, 2026-08-17 night)
Given via question card while awake, before sleeping. Standing until
revoked:
1. **MILESTONE 3 TO COMPLETION.** Review + apply T-027's planning pass,
   dispatch its build, then T-028 and T-029 as they unblock —
   INCLUDING sequencing T-042 first if the planning pass concludes it
   must land before T-027 (its criterion 4 decides where the docs
   change log lives, and T-027 is the second consumer). **T-042 was so
   sequenced and is in VERIFICATION now; T-027 dispatches after it
   merges.**
2. **THREE MILESTONE-4 LANES IN PARALLEL**, all disjoint from T-027's
   app-interview + app-shell: **T-030** (parser strictness, lib-parser),
   **T-045** (the gates cover the rules, tools/e2e), **T-034** (map
   tasks lens, app-map). **T-030 AND T-045 ARE BOTH DONE AND MERGED —
   T-045 is this checkpoint. T-034 is verifying.**
3. **THIRD TRIAGE APPLIED** — read-only analyst drafts, architect
   reviews and applies. Docs-only, reversible, one diff to read.
   Tasks NEWLY CREATED by triage still do NOT dispatch without the
   human.
UNCHANGED by this grant: a second REJECTED on any task parks that lane
for the human; @human judgments are never self-answered; no screen
control beyond the ruled boot check; port 1420 is the human's.

## In progress / broken right now
**THREE TASKS ARE `building`** (the parser re-parse confirms the count —
it was four before this merge), all in their own worktrees, all disjoint
from each other and from this merge, and **all three are in VERIFICATION**:
- **T-042** — genesis switch truthfulness, worktree `../nputer-t042`
  (`docs_watch.rs` + `watcher-store.ts`). **Sequenced AHEAD of T-027
  under grant 1** — its criterion 4 decides where the docs change log
  lives and T-027 is the second consumer. **T-027 dispatches after
  T-042 merges.**
- **T-034** — map tasks lens, worktree `../nputer-t034`
  (`app/src/architecture/`). **This is the lane T-030-s3 aims at**: it
  builds dependency waves over the very `blocked_by` graph whose edges
  can silently re-point when an unpadded sibling id appears. That
  finding still wants promoting before those waves ship.
- **T-014** — `nputer index --check` binary, worktree `../nputer-t014`
  (`crates/nputer-index/`). It matters here for one specific reason:
  **it is the named retirement trigger for the T-009-s1 interim regen
  rule this checkpoint just exercised for the twenty-second time.**

None of the three worktrees was entered by this merge. The only
cross-lane reads were of git REFS from the main checkout, which is
read-only and touches no worktree.

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t045 worktree is removed and its branch KEPT — **33 task branches
merged now**, `t001-app-shell` through `t050-recover`. Main tree clean;
all four suites green; the token lint green over 93 files at zero
allowlist; the committed graph current and proved so by the plain
self-check rather than by assumption. The parser re-parses the whole
live tree at **0 issues**: **94 tasks**, tally **34 done / 14 planned /
9 parked / 34 suggested / 3 building**, 6 features, 11 components.
(Tasks rise by four since T-030's checkpoint — T-045's four suggestion
files; its card already existed on main as `building`.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-045 did, however, WIDEN the one gate that was already
standing**: the least-privilege rules now cover every workflow file
rather than ci.yml alone, so a second workflow arriving without a
`permissions:` block reds the lane by name. The sharpest open set is
still app-agent's, untouched by this merge: **T-047-s5** (two doors, one
standard, only one guarded — ~5 lines), **T-047-s6** (nothing
structurally stops a test resolving the real CLI — the one that has
already fired), **T-047-s4** (`$SHELL` picks the program, and a comment
in the code is now false), and **T-047-s1** (the cache that saves zero
spawns). Beside them the process-hygiene pair stands: **T-046-s1** (the
unsignalled process group, on the human's own port) and **T-041-s4**
(the one env-var path that would package a DEV harness).

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020), and
**T-045 changed what that watch looks like, in two ways.** At the repo's
first push (`git remote -v` is still empty), confirm in order: the
ubuntu apt/webkit2gtk set installs; the three `uses:` SHA pins resolve;
**the NEW `e2e types` step runs** — it is the one step in the workflow
that **has never executed on any runner**, and it was added by this task
because CONVENTIONS documented it and CI never ran it; then playwright-
on-Linux runs the lane — **now 54 tests**, whose most platform-sensitive
are the ones measuring REAL CSS in Chromium-on-Linux (**if anything goes
red there, look at the font and colour assertions in `front-door.spec.ts`
and `genesis-screen.spec.ts` first**), plus T-048's three-viewport sweep,
which asserts EXACT pixel equality between `document.scrollHeight` and
the viewport at 800x600, 1024x768 and 1280x720 — a Linux
scrollbar-gutter or default-font difference shows up there before
anywhere else and should be read as a platform difference to file, not a
regression, unless the pane's region also stops scrolling. **T-049's
Linux exposure to watch**: `accelerators.spec.ts` presses `Meta+o` /
`Meta+n` in real Chromium and asserts `defaultPrevented`; on Linux the
Meta key is not the platform accelerator and the app deliberately accepts
Control too, so if that spec reds there, read it as a key-mapping
difference to file before touching the matcher — and note it would be the
first evidence about T-049-s4's territory that anyone has. **T-050's MILD
one**: `startup-recovery.spec.ts` includes a case that reads the failure
card's computed colours from the real sheet in BOTH schemes, so it joins
the CSS-sensitive group above. **T-045's OWN twenty are the LEAST
platform-sensitive in the lane** — workflow-parity's 11 and
workflow-permissions' 9 open no browser at all; they parse
`docs/CONVENTIONS.md` and `.github/workflows/*.y{a,}ml` off disk, so a
red there on Linux would mean a line-ending or filesystem-ordering
difference, never a rendering one. Then: `cargo audit` behaves as it does
locally; and **the xvfb `tauri dev` boot prints both `[nputer]` startup
lines** — the FIRST exercise of the boot check on Linux, and the only
place T-046's override's Linux behaviour will ever be observed (CI
deliberately sets no `NPUTER_BOOT_PORT`, so the override path stays
Linux-unverified by design). AND (T-018-s3 fold) the THREE T-018 SENTINEL
LIVE TESTS inside the ubuntu `cargo test` step — replaced-wholesale and
deleted-recreated docs/. They discriminate only where inotify watches
INODES; macOS FSEvents watches paths and was accidentally resilient,
which is why T-018's replace-half evidence is mechanism-only today. Green
there CLOSES that gap; red there is a real reconcile gap macOS could
never surface, and gets filed immediately. This run also closes
T-001/T-003's Linux halves, and carries T-026-s1 (the plan probe's
exact-case match) and T-021-s1 (the ACL pin is macOS-derived). The ubuntu
`cargo test` step also runs the `agent_runner` integration tests — **32 +
1 ignored** — which spawn real child processes and send real signals;
T-047's newest plant files, refuse paths and assert on executable bits,
so a Linux permissions or `/bin/sh` difference would show up there first.
Watch it, and watch for the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN, and for the first time
   in seven merges NOTHING ON IT SHOULD HAVE MOVED.** The app is RUNNING
   on 1420 as this checkpoint lands — **vite pid 64249, the SAME pid
   T-030's and T-050's checkpoints recorded, so you have not restarted
   it.** T-045 wrote zero bytes under `app/`, and although this merge
   rebuilt `lib/parser/dist/` (ADR-011's install order requires it), the
   parser source is byte-unchanged since T-030 and the app bundle hashes
   came out identical. **So the T-030 items below should look exactly as
   that checkpoint described them, and if they do not, that is news.**
   - **STILL OPEN FROM T-030: the model badges on your board should be
     SHORT.** T-020's and T-024's cards should read `opus` where they
     once read a 50-character run, and T-001's verified-by badge should
     read `+`. If they still show the long strings, reload the window.
     **The judgment that is yours: `+` is honest but ugly** (it is what
     is left of `claude-fable-5 @fresh (2 passes) + @human (visual)`),
     and it is filed as **T-030-s1** with four fixes costed. Is a bare
     `+` acceptable on a card face, or does that suggestion get promoted?
   - **THE HEADER'S DENSITY, T-049's item, still open** — the board
     header's right group is `Open folder… | Start an interview |
     Toggle theme`, three equal outline buttons where the front door
     gives its primary an ink pill, so **"Start an interview", the
     capability milestone 3 is named after, looks exactly like "Toggle
     theme"**. Separator? Emphasis? Or is quiet right? Two more: the
     header pair carries **no `⌘O · ⌘N` hint** while the front door does
     (and the startup screen does too — so the chords are advertised in
     two places out of three); and **neither group wraps or truncates**,
     so at a narrow window that row has nowhere to go. (Also: the header
     says `Open folder…`, the front door and the startup screen say
     `Open a folder…`. Same verb, two registers.)
   - **T-050's TWO OPEN JUDGMENTS, unchanged and still yours.** If you
     ever see "waiting for the first docs snapshot…" again, tell us what
     the screen looks like now — it should carry `Try again`, `Open a
     folder…`, `Start an interview` and a `⌘O · ⌘N` hint. **Does the
     failure copy read right**, and **does retry belong on that screen
     or in the header?**
   - **AND T-050's WARNING, which still matters more than the copy —
     T-050-s2.** If you land on the failure screen and escape it with
     **"Open a folder…" rather than "Try again"**, you reach a board
     with real content that is **silently dead**: no `docs-changed`
     handler was ever registered and picking does not re-subscribe.
     **Use "Try again" — that route is proven live.**
   - **The startup screen's own composition** — the first screen in the
     app to put four controls in one wrapping row with a hint beside
     them, reusing the front door's verbs without its layout. Worth an
     eye beside the header item: same question in two places.
   - **The frame at 800x600, T-048's item, still open.** The pane
     scrolls inside a fixed header and heading, and the artifact list
     gets 286px of the 858px it wants at the size the app actually
     opens. The measurement says the frame holds; **whether it holds
     ENOUGH list to be useful is an eye judgment only you can make.**
   - **THE COMPOSITION QUESTION, still the ONLY framing item left and
     still T-027's.** T-024 drew the pane as the **RIGHT HALF of a split
     view**; until T-027 it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box, and does the **five-across backbone grid**
     hold at full width when it was drawn for a half-width pane?
     **This is the question T-027's planning pass waits on** (item 2).
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. **Read T-048-s4 before T-048-s3** — s3 says the "Start an
     interview here" button falls below the fold at 800x600 and **that
     conclusion is wrong**; the button and the footnote both measure
     clear of the fold, and what spills is padding and 15px of painted
     card edge.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; true cold-context
     evidence still arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS. What remains is
     the native half — "Start an interview" → native dialog → a
     docs-less folder lands on the genesis screen; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis. (T-049-s1 records why the served
     bundle can prove a chord was CLAIMED but never that it was OBEYED.)
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
     (one .jsonl, 17,128 bytes, zero-token synthetic records). Outside
     the repo and deliberately not deleted. **Delete it or keep it — the
     call is yours.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above, now
     carrying T-045's never-executed `e2e types` step.
   - **A PRIORITY CALL, not a screen action.** The next triage now has
     **five** kinds to rank, and T-045 adds four cards to two of them.
     **CORRECTNESS-OF-RECORD, still the one with a DEADLINE: T-030-s3.**
     A silently re-pointing `blocked_by` edge is a wrong answer in the
     dependency graph **T-034 is building waves over right now** — rank
     it against T-034's own schedule, not against the rest of this list.
     **GATE COVERAGE, new with T-045 and cheap: T-045-s4** (the
     CONVENTIONS parse is silent about commands ARRIVING in a nested or
     fenced shape — it is loud about everything already in the doc, so
     this is a residue, but the parse is now load-bearing for CI parity),
     **T-045-s2** (importing `lint-tokens.mjs` RUNS the lint and can EXIT
     the importing process — it has now bitten two tasks in a row and the
     verifier ruled it worth its own card), **T-045-s3** (composite
     actions and reusable-workflow grants escape the permissions rules),
     **T-045-s1** (CI could shrink four divergences to two). Observability:
     **T-050-s3** (a stranded startup writes nothing to the log — the
     reason that investigation could not name a cause). Process/spawn
     hygiene: T-046-s1, T-047-s6 (the only one that has already fired),
     T-047-s5 (~5 lines). Layout/scroll: T-048-s2 (the map canvas clips —
     silent graph loss the day anything bounds it), s1 (two scroll
     models, T-027's), s5 (the floor, one line). Reach: T-049-s4 (chords
     dead on every non-Latin layout while the UI advertises them) and s3
     (four advertised mechanism properties, none pinned). And
     **T-050-s2** (the silently-dead board), the one that can bite a user
     without warning.
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049 +
   T-050, ADR-017). **What holds the milestone is now BOTH the human and
   a merge, in this order:**
   (a) **T-042 must merge, then T-027 dispatches** — that sequencing was
   taken under grant 1 because T-042's criterion 4 decides where the
   docs change log lives and T-027 is the second consumer. **T-042 is in
   VERIFICATION now.**
   (b) **T-027's planning pass ALSO waits on the human's split-view
   verdict** (item 1) — it builds the LEFT half of a composition whose
   whole design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also inherits T-047-s3** (a read boundary on
   `model` at the first site that renders it), **T-048-s1** (the two
   scroll models, which only a composition decision can collapse), and
   **T-049-s2** — its accelerator criterion literally says "(their
   unmount-scoping test stays green)" and T-049 made that false on
   purpose, so the criterion needs a one-line rewording before it
   dispatches, plus **T-049-s3** (the four unpinned mechanism properties
   it is about to lean on).
   (c) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict and for T-042.
   **app-agent is FREE** — T-047 merged — which unblocks **T-043**'s
   "serialize behind T-039 on app-agent" condition outright;
   **app-shell is FREE** (T-050 merged); **lib-parser is FREE** (T-030
   merged), which matters because **T-031 and T-032 both sit in that
   lane and both inherit halves T-030 deliberately left them** (T-024-s6's
   board-badge half is T-031's, its map-badge half and T-011-s4's glob.ts
   header half are T-032's); and **tools/e2e is FREE as of this merge**,
   which matters for **T-044** (shell pins cover their surface) and for
   any promoted T-045 suggestion. Triage: APPLY granted — but tasks
   NEWLY created by triage (T-041…T-051) do NOT dispatch without the
   human. Unchanged method rules: a second REJECTED on any task parks
   that lane for the human; @human judgments are never self-answered.
4. SUGGESTION BACKLOG — **43 open files: 9 parked + 34 suggested.**
   **T-045 contributes FOUR — three from the builder, one from the
   verifier — and they do not rank together.**
   **Untriaged (34)**: the four T-045 cards — **s4** (VERIFIER-FILED and
   the sharpest of the four: the CONVENTIONS parse is loud about every
   command that MOVES and silent about three shapes a command can ARRIVE
   in — an indented sub-bullet, a sub-bullet with its own marker, a
   fenced block; the replaced array saw none of them either, so it is a
   residue not a regression, but the parse is now the thing CI parity
   rests on), **s2** (importing `lint-tokens.mjs` runs the whole tree
   lint at module scope and can `process.exit(1)` the IMPORTER —
   demonstrated, not inferred: the importing harness never reached its
   next line; it bit T-038 and T-045 both, and the card's reasoning for
   extracting a side-effect-free module rather than the obvious
   `import.meta.url` guard was ruled right and consistent with T-046's
   precedent), **s3** (composite actions under `.github/actions/` carry
   no `permissions:` key and are not enumerated — point 1 exactly right;
   **the verifier CORRECTED point 2**: an *unargued* caller grant IS
   caught by name, what actually escapes is narrower — an *argued*
   caller grant silently upgrading a callee whose own block says less),
   **s1** (CI could invoke `npm run lint:tokens` and `xvfb-run -a npm
   run boot:check` and shrink four divergences to two — ruled SOUND and
   correctly deferred: `npm run` only extends PATH so the zero-dep first
   step survives, but changing a dormant workflow's commands to shorten
   a test's table is the wrong direction of causation) — plus the five
   T-030 cards (**s3** PROMOTE FIRST and against T-034's clock:
   zero-padding aliases task and feature ids, and a `blocked_by: [T-01]`
   edge silently RE-POINTS the moment an unpadded sibling appears;
   **s2** the roadmap parser is still fence-blind; **s4** the two parsers
   now disagree about what content is, and the shared fix must treat
   inline code as inert or it eats T-030's own card; **s5** `<!-->` is a
   valid empty comment read as an unterminated opener — loud, so the
   contract holds; **s1** the representative rule leaves a literal `+`)
   — plus the three T-050 cards (**s2** FIX FIRST of that set: a board
   reached after a failed subscribe is not live, **s3** a startup failure
   never reaches the log, **s1** a hanging startup is not a rejection —
   conclusion right, one mechanism sentence wrong and the correction is
   in T-050's record) — plus the four T-049 cards (**s4** `event.key`
   makes the chords silently dead on every non-Latin layout, **s3** the
   hook's four advertised mechanism properties are each deletable with
   the suite green, **s2** T-027's accelerator criterion names a test
   T-049 retired — one-line reconciliation, cheapest thing on this list,
   **s1** the lane sees a browser, not the app) — plus the five T-048
   cards (**s2** the map canvas clips instead of scrolling, **s4** the s3
   CORRECTION — read it BEFORE s3, **s1** two scroll models, **s3** the
   no-plan card overflows at 800x600, **s5** the bounded frame's floor)
   — plus the six T-047 cards (**s5** the probed path skips the gate,
   **s6** nothing structurally stops a test resolving the real CLI,
   **s4** `$SHELL` picks the program, **s1** retire the cache, **s2** the
   flag table is a version snapshot, **s3** the model has no read
   boundary, home T-027) — plus **T-041-s2** (the wire shape is pinned in
   Rust and mirrored by hand in TS with nothing comparing them),
   **T-041-s4** (`NODE_ENV`, not `--mode`, flips the DEV gate),
   **T-046-s1** (the unsignalled process group), **T-046-s4** (the
   overlay's blind spot), **T-046-s2** (`checkJs` — its worked example is
   wrong and the correction is IN the file), **T-046-s3** (nothing gates
   the packaged build — read with s4 and T-041-s4: all three are "a gate
   proves the configuration it was handed, not the one that ships"), and
   **T-039-s3** (give the session-id refusal its own typed outcome; home
   is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet — T-048 is the first task to
   measure the app at six viewport sizes, so s1's claim is weaker than
   it was).
   Triage-born tasks standing ready and un-dispatched: **T-043** (kill
   path — its serialization condition is SATISFIED and app-agent is
   free; T-047-s4 nominates it as a home), **T-044** (shell pins cover
   their surface — **tools/e2e is free as of this merge**), **T-051** (a
   window the split fits in).
   Milestone-4 queue after F-03: T-010, T-013, T-015, T-022, T-031…
   T-033, T-035, T-044. (T-014, T-034 and T-042 are in flight;
   **T-030 and T-045 are done**.)

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`, **now in verification**); BOOT GATE names none
  in CONVENTIONS, and `.github/workflows/ci.yml` already invokes the boot
  check on ubuntu while dormant. Does it retire at the repo's first push,
  or only when a macOS gate exists too? Left for a triage. **SIX
  exercises in — T-045 is the FOURTH consecutive branch to declare it
  UNTRIGGERED rather than skip it silently**, which is the bullet's "a
  skipped gate is news, never silence" working on its quiet limb. **And
  T-045's merge adds a wrinkle worth taking to that triage: deriving the
  trigger set naively (`merge-base..HEAD`) returns MAIN's files as well
  as the merge's own and looks like a FIRE.** The rule says "at any merge
  whose diff touches…" without saying WHICH diff. Two integrators have
  now hit it; the fix is one clause naming `<main-before>..HEAD`.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **This is now the LIVE one, and T-045 is the third gate.**
  There are now THREE rules with the shape trigger → command → record —
  the T-009-s1 regen rule, BOOT GATE, and (since T-045) the CI parity
  gate whose expectation is DERIVED from CONVENTIONS rather than mirrored
  — and `method/roles/executor.md` still says only "run the test commands
  from CONVENTIONS.md until green". The standing answer was "ask ONCE
  when a THIRD lands". **A third has landed.** A method version bump, not
  an ADR.
- **Does the shared main working tree need a rule?** Carried forward
  with **six faces catalogued and a SEVENTH that is a near-miss rather
  than an instance**. The first was the git INDEX (T-046's merge lost its
  house shape to a shared index; the fix that works is social — "the pen
  is yours" — plus `git diff --cached --stat` before every commit, done
  twice here). The second was the WORKING TREE via Rust: an app-agent
  merge REBUILDS and RESTARTS the app the human is reviewing. The third
  (T-048) was the same tree via **HMR** — no restart, same pid, but the
  screen under review changed without a signal. The fourth (T-049)
  sharpened that: the merge changed what the KEYBOARD does. The fifth
  (T-050) replaced the exact screen the human had photographed. The sixth
  (T-030) was the widest: rebuilding `lib/parser/dist/` changes what the
  human's vite serves through the `@nputer/parser` symlink even with zero
  bytes written under `app/`. **T-045's is the first merge where the
  honest prediction is "nothing changed"** — the same rebuild ran, but
  from byte-identical source, and the app bundle hashes came out
  identical. **What it adds to the question is a NEW mechanism rather
  than a new outcome: `npm ci` DELETES and recreates `node_modules`, and
  ADR-011's install order makes an integrator run it in `lib/parser`
  while the human's vite is resolving dependencies through that very
  directory.** Nothing was observed to break; the window is small and the
  content identical. But it is a face the previous six do not cover — the
  hazard is not only what a merge WRITES, it is what a merge briefly
  REMOVES. Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: three C-14-local rules exist and a charter was argued against,
  because T-047-s5 proves the cached and probed doors hold DIFFERENT
  standards today. **The moment to write it is when s5 lands** — that is
  when there is a single rule to charter.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, and **T-045 is the FIFTH data point and the first
  where a criterion named BOTH arms and made the choice reportable.**
  Criterion 1 wrote the strong arm (DERIVE) and the weak arm (keep the
  array, add a pointer) into the card, said the weak arm "is strictly
  weaker and SHALL be recorded as the arm taken", and let the builder
  choose. **The strong arm was taken and it found two defects the weak
  arm could not have found.** That is a cleaner shape than either
  prescribing a remedy (T-048's criterion 3, which was wrong) or naming
  only a property (T-049/T-050): it names the alternatives, ranks them,
  and requires the choice be recorded. **Three candidate rules now, all
  cheap**: a criterion that names a specific remedy SHALL carry an "or a
  demonstrably better equivalent" hatch; a remedy inherited from a
  suggestion SHALL be written as a hypothesis to test rather than a shape
  to build; **or — T-045's shape — a criterion offering more than one arm
  SHALL rank them and require the taken arm be named in the notes.** The
  architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward, and **T-045 is the third example and the first
  where the answer is "a different file".** T-036's single least-privilege
  test was DELETED from `workflow-parity.spec.ts`; its generalised
  successor lives in `workflow-permissions.spec.ts`. A verifier diffing
  the parity spec alone sees an assertion vanish. **The builder named the
  new home in the notes and the verifier checked the coverage claim
  rather than accepting it — and found ONE sub-case genuinely not carried
  (a top-level `permissions: {}` now passes).** That is exactly the
  candidate rule working: a task that deletes or replaces an existing
  test SHALL name, for each assertion dropped, either its new home or its
  suggestion id. **Three clean examples now exist** (T-030's relocated
  pin, T-050's rename-not-retire, T-045's cross-file move) and the rule
  is describing behaviour the lane already has. Method version bump, the
  architect's call.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered. The candidate
  rule is narrow: a session that inherits committed work it did not write
  SHALL say so in the notes and SHALL mark which measurements it re-ran
  versus inherited. Method version bump, the architect's call (ADR-004).
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-045 is the second instance in two
  merges, and it is now hard to call either an accident.** T-030's card
  asserted "a FIFTY-character badge" and "SIX live stamps" and both were
  wrong (59 at the `model` field; eight wrong stamps across nine fields).
  **T-045's card asserted "the TWO documented divergences" — there are
  FOUR**, and the builder found it only because the derivation forced a
  count where the array had encoded an assumption. **Neither error would
  have shown up as a red test**: a spec written to the card's two would
  have been green, and the two undocumented divergences plus the
  never-run `npm run typecheck` step would still be invisible. The
  candidate rule is one line: a numeric claim in a card body is EVIDENCE
  TO REPRODUCE, and a task that reproduces it differently SHALL record
  the corrected number in the notes rather than silently satisfying the
  criterion. **T-045 also shows the mechanism that makes it work**: the
  count was forced because the expectation was DERIVED from the source of
  truth instead of transcribed from the card. Method version bump, the
  architect's call (ADR-004).
