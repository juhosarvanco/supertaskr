# State

Updated: 2026-08-25 by the T-126 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN.**
This merge is **462 / 973 / 268 / 171 green**, and it is the merge that
made an already-shipped component EXIST: **T-110's lane reader was never
compiled into the binary, and every suite was green over it for a day.**
Three things will meet you before any real defect does: **the app suite
cannot even BUILD on a merged main until you rebuild lib/parser**, **three
known intermittents**, and **a graph regen whose FILE COUNT MOVES DOWN**
— the first downward move this repository has recorded, and the trap is
that a reader scanning for the usual `+1` misreads the direction.
**Derive the lane list before you cut anything**, and read the next five
sections before you debug anything.

**WHAT IS NEWLY FREE**: `app-shell`. **`T-125` IS NOW FULLY UNBLOCKED**
(`[app-agent, app-shell, docs/architecture/components/]` — all three
free) and so is **`T-107-s4`**, which needs `app/test/**`. **`T-126-s3`
is the most urgent thing this merge created** and it is described below;
it is NOT a defect in the merge, it is the cost of a fence violation the
verdict ratified by necessity.

## THE RULING THIS CHECKPOINT EXISTS TO CARRY — A FENCE WAS VIOLATED AND THE MERGE SHIPPED ANYWAY

**SAY THE WORDS OR THE PRECEDENT FORMS BY ACCIDENT.** T-126 deleted
`app/src-tauri/tests/dispatch_lanes.rs`, which is **C-15's path and
outside its own `[app-shell]` fence**, because its own criterion 7 told
it to. The verdict `de05430` ruled that **the fence should have held and
the criterion should have yielded** — and then declined to reject,
because restoring the file would itself be an edit to that same
component, making the violation **structurally non-remediable inside the
fence**. Its exact disposition: **"ratified by necessity, not
precedent."**

**THIS IS A BROKEN RULE, NOT AN OPEN QUESTION.**
`method/roles/executor.md:126` is unconditional and predates this card —
*"Widening the fence from inside the lane is the one repair this role may
never make"* — and `T-033-s4`, which this lane cites, already ruled the
class "not an executor's licence". **Held-by-no-live-lane is collision
risk, not authority.** The lane's own `T-126-s3` proves the distinction
bit: four written statements about C-15 became false in that commit and
**not one of them is reachable from `[app-shell]`**.

**WHY IT MATTERS MORE THAN THIS CARD.** An out-of-fence edit that ships
without the words *this was a violation* becomes the precedent that a
card's criteria outrank its fence — which nullifies every fence, since
**every** out-of-fence edit is made because some criterion seemed to want
it. If you are about to cite T-126 for anything, cite it for this.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** Immediately after T-033 landed, a second session ran `npm test`
from `app/` and saw **nine failures** across `architecture-derive`,
`architecture-dogfood` and `map-*`. It was reported as the ordinary
pre-checkpoint state of a merge that declares a new component. **That
diagnosis was wrong**, and the real cause is one every future integrator
will meet:

    $ npm run build          # from app/
    src/lib/architecture/derive.ts(530,36): error TS2339:
      Property 'nonCode' does not exist on type 'ComponentRecord'.
    exit 2

**`lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT.** T-033
adds `nonCode` to `lib/parser/src/types.ts`; the app resolves
`@nputer/parser` through a symlink to `lib/parser`, so it was compiling
against the PRE-merge types. `vitest` transpiles without typechecking, so
the suite still RUNS — and the dogfood fixtures red in a way that looks
exactly like an un-reconciled fixture. **One command clears it**:
`npm run build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT
IS A MERGE THAT CHANGES THE PARSER'S TYPES**, which only the diff can tell
you — CONVENTIONS files the parser-before-app ORDER under *fresh clone*,
so a fully-installed main checkout reads as exempt and is not. This
merge's parser diff is EMPTY — its only code files are
`app/src-tauri/src/lib.rs` and one app test — so the trap did not fire
here; the build was run first anyway, in that order, and both exits were
0. **Do not read a green build as evidence the trap is gone.**

