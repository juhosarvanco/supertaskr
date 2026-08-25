# State

Updated: 2026-08-25 by the T-116 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THE INTERMITTENT
THAT HAS COST FOUR SEPARATE LANES TONIGHT FINALLY HAS A CARD AND A LANE —
`T-130`, BUILDING NOW — AND `T-120-s3` NO LONGER EXISTS AS A FILE.**
Nothing on main is broken: this merge is **460 / 972 / 268 / 171 green**.
But **the app suite cannot even BUILD on a merged main until you rebuild
lib/parser**, **three known intermittents will meet you before any real
defect does**, and **main moved TWICE under this integrator between
reading the brief and merging** — a triage promotion and then a dispatch
stamp — which is the ordinary case and not an incident. Read the next
five sections before you debug anything, and derive the lane list before
you cut anything.

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

**AND T-116's VERIFIER FOUND A SECOND, EARLIER LINK IN THE SAME CHAIN**,
which belongs beside this one: in a FRESH WORKTREE `npm run build` from
`app/` exits **2** with `Cannot find module '@nputer/parser/pure'` until
`lib/parser` is both INSTALLED and BUILT. `T-117` documents the
`app/dist` prerequisite; this is the step before it, and neither is in
CONVENTIONS.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — NOW `T-130`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** **THE ID CHANGED AT `7221629` AND THE SECTION DID NOT**: the
tenth triage promoted `T-120-s3` (canonical), `T-052-s4` and item 1 of
`T-079-s3` into **`T-130`** — one finding filed three times, in the same
file, on the same fence — and **all three suggestion files that carried
it are gone**. Cite `T-130`. It is `status: building` on `[tools/e2e]`
as this is written, after leading "Next up" for **six consecutive
checkpoints**.

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
fired for **T-086, T-102, T-108 and T-116** — T-116's verifier read
`…069.9126` against `…070` and **declared both runs**, which is the
required behaviour. It did NOT fire at this merge — the body passed in
the single 171-test run, and main is not a fresh checkout. **DO NOT "FIX"
IT BY RE-RUNNING UNTIL GREEN**, and if you do run twice, DECLARE BOTH
RUNS. The fix is one token:

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

**CITE THE BODY BY NAME, NOT BY `:201`** — this checkpoint checked and the
line still resolves, but only barely, and CONVENTIONS' own rule says a
citation names a symbol. The plant-and-restore lives inside
`tools/e2e/tests/token-scan.spec.ts`'s test **"P6 reds a planted bare
motion utility and leaves its motion-safe twin alone"**, whose `test(` is
at line 201 today; the mtime assertion the failure quotes is forty lines
further down inside it. Every checkpoint that has carried this finding has
carried the line number, and a line number is what drifts.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS NINE CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
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
here (unmoved from T-091's checkpoint at this precision, though this
integration's cargo run, its REGEN and THREE graph checks all wrote into
it), and this merge's `cargo test` ran the lib suite in **4.17s**, with
the watcher body read by NAME as `ok` rather than inferred from a green
exit. **SIXTEEN runs across eight integrations and not one lands between
9.5s and 14.6s.** Read the lib suite's own time first; it tells you which
regime you are in before any assertion does.

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
THIS IS THE FOURTEENTH MEASUREMENT SAYING SO.** For a tip, run
`git worktree list`.

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-104** | `[method/, docs/CONVENTIONS.md, app-agent]` | **building** |
| **T-108** | `[docs/tasks/]` — see the correction below | **planned on main** — built at `baba41b` and queued |
| **T-126** | `[app-shell]` | **building** |
| **T-129** | `[crate-index]` | **building** |
| **T-130** | `[tools/e2e]` | **building** — dispatched DURING this integration |

**T-116's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so FIVE lanes hold
fences after it — the same count as before, because T-130's dispatch
landed while this merge was being prepared. **THE BOARD-TRUTH WINDOW IS
STILL OPEN**: T-108 reads `planned` on main while holding a worktree with
a built branch. **DERIVE THE LANE LIST FROM `git worktree list`; NEVER
READ IT OFF A BRIEF OR OFF THIS TABLE** — **five consecutive dispatch
briefs have now stated a lane list and every one was wrong**, and this
integrator's brief was wrong in a sixth way, described under "everything
the brief got wrong" below.

**`T-108`'s FENCE IS THE WHOLE `docs/tasks/` DIRECTORY, NOT THREE CARD
PATHS, AND TWO DOCUMENTS HAVE NOW SAID OTHERWISE.** The previous
checkpoint and this integrator's brief both described it as "three
specific card paths, so it collides with nothing". **The card's own
`touches:` field says `[docs/tasks/]`** — every card in the project,
including the one every checkpoint stamps. The PRACTICE is disjoint (its
branch diff is exactly four card files, none of them T-116's, measured
here rather than assumed), but **the declared fence and the practised one
are different sets**, which is this project's signpost-versus-authority
pattern in a new place. Read the field, never the summary.

