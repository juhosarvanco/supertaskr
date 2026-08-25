# State

Updated: 2026-08-25 by the T-104 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN.**
This merge is **460 / 972 / 268 / 171 green**, and it is the largest
`method/` change this project has landed — **the nine ratified rulings
now live in the file that ratifies them, and the method snapshot moves
v0.1.5 → v0.1.6**. Three things will meet you before any real defect
does: **the app suite cannot even BUILD on a merged main until you
rebuild lib/parser**, **three known intermittents**, and **a stale graph
whose every headline figure was identical on both sides** — this merge is
now the project's cleanest worked example of that last one, and it is
written up below with the sha256 that proves it. **Derive the lane list
before you cut anything**, and read the next five sections before you
debug anything.

**WHAT IS NEWLY FREE**: `method/`, `docs/CONVENTIONS.md` and `app-agent`.
**`T-131` IS UNBLOCKED** — its only `blocked_by:` entry is `T-104`, which
now reads `status: done`, and it is the card asking @human to rule on
five process changes. **The FIELD still reads `blocked_by: [T-104]` and
was deliberately not edited**: this tree keeps `blocked_by:` as a
historical record, never emptying it — T-127 still names T-033, T-111
still names T-110, T-015 still names T-012, and all three blockers are
`done`. **A card is unblocked when its blockers read `done`, not when
somebody deletes the line**, and T-131 is outside this card's fence
besides.

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
merge's parser diff is EMPTY — its only code file is
`app/src-tauri/src/agent/kit.rs` — so the trap did not fire here; the
build was run first anyway, in that order, and both exits were 0. **Do
not read a green build as evidence the trap is gone.**

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
`[tools/e2e]` as this is written, after leading "Next up" for seven
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

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND SIX PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** On the night of 2026-08-25 it fired
for **T-086, T-102, T-108, T-116 and T-104's own lane** — T-104's at
`1787668190199.766` against `…200`, in a minutes-old forecast worktree.
**It did NOT fire at this merge**: the body passed in the single 171-test
run, and main is not a fresh checkout. **DO NOT "FIX" IT BY RE-RUNNING
UNTIL GREEN**, and if you do run twice, DECLARE BOTH RUNS. The fix is one
token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. **AND THE FRESH-CHECKOUT
PREREQUISITE IS GONE**: T-052's lane reproduced the red ON DEMAND in a
healed worktree by planting a fractional mtime, so `T-130`'s executor can
drive it red in its own worktree without cutting a fresh checkout.

**`T-079-s3` IS NOT CLEARED AND MUST NOT BE READ AS CLEARED.** Only its
item 1 folded into `T-130`; **items 2–3 are `docs/CONVENTIONS.md` edits**
that were routed to `T-104`, **which DECLINED them correctly and is now
merged**. They are re-routed by this checkpoint — see "Next up" item 3.

**CITE THE BODY BY NAME, NOT BY A LINE** — the plant-and-restore lives
inside `tools/e2e/tests/token-scan.spec.ts`'s test **"P6 reds a planted
bare motion utility and leaves its motion-safe twin alone"**, and the
mtime assertion the failure quotes is some forty lines further down
inside it. T-108's merge is the worked example of why this checkpoint
carries no digit: it shipped a line number that was **correct when
written and false thirty-one minutes later**.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS ELEVEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
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
here (unmoved at this precision across four checkpoints, though this
integration's cargo run, the boot gate's build, the regen and TWO
`index --check` runs all wrote into it), and this merge's `cargo test`
ran the lib suite in **4.23s**, with the watcher body read by NAME as
`ok` rather than inferred from a green exit. **EIGHTEEN runs across ten
integrations and not one lands between 9.5s and 14.6s.** Read the lib
suite's own time first; it tells you which regime you are in before any
assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository, and there are THREE of them right now: `lsof`
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
**`T-102-s3`**. **Its fence `[app-agent]` is FREE for the first time in
this card's life** — T-104 held it and no longer does.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE SIXTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-126** | `[app-shell]` | **building** |
| **T-129** | `[crate-index]` | **building** |
| **T-130** | `[tools/e2e]` | **building** |

**T-104's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so THREE lanes hold
fences after it, down from four. **THE BOARD-TRUTH WINDOW IS STILL
CLOSED**: every live lane reads `building` on the board and holds a
worktree on its own branch, and no card reads `planned` while holding
one. That is a state, not an achievement — it re-opens at the next
dispatch.

**THE DETACHED-ENTRY RATIO IS 1:3 AND THAT IS THE THIRD DIFFERENT ANSWER
IN NINETY MINUTES.** At 19:10 `git worktree list` returned FOURTEEN
entries with EIGHT detached non-lanes against five lanes; at 19:30,
SEVEN entries with ONE; at **19:48** this integrator read **SIX** rows —
main, four lanes and **ONE** detached non-lane — and after removing
T-104's it is five rows and three lanes. **The row count has moved by
more than half twice while the lane count moved by one each time.** As
T-108's checkpoint put it: *the instruction was right; the ratio is
weather.* **Derive the membership by FILTERING ON THE BRANCH; do not
quote this paragraph.**

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT MOVED SINCE THE LAST
  CHECKPOINT**: it read `c4cfe52` there and reads **`212543c`** here —
  main-before-this-merge — so it is now exactly one merge and one
  checkpoint behind, and updating it is @human's one command to run when
  they choose, not this integrator's.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: `method/`,
`docs/CONVENTIONS.md`, `app-agent`, `app-map`, `app-board`,
`app-dispatch`, `app-interview`, `docs/architecture/components/`,
`lib-parser`, `.github/`, and every `docs/tasks/` card path. **HELD:
`app-shell` by T-126**, **`crate-index` by T-129**, **`tools/e2e` by
T-130**.

## Just completed

