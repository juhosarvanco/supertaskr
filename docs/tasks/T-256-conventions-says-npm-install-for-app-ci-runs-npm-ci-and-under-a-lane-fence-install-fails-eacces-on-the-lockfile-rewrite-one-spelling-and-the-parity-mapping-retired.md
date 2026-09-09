---
id: T-256
title: CONVENTIONS says `npm install` for app/, CI runs `npm ci`, and under a lane fence `install` fails EACCES on the lockfile rewrite — one spelling, `npm ci`, and the parity spec's install→ci mapping retired
feature: F-01
milestone: 4
size: S
priority: 3
status: done
suggested_by: "the T-247 executor seat, 2026-09-08 (row 13 of its report): the brief's build row transcribes CONVENTIONS' `npm install` for app/, which rewrites app/package-lock.json outside the lane's fence and is refused EACCES; `npm ci` works — and tools/e2e/tests/workflow-parity.spec.ts already maps the doc's `npm install` to CI's `npm ci` with a written reason"
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was found

Two seats reached the same line from opposite sides. The workflow-parity
spec carries a documented divergence: CONVENTIONS' Build & test bullet
says `npm install` for app/ and ci.yml runs `npm ci`, with the reason
written into the spec. A lane executor then found the third reading:
under a lane fence, `npm install` in app/ tries to rewrite
app/package-lock.json, which is outside the fence, and the hook refuses
it (EACCES); `npm ci` never writes the lockfile and works. So the
doc's spelling is the one that fails for the seats that read it most.
Also from the same report: the brief's build order stops at lib/parser
and app/, but tools/e2e's own preflight refuses without
app/node_modules and lib/parser/dist — the brief's fresh-worktree
paragraph should say so in its order, not only in its warning.

## Acceptance criteria

- WHEN CONVENTIONS' RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT
  bullet publishes its recipe THE recipe SHALL also suppress git's
  identity AUTO-DETECTION (`-c user.useConfigOnly=true`, or the
  `GIT_AUTHOR_*`/`GIT_COMMITTER_*` variables unset AND
  `user.useConfigOnly=true`), and the bullet SHALL say why: the two
  `GIT_CONFIG_*=/dev/null` variables suppress config FILES only, so on a
  host whose hostname carries a dot the recipe answers green and
  reproduces no runner red (T-239-s4's class; measured at 0f6b37f).
- IF the recipe is run against the T-239 ritual fixture at 0f6b37f THEN
  it SHALL reproduce the runner's exit 128 (the control T-239-s4's
  verifier took at the base: `useConfigOnly` arming 1 failed / 56 passed).
- WHEN CONVENTIONS' Build & test bullet is read THE app/ install line
  SHALL say `npm ci`, and the parity spec's install→ci mapping (the
  `steps: [{ dir: "app", run: "npm ci" }]` entry with its reason) SHALL
  be retired so the doc and CI say the same words — the spec's
  "verbatim" class then covers app/ the way it already covers the
  parser package (respelled by the seat, 2026-09-09: the preflight read
  the package's path here as a criterion path outside the fence).
- WHEN the fresh-worktree sub-bullet is read THE build ORDER SHALL name
  tools/e2e's `npm ci` and the app build as steps a lane runs before
  its suite, in the order the preflight demands.
- The workflow-parity suite SHALL be green with the mapping gone, and
  the docs gate SHALL be run on CONVENTIONS (the budget line printed).
- IF the dispatch brief's build rows are derived from the bullet THEN
  a brief assembled after the merge SHALL print `npm ci` for app/ —
  checked once by hand and recorded in the report.

## Implementation notes (executor, 2026-09-09, lane
`task/T-256-npm-ci-one-spelling`, base `89f23ca`)

Two files moved, both inside the fence: `docs/CONVENTIONS.md` and
`tools/e2e/tests/workflow-parity.spec.ts`. **No app or Rust source is
touched, and no spec NAME moved** — `npm run capabilities:check` answers
CURRENT at the tip, so this lane owes the census nothing.

