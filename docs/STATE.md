# State

Updated: 2026-08-25 by the T-130 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN.**
This merge is **471 / 973 / 268 / 171 green**, and it is the merge that
ends **the most-encountered defect in this project's history**: the
`tools/e2e` plant-and-restore rounded every mtime it put back, so its own
guard redded once in each checkout and then erased the evidence that
caused it. **Six separate checkpoints had it at the top of "Next up".**
Four things will meet you before any real defect does: **the app suite
cannot BUILD on a merged main until you rebuild `lib/parser`**, **`npm
run typecheck` from `app/` DOES NOT EXIST**, **three known
intermittents**, and **the checkout's test runner and the checkout's
EDITOR are shared surfaces**. **Derive the lane list before you cut
anything — there are THREE lanes now, not one** — and read the next four
sections before you debug anything.

**WHAT IS NEWLY FREE**: **`tools/e2e`**. That unblocks **`T-133`** (the
command that makes a brief's contract rows derivable and STATE's lane
list DERIVED rather than typed — @human adopted it at `af4f6c7`),
**`T-108-s2`** (three landed cards still carry "remove before landing"),
and **`T-130-s2`**, this merge's own routed finding. **HELD: `crate-index`
and `docs/architecture/components/` by `T-127`; `method/lane-protocol.md`,
`method/roles/integrator.md` and `method/tasks/TASK-FORMAT.md` by
`T-132`.**

## THE FINDING THIS CHECKPOINT EXISTS TO CARRY — THE TRIGGER IS A WRITE, NOT A FRESH CHECKOUT

**SAY IT HERE BECAUSE THE CARD SAYS SOMETHING NARROWER, AND THE NARROW
VERSION IS WHY THIS DEFECT WAS MET SO OFTEN WITHOUT BEING UNDERSTOOD.**
`T-130`'s card locates the red in *"a fresh lane worktree and a fresh
POISON DRILL worktree."* **That is too narrow.** Measured at this merge,
one git operation at a time, in the lane worktree:

| operation | the target file's mtime after | rewrote it? |
|---|---|---|
| `git reset --hard`, working tree clean | unchanged | **no** |
| `git reset --hard` after an mtime-only change | unchanged | **no** |
| `git checkout <branch>` round trip, file unchanged between | unchanged | **no** |
| `git checkout -- <path>` on a CLEAN file | **fresh, fractional** | **YES** |
| `git reset --hard` over differing CONTENT | **fresh, fractional** | **YES** |

**The trigger is any WRITE OF THE FILE'S BYTES**, and every byte-writer
in this tree — a fresh checkout, `git checkout -- <path>`, a
`reset --hard` over a modified file, a `stash pop`, an editor save, the
T-058 body's own `writeFileSync` — takes the mtime from the system clock,
which APFS records to nanoseconds. **The ONE writer that leaves a
whole-millisecond mtime is the defect's own lossy `utimesSync`.** So
**armed was the DEFAULT state and disarmed was an artifact the defect
manufactured**, which is the actual explanation for six checkpoints of
sightings. **A plain `git reset --hard` is NOT enough on its own** —
that was believed at this merge and it is false; the file has to differ.

**AND THE COUNT IS RIGHT WHILE THE ADVERB IS WRONG.** The card, and four
consecutive integrator briefs, say this item *"led STATE's Next up for
six CONSECUTIVE checkpoints."* Derived here by reading the `## Next up`
section of **all 97 checkpoints on main**: it stood at **item 1** in
**six** of them — **#84 `19f93bb` (T-120), #85 `1d8a2c2` (T-110), #87
`82c69a8` (T-052), #88 `9b9c997` (T-086), #89 `05dd4d9` (T-107), #94
`f5e6907` (T-108)**. **Six is exact; consecutive is false** — the run
breaks at #86 (T-124's checkpoint, where T-052 led) and again across
#90–#93. **A figure and its adverb are two claims, and only one of them
was ever checked.**

## WHAT LANDED, AND HOW TO READ AN OLD RED

The P6 body and the T-058 body both restore through **seconds as a
number** now: `utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs /
1000)`. `Stats.mtime` is a `Date`, a `Date` holds whole milliseconds, and
the sub-millisecond part was gone the moment the `Date` was read. **The
strict `toBe` is KEPT** — loosening it would have deleted the property
`T-079-s3` exists to defend.

**THE T-058 BODY IS THE LARGER HALF AND IT HAD NO CLOCK RESTORE AT ALL.**
It plants into **seven tracked files across four packages** —
`app/package.json`, `docs/NORTH_STAR.md`, `lib/parser/package.json`,
`tools/e2e/package.json`, `method/README.md`, `AGENTS.md`,
`.github/workflows/ci.yml` — put every byte back and left all seven
clocks on the moment of the plant. It now restores them and **asserts**
them. **Observable consequence, measured at this merge**: before it,
every `npm test` from `tools/e2e/` moved seven tracked files' mtimes in
whatever checkout it ran in; after it, **all eight targets came out of a
full 171-body run holding their pre-run values to the last digit.**

**THE SIGNATURE IS STILL WORTH KNOWING, BECAUSE OLD LOGS AND OLD
CHECKOUTS EXIST.** A fractional tail against a whole number —

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

