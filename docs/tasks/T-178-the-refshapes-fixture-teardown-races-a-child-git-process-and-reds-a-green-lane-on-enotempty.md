---
id: T-178
title: The refShapes fixture teardown reds a passing body on ENOTEMPTY — rmSync races something still writing inside the cloned fixture's .git/objects, and the assertion it interrupts had already passed
feature: F-06
milestone: 4
priority: 23
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
suggested_by: standing triage sitting #4 (2026-08-30) — CI run 33327281402, diagnosed at this seat
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**CLASS SEARCH FIRST, PER TASK-FORMAT.** `command grep -rli "ENOTEMPTY"
docs/tasks/` returns nothing at `b60b06d`, and the nearest neighbours are
about different mechanisms: `T-161` is a child-process STDERR drain race
in the app crate, `T-130` is fixture MTIME restoration. **No card owns
the fixture-teardown class**, so this is a card rather than a
corroboration.

## The sighting

CI run **33327281402** (main, the dispatch-stamps commit at `27f609d`'s
predecessor), step `e2e lane`, one failure out of 332:

    ✘ 42 [chromium] › tests/brief.spec.ts:1000:1 › the WHOLE brief
      assembles on a pull_request-shaped checkout, and names the ref it
      actually spent (2.6s)
    Error: ENOTEMPTY: directory not empty, rmdir
      '/tmp/t153s9-refshape-joRss6/local/.git/objects'

**The body's own assertions had already passed** — the error is raised
from the `finally` block, not from an `expect`. `331 passed, 1 failed`,
and the step's failure skipped the boot gate behind it.

## The mechanism, read at `b60b06d` rather than guessed

`refShapes()` (`tools/e2e/tests/brief.spec.ts`, the helper opening
`mkdtempSync(path.join(os.tmpdir(), "t153s9-refshape-"))`) builds three
checkout shapes by shelling `git` — an `archive` piped into a local
tree, then `git clone --quiet local detached`, then an orphan variant.
Two bodies tear the whole directory down with

    rmSync(fx.dir, { recursive: true, force: true });

`force: true` suppresses *missing*-path errors; it does not retry, and
`ENOTEMPTY` on `rmdir` is not a missing path. Node's own remedy for this
exact class is `maxRetries`/`retryDelay`, which this call does not pass.

**WHAT IS STILL WRITING IS THE QUESTION THE LANE MUST ANSWER, NOT
ASSUME.** `git clone` can leave a short-lived background process
(`git gc --auto` is the usual suspect, and a clone's own pack/index
finalization is the other), and a directory whose child appears between
`readdir` and `rmdir` is precisely what `ENOTEMPTY` means. The card
deliberately does not name the culprit: the sighting is one CI run on a
shared Linux runner, and this project's rule is that a race gets its
mechanism READ, with a reproduction, before it gets a fix.

## Why it is worth a card and not a rerun

It is **noise that lands on somebody else's lane**. The body reds after
passing, in a spec about ref shapes, on a commit whose diff has nothing
to do with either — the same attribution problem the DOCS GATE exists to
prevent, arriving through a fixture instead. The next session to see it
will spend the same twenty minutes deciding whether main is broken. It is
also not alone: `T-161` is a CI-only intermittent of a different
mechanism (a stderr drain race in the app crate) live on this
repository at the same time, and **that PAIR — enumerated, not
counted** — is the fact that argues for writing both down rather than
re-running until green — the POISON DRILL bullet's own
warning that re-running until green is a defect's healing mechanism, not
evidence.

## Acceptance criteria

- THE lane SHALL name what still holds a handle inside the fixture's
  `.git` at teardown, from the code and a reproduction, rather than
  hardening the teardown against an unnamed cause.
- THE teardown SHALL stop failing a body whose assertions passed:
  either the fixture waits for what it spawned, or the removal retries —
  and IF a retry is the answer THEN the wait SHALL be bounded and the
  reason written beside it.
- A teardown failure SHALL NEVER be reported as a test failure of the
  body it follows: if the removal cannot complete, it is the FIXTURE's
  finding and SHALL say so by name.
- THE sweep SHALL cover every `rmSync` teardown in `tools/e2e/tests/`
  that removes a directory built by shelling `git`, and its result SHALL
  be recorded EVEN IF EMPTY (CONVENTIONS, A FIX NAMES ITS CLASS AND ITS
  SWEEP).
- Verification: headless, `npm test` from tools/e2e/.

## Implementation notes
<!-- executor appends before finishing -->

**Built at `d5dc33c` on branch `task/T-178-fixture-teardown`, base
`f96f609`. Host: Darwin 25.6.0, node v22.22.0, git 2.50.1 (Apple
Git-155). Every figure below was measured in this lane unless it names
another source.**