**AND T-116's VERIFIER FOUND A SECOND, EARLIER LINK IN THE SAME CHAIN**,
which belongs beside this one: in a FRESH WORKTREE `npm run build` from
`app/` exits **2** with `Cannot find module '@nputer/parser/pure'` until
`lib/parser` is both INSTALLED and BUILT. `T-117` documents the
`app/dist` prerequisite; this is the step before it, and neither is in
CONVENTIONS.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-130`

**`tools/e2e/tests/token-scan.spec.ts` IS RED EXACTLY ONCE IN EVERY FRESH
CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES NOTHING.**
The tenth triage promoted `T-120-s3` (canonical), `T-052-s4` and item 1
of `T-079-s3` into **`T-130`** — one finding filed three times, in the
same file, on the same fence — and **all three suggestion files that
carried it are gone**. Cite `T-130`. It is `status: building` on
`[tools/e2e]` as this is written, and its tip `6dedc0d` is an ordinary
work commit.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a `Date`,
and a `Date` holds whole milliseconds** — so the restore writes back a
ROUNDED timestamp while the assertion compares the unrounded float it
captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND SIX PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** On the night of 2026-08-25 it fired
for **T-086, T-102, T-108, T-116 and T-104's own lane**. **It did NOT
fire at this merge**: the body passed BY NAME in the single 171-test run
(`P6 reds a planted bare motion utility and leaves its motion-safe twin
alone`, 208 ms), and main is not a fresh checkout. **DO NOT "FIX" IT BY
RE-RUNNING UNTIL GREEN**, and if you do run twice, DECLARE BOTH RUNS. The
fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. **AND THE FRESH-CHECKOUT
PREREQUISITE IS GONE**: T-052's lane reproduced the red ON DEMAND in a
healed worktree by planting a fractional mtime, so `T-130`'s executor can
drive it red in its own worktree without cutting a fresh checkout.

**`T-079-s3` IS NOT CLEARED AND MUST NOT BE READ AS CLEARED.** Only its
item 1 folded into `T-130`; **items 2–3 are `docs/CONVENTIONS.md` edits**
routed to `T-092` by T-104's checkpoint — see "Next up" item 4.

**CITE THE BODY BY NAME, NOT BY A LINE** — the plant-and-restore lives
inside `tools/e2e/tests/token-scan.spec.ts`'s test **"P6 reds a planted
bare motion utility and leaves its motion-safe twin alone"**, and the
mtime assertion the failure quotes is some forty lines further down
inside it. T-108's merge is the worked example of why this checkpoint
carries no digit: it shipped a line number that was **correct when
written and false thirty-one minutes later**.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS TWELVE CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory.** T-110's experiments named the cause: same TREE, two
checkouts, and then same CHECKOUT, two target dirs —

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
than five seconds with nothing in it** — and T-052 reproduced it. The
prediction keeps holding: `du -sh app/src-tauri/target` reads **3.0 GB**
here (unmoved at this precision across five checkpoints, though this
integration's cargo run, the boot gate's build, the regen, the `arch`
report and TWO `index --check` runs all wrote into it), and this merge's
`cargo test` ran the lib suite in **4.51s**, with the watcher body read
by NAME as `ok` rather than inferred from a green exit. **NINETEEN runs
across eleven integrations and not one lands between 9.5s and 14.6s.**
Read the lib suite's own time first; it tells you which regime you are in
before any assertion does.

**NOTE THAT THE LIB SUITE JUST GOT BIGGER AND DID NOT GET SLOWER.** It
carries **197** bodies here, **34** of them `dispatch::` bodies that were
in a separate test target until this merge, and 4.51s is still the green
band — against 4.23s at T-104's checkpoint with 34 fewer. The band is
about the TARGET DIRECTORY, not about the body count, and this merge is
the first evidence separating the two. **The 34 is measured
(`grep -c '^test dispatch::'`), not inferred from the totals.**

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository, and there are TWO of them right now: `lsof`
first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
had been declared settled at better than 400-to-1 on 15 clean-cache runs
that saw it zero times. **T-086's lane refuted that within the hour**: it
redded **1 in 4** full `cargo test` runs in a FRESH lane worktree — with
the `docs_watch` body GREEN and the lib suite at **3.97s**, inside the
healthy band — so the cache cliff cannot be what crossed its deadline.
Run alone the body is **5 green in 5**.

**THE SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 20**.
**Live, load-sensitive, ~1-in-20 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge (read by NAME,
`ok`), which is one more data point and not a reprieve. Read it beside
**`T-102-s3`**. Its fence `[app-agent]` is **FREE**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE SEVENTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says | tip is |
|---|---|---|---|
| **T-129** | `[crate-index]` | **building** | a **verdict** — APPROVED |
| **T-130** | `[tools/e2e]` | **building** | an ordinary work commit |

**T-126's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so TWO lanes hold
fences after it, down from three. **THE BOARD-TRUTH WINDOW IS STILL
CLOSED**: both live lanes read `building` on the board and hold a
worktree on their own branch, and no card reads `planned` while holding
one. That is a state, not an achievement — it re-opens at the next
dispatch.

**THE DETACHED-ENTRY RATIO IS 1:2 AND THAT IS THE FOURTH DIFFERENT ANSWER
IN TWO HOURS.** At 19:10 `git worktree list` returned FOURTEEN entries
with EIGHT detached non-lanes against five lanes; at 19:30, SEVEN with
ONE; at 19:48, SIX rows — main, four lanes and one detached; here it is
**five rows** before this checkpoint's removal and **four** after —
main, TWO lanes and ONE detached non-lane. **The row count has now moved
by more than half twice while the lane count moved by one each time.** As
T-108's checkpoint put it: *the instruction was right; the ratio is
weather.* **Derive the membership by FILTERING ON THE BRANCH; do not
quote this paragraph.** The one command that answers it:
`git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`.

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: it read `212543c` at the start and `212543c` at the end,
  so it is now **two merges and two checkpoints** behind main, and
  updating it is @human's one command to run when they choose, not this
  integrator's.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: `method/`,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`,
**`app-shell`**, `app-dispatch`, `app-interview`,
`docs/architecture/components/`, `lib-parser`, `.github/`, and every
`docs/tasks/` card path. **HELD: `crate-index` by T-129**, **`tools/e2e`
by T-130**.

## Just completed

**T-126 — the lane reader is declared, compiled into the library, and
reachable by one zero-argument command.** F-04, milestone 4, size S,
`touches: [app-shell]`. Main-before **`7c2ed1a`**, lane tip **`de05430`**
(derived with `git rev-parse`), merge **`4983174`**, this checkpoint its
direct child. `builder: claude-opus-5`, `verifier: claude-opus-5 @fresh`,
`built_by: claude-opus-5 @T-126 — code commit 0fa83da, notes cc49f81`,
`verified_by: claude-opus-5 @fresh — verdict de05430`,
**`review: same-model`**.

**WHAT LANDED.** `lib.rs` declares `pub mod dispatch;` and registers
**`dispatch_lanes`** in `generate_handler!` — the FIFTEENTH IPC command
and F-04's first, zero arguments with the project root taken from
`WatchState` on the `repo_churn`/`index_repo` pattern. IPC census
**14/14 → 15/15**, `comm -3` EMPTY at both ends. `acl_pin.rs` is a
0-file diff at its 92-grant sha256 `8d24cbad…` — an app command is not a
webview grant (ADR-012 applied rather than reopened). The `#[path]` shim
`app/src-tauri/tests/dispatch_lanes.rs` is deleted (see the fence ruling
at the top of this file).

### **THE FIGURE THAT PROVES THE CARD IS NOT THE PASS COUNT — IT IS THE TARGET LIST**

`cargo test`'s `test result:` lines go **16 → 15** while bodies go
**460 → 462**, and the `Running` lines no longer name
`tests/dispatch_lanes.rs` at all: the **34** `dispatch::` bodies now run
inside `unittests src/lib.rs`. **Two bodies are genuinely new, ZERO are
lost, and 34 moved from a test target into the library.** A session
reading only "462 passed" learns nothing about this. The error PATH is
the other sharp evidence, and it is the verifier's: at base rustc names
`tests/../src/dispatch/lanes.rs`, at tip `src/dispatch/lanes.rs …
could not compile nputer (lib)`.

### **`T-126-s4` IS A REAL ARCHITECTURE FINDING AND IT BEARS ON TWO OTHER CARDS**

**READ THIS BEFORE YOU TRUST ANY DRIFT NUMBER.** `lib.rs` now genuinely
depends on the dispatch component and **the graph gains ZERO edges** —
1903 before this merge's regen and 1903 after it. The indexer records
`use` imports only, so a `mod` declaration plus a path expression is
invisible to it.

