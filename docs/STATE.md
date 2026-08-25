# State

Updated: 2026-08-25 by the T-129 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN.**
This merge is **471 / 973 / 268 / 171 green**, and it is the merge that
stopped a single hostile FILE from killing the whole app: the indexer runs
inside the Tauri process, a Rust stack overflow is an `abort()` and not a
catchable panic, and until tonight one generated source file with
pathological nesting took the window, the docs watcher, the agent runner
and any interview mid-turn with it at **exit 134**. Four things will meet
you before any real defect does: **the app suite cannot BUILD on a merged
main until you rebuild `lib/parser`**, **`npm run typecheck` from `app/`
DOES NOT EXIST**, **three known intermittents**, and **a fifth shared
surface nobody had named until tonight — the checkout's test runner, and
its sibling, the checkout's EDITOR.** **Derive the lane list before you
cut anything**, and read the next five sections before you debug anything.

**WHAT IS NEWLY FREE**: `crate-index`. That unblocks **`T-127`** (the
cycle census, whose `blocked_by: [T-033]` is long since satisfied and
which was held only by this fence) and **`T-033-s11`**, and it is what
`T-129-s2` and `T-129-s3` need. **`tools/e2e` is still HELD by T-130**,
which is the only lane left.

## THE FINDING THIS CHECKPOINT EXISTS TO CARRY — T-129's OWN CARD HAS THE EXPOSURE BACKWARDS

**SAY IT HERE BECAUSE THE CARD WILL BE READ BY WHOEVER TOUCHES THE
INDEXER NEXT, AND THE CARD IS WHERE THE ERROR LIVES.** T-129's card
proves the crash is the traversal's rather than tree-sitter's with one
measurement: *"10 000 nested braces inside a function body — which
tree-sitter parses in full and the extractor deliberately does not descend
into — is exit 0."* **It states that without naming a language, and it is
true of `.rs` and FALSE of `.ts`.** `extract::ts::Cx::scan` is the
candidate scan and it descends EVERY named child of the whole tree,
function bodies included — candidates are exactly the things inside
function bodies. Measured by the lane and reproduced independently by the
verifier: the same shape is **exit 0 as `.rs` and exit 134 as `.ts`**.

**AND THE INVERSION IS REAL, NOT A QUIBBLE.** The card frames TS as the
afterthought (*"the same class exists on the TS side"*). Bisected: TS
`namespace` chains abort at **2 000** against the tightest Rust threshold
of **3 000**, so **TypeScript is the MORE exposed language**. The
verifier also corrected the lane's own TS table IN THE LANE'S FAVOUR — the
member chain aborts at **6 000**, not the 10 000 the lane reported, so
that row UNDERSTATED the exposure by a further 40%. All three Rust rows
reproduce exactly on the card's own grid.

**WHY IT MATTERS AFTER THE FIX.** Nothing in the diagnosis changes — the
recursion was ours either way, and all six traversals are bounded now. But
a reader who takes *"the extractor does not descend into function bodies"*
as a property of the CRATE will look for the next TS bug in the wrong
place. It is a property of the RUST extractor's design and of nothing
else. **If you are about to cite T-129's card for the negative result,
cite this paragraph beside it.**

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
checkout reads as exempt and is not. This merge's parser diff is EMPTY —
its nine code files are all under
`app/src-tauri/crates/nputer-index/` — so the trap did not fire here; the
build was run first anyway, in that order, and every exit was 0. **Do not
read a green build as evidence the trap is gone.**