**T-216-s6 IS ABSORBED BY THIS LANE'S WORK.** Both of its criteria are
satisfied by the same commit: the fresh-worktree ordering now names a
command that succeeds inside an armed lane, and the parity spec's
divergence mapping moved with it. What was built is that card's TRIAGE
RULING, not a fresh decision — `npm ci` from app/, said in the lane
bullet beside the fresh-clone ORDER, and no lockfile added to
`alwaysWritable`. This lane did not edit T-216-s6; the seat stamps it at
the merge.

### `npm ci` under an ARMED fence, measured from the other side

The card was filed on three lanes' EACCES. This lane is the positive
case, taken in this worktree with the physical layer armed:

    lib/parser  npm ci          exit 0        npm run build  exit 0
    app         npm ci          exit 0 (499 packages)
    app         npm run build   exit 0
    tools/e2e   npm ci          exit 0

`git status --porcelain` was EMPTY after all four: none of them writes a
lockfile, which is exactly why the fence permits them and refuses
`npm install`.

### The borrowed-git recipe — the identity gap, measured

On this host (`Mac.lan`, git 2.50.1), in a scratch repository with no
configured identity. Each row is one `git commit`, exit read unpiped:

| arming | exit | author |
|---|---|---|
| bare (this machine's config) | 0 | `ujju <ujjuujju@proton.me>` |
| `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` — THE RECIPE AS PUBLISHED | **0** | `ujju <ujju@Mac.lan>`, AUTO-DETECTED |
| + `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=user.useConfigOnly GIT_CONFIG_VALUE_0=true` | **128** | *"Author identity unknown"* |
| the triple WITHOUT the `/dev/null` pair | 0 | `ujju <ujjuujju@proton.me>` |
| the whole recipe + `GIT_AUTHOR_*`/`GIT_COMMITTER_*` set | 0 | `t256 <t256@example.invalid>` |

Rows 4 and 5 are the controls for the two halves: the config files must
be suppressed AND the auto-detection switched off, and an environment
identity outranks both — which is why the bullet now says to unset
`GIT_AUTHOR_*`/`GIT_COMMITTER_*`. The published recipe used
`-c user.useConfigOnly=true`'s ENV form because a suite spawns its own
gits: `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` is how one key reaches all of
them, and the `-c` spelling is named beside it for a single command.

### The control at `0f6b37f`, on the T-239 ritual fixture

`npx playwright test tests/brief.spec.ts` from `tools/e2e/`, whole file,
at `0f6b37f34665` — the ref the criterion names — in a `--shared` clone
under the scratch directory (NOT a worktree: cutting one would have put
a fourth entry in `git worktree list` while three lanes were live).
Every exit read unpiped:

| arming | exit | count |
|---|---|---|
| ordinary | **0** | 57 passed |
| the recipe AS PUBLISHED (the two `/dev/null` variables) | **0** | **57 passed — it reproduces NOTHING** |
| the recipe THIS LANE PUBLISHES | **1** | **1 failed, 56 passed** |

The one red is `brief.spec.ts:3230` *THE ARM LEAVES EXACTLY WHAT THE
EIGHT HAND STEPS LEAVE, file for file*, and it is the RIGHT red: its
captured output carries `*** Please tell me who you are.` and
`stopped at step 1 (stamp)` — CI run 33672240360's own failure. Those
are the figures T-239-s4's verifier recorded for the identity-disabled
cell at this base (1 failed / 56 passed), reproduced here by the recipe
the doc now publishes rather than by a hand-built arming.

**AND THE MIDDLE ROW IS THE POINT OF THE WHOLE EDIT**: the recipe
CONVENTIONS published until this commit answers 57 passed at a base CI
had already reddened.

**One environment correction, disclosed.** The clone's own `main` was
still at the integration tip, so `checkout-currency.mjs` answered STALE
with `[registration-missing]` / `[guard-surface-behind]`, and the
ordinary arm then failed the SAME body at step 3 (preflight) for that
unrelated reason — the STALE-CLONE LIMIT that tool prints about itself.
`git branch -f main 0f6b37f` in the clone answers CURRENT and the
ordinary arm goes green, which is the cell that breaks the degeneracy.
All three rows above were taken in that state.

### The drill — three mutants, each RED ALONE, each restored by sha256

Pre-drill digests: `docs/CONVENTIONS.md`
`0e0867c0314de84f3f3d01ab80618211425e30e1d41dcf69d144afc377f5d3ad`,
`tools/e2e/tests/workflow-parity.spec.ts`
`4926500d01e42450bc83c624ed570a2638bd48ce6d5677b13ede13d194d22632`.
Each mutation was applied alone, the whole parity file run, then
inverted and the digest compared (an inverse edit, not `git restore` —
the work was uncommitted at the time and a restore would have discarded
it).

| # | mutation | exit | named by |
|---|---|---|---|
| M1 | the DOC says `npm install` for app/ again | 1 | *lists [app] npm install, which this spec has no entry for* AND *this spec expects [app] npm ci, which … no longer lists* — 4 bodies |
| M2 | the spec's new verbatim entry still says `npm install` (an incomplete retirement) | 1 | the mirror pair, both sides named — 4 bodies |
| M3 | the app entry deleted outright (the retirement taken too far) | 1 | *lists [app] npm ci, which this spec has no entry for* — 4 bodies |

Both files' digests matched their pre-drill values after the drill, and
`git status --porcelain` showed only the two fenced files.

### The bytes

`docs/CONVENTIONS.md` 129,306 bytes at the base `89f23ca` to 131,328 at
the lane tip `d3b5a16` (**+2,022**), against the ADR-019 band `landed
117,502 / warn 146,878 / fail 176,253` — the gate prints
*governing-document budgets hold*, with 15,550 bytes of headroom to the
warn line. Two cuts were taken in the same file rather than one:
the retired DIVERGENCE 1 sentence, and the fresh-worktree sub-bullet's
pointer at the fresh-clone ORDER, which the new explicit ORDER makes
redundant. **The additions still outweigh the cuts, and that is stated
rather than rounded away.**

### The battery, all at the lane tip `d3b5a16` unless a row says otherwise

    node tools/e2e/scripts/gate-run.mjs e2e     exit 0  GREEN  742 bodies
    node tools/e2e/scripts/gate-run.mjs parser  exit 0  GREEN  389 bodies
    npm test            (app/)                  exit 0  1171 tests, 51 files
    cargo test          (app/src-tauri/)        exit 0  650 bodies, 18 binaries
    index --check       (app/src-tauri/)        exit 0  CURRENT
    npx playwright test tests/workflow-parity   exit 0  22 passed
    docs-gate.mjs docs/CONVENTIONS.md           exit 1  FIRES, budgets hold
    capabilities:check / typecheck              exit 0 / exit 0
    lint:tokens / --selftest / lint:docs        exit 0 / exit 0 / exit 0

Both `gate-run` legs recorded `dirty: false` at that ref. The docs gate's
exit 1 is its FIRES answer, not a failure: it names four owed suites
(cargo, app, tools/e2e, lib/parser) and all four are above.

### For the verifier

- The FENCE held: `git diff --name-only 89f23ca..HEAD` names three
  paths, two of them the manifest's and the third this card under the
  unfenceable `docs/tasks/`.
- The docs gate FIRES on this diff and names two suites — `npm test`
  from tools/e2e (run, GREEN) and `cargo test` from app/src-tauri. The
  Rust readers of CONVENTIONS are `kit.rs` (the method-version stamp,
  untouched — the stamp stays v0.1.11) and `dispatch/brief.rs`, which
  looks up the `Fresh-clone ORDER` and `A FRESH WORKTREE HAS NOTHING
  INSTALLED` bullets by phrase (both phrases intact) and parses the
  per-package commands with the same middle-dot rule the spec uses.
  Its one command assertion is about `lib/parser`'s `npm ci`.
- `T-256-s1` is filed for the `npm install` spellings that survive
  OUTSIDE this fence, and it asks a question rather than prescribing a
  rename: `bin/app-dev.mjs` step 4 may be RIGHT as it stands, because
  CONVENTIONS' relaunch bullet says `npm ci` beside a live app deletes
  `node_modules/.vite` — the one channel that corrupts rather than
  interrupts.

## Verdicts

Absorbs: T-239-s5 (2026-09-08, triage at the wave sitting) — the borrowed-git recipe's identity gap, measured by the T-239-s4 executor at 0f6b37f; the file is removed in this commit, this line is the surviving record.

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2) — APPROVED

    tip:        8e9a9f5538a698c6749ba5aea429fcce2ae4b19f
    base:       89f23ca0b9a0b96a25c149002e29ecc73fa045d2
    bench:      /Users/ujju/Projects/nputer-V-T-256, detached, clean
    port:       SUPERTASKR_E2E_PORT=25256
    attack set: sha256:c3aa5a5210d7b3bcbeb4780f9b5b07d59127ef9e7b2505f1aa231371bff7c960 (attack-set-T-256.md)
    ground:     sha256:3edaa019647e244e29ac1148939085e2a3f8db4552bab0641b28a291a6642a10 (ground-T-256.md)

