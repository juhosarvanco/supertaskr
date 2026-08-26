# State

Updated: 2026-08-26 by the T-139 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP. NOTHING IS BROKEN.
ONE COMMAND ON MAIN EXITS 1 ON PURPOSE. ONE CARD IS `status: building`
WITH NO LANE, AND THAT IS ALSO ON PURPOSE. TWO LANES ARE LIVE AFTER THIS
CHECKPOINT — `T-137` and `T-138`** — derived from `git worktree list
--porcelain` filtered on `refs/heads/task/`, not from this paragraph.
This merge is **518 / 1013 / 290 / 194 green**. `cargo run -p
nputer-index -- arch cycles --root ../..` is **exit 1** on main and that
is the DESIGNED state — the declared cycle `C-08 -> C-09 -> C-08`
survives because removing it needs paths T-127's fence could not reach
(`T-127-s1`). **The ENFORCING copy is `cargo test`, which is green.**

**AND `arch drift` NOW REPORTS FIVE FINDINGS WHERE IT REPORTED FOUR, WITH
`unmapped=1`. THAT IS THIS MERGE'S OWN AND IT IS NOT BROKEN EITHER — IT
IS THE MAP DOING ITS JOB.** See the D2 section below before you "fix" it.

## **BOTH GRAPH LIMITS NOW CARRY A MEASURED REASON, AND THE STAGE THAT BINDS IS THE ONE NOBODY WOULD HAVE GUESSED**

`max_graph_bytes` goes **1 000 000 → `1_040_000`**; the docs collector's
`MAX_FILE_BYTES` stays at **1 048 576** and that is a decision rather than
an omission. Both reasons sit at their definition sites with the
measurement, the machine and the ref.

**THE THREE DELIVERY STAGES WERE MEASURED SEPARATELY AND THE IPC HOP
BINDS.** Delivering the live 989 181-byte `graph.json` to the pane costs
**3.66 ms**: read **0.126 ms (3.4%)**, IPC **2.374 ms (64.9%)**,
`JSON.parse` plus model construction **1.160 ms (31.7%)**.

**AND IT BINDS FOR THE CHANNEL'S SHAPE RATHER THAN FOR ITS SIZE**, which
is the finding worth carrying out of this card. tauri's `EmitArgs::new`
(`event/mod.rs:130`) serialises the snapshot and `emit_js_script`
(`:194`) splices that JSON **verbatim into a JS SOURCE string** which
`webview/mod.rs:1975` hands to `eval` — so the webview parses a
megabyte-scale object literal with its **general JavaScript parser**, not
the engine's JSON fast path. On JavaScriptCore, the engine a macOS
WKWebView actually runs: **1.76 ms to eval against 0.92 ms to
`JSON.parse` the same bytes**, at every size, linearly. About half that
stage is the channel. Routed as **`T-139-s2`**. All three citations were
verified by the verifier **at the vendored tauri 2.11.5 source** rather
than quoted from the lane.

**LINEAR TO 14 MB, NO KNEE** — and 14 MB is the JS half's reach (its pool
exhausts at 14 219 275 bytes); 25.6 MB is the RUST half's. **Nothing in
any stage argues for a limit anywhere near 1 MiB**, so time cannot set
this number and what sets it is the collector's cliff and only the cliff.

## **THE VERIFIER RULED AGAINST THE LANE ON ONE THING AND THE APPROVAL DOES NOT RATIFY IT**

**THE LANE DECLINED TO POISON-DRILL ITS TWO HARNESSES**, arguing that a
measurement is not an assertion. **The verifier ran the drill anyway and
the exemption did not survive.** Reverting the eval cursor to an index —
one token — makes JavaScriptCore report **0.00 ms at EVERY size**,
including 14 219 275 bytes where V8 in the same table reads **40.04 ms**.

**THE RULING: A HARNESS ASSERTS THAT ITS NUMBER IS THE COST OF THE WORK
IT NAMES.** That assertion is falsifiable, it was FALSE in this lane's
first version, and the fixed version's central guard was falsified in one
edit. **Neither harness runs in any default suite** — `graph_budget_bench.rs`
is `#[ignore]`d and `graph-budget-bench.mjs` is unmatched by vitest — so
nothing in this repository would catch the regression. The right
disposition was not exemption but ONE drill on the guard that makes the
number mean anything.

**THE NUMBERS ARE SOUND AND THIS IS A FINDING ABOUT THE RULE.** The lane
found the defect itself, carries three real internal positive controls
(the `value === undefined` throw, the `__received.payload.files` check,
the `issues` column), and the verifier reproduced the whole table on its
own machine of the same class. **Recorded here so the approval is not
read as ratifying the exemption**, which is the thing an approved verdict
does silently if nobody writes it down.

## **THE MEASUREMENT DOES NOT SELECT 1 040 000, AND @human's LOOK IS ON EXACTLY THAT**

The measurement rigorously supports the **DIRECTION** (no stage binds near
1 MiB) and the **CEILING** (the cliff, and only the cliff). **It does not
choose this number.** Any value in **(989 181, 1 048 576)** is equally
defensible on this evidence.

**AND THE CARD'S STATED REASON FOR THE SURVIVING 8 576-BYTE GAP IS WEAKER
THAN IT READS.** The lane says the two limits are "two DIFFERENT
measurements in two different crates". **The verifier read the code and
found them BYTE-IDENTICAL**: `apply_budget` measures
`stable_json_string(&graph)?.len()` and `write_graph` writes THAT SAME
STRING, trailing newline included. So the gap's justification reduces to
*give the strict `<` in the pin something to catch*. **Say so when you
present the number.**

**THE RAISE BUYS ABOUT THREE ORDINARY MERGES, NOT A NEW REGIME.** Headroom
goes **10 819 → 50 819**, i.e. **0.69 → 3.2 merges** at the mean
single-commit growth of 15 751, and **42 798 (2.7 merges)** once this
lane's own 8 021 bytes land. **The largest growth on record, 241 980,
still overshoots the new budget by ~5x.** Growth is absorbed by
truncation — that is what the budget is FOR — but the raise removes the
NEXT merge's pressure and not the pressure.

**AND `T-140` IS ON MAIN PRECISELY SO THIS IS NOT MISTAKEN FOR AN ANSWER.**
Filed by the architect at `7f91ee4`, `blocked_by: [T-139]`, `milestone: 5`,
`touches: [crate-index, app-map, app-shell]`. Its first line is *"This
card exists so `T-139`'s raise is not mistaken for an answer."* **The
graph's FLOOR is 802 bytes per file, so the map stops working at about a
thousand files.** The budget bounds what the map may KNOW; the floor
bounds what it can REACH. **This stamp unblocks T-140. Its fence is a
different question and is NOT free — `T-137` holds `app-map`.**

**THE VERIFIER'S OWN SHARPEST FINDING TURNED OUT TO BE ALREADY OWNED.** It
found that the safety property has TWO conjuncts — `max_graph_bytes <
cap` AND `apply_budget`'s FLOOR under the cap — and that the pin holds
only the first, because the floor branch returns a valid OVER-BUDGET
document by design. Today the floor is ~205 000, 5.1x of headroom, so it
is not urgent HERE. **T-140 owns exactly that**, and the two floor figures
measure different things and do not conflict: T-140's 146 788 is files
plus import edges ALONE; the ~205 000 is what `apply_budget` actually
emits at its floor, which also retains non-import edges touching no
symbol.

## **THIS MERGE PUT A FILE IN THE UNMAPPED BUCKET AND NOTHING IN THE REPOSITORY WENT RED**

**`app/src-tauri/tests/graph_budget_bench.rs` LANDS UNDER NO COMPONENT'S
GLOBS.** `app/src-tauri/tests/` is claimed one file at a time — C-14
declares `agent_runner.rs` by name and nothing declares a prefix — so this
repository now carries the **SECOND D2 it has ever had**, the first having
stood for a single day at T-033. `arch` goes from
`files=183 mapped=183 unmapped=0 edges=37 findings=4 drift_components=4`
at the parent `00e133a` to **`files=185 mapped=184 unmapped=1 edges=39
findings=5 drift_components=5`** after the checkpoint's regen.

