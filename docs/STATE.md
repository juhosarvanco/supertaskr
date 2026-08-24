# State

Updated: 2026-08-24 by the T-090 integrator (executor-integrator, size S).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: there are NO LIVE
LANES.** `git worktree list` returns one entry, the main checkout —
T-090's is removed in the same breath as this commit, in the order
lane-protocol rule 6 fixes (merge, then checkpoint, then remove) — and
zero cards sit at `status: building` or `status: verifying`. Every fence
in ARCHITECTURE's slug table is free. **This checkpoint closes a
three-lane dispatch**, and a reader picking the project up should see the
day whole rather than only its last third:

| lane | fence | merge | checkpoint |
|---|---|---|---|
| **T-088** — dispatch is a declared component before it is a directory | `[docs/architecture/components/, lib-parser, app-shell]` | `bd5864b` | `2daddee` |
| **T-113** — the tail stops repeating the denials it just announced | `[app-agent]` | `e231e79` | `0eeadf0` |
| **T-090** — the DOCS GATE becomes a named command | `[tools/e2e, .github/, docs/CONVENTIONS.md]` | `e5ecadb` | this commit |

All three were cut from `9b03ae6` as pairwise-disjoint fences and all
three merged without a conflict — `git merge-tree --write-tree` exited
**0** for each. **The pre-cut dispatch stamp was exercised for the first
time on this dispatch** and held for all three cards, which is the lapse
four earlier checkpoints could only note.

## Just completed

**T-090 — the third standing gate stops being the only one nobody is
obliged to run, and the invocation the doc printed stops eating the exit
codes it exists to distinguish.** F-06, milestone 4, size S,
`touches: [tools/e2e, .github/, docs/CONVENTIONS.md]`, **fence never
widened**. Built and self-integrated by `claude-opus-5 @T-090`;
`review: self-verified`. Main-before **`0eeadf0`**, lane tip
**`4c41454`**, merge **`e5ecadb`**, this checkpoint after it. The card
was stamped `building` before the cut and this checkpoint stamps `done`.

**WHAT LANDED.** The gate is now a named command in three places at once
— `lint:docs` in `tools/e2e/package.json`, the command in CONVENTIONS'
`run from tools/e2e/:` bullet, and a step in `.github/workflows/ci.yml`
with its `CI_SEQUENCE` entry beside it. It could not be one before for a
mechanical reason rather than a preference: adding a command to that
bullet puts it in the section `workflow-parity.spec.ts` DERIVES from, so
the command must arrive with its workflow step or its `LOCAL_ONLY`
argument in the SAME change — and T-084's fence could not reach
`ci.yml`.

**EIGHT PATHS.** 0 added / 8 modified, 1235 insertions, 103 deletions. No
Rust, no IPC, no grant, no `tokens.css`, no lockfile, and **no
`app/package.json` or `Cargo.toml`** — `tools/e2e/package.json` is in the
diff but gains a SCRIPT, not a dependency, so `package-lock.json` is a
0-file diff and `cargo audit`'s inputs are untouched.

## BE PRECISE ABOUT WHAT CI NOW HOLDS, BECAUSE THE DIFFERENCE IS WHAT IS STILL OWED BY HAND

The CI step runs the gate's **WHOLE-TREE half** — every live card's
frontmatter, the root-anchor account, the unlinkable-reader tripwire —
and judges **no diff**, because a workflow has no "merge's diff" to be
handed and the tool deliberately computes no range of its own. That is
not the lesser half: **both incidents this gate was built for are in
it** (`9c64cd8`, two card titles opening with a backtick; `fede266`, a
`status:` outside the vocabulary).

**THE DIFF HALF IS STILL A RITUAL.** Nothing but an integrator running
the two printed lines makes a merge answer for the suites it owes. The
DOCS GATE bullet now says so in as many words instead of letting a green
CI imply otherwise. **Do not read "the docs gate is a CI step" as "the
docs gate is covered."**

## THE MATRIX, AND THE COLUMN THAT IS HONESTLY EMPTY

The card required the four codes to survive the printed invocation **on
both `xargs` implementations or on neither**. They survive on neither, so
the doc prints a spelling with no `xargs` in it:

    TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