Both digests were verified with `shasum -a 256` before either file was
opened. **All six criteria are met, the work is fenced, no record was
rewritten, and the load-bearing mutant reds by name.** NO corrections are
assigned. Two suggested cards are filed separately (T-256-s2, T-256-s3);
neither blocks this merge.

#### The frame I actually had

Two spawns; phase 1 was tool-less by instruction, not by a harness that
can deny tools. Before writing findings I read only: the two sealed
files, `method/roles/verifier.md`, `docs/STATE.md` and the card at the
base, T-216-s6 whole, the diff and the tree. Findings were written to
`findings-T-256.md`
(sha256:e66d64a3ff59869600b116d8b68e199eaa5fcb1f28a5f380564338aae89ad214)
and hashed BEFORE the executor's report was opened.

**TWO LEAKS I OWE, disclosed rather than tidied.** (1) Establishing the
fence I ran `git log --oneline` on the range, which printed the
executor's four commit SUBJECTS; `--name-status` alone would have done
the job. (2) Checking that the six criteria were byte-identical required
diffing the card, and `## Implementation notes` live in that same file,
so roughly sixty lines of notes rendered before findings were written. I
re-measured every figure below myself; none is transcribed from the
report, and where the report and my measurement disagreed I say so.

#### The standing checks

- **FENCE.** `git diff --name-status` gives exactly four paths:
  `docs/CONVENTIONS.md`, `tools/e2e/tests/workflow-parity.spec.ts`, this
  card, and the NEW `docs/tasks/T-256-s1-*.md`. No `dispatch-brief.mjs`
  (T-254's), no `brief.mjs` (T-238-s1's), no `ci.yml`, no T-216-s6, no
  `docs/CAPABILITIES.md`, no `docs-scan.mjs` (which carries the byte
  band), nothing under `method/`, no lockfile.
