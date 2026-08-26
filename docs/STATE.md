# State

Updated: 2026-08-26 by the T-111 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP. NOTHING IS BROKEN.
ONE COMMAND ON MAIN EXITS 1 ON PURPOSE. ONE CARD IS `status: building`
WITH NO LANE, AND THAT IS ALSO ON PURPOSE. AND AFTER THIS CHECKPOINT
THERE IS NO LIVE LANE AT ALL — derived from `git worktree list
--porcelain` filtered on `refs/heads/task/`, and stated without a "first
time in N merges" because nothing on disk answers that.** This merge is **512 /
1013 / 290 / 194 green**. `cargo run -p nputer-index -- arch cycles
--root ../..` is **exit 1** on main and that is the DESIGNED state — the
declared cycle `C-08 -> C-09 -> C-08` survives because removing it needs
paths T-127's fence could not reach (`T-127-s1`). **The ENFORCING copy is
`cargo test`, which is green.**

## **THE BOARD NOW SAYS WHAT IS STARTABLE AND, IN A SENTENCE A HUMAN CAN ARGUE WITH, WHY THE REST ARE NOT**

`method/roles/orchestrator.md` step 4 has stated the dispatch rule in one
sentence since the method was written: *among the topmost undone tasks of
each feature column, pick the highest-priority one that is unblocked AND
whose `touches:` don't overlap any task currently building. Ceiling:
3–5.* **Until this merge nothing computed it.** `selectDispositions` in
`app/src/lib/board-model.ts` now does, as a pure function of the parsed
model plus T-110's lane set, and it returns one of **SIX** closed
dispositions per card — `dispatchable`, `blocked`, `fenced`,
`not-topmost`, `at-ceiling`, `not-applicable` — **each carrying a reason
SENTENCE rather than an encoded verdict.** *A disposition with no reason
is not done being computed.*

**THE TWO REASON CLAUSES ARE THE PRODUCT, AND THEY ARE THE TWO THE
REJECTION FOUND UNDEFENDED.**

- **A `fenced` card names the token, the lane holding it, AND whether the
  overlap is the COARSE fence.** Disjointness is computed over EXPANDED
  component paths, and `expandTouch` reports the component ids it
  resolved through, so the reason can say *both expand through C-11, so
  this may be the coarse fence rather than a real overlap* — and a human
  can override deliberately instead of serialising behind a word.
  `app-shell` spans nearly all of `app/`; without that clause the board
  would refuse a Rust-only card because a TypeScript-only card is in
  flight and say nothing about why.
- **A `blocked` card naming an id that does not exist QUOTES THE
  PARSER'S OWN NEAR-MISS HINT**, verbatim and attributed — *The parser
  says: "… 'T-001' is declared and differs only in zero padding …"* — and
  then rules that this is **a defect in this card, not a reason to
  wait.** T-076's hint is CONSUMED rather than re-derived (T-057).

**AND THE IN-FLIGHT SET IS A JOIN WHOSE DISAGREEMENT IS VISIBLE.** T-110's
lane reader is joined with `status:`, and all four states are driven by a
pin: LIVE (both), a stamp with no worktree (a DEAD lane), a worktree with
no stamp (an UNSTAMPED dispatch), and neither. **An empty list never
means two different things.**

**NO DISPATCH AFFORDANCE LANDS HERE.** T-028's fence is mechanically
enforced — `crescendo-dom.test.tsx` counts the completion panel's buttons
and greps its text — and stayed green. The brief and the lane commands
are `T-112`'s.

### **THE CARD WAS REJECTED, AND WHAT THE REJECTION WAS ABOUT IS THE MOST REUSABLE THING IN THIS FILE**

**NOT ONE LINE OF THE DERIVATION HAD TO CHANGE.** The census was exact,
the ruling sound, all eight criteria substantively built, and the lane's
own **33-arm poison drill was entirely red**. The rejection (`75b7626`)
was that **four pieces of shipped TEXT stated things that were not so**,
and that **two of criterion 4's own headline reason clauses were encoded
rather than defended** — so three one-sided PRODUCER mutants survived
`npm test` at exit 0:

    A20b  the whole COARSE-fence clause deleted from the reason   exit 0, 1009/1009
    A09   the narrower/wider shared-path rule inverted            exit 0, 1009/1009
    A24   InFlightLane.disagrees forced false (write-only field)  exit 0

**A DRILL THAT IS ENTIRELY RED IS NOT EVIDENCE THAT THE THING THE CARD IS
FOR IS PINNED.** The 33 arms never reached the rendered reason TEXT,
which is the deliverable. Five of the six repairs are now discharged by a
mutant that reds — **A31, A20b, A20c, A09, A28, A28b, A24 and A32, eight
arms, eight reds**, six of them killing exactly one body.

**AND THE PIN WHOSE TITLE ASSERTED THE OPPOSITE COULD NOT HAVE SHOWN THE
THING EITHER**, which the verdict did not name and the fix pass found:
the fixture dangled `T-90` against a declared `T-900`, and `idSlotKey`
strips only LEADING zeros, so those are different slots and **no near
miss was ever emitted.** It is `T-01` beside `T-001` now, with a `T-999`
control body proving the pin checks the PARSER's sentence and not the
presence of any sentence.

## **THE `fence.ts` DUPLICATION IS A DELIBERATE, MEASURED DECLINE — DO NOT "FIX" IT**

**T-134 merged `lib/parser/src/fence.ts` while this lane ran, and T-111
ships the same four facts board-locally.** That is a real `T-057` debt and
it is on the record rather than argued away. **It is NOT an oversight and
it is NOT this checkpoint's to repair.**

**THE LANE MEASURED BOTH IMPLEMENTATIONS ACROSS EVERY LIVE PAIR AND
DECLINED TO IMPORT**, and the verifier re-measured independently and
agreed. The import would have been legal — `fence.ts` is exported from
the parser's index and `@nputer/parser` is already an app dependency, so
it is a READ inside `[app-board, app-shell]` and never a fence widening.
**Three reasons, none of them the fence:**

1. **`compareFences` HAS A THIRD VERDICT.** `unusable` is deliberate and
   its own doc forbids folding it into `disjoint`. Criterion 1 closes
   this card's vocabulary at SIX. Consuming the module faithfully needs a
   SEVENTH disposition — **a criteria change, which an executor may not
   make from inside a lane.**
2. **THE BOARD HAS NO FILESYSTEM.** `expandFence`'s `knownPaths` oracle
   is, by its own doc, *"the ONLY way this module can tell a bare
   directory token from a word that names nothing"*, and
   `selectDispositions` is a pure function of the parsed model.
3. **`FenceWitness` CARRIES NO COMPONENT IDS** — `{left, right, path}`
   and nothing else — **so importing would DELETE the coarse-fence clause
   the rejection's repair 2 just pinned in two directions** (A20b makes
   it vanish, A20c makes it unconditional; both red). `T-111-s5`
   predicted this in advance: *it needs the provenance, not the verdict.*

**THE MEASUREMENT.** Over the live board: **0 of 27 normalisation
disagreements**, **3 of 27 token-KIND** (`ci`, `docs`, `method`), and
**every disagreeing pair involves `T-054`, which is `done`** — never in
flight, never a candidate, so no disagreement can reach a live dispatch.
**The 113 disagreeing pairs are an ORACLE GAP, not a rule disagreement**,
and only a caller with a repository can close it. `UNFENCEABLE_PATHS` is
dormant too: **no live token normalises to `docs/tasks`.**

