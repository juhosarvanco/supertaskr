# State

Updated: 2026-08-25 by the T-033 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THE REGISTRY WAS
RE-DRAWN. FINDINGS 15 → 3, A THIRTEENTH COMPONENT EXISTS, AND
`app-shell` IS FREE FOR THE FIRST TIME IN DAYS — 22 OF 38 PLANNED CARDS
WANT IT AND NINE WANT NOTHING ELSE.** Nothing on main is broken: this
merge is **460 / 962 / 268 / 146 green**. But **the app suite cannot even
BUILD on a merged main until you rebuild lib/parser** (next section —
this cost one wrong diagnosis already tonight), **three known
intermittents will meet you before any real defect does**, and **the
verdict you may have been briefed against is not the branch tip**. Read
the next five sections before you debug anything, and derive the lane
list before you cut anything.

## THE NEW ONE — A MERGED MAIN CAN FAIL `npm run build` AND IT IS NOT A DEFECT

**THIS COST A WRONG DIAGNOSIS WITHIN MINUTES OF THE MERGE, AND THE
MECHANISM IS WORTH MORE THAN THE CORRECTION.** Immediately after T-033
landed, a second session ran `npm test` from `app/` and saw **nine
failures** across `architecture-derive`, `architecture-dogfood` and
`map-*`. It was reported as the ordinary pre-checkpoint state of a merge
that declares a new component — *"your checkpoint owes the fixture
reconciliation"*. **That diagnosis was wrong**, and the real cause is
one every future integrator will meet:

    $ npm run build          # from app/
    src/lib/architecture/derive.ts(530,36): error TS2339:
      Property 'nonCode' does not exist on type 'ComponentRecord'.
    exit 2

**`lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT.** T-033
adds `nonCode` to `lib/parser/src/types.ts`; the app resolves
`@nputer/parser` through a symlink to `lib/parser`, so it was compiling
against the PRE-merge types. `vitest` transpiles without typechecking, so
the suite still RUNS — and `nonCode` is simply `undefined` at runtime,
the D3 downgrade never happens, and the dogfood fixtures red in a way
that looks exactly like an un-reconciled fixture. **One command clears
it**: `npm run build` from `lib/parser/`. Then the app builds at exit 0
and the suite is **962/962**.

**THE RULE ALREADY EXISTED AND THIS IS THE CASE IT IS NOT READ AS
COVERING.** CONVENTIONS' fresh-clone ORDER says lib/parser FIRST, then
app. It is filed under *fresh clone*, so a fully-installed main checkout
reads as exempt — and it is not. **The trigger is not a fresh tree, it is
a merge that changes the parser's TYPES**, which is a thing only the
diff can tell you. **THE HONEST RESIDUAL: the real fixture
reconciliation was ALSO owed here, and it is exactly ONE assertion** —
see the deferred-assertion section below. Two different causes producing
overlapping symptoms in the same files is precisely why the nine reds
were misread as the one.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the NINTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded float
it captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND THREE PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** It did NOT fire at this merge — 146/146
first time, ONE run, nothing to declare — because main is not a fresh
checkout. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you do
run twice, DECLARE BOTH RUNS. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. T-052's lane removed this
finding's own "needs a fresh checkout to prove" prerequisite by
reproducing the red ON DEMAND in a healed worktree, so whoever takes the
fix can verify it anywhere.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS SEVEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
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
here (up from 2.9 one checkpoint ago — this merge's cargo run, two graph
regens, three graph checks, the arch report and the boot gate all wrote
into it), and this merge's `cargo test` ran the lib suite in **4.06s**,
with the watcher body read by NAME as `ok` rather than inferred from a
green exit. **Fourteen runs across six integrations and not one lands
between 9.5s and 14.6s.** Read the lib suite's own time first; it tells
you which regime you are in before any assertion does.

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
intervention addresses.* Pooled clean-cache evidence is **1 red in 19**.
**Live, load-sensitive, ~1-in-19 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge (read by NAME,
`ok`), which is one more data point and not a reprieve. Read it beside
**`T-102-s3`**, which added a data point from a FRESH worktree with a
SMALL `CARGO_TARGET_DIR` — the configuration the slow-checkout
hypothesis calls green. Two findings, one body.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE TWELFTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`) | board says |
|---|---|---|
| **T-091** | `[tools/e2e]` | building — **APPROVED at `1e134b1`, awaiting an integrator** |
| **T-108** | `[docs/tasks/T-027-…, T-025-…, T-081-…]` — THREE CARDS | **planned on main** |
| **T-116** | `[app-map]` | **planned on main** — in VERIFICATION |
| **T-129** | `[crate-index]` | building |

