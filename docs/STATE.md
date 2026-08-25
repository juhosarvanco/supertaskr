# State

Updated: 2026-08-25 by the T-108 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN.**
This merge is **460 / 972 / 268 / 171 green**, and it is the smallest
diff this project has integrated — **four markdown files, zero code**.
But **the app suite cannot even BUILD on a merged main until you rebuild
lib/parser**, **three known intermittents will meet you before any real
defect does**, and **main moved under this integrator between the merge
and the checkpoint** — a card filed by the architect, disclosed rather
than discovered, which is the ordinary case and not an incident. Read the
next five sections before you debug anything, and **derive the lane list
before you cut anything**: it went from FOURTEEN worktree entries to
SEVEN in the twenty minutes this checkpoint took to write.

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
merge's parser diff is EMPTY — its whole diff is `docs/tasks/*.md` — so
the trap did not fire here; the build was run first anyway, in that
order, and both exits were 0. **Do not read a green build as evidence the
trap is gone.**

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
`[tools/e2e]` as this is written, after leading "Next up" for six
consecutive checkpoints.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a `Date`,
and a `Date` holds whole milliseconds** — so the restore writes back a
ROUNDED timestamp while the assertion compares the unrounded float it
captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND FIVE PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** On the night of 2026-08-25 alone it
fired for **T-086, T-102, T-108 and T-116**. It did NOT fire at this
merge — the body passed in the single 171-test run, and main is not a
fresh checkout. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you
do run twice, DECLARE BOTH RUNS. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. **AND THE FRESH-CHECKOUT
PREREQUISITE IS GONE**: T-052's lane reproduced the red ON DEMAND in a
healed worktree by planting a fractional mtime, so `T-130`'s executor can
drive it red in its own worktree without cutting a fresh checkout.

**`T-079-s3` IS NOT CLEARED AND MUST NOT BE READ AS CLEARED.** Only its
item 1 folded into `T-130`; **items 2–3 are `docs/CONVENTIONS.md` edits
routed to `T-104`**, which holds that file. The file is still on disk.

**CITE THE BODY BY NAME, NOT BY A LINE** — the plant-and-restore lives
inside `tools/e2e/tests/token-scan.spec.ts`'s test **"P6 reds a planted
bare motion utility and leaves its motion-safe twin alone"**, and the
mtime assertion the failure quotes is some forty lines further down
inside it. **The previous checkpoint carried `:201` and checked that it
still resolved.** This one deliberately does not carry a number at all,
because T-108's merge is the worked example of why: it shipped a line
number that was **correct when written and false thirty-one minutes
later** (see "Just completed"). CONVENTIONS' own gotcha says a citation
names a SYMBOL; a checkpoint that carries a digit is the gotcha's
counter-example.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS TEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING IN
THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

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
here (unmoved at this precision across three checkpoints, though this
integration's cargo run, two filter runs and THREE `index --check` runs
all wrote into it), and this merge's `cargo test` ran the lib suite in
**4.46s**, with the watcher body read by NAME as `ok` rather than
inferred from a green exit. **SEVENTEEN runs across nine integrations and
not one lands between 9.5s and 14.6s.** Read the lib suite's own time
first; it tells you which regime you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository, and there are FOUR of them right now: `lsof`
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
**`T-102-s3`**, which added a data point from a FRESH worktree with a
SMALL `CARGO_TARGET_DIR`.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE FIFTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list` — **and three of the four tips below moved under this
checkpoint while it was being written.**

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-104** | `[method/, docs/CONVENTIONS.md, app-agent]` | **building** |
| **T-126** | `[app-shell]` | **building** |
| **T-129** | `[crate-index]` | **building** |
| **T-130** | `[tools/e2e]` | **building** |

**T-108's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so FOUR lanes hold
fences after it, down from five. **THE BOARD-TRUTH WINDOW IS CLOSED FOR
THE FIRST TIME IN SIX CHECKPOINTS**: every live lane reads `building` on
the board and holds a worktree on its own branch, and no card reads
`planned` while holding one. That is a state, not an achievement — it
will re-open at the next dispatch.

**THE DETACHED-ENTRY TRAP EMPTIED ITSELF WHILE THIS CHECKPOINT RAN, AND
THAT IS THE FOURTH CONSECUTIVE CHECKPOINT WHOSE WORKTREE PARAGRAPH WENT
STALE ABOUT ITSELF — this time in the useful direction.** At **19:10**
`git worktree list` returned **FOURTEEN** entries: main, five lanes, and
**EIGHT detached non-lanes**, five of them at lane-shaped paths
(`nputer-T-104-verify`, `nputer-T-129-verify`, `nputer-T-129-base`,
`verify-T-126`, `verify-T-126-base`) plus `drill-T-126`, `drill-T-130`
and the human's app. At **19:30** it returns **SEVEN**: main, five lanes
and **ONE** detached non-lane. **Seven verification, base and drill
checkouts were removed by their own sessions in twenty minutes.** A lane
list derived by counting rows would have read FOURTEEN against FIVE at
19:10 and SEVEN against FIVE at 19:30 — **the row count moved by half and
the lane count did not move at all**, which is the whole argument for
filtering on the BRANCH. Derive the membership; do not quote this
paragraph.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **It is the ONLY detached
  entry right now**, which is the first time that has been true since the
  ruling.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** **`docs/tasks/` IS
RELEASED BY THIS CHECKPOINT — and it was never really held**; see below.
Free: `app-map`, `app-board`, `app-dispatch`, `app-interview`,
`docs/architecture/components/`, `lib-parser`, `.github/`, and every
`docs/tasks/` card path. **HELD: `app-shell` by T-126**, **`crate-index`
by T-129**, **`method/`, `docs/CONVENTIONS.md` and `app-agent` by
T-104**, **`tools/e2e` by T-130**.

## Just completed

**T-108 — three live citations in the archive stop teaching the wrong
thing.** F-01, milestone 4, size S, **`touches:` narrowed at dispatch
from the whole `docs/tasks/` directory to the three cards it writes**.
Main-before **`5de8cb1`**, lane tip **`baba41b`** (derived with
`git rev-parse`), merge **`188262e`**, this checkpoint after it.
`builder: claude-opus-5`,
`built_by: claude-opus-5 @T-108 — code commit baba41b`,
`verifier:` and `verified_by:` EMPTY, `review: self-verified`.

**THIS CARD HAD NO VERIFIER AND THAT IS CORRECT** — size S with a
docs-only diff keeps self-integration. Its executor stopped and reported
rather than merging only because integration is a serial resource being
sequenced, **so the integrator was the sole second pair of eyes and read
the diff rather than the report.** That is what produced the finding
below.

**WHAT LANDED.** T-027's plan section taught `W−641`, labelled
*"measured rather than guessed"*, and it was neither: the 1px rule was
ADDED to a border-box 640, so the lens gets `W−640` and the label claimed
a provenance the number never had. Corrected in place, with the half the
card never had — the design of record does not say 799 either: the
artboard is a 1440px border-box frame carrying its own 1px chrome, so it
DRAWS **798**, the app's chrome-less viewport gives **800**, and **799 is
the 1px rule subtracted twice**. T-025 §3's *"~60 KB"* kit figure is
**DELETED rather than corrected**, with the asymmetry stated where the
two numbers sit: the COUNT (14) is parity-walked and load-bearing, the
byte total is `include_str!` of fourteen LIVE `method/` documents that
nothing asserts. And both live citations of
`an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
— **a pin name no Rust function has ever carried** — now read the name
the suite does carry, with two traps written beside the criterion they
govern: **the pathspec is part of the rule**, and **`cargo test --test
<t> <name>` exits 0 on a name that matches nothing**.

