---
id: T-237-s3
title: The push guard now READS `.github/workflows/ci.yml` at push time, and the spec that owns that file does not know — a renamed step degrades a refusal's most useful sentence in silence
feature: F-06
milestone: 4
priority: 3
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**A NEW READER OF THE WORKFLOW, AND THE WORKFLOW'S OWN KEEPER HAS NOT
BEEN TOLD.** T-237 made `.claude/hooks/push-guard.mjs` read
`.github/workflows/ci.yml` at push time: `gh` names the step that failed,
and the guard looks that step up in the workflow to answer *"which
package was it testing, and does this push change anything under it"*.
That derivation is deliberate — NEVER TYPE A PATH YOU CAN DERIVE — and it
creates a dependency nothing yet keeps.

The failure mode is the quiet one. Rename a step in `ci.yml` and:

* `workflow-parity.spec.ts` stays green — it pins COMMANDS against
  docs/CONVENTIONS.md, not step NAMES;
* T-237's own spec stays green for three of its four pinned steps;
* and the guard's announcement silently degrades from *"that step runs
  in tools/e2e/, and this push DOES change something under it"* to
  *"that step's package is unknown here"*.

T-237 pins four steps by name against the real workflow, which catches
those four and nothing else. The general property — **every step in
every workflow that declares a `working-directory` names a directory that
exists, and the guard's own scanner can read every one of them** — belongs
beside the workflow's other keepers, not inside a hook's spec.

## Acceptance criteria

- THE workflow spec SHALL enumerate every step in every workflow file
  and, for each that declares a `working-directory`, assert that the
  push guard's own `stepWorkingDirectory` returns exactly that value and
  that the directory exists in the tree.
- THE enumeration SHALL be asserted NON-EMPTY before its zero is
  written down — a scanner that matched no steps would pass the loop
  above by finding nothing (docs/CONVENTIONS.md, A NEGATIVE ASSERTION
  NEEDS A POSITIVE CONTROL, and the census clause).
- A FIXTURE SHALL show the assertion able to fail: a step whose
  `working-directory` names a directory that is not there, and a step
  the scanner cannot read, each reddening by name.
- WHERE the guard's `CI_WORKFLOW_REL_PATH` no longer names a file in the
  tree THE spec SHALL red rather than skip.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-237's merge (44a95c3). The
workflow's keeper does not know the guard reads it; one body in
workflow-parity.spec.ts that renames a step in a fixture copy of ci.yml
and shows the guard's step lookup degrade by name closes it. Fence is one
spec, free now.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

**WHAT WAS WRITTEN, AND WHERE.** One file, the fence:
`tools/e2e/tests/workflow-parity.spec.ts`, +~370 lines at the end plus a
`── WHAT T-237-s3 CHANGED ──` paragraph in the header and two imports
(`existsSync`/`readdirSync`, and `CI_WORKFLOW_REL_PATH` +
`stepWorkingDirectory` from `../../../.claude/hooks/push-guard.mjs` — the
same import `push-guard.spec.ts` already makes). Three exported helpers
and three bodies:

* `workflowFiles()` — every `*.yml`/`*.yaml` under `.github/workflows/`,
  THROWING on an empty enumeration (`readdirSync` throws on a missing
  directory, the same red by another message).
* `stepSites()` — every step of every job as the YAML parser sees it,
  including UNNAMED steps, so the census covers what the guard's scanner
  cannot even be asked about.
* `stepPackageProblems()` — the complaints, taking its files as
  ARGUMENTS so a fixture can feed it a synthetic workflow. Nothing here
  writes to `.github/`, and **no step in the real `ci.yml` was renamed by
  this lane** (proved by hash below).
* `every workflow step's package is readable by the push guard and is in
  the tree` — the live body: the enumeration covers
  `CI_WORKFLOW_REL_PATH` and that path is in the tree; the census is
  asserted non-empty in BOTH categories before its zero; every complaint
  list is `[]`.
* `FIXTURE: renaming a step in a copy of ci.yml degrades the guard's
  lookup BY NAME` — the triage criterion. The step is DERIVED (the first
  named step carrying a `working-directory`), the copy is in memory, the
  unrenamed copy is the control's other half.
* `FIXTURE: an absent package, an unreadable step, an unnamed one and one
  read out of a run block each red BY NAME` — four synthetic shapes, each
  against a readable control built by the same function.

