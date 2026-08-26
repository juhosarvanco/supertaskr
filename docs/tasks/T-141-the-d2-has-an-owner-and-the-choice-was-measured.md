---
id: T-141
title: The unmapped file has one owner that costs nothing, and two that look closer and would each invert a real dependency — plus 137 lines of fixture narrative to unwind
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [docs/architecture/components/, app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**T-139's merge created this repository's second D2.** `arch` at
`ae92f67`: `components=13 files=185 mapped=184 unmapped=1 edges=39
findings=5`. The unmapped file is
**`app/src-tauri/tests/graph_budget_bench.rs`**, the harness T-139 added.

**Its integrator routed rather than declared, and was right to** — picking
an owner is a disposition, and repairing it in the checkpoint would have
destroyed the evidence that the merge created unclaimed territory.

## The decision, already measured — do not re-derive it, verify it

**The file imports both sides of the seam it measures:**

    use nputer_index::{stable_json, Edge, FileEntry, Graph};              -> C-07
    use nputer_lib::docs_watch::{collect_docs_tree, DocsFile, DocsSnapshot}; -> C-10

so `arch` carries **two** shadow edges, `unmapped -> C-07` and
`unmapped -> C-10`. **Whoever claims it gains both**, which is what makes
this a disposition rather than bookkeeping.

**C-07 and C-10 are both wrong, and for the same reason in mirror.**
Claiming it in C-07 declares that the indexer depends on the app's docs
watcher — **inverting the real direction**, since `nputer-index` is a
standalone crate and the app depends on IT (`C-07 depends_on: []` today).
Claiming it in C-10 gives the watcher a dependency on the indexer it does
not have.

**C-05 is right and costs nothing.** It already declares **C-07 and C-10
both** (`depends_on: [C-01, C-06, C-07, C-08, C-09, C-10, C-11, C-12,
C-13, C-14, C-16]`), it already owns `app/src-tauri/src/**` file by file,
and the harness sits in the app's own test directory measuring the app's
own delivery path.

**MEASURED, not argued**: with the file claimed in C-05, `arch` goes to
`mapped=185 unmapped=0 edges=37 findings=4 drift_components=4`. **Edges
FALL by two and findings by one — the claim adds nothing the registry did
not already carry.** That is the test that separated C-05 from the two
candidates that looked closer, and it is the criterion this card asks you
to re-run rather than trust.

**The precedent is T-010's**, applied at `tests/agent_runner.rs` and cited
in C-14: a component's suite belongs to the component it exercises. **This
harness exercises the seam, and the seam is C-05's.**

## The real work is the fixture narrative, not the one-line claim

**T-139's checkpoint added 137 lines across two React fixtures to RECORD
the D2** (`ae92f67`: `architecture-dogfood.test.ts` +103,
`map-dogfood-render.test.tsx` +63). Closing it falsifies **six bodies**,
verified by running the claim in a scratch checkout:

| body | now asserts | becomes |
|---|---|---|
| `all 185 files map and ONE lands in the bucket` | 1 unmapped | `[]` |
| `THE FINDINGS … AND A D2 THIS MERGE CREATED` | 5 findings | 4 |
| `the full relation table: 26 confirmed, 4 undeclared` | 39 edges | 37 |
| `drift flags land on the right nodes` | `['C-05','C-10','unmapped']` | `['C-05','C-10']` |
| `renders all thirteen … the bucket is BACK` | 14 nodes | 13 |
| `draws the full 39-edge relation table` | 39 | 37 |

**Four titles carry the D2 as a claim and must move with their
assertions.** The prose explains a bucket that will no longer exist —
**rewrite it to record that the D2 lived for exactly one merge, do not
delete it.** The T-033 D2 lasted a day; this one lasted a merge, and both
are worth the archive.

## Acceptance criteria

- **RE-DERIVE THE OWNERSHIP TEST BEFORE ACCEPTING IT.** Claim the file in
  C-05 and confirm `arch` reports **edges DOWN by two and findings down by
  one**. IF the claim adds any edge THEN C-05 is the wrong owner and the
  disposition needs rethinking, not forcing.
- **`cargo test` WILL NOT NOTICE AND THAT IS THE POINT.** T-139's
  integrator measured it: `arch drift` exits 0 without `--fail-on`, the
  cargo arch pin is about **cycles**, and cargo was 518/0/4 both before and
  after the D2 appeared. **The whole of what noticed was two React
  fixtures.** State whether that gap earns a finding; do not fix it here.
- **EVERY TITLE THAT CARRIES A FIGURE OR A CLAIM SHALL MOVE WITH ITS
  BODY.** Four do. A title asserting a bucket that no longer exists is the
  defect this project has caught more than any other.
- **THE SECOND-ASSERTION TRAP HAS FIRED TWICE THIS WEEK** — a red on the
  first assertion hides the second in the same body, so T-139's integrator
  saw `8 failed` and the true count was larger. **Re-run until green, and
  report the count at each pass**, not just the last.
- **THE NARRATIVE SHALL BE REWRITTEN, NOT DELETED.** Both D2s in this
  repository's history were created by a merge and closed by a later hand;
  that is a pattern worth one paragraph, and deleting the first one's
  explanation to close it would erase the evidence.

Verification: headless — `npm test` from `app/`, exit **unpiped from
`$?`**, count derived; `cargo test --no-fail-fast` from `app/src-tauri`
with the total SUMMED from the `test result:` lines and cross-checked
against the `running N tests` headers. **Build `lib/parser` first, then
`npm run build` from `app/`.** **Ask GRAPH REGEN rather than predicting
it, and ask AGAIN after any write** — the identical-figures trap has now
fired with **bytes, files, symbols AND edges all matching** across two
distinct graphs. **POISON DRILL on any new assertion**; if this card adds
none and only reconciles existing ones, **say so explicitly** rather than
leaving the drill silent. **Ports are machine-wide while lane-protocol
rule 4 partitions by CHECKOUT.** @human: none — the disposition is the
architect's and it is recorded above.

---

## Implementation notes (executor claude-opus-5 @T-141)

Lane `task/T-141-lane`, worktree `/Users/ujju/Projects/nputer-T-141`, cut
at **`2a922ce`**, which was also main's tip when this lane ran (re-read
with `git -C /Users/ujju/Projects/nputer rev-parse main` at dispatch and
again before the range below). **Every figure here is derived at
`2a922ce` plus this lane's working tree unless it names another ref.**

### 1. THE OWNERSHIP TEST RE-DERIVED — AND IT REPRODUCES EXACTLY

`cargo run -q -p nputer-index -- arch --root ../..` from `app/src-tauri`,
exit **0** both times, full output diffed rather than eyeballed:

    BEFORE  components=13 files=185 mapped=184 unmapped=1 edges=39 findings=5 drift_components=5
    AFTER   components=13 files=185 mapped=185 unmapped=0 edges=37 findings=4 drift_components=4

**Edges DOWN by two, findings down by one, and NO edge added** — the
card's criterion, met. The whole delta is five lines: the `unmapped` D2
row leaves, `unmapped -> C-07` and `unmapped -> C-10` leave, and their
observed counts fold into the already-CONFIRMED `C-05 -> C-07` (1 -> 2)
and `C-05 -> C-10` (39 -> 40). C-05 goes `files=63` -> `64` and keeps its
single D1; the relation census goes `26 confirmed / 4 undeclared / 9
planned` -> `26 / 2 / 9`.

