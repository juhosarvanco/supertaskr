---
id: T-237-s3
title: The push guard now READS `.github/workflows/ci.yml` at push time, and the spec that owns that file does not know — a renamed step degrades a refusal's most useful sentence in silence
feature: F-06
milestone: 4
priority: 3
size: S
status: done
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### Addendum — the e2e red, re-measured at the tip and at the base

The e2e leg was run twice, and **the red GREW between the two runs while
this lane's diff did not move** — which is itself the finding. At
`80f065c` it was **2 failed / 576 passed**; at the tip `3001130`, twenty
minutes later, **6 failed / 572 passed**. The four that joined are
`card-preflight.spec.ts:719`, `checkout-currency.spec.ts:852` and `:953`,
and `lane-lock.spec.ts:899` — docs/STATE.md's `guard-surface-behind`
hazard, exactly four bodies, on a lane cut before the guard that owns
them merged.

**MEASURED, NOT ARGUED.** A detached worktree at this lane's base
`47c8845` — **without this lane's diff** — run at 2026-09-02T07:03:29Z on
Mac.lan, reds **the same six bodies by name**: 6 failed, 86 passed. The
cause is machine-scoped and moved under both runs: `git worktree list`
read at 06:50:07Z named four task branches, at 07:05:11Z it named five,
with `T-215-s6` (no card at this base), `T-230-s7` and `T-237-s2` arriving
after this lane was cut, and the assembler's own disclosure naming a
`T-133` lane fenced on all of `tools/e2e` — so every older lane's fence
now reads as non-disjoint. That is `method/lane-protocol.md` rule 4's
named class: a MACHINE-scoped list joined to a CHECKOUT-scoped one,
reddening every older lane the moment a newer lane is cut.

**Nothing in this lane's fence can move any of the six**, and
`workflow-parity.spec.ts` is green in every run: 20 of 20, at `2474476`,
at `80f065c` and at `3001130`.

**This addendum is the lane's last commit and it changes one path
already counted in the merge forecast** (`docs/tasks/T-237-s3-*.md`), so
no gate answer above moves: the forecast is still `git merge-tree
--write-tree main HEAD` exit **0**, **3** paths, against `main` at
`d2702e4`.

## VERDICT — APPROVED at `908a051`, 2026-09-02, blind verifier claude-opus-5@subagent

Bench `/Users/ujju/Projects/nputer-V-T-237-s3`, cut at this lane's BASE
`47c8845` alongside the lane rather than after it (orchestrator 5c).
Phase 1 sealed at **2026-09-02T06:26:39Z**, before this diff existed:

    attack-V-T-237-s3.md  6e3ff7a48c869a1f7e6db41ad93b3a99a9f346ac305795417ab3ffb3776337f5
    ground-V-T-237-s3.md  31e5531d0ff067cc0f041ee695c0d2a1002f40b97894fda9d43463d1ca73fbaf
    stamps-V-T-237-s3.txt 08e2f6be43f5dfa19133f5a17dd9d3a313cf301bbbd46e4b1346580b2c512ece

**MY BLINDNESS WAS DISCIPLINE-SHAPED, NOT CLOCK-SHAPED, AND I SAY SO
BECAUSE ONLY ONE OF THE TWO WAS GUARANTEED.** I first wrote CLOCK in the
seal and caught it by measuring rather than asserting: this bench's
`.git` is `gitdir: …/nputer/.git/worktrees/nputer-V-T-237-s3`, a LINKED
WORKTREE sharing the integration checkout's object store, so
`git rev-parse --verify task/T-237-s3-workflow-keeper-knows-the-guard`
resolved throughout phase 1 and no fetch was ever needed. Nothing
structural stopped me reading this diff; I did not read it because the
brief forbade it. I ran that rev-parse with its output suppressed, so I
learned that the ref resolves and deliberately not to what. One
incidental disclosure, recorded rather than omitted: an opening
`git worktree list` printed the lane's line, so I learned that at that
instant the lane's checkout sat at the base — no content, not sought.

**AND THE PHASE-2 DISPATCH CARRIED THE EXECUTOR'S REPORT** — body
counts, mutant counts, kill-set claims, suite figures. Phase 1 was
already sealed and hashed when it arrived, so the line held; but
verifier.md requires me to say it travelled rather than pretend
otherwise. **Every figure below is my own measurement in my own bench.**
Where the executor's numbers and mine agree, they agree because I
re-derived them, not because I accepted them.