**T-104 — the NINE ratified rulings land in the file that ratifies them,
and the method snapshot stops lying about what ships.** F-01, milestone
4, size M, `touches: [method/, docs/CONVENTIONS.md, app-agent]`.
Main-before **`212543c`**, lane tip **`7d95f79`** (derived with
`git rev-parse`), merge **`f309405`**, this checkpoint its direct child.
`builder: claude-opus-5`, `verifier: claude-opus-5 @fresh`,
`built_by: claude-opus-5 @T-104 — code commits aea8b9e and 51fb002`,
`verified_by: claude-opus-5 @fresh — verdict 7d95f79`,
**`review: same-model`**.

**WHAT LANDED.** All nine rulings, in `method/tasks/TASK-FORMAT.md`,
`method/interview/decomposition.md`, `method/roles/verifier.md`,
`method/roles/executor.md`, `method/lane-protocol.md` and
`method/README.md` — plus **two obligations no brief mentioned**,
`T-088-s1`'s criterion rule and `T-089-s7`'s ROW 5 residual. **None is
wider than ratified**, which the verifier checked ruling by ruling by
READING rather than grepping, and **no census count was transcribed into
`method/`, so the T-088-s1 rule obeys itself.** The bump to **v0.1.6**
moved all three pinned places in ONE commit (`aea8b9e`): the CONVENTIONS
stamp, `plan-interview.md`'s Output heading and
`METHOD_SNAPSHOT_VERSION`, with
`agent::kit::tests::snapshot_version_matches_the_live_method_stamps` read
by NAME as `ok` here. The verifier drilled it **four** ways, including a
const-only bump that reds at `kit.rs:443` and **again at `:450`** once
only the named file is fixed — a second red, not a green, exactly as the
gotcha claims.

**THE KIT NOW SHIPS 38 471 BYTES**, derived at this merge over the
fourteen enumerated `include_str!` sources, against **25 418** at
main-before — **+13 053**, of which `TASK-FORMAT.md` is **+11 321** and
`interview/decomposition.md` **+1 732**, the other twelve sources
byte-identical. **Enumerate, never `grep -c`**: `grep -c 'include_str!'`
answers **17** (three are doc comments) and `grep -c 'rel:'` answers
**15** (one is the struct field). Both are 14 enumerated and they agree
one for one.

### **THE FINDING OF THE PASS: A STALE GRAPH WITH NO FIGURE CAPABLE OF SHOWING IT, WORKED END TO END**

**`index --check` said STALE at exit 1 with EVERY HEADLINE FIGURE
IDENTICAL ON BOTH SIDES** — `933486 bytes · 179 files · 1987 symbols ·
1903 edges` committed AND fresh — and only a `~1` line naming
`app/src-tauri/src/agent/kit.rs (content)` separating them. The cause is
**one character**: the `5` of `"0.1.5"` becoming a `6` inside an existing
`const`.

**THE REGEN PROVES THE TRAP RATHER THAN ASSERTING IT.** `graph.json` is
**933 486 bytes before the regen and 933 486 bytes after it**, and its
sha256 moved:

    before  1539e937520b282b7497883dc38670ae9e882c7337ca3d126870c4583197f265
    after   c20d42125521278d6e07f00d50d1b3a412a6ca61b77b53668ee51f38b763705e

**A session confirming the graph by comparing bytes, files, symbols and
edges would have shipped a stale graph and had four figures agreeing with
it.** ASK THE GATE. That instruction has been in CONVENTIONS since T-054
and this is the first merge where every alternative to it was measured
and every one of them was wrong.

### **THE TWO STATEMENTS THIS MERGE WOULD HAVE MADE FALSE**

`T-104-s1` is TRUE and was acted on. `docs/ARCHITECTURE.md`'s C-01 row
read `built (v0.1.5)` and
`docs/architecture/components/C-01-method.md:9` read
`# pinned: built and versioned (v0.1.5)`. **Both were TRUE on main at
`212543c` and FALSE at `f309405`**, no test reads either, and both sit
outside `touches: [method/, docs/CONVENTIONS.md, app-agent]` — so the
lane declining to widen its fence was right (lane-protocol rule 5) and
the integrator taking them is the same rule from the other side.
Repaired in **this checkpoint**, not in the merge. The C-01 row is also
`integrator.md` rule 3's own checkpoint item.

**THE ELEVEN `methodVersion: "0.1.5"` FIXTURES ARE DELIBERATELY LEFT**,
and so is `genesis-derive.ts`'s `(v0.1.5, T-023)`. A fixture needs *some*
version string; a reference that CLAIMS the current version goes stale.
That two-way split is why the corrected gotcha states the SHAPE and a
derivation command instead of a tally.

### **SEVEN IN-PLACE REPAIRS, AND THE RULE THAT PICKED THEM**

**REPAIR WHAT THE MERGE INTRODUCES, FILE WHAT THE MERGE MERELY REVEALS.**
T-108's checkpoint derived that line; this pass applied it to eleven
separate items and it decided every one of them without a second
principle. Repaired, each marked `[INTEGRATOR …]` in place with the
executor's prose otherwise byte-untouched:

1. **The notes heading called `aea8b9e` the "lane tip".** The tip is
   `51fb002` and the verdict is at `7d95f79`.
2. **The kit total.** `38 407 / +12 989` is right at `aea8b9e` and stale
   at the tip; `38 471 / +13 053` at the merge, with the per-file split.
3. **"Twelve `methodVersion` fixture literals" is ELEVEN**, enumerated —
   in a finding riding beside a bullet this same card rewrote to say
   *DERIVE THE LIST, NEVER QUOTE IT*.