**THE TWO REJECTED CANDIDATES WERE MEASURED TOO, WHICH THE CARD ASSERTS
AS ARGUMENT AND LEAVES UNPRINTED.** One arrangement at a time, each
restored to HEAD and proved clean with `git diff --quiet` before the
next:

    no owner (as merged)   39 edges   5 findings   drift_components=5
    claimed in C-05        37 edges   4 findings   drift_components=4
    claimed in C-07        38 edges   5 findings   drift_components=5   new undeclared C-07 -> C-10
    claimed in C-10        38 edges   5 findings   drift_components=4   new undeclared C-10 -> C-07, and C-10 reads `drift=D1,D1`

So the inversion the card argues is **observable**, not only reasoned:
each rejected candidate trades the D2 for a D1 and writes the wrong
direction onto the map. Only C-05 shortens both columns. Recorded in
`C-05-app.md` as a four-row table so the disposition carries its evidence.

### 2. THE FAILURE COUNT AT EVERY PASS, AND THE TRAP FIRED AGAIN

`npm test` from `app/`, exit read unpiped from `$?`:

    pass 1   6 failed / 1007 passed  (1013)   exit 1
    pass 2   1 failed / 1012 passed  (1013)   exit 1
    pass 3   0 failed / 1013 passed  (1013)   exit 0
    pass 4   0 failed / 1013 passed  (1013)   exit 0   (after the C-05 prose)

**PASS 1's SIX IS A FLOOR AND THE CARD PUBLISHED IT AS A TOTAL.** The
seventh red — `derived.findings.filter(isDriftFinding)` at the bottom of
`drift flags land on the right nodes` — was hidden under the `drift`
assertion four lines above it and surfaced only on pass 2. That body's
own comment already recorded the T-135 and T-139 checkpoints meeting it
the same way; **T-141 is the third consecutive hand**, and the first
where a card had forecast the reds body-by-body from a scratch
measurement and still missed it.

**THE REAL UNIT IS THE ASSERTION AND THERE ARE FOURTEEN OF THEM**, not
six. Enumerated from the diff, per body:

| body | assertions moved |
|---|---|
| `all 185 files map …` | 3 — `unmappedFiles`, the `UNMAPPED_ID` lookup, and the counts array (whose C-05 row and `["unmapped", 1]` row are ONE `expect`) |
| `THE FINDINGS …` | 1 — the `D2:unmapped` row |
| `the full relation table …` | 3 — the row array, the relation tally, the undeclared identity list |
| `drift flags land …` | 2 — `drift`, and the hidden `isDriftFinding` list |
| `renders all thirteen …` | 2 — the node count, the bucket identity check (INVERTS) |
| `draws the full … relation table` | 3 — the edge count, the undeclared count, the undeclared identity list |

**THIS TABLE SUMMED TO 16 AGAINST ITS OWN HEADLINE OF 14 UNTIL THE
REWORK**, because two rows counted ARRAY ROWS as assertions: the C-05
tally row and the `["unmapped", 1]` tally row are one
`expect([...counts.entries()].sort()).toEqual(…)`, and the relation-table
row listed three items while claiming four. **The headline was right and
the table was wrong.** Re-derived mechanically at the rework's own tip
rather than copied from the verdict — comments stripped, bodies paired in
file order, `expect(` statements gathered and compared one to one:
**3 + 1 + 3 + 2 + 2 + 3 = 14**, with expect-statements **45 → 45** and
**44 → 44**, bodies **10 → 10** and **8 → 8**, and **zero added, zero
removed**.

Every value was derived from `arch`'s own output BEFORE the re-run, never
read off a failure diff.

### 3. FIVE TITLES MOVED, NOT FOUR

The card says four titles carry the D2 as a claim. **Five carry a figure
or a claim that this change falsifies**, and the fifth is in the card's
own table:

1. `all 185 files map and ONE of them lands in the bucket — T-139 re-opens the D2 that stood for a day at T-033` -> `all 185 files map and the bucket is EMPTY again — T-141 closes the THIRD D2, which stood for exactly one merge` (the replacement read "the second D2" as first built; that is the miscount §11 corrects)
2. `THE FINDINGS: … — AND A D2 THIS MERGE CREATED` -> `… — AND THE D2 IS GONE, RETIRED BY A DECLARATION THAT COST NO EDGE`
3. `the full relation table: 26 confirmed, 4 undeclared, 9 planned` -> `26 confirmed, 2 undeclared, 9 planned` — **the one the card's count misses**; its table lists this body's `4 undeclared` and its criterion still says "Four do."
4. `renders all thirteen declared components in full mode, and the bucket is BACK` -> `… and the bucket is GONE again`
5. `draws the full 39-edge relation table, with FOUR undeclared rows left — two of them the bucket's` -> `draws the full 37-edge relation table, with TWO undeclared rows left — the bucket's two are gone`

`drift flags land on the right nodes` is the sixth body and its title
carries no figure, which is why it did not move.

### 4. THE NARRATIVE WAS REWRITTEN, NOT DELETED — +302 / -69 after the rework (+225 / -66 as first built; the heading said +226 and was off by one)

Every ledger entry T-139's checkpoint wrote is still in the file. The D2
rows leave the ASSERTIONS and stay as comments beside them, because the
row's departure is the finding and the explanation is the evidence for
it. **The pattern paragraph sits at the `["unmapped", 1]` tally row**,
where all three D2s' histories meet. **AS FIRST BUILT IT READ "TWO FOR
TWO" AND THAT MISCOUNT IS WHY THIS CARD WAS REJECTED**; the rework
replaced it with a derived census (§11) and the claim now reads:

> ALL THREE D2s THIS REPOSITORY HAS EVER HAD WERE CREATED BY A MERGE'S
> REGEN AT THE CHECKPOINT AND CLOSED BY A LATER CARD'S HAND, NEVER BY
> THE MERGE THAT MADE THEM.