**THE CARD'S CENTRAL PREDICTION IS FALSE AND THE REPOSITORY WON.** The
card says a renamed step degrades the announcement to *"that step's
package is unknown here"*. Read `reachSentence` at
`.claude/hooks/push-guard.mjs`: that string is returned **only** from the
`catch` around `readFileSync`, so it means an unreadable **ci.yml**,
never an unreadable **step**. An unplaceable step reaches
`pkg === undefined` and is announced as *".github/workflows/ci.yml gives
that step no `working-directory`, so it runs at the repository root and
EVERY push reaches it"* — byte-identical to what a genuinely root-running
step gets. **A confident falsehood, not a lost sentence.** So no body
here pins the card's sentence (it could only be green by making ci.yml
unreadable); the bodies pin the COLLAPSE at the guard's own input —
`stepWorkingDirectory` returns one `undefined` for both cases and the
guard has no third value, so nothing downstream can separate them. The
guard-side repair is **T-237-s7** (`status: suggested`, `suggested_by:
executor claude-opus-5@subagent @T-237-s3`, `blocked_by: [T-238]`),
routed rather than built because `.claude/hooks/push-guard.mjs` is
outside this fence and T-238 holds it live.

**FIGURES, each at its ref.** At `80f065c`: **1** workflow file
(`ci.yml`), **26** steps, **20** declaring a `working-directory`, **6**
running at the repository root. Merge forecast `main`(`d2702e4`) x
`80f065c`: `git merge-tree --write-tree` exit **0**, tree
`9d31f10`, **2** paths.

**COMMANDS, in order, each exit read from `$?` unpiped.**

    tools/e2e  npm ci                                         0
    app        npm ci                                         0
    app        npm run build                                  0
    (host)     lsof -nP -iTCP:15237 -sTCP:LISTEN              1  (no rows = free)
    tools/e2e  npm run typecheck                              0
    tools/e2e  npx playwright test tests/workflow-parity      0  20 passed
    lane       git commit                                     0  -> 2474476
    lane       git worktree add --detach <scratch> 2474476    0
    drill      npm ci (tools/e2e)                             0
    drill      playwright workflow-parity (baseline)          0  20 passed
    drill      M1..M7 (first round, at 2474476)               1 each, restored
    lane       git worktree remove --force <scratch>          0
    tools/e2e  npm run typecheck (after the corrections)      0
    tools/e2e  npx playwright test tests/workflow-parity      0  20 passed
    tools/e2e  node scripts/docs-gate.mjs <the new card>      1  FIRES, 1 path
    lane       git commit                                     0  -> 80f065c
    lane       git worktree add --detach <scratch> 80f065c    0
    drill      npm ci (tools/e2e)                             0
    drill      playwright workflow-parity (baseline)          0  20 passed
    drill      M1                                             1  3 killed
    drill      M2                                             1  2 killed
    drill      M2 + tests/push-guard.spec.ts                  0  71 passed (containment)
    drill      M3                                             1  4 killed
    drill      M4                                             1  2 killed
    drill      M5                                             1  1 killed
    drill      M6                                             1  1 killed
    drill      M7                                             1  1 killed
    drill      M8                                             1  1 killed
    drill      playwright workflow-parity (restored)          0  20 passed
    lane       git worktree remove --force <scratch>          0
    lane       gate-run.mjs parser                            0  bodies=363 GREEN
    lane       gate-run.mjs app                               0  bodies=1141 GREEN
    lane       gate-run.mjs rust                              0  bodies=639 targets=18 GREEN
    lane       gate-run.mjs e2e (NPUTER_E2E_PORT=15237)       1  bodies=578 RED, attributed below
    base wt    playwright session-economics AT 47c8845        1  the SAME 2 bodies, without this diff
    lane       git merge-tree --write-tree main HEAD          0  2 paths
    app/src-tauri  cargo run -p nputer-index -- index --check 0  graph CURRENT
    tools/e2e  npm run capabilities:check                     1  STALE, the integrator's

