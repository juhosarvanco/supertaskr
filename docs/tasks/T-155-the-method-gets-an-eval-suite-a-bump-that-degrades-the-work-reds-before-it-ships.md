---
id: T-155
title: The method gets an eval suite — a version bump that degrades the work reds before it ships, the way a code change already does
feature: F-01
milestone: 4
priority: 32
size: L
status: verifying
blocked_by: []
touches: [tools/method-evals, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 2, and `T-093-s1`'s class ("the hand rules have no
mechanical reader") given the playbook's mechanism: the method files —
roles, lane protocol, docs protocol, brief assembly — are byte-pinned
into the kit but never TESTED FOR EFFECT. A rewrite of `executor.md`
or a model swap changes what sessions produce, and nothing reds.
T-148 already measured brief sizes moving under a role-file edit;
this card makes that class of measurement a gate.

## The shape (small first, honest about cost)

1. Five to ten CANNED TASKS with derived acceptance checks — e.g.: a
   fixture card dispatched headless against the current method
   produces notes in the card's own sections; a verifier run on a
   planted-defect fixture produces a REJECT with the defect named; a
   brief assembled at a fixture ref carries every row the contract
   requires (this one is pure `dispatch-brief.mjs`, no model call).
2. Split MODEL-FREE evals (brief assembly, fence expansion, kit
   materialization — cheap, run in CI) from MODEL-IN-LOOP evals
   (headless role runs — expensive and nondeterministic; run at
   method version bumps and on schedule, never per-commit; pass-rate
   threshold, not single-run pass/fail).
3. A method version bump's three-file commit gains a fourth
   obligation: the eval suite ran and its result is recorded in the
   bump's own commit message.
4. Every method-process incident becomes a candidate eval, the way
   every code incident already becomes a pin. The founding corpus is
   the best-attested failure class on record — "a query that runs
   clean and answers a different question" — with FOUR stamped
   instances across three hands in one week: the architect's
   `git log -15 -- <path>` cap-after-filter and its unlabeled-KiB
   review divisor, this session's stale figure transcribed hours
   after measuring the fresh one, and an external review's
   Unix-convention claim that `diff(1)` refutes. Review-claim
   verification is therefore an eval fixture family of its own, and
   verifier CALIBRATION (false-rejection vs missed-defect rates, at
   ~1.2M tokens per rejection) is in scope.

## Token economics (ADR-020 + the session-economics comparison)

Model-in-loop evals are the method's most token-expensive machinery,
so the economics are design inputs, not afterthoughts: each eval
declares the CHEAPEST model that discriminates (a `model:` line per
eval, never the session default); output runs quiet (dot-reporters,
bounded logs); and tokens-per-eval-run is recorded so the suite's own
cost has a band from day one. An eval suite nobody can afford to run
is a ritual with extra steps.

## Acceptance criteria

- WHEN any method file changes THE model-free eval set SHALL run and
  red on a contract the change breaks.
- WHEN a method version bump is prepared THE model-in-loop set SHALL
  have a recorded run against the new method text, with its pass rate
  in the bump commit.
- IF an eval cannot run THEN it SHALL say so loudly with the house
  exit codes — a skipped gate is news, never silence.

## Implementation notes

Built at base `78aabe5` in lane `task/T-155-method-evals`. Every figure
below was derived in that worktree; nothing is transcribed from the
brief.

### What landed

`tools/method-evals/` — a zero-dependency Node suite, invoked
`node tools/method-evals/run.mjs` from the repo root, plus two bullets in
docs/CONVENTIONS.md (the METHOD EVAL GATE, and the version bump's fourth
obligation inside the existing three-file gotcha).

**TEN CANNED TASKS, six model-free and four model-in-loop** — the card
asked for five to ten. Each is one module under `evals/` exporting a
descriptor with an `id`, the `contract` it holds, the paths it `reads`,
a `check()` and a `degrade()`.

- `MF-01` assembles a brief at a FIXTURE REF and requires every contract
  row to be derived. This is §1's third canned task verbatim. It
  materializes a throwaway root — live `method/`, live governing docs,
  live adapters, ONE synthetic card, `git init -b main` and a
  `Checkpoint:` commit because the base rule refuses to substitute — so
  the live board (derive its size with `brief.mjs --state`) cannot red it
  for somebody else's typo.
- `MF-02` resolves every numbered-rule citation in `method/` against the
  file it names. 11 citations examined at this tip.
- `MF-03` checks all five role files open with `# Role: <name>` matching
  the filename plus a one-line summary — the two lines row 1 reads.
- `MF-04` resolves every method-internal path reference. 13 distinct
  targets at this tip.
- `MF-05` compares `method/tasks/TASK-FORMAT.md`'s statuses, sizes and
  review modes against `lib/parser/src/types.ts`. 3 vocabularies.
- `MF-06` re-runs the review-claim corpus's own derivations.
- `MIL-01`/`MIL-03` are the verifier calibration PAIR — planted defect
  and clean twin, one test body apart. `MIL-02` is §1's first canned
  task (notes in the card's own sections). `MIL-04` is the review-claim
  family's model half.

**THE FOUNDING CORPUS** (`fixtures/review-claims.mjs`) holds four claims,
each with an EXECUTABLE derivation and a recorded verdict, and NO
transcribed figure: `RC-01` the `git log -N -- <path>` cap, `RC-02` the
KiB/byte divisor, `RC-03` `diff(1)`'s exit codes, `RC-04` a figure
derived at one ref against another. `MF-06` is the corpus checking itself
before it is used to check anything; the shape refuses to rot the way
`T-108`'s three citations did.

**TOKEN ECONOMICS.** Every model-in-loop eval declares a `model:` in
`nputer.yaml`'s own CLI vocabulary (never a session default), a `runs`
count and a `threshold`, and `check()` reads `this.runs`/`this.threshold`
so the declaration and the use cannot drift. `drive()` sums a `tokens:`
line off the runner's stderr and every result line prints the per-run
cost; unreported is printed as UNKNOWN, never as zero. **Every threshold
and every `model:` is a DECLARED FLOOR, not a measured rate** — no
calibration run has happened, `--list` says so in as many words, and
presenting one as an observation would be the failure class the corpus
collects.

### The acceptance criteria

1. *"WHEN any method file changes THE model-free eval set SHALL run and
   red on a contract the change breaks."* **PARTLY MET, and the unmet
   half is routed rather than omitted.** The set runs and reds — proved
   twice, by `--selftest --set all` (10 of 10 degradations detected, 6 of
   them model-free) and by a committed one-sided drill below. The
   SHALL-RUN half is a written gate with no
   automated trigger: `.github/workflows/ci.yml` and
   `tools/e2e/tests/workflow-parity.spec.ts` are both outside the fence,
   and `deriveExpectedSteps`' `DOC_DIRS` pins exactly four `run from`
   bullets so a fifth reds the lane. Routed as `T-155-s1`, and
   CONVENTIONS' new bullet states the limitation in place rather than
   implying CI holds it.
2. *"WHEN a method version bump is prepared THE model-in-loop set SHALL
   have a recorded run against the new method text, with its pass rate in
   the bump commit."* **MET.** `run.mjs --bump` runs both sets and prints
   the block for the bump's commit message, naming the RUNNER; the
   obligation is written into the three-file gotcha, which is the
   paragraph a bump's author already reads. It is deliberately not a
   fourth FILE — a file would go stale between bump and merge and become
   a figure with no keeper.
3. *"IF an eval cannot run THEN it SHALL say so loudly with the house
   exit codes."* **MET.** `--set model-in-loop` with no
   `NPUTER_EVAL_RUNNER` exits **3**, names the variable, and lists each
   eval not attempted with its price. The codes are the house four,
   owned by the frozen `EXIT` in `lib/exit.mjs` and imported rather than
   re-typed. All four were produced deliberately: 0, 1, 2 (`--nope` and
   `--set bogus`), 3.

### The drill (POISON DRILL, at a commit, one side only)

The suite's OWN positive control is `--selftest`: each eval degrades its
contract on a copy and must detect it. **It caught a real defect while
being written** — `MF-04`'s bare-file allowlist silently skipped a
RENAMED root file, so the eval would have passed a dangling
`../lane-protocols.md` forever. Fixed in place, with the reason in the
code.

Beyond that, a committed one-sided drill at `e08c6c8`. `RC-01`'s
RECORDED verdict was flipped `REFUTED` -> `CONFIRMED` in the working
tree — the derivation untouched, so nothing moved on both sides — and
the mutation was read back with `git diff -U0` before anything ran.
`node tools/method-evals/run.mjs` then went **1 of 6 FAILED at exit 1**,
naming MF-06 and quoting RC-01's re-derivation. Restored with
`git checkout --`, proved twice: an EMPTY `git diff -- <path>` (0 bytes)
and `git show HEAD:<path> | shasum -a 256` equal to the working file's
at `df724cd7…`. Green again at exit 0, 6 of 6. The drill ran AFTER the
commit, so a restore cannot be mistaken for a revert.

**The drill's own output is a worked RC-04.** At the base the derivation
reported 56 commits touching docs/CONVENTIONS.md; at `e08c6c8` it
reported 57, because this lane's commit is one of them. Same file, same
question, two answers — which is the claim RC-04 records, produced by
the suite while proving something else.

### For the verifier

- **Ask `--selftest` first.** A green `check()` set and a red
  `--selftest` would mean the checks cannot fail, which is the worse
  finding.
- **The replay runner is a fixture, not a model.** Its pass rate is 1.00
  by construction; that is why `drive()` echoes the runner into every
  result line and `--bump` prints it. A rate quoted without its runner is
  not a rate.
- **The honest limit is written on `MIL-04`**: a seat that has seen this
  repository can produce RC-01's figures without deriving them, and the
  acceptance check cannot tell those apart. Stated in the module rather
  than left to be found.
- `MF-01` shells out to `tools/e2e/scripts/brief.mjs`, which is outside
  the fence and is READ, never written.

### Where the brief was wrong

- **The two incidents the integrator named as living under
  docs/checkpoints/ are not there.** The doc-size table (86.4 against
  107.7) and the unlabeled-KiB divisor return zero hits across `docs/`
  and `method/` at this base; the only record of the KiB instance is
  THIS card's own §4. What the checkpoints DO carry, stamped as eval
  material, is a different set, and the corpus was built from those and
  from the card rather than from the brief's sentence. Routed as
  `T-155-s5`.
- **The brief's STEP 0 named docs/ROADMAP.md in the read-first set;
  `method/roles/executor.md` step 1 forbids this seat to read it.** The
  repository wins, so ROADMAP was not read. The conflict is real and
  reaches every executor brief this repository assembles — routed as
  `T-155-s4` rather than decided here.
- `brief.mjs --task T-155` reports the base commit as `3ff7f30` (the
  newest `Checkpoint:`); this lane was actually cut at `78aabe5`, three
  docs-only non-merge commits later. CONVENTIONS' own DISPATCH FROM THE
  LAST CHECKPOINT bullet permits exactly that and says the tool leaves it
  alone; noted so the difference is not read as a lapse.

### Routed, not built

`T-155-s1` (CI wiring — three files, two packages), `T-155-s2` (the
suite is outside the TOKEN corpus and outside every typechecked
program), `T-155-s3` (ARCHITECTURE's code-layout bullet does not name the
new tree), `T-155-s4` (the ROADMAP contradiction), `T-155-s5` (the
founding class's four instances have one file that remembers them).

**REFUSED IN WRITING, so the next reader inherits the decision.** A
seventh model-free eval comparing the three method-version stamps was
considered and NOT built: `snapshot_version_matches_the_live_method_stamps`
in `app/src-tauri/src/agent/kit.rs` already holds that property off disk
on every `cargo test`, and a second implementation of one rule is two
chances to disagree (T-057). The cost argument for a cheap toolchain-free
copy is real but does not outweigh it, because a method bump moves
CONVENTIONS' stamp and CONVENTIONS is a `cargo test` reader — so the
existing pin is already owed at exactly the moment the check would fire.

## Verdicts

### T-155 VERDICT: APPROVED WITH ASSIGNED CORRECTIONS — verifier claude-opus-5@subagent, 2026-08-29. Every model-free eval reds under a mutant I planted myself, and three of the four acceptance functions that will price a real calibration run do not discriminate the failures they will meet

**Verified in the lane worktree at `0712ca3735c01d956a3147ee4ae0e5f53d24c323`
(`task/T-155-method-evals`), base `78aabe5`.** Main was at `8f7b58c` when
this verification opened and had advanced to `40d03b7` when it closed;
nothing here is a range claim, so neither moves a figure below. Every
number in this verdict was derived by this seat, in this worktree or in a
detached drill cut from this tip, and none is transcribed from the notes.

**Two-phase blindness held.** The card was read down to its acceptance
criteria and no further; the diff was read with `docs/tasks/**` excluded;
the attack set was written to scratch before the implementation notes,
the suggestion cards or the executor's report were opened. The report sat
in the dispatch text below its marker throughout and was not consulted
until the set was on disk. Phase two EXTENDED the set and removed nothing
from it.

### The battery, exits unpiped, all at `0712ca3`

| suite | figure | exit |
|---|---|---|
| `cargo test` from app/src-tauri | 518 passed, 0 failed, 4 ignored over 18 result lines | 0 |
| the cargo cache cliff | lib suite `finished in 4.13s` against a 2.8 GiB `target/` | green band |
| `npx vitest run` from lib/parser | 314 passed, 15 files | 0 |
| `npm test` from app/ | 1013 passed, 47 files | 0 |
| `npm test` from tools/e2e | 258 passed, 26 files, `NPUTER_E2E_PORT=15155` | 0 |
| `npm run lint:tokens -- --selftest` | — | 0 |
| `npm run lint:tokens` | TOKEN 146 files, CONTROL 832 tracked text files | 0 |
| `npm run lint:docs` | — | 0 |
| `npm run typecheck` from tools/e2e | — | 0 |
| `index --check --root ../..` | CURRENT, 1020023 bytes, 189 files, 2152 symbols, 2111 edges, 19977 left | 0 |
| `npm run capabilities:check` | — | 0 |

`startup_arm_watches_the_initial_root` and every `a_hostile_session_id`
body passed on the run above; no intermittent was seen and none was
attributed.

**THE PORT VARIABLE, DERIVED FROM THE CODE AND NOT FROM A REPORT.** The
one that binds is `NPUTER_E2E_PORT`, read by `resolveLanePort` in
`tools/e2e/preflight.ts` — default 14520, a throw on 1420, and
`playwright.config.ts` takes its `port` from that call alone.
`NPUTER_BOOT_PORT` belongs to `boot:check` and reaches no lane test.
`lsof -nP -iTCP:15155 -sTCP:LISTEN` returned ZERO ROWS immediately before
binding.

**AND THE 258/259 SPLIT IS A CLAIM ABOUT REPORTS, NOT ABOUT A BODY.** No
test in the lane is env-gated. The only environment reads in `tests/` are
`NPUTER_RANGE_RULE_ROOT`, which moves the ROOT `range-rule.spec.ts` reads
and never the set of tests, and `TEST_WORKER_INDEX`, which skips
preconditions. Every top-level `for` that REGISTERS tests iterates a
hard-coded literal — `["Enter","Space"]` twice, `CHECK_IDS` (a static
exported list in `scripts/range-rule.mjs`), `VIEWPORTS`, and a literal
size pair. Measured: `--list` answers `Total: 258 tests in 26 files` both
with those variables set and with them unset, and the real run agreed at
258. `git diff --stat 78aabe5 8f7b58c -- tools/e2e/tests` and
`git diff --stat 78aabe5 0712ca3 -- tools/e2e` are both EMPTY, so the
count is the same function of the same source at all three refs. A 259
was therefore measured against some other tree or miscounted; it cannot
be produced at this base by any spelling of any variable.

### The suite's own exit matrix, produced deliberately

| invocation | observed |
|---|---|
| `node tools/method-evals/run.mjs` | `......  6 model-free eval(s)`, exit 0 |
| `--selftest --set all` | `..........  10 all eval(s), POSITIVE CONTROL`, exit 0 |
| `--set model-in-loop`, `NPUTER_EVAL_RUNNER` unset | exit 3, names the variable and all four unattempted evals with model, runs and threshold |
| `--set model-in-loop` with the replay runner | exit 0, four rates of 1.00, each line echoing the runner path |
| `--nope` | exit 2 |
| `--set bogus` | exit 2 |
| `--set` with no value | exit 2 |
| `--list` | exit 0, and it says the thresholds are declared floors |
| `--bump` with no runner | exit 3, and the block SAYS the loop set did not run |
| `--bump` with the replay runner | exit 0, `Runner:` line carrying the replay path |
| a runner that exits non-zero | exit 3, one CANNOT_RUN line per eval, never a failing rate |

Criterion 3 is met by the third and the last of those rows. Criterion 2
is met: `--bump` runs both sets and prints a block naming the runner, and
the obligation is written into the gotcha a bump's author already reads.
Criterion 1 is met at the SET level and its SHALL-RUN half is routed —
see the CONVENTIONS section below, where I proved the routing's premise
rather than accepting it.

### Guard testing: nine mutants of my own, in a detached drill

Cut with `git worktree add --detach /Users/ujju/Projects/nputer-dr-T155v
0712ca3` — a short root with a stem derived from the lane, disposed at
the end, and no `cargo` run inside it, so no target directory entered the
graph walk. Every mutation was read back with `git diff -U0` before
anything ran, and every restoration is proved below.

| # | mutant | eval | result |
|---|---|---|---|
| M1 | `interview/plan-interview.md` renamed in the CITING file, planner.md, 2 sites | MF-04 | exit 1, 2 findings naming `method/interview/plan-interviews.md` |
| M2 | a PREFIXED dangling root reference, `../lane-protocolz.md` | MF-04 | exit 1, 2 findings naming it |
| M3 | a BARE dangling root reference, `` `lane-protocolz.md` `` with no prefix | MF-04 | **exit 0, SILENT — 13 references, all resolving** |
| M4 | `git mv method/lane-protocol.md method/lane-protocolz.md`, the real rename | MF-04 | exit 1, 12 findings across executor.md, integrator.md and TASK-FORMAT.md |
| M5 | a rule citation repointed to another file that HAS that ordinal | MF-02 | exit 0 — its contract is existence, and it says so |
| M5b | the same citation repointed to `../roles/verifier.md rule 12` | MF-02 | exit 1, naming the file, the ordinal and the rules it does have |
| M6 | RC-03's recorded verdict flipped REFUTED to CONFIRMED | MF-06 | exit 1, quoting the whole re-derivation back |
| M7 | integrator.md headed `# Role: verifier` | MF-03 | exit 1, naming both the file and the role a brief would print |
| M8 | `"closed"` added to `TASK_STATUSES` in the PARSER, not the method | MF-05 | exit 1, naming the side that has it |
| M9 | contract row 8 DELETED from the role table | MF-01 | exit 1 through the assembler's own exit 3, quoting `row 8 reads "9"` |

M8 and M9 are the arms the shipped `degrade()` does not exercise: MF-05's
control moves the method side, and MF-01's adds a row rather than
removing one. Both fire, so neither eval is one-directional.

**RESTORATIONS PROVEN.** After M6, `git diff --stat` was empty over
`tools/method-evals/fixtures/review-claims.mjs` and
`git show HEAD:tools/method-evals/fixtures/review-claims.mjs | shasum -a 256`
equalled the working file at
`df724cd76f9d011bb7ed809b0905fb53a64bb32678e54cd3a62b16c9c9513761`.
`method/roles/planner.md` restored to
`1af76b6cbe0ece5ab7a0ad990f62c8541bfa8590b3bb296fedea584ba6ff7891` and
`method/roles/executor.md` to
`958447bdffec31351c4c69ad0cca486d114498355faf986ffe717a665fa1a028`, each
against `git show HEAD:` with an empty diff beside it. The drill was
removed and `git worktree list` no longer carries it. No graph was
regenerated at any point.

### The founding corpus, hand-derived at this tip

Two derivations were re-run BY HAND rather than read out of the fixture,
because the corpus's claim is that it transcribes no figure.

- **RC-01.** `git log --format=%H -- docs/CONVENTIONS.md | wc -l` returns
  **57**; the `-5` form returns **5**; and
  `diff <(git log --format=%H -5 -- docs/CONVENTIONS.md) <(git log --format=%H -- docs/CONVENTIONS.md | head -5)`
  exits **0**, so the cap really is applied after the path filter and it
  really does truncate. The fixture's own evidence line prints the same
  57 and 5.
- **RC-04.** `git cat-file -s <newest>:docs/CONVENTIONS.md` is **115671**
  at `e08c6c8fdce4` and **674** at `1e757b6caf6a`, the oldest commit
  touching the file. The fixture prints the same pair.

`wc -c docs/CONVENTIONS.md` is **115671** at this tip, which agrees with
RC-04's newest figure and is the same number RC-02 renders as 113.0 KiB.

### The CONVENTIONS edits

- **`brief.mjs` row 8 enumerates the gate.** At `0712ca3` the assembled
  brief prints `METHOD EVAL GATE fires at any merge whose diff touches
  method/**`, marked as taken from the gate bullet verbatim, beside GRAPH
  REGEN, BOOT GATE and the DOCS GATE. The bullet's one tripwire is real.
- **`workflow-parity.spec.ts` is green with the bullet as written** —
  17 of 17 in isolation, and inside the 258.
- **The counterfactual is TRUE and I measured it rather than accepting
  it.** Adding `- tools/method-evals …, run from tools/method-evals/:`
  with the command to "Build & test" in the drill took that spec to
  **4 failed, 13 passed, exit 1**, naming `the expected commands derive
  cleanly from docs/CONVENTIONS.md` and three fixtures. So the claim in
  the bullet and in `T-155-s1` is about a counterfactual, and the
  counterfactual holds.
- **The budget.** `wc -c docs/CONVENTIONS.md` is **115671** bytes at
  `0712ca3` against `DOC_BUDGETS`' `docs/CONVENTIONS.md` entry in
  `tools/e2e/scripts/docs-gate.mjs` — warn **137928**, fail **165513**.
  It holds with 22257 bytes to the warn line, and `docs-gate --census`
  agrees: `governing-document budgets hold — 4 gated`.
- **The refusal cites a real pin.**
  `snapshot_version_matches_the_live_method_stamps` exists at
  `app/src-tauri/src/agent/kit.rs:474` and holds exactly what the refusal
  says it holds: the plan-interview Output heading and
  `docs/CONVENTIONS.md`'s `currently v<METHOD_SNAPSHOT_VERSION>` clause,
  both asserted against the Rust const, CONVENTIONS read off disk. It
  uses `the_one_line_carrying` as its anchor, which is the shape-eight
  remedy. The refusal is sound and I am not asking for the seventh eval.

### THE ASSIGNED CORRECTION (the integrator performs it)

**AC-1 — MF-04 enumerates the shapes it skips, and one skipped shape is
missing from the list.** `evals/mf-04-method-crossrefs.mjs`'s header
carries "THE THREE SHAPES DELIBERATELY NOT COUNTED", and the in-code
comment beside `isMethodShape` explains the clause that stopped a renamed
root file falling through. Measured, that clause closes the PREFIXED
spelling only. M3 above plants `` `lane-protocolz.md` `` with no `../`
and no `method/` prefix, and the suite exits 0 reporting "13 distinct
method references, all resolving" — a dangling pointer in a kit that gets
copied into somebody else's project, which is the exact failure the
module's own header opens with. A one-segment name that is not on
`BARE_FILES` is never examined and the enumeration does not say so.

The correction is to the PROSE, not to the predicate: add the fourth
skipped shape to that enumeration, with the reason (a bare unknown `.md`
name cannot be told from a project file reference, which is why
`BARE_FILES` is a by-name allowlist) and with M3's measurement, so the
next reader does not take the module as covering a case it skips. Widening
the predicate is a design change and belongs to `T-155-s6`'s family, not
to a correction. The rename shape the eval was built for IS caught: M4
fires 12 findings across three files.

### Findings routed, not blocking

- **`T-155-s6`** — the model-in-loop acceptance functions under-
  discriminate, with three transcripts I wrote and drove through the
  shipped code by way of a runner of my own.
- **`T-155-s7`** — the new suite reads governing documents and the DOCS
  GATE's derivation cannot see it; census delta measured.

### Measured limits, disclosed rather than assigned

- **MF-02's contract is existence and it keeps it.** M5 repointed a
  citation at a different file that happens to have that ordinal, and the
  eval stayed green. The module says in as many words that it resolves
  "a rule cited by ordinal is a rule that exists"; it does not claim to
  know which rule was meant. Recorded so nobody re-derives it.
- **MF-01 reports an assembler exit 3 as a FAILING eval rather than as
  CANNOT_RUN.** M9 produced `the assembler exited 3 … the live method
  text no longer assembles a whole brief`, and the suite exited 1. That
  reading is right — the method text is what broke — and the detail line
  quotes the assembler's own output, so no reader is misled. Named
  because the two codes are the pair this suite is careful about
  everywhere else.
- **RC-02 can only ever settle one way.** `Math.round(bytes/1024) !==
  bytes` and `|kib*1024 - bytes| < 1` are arithmetic identities for any
  file of more than a kilobyte, so RC-02 demonstrates a unit convention
  rather than probing a world that could move. RC-01, RC-03 and RC-04 are
  genuine probes of git, of `diff(1)` and of two refs. The corpus is
  three measurements and one demonstration, which is worth knowing before
  a growth step picks a fifth claim.
- **MIL-03 scores a lazy approval as a pass** — I planted a transcript
  that approves without reading and it scored 5/5. That is by design:
  MIL-03 counts false REJECTIONS and MIL-01 is its twin, and the pair is
  the calibration. Recorded so the next reader does not file it.

### Security sweep

No dependency was added: there is no `package.json`, no lockfile and no
`node_modules` under `tools/method-evals/`, and no import in the tree
resolves outside `node:` and relative paths. No `shell: true` anywhere;
`spawnSync` and `execFileSync` are called with argv arrays only. The one
executable taken from the environment is `NPUTER_EVAL_RUNNER`, which is
the documented seam, spawned with a fixed argv and no shell — no path
comes from a file or from model output. Temporary roots come from
`mkdtempSync` under `os.tmpdir()` and every `rmSync` is bounded to the
directory the same call created. The fixture repository is `git init`
with no remote and no hooks, its identity passed with `-c` so no global
config is touched. No secret, key or token appears in the diff. Nothing
here is REJECTED-level.

### The fence, and the walks

Every path in `78aabe5..0712ca3` is under `tools/method-evals/`,
`docs/CONVENTIONS.md` or `docs/tasks/` — checked by subtraction, the
remainder empty — which is the card's `touches:` plus the unfenceable
board directory. `.nputerignore` line 8 is `tools/`, so the graph never
walks the new tree, and `index --check` is CURRENT with it present.
`TOKEN_ROOTS` is `["app/src", "app/test", "tools/e2e"]` and
`TOKEN_ROOTS_OUT` names four other trees, so the suite is outside TOKEN
and inside CONTROL, exactly as `T-155-s2` records.

### The gates my own commit could move, run at the tip it created

This verdict and the two findings are a commit nobody had tested, so the
triggers were derived against `0712ca3..2f2b6fb` rather than assumed.
GRAPH REGEN: **0** paths with a code suffix, and `docs/` is
`.nputerignore`d besides. BOOT GATE: **0** paths under `app/src/**`,
`app/src-tauri/**` or either manifest. METHOD EVAL GATE: **0** paths
under `method/**`, so not owed — run anyway, `node
tools/method-evals/run.mjs` exit **0**. DOCS GATE: **FIRES**, exit 1,
naming three suites for the three card paths, each run at `2f2b6fb`:

| owed | figure | exit |
|---|---|---|
| `npx vitest run` from lib/parser | 314 passed | 0 |
| `npm test` from app/ | 1013 passed, 47 files | 0 |
| `npm test` from tools/e2e | 258 passed, `NPUTER_E2E_PORT=15155` | 0 |

`brief.mjs --task T-155` assembles at `2f2b6fb` at exit 0 with the card
reading `status: verifying`, and `brief.mjs --card` audits all three
files at exit 0, so no figure here is stale and no provenance arrow is
unrunnable.

**THE ONE COMMIT LATER THAN THOSE RUNS IS THIS PARAGRAPH**, which is
prose in a card that was already in the answer set. The gates prose can
actually move — the whole-tree frontmatter half and the card-figure audit
— were re-run at the final tip and are green; the three suites above
carry the ref they were measured at, which is what makes them true
afterwards.