with the mechanism on all three sides — a merge adds a file to a
directory claimed one file at a time and the regen (the checkpoint's act,
not the lane's) discovers it afterwards; a later card takes the
disposition, because neither an executor (fence) nor an integrator (a
checkpoint takes no dispositions) may take it. **"The first lasted a day"
is gone**: measured the same way for all three — first first-parent
commit on main carrying the bucket to the first that drains it — they
stood **4h31m29s**, **4h06m14s**, and (this one) one merge. No instance
lasted anything like a day.

### 5. THE CARGO-BLINDNESS GAP: IT EARNS A FINDING. FILED, NOT FIXED

`T-141-s1`. Ruling in one line: **the gap is real, it is now measured in
BOTH directions, and its standing justification does not cover the arm
that matters.**

- `cargo test --no-fail-fast` from `app/src-tauri` is **518 passed / 0
  failed / 4 ignored, exit 0** at this tree — identical to what T-139's
  checkpoint recorded on both sides of the D2's CREATION. So the Rust
  side is byte-identical across the creation and the closure alike.
  Summed from the eighteen `test result:` lines, cross-checked against
  the eighteen `running N tests` headers: 522 = 518 + 4.
- The mechanism is nameable and half-deliberate.
  `crates/nputer-index/tests/arch.rs` pins the CYCLE census with
  **exact-set, both-directions** semantics, and in the same file
  `the_mapping_is_total_over_the_committed_graph` **explicitly permits
  `owner == UNMAPPED_ID`** and adds `model.unmapped.len()` into its
  partition arithmetic. The bucket is a legal state to the only Rust test
  that reads the live registry.
- **The sharper half, which the card does not state**: CONVENTIONS leaves
  `arch drift --fail-on` unwired *"while the registry carries live
  undeclared edges by design"*. That reason is specific to `undeclared` —
  `C-10 -> C-14` and `C-05 -> C-15` are both held on purpose — and **no
  such decision has ever been taken for `unmapped`**. Both D2s were
  treated as things to close and both were closed. The `unmapped` arm is
  separable and its blocking reason has lapsed.
- Not fixed here: out of scope by the card's own words, and a new Rust
  assertion would owe a POISON DRILL this card otherwise does not.

### 6. POISON DRILL: NOT OWED, AND SAID SO RATHER THAN LEFT SILENT

**This card adds ZERO assertions and only reconciles existing ones.**
Proved by count rather than asserted: `git show HEAD:<path> | grep -c
"expect("` against the worktree gives **45 -> 45** for
`architecture-dogfood.test.ts` and **44 -> 44** for
`map-dogfood-render.test.tsx`. The diff contains no added `expect(` and
no removed one; all fourteen changes are values inside assertions that
already existed. Per the card's own clause and the drill bullet's "new or
changed", the drill was RUN anyway on the changed set — see the drill
section in the report — because a reconciliation that cannot red is
indistinguishable from one that passes.

### 7. WHERE THE BRIEF AND THE CARD WERE WRONG

- **The card's six-row table is a table of BODIES presented where a count
  of reds is wanted.** Fourteen assertions moved; six bodies went red on
  pass 1 and a seventh assertion on pass 2.
- **"Four titles" is five.** §3 above.
- **The card asserts the C-07/C-10 inversion and never prints its
  numbers.** They are 38/5 and 38/5, measured here.
- The card's `touches:` reads `[docs/architecture/components/,
  app-shell]`; the work also adds a task file under `docs/tasks/`, which
  is the standing suggestion route and not a fence widening.
- Everything else the card and brief assert reproduced exactly: the
  BEFORE and AFTER summaries, the six bodies, the `#[ignore]`d harness,
  the `arch cycles` exit-1-by-design, the identical-figures trap (which
  fired again here, §GRAPH REGEN in the report), and the `lib/parser`
  build order.

### 8. THE DRILL, RUN THOUGH NOT OWED

Detached worktree at `/private/tmp/t141d` — **outside the repository, at a
short path** — `git worktree add --detach` at this lane's own commit
`07295b3`, with its own `lib/parser` + `app` installs so nothing of the
lane's was shared. Removed afterwards with `git worktree remove --force`;
`git worktree list --porcelain` filtered on `refs/heads/task/` reads three
lanes after it, `T-137`, `T-138` and this one.

**ONE SIDE ONLY: the PRODUCER was mutated, never an assertion.** The
mutation is the single registry line this card adds — the claim removed
from `C-05-app.md`'s `paths:` — and it was **read back with `git diff`
before the run**, not trusted to a substitution count.

    baseline   18 passed / 18   exit 0
    mutant      6 failed / 12 passed of 18   exit 1
    restored   18 passed / 18   exit 0

**All six reconciled bodies red under the mutant**, and the red set is
byte-for-byte the pass-1 set. Restoration proved two ways: `shasum -a 256
-c` against the pre-mutation reading (`a0351e5a…`) says OK, and
`git diff --stat` on that path is empty.

**HONEST LIMIT OF THIS DRILL.** One mutation reds at BODY granularity, so
six of the fourteen assertions are individually observed red and the other
eight sit below a first red in the mutant exactly as they did on pass 1.
Surfacing them would mean editing assertions, which is the one-sidedness
rule. What this establishes is that the reconciled set is producer-
sensitive rather than vacuous; it does not individually exercise all
fourteen.

### 9. GATES, DERIVED FROM THE RANGE

Range by the RANGE RULE's executor form, exit read BEFORE the
substitution: `TREE=$(git merge-tree --write-tree 2a922ce HEAD)` exit
**0**, tree **`bc060f6`**; `git diff --name-only 2a922ce bc060f6` returns
**5 paths**. `2a922ce` was re-read from `git -C
/Users/ujju/Projects/nputer rev-parse main` immediately before the range,
not carried from the brief. No `..`, no `...`, no `main..HEAD`.

- **GRAPH REGEN — FIRES** (2 of 5 paths are `.ts`/`.tsx` outside `docs/`).
  **ASKED THREE TIMES, NEVER PREDICTED**: before any write **CURRENT,
  exit 0**; after the fixture writes **STALE, exit 1**; at the commit
  **STALE, exit 1**. The regen belongs to the CHECKPOINT, so the lane
  leaves it stale by construction and says so.
  **AND THE IDENTICAL-FIGURES TRAP FIRED AGAIN, IN ITS PUREST FORM YET.**
  Both stale readings print
  `997202 bytes · 185 files · 2124 symbols · 2039 edges` on **both sides**
  and the verdict is STALE. Only `loc` moved — `architecture-dogfood.test
  .ts` 2044 -> 2175 and `map-dogfood-render.test.tsx` 738 -> 766, `files
  +0 -0 ~2`. STATE.md records two distinct graphs at 997 202 with matching
  file, symbol and edge counts; **this is the third**. A byte count, a
  count comparison and the whole summary line are each insufficient.
- **BOOT GATE — NOT OWED**, derived on the same 5-path list. No path is
  under `app/src/**` or `app/src-tauri/**` and neither manifest moves;
  `app/test/**` matches no arm of the trigger.