### **THE FINDING OF THE PASS: THE CARD SHIPPED A FRESH STALE CITATION, AND IT WENT STALE IN THIRTY-ONE MINUTES**

**The lane wrote `app/src-tauri/tests/agent_runner.rs:1347` into T-081's
criterion 7 and T-025's §6 notes, and 1347 was CORRECT** — it is the
definition's line at the lane's base `765924d` and at its own ref
`43f995a`, measured rather than guessed. Then **`a9ed33d`, Merge T-102,
landed at 15:54:46** — thirty-one minutes after the lane wrote the digit
and **ten minutes after the lane's own tip `baba41b`** — and moved the
definition to **1409**. Line 1347 today is an
`assert!(out.error.is_none(), …)` inside a different body: **it still
resolves, and it points at the wrong thing**, which is exactly the
failure mode CONVENTIONS' *A CITATION NAMES A SYMBOL, NOT A LINE* gotcha
describes.

**So the card written to remove stale citations from the archive shipped
a fresh one that went stale before its own merge, against a rule its own
adjacent clause was quoting** — that clause reads *"No line number and no
line COUNT is written into that pointer, on this correction's own rule."*
**Both digits are DELETED rather than refreshed, in the CHECKPOINT commit
and not in the merge.** The usual objection does not bind: an integrator
does not edit a production diff **a verifier approved**, and there is no
verifier and no verdict on this card; the alternative was to let main
newly acquire the exact defect the card exists to remove. T-081's
ARCHIVAL `:1347` citations, written by its own verifier at its own tip,
are left byte-untouched — they are history, and this card's last
criterion forbids deleting it.

**THE RULE THIS PASS APPLIED, WORTH MORE THAN THE FIX: REPAIR WHAT THE
MERGE INTRODUCES, FILE WHAT THE MERGE MERELY REVEALS.** That line is what
separated this repair from `T-108-s1` below, which is the same class of
defect in the same file and was correctly NOT taken.

### **THE FENCE DIVERGENCE THIS MERGE CLOSES**