**SEVEN DETACHED NON-LANE ENTRIES EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** THREE OF THEM SIT AT LANE-SHAPED PATHS —
`nputer-T-104-verify`, `nputer-T-129-verify` and `nputer-T-129-base` —
**which is exactly why the filter is on the BRANCH and never on the
path**. A lane list derived by counting rows would read FOURTEEN entries
against FIVE lanes.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge.
- **`/Users/ujju/Projects/drill-T-102-verify`, detached at `d12efac`** —
  still on disk, **outliving its verification for the fourth checkpoint
  running**. Not the integrator's to remove.
- **`drill-T-126`, `drill-T-130`** — two live lanes' own drill checkouts,
  correctly detached and correctly OUTSIDE the repository root.
- **`nputer-T-104-verify`, `nputer-T-129-verify`, `nputer-T-129-base`** —
  two lanes' verification and base checkouts, all three DETACHED and all
  three at paths that look exactly like lanes.
- **T-104's two scratch worktrees inside the shared scratch root are
  GONE** since the last checkpoint, and `nputer-T-116-verify` — which the
  previous checkpoint and this integrator's brief both discussed — **does
  not exist**: T-116's verifier removed its own. **A worktree's existence
  is a LIVE-ENVIRONMENT fact like a pid or a port holder, so this list is
  stale for you by construction.** Derive the membership; do not quote it.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** **`app-map` IS RELEASED
BY THIS CHECKPOINT.** **`tools/e2e` IS NEWLY HELD** by T-130, less than
an hour after T-091 released it. Free: `app-map`, `app-board`,
`app-dispatch`, `app-interview`, `docs/architecture/components/`,
`lib-parser`, `.github/`. **HELD: `app-shell` by T-126**, **`crate-index`
by T-129**, **`method/`, `docs/CONVENTIONS.md` and `app-agent` by
T-104**, **`tools/e2e` by T-130**, **`docs/tasks/` nominally by T-108**.

## Just completed

**T-116 — the map's one REMEMBERING layer stops describing the wrong
repository.** F-06, milestone 4, size S, `touches: [app-map]`, **fence
never widened and the ruling that kept it narrow is on the card**.
Main-before **`540ae0f`**, lane tip **`4cc4142`**, merge **`eea61e0`**,
this checkpoint after it. `builder: claude-opus-5`,
`built_by: claude-opus-5 @T-116 — code commit f59f57e`,
`verifier: claude-opus-5`,
`verified_by: claude-opus-5 @T-116-verify — APPROVED, 2026-08-25 —
verdict commit 4cc4142`, `review: same-model`.

**WHAT LANDED.** INTENT and REALITY are pure functions of a snapshot and
re-derive themselves; HISTORY is measured once, from a mount effect, into
a module-level store — so churn was the only layer of the map pane that
REMEMBERS, and **what it remembered survived a project switch that
remounts nothing**: one repository's commit counts painted onto another's
components, with nothing on screen saying so. The age the payload has
carried since T-013 now renders through the index hint's OWN
`relativeTime`, and `churn-source.ts` subscribes to C-10's shell store at
MODULE EVAL — not from the pane — because the invalidation is owed by the
STORE and a switch while the map is closed must still take effect. A
`generation` counter makes it hold under TIMING too: a `repo_churn` still
out for A is discarded rather than folded onto B, and only the current
flight may release the single-flight latch. **Ten new bodies, 17 poisons
in the lane's drill and 30 mutants in the verifier's, producer side only,
restores hash-matched between the two passes.**

### **THE VERIFICATION IS THE BEST THIS PROJECT HAS SEEN, AND ITS MECHANISM IS THE PART TO COPY**

The card was read at its **base ref** `765924d` and **a 30-attack set was
derived from the criteria and written to disk BEFORE** the lane's notes,
diff or test file were opened. The **pre-fix red reproduces exactly** —
production reverted to base, `git diff --stat 765924d -- app/src/` empty,
**7 failed / 3 passed, exit 1** — and the three restore sha256s are
**identical to the lane's**, which corroborates the lane's drill
independently rather than taking it on report.

**AND IT COMMITTED ITS VERDICT INSIDE THE LANE WORKTREE, WHICH IT NOTES
IS "the one mechanism that leaves HEAD, index and working tree consistent
everywhere."** That is the correct mechanism and **the opposite of what
two other verifiers did tonight** — three occurrences across two lanes of
repointing a shared branch ref with raw `git update-ref` from a detached
worktree, routed to `T-128` and `T-104`. **This is the good instance of a
rule this project just had to learn twice**, and the counter-example is
what makes it checkable: `task/T-116-churn-age@{0}` is an ordinary
`commit:` reflog entry, and a ref moved by hand leaves an EMPTY one. The
lane's worktree was clean when this integrator arrived.

### **SHAPE SIX: THE CLAIM IS TRUE AND THE EVIDENCE OFFERED FOR IT IS NOT**

