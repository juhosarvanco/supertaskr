# State

Updated: 2026-08-17 by integrator (T-034 merge), claude-opus-5 @fresh

## Just completed
T-034 (map tasks lens — dependency waves, critical path, the pane's
second lens; `app-map`, M, milestone 4, F-06) done and merged. Built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. Five criteria, absorbs
T-012-s1, fifteen files.

**WHAT SHIPPED.** The map pane header gains a **lens segmented control
(architecture · tasks)**, working both directions and
session-ephemeral (`useState`, the T-012 overlay precedent) until T-022.
On the tasks lens the pane lays the board's cards out in **dependency
waves** peeled with Kahn, and when peeling stalls every remaining task
in an SCC of size ≥ 2 is **released as one wave** so cycle members share
a row and their downstream keeps its own — cycle edges are still DRAWN
(dashed, `data-tangled`), never dropped. Three new source files, all
pure TS except the view: `task-waves.ts` (the whole model — no React, no
IO), `TasksLens.tsx`, `map-lens.ts`.

**THE CRITICAL PATH IS THE LONGEST CHAIN, NOT THE MOST-BLOCKING ONE,
and the argument is the part worth carrying.** It is CPM's reading —
the longest chain of tasks linked by `blocked_by`, tie-broken by
most-not-done then lexicographically. The alternative (most-blocking)
was rejected because **the strip's middle cell IS that measurement**:
*worst blocker* is the neighbouring cell, so defining both the same way
would make the pane answer one question twice and "how deep is this"
never. "Critical path" is also a term of art, and using it for anything
else misleads every reader who knows it. **The verifier UPHELD the
reasoning** and checked the two readings genuinely differ on a
hand-built fixture (`T-100` holds 4 while a separate 4-chain wins the
path, both asserted in one test body).

**ON THIS REPO'S LIVE GRAPH** the lens reads **50 cards drawn**, waves
**0:32 · 1:7 · 2:3 · 3:6 · 4:2**, critical path
**T-018 → T-026 → T-025 → T-027 → T-028**, worst blocker **T-027**,
**13 ready**, blocked **T-028 and T-029**. Every number reproduced
independently by the verifier.

**THE ARCHITECTURE LENS IS BYTE-UNCHANGED, PROVEN THE HARD WAY** and
this is the strongest evidence in the task. Both revisions were rendered
in ONE jsdom on the same fixture: `map-canvas`, `map-legend`,
`map-overlay-control`, `map-search`, `map-reindex` and `map-degraded`
are **byte-for-byte identical**; `map-view` differs by **exactly 472
bytes**; and **the branch's `map-view` with the `map-lens-control`
element excised is byte-identical to main's**. Re-derived from scratch
by the verifier, not inherited. The six existing map suites are green BY
NAME at 0 bytes changed (`map-layout` 26, `map-visuals` 39, `map-search`
7, `map-view-dom` 25, `map-shell-dom` 4, `map-dogfood-render` 8).

### THE CONTROL-BYTE STORY, told with the correction that matters —
### and it grew again at this merge

The builder swept its own diff with `file(1)` (a habit, not a required
step) and found `task-waves.ts` classified as **data**: it carried **two
literal NUL bytes** in the template literals keying the critical-path
edge set. It compiled, bundled, typechecked and passed 586 tests. The
sweep then found a **pre-existing instance on main** — `map-layout.ts`'s
`layoutKey` writing its third separator as a literal **U+0003** beside
two correct escapes (T-012 shipped it). Both fixed as escapes with
**behaviour-identity PROVEN, not asserted**: both source forms evaluate
to codepoints **[67, 3, 69]**. A standing gate was added that walks
every file under `app/src/architecture/` and fails on any literal C0
control (tab/LF/CR excepted), reporting codepoint and offset.

**THE INVISIBILITY CLAIM WAS REFUTED FOR TWO OF THE THREE MECHANISMS IT
NAMED, and that correction stands.** Planting a raw-HTML sink AND a NUL
in the same file: the **no-innerHTML gate caught it**; **`lint:tokens`
caught** planted arbitrary values in the same NUL-carrying file; and
**`ci.yml` contains ZERO greps**. There is not one shell-`grep`-based
gate in this repository — every gate reads through Node
`readFileSync(…, "utf8")`, where a NUL is inert. **The real hazard is
binary-skipping SEARCHERS**, which is the mode agent tooling searches
in — serious for a method whose review layer is agents reading a repo,
but aimed at the auditors, not the gates. Filed as **T-034-s6**, which
also records that **the verifier reproduced the same mechanism three
more times while writing s6 itself — six instances inside one task's
blast radius**, caught only by scanning its own output before
committing.

**THIS MERGE ADDS THREE THINGS TO THAT STORY. Read them before ranking
s5.**

1. **THERE IS A LIVE INSTANCE ON MAIN RIGHT NOW, AND IT IS NOT
   T-034'S.** `app/test/startup-screen.test.tsx` — **T-050's file**,
   commit `e50fc1e` — carries **NUL + BEL + ESC at byte offsets
   2751–2753 and again at 9508–9510**, inside its `HOSTILE` fixture
   constant. `file(1)` calls that source **data**. It is the exact
   pattern T-034 fixed in its own test file (and whose fix is known:
   build the C0 characters with `String.fromCharCode(…)` so the VALUE
   carries them while the SOURCE stays text). **Nothing in the repo
   catches it**: T-034's new gate walks `app/src/architecture/` only,
   and `lint:tokens` reads through Node where a NUL is inert. **The
   verifier's 446-file sweep could not have seen it** — the branch is
   off `6ed97cf` and T-050 landed on main afterwards, so this instance
   only exists on the MERGED tree. **This is s5's premise stopping
   being theoretical**, and it is the single most useful thing this
   merge found. **DELIBERATELY NOT FIXED HERE**: the file is outside
   T-034's fence and is T-050's territory, and an unreviewed integrator
   edit to another task's fixture is exactly what the house warns
   against. It wants ranking with s5, and it is a ~2-line fix.