**That string is now character-for-character identical in CONVENTIONS
and in `docs-gate.mjs`'s own header, and a body holds them equal** —
mutating either copy reds it (T-057's actual close; for six weeks the doc
said "call it directly" while the script's own header printed the pipe).

Measured at `9b03ae6` on Darwin 25.6.0 against `/usr/bin/xargs`, the only
`xargs` on this machine's PATH: **BSD `xargs` never invokes the utility
on empty input** — verified with an on-disk marker, so "did it run" is
observed rather than inferred — so a range command that FAILED exits
**0** with the gate never running, and **every nonzero utility exit
collapses to 1** (one invocation per code over 1, 2, 3, 4, 5, 100, 123,
125, 126, 127, 255). Two of the four codes die, both toward "everything
is fine".

**THE GNU COLUMN IS NOT MEASURED AND THIS CHECKPOINT WILL NOT PRETEND
OTHERWISE.** There is no GNU `xargs` on this machine and no container
runtime to borrow one from — both probed at `9b03ae6`; `docker version`
fails on a missing socket. GNU's documented mapping (utility exits 1–125
become **123**) is cited as documentation, not as a measurement. **It
closes at the repository's first GitHub push**, when the ubuntu runner
executes the new `npm run lint:docs` step for the first time — the same
"dormant until first push" standing every other CI claim in this repo
has. A mapping quoted without its platform is wrong on one of them.

## FOUR SPELLINGS OF ONE PATH WERE ANSWERED "NOT OWED" AT EXIT 0, AND THE OBVIOUS FIX WAS THE WRONG ONE

`T-101-s3` (confirmed three times, no owner) and `T-064-s7` are absorbed
and closed. `docsGate` matched `docs/`-prefixed strings and nothing else,
so on `docs/CONVENTIONS.md` — a path owing two suites — measured at
`9b03ae6`:

| spelling | before | after |
|---|---|---|
| `docs/CONVENTIONS.md` | 1 | 1 |
| `./docs/CONVENTIONS.md` | **0** | **1** |
| absolute | **0** | **1** |
| `../../docs/…` from tools/e2e | **0** | **1** |
| `""` or `"   "` | **0** | **2** |
| a newline-joined blob | 1 by luck | **2** |
| a path outside the repository | **0** | **2** |

**THE CARRY-FORWARD IS THAT THE SUGGESTED FIX MOVED THE DEFECT RATHER
THAN REMOVING IT.** `T-101-s3` proposed resolving every argument against
the cwd. That closes `../../docs/…` and OPENS its mirror: `docs/X` typed
from tools/e2e then resolves to `tools/e2e/docs/X` and answers *"not
owed"* at **0**. The executor built that, measured the mirror at exit 0,
and changed it — a plain relative path away from the repository root now
has two readings, **both are printed, and the run is CALLED WRONG**.
`./`, `../` and absolute spellings are unambiguous by definition and are
answered. **Trading one false-clean for another is not a fix**, and the
only reason it was caught is that the drill row existed before the fix
did.

**One half of `T-101-s3` is deliberately NOT built**: "a path that is not
tracked is exit 2". A merge's diff names paths the working tree at either
endpoint does not have — everything a lane ADDED is absent from the main
checkout before the merge — so an existence check would refuse the
pre-merge forecast the RANGE RULE prescribes. It is named as undone on
purpose in `normalisePaths`' own comment, not overlooked.

## A FALSE SENTENCE WAS DISPROVED BY WALKING INTO IT — AND WHAT IS ACTUALLY SILENT IS A SHAPE

CONVENTIONS' CI bullet claimed the parity derivation *"is silent in
exactly ONE case, a command the DOC gains that the spec does not yet
claim"*. **That is the case it is LOUDEST about.** The command went into
the bullet first, with no `CI_SEQUENCE` entry, and the lane failed **1 of
14 at exit 1**:

> docs/CONVENTIONS.md "Build & test" lists [tools/e2e] npm run
> lint:docs, which this spec has no entry for — add it to CI_SEQUENCE
> (verbatim or mapped, with the workflow step) or to LOCAL_ONLY with the
> reason CI does not run it.

The correction names the loop (`for (const key of doc.keys())`) rather
than restating a tally. **And the replacement claim was measured rather
than asserted**: what is silent is a SHAPE, not a direction — a command
written into a bullet carrying no `run from <dir>/:` marker, invisible to
every loop by construction. Pinned by a fixture that asserts the silence
AND carries a positive control, so it cannot pass because a splice
quietly failed.