All ten bodies DO kill a mutant no other body kills — but reproduced
faithfully, the lane's **`P8` kills THREE bodies** and **`P13` kills two**,
so **only `P15`/`P16` are unique as written**. Settling the other three
took mutants the drill did not contain and **the verifier had to design**:
`churnAvailable` made STICKY, re-measure only if a flight was already out,
and **the trigger parking on `disabled` instead of `loading`** — which is
**the criterion's own wording**, and nothing in the lane's drill aimed at
it. **A BODY'S KILL BEING UNIQUE IS A CLAIM TO BE MEASURED, NOT
ASSERTED**, and that is the standing lesson: the poison drill proves a
body RUNS, and shape six has no mechanical remedy, so it has to be ASKED
per body and answered with a mutant.

### **FOUR MORE FINDINGS THE VERIFIER CARRIED, ALL LIVE ON MAIN NOW**

1. **THE RE-MEASURE TRIGGER DOES NOT INHERIT THE SINGLE-FLIGHT LATCH,
   CONTRARY TO ITS OWN SOURCE COMMENT.** `onProjectMaybeChanged` sets
   `inFlight = null` immediately before calling `loadChurn()`, so **five
   switches spawn five `repo_churn`**. The criterion is still met in
   substance — a stampede is many concurrent asks for the SAME answer, a
   same-folder notify adds zero — and abandoning is NECESSARY, since A's
   flight must never answer as B's. **The behaviour is right and the
   stated reason is wrong**, in a comment a later reader would rely on.
   **ROUTED, NOT CORRECTED — item 3 of "Next up", with the reason.**
2. **A BROWSER-BUNDLE PROJECT SWITCH DOES REPLACE A FOLDED STATE** — it
   ends `{kind:"disabled", reason:"notTauri"}` having spawned nothing —
   which is an **undisclosed narrowing of a SHALL-BE-UNCHANGED**. The two
   criteria are in direct conflict: you cannot both drop A's entries "not
   for one paint" and preserve a folded state. **The lane resolved it the
   right way** and simply never said so; said now, here and on the card.
3. **TWO DRILL SURVIVORS, BOTH CORRECT-BUT-UNPINNED**: the generation
   guard's `.catch` half — a `repo_churn` REJECTED for A after a switch to
   B leaves the state `loading`, never `disabled/gitFailed` under B's name
   — and the changed-folder guard. **Probes confirm both WORK.** They are
   **unpinned, not broken**, and recorded so they do not read as covered.
4. **ONE OF THE SEVEN QUOTED PRE-FIX MESSAGES CANNOT BE EMITTED.** Body 4
   aborts at an earlier assertion, so the quoted line-304 message is
   unreachable pre-fix. Counts and exit reproduce exactly; one
   transcription does not, **and the dispatch brief inherited it.**

### **TWO RECORD DEFECTS LEFT AS FOUND, DELIBERATELY**

**An integrator cannot author a drill it did not run**, so both are
RECORDED rather than repaired: the notes' **"6 at the tip"** double-counts
the card — the implementation notes live inside a file the four already
contained, so **it is 5** — and **`P17` is cited in the shape-six prose
and never defined** in a poison table that stops at P16.

### **THE FIXTURE RECONCILIATION WAS FORECAST TWICE AND LANDED ON A THIRD LIST**