2. **CORRECTION 1 IS RIGHT ABOUT THE TOOL IT NAMED AND WRONG ABOUT THE
   TOOL A DEVELOPER ACTUALLY RUNS HERE.** Measured on that real file:
   `/usr/bin/grep` (BSD grep 2.6.0-FreeBSD) behaves exactly as the
   verdict says — `-q` **exit 0**, `-l` lists the file, `-n` prints
   `Binary file … matches` with **no line text**. But **`grep` on this
   machine's PATH is `ugrep` 7.5.0**, and it returns **exit 1 for EVERY
   pattern in that file** — `describe`, `import`, `container`,
   `HOSTILE`, patterns before and after the NUL alike — and only `-a`
   makes it match (3 hits). **So on this machine a shell-`grep` gate IS
   blinded**, which is the half Correction 1 rules out. `rg` recursive
   over `app/test/` exits 0 and **silently omits the match entirely**.
   The conclusion to carry: *whether a grep-shaped gate survives a NUL
   depends on which `grep` is on PATH*, and that is not a property any
   gate can assert about itself.
3. **THE MECHANISM FIRED ON THIS INTEGRATOR TOO, twice, while
   investigating it.** Writing a backslash-u escape into a tool-authored
   file landed the CHARACTER instead of the six-character ESCAPE — the
   builder's exact description — and one attempt was refused outright by
   the tool layer for "control characters that would be hidden". That
   makes **eight reproductions inside one task's blast radius across
   three sessions**. The habit that catches it every time is cheap and
   is now three-for-three: **sweep your own output with `file(1)` (or a
   byte scan) before committing.**

**T-034-s7** — T-032's criterion specifies joining `layoutKey` with
U+0003 and **reads as an instruction to type the byte**, which is how
this got into the tree the first time. It wants amending to say "the
escape" **before anyone builds T-032**. The verifier ruled it does not
STRICTLY need amending (it constrains the divider's VALUE, and the
escape produces that value) — but the wording is the causal path.

### The rest of the findings

- **T-034-s1 is the urgent one for the human.** Wave 0 holds **32 of 50
  cards** on this repo — a **1440×3818 canvas in a ~600px pane**. The
  open question is **whether the lens is USEFUL here, not whether it is
  correct**. Reads with T-048-s2, whose two-class fix covers both
  lenses.
- **T-034-s2** — a blocked card can point at nothing on screen: parked
  and suggested blockers are not drawn but still resolve as blockers.
  **Latent**: verified that no drawn task currently has an undrawn
  blocker (9 parked, 27 suggested at the time). A trap, correctly filed.
- **T-034-s3** — `lens` is the fourth member of the T-022 view-state
  seam, alongside `overlay` and the two viewports.
- **T-034-s4** — the two design screens put the lens control in two
  different places. A genuine design fork the builder resolved (one home
  for both lenses, the header's left group) and wrote down. **@human.**
- **T-034-s5** — lift the C0 gate into `lint:tokens`, where it covers
  the whole tree instead of one pane. **Conclusion VALID; its premise
  needs s6's correction** (the reason is that the tree must stay
  SEARCHABLE, not that the gates are blind — they are not). **And
  finding 1 above is the live instance that makes it concrete.**
- **A NON-DEFECT, measured and worth not re-discovering:** `criticalPath`
  is roughly **quadratic** in task count (200→36ms, 400→141ms,
  800→536ms; a synthetic 1800-task / 53k-edge graph takes **2.7s**). At
  this repo's 50 tasks it is **sub-millisecond**, and "never hang"
  holds. Not filed as a defect; filed here so nobody measures it twice.

