---
id: T-202
title: ONE BLESSED GATE-RUNNER — an exit code is a summary, and a summary of nothing is indistinguishable from a summary of success; four seats proved that in one night from four directions
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); every instance below was measured at this seat or reported by a lane on 2026-08-31"
builder:
review: independent
---

**THIS CARD'S CHARTER IS ONE SENTENCE, AND FOUR SEATS REACHED IT
INDEPENDENTLY ON ONE NIGHT**: *an exit code is a summary, and a summary
of nothing is indistinguishable from a summary of success.*

## The instances, all from 2026-08-31, none hypothetical

- **Root-cwd greens.** The architect seat ran `npm run <gate>` from the
  repository ROOT, where there is **no `package.json`**. Every invocation
  exited **254**. Piped through `tail`, `$?` reported **0** — read as
  green **four consecutive times**, with three card commits made on their
  strength. Control both ways: `false | tail -1` → 0; with `pipefail`
  → 1.
- **A red over ZERO BODIES.** `T-167-s8`'s mutant broke syntax, so the
  suite exited 1 having run **no bodies at all**. An exit code calls that
  a kill.
- **A green for an unrelated reason.** The same lane's other mutant left
  a commit non-empty because a bare repo inside the fixture root was
  being added as blobs — the arm's precondition could not be killed from
  the side it depended on.
- **A crate-scope count describing ONE target.** `cargo test -p <crate>`
  without `--no-fail-fast` **stops after the first failing target**.
  `T-186` nearly corrected its verifier's correct `5` into a wrong `4`
  this way; the tell was arithmetic — the parts did not add up to the
  baseline.
- **A comparison over an EMPTY corpus.** Two of `T-186`'s own drill
  checks — a `diff` of two empty files exiting 0, and a duplicate-id
  scan over nothing. *"The failure wore the drill's own costume."*
- **A phantom intermittent.** `T-112-s4` read a suite exit through a pipe
  and nearly shipped an intermittent that did not exist.

## What to build

**A checked-in runner under `tools/gates/`, the ONLY sanctioned way to
run a graded suite.** It:

1. **cds with a guard** (`cd <abs> || exit N`) so a wrong directory is a
   refusal rather than a different answer;
2. **never pipes the graded command** — it redirects, captures `$?`, and
   reads afterwards;
3. emits **one machine-parseable verdict line per suite**, carrying the
   **exit code AND the body count AND the ref** it ran at;
4. **REFUSES a green that ran zero bodies**, and refuses a count whose
   parts do not sum to the run's own baseline;
5. **passes `--no-fail-fast` to cargo** and reports the TARGET count
   beside the pass/fail count.

**This extends the DOCS GATE's one-spelling doctrine to every gate**: the
project already learned that a gate with two invocations grows a mode
whose exit means something else (`T-142-s1`).

## The companion rule, and the half that is NOT this repository's

**Scripts print their own `$?` last; readers trust the printed line and
never a wrapper's summary.** Measured three times on 2026-08-31: a
background runner reported *"exit code 0"* while the script's own
captured `$?` held **1**, in three different agents' sessions.

**That half is upstream's, not this repo's** — it wants a minimal harness
repro filed against the tool, not a card here. This card owns only the
rule that makes this repository immune to it.

## Also folded in: a solo-run guard for benches

A timing bench and a full suite must not run beside each other. This seat
ran `cargo test` alongside a verifier's bench and produced a
`startup_arm` red that cost two attributions; `T-088-s4`'s hazard already
names contention as a cause. **The runner is the natural place to refuse
it** — argue whether a lock, a check, or a declared exclusion is right.

## Acceptance criteria

- EVERY graded suite in `docs/CONVENTIONS.md` SHALL be runnable through
  exactly one command, and the document SHALL name that command and no
  other spelling.
- A run that executes **zero bodies** SHALL NOT report success, and a
  body SHALL prove that by constructing a zero-body run (a syntax-broken
  mutant is the measured instance).