**IT WAS REPRODUCED FOUR WAYS, AND THE FOURTH HAS A POSITIVE CONTROL THE
EARLIER THREE DID NOT.** In the freshly regenerated graph, edges from
`lib.rs` to any `dispatch/` file = **0**, while `lib.rs` carries **7**
outgoing edges in the same graph: four file edges and three cargo
packages. The four file edges are `agent/mod.rs`, `churn.rs`,
`docs_watch.rs` and `index_cmd.rs` — **exactly** the four modules
`lib.rs` reaches with a `use` statement. `dispatch` and `acl_pin` are
declared with `mod` and neither gets one. So the indexer is not failing
to see `lib.rs`; it sees it, records seven edges from it, and cannot see
this one. At the component level `arch` says the same thing louder:
**C-05 lists ELEVEN edges and C-15 is not among them**, so a real
C-05 → C-15 dependency produces **zero drift** rather than the
undeclared-edge finding C-10 gets.

**THE CONSEQUENCE FOR TWO CARDS THAT DO NOT KNOW YET.** `T-033`'s
zero-drift claim and `T-127`'s cycle census both rest on this indexer.
**A clean drift set is now evidence about what the indexer can SEE, not
about what the code DOES**, and any Rust dependency made this way is
absent from both. Neither card has been told; whoever picks either up
should read `T-126-s4` first.

### **THE FIRST DOWNWARD FIXTURE RECONCILIATION THIS REPOSITORY HAS DONE**

**THE GRAPH'S FILE COUNT MOVES DOWN AND ITS BYTE COUNT MOVES UP, AT ONE
REGEN.** `933 486 → 933 931 bytes` (**+445**), **179 → 178 files**,
1987 → 1990 symbols, **1903 → 1903 edges**, sha256 `c20d4212…` →
`c9dedabc…`. The `-1` is the deleted shim; the `+445` is `lib.rs` gaining
the declaration, the command body and their symbols (26 → 30). **A FILE
COUNT AND A BYTE COUNT ARE NOT EVIDENCE ABOUT EACH OTHER**, and every
previous entry in ARCHITECTURE's budget series moved both the same way.

Three assertions moved, in two files, all reconciled DOWNWARD: C-15's
file list (6 → 5) and tally row (6 → 5) and `fileComponent.size`
(179 → 178) in `app/test/architecture-dogfood.test.ts`, and the map hint
(179 → 178) in `app/test/map-dogfood-render.test.tsx`, plus the two body
TITLES that carried the old digits. **Derived from `arch` over the
regenerated graph BEFORE the suite was re-run**, on that body's own
standing instruction, rather than read off the failure — the first red in
the C-15 body hides three assertions below it and **one of those three
had moved**, so reading the failure would have shipped a second red.

### **THE JUDGEMENT CALL, AND THE CLAUSE IT NEEDED THAT NOBODY HAS WRITTEN**

*Repair what the merge INTRODUCES, file what the merge merely REVEALS.*
**Repaired**: the three dogfood assertions and their titles; the C-07
budget figure in ARCHITECTURE (ref-stamped beside its predecessors, never
overwritten); ARCHITECTURE's C-05 row, where every previous command
registration was recorded; ROADMAP's F-04 progress line and its milestone
census.