**ONE UNCLAIMED FILE DRAWS TWO UNDECLARED EDGES** — `unmapped -> C-07` and
`unmapped -> C-10` — because the harness imports `nputer_index` and
`docs_watch`. Declare it and all of it retires at once; that coupling is
why it is one finding and not three.

**AND THE PART THAT MATTERS FOR EVERY FUTURE MERGE: NOTHING ON THE RUST
SIDE REDS FOR IT.** `arch drift` exits **0** without `--fail-on`, and
`crates/nputer-index/tests/arch.rs` pins the **CYCLE** census rather than
the drift census. `cargo test` was **518/0/4 exit 0 both before and after
the regen** — byte-identical result on a graph that grew a D2 underneath
it. **The whole of what noticed is EIGHT BODIES AND EIGHTEEN ASSERTIONS
in two TypeScript dogfood fixtures**, `app/test/architecture-dogfood.test.ts`
and `app/test/map-dogfood-render.test.tsx`. A repository whose only
tripwire for unclaimed Rust territory is a React render test is worth
knowing about.

**THE FIXTURES WERE RECONCILED, THE DECLARATION WAS NOT MADE.** Reconciling
is repair: those assertions were TRUE at `00e133a` and this merge's own
regen made them false. **Declaring an owner is a disposition** — the
harness imports across C-07 and C-10 and choosing between them is a
registry decision — so it is ROUTED (see *Next up*), and the reconciled
fixtures now RECORD the D2 rather than hide it. **Repairing it the other
way would have destroyed the evidence that this merge created unclaimed
territory**, which is the most interesting thing about it.

**AND THE SECOND-ASSERTION TRAP FIRED IN BOTH FILES.** The first pass
showed **8 failed / 1005 passed**; the real count is **18 assertions**,
because a red assertion hides every assertion below it in the same body.
`architecture-dogfood.test.ts` has carried a comment warning about
exactly this since T-053 and `map-dogfood-render.test.tsx` since T-028.
**A fixture pass must re-run until the BODY is green, never until the
first message stops appearing** — this is the second consecutive
integration to prove that warning with its own re-run.

## **THE IDENTICAL-FIGURES TRAP FIRED IN ITS PUREST FORM YET, AND IT COST A SECOND REGEN**

**ASKED SEVEN TIMES, NEVER PREDICTED, AND TWO OF THE SEVEN CAME BACK
STALE.** At the merge: STALE, `files +2 -0
~4`, `edges +6 -0` (2033 + 6 = 2039). Regenerated: **997 202 bytes · 185
files · 2124 symbols · 2039 edges**. CURRENT. Then the fixture
reconciliation wrote two indexed `.ts/.tsx` files, and the fourth ask
came back:

    committed:   997202 bytes · 185 files · 2124 symbols · 2039 edges
    fresh index: 997202 bytes · 185 files · 2124 symbols · 2039 edges
    -> STALE, exit 1
    files  +0  -0  ~2   (architecture-dogfood.test.ts loc 1979 -> 2044,
                         map-dogfood-render.test.tsx  loc  695 ->  738)

**ALL FOUR PRINTED FIGURES ARE IDENTICAL ON BOTH SIDES AND THE ANSWER IS
STILL STALE.** T-134's checkpoint had three graphs at 970 961 bytes; this
one has **two distinct graphs at 997 202 bytes with matching file, symbol
AND edge counts** — sha256 `404aa1e1…` before the fixture writes and
**`7dc42d70…`** after. **A BYTE COUNT IS NOT A CONTENT CHECK, AND NEITHER
IS THE WHOLE SUMMARY LINE.** Ask `index --check`, and ask it again after
every write. `arch`'s output is byte-identical across the second regen
(`diff` exit 0).

**THE FOURTH MODIFIED FILE AT THE FIRST ASK IS NOT THIS LANE'S.**
`app/test/architecture-dogfood.test.ts (loc 1974 -> 1979)` came from main
at `6dc5757`, and it costs **zero bytes** because `1974` and `1979` are
the same width. **So main's committed graph was ALREADY STALE at this
merge's parent, at an identical byte count** — nobody would have seen it
by looking at a size. The verifier's "the lane's diff SPENDS 8 021 bytes"
is right about the number and one row too generous about the attribution.

## **THE BYTE BUDGET, AT THE NEW NUMBER — AND THE CITATION THAT MOVED UNDER IT**

**997 202 of `max_graph_bytes` 1 040 000 = 95.88%, 42 798 BYTES OF
HEADROOM**, spending **8 021**. **Under the OLD budget that same graph
reads 99.72% with 2 798 bytes left** — which is the arithmetic the raise
exists for, and the reason the previous checkpoint could not promise one
more merge.

**`max_graph_bytes` IS `1_040_000`, READ OUT OF
`crates/nputer-index/src/lib.rs:134` RATHER THAN REMEMBERED — AND `:79`
IS NO LONGER THE PLACE TO LOOK.** At `00e133a`, `lib.rs:79` was literally
`max_graph_bytes: 1_000_000,`; at `aed77b6` it is a doc-comment line
inside the argument. **This file and `docs/ARCHITECTURE.md` both cited
`:79` for `1 000 000`, both were TRUE at the parent, and this merge made
both false — so both are repaired here**, which is `repair what the merge
introduces` in its clearest form. **DERIVE IT AT YOUR OWN REF; a
transcribed byte count is a line number by another name, and this
paragraph is a worked example of a line number going stale.** Committed
graph sha256 **`7dc42d70…`**.

**AND IT BUYS ONE NEW COMPONENT FILE AND ONE BUCKET FILE.** C-07 goes 35
→ **36** (`crates/nputer-index/tests/budget.rs`, the fourth file this
component has gained on disk); the other new indexed file is the
harness in the bucket. Every other component's count holds.

**TWO CORRECTIONS CARRIED, NEITHER REPAIRED.** (a) The floor is **204 998**
by the verifier's byte-exact round trip, not the **204 996** the lane's
notes and `lib.rs`'s doc comment state — immaterial (19.55% of the cap
and 373.2 bytes/symbol either way) and **not reproducible by the obvious
method**, so an integrator settling it inside verified code would be
taking a disposition without triage. (b) `budget.rs:9` and `:200` cite
`lib.rs:221` for the option→emitter wire; at tip that line is
**`lib.rs:276`**, because the lane's own diff added 55 lines above it.
The card's notes declare their base ref and are defensible; `budget.rs`
carries no such frame. **FILED, because the file did not exist at this
merge's parent and the parent test cannot call it debris this merge made
false.**

## **THE DOCS GATE CAN NAME `cargo test` FOR THE FIRST TIME, AND `T-135-s3`'s HAND-MAINTAINED ENTRY IS GONE**

**Two long-standing entries in this file close at this merge, and BOTH
close through the defect `T-139-s4` files.**

- **`docs/architecture/graph.json` IS NOW DERIVED.** Three consecutive
  checkpoints put it in the gate's list BY HAND (`T-135-s3`). This one
  did not have to: the gate derives it from the two new harnesses.
- **`cargo test` IS NAMED.** `T-132-s2` has said for many checkpoints that
  `cargo test` is a fourth suite the gate cannot name. On this
  checkpoint's own paths the gate prints **four** suites and `cargo test
  from app/src-tauri/` is one of them.

**AND THE REASON BOTH CLOSED IS A FALSE ATTRIBUTION.** `docs-scan.mjs`'s
`suiteFor()` answers *where a file lives* and the gate reports it as
*which suite reads the doc*. Neither harness is executed by the command
printed beside it — `graph_budget_bench.rs` is `#[ignore]`d and
`graph-budget-bench.mjs` is not matched by `app/`'s vitest config.
**PROVED HERE RATHER THAN QUOTED**: main's own baseline before the merge
was **1013/1013 across 47 files** and the merged tree is **1013/1013
across 47 files** — the suite is identical with the `.mjs` present and
absent alike. **Over-firing, which is the safe direction, with a false
reason.** `T-139-s4`, `[tools/e2e]`.