**AND T-116's VERIFIER FOUND A SECOND, EARLIER LINK IN THE SAME CHAIN**:
in a FRESH WORKTREE `npm run build` from `app/` exits **2** with
`Cannot find module '@nputer/parser/pure'` until `lib/parser` is both
INSTALLED and BUILT. `T-117` documents the `app/dist` prerequisite; this
is the step before it, and neither is in CONVENTIONS.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Derived at this checkpoint rather than trusted**: `app/package.json`'s
scripts are exactly `dev`, `build`, `preview`, `test`, `tauri` — there is
no `typecheck`. `npm run typecheck` from `app/` exits **1** with `Missing
script`, which a hurried reader takes for a compile failure. **The app's
typecheck is the TWO `tsc` calls inside `npm run build`** —
`tsc && tsc -p tsconfig.test.json && vite build` — and the second one is
load-bearing rather than tidy: without it nothing in the repository
typechecks any of the app's test files (T-073). `lib/parser` and
`tools/e2e` DO have a `typecheck` script; `app/` is the exception, and
that asymmetry is the whole trap.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-130`

**`tools/e2e/tests/token-scan.spec.ts` IS RED EXACTLY ONCE IN EVERY FRESH
CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES NOTHING.**
The tenth triage promoted `T-120-s3` (canonical), `T-052-s4` and item 1
of `T-079-s3` into **`T-130`** — one finding filed three times, in the
same file, on the same fence — and **all three suggestion files that
carried it are gone**. Cite `T-130`. It is `status: building` on
`[tools/e2e]` as this is written.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a `Date`,
and a `Date` holds whole milliseconds** — so the restore writes back a
ROUNDED timestamp while the assertion compares the unrounded float it
captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND**, which is what turns a
warning into an identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** **It did NOT fire at this merge**: the
single 171-test run was green and main is not a fresh checkout. **DO NOT
"FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you do run twice, DECLARE
BOTH RUNS. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. **AND THE FRESH-CHECKOUT
PREREQUISITE IS GONE**: T-052's lane reproduced the red ON DEMAND in a
healed worktree by planting a fractional mtime.

**`T-079-s3` IS NOT CLEARED AND MUST NOT BE READ AS CLEARED.** Only its
item 1 folded into `T-130`; **items 2–3 are `docs/CONVENTIONS.md` edits**
routed to `T-092` — see "Next up" item 4.

**CITE THE BODY BY NAME, NOT BY A LINE** — the plant-and-restore lives
inside `tools/e2e/tests/token-scan.spec.ts`'s test **"P6 reds a planted
bare motion utility and leaves its motion-safe twin alone"**. T-108's
merge is the worked example of why: it shipped a line number that was
**correct when written and false thirty-one minutes later**.

## **A FIFTH SHARED SURFACE, AND ITS SIBLING — BOTH FOUND TONIGHT, BOTH DURING THIS INTEGRATION**

**`T-128` LISTS THE INDEX, THE REF NAMESPACE, THE SCRATCH DIRECTORY AND
THE BOARD. IT DOES NOT LIST THESE TWO, AND BOTH COST SOMETHING TONIGHT.**
Filed by the architect as **`T-128-s1`**.

**1. THE CHECKOUT'S TEST RUNNER.** The architect ran `npm test` from
`tools/e2e/` in the main checkout while this integrator was working there,
and it came back **2 failed / 169 passed**:

    accelerators.spec.ts:151      30s timeout on locator.click
    docs-input-gate.spec.ts:787   Error: Invalid package config
                                  …/tools/e2e/package.json

**NEITHER IS A DEFECT.** That `package.json` is valid JSON and `git
status` reports it untouched; "Invalid package config" on a provably fine
file is the signature of **two npm/Playwright runs in the same directory
at the same time**, and the 30-second click timeout is the same collision
from the other side. Re-run alone once the runner was free: **171 passed,
exit 0.** This integrator's own single run, taken later on scratch port
15434 with the runner uncontended, is likewise **171/171**.

**THE TELL IS THE ABSENCE OF THE DIGITS, AND THAT IS THE REUSABLE HALF.**
This is the first e2e red recorded in this repository that is **neither a
real defect nor `T-120-s3`**, and the way to tell the three apart is now
one question: *does the failure carry a fractional millisecond against a
whole number?* If yes it is `T-120-s3`. If no, and the message accuses a
file that `git status` says is untouched, **ask who else is running before
you debug your own change.** Do not attribute a red in a shared window to
`T-120-s3` without checking its signature.

**2. THE CHECKOUT'S EDITOR, WHICH IS THE SHARPER OF THE TWO BECAUSE
NOBODY WAS TOUCHING ANYBODY'S FILE.** While this integration was deriving
its range, the architect held an **unstaged edit to a TRACKED file**
(`docs/tasks/T-131-…md`) in the main checkout, plus five new cards. The
integrator's pre-merge condition is *both diff checks empty; `??` alone is
not a ceremony* — so **`git diff --name-only` was not empty and the merge
was held for eleven minutes**, over a path this merge never touches.
**THE FIVE UNTRACKED CARDS COST NOTHING; THE ONE TRACKED MODIFICATION
BLOCKED EVERYTHING.** The asymmetry is the finding, and the remedy is one
sentence: **a session sharing a checkout with a live integrator commits
its tracked edits rather than holding them out of courtesy** — holding is
what blocks; committing does not disturb an integrator at all, because
main moving under one is ordinary and re-deriving at the new main is the
rule. Both hands did the right thing once it was said out loud; it cleared
at `af4f6c7`, which is this merge's own main-before.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS THIRTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
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
than five seconds with nothing in it**. The prediction keeps holding:
`du -sh app/src-tauri/target` reads **3.5 GB** here — **up from 3.0 GB,
the first movement this figure has shown in six checkpoints**, and it is
this merge's own doing: a NEW cargo test target (`tests/depth.rs`) plus
the boot gate's build. **THAT IS THE INTERESTING HALF AND IT IS A
PREDICTION THIS TABLE CAN NOW BE SCORED ON**: the directory grew by half
a gigabyte and the lib suite did NOT slow down — **4.91s**, with a
pre-merge baseline run on the same tree at **4.77s**, both deep in the
green band — so the cliff is somewhere between 3.5 GB and 8.7 GB and this
merge moved 0.5 GB toward it without effect. The watcher body was read by
NAME as `ok` rather than inferred from a green exit. **TWENTY-ONE runs across twelve
integrations and not one lands between 9.5s and 14.6s.** Read the lib
suite's own time first; it tells you which regime you are in before any
assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository — there is ONE right now: `lsof` first.

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
`T-086-s1`'s subject.** It did NOT fire at this merge — read by NAME, `ok`,
in BOTH cargo runs — which is two more data points and not a reprieve.
Read it beside **`T-102-s3`**. Its fence `[app-agent]` is **FREE**.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE EIGHTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says | tip is |
|---|---|---|---|
| **T-130** | `[tools/e2e]` | **building** | an ordinary work commit |

**T-129's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so ONE lane holds a
fence after it, down from two. **THE BOARD-TRUTH WINDOW IS STILL CLOSED**:
the one live lane reads `building` on the board and holds a worktree on
its own branch, and no card reads `planned` while holding one. That is a
state, not an achievement — it re-opens at the next dispatch.

**DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO NOT QUOTE THIS
TABLE.** The one command that answers it:
`git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`.
The row count is weather — it has been 14, 7, 6, 5, 4 and now **3** in
three hours while the lane count moved by one each time.

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: it read `212543c` at the start and `212543c` at the end,
  so it is now **three merges and three checkpoints** behind main, and
  updating it is @human's one command to run when they choose, not this
  integrator's.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: `method/`,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`, `app-shell`,
`app-dispatch`, `app-interview`, `docs/architecture/components/`,
`lib-parser`, **`crate-index`**, `.github/`, and every `docs/tasks/` card
path. **HELD: `tools/e2e` by T-130.**

## Just completed

**T-129 — every recursive traversal in the extractors is bounded, so a
hostile file degrades instead of aborting the app.** F-06, milestone 4,
size M, `touches: [crate-index]`. Main-before **`af4f6c7`**, lane tip
**`73651cb`** (derived with `git rev-parse`), merge **`2749256`**, this
checkpoint its direct child. `builder: claude-opus-5`,
`verifier: claude-opus-5 @fresh`, `built_by: claude-opus-5 @T-129 — code
980b903, c5aa0b8, 2a6a261, fe0f45f; notes 46e3292 and edbc28f`,
`verified_by: claude-opus-5 @fresh — verdict 73651cb`,
**`review: same-model`**.

**WHAT LANDED.** Six self-recursive traversals in `extract/` — **DERIVED
by closing the call graph, not listed from the card** — in two
mutual-recursion cycles (`declarations`↔`mod_item`,
`module_statement`↔`export_statement`) and four plain ones (`use_tree`,
`collect_segments`, `pattern_names`, `scan`). All six carry a guard at
ENTRY against `MAX_DEPTH = 128`, refuse past it, and RECORD which one
refused. `graph::DepthSite` has **exactly one variant per bounded
traversal**, so a seventh cannot be bounded without adding one — the
enumeration is structural rather than documentary. `FileEntry.
depth_refused` and `Stats.depth_limited` are both optional and both
omitted when absent, so **`schema` stays 1 and the committed bytes do not
move for any input that does not exceed a bound**.

**REFUSE, DO NOT DROP — AND THAT DISTINCTION IS WHAT THE DRILL BOUGHT.** A
refused file stays in `files[]` with everything its traversals reached
ABOVE the bound; only the sub-tree past the bound is missing.

### **THE HEADLINE CLAIM WAS CONFIRMED BY THIS INTEGRATOR'S OWN HAND, IN BOTH LANGUAGES, AT THE MERGE**

**Because a suite that passes is not the same evidence as the defect
failing to reproduce.** One `mktemp -d`, three files, the binary built
from the merged tree, exit read from `$?` on an unpiped command — and
**nothing pathological written into the repository**, per the card's own
instruction:

| file | shape | pre-fix (per the card and the verdict) | HERE |
|---|---|---|---|
| `hostile.rs` | a 20 000-segment `use` path | exit **134** | **exit 0**, `depth_refused = rust-path-segments` |
| `hostile.ts` | 10 000 nested `namespace` | exit **134** | **exit 0**, `depth_refused = ts-candidate-scan` |
| `ok.rs` | an ordinary `pub fn` | — | **`depth_refused = None`**, unaffected |

**One run, both languages, `stats.depth_limited = 2`, all three files
present in `files[]`, exit 0.** Two shapes that each killed the process
before this merge now degrade and NAME the traversal that refused, and the
ordinary neighbour beside them is untouched — which is the "degrade, never
fail" contract and the positive control in the same measurement. The temp
directory was removed afterwards.

### **THE NUMBER IS WHERE TWO MEASURED MARGINS MEET, AND THE TWO FAILURES ARE NOT SYMMETRIC**