**FILED AND DELIBERATELY NOT REPAIRED**: `T-126-s3` — C-15's registry
still declares the deleted path and C-15's module header still says
*"No `#[tauri::command]` registers it and `lib.rs` does not declare it"*.
**Both became false AT this merge**, so the rule's first half reaches
them, and they were routed anyway for three reasons: the finding is
already fully fenced (`[app-dispatch, docs/architecture/components/]`,
both FREE); item 1 fires T-024's three-fixture rule, which is a card's
work and not a checkpoint aside; and removing the `paths:` entry would
discharge **`T-033-s8`** — an open question addressed to the architect —
**by side effect**. **An integrator repairs statements of FACT; it does
not settle an open architectural question the falsehood happens to sit
inside.** And where the falsehood is the visible COST of a ruled
violation, erasing it in the same breath as ratifying it is how "not
precedent" quietly becomes precedent. **That second clause is not written
anywhere and the bare one-liner would have decided this wrongly** —
filed as `T-126-s7`.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 7c2ed1a de05430 -> tree 3c991a8…, exit 0 (read from $? FIRST)
    git diff --name-only 7c2ed1a <TREE>                        ->   9   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 7c2ed1a..4983174  (THE MERGE'S DIFF)  ->   9   the only one that means anything
    git diff --name-only 7c2ed1a...4983174 (three dots AT the merge) -> 9   collapses, as it must
    git diff --name-only 41900d6..7c2ed1a  (main's advance)    ->  48
    git diff --name-only 7c2ed1a..de05430  (TWO dots, FORBIDDEN)  ->  57
    git diff --name-only main..HEAD        (FORBIDDEN)         ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 48 PATHS — 6.33x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **48** under this lane, the
branch **9**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 48 + 9 = 57 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. **22 of the forbidden form's 57
are PHANTOM DELETIONS**, main's advance appearing as deletions through a
drifted left endpoint. Ratios so far: T-110 **7.0x**, T-120 **1.2x**,
T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107 **2.25x**, T-102
**3.75x**, T-033 **1.94x**, T-091 **8.78x**, T-116 **15.80x**, T-108
**20.75x**, T-104 **3.54x**, T-126 **6.33x**. **The ratio is weather; the
left endpoint is the signal.**

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read a 9-path merge as an empty one and every gate
derived from it as NOT OWED** — GRAPH REGEN, BOOT GATE and DOCS GATE all
fire here and all three would have been skipped, silently, with a
clean-looking derivation. **The forbidden forms do not share a failure
direction**: one inflates, one ANNIHILATES, and only the second is
invisible.

**`<merge-base>..<tip>` GAVE THE RIGHT ANSWER HERE AND IS STILL
FORBIDDEN.** `41900d6..de05430` returns 9 — identical to the prescribed
set — because `41900d6` IS the merge base, so that spelling degenerates
into the three-dot form. **It is right by coincidence of this lane's
shape**: any main advance touching a path the lane also touched would
make the two diverge with nothing to signal it. Main advanced 48 paths
here and none of them collided, which is luck and not method.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`3c991a8ca6e0e4868b4add57243a047c9d5beba7` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`7c2ed1a` and `de05430` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** The exit was read from `$?` into a variable **BEFORE** any
substitution — exit **0**.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST EVERY LIVE LANE.** For
each of `T-129` (15 branch-only paths) and `T-130` (4), `comm -12` of
this merge's nine paths against that branch's own `merge-base..tip` diff
is **EMPTY**. Declared fences agree: none of `app-shell`, `crate-index`
or `tools/e2e` overlaps another.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR**, the second checkpoint
running. `git diff --cached --name-only` and `git diff --name-only` were
both EMPTY before the merge and again immediately before it, with one
`??` row; **`??` alone is not a ceremony.** `main` read `7c2ed1a` at
20:18:07 and again at 20:19:39, one command before `git merge`.

## THREE standing gates — ALL THREE fire, all THREE derived from the merge's own 9 paths

| gate | trigger | on these 9 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **3 — OWED** | **exit 1 STALE**, regenerated, **exit 0 CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — OWED** | exit **0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **BOOT GATE IS THE GATE THAT MATTERED MOST ON THIS CARD**, and it is
  worth saying why in one sentence: the defect T-126 fixes is precisely
  one that every suite passes and only a real build catches, so the boot
  check is the only step that proves `pub mod dispatch;` and the
  `generate_handler!` registration survive a real build and a real
  window. Exit **0** on scratch port **15431**, `lsof`-read free in the
  same command that bound it and zero rows after. **BOTH `[nputer]`
  lines observed**: `[nputer] project folder: /Users/ujju/Projects/nputer`
  and `[nputer] window "main" created`. Child pid 85205, process group
  captured, tree stopped on SIGTERM, no orphan. It builds and runs out of
  **main's own** `target/`, not @human's checkout.
- **GRAPH REGEN — OWED, ASKED, STALE, REGENERATED, ASKED AGAIN.** The
  trigger matches three of nine paths. Asked at the merge: **exit 1,
  STALE**, and it is a REAL red rather than the `--root` false red — it
  printed both sets of counts and a `files +0 -1 ~2` block, where a false
  red says `committed: MISSING`. Regenerated with the prescribed
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
  --ignored`, exit 0. Asked again: **exit 0, CURRENT**. **Asked a THIRD
  time after this checkpoint's fixture writes and it was STALE AGAIN,
  WITH EVERY HEADLINE FIGURE IDENTICAL ON BOTH SIDES** — see the finding
  below. Regenerated a second time, asked a FOURTH: **exit 0, CURRENT**.
  `graph.json` is committed **with this checkpoint** and not with the
  merge, and this pass is the sharpest demonstration yet of WHY.

### **THE IDENTICAL-FIGURES TRAP FIRED AT THE CHECKPOINT, NOT AT THE MERGE — A NEW PLACE FOR IT**

**T-104's checkpoint is titled for this trap and this is its second
worked example, reached by a different route.** At the MERGE the
staleness was loud: bytes, files and symbols all moved. **At the
CHECKPOINT it was silent.** `index --check` said STALE at exit 1 with

    committed:   933931 bytes · 178 files · 1990 symbols · 1903 edges
    fresh index: 933931 bytes · 178 files · 1990 symbols · 1903 edges

— all four identical — and only a `~2` block naming
`app/test/architecture-dogfood.test.ts (content, loc 1797 -> 1834)` and
`app/test/map-dogfood-render.test.tsx (content, loc 569 -> 583)`
separating them. The regen PROVES it rather than asserting it:
**933 931 bytes before and 933 931 bytes after**, and the sha256 moved:

    before  c9dedabc854f562b7239cba29bf0450abcf3a177afd2cc081faa9c330c68611c
    after   32db1b72ab582ec73c655898ce8acb55838a3c43c8a734f7e175329c677d1ba5

**THE CAUSE IS THE CHECKPOINT'S OWN FIXTURE RECONCILIATION**, which makes
this more general than T-104's instance. Editing two indexed test files
by comment and literal moves `loc` and the content hash and moves NO
count, because no symbol was added or removed. **A checkpoint that
reconciles a dogfood fixture has, by construction, made the graph stale
in the one shape no headline figure can show** — which is exactly the
mechanism `integrator.md` gives for regenerating at the checkpoint rather
than at the merge, arriving here as evidence instead of as an argument.
**ASK THE GATE. Twice, and again after your last write.**
- **DOCS GATE — exit 1, FIRES on 6 of 9, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **NOT the cargo suite**, and that is derived rather than assumed: all
  six paths are flat `docs/tasks/T-126*` cards, and the cargo readers
  read `docs/CONVENTIONS.md`, `docs/architecture/components` and a
  research capture — which is exactly the documented shape *a flat
  `docs/tasks/T-*.md` owes THREE*. Invoked DIRECTLY from the repo root
  with the RANGE RULE's own path list, **never through `xargs`**. **13
  derived docs readers across 4 suites**, census **130 sites in 22
  files**, **0 frontmatter issues**.

## Fixture reconciliation — THREE were owed, and that is DERIVED

**The graph's file and symbol counts DID move** (179 → 178, 1987 → 1990),
so both app dogfood fixtures had values to reconcile — see the downward
reconciliation above. **The parser pin is not owed**: no component file
changed and no component was declared, and the three-fixture rule
(T-024-s5) fires on DECLARING A COMPONENT. **This is derived from the
regen's own output and from `arch`, then CONFIRMED by re-running all
three owed suites after every doc write.**

**C-07's BYTE FIGURE WAS STALE AND IS REPAIRED**: ARCHITECTURE read
**933 486 bytes — 93.35%, 66 514 bytes of headroom** at T-116's
checkpoint and now carries **933 931 bytes — 93.39%, 66 069 bytes of
headroom** at T-126's, appended with its ref beside its predecessors
rather than overwritten, on the same precedent T-102's checkpoint set.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 462 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **FIFTEEN** `test result:` lines, lib suite **197 bodies in 4.51s**.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **465**, which is 462 + 3 ignored.
  That check is the one that catches a target aborting with no
  `test result:` line at all — the shape that produced an
  ordinary-looking pass/fail elsewhere while three bodies vanished. Do
  it; it costs one `awk`. **The 16 → 15 line count is the interesting
  half** — see "the target list" above.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**. **972 → 973 is the ONE TypeScript body this card adds**, the
  pin on the non-`cfg(test)` declaration — the only assertion that
  survives the command's disappearance. The lane measured 963/46 in its
  own worktree; the difference is main's 48-path advance, not this merge.
- **E2E: 171/171, exit 0, ONE RUN, 1.9m, on scratch port 15432.** The
  port was `lsof`-read free and **re-probed in the same command that
  bound it**, because a probe reserves nothing. The `T-130` mtime body
  passed BY NAME; main is not a fresh checkout. `range-rule.spec.ts` is
  25 of 25.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root`
  `ok`, `a_hostile_session_id…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`.
- **ALL THREE OWED SUITES RAN AGAIN AFTER THIS CHECKPOINT'S DOC WRITES**
  (T-081-s9), because every file it writes — the card, two new
  suggestion files, ARCHITECTURE, ROADMAP, both fixtures and this file —
  is a code input the census names. **EVERY RUN IS DECLARED, INCLUDING
  THE RED ONE**, because the rule is to declare every run and not only
  the ones that agree. **The app suite ran FOUR times**: run 1 at the
  merge before the regen (**973/973**), run 2 immediately after the regen
  (**970/973, 3 FAILED** — the fixture reconciliation, expected, and the
  reason the graph goes in the CHECKPOINT and not the merge), run 3 after
  the reconciliation (**973/973**), run 4 after all doc writes and the
  second regen (**973/973**). **The parser suite ran TWICE** (268/268,
  268/268) and **`tools/e2e` THREE times** (171/171, 171/171, 171/171,
  same scratch port 15432, re-probed immediately before each bind). **All
  runs agree on every derived count except app run 2, whose disagreement
  is the fixture reconciliation itself.**

### **THE DECLARE-EVERY-RUN RULE DOES NOT TERMINATE ON ITS OWN, AND HERE IS WHERE IT STOPS**

**This is worth one paragraph because every checkpoint meets it and none
has named it.** `docs/STATE.md` is a code input — two `tools/e2e` specs
walk the whole of `docs/` — so **a checkpoint that writes its own suite
counts into this file owes the suite that reads this file, and running it
produces a new count to write down.** Asked rather than assumed: the
DOCS GATE on this checkpoint's own correction commit exits **1** and owes
exactly one suite, `npm test from tools/e2e/`. That was run — the third —
and it is **171/171**.

**THE REGRESS TERMINATES ON AN INVARIANT, NOT ON A COUNT.** A fourth run
is owed by the correction that records the third, and the honest stopping
rule is this: **stop when a run AGREES with its predecessor and no figure
in the file moves**, because at that point every further run only
re-confirms an unchanged number and the sentence "every run agreed"
survives them all. What may never be done is stopping because the loop is
tiresome, or writing a run's result before running it. **171/171 three
times, on the same port, each re-probed.**
- **`range-rule.spec.ts` PRINTED ITS DISCLOSURE AGAINST THIS MERGE COMMIT
  BY NAME** on the second e2e run — *"`/Users/ujju/Projects/nputer @
  4983174` — GRAPH REGEN's published flip figures are stated at
  `ddcc8bb` and ARE RIGHT THERE, and its trigger has since gained `.rs`:
  5 of 5 at that ref, 1 of 1 under the trigger on disk"* — which is
  `T-091-s3`'s exact subject, observed rather than theoretical, for the
  second consecutive merge.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0**, **`npm run lint:tokens` exit 0**, at **TOKEN 135 / CONTROL
  735 before this checkpoint's commit** and **TOKEN 135 / CONTROL 737 at
  the checkpoint `ab02ff2`**, re-run there rather than predicted.
  **DERIVE IT AT YOUR OWN REF; it is not a constant** — CONTROL's corpus
  is `git ls-files`, so 731 → 735 is exactly this merge's five new
  tracked files less the one deleted shim, and **the +2 is the two
  suggestion files this checkpoint commits, which were invisible to
  CONTROL until the commit existed**. Neither is a TOKEN-root file, which
  is why TOKEN holds at 135. This is the second consecutive checkpoint to
  walk into that figure, and the reason it is stated with BOTH refs.
- **`index --check` WAS ASKED A FIFTH TIME AT THE CHECKPOINT COMMIT
  ITSELF** and is exit **0, CURRENT** at the same four figures
  (933 931 · 178 · 1990 · 1903). `npm run lint:docs` at the checkpoint
  reports **every live task card's frontmatter parses, with a legal
  status**, and **0 frontmatter issues** — the check that the two new
  suggestion files and the card's five stamped fields are well-formed.
  **The `T-126-s7` title is the one worth having checked**: it opens with
  a double quote, so the frontmatter QUOTES it, on the rule this file's
  own card bullet gives.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-126` was removed at **20:51:08** with
`git worktree remove`, after the merge and after the checkpoint
(lane-protocol rule 6), and `git worktree prune` was run behind it. **The
BRANCH survives**, which is this project's rule read off disk rather than
assumed: `git branch --list 'task/*'` returns **59**, unchanged by the
removal and including lanes merged weeks ago.
`task/T-126-lane-reader-compiled` still resolves to **`de05430`**, so the
verdict's own commit remains diffable. `git worktree list` now returns
**four rows — main, two lanes and @human's app checkout.**

### **THE CEREMONY TABLE PRICES THIS CARD LOWER THAN IT WAS RUN**

**Recorded because it is provenance and provenance is what `review:`
means.** T-126 is `size: S` touching shipped code, so
`method/tasks/TASK-FORMAT.md`'s row reads *executor → verifier, then the
executor integrates its OWN work once the verdict is in — the separate
integrator is still not owed.* **A separate integrator was dispatched
anyway.** That is MORE ceremony than the table requires, never less, and
it is not a defect in either direction; it is worth writing down because
a later reader counting third-hand integrations should know this one was
optional. It also means lane-protocol rule 6's worktree-survives-the-
verdict clause bound here exactly as it binds an M card.

## The board, derived from disk at this checkpoint

**267 flat task files — 93 done / 35 planned / 41 parked / 96 suggested /
0 verifying / 2 building; 26 in `rejected/`.**
93 + 35 + 41 + 96 + 0 + 2 = 267. T-126's stamp moves done from 92 to 93
and clears the single `verifying`; the merge brought five suggestions and
this checkpoint files **two** more.

**THE SUGGESTION BACKLOG IS NINETY-SIX AND WANTS AN ELEVENTH TRIAGE.**
`T-126-s1`…`s5` came in with the merge and `T-126-s6`…`s7` are filed
here; **none of the seven is triaged**, because disposition belongs to a
triage pass and not to an integrator (T-083's ruling), so they stay
`status: suggested` exactly as filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's and the verifier's own text
  is preserved byte-untouched** — this checkpoint made NO in-place
  repairs to either, which is unusual enough to state.
- **ARCHITECTURE — TOUCHED, two places**: C-07's budget figure gains
  T-126's ref-stamped entry, and C-05's row gains the `dispatch_lanes`
  registration with the fence ruling attached. No component is declared.
  **The derived slug block was re-read off disk** against every
  component's `touch_slugs:` and matches unchanged — all eight slugs, 13
  components, exactly one empty `touch_slugs:` (C-01).
- **ROADMAP — TOUCHED**: F-04 progress goes **3 of 6 → 4 of 7**, the
  written-set sentence goes six → seven, the milestone-4 census goes
  86/6 → **92/7**, T-126 gets its landing paragraph and the cost line
  gets its ref-stamped byte figure. **The correction style is T-101's** —
  corrected in place with the ref, never deleted.
- **CONVENTIONS — NOT TOUCHED.** Neither the merge nor the checkpoint
  changes it. **The five edits queued at its seat are unchanged and still
  routed** — see "Next up" item 4.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017; the fence ruling is a ruling ON an existing
  rule (`executor.md:126`) rather than a new decision, and it is recorded
  on the card and at the top of this file.
- **`graph.json` regenerated and committed HERE**, not in the merge.

## Provenance — SELF-DECLARED, never read off a trailer

T-126 is **built by `claude-opus-5`**, **verified by a separate
adversarial `claude-opus-5` session** that declared a BOUNDED READ (card
read at base `41900d6`, attack set written down before the diff, notes or
tests were opened, in a detached worktree outside the repository with its
own `CARGO_TARGET_DIR`), and integrated by a **third hand** that neither
built nor verified it. **`review: same-model` is the honest label and
ruling SEVEN is why** — the field is provenance, and both hands were the
same model. **The independence that pays here was INFORMATIONAL and it
was real**: the verifier ran seven of its own mutants beyond the lane's
five, caught a regex-evasion attempt on the declaration pin, verified
`T-126-s4` a third way the lane had not run, **ruled AGAINST the lane it
approved on the fence**, and corrected a mechanism claim that was wrong
in the lane's notes AND in its own brief. **The `Co-Authored-By` trailer
on this lane's commits is a harness constant and is NOT evidence of a
model** — T-085 proved it and T-101 sharpened it.

**93 done cards — 69 `same-model`, 18 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 69 + 18 + 5 + 1 = 93. T-126 moves `same-model` from 68
to 69.

## What ACTUALLY reached the human's running app

**NOTHING, AND THE PREDICTION WAS MADE BEFORE IT WAS CHECKED.** Two of
this merge's nine paths are under `app/src-tauri/**` — the trigger that
rebuilds and RELAUNCHES the binary — and zero under `app/src/**` (vite
HMR). **In the MAIN checkout that would relaunch; in @human's checkout it
cannot, because @human's app serves from a DIFFERENT checkout that this
merge does not touch.**

**THE CHANNEL IS CLOSED BY MEASUREMENT RATHER THAN BY ASSUMPTION**, and
re-derived here rather than inherited: `lsof -p 53350` reports the
binary's cwd and text as
`/Users/ujju/Projects/nputer-app/app/src-tauri/…`, and `lsof -p 88948`
reports the vite serving 1420 has `/Users/ujju/Projects/nputer-app/app`
as its cwd. `app/node_modules/@nputer/parser` is a **RELATIVE** symlink
(`../../../lib/parser`), so it resolves inside its OWN checkout, and
`/Users/ujju/Projects/nputer-app` has its own `lib/parser/dist`. **"MY
DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER TO THE DEPENDENCY
QUESTION** (integrator.md rule 2), and this integration DID rebuild
`lib/parser/dist`, which is the exact channel.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **20:18:19** (before any
command that writes), at **20:20:05** (immediately after the merge's
working-tree write), at **20:30:00** (immediately after the BOOT GATE,
the one step that could plausibly have collided) and at **20:51:31**
(after the checkpoint and the worktree removal). **All four readings
identical.** The **anchored** process match —
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'` — reports
pid **53350**, started **2026-08-25 19:43:47**, unchanged at every
reading. That is the same pid and start time T-104's checkpoint recorded,
so **@human has not restarted their app since**; a pid and a start time
are live-environment facts, not functions of a tree, and both are already
stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** **The repair is
still item 8 below, unwritten after TEN consecutive merges performed it
by hand.**

**No process from this integration survives.** Scratch ports **15431**
(boot gate) and **15432** (e2e) were `lsof`-read back at zero rows.
**TWO UNTRACKED FILES SIT IN THE MAIN CHECKOUT AND NEITHER IS THIS
INTEGRATION'S**, both named here because `integrator.md` rule 4 asks for
exactly that and because **whose a file is, is evidence**.

1. The zero-byte `z` (dated 2026-08-23) is still there for the
   **twenty-second** checkpoint running — not this integrator's, not this
   merge's, not staged, **left alone**.
2. **`docs/tasks/T-133-…-become-commands.md` ARRIVED DURING THIS
   INTEGRATION**, at **20:55:28**, between this checkpoint's commit and
   its second correction. **It is not unexplained and it is not a
   violation**: it is `status: planned`, which only the architect writes,
   and it says so itself. It was **left alone and never staged** — this
   checkpoint's writes all used `git commit -- <named paths>`, which is
   the mechanism that made sweeping it impossible rather than merely
   unlikely.

**AND IT MAKES ONE STATEMENT IN THIS FILE STALE, WHICH IS SAID HERE
RATHER THAN QUIETLY FIXED.** "Next up" below lists `T-131` as *the one
@human owes a ruling on*. `T-133`'s own frontmatter says **@human adopted
items 1 and 2 of `T-131`'s five process changes on 2026-08-25**, and
names `T-132` as the prose half. **So T-131 is at least half ruled and
this file's item 9 is behind the tree.** `T-133` is `touches:
[tools/e2e]`, **held by T-130**, so it cannot dispatch until that lane
merges. Read the cards, not this paragraph — they were written after it.

**THE BOARD CENSUS BELOW IS STATED AT THIS CHECKPOINT AND IS ALREADY ONE
FILE BEHIND.** 267 flat files were on disk when it was derived; `T-133`
makes 268, untracked at that moment. **A count is a function of a tree
and of a MOMENT**, and this is the first checkpoint able to say so with
the two timestamps in hand. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test`, the boot gate's build, the graph regen, the
`arch` report and THREE `index --check` runs all WROTE to main's
`app/src-tauri/target/`, which reads **3.0 GB**, as any cargo run must.
**No sibling worktree was entered or modified** — `../nputer-T-129` and
`../nputer-T-130` were read with `git rev-parse` and `git log` only;
`../nputer-app` was read with `git -C … rev-parse` and `lsof` only; the
T-126 worktree was read and then removed by this checkpoint. No path was
staged by wildcard; `git add -A` was never used, and the write used
`git commit -- <paths>` so it could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN.** TWO lanes hold fences — **T-129** and **T-130** —
and **T-129 IS APPROVED AND QUEUED FOR INTEGRATION** (verdict at its tip
`73651cb`). `T-130`'s tip `6dedc0d` is an ordinary work commit. Read
`git worktree list` and each branch's tip rather than any table here.

**BOTH ARE A LIVE DEMONSTRATION OF RULING NINE.** Each card reads
`status: verifying` ON ITS OWN BRANCH and `status: building` on main,
because the stamp is lane-local until the merge carries it. **The board
therefore reports `0 verifying / 2 building` while one card is past
verification** — the gap ruling NINE documents and deliberately REFUSES
to fix with a ninth status. **The honest reader is the lane list plus
each branch's own copy of its card.**

**`app-shell` IS RELEASED**, which unblocks `T-125` completely and
`T-107-s4` besides. `app-dispatch` and `docs/architecture/components/`
are both free, which is what `T-126-s3` needs.

## Next up

1. **`T-129` IS APPROVED AND READY TO INTEGRATE** — verdict at its tip
   `73651cb`, fence `[crate-index]`, size M. It is the next merge.
2. **`T-126-s3` IS THE MOST URGENT THING THIS MERGE CREATED**, and it is
   not a defect in the merge — it is the routed cost of the fence
   violation the verdict ratified. Four written statements about C-15 are
   false on main right now: the registry `paths:` entry names a deleted
   file, the module header says `lib.rs` does not declare the module and
   that no command registers it, and `T-110-s9`'s EDIT ONE is still live.
   **Nothing reds** — a declared path matching no file produces no
   finding in either engine, which is worth recording as much as the edit
   is. Fence `[app-dispatch, docs/architecture/components/]`, **both
   FREE**. Item 1 fires T-024's three-fixture rule; item 3 IS `T-110-s9`,
   so **one lane should take all of it**.
3. **`T-126-s4` BEARS ON `T-033` AND `T-127` AND NEITHER KNOWS.** See the
   finding above. Whoever picks up `T-127`'s cycle census or re-reads
   `T-033`'s zero-drift claim should read it first: a clean drift set is
   evidence about what the indexer can see, not about what the code does.
   `T-127` is `planned`, fence `[crate-index, docs/architecture/
   components/]`, **`crate-index` held by T-129**.
4. **`docs/CONVENTIONS.md` IS FREE AND FIVE EDITS ARE QUEUED AT ITS SEAT,
   ACROSS EXACTLY TWO BULLETS** — unchanged from T-104's checkpoint,
   which derived them; `T-104-s5` carries the argument. **THE RANGE RULE
   BULLET — two edits, to `T-093`** (`T-091-s3`'s trigger-beside-the-ref
   clause and the `bdada11` sharpening; both are hand hazards and both
   were observed live again during this integration — the `merge-tree`
   exit was read from `$?` before the substitution). **THE POISON DRILL
   BULLET — three edits, to `T-092`** (`T-079-s3` items 2–3, `T-130-s1`,
   and T-129's binary-level generalisation, which asks to be taken in ONE
   edit). **`T-130` IS UNMERGED AND ITS FENCE DOES NOT REACH
   CONVENTIONS**, so its integrator will meet this same routing question
   — `T-104-s3` firing a fourth time before it has been triaged.
5. **`T-126-s6` — THE EXECUTOR SEAT HAS NO RULE SAYING ITS GATE
   DERIVATION IS STALE AT ITS OWN TIP.** Filed here, and this lane is the
   worked example: it measured its gates at its CODE commit `0fa83da`,
   where the DOCS GATE is **NOT OWED** on 0 docs paths, and its tip
   `de05430` carries **6** and fires on three suites. **Only that one
   gate moves** — GRAPH REGEN and BOOT GATE answer identically at both
   refs — so nothing in the lane's report looks wrong. T-104's ruling
   FIVE says exactly this and **landed in `method/roles/verifier.md`
   only**; `executor.md` asks for "every figure with its ref", which this
   lane DID. Fence `[method/]`, **FREE**. And the lane could not have
   read it either way: its code commit predates T-104's merge by two
   hours.
6. **`T-126-s7` — THE RULE EVERY CHECKPOINT DECIDES BY IS WRITTEN IN NO
   FILE.** *Repair what the merge introduces, file what the merge merely
   reveals.* `git grep` over `method/` and `docs/` returns zero rows;
   three consecutive checkpoints have derived it, applied it and
   hand-carried it in a dispatch brief. It also needs a second clause
   this merge is the evidence for — see the judgement-call section above.
   Fence `[method/]`, **FREE**, and a sibling of item 7.
7. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
   returns zero rows. Every integrator does it — this one included, and
   it matched the merge's tree byte for byte again. Fence `method/`,
   **FREE**. Take it with items 5 and 6; all three are one file.
8. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — TENTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into** — which is exactly the command this
   integration used to close the channel. Fence `[docs/CONVENTIONS.md]`,
   **FREE**.
9. **`T-131` IS UNBLOCKED AND IT IS THE ONE @HUMAN OWES A RULING ON.**
   `status: planned`, `touches: [method/, docs/CONVENTIONS.md]` — both
   FREE — size M, `@human: yes`. A ranked set of five process changes
   with the measurements attached. **It is not this integrator's to
   triage or summarise.**
10. **`T-125` IS FULLY UNBLOCKED FOR THE FIRST TIME.** `[app-agent,
    app-shell, docs/architecture/components/]` — all three free — and it
    takes the last undeclared row, `C-10 → C-14`.
11. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN**, ready to paste.
    Needs `app/test/**`, C-05 `app-shell` — **now FREE.** Read it beside
    **`T-110-s9`**, which `T-126-s3` item 3 also names.
12. **`T-126-s5` — TWO FENCES ON THE BOARD CANNOT BE OBEYED AS WRITTEN**,
    this card's own criterion 7 being one of them. Untriaged, and it is
    the finding the fence ruling above is about.
13. **`T-126-s1` — THE WIRE GAINED A WRAPPER `dispatch-store.ts` DOES NOT
    MIRROR**, and **`T-126-s2` — THE JOIN HAS NO ZERO-ARGUMENT SHAPE**
    and was routed rather than fitted. Both bear on `T-111` and `T-112`.
14. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its
    conflict rests on is NOT in `method/`. **The two are one card**, and
    the same file as items 5, 6 and 7.
15. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`). The three must be cleared in the same
    commit or the gate reds on arrival. Fence `[tools/e2e]`, **held by
    T-130**.
16. **`T-108-s1` — THE FOURTH STALE CITATION**, in T-081's own verifier
    notes. Fence `[docs/tasks/T-081-denial-reaches-the-screen.md]`, free.
17. **`T-108-s4` — THE PATHSPEC RULE NEEDS A THIRD CLAUSE: THE ROOT.**
    `git grep -- .` from a subdirectory silently scopes itself and
    answers exit **1** on a string that is present.
18. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **FREE**.
19. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **FREE**.
20. **`T-104-s4` — FOUR DEFECTS IN T-104's OWN CRITERIA**, filed rather
    than repaired because all four predate that merge. Fence
    `[docs/tasks/T-104-…md]`, free.
21. **`T-128` — SILENT CORRUPTIONS OF SHARED STATE**, `planned`, fence
    `[method/, docs/CONVENTIONS.md]`, **BOTH FREE**.
22. **THE COMMENT CORRECTION IN `churn-source.ts`** —
    `onProjectMaybeChanged`'s doc comment claims it inherits the
    single-flight latch; it nulls `inFlight` on the line before.
    `[app-map]`, free.
23. **THE TWO UNPINNED GUARDS IN `map-churn-age.test.tsx`** — both
    CORRECT, both unpinned, probes in T-116's verdict. `[app-map]`, free.
24. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live and
    visible: `arch` says `drift_components=3`, TypeScript says 1. Both
    figures re-observed at this merge. Rides `[crate-index]`, **held by
    T-129**.
25. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint.** Whoever lands T-111 should collapse ruling NINE's two
    homes into a citation rather than leave two descriptions of one
    thing.
26. **THE SUGGESTION BACKLOG IS NINETY-SIX AND WANTS AN ELEVENTH
    TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5` and `T-126-s1`…`s7` are untriaged.
27. **THE BOARD-TRUTH RULING** — FOURTEENTH ask, third consecutive one
    from a CLOSED window.
28. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
29. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This brief was the THIRD written to the deliberately-thin
format, on the rule T-108's checkpoint derived: *a brief carries what the
repository cannot say about itself, and nothing else.* T-108 predicted
the format's errors would be PREDICTIONS rather than TRANSCRIPTIONS;
T-104 found four of five were, with one that was neither. **This pass
found only TWO errors in four checked claims, and the interesting result
is the KIND: one is a TRANSCRIPTION — the failure mode this format exists
to eliminate — while two of the four were not merely right but right for
their stated reasons, one of them after this checkpoint had already
written it up as wrong.** All four are listed below, the right ones
included, because a list of only the errors is not a measurement of a
format.

1. **A TRANSCRIPTION, WHICH THE THIN FORMAT WAS SUPPOSED TO MAKE
   IMPOSSIBLE.** The brief stated *"the detached-to-lane ratio swung from
   8:5 to 1:5 tonight"* and *"THE FORBIDDEN FORM HAS OVERSTATED BY UP TO
   20.75× TONIGHT"* — both carried FIGURES, and the format's whole claim
   is that it carries none. The 20.75× is correct as a historical maximum
   (T-108's) but reads as a live expectation; the real ratio here is
   **6.33×**. **A thin brief can still smuggle numbers in as
   atmosphere**, and atmosphere is what a reader calibrates against.
2. **A PREDICTION THAT WAS RIGHT, AND THIS CHECKPOINT NEARLY RECORDED IT
   AS WRONG.** *"Ask GRAPH REGEN twice and never confirm by byte count …
   this lane's regen moves the file count DOWN."* Both halves paid. The
   direction warning was correct and useful — 179 → 178, the first
   downward move this repository has recorded. **And this section
   originally said the identical-figures half did NOT apply here**, on
   the reasoning that every headline figure moved at the merge, so a
   byte-count check would have caught it. **That was written before the
   THIRD ask.** The trap then fired at the checkpoint, on this
   integrator's own fixture writes, with all four figures identical and
   only a `~2` block separating them — the finding above. **The brief
   was right, right for its stated reason, and one step later than the
   reader assumed.** Recorded in this shape deliberately: a checkpoint
   that only reports its final beliefs hides the fact that the
   instruction was load-bearing at the exact moment it was being
   dismissed.
3. **A PREDICTION THAT UNDERSTATED ITS OWN CASE.** *"Your diff touches
   `app/src-tauri/**`, which is the relaunch trigger set, so predict what
   that does and then check."* Correct and worth doing — but the brief
   presented it as a live risk, and it is not one on this machine any
   more: @human's app has served from a SECOND CHECKOUT since 2026-08-25,
   so the trigger set cannot reach it from a merge into main. The
   prediction was "it will not relaunch" and the reason is structural,
   not lucky. **The brief asked for a measurement whose answer the
   repository already determines.**
4. **AND ONE THING THE BRIEF GOT EXACTLY RIGHT THAT IS WORTH MORE THAN
   THE THREE ERRORS.** It said the fence rule *"already exists at
   `method/roles/executor.md:126` and predates this card, so this is a
   broken rule and not an open question"* — and it does, at that line,
   verbatim, verified here rather than trusted. **A line citation that
   survived** is worth noting in a project whose last merge shipped one
   that went stale in thirty-one minutes; this one held because the file
   it points into was frozen by T-104's merge thirty minutes before the
   brief was written. That is luck with a mechanism, not a refutation of
   *cite by name*.

**WHAT THE THIN FORMAT COST, ANSWERED PLAINLY BECAUSE TWO INTEGRATORS
HAVE NOW BEEN ASKED.** **It cost nothing, and it saved the one thing that
mattered.** Every figure was one command away and every one of them was
there. What the brief carried that the repository could NOT say — the
verdict's location, the phrase "ratified by necessity, not precedent" and
the instruction to carry it, `T-126-s4`'s bearing on two cards that do
not know, and the judgement rule that lives in no file — was the whole of
what this checkpoint needed a human hand for, and **three of those four
are now written into the tree by this checkpoint**, which is the point.
**The format's remaining risk is the one item 1 names**: not a wrong
number, but a number carried as atmosphere in a document that promises
none.