4. **The same count in `T-104-s1`.**
5. **`T-104-s2`'s "beside the slug map"** — `docs/CONVENTIONS.md` has no
   slug map; the map is `docs/ARCHITECTURE.md` plus each component's
   `touch_slugs:`, **which this lane's own `executor.md` edit states**,
   so the finding contradicted the ruling it rides beside. The
   registry-derived repair is added: all 13 components carry
   `touch_slugs:` and the ONLY empty one is C-01, so *a `touches:` entry
   that is a registry slug is shipped code; a bare path is not* — one
   sentence, no new field. Its `non_code:` warning is CORRECT and stands
   (C-11 carries `non_code: true` AND two slugs).
6. **The notes' "the card cites 'the first criterion' TWICE".** Three
   times — lines 44 and 361 mean criterion 3, **line 237 means criterion
   2** — and criterion 1 is neither. A miscount inside a list of
   miscounts.
7. **The notes' charge that the card predicted FOUR suites while the gate
   said TWO — WITHDRAWN.** At the merge the gate says **FOUR** and the
   card's Verification section named exactly those four.

### **THE GATE'S ANSWER WAS CHANGED BY THE LANE'S OWN NEXT COMMIT**

This is the sharpest process finding of the pass. The lane measured the
DOCS GATE at `aea8b9e`, correctly: **TWO** suites owed, because the only
`docs/` path in the diff was `docs/CONVENTIONS.md`. It then committed
`51fb002` — notes plus three findings — and **four `docs/tasks/T-104*`
files became code inputs**, taking the gate to **FOUR**. The lane used
its own true figure to charge the card with predicting four, and **the
card was right at the tip the lane handed over.**

**A GATE'S ANSWER IS A FUNCTION OF A DIFF, AND A LANE'S LAST COMMIT IS
PART OF ITS DIFF.** Ruling FIVE — *a role that writes to the tree owes
the tree's gates, and a count measured at the commit under review is
stale at the tip the verdict creates* — is the rule that catches this,
and it is the rule this very card lands. **It bit its own author twice
in the same commit**, on the gate and on the kit total. Nothing was lost:
all four suites were run and all four are green.

### **THE STAMP THAT IS THE FIRST ONE WRITTEN UNDER RULING SEVEN**