- **RECORDS.** Everything above `## Implementation notes` differs from
  the base in ONE line: `status: building` becomes `verifying`, the
  convention's own ladder. The six criteria, `## What was found`,
  `suggested_by`, `touches:` and the `Absorbs: T-239-s5` line are
  byte-identical (`diff` empty). `touches:` was NOT widened.
- **STAMP.** `currently v0.1.11` at base and tip; the diff carries zero
  lines matching `currently v`. The rust suite, which contains kit.rs's
  `snapshot_version_matches_the_live_method_stamps`, is green.
- **T-216-s6 UNTOUCHED.** Blob `98d1ac30c9fd4fc19b413e4665b5ad54225f3fc4`
  at base and tip. The lane says on ITS OWN card that the absorption
  happened; the stamp remains the seat's act. `docs/CAPABILITIES.md` blob
  `c48d860c624b3e83a961b1cc50b0c78694e79b08` likewise unchanged, so the
  census was not regenerated inside the lane.
- **SECURITY.** No `--no-verify`, `sudo`, `chmod`, `rm -rf`, piped
  installer, `eval` or `base64` in any added line. The single
  `alwaysWritable` occurrence REAFFIRMS T-216-s6's refusal ("no lockfile
  added to `alwaysWritable`"); it does not reintroduce the refused
  option.