## THE LANE LIST, DERIVED AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-SIXTH MEASUREMENT
SAYING SO.** Two commands answer it:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

**AFTER THIS CHECKPOINT THERE ARE TWO LANES, `T-137` AND `T-138`.**
**DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO NOT QUOTE THIS
PARAGRAPH** — both appeared *while this integrator was running suites*,
which is why the count in a brief written an hour earlier said something
else.

- **`/Users/ujju/Projects/nputer-T-139` — REMOVED by this checkpoint**
  (rule 6, after the merge and after the checkpoint). `git worktree
  prune` ran behind it. **The branch is kept.**
- **`/Users/ujju/Projects/nputer-T-137`** on `task/T-137-lane` and
  **`/Users/ujju/Projects/nputer-T-138`** on `task/T-138-lane`, both cut
  at `00e133a`. **NOT this integrator's and untouched** — read with `git
  worktree list --porcelain` and nothing else. They hold `[lib-parser,
  app-map, tools/e2e]` and `[CLAUDE.md, method/roles/orchestrator.md,
  method/roles/executor.md]` respectively.
- **`T-131` IS NOT A LANE.** It was named in this integrator's brief as
  one of three being dispatched and **only two were** — derived, not
  taken. Its card is `planned` and its file sits MODIFIED in the
  architect's own checkout.
- `/Users/ujju/Projects/nputer-app`, **detached at `6dc5757`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **IT MOVED SINCE THE LAST
  CHECKPOINT** (`f9350b1` → `6dc5757`) and **IT DID NOT MOVE UNDER THIS
  INTEGRATION**; it is now **6 commits behind main, 1 of them a merge
  commit** (`git rev-list --first-parent --count 6dc5757..HEAD` and
  `--merges --count`). **A LAG IS A FUNCTION OF TWO REFS AND NEITHER IS
  REMEMBERED** — the previous checkpoint's "12 commits behind" was true
  of `f9350b1` and is not a fact about this checkout any more.
- **A DETACHED DRILL CHECKOUT OF `T-137`'s UNDER `/private/tmp/`**, which
  appeared during this integration. On no `task/` branch, so **not a
  lane**, and cut SHORT as `T-133-s5` asks. Not this integrator's,
  untouched. **ITS PATH IS DELIBERATELY NOT QUOTED**: it rotated
  (`t137g` -> `t137d`) inside the ten minutes between this list being
  derived and this file being committed. **A fact that changes faster
  than the check that would confirm it is not repaired by re-deriving
  it — it is repaired by not naming it.** Filter `git worktree list
  --porcelain` on the branch.
- **`/Users/ujju/Projects/arch-verify`, detached at `cb16289` — NOT THIS
  INTEGRATOR'S.** On no `task/` branch and named after no card, so **not
  a lane**. Read with `git -C … rev-parse` and `git -C … status
  --porcelain` and nothing else, and left alone. **ITS INDEX AND ITS TREE ARE
  CLEAN NOW, AND ITS REF IS NOT ON MAIN'S FIRST-PARENT LINE.** During this
  integration it went from a fourteen-row staged index (which the previous
  checkpoint recorded), to three MODIFIED card files (`T-131`, `T-137`,
  `T-138`), to clean at `cb16289` — and two of those three landed on main
  at `00e133a` under this integrator. **Read it, never resume from it: a
  fact about somebody else's working tree is stale the moment it is
  written down, and this one went stale three times in ninety minutes.**

## **THE ELEVENTH TRIAGE'S SECOND HALF LANDED BETWEEN THIS MERGE AND THIS CHECKPOINT, AND SO DID A SECOND COMMIT**

**MAIN MOVED TWICE ON TOP OF `aed77b6` WHILE THIS CHECKPOINT'S DOC WRITES
SAT UNCOMMITTED IN THE WORKING TREE**, so this checkpoint's parent is
`db4c903` and not the merge. Both are the architect's and neither is in
this merge's range:

- **`1d66a50` — the eleventh triage, part 2.** *"ten parked with a trigger
  that actually fires, fourteen folded into ten survivors."* It deletes
  fourteen task files and parks ten; `docs/tasks/rejected/` does **NOT**
  move for it and holds at **28**, the one arrival there being `T-033-s6`
  at `b3da1a4`. **It is not the shape the previous checkpoint predicted**
  — that one recorded fourteen `RM … -> rejected/` rows staged in
  `arch-verify`, and what landed is a fold, not a move. **Re-derive rather
  than resume, and match on `^id:` rather than on a filename glob.**
- **`db4c903` — `method/roles/orchestrator.md` gets ROADMAP back as an
  explicit list, per @human**, plus three task-file edits. **RECORDED
  WITHOUT A RULING**: `method/roles/orchestrator.md` is one of `T-138`'s
  three fence tokens and `T-138`'s lane was live when that commit landed.
  Whether an architect writing to a fenced path is a breach is
  `lane-protocol` rule 4's question and not an integrator's, and the
  commit is outside this merge's range either way.

**THIS IS EXACTLY WHAT `T-129-s4` WAS ABOUT, AND `T-129-s4` WAS ONE OF THE
FOURTEEN FOLDED AWAY IN `1d66a50`.** *A lane cut between a merge and its
checkpoint inherits a red graph gate* — and for the ~25 minutes between
`aed77b6` and this commit, `index --check` on main was **exit 1** by
construction, because the regen is the checkpoint's act and not the
merge's. Anybody who cut a lane at `1d66a50` or `db4c903` inherited it.
**The finding is live and its card is gone**; it is recorded here so the
next reader is not told it was resolved.

## **WHAT THIS MERGE RELEASES, DERIVED THROUGH `fence.ts` AND NOT ASSUMED**

`T-139`'s fence `[crate-index, app-shell]` expands to **26 paths** through
**C-07, C-05, C-10, C-11 and C-16**, and overlaps **22 of the 37 other
open fence-carrying cards**. **SEVENTEEN ARE FREED** — sixteen `planned`
plus `T-135`, which is `building` with no lane:

    T-022 T-035 T-044 T-059 T-068 T-071 T-087 T-094 T-099 T-100
    T-106 T-112 T-114 T-115 T-117 T-125     + T-135

**FIVE OF THE 22 ARE NOT FREED, BECAUSE `T-137` HOLDS THEM**: `T-015`,
`T-032`, `T-065`, `T-075` and **`T-140`**. So `T-140` is *unblocked* by
this stamp and *fenced* by a live lane, which are two different questions
and this file answers both.

**THE FLIP CENSUS, RE-DERIVED HERE THROUGH THE MERGED `fence.ts`** — open
set = `status` in {planned, building, verifying} carrying a non-empty
`touches:`:

    before the stamp   38 cards   703 pairs   27 flips   0 reverse   0 unusable
    after  the stamp   37 cards   666 pairs   26 flips   0 reverse   0 unusable

**`T-139` SAT IN EXACTLY ONE FLIP PAIR** — `T-112 × T-139` on
`app/src/assets` — **and it leaves with the stamp.** Contrast T-111,
which sat in none. **Derive the PAIRS, never the count.** Of the 26 that
remain, **20** are `T-112` pairs on `app/src/assets`, and the other **six**
are `method/` containment: `T-105`/`T-128`/`T-131` against `T-135` on
`method/tasks/TASK-FORMAT.md` and against `T-138` on
`method/roles/executor.md` — three cards against two, which is six and not
four.

**AND THE `tools/e2e` SUITE ITSELF DISCLOSES A LIVE FENCE COLLISION THAT
IS NOT THIS MERGE'S.** Both e2e runs print `brief DISCLOSURE: … fences
are not disjoint: T-137 tools/e2e against T-133 tools/e2e — the same
entry (lane-protocol rule five)`. `00e133a`'s own commit subject says the
architect made the containment error T-134 exists to prevent. **It is a
disclosure, not a failure; the suite is 194/194 either side of it, and it
is left alone.**

## Just completed

**T-139 — BOTH GRAPH LIMITS GET A MEASURED REASON.** F-06, milestone 4,
**size M**, `touches: [crate-index, app-shell]`. Main-before **`00e133a`**,
lane tip **`6c5c983`** (derived with `git rev-parse` — it is the **VERDICT**
commit, not the last work commit `8ab799c`), merge **`aed77b6`**,
checkpoint this commit. Built by `claude-opus-5`, verified by a different
`claude-opus-5` session, integrated by a third that neither wrote nor
reviewed the lane's commits. **`review: same-model`, and the
`Co-Authored-By` trailer on those commits is a harness constant and is
NOT evidence of a model** — T-085 proved it, T-101 sharpened it.

**THE VERIFIER DECLARED A BOUNDED READ AND ITS ATTACK SET PREDATES THE
DIFF** — 33 items written to scratch before the diff, the notes, the
s-notes or either harness were opened. It re-ran both harnesses, verified
the three tauri citations at the vendored source, re-derived the census
and the growth statistics **exactly** (372 files, 7 240 105 content bytes,
largest markdown 145 078, 55 growths / max 241 980 / mean 15 751 / median
5 230 / top decile 36 155), and **proved the pin from the side the lane
did not** — poisoning `MAX_FILE_BYTES` downward gives the same unique
kill, so the pin genuinely holds the RELATION and not either value.

**AND IT CORRECTED ITS OWN BRIEF IN THE DIRECTION THAT COST IT WORK.** The
brief told it the lane had corrected its card in four places; **the lane
claims ONE**, and the other three corrections appear nowhere in the
notes. **The asymmetry runs the safe way**: the single correction this
lane made to its own card makes its work look LESS necessary, not more —
it says `emit.rs` already covered `apply_budget` in five bodies and the
real gap was one unexercised FIELD. **This lane never corrected its card
in a self-serving direction.**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 00e133a 6c5c983 -> tree 5ce211c, exit 0 (read from $? FIRST)
    git diff --name-only 00e133a..aed77b6   (THE MERGE'S DIFF)            ->  11   the only one that means anything
    git diff --name-only 00e133a...aed77b6  (three dots AT the merge)     ->  11   collapses, as it must
    git diff --name-only 13c736e..6c5c983   (merge-base..tip, FORBIDDEN)  ->  11   agrees HERE and that is luck
    git diff --name-only 00e133a..6c5c983   (two dots BEFORE the merge)   ->  18   ← the T-083 trap, live again
    git diff --name-only main..HEAD         (FORBIDDEN)                   ->   0   ← read this row twice

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0** — `5ce211c` both
times, byte for byte. No conflict, no resolution; parents are `00e133a`
and `6c5c983` and nothing else.

**THE CHECKPOINT'S PARENT IS NOT THE MERGE.** `1d66a50` and `db4c903`
landed on main on top of `aed77b6` while this file was being written, so
this commit's parent is **`db4c903`**. **THAT DOES NOT MOVE THE RANGE**,
which is a property of the merge and its own first parent —
`00e133a..aed77b6`, 11 paths — and the two intervening commits are the
architect's, outside it, and disjoint from it. **It DOES mean a lane cut
in that window inherited a red graph gate**; see the triage section.

**MAIN MOVED A FOURTH TIME UNDER THIS CARD AND THE FOURTH MOVE WAS UNDER
THE INTEGRATOR.** It moved three times under the lane, twice more under
the verifier, and then `7f91ee4 -> 00e133a` **between this integrator's
range derivation and its merge** — the architect dispatching `T-137` and
`T-138`, two card files and nothing else. **THE FIRST FORECAST WAS
COMPUTED AGAINST `7f91ee4` AND ITS TREE `d8c12fb` IS NOT THIS MERGE'S
TREE.** The range was RE-DERIVED at the ref the merge actually has, and
the merge commit's own message was amended to name `00e133a` rather than
left claiming a parent it does not have. **A forecast is a function of two
refs and it expires when either moves.**

**THE T-083 TRAP IS LIVE AND ITS MAGNITUDE IS THE ARITHMETIC ITSELF.** The
pre-merge two-dot form returns **18** here, against T-111's 47, T-134's
12, T-135's 28 and T-133's 39. Main advanced **7** paths since this lane's
base and 11 + 7 = 18 exactly. **AND THE FORBIDDEN merge-base FORM AGREES
AT 11, WHICH IS LUCK AND NOT LICENCE**: `13c736e` happens to be an
ancestor of `6c5c983`. **That is the THIRD consecutive merge where it
agrees**, which is the dangerous datum — a form that agrees three times
teaches the wrong lesson three times.

**DISJOINTNESS PROVED AS TWO NAMED SETS.** The merge's 11 sorted paths
against main's 7-path advance (`13c736e..00e133a`): `comm -12` is
**EMPTY**, and `diff` over the prescribed and three-dot lists is **exit 0**
— identical sets, not merely equal counts. **The two live lanes were cut
AFTER the merge's own range was fixed and touch none of its 11 paths**;
both were derived from `git worktree list --porcelain`, not assumed.

**BOTH DIFF CHECKS WERE EMPTY IMMEDIATELY BEFORE THE MERGE**, read beside
`git rev-parse main` in the same command — which is how the fourth move
was caught at all. One `??` row; **`??` alone is not a ceremony.**

## THREE standing gates — ALL THREE FIRE, all derived from the merge's own 11 paths

| gate | trigger | on these 11 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **6 — FIRES** | **ASKED SEVEN TIMES, TWO WRITES**: STALE → regen → CURRENT → CURRENT → **STALE AGAIN** → regen → CURRENT → CURRENT → CURRENT |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **5 — FIRES** | **RUN, exit 0**, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **5 of 11**, then **5 of 7** | exit **1** both times, **THREE** suites then **FOUR** |

- **GRAPH REGEN — the graph IS regenerated and IS committed here**, in the
  checkpoint and not the merge. **THE STALE GRAPH AT THE MERGE IS NOT A
  DEFECT**: every commit that has ever touched `docs/architecture/graph.json`
  is a Checkpoint commit, and the lane correctly ASKED without committing
  a regen. **The second STALE is the news** — see the identical-figures
  section.
- **BOOT GATE — RUN, exit 0**, on scratch port **15972**, `[nputer] project
  folder: /Users/ujju/Projects/nputer` and `[nputer] window "main"
  created`. The check stopped its own captured process group with SIGTERM;
  **no `pkill` was issued.**
- **DOCS GATE — exit 1 twice, and the second run is the one that changed
  character.** On the merge's own 11 paths it fires on **5** and derives
  **18 readers across 4 suites**, up from 16 — both new rows are this
  card's harnesses. On the checkpoint's own **7** paths it fires on **5**
  and names **FOUR** suites including `cargo test from app/src-tauri/`,
  and `docs/architecture/graph.json` is in the list **because the gate
  derived it**, not because anybody typed it. Census **137 sites in 25
  files**, **0 frontmatter issues**, **6 root-anchored all argued, 0
  unlinked**, 2 package-relative sites both resolving into `docs/`.
  Invoked DIRECTLY from the repository root, never through `xargs`, exit
  read from `$?` unpiped.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 518 passed / 0 failed / 4 ignored, exit 0**, SUMMED over
  **EIGHTEEN** `test result:` lines; **18 `running N tests` headers sum to
  522 = 518 + 4 ignored**, which reconciles exactly. **Main's OWN baseline
  at `00e133a`, measured BEFORE the merge, was 512 / 0 / 3 over SIXTEEN
  lines summing 515**, so this merge adds **six passing bodies, one
  `#[ignore]`d body and two test binaries** — an attribution that is a
  measurement rather than a subtraction. The six, by name:
  `docs_watch::tests::the_emit_budget_stays_below_the_collectors_file_cap`,
  `check::tests::a_current_graph_reports_the_room_left_in_the_budget`,
  `check::tests::an_over_budget_graph_says_what_is_being_dropped`,
  `a_graph_driven_over_the_budget_keeps_its_files_and_its_import_edges`,
  `the_budget_option_is_what_the_emitter_uses`,
  `under_an_impossible_budget_the_graph_is_still_emitted_and_still_flagged`;
  ignored: `graph_delivery_cost_by_stage`. **ZERO bodies removed.** The lib
  suite is **5.63s**, inside the healthy band.