**THE DESIGN-VALUE EXTRACTION, and the one deviation worth arguing
about.** Every value was read from the design bundle's source text per
the T-006 protocol, with each deviation disclosed in a 33-row table.
The terracotta is the argument: the design uses **two** terracottas
(`#c96a4f` for the critical-path stroke, `#d4694b` for the blocked
ghost's dashed border and the worst blocker's solid one), neither is a
token, and the task forbids new ones. **`--status-rejected-meta`
(#9d4430) is the nearest step to BOTH**, so the two collapse into one
token and the chain reads as one thing. **The verifier's Correction 4
matters here**: the margin over `--destructive` on #d4694b is only
**1.42 units** (71.58 vs 73.00) — effectively a tie, **decided by the
SEMANTIC argument, not the arithmetic** (`--destructive` would say
*danger*; the critical path is not danger, it is the chain that holds
the release). The table reads like a clear win and it is not one.

## Overnight grants — SECOND autonomous run (human, 2026-08-17 night)
Given via question card while awake, before sleeping. Standing until
revoked:
1. **MILESTONE 3 TO COMPLETION.** Review + apply T-027's planning pass,
   dispatch its build, then T-028 and T-029 as they unblock —
   INCLUDING sequencing T-042 first if the planning pass concludes it
   must land before T-027. **T-042 was so sequenced and is in
   VERIFICATION now; T-027 dispatches after it merges.**
2. **THREE MILESTONE-4 LANES IN PARALLEL**, all disjoint from T-027's
   app-interview + app-shell: **T-030** (parser strictness, lib-parser),
   **T-045** (the gates cover the rules, tools/e2e), **T-034** (map
   tasks lens, app-map). **ALL THREE ARE NOW DONE AND MERGED — T-034 is
   this checkpoint, and it closes grant 2 entirely.**
3. **THIRD TRIAGE APPLIED** — read-only analyst drafts, architect
   reviews and applies. Docs-only, reversible, one diff to read.
   Tasks NEWLY CREATED by triage still do NOT dispatch without the
   human.
UNCHANGED by this grant: a second REJECTED on any task parks that lane
for the human; @human judgments are never self-answered; no screen
control beyond the ruled boot check; port 1420 is the human's.

## In progress / broken right now
**TWO TASKS ARE `building`** (the parser re-parse confirms the count —
it was three before this merge), both in their own worktrees, both
disjoint from each other and from this merge, and **both in
VERIFICATION**:
- **T-042** — genesis switch truthfulness, worktree `../nputer-t042`
  (`docs_watch.rs` + `watcher-store.ts`). **Sequenced AHEAD of T-027
  under grant 1** — its criterion 4 decides where the docs change log
  lives and T-027 is the second consumer. **T-027 dispatches after
  T-042 merges.**
- **T-014** — `nputer index --check` binary, worktree `../nputer-t014`
  (`crates/nputer-index/`). It matters here for one specific reason:
  **it is the named retirement trigger for the T-009-s1 interim regen
  rule this checkpoint just exercised for the twenty-third time.**

Neither worktree was entered by this merge. The only cross-lane reads
were of git REFS from the main checkout, which is read-only.

**T-030-s3 HAS RUN OUT OF ROAD, and this is the one scheduling fact to
carry.** It says `blocked_by` edges can silently RE-POINT when an
unpadded sibling id appears, and the previous checkpoint ranked it
"against T-034's clock" because T-034 was building waves over exactly
those edges. **T-034 has now SHIPPED.** The waves, the critical path and
the worst blocker are all computed from `blocked_by`, so a silently
re-pointing edge is no longer a latent parser bug — it is **a wrong
picture in a pane the human is about to look at**. It stays the
CORRECTNESS-OF-RECORD item with a deadline, and the deadline has passed
rather than lifted.

## THE MERGE ITSELF — what an integrator did and proved

**THE MERGE WAS CLEAN AND THE OVERLAP WAS PROVED, not assumed.** Merge
commit **`c501254`**, merge-base **`6ed97cf`**, main at **`8857e7c`**,
fifteen files. Both changed sets were enumerated and `comm -12` is
**EXACTLY ZERO FILES** (15 branch files against 48 main-side files) —
the first genuinely disjoint merge in this run. `git merge-tree
--write-tree` was run FIRST and answered a single tree with zero
conflict markers; **the merged tree hash reproduced that prediction
exactly — `41e874e78097327d551da5f1a44b8a78d6e489e5`.**

**THE `<main-before>..HEAD` RULE WAS USED, AND THE TRAP IT AVOIDS WAS
REPRODUCED ON PURPOSE.** T-045's checkpoint filed an open question
because the CONVENTIONS bullets say "any merge whose diff" without
naming WHICH diff. Measured here rather than taken on faith: restricting
**`6ed97cf..HEAD`** (merge-base) to the BOOT GATE limbs returns SEVEN
files — including `app/src/App.tsx` and `app/src/lib/watcher-store.ts`,
which are **T-050's, commit `371c65b`, already on main and already
boot-gated at their own merge**. Restricting **`8857e7c..HEAD`** (what
this merge ADDS) returns the correct **five**, all under
`app/src/architecture/`. **Both derivations FIRE here**, so nothing
hinged on it this time — which is exactly why it was worth measuring
now rather than at the merge where it does hinge. **Three integrators
have now hit this; the fix is one clause naming `<main-before>..HEAD`.**

**BOOT GATE (T-046): FIRED, RAN, GREEN.** The trigger is a diff touching
`app/src-tauri/**`, `app/src/**` or either manifest; this merge's diff
carries five files under `app/src/**`, so the gate binds. Scratch port
**14570**, chosen after probing 14570–14573 free and deliberately
avoiding 1420, the lane default 14520, the builder's 14534/14535, the
verifier's 14561 and T-045's merge port 14555. Run **unpiped, redirected
to a file, with the exit code taken from `$?`**:

    [boot-check] port 14570 free — spawning `npm run tauri dev -- --config {…}`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` lines.** After it: `lsof` on 14570 **empty**,
`pgrep -fl tauri-boot-check` **empty**. `pgrep -fl "tauri dev"` DOES
return three pids (64056/64058/64073) and **they are not strays** —
`ps` puts their start time at **01:01:22**, over two hours before this
session began at 03:13, and they are the human's own app tree whose
vite child holds 1420. Checked rather than assumed, because "no strays"
read off a bare `pgrep` would have been wrong.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order. **Every expectation was DERIVED rather than
trusted, and all four landed:**
- lib/parser `npm ci` (0 vulnerabilities) + `npm run build` clean +
  `npx tsc --noEmit` clean + `npx vitest run` **197/197 (10 files)** —
  unmoved, as a branch with zero parser bytes must be.
- app `npm install` (0 vulnerabilities), `npx tsc --noEmit` clean,
  `npm run build` exit 0 (**256 modules**, up from main's 253),
  `npx vitest run` **614/614 (34 files)**. **DERIVED, not inherited:**
  the branch reported 586 against a 507 baseline, but main had moved to
  535, so the merged expectation is **535 + 79 = 614** — and it came out
  green on the FIRST run after the fixture edits, which is the evidence
  that the fixture reconciliation was complete rather than lucky.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero compiler warnings**, summed across **11 test binaries**
  (105/0/0/32+1/68/3/7/0+1/2+1/0/0) — **NOT piped through `tail`**,
  written to a file with the exit code from `$?`. Unmoved.
- tools/e2e `npm ci` + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14571 npm test` → **54 passed in 8.2s**, headless,
  one worker, retries 0, **no skips, no retries, no flakes**. **54, not
  more**: T-034 adds zero lane specs, so main's 54 is the whole answer.
  `lsof` on 14571 after the lane: **empty**.
- `npm run lint:tokens` → `clean (98 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **NINETY-EIGHT, and
  the arithmetic reconciles exactly**: main's 93 + T-034's 5 new files
  (3 under `app/src/architecture/`, 2 under `app/test/`) = 98.
- `npm run lint:tokens -- --selftest` → **49 samples green, 14
  walk-policy checks green**, exit 0.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **TWENTY-THIRD** exercise, and the one that finally caught the
trap the fixture has been warning about for six merges.
- **THE RULE FIRED**: seven `.ts`/`.tsx` files outside `docs/`.
- **THE DISCRIMINATING EVIDENCE, taken BEFORE the regen** with
  `NPUTER_UPDATE_GOLDEN` confirmed UNSET at the shell: the plain
  (non-golden) ignored self-check was **RED, exit 101**, naming the
  committed graph stale. That before-state is what separates
  "fired-and-moved" from "fired-and-no-op", and it is one cheap run.
  Re-run after the final regen: `self_graph_is_current … ok`, **exit 0**.
- **THE DELTA, and the verifier's corrections all held.** Main's
  baseline was confirmed first-hand at **94 files / 670 symbols / 1069
  edges** — the verifier's number, **not** the builder's 667/1063. After
  regen: **99 files / 738 symbols / 1158 edges**, five files added,
  **nothing removed**. The edge total moves **+89**, and the split is
  the thing the builder got wrong: **import +19, call +29, type_ref
  +41**. "edges → 1082" added only the import edges to the total. Only
  the 19 imports can move anything in the fixtures (`derive.ts` skips
  every non-import edge), so the other 70 are real movement with zero
  fixture reach.
- **TWELVE ASSERTIONS MOVED — the builder forecast EIGHT, the verifier
  corrected it to NINE, and the true count is TWELVE.** Every one was
  **derived from the added-file list and the registry globs in a
  script of my own**, written against the globs rather than run through
  the app's `derive.ts`, and all of it BEFORE the suite was run. The
  verifier's two corrections both reproduced exactly:
  **`["C-12","C-05","confirmed",4]` → 6, NOT 7**, and the ninth
  assertion **`["C-12","C-09","confirmed",4]` → 5** — one root cause for
  both, `app/src/lib/task-detail.ts` belongs to **C-09**, which declares
  it by name, so of TasksLens's three new `app/src/lib/**` edges two go
  to C-05 and one to C-09. **The three NEITHER role forecast are all
  LISTS rather than counts**: C-12's own `files` array (**11 → 14
  entries**), which sits in the SAME `it()` body as the file count and
  the per-component counts; the `D1:C-05→C-06` `fileEdges` list (8 → 10,
  which the verifier did catch); and the `it()` NAME. **The fixture's
  standing trap fired for the sixth merge running, in a new shape:** it
  is not only counts-behind-counts, it is **LISTS behind counts**, and a
  list can move while every count in the same body is already right.
  That extension is now written into the fixture's own header.
- **Full moved set**: file count `toBe(94)` → 99 and the `it()` name ·
  `["C-05",44]` → 46 · `["C-12",11]` → 14 · C-12's `files` list 11 → 14
  · `D1:C-05→C-06` fileEdges 8 → 10 · `["C-05","C-06","undeclared",8]`
  → 10 · `["C-05","C-12","confirmed",20]` → 22 ·
  `["C-12","C-05","confirmed",4]` → 6 ·
  `["C-12","C-06","confirmed",4]` → 6 ·
  `["C-12","C-09","confirmed",4]` → 5 · and in
  `map-dogfood-render.test.tsx`, `"committed graph · 94 files"` → 99.
  **UNMOVED and derived as such**: `derived.issues` `[]`,
  `unmappedFiles` `[]`, the 28 relation rows and the 13/6/9 tally, the
  six D1 and three D3 findings, the 11 map nodes and 28 map edges, and
  the drift-flag set — because every one of the 19 new import edges
  lands on a component PAIR the table already carries (C-12 declares
  C-05, C-06 and C-09; C-05 declares C-12), so C-12 gains no drift ring.
- **ORDER PER ceaa949, and it is load-bearing here**: the two app
  fixtures are themselves indexed, so **the fixture edits were made
  BEFORE the final regen** and the regen was then run **twice** for
  byte-identity — sha256
  `58545728009897a80820ef895b4f1108a154d1a4e4f05be0fbb5639154632595`,
  **434,701 bytes, identical after both runs**. (Pre-merge main's was
  `f80c1ba7…` / 398,546 bytes, matching T-045's record exactly.)
- **`lib/parser/test/smoke.test.ts` deliberately NOT touched**: T-034
  declares no component and changes no registry file, so the T-024
  three-fixtures rule does not fire in its registry form. Confirmed by
  re-running lib/parser after the regen: **197/197**.

**1420 WAS NEVER BOUND, CONTACTED OR SIGNALLED.** It was OBSERVED with
`lsof` only: the human's vite is **pid 64249** holding `[::1]:1420` with
one established connection to their webview — **the same pid T-030's,
T-050's and T-045's checkpoints recorded, so their app has still not
been restarted.** Confirmed identical before and after the boot check.

**THE SHARED-WORKING-TREE SIDE EFFECT — AND THIS TIME THE HONEST ANSWER
IS "YOUR SCREEN CHANGED".** T-045's merge was the first whose prediction
was "nothing moved"; this one is the opposite and it is the loudest of
the seven faces so far. The app bundle came out
**`index-CJtBhg4R.css` 41.98 kB** and **`index-XAMx99Qy.js` 465.89 kB**
against T-045's `index-RXeeD2qB.css` 41.30 kB / `index-ChZ8PwVH.js`
448.55 kB — **both content hashes moved, and the JS grew by ~17 kB**.
The human's vite (pid 64249, never restarted) serves through that tree,
so **the map pane in their running window now has a lens control it did
not have when they last looked at it**. That is the intended outcome,
not an accident — but it means item 1 below is a REAL change to look at,
not a re-inspection.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED, in two places, and the reasoning is that a
  second lens made a live bullet incomplete rather than wrong.** (1) The
  **"Map data (F-06)"** bullet enumerated what feeds the map —
  graph.json for reality, component files for intent. **The tasks lens
  reads NEITHER.** It builds waves from the `blocked_by` edges C-06
  already parses out of `docs/tasks/`, so it needs no new data source,
  no new IPC and nothing from C-07, and it renders on a tree where
  graph.json is absent or stale. A reader of that bullet would have
  concluded the pane consumes two sources; it now consumes three halves
  of the same live model, and the bullet says so. (2) The **C-05 row's
  running record** — the per-task record ARCHITECTURE keeps for the app
  panes — gained T-034's clause, including the 472-byte identity proof.
  Applying the T-050 lesson that "a document which enumerates a key set
  has committed to maintaining it", the file was also swept for any
  enumeration of map LENSES or of the pane's chrome: there is none, so
  nothing else fell stale.
- **THE C-12 REGISTRY FILE WAS DELIBERATELY NOT EDITED**, and this is a
  judgment rather than an oversight. `C-12-map-pane.md`'s prose still
  describes the component as "the architecture map … intent and reality
  overlaid", which after T-034 is **incomplete in exactly the way the
  ARCHITECTURE bullet was**. But the registry is the ARCHITECT's
  territory — the standing rule is that the integrator regenerates and
  the architect rules on the registry — and its `paths:` and
  `depends_on:` are all still correct (the three new files fall under
  `app/src/architecture/**`, C-12 already declares C-05, C-06 and C-09).
  Editing its prose at a merge would also move a registry file, which is
  the one thing that fires the T-024 three-fixtures rule. **Flagged for
  the architect, not silently absorbed.**
- **ROADMAP: EDITED, and the test comes out differently from T-045's.**
  The discriminator those checkpoints used is "does the task add a USER
  CAPABILITY". T-045 did not (a pipeline gate); **T-034 plainly does** —
  a visible new lens with its own control. There is still **no
  milestone-4 section** to write it into, and inventing one at a merge
  is a bigger structural change than an integrator should make alone.
  So the edit went to the **F-06 backbone line's own description**,
  which is a live definition rather than a dated claim: F-06 is no
  longer just "intent + reality overlaid" — it now answers *what is
  holding the release* as well as *what is drifting*. **Milestone 3's
  sequencing sentence ("the F-06 remainder — T-010, T-013, T-014,
  T-015") was left ALONE**: it is a dated statement about what was
  sequenced when milestone 3 was decomposed, and T-034 post-dates it.
  Worth a triage eye, since it now reads as a complete list of the F-06
  remainder and is not one.
- **THE TASK FILE'S VERIFIER STAMPS WERE FILLED IN, not just the
  status.** The card arrived with `status: building` and with
  `verifier:`, `verified_by:` and `review:` **all EMPTY**, although its
  own Verdicts section records "claude-opus-5 @fresh, verifier —
  same-model review: APPROVED". Leaving them blank would have put a
  `done` card on the board with no verifier — false on its face, and
  exactly the class of wrong stamp T-030 was built to stop. Filled from
  the card's own verdict (`verifier: claude-opus-5`, `verified_by:
  claude-opus-5 @fresh`, `review: same-model`); the builder stamps were
  preserved untouched. **Parser-validated before and after**: 0 issues
  both times, and the re-parse reads all five stamps back correctly.
- **THE CONTROL-BYTE INSTANCE ON MAIN WAS NOT FIXED HERE**, for the
  reasons in finding 1 above: it is T-050's file, outside T-034's fence,
  and the house precedent (T-045's boot-gate trap) is that an integrator
  RECORDS a cross-cutting finding rather than filing a card or editing
  another lane's file. No new suggestion id was minted — there is no
  precedent for integrator-filed `-sN` cards, and s5 is its natural
  home.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives with cross-component blast radius. **Every choice
  here is local to C-12**, and each is already argued in the card: the
  critical-path definition (the one real fork — argued, and the verifier
  was asked to rule and UPHELD it), the control's single home across
  both lenses (escalated as T-034-s4 rather than settled), the absence
  of architecture chrome on the tasks lens (absent, never disabled —
  T-012's own rule), and the terracotta collapse (nearest token step to
  both design values, decided on semantics at a 1.42-unit margin). Lens
  view-state being session-ephemeral is **not a new decision at all** —
  it follows T-012's overlay precedent and names T-022 as its seam.
  **The one candidate with genuine cross-cutting reach is the C0 gate**,
  and it is deliberately NOT chartered: it is filed as s5/s6 and the
  standing ruling (from T-047's spawn-hygiene question) is that the
  moment to charter is when there is a single rule to charter — i.e.
  when s5 lands. (b) **Prong two is not vacuous.** ADR-015 holds and is
  the one this diff leans on hardest — the entire wave/critical-path
  model is pure TS with no React and no IO, which is why 50 of the 79
  new tests need no DOM. ADR-013 holds (the map is still intent+reality;
  the second lens is a different question over the same live model, not
  a second data pipeline). ADR-014 holds (the regen rule fired, proved
  deterministic across two runs and current by the indexer's own plain
  self-check). ADR-011 holds — verified as a SET: the changed set
  restricted to `method/`, `capabilities/`, `app/src-tauri/` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json`/
  `tsconfig*.json`/`vite.config.ts`/`vitest.config.ts`/`tauri.conf.json`/
  `.nputerignore` returns **0 files**. ADR-012 holds (no native surface
  moved, zero grants touched, the 92-grant `core:default` set unmoved
  and green under `cargo test`). ADR-003 holds (no model call anywhere).
  ADR-002 holds (all project state in files; lens choice is view state,
  not project state). **ADR-009's trigger IS present and is met**: the
  lens renders task titles and ids, and hostile input is handled by Map
  discipline (`__proto__`, `constructor`, `toString` resolve against
  nothing) with the no-innerHTML gate asserting its four lens files BY
  NAME. ADR-016 holds (the done cards carry its two-mark set).
  (c) Prong three: the durable calls live in the card's criteria→
  evidence map, its 33-row extraction table, the seven proof
  obligations, the six-mutant sweep and the verifier's four corrections
  and three rulings.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. **No
GitHub API call, no remote creation — the workflow stays dormant** and
`git remote -v` is still empty.

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t034 worktree is removed and its branch KEPT — **34 task branches
merged now**, `t001-app-shell` through `t050-recover`. Main tree clean;
all four suites green; the token lint green over 98 files at zero
allowlist; the committed graph current and proved so by the plain
self-check rather than by assumption. The parser re-parses the whole
live tree at **0 issues**: **101 tasks**, tally **35 done / 14 planned /
9 parked / 41 suggested / 2 building**, 6 features, 11 components.
(Tasks rise by seven since T-045's checkpoint — T-034's seven suggestion
files; its card already existed on main as `building`.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. T-034 adds no security surface — it is a read-only lens
over data the app already had, with no new IPC, no new grant and no new
dependency. What it DOES add to the security-adjacent pile is the
**searchability** problem: a tree that agents audit by searching can
hide a file from them one byte at a time, and there is one such file on
main today. The sharpest open set is otherwise unchanged and still
app-agent's: **T-047-s5** (two doors, one standard, only one guarded —
~5 lines), **T-047-s6** (nothing structurally stops a test resolving the
real CLI), **T-047-s4** (`$SHELL` picks the program), and **T-047-s1**
(the cache that saves zero spawns). Beside them the process-hygiene pair
stands: **T-046-s1** and **T-041-s4**.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020),
unchanged in shape by T-034 but with **one new platform-sensitive
group**. At the repo's first push (`git remote -v` is still empty),
confirm in order: the ubuntu apt/webkit2gtk set installs; the three
`uses:` SHA pins resolve; the `e2e types` step runs (still **never
executed on any runner**); then playwright-on-Linux runs the lane —
**still 54 tests**, since T-034 adds none. **T-034's OWN Linux exposure
is in the app suite, not the lane**, and it is the emission probe:
`map-tasks-lens-dom.test.tsx` reads the BUILT stylesheet out of
`app/dist/assets/` and requires a rule for each of 34 utilities, with a
**staleness guard that fails loudly if `dist/` predates the lens
sources** — it has now fired **three times** on three different sessions,
which means on a fresh runner the ORDER of build-then-test is
load-bearing rather than incidental. If it reds on Linux, read the guard
message first: it is far more likely to be a build-ordering artifact
than a real unpainted utility. The rest of the watch list is unchanged:
T-048's three-viewport pixel sweep and the CSS-reading specs
(`front-door`, `genesis-screen`, `startup-recovery`) are the
platform-sensitive ones; T-049's `accelerators.spec.ts` presses `Meta+o`
/ `Meta+n` where Linux's Meta is not the platform accelerator; T-045's
twenty parse files off disk and are the LEAST platform-sensitive.
Then: `cargo audit`; the xvfb `tauri dev` boot printing both `[nputer]`
lines (the FIRST exercise of the boot check on Linux); and the THREE
T-018 SENTINEL live tests inside the ubuntu `cargo test` step, whose
green CLOSES the macOS-only replace-regression gap. That run also closes
T-001/T-003's Linux halves and carries T-026-s1 and T-021-s1.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS OPEN, AND THIS TIME SOMETHING REAL
   MOVED.** The app is RUNNING on 1420 — **vite pid 64249, the same pid
   four checkpoints have recorded, so you have not restarted it** — and
   unlike T-045's merge, **this one changed the bundle** (both content
   hashes moved, JS +17 kB). **The map pane now has a lens control.**
   Reload the window if it looks unchanged.
   - **THE SIX T-034 JUDGMENTS, all yours, none self-answerable.**
     1. **The terracotta, both schemes, BESIDE A `rejected` CARD.**
        `--status-rejected-meta` is #9d4430 light / #bb6c5b dark against
        the design's #c96a4f and #d4694b. The machines pinned "nearest
        token step" — but the margin on #d4694b is **1.42 units**,
        effectively a tie that the SEMANTIC argument decided, not the
        arithmetic. Does the critical chain read as *the spine of the
        picture* or as *an error*? The `rejected` card wears the same
        family's fill, which is why they must be judged together.
     2. **The blocked ghost against the ready grey.** #fafaf9
        dashed-terracotta vs #f5f5f5 solid-grey in LIGHT is a small
        delta; in DARK it is #101010 vs #141414, smaller still. Does
        "blocked" read as a different KIND of card at arm's length, or
        just a slightly different grey?
     3. **WAVE 0 IS A WALL — the big one, T-034-s1.** 32 of 50 cards in
        one wave, a 1440×3818 canvas in a ~600px pane. **This is the
        question of whether the lens is USEFUL on this repo, as opposed
        to correct — and correct it demonstrably is.** Three options are
        costed in the card. Reads with T-048-s2.
     4. **Where the lens control belongs — T-034-s4.** The design bundle
        draws it in two different places on its two screens. The builder
        picked one home for both lenses (the header's left group,
        README's pane-header order) and argued that a control which
        jumps 900px the instant you use it is a defect rather than a
        design. Your call.
     5. **Two segmented controls in one header, three feet apart**, with
        deliberately different selection weights — the lens's ink pill
        NAVIGATES, the overlay's outlined pill MODIFIES. Does that
        distinction read, or do two segmented controls in one row read
        as one confused thing?
     6. **The tasks-lens header's empty right side.** `map · tasks` +
        subtitle + control, and nothing on the right at all, because
        search, the overlay control, the indexed-at hint and Re-index
        are all architecture chrome. Empty, or calm?
   - **STILL OPEN FROM T-030: the model badges on your board should be
     SHORT.** T-020's and T-024's cards should read `opus`; T-001's
     verified-by badge should read `+`. **The judgment that is yours:
     `+` is honest but ugly**, and it is filed as **T-030-s1** with four
     fixes costed. Is a bare `+` acceptable on a card face?
   - **THE HEADER'S DENSITY, T-049's item, still open** — three equal
     outline buttons where the front door gives its primary an ink pill,
     so **"Start an interview" looks exactly like "Toggle theme"**. Plus:
     the header pair carries no `⌘O · ⌘N` hint while the front door and
     startup screen do, and **neither group wraps or truncates**. (Also:
     the header says `Open folder…`, the other two say `Open a folder…`.)
   - **T-050's TWO OPEN JUDGMENTS, unchanged.** Does the startup-failure
     copy read right, and does retry belong on that screen or in the
     header? **AND T-050's WARNING, which still matters more —
     T-050-s2**: escaping the failure screen with "Open a folder…"
     rather than "Try again" reaches a board with real content that is
     **silently dead**. **Use "Try again".**
   - **The frame at 800x600, T-048's item, still open** — the artifact
     list gets 286px of the 858px it wants at the size the app opens.
     The measurement says the frame holds; whether it holds ENOUGH is an
     eye judgment.
   - **THE COMPOSITION QUESTION, still T-027's** — T-024 drew the pane
     as the RIGHT HALF of a split view; until T-027 it sits full-width
     inside T-026's card frame. **This is the question T-027's planning
     pass waits on.**
   - **T-024's pane, light AND dark**; **T-026's front door, light AND
     dark** (read **T-048-s4 BEFORE T-048-s3** — s3's conclusion is
     wrong); **the at-a-glance amber judgment** (C-05's drift count
     reads **4**); **the launch-shot re-judgment**; **the T-023 dry-run
     conversational quality**; **T-026-s4's docs-but-no-plan folder**;
     **the real picker flows** (native dialogs are unreachable
     headlessly); **the `tauri dev` quit-the-app orphan check** (watch
     for T-025-s7's ~5 s hang, expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/`
     — outside the repo, deliberately not deleted. **Delete or keep.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action.** See item 4; the newest
     entrant is the live control-byte instance on main.
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049 +
   T-050, ADR-017). **What holds the milestone is BOTH the human and a
   merge, in this order:**
   (a) **T-042 must merge, then T-027 dispatches** — sequenced under
   grant 1 because T-042's criterion 4 decides where the docs change log
   lives. **T-042 is in VERIFICATION now.**
   (b) **T-027's planning pass ALSO waits on the human's split-view
   verdict** (item 1). `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been
   satisfied since T-025 merged. T-027 also inherits **T-047-s3**,
   **T-048-s1**, and **T-049-s2** — its accelerator criterion names a
   test T-049 retired, so it needs a one-line rewording before it
   dispatches — plus **T-049-s3**.
   (c) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; the first three are
   DONE, so the standing grant's next named item is **T-022** (M,
   milestone 4, `blocked_by: []`) — and **T-034 just made T-022 bigger
   in a documented way**: T-034-s3 adds `lens` as the fourth member of
   the view-state seam T-022 is meant to persist, alongside `overlay`
   and the two viewports. **app-agent is FREE** (T-047 merged), which
   unblocks **T-043** outright; **app-shell is FREE** (T-050);
   **lib-parser is FREE** (T-030), which matters because **T-031 and
   T-032 both sit in that lane** — and **T-032 now carries T-034-s7**,
   a criterion that reads as an instruction to type a control byte and
   should be amended BEFORE it is built. **tools/e2e is FREE** (T-045),
   which matters for **T-044** and for any promoted T-045 or T-034-s5
   suggestion. **app-map is FREE as of this merge**, which matters for
   T-013, T-015 and T-032's map-badge half. Triage: APPLY granted — but
   tasks NEWLY created by triage (T-041…T-051) do NOT dispatch without
   the human. Unchanged method rules: a second REJECTED on any task
   parks that lane for the human; @human judgments are never
   self-answered.
4. SUGGESTION BACKLOG — **50 open files: 9 parked + 41 suggested.**
   **T-034 contributes SEVEN — four from the builder, three from the
   verifier — and they do not rank together.**
   **THE NEWEST ITEM IS NOT A CARD AT ALL**: the live control-byte
   instance in `app/test/startup-screen.test.tsx` (T-050's file, NUL +
   BEL + ESC at offsets 2751–2753 and 9508–9510, `file(1)` says
   **data**). No gate in the repo catches it; `rg` silently omits it and
   the `grep` on this machine's PATH goes fully blind. **Rank it WITH
   T-034-s5**, whose remedy (lift the C0 check into `lint:tokens`) would
   catch it — the fix to the file itself is ~2 lines and the fix to the
   gate is s5.
   **Untriaged (41)**: the seven T-034 cards — **s1** (@human and the
   urgent one: wave 0 holds 32 of 50 cards, a 1440×3818 canvas in a
   ~600px pane — the "is this useful here" question, reads with
   T-048-s2), **s5** (lift the C0 gate into `lint:tokens` — conclusion
   VALID, premise needs s6's correction, and now backed by a live
   instance), **s6** (VERIFIER-FILED: the hazard is binary-skipping
   SEARCHERS, not this repo's gates — and this merge sharpens it, since
   whether a grep-shaped gate survives depends on which `grep` is on
   PATH), **s7** (T-032's criterion invites the literal byte back —
   **amend before T-032 is built**), **s4** (@human: where the lens
   control belongs), **s3** (T-022 absorbs `lens`), **s2** (a blocked
   card can point at nothing on screen — latent today, a trap) — plus
   the four T-045 cards (**s4** the CONVENTIONS parse is blind to nested
   and fenced commands, **s2** importing `lint-tokens.mjs` RUNS the lint
   and can exit the importer, **s3** composite actions escape the
   permissions rules, **s1** CI could shrink four divergences to two) —
   plus the five T-030 cards (**s3 PROMOTE FIRST and the deadline has
   now PASSED**: zero-padding aliases ids and a `blocked_by: [T-01]` edge
   silently RE-POINTS — that is now a wrong picture in a shipped pane,
   not a latent parser bug; **s2** the roadmap parser is fence-blind;
   **s4** the two parsers disagree about what content is; **s5** `<!-->`
   reads as unterminated; **s1** the representative rule leaves a literal
   `+`) — plus the three T-050 cards (**s2** FIX FIRST: a board reached
   after a failed subscribe is not live; **s3** a startup failure never
   reaches the log; **s1** conclusion right, one mechanism sentence
   wrong) — plus the four T-049 cards (**s4** `event.key` makes the
   chords dead on every non-Latin layout, **s3** four unpinned mechanism
   properties, **s2** the cheapest thing on this list — one-line
   reconciliation of T-027's criterion, **s1** the lane sees a browser)
   — plus the five T-048 cards (**s2** the map canvas clips instead of
   scrolling — **and T-034 just doubled what it can clip**, since the
   tasks lens draws a 1440×3818 canvas; **s4** read BEFORE s3; **s1**
   two scroll models; **s3** the no-plan card overflows; **s5** the
   bounded frame's floor) — plus the six T-047 cards (**s5**, **s6**,
   **s4**, **s1**, **s2**, **s3** — home T-027) — plus **T-041-s2**,
   **T-041-s4**, **T-046-s1**, **T-046-s4**, **T-046-s2**, **T-046-s3**,
   and **T-039-s3** (home T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2, T-008-s1, T-018-s1, T-021-s1, T-026-s1,
   T-025-s2 (@human, one command on an authenticated machine),
   T-025-s4 (gated by s2), T-025-s3, T-038-s1.
   Triage-born tasks standing ready and un-dispatched: **T-043**,
   **T-044**, **T-051**.
   Milestone-4 queue after F-03: T-010, T-013, T-015, T-022, T-031…
   T-033, T-035, T-044. (T-014 and T-042 are in flight; **T-030, T-045
   and T-034 are done**.)

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward.
  T-009-s1's sibling rule names its retirement (T-014's `nputer index
  --check`, **now in verification**); BOOT GATE names none in
  CONVENTIONS, and ci.yml already invokes the boot check on ubuntu while
  dormant. **SEVEN exercises in, and T-034 is the first in five merges
  where the gate FIRED and RAN rather than being declared untriggered**
  — which is the bullet working on its loud limb after four exercises of
  its quiet one. **The `<main-before>..HEAD` wrinkle is now MEASURED
  rather than argued** (see the merge record above): the naive
  `merge-base..HEAD` derivation returns another merge's files and can
  read as a FIRE that is not yours. Three integrators have hit it. The
  fix is one clause in both CONVENTIONS bullets naming which diff.
  Left for a triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **Still the LIVE one, and T-034 exercised two of the three in
  one merge** (the regen rule and BOOT GATE, the latter for real). Three
  rules now share the shape trigger → command → record, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". The standing answer was "ask ONCE when a
  THIRD lands"; a third landed at T-045. A method version bump, not an
  ADR.
- **Does the shared main working tree need a rule?** Carried forward
  with **SEVEN faces catalogued**. The first was the git INDEX; the
  second the WORKING TREE via a Rust rebuild; the third (T-048) HMR; the
  fourth (T-049) the KEYBOARD; the fifth (T-050) the exact screen the
  human had photographed; the sixth (T-030) `lib/parser/dist/` reaching
  the app through the symlink; and T-045 added the mechanism that a
  merge briefly REMOVES `node_modules` under a live vite. **T-034's is
  the plainest instance yet and needs no subtlety: the merge changed the
  app bundle, so the pane the human is reviewing gained a control while
  they were not looking.** That is the intended product outcome — which
  is precisely why it belongs in this question rather than outside it:
  the hazard is not that merges break things, it is that **the reviewed
  artifact is not pinned to the review**. Method/process, so the
  architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: the moment to write it is when T-047-s5 lands.
- **When does the C0/searchability rule become a gate — and whose
  question is it?** **NEW, and it is the sharpest thing T-034 leaves
  behind.** T-034 built a standing C0 gate scoped to one pane, and
  T-034-s5 proposes lifting it to `lint:tokens`. This merge found a
  **live instance on main that the pane-scoped gate cannot see**, and
  measured that the answer to "do grep-shaped gates survive a NUL"
  is **tool-dependent** (BSD grep yes, ugrep no, `rg` silently no). That
  makes it more than a lint suggestion: it is a claim about **what the
  repo guarantees to the agents that audit it**, which is a method-level
  property, not a tools/e2e one. Two candidate shapes: a `lint:tokens`
  walk-policy check (cheap, catches the instance, stays a repo gate), or
  a CONVENTIONS-level rule that source files SHALL be text and the
  ESCAPE is always written (which would also fix T-034-s7's wording
  class at the source). The architect's call (ADR-004).
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, and **T-034 is the SIXTH data point and the first
  where the dispatch asked the verifier to RULE on a builder's
  definition rather than check a remedy.** The critical-path definition
  was a genuine fork with no criterion prescribing either arm; the card
  named both readings, argued one, and the verifier upheld it on the
  merits and verified they differ on a fixture. **That is a cleaner
  shape than either prescribing a remedy or naming only a property**,
  and it is the second consecutive merge to produce a good example (the
  other being T-045's two-armed criterion 1). The three candidate rules
  are unchanged and all cheap; the architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged — three clean examples
  exist (T-030's relocated pin, T-050's rename-not-retire, T-045's
  cross-file move) and the rule describes behaviour the lane already
  has. Method version bump, the architect's call.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-034 is the THIRD instance in three
  merges and the pattern is now undeniable.** T-030's card asserted "a
  FIFTY-character badge" and "SIX live stamps" (59 and eight); T-045's
  asserted "the TWO documented divergences" (four); **T-034's notes
  asserted an EIGHT-assertion graph delta, the verifier corrected it to
  NINE, and the true count is TWELVE**. In every case the error was
  invisible to a green suite, and in every case the correction came from
  **deriving the number from the source of truth instead of transcribing
  it**. T-034 adds a sharpening the other two could not: **the three
  missed assertions were all LISTS behind counts**, so even a diligent
  reader who checks every NUMBER in a card can still miss the work. The
  candidate rule stands and should now probably be written: a numeric
  claim in a card body is EVIDENCE TO REPRODUCE, and a task that
  reproduces it differently SHALL record the corrected number.
  Method version bump, the architect's call (ADR-004).