- **DOCS GATE — FIRES, exit 1** (it has a verdict). Run from the repo
  root in the one spelling, fed the RANGE RULE's own path list. It names
  **3 paths under docs/ as code inputs** and **four suites**, all four run
  at the tip:

      cargo test from app/src-tauri/    518 passed / 0 failed / 4 ignored   exit 0
      npm test from app/                1013 / 1013                        exit 0
      npm test from tools/e2e/          194 / 194                          exit 0
      npx vitest run from lib/parser/   290 / 290                          exit 0

  The cargo total is SUMMED from eighteen `test result:` lines and
  cross-checked against eighteen `running N tests` headers: 522 = 518 + 4.
  The gate's closing line reads `every live task card's frontmatter
  parses, with a legal status`, which covers this card's own stamp and the
  suggestion filed beside it.
  **FIRST RUN OF THE GATE WAS UNUSABLE AND IS RECORDED RATHER THAN
  DROPPED**: a fresh worktree has no `tools/e2e/node_modules`, so
  `docs-gate.mjs` died on `ERR_MODULE_NOT_FOUND: yaml` with node's own
  exit 1 — which is NOT the gate's exit-1 verdict and must not be read as
  one. `npm install` from `tools/e2e/`, exit 0, then the real run.
- **TOKEN LINT** — `npm run lint:tokens -- --selftest` exit **0**, then
  `npm run lint:tokens` exit **0**: *clean (TOKEN 139 files under app/src,
  app/test, tools/e2e; CONTROL 766 tracked text files)*.
- **POISON DRILL — not owed, run anyway.** §6 and §8.

### 10. ONE THING THIS CARD RE-TRUES BY ACCIDENT, FLAGGED NOT CLAIMED

`architecture-dogfood.test.ts`'s findings body carries a sentence written
at the T-135 Half A checkpoint: *"AND THAT CARD'S ITEM 4 CALLS THIS THE
'FIFTH D1'; IT IS THE SECOND, and there are four findings, not five …
two D1 rows and two D3 rows."* **T-139 made that sentence FALSE** — there
were five findings and a D2 among them — and left it standing beside the
D2 row it had just added. This card takes the findings back to four, so
the sentence is true again **by coincidence rather than by repair**. It is
left untouched and named here so a verifier is not left to wonder whether
it was edited: it was not.

---

## Rework notes (fresh executor claude-opus-5 @T-141, after the REJECTED verdict at `f8d9efd`)

The verdict rejected this card for one reason: the narrative's census.
**Nothing about the disposition, the measurement or the assertion work
was re-opened** — the verdict re-derived all of it and it reproduced to
the digit. What follows is the correction and the one place the verdict
itself was short.

### 11. THE CENSUS, DERIVED INSTEAD OF SEARCHED — AND THE VERDICT'S FIRST D2 IS ONE MERGE AND ONE FILE OFF

**THE COUNT IS THREE AND THE VERDICT IS RIGHT ABOUT THAT. THE FIRST
INSTANCE'S IDENTITY, CREATING EVENT, START TIME, FILE LIST AND DURATION
ARE ALL WRONG IN IT.**

Both the card's original "second" and the verdict's "three, the first
being the engine trio at T-011" were reached by SEARCH — `git log -G` for
`D2:unmapped` or for the `["unmapped", N]` row, plus corroborating prose.
**A `-G` search finds D2s whose literal survives in a diff; it cannot
find one that opened before the literal existed.** One did.

**METHOD.** `arch` reads exactly two inputs —
`docs/architecture/graph.json` and `docs/architecture/components/`
(`GRAPH_REL_PATH` and `REGISTRY_REL_DIR`). So the model is a pure
function of those two committed artifacts, and the census can be
COMPUTED at every point in the repository's history: for each of main's
**390** first-parent commits, `git archive <sha> docs/architecture` into
a scratch root and run one fixed engine (this lane's own
`nputer-index arch`) over it. **350 carry a committed graph**; the
earliest **40** predate `graph.json` (the first is `3d94298` Merge T-009,
2026-08-15 17:21:21), and no D2 can exist where the artifact it is
derived from does not. The sweep never reads a finding id, a fixture, or
a commit message, so **it is capable of returning four** — and it is a
total partition: `arch`'s `unclaimed` set takes every file in the graph
that no component's globs claim, with no `non_code`, language or kind
filter, so it cannot silently undercount.

**RESULT: exactly THREE contiguous windows of `unmapped > 0`**, and the
first is not where anyone put it.

| # | opened (checkpoint regen, after…) | file(s) at open | drained on main | stood |
|---|---|---|---|---|
| 1 | `98b1f4e` **Checkpoint T-017**, 2026-08-15 18:47:21, after `93d3ea6` Merge T-017 | `app/src/lib/verdicts.ts` — ONE; grew to FOUR at `ceaa949` when T-011's checkpoint regen added `derive.ts`, `glob.ts`, `graph.ts` | `ed56884` Merge T-012, 23:18:50 (closing hand `f8046fa` T-012 §2) | **4h31m29s** |
| 2 | `1d8a2c2` **Checkpoint T-110**, 2026-08-25 12:25:46, after `1223543` Merge T-110 | `app/src-tauri/tests/dispatch_lanes.rs` | `8f8ec31` Merge T-033, 16:32:00 (closing hand `1baed94` T-033 phase 1B) | **4h06m14s** |
| 3 | `ae92f67` **Checkpoint T-139**, 2026-08-26 19:40:08, after `aed77b6` Merge T-139 | `app/src-tauri/tests/graph_budget_bench.rs` | this card | one merge |

**WHY THE VERDICT MISSED IT.** It dates D2 #1 to `ceaa949` because that
is where the `["unmapped", 4]` row ENTERS the fixture. But the T-017
checkpoint's regen (`93d3ea6` → `98b1f4e`) added exactly two files to the
graph — `app/test/board-truth.test.tsx`, which C-05 claimed, and
`app/src/lib/verdicts.ts`, which nothing did. **The bucket was already
open, holding one file, for 1h19m52s before the engine trio joined it.**
T-011's checkpoint GREW an open window and was the first to RECORD it.
So `T-011-s1`'s *"the map's own engine becomes its first D2 finding:
[derive.ts, glob.ts, graph.ts]"* — the half of `T-141-s2` the verdict
rules true — names the wrong event and omits `verdicts.ts` from its own
list. Appended to `T-141-s2` rather than edited into its ruling.

**CONTROL, BECAUSE A FIXED ENGINE OVER HISTORICAL INPUTS COULD DRIFT.**
For every one of the 350 graph-bearing commits, the derived count was
compared against the list this very fixture asserted at that commit —
main is kept green, so that assertion is what the engine OF THE DAY
produced. **343 MATCH exactly.** Of the 7 exceptions, **6** predate the
fixture (T-011 introduced it) and exactly one of those 6 carries
`unmapped > 0`: `98b1f4e`, the newly found opening, which has no fixture
because the engine had not merged yet. **The seventh is a genuine
disagreement and it is a finding, not drift**: at `c036779` Merge T-011
the derivation says 1 and the incoming fixture asserted `[]` — **main
carried a false assertion for 62 minutes**, until `ceaa949`, whose own
commit message calls it *"fixture reconciliation"*. So the glob semantics
have not moved, and the one place the engine and the record disagree is a
place where the record was wrong.

**AND THE CONTROL IS THE POINT, NOT DECORATION** — `T-142`, filed on main
while this rework ran, names as its sharpest instance a probe of
`graph.json` for unmapped files that returned *"a plausible rising
series"* because **that file has no component field at all**: the join
happens later, against the registry globs. This sweep avoids that by
construction — it does not read `graph.json` looking for a component, it
runs the engine that performs the join — and the 343-of-350 agreement is
the positive control T-142 asks censuses to carry. **A census that had
returned "three" with no control would have been indistinguishable from
this one, and would have been wrong about the first instance.**

**AND "A DAY" WAS NEVER MEASURED BY ANYONE.** Durations above are all
taken the same way — first first-parent commit carrying the bucket to the
first that drains it, since a lane commit is not yet main. The verdict's
own correction (*"D2 #1 stood 20:07:13 → 21:55:26, 1h48m"*) mixes a main
commit with a LANE commit: `f8046fa` is not on main's first-parent chain
and did not land until `ed56884` at 23:18:50. Measured consistently, **D2
#1 is the LONGEST of the three, not the shortest.**

### 12. WHAT THE REWORK CHANGED

Six newly authored census sites, plus the inherited one, plus `T-141-s1`:

| # | site | was | now |
|---|---|---|---|
| 1 | `architecture-dogfood.test.ts` title, `it(` at the bucket body | "T-141 closes the second D2" | "the THIRD D2" |
| 2 | same file, the `["unmapped", 1]` ledger entry | "has stood in this array twice", first = `dispatch_lanes.rs` | the derived three-window census, with method, control and durations |
| 3 | same file, the pattern paragraph | "TWO FOR TWO … BOTH D2s" | "THREE FOR THREE … ALL THREE", first instance carried as the purest case |
| 4 | same file, "the first lasted a day, the second a merge" | unmeasured | 4h31m29s / 4h06m14s / one merge, with the method named |
| 5 | same file, the D2-row comment in the findings body | "the second it has ever had", "exactly one day at T-033" | "the THIRD", both durations measured |
| 6 | `C-05-app.md` | "SECOND D2 this repository has ever carried" | "THIRD", with the derivation and the three opening commits |
| 7 | `architecture-dogfood.test.ts` pre-existing at `2a922ce` (the verdict's "sixth site") | `dispatch_lanes.rs` "spent one day as this repository's first D2" | "SECOND", 4h06m14s, both corrections named as corrections |
| 8 | `T-141-s1` lines 11, 60 and 69 | "second D2", "Both D2s", "both D2s were created" | third, all three, all three — and the three-for-three makes its own argument stronger |

**THE VERDICT'S TABLE OF SITES IS FIVE AND THE TRUE COUNT IS SIX.** Row 5
above — the D2-row comment in the findings body — is newly authored by
this lane (it rewrote a pre-existing block and carried the miscount
through) and the verdict's *"five sites this diff writes it into"* does
not list it. Also: the verdict's instruction 3 says fix `T-141-s1` line
60; lines **11 and 69** carry the same miscount and are fixed too, since
leaving them would be the exact defect this rejection is about.

### 13. THE DRILL, OWED THIS TIME BY THE VERDICT'S OWN RULING

The verdict ruled: *"a reconciliation that adds zero assertions DOES owe
a poison drill … 'we only changed numbers' is exactly the shape a
loosening takes."* The rework changes fewer things still — comments and
one title — so the drill is recorded in §14 below with its own honest
limit.

**THE ASSERTION COUNT IS UNCHANGED AND MACHINE-VERIFIED AT THIS TIP, NOT
COPIED FROM THE VERDICT**: `expect(` census **45 → 45** and **44 → 44**
against `2a922ce`; expect-STATEMENTS, comments stripped and bodies paired
in file order, **45 → 45** and **44 → 44**; bodies **10 → 10** and
**8 → 8**; **zero added, zero removed**; and per body **3, 1, 3, 2, 2,
3 = 14**, which is the corrected §2 table.

---

## Verdicts

### T-141 VERDICT: REJECTED — verifier claude-opus-5, 2026-08-26. The narrative this card calls "the real work" is built on a census that is wrong: this repository has had THREE D2s, not two, and the first is the one nobody remembers

**Verified at `5c74f3d` (`task/T-141-lane`), against `main` at
`2a922cecfc35e61ab67a20575c5bf792f6a7d7ff`.** Main advanced to
`6036260` (Merge T-138) at 20:25 while this verification ran; the range
was re-derived against it and is byte-identical — see §RANGE. Card read
at its base `2a922ce` and the attack set written to scratch **before**
the diff or the notes were opened, at **2026-08-26T20:22:10+03:00**.

**EVERY MEASURABLE CLAIM IN THIS LANE REPRODUCED EXACTLY.** The
four-owner table, the fourteen assertions, the five titles, all three
pass counts, the drill, the cargo census and the identical-figures trap
were each re-run on a fresh checkout and each came back to the digit.
This rejection is narrow, textual, and does not touch the disposition:
**C-05 is the right owner and the measurement that chose it is sound.**

### The failure — criterion 3, violated by the lane's own replacement title

The card's third criterion is the one it italicises: *"EVERY TITLE THAT
CARRIES A FIGURE OR A CLAIM SHALL MOVE WITH ITS BODY … A title asserting
a bucket that no longer exists is the defect this project has caught
more than any other."* All five titles moved — and the new one at
`app/test/architecture-dogfood.test.ts:1220` reads:

    all 185 files map and the bucket is EMPTY again —
    T-141 closes THE SECOND D2, which stood for exactly one merge

**It is the third.** `app/src-tauri/tests/graph_budget_bench.rs` is this
repository's THIRD D2, and `tests/dispatch_lanes.rs` was its second, not
its first.

**THE FIRST D2 WAS THE MAP'S OWN DERIVATION ENGINE, AT THE T-011 MERGE,
2026-08-15 — AND IT WAS BIGGER THAN EITHER OF THE OTHER TWO.** Four
files, four undeclared edges. Reproduce it in one command:

    git show f8046fa^:app/test/architecture-dogfood.test.ts | sed -n '105,127p'

which returns a live dogfood body reading, against the committed graph
of the day:

    it("59 files map except the four known-unclaimed (engine trio + verdicts.ts)"
    expect(derived.unmappedFiles).toEqual([
      "app/src/lib/architecture/derive.ts",
      "app/src/lib/architecture/glob.ts",
      "app/src/lib/architecture/graph.ts",
      "app/src/lib/verdicts.ts",
    ]);
    ["unmapped", 4],

plus `id: "D2:unmapped"` in the findings array and
`["unmapped", "C-06", "undeclared", 1]` in the relation table.

**FOUR INDEPENDENT CORROBORATIONS, ONE OF THEM ALREADY IN THIS TREE:**

1. `git log -G'\["unmapped", [0-9]' -- app/test/architecture-dogfood.test.ts`
   returns SIX commits, not four. The row enters at **`ceaa949`
   "Checkpoint: T-011 done"** (2026-08-15 20:07:13), which follows
   **`c036779` "Merge T-011"** (19:05:31), and leaves at **`f8046fa`
   "T-012 §2"** (21:55:26).
2. `f8046fa`'s own commit message: *"D2:unmapped GONE (all 59 files
   map)"*.
3. **`docs/tasks/rejected/T-011-s1-engine-location-vs-c12-paths.md:18`**
   — *"the map's own engine becomes its **first D2 finding**:
   `D2:unmapped` [derive.ts, glob.ts, graph.ts]"*. Filed 2026-08-15.
4. **`docs/ARCHITECTURE.md:1004`** says the same four words —
   *"this repository has its **first D2 finding**"* — about T-110's
   `dispatch_lanes.rs`. **The repository contradicts itself**, and the
   T-011 record is the half with contemporaneous test evidence behind
   it. That line is the seed of the whole error chain and is OUT OF
   THIS CARD'S FENCE; routed as **`T-141-s2`**, filed beside this
   verdict.

### The five sites this diff writes it into, all newly authored here

| # | site | text |
|---|---|---|
| 1 | `app/test/architecture-dogfood.test.ts:1220` | title — *"T-141 closes the second D2"* |
| 2 | `app/test/architecture-dogfood.test.ts:1620` | *"this repository's first D2, created by the T-110 merge"* |
| 3 | `app/test/architecture-dogfood.test.ts:1625` | *"so the second D2 this repository has ever carried was a benchmark harness"* |
| 4 | `app/test/architecture-dogfood.test.ts:1629` | **the pattern paragraph** — *"WORTH RECORDING BECAUSE IT IS NOW TWO FOR TWO. BOTH D2s THIS REPOSITORY HAS EVER HAD …"* |
| 5 | `docs/architecture/components/C-05-app.md:64` | *"became the SECOND D2 this repository has ever carried"* — **in the registry `arch` reads and the map renders** |

and once more in the suggestion filed beside it,
`T-141-s1` line 60: *"Both D2s this repository has ever had were treated
as things to close and both were closed."*

A sixth site, `architecture-dogfood.test.ts:1177` (*"spent one day as
this repository's first D2"*), is **PRE-EXISTING at `2a922ce`** and not
this lane's — but it is in-fence and in the same file, so the rebuild
should take it in the same pass.

**THE ERROR IS INHERITED AND WAS ESCALATED.** `docs/STATE.md:124` at
`2a922ce` already says *"the SECOND D2 it has ever had"*, and the card's
own first sentence says *"this repository's second D2"*. The lane did not
invent it. But the lane's §7 is titled *"WHERE THE BRIEF AND THE CARD
WERE WRONG"* and audits the card's title count, its table of bodies, its
unprinted numbers and its `touches:` — it accepted the duty and then did
not apply it to the card's opening sentence. And it turned an inherited
figure into a **new, emphatic, load-bearing claim**: the paragraph's
stated warrant is *"BECAUSE IT IS NOW TWO FOR TWO"*, so the miscount is
not decoration, it is the reason the paragraph says it exists.

### AND THE PATTERN ITSELF SURVIVES — AT THREE FOR THREE, WHICH IS STRONGER THAN WHAT WAS CLAIMED

I checked all three histories independently, as the brief asked. The
lane's mechanism sentence is right every time:

| # | created (regen at the checkpoint after…) | file(s) | closed by, a later hand |
|---|---|---|---|
| 1 | `ceaa949`, after **Merge T-011** `c036779`, 2026-08-15 20:07 | `derive.ts`, `glob.ts`, `graph.ts`, `verdicts.ts` | `f8046fa` **T-012 §2**, 21:55 |
| 2 | `1d8a2c2`, after **Merge T-110** `1223543`, 2026-08-25 12:25 | `tests/dispatch_lanes.rs` | `1baed94` **T-033 phase 1B**, 14:37 |
| 3 | `ae92f67`, after **Merge T-139** `aed77b6`, 2026-08-26 19:40 | `tests/graph_budget_bench.rs` | `5c74f3d` **T-141**, 20:17 |

**Every one was created by a merge's regen — the checkpoint's act, not
the lane's — and every one was closed by a later card's hand, never by
the merge that made it.** Three for three. **The paragraph's conclusion
is not in doubt; only its census is.** That is why this is a correction
and not a redesign.

**AND "THE FIRST LASTED A DAY" IS WRONG TWICE OVER.** It names the wrong
instance, and the duration is wrong for either candidate: D2 #2 stood on
main from 12:25:46 to `8f8ec31` (Merge T-033) at 16:32:00 the SAME
day — **4h06m**; D2 #1 stood from 20:07:13 to 21:55:26 — **1h48m**. The
phrase is inherited from `STATE.md` and the base fixture; it should stop
being repeated as a duration.

### A second, independent defect: the notes' own assertion table does not sum to its own headline

Notes §2 states **fourteen** assertions — correct, and I machine-verified
it — then prints a six-row table whose "assertions moved" column reads
**4, 1, 4, 2, 2, 3 = 16**. Two rows count ARRAY ROWS as assertions:

- *"all 185 files map …| 4 — `unmappedFiles`, the `UNMAPPED_ID` lookup,
  the C-05 tally row, the `["unmapped", 1]` tally row"* — the last two
  are **one** `expect([...counts.entries()].sort()).toEqual(…)`. It is 3.
- *"the full relation table …| 4 — the row array (four rows inside it),
  the relation tally, the undeclared identity list"* — three items
  listed, four claimed. It is 3.

The true per-body counts are **3, 1, 3, 2, 2, 3 = 14**, machine-derived
by extracting every `expect(…)` statement from both files at `2a922ce`
and at `5c74f3d` and diffing the normalised set: **9 moved in
`architecture-dogfood.test.ts`, 5 in `map-dogfood-render.test.tsx`, 0
added, 0 removed.** Fix the table, keep the headline.

### THE FOURTEEN, RE-DERIVED — and the eight that sit below a first red

`expect(` census, base → tip: **45 → 45** and **44 → 44**. Bodies
**10 → 10** and **8 → 8**. **Zero assertions added; fourteen values
moved inside assertions that already existed.** The six first-reds, from
my own pass-1 run, are exactly the six the card's table forecast:

    architecture-dogfood.test.ts:1338  unmappedFiles
    architecture-dogfood.test.ts:1671  derived.findings
    architecture-dogfood.test.ts:1726  derived.edges.map(...)
    architecture-dogfood.test.ts:1993  drift
    map-dogfood-render.test.tsx:117    map-node toHaveLength(14)
    map-dogfood-render.test.tsx:376    map-edge toHaveLength(39)

**6 first-reds + 8 hidden = 14.** The eight hidden ones are the
`UNMAPPED_ID` lookup and the counts array (body 1), the tally and the
undeclared identity list (body 3), `findings.filter(isDriftFinding)`
(body 4), the bucket identity check (body 5), and the undeclared count
and identity list (body 6).

### THE SECOND-ASSERTION TRAP, REPRODUCED AND THEN DEMONSTRATED

Both of the lane's published pass numbers reproduce on a fresh checkout,
exactly:

    fixtures at 2a922ce + the C-05 claim   ->  6 failed / 1007 passed (1013)  exit 1
    tip, with ONLY findings.filter(isDriftFinding) reverted
                                           ->  1 failed / 1012 passed (1013)  exit 1
                                               red reported at :2148
    tip                                    ->  0 failed / 1013 passed (1013)  exit 0

**AND THE TRAP MADE VISIBLE, WHICH NO PASS COUNT CAN DO.** Revert BOTH
assertions in `drift flags land on the right nodes` and vitest prints the
**identical headline** — `1 failed / 1012 passed` — but names only line
**2114**; line **2148 does not appear in the output at all**
(`grep -c 2148` on the run log returns **0**). Two false assertions and
one false assertion are indistinguishable from the summary line. **The
lane's conclusion is correct and now demonstrated rather than argued: a
failure count is a floor and never a total.** Third consecutive hand, and
the first where a body-by-body forecast existed and still missed one.

### THE FOUR-OWNER TABLE, RE-RUN — restored to HEAD and `git status --porcelain` proved empty between every arrangement

`nputer-index arch --root ../..` from `app/src-tauri`, exit 0 each time,
graph unchanged at `997202 bytes · 185 files · 2124 symbols · 2039 edges`:

| arrangement | edges | findings | drift_components | what it adds |
|---|---|---|---|---|
| no owner (`C-05-app.md` at `2a922ce`) | **39** | **5** | 5 | the `unmapped` node at `drift=D2` + `unmapped -> C-07` and `unmapped -> C-10` |
| **C-05** (the lane's claim) | **37** | **4** | 4 | **nothing** — undeclared rows stay `C-05->C-15`, `C-10->C-14` |
| C-07 | **38** | **5** | 5 | new `C-07 -> C-10 undeclared`; C-07 goes `observed_deps 0 -> 1`, `drift - -> D1` |
| C-10 | **38** | **5** | **4** | new `C-10 -> C-07 undeclared`; C-10 reads **`drift=D1,D1`** |

**The inversion is observable, not merely reasoned, and the card's own
IF/THEN is satisfied: only C-05 adds no edge.** The fold is exact —
`C-05 -> C-07` **1 → 2** and `C-05 -> C-10` **39 → 40**, both already
CONFIRMED; C-05 `files 63 → 64`. The two `use` lines at
`tests/graph_budget_bench.rs:59-60` are verbatim what the card quotes.
`C-07 depends_on: []` confirmed. One column the lane's table records that
the brief does not: **C-10 drops `drift_components` to 4 while findings
stays 5**, because both of C-10's findings land on one node.

### THE POISON DRILL — MY RULING: A RECONCILIATION THAT ADDS NOTHING STILL OWES ONE, AND THIS LANE WAS RIGHT TO RUN IT

The lane proved by count that it adds zero assertions, said so
explicitly as the card demanded, and drilled anyway. **That was the
right call and I am ruling it the standing one.** A reconciliation
changes what an assertion MEANS even when it adds none; an assertion
whose new value cannot be made red is indistinguishable from one that
was loosened, and "we only changed numbers" is exactly the shape a
loosening takes. The T-139 checkpoint already ruled that a measurement
is not exempt because it is not an assertion; this is the same rule one
step further. **The exemption clause in the card — "if this card adds
none … say so explicitly" — buys a SENTENCE, not a skipped drill.**

Reproduced on my checkout, one producer-side mutation (the single
registry line removed from `C-05-app.md`'s `paths:`, read back with
`git diff --stat` before the run), `npx vitest run` over the two
fixtures only:

    baseline   18 passed / 18   exit 0
    mutant      6 failed / 12 passed of 18   exit 1
    restored   18 passed / 18   exit 0   (git status --porcelain empty)

**Its honest limit, which the lane states itself and I confirm:** one
mutation reds at BODY granularity, so six of the fourteen are
individually observed red and **eight sit below a first red in the
mutant exactly as they did on pass 1**. The drill establishes that the
reconciled set is producer-sensitive rather than vacuous; it does not
individually exercise all fourteen. Surfacing the other eight would mean
editing assertions, which the one-sidedness rule forbids. **That is the
correct trade and the limit is correctly named.**

### `T-141-s1` — RULED: the card is SOUND, and sharper than the parent asked for. Keep it as filed

Every mechanism claim in it verifies verbatim at `5c74f3d`:

- `crates/nputer-index/tests/arch.rs:211-214` — the `KNOWN_DECLARED_CYCLES`
  comment reads *"EXACT-SET semantics, BOTH directions. A cycle that
  appears and is not listed here reds; an entry left here after its cycle
  is gone reds too."* Quoted accurately.
- `the_mapping_is_total_over_the_committed_graph` (`arch.rs:59-79`)
  asserts `owner == UNMAPPED_ID || declared.contains(owner)` and adds
  `model.unmapped.len()` into the partition arithmetic. **A file in the
  bucket is a legal state to it by construction.** Confirmed.
- **The separability claim is not just arguable, it MEASURES.** From
  `app/src-tauri` at this tip:

        arch drift                        exit 0   REPORT
        arch drift --fail-on unmapped     exit 0   CLEAN  matched 0 findings
        arch drift --fail-on undeclared   exit 1   DRIFT  matched 2 finding(s)
        arch drift --fail-on any          exit 1   DRIFT  matched 4 finding(s)

  **The arm whose blocking reason is real reds; the arm whose blocking
  reason never covered it is green.** CONVENTIONS' *"stays unwired while
  the registry carries live undeclared edges by design"* is specific to
  `undeclared`, and the two rows it protects are exactly the two the
  drift report names — `C-10 -> C-14` (T-125's cycle) and `C-05 -> C-15`
  (routed to `T-126-s3` item 4). I searched `docs/decisions/` and
  `docs/rooms/` for any ruling that tolerates `unmapped` and found none.
  **This is a gate that could have existed and was blocked by a rationale
  that never covered it.**
- `cargo test --no-fail-fast` from `app/src-tauri`: **518 passed / 0
  failed / 4 ignored, exit 0**, summed from **eighteen** `test result:`
  lines and cross-checked against **eighteen** `running N tests` headers,
  **522 = 518 + 4**. Byte-identical to what T-139 recorded on both sides
  of the D2's creation. **The Rust side is blind across the creation and
  the closure alike** — confirmed on my own machine, not quoted.
- Its refusal to recommend option 1 is the right call: a gate that reds
  at the merge would force the integrator into the disposition a
  checkpoint may not take — and my three-instance table above makes that
  argument STRONGER, not weaker. Option 2 (a `KNOWN_UNMAPPED` exact-set
  pin) is the shape that matches the cycle census.

**One correction owed inside it**: line 60's *"Both D2s this repository
has ever had"* is the same miscount; it becomes "all three", and the
sentence gets stronger for it. Nothing else in the card moves.

### The cargo-blindness gap earns a finding — CONFIRMED, and correctly filed rather than fixed

Criterion 2 asked for a ruling and got one. The gap is real, it is now
measured in both directions, and the card is right that fixing it here
would owe a poison drill this card does not otherwise owe. **Filed, not
fixed, is correct.**

### FIVE TITLES, NOT FOUR — CONFIRMED, and the card's count is wrong in its own table

I swept every `it(`/`test(` title in both dogfood fixtures for a figure
or claim this change falsifies. Exactly five carry one and all five
moved. The fifth — *"the full relation table: 26 confirmed, 4
undeclared, 9 planned"* — is the one the card's criterion misses **while
quoting it in its own table**. `drift flags land on the right nodes` is
the sixth body and carries no figure, correctly unmoved. I also cleared
the two nearby titles that carry live counts and are NOT affected:
*"C-07 is a REAL face at last: thirty-six Rust files"* (C-07 stays at 36
under the C-05 claim — it would have moved to 37 under the C-07
arrangement) and *"C-15 HAS TERRITORY AT LAST: five files"* (still 5).

### THE INCIDENTAL RE-TRUING — CONFIRMED, and correctly flagged rather than touched

`architecture-dogfood.test.ts:1733-1735` carries the T-135-era sentence
*"there are four findings, not five … two D1 rows and two D3 rows."*
It is **byte-identical at `2a922ce` and at `5c74f3d`** (base line 1669,
tip line 1734) — untouched, as the notes say. It was FALSE at base (5
findings, one of them the D2) and is TRUE at the tip: `arch drift` now
reports `D1:C-05->C-15`, `D1:C-10->C-14`, `D3:C-01`, `D3:C-11` — two D1
rows and two D3 rows. **Re-trued by coincidence, named rather than
claimed. Correct handling.**

### RANGE

**`git merge-tree --write-tree main task/T-141-lane`, exit read BEFORE
the substitution: exit 0**, tree `7ecc93f`. `git diff --name-status
<main^{tree}> 7ecc93f` → **5 paths**. No `..`, no `...`, no `main..HEAD`.

**Main moved during this verification and the range was re-derived.** At
`main = 2a922ce` (20:22) the tree was `7ecc93f`; `6036260` (Merge T-138)
landed at 20:25 and against `main = 6036260` the merge-tree is
`b6af721`, still **exit 0** and still the same 5 paths with an identical
`--stat`. T-138's merge adds only five `docs/tasks/*.md` files and
touches neither `graph.json` nor the registry, **so no figure in this
lane is falsified by it.**

The notes' §9 range quotes tree `bc060f6` at `07295b3`; that commit is a
pre-amend predecessor and is not an ancestor of `5c74f3d`
(`git log 2a922ce..task/T-141-lane` returns exactly one commit). I
re-derived it: `merge-tree --write-tree 2a922ce 07295b3` **is** `bc060f6`,
exit 0, 5 paths. **The notes' figure was true at the ref it names and is
not the tip's tree** — worth a ref, not a correction.

    M  app/test/architecture-dogfood.test.ts        +187 -56
    M  app/test/map-dogfood-render.test.tsx         +38  -10
    M  docs/architecture/components/C-05-app.md     +35  -0
    A  docs/tasks/T-141-s1-…-exact-set-one.md       +94  -0
    M  docs/tasks/T-141-…-was-measured.md           +260 -1

`docs/tasks/` sits outside `touches:` and is the standing suggestion
route, not a fence widening — the lane says so and I agree.

### SUITES AND GATES, all at `5c74f3d` on a fresh checkout, exits read unpiped from `$?`

    npm test          from app/          1013 / 1013   exit 0
    cargo test --no-fail-fast  app/src-tauri   518 / 0 / 4   exit 0
    npx vitest run    from lib/parser/     290 / 290   exit 0
    npm test          from tools/e2e/      194 / 194   exit 0
    npm run build     from app/                        exit 0
    npx tsc --noEmit  from lib/parser/                 exit 0
    npm run typecheck from tools/e2e/                  exit 0
    npm run lint:docs from tools/e2e/                  exit 0
    npm run lint:tokens from tools/e2e/                exit 0
      clean (TOKEN 139 files; CONTROL 766 tracked text files)
    arch cycles       from app/src-tauri   exit 1 BY DESIGN
      declared_edges=35 at the tip AND at 2a922ce — no declared edge added

`npm test` from `app/` reds at **14 failed** on a fresh checkout until
`npm run build` has run (`test/window-manifest.test.ts` asserts about the
SHIPPED stylesheet and refuses to skip). **That is the build order, not
a defect** — `lib/parser` `npm ci` + `npm run build` first, then `npm run
build` from `app/`. `npm run lint:docs` needs `tools/e2e/npm ci` first or
node exits 1 on `ERR_MODULE_NOT_FOUND: yaml`, which is node's exit and
not the gate's verdict.

**GRAPH REGEN — ASKED, NEVER PREDICTED, AND ASKED AGAIN AFTER EVERY
WRITE.** Both asks (before my experiments and after everything was
restored) return:

    committed:   997202 bytes · 185 files · 2124 symbols · 2039 edges
    fresh index: 997202 bytes · 185 files · 2124 symbols · 2039 edges
    -> STALE, exit 1
    files  +0  -0  ~2   (architecture-dogfood.test.ts loc 2044 -> 2175,
                         map-dogfood-render.test.tsx  loc  738 ->  766)

**All four printed figures identical on both sides and the verdict is
still STALE.** This is the third distinct graph at 997 202 bytes with
matching file, symbol AND edge counts. **The regen belongs to the
checkpoint; the lane leaves it stale by construction and says so, which
is right.**

### Security sweep — MANDATORY, and it is CLEAR at REJECTED level

The diff is prose, test-fixture values and one registry `paths:` line.
No new input path, no endpoint, no query, no unsafe default. **No
manifest or lockfile is touched** (`git diff --name-only 2a922ce
5c74f3d` matches neither `package*.json` nor `Cargo.toml`/`Cargo.lock`),
so no dependency is added. No secret-shaped string in the diff. **The
registry line widens C-05's `paths:` by exactly one literal file path,
not a glob** — it cannot silently claim a directory. Clear.

### What the card and the brief got wrong

**The card** (architect, from a scratch measurement) — the lane found
three of these; two more are mine:

1. *"Four titles carry the D2 as a claim"* — **five**, and the fifth sits
   inside the card's own table. (Lane's.)
2. The six-row table is a table of BODIES presented where a count of reds
   is wanted; **fourteen assertions moved**. (Lane's.)
3. The C-07/C-10 inversion is asserted and never printed; the numbers are
   **38/5 and 38/5**. (Lane's.)
4. **"T-139's merge created this repository's second D2"** — the card's
   FIRST SENTENCE, and the seed of this rejection. **It is the third.**
   Criterion 5's premise (*"Both D2s in this repository's history…"*)
   inherits it. (Mine.)
5. **"137 lines … (`ae92f67`: `architecture-dogfood.test.ts` +103,
   `map-dogfood-render.test.tsx` +63)"** — the citation contradicts the
   headline it is offered as evidence for. `git show --numstat ae92f67`
   gives **+84/−19** and **+53/−10**. 84+53 = **137**, so the headline is
   right; 103 and 63 are **lines TOUCHED**, printed with a `+` as if they
   were insertions, and they sum to **166**. The two figures for one
   quantity disagree by exactly the 29 deletions. (Mine — the lane did
   not catch it either.)

**The brief:**

- *"Expect `193/194`"* — **no. `npm test` from `tools/e2e/` is 194/194,
  exit 0**, on port 14522 (re-probed free immediately before binding;
  1420 confirmed held by the human's app and never touched). The pin at
  `brief.spec.ts:706` joins the machine-wide worktree list to this
  checkout's card index, and this checkout carries live cards for every
  lane branch the machine holds — `T-137`, `T-138`, `T-141` — so it is
  honestly green, not vacuous. **T-138's own merge subject records the
  same brief prediction failing the same way.**
- *"+226 / −66"* — **+225 / −66**. `git diff --shortstat 2a922ce 5c74f3d`
  over the two fixtures reads *"225 insertions(+), 66 deletions(-)"*.
  The lane's §4 heading repeats the same off-by-one.
- *"C-10 … 38 / 5"* is right, but its `drift_components` is **4**, not 5
  — the only row in the four-owner table where that column does not track
  `findings`.

### What a fresh executor owes

Small and bounded. **Do not re-open the disposition, the measurement or
the assertion work — all of it verified.**

1. Correct the census at the five sites in the table above **and at the
   inherited site `architecture-dogfood.test.ts:1177`**: three D2s, this
   one is the third, `dispatch_lanes.rs` was the second, and the first
   was the derivation engine plus `verdicts.ts` at the T-011 merge
   (`ceaa949`, drained at `f8046fa`).
2. Rewrite the pattern paragraph's warrant from *"TWO FOR TWO"* to three
   for three, and carry the first instance's row. **The pattern gets
   stronger; do not weaken the paragraph, extend it.** Drop *"the first
   lasted a day"* or replace it with a measured duration and a ref.
3. Fix `T-141-s1` line 60 the same way.
4. Fix the notes' §2 table so its column sums to its own headline of 14.
5. Correct §4's `+226` to `+225`.
6. Re-run `npm test` from `app/` **until the body is green, not until the
   first message stops appearing** — the edits are comments and titles,
   but title text is inside `it(` and the fixtures are indexed.
7. **Leave `docs/ARCHITECTURE.md:1004` alone — it is outside `touches:`.**
   `T-141-s2` is filed for it.

**Not stamped by this verdict:** `verifier:`, `verified_by:`, `review:`
and `status:` are untouched, per the precedent at `6fea6a1`.