### THE MECHANISM, NAMED — it is the fixture's OWN commit, detached

`git commit` ends by calling git's `run_auto_maintenance()`, which
spawns `git maintenance run --auto --quiet --detach`. **`--detach`
daemonizes**, so the foreground `git commit` reaps the intermediate and
returns while the GRANDCHILD keeps running inside the fixture's `.git`.
`refShapes()` commits twice, so it detaches twice.

Traced with `GIT_TRACE` over the real fixture build (the whole tree,
1025 tracked files at `f96f609`, 1171 loose objects in `local/.git`):

    run-command.c:673  trace: run_command: git maintenance run --auto --quiet --detach
    run-command.c:765  trace: start_command: .../git maintenance run --auto --quiet --detach
    git.c:476          trace: built-in: git maintenance run --auto --quiet --detach

**THE DETACH HAPPENS AT CI'S DEFAULT CONFIG TOO**, which is the half
that matters and the half a guess would have skipped. `GIT_TRACE2_EVENT`
over the same commit, `gc.auto` unset:

    SID ...P0000124f  argv: git maintenance run --auto --quiet --detach
      region_enter maintenance detach
      exit 0                              <the intermediate, after fork>
      region_leave maintenance detach
      exit 0                              <the daemonized grandchild>

Two `exit` events from one session id is the daemonize fork, recorded by
git's own instrumentation.

**WHERE IT WRITES, MEASURED RATHER THAN ASSUMED.** With `gc.auto=1` (the
same code path, threshold lowered so the child has work), polling the
fixture's `.git`:

    git commit returned after                       73ms
    .git/gc.pid                                    +108ms
    .git/objects/pack/tmp_pack_A3Upb4              +207ms
    .git/objects/pack/pack-<sha>.{pack,idx,rev}    +529ms
    .git/objects/info/commit-graph.lock, packs     +596ms
    .git/objects/info/commit-graph                 +627ms
    last live maintenance/gc process observed       562ms
    => a background git process outlived the foreground commit by ~490ms

Those land in exactly two directories: the fixture's `.git` and its
`.git/objects`. **They are the two paths the CI errors named** — run
33327281402 on `.../local/.git/objects`, run 33333142954 on
`.../local/.git`. The card was right to refuse to pin `objects`.

**AND THE DEFAULTS-PATH WRITER IS `objects/maintenance.lock`.**
`git maintenance run` serialises on a lock file, and the path was
identified by holding each candidate and watching whether an amplified
maintenance run still packed:

    no lock held                        -> packs after maintenance: 1
    .git/objects/maintenance.lock held  -> packs after maintenance: 0   <THE LOCK>
    .git/maintenance.lock held          -> packs after maintenance: 1
    .git/gc.pid held                    -> packs after maintenance: 1

So the lock the detached child takes is a file created **inside
`.git/objects`**, before any task is evaluated — which is what puts a
straggler in that directory even on a run where gc declines to pack.

**THE SAME RACE, CAUGHT FROM THE OTHER SIDE.** While reproducing, an
amplified run died in the fixture's own `git clone`:

    fatal: hardlink different from source at
      '/var/folders/.../t153s9-refshape-smg8UQ/detached/.git/objects/pack/tmp_pack_I9eihS'

That is `clone_local` hardlinking `local/.git/objects/pack/` while the
detached child rewrote it. One mechanism, two symptoms — and it is
independent evidence that the detached writer really is live while the
fixture's foreground work continues.

### THE REPRODUCTION — what reproduced, and what plainly did not

