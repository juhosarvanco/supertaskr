---
id: T-036
title: CI token least privilege — declare the permissions block before the first push
feature: F-02
milestone: 4
priority: 20
size: S
status: building
blocked_by: []
touches: [.github/, tools/e2e/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-020-s4. Architect ruling 2026-08-16: least privilege, taken
now while the workflow is DORMANT — after the first push the same edit
happens against a live credential. ci.yml pins everything else about
its supply chain (ubuntu-24.04 not -latest, every `uses:` by 40-hex
SHA, `npm ci`, exact-pinned Cargo deps under the audit) and then
leaves the one credential it carries undeclared: with no
`permissions:` key, GITHUB_TOKEN inherits the repository's default
workflow-permission setting — a checkbox in a web UI, not a fact in
this repo. That is exactly the class of machine-local invisible input
T-009 §3 exterminated from the graph. The job checks out, installs,
builds, runs three suites, lints, audits, runs the E2E lane and boots
under xvfb; it writes nothing back, opens no PR, uploads nothing.
S-tier: executor + tests, no separate verifier (ADR-004 tiering); the
parity spec is the regression net.

## Acceptance criteria
- THE workflow SHALL declare `permissions: contents: read` at the
  top level (workflow scope, under `name:`), so the token's scope is
  a repo fact rather than an account setting — the ADR-012 discipline
  applied to CI credentials: the minimum is the default and every
  addition is argued in place.
- THE workflow-parity spec (tools/e2e/tests/workflow-parity.spec.ts)
  SHALL pin it beside the existing runner/timeout assertions: the
  block exists, is exactly `contents: read`, and no job or step
  declares a wider scope — failing loudly if a future edit widens it.
- WHEN a future step genuinely needs more THEN the grant SHALL be
  added at that job's scope with the reason recorded beside it, never
  by widening the workflow default (stated as a comment in ci.yml so
  the next editor reads the rule at the point of temptation).
- THE change SHALL move nothing else: no step, action SHA, command,
  or ordering may differ, and the parity spec's existing assertions
  SHALL pass unchanged.

Verification: headless — `npx playwright test` in tools/e2e (the
parity spec runs without a browser), plus a mutation drill: widen the
block transiently, require the new assertion to fail naming the
widening, revert. The workflow itself stays honestly unverified until
the repo's first push (T-020 §1 tier 3).

## Implementation notes

Built by claude-opus-5 @fresh on branch `t036-ci-permissions` (branch
point main@548b990) in worktree /Users/ujju/Projects/nputer-t036.
S-tier per ADR-004: executor + tests, no separate verifier session, so
every criterion below carries its own proof and every drill output is
pasted verbatim rather than summarized.

### The whole change

Two files, 109 insertions / 3 deletions, nothing else touched. Added
to `.github/workflows/ci.yml` immediately under `name: ci`, verbatim:

    # LEAST PRIVILEGE for the one credential this workflow carries (T-036 —
    # ADR-012's discipline applied to CI: the minimum is the default, and
    # every addition is argued in place). This job checks out, installs,
    # builds, runs three suites, lints, audits, runs the E2E lane and boots
    # under xvfb — it writes nothing back, opens no PR, uploads nothing, so
    # `contents: read` is the whole of what GITHUB_TOKEN needs. Declared
    # here because WITHOUT this block the token's scope is whatever the
    # repository's default workflow-permission setting says: a checkbox in a
    # web UI, not a fact in this repo (the machine-local invisible input
    # T-009 §3 exterminated from the graph).
    #
    # THE RULE, at the point of temptation: WHEN a future step genuinely
    # needs more, add the grant at THAT JOB's scope with its reason recorded
    # beside it — a `permissions:` key on the job that needs it, naming
    # `contents: read` plus the one extra scope — and NEVER by widening this
    # workflow default, which would hand the extra scope to every job and
    # every step in the file. tools/e2e/tests/workflow-parity.spec.ts fails
    # loudly on any widening, top-level or per-job: that failure is the
    # conversation, not an obstacle to route around.
    permissions:
      contents: read

`tools/e2e/tests/workflow-parity.spec.ts` gains one test beside the
runner/timeout one (its three assertions are criterion 2's three), two
module-level helpers, and one docstring line. The third assertion is
not "the top-level key is present" restated: `collectPermissions` walks
the whole parsed document — workflow, jobs, steps, arrays — collecting
every `permissions:` declaration with its dotted path, and `widenings`
judges each against `{contents: read}`, so `contents: write`, a second
scope like `packages: write`, and the `read-all`/`write-all` shorthands
all fail with the path and the grant named, at ANY level. A redundant
job-level `contents: read` and an empty `{}` are correctly NOT
widenings. Proven both ways in the drills below.

### Criteria → evidence

**Criterion 1 — top-level `permissions: contents: read`, so the scope
is a repo fact.** The block above is at the workflow's top level (the
parsed document's key order is now `name, permissions, on, concurrency,
jobs`; `permissions` parses to `{"contents":"read"}`). Pinned by the
new test's assertions 1 and 2. Absence drill (below) shows what the
lane says when it is gone.

**Criterion 2 — the parity spec pins it beside the existing
runner/timeout assertions.** New test at workflow-parity.spec.ts:142,
immediately after `ci.yml is valid YAML with the one pinned ubuntu job`
(the runner/timeout test), and it runs in the same no-browser spec:

    ✓  13 [chromium] › tests/workflow-parity.spec.ts:142:1 › GITHUB_TOKEN is least-privilege: `contents: read`, and nothing widens it (2ms)

**Criterion 3 — the rule recorded at the point of temptation.** The
comment above states it in ci.yml itself: a future need is granted at
THAT JOB's scope with its reason beside it, never by widening the
workflow default, and the spec fails loudly on either. The spec's
assertion-3 message repeats the rule, so it survives even if the
comment is ever deleted ("...argue it at that job's scope in ci.yml and
update this spec deliberately").

**Criterion 4 — nothing else moved.** Proven structurally, not by
eyeballing the diff: parse the committed HEAD ci.yml and the edited
one, delete `permissions` from the latter, and deep-compare.

    parses:                  true
    top-level keys BEFORE:   name, on, concurrency, jobs
    top-level keys AFTER:    name, permissions, on, concurrency, jobs
    permissions value:       {"contents":"read"}
    job names:               linux
    step count before/after: 22 / 22
    deepStrictEqual(after minus `permissions`, HEAD version): PASS — nothing else moved
    uses: pins:              actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
                             actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
                             actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9
                             actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9

No step, action SHA, command, working-directory, env, ordering,
trigger, concurrency setting, runner or timeout differs — the only
structural delta in the whole document is the key this task adds. The
four pre-existing parity assertions pass unchanged in every green run.

### Green

`npx playwright test` in tools/e2e — **17 passed (4.5s)**, exit 0,
headless, one worker, retries 0, no skips. That is the branch-point
16 plus this task's one new test; all 16 pre-existing tests pass
untouched (baseline re-derived on this worktree BEFORE any edit:
**16 passed (6.6s)**). `npm run typecheck` → exit 0, no output.

### Mutation drill (the Verification line's requirement) — five shapes

Each mutation was applied to ci.yml, the FULL lane re-run, and the file
restored from a byte-verified pristine copy (sha256
19ed864b7e1e0984e101d7c0e2cf12b358fa1537c6242e92f1c0541f682f5939 before
and after every drill). Every run: exactly one test failed — the new
one — and the other 16 passed, so no drill was caught incidentally by a
pre-existing assertion.

**A. Top-level widened to `contents: write`** → 1 failed, 16 passed,
exit 1:

    Error: the top-level `permissions:` block must be exactly { contents: read }

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 1

      Object {
    -   "contents": "read",
    +   "contents": "write",
      }

**B. JOB-level `permissions: {contents: read, packages: write}`** —
the load-bearing drill, because assertions 1 and 2 both PASS here (the
top-level block is untouched and correct) and only the third catches
it → 1 failed, 16 passed, exit 1:

    Error: a `permissions:` declaration exceeds the workflow's least-privilege default (contents: read) — if the grant is genuinely needed, argue it at that job's scope in ci.yml and update this spec deliberately

    expect(received).toEqual(expected) // deep equality

    - Array []
    + Array [
    +   "jobs.linux.permissions grants packages: write",
    + ]

Note what did NOT fire: the job's redundant `contents: read` is not
reported. The assertion names the widening, not the declaration.

**B2. JOB-level `permissions: contents: write`** → 1 failed, exit 1:

    +   "jobs.linux.permissions grants contents: write",

**B3. STEP-level `permissions: id-token: write`** (on the app-suite
step; Actions would not even honour it, which is exactly why it must
not pass unread) → 1 failed, exit 1:

    +   "jobs.linux.steps[14].permissions grants id-token: write",

**B4/B5. The `write-all` shorthand**, both places → 1 failed each, exit
1. Top level fails assertion 2 ("must be exactly { contents: read }");
at job level, where 1 and 2 pass, assertion 3 catches it:

    +   "jobs.linux.permissions grants the whole-token shorthand `write-all`",

**Revert → green.** Restored from the pristine copy (sha256 match
above) → **17 passed (4.5s)**, exit 0.

### Absence drill

Whole block deleted (`grep -n "^permissions" .github/workflows/ci.yml`
→ nothing) → 1 failed, 16 passed, exit 1. The failure names the actual
consequence rather than the missing key:

    1) [chromium] › tests/workflow-parity.spec.ts:142:1 › GITHUB_TOKEN is least-privilege: `contents: read`, and nothing widens it

      Error: ci.yml declares no top-level `permissions:` block — GITHUB_TOKEN would silently inherit the repository's default workflow-permission setting instead of being a fact in this repo

      expect(received).toBeDefined()

      Received: undefined

Reverted; byte-identical; green.

### YAML validity

The workflow still parses: the spec's own `loadWorkflow()` parses it in
all five parity tests (all green), and the independent parse above
prints the top-level keys, the job map, and 22 steps. The `on:`-parses-
as-YAML-`true` quirk the spec already normalizes is unaffected — the
new key sits between `name:` and `on:` and changes no other node.

### Suites — run, not assumed

- lib/parser `npm test` → **159 passed (10 files)**, exit 0.
- app `npm test` → **398 passed (21 files)**, exit 0.
- app/src-tauri `cargo test` → **129 passed, 0 failed, 2 ignored**,
  exit 0 — summed across all nine `test result:` lines (49 + 0 + 68 +
  3 + 7 + 0 + 2 + 0 + 0), captured in full rather than `tail`ed, the
  truncation trap T-020's notes flag.

All three match the branch-point baselines exactly. Nothing in this
change is reachable from any of them — the numbers are the fence, not
the feature.

### Fence

`git status --porcelain` shows exactly two modified files (plus this
task file at commit time); `git diff --stat`:

    .github/workflows/ci.yml                | 22 ++++++++
    tools/e2e/tests/workflow-parity.spec.ts | 90 +++++++++++++++++++++++++++++++--
    2 files changed, 109 insertions(+), 3 deletions(-)

Zero diff lines under `app/`, `lib/`, `docs/architecture/`, `method/`,
and in every one of the four tracked lockfiles checked individually
(app/package-lock.json, app/src-tauri/Cargo.lock,
lib/parser/package-lock.json, tools/e2e/package-lock.json). No new
dependency, no package.json touched. The drills' gitignored
test-results/ output was removed; the worktree is otherwise clean.

### Constraints held

Headless only — the whole lane is Playwright headless Chromium; no
screenshot, no screen control, no OS input injection, no window opened.
The boot check was NOT run (out of scope, and it spawns a windowed
tauri dev). Nothing bound or contacted 1420: the lane owns 14520 by
construction, and `lsof -nP -iTCP -sTCP:LISTEN` at session start showed
nothing listening on 1420 or 145xx (the human's app was not running;
the lane would have refused it anyway). No real model calls, no GitHub
API calls, no remote created — the workflow stays dormant and unpushed
by design (T-020 §1 tier 3), so this change, like the file it edits,
is honestly unverified against a live runner until the first push. What
IS verified now is the artifact: the scope is declared in the repo, and
the lane fails loudly if anyone widens it.

### Suggestion filed

T-036-s1 — the least-privilege assertions read only ci.yml, so a SECOND
workflow file added later (release.yml, a docs job) would silently
inherit the repository default again with nothing failing. Cheap
generalization: enumerate `.github/workflows/*.y{a,}ml` and apply the
same three assertions to each.

## Verdicts