- THE verdict line SHALL carry exit code, body count and ref; a body
  SHALL prove each field is present and **that a missing one is refused**.
- **A POSITIVE CONTROL SHALL prove the runner can report RED** — a runner
  that only ever reports green is this card's own subject.
- WHERE cargo is run, `--no-fail-fast` SHALL be used and the target count
  reported.
- THE runner SHALL NOT pipe a graded command, and a body SHALL prove a
  piped invocation is refused or corrected.
- Verification: headless.

## Read beside

`T-142-s1` (the census/gate mode confusion, landed), `T-167-s8` (the
mutants that failed open and closed), `T-186` (the vacuous drill checks
and the fail-fast count), and `T-203`, which consumes this runner's
verdict token.


## `review: independent` SET AT FILING, not left for a dispatch to remember

**The lane judged its own runner guard-class: it refuses six distinct things.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.

## Implementation notes (executor)

**Built:** `tools/e2e/scripts/gate-run.mjs` — the runner — and
`tools/e2e/tests/gate-run.spec.ts` — its positive control, written
first — plus one bullet in `docs/CONVENTIONS.md` naming the command.

### The card says `tools/gates/`; the card's own `touches:` does not

`tools/gates/` does not exist at `146ebb6` and is **outside this lane's
fence**, which `--write-fence` derived from this card's own
`touches: [tools/e2e, docs/CONVENTIONS.md]`. The runner was therefore
built at `tools/e2e/scripts/`, where all twenty other gate scripts in
this repository already live (`docs-gate.mjs`, `health-bands.mjs`,
`lane-fence.mjs`, `token-scan.mjs`, …). Widening the fence from inside
the lane is the one repair this role may never make. **Routed:** if
`tools/gates/` is wanted, it is a move of the whole scripts directory
under a fence of its own.

### The six instances, re-measured at `146ebb6` before building

1. **Root-cwd green.** `npm run lint:docs` from the repository root
   exits **254** unpiped; through `tail -1` the shell reports **0**.
   Controls both ways: `false | tail -1` → 0, under `pipefail` → 1.
2. **Red over zero bodies** — reconstructed live, not quoted; see the
   drill table.
4. **Fail-fast truncation.** A four-target scratch crate: `cargo test`
   reported **1** `test result:` line (2 bodies); `--no-fail-fast`
   reported **4** (7 bodies). **Both runs exited 101.** The exit code
   cannot separate a 2-body answer from a 7-body one — the charter in
   one reading.
5. **Empty corpus.** `diff` of two empty files exits **0**; a dupe scan
   over nothing reports zero dupes.

3 and 6 are historical (`T-167-s8`, `T-112-s4`); taken from the card,
cited in the script header, not re-run.

### The runner caught a defect in ITSELF, and failed CLOSED

The positive control first reported **REFUSED** where **RED** was
expected. Playwright exports `FORCE_COLOR` to its children, so a nested
run's summary arrives as `ESC[32m  1 passed ESC[39m`, and a counter
anchored at `^\s*(\d+)` matched nothing: **zero bodies for a run that
executed two**. Had the runner trusted the exit code it would have said
RED and been accidentally right. Because it reads the count, it refused —
loudly, at the one moment its own parser was wrong. `stripAnsi` is the
fix; two bodies pin it, one of them proving the sanitiser cannot eat
`[T-202]` if the ESC is ever dropped from the pattern.

### And a SECOND one: the capture was not a real redirect

`runSuite` first buffered the child's two streams separately and
concatenated them — `stdout + stderr` — which puts every stderr line
after every stdout line. **cargo splits one record across both**:
`Running unittests src/lib.rs` is cargo's progress on stderr, and its
`finished in Xs` is the harness on stdout. Concatenated, the marker and
its number land in different halves of the file, and
`health-bands.mjs` reported `suite/lib-seconds` as **UNREAD** — a band
losing its authority because of how a runner captured, not because of
anything in the tree.