- **app: `npm run build` exit 0 · `npm test` 1013/1013 across 47 files,
  exit 0** — and main's own baseline was **also 1013/1013 across 47**, which
  is the measurement that confirms `T-139-s4` rather than an absence of
  news. **The run with the REGENERATED graph in place is where the news
  was**: 8 bodies / 18 assertions red, reconciled, then **1013/1013 again**.
- **parser: 290/290 across 13 files, exit 0**, after `npm run build` from
  `lib/parser/`, which was run FIRST regardless. `npx tsc --noEmit` exit 0.
  **Unchanged** — this merge touches no parser file.
- **E2E: 194/194, exit 0, FIRST RUN, 2.2m**, on explicit port **15971**,
  `lsof`-read at **zero rows at 18:58:15 EEST** immediately before binding
  and **zero rows at 19:00:25 EEST** afterwards. Header `Running 194 tests
  using 1 worker` cross-checked against **194** `✓` bodies and 0 failures.
- **ALL FOUR WATCHED CARGO BODIES WERE READ BY NAME**, not inferred from a
  green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id_in_the_init_line…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`, and T-135's live pin
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph` `ok`.
  **`self_graph_is_current` is `#[ignore]`d and read as such** —
  `index --check` is the only signal for the committed graph.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY**: `arch cycles
  --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35`, report on **stderr** at
  **645 bytes** with stdout **0 bytes**. **`arch cycles > out.txt` on a red
  yields an EMPTY FILE.** Untouched by this merge, which changes no
  registry file.