### What the diff is, and the fence

`git diff --name-only 47c8845..908a051` names THREE paths, and all three
are legal. `tools/e2e/tests/workflow-parity.spec.ts` is the fence. The
other two are under `docs/tasks/`, which is `UNFENCEABLE_PATHS` —
measured, not assumed: `lib/parser/src/fence.ts` freezes it to exactly
`['docs/tasks']`, `lane-protocol.md` rules that a lane writing to its own
card is not a breach, and `executor.md` directs a finding to be filed as
a `status: suggested` task and let go, which is what `T-237-s7` is.
**No dependency, no lockfile, no manifest moved.**

`.github/workflows/ci.yml`, `.claude/hooks/push-guard.mjs` and
`tools/e2e/tests/workflow-permissions.spec.ts` are byte-identical to my
sealed base hashes at this tip — `ff9ca58d…`, `dcf7adb1…`, `3bd12a4c…`.
**No real step was renamed and the EXCEPTIONS table is untouched and
still empty.** No `gh`, no `spawnSync`, no `execFileSync`, no
`pathsSince`, no network and no disk write appears in the added code:
the synthetic fixtures live in memory and their `rel` is a path never
written. Verified by grep over the added lines and by the specs running
green with nothing on `PATH` to answer as `gh`.

### The criteria, each attacked

**1 — every step of every workflow file, scanner against YAML, plus the
directory exists.** The expectation comes from a real `parse()` and the
answer from the guard's own imported `stepWorkingDirectory`. That
independence is the whole card, so I attacked it directly with a code
mutant (**C4**) that re-derived `stepSites`' `dir` from
`stepWorkingDirectory` itself. Under C4 the three data mutants that had
been killing the live body **all went green** — which is the proof that
they were measuring the independence and not an accident.

**2 — non-empty before the zero.** Three floors, all over YAML-derived
sites, plus `workflowFiles()` throwing on an empty enumeration.

**3 — a fixture showing the assertion able to fail.** Four shapes, each
against a control built by the same function one edit away.

**4 — a missing `CI_WORKFLOW_REL_PATH` reds rather than skips.** Moved
`ci.yml` aside: **exit 1, ZERO skips**, and the message names the
directory and says why an empty enumeration is a failure.

### The drill — eleven mutants of my own, each landing read from `git diff`

Against `tests/workflow-parity.spec.ts` at `908a051` (baseline 20 green):

| mutant | site | result |
|---|---|---|
| reorder keys on `docs gate (whole-tree half)` | ci.yml, DATA | 18 — live + rename bodies die |
| reorder keys on `e2e lane` | ci.yml, DATA | 18 |
| `working-directory: tools/nope` | ci.yml, DATA | 16 |
| flow-mapping step | ci.yml, DATA | 18 |
| folded block-scalar `name: >-` | ci.yml, DATA | 18 |
| strip every `working-directory:` | ci.yml, DATA | 15 |
| move `ci.yml` aside | tree, DATA | 12, no skips |
| plant a second `.yaml` with an absent package | tree, DATA | **19 — live body ONLY** |
| guard: match step name by PREFIX | push-guard.mjs, CODE | **19 — rename body ONLY** |
| guard: unfound name falls back to first `working-directory` | push-guard.mjs, CODE | 18 |
| spec: drop the `existsSync` half | spec, CODE | **19 — synthetic body ONLY** |
| rename a real step (`e2e lane`; `docs gate …`) | ci.yml, DATA | 20 — SURVIVES, correctly |

**KILL-SET CONTAINMENT, THREE WAYS, AND NONE CONTAINS ANOTHER.** The
second workflow file kills only *"every workflow step's package is
readable…"*; the prefix-matching guard mutant kills only *"FIXTURE:
renaming a step…"*; dropping `existsSync` kills only *"FIXTURE: an absent
package…"*. Each of the three new bodies has a mutant that kills it and
spares the other two, so none is a restatement of another. Two of those
three separators are CODE mutants aimed at the site the property lives —
one inside the guard's own name matching — and the guard mutants were
confirmed to land by asserting a unique pattern match before the write,
because `--numstat` reads `1 1` on a one-for-one swap and cannot tell a
landing from a miss.