The fix makes the capture a **true redirect**: one file descriptor handed
to the child for both streams, which is `> file 2>&1` without a shell.
After it, the same run reads **0 unread bands** where it had 1. A body
pins the interleaving.

**Both self-caught defects failed in the same direction** — the runner
refused, or a band said UNREAD, rather than either reporting a green.
That is what a gate failing closed looks like, and it is the only reason
either was found.

### A FOURTH measurement of the companion rule, unplanned

The card records a background wrapper reporting *"exit code 0"* while the
script's own `$?` held 1, three times on 2026-08-31. **It happened again
in this lane.** The full e2e run's harness notification said *"completed
(exit code 0)"* and the captured file's own trailer reads
`[exited with code 0]` — while the script's own printed line held
`E2E_FULL_EXIT=1` and the suite's own summary read `1 failed / 396
passed`. The card routes that half upstream; this is one more datum for
the repro it asks for.

### The solo guard is a LOCK, and the argument is in the header

A declared exclusion cannot see another process; a check races. The lock
**refuses rather than waits**, because a reading taken after a wait is a
reading of the wait — that converts a contention red into a slower green
and loses the signal. It is reclaimed when its holder is gone.

### `docs/CONVENTIONS.md`: **−14 bytes**, headroom improved

147,947 → **147,933**. Warn headroom 10.00408% → **10.01259%**, inside
the 10% drift line with 20 bytes of slack (was 6). Paid for by two
corrections, not deletions:

- the card-preflight sub-bullet **cited** the METHOD EVAL GATE's account
  of why the command is not in "Build & test" and then restated the whole
  mechanism anyway; the fuller copy survives at the gate that owns it.
- *"a bare `| tee` hands you tee's status, which every gate bullet above
  forbids in as many words"* was **false at this ref**: GRAPH REGEN and
  the METHOD EVAL GATE say nothing about piping, and the BOOT GATE's only
  hit is *"this pipeline never issues"* — a release pipeline. Exactly one
  of four forbids it, and the sentence now says so.

The bullet carries no `run from <dir>/:` marker, no code fence and no
indented sub-bullet, so `workflow-parity.spec.ts` reads it as prose and
it adds no CI-parity obligation.

### Poison drills — twelve, one side only, all restored

**Every figure below is re-measured at `23726c9`**, the tip that
carries the corrections, so the table describes one tree rather than
three. (The earlier table said *"30 bodies"*, which was true of a
spec that no longer exists — the verifier was right that a stale count
dates the drills to before the bodies they are supposed to cover.)

Every drill: exact-string mutation refusing on no-match, `git diff`
read back, suite run **unpiped** with `$?` captured first, **34 bodies
ran every time** (never zero — shape TEN), then `git checkout --` with
sha256 identical before and after and an empty per-path diff.

| mutation | bodies failed |
|---|---|
| zero-body refusal, exits-ZERO half | **2** |
| cd guard's sentinel | 1 |
| shell-metacharacter (pipe) refusal | 1 |
| cargo `--no-fail-fast` rule | 1 |
| verdict missing-field refusal | 1 |
| parts-vs-baseline refusal | **2** |
| Playwright missing-baseline derivation | 1 |
| `countCargo` counts an empty target as one body | **3** |
| **V-M1** drop `"bodies"` from the required fields | **2** |
| **V-M2** drop the lock's pid-liveness check | 1 |
| **V-M5** delete the whole `app` suite from the registry | 1 |
| **V-M3b** add a competing second spelling to CONVENTIONS | 1 |

**The four `V-` rows are the verifier's own survivors, re-run against
the corrected spec. Every one of them left the suite 31/31 GREEN
before; every one of them now dies.** That is the evidence the
corrections work, and it is the only evidence worth having, because
the defect was precisely a suite that reported agreement while
measuring nothing.

**Shape SIX asked, and was answered.** Six of seven kill exactly one
body. The parts-vs-baseline mutation killed two, so a seventh drill was
cut upstream in `countPlaywright`: it kills **only** the missing-baseline
body. The two are therefore not duplicates — they pin different
derivations (a baseline that is absent, and one that is present and
disagrees) of one downstream refusal.

`gate-run.mjs` is imported by `gate-run.spec.ts` and nothing else
(census at `4531223`), so the lane's other 367 bodies cannot see any of
these mutations; the reachable suite is the whole suite here.

### What is NOT built, and is routed

- **The literal criterion 1 — *"and the document SHALL name that command
  and no other spelling"* — is met only in part.** CONVENTIONS still
  names `npm test`, `npx vitest run` and `cargo test` in the four
  per-package bullets, and it **must**: `workflow-parity.spec.ts`
  derives CI's own steps from exactly those bullets, so deleting them
  would red the lane and desynchronise `ci.yml`. Collapsing them into
  the runner needs `.github/workflows/ci.yml`, which is outside this
  fence. **Routed** — and it is the same shape the METHOD EVAL GATE
  already carries as `T-155-s1`.
- **`docs/CAPABILITIES.md` is STALE and this fence cannot fix it** —
  `T-201` exactly. Committed 29,121 bytes, fresh generation **32,841**:
  **+3,720 bytes** for **34** spec names, re-derived at `23726c9`. The
  integrator must run `npm run capabilities` IN THE MERGE COMMIT —
  CONVENTIONS requires the regeneration to land in the same commit as
  whatever moved a test name, or the red arrives at the next lane
  detached from its cause.



## Corrections performed (executor, after verification)

The verifier returned **APPROVED WITH ASSIGNED CORRECTIONS** and found
**one defect class four times: every corpus this spec checked was the
corpus under test.** Dropping a required verdict field, deleting a whole
graded suite, and removing the lock's liveness check each left the suite
**31/31 green**, because the bodies that checked those things ITERATED
them — and an iteration over a corpus the mutation has just emptied
passes by having nothing left to check.

**That is instance 5 of this card — a comparison over an empty corpus —
reproduced inside the artefact built to catch it.** The card's own list
of instances now describes its own spec, which is the most useful thing
the verification produced.

1. **`REQUIRED_VERDICT_FIELDS` pinned against an independent literal.**
   `CRITERION_3_FIELDS` is typed in the spec from the card's own words;
   the runner never reads it, and the missing-field loop drives off it.
   V-M1 now kills 2 bodies.
2. **The registry pinned against an independent expectation.**
   `CRITERION_1_SUITES` likewise, plus a third source: the DOCUMENT's
   own `parser|app|rust|e2e` list is parsed and compared, so neither
   the doc nor the registry can move alone. V-M5 now kills.
3. **The stale lock is CONSTRUCTED.** The body writes a lock file holding
   a reaped pid instead of acquiring and cleanly releasing, so the
   reclaim branch is actually entered. V-M2 now kills, and *"a crashed
   run cannot wedge the gate"* is measured rather than asserted.
4. **Two body names corrected to what they measure.** The document body
   claimed *"the one spelling"* while asserting containment; it now
   COUNTS occurrences and says so in its name. **This was not cosmetic:
   `docs/CAPABILITIES.md` is generated from these names, so the old one
   would have published a sentence this repository does not hold.**
5. **Two stale figures re-derived** — the drill table and the
   CAPABILITIES delta above, both at `23726c9`.
6. **The cargo doc-test body now exercises product code.** It ran
   `toContain` against a constant declared a hundred lines above, which
   cannot fail except by editing the constant. It now runs `countCargo`
   and `judge` over a zero-body target, and states the charter in its
   sharpest form: **the parts AGREE with the baseline — 0 equals 0 — and
   it is refused anyway.**

**Shape SIX, asked again at the new tip.** Three mutations kill more than
one body. `parts-vs-baseline` is separated by the Playwright
missing-baseline drill, which kills only one of its two. The
`zero-bodies` pair is separated the other way: a mutation confined to
`countCargo` kills the new cargo-target body and leaves the pure-`judge`
body **green**, so each covers a derivation the other cannot reach.
Neither pair is duplication.

**One thing the verifier recorded that is now in the header**: a child
that PRINTS a plausible summary having run nothing is reported GREEN,
because baseline and parts come from the same transcript. This runner's
floor is the reporter's own honesty. Said out loud rather than left for
the next reader to discover.

**And the verifier hit this card's subject twice while verifying it** —
an exit 1 over zero bodies on a busy port, and a harness reporting
"exit code 0" against its own captured `$?` of 1, which it measured as
**systematic: three of three background runs.** Instances six and seven,
neither staged, both caught only by reading counts and printing its own
exit.

## Verdicts

### 2026-08-31 — APPROVED WITH ASSIGNED CORRECTIONS — verifier, claude-opus-5@72a12f43

#### THE FINDING: EVERY CORPUS THE SPEC CHECKS IS THE CORPUS UNDER TEST

Stated first because it is the one sentence to carry out of this pass.
**Deleting a required verdict field, deleting a whole graded suite from
the registry, and deleting the solo lock's pid-liveness check each leave
the suite at 31/31 GREEN** — because the bodies asserting those three
requirements ITERATE THE VERY LISTS THAT DEFINE THEM. Empty the list and
you delete the requirement and its test in one stroke, and the check goes
on reporting agreement over nothing.

**That is instance 5 of this card's own subject — the comparison over an
empty corpus — reproduced inside the artefact built to catch it.** The
runner is sound; its PROOF is what carries the defect, which is the exact
recursion this card names. The measurements are in the mutant table below.

**And the exactness half, which a removal-only drill cannot see:**
removing the runner's name from `docs/CONVENTIONS.md` KILLS a body, but
**adding a competing SECOND spelling survives** — so criterion 1's *"and
no other spelling"* is a CONTAINMENT matcher. It is UNMEASURED, not merely
unmet, and only the PAIR of mutants distinguishes the two.

**This is a RULE rather than an anecdote, because two verifiers reached it
independently on different subjects**: `T-198`'s verifier found the same
drill mode from the other direction, and both are folded into `T-206`.
**A drill that mutates only by REMOVAL cannot tell an exact matcher from a
containment one — mutate in both directions, or do not claim exactness.**

**Phase 1 was written, saved and hashed before the diff, the notes or any
commit message was opened.** Attack set sha256
`10f3178f1234d53bee05fd9385dba2c32929d8347f70dc8e228ea221a5bc9f0a`,
sealed 2026-08-31T07:25:57Z, 17 attacks (A0–A16) derived from the card at
its base ref `146ebb6` alone. Phase-1 toolset was `rev-parse`,
`merge-base`, `ls-tree`, `git show <ref>:<path>` and a `status
--porcelain` that returned empty — **no `git log`, no `git diff`**.

**Contamination, self-inflicted, disclosed and then resolved to NIL:** my
first action read the WORKING-TREE `CLAUDE.md` before I had set the
base-ref discipline. Phase 2 settled it — `CLAUDE.md` is blob
`03bbe07355daab00fac4472f3d32925e50d8950e` at both `146ebb6` and
`7a8dc4b`, byte-identical, so nothing leaked. The dispatch brief named no
executor-derived specific (no mutant number, no path count, no suite
figure) and separated the two phases, per `roles/verifier.md` and STATE's
"a verifier's brief carries NO lane fact".

**All figures below are measured at `7a8dc4b` unless another ref is named.**

#### The charter attack, and what else failed to break it

The card's own subject is a runner that is vacuously green. **It is not.**

- `/usr/bin/true` as the graded command — runs nothing, exits 0 —
  → `REFUSED reason=zero-bodies`. The single sharpest discriminator
  between "correctly refuses" and "never ran", and the runner passes it.
- A nonexistent binary → `REFUSED could-not-run`. A child printing
  `Running 0 tests` and exiting 0 → `REFUSED zero-bodies`.
- **The count is not fabricated.** `gate-run.mjs parser` reported
  `bodies=344`; run independently, `npx vitest run` in `lib/parser/`
  reported its own `Tests 344 passed (344)`. Two sides, one number.
- Real discrimination over real spawns: parts-not-summing → `REFUSED
  parts-do-not-sum-to-baseline`; exit 101 with parts summing → `RED`;
  two targets summing → `GREEN bodies=5 targets=2`.
- **No pipe is possible rather than merely absent** — `spawnSync` with an
  argv ARRAY and no shell, plus a metacharacter validator. Structural, not
  a source grep. The capture is a true single-fd redirect, pinned by a
  real interleaving body.
- `--no-fail-fast` is enforced by `validateSuite` for the cargo family —
  again structural, not a grep.
- **Over-refusal is loud and distinguishable from BOTH green and red**:
  REFUSED is exit 3, the house code for "this run is not a claim about the
  tree", with a reason token on the line. My predicted over-refusal O1 —
  an `isatty` pipe-detector that would refuse every mandated redirect and
  all of CI — **does not exist here**; the runner never sniffs the stream.
- **Security sweep (mandatory, step 3): clean.** No shell anywhere; the
  command is only ever a frozen-registry entry and CLI arguments select
  keys rather than supplying commands; zero new dependencies (node
  builtins only); no network; no secrets; writes confined to `mkdtemp`
  dirs and one advisory lock in `tmpdir` whose name is hex-derived, so no
  traversal.
- **Fence: COMPLIANT**, judged by reading the manifest against the diff
  because `T-199` says the hook judges nothing. All four paths lie inside
  `touches: [tools/e2e, docs/CONVENTIONS.md]` plus the card's own file.
- **Both owed gates are green at the tip.** `docs-gate.mjs`, given
  separate literal paths, named `cargo test from app/src-tauri/` and `npm
  test from tools/e2e/`. Full e2e: **398 passed**, my own captured `$?`=0.
  Cargo `--no-fail-fast`: **601 passed / 0 failed / 4 ignored over 18
  targets**, and the arithmetic holds — parts sum to **605**, exactly the
  sum of cargo's own `running N` baselines. Lib suite 4.20s, inside
  STATE's cache-cliff band.
- Confirmatory mutant M4 (`count.bodies === 0` → `< 0`) **KILLED, 2
  bodies**: the centrepiece guard is genuinely pinned, by a real
  syntax-broken spawn and by the exits-ZERO half over [0,1,101,254].
- The `| tee` prose correction is **factually right**: the piping
  prohibition lives in the DOCS GATE's xargs-dialect table, and the
  BOOT GATE's "this pipeline never issues" is a release pipeline.

#### The defect: four surviving mutants, and they are ONE class

Every mutant below was applied one side only, read back with `git diff`,
run unpiped with `$?` captured first, then restored with sha256 identical
to baseline (`gate-run.mjs` `a5b533e3…`, `CONVENTIONS.md` `80ad2c76…`).
Each ran **31 bodies, never zero** — shape TEN on my own checks.

| # | mutation | expected | measured |
|---|---|---|---|
| M1 | drop `"bodies"` from `REQUIRED_VERDICT_FIELDS` | RED | **SURVIVED 31/31** |
| M2 | drop `pidAlive(held.pid)` from the solo lock | RED | **SURVIVED 31/31** |
| M5 | delete the whole `app` suite from `GRADED_SUITES` | RED | **SURVIVED 31/31** |
| M3a | rename `gate-run.mjs` out of CONVENTIONS | RED | KILLED (1 body) |
| M3b | ADD a competing second spelling to CONVENTIONS | RED | **SURVIVED 31/31** |

**The pattern: every corpus the spec checks is the corpus under test.**
The body proving "a verdict line missing a required field is REFUSED"
loops over `REQUIRED_VERDICT_FIELDS` itself, so deleting a field deletes
both the requirement and the test for it. The bodies checking the registry
iterate over the registry, so the registry can be emptied unnoticed. **A
comparison over a corpus that the mutation itself empties reports
agreement and measures nothing** — which is instance 5 of this card,
reproduced inside the artefact built to catch it.

**M3a/M3b is the exactness pair, and only the pair identifies it.** The
removal-only half kills, so the body looks strong; the addition half
survives, which proves the matcher is CONTAINMENT. Criterion 1's second
half — *"and no other spelling"* — is therefore unmeasured, not merely
unmet.

**M2 is the over-refusal direction and it costs a misattribution.** The
body named *"a lock left behind by a dead process is reclaimed"* acquires,
cleanly RELEASES (deleting the file), then re-acquires — it never
constructs a lock left behind, so the stale branch is never entered. With
the liveness check gone, one crashed run wedges the solo gate for `rust`
and `e2e` permanently, and the next lane reads its own refusal as a red it
caused.

#### Assigned corrections (assigned, not performed)

1. **Pin `REQUIRED_VERDICT_FIELDS` against an independent literal**, so
   M1 dies. Criterion 3 requires that a missing field be refused; today
   the requirement can be deleted silently, and `T-203` gates a push on
   this token.
2. **Pin the registry against an independent expectation**, so M5 dies.
   Criterion 1's first half is otherwise unenforced and a graded suite can
   fall out of the blessed runner unnoticed.
3. **Construct a genuinely stale lock** — write a lock file holding a dead
   pid, then acquire — so M2 dies and the "crashed run cannot wedge the
   gate" claim is measured rather than asserted.
4. **Rename two bodies to what they measure.** `gate-run.spec.ts:521`
   claims *"the one spelling"* while asserting containment, and
   `gate-run.spec.ts:473` claims a lock *"left behind by a dead process"*
   it does not construct. **This is not cosmetic: `docs/CAPABILITIES.md`
   is generated from these names**, so both would enter the behaviour
   census as sentences the tree does not hold. Either rename them, or add
   the exactness assertion the name promises.
5. **Two stale figures in the implementation notes**, both re-derived by
   me at `7a8dc4b`: the drill table says *"30 bodies ran every time"* —
   the spec ships **31**; and the fresh CAPABILITIES generation is
   **32,434 bytes**, not 32,327. The gap matters, because it locates the
   drills as predating body 31 — which is exactly the containment matcher
   M3b exposes. (The `−14` byte claim on CONVENTIONS is CORRECT: 147,947
   → 147,933.)
6. **`gate-run.spec.ts:194` exercises no product code** — it asserts that
   a string constant defined 130 lines above contains a substring. It
   cannot fail except by editing the constant.

#### Not defects, recorded

- **`tools/gates/` vs `tools/e2e/scripts/`** — the card's prose says one
  thing and the card's own `touches:` forbids it. The lane obeyed the
  fence and routed the move, which is the right call; the CARD should be
  reconciled so a later reader does not hunt in `tools/gates/`.
- **Criterion 1's second half is knowingly unmet and disclosed** — the
  per-package bullets must stay because `workflow-parity.spec.ts` derives
  CI's steps from exactly those bullets. I verified that dependency. The
  collapse needs `.github/workflows/ci.yml`, outside this fence. Correctly
  routed. **But note the blessed bullet carries no `run from <dir>/:`
  marker, so by that spec's own account it arrives in the one shape the
  derivation cannot see** — the one blessed command is invisible to CI
  parity by construction.
- **The runner's honest residual, which the notes do not name:** a child
  that PRINTS a plausible summary having run nothing is reported GREEN
  (measured: a forged `Running 5 tests` / `5 passed` transcript →
  `GREEN bodies=5`). Baseline and parts both come from the same
  transcript, so the runner's floor is the reporter's own honesty. This is
  inherent to counting a tool's self-report and is not a defect against
  the card — it is worth one sentence in the header.

#### The integrator's obligation

**`npm run capabilities:check` is RED at this tip** — exit 1, STALE,
committed 29,121 bytes against a fresh 32,434. The lane disclosed this and
genuinely cannot fix it inside `touches:`. But CONVENTIONS requires the
regeneration to land in the SAME commit as whatever moved a test name, so
**the merge commit must carry `npm run capabilities`** or the red arrives
at the next lane detached from its cause.

#### One red that is NOT this lane's, proven rather than asserted

`dispatch-order.spec.ts:200` *"--dispatch runs on the live repository,
exits 0, and WRITES NOTHING"* reds when that spec runs ALONE and passes in
the full suite. Cause proven, not guessed: `brief.mjs --dispatch`
redirected is **75,910 bytes and contains the BLOCKED section at byte
72,052**; piped it is **exactly 65,536**. The assertion's substring lies
beyond the pipe boundary. That is the standing `T-197` truncation STATE
names as no lane's doing, and this diff moves board size in the safe
direction. Re-measured once and attributed, per STATE.

**A note on my own measurement, in this card's own spirit:** my first M4
run exited 1 having run ZERO bodies — Playwright aborted at config load
because I had left the port busy with my own background suite. An exit
code called that a kill; it was not one. I discarded it and re-ran on a
free port, where it killed 2 bodies honestly. Read the count, never the
code — including your own.

#### Gates re-run at MY OWN tip, because this verdict is a write

`roles/verifier.md` step 7: prose is a code input here, so the tip this
verdict created owes its own gates. `docs-gate.mjs`, given the card path
as a separate literal argument, named three suites. All three measured
AFTER the append above:

- `npx vitest run` from `lib/parser/` — **344 passed**, captured `$?`=0.
- `npm test` from `app/` — **1100 passed** (49 files), captured `$?`=0.
- `npm test` from `tools/e2e/` — **397 passed, 1 failed**, captured `$?`=1.
  The one failure is `dispatch-order.spec.ts:200`, the `T-197` truncation
  body above. **Proven not to be mine:** `brief.mjs --dispatch` is
  byte-identical before and after this append — 75,910 bytes, BLOCKED at
  offset 72,052 both times — and this verdict's text never appears in that
  output at all. The card's prose is not an input to `--dispatch`.
- `docs-gate.mjs` confirms every live card's frontmatter still parses with
  a legal status, so this append moved no board.

**INSTANCES SIX AND SEVEN OF THE EXIT-CODE FAMILY, BOTH MINE, BOTH IN THE
ACT OF VERIFYING THE CARD THAT NAMES THEM.** The card records three
measurements of a wrapper reporting *"exit code 0"* against a script's own
`$?` of 1, and the executor's notes add a fourth. This pass produced two
more, and they are the card's two halves respectively:

- **SIX — an exit code over ZERO BODIES, which is instance 2's shape.**
  My first run of mutant M4 exited **1** and I nearly scored it a kill.
  It had run NOTHING: Playwright aborted at config load because I had
  left the lane port busy with my own background suite. An exit code
  called that a kill; it was not one. Discarding it and re-running on a
  free port produced an honest kill of 2 bodies. **The count is what
  caught it, exactly as this runner argues.**
- **SEVEN — a wrapper contradicting a captured `$?`.** The harness
  notification for my background e2e run read *"completed (exit code 0)"*
  while the line the script printed for itself read
  `MYTIP E2E CAPTURED RC = 1`. **I only caught it because I printed my
  own.**

Neither was staged. The rule this runner installs locally is the rule that
caught both, and the verifier's seat is not exempt from it: **read the
count, never the code — including your own.**

**Seven is SYSTEMATIC rather than intermittent, which is the part the
upstream repro needs**: it recurred on **every** background run in this
pass — three of three — each time reporting *"completed (exit code 0)"*
against a captured `$?` of 1. A reproducer does not need to wait for it.