**This is the most reusable thing on the card.** The lane forecast it; the
verifier measured the lane's forecast wrong by one (`C-05 -> C-06` 13→14,
the very edge that produced the D1 entry the notes DID record) and then
measured a DIFFERENT list against T-033's merge; and **the list this
checkpoint derived at its own merged tree matches neither**. Every one was
right where it was measured. **A FIXTURE FORECAST CARRIES ITS TREE THE WAY
A FIGURE CARRIES ITS REF** — see the reconciliation table below.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 540ae0f 4cc4142 -> tree d5491e95…, exit 0 (read from $? FIRST)
    git diff --name-only 540ae0f <TREE>                        ->   5   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 540ae0f..eea61e0  (THE MERGE'S DIFF)  ->   5   the only one that means anything
    git diff --name-only 540ae0f...4cc4142 (branch-only, THREE) ->   5
    git diff --name-only 765924d..540ae0f  (main's advance)    ->  74
    git diff --name-only 540ae0f..4cc4142  (TWO dots, FORBIDDEN)   ->  79

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 74 PATHS — 15.80x — WHICH IS
THE WIDEST RATIO THIS PROJECT HAS RECORDED, NEARLY DOUBLE THE PREVIOUS
RECORD, AND IT IS PURE LEFT-ENDPOINT DRIFT.** Main advanced **74** under
this lane, the branch **5**, `comm -12` over the sorted lists is
**EMPTY**, the union of the two sets is **byte-identical to the forbidden
two-dot set** under `diff`, and 74 + 5 = 79 — the arithmetic that proves
them disjoint, checked as SETS and not only as counts. Ratios so far:
T-110 **7.0x**, T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086
**2.67x**, T-107 **2.25x**, T-102 **3.75x**, T-033 **1.94x**, T-091
**8.78x**, T-116 **15.80x**. The ratio is weather; **the left endpoint is
the signal** — and this merge is the extreme case of exactly that, a
five-path lane the naive range would report as having rewritten
seventy-nine files.

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`d5491e955c77c5adc5c1d3050a826209d73f15e4` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`540ae0f` and `4cc4142` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**MAIN MOVED TWICE UNDER THIS INTEGRATOR AND THE PRE-WRITE CHECK IS WHY
IT COST NOTHING — the second consecutive checkpoint to say so.** The
brief named main at `a649766`; on arrival `git diff --cached --name-only`
returned **two rows**, a live TRIAGE staging the promotion of `T-120-s3`
and `T-052-s4` into `T-130`. The checkpoint **waited**; that writer
committed `7221629`; a second hand then began `T-130`'s dispatch stamp
(`status: planned -> building`, `builder: -> claude-opus-5`) and
committed `540ae0f`. **Every figure above was derived at the new main.**
The prescribed count was 5 at all three refs and the forbidden two-dot
count moved 76 → 79, which is the whole lesson once more: **the number
that changes when main moves is the one the forbidden form reports.**
`??` lines alone are not a ceremony and there was exactly one (`z`).

## THREE standing gates — ALL THREE FIRE, all DERIVED from the merge's own 5 paths

| gate | trigger | on these 5 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **3 — FIRES** | exit **1, STALE** — regenerated into this checkpoint |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** | exit **0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **2 — FIRES** | exit **1**, **THREE** suites owed, all green |

- **GRAPH REGEN — ASKED RATHER THAN PREDICTED, AND ASKED THREE TIMES.**
  It was exit **0, CURRENT** at main `a649766` **BEFORE** the merge
  (925 217 bytes · 178 files · 1968 symbols · 1886 edges), which is worth
  recording: **this merge's staleness is attributable to T-116 alone**,
  and the `~14` main-side drift T-116's verifier saw at `8f8ec31` is gone.
  After the merge it is exit **1, genuinely STALE** and the **REAL red,
  not the `--root` false one** — it prints BOTH count sets AND a `+`/`~`
  file diff, which is the discriminator CONVENTIONS names. Regenerated
  into the CHECKPOINT to **933 486 bytes · 179 files · 1987 symbols ·
  1903 edges**, files `+1 -0 ~2`, edges `+17 -0`.
  **AND THEN T-033's TRAP FIRED HERE, LIVE — READ THIS ONE, IT IS NO
  LONGER A WARNING BUT A REPRODUCTION.** The gate was asked AGAIN after
  this checkpoint's own doc writes, and it came back **exit 1, STALE a
  SECOND time with every headline figure IDENTICAL ON BOTH SIDES**:

      committed:   933486 bytes · 179 files · 1987 symbols · 1903 edges
      fresh index: 933486 bytes · 179 files · 1987 symbols · 1903 edges
      files  +0  -0  ~2
      | ~ app/test/architecture-dogfood.test.ts  (content, loc 1755 -> 1797)
      | ~ app/test/map-dogfood-render.test.tsx   (content, loc 561 -> 569)

  **THE BYTE COUNT DID NOT MOVE AT ALL** — same number on both lines —
  because the two fixture files this checkpoint RECONCILES are themselves
  INDEXED, and reconciling them moved only their `loc`. **A checkpoint
  that regenerates once and confirms by byte count ships a stale graph
  with no figure capable of showing it**, and this is the second
  consecutive integration to demonstrate it rather than quote it. A
  second regen made it exit **0, CURRENT** at the same four headline
  figures. **ASK THE GATE AGAIN AFTER YOUR DOC WRITES; do not confirm a
  regen by its size.** The three governing documents are safe here and
  that is DERIVED rather than assumed: `docs/` is `.nputerignore`d, so
  only the two `app/test/**` fixtures could ever feed back.
- **BOOT GATE — 2 of 5, OWED AND RUN.** Scratch port **15312**,
  `lsof`-read first (zero rows) and free again after: exit **0**, both
  lines — `[nputer] project folder: /Users/ujju/Projects/nputer` and
  `[nputer] window "main" created`.
- **DOCS GATE — exit 1, FIRES on 2 of 5, THREE suites**: `npm test from
  app/`, `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is NOT owed and that is DERIVED** —
  this diff carries no `docs/architecture/components/` file and does not
  touch `docs/CONVENTIONS.md`. Invoked DIRECTLY from the repo root with
  the RANGE RULE's own path list, **never through `xargs`**;
  `merge-tree`'s exit was read into a variable BEFORE the substitution.
  **13 derived readers across 4 suites** — the verifier saw 12, and the
  thirteenth is `range-rule.spec.ts`, which T-091's merge added, so the
  census moved under the verification exactly as CONVENTIONS says it will.
  Census **130 sites in 22 files**, **0 frontmatter issues**, and
  `npm run lint:docs` (the whole-tree half, CI's step) is exit **0**.

## The fixture reconciliation, DERIVED AT THIS MERGED TREE

**Neither earlier list was used, on the verifier's own instruction.**
Seven values in four bodies across two files, plus one body title:

| assertion | from | to |
|---|---|---|
| `architecture-dogfood` · `fileComponent.size` | 178 | **179** |
| `architecture-dogfood` · the C-05 tally row | 62 | **63** |
| relation table · `C-05 -> C-06` | 13 | **14** |
| relation table · `C-05 -> C-10` | 38 | **39** |
| relation table · `C-05 -> C-12` | 33 | **35** |
| relation table · `C-12 -> C-10` | 1 | **2** |
| `architecture-dogfood` · the T-009 seam body | 13 | **14** |
| `map-dogfood-render` · the header hint | 178 files | **179 files** |

The table stays **36 rows at 26 confirmed / 1 undeclared / 9 planned** —
no row added, removed or flipped. **The D1 findings body does not move at
all**, because T-033 took `C-05 -> C-06` from `undeclared` to `confirmed`
and the evidence list the lane appended to no longer holds that edge.
**The parser pin is NOT owed** — no component file changed. **Nothing was
loosened**: every value moved to a new exact figure.

**THE C-05 TALLY ROW IS THE ONE NOBODY FORECAST, THREE REFS RUNNING.** It
is the THIRD assertion in its body, below the size check, so vitest never
reaches it while that one is red — and the fixture's own comment says in
as many words to derive it from the indexed added-file list and never off
the failure output. That is how it was taken.

**`C-05 -> C-12` HAS NOW BEEN FORECAST THREE TIMES AND LANDED ON A FOURTH
PAIR OF NUMBERS**: the lane said 32 → 34 at a tree without T-033, the
verifier said 32 → 35 against T-033's MERGE, and after T-033's CHECKPOINT
the baseline on main is 33, so it is **33 → 35** here.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **4.17s**. **Unchanged from
  main's 460**, which is the honest reading: this merge contains **zero
  `.rs` files**. Run although the DOCS GATE did not owe it, on integrator
  step 2.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build`
  from lib/parser/, which was run FIRST regardless (top of this file).
- **app: `npm run build` exit 0** · **`npm test` 972/972 across 47 files,
  exit 0**. Main was **962/46**; the delta is this card's ten bodies in
  one new file. **Derived, not matched against the brief.** The
  reconciliation above was an INTERMEDIATE red — four bodies, all of them
  fixture values against a freshly regenerated graph — and 18/18 after.
- **E2E: 171/171, exit 0**, on scratch port **15311** — and **THREE runs
  ARE DECLARED, because the rule is to declare every run and one of mine
  did not finish.** Run 1 (post-merge, pre-doc-writes): **171/171, exit
  0, 1.9m**. Run 2 (post-doc-writes): **KILLED BY THIS INTEGRATOR'S OWN
  COMMAND TIMEOUT at test 51 of 171** — not a suite result, not a red, and
  recorded because an interrupted run is not a green one; it left **no
  orphaned listener** (`lsof` on 15311 read zero rows immediately after).
  Run 3 (post-doc-writes, the one the checkpoint owes): **171/171, exit 0,
  3.9m**. The mtime body passed in every run that reached it.
  **ONE BODY IS LOAD-SENSITIVE AND IT IS WORTH A LINE**:
  `docs-input-gate.spec.ts`'s *"the hand-run gate's exit codes hold, and
  an EMPTY path list is 2 and not 0"* ran **12.6s / 1.4m / 27.8s** across
  the three runs on the same tree, and the whole suite went 1.9m → 3.9m.
  It spawns a process per exit code and it has no deadline, so it is slow
  rather than flaky — but five lanes were building against this machine,
  and a body that takes 6.7x longer under load is the shape that becomes
  an intermittent the day somebody gives it a timeout.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0**, and
  **`npm run lint:tokens` exit 0** at **TOKEN 135 / CONTROL 721**. Both
  moved by exactly ONE and both are exactly derivable: the single new
  tracked file `app/test/map-churn-age.test.tsx` is both a TOKEN-root file
  and a CONTROL file. **DERIVE IT AT YOUR OWN REF; it is not a constant.**
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`.
- **THE SUITES THE CHECKPOINT ITSELF OWES RAN AGAIN AFTER ITS DOC WRITES**
  (T-081-s9), and this checkpoint writes `docs/ROADMAP.md`,
  `docs/ARCHITECTURE.md`, `docs/STATE.md` and one `docs/tasks/T-*.md` —
  all four of which the census names as code inputs.

## The board, derived from disk at this checkpoint

**250 flat task files — 90 done / 35 planned / 41 parked / 80 suggested /
0 verifying / 4 building; 26 in `rejected/`.**
90 + 35 + 41 + 80 + 0 + 4 = 250. T-116's stamp moves done from 89 to 90
and verifying from 1 to 0.

**THE SUGGESTION BACKLOG IS EIGHTY AND THE LAST TRIAGE WAS THE TENTH**,
which ran DURING this integration and is why the number went DOWN despite
this merge adding one: the promotion of `T-120-s3` + `T-052-s4` into
`T-130` removed two files, and `T-116-s1` added one. **`T-116-s1` IS NOT
TRIAGED HERE:** disposition belongs to a triage pass, not to an integrator
(T-083's ruling), so it stays `status: suggested` exactly as filed. It is
worth reading — the pane now says "how long ago" in TWO vocabularies at
once, `relativeTime` in the footer and `churnAge` in the panel,
disagreeing at every interval under a minute AND taking opposite
positions on the same zero sentinel (`just now` / `unknown` / render
nothing — three modules, three answers). The lane filed rather than fixed
it because both files were in T-033's approved eight-path set; **that
reason has now expired, and `app-map` is free.**

## Documents ticked

- **ROADMAP — F-06's bullet gains the T-116 paragraph**, and unlike
  T-091's this one IS map content: the pane's only remembering layer, the
  two properties the other two sources get for free, and the three honest
  residuals (the lazy narrowing, the latch the comment misdescribes, the
  browser-bundle folded state).
- **ARCHITECTURE — the map's THIRD DATA SOURCE bullet gains the
  architectural half**, which is not the feature: **a source that
  REMEMBERS must say when it measured and must be told when to forget**,
  because nothing derives either property for it the way a snapshot
  derives them for INTENT and REALITY. It records the module-eval
  subscription, why the direction is C-12 → C-10 rather than a prop
  through C-05, and that the new edge is **confirmed rather than drift**
  because C-12 already declares C-10.
- **ARCHITECTURE — C-07's byte figure is RE-STAMPED rather than left to
  rot**, which is the previous checkpoint's own standing item 16 finally
  discharged: **933 486 bytes — 93.35%, 66 514 bytes of headroom**, and
  this merge spends **8 269** of it on ONE new indexed file. The sentence
  still says DERIVE IT AT YOUR OWN REF, because it will be stale again at
  the next regen.
- **The components table and the derived slug block were NOT touched, and
  that was CHECKED rather than assumed.** Every component's
  `touch_slugs:` was re-read off disk and the block matches it exactly
  (`app-shell -> C-05, C-10, C-11, C-16`; `app-board -> C-08, C-09,
  C-11`; `app-map -> C-12`). This merge declares no component, so the
  registry did not move.
- **NO NEW ADR, and that is derived rather than skipped.** The
  non-obvious decisions on this card — module scope over a mount effect,
  the lazy narrowing, invalidation beating preservation in the browser
  branch — were made by the LANE and ruled on by the VERIFIER, and they
  are recorded on the card and above. Nothing supersedes ADR-001–017.
- **CONVENTIONS — NOT TOUCHED, and not by choice: T-104 holds it.** THREE
  edits are now routed there, one of them inherited (see Next up).
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an
  `## Integration` section, and **the lane's notes and the verdict are
  preserved byte-untouched**. The DRAFTER'S NOTE was already replaced by
  the architect's fence ruling in the lane's own dispatch commit.

## Provenance — SELF-DECLARED, never read off a trailer

T-116 is **built by `claude-opus-5` and verified by `claude-opus-5`**, and
integrated by a third hand that did neither. **`review: same-model` IS NOT
A WEAKER VERDICT HERE, and T-104's ruling SEVEN is why**: the independence
that pays is INFORMATIONAL, not model diversity — and this pass is the
clearest worked example the project has, because the verifier derived and
WROTE TO DISK a 30-attack set from the card at its BASE REF before opening
the lane's notes, diff or test file (@human's T-121 ruling, arm 2). **The
`Co-Authored-By` trailer on this lane's commits is a harness constant and
is NOT evidence of a model** — T-085 proved it and T-101 sharpened it.

**90 done cards — 67 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 67 + 17 + 5 + 1 = 90. T-116 moves `same-model` from 66
to 67.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, read at **17:40:59** BEFORE the merge,
at **18:03:35** immediately after the merge's WORKING-TREE WRITE, and
again at **18:12:48** after the boot gate and every suite; the app binary
is pid **89201**, started **2026-08-25 10:54:33**, unchanged throughout,
read with the **anchored** match
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**THIS MERGE'S DIFF IS INSIDE THE RELOAD TRIGGER SET AND OUTSIDE THE
RELAUNCH ONE, AND THE TWO ARE DIFFERENT SETS.** Two of the five paths are
under `app/src/**`, which goes to **vite HMR — the window is never
replaced**; **zero** are under `app/src-tauri/**`, which is what
rebuilds and RELAUNCHES the binary. **No relaunch was predicted and none
happened**, confirmed by the unchanged pid and start time rather than by
argument. **AND NOTHING FROM THIS MERGE COULD REACH THE APP'S CODE
ANYWAY**: the window serves from `/Users/ujju/Projects/nputer-app`,
detached at `c4cfe52`, so its `app/src` cannot move when main does. Both
facts are stated because a checkpoint that conflates the two trigger sets
reports a restart that never happened as readily as it misses one that
did.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: all three `node_modules` trees, both `dist/` directories and
`target/` were already present, each checked individually, so **no fresh
dependency install was owed and no `npm ci` was run.** Had one been owed,
the CHECKOUT test decides — and it was run rather than reasoned:
`lsof -p 88948` reports the holder's cwd as
`/Users/ujju/Projects/nputer-app/app`, a DIFFERENT checkout, so it would
have been permitted rather than refused. That is `integrator.md` rule 1
applied rather than CONVENTIONS' DETECT AND REFUSE paragraph quoted;
those two are still different facts and the repair is still item 5 below,
**unwritten after SEVEN consecutive merges performed it by hand.**

**THIS MERGE DID REBUILD A DEPENDENCY ARTIFACT — `integrator.md` RULE 2's
EXACT CHANNEL — AND THE CHANNEL IS CLOSED BY MEASUREMENT RATHER THAN BY
ASSUMPTION.** `npm run build` from `lib/parser/` was run first on
principle, and `lib/parser/dist` is what the running vite serves through a
symlink. **It cannot reach the app today**: both `@nputer/parser` symlinks
are **RELATIVE** (`../../../lib/parser`), re-read here rather than
inherited, so each resolves inside its OWN checkout, and
`/Users/ujju/Projects/nputer-app` has its own `lib/parser/dist`. **Read
that as a property of the second checkout, not of this merge.**

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, one new
suggestion file — land in the watched folder live.

**No process from this integration survives.** Scratch ports **15311**
(e2e) and **15312** (boot check) were `lsof`-read FIRST (zero rows), then
bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` with a probe
this session **wrote itself** into **its own named scratch directory**
rather than trusting one by name out of the shared scratch root — the
standing fix, and the hazard is not theoretical: T-091's verification lost
a file to it. **15311 was free again afterwards; 15312 WAS NOT, AND IT IS
NOT THIS INTEGRATION'S PROCESS.** The boot check reported
`process tree stopped (exit=null signal=SIGTERM)` and `lsof` read **zero
rows** on 15312 at 18:12:48 — and at 19:01:01 the same port carries a
`node` LISTENER (pid **45273**) with seven `chrome-headless` connections,
which is a PLAYWRIGHT lane and not a `tauri dev`. **Another lane took the
port after this one released it.** It is left strictly alone — not
`pkill`ed, not connected to — and it is named here because it is the
first observed SCRATCH-PORT collision on this project: with five lanes
live, `lsof`-then-bind-probe proves a port is free NOW and nothing
reserves it. Read the port before you use it, and do not assume a port you
released is still yours. **No `pkill`. No
`npm ci`. No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test`, its graph REGEN and THREE `index --check` runs
all WROTE to main's `app/src-tauri/target/`, which reads **3.0 GB**, as
any cargo run must. No sibling worktree was entered or modified. **The
untracked zero-byte file `z`** (dated 2026-08-23) still sits in the main
checkout — not this integrator's, not this merge's, not staged, **left
alone for the nineteenth checkpoint running**. No path was staged by
wildcard; `git add -A` was never used, and the write used
`git commit -- <paths>` so it could not sweep another hand's index.

## In progress / broken right now

**NOTHING IS BROKEN.** FIVE lanes hold fences — **T-104**, **T-108**,
**T-126**, **T-129** and **T-130** — and **`T-108` IS BUILT AT `baba41b`
AND QUEUED FOR INTEGRATION**, which makes it the next thing to land.
**`T-130` WAS DISPATCHED DURING THIS INTEGRATION** and takes `tools/e2e`
less than an hour after T-091 released it.

**`app-map` IS FREE FOR THE FIRST TIME SINCE T-033 WAS DISPATCHED**, and
three separate items now want it: `T-116-s1` (the two vocabularies), the
comment correction in item 3 below, and the two unpinned guards in item 4.
All three are small and all three are in one file each.

## Next up

1. **`T-108` IS BUILT AND QUEUED.** Land it next. **Read its fence off
   the card rather than off a summary**: `touches:` is `[docs/tasks/]`,
   the whole directory, even though its branch diff is four card files.
2. **`T-130` IS BUILDING** — the intermittent that cost four separate
   lanes tonight. One token of code, `[tools/e2e]`, and the reproduction
   is on-demand in any worktree since T-052. It led this list for six
   checkpoints and is finally DISPATCHED rather than pending.
3. **THE FALSE COMMENT IN `churn-source.ts`, ROUTED RATHER THAN
   CORRECTED, AND THE REASON IS THE POINT.** `onProjectMaybeChanged`'s
   doc comment ends *"goes through `loadChurn`, so it inherits the
   single-flight latch rather than bypassing it"*. It does not — the
   function nulls `inFlight` on the line before, and five switches spawn
   five `repo_churn`. **A comment that claims more than the code does is
   this project's third-most-common defect class**, so it wants an owner.
   **This checkpoint did NOT take it**, and not because of blast radius —
   it is a comment, zero behaviour: **an integrator does not edit a
   production diff a verifier approved.** Main would then carry a byte the
   verdict does not name, which is the same objection that makes the
   checkpoint a separate commit from the merge. `[app-map]`, free now, one
   line. The honest replacement is the verifier's own sentence:
   *abandoning the previous flight is necessary, because A's flight must
   never answer as B's.*
4. **THE TWO UNPINNED GUARDS IN `map-churn-age.test.tsx`** — the
   generation guard's `.catch` half and the changed-folder guard. Both
   are CORRECT and both survive the drill, which means the file whose
   whole subject is that machinery does not hold two of its properties.
   Probes exist in the verdict. `[app-map]`, free now.
5. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — SEVENTH CONSECUTIVE
   INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT DOWN.**
   CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
   — `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into**, which is exactly what this checkpoint ran.
   Fence `[docs/CONVENTIONS.md]`, **held by T-104**.
6. **THREE CONVENTIONS EDITS ARE ROUTED TO T-104 AND NONE HAS BEEN
   TAKEN.** (a) `T-091-s3`: one clause naming GRAPH REGEN's TRIGGER
   beside the ref its flip figures carry. (b) The `bdada11` sharpening:
   `merge-tree --write-tree` exits 1 and **still prints a tree oid on line
   1**, so *"EMPTY forecast"* understates the costume — re-confirmed here,
   where the exit was read into a variable BEFORE the substitution for
   exactly that reason. (c) `T-079-s3` items 2–3, which the tenth triage
   left behind when it folded item 1 into `T-130`. **T-104 can take all
   three without widening its fence.**
7. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` returns zero
   rows. Every integrator does it — this one included, and it matched the
   merge's tree byte for byte again — and no governing file asks for it.
   Fence is `method/`, **held by T-104**.
8. **`T-127` — THE SURVIVING CYCLE.** `planned`, `blocked_by: [T-033]`
   cleared. Fence `[crate-index, docs/architecture/components/]`;
   **`crate-index` is held by T-129**.
9. **`T-125` IS FULLY BLOCKED AGAIN.** `[app-agent, app-shell,
   docs/architecture/components/]` takes the last undeclared row,
   `C-10 → C-14` — but `app-agent` is held by T-104 and `app-shell` by
   T-126.
10. **`T-033-s11` — THE TWO ENGINES DISAGREE ABOUT `non_code`**, live and
    visible: `arch` says `drift_components=3`, TypeScript says 1.
    `arch drift --fail-on any` cannot go green even after T-125. Rides
    `[crate-index]`, **held by T-129**.
11. **`T-128` — SILENT CORRUPTIONS OF SHARED STATE**, `planned`, fence
    `[method/, docs/CONVENTIONS.md]`, **held by T-104**. This checkpoint
    adds a SECOND negative data point: T-116's verifier committed in the
    lane and left a clean worktree, and said in writing why that is the
    only mechanism that leaves HEAD, index and working tree consistent.
    Two clean instances now, against three corrupt ones.
12. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND**, for **T-104**'s
    owed v0.1.6 method bump. The debt is per-VERSION, so one three-file
    commit discharges T-089's, T-124's, T-052's, T-102's, T-033's,
    T-091's and this checkpoint's residual together. **The third file is
    Rust** (`METHOD_SNAPSHOT_VERSION` in `kit.rs`) — and T-104's fence
    includes `app-agent`, so **T-104 is the first lane in seven that CAN
    pay it.**
13. **THE BOARD-TRUTH RULING** — ELEVENTH ask. T-108 reads `planned` on
    main while holding a built worktree. It wants a ruling, not a twelfth
    observation.
14. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body. Fence `[app-agent]`, **held by
    T-104**.
15. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
    BOUND AT ALL**, while the same field on the denial path is capped at
    128 bytes and stripped. Fence `[app-agent]`, **held by T-104**.
16. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN.** The body exists,
    ready to paste, measured green then red twice by two independent
    passes. It needs `app/test/**`, which is C-05 `app-shell` — **held by
    T-126.** Read it beside **`T-110-s9`**.
17. **THE SUGGESTION BACKLOG IS EIGHTY AND WANTS AN ELEVENTH TRIAGE.**
    T-033 added eleven, T-091 six and T-116 one; `T-033-s1`…`s11`,
    `T-091-s1`…`s6` and `T-116-s1` are untriaged.
18. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint.**
19. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged).
20. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint returns.**