**`T-111-s5` IS THE MOVE LIST AND `T-137` IS THE VEHICLE.** s5 was
written by the seat that built the thing, so T-137 does not have to
reverse-engineer it: what moves unchanged, what cannot
(`topmostUndoneByColumn`, because the derivation needs a column ORDER and
this repository has exactly one), and the ONE decision T-137's criteria
do not settle — where that order lives, with three options and a
recommendation. **Read s5 before T-137 is dispatched.**

## **`T-111-s9` IS THE MORE DANGEROUS OF THE TWO NEW FINDINGS, AND IT NOW HAS A ROOT CAUSE**

**THE LANE WROTE TWO LITERAL `U+0000` BYTES INTO A TEST FILE.** A sentinel
typed as a space landed as NUL, twice, in
`app/test/select-board.test.ts`. **They survived `npm run build`, 1013
tests and eight poison-drill arms**, because a NUL inside a JS string
literal is a valid string. **`tools/e2e`'s P5 control-character rule is
the only thing in this repository that saw them** — that rule's own
stated rationale arriving on its author, for the second consecutive merge
(T-134's was the witness-dedup key).

**THEY CAUSED THREE `tools/e2e` REDS AND ONE OF THE THREE IS
CHARACTER-PERFECT CAMOUFLAGE FOR A KNOWN FLAKE.**
`token-scan.spec.ts:227` — *"P6 reds a planted bare motion utility"* — is
the body `docs/STATE.md` has predicted for six checkpoints as
`T-120-s3`'s mtime flake in a fresh lane worktree. **It was not that**:
the `.3904` signature was absent and the cause was `(1 TOKEN, 2 CONTROL)`
against an asserted `0 CONTROL`. **Nothing in the failure's title says
so, and "run it again" is the remedy for both.** The mechanism is that a
local fixture plants ONE violation and then asserts a WHOLE-CORPUS total,
so any unrelated hit anywhere in `git ls-files` moves the number three
layers from its cause — **the DOCS GATE's own founding argument,
reproduced inside `tools/e2e` itself.**

### **AND THE ROOT CAUSE IS THAT THE DEFECT CONCEALS ITS OWN EVIDENCE — `s9` AND THE `grep` SHIM ARE ONE EVENT**

**REPRODUCED HERE, INDEPENDENTLY, FOR THE THIRD TIME IN THIS THREAD.**
This session's `grep` is a shell function from the harness snapshot, and
its argv is:

    ARGV0=ugrep "$_cc_bin" -G --ignore-files --hidden -I --exclude-dir=.git …

**`-I` MEANS SKIP BINARY FILES, AND ONE NUL BYTE MAKES A FILE BINARY.**
Two files, same three words, one carrying `\0\0`:

    SHIM grep      clean = 1     with NUL = NO MATCH   (all three words)
    command grep   clean = 1     with NUL = 1          (all three words)

**So a sweep over a NUL-bearing file returns "no matches", with no error
and no clue — INCLUDING the sweep meant to confirm the NUL was removed.**
The lane's own retracted-vocabulary sweep came back clean over a file
that contained all three forbidden words. **Every sweep in this
checkpoint was run with `command grep`, and a sweep is not a sweep until
its own positive control has fired.** `--ignore-files` is a second,
distinct blind spot and is inert here.

**THE TREE IS CLEAN TODAY, DERIVED AT THIS MERGE**: exactly **18** tracked
files carry a NUL and **all 18 are icons and fonts** (14 `.png`, `.icns`,
`.ico`, 2 `.woff2`); **ZERO are source-shaped.** That also reconciles the
lint's own corpus exactly: **787 tracked files − 18 binary = 769
CONTROL**, which is what `lint:tokens` printed.

**AND THE ANNOUNCEMENT WAS MISSED THE FIRST TIME.** Arm A31's log came
back `Binary file … matches` where the test counts should have been, so
that arm briefly had an **EXIT with no COUNT** — the exact shape
`docs/CONVENTIONS.md` forbids reading a drill by. **A log that answers
"Binary file matches" is a measurement that did not happen.**

## **THE FIXTURE RECONCILIATION IS ZERO, AND THAT CONCLUSION HAS NOW SURVIVED THREE DIFFERENT BASELINES**

The lane and the first verdict both measured against committed
`b742efbe…`. **`b0416e9` replaced it with `616205de…` before either
finished.** The re-check re-measured on a tree merged with then-current
main. **This checkpoint measured a third time, at its own ref, and got
the same answer:**

    committed:   970961 bytes · 183 files · 2064 symbols · 1986 edges   (sha256 616205de…)
    fresh index: 989181 bytes · 183 files · 2101 symbols · 2033 edges
    -> STALE, exit 1
    files  +0  -0  ~2
    | ~ app/src/lib/board-model.ts      (content, loc 465 -> 1284, symbols 21 -> 47)
    | ~ app/test/select-board.test.ts   (content, loc 740 -> 1853, symbols  9 -> 20)
    edges  +50  -3          1986 + 50 - 3 = 2033, which closes

**`+50 −3` IS THE FIGURE, NOT `+48 −3`** — the card's own arithmetic
failed against the 1990 printed one line above it, and only +50
reconciles. That was the rejection's item 6 and it is confirmed here at a
third baseline.

**AND THE CONCLUSION WAS NOT INHERITED — IT WAS RE-DERIVED.** `files +0
−0` is the sentence a checkpoint decides on, so it was tested rather than
read: **`npm test` from `app/` with the REGENERATED graph actually in
place is 1013/1013, exit 0.** No fixture moves, no assertion is owed.
Contrast T-134's checkpoint, where the same forecast named two sites and
the tree held **three** red assertions in the same `it()` body.

## **THE BYTE BUDGET IS THE FIGURE NOTHING REPORTS, AND THIS IS THE MERGE WHERE THE HEADROOM WENT UNDER THE SPEND**

**989 181 of `max_graph_bytes` 1 000 000 = 98.92%, 10 819 BYTES OF
HEADROOM**, spending **18 220** — the largest single spend in this
series, against T-134's 15 251 and T-135 Half A's 11 120. **T-134's
checkpoint could still say the budget held roughly two more merges of
that size. THIS ONE CANNOT SAY ONE**: the remaining headroom is smaller
than the spend that produced it. `max_graph_bytes` is `1_000_000`, read
out of `crates/nputer-index/src/lib.rs:79` rather than remembered.
**DERIVE IT AT YOUR OWN REF; a transcribed byte count is a line number by
another name.** Committed graph sha256 **`8bf13e1f…`**.

**AND IT BUYS ZERO NEW INDEXED FILES, WHICH IS THE ARITHMETIC WORTH
CARRYING.** `arch` reports `components=13 files=183 mapped=183
unmapped=0 edges=37 findings=4 drift_components=4` — and the whole `arch`
output is **byte-identical, line for line, before and after the regen**
(`diff` exit 0 over every `component`, `edge` and `summary` row). Not one
component's file count moves: C-05 holds at **63**, C-08 at **10**, C-06
at **27**, C-07 at **35**. **THE ENTIRE 18 220 BYTES IS +50 −3 EDGES AND
+37 SYMBOLS INSIDE TWO FILES THAT ALREADY EXISTED.** T-126 proved a file
count and a byte count can move in opposite directions at one regen;
**this merge proves the byte count can move by more than any merge before
it while every component-level figure stays still.**

## THE LANE LIST, DERIVED AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-FIFTH MEASUREMENT
SAYING SO.** Two commands answer it:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

**AFTER THIS CHECKPOINT THERE ARE ZERO LANES.** `T-111`'s was the only
one and it is removed (rule 6, after the merge and after the checkpoint).
**DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO NOT QUOTE THIS
PARAGRAPH.**

- **`/Users/ujju/Projects/nputer-T-111` — REMOVED by this checkpoint.**
  It carried NOTHING: `git status --porcelain` was **empty** at the
  merge, and its `graph.json` was the committed one, because the lane
  restored every regeneration and committed no graph. `git worktree
  prune` ran behind it. **The branch is kept.**
- `/Users/ujju/Projects/nputer-app`, **detached at `f9350b1`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **IT DID NOT MOVE UNDER
  THIS INTEGRATION** and is now **12 commits behind main, 2 of them merge
  commits** (`git rev-list --first-parent --count f9350b1..HEAD` and
  `--merges --count`). **T-134's checkpoint said "nine merges behind" and
  that figure does not reproduce under either command** — corrected here
  with the commands rather than carried, because a lag is a function of
  two refs and neither of them is remembered.
- **`/Users/ujju/Projects/arch-verify`, detached at `6a6bc87` — NOT THIS
  INTEGRATOR'S, AND IT HOLDS A STAGED INDEX.** On no `task/` branch and
  named after no card, so **not a lane**. Read with `git -C … rev-parse`
  and `git -C … status --porcelain` and nothing else, and left alone.
  **What it holds is the missing half of the eleventh triage** — see the
  next section.
- **NO `/private/tmp/t111*` CHECKOUTS REMAIN.** T-111's four drills were
  cleaned up by their own seats; the glob matches nothing at this ref.

## **THE ELEVENTH TRIAGE LANDED ON MAIN THREE HOURS BEFORE THIS MERGE, AND HALF OF IT IS STILL IN SOMEBODY'S INDEX**

**`6bec5a2` — the architect's, OUTSIDE this merge's range — removed 16
suggestion cards from `docs/tasks/`**, 14 rejected with their discharge
and 2 already-promoted files finally deleted. `suggested` goes **123 →
107** at that commit. **Three of the sixteen are `T-111`'s own — `s1`,
`s3` and `s4`** — so this card's suggestion trail is smaller on main than
its own body describes, and the body is deliberately left saying what it
said.

**`docs/tasks/rejected/` DID NOT GAIN THEM AND HOLDS AT 27.** That commit
is a pure deletion of 1 278 lines with zero insertions. **The copies
bound for `rejected/` are staged, right now, in
`/Users/ujju/Projects/arch-verify`'s index** — 14 rows reading `RM
docs/tasks/X.md -> docs/tasks/rejected/X.md` plus 2 plain `D`s. **That is
a fact about somebody else's index and not about this tree**, it is what
"part 1" in that commit's own subject means, and **it was read with
`status --porcelain` and touched by nothing.** Whoever writes part 2 will
move `rejected/` 27 → 41 and will not move the flat count again.

### **AND THE MERGE'S OWN PIN HAD ITS FIRST LIVE REHEARSAL IN THAT COMMIT, AND PASSED**

The verdict warned that this card's `a dangling blocker` body is a
**broader tripwire than its own comment claims**: it fires the day a
card's blocker is removed from the board, *which is routine triage, not
only the day somebody drafts a typo.* **A triage removing sixteen cards
is exactly that event, and it landed between the verdict and the merge.**
Re-derived through the parser at this merge, over `docs/tasks/`:

    blocked_by entries        51
    blocker is `done`         48
    blocker still open        3
    blocker names NO card     0     <- the pin
    planned, ALL landed       6     T-015, T-059, T-065, T-131, T-137, T-138

**ZERO DANGLING — not one of the sixteen is named as a blocker by
anything.** Every row is identical to `T-111-s6`'s re-derivation at
`f9350b1`, ten commits ago, **and two of the six are different cards**:
`T-111` and `T-134` have landed and `T-137` and `T-138` have taken their
places. **An unmoved census is not evidence that nothing moved**, one
board over from where T-134's checkpoint said it about the flip total.

## **WHAT THIS MERGE RELEASES, DERIVED THROUGH `fence.ts` AND NOT ASSUMED**

`T-111`'s fence `[app-board, app-shell]` expands to **36 paths** and
overlaps **20 of the 36 other open fence-carrying cards**:

    T-015 T-022 T-032 T-035 T-044 T-059 T-065 T-068 T-071 T-075
    T-087 T-094 T-099 T-100 T-106 T-112 T-114 T-115 T-117 T-125

**AND EVERY ONE OF THE 20 IS VISIBLE ON TOKENS** — `T-111` appears in
**ZERO** of the board's 25 flip pairs, so nothing about it was ever
hidden from a token comparison. **Closing the card and removing the
worktree frees all twenty.**

**THE FLIP CENSUS, RE-DERIVED HERE THROUGH THE MERGED `fence.ts`** — open
set = `status` in {planned, building, verifying} carrying a non-empty
`touches:`, which reproduces T-134's series exactly:

    before the stamp   37 cards   666 pairs   25 flips   0 reverse
    after  the stamp   36 cards   630 pairs   25 flips   0 reverse

**THE TOTAL DOES NOT MOVE, AND THIS TIME THAT IS EVIDENCE THAT NOTHING
MOVED** — which is the exact opposite of T-134's checkpoint, where an
unmoved 25 concealed a complete change of pairs. The difference is
measurable rather than rhetorical: T-134 sat in three flip pairs and
T-111 sits in none. **Derive the PAIRS, never the count.** The 25 are 19
on `T-112`'s `app/src/assets` + `app/src/styles` and 6 on `method/`
containment (`T-105`/`T-128`/`T-131` against `T-135` and `T-138`).

## Just completed

**T-111 — THE BOARD SAYS WHAT IS DISPATCHABLE, AND WHY THE REST ARE
NOT.** F-04, milestone 4, **size M**, `touches: [app-board, app-shell]`.
Main-before **`6bec5a2`**, lane tip **`a80870b`** (derived with `git
rev-parse` — it is the **RE-CHECK VERDICT** commit, not the last work
commit `70dbf83`), merge **`f3a4233`**, checkpoint this commit. Built
across two lanes and then **REJECTED at `75b7626`**; repaired by a
**FRESH HAND** as `method/tasks/TASK-FORMAT.md` requires of a rejected
card; **re-checked and APPROVED at `a80870b`** by the same verifier
against the same attack set. Integrated by a third `claude-opus-5`
session that neither wrote nor reviewed the lane's commits. **`review:
same-model`, and the `Co-Authored-By` trailer on those commits is a
harness constant and is NOT evidence of a model** — T-085 proved it,
T-101 sharpened it.

**THE VERIFIER CAUGHT ITSELF ABOUT TO REPORT A FALSE SURVIVOR, AND THE
MECHANISM IS EVERY READER'S.** Its first re-run of arm **A20b** came back
**exit 0**. The mutation was `const via = "" || (…)` — **`""` is falsy,
so the operator returns the original expression and the mutation is a
NO-OP.** Applied as `const via = "";` it reds. **An arm that does not
change behaviour is not evidence of a pin, and only READING THE DIFF BACK
caught it** — which is the drill rule doing exactly its job rather than
being ceremony.

**AND IT ACCEPTED THREE CORRECTIONS AGAINST ITSELF**, which is the other
half of the same discipline. (a) Its own correction to `T-111-s7` was
wrong: `fence.ts` matches `blocked|blocker` **zero** times, so it had
carried a FENCE-rule count of four into a ruling about the BLOCKER rule —
**`s7` stands as written and the correction does not**; re-derived, three
sites resolve a blocker id and two deliver a verdict. (b) The live fence
divergence is the **bare-word oracle** on `T-054`, not
`UNFENCEABLE_PATHS`, which is dormant. (c) The graph baseline had moved
under both seats.

**AND IT HAD OBSERVED THE NEAR-MISS DEFECT AND UNDER-REPORTED IT.** Its
own probe printed `PARSER_NEARMISS >>> undefined` on the shipped fixture
— the evidence that the fixture could not emit a near miss at all — and
the verdict reported only the render gap. **It had the measurement and
named half of it**; the fix pass found the other half.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 6bec5a2 a80870b -> tree 09a8279e, exit 0 (read from $? FIRST)
    git diff --name-only 6bec5a2..f3a4233   (THE MERGE'S DIFF)            ->   9   the only one that means anything
    git diff --name-only 6bec5a2...f3a4233  (three dots AT the merge)     ->   9   collapses, as it must
    git diff --name-only 15a963d..a80870b   (merge-base..tip, FORBIDDEN)  ->   9   agrees HERE and that is luck
    git diff --name-only 6bec5a2..a80870b   (two dots BEFORE the merge)   ->  47   ← the T-083 trap, live again
    git diff --name-only main..HEAD         (FORBIDDEN)                   ->   0   ← read this row twice

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0.** `merge-tree
--write-tree` returned **`09a8279e`** and the merge commit's own tree is
**`09a8279e`** — the same tree, byte for byte. No conflict, no
resolution; parents are `6bec5a2` and `a80870b` and nothing else.

**THE T-083 TRAP IS LIVE AND ITS MAGNITUDE MOVED AGAIN.** The pre-merge
two-dot form returns **47** here, against T-134's 12, T-135's 28 and
T-133's 39. **The figure is a function of how far main moved, not a
constant** — main advanced **38** paths since this lane's base, and 9 + 38
= 47 exactly. **AND THE FORBIDDEN merge-base FORM AGREES AT 9, WHICH IS
LUCK AND NOT LICENCE**: `15a963d` happens to be an ancestor of `a80870b`.
**That is the SECOND consecutive merge where it agrees**, which is the
more dangerous datum, because a form that agrees twice teaches the wrong
lesson twice.

**DISJOINTNESS PROVED AS TWO NAMED SETS.** The merge's 9 sorted paths
against main's 38-path advance: `comm -12` is **EMPTY**, and `diff` over
the prescribed and three-dot lists is **exit 0** — identical sets, not
merely equal counts. **There is no second live lane to prove disjointness
against**, which is derived from `git worktree list --porcelain` filtered
on `refs/heads/task/`, not assumed.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `6bec5a2` when the range was
derived and `6bec5a2` in the same command as the merge, read beside the
two diff checks. `git diff --cached --name-only` and `git diff
--name-only` were both **EMPTY** there, with one `??` row; **`??` alone is
not a ceremony.**

## THREE standing gates — ALL THREE FIRE, all derived from the merge's own 9 paths

| gate | trigger | on these 9 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **2 — FIRES** | **ASKED FOUR TIMES**: STALE → regen → CURRENT → CURRENT → CURRENT |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **1 — FIRES** | **RUN, exit 0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **7 of 9**, then **5 of 5** | exit **1** both times, **THREE** suites named, all green |

- **BOOT GATE — THIS IS THE ONE THE REJECTION WAS ABOUT.** Item 3 was
  that the gate fires on `app/src/**` and the second lane never mentioned
  it — not run, not declared, not routed, when `T-046` criterion 6
  assigns it to the executor and *a skipped gate is news, never silence*.
  The fix pass ran it; **so did this merge**, on scratch port **15872**,
  exit **0**, `[nputer] project folder: /Users/ujju/Projects/nputer` and
  `[nputer] window "main" created`. The check stopped its own captured
  process group with SIGTERM; **no `pkill` was issued.**
- **GRAPH REGEN — the graph IS regenerated and IS committed here**, in
  the checkpoint and not the merge. **ASKED, NEVER PREDICTED, AND ASKED
  AGAIN AFTER EVERY WRITE** — the identical-figures trap has fired at
  four checkpoints and three distinct graphs measured at exactly 970 961
  bytes in one session. It did not fire here, and that is a measurement
  and not a reprieve.
- **DOCS GATE — exit 1 twice.** On the merge's own paths it fires on 7 of
  9 and derives **16 readers across 4 suites** — up from 15, and **the
  sixteenth is `app/test/select-board.test.ts`, which this merge makes
  derivable**: that is `T-111-s8`'s fix landing on main, and the gate
  confirms it rather than the card claiming it. On the checkpoint's own
  paths it fires on **5 of 5**, naming STATE, ROADMAP, ARCHITECTURE, the
  card **and `docs/architecture/graph.json`, which had to be put in the
  list BY HAND** — `T-135-s3`'s hole, still unwritten in
  `docs/CONVENTIONS.md`, and **the third checkpoint running to do it by
  hand and have it work.** The graph's readers are
  `tools/e2e/tests/shell-frame.spec.ts` and
  `window-contract.spec.ts`. Census **133 sites in 23 files**, **0
  frontmatter issues**, **6 root-anchored all argued, 0 unlinked**, 2
  package-relative sites both resolving into `docs/`. Invoked DIRECTLY
  from the repository root, never through `xargs`, exit read from `$?`
  unpiped.
- **`cargo test` IS A FOURTH SUITE THE GATE STILL CANNOT NAME** —
  `T-132-s2`, unchanged. It was run anyway; see the suites.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **app: `npm run build` exit 0 · `npm test` 1013/1013 across 47 files,
  exit 0** — and **main's OWN baseline at `6bec5a2`, measured BEFORE the
  merge, was 973/973**, so this merge adds **40** bodies and the
  attribution is a measurement rather than a subtraction.
- **parser: 290/290 across 13 files, exit 0**, after `npm run build` from
  `lib/parser/`, which was run FIRST regardless. `npx tsc --noEmit` exit
  0. **Unchanged from T-134's 290** — this merge touches no parser file.
- **cargo: 512 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines; **16 `running N tests` headers sum to
  515 = 512 + 3 ignored**, which reconciles exactly. **512 is UNCHANGED**
  — this merge adds no Rust body — and the lib suite is **5.24s**, inside
  the healthy band.
- **E2E: 194/194, exit 0, FIRST RUN, 2.2m**, on explicit port **15871**,
  `lsof`-read at **zero rows at 14:49:28 EEST** immediately before
  binding and **zero rows at 14:51:38 EEST** afterwards. Header `Running
  194 tests using 1 worker` cross-checked against **194** `✓` bodies and
  0 failures.
- **ALL FOUR WATCHED CARGO BODIES WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id_in_the_init_line…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`, and T-135's live pin
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph` `ok`.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY**: `arch cycles
  --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35`, report on **stderr**
  at **645 bytes** with stdout **0 bytes**. **`arch cycles > out.txt` on
  a red yields an EMPTY FILE.** Untouched by this merge, which changes no
  registry file.
- **`arch drift` exit 0**: findings=4, undeclared=2, unmapped=0,
  declared_only=2 — `D1:C-05->C-15`, `D1:C-10->C-14`, `D3:C-01`,
  `D3:C-11`. **Unchanged in substance from T-134's checkpoint.**
- **`npm run lint:docs` exit 0** and **`npm run lint:tokens` exit 0** at
  **TOKEN 138 / CONTROL 769** — **AND BOTH LIVE IN
  `tools/e2e/package.json`**. Run from the repository root they exit
  **254** with `npm error enoent`, because **there is no root
  `package.json` at all**, and that reads exactly like a failing lint.
  **DERIVE THE CONTROL FIGURE AT YOUR OWN REF** — 778 at T-134's, **769**
  here, and the delta is not this merge's: the triage removed 16 files
  and this merge added 6. `git ls-files` reads **787**, and 787 − 18
  NUL-bearing = 769 exactly.
- **`npm run typecheck` from `tools/e2e` and from `lib/parser` exit 0;
  from `app/` it DOES NOT EXIST.** Unchanged and re-stated because its
  absence reads exactly like a type error — see the section below.
- **THE THREE OWED SUITES WERE RUN AGAIN AFTER EVERY DOC WRITE**, because
  the DOCS GATE fires on this checkpoint's OWN paths. Second runs: parser
  **290/290**, app **1013/1013**, e2e **194/194 in 2.1m** on explicit
  port **15881**, probed at zero rows at **15:08:22 EEST** and read back
  at zero rows at **15:10:27 EEST**. **Both e2e runs print the
  `range-rule DISCLOSURE` line and both carry `@ f3a4233`** — this
  merge's own commit — which is how a suite reports the ref it actually
  ran at; it is a disclosure and not a failure.
- **RUN LEDGER — every run declared, including the ones that agree.**
  parser build **twice** (baseline and merged), parser suite **twice**;
  app build **twice**, `npm test` **four times** (973 baseline · 1013
  merged · 1013 with the regenerated graph · 1013 after the doc writes);
  cargo **once** (512/0/3); `tools/e2e` **twice** (194/194 · 194/194) on
  ports 15871 and 15881; boot check **once** on port 15872; DOCS GATE
  **three times** (the merge's 9 paths; `--census` via `lint:docs`; then
  the checkpoint's own 5); `index --check` **FOUR asks**, `index --root
  ../..` **one write**, all from `app/src-tauri/`; `arch` **twice** (once
  either side of the regen, byte-identical), `arch drift` **twice**,
  `arch cycles` **once**; the flip census **twice** through the merged
  `fence.ts`. **THE SUITES THIS FILE'S OWN LAST WRITE OWES ARE DECLARED
  IN THIS CHECKPOINT'S COMMIT MESSAGE**, which is where the regress
  terminates — a commit message is not a code input.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS TWENTY CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **4.0 GB** here, unchanged from
T-134's — **this merge recompiles nothing but the indexer's own runs, which
is why** — and the lib suite is **5.24s** against T-134's 5.62s.
**TWENTY-EIGHT runs across nineteen integrations and not one lands between
9.5s and 14.6s.** Read the lib suite's own time first; it tells you which
regime you are in before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. Lanes may be building against this repository:
`lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
was declared settled at better than 400-to-1 on 15 clean-cache runs.
**T-086's lane refuted that within the hour**: 1 red in 4 full `cargo
test` runs in a FRESH lane worktree, with `docs_watch` GREEN and the lib
suite inside the healthy band. Run alone: **5 green in 5**. **THE
SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 22**.
It did NOT fire at this merge — read by NAME, `ok`. `T-086-s1` and
`T-102-s3`; fence `[app-agent]`, **FREE**.

## THE MTIME INTERMITTENT — EIGHT CONSECUTIVE GREENS ON FIXED CODE, AND `T-111-s9` IS WHY THAT SENTENCE IS NOT ENOUGH

`T-120-s3`'s fractional-millisecond mtime signature (`token-scan.spec.ts`,
`Expected …492.7957` against `Received …493`) was fixed on main at
**`cea839e`** (T-130). The nine-run tally on code that **cannot** carry
that fix was **3 red in 9 — near one in three**. **A red before `cea839e`
is not news; a red at or after it is.** This merge ran e2e twice, 194/194
both times, and it fired in neither — **eight consecutive clean runs on
fixed code.**

**AND `T-111-s9` IS THE REASON A GREEN TALLY HERE IS WORTH LESS THAN IT
LOOKS.** The body this prediction names (`token-scan.spec.ts:227`) can red
for a completely different reason — any unrelated control character
anywhere in the tracked corpus — **with a title that says nothing about
it and a remedy ("run it again") that is the same for both.** A session
that writes down *"the known T-120-s3 flake, red once then green twice"*
may be recording a real violation in its own diff. **Read the assertion,
not the body's name.**

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** `lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT. The
app resolves `@nputer/parser` through a symlink, so it compiles against
PRE-merge types and fails with e.g. `TS2339` while `vitest` transpiles
without typechecking. **One command clears it**: `npm run build` from
`lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT IS A MERGE THAT
CHANGES THE PARSER'S TYPES** — CONVENTIONS files the parser-before-app
ORDER under *fresh clone*, so a fully-installed main checkout reads as
exempt and is not. **THIS MERGE DOES NOT FIRE IT — `lib/parser/**` is a
0-file diff — and the build was run first anyway, in that order, and every
exit was 0.**

**AND THE SEPARATE UNBUILT-APP CLASS IS THE ONE THAT ARRIVES LOOKING LIKE
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns **14 failures
across six files** — the denominator is whatever the suite is at your ref
and was **973** when it was last measured, not re-measured here — every
message about an absent
`app/dist/assets` rather than about the tree. **Both CONVENTIONS bullets
that state it carry a stale denominator, and the file NAMES ITS OWN
CONTRADICTION**: `:856` says *"12 of 840 across five files"*, `:1328` says
*"14 failures across 6 files … 924/924"*, `:1327` says *"SIX files since
T-013 … where the LANE PROTOCOL bullet below still says five"*, and the
suite is now **1013**. **It was exactly as false at this merge's parent**,
so ruling thirteen returns **FILE**, and the seat is `T-092`/`T-093`.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

`npm run typecheck` from `app/` exits **1** with `Missing script`. **The
app's typecheck is the TWO `tsc` calls inside `npm run build`** — `tsc &&
tsc -p tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap.

**AND THIS LANE PAID FOR IT.** Its fix pass wrote a `filter` with a plain
predicate, which returns the whole `ParseIssue` union, so
`emitted[0]?.nearMiss` is **TS2339** — and `vitest` does not typecheck, so
**1013/1013 exit 0 said nothing about it.** The lane's last `npm run
build` predated the edit and the DRILL worktree's cold build is what found
it. **`npm run build` is the typecheck gate and it has to be the LAST
command, not an earlier one.**

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT

**`T-132-s6`, unchanged.** `resolveLanePort()`'s default **14520** is a
CONSTANT shared by every checkout on the machine, so rule 4's
checkout-granular partition does not reach it. **The remedy in practice:
pass an explicit port and re-probe immediately before binding.** This
integration used **15871**, **15881** and **15872**, each `lsof`-read at
zero rows immediately before binding and zero rows after, with the clock
on every reading. **No collision, and a probe reserves nothing — the
runner's own bind is what proves the port was free.** `resolveLanePort()`
THROWS on 1420 by construction, and `NPUTER_BOOT_PORT=1420` REFUSES at
exit 3 before anything is probed or spawned.

## `T-133-s5` — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green at 33, because the shell renders the
project path and the chrome wraps. **The threshold is bracketed between
116 and 128 characters** — at 116 it measures 252 px against a 250 px
floor at 800×600, TWO PIXELS of margin. **Cut drill and scratch worktrees
at SHORT roots.** This integrator cut none, so nothing here re-measures
it; the lane's own drills were 18–19 characters and never approached it.

## The board, derived from disk at this checkpoint

**290 flat task files — 100 done / 35 planned / 41 parked / 113 suggested
/ 0 verifying / 1 building; 27 in `rejected/`.**
100 + 35 + 41 + 113 + 0 + 1 = 290. **`done` MOVES to 100 — the hundredth
card this project has finished — and T-111 is the only card this merge
stamps.** `verifying` goes 1 → **0**. The one `building` is `T-135`, which
holds no lane and is open on purpose.

**THE FLAT COUNT IS DOWN TEN FROM T-134's 300 AND ONLY SIX OF THE
MOVEMENT IS THIS MERGE'S**: the eleventh triage removed **16** outside
this merge's range, and this merge adds **six** — `T-111-s5` … `s10`.
300 − 16 + 6 = 290. **`rejected/` does NOT move**; see the triage section.
**Derive it at your own ref and stamp the reading**, because on this
project that paragraph has gone stale inside forty minutes.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND THIRTEEN AND HAS JUST BEEN
TRIAGED FOR THE ELEVENTH TIME, IN PART.** It went 123 → 107 at `6bec5a2`
and 107 → **113** here. **PART 2 OF THAT TRIAGE IS NOT ON MAIN**, and
three items were **HELD FOR @human** rather than applied: `T-107-s1`
(where the analyst rejected on evidence and then said plainly that
*"should a user-facing notice name a version floor"* is a product decision
it is not entitled to make), and `T-033-s6` and `T-033-s8`, which are
ratification requests where the reject IS the ruling.

## Provenance — SELF-DECLARED, never read off a trailer

**100 done cards — 75 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 75 + 19 + 5 + 1 = 100. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented**, and this merge adds the 75th
`same-model`: T-111 was built by `claude-opus-5` across two lanes and a
fresh-hand fix pass, verified by a different `claude-opus-5` session
twice, and integrated by a third. **`same-model` is not a weaker verdict
than `independent`** (TASK-FORMAT's own paragraph); it records WHICH HAND
HELD THE PEN, and the one value naming a MISSING guarantee is
`self-verified`.

## Documents ticked

- **STATE — rewritten, as a snapshot.** `T-133-s2`'s edit (dropping the
  four sections `brief.mjs --state` can answer) was **NOT performed**:
  `docs/STATE.md` is free, but that edit is a card of its own and taking
  it inside a checkpoint would bundle a routed change with a merge.
- **The card** is stamped **`done`** with `verifier:`, `built_by:`,
  `verified_by:` and `review: same-model` filled, and gains an
  `## Integration` section. **Both lanes' notes, the fix pass's notes,
  the rejection and the re-check are preserved byte-untouched.**
- **ROADMAP — TICKED, AND THE F-04 PROGRESS LINE MOVES FOR THE FIRST TIME
  IN EIGHT MERGES: 4 of 7 → 5 of 8.** Seven consecutive checkpoints wrote
  down that it did not move, each for a different reason; this is the
  first one whose card is F-04 slice content. **The milestone-4 census is
  IDENTICAL to T-134's** — 98 cards, F-01 10, F-02 43, F-03 12, F-04 8,
  F-06 25 — and that is the point: T-111 was already inside the count
  before it landed, so the census and the progress line answer different
  questions and were never expected to move together.
- **ARCHITECTURE — UPDATED, and rule 3's *"if any interface moved"*
  answers YES.** C-05's row gains the frontier — the six dispositions,
  the reason-sentence rule, the four pinned properties, the measured
  decline to import `fence.ts`, the rejection and what it was about, and
  the NUL with its root cause. C-07's row gains the byte-budget entry:
  **989 181 bytes — 98.92%, 10 819 bytes of headroom**, spending
  **18 220**, and the first entry in the series that moves no `arch`
  figure at all. **AND ONE CITATION THIS MERGE MADE FALSE IS REPAIRED IN
  PLACE**: the slug-map paragraph said *"T-111's frontier is the thing
  that should compute it instead of reading it"* — future tense, true
  when written, false at this commit. It is corrected with its ref rather
  than deleted, and the correction carries the honest residual: there are
  now **TWO** implementations that compute it, which is `T-057`'s own
  failure shape and exactly the debt `T-137` exists for. **The derived
  slug block was re-derived mechanically and is UNCHANGED.**
- **CONVENTIONS — NOT TOUCHED.** Its two stale unbuilt-app denominators
  are FILED and not repaired, and `arch blast` still joins `arch cycles`
  in the queue at `T-127-s5`. **`T-111-s10` adds an eleventh edit to that
  seat.**
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The decision this card embodies —
  `orchestrator.md` step 4 computed rather than read — is the milestone's
  own stated goal and needs no ADR to authorise it, and the one genuinely
  non-obvious decision inside the lane (declining to import `fence.ts`)
  is **routed to `T-137` with its measurement** rather than ruled here.
  **ADR-018 IS STILL OWED AND IS STILL T-135 HALF B's.**
- **`graph.json` REGENERATED and COMMITTED HERE**, in the checkpoint and
  not the merge, with no fixture reconciliation because none is owed.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT A
SECOND TIME.** Two of this merge's nine paths are under `app/**`
(`app/src/lib/board-model.ts` and `app/test/select-board.test.ts`); seven
are `docs/tasks/`. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER
TO THE DEPENDENCY QUESTION** (integrator.md rule 2), and here it would
not even be available — so it was answered from the build order instead:
**this integration DID rebuild `lib/parser/dist` and DID write
`app/dist`, and both land in `/Users/ujju/Projects/nputer`.** The vite
serving 1420 has `/Users/ujju/Projects/nputer-app/app` as its cwd —
**@human's own checkout, eleven merges behind** — and
`app/node_modules/@nputer/parser` there is a **RELATIVE** symlink
(`../../../lib/parser`, re-read at this ref in BOTH checkouts rather than
quoted), so each resolves inside its own checkout with its own
`lib/parser/dist`. **The running product reads none of what this
integration wrote.**

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a fact
of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this checkpoint's regenerated `graph.json`
and the stamped `T-111` card reached the running board through the
watcher**, and the map pane would re-render. That is an INTERRUPTION
channel (a re-render), never a breakage one, and no integrator can read
which folder is open without touching the app.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **46532**, `TCP
[::1]:1420 (LISTEN)`, read at **14:40:34 EEST** (before any command that
writes) and again at **15:19:04 EEST** after the suites, the gates and the
doc writes. **Both readings identical, same pid, same single LISTEN
socket.** The
anchored process read — `ps -o pid,lstart,command -p 46532` — reports
`node /Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started
**Wed Aug 26 11:04:22 2026**, and `lsof -a -p 46532 -d cwd` reports cwd
`/Users/ujju/Projects/nputer-app/app`. **A pid, a port holder and a start
time are live-environment facts, not functions of a tree. All three are
already stale for you.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: `app/node_modules`, `lib/parser/node_modules`,
`tools/e2e/node_modules`, both `dist/` directories and `target/` were
checked and all six were present, so **no fresh dependency install was
owed and no `npm ci` was run**. **AND THE ONE-STEP REPAIR ITEM 12 KEEPS
ASKING FOR WAS PERFORMED BY HAND FOR THE EIGHTEENTH CONSECUTIVE
INTEGRATION**: `lsof -a -p <holder pid> -d cwd` puts 1420's holder in a
DIFFERENT checkout, so even an owed install could not have reached it.
**There is no root `node_modules` and there is no root `package.json`.**

**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **thirtieth** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting. No `git add -A` — every write used `git commit -- <paths>` with
the paths listed explicitly.** Be precise rather than claiming more than
is true: this integration's `cargo test` run and its **TEN**
`nputer-index` invocations — four `index --check`, one `index --root`,
two `arch`, two `arch drift`, one `arch cycles` — all WROTE to main's
`app/src-tauri/target/`,
which reads **4.0 GB**, as any cargo run must. **The ONLY sibling worktree
modified was T-111's own, and only by removing it** — every other was read
with `git -C … rev-parse` and `git -C … status --porcelain` and `lsof`
only. **All scratch work for this integration lives outside the
repository, and no worktree was cut at all.**

## In progress / broken right now

**NOTHING IS BROKEN. THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED. THE ONE
`building` CARD WITHOUT A LANE IS OPEN ON PURPOSE.**

**NO LANE HOLDS A FENCE. THE WHOLE BOARD IS FREE.** Read `git worktree
list` — or run `brief.mjs --state`, which stamps the reading with a clock
— rather than any table here. **`T-135` is `status: building` with no lane
and Half B unwritten**, waiting on @human's look at its §6 and §7, an
architect-widened fence including `docs/decisions/`, and the TS half of
§7's floor rule (`arch blast` prints a bare `dependents=0` for three TS
roots, indistinguishable from genuinely unimported files). **It must not
be re-dispatched whole: Half A is on main and its criteria 1–3 are
discharged.**

## Next up

1. **`T-112` IS THE OBVIOUS NEXT CARD AND IT IS THIS MILESTONE'S OWN
   REMAINDER.** The slice's goal sentence has three clauses; T-110
   delivered the first, T-111 delivers the second, **and T-112 is the
   third — the brief and the lane commands.** It is `planned`, F-04,
   and it is now unfenced. **BUT IT IS THE BOARD'S MOST COLLIDING CARD**:
   19 of the 25 live flips are `T-112` pairs, on `app/src/assets` and
   `app/src/styles`, invisible to a token comparison. **Sequence it
   deliberately, and derive the pairs.**
2. **`T-137` — R1's VEHICLE, AND IT NOW HAS THREE IMPLEMENTATIONS TO
   RETIRE, NOT TWO.** `touches: [lib-parser, app-map, tools/e2e]`. The
   fence rule is now spelled in `lib/parser/src/fence.ts` (canonical),
   `tools/e2e/scripts/dispatch-brief.mjs` (T-133) and
   `app/src/lib/board-model.ts` (this merge). **`T-111-s5` is the move
   list and it names the ONE decision T-137's criteria do not settle** —
   where the column ORDER lives, with three options and a recommendation.
   **The board-local copy is the one that must not simply be deleted**:
   it carries provenance (`viaComponents`) that `FenceWitness` does not.
3. **`T-131`, `T-105` OR `T-128` — EXACTLY ONE OF THE THREE, AND NOT
   BESIDE `T-138` OR A LIVE `T-135` HALF B.** All three read
   `overlapping` against each other on `docs/CONVENTIONS.md` and
   `method/`, visibly. **All three overlap `T-135` and `T-138`
   INVISIBLY** — `method/tasks/TASK-FORMAT.md` and
   `method/roles/{executor,orchestrator}.md`. **Four cards contend for
   `method/` and only one may hold it.**
4. **`T-138` — THE FENCE MECHANISM'S FIRST CONSUMER.** `touches:
   [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]`.
   `CLAUDE.md` is the first repository-root file token this board has ever
   carried and it is only expressible because of T-134. Its subject is
   that the read-first set has three spellings and its designated
   authority omits the product document.
5. **HALF B OF `T-135`, AND ITS THREE PRECONDITIONS** — see *In progress*
   above. `T-135-s1` and `T-135-s2` are its two graph cards, both
   untriaged.
6. **`docs/CONVENTIONS.md` IS FREE AND ELEVEN EDITS ARE QUEUED AT ITS
   SEAT — TWELVE SINCE THIS MERGE.** `T-104-s5` carries the argument.
   **THE NEW ONE IS `T-111-s10`, AND IT IS ONE WORD**: the POISON DRILL's
   arm (c) tells a drill to put `CARGO_TARGET_DIR` **inside** its
   worktree, and `index --check` excludes `target/` and nothing else — so
   following the rule faithfully turned `files +0 -0 ~2` into **`files +3
   -0 ~2`** and `edges +50 -3` into `+51 -3` on a clean tree, with three
   phantom `.fctarget/debug/build/serde*/out/private.rs` files formatted
   exactly like real ones. **`files +0 -0` is the sentence a checkpoint
   decides on, and a standing rule inverts it.** The recommended repair
   is to make arm (c) say `<scratch>/target`, which the walk already
   excludes; teaching the walk to skip any directory with a `CACHEDIR.TAG`
   is the general fix and a different fence. **THE COMMAND LIST — three
   edits**: `T-127-s5` (`arch cycles` and `arch blast`) and `T-133-s1`
   (`brief.mjs`). **THE RANGE RULE BULLET — three edits, to `T-093`**,
   plus this merge's seventh candidate: the forbidden merge-base form
   agreed at 9 here, **the second consecutive merge it has agreed at.**
   **THE POISON DRILL BULLET — five edits now, to `T-092`**, the fifth
   being `T-111-s9`'s: *a log that answers "Binary file matches" is a
   measurement that did not happen.* **AND THE TWO STALE UNBUILT-APP
   DENOMINATORS** (840 at `:856`, 924 at `:1328`, against 1013 on disk).
7. **`T-111-s9` — `token-scan.spec.ts` ASSERTS WHOLE-CORPUS TOTALS FROM
   BODIES THAT PLANT ONE VIOLATION.** `[tools/e2e]`, **FREE**, and the
   most dangerous of this merge's two new findings because one of the
   three bodies it reds is character-perfect camouflage for `T-120-s3`.
   Its repair options (a) *assert the delta, not the total* and (c) *name
   the residual in the failure message* **compose**, and (c) is the
   cheapest thing in this list: print `select-board.test.ts:byte 67908`
   instead of `Expected 7, received 9`.
8. **`T-135-s3`'s GENERAL FINDING IS UNFIXED AND IT IS CHEAP.** A sentence
   in the GRAPH REGEN bullet naming the DOCS GATE as owed on the
   checkpoint's OWN graph commit. **This checkpoint did it by hand for the
   third time and it worked again.** Same seat as item 6.
9. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still returns
   **zero rows**, re-checked at this ref with `command grep`, for the
   ninth checkpoint running. **`method/` is free**, and this merge adds a
   fifth clean case (forecast tree `09a8279e`, merge tree `09a8279e`).
10. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
    EXIST.** Unchanged; option (1) — write it in `lane-protocol.md` rule 4
    — is preferred. Fence free.
11. **`T-111-s7` — `task-waves.ts`'s `readSchedule` IS A SECOND DERIVATION
    OF WHETHER A BLOCKER BINDS**, and it folds a dangling blocker into
    `blocked` — the exact fold this card rules against. `[app-map]`,
    **FREE**. **The good news is on the card**: the map's tasks lens has
    been resolving the ids correctly all along. Its ordering is sound —
    land after `T-111-s5`'s move and it becomes a deletion rather than a
    refactor. **THE VERDICT'S CORRECTION TO IT WAS WRONG AND THE VERIFIER
    WITHDREW IT**: `fence.ts` matches `blocked|blocker` zero times, so
    `s7` stands as written.
12. **`T-126-s3` — FIVE WRITTEN STATEMENTS ABOUT C-15 ARE STILL FALSE ON
    MAIN**, and `arch drift` still reports `D1:C-05->C-15` as the FIRST of
    two D1s where item 4 calls it the *"fifth D1"*. **Nothing reds.** The
    one-line registry fix was again deliberately not made: it was exactly
    as false at this merge's parent.
13. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
    PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the
    `app/test/**` fixtures) and `lib-parser`. **`app-shell` IS NOW FREE**
    — this merge is what freed it.
14. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING.** A
    word for C-10 frees 2 of 8 fences outright. **`T-127-s4` is its
    warning label**: a `touch_slugs:` edit is invisible to every suite in
    this repository — and **this merge widens that surface a second
    time**, because `expandTouch` now READS `touch_slugs:` as well as
    `slugPathIndex` does, so a malformed one changes what the BOARD shows
    as well as what a dispatch computes. **`app-shell × app-board` at C-11
    is 19 of the flips' shape one component over.** Fence
    `[docs/architecture/components/]`, FREE.
15. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — EIGHTEENTH
    CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
    DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
    `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
    — `lsof -a -p <pid> -d cwd`** — and this integration is a worked
    example again. Fence `[docs/CONVENTIONS.md]`, **FREE**.
16. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64; (b) the live
    positive control is brittle to a shared closing hop. `[crate-index]`,
    **FREE.**
17. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, **FREE**.
18. **`T-108-s3` WAS REJECTED AT THE ELEVENTH TRIAGE AS DISCHARGED BY
    T-134**, whose rule 5 puts a card's own file outside every fence. **Be
    careful what that closes**: question 1 is answered; the SECOND
    conflict on `executor.md` step 5 — the verifier reading the file that
    role writes into — is untouched, and `T-135-s4` still belongs beside
    it.
19. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-22.** Two findings, one body, `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence. **AND THE MTIME INTERMITTENT** —
    `T-120-s3`, now eight consecutive greens on fixed code — is
    `[tools/e2e]`, **FREE**, and see item 7 for why a green tally there is
    worth less than it looks.
20. **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class; `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, **now FREE**). **`T-129-s2`**, **`T-129-s3`**,
    **`T-129-s5`** are `crate-index`, **FREE**.
21. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**. Measured: **exit 0 as `.rs`, exit 134 as
    `.ts`**, and TS `namespace` chains abort at **2 000** against Rust's
    tightest **3 000**, so **TypeScript is the MORE exposed language.**
22. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals;
    the C-09 → C-08 direction has THREE closing edges and the card names
    two.
23. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, threshold bracketed 116–128 characters, two-pixel margin at
    800×600. The fix is in `app/src` (`app-shell`) — **now FREE.**
24. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
25. **THE ELEVENTH TRIAGE IS HALF-APPLIED AND ITS SECOND HALF IS SOMEBODY
    ELSE'S IN-FLIGHT WORK.** Three items are **HELD FOR @human** and the
    fourteen `rejected/` copies are staged in `arch-verify`. **Do not
    re-triage what is already dispositioned**, and match on `^id:` rather
    than a filename glob: that is what caught `T-033-s7` and `T-033-s10`,
    both already promoted by `T-127` and still sitting in the corpus as
    live findings.
26. **THE BOARD-TRUTH RULING** — TWENTY-SECOND ask. **A PATTERN COUNT IN
    THE FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column
    still closes at the first push, and `git remote` still returns zero
    remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief in this thread has contained at
least one error, and saying so is the most valuable thing a checkpoint
returns.** This brief's central instruction was again a reading list —
`git show a80870b`, then `git show 75b7626`, then the lane's notes commits
and `T-111-s5`…`s10`, because *a summarised finding loses the findings
inside it* — **and that instruction is again the reason this checkpoint
has anything worth reading in it.** Sorted into the four categories it
asked for.

1. **FACTS — ONE IS WRONG, AND IT IS THE ONE ABOUT THE DEFECT THAT HIDES
   ITSELF.** *"Measured just now: 22 tracked files are binary-to-grep and
   zero are source-shaped."* **The zero is right and the 22 is not the
   NUL count.** Derived at this merge with a NUL test that cannot degrade
   — `perl -0777 … index($_, "\0")`, because a shell cannot pass a NUL to
   `grep` and `$'\0'` silently becomes an EMPTY PATTERN THAT MATCHES
   EVERY FILE (I wrote that bug on my first attempt and it reported all
   787) — **exactly 18 tracked files carry a NUL and all 18 are icons and
   fonts.** 18 is also what the verifier read at `70dbf83`. "Binary to
   grep" is a strictly wider class than "NUL-bearing", so 22 may be true
   of a different question; **the load-bearing half — zero source-shaped —
   holds, and the lint's own corpus arithmetic closes on 18** (787 tracked
   − 18 = 769 CONTROL). Everything else confirmed: the tip is the
   RE-CHECK VERDICT commit; `edges +50 −3` against the moved baseline
   `616205de`; `files +0 −0 ~2`; 1013/1013 with the regenerated graph;
   `arch cycles` exit 1 with stdout empty; `lint:*` in
   `tools/e2e/package.json`; `npm run typecheck` from `app/` absent; ports
   machine-wide; and the `grep` shim's `-I`, reproduced here with its own
   positive control.
2. **PREDICTIONS — ONE WAS RIGHT AND ITS SUCCESSOR IS ALREADY WRONG.**
   *"The no-reconciliation conclusion survives the new baseline — verify
   it at yours, because main has moved again."* **Correct, and the
   verification was worth doing**: main HAD moved again (`6bec5a2`,
   sixteen deleted cards), and the answer held at a third baseline.
   **What the brief could not predict is the one figure that changed
   character**: the byte budget. T-134's checkpoint said the headroom held
   *roughly two more merges of this size*; at **10 819 bytes** it now
   holds none, and that sentence went from a comfortable margin to a
   binding constraint in one merge.
3. **ARGUMENTS — THE CENTRAL ONE IS RIGHT AND ONE OF ITS PREMISES IS
   OVERSTATED.** *"`FenceWitness` carries no component ids, so importing
   would delete the coarse clause the rejection's repair 2 just pinned two
   ways."* **Confirmed, measured, and it is the decisive reason of the
   three.** But the brief's *"every disagreeing pair involves `T-054`,
   which is `done`"* is offered as though `done` settled it permanently.
   It settles it **today**: the divergence goes live the moment anyone
   drafts a card with a bare-word `touches:` entry, and the vocabulary
   shows that is a shape authors reach for. **Dormant is not closed**, and
   the brief's own instruction — *do not let the checkpoint read as an
   oversight* — is best served by saying when it wakes up rather than only
   that it sleeps.
4. **STALENESS — THREE, AND THE FIRST IS ONE NO BRIEF COULD HAVE
   CARRIED.** *"The verifier's range at `6a6bc87` is already stale (main
   is `6bec5a2`+)."* **Correct** — and `6bec5a2` is not an ordinary
   advance: it is a **sixteen-card deletion including three of this
   card's own suggestions**, which is precisely the event the merge's own
   dangling-blocker pin is a tripwire for. **Second:** the brief says the
   checkpoint should note the lane's four `/private/tmp/t111*` drill
   checkouts as the previous one did; **they are gone — the glob matches
   nothing at this ref.** **Third:** the brief's *"22 tracked files"* was
   stated as *measured just now*, which is exactly the shape this project
   distrusts in every other paragraph — **a measurement without its
   command is a number, and a number is a line number by another name.**