**T-033's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so four lanes hold
fences after it. **THE BOARD-TRUTH WINDOW IS OPEN IN BOTH DIRECTIONS
RIGHT NOW, WHICH IS THE WIDEST IT HAS BEEN OBSERVED**: T-116 and T-108
read `planned` on main while holding worktrees, and T-116 is actually in
VERIFICATION. **DERIVE THE LANE LIST FROM `git worktree list`; NEVER READ
IT OFF A BRIEF OR OFF THIS TABLE** — three consecutive dispatch briefs
have now stated a lane list and every one was wrong.

**THREE DETACHED NON-LANE ENTRIES EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** Derive the membership; do not quote it.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **`c4cfe52` is an ANCESTOR
  of main** (exit **0**) and main is now **77 commits ahead of it**,
  which is the accurate reason nothing merged here reaches that window —
  *not* a trigger that failed to fire.
- **`drill-T-102-verify`** — still on disk, **outliving its verification
  for the second checkpoint running**. Not the integrator's to remove.
- **`/Users/ujju/Projects/nputer-T-116-verify`, DETACHED at `e7c020b`** —
  **and it is the trap this section keeps warning about, in its sharpest
  form yet.** It is named `nputer-T-NNN` exactly like a lane and sits at
  the same sibling path a lane would; only the DETACHED head distinguishes
  it. A lane list derived by matching the DIRECTORY NAME would count five
  lanes and hand a verifier's scratch tree a fence. **Filter on the
  branch, never on the path.**

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** **`app-shell`,
`app-map`, `lib-parser` AND `docs/architecture/components/` ARE ALL
RELEASED BY THIS CHECKPOINT** — that is four slugs at once, the largest
release this board has had. Free too: `app-agent`, `app-board`,
`app-dispatch`, `app-interview`, `docs/CONVENTIONS.md`, `method/`,
`.github/`. **`crate-index` is held by `T-129`** and `tools/e2e` by
`T-091`.

## Just completed

**T-033 — the zero-drift registry pass.** F-06, milestone 4, size M,
`touches: [docs/architecture/components/, lib-parser, app-map,
app-shell]`, **fence never widened**. Main-before **`1ed6ae9`**, lane tip
**`642577e`**, merge **`8f8ec31`**, this checkpoint after it.
`builder: claude-opus-5`,
`built_by: claude-opus-5 @T-033 — code commits 344a0d5, 1baed94,
784dad9`, `verifier: claude-opus-5`,
`verified_by: claude-opus-5 @T-033-verify — APPROVED, 2026-08-25 —
verdict commits c259f87 and 642577e`, `review: same-model`.

**WHAT LANDED — THE MAP FINALLY TELLS THE TRUTH ABOUT ITSELF.** F-06's
premise is *drift as a first-class signal*, and this repository's own map
had carried **fifteen findings** — twelve of them undeclared edges the
registry simply never wrote down — long enough that the amber had become
scenery. It is now **three**, and all three are honest: ONE undeclared
row and TWO informational D3s.

| | before (`ad5a0df`) | after (this checkpoint) |
|---|---|---|
| findings | 15 | **3** |
| undeclared / unmapped | 12 / 1 | **1 / 0** |
| relation rows, tally | 35 · 14/12/9 | **36 · 26/1/9** |
| components | 12 | **13** |
| indexed files, mapped | 178 | 178 / **178** |

The surviving undeclared row is **`C-10 → C-14`, observed=1**, named to
**T-125** as required. Three mechanisms did it, each reusable:

1. **A THIRTEENTH COMPONENT, C-16 Shared primitives**, extracted out of
   C-05: the shadcn `ui/` set, `cn`, and the verdict classifier. **A leaf
   by construction and DERIVED rather than aspirational** — `utils.ts`
   imports only `clsx`/`tailwind-merge` and `verdicts.ts` imports
   NOTHING — which is exactly what lets the twelve real edges be declared
   without writing a cycle.
2. **A `non_code:` field**, additive and opt-in, downgrading D3 to
   informational for the two components that are conventions rather than
   code (C-01, C-11) instead of leaving an amber nobody could ever clear.
3. **ADR-015 RULED rather than tolerated** — the crate owns the
   reality-side join, TypeScript owns intent ⨝ tasks. The registry and
   the ADR had been two incompatible sentences since T-014.

### **THE TWO RULINGS THE VERDICT MADE, AND THEY ARE THE SUBSTANCE**

**1. THE MID-FLIGHT REBASE WAS LEGITIMATE, AND THE PRECEDENT IS NARROW.**
`integrator.md` step 1's "never rebase" sits in the INTEGRATOR's merge
instruction; `lane-protocol.md` contains no such prohibition, and the
stated harm is singular — *"the tip the verifier approved is no longer in
the history"* — which cannot apply where **no verdict existed yet**. The
justification is material and measured: main advanced **89 paths** under
this lane and **3 intersect the lane's own 35**, two of them the very
fixture files this card's deliverable consists of. Replay proved three
ways: `range-diff` gives `= = !`, the two 789-line patches differ in
exactly 3 lines all base-side, and the two diffs are set-identical over
89 paths. **PRECEDENT, RECORDED NARROWLY: a lane may re-base itself
BEFORE any verdict exists, onto a known-green non-merge commit, with the
old tip preserved and the replay proved. AFTER a verdict the prohibition
binds absolutely.**

**2. EXTENDING THE EXTRACTION TO `verdicts.ts` WAS CORRECT AND FORCED.**
The architect's ruling named two paths and said "and no others" — but
both surviving drift rows sit on `verdicts.ts` alone, so **the ruling's
path list and its own enumeration are measurably inconsistent**: as
written it is unbuildable. Declaring the edges writes two cycles; leaving
them misses criterion 1. The resolution is *determined* rather than
chosen — `verdicts.ts` imports nothing, has exactly 3 consumers, and
T-017's own header says it was split out *"to keep the dependency graph
acyclic."* **ADR-004 protects the architect's pen, not the architect's
arithmetic.** Costed reversal is recorded in `T-033-s6`.

### **THE DEFERRED ASSERTION WAS EXACTLY ONE, AND IT WAS ASKED RATHER THAN PREDICTED**

The lane left `["C-05","C-12","confirmed", 32]` in
`architecture-dogfood.test.ts` with a comment addressed to the
integrator, because that file tracks the COMMITTED graph and the lane
deliberately commits no regenerated one. At the checkpoint regen the app
suite came back **961/962 with that single row red** — `expected 32,
received 33` — and **962/962** once moved. `map-dogfood-render.test.tsx`
did not move; the parser pin held at 268/268. **The lane's forecast was
exact, and it is the shape to copy**: a fixture whose value the
integrator must move is left AT its committed value with the move named
in a comment, not loosened and not guessed.

### **THE REGEN HAD TO RUN TWICE, AND THE SECOND STALE HAD NO NUMBER THAT COULD SHOW IT**

**THIS IS THE MOST REUSABLE THING IN THIS CHECKPOINT.** CONVENTIONS says
regen at the CHECKPOINT because the checkpoint edits INDEXED fixture
files. This merge is the worked example, and it is sharper than T-050's:
after the first regen `index --check` was **exit 0, CURRENT at 925 217
bytes**. Reconciling the one deferred assertion moved
`architecture-dogfood.test.ts` from `loc 1754` to `1755`, and
`index --check` went **STALE again with EVERY HEADLINE COUNT
IDENTICAL** —

    committed:   925217 bytes · 178 files · 1968 symbols · 1886 edges
    fresh index: 925217 bytes · 178 files · 1968 symbols · 1886 edges
    files  +0  -0  ~1
    | ~ app/test/architecture-dogfood.test.ts  (content, loc 1754 -> 1755)