**A FIGURE IN THAT BULLET WENT STALE INSIDE THE LANE THAT WAS EDITING
IT.** The middle-dot cost was written as "NINETEEN to SIXTEEN"; adding
two commands made it 21 to 18. It is now stated as a **delta of three**
with both endpoint pairs named, and a fixture asserts the delta **and the
three commands by name** — a delta of three could be any three. Three
transcribed counts in the spec became derived for the same reason; each
would have redded this card's own edit three files from its cause.

## `T-061-s5` FORCED A RULING RATHER THAN A CHORE

Naming `npm run boot:orphan-drill` in the tools/e2e bullet puts it in the
derived section, so the same edit had to decide whether the drill is a CI
step. **It is not**, and the arguments are recorded in the spec's
`LOCAL_ONLY` entry and the CI bullet rather than left for the next editor
to re-derive: it opens a window and builds the app (roughly doubling the
boot step's cost), it deliberately SIGKILLs a process mid-boot (a
different risk profile on a shared runner), and it is a REGRESSION drill
whose property cannot drift without somebody editing
`tauri-boot-check.mjs`'s exit path. It takes the disposition
`index --watch` and `arch` already have. Its smaller half is closed too:
the boot check's exit-3 legend named one reason where the script's own
header names two, and now names both.

## Ranges, every dot count stated, at their own refs