`review: same-model`, and the reasoning is worth more than the value.
The verdict opens *"Verified by claude-opus-5 as an independent
adversarial session"* and it earns that adjective — the card was read at
its BASE REF at 15:05Z and the attack set written down at 15:06Z, before
the diff, notes or findings were opened. **But ruling SEVEN, landed by
this merge, says `review:` is PROVENANCE and not a strength ranking**,
and the provenance is one model on both sides. Reading a verdict's own
adjective as licensing `review: independent` is exactly the conflation
ruling SEVEN exists to end. **`same-model` is not the weaker verdict**;
it is the same blindness with a different hand.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 212543c 7d95f79 -> tree 8954d56…, exit 0 (read from $? FIRST)
    git diff --name-only 212543c <TREE>                        ->  13   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 212543c..f309405  (THE MERGE'S DIFF)  ->  13   the only one that means anything
    git diff --name-only 212543c...7d95f79 (branch-only, THREE) -> 13
    git diff --name-only fbae94a..212543c  (main's advance)    ->  33
    git diff --name-only 212543c..7d95f79  (TWO dots, FORBIDDEN)  ->  46
    git diff --name-only main..HEAD        (FORBIDDEN)         ->   0   ← read this row twice

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 33 PATHS — 3.54x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **33** under this lane, the
branch **13**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 33 + 13 = 46 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. **Sixteen of the forbidden
form's 46 are PHANTOM DELETIONS**, main's advance appearing as deletions
through a drifted left endpoint; **the lane deletes nothing.** Ratios so
far: T-110 **7.0x**, T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**,
T-086 **2.67x**, T-107 **2.25x**, T-102 **3.75x**, T-033 **1.94x**,
T-091 **8.78x**, T-116 **15.80x**, T-108 **20.75x**, T-104 **3.54x**.
**The ratio is weather; the left endpoint is the signal.**

**AND THE OTHER FORBIDDEN FORM DOES NOT OVERSTATE AT ALL — IT ANSWERS
ZERO.** `git diff --name-only main..HEAD` returns **0 paths** at an
integrator's own checkout, because the integrator IS on `main` and
`main == HEAD` the moment the merge lands. **A session that reached for
that spelling would read a 13-path merge as an empty one and every gate
derived from it as NOT OWED** — GRAPH REGEN, BOOT GATE and DOCS GATE all
fire here and all three would have been skipped, silently, with a
clean-looking derivation. **The forbidden forms do not share a failure
direction**, which is worth more than the ratio table: one inflates, one
ANNIHILATES, and only the second is invisible.

**`<merge-base>..<tip>` GAVE THE RIGHT ANSWER HERE AND IS STILL FORBIDDEN.**
`fbae94a..7d95f79` returns 13 — identical to the prescribed set — because
`fbae94a` IS the merge base, so that spelling degenerates into the
three-dot form. **It is right by coincidence of this lane's shape**: any
main advance that had touched a path the lane also touched would make the
two diverge with nothing to signal it.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`8954d56e390a736c97e13de1c9ebc1f12730df67` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`212543c` and `7d95f79` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.** The exit was read from `$?` into a variable **BEFORE** any
substitution, on the `bdada11` sharpening's own instruction — exit **0**.

**FENCE DISJOINTNESS WAS PROVED AS SETS AGAINST EVERY LIVE LANE.** For
each of `T-126` (9 branch-only paths), `T-129` (15) and `T-130` (4),
`comm -12` of this merge's thirteen paths against that branch's own
`merge-base..tip` diff is **EMPTY**. Declared fences agree: none of
`method/`, `docs/CONVENTIONS.md`, `app-agent`, `app-shell`,
`crate-index` or `tools/e2e` overlaps another.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR**, which is the first time in
several checkpoints. `git diff --cached --name-only` and
`git diff --name-only` were both EMPTY before the merge and again
immediately before it, with one `??` row; **`??` alone is not a
ceremony.** `main` read `212543c` at 19:44:17, at 19:48:05 and again at
19:49:35 one command before `git merge`.

## THREE standing gates — ALL THREE fire, all THREE derived from the merge's own 13 paths

| gate | trigger | on these 13 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — OWED** | **exit 1 STALE**, regenerated, **exit 0 CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **1 — OWED** | exit **0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES** | exit **1**, **FOUR** suites owed, all green |

- **GRAPH REGEN — OWED, ASKED, STALE, REGENERATED, ASKED AGAIN.** The
  trigger matches exactly one of thirteen paths,
  `app/src-tauri/src/agent/kit.rs`. Asked at the merge: **exit 1, STALE**
  (see the finding above). Regenerated with the prescribed
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
  --ignored`, exit 0. Asked again: **exit 0, CURRENT**. Asked a THIRD
  time after this checkpoint's doc writes: **exit 0, CURRENT** —
  `.nputerignore` excludes `docs/`, so no doc write can move it, and the
  ask is still not ceremony because the ONLY thing that could have told
  you otherwise was the `~` line. `graph.json` is committed **with this
  checkpoint** and not with the merge.
- **BOOT GATE — OWED and RUN**, exit **0**, on scratch port **15401**,
  `lsof`-read free immediately before the bind and zero rows after.
  **BOTH `[nputer]` lines observed**: `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
  Child pid 55968, process group captured, tree stopped on SIGTERM, no
  orphan. It builds and runs out of **main's own** `target/`, not
  @human's checkout.
- **DOCS GATE — exit 1, FIRES on 5 of 13, FOUR suites**: `cargo test from
  app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/`. Invoked DIRECTLY from the repo root
  with the RANGE RULE's own path list, **never through `xargs`**. **13
  derived docs readers across 4 suites**, census **130 sites in 22
  files**, **0 frontmatter issues**. **The reader count is a third figure
  at a third ref** — the executor read 12 at `aea8b9e`, the verifier 12
  at `51fb002`, this integrator **13** at `f309405`.

## Fixture reconciliation — NONE was owed, and that is DERIVED

**The graph's node and edge counts did not move** (179 files, 1987
symbols, 1903 edges, unchanged across the regen), so neither app dogfood
fixture has a value to reconcile; **the parser pin is not owed** either —
no component file changed and no component was declared. The
three-fixture rule (T-024-s5) fires on DECLARING A COMPONENT; this merge
declares nothing. **This is derived from the regen's own output and then
CONFIRMED by re-running all four suites after every doc write.**

**C-07's BYTE FIGURE IS STILL EXACT** and was checked rather than
assumed: ARCHITECTURE reads **933 486 bytes — 93.35%, 66 514 bytes of
headroom** at T-116's checkpoint, and the regenerated graph is
**933 486 bytes**. The content moved; the size did not.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.23s**. **Unchanged from
  main's 460** — this merge's only `.rs` change is one string literal.
  **AND THE COUNT WAS CROSS-CHECKED AGAINST THE DECLARED BODIES**: the
  `running N tests` headers sum to **463**, which is 460 + 3 ignored.
  That check is the one that catches a target aborting with no
  `test result:` line at all — the shape that produced an
  ordinary-looking pass/fail elsewhere tonight while three bodies
  vanished. Do it; it costs one `awk`.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 972/972 across 47 files,
  exit 0**. **Unchanged from main's 972.** The lane measured 962/46 in
  its own worktree; the difference is main's 33-path advance, not this
  merge.
- **E2E: 171/171, exit 0, ONE RUN, 1.9m, on scratch port 15402.** The
  port was `lsof`-read free and **re-probed in the same command that
  bound it**, because a probe reserves nothing. The `T-130` mtime body
  passed; main is not a fresh checkout. **`range-rule.spec.ts` is 25 of
  25** and printed its DISCLOSURE **against this merge commit by name** —
  *"GRAPH REGEN's published flip figures are stated at `ddcc8bb` and ARE
  RIGHT THERE, and its trigger has since gained `.rs`: 5 of 5 at that
  ref, 1 of 1 under the trigger on disk"* — which is `T-091-s3`'s exact
  subject, observed rather than theoretical.
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`. So was
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`, which is the pin that proves the v0.1.6 bump.
- **ALL FOUR OWED SUITES RAN AGAIN AFTER THIS CHECKPOINT'S DOC WRITES**
  (T-081-s9), because every file it writes — four `docs/tasks/T-104*`
  edits, two new suggestion files, ARCHITECTURE, C-01 and this file — is
  a code input the census names. **Run 2 is identical to run 1 on all
  four**: parser 268/268, app 972/972, cargo 460/0/3 over 16 lines with
  463 declared bodies and the lib suite at **4.37s**, e2e 171/171 on the
  same port 15402, re-probed again immediately before the second bind.
  **THERE WERE THREE RUNS OF EVERY OWED SUITE AND ALL THREE ARE
  DECLARED**, because the rule is to declare every run and not only the
  ones that disagree. Run 1 at the merge before any doc write; run 2
  after the doc writes; **run 3 after the LAST doc write**, which this
  checkpoint's own final corrections made necessary — two of them
  (`T-104-s5` and the lane-status derivation) landed after run 2 had
  started, and `docs/tasks/**` is a code input five readers walk. **All
  three agree on every derived count**: 268/268 · 972/972 · 460/0/3 over
  16 lines · 171/171. GRAPH REGEN was asked a **fourth** time after run 3
  and is exit 0, CURRENT, at the same four figures.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens -- --selftest`
  exit 0**, **`npm run lint:tokens` exit 0**, at **TOKEN 135 / CONTROL
  729 before this checkpoint's commit** and **TOKEN 135 / CONTROL 731 at
  the checkpoint `939a8c2`**, re-run there rather than predicted.
  **DERIVE IT AT YOUR OWN REF; it is not a constant** — CONTROL's corpus
  is `git ls-files`, so **the two suggestion files this checkpoint
  commits were invisible to it until the commit existed**, and neither is
  a TOKEN-root file. The +2 is exactly derivable and is this
  checkpoint's, not another hand's.
- **`index --check` WAS ASKED A FIFTH TIME AT THE CHECKPOINT COMMIT
  ITSELF** and is exit **0, CURRENT** at the same four figures
  (933 486 · 179 · 1987 · 1903). `npm run lint:docs` at the checkpoint
  reports **every live task card's frontmatter parses, with a legal
  status** — which is the check that the two new suggestion files and the
  card's five stamped fields are well-formed.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-104` was removed at **20:16** with
`git worktree remove`, after the merge and after the checkpoint
(lane-protocol rule 6), and `git worktree prune` was run behind it.
**The BRANCH survives**, which is this project's rule read off disk
rather than assumed: `git branch --list 'task/*'` returns **59**,
including lanes merged weeks ago. `task/T-104-method-snapshot` still
resolves to `7d95f79`, so the verdict's own commit remains diffable.
`git worktree list` now returns **five rows — main, three lanes and
@human's app checkout.**

### **`npm run typecheck` DOES NOT EXIST IN `app/`, AND `npm run` ON A MISSING SCRIPT EXITS 1**

**Walked into live by this integrator, and the previous checkpoint's
line is the reason.** STATE has recorded *"`npm run typecheck` exit 0"*
for several checkpoints **without saying which directory it was run
from**, and `app/` — the package a reader is most likely to assume — has
no `typecheck` script at all. Its scripts are `dev build preview test
tauri`. **Only `lib/parser` and `tools/e2e` define one**, and both are
**exit 0** here.

**THE TRAP IS THE EXIT CODE.** `npm run typecheck` from `app/` prints
`npm error Missing script: "typecheck"` and **exits 1** — which is
indistinguishable from a type error to anything reading the exit alone,
and indistinguishable from a run that happened to anything reading only a
green tally. **The app's type gate is not missing**; it is the two `tsc`
invocations inside `npm run build` (`tsc && tsc -p tsconfig.test.json &&
vite build`), which is exit **0** here and is the program T-073 restored.
**This is `T-108-s4`'s class from a second direction**: a command that
silently means something different depending on where it is run, and
answers a plausible number rather than an error.

**A COMMAND IN A CHECKPOINT CARRIES ITS DIRECTORY OR IT IS NOT A
COMMAND**, which CONVENTIONS already says of the docs gate and does not
say of this one.

## The board, derived from disk at this checkpoint

**260 flat task files — 92 done / 35 planned / 41 parked / 89 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
92 + 35 + 41 + 89 + 0 + 3 = 260. T-104's stamp moves done from 91 to 92
and clears the single `verifying`; this checkpoint files **two**
suggestions on top of the lane's three.

**THE SUGGESTION BACKLOG IS EIGHTY-NINE AND WANTS AN ELEVENTH TRIAGE.**
`T-104-s1`…`s3` came in with the merge and `T-104-s4`…`s5` are filed
here; **none of the five is triaged**, because disposition belongs to a
triage pass and not to an integrator (T-083's ruling), so they stay
`status: suggested` exactly as filed. **`T-104-s1` carries a discharge
record in its own body** naming this checkpoint — which is ruling ONE,
landed by this same merge, applied to itself the hour it landed.

## Documents ticked

- **STATE — rewritten, as a snapshot.**
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's own text is preserved
  byte-untouched apart from the seven marked repairs named above.**
- **ARCHITECTURE — TOUCHED, one token**: C-01's status goes
  `built (v0.1.5)` → `built (v0.1.6)`. No component is declared and no
  interface moved. **C-07's byte figure was RE-DERIVED and is still
  exact** (933 486). The derived slug block was re-read off disk against
  every component's `touch_slugs:` and matches — all eight slugs, 13
  components, exactly one empty `touch_slugs:` (C-01).
- **`docs/architecture/components/C-01-method.md` — one token**, the
  same v0.1.6 move in the `status:` comment.
- **ROADMAP — DELIBERATELY NOT TOUCHED, and that is DERIVED rather than
  skipped.** F-01's backbone entry is a one-line bullet with no progress
  paragraphs. **And the ROADMAP's only version line was checked
  individually**: Milestone 0's `[x] Convention v0.1.3 (EARS, touches,
  security sweep, succession, suggestions, room resolutions)` is a
  COMPLETED CHECKLIST ITEM recording what v0.1.3 delivered — it went
  stale at v0.1.4 and v0.1.5 and was never moved, and it is exactly the
  RATIFICATION-RECORD shape this lane argued for keeping in CONVENTIONS'
  `(v0.1.4, T-016)` and `(v0.1.5, T-023)`. **Bumping it would be the
  error the lane declined to make.**
- **CONVENTIONS — NOT TOUCHED BY THE CHECKPOINT.** The merge changes it
  (three hunks, all above the RANGE RULE bullet); the checkpoint adds
  nothing. **THREE edits are now routed to named targets** — see "Next
  up" item 3, and `T-104-s5` for the argument.
- **NO NEW ADR, and that is derived rather than skipped.** The general
  rulings on this card were made by the seventh triage and by the
  architect, are recorded on the card, and have now LANDED in `method/`
  rather than needing a decision record. Nothing supersedes
  ADR-001–017.
- **`graph.json` regenerated and committed HERE**, not in the merge.

## Provenance — SELF-DECLARED, never read off a trailer

T-104 is **built by `claude-opus-5`**, **verified by a separate
adversarial `claude-opus-5` session** that declared a BOUNDED READ (card
at base ref `fbae94a` at 15:05Z, attack set written 15:06Z, before the
diff), and integrated by a **third hand** that neither built nor verified
it. **`review: same-model` is the honest label and ruling SEVEN is why**
— the field is provenance, and both hands were the same model. **The
independence that pays here was INFORMATIONAL and it was real**: the
verifier found four card defects the lane missed, refuted one of the
lane's own charges, caught two stale figures and identified a fabricated
observation in its own dispatch brief. **The `Co-Authored-By` trailer on
this lane's commits is a harness constant and is NOT evidence of a
model** — T-085 proved it and T-101 sharpened it.

**92 done cards — 68 `same-model`, 18 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 68 + 18 + 5 + 1 = 92. T-104 moves `same-model` from 67
to 68.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **19:50:29** (immediately after
the merge's working-tree write), at **19:53:42** (immediately after the
BOOT GATE, the one step that could plausibly have collided) and again at
the end of this checkpoint. **All three readings identical.**

**THE APP BINARY WAS RESTARTED BEFORE THIS INTEGRATION STARTED, AND IT
WAS NOT US.** `ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`
— the **anchored** match — reports pid **53350**, started **2026-08-25
19:43:47**, unchanged at every reading. The previous checkpoint recorded
pid **89201** started **10:54:33**. **19:43:47 is thirty seconds before
this integration's first command (19:44:17)**, and
`/Users/ujju/Projects/nputer-app` moved from `c4cfe52` to `212543c` in
the same window. **That is @human updating and restarting their own
checkout, not this pass** — stated with the times because a pid and a
start time are live-environment facts, not functions of a tree, and are
already stale for you.

**THIS MERGE'S DIFF TOUCHES `app/src-tauri/**`, AND THE PREDICTION WAS
MADE BEFORE IT WAS CHECKED.** One of thirteen paths is under
`app/src-tauri/**` (the trigger that rebuilds and RELAUNCHES the binary)
and zero under `app/src/**` (vite HMR). **In the MAIN checkout that
would relaunch; in @human's checkout it cannot, because @human's app
serves from a DIFFERENT checkout that this merge does not touch** — and
the unchanged pid and start time across all three readings confirm it
rather than argue it. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE
ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and this
integration DID rebuild `lib/parser/dist`, which is the exact channel.
**The channel is closed by MEASUREMENT rather than by assumption**:
`app/node_modules/@nputer/parser` is a **RELATIVE** symlink
(`../../../lib/parser`), re-read here rather than inherited, so it
resolves inside its OWN checkout, and `/Users/ujju/Projects/nputer-app`
has its own `lib/parser/dist`. **Read that as a property of the second
checkout, not of this merge.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** **The repair is
still item 7 below, unwritten after NINE consecutive merges performed it
by hand.**

**No process from this integration survives.** Scratch ports **15401**
(boot gate) and **15402** (e2e) were released and read back at zero rows.
**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-first** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test`, the boot gate's build, the graph regen and
THREE `index --check` runs all WROTE to main's `app/src-tauri/target/`,
which reads **3.0 GB**, as any cargo run must. **No sibling worktree was
entered or modified** — the lane worktree was read at
`/Users/ujju/Projects/nputer-T-104` and removed by this checkpoint;
`../nputer-T-126`, `../nputer-T-129` and `../nputer-T-130` were read with
`git rev-parse` and `git show` only; `../nputer-app` was read with
`git -C … rev-parse` and `lsof` only. No path was staged by wildcard;
`git add -A` was never used, and the write used `git commit -- <paths>`
so it could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN.** THREE lanes hold fences — **T-126**, **T-129** and
**T-130** — and **TWO OF THE THREE ARE APPROVED AND QUEUED FOR
INTEGRATION**: `T-126` (verdict at its tip `de05430`) and `T-129`
(verdict `73651cb`). `T-130`'s tip is an ordinary work commit. Read
`git worktree list` and each branch's tip rather than any table here.

**AND ALL THREE ARE A LIVE DEMONSTRATION OF RULING NINE, ONE MERGE AFTER
IT LANDED.** Each of the three cards reads **`status: verifying` ON ITS
OWN BRANCH** and **`status: building` on main**, because the stamp is
lane-local until the merge carries it. **The board therefore reports
`0 verifying / 3 building` while three cards are in or past
verification** — three simultaneous instances of exactly the gap ruling
NINE documents and deliberately REFUSES to fix with a ninth status. **The
honest reader is the lane list plus each branch's own copy of its card**,
which is what `executor.md` row 5 now says in as many words, landed by
this same merge.

**`method/`, `docs/CONVENTIONS.md` AND `app-agent` ARE RELEASED**, which
unblocks more of the backlog than any single fence release this project
has recorded — six of the numbered items below were waiting on one of the
three.

## Next up

1. **`T-131` IS UNBLOCKED AND IT IS THE ONE @HUMAN OWES A RULING ON.**
   Its only blocker, `T-104`, now reads `done`; **the `blocked_by:` field
   is deliberately left as written** (see the top of this file for why
   this tree never empties it). `status: planned`,
   `touches: [method/, docs/CONVENTIONS.md]` — both now FREE — size M,
   `@human: yes`. A ranked set of five process changes with the
   measurements attached, from the first session that ran six lanes
   concurrently, opening on the claim that the ceremony costs ~930k
   tokens per merged card. **It is not this integrator's to triage or
   summarise.**
2. **`T-130` IS BUILDING** — the intermittent that cost five separate
   lanes tonight. One token of code, `[tools/e2e]`, reproduction on
   demand in any worktree since T-052.
3. **`docs/CONVENTIONS.md` IS FREE AND FIVE EDITS ARE QUEUED AT ITS
   SEAT, ACROSS EXACTLY TWO BULLETS — DERIVED HERE, AND IT IS TWO MORE
   THAN THIS INTEGRATOR'S BRIEF DESCRIBED.** `T-104-s5` carries the
   argument.

   **THE RANGE RULE BULLET — two edits, to `T-093`.** (a) `T-091-s3`'s
   trigger-beside-the-ref clause and (b) the `bdada11` sharpening go to
   **`T-093`** (*the hand's measurement hazards, written where the hand
   reads* — `[docs/CONVENTIONS.md]`, planned, unblocked, carrying no
   RANGE RULE prohibition). Both ARE hand hazards and **both were
   observed live during this integration**: the exit was read from `$?`
   before the substitution, and `range-rule.spec.ts` printed the trigger
   disclosure against this merge commit by name.

   **THE POISON DRILL BULLET — three edits, to `T-092`.**
   (c) **`T-079-s3` items 2–3**, routed here since T-130's dispatch.
   (d) **`T-130-s1`** — *"what restoring a fixture MEANS belongs in the
   POISON DRILL bullet"*, which **explicitly asks to be taken in ONE
   edit with (c) rather than as a fourth pass over the same bullet**.
   (e) **T-129's generalisation**: *a drill that mutates a constant
   poisons every later BINARY-LEVEL measurement in that target dir
   unless you rebuild.* All three go to **`T-092`** (*four places the
   drill's own procedure cannot fail* — `[docs/CONVENTIONS.md,
   app-agent]`, both now free).
   **THE THREE ARE ONE FINDING FROM THREE SEATS, AND THE BULLET'S OWN
   RESTORATION PROOF IS THE COMMON BLIND SPOT**: it proves restoration by
   sha256 over SOURCE files, so it cannot see a restored source with a
   mutated BINARY beside it (e), and it does not say that restoring means
   the CLOCK as well as the bytes (c, d). **Arm (c) of the bullet does
   not cover (e) either** — arm (c) protects the PARENT's cache, and
   T-129's poisoned reading was taken inside its own drill worktree,
   with its own `CARGO_TARGET_DIR`, AFTER the restore.
   **`T-129` AND `T-130` ARE BOTH UNMERGED AND NEITHER FENCE REACHES
   `docs/CONVENTIONS.md`** (`[crate-index]` and `[tools/e2e]`), so both
   integrators will meet this same routing question. That is `T-104-s3`
   firing a second and third time before it has been triaged.

   **THE FINDING THAT MATTERS MORE THAN THE FIVE EDITS**: everyone — the
   lane, `T-104-s3` and this integrator's brief — concluded the RANGE
   RULE prohibition was spent because T-091's reader now guards the
   bullet. **The reader guards the FIGURES, and neither RANGE RULE edit
   changes a figure**, so `range-rule.spec.ts` reports 25 of 25 whether
   the new prose is right or wrong. **A guard that cannot fail on the
   change you are making is not protection for that change** — ruling
   THREE, arriving from outside the card, about the card's own
   prohibition.
4. **`T-104-s4` — FOUR DEFECTS IN T-104's OWN CRITERIA**, filed rather
   than repaired because all four predate the merge. Criterion 5's
   uniqueness claim is FALSE about the file it governs
   (`method/tasks/TASK-FORMAT.md:15` restates the status vocabulary);
   criterion 11 says "the five" where there are nine; "the first
   criterion" is cited three times for two different criteria; and the
   card's "clean zero" is a phrase-match sold as an absence test —
   `T-093`'s anchor finding committed by a card in the same batch. Fence
   `[docs/tasks/T-104-…md]`, free.
5. **`method/` IS FREE AND TWO ROUTED ITEMS ARE STILL UNTAKEN — DERIVED
   FROM THE MERGE'S DIFF, NOT ASSUMED.** T-104 rewrote `executor.md`
   step **6** (ruling NINE's stamp instruction) and rows **5** and
   **11**, and it did NOT touch step 5. So:
   (a) **`T-108-s3` — `executor.md` STEP 5 IS UNPERFORMABLE UNDER A
   PATH-GRANULAR FENCE**, still open, and still the SECOND unruled
   conflict on that one step.
   (b) **T-108's fence ruling** — *a bare `docs/tasks/` directory fence
   is never correct, and a card's own file is never part of its own
   fence* — is **NOT in `method/`**: `git grep` over `method/` for either
   half returns zero rows. It was routed to T-104 and T-104 landed
   neither, correctly, since neither is one of the nine.
   **The two are one card**: (b) is the premise (a)'s conflict rests on.
6. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
   returns zero rows. Every integrator does it — this one included, and
   it matched the merge's tree byte for byte again. Fence `method/`,
   **FREE**.
7. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — NINTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **FREE**.
8. **`T-108-s1` — THE FOURTH STALE CITATION**, in T-081's own verifier
   notes. Fence `[docs/tasks/T-081-denial-reaches-the-screen.md]`, free.
9. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
   (`T-091`, `T-102`, `T-120`). One predicate on data `docs-gate.mjs`
   already reads; the three instances must be cleared in the same commit
   or the gate reds on arrival. Fence `[tools/e2e]`, **held by T-130**.
10. **`T-108-s4` — THE PATHSPEC RULE NEEDS A THIRD CLAUSE: THE ROOT.**
    `git grep -- .` from a subdirectory silently scopes itself and
    answers exit **1** on a string that is present.
11. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **FREE**.
12. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **FREE**.
13. **`T-125` IS UNBLOCKED BY HALF.** `[app-agent, app-shell,
    docs/architecture/components/]` takes the last undeclared row,
    `C-10 → C-14`. `app-agent` is now free; **`app-shell` is still held
    by T-126.**
14. **`T-128` — SILENT CORRUPTIONS OF SHARED STATE**, `planned`, fence
    `[method/, docs/CONVENTIONS.md]`, **BOTH FREE NOW**. Its fourth
    instance (a correct edit made on the wrong side of a merge) is
    T-108's; this checkpoint adds no fifth, and `T-104-s5` names the
    shape it deliberately avoided creating.
15. **`T-124-s1` — DISCHARGED BY THIS MERGE, and say so rather than
    carrying it.** The owed v0.1.6 method bump landed in ONE three-file
    commit (`aea8b9e`), which pays T-089's, T-124's, T-052's, T-102's,
    T-033's, T-091's, T-116's and T-108's residual together, since the
    debt is per-VERSION.
16. **THE COMMENT CORRECTION IN `churn-source.ts`** —
    `onProjectMaybeChanged`'s doc comment claims it inherits the
    single-flight latch; it nulls `inFlight` on the line before.
    `[app-map]`, free.
17. **THE TWO UNPINNED GUARDS IN `map-churn-age.test.tsx`** — both
    CORRECT, both unpinned, probes in T-116's verdict. `[app-map]`, free.
18. **`T-127` — THE SURVIVING CYCLE.** `planned`, `blocked_by: [T-033]`
    cleared. Fence `[crate-index, docs/architecture/components/]`;
    **`crate-index` is held by T-129**.
19. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live
    and visible: `arch` says `drift_components=3`, TypeScript says 1.
    Rides `[crate-index]`, **held by T-129**.
20. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN**, ready to paste.
    Needs `app/test/**`, C-05 `app-shell` — **held by T-126.** Read it
    beside **`T-110-s9`**.
21. **THE SUGGESTION BACKLOG IS EIGHTY-NINE AND WANTS AN ELEVENTH
    TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4` and `T-104-s1`…`s5` are untriaged.
22. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint.** T-104's ruling NINE flagged its `T-111` IF clause as
    having a FALSE antecedent (T-111 returned to `planned` at `29c0f4f`)
    — whoever lands T-111 should collapse ruling NINE's two homes into a
    citation rather than leave two descriptions of one thing.
23. **THE BOARD-TRUTH RULING** — THIRTEENTH ask, second consecutive one
    from a CLOSED window.
24. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
25. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This brief was the SECOND written to the deliberately-thin
format, on the rule T-108's checkpoint derived: *a brief should carry
what the repository cannot say about itself, and nothing else.* **The
format held again, and the failure mode is now characterised rather than
just observed.** T-108 predicted that a thin brief's errors would all be
PREDICTIONS rather than TRANSCRIPTIONS. **Four of the five below are
predictions; the fifth is neither, and it is the interesting one.**

1. **A PREDICTION, AND THE SHARPEST: "THE FORBIDDEN FORM HAS BEEN
   OVERSTATING BY 15–20× TONIGHT."** It overstated by **3.54×** here —
   and more importantly, **one of the two forms the brief names as
   forbidden ANSWERS ZERO.** `git diff --name-only main..HEAD` returns
   **0 paths** for an integrator standing on `main` after the merge,
   because `main == HEAD`. The brief's whole framing is that the
   forbidden spellings INFLATE; one of them annihilates, and that is the
   dangerous direction, because a 46 looks wrong and a 0 looks like a
   clean merge with no gates owed. **All three gates fire here and all
   three would have been derived as NOT OWED.**
2. **A PREDICTION: "`<merge-base>..<tip>` — NEVER."** Right as a rule and
   **wrong about this instance**: it returns 13, identical to the
   prescribed set, because `fbae94a` IS the merge base here so the
   spelling degenerates into the three-dot form. The rule stands on the
   case it is written for; **a rule that happens to be right is worth
   distinguishing from a rule that is right for its reason**, and this
   checkpoint says which.
3. **NOT A PREDICTION AND NOT A TRANSCRIPTION — A PREMISE.** *"The reason
   for that prohibition is now spent … T-091 has since landed, so the
   reader will red if anyone breaks it."* The first clause is true, the
   second does not support it: **the reader guards figures and neither
   routed edit changes a figure.** The brief also said *"run `npm test`
   from `tools/e2e/` and state the count — that reader is the whole
   point"* — the count is **171/171** and it would have been 171/171
   either way. **This is a new failure mode for the thin format**: a
   brief carrying no figures can still carry an ARGUMENT, and an argument
   is not derivable in one command. Filed as `T-104-s5`.
4. **A PREDICTION: "THE DETACHED-TO-LANE RATIO SWUNG FROM 8:5 TO 1:5."**
   It read **1:4** at 19:48 and **1:3** after this checkpoint. The
   instruction — filter on the BRANCH, never count rows — was right and
   is what made the number irrelevant, which is the third consecutive
   checkpoint to say so.
5. **A PREDICTION THAT COST NOTHING AND EARNED ITS KEEP: "ASK GRAPH REGEN
   TWICE, AND NEVER CONFIRM BY BYTE COUNT."** Asked **three** times. The
   instruction was not merely right — **this merge is the strongest
   instance of it the project has**: bytes, files, symbols and edges were
   all identical across a real staleness, and the regen changed the
   file's sha256 without moving its size by one byte. **Every alternative
   to asking was available here and every one of them was wrong.**

**WHAT THE THIN FORMAT NEEDED AND DID NOT WITHHOLD.** Every figure was
one command away, as promised, and nothing was missing. The brief's five
carried facts were all of the right kind — a verdict's location, an
intention (the decline), an unmerged lane's finding, a routing
consequence, and a judgement to make — and **four of the five were things
the repository genuinely cannot say about itself.** The fifth, item 3
above, is the format's newly-found edge: **the thin brief's remaining
risk is not a wrong number, it is a right fact wearing a wrong
inference.**