**A checkpoint that regenerates once and confirms by comparing byte
counts would ship a stale graph and have no figure capable of telling
it.** Only the `~` file line differs. **ASK THE GATE AFTER THE LAST
WRITE, not after the first.** Second regen → exit **0, CURRENT**.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 1ed6ae9 642577e -> tree f6ba7731…, exit 0 (read from $? FIRST)
    git diff --name-only 1ed6ae9 <TREE>                        ->  36   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 1ed6ae9..8f8ec31  (THE MERGE'S DIFF)  ->  36   the only one that means anything
    git diff --name-only 1ed6ae9...642577e (branch-only, THREE) ->  36
    git diff --name-only ad5a0df..1ed6ae9  (main's advance)    ->  34
    git diff --name-only 1ed6ae9..642577e  (TWO dots, FORBIDDEN)   ->  70

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 34 PATHS — 1.94x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **34** under this lane, the
branch **36**, `comm -12` over the sorted lists is **EMPTY**, the union
of the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 34 + 36 = 70 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**, T-102 **3.75x**, T-033 **1.94x**. The ratio is weather;
**the left endpoint is the signal.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`f6ba77317e59544bb9e36c02f70d1aa5af1e75d4` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`1ed6ae9` and `642577e` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE DISPATCH BRIEF FOR THIS MERGE NAMED THE WRONG TIP, AND SAYING SO
IS THE POINT.** It named `c259f87` as the verdict commit; the branch was
at **`642577e`**, a SECOND verdict pass. The architect sent the
correction unprompted, and this integrator had already derived it
independently from `git rev-parse` before the message arrived. Merging
the brief's sha would have discarded a verifier's own correction. The
brief's range figures were the verifier's, taken at `48ed848`: lane paths
**36** and intersection **0** reproduce exactly here; main's advance was
**24** there and is **34** here, and that difference is main's own
advance and nothing else. **A COUNT COPIED OUT OF AN EARLIER PASS IS A
COUNT ABOUT A DIFFERENT TREE.**

## THREE standing gates — ALL THREE FIRE, DERIVED from the merge's own 36 paths

| gate | trigger | on these 36 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **12 — FIRES** | exit **1, STALE** → regen ×2 → **0, CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **4 — FIRES** | exit **0** |
| DOCS GATE | a `docs/` path a code suite reads | **24 — FIRES** | exit **1**, **ALL FOUR** suites owed, all green |

- **GRAPH REGEN — a REAL stale, read off the SECOND line** as this
  project's own trap requires: it printed both counts and a `~` file diff
  rather than `committed: MISSING`. Committed **923 899 bytes · 178 files
  · 1967 symbols · 1881 edges** → **925 217 · 178 · 1968 · 1886**:
  **+1 318 bytes, +1 symbol, +5 edges, files `+0 −0 ~12`**. The five new
  edges are the extraction working in both directions —
  `map-visuals.ts → derive.ts` gains `isDriftFinding`, and the predicate
  T-033 moved into the engine resolves at three new call sites.
  Regenerated and committed **with this checkpoint, not the merge**, and
  **TWICE** — see the section above, which is the reusable half.
- **DOCS GATE — exit 1, and this is the first merge in a long while to
  owe ALL FOUR suites**: `cargo test from app/src-tauri/`, `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **The cargo suite is owed and it is DERIVED, not assumed** — this diff
  carries eleven `docs/architecture/components/` files, which
  `app/src-tauri/crates/nputer-index/tests/arch.rs` reads. Invoked
  DIRECTLY from the repo root with the RANGE RULE's own path list,
  **never through `xargs`**. **0 frontmatter issues**, and
  `npm run lint:docs` (the whole-tree half, CI's step) is exit **0**.
- **BOOT GATE — exit 0**, `NPUTER_BOOT_PORT=15296 npm run boot:check`
  from tools/e2e, both `[nputer]` lines observed: `[nputer] project
  folder: /Users/ujju/Projects/nputer` and `[nputer] window "main"
  created`. Port free before and after.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command — **and the COUNT was read as well as the exit**,
because an exit alone cannot tell a green suite from a suite that did not
run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.06s**. **Unchanged from
  main's 460**, which is the honest reading: this merge contains **zero
  `.rs` files**, so no Rust body moved.
- **parser: 268/268 across 12 files, exit 0** — **after `npm run build`
  from lib/parser/**, which this merge REQUIRES (top of this file).
- **app: `npm run build` exit 0** — **exit 2 until the parser was
  rebuilt** — · **`npm test` 962/962 across 46 files, exit 0**, and
  **961/962 in between**, which was the one deferred assertion and is
  declared rather than hidden.
- **E2E: 146/146, exit 0**, on scratch port **15295**, **ONE run** — there
  was no second run to declare.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**, and
  **`npm run lint:tokens` exit 0** at **TOKEN 132 / CONTROL 712**.
  **CONTROL is 712 here against 699 at T-102's checkpoint** — the corpus
  is `git ls-files`, so it grows with every tracked file main gains, and
  this merge's twelve new markdown files account for it. **Derive it at
  your own ref; it is not a constant.**
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`.
- **THE SUITES THE CHECKPOINT ITSELF OWES RAN AGAIN AFTER ITS DOC WRITES**
  (T-081-s9), which is how the second graph stale was found at all.

## The board, derived from disk at this checkpoint

**244 flat task files — 88 done / 38 planned / 41 parked / 75 suggested /
0 verifying / 2 building; 26 in `rejected/`.**
88 + 38 + 41 + 75 + 0 + 2 = 244. T-033's stamp moves done from 87 to 88
and verifying from 1 to 0.

**THE SUGGESTION BACKLOG IS SEVENTY-FIVE AND THE LAST TRIAGE WAS THE
TENTH.** This merge added **ELEVEN** — `T-033-s1` … `T-033-s11`, the
largest single contribution any card has made to it. **THEY ARE NOT
TRIAGED HERE:** disposition belongs to a triage pass, not to an
integrator (T-083's ruling), so all eleven stay `status: suggested`
exactly as filed. **`T-033-s11` is the one to read first** — the Rust
reader was never taught `non_code` (zero hits under
`crates/nputer-index/`), so the two engines classify the same live D3
differently and `arch drift --fail-on any` can never go green even after
T-125 clears the last undeclared row. **It is live and visible right
now**: `arch` reports `drift_components=3` where TypeScript's own fixture
reads `["C-10"]`, i.e. 1.

**`T-033-s4` IS THE FENCE ONE.** `docs/decisions/015-…md` sits in no
component's `paths:`, no `touch_slugs:` and no card's `touches:` — yet
criterion 5 and the architect's ruling both REQUIRE the edit. The lane
made it on the card's own authority and disclosed it plainly; the
verifier named it as the one path outside the fence and approved anyway.
**A criterion that mandates an edit no fence contains is a dispatch
defect, not an executor's licence.**

## Documents ticked

- **ROADMAP — ticked twice.** F-06's own bullet gains the registry
  paragraph (15 → 3 findings, the three mechanisms, and the honest
  residual of one surviving cycle), and milestone 4's inherited-backlog
  section records that F-06's zero-drift gate landed — **with the
  `blocked_by:` / FENCE distinction spelled out**, because it is the
  thing most likely to be misread: T-125, T-126 and T-111 carry
  `blocked_by: []` or `[T-110]` and were held only by the SLUG.
  **T-127 is the one card with a literal `blocked_by: [T-033]`.**
- **ARCHITECTURE — the derived slug block now knows C-16 exists**
  (`app-shell -> C-05, C-10, C-11, C-16`). This was correction 4 of the
  verdict's four: out of fence for the lane, **correctly untouched by
  it**, and the checkpoint's by written rule since the block says of
  itself *"read the field, never this prose"*. **No gate in this
  repository reads that block** — nothing mechanical caught it and
  nothing could, which is `T-089-s7`'s argument for computing it.
  C-07's row also gets its byte figure re-stamped at this ref
  (**925 217 bytes, 92.52%, 74 783 bytes of headroom**), continuing
  T-101's correct-in-place precedent. **The components table was NOT
  touched and that was CHECKED rather than assumed** — its rows stop at
  C-07, so no row's status moved and C-16 gets no row.
- **NO NEW ADR, and that is derived rather than skipped.** ADR-015 was
  amended BY THE MERGE (decision (3), arm (a)), which is the one
  non-obvious decision here, and it is recorded in the ADR itself, in
  C-07's component file and on the card. Nothing supersedes ADR-001–017.
- **CONVENTIONS — NOT TOUCHED**, by the merge or by this checkpoint.
  **Arguably it should be**: the fresh-clone ORDER's parser-before-app
  rule is filed under *fresh clone* and this merge proves it binds a
  fully-installed checkout too. That is a `docs/CONVENTIONS.md` edit and
  the fence is free — see "Next up".
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section. **The lane's notes and BOTH verdict passes
  are preserved byte-untouched.**

## Provenance — SELF-DECLARED, never read off a trailer

T-033 is **built by `claude-opus-5` and verified by `claude-opus-5`**, and
integrated by a third hand that did neither. **`review: same-model` IS NOT
A WEAKER VERDICT HERE, and T-104's ruling SEVEN is why**: the independence
that pays is INFORMATIONAL, not model diversity. **The `Co-Authored-By`
trailer on this lane's commits is a harness constant and is NOT evidence
of a model** — T-085 proved it and T-101 sharpened the proof.

**88 done cards — 65 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 65 + 17 + 5 + 1 = 88. T-033 moves `same-model` from 64
to 65.

### **THE VERDICT'S MECHANISM WAS WRONG TWICE ON THIS ONE LANE**

**Both verdict commits were written by repointing the shared branch ref
with raw `git update-ref` from a detached worktree instead of committing
inside the lane** — and the second landed AFTER the dispatching pass had
already repaired the damage from the first. **THE PROOF IS THE REFLOG AND
IT IS UNAMBIGUOUS**: `task/T-033-zero-drift-registry@{0}` and `@{1}`
carry **EMPTY reflog messages**, while `@{2}` and every entry below read
`commit:`. That is the signature — a ref moved by hand leaves no reflog
message; a commit does.

**THE DAMAGE IS BOUNDED AND WAS RE-VERIFIED HERE RATHER THAN TAKEN ON
REPORT.** `935693f` and `c259f87` are both ancestors of `642577e` (exit
0), so nothing was lost. But when this integrator arrived the lane
worktree reported **a staged deletion of 114 lines from the card** —
**staleness, not dirt**, and proved so rather than assumed: the working
file's sha256 `976040fc…` is byte-identical to `c259f87`'s blob while
HEAD had advanced to `642577e`. **One `git add -A` in that worktree would
have committed a revert of the verifier's own second pass.**

**THE RULE IT EARNS: a verifier commits its verdict IN the lane's
worktree, or in its own checkout of that branch — never by repointing a
shared ref from elsewhere**, because the ref is shared state and every
other holder's index silently goes stale. **This is now the THIRD
occurrence in one session** (T-102's verifier did it once, T-033's
twice), which is what makes it a role-definition gap rather than an agent
error. Routed to **`T-128`** and **`T-104`**. **The verification was NOT
re-run**: its substance was checked and is sound; the mechanism was
wrong, not the finding.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **16:31:34** BEFORE the merge
and again at **16:55:26** after it and after the boot gate; the app
binary is pid **89201**, started **2026-08-25 10:54:33**, unchanged
throughout, read with the **anchored** match
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** Had one been owed,
the CHECKOUT test decides — `lsof -p 88948` puts the holder's cwd at
`/Users/ujju/Projects/nputer-app/app`, a DIFFERENT checkout, so it would
have been permitted rather than refused. That is `integrator.md` rule 1
applied rather than CONVENTIONS' DETECT AND REFUSE paragraph quoted;
those two are still different facts and the repair is still item 3 below,
**unwritten after FIVE consecutive merges performed it by hand**.

**THIS MERGE DID REBUILD A DEPENDENCY ARTIFACT, WHICH IS
`integrator.md` RULE 2's EXACT CHANNEL — AND THE CHANNEL IS CLOSED BY
MEASUREMENT RATHER THAN BY ASSUMPTION.** `npm run build` from
`lib/parser/` was REQUIRED here (top of this file), and
`lib/parser/dist` is what the running vite serves through a symlink —
this is the channel that moved the board's model badges under the human
at instance 5, with no file under `app/` in the diff. **It cannot reach
the app today**: both `@nputer/parser` symlinks are **RELATIVE**
(`../../../lib/parser`), so each resolves inside its OWN checkout, and
`/Users/ujju/Projects/nputer-app` has its own `lib/parser/dist` dated
10:44. **Read that as a property of the second checkout, not of this
merge** — on the old single-checkout setup this merge WOULD have changed
what the human was being served.

**NOTHING FROM THIS MERGE REACHED THE APP'S CODE, AND THE REASON IS
STRUCTURAL.** The window serves from `/Users/ujju/Projects/nputer-app`,
detached at `c4cfe52`, an **ancestor** of this merge — re-verified at
exit **0**, main now **77 commits** ahead. **This matters at this merge
specifically**, because the diff touches `app/src/**`, which on the
ordinary single-checkout setup is the vite-HMR trigger set.

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, eleven
new suggestion files, **and a thirteenth component appearing on the
architecture map** — land in the watched folder live.

**No process from this integration survives.** Scratch ports **15295**
(e2e) and **15296** (boot gate) were each `lsof`-read FIRST (zero rows),
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::`, with
a probe this session **wrote itself** into **its own named scratch
directory** rather than trusting one by name out of the shared scratch
root — which is the standing fix T-033's own verifier wrote after a
cross-session collision handed another pass a different lane's path list.
Both ports were free again afterwards. **No `pkill`. No `npm ci`. No
`cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test`, three graph checks, TWO regens, the arch
report and the boot check all WROTE to main's `app/src-tauri/target/`,
which reads **3.0 GB**, as any cargo run must. No sibling worktree was
entered or modified — T-116's branch was read through `git show` from the
object store rather than by entering its tree. **The untracked zero-byte
file `z`** still sits in the main checkout — not this integrator's, not
this merge's, not staged, **left alone for the seventeenth checkpoint
running**. No path was staged by wildcard; `git add -A` was never used.

**A CONCURRENT WRITER WAS CAUGHT BY THE PRE-WRITE CHECK, AND THE CHECK IS
WHY THE MERGE WAS SAFE.** At the moment of the merge `git diff
--name-only` returned `docs/STATE.md` — a REAL uncommitted amendment by
T-102's integrator, still working after its checkpoint had landed
(compared against the NAMED commit `1ed6ae9`, never against `HEAD`, which
is `T-128`'s own lesson from one checkpoint earlier). **STATE.md is not
among this merge's 36 paths**, so the merge could not touch it and did
not. The checkpoint waited. **`??` lines alone are not a ceremony** and
there was exactly one (`z`).

## In progress / broken right now

**NOTHING IS BROKEN.** Four lanes hold fences — **T-091**, **T-108**,
**T-116** and **T-129** — and **`T-091` IS APPROVED AT `1e134b1` AND
WAITING FOR AN INTEGRATOR**, which makes it the next thing to land.
**T-116 IS IN VERIFICATION AND WAS BUILT AGAINST A TREE WITHOUT THIS
MERGE** (`e7c020b`); its executor disclosed that explicitly, and a re-run
against the merged tree may be owed — **that is its integrator's to
schedule, not its verifier's.**

**T-116's OWN FENCE ANALYSIS OF THIS MERGE WAS VERIFIED HERE AND IT
HOLDS EXACTLY.** It predicted that T-033's landing would NOT move the
clause governing it, and at the merged tree that is true: C-05 still
claims `app/test/**`, C-16's `touch_slugs:` is `[app-shell]`, and C-12
keeps both globs and `[app-map]`. **`T-116-s1` is now WRITABLE** — the
two spellings of churn age (`map-visuals.ts`'s `churnAge` says `last 0m
ago` where the footer says `measured just now`) were out of reach only
because T-033 held both files.

## Next up

1. **`T-091` IS APPROVED AND UNINTEGRATED.** It is the only card in that
   state and it holds `[tools/e2e]`, which is also the fence
   `T-120-s3` needs. Land it before dispatching into that tree.
2. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. NINTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, **held by T-091** — so it waits, or it
   rides that lane.
3. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — FIFTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **free**.
   **AND IT NOW SHARES A SEAT WITH A SECOND CONVENTIONS EDIT THIS MERGE
   EARNED**: the fresh-clone ORDER binds a fully-installed checkout
   whenever a merge changes the parser's TYPES, and nothing says so.
4. **`T-127` — THE SURVIVING CYCLE AND THE FENCE WORD.** `planned`,
   `blocked_by: [T-033]`, **which this merge clears** — it is the only
   card with a literal dependency on T-033. Fence `[crate-index,
   docs/architecture/components/]`; **`crate-index` is held by T-129**.
   Its criterion is written over the CENSUS rather than one cycle by
   name, which is the tenth triage's correction and worth reading before
   writing any similar criterion.
5. **`T-125` AND `T-126` ARE NOW FENCE-FREE.** T-125 (`[app-agent,
   app-shell, docs/architecture/components/]`) takes the last undeclared
   row, `C-10 → C-14`. T-126 (`[app-shell]`) is `T-110-s1` — the lane
   reader is built and not wired, `lib.rs` declares no `pub mod
   dispatch;`. **Both were held by T-033 alone and both are free now.**
6. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live and
   visible today: `arch` says `drift_components=3`, TypeScript says 1.
   `arch drift --fail-on any` cannot go green even after T-125. It
   belongs with T-059's neighbourhood and rides `[crate-index]`.
7. **`T-128` — FOUR SILENT CORRUPTIONS OF SHARED STATE**, `planned`,
   fence `[method/, docs/CONVENTIONS.md]`. **This checkpoint is its sixth
   and seventh instances**: the `git update-ref` re-staling, twice on one
   lane, with the reflog signature now written down. Read it with
   **`T-104`**, where the method half lands. **Items 3 and 7 share a
   fence**, so one lane can take both.
8. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND**, for **T-104**'s
   owed v0.1.6 method bump. The debt is per-VERSION, not per-change, so
   one three-file commit discharges T-089's, T-124's, T-052's, T-102's
   and this checkpoint's residual together. **The third file is Rust**
   (`METHOD_SNAPSHOT_VERSION` in `kit.rs`) — a `[method/,
   docs/CONVENTIONS.md]` fence CANNOT carry the bump.
9. **THE BOARD-TRUTH RULING** — NINTH ask, and this checkpoint observes
   the window in its widest form yet: **two lanes reading `planned` on
   main while holding worktrees**, one of them actually in verification.
   Three dispositions, none free. It wants a ruling, not a tenth
   observation.
10. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-19.** Two findings, one body — read them together. Fence
    `[app-agent]`, **free**.
11. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **free**. Read it beside
    `T-102-s1` and `T-102-s2`.
12. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN.** The body exists,
    ready to paste, measured green then red twice by two independent
    passes. It needed `app/test/**`, which is C-05 `app-shell` — **held
    by T-033 until this checkpoint, and free now.** Read it beside
    **`T-110-s9`**.
13. **THE SUGGESTION BACKLOG IS SEVENTY-FIVE AND WANTS AN ELEVENTH
    TRIAGE.** This merge added **ELEVEN**, the largest single
    contribution any card has made. `T-033-s1`…`s11` should be triaged
    together — several are about the same joint (`s4` the fence, `s6` the
    ruling's arithmetic, `s7` the fence word, `s10` the cycle).
14. **THE GRAPH IS AT 92.52% OF ITS CEILING** with **74 783 bytes** of
    headroom — it went UP again — and **nothing reports that number**.
    ARCHITECTURE's C-07 row carries it WITH ITS REF, but it is still a
    transcription and will go stale at the next regen.
15. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — a fact this checkpoint's own ARCHITECTURE edit makes
    one component worse, since `app-shell` now expands to FOUR.
16. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
17. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