- **`arch drift` exit 0**: findings=**5**, undeclared=2, unmapped=**1**,
  declared_only=2 — `D1:C-05->C-15`, `D1:C-10->C-14`, **`D2:unmapped`**,
  `D3:C-01`, `D3:C-11`. **The D2 is new and it is this merge's**; see its
  own section.
- **`npm run lint:docs` exit 0** and **`npm run lint:tokens` exit 0** at
  **TOKEN 139 / CONTROL 764** — **AND BOTH LIVE IN
  `tools/e2e/package.json`**. Run from the repository root they exit **254**
  with `npm error enoent`, because **there is no root `package.json` at
  all**, and that reads exactly like a failing lint. **DERIVE THE CONTROL
  FIGURE AT YOUR OWN REF, AND NOTE THAT IT MOVED UNDER THIS CHECKPOINT** —
  it read 778 at the merge (796 tracked − 18 NUL-bearing) and reads **764**
  at the parent this checkpoint actually lands on, because `1d66a50`
  deleted fourteen task files while this file was being written. `git
  ls-files` reads **782** and 782 − 18 = 764 exactly.
- **NUL SWEEP, WITH ITS POSITIVE CONTROL FIRED.** Exactly **18** tracked
  files carry a NUL and **all 18 are icons and fonts** (14 `.png`, 1
  `.icns`, 1 `.ico`, 2 `.woff2`); **ZERO are source-shaped**, and the
  merge's own 11 paths are clean. Run with `perl -0777 … index($_,"\0")`,
  because **a shell cannot pass a NUL to `grep`** and this session's
  `grep` is a `ugrep` shim carrying `-I`, which skips binary files — so a
  sweep over a NUL-bearing file returns "no matches" with no error
  (`T-111-s9`). Use `command grep` when it matters; every sweep here did.
- **`npm run typecheck` from `tools/e2e` and from `lib/parser` exit 0;
  from `app/` it DOES NOT EXIST.** Unchanged and re-stated because its
  absence reads exactly like a type error — see below.
- **THE SUITES THIS FILE'S OWN LAST WRITE OWES ARE DECLARED IN THIS
  CHECKPOINT'S COMMIT MESSAGE**, which is where the regress terminates — a
  commit message is not a code input.