**CONTAINMENT AGAINST THE BODY THAT ALREADY EXISTED, which was my sealed
most-likely REJECT.** `push-guard.spec.ts`'s *"a failing step's package
is READ out of the workflow, in this repository and in a fixture"* pins
four step names. Reordering the keys on `docs gate (whole-tree half)` —
a step it does NOT pin — reds this keeper while **`push-guard.spec.ts`
stays at 71 passed, exit 0**. Reordering them on `e2e lane` — pinned by
both — reds both. **So this keeper kills what the guard's own spec
cannot, and the card bought a property rather than a restatement.**

**A PRE-COMMITMENT I MADE BEFORE THE DIFF AND AM NOW WITHDRAWING, IN
PUBLIC.** My sealed attack A3 required the LIVE body to red when a real
step is renamed in `ci.yml`, and it does not — 20 green under both
renames I tried. Measured against the criteria, my demand was wrong, not
the lane: a rename moves the YAML key and the scanner's lookup together,
the map stays complete, and requiring a red would ban renaming any CI
step forever. The transient degradation is un-keepable statically — `gh`
reports the name from the run that ALREADY RAN — and the fixture body
demonstrates it mechanically on an in-memory copy, which is what the
triage asked for. **A verifier who quietly drops a pre-commitment is
doing the thing this method exists to prevent, so it is withdrawn with
its reasoning rather than deleted.**

### The card's own prediction was false, and I found that in phase 1

My sealed `ground-V-T-237-s3.md` records, at `47c8845` and before this
diff existed, that driving the exported `ciVerdict` with a shimmed `gh`
against the real workflow yields for an unplaceable step *"gives that
step no `working-directory`, so it runs at the repository root and EVERY
push reaches it"* — byte-identical to what a genuinely root-running step
gets. The card's *"that step's package is unknown here"* is the
`readFileSync` catch and means an unreadable FILE, never an unreadable
STEP. **A confident falsehood, not a lost sentence.** The seat and I
reached that independently and it is the same finding.

I pre-committed to rejecting any body that PINNED the card's sentence,
because such a body could only be green by making `ci.yml` unreadable.
**No body pins it.** The lane pins the collapse at the guard's own input
and routes the repair as `T-237-s7`, which is the correct move under a
one-path fence.

### Gates, at `908a051`

`npm run typecheck` **0** · `npm run lint:docs` **0** (whole-tree half, 0
findings) · `npm run lint:tokens` **0** clean ·
`cargo run -p nputer-index -- index --check --root ../..` **0**, graph
CURRENT · `git merge-tree --write-tree main 908a051` **0** against `main`
as it stood when I measured, and `main`'s `push-guard.mjs` still exports
both symbols this keeper imports while its `ci.yml` is identical, so the
merge is forward-compatible.

`npm run capabilities:check` is **1 STALE** — and that is NOT a defect.
I regenerated in my bench and restored: the delta is exactly the three
new test names, `575` behaviours to `578`, with no existing name moved.
CONVENTIONS makes that regeneration the INTEGRATOR'S, in the merge
commit, and T-210 leaves the file read-only inside a lane's fence.

### The e2e red is not this lane's, and I attributed it myself

The lane leg at this tip is **6 failed / 572 passed**. I then ran the
four spec files those six live in **at this lane's base `47c8845`, with
`T-237-s7`'s card absent, on the same machine minutes later**: the
**same six bodies by name**, 6 failed / 86 passed, against 6 failed / 86
passed at the tip. My own earlier base run was 575 green, so the cause
moved under the machine and not under the diff — docs/STATE.md's
`guard-surface-behind` family plus session-economics ref skew, exactly
the class STATE warns this seat about misattributing.
`workflow-parity.spec.ts` is green in every run I made.

### Security sweep

No new dependency, no secret, no key, no credential. The one new input
path reads `.github/workflows/*` with `readdirSync`/`readFileSync` and
the `yaml` parser this spec already used; workflow content reaches only
assertion messages, never a shell, a path that is written, or a spawned
process. **Nothing found at REJECTED level.**

Two observations I judged BELOW the bar for a card and that block
nothing: `existsSync` on a `working-directory` tolerates a traversing
value, and the guard answers the first match when two steps share a name
— both would break CI itself long before they reached this keeper.

### Verdict

**APPROVED.** The keeper derives its expectation independently of the
thing it judges, discriminates on eleven mutants, is mutually
non-contained with both of its siblings and with the guard's own spec,
reds rather than skips on the criterion the card cared most about, stays
inside a one-path fence, and corrects the card that commissioned it
instead of pinning its mistake.
