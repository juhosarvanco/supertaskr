# State

Updated: 2026-08-25 by the T-091 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THE RANGE RULE — THE
PARAGRAPH EVERY SESSION IN THIS PIPELINE CONSULTS — HAS A READER NOW, AND
`tools/e2e` IS FREE, WHICH IS THE FENCE `T-120-s3` HAS BEEN WAITING NINE
CHECKPOINTS FOR.** Nothing on main is broken: this merge is **460 / 962 /
268 / 171 green**. But **the app suite cannot even BUILD on a merged main
until you rebuild lib/parser** (next section — it cost one wrong diagnosis
already), **three known intermittents will meet you before any real defect
does**, and **main moved under this integrator between reading the brief
and merging**, which is the ordinary case and not an incident. Read the
next five sections before you debug anything, and derive the lane list
before you cut anything.

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
merge's parser diff is EMPTY, so the trap did not fire here; the build
was run first anyway, in that order, and both exits were 0. **Do not
read a green build as evidence the trap is gone.**

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — **TENTH
checkpoint running at the top of "Next up"** — but for the first time
since it was filed **its fence is FREE**, because this merge releases
`tools/e2e`.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a `Date`,
and a `Date` holds whole milliseconds** — so the restore writes back a
ROUNDED timestamp while the assertion compares the unrounded float it
captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND THREE PASSES HAVE CAUGHT
IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** It did NOT fire at this merge — the
body passed in the single 171-test run, and main is not a fresh checkout.
**DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you do run twice,
DECLARE BOTH RUNS. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. T-052's lane removed this
finding's own "needs a fresh checkout to prove" prerequisite by
reproducing the red ON DEMAND in a healed worktree, so whoever takes the
fix can verify it anywhere.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS EIGHT CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
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
here (unmoved from T-033's checkpoint at this precision, though this
integration's cargo run and TWO graph checks all wrote into it), and this
merge's `cargo test` ran the lib suite in **4.14s**, with the watcher body
read by NAME as `ok` rather than inferred from a green exit. **FIFTEEN
runs across seven integrations and not one lands between 9.5s and 14.6s.**
Read the lib suite's own time first; it tells you which regime you are in
before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository, and there are FIVE of them right now: `lsof`
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
SMALL `CARGO_TARGET_DIR` — the configuration the slow-checkout hypothesis
calls green. Two findings, one body.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE THIRTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`) | board says |
|---|---|---|
| **T-104** | `[method/, docs/CONVENTIONS.md, app-agent]` | **building** |
| **T-108** | `[docs/tasks/T-027-…, T-025-…, T-081-…]` — THREE CARDS | **planned on main** — built and queued for integration |
| **T-116** | `[app-map]` | **planned on main** — in VERIFICATION |
| **T-126** | `[app-shell]` | **building** — dispatched DURING this integration |
| **T-129** | `[crate-index]` | **building** |

**T-091's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so FIVE lanes hold
fences after it — one more than before, because a dispatch landed while
this merge was being prepared. **THE BOARD-TRUTH WINDOW IS STILL OPEN IN
BOTH DIRECTIONS**: T-116 and T-108 read `planned` on main while holding
worktrees, and T-116 is actually in VERIFICATION. **DERIVE THE LANE LIST
FROM `git worktree list`; NEVER READ IT OFF A BRIEF OR OFF THIS TABLE** —
**four consecutive dispatch briefs have now stated a lane list and every
one was wrong**, and this integrator's own brief was wrong in a fifth way:
it named a detached `nputer-T-116-verify` entry that no longer exists,
while `nputer-T-116` is a real lane on a real branch. The trap the brief
was warning about had already inverted.

**TWO DETACHED NON-LANE ENTRIES EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** Derive the membership; do not quote it.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge.
- **`/Users/ujju/Projects/drill-T-102-verify`, detached at `d12efac`** —
  still on disk, **outliving its verification for the third checkpoint
  running**. Not the integrator's to remove.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** **`tools/e2e` IS
RELEASED BY THIS CHECKPOINT.** Free too: `app-board`, `app-dispatch`,
`app-interview`, `docs/architecture/components/`, `lib-parser`, `.github/`.
**HELD: `app-shell` by T-126** (free for less than an hour — 22 of the
planned cards want it), **`app-map` by T-116**, **`crate-index` by
T-129**, **`method/`, `docs/CONVENTIONS.md` and `app-agent` by T-104**.

## Just completed

**T-091 — the range rule gets the reader its own fence forbade.** F-06,
milestone 4, size M, `touches: [tools/e2e]`, **fence never widened, and
refusing to widen it is the finding**. Main-before **`41900d6`**, lane tip
**`1e134b1`**, merge **`ca5fb96`**, this checkpoint after it.
`builder: claude-opus-5`,
`built_by: claude-opus-5 @T-091 — code commits d2bba71, 2e5704a`,
`verifier: claude-opus-5`,
`verified_by: claude-opus-5 @T-091-verify — APPROVED, 2026-08-25 —
verdict commit 1e134b1`, `review: same-model`.

**WHAT LANDED — THE PARAGRAPH THIS PIPELINE CONSULTS MOST IS THE ONE
NOTHING COULD CHECK.** Every measured figure in the RANGE RULE bullet was
**poisonable to any value with every reader still green** — proved on
T-083's branch by poisoning five at once (9→7, 36→12, 31→41, 10→2, 8→1,
breaking the surrounding arithmetic too) with `workflow-parity` 14/14,
`cargo test`, `lint:tokens` and the parser suite all exit 0, and then by
ten criteria-derived mutants, **zero killed**. `tools/e2e/tests/
range-rule.spec.ts` + `scripts/range-rule.mjs` now recompute it in **25
bodies**: git computes on one side, the parsed document is read on the
other, **and the two sides share no constant**.

**THE PROOF THAT IT DERIVES IS THAT MOVING A FIGURE MOVES THE
EXPECTATION**, established three ways by the verifier rather than by
reading the code: no figure appears as a literal in the source (every
expectation arrives through a `\d+` capture); the shipped body moves the
document's `31` to `32` in memory and requires the parsed expectation to
follow; and **on disk**, mutating `**31**` to `**30**` in a scratch
checkout REDS the reader. A reader that hard-coded 31 is green there and
dies. **22 mutants attempted, 21 applied, 18 KILLED, 3 PROVEN EQUIVALENT,
0 genuine survivors**, each equivalence proved by measurement with its
meaning-changing neighbour killed.

### **THE RULING THIS CARD TURNS ON, AND IT IS THE MOST REUSABLE THING HERE**

The bullet's flip figures were measured before GRAPH REGEN's trigger
gained `*.rs` at `e1f3023`. **SO THEY CARRY THEIR REF AND NOT THEIR
TRIGGER.** At the refs they name GRAPH REGEN flips **5 of 5**; under the
trigger as it now stands the same derivation is **1 of 1**, and the
headline *"thirteen flips in fifteen chances over twelve merges"* becomes
**9 / 11 / 8**. BOOT is unmoved at 8 of 10 either way.

The lane chose to **DISCLOSE rather than re-derive**, and the verifier
ruled for it independently on four grounds. **The decisive one**: the only
compliant repair under the alternative is to overwrite `5 of 5` with
`1 of 1`, **which destroys the five merges the whole correction rests on
— a gate that launders history.** Those five were real flips when they
happened; four of them stop being counterexamples only because a trigger
widened afterwards, and they are the empirical refutation of *"it has
never yet changed WHETHER the gate fires"*. The other three grounds: the
card had already ruled one variable over, its own 31-vs-30 fixture holding
that **a figure and the command producing it are ONE claim** (substitute
*trigger* for *range spelling* and the sentence is unchanged in force);
re-binding the trigger to HEAD while leaving the merge range at `ddcc8bb`
evaluates a THIRD expression mixing vintages, which is this bullet's own
named error; and it would never terminate, redding paragraphs nobody
edited on whatever lane is nearest.

**AND DISCLOSURE ONLY WINS BECAUSE THE LANE PAID FOR IT.** The note prints
on **stdout on every run** — observed here in the full 171-test run,
stamped with this merge's own ref: *"range-rule DISCLOSURE
[flip-counts-carry-their-trigger]: /Users/ujju/Projects/nputer @ ca5fb96
… 5 of 5 at that ref, 1 of 1 under the trigger on disk."* The arm
**ASSERTS MONOTONICITY** (a wider trigger can only lower the not-owed
count and can add no flip that was not one before — a real derived
property, so the check is not vacuous on a quiet tree) and it **REDS IF
THE TRIGGER EVER NARROWS**, which is the one direction that is a genuine
defect and is GRAPH REGEN's own argument. The verifier says plainly:
silence would have lost. That is **`T-091-s3`**, and its residue is one
clause naming the trigger beside the ref in `docs/CONVENTIONS.md` —
**held by T-104, so it is ROUTED and not taken here.**

### **THE CARD'S OWN CRITERION, MET INSIDE THIS FENCE, WOULD HAVE MANUFACTURED ITS OWN COUNTEREXAMPLE**

**THIS IS THE CLOSEST THE THREE-DOT FORM HAS COME TO BEING WRONG ON THIS
PROJECT, AND IT BELONGS IN THIS FILE.** Main's **70**-path advance under
this lane includes **`docs/CONVENTIONS.md`** — the document under test,
**+62 / −18** lines by T-086's merge. The two sets stayed disjoint *only*
because the fence is `[tools/e2e]`. **Had the lane widened its fence to
satisfy criterion 12** (write the predicted-tree ritual into the governing
file), the two sides would have touched the same path, and three dots
would have stated the lane's edit against the branch POINT and **silently
dropped main's 62 new lines** — this bullet's own warning, manufactured by
obeying the card that carries it. A card can specify a defect into
existence; the routing to **`T-091-s4`** is correct. Re-derived here for
the reason rather than the relief: main's edit lands in THE FOUR WALKS and
DOCS GATE bullets and **not** in the RANGE RULE bullet, so nothing the
reader computes moved.

### **FOUR THINGS THE CARD AND THE DISPATCH BRIEF GOT WRONG**

1. **The card's Verification section is wrong about its own drill
   hazard.** It says *"the document under test is a tracked file this lane
   is also editing"*. It is not: the lane's paths contain **no
   `docs/CONVENTIONS.md`**. The hazard is real for the DRILL and the
   answer is the detached worktree both passes used. Executor, verifier
   and integrator all derived this independently.
2. **The DRAFTER'S NOTE said "remove before landing" and was still
   there**, left deliberately by the executor for the integrator.
   **Removed by this checkpoint.**
3. **THE READER COUNT WENT STALE IN THREE DIFFERENT DIRECTIONS ON ONE
   CARD.** The card's head paragraph says TWO opened
   `docs/CONVENTIONS.md`, then THREE; the brief said the gate answers
   **FIVE by name**. **At this ref the gate answers FOUR by name** —
   `kit.rs`, `docs-input-gate.spec.ts`, `range-rule.spec.ts`,
   `workflow-parity.spec.ts` — plus TWO whole-`docs` readers
   (`shell-frame.spec.ts`, `window-contract.spec.ts`) that also reach it,
   so SIX in total. The census is **13 derived readers across 4 suites**
   (12 on main before this merge), and the thirteenth is
   `range-rule.spec.ts` itself via `call conventionsText()` — **`T-091-s2`
   confirmed from the gate's own output**, and T-086's whole subject
   happening once more to the card that names it. **ASK THE GATE. Nobody
   who transcribed this number has been right yet.**
4. **The brief's GRAPH REGEN derivation was wrong and the verdict was
   right anyway.** It reasoned the trigger does not fire because `.mjs` is
   not in the suffix list — true of `range-rule.mjs`, irrelevant to
   `tools/e2e/tests/range-rule.spec.ts`, which is a `.ts` outside `docs/`.
   **The trigger FIRES, 1 of 9.** Same verdict, different route: this one
   asked the gate, which is what that bullet requires.

### **THE MEASURED SHARPENING THE LANE'S FENCE COULD NOT REACH**

CONVENTIONS says a swallowing command substitution hands you an *"EMPTY
forecast wearing the costume of a clean gate"*. **The costume is better
tailored than the sentence claims**, re-measured here rather than taken on
report: `git merge-tree --write-tree bdada11^1 bdada11^2` exits **1** and
**still prints a bare 40-hex tree oid on line 1** (`4556eeb9…`, the
conflicted tree) before the conflict rows — so `TREE=$(…)` captures a
multi-line value whose FIRST LINE looks exactly like a clean answer, and
a re-deriver who greps for "empty" will not find the failure they were
warned about. **This is a `docs/CONVENTIONS.md` edit and T-104 holds that
fence**, so it is routed here rather than written. It is why the recipe
says *read `merge-tree`'s exit BEFORE the substitution* rather than *check
whether the forecast is empty*.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 41900d6 1e134b1 -> tree b8e05dca…, exit 0 (read from $? FIRST)
    git diff --name-only 41900d6 <TREE>                        ->   9   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 41900d6..ca5fb96  (THE MERGE'S DIFF)  ->   9   the only one that means anything
    git diff --name-only 41900d6...1e134b1 (branch-only, THREE) ->   9
    git diff --name-only c4c15c8..41900d6  (main's advance)    ->  70
    git diff --name-only 41900d6..1e134b1  (TWO dots, FORBIDDEN)   ->  79

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 70 PATHS — 8.78x — WHICH IS
THE WIDEST RATIO THIS PROJECT HAS RECORDED, AND IT IS PURE LEFT-ENDPOINT
DRIFT.** Main advanced **70** under this lane, the branch **9**, `comm -12`
over the sorted lists is **EMPTY**, the union of the two sets is
**byte-identical to the forbidden two-dot set** under `diff`, and
70 + 9 = 79 — the arithmetic that proves them disjoint, checked as SETS
and not only as counts. Ratios so far: T-110 **7.0x**, T-120 **1.2x**,
T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107 **2.25x**, T-102
**3.75x**, T-033 **1.94x**, T-091 **8.78x**. The ratio is weather;
**the left endpoint is the signal** — and this merge is the extreme case
of exactly that, a nine-path lane that the naive range would report as
having rewritten seventy files.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`b8e05dcae8061e5830eae73eb41355ce267c661b` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`41900d6` and `1e134b1` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** That comparison is **this card's own criterion 12**,
practised at the merge that lands the card asking for it to be written
into a governing file — and it is still written in no governing file
(`T-091-s4`).

**MAIN MOVED UNDER THIS INTEGRATOR AND THE PRE-WRITE CHECK IS WHY IT
COST NOTHING.** The brief named main at `fbae94a`; on arrival
`git diff --name-only` returned `docs/tasks/T-126-…md` — a REAL
uncommitted dispatch stamp by a concurrent pass (`status: planned →
building`, `builder: → claude-opus-5`), modified 48 seconds earlier. The
checkpoint **waited**, the writer committed `41900d6`, and **every range
figure above was re-derived at the new main**. The prescribed count was 9
at both refs and the forbidden two-dot count moved 78 → 79, which is the
whole lesson: **the number that changes when main moves is the one the
forbidden form reports.** `??` lines alone are not a ceremony and there
was exactly one (`z`).

## THREE standing gates — TWO FIRE, ALL THREE DERIVED from the merge's own 9 paths

| gate | trigger | on these 9 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — FIRES** | exit **0, CURRENT** — no regen owed |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | not run, and that is DERIVED |
| DOCS GATE | a `docs/` path a code suite reads | **7 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **GRAPH REGEN — ASKED RATHER THAN PREDICTED, which is the whole point
  of the trigger being wider than the walk.** The single match is
  `tools/e2e/tests/range-rule.spec.ts`; `range-rule.mjs` does not match
  the printed suffix list, and that is not a gap — `graph.rs:206` asserts
  `Lang::for_extension("mjs")` is `None`, so the walk does not take it
  either. `cargo run -p nputer-index -- index --check --root ../..` is
  **exit 0, CURRENT** at **925 217 bytes · 178 files · 1968 symbols ·
  1886 edges**, unmoved from T-033's checkpoint. **No regen owed**,
  because `tools/` is `.nputerignore`d — the T-054 and T-058 precedent.
  **THE GATE WAS ASKED AGAIN AFTER THIS CHECKPOINT'S OWN DOC WRITES** and
  still answers 0/CURRENT, which is T-033's lesson applied: after
  reconciling a fixture there, `index --check` went STALE a second time
  **with every headline count identical** — same bytes, files, symbols,
  edges, only an internal `loc` moved. **A checkpoint that regenerates
  once and confirms by byte count can ship a stale graph with no figure
  capable of showing it.** This checkpoint edits no INDEXED file, which is
  why the second ask is a confirmation rather than a repair.
- **BOOT GATE — 0 of 9, NOT OWED.** No `app/src-tauri/**`, no
  `app/src/**`, neither manifest. `npm run boot:check` was **not run, and
  that is derived rather than skipped** — a refusal that fires either way
  cannot tell the two apart.
- **DOCS GATE — exit 1, FIRES on 7 of 9, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is NOT owed and that is DERIVED** —
  this diff carries no `docs/architecture/components/` file and does not
  touch `docs/CONVENTIONS.md`, which is what `kit.rs` reads. Invoked
  DIRECTLY from the repo root with the RANGE RULE's own path list,
  **never through `xargs`**; `merge-tree`'s exit was read into a variable
  BEFORE the substitution. **0 frontmatter issues**, and
  `npm run lint:docs` (the whole-tree half, CI's step) is exit **0**.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh — **this checkpoint reproduced that
again on its first attempt** — so every exit below came off its own `$?`
on an unpiped command redirected to a file, and **the COUNT was read as
well as the exit**, because an exit alone cannot tell a green suite from
a suite that did not run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.14s**. **Unchanged from
  main's 460**, which is the honest reading: this merge contains **zero
  `.rs` files**, so no Rust body moved. Run although the DOCS GATE did not
  owe it, on integrator step 2.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 962/962 across 46 files,
  exit 0**. **No intermediate red and no deferred assertion**: this merge
  moves no fixture, because it declares no component and regenerates no
  graph.
- **E2E: 171/171, exit 0**, on scratch port **15297**, **ONE run** — there
  was no second run to declare. **Main was 146**; the 25 new bodies are
  this card's, and the number was derived rather than matched against the
  brief's.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**, and
  **`npm run lint:tokens` exit 0** at **TOKEN 134 / CONTROL 720**. Both
  moved and both are exactly derivable: TOKEN 132 → 134 is the two new
  files under `tools/e2e`, CONTROL 712 → 720 is the eight new tracked
  files this merge adds. **DERIVE IT AT YOUR OWN REF; it is not a
  constant** — the corpus is `git ls-files`.
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`. `token-scan.spec.ts:201` passed on its
  single run.
- **THE SUITES THE CHECKPOINT ITSELF OWES RAN AGAIN AFTER ITS DOC WRITES**
  (T-081-s9), and this checkpoint writes `docs/ROADMAP.md`,
  `docs/ARCHITECTURE.md`, `docs/STATE.md` and one `docs/tasks/T-*.md` —
  all four of which the census names as code inputs.

## The board, derived from disk at this checkpoint

**250 flat task files — 89 done / 36 planned / 41 parked / 81 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
89 + 36 + 41 + 81 + 0 + 3 = 250. T-091's stamp moves done from 88 to 89
and verifying from 1 to 0.

**THE SUGGESTION BACKLOG IS EIGHTY-ONE AND THE LAST TRIAGE WAS THE
TENTH.** This merge added **SIX** — `T-091-s1` … `T-091-s6`. **THEY ARE
NOT TRIAGED HERE:** disposition belongs to a triage pass, not to an
integrator (T-083's ruling), so all six stay `status: suggested` exactly
as filed. Read **`T-091-s3`** first — it is the one the verdict turns on
and the one whose residue is a one-clause document edit. **`T-091-s1` is
the one already VERIFIED with a matched pair**: the DOCS GATE exits 1
rather than 3 when its own `yaml` dependency is missing, so *"the gate
never ran"* arrives wearing a verdict's exit code. The fix reds rather
than skipping — same checkout without `node_modules` gives **exit 1,
24/1**, the red naming three of four arms; with it linked, **25 passed,
exit 0** — and the gate's own strings never appear in it, so it cannot
swallow a verdict.

## Documents ticked

- **ROADMAP — F-06's bullet gains the T-091 paragraph**, written to say
  plainly that this is **inherited backlog and not map content**: F-06's
  premise reaches the GOVERNING DOCUMENTS now, the pane did not move, and
  a bullet that implied otherwise would be the same kind of untrue as the
  figures this card defends.
- **ARCHITECTURE — the code-layout bullet records that `tools/e2e/`
  WIDENS ONCE MORE.** It already said the directory hosts a static
  analyser reading all four packages as text (T-084/T-085); it now also
  holds **a reader of a GOVERNING DOCUMENT** that re-derives the
  document's own figures by running git. Three properties are the
  architectural content rather than the test count — it EXECUTES the
  printed recipe rather than re-implementing it, it SHARES NO CONSTANT
  with the document, and it is the fourth by-name reader of
  docs/CONVENTIONS.md. **The reader count is deliberately not written
  into that sentence** — ask the census; the sentence that carried a digit
  there has gone green and wrong twice.
- **The components table and the derived slug block were NOT touched, and
  that was CHECKED rather than assumed.** Every component's
  `touch_slugs:` was re-read off disk and the block matches it exactly
  (`app-shell -> C-05, C-10, C-11, C-16`; `app-board -> C-08, C-09,
  C-11`; `app-map -> C-12`). **No component claims `tools/e2e`** — it is
  dev tooling under no component and `.nputerignore`d — which is why this
  merge moves neither the graph nor the registry. C-07's byte figure is
  **925 217** at this ref, unchanged, so its stamp needed no re-derivation
  either.
- **NO NEW ADR, and that is derived rather than skipped.** The one
  non-obvious decision on this card — disclosure over re-derivation for a
  figure whose trigger moved — was made by the LANE and ruled on by the
  VERIFIER, and it is recorded on the card, in `T-091-s3` and above.
  Nothing supersedes ADR-001–017.
- **CONVENTIONS — NOT TOUCHED, and this time not by choice.** TWO edits
  it has now earned are ROUTED rather than written, because **T-104 holds
  `docs/CONVENTIONS.md`**: the trigger-beside-the-ref clause (`T-091-s3`)
  and the `bdada11` sharpening above. A third, older one is still
  outstanding — the fresh-clone ORDER binds a fully-installed checkout
  whenever a merge changes the parser's TYPES.
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, **the DRAFTER'S NOTE is removed as it asked**,
  and the lane's notes and the verdict are preserved byte-untouched.

## Provenance — SELF-DECLARED, never read off a trailer

T-091 is **built by `claude-opus-5` and verified by `claude-opus-5`**, and
integrated by a third hand that did neither. **`review: same-model` IS NOT
A WEAKER VERDICT HERE, and T-104's ruling SEVEN is why**: the independence
that pays is INFORMATIONAL, not model diversity — and this pass is a
worked example, because the verifier read the planner's card at `c4c15c8`
and formed and RAN its attack before opening the executor's notes
(@human's T-121 ruling, arm 2). **The `Co-Authored-By` trailer on this
lane's commits is a harness constant and is NOT evidence of a model** —
T-085 proved it and T-101 sharpened the proof.

**89 done cards — 66 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 66 + 17 + 5 + 1 = 89. T-091 moves `same-model` from 65
to 66.

### **THE VERDICT MECHANISM WAS CORRECT ON THIS LANE, WHICH IS WORTH SAYING**

The last two checkpoints recorded verdicts written by repointing a shared
branch ref with raw `git update-ref` from a detached worktree — three
occurrences across two lanes, routed to `T-128` and `T-104`. **This lane
did it right**: `task/T-091-range-rule-reader@{0}` is an ordinary
`commit:` reflog entry, the verdict was committed IN the lane, the drill
ran in a detached `drill-T-091-verify` **outside** the repository, and the
lane's own worktree was clean when this integrator arrived — nothing
staged, nothing stale. **The counter-example is what makes the rule
checkable**: a ref moved by hand leaves an EMPTY reflog message and a
commit does not.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **17:11:37** BEFORE the merge
and again at **17:24:36** after it and after every suite; the app binary
is pid **89201**, started **2026-08-25 10:54:33**, unchanged throughout,
read with the **anchored** match
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** Had one been owed,
the CHECKOUT test decides — the holder's cwd is
`/Users/ujju/Projects/nputer-app/app`, a DIFFERENT checkout, so it would
have been permitted rather than refused. That is `integrator.md` rule 1
applied rather than CONVENTIONS' DETECT AND REFUSE paragraph quoted;
those two are still different facts and the repair is still item 4 below,
**unwritten after SIX consecutive merges performed it by hand**.

**THIS MERGE DID REBUILD A DEPENDENCY ARTIFACT — `integrator.md` RULE 2's
EXACT CHANNEL — AND THE CHANNEL IS CLOSED BY MEASUREMENT RATHER THAN BY
ASSUMPTION.** `npm run build` from `lib/parser/` was run first on
principle, and `lib/parser/dist` is what the running vite serves through a
symlink. **It cannot reach the app today**: both `@nputer/parser` symlinks
are **RELATIVE** (`../../../lib/parser`), re-read here rather than
inherited, so each resolves inside its OWN checkout, and
`/Users/ujju/Projects/nputer-app` has its own `lib/parser/dist`. **Read
that as a property of the second checkout, not of this merge.**

**NOTHING FROM THIS MERGE COULD REACH THE APP'S CODE, AND HERE THE REASON
IS DOUBLE.** The window serves from `/Users/ujju/Projects/nputer-app`,
detached at `c4cfe52`, an ancestor of this merge — and this diff touches
**no file under `app/` at all**, so neither of the app's two trigger sets
(`app/src-tauri/**` relaunches, `app/src/**` goes to vite HMR) is even
approached. **No relaunch was predicted and none happened**, confirmed by
the unchanged pid and start time above rather than by argument.

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, six new
suggestion files — land in the watched folder live.

**No process from this integration survives.** Scratch port **15297**
(e2e) was `lsof`-read FIRST (zero rows), then bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::`, with a probe this session **wrote
itself** into **its own named scratch directory** rather than trusting one
by name out of the shared scratch root — the standing fix, and the hazard
is not theoretical: **T-091's own verification lost a file to it tonight**,
writing `prescribed.txt` into the shared root and reading back another
lane's path list. It re-derived into per-lane names and its numbers were
unchanged; a pass that had not re-checked would have reported another
lane's diff as its own. The port was free again afterwards. **No `pkill`.
No `npm ci`. No `cargo clean`. No `git update-ref`, no force-push, no
history rewriting.** Be precise rather than claiming more than is true:
this integration's `cargo test` and TWO graph checks all WROTE to main's
`app/src-tauri/target/`, which reads **3.0 GB**, as any cargo run must.
No sibling worktree was entered or modified. **The untracked zero-byte
file `z`** (dated 2026-08-23) still sits in the main checkout — not this
integrator's, not this merge's, not staged, **left alone for the
eighteenth checkpoint running**. No path was staged by wildcard;
`git add -A` was never used, and the write used `git commit -- <paths>`
so it could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN.** FIVE lanes hold fences — **T-104**, **T-108**,
**T-116**, **T-126** and **T-129** — and **`T-108` IS BUILT AT `baba41b`
AND QUEUED FOR INTEGRATION**, which makes it the next thing to land.
**T-116 IS IN VERIFICATION** and was built against a tree without T-033's
merge; its executor disclosed that explicitly, and a re-run against the
merged tree may be owed — **that is its integrator's to schedule, not its
verifier's.**

**T-104's LANE SHOULD KNOW THIS MERGE LANDED FIRST.** T-104 holds
`docs/CONVENTIONS.md` and was told explicitly not to touch the RANGE RULE
bullet, because this reader now asserts roughly thirty figures inside it.
**It can now run the reader against its own edits** — `npm test` from
tools/e2e on its worktree — and it should, since two of its own routed
items (`T-091-s3`, the `bdada11` sharpening) are edits to the same file
the reader parses. The bullet itself is unmoved by this merge.

## Next up

1. **`T-108` IS BUILT AND QUEUED.** Fence is three specific card paths,
   so it collides with nothing. Land it next.
2. **`T-120-s3` IS FINALLY DISPATCHABLE — TENTH CHECKPOINT AT THE TOP OF
   THIS LIST, AND THE FIRST ONE WHERE ITS FENCE IS FREE.** One token of
   code, `[tools/e2e]`, released by this merge, and the reproduction is
   on-demand in any worktree since T-052.
3. **THE TWO CONVENTIONS EDITS THIS MERGE EARNED, BOTH ROUTED TO
   `docs/CONVENTIONS.md` AND BOTH HELD BY T-104.** (a) `T-091-s3`: one
   clause naming GRAPH REGEN's TRIGGER beside the ref its flip figures
   carry — the reader discloses the divergence on every run, and the
   document is what should stop needing it. (b) The `bdada11`
   sharpening: `merge-tree --write-tree` exits 1 and **still prints a
   tree oid on line 1**, so *"EMPTY forecast"* understates the costume.
   **T-104 can take both without widening its fence.**
4. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — SIXTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **now held by
   T-104**, so it shares a seat with item 3 and with the parser-types
   clause below.
5. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` returns zero
   rows. Every integrator does it; no governing file asks for it; and
   T-091's own criterion 12 could not be built because satisfying it
   would have widened the fence into the very failure the card
   documents. Fence is `method/`, **held by T-104**.
6. **`T-127` — THE SURVIVING CYCLE.** `planned`, `blocked_by: [T-033]`
   cleared. Fence `[crate-index, docs/architecture/components/]`;
   **`crate-index` is held by T-129**.
7. **`T-125` IS FENCE-FREE-ISH AND `T-126` IS BUILDING.** T-125
   (`[app-agent, app-shell, docs/architecture/components/]`) takes the
   last undeclared row, `C-10 → C-14` — but `app-agent` is now held by
   T-104 and `app-shell` by T-126, so **it is fully blocked again**,
   which is worth knowing before it is dispatched.
8. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live and
   visible: `arch` says `drift_components=3`, TypeScript says 1.
   `arch drift --fail-on any` cannot go green even after T-125. Rides
   `[crate-index]`, **held by T-129**.
9. **`T-128` — SILENT CORRUPTIONS OF SHARED STATE**, `planned`, fence
   `[method/, docs/CONVENTIONS.md]`, **held by T-104**. This checkpoint
   adds a NEGATIVE data point rather than an instance: T-091's verifier
   committed in the lane and left a clean worktree, so the rule is
   followable and the reflog signature distinguishes the two cases.
10. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND**, for **T-104**'s
    owed v0.1.6 method bump. The debt is per-VERSION, so one three-file
    commit discharges T-089's, T-124's, T-052's, T-102's, T-033's and
    this checkpoint's residual together. **The third file is Rust**
    (`METHOD_SNAPSHOT_VERSION` in `kit.rs`) — and T-104's fence includes
    `app-agent`, so **T-104 is the first lane in six that CAN pay it.**
11. **THE BOARD-TRUTH RULING** — TENTH ask. Two lanes (T-108, T-116) read
    `planned` on main while holding worktrees, one of them in
    verification. It wants a ruling, not an eleventh observation.
12. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **held by
    T-104**.
13. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **held by T-104**.
14. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN.** The body exists,
    ready to paste, measured green then red twice by two independent
    passes. It needs `app/test/**`, which is C-05 `app-shell` — **held by
    T-126 as of this hour.** Read it beside **`T-110-s9`**.
15. **THE SUGGESTION BACKLOG IS EIGHTY-ONE AND WANTS AN ELEVENTH
    TRIAGE.** T-033 added eleven and T-091 six; `T-033-s1`…`s11` and
    `T-091-s1`…`s6` should be triaged together, since both sets contain
    fence findings about the same joint.
16. **THE GRAPH IS AT 92.52% OF ITS CEILING** with **74 783 bytes** of
    headroom, unmoved by this merge, and **nothing reports that number**.
    ARCHITECTURE's C-07 row carries it WITH ITS REF, but it is still a
    transcription and will go stale at the next regen.
17. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint.**
18. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
19. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