#### The six criteria

**1. The recipe suppresses identity auto-detection, and says why — MET.**
Exactly one recipe spelling exists in CONVENTIONS at the base and at the
tip, so there is no second, un-armed copy. The arming is SUPPRESSION, not
assignment: no `user.email`, `user.name` or `GIT_AUTHOR_*` value is set
anywhere in the bullet. The "why" carries all four things it needs — the
`GIT_CONFIG_*` pair nulls config FILES only; git then auto-constructs an
identity from `getpwuid` and the hostname; on a dotted hostname that
construction SUCCEEDS so the old recipe answered green; and a green there
reproduces no runner red. I swept the whole repository for other users of
the two-variable pattern: `golden-check.mjs` and `git-fixture.spec.ts`
both supply their own identity (local `user.email`/`user.name`, and
`GIT_AUTHOR_*` respectively), so neither carries the gap and no card is
owed for them.

**2. The recipe reproduces exit 128 at `0f6b37f` — MET, and the control
decides.** In a `git clone --shared` under the scratch directory,
detached at `0f6b37f`, three packages installed from that ref, whole-file
`npx playwright test tests/brief.spec.ts` from `tools/e2e/`,
`NPUTER_E2E_PORT=25256` (that ref predates the SUPERTASKR rename):

    ARMED, the recipe this lane publishes   exit 1   1 failed / 56 passed
        red body brief.spec.ts:3230, stopped at step 1 (stamp),
        git exit 128, "Author identity unknown / *** Please tell me who you are."
    UN-ARMED, the recipe as it was published exit 0   57 passed
        zero identity refusals — the false green the bullet now describes
    ARMED plus GIT_AUTHOR_*/GIT_COMMITTER_*  exit 0   57 passed
        zero identity refusals — the switch is inert against an env identity

The figures were re-derived here, not transcribed. **A TRAP WORTH THE
RECORD, which I walked into independently before reading that the
executor had walked into it too:** a `--shared` clone leaves its OWN
`main` at the source's tip, `checkout-currency` then answers STALE, and
the SAME body reds at step 3 (preflight) for an unrelated reason — so my
first three arms all read "1 failed / 56 passed" and the control appeared
not to discriminate. It discriminates only after `git branch -f main
0f6b37f` in the clone. The COUNT the criterion cites is therefore
reproduced by arrangements that LACK the property; what discriminates is
the step reached and the stderr. The executor disclosed this correction
in its report, which is the right call and is why its table and mine now
agree. T-256-s2 is filed so the next seat does not pay for it a third
time.

**3. One spelling, and the mapping retired rather than widened — MET.**
The doc's app/ setup line says `npm ci`; the `mapped` entry became
`{ kind: "verbatim", dir: "app", cmd: "npm ci" }`. No normaliser, alias
table, `startsWith`, case or whitespace tolerance, and no skip/ignore/
exempt list appears anywhere in the diff. Three data mutants, each on a
scratch copy in the clone, each landing read from `git diff` rather than
from the mutator:

    M1  the doc's app/ line back to `npm install`   4 failed / 18 passed
        BY NAME, both directions: "lists [app] npm install, which this spec
        has no entry for" AND "this spec expects [app] npm ci, which
        docs/CONVENTIONS.md no longer lists"
    M2  the `run from app/:` marker removed          5 failed / 17 passed
        "no longer carries exactly the four `run from <dir>/:` command
        bullets" — the class REQUIRES app/, it does not merely compare
        rows it happens to find
    M3  a scratch ci.yml whose app step says
        `npm install`                                2 failed / 20 passed
        "missing verbatim step: [app] npm ci" plus the unaccounted
        "[app] npm install" — so BOTH sides are read, and "the doc and CI
        say the same words" is enforced in both directions

M3 is mine; the executor's three drills all moved the doc or the spec and
none moved ci.yml, so nothing in its report established that the CI side
is read. It is. The 22 body names are byte-identical between base and
tip, so the suite was not made green by deleting or renaming anything.