**FROM BELOW, ~3.5x**: the deepest traversal any file in this repository
reaches is **36** (`app/src/architecture/MapView.tsx`'s candidate scan),
derived by bisecting the constant against the live tree — 35 flags that
file alone, **36 flags nothing**. **FROM ABOVE, ~3.2x**: these traversals
NEST, so the worst legal stack is three ceilings at once — **and it is a
CONSTANT rather than a function of the input, which is the whole of what
the bound buys over a bigger stack.** It needs **512–640 KiB** debug
against the 2 MiB a plain `std::thread` gets. **256 WAS MEASURED AND
REJECTED**: 7.1x from below but **896–1024 KiB**, only ~2x from above.
**Refusing a legitimate file DEGRADES and is recorded; overflowing ABORTS
the app** — so the margin belongs on the unrecoverable side. Both margins
were re-derived independently by the verifier and both reproduced.

### **ARM 2 WAS RULED ON AND NOT TAKEN, AND ITS QUESTION SURVIVES AS A PIN**

Running the walk on a spawned thread with a bigger explicit stack is
**not taken**, with the ruling written beside the constant: it moves a
threshold where a bound removes one; it makes the crate's answer depend on
a machine property rather than on its input (against ADR-014); and **it
would ship unreachable code with a vacuous test**, since after the bound
exists nothing can reach the bigger stack. What survives is arm 2's
QUESTION, kept as a body rather than as a paragraph:
`the_worst_legal_nesting_completes_on_a_small_explicit_stack` gives the
walk the smallest stack any plausible caller hands it and requires the
deepest LEGAL input to finish.

### **THE DRILL IS WHY THREE OF THIS LANE'S FOUR CODE COMMITS EXIST**

**Fifteen producer-side mutants, and THREE of them changed the code rather
than confirming it.** (a) `c5aa0b8` — a fixture whose tree held ONE
refused file and ONE clean one, so `is_some()` and `is_none()` both count
1 and the assertion could not tell them apart: **a cardinality that
happens to be symmetric is a value poison passing for the wrong reason.**
(b) `2a6a261` — two boundaries pinned only to within TWO depth units,
because a nested use group costs two `use_tree` frames per source level;
**both bodies were named "at 65" and neither could see the bound move by
one.** (c) `fe0f45f` — the last surviving mutant replaced a refused record
with `ExtractRecord::default()` while KEEPING the flag: "drop" instead of
"degrade", the exact behaviour criterion 1 forbids, and **nothing asserted
the CONTENT of a refused file.**

**M13 IS RECORDED BECAUSE IT FAILED AS A MUTATION RATHER THAN AS A PIN**,
and the next reader will have the same idea: a guard narrowed to a depth
WINDOW (`> MAX_DEPTH && depth < 200`) kills nothing, because **a recursion
increments one frame at a time, so it passes THROUGH any window on the way
down and refuses inside it.** No "deep regime only" mutant of a depth
guard exists.

**AND ONE BODY HAS NO UNIQUE PRODUCER MUTANT, STATED AS A NEGATIVE RATHER
THAN CLAIMED.** `the_worst_legal_nesting_…` guards a fact about the
constant AND the platform, and no edit to the source can simulate a
smaller stack. What stops that being a hole is that
`inline_mod_nesting_extracts_at_128_and_refuses_at_129` pins the constant
to exactly 128 with literals on both sides. **The two bodies hold the
property jointly and neither holds it alone** — CONVENTIONS' shape six
asked, and the answer is a limitation rather than a clean bill.

### **`M15` IS THE RESULT THIS WHOLE CARD IS ABOUT, AND IT IS A HARNESS LESSON**

Deleting `use_tree`'s bound leaves the lib test binary at an ordinary
**one red** while the `depth` binary **ABORTS**, naming the body, and
emits **zero `test result:` lines**. In the whole `--no-fail-fast` run the
summary reads an unremarkable `465 passed / 1 failed` **while three bodies
have vanished into a SIGABRT**. `cargo test` reports it as its own **101**
and the **134 lives only on the binary**. **DERIVING THE COUNT IS WHAT
CATCHES IT** — sum the `running N tests` headers and check them against
passed + ignored. It costs one `awk` and it is done at every merge from
here.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree af4f6c7 73651cb -> tree df96e56…, exit 0 (read from $? FIRST)
    git diff --name-only af4f6c7 <TREE>                        ->  15   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only af4f6c7..2749256  (THE MERGE'S DIFF)  ->  15   the only one that means anything
    git diff --name-only af4f6c7...2749256 (three dots AT the merge) -> 15   collapses, as it must
    git diff --name-only ae16fbe..af4f6c7  (main's advance)    ->  98
    git diff --name-only af4f6c7..73651cb  (TWO dots, FORBIDDEN)  -> 113
    git diff --name-only main..HEAD        (FORBIDDEN)         ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 98 PATHS — 7.53x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **98** under this lane, the
branch **15**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 15 + 98 = 113 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**, T-102 **3.75x**, T-033 **1.94x**, T-091 **8.78x**, T-116
**15.80x**, T-108 **20.75x**, T-104 **3.54x**, T-126 **6.33x**, T-129
**7.53x**. **The ratio is weather; the left endpoint is the signal.**

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read a 15-path merge as an empty one and every gate
derived from it as NOT OWED** — GRAPH REGEN, BOOT GATE and DOCS GATE all
fire here and all three would have been skipped, silently, with a
clean-looking derivation. **The forbidden forms do not share a failure
direction**: one inflates, one ANNIHILATES, and only the second is
invisible.

**`<merge-base>..<tip>` GAVE THE RIGHT ANSWER HERE AND IS STILL
FORBIDDEN.** `ae16fbe..73651cb` returns 15 — identical to the prescribed
set — because `ae16fbe` IS the merge base, so that spelling degenerates
into the three-dot form. **It is right by coincidence of this lane's
shape**: main advanced **98** paths under it and none of them collided,
which is luck and not method. This is the widest main advance any lane has
survived without a collision, which makes the coincidence more visible,
not less dangerous.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`df96e56d4cdcc94069f0dec7d05994a998a6ac9e` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`af4f6c7` and `73651cb` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** Here that check earned its keep for the first time: a
second hand had files in the working tree when the range was derived, and
the tree comparison is what proves none of them entered. The exit was read
from `$?` into a variable **BEFORE** any substitution — exit **0**.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST THE LIVE LANE.** `comm
-12` of this merge's fifteen paths against `T-130`'s own
`merge-base..tip` diff (4 paths) is **EMPTY**. Declared fences agree:
`crate-index` and `tools/e2e` do not overlap.

**MAIN MOVED UNDER THIS INTEGRATOR THREE TIMES BEFORE THE MERGE** —
`7af37de` → `5b7e4a7` → `5e7ea6c` → `af4f6c7` — and the range was
re-derived at the last of them rather than at the first.
`git diff --cached --name-only` and `git diff --name-only` were both
EMPTY in the same command that read `main`, one command before
`git merge`, with one `??` row; **`??` alone is not a ceremony.**

## THREE standing gates — ALL THREE fire, all THREE derived from the merge's own 15 paths

| gate | trigger | on these 15 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **9 — OWED** | **exit 1 STALE**, regenerated, **exit 0 CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **9 — OWED** | exit **0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **THE BOOT GATE FIRES AND T-129's CARD SAYS IT DOES NOT.** The card's
  Verification line reads *"The BOOT GATE does NOT fire on `crates/**` —
  derive that rather than assuming it, and say which way it came out."*
  **It came out FIRES**, on the plainest possible reading: the trigger is
  the path PREFIX `app/src-tauri/**` and every one of the nine code paths
  is `app/src-tauri/crates/nputer-index/…`, which is under it. It also
  fires MEANINGFULLY — `nputer_lib` depends on `nputer_index`, so this
  crate is a build input to the app binary and a regression here really
  can stop the app booting, which is the property T-040 created this gate
  for. **Three independent derivations now say FIRES** (the lane, the
  verifier, this checkpoint) and the card is the only thing that says
  otherwise. Run: `NPUTER_BOOT_PORT=15433 npm run boot:check`, exit **0**,
  **both `[nputer]` lines observed** — `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`. Child
  pid 34607, process group captured, tree stopped on SIGTERM, no orphan;
  port 15433 `lsof`-read at zero rows before AND after. It builds and runs
  out of **main's own** `target/`, not @human's checkout.
- **GRAPH REGEN — OWED, ASKED, STALE, REGENERATED, ASKED AGAIN.** A REAL
  red rather than the `--root` false red: it printed both sets of counts
  and a `+`/`~` block, where a false red says `committed: MISSING`.
  Committed **933 931 · 178 · 1990 · 1903** → fresh **939 161 · 179 ·
  2004 · 1907**; `files +1 -0 ~8`, `edges +7 -3`. **THE NINE PATHS IT
  NAMES ARE EXACTLY THIS MERGE'S NINE CODE PATHS, ONE FOR ONE.** That is
  worth stating because the opposite is the shape `T-129-s4` warns about:
  this lane's OWN base carried three foreign stale files from a merge
  above it, and at this merge there are none — the previous checkpoint's
  regen cleared them, so the staleness here is 100% this lane's and the
  arithmetic is unambiguous. **The lane's own forecast of +1 file, +14
  symbols and +4 edges is exact**; only its byte figure differs, because
  it was stated against a baseline main has since advanced past.
  Regenerated with the prescribed
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
  --ignored`, exit 0. Asked again: **exit 0, CURRENT.** **Asked a THIRD
  time after this checkpoint's fixture writes and it was STALE AGAIN, WITH
  EVERY HEADLINE FIGURE IDENTICAL ON BOTH SIDES** — see below.
  Regenerated a second time, asked a FOURTH: **exit 0, CURRENT.**
  `graph.json` is committed **with this checkpoint** and not with the
  merge, and this pass is the third consecutive demonstration of WHY.

### **THE IDENTICAL-FIGURES TRAP FIRED AT THE CHECKPOINT AGAIN — THIRD WORKED EXAMPLE, SAME MECHANISM, DIFFERENT CARD**

**T-104's checkpoint is titled for this trap, T-126's reached it by a
second route, and this is the third — which stops it being an incident and
makes it the ORDINARY behaviour of a checkpoint that reconciles a dogfood
fixture.** At the MERGE the staleness was loud: bytes, files, symbols and
edges all moved. **At the CHECKPOINT it was silent.** `index --check` said
STALE at exit 1 with

    committed:   939161 bytes · 179 files · 2004 symbols · 1907 edges
    fresh index: 939161 bytes · 179 files · 2004 symbols · 1907 edges

— **all four identical** — and only a `~2` block naming
`app/test/architecture-dogfood.test.ts (content, loc 1834 -> 1850)` and
`app/test/map-dogfood-render.test.tsx (content, loc 583 -> 603)`
separating them. The regen PROVES it rather than asserting it: **939 161
bytes before and 939 161 bytes after**, and the sha256 moved:

    before  5b675e61e93944d4ced66b5f0c440cae58907c8f4a1f64bae1ef0242630023b5
    after   03b10ec06d2ee25c833098100d7e7795c2589d95081cdc06d026b19719458dab

**THE CAUSE IS THE CHECKPOINT'S OWN FIXTURE RECONCILIATION, EVERY TIME.**
Editing two indexed test files by comment and literal moves `loc` and the
content hash and moves NO count, because no symbol was added or removed.
**A checkpoint that reconciles a dogfood fixture has, BY CONSTRUCTION,
made the graph stale in the one shape no headline figure can show** — and
this pass added the comment blocks the reconciliation deserves, which is
what moved `loc` by 16 and 20 lines. **ASK THE GATE. Twice, and again
after your last write.** A byte count would have said CURRENT three times
running.
- **EVERY ONE OF THE SEVEN NEW EDGES HAS BOTH ENDPOINTS INSIDE C-07**, so
  the component-level relation table does not move at all: `arch` reports
  **components 13, files 179, mapped 179, unmapped 0, edges 36, findings
  3, drift_components 3** — every figure identical to T-126's except the
  file count. **A merge can add four graph edges and move no component
  relation**, and that is derived from `arch` rather than assumed.
- **DOCS GATE — exit 1, FIRES on 6 of 15, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **NOT the cargo suite**, and that is DERIVED rather than assumed: all
  six paths are flat `docs/tasks/T-129*` cards, and the cargo readers
  resolve `docs/CONVENTIONS.md`, `docs/architecture/components` and a
  research capture — none of which is in this diff. Invoked DIRECTLY from
  the repo root with the RANGE RULE's own path list, **never through
  `xargs`**. **13 derived docs readers across 4 suites**, census **130
  sites in 22 files**, **0 frontmatter issues**.

## Fixture reconciliation — `arch` GIVES YOU THE FIGURE AND NOT THE SITES

**TWO FILES, FIVE ASSERTIONS, AND DERIVING FROM `arch` FIRST WAS
NECESSARY AND NOT SUFFICIENT — WHICH IS A REFINEMENT OF THIS FILE'S OWN
STANDING INSTRUCTION.** The graph's file count moved 178 → 179 and C-07's
file count 32 → 33, so both app dogfood fixtures had values to reconcile;
the parser pin is **not** owed, because no component file changed and no
component was declared (T-024-s5 fires on DECLARING a component).

Reconciled: `fileComponent.size` 178 → 179, the C-07 tally row 32 → 33 and
that body's TITLE in `app/test/architecture-dogfood.test.ts`; the map hint
178 → 179 **and C-07's own body — its assertion AND its title** — in
`app/test/map-dogfood-render.test.tsx`.

**THE LAST OF THOSE FIVE WAS MISSED BY A DERIVATION THAT WAS OTHERWISE
CORRECT, AND THE MISS IS THE LESSON.** Every figure was taken from `arch`
over the REGENERATED graph before the suite was re-run, on this file's own
standing instruction — and the suite still redded once, on
`map-dogfood-render.test.tsx`'s *"C-07 is a REAL face at last: thirty-two
Rust files match its globs"*, whose assertion and whose NAME both carry
the same digit. **`arch` hands you the NUMBER; it does not hand you the
LIST OF PLACES THAT ASSERT IT.** Measured afterwards at the merge commit:
`git grep -E '"C-07", 32|32 files|thirty-two'` over `app/test` and
`lib/parser/test` returns **FIVE** hits, of which **three are live
assertions that must move and two are historical prose about T-010 that
must NOT**. So the procedure has three steps and this checkpoint only ran
two: **derive the FIGURE from `arch`, derive the SITES with `git grep` on
the OLD digit, then decide live-or-historical one hit at a time.** The
same grep for the file count (`toBe(178)`, `committed graph · 178 files`,
`all 178 files`) returns three, all live.

**A BODY WHOSE NAME CARRIES A COUNT IS A COUNT IN TWO PLACES**, and both
fixtures had one. Titles were moved with their digits, on T-126's
precedent.

**C-07's BYTE FIGURE IS REPAIRED IN ARCHITECTURE**: it read **933 931
bytes — 93.39%, 66 069 bytes of headroom** at T-126's checkpoint and now
carries **939 161 bytes — 93.92%, 60 839 bytes of headroom** at T-129's,
appended with its ref beside its predecessors rather than overwritten.
**This entry spends 5 230 bytes on ONE new indexed file** — and it is the
first file C-07 has gained ON DISK since T-010 put it on the map, every
earlier move of that row having been a change of language or of owner.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 471 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 4.91s**.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **474**, which is 471 + 3 ignored.
  **THE ARITHMETIC CLOSES AGAINST A BASELINE MEASURED ON THIS MACHINE
  RATHER THAN QUOTED**: the same command at `5e7ea6c`, before the merge,
  gives **462 / 0 / 3 over 15 lines** with headers summing to 465 — and
  462 + 9 new bodies = 471, 15 + 1 target = 16. The nine are **six**
  boundary bodies inside `extract/{rust,ts}.rs` (that target goes 146 →
  152) and **three** in the new `tests/depth.rs` target. **DO THE HEADER
  CHECK; it is this card's own subject** — see M15 above.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**. **973 is unchanged from the pre-merge baseline and that is the
  right answer**: this merge contains no TypeScript at all.
- **E2E: 171/171, exit 0, ONE RUN, 1.9m, on scratch port 15434.** The port
  was `lsof`-read free and the runner's own bind is what proves it, since
  a probe reserves nothing. The `T-130` mtime body passed; main is not a
  fresh checkout. `range-rule.spec.ts` is 25 of 25.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME** in BOTH
  cargo runs, not inferred from a green exit:
  `startup_arm_watches_the_initial_root` `ok`, `a_hostile_session_id…`
  `ok`, `agent::kit::tests::snapshot_version_matches_the_live_method_
  stamps` `ok`.
- **THE APP SUITE RAN FIVE TIMES AND EVERY RUN IS DECLARED, INCLUDING THE
  RED ONE**, because the rule is to declare every run and not only the
  ones that agree: run 1 pre-merge at `5e7ea6c` (**973/973**), run 2 after
  the merge and before the regen (**973/973**), run 3 immediately after
  the regen and a PARTIAL fixture reconciliation (**972/973, 1 FAILED** —
  the missed C-07 body above, and the reason that section exists), run 4
  after the full reconciliation (**973/973**), run 5 after every doc write
  (**973/973**). **The parser suite ran THREE times** (268/268 pre-merge,
  268/268 post-merge, 268/268 after the doc writes) and **`tools/e2e`
  TWICE** (171/171, 171/171, same scratch port 15434 `lsof`-read at zero
  rows before and after each). **All runs agree on every derived count
  except app run 3, whose disagreement is the fixture reconciliation
  itself.**

### **THE DECLARE-EVERY-RUN REGRESS TERMINATES IN THE COMMIT MESSAGE, WHICH IS A BETTER HOME THAN A FOURTH PARAGRAPH**

**T-126's checkpoint named this regress and stopped on an invariant; this
one stops one step earlier and somewhere else.** `docs/STATE.md` is a code
input — two `tools/e2e` specs walk the whole of `docs/` — so **a
checkpoint that writes its own suite counts into this file owes the suite
that reads this file, and running it produces a new count to write down.**
The paragraph above is exactly that write. **The third `tools/e2e` run it
owes was performed, and its result is declared in this checkpoint's COMMIT
MESSAGE rather than re-entered here** — because a commit message is not a
code input, so recording a run there owes nothing further and the loop
closes on the first pass instead of converging on one. **What may never be
done is stopping because the loop is tiresome, or writing a run's result
before running it.** Read the commit message for the third run's figure;
this paragraph deliberately does not carry it.

- **`range-rule.spec.ts` PRINTED ITS DISCLOSURE AGAINST THIS MERGE COMMIT
  BY NAME** on the second e2e run — *"`/Users/ujju/Projects/nputer @
  2749256` — GRAPH REGEN's published flip figures are stated at `ddcc8bb`
  and ARE RIGHT THERE, and its trigger has since gained `.rs`: 5 of 5 at
  that ref, 1 of 1 under the trigger on disk"* — which is `T-091-s3`'s
  exact subject, observed rather than theoretical, for the **third**
  consecutive merge.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0**, **`npm run lint:tokens` exit 0**, at **TOKEN 135 / CONTROL
  748**. **DERIVE IT AT YOUR OWN REF; it is not a constant** — CONTROL's
  corpus is `git ls-files`, so 737 → 748 is exactly the eleven tracked
  files that arrived since T-126's checkpoint: **six from this merge**
  (`tests/depth.rs` plus `T-129-s1`…`s5`) and **five from `af4f6c7`**
  (`T-132`…`T-135` and `T-128-s1`). None is a TOKEN-root file, which is
  why TOKEN holds at 135. **This checkpoint commits no NEW tracked file**,
  so unlike the last two it does not walk into its own figure.
- **`index --check` WAS ASKED A THIRD TIME AFTER THE LAST DOC WRITE** —
  see the gate section — because a checkpoint that reconciles an INDEXED
  fixture has by construction made the graph stale again, in the one shape
  no headline figure can show.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-129` was removed with `git worktree
remove`, after the merge and after the checkpoint (lane-protocol rule 6),
and `git worktree prune` was run behind it. **The BRANCH survives**, read
off disk rather than assumed: `task/T-129-nesting-abort` still resolves to
**`73651cb`**, so the verdict's own commit remains diffable.
`git worktree list` now returns **three rows — main, one lane and
@human's app checkout.**

## The board, derived from disk at this checkpoint

**277 flat task files — 94 done / 39 planned / 41 parked / 102 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
94 + 39 + 41 + 102 + 0 + 1 = 277. T-129's stamp moves done from 93 to 94
and clears the single `verifying` half of ruling nine; the merge brought
**five** suggestions and `af4f6c7` brought four planned cards and one
suggestion. **This checkpoint files NONE**, which is unusual enough to
state: every finding it made is written where the rule it bears on already
lives.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWO AND WANTS AN ELEVENTH
TRIAGE.** `T-129-s1`…`s5` came in with the merge and none of the five is
triaged, because disposition belongs to a triage pass and not to an
integrator (T-083's ruling), so they stay `status: suggested` exactly as
filed — **including `T-129-s5`, which the verifier deliberately did NOT
fold into its verdict under `method/roles/verifier.md` rule 6.**

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's and the verifier's own text
  is preserved byte-untouched** — this checkpoint made NO in-place
  repairs to either.
- **ARCHITECTURE — TOUCHED, one place**: C-07's row gains T-129's landing
  (the bound, the two optional fields, `schema` still 1, the two margins,
  the arm-2 ruling and the language inversion) and its ref-stamped budget
  entry. **No component is declared and no interface between components
  moved**, so the system map is untouched — the two new fields are
  additive and optional inside C-07's own emitted artifact. **The derived
  slug block was re-read off disk** against every component's
  `touch_slugs:` and matches unchanged — eight slugs, 13 components,
  exactly one empty `touch_slugs:` (C-01), `crate-index -> C-07` alone,
  and the three multiply-claimed slugs (`app-shell` C-05/C-10/C-11/C-16,
  `app-board` C-08/C-09/C-11, `app-map` C-12) all as recorded.
- **ROADMAP — TOUCHED**: F-06 gains a `Since T-129` paragraph saying
  plainly that this is the indexer's failure mode and NOT map content, the
  milestone-4 cost line gains its ref-stamped byte figure, and the
  milestone-4 census is **re-derived** (96 cards carry `milestone: 4`, 7 of
  them F-04 — F-01 9, F-02 43, F-03 12, F-04 7, F-06 25). **F-04's "4 of
  7" progress line does NOT move**, because T-129 is F-06 inherited
  backlog and not slice content.
- **CONVENTIONS — NOT TOUCHED.** Neither the merge nor the checkpoint
  changes it. **The five edits queued at its seat are unchanged and still
  routed** — see "Next up" item 4.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. Arm 2's rejection is a decision, and it is
  recorded where the constant is rather than in an ADR, because it decides
  nothing outside this crate: ADR-014 (*same tree, byte-identical output
  on any machine*) is the rule it was tested against and it SURVIVES
  unchanged — a stack size is not a property of the tree, which is exactly
  why arm 2 was refused.
- **`graph.json` regenerated and committed HERE**, not in the merge.

## Provenance — SELF-DECLARED, never read off a trailer

T-129 is **built by `claude-opus-5`**, **verified by a separate
adversarial `claude-opus-5` session** that declared a BOUNDED READ (card
read at its base ref, attack set written down BEFORE the diff was opened,
in a detached worktree at `edbc28f` OUTSIDE the repository with its own
`CARGO_TARGET_DIR`, and a SECOND detached worktree at `ae16fbe` supplying
the pre-fix binary), and integrated by a **third hand** that neither built
nor verified it. **`review: same-model` is the honest label** — the field
is provenance, and all three hands were the same model. **The
independence that pays here was INFORMATIONAL and it was real**: the
verifier ran eight of its own producer-side mutants beyond the lane's
fifteen, derived the six traversals independently and matched, re-derived
BOTH margins by bisection, confirmed `require_bindings` iterative by hand,
**corrected one of the lane's own TS rows in the lane's favour**, ran all
three gates rather than predicting them, and **caught and retracted a
defect of its own before filing it** (see Next up item 4). **The
`Co-Authored-By` trailer on this lane's commits is a harness constant and
is NOT evidence of a model** — T-085 proved it and T-101 sharpened it.

**94 done cards — 70 `same-model`, 18 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 70 + 18 + 5 + 1 = 94. T-129 moves `same-model` from 69
to 70.

## What ACTUALLY reached the human's running app

**NOTHING, AND THE CHANNEL IS CLOSED BY MEASUREMENT RATHER THAN BY
ASSUMPTION.** Nine of this merge's fifteen paths are under
`app/src-tauri/**` — the trigger that rebuilds and RELAUNCHES the binary —
and zero under `app/src/**` (vite HMR). **In the MAIN checkout that would
relaunch; in @human's checkout it cannot, because @human's app serves from
a DIFFERENT checkout that this merge does not touch.**

Re-derived here rather than inherited: `lsof -a -p 88948 -d cwd` reports
the vite serving 1420 has `/Users/ujju/Projects/nputer-app/app` as its
cwd, and `app/node_modules/@nputer/parser` is a **RELATIVE** symlink
(`../../../lib/parser`), so it resolves inside its OWN checkout, which has
its own `lib/parser/dist`. **"MY DIFF IS CRATE-ONLY" IS EXPLICITLY NOT THE
ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and this
integration DID rebuild `lib/parser/dist`, which is the exact channel — it
just lands in a directory the running app does not read.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **20:56:01** (before any command
that writes), at **21:07:33** (immediately after the merge's working-tree
write), and again after the boot gate and after the checkpoint. **Every
reading identical.** The **anchored** process match —
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'` — reports
pid **53350**, started **2026-08-25 19:43:47**, unchanged at every
reading, and it is the same pid and start time T-104's and T-126's
checkpoints recorded, so **@human has not restarted their app in three
integrations**. A pid and a start time are live-environment facts, not
functions of a tree, and both are already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were checked individually and all six were present, so **no
fresh dependency install was owed and no `npm ci` was run.** **The repair
is still item 8 below, unwritten after ELEVEN consecutive merges performed
it by hand.**

**No process from this integration survives.** Scratch ports **15433**
(boot gate) and **15434** (e2e) were `lsof`-read back at zero rows.
**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-third** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **The five that arrived
during this integration are gone the honest way**: they were the
architect's, they were recorded while untracked, and they are now COMMITTED
at `af4f6c7` rather than swept — see the shared-surface section.
**No `pkill`. No `npm ci`. No `cargo clean`. No `git update-ref`, no
force-push, no history rewriting.** Be precise rather than claiming more
than is true: this integration's TWO `cargo test` runs, the boot gate's
build, the graph regen, the `arch` report and THREE `index --check` runs
all WROTE to main's `app/src-tauri/target/`, which reads **3.0 GB**, as any
cargo run must. **No sibling worktree was entered or modified** —
`../nputer-T-130` was read with `git rev-parse` only; `../nputer-app` was
read with `git -C … rev-parse` and `lsof` only; the T-129 worktree was read
and then removed by this checkpoint. No path was staged by wildcard;
`git add -A` was never used, and every write used `git commit -- <paths>`
so it could not sweep another hand's index — **which was not hypothetical
tonight.**

## In progress / broken right now

**NOTHING IS BROKEN.** ONE lane holds a fence — **T-130**, `[tools/e2e]`,
tip `6dedc0d`, an ordinary work commit. Read `git worktree list` and its
branch tip rather than any table here.

**`crate-index` IS RELEASED**, which unblocks `T-127` (whose only real
blocker was this fence) and `T-033-s11`, and is what `T-129-s2` and
`T-129-s3` need.

## Next up

1. **`T-127` IS THE CARD THIS MERGE MOST DIRECTLY UNBLOCKS.** `planned`,
   fence `[crate-index, docs/architecture/components/]`, **both now
   FREE**, `blocked_by: [T-033]` satisfied since `8f8ec31`. **Read
   `T-126-s4` FIRST**: the indexer records `use` imports only, so a Rust
   `mod` declaration produces ZERO edges, and **a clean drift set is
   evidence about what the indexer can SEE, not about what the code
   DOES.** T-127's cycle census rests on exactly that engine.
2. **`T-126-s3` IS STILL THE MOST URGENT ROUTED ITEM ON THE BOARD**, and
   it is not a defect in any merge — it is the routed cost of the fence
   violation T-126's verdict ratified *by necessity, not precedent*. Four
   written statements about C-15 are false on main right now: the registry
   `paths:` entry names a deleted file, the module header says `lib.rs`
   does not declare the module and that no command registers it, and
   `T-110-s9`'s EDIT ONE is still live. **Nothing reds** — a declared path
   matching no file produces no finding in either engine. Fence
   `[app-dispatch, docs/architecture/components/]`, **both FREE**. Item 1
   fires T-024's three-fixture rule; item 3 IS `T-110-s9`, so **one lane
   should take all of it**.
3. **THE FENCE RULING T-126 CARRIED IS STILL THE PRECEDENT TO CITE.**
   `method/roles/executor.md:126` is unconditional and predates that card
   — *"Widening the fence from inside the lane is the one repair this role
   may never make"* — and an out-of-fence edit that ships without the
   words *this was a violation* becomes the precedent that a card's
   criteria outrank its fence, which nullifies every fence. **T-129 is the
   counter-example worth naming beside it**: its arm 3 was out of fence,
   the card said route rather than reach, and the lane routed it as
   `T-129-s1` with `index_cmd.rs` untouched and the replacement comment
   ready to paste. **The rule is obeyable; T-126's criterion 7 was the
   problem, not the rule.**
4. **`docs/CONVENTIONS.md` IS FREE AND FIVE EDITS ARE QUEUED AT ITS SEAT,
   ACROSS EXACTLY TWO BULLETS** — `T-104-s5` carries the argument. **THE
   RANGE RULE BULLET — two edits, to `T-093`** (`T-091-s3`'s
   trigger-beside-the-ref clause and the `bdada11` sharpening; both are
   hand hazards and both were observed live again during this
   integration). **THE POISON DRILL BULLET — three edits, to `T-092`**
   (`T-079-s3` items 2–3, `T-130-s1`, and **T-129's binary-level
   generalisation**, which asks to be taken in ONE edit). That third one
   is T-129's verifier's: it began writing up a determinism defect against
   ADR-014 — `index --check` reporting a fresh index 156 bytes larger than
   `index --root` wrote — and **retracted it as its own**, because
   `cargo test` rebuilds the package binaries and its `MAX_DEPTH = 32`
   drill left a mutated `nputer-index` behind. **A stale binary does not
   only HIDE a finding; it FABRICATES one, and a fabricated finding
   survives review better than a hidden one because it arrives with
   digits.** **THREE OF THE FIVE ARE ONE GAP SEEN THREE WAYS**: the bullet
   rules how a restoration is PROVED and never says what restoring MEANS,
   and both its proofs are checks over SOURCE-FILE CONTENT that a stale
   binary and a moved mtime both pass. **Take them together or the bullet
   gets patched three times and still does not say it.** **`T-092`'s fence
   is `[docs/CONVENTIONS.md, app-agent]`, and `T-132`'s is `[method/]`,
   which cannot reach that bullet at all** — so `T-092` is the single home
   by fence as well as by subject.
5. **`T-131` IS RULED — @HUMAN ADOPTED ALL FIVE PROCESS CHANGES** at
   `af4f6c7`, item 5 included, with the architect's objection shown in the
   question. **This file's previous edition called T-131 "the one @human
   owes a ruling on" and that is now false.** The mechanisms are four
   separate cards, because prose is precisely what failed: **`T-133`**
   (items 1+2 — a command that emits the brief's contract rows from the
   sources each row names, and a derived STATE lane list; `[tools/e2e]`,
   **held by T-130**), **`T-132`** (item 3 plus the method prose;
   `[method/]`, FREE), **`T-134`** (item 4 — fences name PATHS and a slug
   is shorthand; `[lib-parser, method/lane-protocol.md]`), **`T-135`**
   (item 5 — ceremony scales with blast radius, and it **cannot ship until
   the graph can answer it**, since Rust emits no `call`/`type_ref` edges
   and a `mod` declaration emits none at all, so a blast-radius number
   computed today would mark risky cards cheap).
6. **`T-132` CARRIES RULING THIRTEEN, WHICH THIS AND THE LAST THREE
   CHECKPOINTS ALL DECIDED BY AND NONE COULD CITE.** *Repair what the
   merge INTRODUCES, file what the merge merely REVEALS.* Verified absent
   from `method/` and `docs/CONVENTIONS.md` again at this ref. It is the
   missing companion to T-083's ruling that discharging a finding is not
   the integrator's call: that rule says what an integrator may not CLOSE,
   this says what it may FIX. **`T-126-s7` also asks for its second
   clause**, which T-126's merge is the evidence for. This checkpoint
   applied it twice: **REPAIRED** the five dogfood assertions, C-07's
   budget figure and the ROADMAP census, which this merge introduced;
   **FILED NOTHING AND REPAIRED NOTHING** about `T-129-s5` or the card's
   inverted framing, which it merely revealed — the first is the
   verifier's filing and the second is recorded at the top of this file
   rather than edited into a card the lane and the verifier both wrote.
7. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still returns
   zero rows. **It stopped being a formality tonight**: a second hand had
   files in this working tree when the range was derived, and comparing
   the merge commit's tree to the pre-computed forecast is what PROVED
   none of them entered the merge. Fence `method/`, **FREE**. Take it with
   items 5, 6 and 14; they are one file.
8. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — ELEVENTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step —
   `lsof -p <pid>` for the holder's cwd, compared against the checkout you
   are installing into.** Fence `[docs/CONVENTIONS.md]`, **FREE**.
9. **`T-128-s1` — THE CHECKOUT'S TEST RUNNER AND ITS EDITOR ARE SHARED
   SURFACES `T-128` DOES NOT LIST.** Both cost something tonight and both
   are described above. `T-128` itself is `planned`, fence `[method/,
   docs/CONVENTIONS.md]`, **BOTH FREE**.
10. **`T-129-s2` — A DEPTH REFUSAL IS RECORDED IN THE GRAPH AND REACHES
    NO HUMAN**, which is exactly the status `stats.skipped` has had since
    T-009. Three arms on the card. `crate-index` is now **FREE**.
11. **`T-129-s3` — THREE RECURSIONS OUTSIDE THE EXTRACTORS ARE BOUNDED BY
    THE FILESYSTEM AND NOTHING ELSE**, and one of them is on `index()`'s
    own in-app path. **THREE, not two** — `arch/glob.rs::go`,
    `resolve/mod.rs::nearest` and `resolve/tsconfig.rs::nearest`, swept
    independently by the verifier and matching the lane's notes. A
    genuinely different class (their depth is a function of the DIRECTORY
    TREE), and the card is measurement-first.
12. **`T-129-s1` — `IndexOutcome::Error`'s DOC COMMENT PROMISES "never a
    panic" AND WAS FALSE FOR THIS CLASS.** T-129 removed the CAUSE and
    could not reach the SENTENCE: `app/src-tauri/src/index_cmd.rs` is C-05
    (`app-shell`, now FREE). The replacement comment is ready to paste.
    **A comment that promises what the code does not is this project's
    third-most-common defect class**, and this one is now merely stale
    rather than dangerous — which is the cheapest it will ever be to fix.
13. **`T-129-s5` — `tests/depth.rs`'s WORST-LEGAL-NESTING BODY COMMENTS
    THE REJECTED 256 FIXTURE.** Every number in the comment is exactly
    double the literal beneath it (256/128/257 against 128/64/129), and
    the verifier MEASURED that the input the comment names is REFUSED, so
    a reader who trusts it sizes the replacement wrong in the direction
    that makes it refuse. **The stack figure beside it is CORRECT and the
    fix must not over-reach.** Four numbers, one comment block, inside
    C-07 — it rides any `crate-index` card cheaply.
14. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its conflict
    rests on is NOT in `method/`. **The two are one card**, and the same
    file as items 5, 6 and 7.
15. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`). The three must be cleared in the same
    commit or the gate reds on arrival. Fence `[tools/e2e]`, **held by
    T-130**.
16. **`T-129-s4` — A LANE CUT BETWEEN A MERGE AND ITS CHECKPOINT INHERITS
    A RED GRAPH GATE**, measured on this lane's own base. CONVENTIONS says
    a non-merge commit between checkpoints is safe *"by practice,
    verified"*; the verifier's check of `05dd4d9..ae16fbe` CONFIRMS the
    parenthetical and refutes a paraphrase of it — every non-merge
    first-parent commit there IS docs-only, and what fails is the premise
    that such a base carries the checkpoint's graph, which a MERGE below
    it breaks. **This merge is the clean counterpart**: `index --check`
    named exactly this merge's nine paths and no foreign ones.
17. **`T-125` IS FULLY UNBLOCKED** (`[app-agent, app-shell,
    docs/architecture/components/]` — all three free) and takes the last
    undeclared row, `C-10 → C-14`. **`T-107-s4`** needs `app/test/**`,
    also free; read it beside **`T-110-s9`**.
18. **`T-126-s6` — THE EXECUTOR SEAT HAS NO RULE SAYING ITS GATE
    DERIVATION IS STALE AT ITS OWN TIP**, and `T-126-s5` — **TWO FENCES ON
    THE BOARD CANNOT BE OBEYED AS WRITTEN**. Both untriaged, both
    `[method/]`.
19. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence.
20. **`T-104-s4` — FOUR DEFECTS IN T-104's OWN CRITERIA**, filed rather
    than repaired because all four predate that merge. **`T-108-s1`** —
    the fourth stale citation. **`T-108-s4`** — the pathspec rule needs a
    ROOT clause.
21. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — which is `T-134`'s subject arriving early.
22. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
23. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWO AND WANTS AN ELEVENTH
    TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-128-s1` and
    `T-129-s1`…`s5` are untriaged.
24. **THE BOARD-TRUTH RULING** — FIFTEENTH ask, fourth consecutive one
    from a CLOSED window. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL
    HAS NO OWNER.** **The GNU `xargs` column still closes at the first
    push**, and `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This brief was the FOURTH written to the deliberately-thin
format. **It asked to be scored in three categories rather than two** —
predictions, facts, and ARGUMENTS — on the ground that *a thin brief
carrying no figures can still carry a wrong ARGUMENT, and an argument is
not one command away.* **That is the right refinement and it earns the
headline: this pass found ZERO errors in six numbered claims and six
traps, and the reason is that the brief had already been through a
verifier who corrected it.** Which is the actual finding.

1. **THE ARGUMENT WAS RIGHT, AND IT WAS THE ONLY THING IN THE BRIEF THAT
   COULD NOT HAVE BEEN DERIVED.** Item 1 said the card's framing is
   inverted, that the checkpoint should correct it, and *"this belongs in
   STATE, because the card will be read by whoever touches the indexer
   next."* Every half checks out against the verdict, and the conclusion —
   that the correction belongs in STATE rather than edited into the card —
   is a JUDGEMENT the repository cannot make for you. It is now the second
   section of this file. **An argument is the one payload a thin brief
   cannot make cheap, and it is also the one worth carrying.**
2. **FIVE FACTS, ALL FIVE VERIFIED RATHER THAN TRUSTED, ALL FIVE TRUE.**
   `T-129-s5` is filed and not the integrator's to fix (confirmed against
   `verifier.md` rule 6 and by reading the comment). The drill-pollution
   sentence is still routed to `T-092` (confirmed in `T-104-s5`'s own
   section and in the previous STATE's item 4) — **and checking it caught
   something the brief could not have known**: a card drafted after the
   brief was written listed the same sentence as new content under a
   `[method/]` fence that **cannot reach the POISON DRILL bullet**, so it
   was not merely a second home but an unperformable one. Routed back and
   removed before filing. The CONVENTIONS backlog is five edits in two
   bullets, three of them one gap seen three ways. The repair/file rule is
   absent from `method/` and is `T-132`'s (both re-checked at this ref).
   And item 6 — the brief correcting its own "two recursions" to
   **three** — is right, matching the verifier's independent sweep.
3. **SIX TRAPS, SIX MEASUREMENTS, AND TWO OF THEM PAID FOR THE WHOLE
   BRIEF.** *An abort is not a test failure — derive the count against the
   `running N tests` headers*: done, 474 = 471 + 3, and this is the card
   whose own M15 shows the summary reading `465 passed / 1 failed` while
   three bodies were in a SIGABRT. *The BOOT GATE fires and the CARD says
   it does not*: derived, run, **FIRES**, exit 0. *`npm run typecheck`
   from `app/` does not exist*: confirmed off `app/package.json`'s script
   map — five scripts, no `typecheck`. *Build `lib/parser` first*: done
   first, unprompted by any red. *Ask GRAPH REGEN twice and never confirm
   by byte count*: asked three times. *A probe reserves nothing*: both
   scratch ports were read and then bound by the tool that owns them.
4. **THE ONE PREDICTION THAT DID NOT FIRE, RECORDED BECAUSE A
   NON-EVENT IS ALSO A MEASUREMENT.** The brief warned that @human
   restarted their checkout earlier, so **the binary pid may legitimately
   differ from earlier readings** — *report what you see rather than
   matching a remembered number.* What was seen is pid **53350** started
   **19:43:47**, which is EXACTLY what T-104's and T-126's checkpoints
   recorded. **The instruction was still right**: it asked for a
   measurement rather than a match, and the fact that the measurement
   agreed with the memory is a fact about tonight and not about the
   method. A brief that had asserted the number instead would have been
   accidentally correct.
5. **WHAT THE THIN FORMAT COST, ON ITS FOURTH TRIAL: NOTHING, AND IT IS
   STARTING TO COST NOTHING FOR A DIFFERENT REASON THAN BEFORE.** The
   first three trials found that every figure was one command away. This
   one found something else: **the brief's most valuable payload was a
   correction the brief's own author had received from a verifier and
   passed on** — the "three recursions, not two" self-correction, and the
   instruction to weigh its reasoning as claims to test. **A brief that
   says which of its own sentences have been checked, and by whom, is
   worth more than one that is merely short.** The format's remaining risk
   is unchanged and the previous edition named it: a number carried as
   atmosphere in a document that promises none. **This brief carried
   exactly one — "up to 20.75× tonight" — and it is a historical maximum
   presented as a live expectation. Tonight's is 7.53x.**
