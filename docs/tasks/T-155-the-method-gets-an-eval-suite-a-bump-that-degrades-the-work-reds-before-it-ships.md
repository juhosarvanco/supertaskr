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