**THE e2e RED IS NOT THIS LANE'S, AND IT IS MEASURED RATHER THAN
ARGUED.** `tests/session-economics.spec.ts:179` and `:365` fail with
*"T-215-s6 holds a worktree on `refs/heads/task/T-215-s6-which-arm-answers-a-card`
and no live card declares that id"*. The T-215-s6 card is **absent** from
this lane's base `47c8845` and from its tip, and **present on `main`**
(`d2702e4`) — a sibling lane armed after this lane was cut, the
machine-scoped-worktree-list joined to a checkout-scoped card set that
`method/lane-protocol.md` rule 4 names. The positive control: a detached
worktree at `47c8845`, **without this lane's diff**, run at
2026-09-02T06:50:24Z on Mac.lan, reds the same two bodies with the same
sentence — 2 failed, 8 passed. 576 of 578 pass at `80f065c`; the two are
the same two.

**DRILLS — eight mutants, one side only, each read back with `git diff`,
each restored with a sha256 that matches the blob.** All at `80f065c` in
a DETACHED scratch worktree removed afterwards; M1–M7 were also run at
`2474476` before the corrections. Kill sets, by body:

| mutant | one side | killed |
|---|---|---|
| M1 `stepWorkingDirectory` returns a constant (decoupled from the workflow) | hook | all three new bodies |
| M2 `docs gate (whole-tree half)`'s keys reordered — YAML fine, scanner blind | ci.yml (DATA) | live body + rename fixture |
| M3 a real step's `working-directory` names a directory not in the tree | ci.yml (DATA) | live body + rename fixture + 2 pre-existing parity bodies |
| M4 `CI_WORKFLOW_REL_PATH` names a file that is not there | hook | live body + rename fixture |
| M5 the in-tree package check dropped | this spec | synthetic fixtures only |
| M6 the lookup made lenient (`startsWith` instead of `===`) | hook | rename fixture only |
| M7 the enumeration matches no file | this spec | live body only |
| M8 the comparison made one-directional (declares-none never checked) | this spec | synthetic fixtures only |

No kill set among the three new bodies contains another: M7 separates the
live body, M6 the rename fixture, M5/M8 the synthetic fixtures.
**AND THE CONTAINMENT THAT MATTERED IS AGAINST THE OTHER SPEC**: under
M2, `tests/push-guard.spec.ts` is **71 passed, exit 0** — its
*"a failing step's package is READ out of the workflow"* body pins four
step names and `docs gate (whole-tree half)` is not one of them, so this
keeper kills something the guard's own spec does not.

Restoration proofs (sha256 blob = worktree, at `80f065c`):
`.claude/hooks/push-guard.mjs`
`dcf7adb1557648ad7430e15ca863645d95e13af110ca40c8fd04886da68c2a3e`;
`.github/workflows/ci.yml`
`ff9ca58d645f7b13e3cf7231e19866a8c9c75c1f524b3c18b1f7d2bcf9195dc1`;
`tools/e2e/tests/workflow-parity.spec.ts`
`9f42f7c8ca3d925f3cf3a6b21b3a76d961c01ac28cbc223207e3fa71fc1cda09`.
The same three hashes hold in THIS lane against its own tip, which is the
proof that the real `ci.yml` was never renamed here.

**GATES, derived on the merge forecast rather than on the tip.**
GRAPH REGEN **FIRES** (`tools/e2e/tests/workflow-parity.spec.ts` is a
`.ts` outside `docs/`) and is satisfied: `index --check` answers CURRENT,
exit 0 — `tools/` is outside the graph walk, so the graph did not move.
BOOT GATE **NOT OWED** (no `app/src-tauri/**`, no `app/src/**`, neither
manifest). DOCS GATE **FIRES** — `docs/tasks/T-237-s7-*.md` is a code
input to the app, e2e and parser suites, and this notes commit adds this
card as a second such path without moving the answer; all three suites
were run. METHOD EVAL GATE **NOT OWED** (no `method/**`). The
CAPABILITIES census is **STALE at this tip** — 48201 committed against
48479 fresh, the three new test names — and its regeneration is the
integrator's, in the merge commit.

**FOR THE VERIFIER.** The EXCEPTIONS table the card's triage names is
**not in this file**: it lives in `tools/e2e/tests/workflow-permissions.spec.ts`
line 62, empty, and that path is OUTSIDE this lane's one-path fence. It
was neither read into nor edited by this lane, and it stays empty. The
card's fourth criterion (*"WHERE `CI_WORKFLOW_REL_PATH` no longer names a
file THE spec SHALL red rather than skip"*) is demonstrated by M4. The
card's third criterion asks for two shapes; four are built, the fourth
being the direction none of the others reach — the scanner reading a
`working-directory` the YAML parser does not, out of a `run: |` block.