**NOT REPRODUCED: the ENOTEMPTY symptom itself, on this host.** Said
plainly, as the card demands. The teardown was driven with the exact
call the two bodies made (`rmSync(dir, {recursive: true, force: true})`)
over the real fixture, in these arms, each isolating one variable:

    full fixture, amplified (gc.auto=1)            25 iterations   0 ENOTEMPTY
    full fixture, amplified + maintenance.auto=false  25 iterations   0
    minimal (commit then teardown), amplified      30 iterations   0
    minimal, amplified + maintenance.auto=false    30 iterations   0
    minimal, stock (CI's config)                   30 iterations   0
    minimal, stock + maintenance.auto=false        30 iterations   0
    all four minimal arms again under 3x CPU oversubscription
      (30 burner processes on 10 cores)            120 iterations  0

**What was ruled OUT by those arms**, which is the useful half:

- It is not Node's `rmSync` losing to a straggler in general. A writer
  recreating files inside the target throughout the walk did not produce
  ENOTEMPTY on node v22.22.0 / APFS; the recursive removal re-reads and
  re-removes. Both CI sightings are on Linux, and the filesystem and
  scheduling are the difference this lane could not cross.
- It is not `git clone` spawning maintenance: traced, a clone spawns
  none, in either direction.
- It is not the fixture's `git init` or `git add`: neither calls
  `run_auto_maintenance`.
- It is not gc's PACKING at CI's config: `too_many_loose_objects` samples
  `objects/17`, which holds 6 to 7 entries here against a threshold of
  ceil(6700/256) = 27, so gc declines. What survives at defaults is the
  detach itself and its lock, not a repack.

**REPRODUCED INSTEAD, and re-runnable by the verifier:** the detach (the
`GIT_TRACE` and `GIT_TRACE2_EVENT` transcripts above, both at default
config), the writer's landing zones (the timing table), the lock path
(the four-arm table), and the clone-side collision. The scripts that
produced every one of them are transcribed under "how to re-run" below.

### THE SWEEP — the class, the search, and it is NOT empty

CLASS: an `rmSync` teardown in `tools/e2e/tests/` over a directory built
by shelling `git`. The mechanism-shaped subset is narrower and is the
one that carries the defect: a spec that **commits** into a fixture it
later removes, because the commit is what detaches the writer.

THE SEARCH, shown capable of failing before its result was written down
(it returns the known-positive `brief.spec.ts` among others, and it
returns nothing for the two specs that shell no git):

    command grep -rn "rmSync" tools/e2e/tests/
    command grep -n '"\(commit\|merge\|fetch\|pull\|rebase\|am\|clone\)"' tools/e2e/tests/*.spec.ts

RESULT, at `f96f609` — five files hold a git-built teardown, three of
them commit:

    tests/brief.spec.ts           2 commits, 2 clones, 2 teardowns   REPORTED SITE
    tests/card-preflight.spec.ts  3 commits, afterAll teardown       SAME SHAPE, fixed
    tests/lane-fence.spec.ts      3 commits, afterAll teardown       SAME SHAPE, fixed
    tests/docs-input-gate.spec.ts init + add only, 2 teardowns       in class, no commit
    tests/health-bands.spec.ts    git only against the REAL repo     not in class
    tests/boot-check-guard.spec.ts  shells no git at all             not in class

**The two siblings are the sweep's whole point** — neither was named on
the card, and both had the reported site's exact shape.
`docs-input-gate.spec.ts` carries the protection too although it never
commits, so the rule over git-built fixtures is uniform rather than
argued per site.

### WHAT WAS BUILT — two halves, and not either

New module `tools/e2e/tests/git-fixture.ts`, carrying the mechanism in
its header:

1. `NO_BACKGROUND_MAINTENANCE` = `["-c", "maintenance.auto=false"]`,
   spread into every fixture git call. **It removes the CAUSE**: git
   spawns nothing to race. Verified with a positive control — a plain
   commit's trace holds 3 maintenance lines, the same commit with the
   config holds 0. `gc.auto=0` is the weaker neighbour and is
   deliberately NOT used: it lets the detached process start and only
   declines to pack, so a window still opens. Drill D4 pins that
   difference.
2. `removeGitFixture(dir, fixture)` — the teardown. It passes Node's own
   remedy for this class, `maxRetries: 5, retryDelay: 50`, which the
   un-retried call did not: `force: true` suppresses MISSING paths, and
   `ENOTEMPTY` on `rmdir` is not a missing path. **The wait is BOUNDED
   and the bound is written beside it**: Node backs off by
   `i * retryDelay`, so the worst case is 50+100+150+200+250 = 750ms,
   paid only on a directory that failed to go and never on a healthy
   teardown, against a window measured at ~490ms above.
3. **THE ATTRIBUTION, which is the criterion that mattered most.** A
   removal that still cannot finish does NOT throw. It reports a finding
   that names the FIXTURE, the tree, the cause and the sentence "NOT A
   FAILURE OF THE BODY IT FOLLOWS", and returns it to the caller. The
   body's verdict stands. Nothing is swallowed silently: the finding
   reaches the run log and, inside a test, an annotation.

The second half exists because the first cannot prove what a FUTURE git
will detach — and because this lane could not reproduce the symptom, the
residual is real and is answered rather than argued away.

Four bodies in `tools/e2e/tests/git-fixture.spec.ts` pin it, including a
census that turns the sweep into a standing check: any spec that commits
into a fixture it removes must spread the config and call the teardown.
Its detector is shown capable of both answers, and its census is
asserted non-empty, before either is spent.

### THE DRILL LEDGER — six mutants, six kills, and one that had to be earned

Each: committed first, ONE side mutated (the code under test, never a
literal the assertion shares), the mutation read back with `git diff`,
the suite run, the RED required, then
`git restore --source=HEAD --staged --worktree` and a sha256 against the
committed blob.

    D1  FIXTURE_RM_RETRY.maxRetries 5 -> 6        exit 1  killed the BOUNDED body
    D2  the teardown rethrows instead of reporting exit 1  killed the ATTRIBUTION body
    D3  the finding stops naming the fixture       exit 1  killed the ATTRIBUTION body
    D4  the knob becomes gc.auto=0                 exit 1  killed the DETACH body
    D5  a sibling drops the config                 exit 0  SURVIVED
    D5r the same mutant, census repaired           exit 1  killed the CENSUS body
    D6  a sibling drops the protected teardown     exit 1  killed the CENSUS body

Restoration proved on every one; `git-fixture.ts` restored to
`cced5d58c02256f77375561072f52352e267bf9db31a00eba616beeef8a7268c` each
time, matching `git show HEAD:<path> | shasum -a 256`.

**D5 IS THE ONE WORTH READING.** It deleted
`...NO_BACKGROUND_MAINTENANCE` from `card-preflight.spec.ts`'s git
helper and the census body **stayed green**. The check asked whether the
source contained the NAME, and the unused `import` line still did — a
vacuous assertion, caught only because the mutant was run. The pins are
now the SPREAD and the CALL, neither of which an unused import can
spell, and D5r and D6 both kill against the repair. Committed as its own
change (`d5dc33c`) so the repair is legible.

### GATES, every exit read unpiped

    npm test          from tools/e2e/   exit 0   339 passed (3.9m)  @ d5dc33c
    npm run typecheck from tools/e2e/   exit 0   @ d5dc33c
    npm run lint:tokens from tools/e2e/ exit 0   TOKEN 161 files, CONTROL 1007
    npm run capabilities:check          exit 1   STALE, and ROUTED below

The lane's own setup ran first, in the ADR-011 order: `npm ci` and
`npm run build` from lib/parser (exits 0, 0), `npm install` from app/
(exit 0). The e2e lane needs them — its webServer runs the app's vite,
and `assertLanePreconditions` refuses a worktree without
`app/node_modules`. Port DERIVED from the card id, `NPUTER_E2E_PORT`
14178, lsof'd to zero rows immediately before each bind. Port 1420 was
never probed.

339 is measured at `d5dc33c`. The four bodies this card adds account for
the delta from the base; the base's own count was not separately
measured in this lane.

### THE STANDING GATES, DERIVED from this lane's own merge forecast

Main moved during the lane, from the dispatch base `f96f609` to
`cdde033`. The gate set below is derived against the tree the merge
WOULD have — `git merge-tree --write-tree cdde033 HEAD`, exit 0, no
conflict — which is the forecast the RANGE RULE prescribes and which
does not move when this notes commit lands, because that commit only
touches a `docs/tasks/` path the list already holds.

    the merge's diff: 7 paths
      docs/tasks/T-178-...-enotempty.md
      tools/e2e/tests/brief.spec.ts
      tools/e2e/tests/card-preflight.spec.ts
      tools/e2e/tests/docs-input-gate.spec.ts
      tools/e2e/tests/git-fixture.spec.ts
      tools/e2e/tests/git-fixture.ts
      tools/e2e/tests/lane-fence.spec.ts

    GRAPH REGEN       FIRES      6 of 7 paths are *.ts outside docs/
    BOOT GATE         NOT OWED   0 paths under app/src-tauri/**, app/src/**,
                                 and neither manifest is touched
    DOCS GATE         FIRES      1 path under docs/ is a code input
    METHOD EVAL GATE  NOT OWED   0 paths under method/**

THE DOCS GATE, run in its one spelling from the repo root and fed the
RANGE RULE's own path list (under `bash`, because zsh does not split an
unquoted command substitution and the gate would have read all seven
paths as one), answered **exit 1 — FIRES**, naming this card as a code
input to ten readers across three suites. All three were run and all
three are green:

    npx vitest run  from lib/parser/   exit 0   344 passed, 16 files
    npm run build   from app/          exit 0   (order-dependent, run first)
    npm test        from app/          exit 0   1059 passed, 49 files
    npm test        from tools/e2e/    exit 0   339 passed

### ROUTED, not silently omitted

**`docs/CAPABILITIES.md` IS STALE AND IS OUTSIDE THIS FENCE**
(`touches: [tools/e2e]`). Four test names were added, so
`npm run capabilities:check` answers exit 1: committed 26693 bytes, a
fresh generation is 27026. **The integrator regenerates it with
`npm run capabilities` from tools/e2e/ at the checkpoint** — this lane
may not, and widening the fence from inside the lane is the one repair
this seat may never make. It is a CI step since T-153-s8, so it reds
until regenerated.

### CEREMONY, read rather than assumed

`tools/e2e` reaches no `KIT_FILES` entry and no shipped slug, so this
card falls on TASK-FORMAT's "S, diff outside shipped code" row, whose
pipeline makes the executor its own integrator and would have it stamp
`done`. **The dispatch instructed `status: verifying` and forbade the
merge.** That is a restriction rather than an expansion, so it is obeyed
and recorded here: the merge, the checkpoint and the worktree removal
are left to whoever holds them.

### HOW TO RE-RUN THE MEASUREMENTS

Every transcript above came from a standalone script; none is part of
the suite. The shortest path to each, from any checkout:

- THE DETACH: `GIT_TRACE=<file> git commit` in a fixture repo, then look
  for `maintenance run --auto`. The control is the same commit with
  `-c maintenance.auto=false`, which yields none.
- THE DAEMONIZE AT DEFAULTS: `GIT_TRACE2_EVENT=<file> git commit` in a
  repo built from `git archive HEAD` of this tree, and read the
  maintenance session's `region_enter maintenance detach` and its two
  `exit` events.
- THE LANDING ZONES: set `gc.auto=1` in the fixture, commit, and poll
  `.git` and `.git/objects` for new entries.
- THE LOCK PATH: with `gc.auto=1`, pre-create each candidate lock and
  run `git maintenance run --auto --no-detach`; the path that leaves
  zero packs behind is the lock.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

## CORROBORATION (2026-08-30) — the SECOND sighting, and this one redded MAIN

CI run **33333142954**, main at `2489b0f` — a **docs-only** commit
(docs/ROADMAP.md, docs/rooms/governing-docs.md, one card). Step `e2e
lane`, one failure of 332, the same body:

    ✘ 42 [chromium] › tests/brief.spec.ts:1000:1 › the WHOLE brief
      assembles on a pull_request-shaped checkout, and names the ref it
      actually spent (2.0s)
    Error: ENOTEMPTY: directory not empty, rmdir
      '/tmp/t153s9-refshape-QDWTIx/local/.git'

**WHAT THE SECOND SIGHTING ADDS, beyond confirming the class is real:**

1. **IT REDS MAIN, NOT ONLY A PUSH.** The first sighting (run
   33327281402) landed on an intermediate commit. This one is main's own
   tip, on a diff that touches no code at all — so the failure is
   provably independent of what was merged, and it is now the second
   uncarded-until-today intermittent able to red a green tree (`T-161`
   is the first).
2. **THE PATH DEPTH MOVED AND THE MECHANISM DID NOT.** First sighting
   removed `…/local/.git/objects`; this one `…/local/.git`. Same
   fixture stem (`t153s9-refshape-`), same clone, same `rmSync(fx.dir,
   {recursive: true, force: true})`. **Cite the mechanism, not the
   path** — a card that pinned `objects` would already read as fixed.
3. **THE COST IS CONFIRMED AS THE ONE THE CARD PREDICTED**: the `e2e
   lane` step failed, so `xvfb tauri boot` behind it never ran. One
   fixture teardown hides a gate.

Second measurement fired immediately at this record (`gh run rerun
33333142954 --failed`), the same protocol `T-161`'s card uses; its
result stands in the checkpoint that cites this card.

**PRIORITY ARGUMENT FOR THE NEXT SITTING, recorded rather than acted on
here:** two reds in one evening, both on other people's work, is the
threshold this project usually treats as promotion-worthy. It is already
`planned` and fenced `[tools/e2e]`; what it wants is to be NEXT in that
package rather than to be re-argued. It contends with `T-112-s3`, which
holds `tools/e2e` right now.

**THE SECOND MEASUREMENT CAME BACK GREEN.** Run 33333142954 **attempt
2** — the same failed job re-run on the SAME commit `2489b0f`, no code
changed — completed **success**. So the failure is INTERMITTENT and not
reproducible on demand, which is what separates this from a defect a
lane can walk up to and fix.

**AND THAT IS THE WARNING, NOT THE ALL-CLEAR** (the POISON DRILL
bullet's own sentence, one layer up): re-running until green is a
defect's healing mechanism, not evidence about it. Two reds and one
green re-run mean the race is real and rare, not that it is closed. A
lane taking this card SHALL NOT treat "I could not reproduce it" as the
finding — it has to read what holds a handle inside the fixture's `.git`
at teardown and show the mechanism.
