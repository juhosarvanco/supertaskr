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
| `all 185 files map …` | 4 — `unmappedFiles`, the `UNMAPPED_ID` lookup, the C-05 tally row, the `["unmapped", 1]` tally row |
| `THE FINDINGS …` | 1 — the `D2:unmapped` row |
| `the full relation table …` | 4 — the row array (four rows inside it), the relation tally, the undeclared identity list |
| `drift flags land …` | 2 — `drift`, and the hidden `isDriftFinding` list |
| `renders all thirteen …` | 2 — the node count, the bucket identity check (INVERTS) |
| `draws the full … relation table` | 3 — the edge count, the undeclared count, the undeclared identity list |

Every value was derived from `arch`'s own output BEFORE the re-run, never
read off a failure diff.

### 3. FIVE TITLES MOVED, NOT FOUR

The card says four titles carry the D2 as a claim. **Five carry a figure
or a claim that this change falsifies**, and the fifth is in the card's
own table:

1. `all 185 files map and ONE of them lands in the bucket — T-139 re-opens the D2 that stood for a day at T-033` -> `all 185 files map and the bucket is EMPTY again — T-141 closes the second D2, which stood for exactly one merge`
2. `THE FINDINGS: … — AND A D2 THIS MERGE CREATED` -> `… — AND THE D2 IS GONE, RETIRED BY A DECLARATION THAT COST NO EDGE`
3. `the full relation table: 26 confirmed, 4 undeclared, 9 planned` -> `26 confirmed, 2 undeclared, 9 planned` — **the one the card's count misses**; its table lists this body's `4 undeclared` and its criterion still says "Four do."
4. `renders all thirteen declared components in full mode, and the bucket is BACK` -> `… and the bucket is GONE again`
5. `draws the full 39-edge relation table, with FOUR undeclared rows left — two of them the bucket's` -> `draws the full 37-edge relation table, with TWO undeclared rows left — the bucket's two are gone`

`drift flags land on the right nodes` is the sixth body and its title
carries no figure, which is why it did not move.

### 4. THE NARRATIVE WAS REWRITTEN, NOT DELETED — +226 / -66

Every ledger entry T-139's checkpoint wrote is still in the file. The D2
rows leave the ASSERTIONS and stay as comments beside them, because the
row's departure is the finding and the explanation is the evidence for
it. **The pattern paragraph sits at the `["unmapped", 1]` tally row**,
where both D2s' histories already met:

> BOTH D2s THIS REPOSITORY HAS EVER HAD WERE CREATED BY A MERGE AND
> CLOSED BY A LATER HAND, NEVER BY THE MERGE THAT MADE THEM.

with the mechanism on both sides — a merge adds a `.rs` file to a
directory claimed one file at a time and the regen (the checkpoint's act,
not the lane's) discovers it afterwards; a later card takes the
disposition, because neither an executor (fence) nor an integrator (a
checkpoint takes no dispositions) may take it. The first lasted a day,
the second a merge.

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