- **RUN LEDGER — every run declared, including the ones that agree.**
  parser build **twice**, parser suite **twice**; app build **three
  times**, `npm test` **five times** (1013 baseline · 1013 merged · **1005
  + 8 red with the regenerated graph** · 1013 reconciled · 1013 at the
  parent this checkpoint lands on) **plus three single-file `npx vitest
  run` passes during the fixture reconciliation**; cargo **four times**
  (512/0/3 baseline · 518/0/4 merged · 518/0/4 with the regenerated graph ·
  518/0/4 at the new parent); `tools/e2e` **twice**, 194/194 both, on
  explicit ports **15971** (2.2m) and **15981** (2.8m); boot check **once**
  on port 15972; DOCS GATE **four times** (the merge's 11; the
  checkpoint's 7, twice; `--census` via `lint:docs`, twice); `index
  --check` **SEVEN asks**, `index --root ../..` **two writes**, all from
  `app/src-tauri/`; `arch` **three times**, `arch drift` **three times**,
  `arch cycles` **twice**; the flip census **twice** through the merged
  `fence.ts`. **Every suite above was run AGAIN after main moved under this
  checkpoint**, which is why the cargo and e2e counts are one higher than a
  reader would predict from the ritual.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS TWENTY-ONE CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **4.1 GB** here and the lib
suite is **5.40–5.63s** across four full runs. **THIRTY-TWO runs across
twenty integrations and not one lands between 9.5s and 14.6s.** Read the lib
suite's own time first; it tells you which regime you are in before any
assertion does.

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
It did NOT fire in any of this merge's four cargo runs — read by NAME,
`ok` each time. `T-086-s1` and `T-102-s3`; fence `[app-agent]`, **FREE**.

## THE MTIME INTERMITTENT — TEN CONSECUTIVE GREENS ON FIXED CODE, AND `T-111-s9` IS WHY THAT SENTENCE IS NOT ENOUGH

**`T-120-s3`'s CARD IS GONE FROM THE BOARD — folded away by `1d66a50`
between this merge and this checkpoint — AND THE FINDING IS NOT.** It is
preserved here and inside `T-111-s9`'s body, which cites it.
`T-120-s3`'s fractional-millisecond mtime signature (`token-scan.spec.ts`,
`Expected …492.7957` against `Received …493`) was fixed on main at
**`cea839e`** (T-130). The nine-run tally on code that **cannot** carry
that fix was **3 red in 9 — near one in three**. **A red before `cea839e`
is not news; a red at or after it is.** This merge ran e2e twice, 194/194
both times, and it fired in neither — **ten consecutive clean runs on
fixed code.**

**AND `T-111-s9` IS THE REASON A GREEN TALLY HERE IS WORTH LESS THAN IT
LOOKS.** The body this prediction names (`token-scan.spec.ts:227`) can red
for a completely different reason — any unrelated control character
anywhere in the tracked corpus — **with a title that says nothing about
it and a remedy ("run it again") that is the same for both.** **Read the
assertion, not the body's name.**

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
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns failures
about an absent `app/dist/assets` rather than about the tree. **Both
CONVENTIONS bullets that state it carry a stale denominator, and the file
NAMES ITS OWN CONTRADICTION**: `:856` says *"12 of 840 across five
files"*, `:1328` says *"14 failures across 6 files … 924/924"*, `:1327`
says *"SIX files since T-013 … where the LANE PROTOCOL bullet below still
says five"*, and the suite is now **1013**. **It was exactly as false at
this merge's parent**, so ruling thirteen returns **FILE**, and the seat
is `T-092`/`T-093`.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

`npm run typecheck` from `app/` exits **1** with `Missing script`. **The
app's typecheck is the TWO `tsc` calls inside `npm run build`** — `tsc &&
tsc -p tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap. **This checkpoint
edited two `app/test/**` files, so `npm run build` was re-run AFTER those
edits and BEFORE the suite** — it is the typecheck gate and it has to be
the LAST command, not an earlier one.

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT

**`T-132-s6`, unchanged.** `resolveLanePort()`'s default **14520** is a
CONSTANT shared by every checkout on the machine, so rule 4's
checkout-granular partition does not reach it. **The remedy in practice:
pass an explicit port and re-probe immediately before binding.** This
integration used **15971**, **15981** and **15972**, each `lsof`-read at
zero rows immediately before binding and zero rows after, with the clock
on every reading. **No collision, and a probe reserves nothing — the
runner's own bind is what proves the port was free.** `resolveLanePort()`
THROWS on 1420 by construction, and `NPUTER_BOOT_PORT=1420` REFUSES at
exit 3 before anything is probed or spawned. **This mattered more than
usual here: two lanes were cut mid-integration**, and a default port would
have been shared with both.

## `T-133-s5` — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green at 33, because the shell renders the
project path and the chrome wraps. **The threshold is bracketed between
116 and 128 characters** — at 116 it measures 252 px against a 250 px
floor at 800×600, TWO PIXELS of margin. **Cut drill and scratch worktrees
at SHORT roots.** This integrator cut none, so nothing here re-measures it.

## The board, derived from disk at this checkpoint

**281 flat task files — 101 done / 34 planned / 51 parked / 92 suggested
/ 0 verifying / 3 building; 28 in `rejected/`.**
101 + 34 + 51 + 92 + 0 + 3 = 281. **`done` MOVES to 101 and T-139 is the
only card this merge stamps.** `verifying` goes 1 → **0**. The three
`building` are `T-135` (no lane, open on purpose), `T-137` and `T-138`
(both live lanes).

**ONLY TWO OF THE SEVEN BOARD MOVEMENTS ARE THIS MERGE'S, AND THE BIGGEST
ONE LANDED WHILE THIS PARAGRAPH WAS BEING WRITTEN.** 290 → **281**: main
added `T-139`'s own card at `13c736e` and `T-140`'s at `7f91ee4`,
`b3da1a4` MOVED `T-033-s6` out to `rejected/` (27 → **28**), **this merge
adds four** (`T-139-s1` … `s4`), and then `1d66a50` — the eleventh
triage's second half, the architect's, landing between this merge and this
checkpoint — **deleted fourteen and parked ten**. 290 + 2 − 1 + 4 − 14 =
281. `suggested` 113 → **92** (113 + 4 − 1 − 14 − 10); `parked` 41 →
**51**; `planned` 35 → **34** (T-137 and T-138 left for `building`, T-140
arrived). **All four of this card's own suggestions survived the triage.**
**Derive it at your own ref and stamp the reading**, because on this
project that paragraph has gone stale inside forty minutes — and this time
it went stale inside this very file, between one section and the next.

**THE DANGLING-BLOCKER PIN, RE-DERIVED THROUGH THE PARSER AT THIS MERGE:**

    blocked_by entries        52
    blocker is `done`         49
    blocker still open        3
    blocker names NO card     0     <- the pin
    planned, ALL landed       5     T-015, T-059, T-065, T-112, T-131

**ZERO DANGLING.** Note the last row moved and **the movement is not this
merge's**: `T-137` and `T-138` left it by being dispatched, and `T-112`
joined it because `T-111` landed. **An unmoved census is not evidence that
nothing moved, and a moved one is not evidence that this merge moved it.**

## Provenance — SELF-DECLARED, never read off a trailer

**101 done cards — 76 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 76 + 19 + 5 + 1 = 101. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented**, and this merge adds the 76th
`same-model`. **`same-model` is not a weaker verdict than `independent`**
(TASK-FORMAT's own paragraph); it records WHICH HAND HELD THE PEN, and the
one value naming a MISSING guarantee is `self-verified`.

## Documents ticked

- **STATE — rewritten, as a snapshot.** `T-133-s2`'s edit (dropping the
  four sections `brief.mjs --state` can answer) was **NOT performed**:
  `docs/STATE.md` is free, but that edit is a card of its own and taking
  it inside a checkpoint would bundle a routed change with a merge.
- **The card** is stamped **`done`** with `verifier:`, `built_by:`,
  `verified_by:` and `review: same-model` filled, and gains an
  `## Integration` section. **The lane's notes, the four s-notes and the
  verdict are preserved byte-untouched.**
- **ROADMAP — TICKED, AND THE F-04 PROGRESS LINE DOES NOT MOVE**: it holds
  at **5 of 8**, one merge after T-111 finally moved it, for the oldest
  reason in that ledger — T-139 is **F-06**, inherited backlog rather than
  F-04 slice content. The milestone-4 census moves **98 → 99** (F-06 25 →
  **26**) and **the mover is `T-139`'s own card file**, created on main at
  the dispatch commit `13c736e`, outside this merge's range. **`T-140`
  does NOT move it** — it is F-06 but `milestone: 5`. The F-06 backbone
  bullet gains the measurement and the pointer to T-140's floor.
- **ARCHITECTURE — UPDATED, and rule 3's *"if any interface moved"*
  answers YES.** C-07's row gains the T-139 entry: both limits with their
  reasons, the three stages, the shape finding, the two-sided pin, the new
  `index --check` headroom line, the budget entry (**997 202 bytes —
  95.88%, 42 798 of headroom**, spending **8 021**), the D2 and its two
  shadow edges, and the DOCS-GATE census move. **AND ONE CITATION THIS
  MERGE MADE FALSE IS REPAIRED IN PLACE**: the row's single present-tense
  gloss `max_graph_bytes` (1 000 000) is stamped with its ref rather than
  deleted, so every historical percentage in the row stays true of the ref
  it carries.
- **CONVENTIONS — NOT TOUCHED.** Its two stale unbuilt-app denominators
  are FILED and not repaired, and `arch blast` still joins `arch cycles`
  in the queue at `T-127-s5`.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The decision this card embodies — a limit set
  by measurement — is written at the definition site with its ref, and the
  one genuinely non-obvious deferred decision (a graph-specific cap on the
  `.json` branch of `is_collected_docs_path`) is **routed to `T-139-s3`
  with its measurement** rather than ruled here. **ADR-018 IS STILL OWED
  AND IS STILL T-135 HALF B's.**
- **`graph.json` REGENERATED TWICE and COMMITTED HERE**, in the checkpoint
  and not the merge, **with a fixture reconciliation that WAS owed** —
  eight bodies, eighteen assertions, two files.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT
AGAIN.** Six of this merge's eleven paths are under `app/**` and five are
`docs/tasks/`. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT THE ANSWER TO
THE DEPENDENCY QUESTION** (integrator.md rule 2), and here it would not
even be available — so it was answered from the build order instead:
**this integration DID rebuild `lib/parser/dist` and DID write `app/dist`
(three times), and both land in `/Users/ujju/Projects/nputer`.** The vite
serving 1420 has `/Users/ujju/Projects/nputer-app/app` as its cwd —
**@human's own checkout** — and `app/node_modules/@nputer/parser` there is
a **RELATIVE** symlink (`../../../lib/parser`, re-read at this ref in BOTH
checkouts rather than quoted), so each resolves inside its own checkout
with its own `lib/parser/dist`. **The running product reads none of what
this integration wrote.**

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a fact
of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this checkpoint's regenerated `graph.json`
and the stamped `T-139` card reached the running board through the
watcher**, and the map pane would re-render — **and this time it would
also draw a fourteenth node, the unmapped bucket, and two new amber
edges.** That is an INTERRUPTION channel (a re-render), never a breakage
one, and no integrator can read which folder is open without touching the
app.

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal. Holder `node` pid **19746**, `TCP
[::1]:1420 (LISTEN)`, read at **18:50:54 EEST** (before any command that
writes) and again after the suites, the gates and the doc writes; **the
second reading is in this checkpoint's commit message.** The anchored
process read — `ps -o pid,lstart,command -p 19746` — reports `node
/Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started **Wed
Aug 26 17:44:45 2026**, and `lsof -a -p 19746 -d cwd` reports cwd
`/Users/ujju/Projects/nputer-app/app`. **THE PREVIOUS CHECKPOINT RECORDED
PID 46532 STARTED AT 11:04:22 AND BOTH ARE GONE.** A pid, a port holder
and a start time are live-environment facts, not functions of a tree.
**All three are already stale for you.**

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT IS**:
`app/node_modules`, `lib/parser/node_modules`, `tools/e2e/node_modules`,
both `dist/` directories and `target/` were checked and all six were
present, so **no fresh dependency install was owed and no `npm ci` was
run**. **AND THE ONE-STEP REPAIR ITEM 15 KEEPS ASKING FOR WAS PERFORMED BY
HAND FOR THE NINETEENTH CONSECUTIVE INTEGRATION**: `lsof -a -p <holder
pid> -d cwd` puts 1420's holder in a DIFFERENT checkout, so even an owed
install could not have reached it. **There is no root `node_modules` and
there is no root `package.json`.**

**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **thirty-first** checkpoint running — not this integrator's, not this
merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting. No `git add -A` — every write used `git commit -- <paths>` with
the paths listed explicitly.** Be precise rather than claiming more than is
true: this integration's **four** `cargo test` runs and its **SEVENTEEN**
`nputer-index` invocations — seven `index --check`, two `index --root`,
three `arch`, three `arch drift`, two `arch cycles` — all WROTE to main's
`app/src-tauri/target/`, which reads **4.1 GB**, as any cargo run must.
**The merge commit's own message was AMENDED once**, before anything was
built on top of it, to name the parent it actually has. **No sibling
worktree was modified except T-139's own, and only by removing it**; every
other was read with `git -C … rev-parse`, `git -C … status --porcelain`
and `lsof` only. **All scratch work for this integration lives outside the
repository, and no worktree was cut at all.**

## In progress / broken right now

**NOTHING IS BROKEN. THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED. THE ONE
`building` CARD WITHOUT A LANE IS OPEN ON PURPOSE. THE NEW D2 IS THE MAP
REPORTING A REAL GAP.**

**TWO LANES HOLD FENCES**: `T-137` holds `[lib-parser, app-map,
tools/e2e]` and `T-138` holds `[CLAUDE.md, method/roles/orchestrator.md,
method/roles/executor.md]`. Read `git worktree list` — or run `brief.mjs
--state`, which stamps the reading with a clock — rather than any table
here. **`T-135` is `status: building` with no lane and Half B unwritten**,
waiting on @human's look at its §6 and §7, an architect-widened fence
including `docs/decisions/`, and the TS half of §7's floor rule. **It must
not be re-dispatched whole: Half A is on main and its criteria 1–3 are
discharged.**

## Next up

1. **@human's LOOK IS OWED ON T-139's TWO NUMBERS, AND IT IS THE ONLY
   THING THE MEASUREMENT CANNOT SETTLE.** The card asked for it and the
   verifier sharpened it: the direction and the ceiling are proven, the
   VALUE is not, **any number in (989 181, 1 048 576) is equally
   defensible**, and it buys **about three ordinary merges**. Present it
   with the corrected reason for the gap — the two limits are the SAME
   measurement, byte for byte, so the gap is only there to give the strict
   `<` something to catch.
2. **`T-140` IS UNBLOCKED BY THIS STAMP AND FENCED BY `T-137`.** It is the
   card that says the raise is not an answer: the graph's floor is 802
   bytes per file and the map stops working at about a thousand files.
   `[crate-index, app-map, app-shell]`, `milestone: 5`, size L. **Sequence
   it after T-137 lands**, and note it also owns the verifier's floor-
   conjunct finding (nothing pins that `apply_budget`'s floor stays under
   the cap).
3. **THE NEW D2 NEEDS A REGISTRY DECLARATION AND IT IS NOT AN INTEGRATOR'S
   TO MAKE.** `app/src-tauri/tests/graph_budget_bench.rs` is unclaimed
   territory and draws `unmapped -> C-07` and `unmapped -> C-10`. The
   shapes: claim it by name in **C-07** (it drives `nputer_index`), or in
   **C-10** (it drives `collect_docs_tree`), or declare the
   `app/src-tauri/tests/` prefix once and retire the one-file-at-a-time
   pattern C-14 started at T-010. **Fence `[docs/architecture/components/]`,
   FREE**, and it composes with `T-127-s2`, which already wants a word for
   C-10. **Nothing reds for this today** — that is the second half of the
   item.
4. **`T-139-s2` — THE SNAPSHOT CROSSES IPC AS JS SOURCE THAT IS EVALUATED.**
   `[app-shell]`. About half the webview's share of the binding stage is
   the channel rather than the data, and the real snapshot is **7.5 MB**,
   not 1 MB — interpolating puts the whole payload's eval near 13–14 ms in
   JSC, of which 6–7 ms is the shape. **It wants a room before a lane**:
   changing the channel changes the shape of every event the app sends.
5. **`T-139-s3` — THE PER-FILE CAP IS THE WRONG AXIS.** `[app-shell]`.
   `MAX_FILES` 2 000 × `MAX_FILE_BYTES` 1 MiB = **2 GiB, unchecked**, and
   **86.3% of the real snapshot is markdown nowhere near the per-file
   cap**. It is already misleading one shipped argument —
   `watcher-store.ts`'s 8-second startup deadline justifies itself with
   *"a repo at the file cap is ~13x this one's tree"*, and the bound is
   ~280x. **Shape 2 (a graph-specific cap on the `.json` branch) is the
   one to take if the map is ever to know more of a codebase**, and
   `IndexOptions::max_graph_bytes`'s doc comment now says so at the
   definition site.
6. **`T-139-s1` — THE COLLECTOR'S CAP HAS THREE SPELLINGS AND THE
   LOAD-BEARING RESTATEMENT IS IN ANOTHER COMPONENT.**
   `MapView.tsx:61`'s `COLLECTOR_CAP_BYTES` drives a user-facing warning
   at `:112`; nothing joins it to `docs_watch.rs:66`. **Fence
   `[app-shell, app-map]`** — and `app-map` is held by `T-137`.
7. **`T-139-s4` — THE DOCS GATE ATTRIBUTES A READER TO THE SUITE THAT OWNS
   ITS DIRECTORY.** `[tools/e2e]`, FREE. **Do not fix it by deleting the
   reader**: the same derivation is what finally retired `T-135-s3`'s
   hand-maintained `graph.json` entry. Option 1 (print the DIRECTORY where
   the runner's include pattern cannot be consulted) is honest and cheap.
8. **`T-132-s2` IS HALF-CLOSED AND SHOULD BE RE-READ RATHER THAN CARRIED.**
   The gate now DOES name `cargo test from app/src-tauri/` — for a file
   `cargo test` does not read under that command. Whoever holds `T-139-s4`
   should decide whether that counts.
9. **`T-112` IS THE OBVIOUS NEXT F-04 CARD AND IT IS NOW FREE.** F-04,
   `planned`, and the milestone-4 slice's own remainder. **BUT IT IS THE
   BOARD'S MOST COLLIDING CARD**: 20 of the 26 live flips are `T-112`
   pairs, on `app/src/assets` and `app/src/styles`, invisible to a token
   comparison. **Sequence it deliberately, and derive the pairs.**
10. **`T-131`, `T-105` OR `T-128` — EXACTLY ONE OF THE THREE, AND NOT
    BESIDE `T-138` OR A LIVE `T-135` HALF B.** All three read
    `overlapping` against each other and all three overlap `T-135` and
    `T-138` INVISIBLY, on `method/tasks/TASK-FORMAT.md` and
    `method/roles/executor.md`. **`T-138` IS LIVE, so this is blocked
    today.**
11. **`docs/CONVENTIONS.md` IS FREE AND TWELVE EDITS ARE QUEUED AT ITS
    SEAT.** `T-104-s5` carries the argument. **THE COMMAND LIST — and it is
    now TWO edits, not three**: `T-127-s5` (`arch cycles` and `arch
    blast`) survives, and `T-133-s1` (`brief.mjs`) was folded away by
    `1d66a50` — **while `T-127-s5`'s own body still cites it.** **THE RANGE RULE BULLET — four edits, to `T-093`**,
    including this merge's: the forbidden merge-base form agreed at 11
    here, **the third consecutive merge it has agreed at**, and a
    forecast tree computed one commit before the merge is not the merge's
    tree. **THE POISON DRILL BULLET — five edits, to `T-092`.** **AND THE
    TWO STALE UNBUILT-APP DENOMINATORS** (840 at `:856`, 924 at `:1328`,
    against 1013 on disk).
12. **`T-135-s3`'s GENERAL FINDING IS DISCHARGED BY ACCIDENT AND SHOULD BE
    CLOSED DELIBERATELY.** The DOCS GATE now derives
    `docs/architecture/graph.json`, so the hand-add is gone — but it is
    gone because of a false attribution (`T-139-s4`), and a repair to s4
    could take it away again. **Write the sentence anyway.**
13. **`T-111-s9` — `token-scan.spec.ts` ASSERTS WHOLE-CORPUS TOTALS FROM
    BODIES THAT PLANT ONE VIOLATION.** `[tools/e2e]`, **FREE**, and still
    the most dangerous open finding here because one of the three bodies
    it reds is character-perfect camouflage for `T-120-s3`. Repair (c) —
    *name the residual in the failure message* — is the cheapest thing in
    this list.
14. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
    AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still
    returns **zero rows**, re-checked at this ref with `command grep`, for
    the tenth checkpoint running. **`method/` is held by `T-138` today.**
    This merge adds a sixth clean case **and the first counter-example
    worth writing down**: the forecast tree `d8c12fb` at `7f91ee4` was NOT
    this merge's tree, because main moved between the two commands.
15. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — NINETEENTH
    CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
    DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
    `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step
    — `lsof -a -p <pid> -d cwd`.** Fence `[docs/CONVENTIONS.md]`, **FREE**.
16. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
    EXIST.** Unchanged; option (1) — write it in `lane-protocol.md` rule 4
    — is preferred. `method/` is held by `T-138` today.
17. **`T-111-s5` IS THE MOVE LIST AND `T-137` IS THE VEHICLE — AND IT IS
    LIVE NOW.** Three implementations of the fence rule are to be retired
    into one. **The board-local copy must not simply be deleted**: it
    carries provenance (`viaComponents`) that `FenceWitness` does not.
    **`T-111-s7`** (`task-waves.ts`'s second derivation of whether a
    blocker binds) is `[app-map]` and therefore also T-137's neighbourhood.
18. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64; (b) the live
    positive control is brittle to a shared closing hop. `[crate-index]`,
    **FREE — this merge is what freed it.**
19. **`T-129-s2`, `T-129-s3`, `T-129-s5` are `crate-index`, FREE.**
    **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class — is `app-shell`, **now FREE**.
    **`T-127-s1`, the surviving cycle**, needs `app-shell` and
    `lib-parser`; `app-shell` is free and `lib-parser` is T-137's.
20. **`T-126-s3` — FIVE WRITTEN STATEMENTS ABOUT C-15 ARE STILL FALSE ON
    MAIN**, and `arch drift` still reports `D1:C-05->C-15` as the FIRST of
    two D1s where item 4 calls it the *"fifth D1"*. **Nothing reds.** It
    was exactly as false at this merge's parent, so ruling thirteen
    returns FILE.
21. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-22.** `[app-agent]`, **FREE**. **`T-102-s4`** — the `Activity`
    label reaches the webview through no bound at all — same fence. **AND
    THE MTIME INTERMITTENT** (`T-120-s3`, ten consecutive greens on fixed
    code) is `[tools/e2e]`, held by `T-137` today.
22. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, T-137's.
23. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** Measured: **exit 0 as `.rs`, exit 134 as `.ts`**, and TS
    `namespace` chains abort at **2 000** against Rust's tightest **3 000**,
    so **TypeScript is the MORE exposed language.**
24. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals;
    the C-09 → C-08 direction has THREE closing edges and the card names
    two.
25. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, threshold bracketed 116–128 characters, two-pixel margin at
    800×600. The fix is in `app/src` (`app-shell`) — **FREE.**
26. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, T-137's.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
27. **THE BOARD-TRUTH RULING** — TWENTY-THIRD ask. **A PATTERN COUNT IN
    THE FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column
    still closes at the first push, and `git remote` still returns zero
    remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief in this thread has contained at
least one error, and saying so is the most valuable thing a checkpoint
returns.** This brief's central instruction was again a reading list —
`git show 6c5c983`, then the lane's notes commits and `T-139-s1`…`s4`,
because *a summarised finding loses the findings inside it* — **and that
instruction is again the reason this checkpoint has anything worth reading
in it.** Sorted into the four categories it asked for.

1. **FACTS — TWO ARE WRONG AND BOTH ARE ABOUT WHAT WAS LIVE AT THE
   MOMENT IT WAS WRITTEN.** (a) *"Three other lanes are being dispatched
   as you start (T-138, T-137, T-131)"*, with the instruction to derive
   rather than take the list. **Derived: TWO.** `00e133a` dispatched
   `T-137` and `T-138`; `T-131` is `planned` with no branch and no
   worktree, and its card file sits MODIFIED and uncommitted in the
   architect's checkout. **The instruction to derive is what caught it.**
   (b) *"Your merge releases `crate-index` and `app-shell`, which unblocks
   nine planned cards."* **Derived through `fence.ts`: SEVENTEEN cards are
   freed, sixteen of them `planned`** — and five more overlap but stay
   held by `T-137`. Nine is not the count under any reading I can
   reproduce. **The load-bearing half is right**: both fences are released
   and the release is large. Everything else confirmed: the tip is the
   VERDICT commit; the two stale documents; the 8 021-byte spend and the
   42 798/2 798 contrast; `self_graph_is_current` `#[ignore]`d; `arch
   cycles` exit 1 with stdout empty; `lint:*` in `tools/e2e/package.json`;
   `npm run typecheck` from `app/` absent; ports machine-wide; the `grep`
   shim's `-I`; 18 cargo headers totalling 522 = 518 + 4; and the floor
   correction to 204 998.
2. **PREDICTIONS — THE ONE THAT MATTERED WAS RIGHT AND ONE UNDERSTATED
   ITSELF.** *"Ask GRAPH REGEN, never predict it, and ask AGAIN after any
   write"* — **correct, and it earned its place twice**: the second ask
   after the fixture writes came back STALE with **all four printed
   figures identical on both sides**, which no prediction would have
   caught. The understatement is *"the stale graph is not a defect"*: true
   of the merge, and it left out that regenerating would create a **new
   D2** and red **eight bodies** in two fixtures. **The brief predicted
   the regen and not its consequences**, which is the one thing about this
   merge a reader most needs.
3. **ARGUMENTS — THE CENTRAL ONE IS RIGHT AND SHARPER THAN IT CLAIMS.**
   *"`repair what the merge introduces` in its clearest form"*, about the
   two stale documents. **Confirmed at the tree**: `lib.rs:79` at
   `00e133a` is literally `max_graph_bytes: 1_000_000,` and at `aed77b6`
   it is a doc-comment line. **But the clearest form turned out to be
   somewhere else** — eighteen fixture assertions that were true at the
   parent and false after the checkpoint's own regen — and the brief did
   not know that case existed. **AND ITS COMPANION IS THE ONE THE BRIEF
   DID NOT ARGUE**: the same paragraph would have licensed declaring the
   new D2, and that would have been a disposition without triage. **The
   rule says which defects to FIX, not which decisions to TAKE.**
4. **STALENESS — TWO, AND THE FIRST IS THE ONE NO BRIEF COULD HAVE
   CARRIED.** *"Main moved three times under the lane and twice more under
   its verifier — name your ref."* **It moved three more times under me:
   a SIXTH between my range derivation and my merge, and a SEVENTH and an
   EIGHTH on top of that merge while I was writing this file.** Eight
   moves on one card. The rule is right and it is not a defence — the
   sixth move invalidated a forecast tree I had already computed, and the
   seventh and eighth turned four board figures in this file false between
   one section and the next. **Name your ref, and then read it again
   before you commit.** **Second:** the brief's *"port 1420 … its holder
   pid has changed twice today"* — it has changed again. Pid **19746**,
   started **17:44:45**, against the previous checkpoint's 46532 at
   11:04:22. **A live-environment fact quoted from an earlier session is
   already stale**, and this is the third consecutive checkpoint to prove
   it with a different pid.