**The narrowing was written on the LANE branch rather than on main**, so
for the whole life of the lane **main's copy of the card still advertised
`touches: [docs/tasks/]`** — the whole directory, including the file
every dispatch and every integrator stamps. **Two separate lanes derived
fence disjointness from main's copy and got the wrong answer; one
reported T-108 as holding every card on the board.** The merge lands the
narrowing and the two copies now agree. **This is a live instance of
`T-128`'s fourth finding** — silent corruption of shared state, here by a
stamp written on the wrong side of a fence rather than by a raw ref move.

The ruling that earns the general rule is on the card's own first
section: **a bare `docs/tasks/` directory fence is never correct**,
because that directory is where every dispatch stamps `status: building`
and every integrator stamps `status: done`, so a lane holding it collides
with **every other lane's opening and closing move, including its own
integrator's**. Held strictly it serialises the board; held loosely the
fence is being ignored. **A fence that the project's own protocol must
violate to make progress is not a fence.** Its corollary is the half that
made the narrowing coherent: **a card's own file is never part of its own
fence**, because the dispatch stamp and the closing stamp are protocol
writes rather than lane writes. Routed to `T-104`.

### **AND THAT COROLLARY BREAKS `executor.md` STEP 5, GENERALLY**

Step 5 orders the executor to *"Append Implementation notes to the task
file"*. If a card's own file is never in its own fence, **step 5 is
unperformable for every card fenced at path granularity** — which is the
fence style this card's ruling asks the project to adopt. T-108's
executor followed the ruling and put everything in its report; **T-116's
executor appended notes to its own card.** Two faithful executors, one
method, two behaviours — the signature of an unruled conflict rather than
of a mistake. **`executor.md` already records ONE conflict about this
same step** (the verifier is given *"ONLY the task file … never the
executor's reasoning"* while step 5 writes that reasoning into it). This
is a second, and it is the general one. Filed as `T-108-s3`, routed to
`T-104`, whose fence includes `method/`.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 5de8cb1 baba41b -> tree 537ed24d…, exit 0 (read from $? FIRST)
    git diff --name-only 5de8cb1 <TREE>                        ->   4   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 5de8cb1..188262e  (THE MERGE'S DIFF)  ->   4   the only one that means anything
    git diff --name-only 5de8cb1...baba41b (branch-only, THREE) ->  4
    git diff --name-only 765924d..5de8cb1  (main's advance)    ->  79
    git diff --name-only 5de8cb1..baba41b  (TWO dots, FORBIDDEN)  ->  83

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 79 PATHS — 20.75x — WHICH IS
THE WIDEST RATIO THIS PROJECT HAS RECORDED**, past T-116's 15.80x set
four hours earlier, **and it is pure left-endpoint drift.** Main advanced
**79** under this lane, the branch **4**, `comm -12` over the sorted
lists is **EMPTY**, the union of the two sets is **byte-identical to the
forbidden two-dot set** under `diff`, and 79 + 4 = 83 — the arithmetic
that proves them disjoint, checked as SETS and not only as counts.
Ratios so far: T-110 **7.0x**, T-120 **1.2x**, T-124 **5.6x**, T-052
**5.3x**, T-086 **2.67x**, T-107 **2.25x**, T-102 **3.75x**, T-033
**1.94x**, T-091 **8.78x**, T-116 **15.80x**, T-108 **20.75x**. The ratio
is weather; **the left endpoint is the signal** — and the record has now
been broken twice in one night by two lanes whose own diffs were four and
five paths.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`537ed24dba1735042855b9ad1f85fc6c84f0e5b6` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`5de8cb1` and `baba41b` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST EVERY LIVE LANE.** For
each of `T-104`, `T-126`, `T-129` and `T-130`, `comm -12` of this merge's
four paths against that branch's own `merge-base..tip` diff is **EMPTY**.
Declared fences agree: none of `method/`, `docs/CONVENTIONS.md`,
`app-agent`, `app-shell`, `crate-index` or `tools/e2e` reaches
`docs/tasks/`.

**MAIN MOVED ONCE UNDER THIS INTEGRATOR — AND IT WAS DISCLOSED RATHER
THAN DISCOVERED, WHICH IS NEW.** After the merge `188262e` and during the
checkpoint, the architect committed **`723cfec`** — one new card,
`docs/tasks/T-131-…md`, 273 insertions, nothing else — with
`git commit -- <path>` against an empty index, and then said so
unprompted, naming what it did and did not touch. **Every earlier
instance of main moving under an integrator this week was found by the
integrator's own pre-write check.** The range above is between two fixed
commits and is unaffected; the pre-write check was clean at the merge
(`git diff --cached --name-only` and `git diff --name-only` both EMPTY,
two `??` rows, and `??` alone is not a ceremony).

**AND THE SUITES ARE NOT ONE CARD STALE, WHICH IS DERIVED RATHER THAN
ASSUMED.** The T-131 file's mtime is **19:15** and its committed blob
sha256 is **byte-identical to the working file**, while every suite ran
between **19:17 and 19:22** — so all four suites parsed that card off
disk before it was tracked. Only its git status changed, and the four
walks that matter here read the tree, not the index. **The one figure it
did move is named as the architect's**: `lint:tokens` CONTROL is
`git ls-files`-derived and went **721 → 722**. TOKEN is unchanged at
**135**; this merge adds no new tracked file at all.

## THREE standing gates — ONE fires, all THREE derived from the merge's own 4 paths

| gate | trigger | on these 4 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **0 — NOT OWED** | asked anyway, **exit 0 CURRENT**, three times |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | derived; no scratch port taken for it |
| DOCS GATE | a `docs/` path a code suite reads | **4 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **GRAPH REGEN — NOT OWED, AND ASKED THREE TIMES ANYWAY.** All four
  paths are `docs/tasks/*.md` and `.nputerignore` excludes `docs/`, so
  the graph cannot move. `index --check` was exit **0, CURRENT** at main
  `5de8cb1` BEFORE the merge, exit **0, CURRENT** after it, and exit
  **0, CURRENT** again after this checkpoint's doc writes — **933 486
  bytes · 179 files · 1987 symbols · 1903 edges at all three**, unmoved.
  **THE THIRD ASK IS THE ONE THAT IS NOT CEREMONY**: two integrations
  tonight met a second staleness whose headline figures were IDENTICAL on
  both sides, because the fixtures being reconciled are themselves
  indexed — so a byte-count confirmation cannot substitute for asking.
  **No regen was performed and none was owed**, said here rather than
  left silent.
- **BOOT GATE — NOT OWED, DERIVED.** Zero of four paths sit under
  `app/src-tauri/**` or `app/src/**`, and neither manifest moves.
- **DOCS GATE — exit 1, FIRES on 4 of 4, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is NOT owed and that is DERIVED** —
  this diff carries no `docs/architecture/components/` file and does not
  touch `docs/CONVENTIONS.md`; it was run anyway on integrator step 2,
  and **the card's own Verification line forbids claiming it as evidence
  for these edits**, which is a nice instance of a card fencing its own
  evidence. Invoked DIRECTLY from the repo root with the RANGE RULE's own
  path list, **never through `xargs`**; `merge-tree`'s exit was read into
  a variable BEFORE the substitution. **13 derived readers across 4
  suites**, census **130 sites in 22 files**, **0 frontmatter issues**,
  and `npm run lint:docs` (the whole-tree half, CI's step) is exit **0**.

## No fixture reconciliation was owed, and that is DERIVED

**The graph did not move**, so neither app dogfood fixture has a value to
reconcile, and **the parser pin is not owed** either — no component file
changed and no card was added or removed by the merge. The three-fixture
rule (T-024-s5) fires on DECLARING A COMPONENT; this merge declares
nothing. **This is the first merge in nine with an empty reconciliation
table, and the reason is the diff, not luck.**

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.46s**. **Unchanged from
  main's 460** — this merge contains zero `.rs` files. Run although the
  DOCS GATE did not owe it, on integrator step 2.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 972/972 across 47 files,
  exit 0**. **Unchanged from main's 972**, which is the honest reading
  for a merge that adds no test body and no indexed file. **Derived, not
  matched against the brief** — the brief deliberately carried no figures
  to match against.
- **E2E: 171/171, exit 0, on scratch port 15347 — TWO RUNS, AND BOTH ARE
  DECLARED**, because the rule is to declare every run. Run 1
  (post-merge, pre-doc-writes): **171/171, exit 0, 2.0m**. Run 2
  (post-doc-writes, the one the checkpoint owes): **171/171, exit 0,
  1.9m**. The mtime body passed in both. The port was `lsof`-read first
  (zero rows) and bind-probed free on `127.0.0.1`, `0.0.0.0`, `::1` and
  `::` with a probe this session **wrote itself into its own named
  scratch directory**, and it was **RE-PROBED immediately before binding
  on BOTH runs** — because a probe reserves nothing and an integrator
  tonight lost a port to another lane's Playwright between its probe and
  its use. Free at all four reads.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**,
  **`npm run lint:tokens -- --selftest` exit 0** and **`npm run
  lint:tokens` exit 0** at **TOKEN 135 / CONTROL 722 at the MERGE
  `188262e`**, and **TOKEN 135 / CONTROL 726 at the CHECKPOINT
  `f5e6907`**, re-run there rather than predicted. **DERIVE IT AT YOUR
  OWN REF; it is not a constant** — and the +4 is exactly derivable:
  CONTROL's corpus is `git ls-files`, so **the four suggestion files this
  checkpoint commits were invisible to it until the commit existed**, and
  none of them is a TOKEN-root file. See above for why the earlier +1
  (721 → 722) is the architect's `723cfec` and not this merge's.
  **`index --check` was asked a FOURTH time at the checkpoint commit and
  is exit 0, CURRENT at the same four figures.**
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`. So was the card's own corrected pin:
  `an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
  `ok`.
- **THE THREE OWED SUITES RAN AGAIN AFTER THIS CHECKPOINT'S DOC WRITES**
  (T-081-s9), because every file it writes — four `docs/tasks/T-*.md`
  edits, four new suggestion files and this file — is a code input the
  census names.

## The card's own figures, re-derived at the merge

- **THE KIT BYTE TOTAL IS 25 418 AT `188262e`** over exactly the fourteen
  `include_str!` sources enumerated from `KIT_FILES` — **identical to the
  executor's figure at `43f995a`**, because `method/` has not moved on
  main since. The divergence the brief predicted did not occur, and the
  reason is worth stating: **`T-104`'s branch bumps
  `METHOD_SNAPSHOT_VERSION` to `"0.1.6"` and is UNMERGED**, so main still
  reads `"0.1.5"`.
- **THE DRIFT REPRODUCES EXACTLY**: 23 890 bytes at `4d2f03c` against
  25 418 here, and **all +1 528 of it is `method/tasks/TASK-FORMAT.md`
  alone** (5 397 → 6 925), every other kit source byte-identical across
  the range, **with `METHOD_SNAPSHOT_VERSION` reading `"0.1.5"` at BOTH
  ends.** A figure that drifts with ordinary method edits and needs no
  version bump to do it is **a stronger argument for deleting it than the
  card's own**, and it is in the shipped text.
- **"EXACTLY 14 `include_str!` CALLS" NEEDS THE WORD *CALLS*, AND THE
  SAME TRAP SITS ON THE OTHER NUMBER.** `grep -c 'include_str!'` answers
  **17** (three are doc comments) and `grep -c 'rel:'` answers **15**
  (line 45 is the struct field declaration). Enumerated, both are **14**
  and they agree one-for-one. **The card's own advice — enumerate, do not
  grep a count — holds for the field it did not mention.**
- **THE FILTER TRAP REPRODUCES AND ITS DIGITS HAVE ALREADY MOVED.** At
  `188262e` the phantom prints `0 passed … 81 filtered out` and the real
  name `1 passed … 80 filtered out`, **both exit 0**, against 77/76 at
  `43f995a`. The trap is the invariant; the counts are a function of a
  tree, and the card correctly stamped its ref on them.
- **THE DESIGN FILE IS BYTE-IDENTICAL** at `188262e` to T-074's
  measurement ref `e83ee1d`, sha256 `07d8b43d…` — re-derived rather than
  taken on report, so the 798/800 measurement carries.

## The board, derived from disk at this checkpoint

**255 flat task files — 91 done / 35 planned / 41 parked / 84 suggested /
0 verifying / 4 building; 26 in `rejected/`.**
91 + 35 + 41 + 84 + 0 + 4 = 255. T-108's stamp moves done from 90 to 91
and building from 5 to 4; the architect's `T-131` adds one planned card
that this integration did not write; this checkpoint files **four**
suggestions.

**THE SUGGESTION BACKLOG IS EIGHTY-FOUR AND WANTS AN ELEVENTH TRIAGE.**
`T-108-s1`…`s4` are filed here and are **NOT triaged**: disposition
belongs to a triage pass, not to an integrator (T-083's ruling), so they
stay `status: suggested` exactly as filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's own text is preserved
  byte-untouched apart from the two `:1347` repairs named above**.
- **The DRAFTER'S NOTE was removed by this checkpoint, and its survival
  elsewhere is a measured finding.** The note said *"remove before
  landing"*; the executor could not take it, because the card's own file
  is outside the three-path fence. At `188262e`,
  `git grep -l "remove before landing" -- 'docs/tasks/T-*.md'` finds
  **sixteen** cards, **THREE of them `status: done`** — `T-091`, `T-102`
  and `T-120` all landed carrying a note instructing its own removal.
  **An instruction three landed cards ignored is not a discipline, it is
  a hope**, and it is one predicate on data `docs-gate.mjs` already
  reads. Filed as `T-108-s2`.
- **ROADMAP — DELIBERATELY NOT TOUCHED, and that is derived rather than
  skipped.** F-01's backbone entry is a one-line bullet with no progress
  paragraphs, this card changed nothing under `method/`, and the
  project's own precedent for size-S archive-correction cards is no
  ROADMAP paragraph at all (T-074, T-086 and T-120 have none). Inventing
  progress prose for a one-line entry would be a structural change to
  that document, which an S docs card does not earn.
- **ARCHITECTURE — NOT TOUCHED, and CHECKED rather than assumed.** No
  component is declared and no interface moved. **C-07's byte figure is
  still EXACT**: it reads 933 486 bytes — 93.35%, 66 514 bytes of
  headroom, and the graph is byte-identical at this merge, so the
  re-stamp T-116's checkpoint performed has not gone stale. **The derived
  slug block was re-derived off disk** and matches every component's
  `touch_slugs:` exactly, all eight slugs (`app-agent -> C-14`,
  `app-board -> C-08, C-09, C-11`, `app-dispatch -> C-15`,
  `app-interview -> C-13`, `app-map -> C-12`, `app-shell -> C-05, C-10,
  C-11, C-16`, `crate-index -> C-07`, `lib-parser -> C-06`).
- **NO NEW ADR, and that is derived rather than skipped.** The one
  general ruling on this card — that a bare `docs/tasks/` directory fence
  is never correct — was made by the ARCHITECT at dispatch, is recorded
  on the card, and is **already routed to `T-104`** as method content.
  Nothing supersedes ADR-001–017.
- **CONVENTIONS — NOT TOUCHED, and not by choice: T-104 holds it.** FIVE
  edits are now routed there.
- **T-081 and T-025 carry one integrator repair each** — the `:1347`
  digits — with the derivation on T-081's criterion 7. Both are inside
  this card's own narrowed fence and neither is held by a live lane.

## Provenance — SELF-DECLARED, never read off a trailer

T-108 is **built by `claude-opus-5` and self-verified**, and integrated
by a third hand that did not build it. **`review: self-verified` is the
honest label here and the ceremony table is why**: a size-S card has no
separate verifier (tasks/TASK-FORMAT.md, lane-protocol rule 4), so there
is no verdict to name and `verifier:`/`verified_by:` are left EMPTY
rather than filled with the integrator. **The independence that pays is
INFORMATIONAL** (T-104's ruling seven), and what this pass had was a
report plus a diff read independently of it — weaker than T-116's
base-ref attack set, and it still found the pass's sharpest defect, which
is the argument for reading the diff at every tier. **The
`Co-Authored-By` trailer on this lane's commits is a harness constant and
is NOT evidence of a model** — T-085 proved it and T-101 sharpened it.

**91 done cards — 67 `same-model`, 18 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 67 + 18 + 5 + 1 = 91. T-108 moves `self-verified` from
17 to 18.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **19:11:22** BEFORE the merge,
at **19:16:56** immediately after the merge's WORKING-TREE WRITE, and
again at the end of this checkpoint; the app binary is pid **89201**,
started **2026-08-25 10:54:33**, unchanged throughout, read with the
**anchored** match
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**THIS MERGE'S DIFF IS OUTSIDE BOTH TRIGGER SETS, AND THE PREDICTION WAS
MADE BEFORE IT WAS CHECKED.** Zero of four paths are under `app/src/**`
(vite HMR — the window is never replaced) and zero under
`app/src-tauri/**` (which rebuilds and RELAUNCHES the binary). **No
reload and no relaunch were predicted and neither happened**, confirmed
by the unchanged pid and start time rather than by argument. **AND
"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER TO THE DEPENDENCY
QUESTION** — integrator.md rule 2 says so in as many words, and this
merge is the case that proves the rule bites: **this integration DID
rebuild `lib/parser/dist`**, which is the exact channel, on a docs-only
diff, because the build ORDER is run on principle. **The channel is
closed by MEASUREMENT rather than by assumption**: `app/node_modules/@nputer/parser`
is a **RELATIVE** symlink (`../../../lib/parser`), re-read here rather
than inherited, so it resolves inside its OWN checkout, and the human's
app serves from `/Users/ujju/Projects/nputer-app`, which has its own
`lib/parser/dist`. **Read that as a property of the second checkout, not
of this merge.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** Had one been owed,
the CHECKOUT test decides — and it was run rather than reasoned:
`lsof -p 88948` reports the holder's cwd as
`/Users/ujju/Projects/nputer-app/app`, a DIFFERENT checkout, so it would
have been permitted rather than refused. **That is `integrator.md` rule 1
applied rather than CONVENTIONS' DETECT AND REFUSE paragraph quoted;
those two are still different facts and the repair is still item 5 below,
unwritten after EIGHT consecutive merges performed it by hand.**

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout (`c4cfe52`, re-derived here with
`git -C ../nputer-app rev-parse HEAD` rather than quoted) but OPENS
`/Users/ujju/Projects/nputer` as its project, so this merge's board
changes — a card moving to `done`, four new suggestion files, one card
the architect filed — land in the watched folder live.

**No process from this integration survives.** Scratch port **15347** was
released; **no boot-gate port was taken at all**, because that gate is
not owed. **TWO UNTRACKED FILES SIT IN THE MAIN CHECKOUT AND NEITHER IS
THIS INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there
for the **twentieth** checkpoint running — not this integrator's, not
this merge's, not staged, left alone. `docs/tasks/T-131-…md` appeared
untracked at **19:15**, mid-integration, and was committed by the
architect as `723cfec` at 19:18:48; it was **left strictly alone** and is
named here because an untracked file in this checkout is exactly the
shape integrator.md rule 4 asks to be recorded. **No `pkill`. No
`npm ci`. No `cargo clean`. No `git update-ref`, no force-push, no
history rewriting.** Be precise rather than claiming more than is true:
this integration's `cargo test`, its two filter runs and THREE
`index --check` runs all WROTE to main's `app/src-tauri/target/`, which
reads **3.0 GB**, as any cargo run must. **No sibling worktree was
entered or modified** — the lane worktree was read at
`/Users/ujju/Projects/nputer-T-108` and removed by this checkpoint, and
`../nputer-app` was read with `git -C … rev-parse` and `lsof` only. No
path was staged by wildcard; `git add -A` was never used, and the write
used `git commit -- <paths>` so it could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN.** FOUR lanes hold fences — **T-104**, **T-126**,
**T-129** and **T-130** — and **NOTHING IS QUEUED FOR INTEGRATION**,
which is the first time that has been true tonight. Three of the four
lane tips moved while this checkpoint was being written, so read
`git worktree list` rather than the table above.

**`docs/tasks/` IS RELEASED — AND IT WAS NEVER REALLY HELD.** That is
the whole of T-108's fence lesson: the declared fence and the practised
one were different sets for the lane's entire life, and the practised one
was right.

## Next up

1. **`T-130` IS BUILDING** — the intermittent that cost four separate
   lanes tonight. One token of code, `[tools/e2e]`, and the reproduction
   is on-demand in any worktree since T-052.
2. **`T-131` IS FILED AND UNREAD BY ANY PIPELINE ROLE.** The architect
   filed it at `723cfec` during this integration: `status: planned`,
   `blocked_by: [T-104]`, `touches: [method/, docs/CONVENTIONS.md]`,
   size M — a ranked set of method changes for @human to rule on, from
   the first session that ran six lanes concurrently. **It is not this
   integrator's to triage or summarise**, and it is named here so the
   next session does not meet it as a surprise.
3. **`T-108-s3` — `executor.md` STEP 5 IS UNPERFORMABLE UNDER A
   PATH-GRANULAR FENCE**, and it is the SECOND unruled conflict on that
   one step. Routed to **T-104**, which holds `method/` and is the
   rulings vehicle. **A change to step 5 is a method format change and
   therefore a version bump**, whose third file is Rust — so taking it
   beside `T-124-s1` costs one commit instead of two.
4. **`T-108-s1` — THE FOURTH STALE CITATION**, in T-081's own verifier
   notes: *"the string occurs in exactly three files"* names `T-081-s8`,
   a file the sixth triage deleted, and says "twice" where its own card
   holds four. **The total is still three and every member has changed**,
   which is the hardest kind of stale claim to see. Fence
   `[docs/tasks/T-081-denial-reaches-the-screen.md]`, free.
5. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
   (`T-091`, `T-102`, `T-120`). One predicate on data `docs-gate.mjs`
   already reads; the three instances must be cleared in the same commit
   or the gate reds on arrival. Fence `[tools/e2e]`, **held by T-130**.
6. **`T-108-s4` — THE PATHSPEC RULE NEEDS A THIRD CLAUSE: THE ROOT.**
   `git grep -- .` run from a subdirectory silently scopes itself and
   answers exit **1** on a string that is present — walked into live by
   this integrator while checking the rule T-108 had just landed.
   CONVENTIONS already carries the knowledge; the rule that most needs it
   does not.
7. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — EIGHTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **held by
   T-104**.
8. **FIVE CONVENTIONS/METHOD EDITS ARE ROUTED TO T-104 AND NONE HAS BEEN
   TAKEN.** (a) `T-091-s3`: one clause naming GRAPH REGEN's TRIGGER
   beside the ref its flip figures carry. (b) The `bdada11` sharpening:
   `merge-tree --write-tree` exits 1 and **still prints a tree oid on
   line 1** — re-confirmed here, where the exit was read into a variable
   BEFORE the substitution for exactly that reason. (c) `T-079-s3` items
   2–3. (d) **T-108's fence ruling** — a bare `docs/tasks/` directory
   fence is never correct, and a card's own file is never part of its own
   fence. (e) `T-108-s3`. **T-104 can take all five without widening its
   fence.**
9. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` returns zero
   rows. Every integrator does it — this one included, and it matched the
   merge's tree byte for byte again — and no governing file asks for it.
   Fence is `method/`, **held by T-104**.
10. **THE COMMENT CORRECTION IN `churn-source.ts`** — T-116 routed it
    rather than took it. `onProjectMaybeChanged`'s doc comment claims it
    inherits the single-flight latch; it nulls `inFlight` on the line
    before, so five switches spawn five `repo_churn`. `[app-map]`, free.
11. **THE TWO UNPINNED GUARDS IN `map-churn-age.test.tsx`** — the
    generation guard's `.catch` half and the changed-folder guard. Both
    CORRECT, both unpinned, probes in T-116's verdict. `[app-map]`, free.
12. **`T-127` — THE SURVIVING CYCLE.** `planned`, `blocked_by: [T-033]`
    cleared. Fence `[crate-index, docs/architecture/components/]`;
    **`crate-index` is held by T-129**.
13. **`T-125` IS FULLY BLOCKED AGAIN.** `[app-agent, app-shell,
    docs/architecture/components/]` takes the last undeclared row,
    `C-10 → C-14` — but `app-agent` is held by T-104 and `app-shell` by
    T-126.
14. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live and
    visible: `arch` says `drift_components=3`, TypeScript says 1. Rides
    `[crate-index]`, **held by T-129**.
15. **`T-128` — SILENT CORRUPTIONS OF SHARED STATE**, `planned`, fence
    `[method/, docs/CONVENTIONS.md]`, **held by T-104**. **This
    checkpoint adds a fourth instance and it is a NEW SHAPE**: T-108's
    narrowing stamp was written on the lane branch instead of on main, so
    main advertised a wide fence for the lane's whole life and two other
    lanes derived the wrong answer from it. Not a ref move, not a
    concurrent write — **a correct edit made on the wrong side of a
    merge**, which no existing arm of that card names.
16. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND**, for **T-104**'s
    owed v0.1.6 method bump. The debt is per-VERSION, so one three-file
    commit discharges T-089's, T-124's, T-052's, T-102's, T-033's,
    T-091's, T-116's and this checkpoint's residual together. **T-104's
    branch already reads `METHOD_SNAPSHOT_VERSION = "0.1.6"`** — derived
    here — so the bump is written and unmerged rather than pending.
17. **THE BOARD-TRUTH RULING** — TWELFTH ask, and the first time it is
    asked from a CLOSED window: no card reads `planned` while holding a
    worktree right now. It still wants a ruling, because the window
    re-opens at the next dispatch.
18. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **held by
    T-104**.
19. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **held by T-104**.
20. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN**, ready to paste,
    measured green then red twice. Needs `app/test/**`, C-05 `app-shell`
    — **held by T-126.** Read it beside **`T-110-s9`**.
21. **THE SUGGESTION BACKLOG IS EIGHTY-FOUR AND WANTS AN ELEVENTH
    TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1` and
    `T-108-s1`…`s4` are untriaged.
22. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint.**
23. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
24. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This one was written deliberately THIN — it carried the ask,
the judgement calls and the commands, and **no figures at all**, on the
architect's own finding that every error in every brief tonight was a
transcribed figure. **The format worked**: with nothing to transcribe
there was nothing to transcribe wrongly, and the errors below are all of
the SECOND kind — predictions about what the repository would say.

1. **THE PREDICTED KIT-BYTE DIVERGENCE DID NOT HAPPEN.** The brief warned
   that this integrator's re-derivation *"may differ for a real reason"*
   because `T-104`'s branch bumps `METHOD_SNAPSHOT_VERSION`. It does —
   to `"0.1.6"` — **but T-104 is unmerged**, so main reads `"0.1.5"` and
   the total is **25 418 at both `43f995a` and `188262e`**, identical to
   the executor's. A branch cannot move main's figures, which is the same
   lesson the fence divergence teaches from the other side.
2. **THE LANE LIST WAS RIGHT AND ALREADY HALF STALE.** The brief said to
   derive it and to filter on the branch, and said detached scratch
   worktrees *"outnumber real lanes better than two to one"* — true at
   19:10 (eight against five) and **false by 19:30 (one against five)**,
   because seven of them were removed by their own sessions during this
   integration. The instruction was right; the ratio is weather.
3. **`tools/e2e` AND `docs/CONVENTIONS.md` ARE STILL HELD**, which the
   brief did not claim but a reader might infer from "T-104 is the
   rulings vehicle and is in verification now": T-104 reads `building` on
   the board, holds a worktree, and has a sibling detached checkout that
   was removed during this pass. **`T-104`'s own tip did NOT move**
   (`7d95f79` at both readings) while three other lanes' did.
4. **THE BRIEF ASSIGNED THREE JUDGEMENT CALLS AND THERE WERE FOUR.** The
   fourth — the stale `:1347` this merge would have introduced — is the
   sharpest thing the pass found, and **no brief could have named it**,
   because it was created by a merge that landed thirty-one minutes after
   the lane wrote the digit. That is the argument for the brief's own
   instruction to read the diff rather than the report, and it is the one
   place where a thinner brief cost nothing and gained everything.
5. **ONE INSTRUCTION WAS UNNEEDED AND SAYING SO IS USEFUL**: the brief
   required GRAPH REGEN to be asked twice, after the merge and after the
   doc writes. It was asked **three** times and answered CURRENT at all
   three, because the trigger matched **0 of 4** paths. The instruction
   costs a second and remains right — but a checkpoint that reports "the
   regen was asked" without saying whether it was OWED has told you
   nothing, which is why the derivation is stated above the result.

**WHAT THE THIN FORMAT NEEDED AND DID NOT WITHHOLD.** Nothing was
missing. Every figure the pass required was derivable in one command, and
the two facts the brief DID carry — that the card's `touches:` diverges
between main and the lane, and that the executor deliberately left a
fourth citation — are exactly the two that **cannot** be derived, because
one is a divergence and the other is an intention. **That is the rule the
format found: a brief should carry what the repository cannot say about
itself, and nothing else.**