Main-before **`0eeadf0`** (T-113's checkpoint, **verified as the tip at
the moment of merge** rather than inherited from a brief), lane tip
**`4c41454`**, merge-base **`9b03ae6`** (the dispatch-stamp commit, the
lane's own base).

    git merge-tree --write-tree 0eeadf0 4c41454 -> tree e5ad839b…, exit 0 (read from $? FIRST)
    git diff --name-only 0eeadf0 <TREE>                        -> 8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 0eeadf0...4c41454   (THREE dots)      -> 8
    git diff --name-only 9b03ae6..4c41454    (TWO, branch-only) -> 8
    git diff --name-only 0eeadf0..4c41454    (TWO dots)        -> 27  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 9b03ae6..0eeadf0    (main's advance)   -> 19
    git diff --name-only 0eeadf0..e5ecadb    (THE MERGE'S DIFF) -> 8   the only one that means anything

**THE FORBIDDEN COUNT IS 27 AND IT IS PURE LEFT-ENDPOINT DRIFT**: main
advanced **19** paths from the cut, the branch **8**, `comm -12` over the
sorted lists is **EMPTY**, and 19 + 8 = 27 — the arithmetic that proves
the two sets disjoint. **The divergence is real this time** (8 against
27), which it was not at every merge this session; two lanes landing
between the cut and the merge is what made it so.

**THE FORECAST WAS EXACT.** The merge's own `HEAD^{tree}` IS
`e5ad839ba8ae765de88d054ad1a93ac4c53b90bd`, byte-identical to the
`merge-tree` forecast, and the merge's diff is the same 8 paths. Parents
are `0eeadf0` and `4c41454` and nothing else. **NOTHING WAS WRITTEN INTO
THE MERGE COMMIT**; every integrator edit is in this checkpoint.

## THREE standing gates — DERIVED from the merge's own eight paths

`grep -n "at any merge whose diff" docs/CONVENTIONS.md` returns exactly
**3** (lines 657, 782, 811), the mechanical enumeration the brief
contract prescribes.

| gate | trigger | on these 8 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **2 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **2 — FIRES**, four suites |

- **GRAPH REGEN — FIRES on the two `.ts` specs, AND THE GATE WAS ASKED
  RATHER THAN PREDICTED.** `cargo run -p nputer-index -- index --check
  --root ../..` from app/src-tauri exits **0**: *"graph.json is CURRENT"*
  at **648863 bytes · 126 files · 1126 symbols · 1712 edges**. **No regen
  owed and none performed.** This is T-054's and T-058's worked example a
  third time — a `.ts` file under `tools/` MATCHES the trigger and CANNOT
  move the graph, because `.nputerignore` excludes `tools/`. The trigger
  is deliberately wider than the walk and over-firing is the safe
  direction; asking costs a second.
- **BOOT GATE — NOT OWED, 0 of 8.** This fence cannot produce
  `app/src-tauri/**`, `app/src/**` or either manifest, and the count is
  stated rather than the conclusion asserted.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the paths as ARGUMENTS,
  ROOT-RELATIVE, and never through `xargs` — which this merge is
  precisely about. **2 of 8 paths under docs/, FOUR suites owed**:
  `docs/CONVENTIONS.md` brings cargo (`kit.rs` reads it off disk on every
  run) and tools/e2e; the task card brings app and lib/parser. The run
  reports **12 derived readers across 4 suites**, **0 frontmatter
  issues**, a census of **119 docs-shaped sites in 22 files, 12 of them
  in 10 files resolving into this repo's docs/**, **25 files holding the
  repository root** (11 derived, 0 unlinked, 14 with no linkable site),
  **1 package-relative site, derived**, and the root-anchor ledger at 6
  entries. The root-anchored figure moved 24 → 25 with T-088's merge; it
  is DERIVED on every run and transcribed nowhere.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command, **captured on the very next token** — see the
pitfall below, which cost this lane two minutes of believing a green
sweep.

- **parser: 263/263 across 12 files**, exit **0**. Unmoved — this merge
  adds no parser input and the card's `status:` is legal.
- **app: 940/940 across 46 files**, exit **0**, after `npm run build`
  exit **0** (269 modules). **THE CSS HASH IS UNMOVED at
  `index-C86RloYb.css` / 45.06 kB**, which is the Tailwind content-scan
  check; the JS is `index-DEkJr3K8.js` / 526.42 kB. Both are main's — this
  merge adds no bundle input at all. The figure is 940 rather than 939
  because T-113 added one body.
- **cargo `test --no-fail-fast`: 383 passed / 0 failed / 3 ignored, exit
  0**, summed programmatically over **fifteen** `test result:` lines.
  Unmoved from T-113's checkpoint, which a 0-file Rust diff requires; it
  is owed only because `kit.rs` reads `docs/CONVENTIONS.md`, and that
  assertion is about the method version string, which this merge does not
  touch.
- **E2E: 143/143**, exit **0**, scratch port **14950**; `npm run
  typecheck` **0**. **THE ARITHMETIC CLOSES**: main's 135 plus the lane's
  **8** new bodies (5 in `docs-input-gate.spec.ts`, 3 in
  `workflow-parity.spec.ts`) = 143, and no spec FILE is added.
- **token lint: selftest 0, lint 0**; **`npm run lint:docs` exit 0**, run
  the way CI will run it.

## The poison drill — fourteen mutants across TWO detached worktrees

Run by the executor at `f20f786` and again at `cb9acfb`, arm (c): a
detached scratch worktree at a named commit, `node_modules` and
`lib/parser/dist` SYMLINKED in. No `CARGO_TARGET_DIR` hazard applies
because no Rust body is drilled. Every mutation **one side only, always
the producer**, applied by a driver that REFUSES a path outside the drill
and requires a match count of exactly 1, with every mutated TEXT read
back via `git diff --unified=0` before its suite ran. Baselines **57/57**
and **41/41**, exit 0. **All fourteen redded.**

**THE FOUR ARMS OF THE PATH VOCABULARY DISCRIMINATE BY LINE NUMBER**,
which is the part worth having: N1–N4 all red the same BODY, so "one body
reds" would not have shown they are four rules rather than one. They red
at four DIFFERENT assertions — `:686` (`./`), `:698` (blank), `:702`
(newline blob), `:707` (ambiguous plain relative) — each naming its own
finding. N5 (three bodies) against N6 (exactly one) is the shape-six
check asked and answered: the exit-matrix body is not the empty-list body
restated. N12 and N13 red the one-spelling pin from OPPOSITE sides, which
is what a two-copy pin must do.

**AND THE DRILL CAUGHT A DEFECT IN THE LANE'S OWN NEW BODY — the best
argument this session produced for drilling at a COMMIT rather than in
place.** The empty-list trap's planted positive first read
`$(git diff --name-only HEAD~1 HEAD)`, a range naming whatever the
previous commit happened to touch. It was GREEN at `f20f786` (whose
parent edit included `docs/CONVENTIONS.md`) and **RED at `f7ea31c`** (a
spec-only edit), where the gate answered "not owed" at 0 and was entirely
right to. **A positive control that depends on history is one that will
fail on somebody else's commit and be read as a real defect.** It now
uses the EMPTY TREE against HEAD restricted to one path, which names that
path at every commit this repository will ever have. The body was not
wrong about the gate; it was wrong about the world, and only a second
worktree at a second commit could tell the difference.

Restoration proved THREE ways after every mutant and at the end of both
drills: empty tracked diff, sha256 of all seven touched files against the
drill's own commit (all MATCH in both), and clean re-runs at 57/57 and
41/41. Symlinks were UNLINKED rather than deleted with all four targets
verified present afterwards; both worktrees removed and pruned.

## A MEASUREMENT PITFALL, RECORDED BECAUSE THE FALSE READING WAS UNIFORMLY GREEN

`$?` is clobbered by a command substitution **in the same line**.
Measuring the gate's spellings with

    node …/docs-gate.mjs "$spec" >/dev/null 2>&1; echo "$(printf '%-52s' "$spec") -> $?"

printed **0 for every row**, including rows measured seconds earlier as 1
and 2 — the `$(printf …)` subshell runs before `$?` is expanded and
resets it. **Capture `rc=$?` on the very next token, then print.** This
is the same discipline the card demands of its own exit matrix, failing
one layer down, and it is worth writing down because a false reading that
looks like a clean sweep is the kind nobody investigates. A sibling false
green appeared in the same lane when two empty `grep` results compared
"IDENTICAL" — **a negative assertion needs a positive control at the
shell as much as in a spec.**

## Documents: CONVENTIONS carried the edit, ARCHITECTURE was CHECKED and needs nothing

- **CONVENTIONS** is inside this card's fence and carries the whole
  correction: the new command in the tools/e2e bullet, the retracted
  "silent in exactly ONE case" sentence, the printed invocation, the
  two-platform matrix, the placement argument for the CI step, the orphan
  drill and the boot check's second exit-3 reason.
- **ARCHITECTURE IS NOT TICKED, AND THAT IS DERIVED RATHER THAN
  ASSUMED.** Its docs-gate paragraph says the gate is *"specified in
  docs/CONVENTIONS.md and implemented as `tools/e2e/scripts/docs-gate.mjs`
  + `docs-scan.mjs`"* and explicitly DELEGATES the specification —
  *"THE NUMBER OF THEM IS DELIBERATELY NOT WRITTEN HERE"*. Nothing in it
  claims the gate is unenforced, that it is not a CI step, or how many of
  the three standing gates CI runs; `git grep` for *"deliberately not an
  npm script"*, *"obliged to run"* and *"carries exactly four"* finds
  them **only inside T-090's own problem statement**, which is preserved
  as the record of what was true when it was written (the T-085
  retraction shape) with the notes saying what changed. **A document that
  delegates correctly does not go stale when its delegate is edited.**
- **ROADMAP** was checked: its two `T-090` hits are about the drafting
  plan's stale id range and the assembler, neither a claim this merge
  falsifies.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THE APP DID NOT RELAUNCH, AND THIS WAS VERIFIED RATHER THAN
   ASSUMED.** Pid **88272** (started 2026-08-24 14:02:15, ppid 82364)
   is unchanged across the merge and the whole checkpoint. The merge
   contains **no Rust and no `app/src/**`**, so neither `tauri dev`'s
   restart trigger nor vite's HMR path is touched: **nothing at all
   reached the running window**, which is the correct outcome for a merge
   that changes tooling and documentation. The process match was
   ANCHORED (`awk '$NF=="target/debug/nputer"'`) — the unanchored form
   matches `target/debug/nputer-index` as a substring, and this
   integrator's own graph-gate run would otherwise have read as a
   relaunch.
2. **The integrator's `cargo` runs share `target/` with the human's live
   dev app** (T-113's ceremony observation, confirmed here): the graph
   gate and `cargo test` both built into the shared directory while the
   app was running, and the app was unaffected.
3. **The map pane sees no new graph.** `docs/architecture/graph.json` is
   not in this merge's diff and `index --check` is 0, so no node, ring or
   symbol panel changes.

**No process from this integration survives.** ONE scratch port was used
at the merge — **14950** — read with `lsof` FIRST (zero rows) and then
bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` before use
and free again after, in that order and never the reverse. The lane used
14950–14953 on the same discipline. **No `pkill` at any point.** No
`npm ci` or `npm install` was run in the main checkout. **The untracked
zero-byte file `z`** still sits there — not this integrator's, not
staged, left alone for the fifth checkpoint running.

**A DATA POINT FOR `T-088-s3` / `T-113-s2`, offered because it is
concrete.** That finding says two concurrent lanes drill into the SAME
fixed scratch path and neither driver's guard can tell. This lane's
drills used a **session-scoped** scratch directory and could not collide
with T-088's or T-113's even while all three were live. Scoping the drill
path per session is a fix direction with a worked instance behind it.

## The board, derived from disk at this checkpoint

**167 flat task files — 75 done / 46 planned / 40 parked / 6 suggested /
0 verifying / 0 building; 26 in `rejected/`.** 75 + 46 + 40 + 6 = 167.
T-090's stamp moves done from 74 to 75 and building from 1 to 0.

## Provenance — SELF-DECLARED, never read off a trailer

T-090 is **built by `claude-opus-5` and self-verified by the same
session**; `built_by: claude-opus-5 @T-090`, `review: self-verified`.
**The `Co-Authored-By` trailer on this lane's commits is a harness
constant and is NOT evidence of a model** — T-085 proved it and T-101
made the proof sharper with a counterexample inside one session. Nothing
here reads a model off a commit signature.

**75 done cards — 56 `same-model`, 13 `self-verified`, 5 `independent`,
1 EMPTY (T-056)**; 56 + 13 + 5 + 1 = 75. T-090 moves `self-verified`
from 12 to 13.

At this checkpoint main contains T-090's merge `e5ecadb` plus this
commit. Parser, app, Rust, E2E, token lint and its selftest, the
graph-currency gate and the docs gate are all green; **all three standing
gates were DERIVED, two FIRED and were RUN, and the third's not-owed
count is stated.** Nothing is broken.

## In progress / broken right now

**NOTHING IS IN PROGRESS. ZERO LIVE LANES.** `git worktree list` returns
the main checkout and nothing else; `git branch` still lists every lane
this repo has ever run, which is the intended asymmetry. Every fence is
free, `tools/e2e`, `.github/` and `docs/CONVENTIONS.md` included — this
checkpoint released the last three.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1126 SYMBOLS / 1712
EDGES** at **648863 bytes / 126 files**, and should **forecast the DELTA
and re-derive the endpoints** — three forecasts went stale in their
absolutes this session and none went stale in its delta.

## Next up

1. **`T-088-s3` and `T-113-s2` are the same defect from two lanes and now
   have a third data point.** Two concurrent lanes drilling into one
   fixed scratch path, with each driver's guard blind to the other.
   T-088-s3 is the primary and T-113-s2 subordinates itself to it. This
   checkpoint adds the observation that a session-scoped path avoided it
   for three simultaneous lanes.
2. **`T-113-s1` is cheap and it is a document contradicting itself in
   code.** `visibleDenials`' doc comment still describes the
   `exitNonZero` double report as live and routes readers to a finding
   T-113 closed. Fence `[app-interview]`, free.
3. **`T-088-s1` is this session's fourth transcribed-census incident.** A
   card transcribed the docs-gate reader census and it was stale by
   dispatch. The gate prints it (`--census`); nothing should carry it as
   digits. T-090's own bullet quotes none, and the spec now asserts that.
4. **`T-088-s2`** — dogfood test TITLES carry counts nothing pins, three
   of which went stale in one commit.
5. **`T-088-s4`** — a watcher startup-arm test reds under concurrent
   load, the second flake this suite has produced.
6. **The GNU `xargs` column closes at the first push**, and it is the one
   claim in CONVENTIONS' DOCS GATE bullet that is documentation rather
   than measurement. Whoever watches the first CI run should read the
   `npm run lint:docs` step's behaviour and, if the runner ever pipes
   anything through `xargs`, re-derive the mapping there.
7. **`T-101-s1`'s neighbours are done but `T-085-s3` is still cheap and
   still unowned**: the pin guarding T-084's retraction is one
   case-sensitive regex over one file; a whitespace- and
   case-insensitive sweep across BOTH scripts closes the three measured
   escapes.
8. **@human's T-101 look is ANSWERED — see the section below. There is no
   outstanding @human item.**

## THE T-101 LOOK IS CLOSED, AND THE LOOP MET A REAL MODEL FOR THE FIRST TIME

**@HUMAN RULING 2026-08-24: the denial notice reads as INFORMATION, not
ALARM.** Judged on a live genesis interview against the user's own
`claude` **2.1.226**, in the app running as pid 88272 — the build T-113's
merge relaunched, so it carried both T-101's notice and T-113's
single-report fix. All three questions answered yes: the rows read as
quiet monospace furniture rather than in the failure treatment, the turn
they sit under still reads COMPLETED, and they sit below the planner's
answer without outranking it. **T-081 asked this question and could not
answer it; T-101 made it answerable; it is now answered and needs no
further look.**

**AND THE OCCASION MATTERS AS MUCH AS THE VERDICT: this is the first time
the genesis loop has EVER run against a real model.** Every prior proof
was the `fake_agent` fixture or a scripted lane, and STATE has said so
since T-025. The refusals were **not provoked** — a probe prompt was
prepared and never needed, because the planner earned three refusals
doing its own stage-0 work, which is stronger evidence than a staged one:
this is the ORDINARY case.

**NOTHING WAS LOST TO THEM, VERIFIED ON DISK RATHER THAN BELIEVED.** The
turn banked stage 0 in full — `.git`, five `docs/*.md` (853, 489, 770,
711 and 770 bytes), the three empty subdirectories, `CLAUDE.md`,
`AGENTS.md`, `.gitignore` and `.nputer/` — with three refusals on the
same turn. **A denial is not a death, measured against a real model
rather than a fixture.**

## THE REAL-MODEL EVIDENCE THE LOOK PRODUCED — the adapter's grant does not fit the planner's spelling

The three refusal reasons are the first real-CLI permission text this
project has ever captured, and they say something no fixture could:

1. *"This command changes directory before running git, which can execute
   untrusted hooks from the target directory."*
2. *"Redirect target concatenation contains `$`/`` ` `` — unanalyzable gap
   or substitution"*
3. *"This Bash command contains multiple operations. The following part
   requires approval: `git -C <projectdir> status --short`"*

`CLAUDE_V1`'s `spawn_args` grants six Bash patterns — `git init`,
`git add`, `git commit`, `git status`, `mkdir`, `cp` — as T-023's verdict
recorded the kit's imperative surface, spelled BARE. **The real planner
spells them `git -C <projectdir> …`**, which matches none of the six and
separately trips a CLI safety heuristic about changing directory before
git. So the planner was refused ITS OWN GRANTED SURFACE on a spelling
technicality. Reason 2 is a second, different mismatch: it reached for a
shell REDIRECT to write a file, where `--permission-mode acceptEdits`
would have auto-approved the same write through the Write tool.

**THE CARD IS CUT: `T-124`**, fence `[app-agent]` (`adapter.rs`),
priority 6. It is an adapter/kit question, **not a defect in T-101's
render**, which is working exactly as designed. Note the direction of the
finding: the gap is visible AT ALL only because T-101 put those rows on
screen, which is the notice earning its keep on its first real day. The
card can be precise WITHOUT spending a model call, because the three
captured reasons name their own mechanisms — one is our allowlist, two
are the CLI's own guards — and it forbids widening a grant just to look
productive.

## AND THE LOOK FOUND A DEAD END NOBODY HAD MET — `T-123`, PRIORITY 2

Going back to the app after the interview, @human could not get back INTO
it: both doors landed on an empty board. **That is not a bug in the
doors; it is the guard working and trapping the session behind it.**
Stage 0 writes `docs/ROADMAP.md`; `probe_plan` STATS it and never reads
content, so a template carrying ZERO features makes `has_plan()` true;
T-026 criterion 5 then correctly routes a folder-with-a-plan to the
ordinary open, forever; and `resumeGenesis` has exactly one caller, inside
the chat that only mounts on the genesis screen. **So the interview's own
first act strands it**, with a live session (`S1`, one turn, a real
native session id) registered in the folder's own
`.nputer/sessions.json` and unreachable from the UI.

The routing has never asked *"is one of our interviews running on this
folder?"* — though T-029 gave that fact an owner and T-070 named the
accessor (`sessions::genesis_record`). A guard built to stop you
overwriting SOMEONE ELSE'S plan cannot tell it from the plan its own live
session wrote thirty seconds ago. It is the inverse of T-050's ruling
that no reachable screen is a dead end: the reachable screen is a dead
end for the SESSION. **Milestone 4 rather than a residual, because a real
user meets it on their first interview** — which is exactly how this one
was found. The two hand-driven ways back in are recorded on the card.