**4. The fresh-worktree ORDER, in the order the preflight demands — MET.**
The sub-bullet now carries a sequence, not a parenthetical warning:
lib/parser `npm ci` and `npm run build`, then app/ `npm ci`, then app/
`npm run build`, then tools/e2e `npm ci`, then the suite. Both of the
preflight's preconditions have a named producing step. The order is
load-bearing, measured by removing each producer in the clone: with
`lib/parser/dist` absent the preflight refuses with "lib/parser/dist is
missing — ADR-011 build order"; with `app/node_modules` absent it refuses
with "app/node_modules is missing — run `npm ci` in app/ first"; with the
full order present, 22 passed. Note that the preflight's own message
already said `npm ci` for app/ — the doc had been contradicting a message
the suite has been printing all along.

**5. Suite green with the mapping gone, docs gate run with the budget line
— MET.** The parity spec alone at the tip: exit 0, 22 passed, unfiltered,
whole file. The docs gate on CONVENTIONS exits 1, which is its FIRES
signal naming the suites the path owes, and prints
`governing-document budgets hold — 4 gated`. CONVENTIONS moved 129,306
bytes at the base to **131,328** at the tip, against the band landed
117,502 / warn 146,878 / fail 176,253 — 15,550 bytes of headroom, and the
band itself is UNCHANGED because `docs-scan.mjs` is outside the diff. I
checked that a passing budget line means something: adding filler to a
scratch copy produces "budget WARN — 147239 bytes against its
146878-byte warn line" and then "OVER BUDGET — 176839 against its
176253-byte fail line".

**6. The brief's build rows — MET, and the IF is TRUE.** I settled the
antecedent without touching either assembler: a sentinel command in a
scratch copy of the doc propagated into the brief's row 7, so the rows are
DERIVED, not hand-listed. At the tip, row 7 prints `from app/: npm ci`,
stamped to this ref with the provenance "docs/CONVENTIONS.md Build and
test, verbatim". `brief.mjs` is the runnable half of `dispatch-brief.mjs`
and imports from it, so the dispatch brief the criterion names is the one
exercised. Neither file was edited.

#### The suites, at my own tip

    gate-run.mjs parser   exit 0   389 bodies    GREEN
    gate-run.mjs app      exit 0   1171 bodies   GREEN
    gate-run.mjs rust     exit 0   654 bodies    GREEN   (18 targets)
    gate-run.mjs e2e      exit 0   742 bodies    GREEN   (port 25256)
    capabilities:check    exit 0   CURRENT (63548 bytes)
    index --check         exit 0   CURRENT

The rust figure reconciles with the report's "650 bodies": the per-target
sum is 650 passed plus 4 ignored, and gate-run counts both. No
discrepancy.

**The card's own point held for me.** This bench was a fresh worktree with
nothing installed. Running the tip doc's order verbatim: lib/parser
`npm ci` and `npm run build`, app/ `npm ci` (499 packages), app/
`npm run build`, tools/e2e `npm ci` — every one exit 0, and
`git status --porcelain` EMPTY after each, which is the whole reason the
fence permits `npm ci` and refuses `npm install`. **I could not reproduce
the exit 243 EACCES premise here**, and say so plainly: a detached bench
is not on a lane branch, so the physical layer is not armed at this seat.
That premise rests on T-216-s6's three-lane measurement, which is a
record I read rather than a thing I re-ran.

#### What I checked and did NOT find

- A hypothesis of my own, disproved before it became a correction:
  `brief.spec.ts`'s `noIdentityEnv()` also deletes `EMAIL`, which the new
  bullet does not name. On git 2.50.1 `EMAIL` is inert under
  `useConfigOnly` — the recipe plus `EMAIL`, and even plus `EMAIL` with
  both NAME variables, still exits 128; only the full
  `GIT_AUTHOR_*`/`GIT_COMMITTER_*` set defeats the switch. The published
  sentence names exactly the variables that matter and is complete.