1. **Main was `a649766` in the brief and moved TWICE before the merge** —
   `7221629`, then `540ae0f`. The brief said it would; it is listed here
   because the two writers were a TRIAGE and a DISPATCH, neither of which
   a range figure predicts.
2. **`T-120-s3` no longer exists**, so the brief's instruction to carry
   STATE's section for it by that id would have shipped a dangling
   citation to a removed file. It is `T-130`.
3. **`T-108`'s fence is `[docs/tasks/]`, not "three specific card
   paths"** — the brief and the previous checkpoint both said the latter.
   The practice is disjoint; the declared fence is not.
4. **`tools/e2e` is no longer free**, which the brief could not have
   known: T-130 took it during this integration.
5. **The reference figures were right and one was already stale**: main's
   app suite was 962 and this merge is 972; `lint:tokens` was TOKEN 134 /
   CONTROL 720 and is now 135 / 721. Both were labelled as sanity checks
   and both behaved as such.
6. **The brief's reconciliation warning was correct and INCOMPLETE.** It
   said to derive rather than take either list, and that was right — but
   it named the merged-tree list as `C-05→C-12` **35** with a baseline of
   34/32. At this merged tree the baseline is **33**, and the C-05 TALLY
   ROW (62 → 63) appears in no forecast at all. **Three refs, three
   lists, and the one nobody predicted is the one hiding behind a red
   assertion two lines above it.**