— **is this defect and not your change.** On a tree at or after `cea839e`
it cannot fire; if you see it, you are on an older ref. **The other two
e2e red classes are unchanged and the three are still told apart by one
question** (`T-128-s1`'s reusable half, now inside `T-132`): *does the
failure carry a fractional millisecond against a whole number?* If yes it
is this. If no, and the message accuses a file `git status` says is
untouched, **ask who else is running before you debug your own change.**

**`T-079-s3` IS NOW FULLY DISCHARGED ON ITS ITEM 1** (the T-058 body's
missing restore) **and items 2–3 are STILL LIVE** — they are
`docs/CONVENTIONS.md` edits, routed to **`T-092`**. See "Next up" item 2.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** Immediately after T-033 landed, a second session ran `npm test`
from `app/` and saw **nine failures**. It was reported as the ordinary
pre-checkpoint state of a merge that declares a new component. **That
diagnosis was wrong**, and the real cause is one every future integrator
will meet:

    $ npm run build          # from app/
    src/lib/architecture/derive.ts(530,36): error TS2339:
      Property 'nonCode' does not exist on type 'ComponentRecord'.
    exit 2

**`lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT.** The app
resolves `@nputer/parser` through a symlink to `lib/parser`, so it
compiles against the PRE-merge types; `vitest` transpiles without
typechecking, so the suite still RUNS and the dogfood fixtures red in a
way that looks exactly like an un-reconciled fixture. **One command clears
it**: `npm run build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH
TREE, IT IS A MERGE THAT CHANGES THE PARSER'S TYPES** — CONVENTIONS files
the parser-before-app ORDER under *fresh clone*, so a fully-installed main
checkout reads as exempt and is not. **This merge's parser diff is EMPTY**
— its one code file is `tools/e2e/tests/token-scan.spec.ts` — so the trap
did not fire here; the build was run first anyway, in that order, and
every exit was 0. **Do not read a green build as evidence the trap is
gone.**

**AND T-116's VERIFIER FOUND A SECOND, EARLIER LINK IN THE SAME CHAIN**:
in a FRESH WORKTREE `npm run build` from `app/` exits **2** with
`Cannot find module '@nputer/parser/pure'` until `lib/parser` is both
INSTALLED and BUILT. `T-117` documents the `app/dist` prerequisite; this
is the step before it, and neither is in CONVENTIONS.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**: `app/package.json`'s
scripts are exactly `dev`, `build`, `preview`, `test`, `tauri` — there is
no `typecheck`. `npm run typecheck` from `app/` exits **1** with `Missing
script`, which a hurried reader takes for a compile failure. **The app's
typecheck is the TWO `tsc` calls inside `npm run build`** —
`tsc && tsc -p tsconfig.test.json && vite build` — and the second one is
load-bearing rather than tidy: without it nothing in the repository
typechecks any of the app's test files (T-073). `lib/parser` and
`tools/e2e` DO have a `typecheck` script; `app/` is the exception, and
that asymmetry is the whole trap.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS FOURTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory.**

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds. **A tally that mixes checkouts is not a flake rate.**

### THE CLOCK TEST STILL SEPARATES GREEN FROM RED, AND MAIN IS STILL IN THE GREEN BAND

T-124 found the lib suite's own `test result:` time sorts its runs
perfectly — every green under 9.5s, every red over 14.6s, **a gap of more
than five seconds with nothing in it**. `du -sh app/src-tauri/target`
reads **3.5 GB** here, **unmoved from T-129's checkpoint** — this merge
adds no cargo target and compiles nothing new — and the lib suite is
**4.89s**, against T-129's 4.91s on the same tree. **TWENTY-TWO runs
across thirteen integrations and not one lands between 9.5s and 14.6s.**
The watcher body was read by NAME as `ok` rather than inferred from a
green exit. Read the lib suite's own time first; it tells you which regime
you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that lanes may be building
against this repository — there are TWO right now: `lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
had been declared settled at better than 400-to-1 on 15 clean-cache runs
that saw it zero times. **T-086's lane refuted that within the hour**: it
redded **1 in 4** full `cargo test` runs in a FRESH lane worktree — with
the `docs_watch` body GREEN and the lib suite inside the healthy band — so
the cache cliff cannot be what crossed its deadline. Run alone the body is
**5 green in 5**.

**THE SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 20**.
**Live, load-sensitive, ~1-in-20 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge — read by NAME,
`ok` — which is one more data point and not a reprieve. Read it beside
**`T-102-s3`**. Its fence `[app-agent]` is **FREE**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE NINETEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-127** | `[crate-index, docs/architecture/components/]` | **building** |
| **T-132** | `[method/lane-protocol.md, method/roles/integrator.md, method/tasks/TASK-FORMAT.md]` | **planned** ← |

**T-130's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so TWO lanes hold
fences after it — **UP from one**, because two lanes were cut while this
integration was in flight. **THE PREVIOUS EDITION OF THIS FILE SAID
`T-130` WAS "the only lane left" AND IT WAS TRUE WHEN WRITTEN**; it was
false forty minutes later. **The lane list is a fact on disk and never a
memory** (lane-protocol rule 7).

### **THE BOARD-TRUTH WINDOW IS OPEN, AND THIS IS WHAT IT LOOKS LIKE**

**`T-132` reads `status: planned` on the board while holding a worktree
on its own `task/` branch.** Its own lane base carries `planned` too, so
the `building` stamp was never written on the integration branch before
the branch was cut — which is the exact ordering
`method/lane-protocol.md`'s last section fixes, and the exact shape the
previous edition of this file said was absent. **It is not a defect in
`T-132`'s work and nothing reds**; it is the window being open, and it is
recorded because `integrator.md` rule 4 asks that an unexplained state be
recorded rather than tidied. **Whoever owns `T-132` should stamp it on
main.** Do not read `planned` on that card as "free to dispatch".

**AND THE GAP WIDENED WHILE THIS CHECKPOINT WAS BEING WRITTEN**, which is
the sharpest form the finding takes: the lane advanced `b1783a6` →
**`56821e7`** and stamped itself **`verifying`** in its own worktree
(correctly, per ruling NINE), and a detached verifier checkout
`/Users/ujju/Projects/nputer-T-132-verify` appeared at **22:17**. **So
the board says `planned` about a card that is IN VERIFICATION with two
worktrees open on it.** Read the branch, never the card, for what a lane
is doing.

**DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO NOT QUOTE THIS
TABLE.** The one command that answers it:
`git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`.
**THIS EDITION DELIBERATELY CARRIES NO ROW COUNT, AND THAT IS A CHANGE
OF POLICY EARNED BY MEASUREMENT RATHER THAN A STYLE PREFERENCE.** Every
previous edition printed one (14, 7, 6, 5, 4 …) with the warning that it
was weather. **This checkpoint watched its own figure go stale TWICE
inside forty minutes**: two detached non-lanes when the lane list above
was derived, three when the worktree was removed sixteen minutes later
(`T-132`'s verifier checkout), and four two minutes after that (a
`T-127` POISON DRILL checkout, correctly placed OUTSIDE the repository
under the session scratch root — lane-protocol rule 3). **A figure that
cannot survive the document that derives it should not be in the
document.** Run the command. **What does NOT move on that timescale is
the LANE membership** — the two-row table above was still exactly right
at every one of those three readings, because a lane is a `task/` branch
entry and everything else is somebody's scratch. **This checkpoint
removed a worktree and the list got LONGER, for the second checkpoint
running.**

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: `212543c` at the start and `212543c` at the end, so it
  is now **four merges and four checkpoints** behind main, and updating
  it is @human's one command to run when they choose.
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS
  INTEGRATOR'S, and it FOLLOWS MAIN.** It read **`74feb67`** throughout
  this integration, which is one commit BEHIND this merge's own
  main-before — so it did NOT track main during this pass, unlike the
  last one. It is on no `task/` branch and is named after no card, so it
  is **not a lane**; it was read with `git -C … rev-parse` and nothing
  else, and left alone.
- **`/Users/ujju/Projects/nputer-T-132-verify`, detached at `56821e7`** —
  **`T-132`'s VERIFIER checkout, and it arrived at 22:17**, between this
  checkpoint's lane derivation and its worktree removal. It is detached
  and on no `task/` branch, so **it is not a lane and holds no fence** —
  the fence is `T-132`'s branch entry, not this one. **A path named after
  a card is not evidence that it is a lane**, and this is the clearest
  case yet: two worktrees, one card, one fence. Not removed, not counted,
  read with `git -C … rev-parse` only.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: **`tools/e2e`**,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`, `app-shell`,
`app-dispatch`, `app-interview`, `lib-parser`, `.github/`,
`method/README.md`, `method/roles/executor.md`,
`method/roles/verifier.md`, `method/interview/`, and every `docs/tasks/`
card path. **HELD: `crate-index` + `docs/architecture/components/` by
T-127; three `method/` FILES by T-132** — note that `method/` is held at
FILE granularity, so `executor.md` and `verifier.md` are reachable and
`lane-protocol.md`, `integrator.md` and `TASK-FORMAT.md` are not.

## Just completed

**T-130 — the mtime restore stops rounding below the millisecond, so the
project's most-encountered defect stops re-arming itself.** F-02,
milestone 4, **size S**, `touches: [tools/e2e]`. Main-before
**`afe23c1`**, lane tip **`6dedc0d`** (derived with `git rev-parse`),
merge **`cea839e`**, this checkpoint its direct child.
`builder: claude-opus-5`, `built_by: claude-opus-5 @T-130 — code
b1ceedc; notes 7d16d4b and 6dedc0d`, `verifier:` and `verified_by:`
**empty**, **`review: self-verified`**.

**WHY THERE IS NO VERDICT AND WHY THAT IS CORRECT.** The ceremony table's
**"S, diff outside shipped code"** row owes **no verifier and no
*separate* integrator** — `tools/e2e` is tooling, and the rule of thumb
is *docs, method and tooling self-integrate; anything a user could run
does not.* A separate hand DID integrate it, which is more than the row
asks and less than a verdict. **`self-verified` names the SEAT, not the
effort**, which is why the field reads that way even though the drill was
re-run by a second hand.

### **THE LANE'S THREE HEADLINE MEASUREMENTS WERE RE-RUN AT THE MERGE, NOT READ**

**Because on a card with no verifier the integrator is the only second
pair of eyes, and because a suite that passes is not the same evidence as
the defect failing to reproduce.** In the lane worktree at `6dedc0d`,
scratch port **15501**, exits read unpiped from `$?`, **all eight targets
re-planted with fractional mtimes before every single run**:

| arm | code | result HERE |
|---|---|---|
| **CONTROL** | shipped | **10/10 pass, exit 0**, and all eight planted fractional values SURVIVED to the last digit |
| **M1** | P6 producer → `utimesSync(target, clock.atime, clock.mtime)` | **exit 1** · `Expected 1787655727832.5427` / `Received 1787655727833` |
| **M3** | T-058 producer line DELETED — the pre-T-130 shape | **exit 1 · 1 failed / 9 passed**, the T-058 body · `Expected 1787655727833.6428` / `Received 1787684165024.1953` |
| **THE VACUOUS PASS** | M1 still in place, **no re-plant** | **exit 0** — run deliberately, so the healing mechanism is on the record beside the red |

**M1 REPRODUCED THIS FILE'S OWN PREVIOUSLY-RECORDED DIGITS, CHARACTER FOR
CHARACTER**, by a hand that did not write them. **M3's `Received` is the
moment of the plant**, hours from the capture — which is what proves the
new T-058 assertion catches the ORIGINAL content-only restore and not
merely a rounding. **And the vacuous pass is the whole card in one
line**: same mutant, same file, no re-plant, exit 0. Restoration proved
per path by sha256 against `6dedc0d`
(`4bc5997315cc8bbebea9debe420c0b1885d2aa012d301501c69395c84270a650`),
with `git diff --name-only` and `git status --porcelain` both empty
afterwards.

### **THE SWEEP CLOSED THE INSTANCES AND NOT THE CLASS, AND THE LANE SAID SO**

`git grep -n utimesSync` **from the repo ROOT** returns exactly **two**
code call sites, both in `token-scan.spec.ts`; every other hit is prose
under `docs/`. Two more plant-and-restore sites exist in the fence
(`boot-check-guard.spec.ts`, `docs-input-gate.spec.ts`) and **owe
nothing, derived from their write sites**: both write only inside
`mkdtempSync(os.tmpdir(), …)` and destroy the directory in a `finally`,
so they restore nothing because they damage nothing.

**BOTH GUARDS ARE ASSERTIONS INSIDE THEIR OWN BODIES**, so a THIRD
plant-and-restore written tomorrow is lossy on arrival with nothing red.
That is `T-130-s2`, and its fence `[tools/e2e]` is **FREE as of this
merge**.

### **A MEASUREMENT THAT WENT THE OTHER WAY, AND THE LANE SHIPPED ON IT**

`T-079-s3` item 1 records as a *mechanism* that `utimesSync` cannot
restore `ctime`, that `git diff --quiet` answers from the index's cached
stat info, and that the first call after a restore therefore reports a
difference on stat alone — *"measured red-green-green over three
consecutive runs."* The lane replayed the T-058 body's exact sequence
over its exact seven targets, **both arms, 12 cycles each, across two
checkouts including a freshly-cut worktree with an unrefreshed index**:
**exit 0 in 12 of 12, in both arms.** **It did not reproduce.** That is
not a claim it never happened; it is a claim that **it is not a property
you can plan around** — and the standing advice is unchanged: **prove
restoration by HASH**, which is immune either way. The correction is
routed inside `T-130-s1`.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree afe23c1 6dedc0d -> tree 3340eb6…, exit 0 (read from $? FIRST)
    git diff --name-only afe23c1 <TREE>                         ->   4   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only afe23c1..cea839e  (THE MERGE'S DIFF)   ->   4   the only one that means anything
    git diff --name-only afe23c1...cea839e (three dots AT the merge) ->  4   collapses, as it must
    git diff --name-only 540ae0f..afe23c1  (main's advance)     ->  68
    git diff --name-only afe23c1..6dedc0d  (TWO dots, FORBIDDEN)->  72
    git diff --name-only 540ae0f..6dedc0d  (merge-base..tip, FORBIDDEN) -> 4
    git diff --name-only main..HEAD        (FORBIDDEN)          ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 68 PATHS — 18.00x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **68** under this lane, the
branch **4**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 4 + 68 = 72 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**, T-102 **3.75x**, T-033 **1.94x**, T-091 **8.78x**, T-116
**15.80x**, T-108 **20.75x**, T-104 **3.54x**, T-126 **6.33x**, T-129
**7.53x**, T-130 **18.00x** — the second-widest recorded. **The ratio is
weather; the left endpoint is the signal**, and this merge is the proof:
a **four-path** merge produced the second-largest distortion on record,
because the distortion is a function of what MAIN did, not of what the
lane did.

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read a 4-path merge as an empty one and every gate
derived from it as NOT OWED** — GRAPH REGEN and DOCS GATE both fire here
and both would have been skipped, silently, with a clean-looking
derivation. **The forbidden forms do not share a failure direction**: one
inflates, one ANNIHILATES, and only the second is invisible.

**`<merge-base>..<tip>` GAVE THE RIGHT ANSWER AGAIN AND IS STILL
FORBIDDEN.** `540ae0f..6dedc0d` returns **4**, identical to the
prescribed set, because `540ae0f` IS the merge base, so that spelling
degenerates into the three-dot form. **It is right by coincidence of this
lane's shape** — main advanced 68 paths under it and none collided —
which is luck and not method. **That is now TWO merges running where this
form was accidentally right**, which is the argument for banning the
PAIR rather than trusting the outcome.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`3340eb63f581d49a13752782fa1f847e38043c0a` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`afe23c1` and `6dedc0d` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** The exit was read from `$?` into a variable **BEFORE**
any substitution — exit **0**.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST BOTH LIVE LANES**, not
only against declared slugs. `comm -12` of this merge's four paths
against `T-127`'s `merge-base..tip` diff (**0 paths** — that lane has no
commits yet) and against `T-132`'s (**3 paths**, all `method/`) is
**EMPTY** in both cases.

**MAIN MOVED UNDER THIS INTEGRATOR ONCE BEFORE THE MERGE** — `74feb67` →
`afe23c1`, the `T-127` dispatch — **and the range was re-derived at the
new tip rather than at the first one.** That re-derivation is also what
caught the two new lanes; a range derived once at the start would have
proved disjointness against a lane list that no longer existed.
`git diff --cached --name-only` and `git diff --name-only` were both
EMPTY in the same command that read `main`, one command before
`git merge`, with one `??` row; **`??` alone is not a ceremony.**

## THREE standing gates — TWO fire, all THREE derived from the merge's own 4 paths

| gate | trigger | on these 4 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — OWED** | **exit 0 CURRENT**, asked twice, **no regen** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | not run, and that is a derivation |
| DOCS GATE | a `docs/` path a code suite reads | **3 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **GRAPH REGEN FIRED AND ANSWERED CURRENT, AND WHY IS DERIVED RATHER
  THAN SHRUGGED AT.** One path matches the trigger
  (`tools/e2e/tests/token-scan.spec.ts`, `.ts` outside `docs/`), so the
  gate was **ASKED** — `cargo run -p nputer-index -- index --check --root
  ../..`, exit **0**, `graph.json is CURRENT` at **939 161 bytes · 179
  files · 2004 symbols · 1907 edges**, every figure unmoved from T-129's.
  **The reason is structural, and it was checked rather than assumed**:
  the committed graph's 179 files are **154 under `app/` and 25 under
  `lib/` — ZERO under `tools/`**, because `tools/` is `.nputerignore`d.
  So the changed file is outside the walk entirely. This is the
  *trigger-deliberately-wider-than-the-walk* case `docs/ARCHITECTURE.md`
  already predicts in as many words, arriving as a worked example rather
  than as a surprise. **ASKED A SECOND TIME after the last doc write:
  exit 0, CURRENT.** **`graph.json` is NOT regenerated and NOT committed
  at this checkpoint** — the first checkpoint in five where that is the
  right answer, and it is a derivation rather than a skip.
- **THE IDENTICAL-FIGURES TRAP DID NOT FIRE, AND THE REASON MATTERS.**
  T-104's, T-126's and T-129's checkpoints all hit a second staleness
  whose four headline figures were identical on both sides, every time
  caused by **the checkpoint's own dogfood-fixture reconciliation**. This
  checkpoint reconciles NO fixture, because no count moved: the graph
  file count is unchanged, `arch` reports **components 13, files 179,
  mapped 179, unmapped 0, edges 36, findings 3, drift_components 3** —
  identical to T-129's in every figure. **No fixture write means no
  second staleness**, which is a confirmation of the mechanism and not an
  escape from it. **STILL ASK THE GATE TWICE**; this checkpoint did.
- **BOOT GATE — NOT OWED, AND SAYING SO IS THE POINT.** Zero of four
  paths are under `app/src-tauri/**`, `app/src/**` or either manifest —
  the whole diff is one `tools/e2e` spec and three `docs/tasks` cards.
  `npm run boot:check` was **not run**, no scratch port was taken for it,
  and no `[nputer]` line is claimed. A skipped gate is news; a gate that
  does not fire is a derivation, and the difference is which one you can
  show your working for.
- **DOCS GATE — exit 1, FIRES on 3 of 4, THREE suites**: `npm test` from
  `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
  `lib/parser/`. **NOT the cargo suite**, which the gate DERIVES: the
  three docs paths are flat `docs/tasks/T-130*` cards and the cargo
  readers resolve `docs/CONVENTIONS.md`, `docs/architecture/components`
  and a research capture, none of which is in this diff. Invoked DIRECTLY
  from the repo root with the RANGE RULE's own path list, **never through
  `xargs`**. **13 derived docs readers across 4 suites**, census **130
  sites in 22 files**, **0 frontmatter issues**.

## Fixture reconciliation — NONE OWED, AND IT IS DERIVED

**The three-step procedure T-129's checkpoint wrote down was run and
returned empty at step one.** Derive the FIGURE from `arch`: every figure
identical to T-129's. Derive the SITES with `git grep` on an old digit:
there is no old digit, because nothing moved. **No dogfood fixture, no
parser pin, and no component-file assertion has a value to reconcile** —
this merge adds no indexed file, declares no component, and moves no
count. The app suite's **973/973** on the FIRST post-merge run is the
independent confirmation: had a fixture been owed, that run is where it
would have redded, and it is the run this checkpoint made before touching
a single document.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 471 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 4.89s**.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **474**, which is 471 + 3 ignored.
  **DO THE HEADER CHECK EVERY TIME** — T-129's M15 is the worked reason:
  a SIGABRT in one target prints **no `test result:` line at all**, so
  the summary reads unremarkably while whole bodies vanish. Every figure
  is identical to T-129's checkpoint, which is the right answer: **this
  merge contains no Rust at all.**
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from `lib/parser/`, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**. **973 is unchanged and that is the right answer**: this merge
  contains no app TypeScript.
- **E2E: 171/171, exit 0, 2.2m, on scratch port 15502.**
  **AND THIS GREEN IS NON-VACUOUS, WHICH IS THE ONLY KIND THAT COUNTS ON
  THIS CARD.** `tools/e2e/fixtures/shell.ts` read **WHOLE**
  (`1786940753485`) in main before the run — the healed state a previous
  lossy restore left behind — so a run taken as-found would have proved
  **nothing**. A fractional mtime (`1787655727832.5427`) was planted
  first, the run taken, and **all eight plant targets came out holding
  their exact pre-run values**. `shell.ts`'s original whole-millisecond
  mtime was then restored EXACTLY (`1786940753485`, read back and
  compared) so the checkout is left as it was found; both values are
  stated here because an mtime is a write, and a write into the
  integration checkout is declared rather than assumed harmless.
  **Token-scan bodies 130–139, all ten green**, including body **135**
  (the T-058 body) and body **136** (the P6 body) — the two under repair.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root`
  `ok`, `a_hostile_session_id…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`.
- **RUN LEDGER — every run declared, including the ones that agree.**
  cargo **once** (471/0/3); parser **twice** (268/268 post-merge,
  268/268 after the doc writes); app **twice** (973/973 post-merge,
  973/973 after the doc writes); `tools/e2e` **twice in main** (171/171
  on port 15502 post-merge, 171/171 on port 15503 after the doc writes,
  **both against a planted fractional mtime and both leaving the
  original restored exactly**) plus **four runs in the lane worktree**
  for the drill, whose results are the table above. **The third `tools/e2e` run that this
  file's own write owes is declared in this checkpoint's COMMIT MESSAGE**
  — a commit message is not a code input, so recording a run there owes
  nothing further and the regress terminates on the first pass instead of
  converging. **What may never be done is stopping because the loop is
  tiresome, or writing a run's result before running it.**
- **`range-rule.spec.ts` PRINTED ITS DISCLOSURE AGAINST THIS MERGE COMMIT
  BY NAME** — *"`/Users/ujju/Projects/nputer @ cea839e` — GRAPH REGEN's
  published flip figures are stated at `ddcc8bb` and ARE RIGHT THERE, and
  its trigger has since gained `.rs`: 5 of 5 at that ref, 1 of 1 under
  the trigger on disk"* — which is `T-091-s3`'s exact subject, observed
  rather than theoretical, for the **fourth** consecutive merge.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0** (65 TOKEN + 4 CONTROL samples, 87 walk-policy checks, 9
  evidence-floor checks), **`npm run lint:tokens` exit 0**, at **TOKEN
  135 / CONTROL 748**. **`npm run typecheck` from `tools/e2e` exit 0.**
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF; IT IS NOT A CONSTANT, AND
  HERE IT IS UNMOVED FOR AN INTERESTING REASON.** CONTROL's corpus is
  `git ls-files`, which reads **766** at this merge and **766** at
  T-129's checkpoint — but it went **766 → 764 → 766** in between:
  `74feb67` **DELETED** two tracked cards (`T-123-s10` and `T-128-s1`,
  both absorbed into `T-132`) and this merge adds two (`T-130-s1`,
  `T-130-s2`). **Net zero by coincidence of two unrelated commits**, so a
  session that had matched the number instead of deriving it would have
  been accidentally right. **This checkpoint commits no NEW tracked
  file.**

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-130` was removed with `git worktree
remove`, after the merge and after the checkpoint (lane-protocol rule 6),
and `git worktree prune` was run behind it. **Rule 6's
preserve-until-the-verdict clause does not bind here and that is derived
from the ceremony table's ROW rather than from the tier letter**: an S
card whose diff is outside shipped code has no verdict to preserve the
worktree for. It was nevertheless kept until after the checkpoint, and
the drill re-run inside it is the reason — **it was still the only
installed tree in which the pre-fix red could be reproduced.**

## The board, derived from disk at this checkpoint

**277 flat task files — 95 done / 38 planned / 41 parked / 102 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
95 + 38 + 41 + 102 + 0 + 1 = 277. T-130's stamp moves done from 94 to 95
and clears the single `verifying`. The merge brought **two** suggestions
and `74feb67` REMOVED two by absorption, so the file count is unchanged.
**This checkpoint files NONE**, and creates no tracked file at all.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWO AND WANTS AN ELEVENTH
TRIAGE.** `T-130-s1` and `T-130-s2` came in with the merge and neither is
triaged, because disposition belongs to a triage pass and not to an
integrator (T-083's ruling), so they stay `status: suggested` exactly as
filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's own text is preserved
  byte-untouched** — this checkpoint made NO in-place repairs to it,
  including to the two figures the lane itself flagged as wrong.
- **ARCHITECTURE — NOT TOUCHED, and that is DERIVED rather than skipped.**
  No component is declared, no interface between components moved, and
  `tools/e2e` is **dev tooling under no component** — the map already
  says so, and already says that `tools/` is `.nputerignore`d so "the
  GRAPH REGEN trigger fires on the `.spec.ts` and correctly answers
  CURRENT." **This merge is that sentence happening**, which is a
  confirmation and not an edit. C-07's byte budget does not move because
  the graph does not move.
- **ROADMAP — NOT TOUCHED, and that is DERIVED.** T-130 carries
  `feature: F-02` as **inherited backlog, not F-04 slice content**, so
  F-04's "4 of 7" progress line does not move (T-129's checkpoint made
  the same call for F-06). The milestone-4 census was **re-derived on
  disk rather than carried**: **96** cards carry `milestone: 4` — F-01 9,
  F-02 43, F-03 12, F-04 7, F-06 25 — every figure identical to T-129's,
  because this merge's two new files are suggestions and suggestions
  carry no milestone. The C-07 byte line does not move because the graph
  does not move.
- **CONVENTIONS — NOT TOUCHED.** Neither the merge nor the checkpoint
  changes it. **It is FREE and five edits are queued at its seat** — see
  "Next up" item 2.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The one decision inside this card — *the T-058
  body owes the clock and shall assert it* — decides nothing outside one
  file and is recorded where the code is.
- **`graph.json` NOT regenerated and NOT committed**, because the gate
  was asked twice and said CURRENT both times.

## Provenance — SELF-DECLARED, never read off a trailer

T-130 is **built by `claude-opus-5`**, has **no verifier by the ceremony
table's own row**, and was **integrated by a second `claude-opus-5`
session** that neither wrote nor reviewed the lane's commits before
opening them. **`review: self-verified` is the honest label** — the field
records that no adversarial verifier seat was filled, and it stays that
way even though the integrator re-ran the drill from scratch, because the
field names the seat rather than the work. **The `Co-Authored-By` trailer
on this lane's commits is a harness constant and is NOT evidence of a
model** — T-085 proved it and T-101 sharpened it.

**95 done cards — 70 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 70 + 19 + 5 + 1 = 95. T-130 moves `self-verified` from
18 to 19.

## What ACTUALLY reached the human's running app

**NOTHING, AND THE CHANNEL IS CLOSED TWICE OVER.** Zero of this merge's
four paths are under `app/src-tauri/**` (the trigger that rebuilds and
relaunches the binary) and zero under `app/src/**` (vite HMR) — **so no
trigger set was touched at all**, which is the first time in four merges
that the answer needs no second argument. The second argument holds
anyway: `lsof -a -p 88948 -d cwd` reports the vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd, and
`app/node_modules/@nputer/parser` is a **RELATIVE** symlink
(`../../../lib/parser`), so it resolves inside its OWN checkout with its
own `lib/parser/dist`. **"MY DIFF IS TOOLING-ONLY" IS EXPLICITLY NOT THE
ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and this
integration DID rebuild `lib/parser/dist` — it just lands in a directory
the running app does not read.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **21:50:05** (before any
command that writes), at **21:58:42** (immediately after the merge's
working-tree write), and again at **22:03:39** after the e2e suite.
**Every reading identical.** The **anchored** process match —
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'` — reports
pid **53350**, started **2026-08-25 19:43:47**, which is the same pid and
start time T-104's, T-126's and T-129's checkpoints recorded, so **@human
has not restarted their app in four integrations**. A pid and a start
time are live-environment facts, not functions of a tree, and both are
already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were checked and all six were present, so **no fresh dependency
install was owed and no `npm ci` was run.** **The repair is still item 9
below, unwritten after TWELVE consecutive merges performed it by hand.**

**No process from this integration survives.** Scratch ports **15501**
(lane drill), **15502** and **15503** (e2e in main) were `lsof`-read free before
each bind and read back at zero rows afterwards; **a probe reserves
nothing, so the runner's own bind is what proves the port was free.**
**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-fourth** checkpoint running — not this integrator's, not
this merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that.
**No `pkill`. No `npm ci`. No `cargo clean`. No `git update-ref`, no
force-push, no history rewriting.** Be precise rather than claiming more
than is true: this integration's ONE `cargo test` run, the graph check
(twice) and the `arch` report all WROTE to main's
`app/src-tauri/target/`, which reads **3.5 GB**, as any cargo run must.
**ONE sibling worktree WAS entered and modified, deliberately and
reversibly**: `../nputer-T-130` hosted the four drill runs, was restored
by `git checkout -- <path>` and proved clean per path by sha256 and by an
empty `git status --porcelain` before removal. `../nputer-app`,
`../arch-verify`, `../nputer-T-127` and `../nputer-T-132` were read with
`git -C … rev-parse` and `lsof` only. No path was staged by wildcard;
**`git add -A` was never used**, and every write used
`git commit -- <paths>` so it could not sweep another hand's index —
which was not hypothetical tonight, with two lanes live.

## In progress / broken right now

**NOTHING IS BROKEN.** TWO lanes hold fences — **T-127** (`building`,
`[crate-index, docs/architecture/components/]`) and **T-132**
(`planned` on the board, `verifying` in its own lane and holding a
verifier checkout beside it — the open board-truth window above; three
`method/` FILES). Read `git worktree list` and each branch tip rather
than any table here.

**`tools/e2e` IS RELEASED.**

## Next up

1. **`T-133` IS THE CARD THIS MERGE MOST DIRECTLY UNBLOCKS**, and its
   subject is this checkpoint's own experience. `planned`, fence
   `[tools/e2e]`, **now FREE**. It makes a brief's contract rows
   derivable and **STATE's lane list DERIVED rather than typed** — and
   this pass is the argument: the previous edition of this file said
   `T-130` was "the only lane left", which was true when written and
   false forty minutes later when two lanes were cut. **A typed lane list
   is a snapshot of a fact that moves faster than the file.**
2. **`docs/CONVENTIONS.md` IS FREE AND FIVE EDITS ARE QUEUED AT ITS SEAT,
   ACROSS EXACTLY TWO BULLETS** — `T-104-s5` carries the argument. **THE
   RANGE RULE BULLET — two edits, to `T-093`** (`[docs/CONVENTIONS.md]`,
   `planned`): `T-091-s3`'s trigger-beside-the-ref clause and the
   `bdada11` sharpening, **both observed live again at this merge**.
   **THE POISON DRILL BULLET — three edits, to `T-092`**
   (`[docs/CONVENTIONS.md, app-agent]`, `planned`): `T-079-s3` items 2–3,
   **`T-130-s1`**, and T-129's binary-level generalisation. **THREE OF
   THE FIVE ARE ONE GAP SEEN THREE WAYS**: the bullet rules how a
   restoration is PROVED and never says what restoring MEANS, and all
   three of its proofs — a content hash, an empty `git diff`, a source
   read — are passed by a stale binary and by a moved clock alike.
   **Take them together or the bullet gets patched three times and still
   does not say it.**
   **AND `T-130-s1`'s OWN ROUTING LINE IS ALREADY STALE — DO NOT GIVE IT
   A SECOND HOME.** The file says `docs/CONVENTIONS.md` is *"held by
   T-104"*, which was true at T-130's dispatch; **`T-104` is `done` and
   the seat is `T-092`.** Recorded here rather than edited into the
   lane's filed suggestion, because disposition is a triage's call.
3. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
   (`T-091`, `T-102`, `T-120`). The three must be cleared in the same
   commit or the gate reds on arrival. Fence `[tools/e2e]`, **now FREE**
   — it has been blocked by this lane and is the cheapest thing on the
   board.
4. **`T-130-s2` — THE CLASS IS UNGUARDED EVEN THOUGH BOTH INSTANCES ARE
   FIXED.** The only two guards are assertions inside their own bodies,
   so a third plant-and-restore written tomorrow is lossy on arrival with
   nothing red. The card argues both remedies (a numbered lint pattern
   versus a `range-rule.spec.ts`-style enumerating body) and leans to the
   second. Fence `[tools/e2e]`, **now FREE**.
5. **`T-132` IS IN FLIGHT AND CARRIES RULING THIRTEEN**, which this and
   the last four checkpoints have all decided by and none could cite:
   *repair what the merge INTRODUCES, file what the merge merely
   REVEALS.* **Verified ABSENT from `method/` and `docs/CONVENTIONS.md`
   again at this ref** — `git grep` returns zero rows — and it is
   unmerged in the T-132 lane, whose `method/roles/integrator.md` carries
   it at line 40 at tip **`56821e7`**, so **it is written and still not
   citable.** This checkpoint applied it anyway: it **REPAIRED** nothing,
   because this merge introduces no defect; it **FILED NOTHING AND
   REPAIRED NOTHING** about `T-130-s1`'s stale routing line or the card's
   narrow trigger sentence, which it merely reveals — both are recorded
   above instead. **The card reads `planned` on main and `verifying` in
   its own lane, and it is in verification with a second worktree open on
   it** (the open window, above) — so the board understates it by two
   states, not one.
6. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
   returns zero rows, re-checked at this ref. Fence `method/` — **NOW
   PARTLY HELD**: `T-132` holds `lane-protocol.md`, `integrator.md` and
   `TASK-FORMAT.md`, which is where this belongs, so **it waits for
   T-132 or rides inside it.**
7. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
   unperformable under a path-granular fence, and the ruling its conflict
   rests on is NOT in `method/`. **The two are one card.**
   `method/roles/executor.md` is **FREE** — T-132's file-granular fence
   does not reach it, which is worth noticing: **a fence stated as three
   FILES rather than as `method/` left two neighbours dispatchable**, and
   that is `T-134`'s subject arriving as a benefit rather than a
   complaint.
8. **`T-126-s3` IS STILL THE MOST URGENT ROUTED ITEM ON THE BOARD.** Four
   written statements about C-15 are false on main right now: the
   registry `paths:` entry names a deleted file, the module header says
   `lib.rs` does not declare the module and that no command registers it,
   and `T-110-s9`'s EDIT ONE is still live. **Nothing reds** — a declared
   path matching no file produces no finding in either engine. Fence
   `[app-dispatch, docs/architecture/components/]` — **`app-dispatch` is
   free and `docs/architecture/components/` is now HELD by `T-127`**, so
   this one has to wait for that lane. Item 1 fires T-024's three-fixture
   rule; item 3 IS `T-110-s9`, so **one lane should take all of it**.
9. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — TWELFTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **FREE**.
10. **`T-127` IS THE LANE IN FLIGHT** — the cycle census, `blocked_by:
    [T-033]` satisfied since `8f8ec31`. **Read `T-126-s4` FIRST**: the
    indexer records `use` imports only, so a Rust `mod` declaration
    produces ZERO edges, and **a clean drift set is evidence about what
    the indexer can SEE, not about what the code DOES.**
11. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**, because `extract::ts::Cx::scan` descends every
    named child of the whole tree. Measured: the same shape is **exit 0
    as `.rs` and exit 134 as `.ts`**, and TS `namespace` chains abort at
    **2 000** against Rust's tightest **3 000**, so **TypeScript is the
    MORE exposed language**. **If you are about to cite T-129's card for
    the negative result, cite this paragraph beside it.**
12. **`T-129-s1` — `IndexOutcome::Error`'s DOC COMMENT PROMISES "never a
    panic" AND WAS FALSE FOR THIS CLASS.** `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, FREE). The replacement comment is ready to
    paste. **`T-129-s5`** — four numbers in one comment block inside C-07
    are exactly double the literals beneath them; **held by T-127** now.
    **`T-129-s2`** and **`T-129-s3`** are also `crate-index`, **held**.
13. **`T-125` IS FULLY UNBLOCKED** (`[app-agent, app-shell,
    docs/architecture/components/]`) **except for its third slug, now
    held by T-127.** **`T-107-s4`** needs `app/test/**`, free; read it
    beside **`T-110-s9`**.
14. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — which is `T-134`'s subject arriving early. Fence
    `[app-board, app-shell]`, both FREE.
15. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence.
16. **`T-104-s4` — FOUR DEFECTS IN T-104's OWN CRITERIA**. **`T-108-s1`**
    — the fourth stale citation. **`T-108-s4`** — the pathspec rule needs
    a ROOT clause. **`T-126-s6`** — the executor seat has no rule saying
    its gate derivation is stale at its own tip; **`T-126-s5`** — two
    fences on the board cannot be obeyed as written.
17. **`T-129-s4` — A LANE CUT BETWEEN A MERGE AND ITS CHECKPOINT INHERITS
    A RED GRAPH GATE.** This merge is a clean counterpart in a new way:
    the gate fired, was asked, and answered **CURRENT**, so a lane cut
    from `cea839e` inherits nothing at all.
18. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
19. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWO AND WANTS AN ELEVENTH
    TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-129-s1`…`s5`
    and `T-130-s1`…`s2` are untriaged. **`T-128-s1` and `T-123-s10` are
    GONE from the board** — absorbed into `T-132` at `74feb67` — so any
    brief still routing work to them is naming a deleted file.
20. **THE BOARD-TRUTH RULING** — SIXTEENTH ask, and the FIRST from an
    OPEN window in five checkpoints (see the lane list). **A PATTERN
    COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER.** **The GNU
    `xargs` column still closes at the first push**, and `git remote`
    still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This was the FIFTH brief in the deliberately-thin format, and
the first to be scored in three categories from the start — predictions,
facts and ARGUMENTS. **It also declared its own two known limits up front
("it does not protect an ARGUMENT" and "atmosphere figures slip
through") and instructed that any figure it stated be treated as suspect
and derived.** That instruction is what found the errors below, so **the
brief's most useful sentence was the one about its own unreliability.**

1. **A FACT THAT IS HALF TRUE, AND THE HALF THAT IS FALSE IS THE ONE IT
   LED WITH.** The brief's headline claim was that the card understates
   its trigger *"because `git reset --hard` rewrites the file's mtime and
   re-arms it"*, citing two of the brief author's own sightings. **The
   CONCLUSION is right and the MECHANISM is wrong.** Measured one
   operation at a time (the table at the top of this file): a
   `git reset --hard` on a clean tree does **not** move the mtime, and
   neither does one after an mtime-only change, nor a `git checkout`
   round trip. What DOES rewrite it is `git checkout -- <path>` and a
   `reset --hard` over **differing content**. So the sightings are real
   and the named cause is not sufficient. **The brief asked to be
   sharpened here and it could be**: the trigger is a WRITE OF THE BYTES,
   which is a strictly wider and strictly more precise statement than
   either the card's or the brief's.
2. **A FIGURE CARRIED AS ATMOSPHERE, WHICH IS THE FAILURE MODE THE BRIEF
   NAMED IN ADVANCE AND THEN COMMITTED.** *"It has led STATE's Next up
   for six consecutive checkpoints — derive that count rather than taking
   mine."* Derived over all 97 checkpoints: **six is exactly right and
   "consecutive" is false**, the run being broken twice. **The brief
   flagged the number and not the adverb**, which is precisely how an
   atmosphere figure survives: it arrives attached to a word nobody
   thinks to check. This is the fifth consecutive brief to carry exactly
   one such figure, and the first where the suspect part was not the
   digits.
3. **A PREDICTION THAT DID NOT FIRE, HEDGED CORRECTLY.** *"The rule for
   anything you find in the diff — repair what the merge introduces, file
   what it merely reveals — landed in `method/` tonight via `T-132`;
   check whether it is there yet rather than assuming, since `T-132` is a
   card and may not have been built."* **It has NOT landed.** `git grep`
   over `method/` and `docs/CONVENTIONS.md` returns zero rows at this
   ref; the rule is WRITTEN but unmerged, in the `T-132` lane's own
   `method/roles/integrator.md` at tip `56821e7`. **The hedge is what
   made the claim safe**, and it is the difference between a brief that
   is wrong and a brief that is merely early — the brief said *"it
   landed"* and then said *"check"*, and only the second clause was
   true.
4. **A FACT THAT WAS STALE BEFORE IT WAS WRITTEN, AND STALER BY THE
   MERGE.** The brief called T-130 *"the last card in tonight's
   integration queue"* and inherited this file's *"the only lane left"*.
   **Both were false at the merge**: `T-127` was dispatched onto main at
   `afe23c1` while this integration was reading, and `T-132`'s lane was
   already cut. **Three lanes existed at the moment of the merge, not
   one.** Nothing was lost, because the range was re-derived at the new
   main and fence disjointness was proved as sets against both — but a
   session that had proved disjointness once, at the start, would have
   proved it against a lane list that no longer existed. **This is
   `T-133`'s case, made by accident.**
5. **THE ARGUMENTS WERE ALL SOUND, AND ONE OF THEM WAS LOAD-BEARING.**
   *`T-130-s1` is already routed — do not give it a second home*:
   correct, and checking it surfaced something the brief could not have
   known — **the suggestion file's own routing line names `T-104`, which
   is `done`**, so the file and the brief disagree and the brief is
   right. *A green run proves nothing unless a fractional mtime was
   planted first*: correct, and it decided this merge's e2e run —
   `shell.ts` read WHOLE in main, so the as-found run would have been
   vacuous. *`tools/e2e` becomes free and unblocks `T-133`*: verified
   against the card's own `touches:`. *Ask GRAPH REGEN twice and never
   confirm by byte count*: asked twice, CURRENT twice. *Derive counts
   against the `running N tests` headers*: done, 474 = 471 + 3. *A
   probe reserves nothing*: both scratch ports re-probed immediately
   before binding. **Six traps, six measurements, none of them wrong.**
6. **WHAT THE THIN FORMAT COST ON ITS FIFTH TRIAL: TWO ERRORS, BOTH
   CHEAP, AND THE FORMAT CAUGHT NEITHER — ITS OWN INSTRUCTION DID.** The
   previous edition concluded that the format costs nothing because every
   figure is one command away. **This pass is the first to find errors,
   and both were in sentences the format was supposed to protect**: one
   fact and one adverb. **The remedy is not more figures.** It is the
   sentence this brief already carried — *if I state a figure below,
   treat it as suspect and derive it* — extended one word: **treat the
   figure AND ITS QUALIFIER as suspect.** "Six" survived derivation;
   "consecutive" was never tested because nobody reads an adverb as a
   claim.