- T-256-s1 is legal (`status: suggested`, `suggested_by` set, `touches`
  naming three files) and accurate. My independent sweep found the same
  three, and the card names a FOURTH my grep missed — `bin/app-dev.mjs`
  at the `runStep(4, "install app", "npm", ["install"], ...)` call, where
  the spelling is split across the argv and no `npm install` grep matches
  it. I verified that line, and verified the relaunch bullet it leans on:
  `npm ci` beside a live app does delete `node_modules/.vite`. Its
  refusal to rename the launcher is correct.

#### One limitation of the executor's evidence, noted not charged

The report's restoration proof cites a sha256 for `docs/CONVENTIONS.md`
that matches NO revision in the lane's history — not the base, not any of
the four commits. The parity spec's companion hash matches `cf7c690`
exactly. The likeliest reading is benign: the drill ran on an uncommitted
tree that was polished before `cf7c690`, and the hash's only job, pre
equals post, is served. But it is a figure without a ref and I could not
re-derive it. It costs this verdict nothing, because C3 rests on my own
three mutants rather than on the executor's drill.

Recorded for the seat: `main` has moved past the `f298b81` the report
forecast against, so the merge forecast is re-derived at the merge, as
the report itself asks.

#### Step 7 — the gates my own writes owe, re-run at the tip I created

**Every figure above the line was measured at `8e9a9f5`, the commit under
review.** Appending this verdict and filing two cards created
`d686ef4bfd2fb1b016661f7a43b71696cab0377a`, a tip nobody had tested, so
the gates that read cards were asked again there. The docs gate, run on
my own three written paths, FIRES and names three suites; all three are
green at my tip:

    gate-run.mjs parser   exit 0   389 bodies    GREEN   ref d686ef4
    gate-run.mjs app      exit 0   1171 bodies   GREEN   ref d686ef4
    gate-run.mjs e2e      exit 0   742 bodies    GREEN   ref d686ef4
    method-evals/run.mjs  exit 0   10 model-free evals
    docs-gate.mjs (my 3 card paths)  FIRES; every live task card's
        frontmatter parses with a legal status; 0 injection hits;
        governing-document budgets hold

The method eval gate was run because this verdict adds two lines matching
the `attack set: sha256:<hex> (<file>)` citation grammar under
`docs/tasks/`. `cargo test` is NOT owed by these writes: the docs gate
names it only for `docs/CONVENTIONS.md`, which my commit does not touch —
it was nonetheless green at `8e9a9f5` in the battery above.

## Corroborations

- **2026-09-09, the `T-203-s1` executor, at base `c2a0952`** — a second
  instance, reproduced from a cold lane worktree rather than from a
  brief's transcription. `npm install` from `app/` in
  `/Users/ujju/Projects/nputer-T-203-s1` exited **243** with
  `npm error code EACCES` / `npm error path .../app/package-lock.json`
  / `errno -13`; `ls -l` shows the lockfile at mode `-r--r--r--`, which
  is the lane fence's own read-only chmod on a tracked file outside the
  fence. `npm ci` in the same directory exited **0** and the worktree
  went on to run parser (389 bodies), app (1171) and e2e (743) all
  GREEN. So the finding is not particular to the seat that first
  reported it: **every fresh lane whose fence excludes `app/` meets it**,
  and the only reason it is not louder is that the failing command is
  the FIRST thing a lane runs, so it reads as a broken worktree rather
  than as a documented command being wrong.

## Absorbs: T-216-s6 (2026-09-09, at the merge — the architect seat)

A fresh lane cannot run CONVENTIONS' own setup command — `npm install` from app/ dies EACCES on app/package-lock.json under the physical layer. The carrier of the lockfile class (it absorbed T-223-s1 and T-230-s2; its TRIAGE ruled the lane's setup spelling `npm ci` from app/ and REFUSED a lockfile in alwaysWritable) is satisfied by this card's change: the Build & test line and the fresh-worktree ORDER say `npm ci`, and the parity spec holds it. The file is removed in this commit; this line is the surviving record. T-238-s5, the third filing, was withdrawn at T-238-s1's merge.
