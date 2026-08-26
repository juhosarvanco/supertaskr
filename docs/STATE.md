# State

Updated: 2026-08-26 by the T-135 **Half A** integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP. NOTHING IS BROKEN.
ONE COMMAND ON MAIN EXITS 1 ON PURPOSE. AND ONE CARD IS `status:
building` WITH NO LANE, WHICH IS ALSO ON PURPOSE — SEE THE NEXT
SECTION.** This merge is **512 / 973 / 268 / 194 green**. `cargo run -p
nputer-index -- arch cycles --root ../..` is **exit 1** on main and that
is the DESIGNED state — the one declared cycle `C-08 -> C-09 -> C-08`
survives because removing it needs paths T-127's fence could not reach,
and the removal is routed with its measurement (`T-127-s1`). **The
ENFORCING copy is `cargo test`, which is green.**

## **THE CARD THIS MERGE LANDS IS MERGED AND STILL OPEN. DO NOT READ IT AS A LAPSED STAMP.**

**`T-135` is `status: building` and NO LANE IS LIVE.** That combination
has meant "somebody forgot" every other time it has appeared in this
record. **It does not mean that here, and this section is what stops the
next reader concluding it does.**

T-135 is one card with two halves and a reversible boundary between them
(its planning pass §2). **HALF A MERGED**: `mod` declarations become
graph edges, `arch blast` derives dependents, and the whole thing is
verified and APPROVED at `c983a7d`. **HALF B DID NOT**: the ceremony
section in `method/tasks/TASK-FORMAT.md` and ADR-018 are unwritten,
because they wait on **@human's look at §6 and §7** — where the ceremony
rungs sit, and whether they bind at all. **No frontmatter line moved**:
`verifier:`, `built_by:`, `verified_by:` and `review:` are all still
empty, because `TASK-FORMAT.md` stamps the last three **on done** and
this card is not done. The verdict deliberately moved none of them
either.

**`status:` HAS A CLOSED VOCABULARY AND NONE OF ITS EIGHT VALUES IS
TRUE OF THIS CARD.** `verifying` would assert Half B is under review;
`done` would assert it exists; `planned` would discard the merge.
`building` is the least false, and it is the value `roles/executor.md`
step 6 says an executor must not be told to keep. **The conflict is
RECORDED AND ROUTED, not decided, as `T-135-s4`** — which is what the
role file itself requires of a conflict, and which is why you are
reading this paragraph instead of finding a card that lies.

**WHAT THIS MEANS FOR YOU, CONCRETELY.** The fences T-135 held are
released: **`crate-index` is FREE and `method/tasks/TASK-FORMAT.md` is
FREE.** Half B, when it is taken, wants a FRESH lane cut from this
checkpoint (lane-protocol rule 2) and a fence that includes
`docs/decisions/` — **widening it is the architect's and no lane's**
(planning pass §11). Do not re-dispatch the whole card: Half A is on
main and its criteria 1–3 are discharged.

## WHAT HALF A ACTUALLY LANDS, AND WHAT IT IS NOT

**A RUST `mod` DECLARATION IS NOW AN EDGE. THAT SENTENCE IS THE WHOLE
DELIVERABLE AND ITS FIRST ACT WAS TO REVEAL A DEPENDENCY NOBODY COULD
SEE.** Rust reached across its own module tree by `mod` and produced
nothing, so the file whose absence made a whole component compile into
nothing was the file the graph rated at zero. **44 `mod` pairs resolve,
17 already carried a `use` edge, 27 are new**, and the graph delta is
**+32 edges = 27 + 4 + 1** — 4 are `blast.rs`'s own outbound edges and 1
is `arch/mod.rs -> arch/blast.rs`, this card's own `pub mod blast;`.

**IT IS PURELY ADDITIVE AND THAT WAS PROVED AS SETS, NOT AS COUNTS**:
keyed on the full edge tuple `(from, to, kind, symbols, reexport,
confidence)`, **32 added, 0 removed, 0 CHANGED IN PLACE.** That property
is bought by making the `mod` occurrence the WEAKEST one available — no
`symbols`, no `reexport` claim, no provenance field. A `reexport: false`
occurrence would have cleared `reexport: true` off three live edges; a
symbol-carrying one would have grown 16 of the 17 merged pairs. Both are
poisoned in the suite.

**AND HERE IS WHAT IT IS NOT.** It is **not** a new edge kind:
`GRAPH_EDGE_KINDS` in `app/src/lib/architecture/graph.ts:23` is a CLOSED
vocabulary whose reader skips an unknown kind *while emitting a
`graph-entry` issue*, and `arch/mod.rs:282` filters `kind != "import"`,
so a `kind: "mod"` would be invisible to the map pane, `arch`, `arch
drift` and D1–D5 while adding one error-strip entry per edge
(`T-135-s2`). It is **not** symbol-level coverage: Rust still emits
**zero `call` and zero `type_ref`** (`T-010-s6`) — ruled SAFE for a
FILE-granularity dependent count and UNSAFE for anything finer, on
arithmetic: ~900 edges and ~175 000 bytes is **3.2x the whole remaining
headroom**. And it is **not** the ceremony rule; that is Half B.

**`arch blast <path|slug>…` IS THE THIRD SUBCOMMAND.** It reverses the
committed graph's `import` edges **at read time** — nothing is stored, so
T-057's two-implementations failure cannot arise — resolves slugs through
each component's own `touch_slugs:`, shares ONE definition of
build-target-root-ness with the indexer, and prints a `pkg-seam` marker
because a cross-package FILE-level blast radius is not computable from
today's graph (`T-135-s1`). **IT IS NOT IN `docs/CONVENTIONS.md`'s
command list**, the same gap `arch cycles` has carried since T-127 —
`T-127-s5` is now **two commands wide**.

### **THE ONE THING HALF B CANNOT DO YET, AND IT IS A MEASUREMENT RATHER THAN A JUDGEMENT**

**§7's FLOOR RULE CANNOT BIND WHILE `arch blast` PRINTS A BARE
`dependents=0` FOR THREE OF ITS EIGHT ROOTS.** The rule is *"a
build-target root is never at rung 0"*, and its own safety depends on
roots being identifiable. The five Rust roots print
`build-target-root=yes`; **`app/src/main.tsx`, `app/vite.config.ts` and
`app/vitest.config.ts` print a bare `dependents=0`** — this crate
computes no TypeScript entry points — **and are therefore
indistinguishable from genuinely unimported files, in exactly the failure
direction the card exists to close.** The gap is disclosed in the lane's
correction 8 and the verdict's F3 and **nowhere a reader of the command
will meet it.** Half B must close it or state it in the output before the
rule binds anything. This is not a Half A defect and Half A was approved
with it named.

## THE FIXTURE RECONCILIATION WAS BIGGER THAN THE CARD THAT PREDICTED IT, AND THE CARD IS THE ONE ABOUT PREDICTING IT

**`T-135-s3` EXISTS TO WARN THE INTEGRATOR THAT COMMITTING THE
REGENERATED GRAPH REDS TWO `app/` SUITES. IT FORECASTS 6 FAILED / 967
PASSED. THE MEASUREMENT AT THIS MERGE IS 9 FAILED / 964 PASSED.**

Four in `architecture-dogfood.test.ts`, five in
`map-dogfood-render.test.tsx`. **Six are the `C-05 -> C-15` D1 the card
describes — three and three, exactly as written. The other three are
`blast.rs` arriving as the 181st indexed file and C-07's 35th**, and they
move under **neither** repair the card offers:

    architecture-dogfood.test.ts   expected 181 to be 180
    map-dogfood-render.test.tsx    'C-07 … 35 files' to contain '34 files'
    map-dogfood-render.test.tsx    'committed graph · 181 files' to be '… 180 files'

The verifier found this by **rebuilding the tree the card's figures
describe — the final tree minus `blast.rs` — and getting exactly 6/967**;
this integrator re-derived the nine from the merged tree instead. **An
integrator who followed `T-135-s3` to the letter would have shipped three
reds.** The card's own `Measured at 5547f02` line is the tell: `arch` at
that ref reads a graph with no `mod` edges and cannot print `36 -> 37`.

**AND A TENTH RED ASSERTION EXISTED THAT NO FIRST RUN COULD SHOW.**
Reconciling `expect(drift)` in `drift flags land on the right nodes`
un-hid `expect(derived.findings.filter(isDriftFinding)…)` four lines
below it, **in the same body** — the "a red on the first hides the
second" trap that file has warned about in its own comments since T-028,
fired on the pass that was reading the warning. **Nine failing bodies,
ten red assertions, twenty-one edited sites counting the six test TITLES
that carried a now-false figure.** A fixture pass runs until the body is
green, never until the first message stops appearing.

**THE `C-05 -> C-15` DRIFT IS LEFT UNDECLARED, AND THAT IS RULING
THIRTEEN ANSWERED WITH ONE COMMAND.** `pub mod dispatch;` landed at T-126
(`0fa83da`) and `git log -S "C-15" --
docs/architecture/components/C-05-app.md` is **EMPTY** — the declaration
has never existed. The defect was exactly as false one commit before this
merge as after it, so it is **FILED, not repaired**: the fixtures are
this merge's debris and were reconciled, the registry is not, and
declaring C-15 here would have destroyed the evidence that the dependency
predates the merge — usually the most interesting thing about it. Routed
to **`T-126-s3` item 4**, whose own text calls it the *"fifth D1"* when
`arch drift` reports **two D1 rows and four findings** at this
checkpoint. Recorded rather than edited: disposition belongs to a triage
(T-083).

## **THE IDENTICAL-FIGURES TRAP FIRED, IN THE STRONGEST FORM IT HAS**

**SIX CONSECUTIVE CHECKPOINTS SAID THE DISCRIMINATOR HELD BECAUSE NO
FIXTURE WAS WRITTEN. THIS ONE WROTE FIXTURES AND THE TRAP FIRED.**

GRAPH REGEN was asked **four** times. The second ask — after the fixture
writes — reported **every headline figure identical on both sides**:

    committed:   955710 bytes · 181 files · 2038 symbols · 1943 edges
    fresh index: 955710 bytes · 181 files · 2038 symbols · 1943 edges
    -> STALE, exit 1
    files +0 -0 ~2
    | ~ app/test/architecture-dogfood.test.ts   (content, loc 1868 -> 1951)
    | ~ app/test/map-dogfood-render.test.tsx    (content, loc 621 -> 684)

**Same byte count to the byte, different file**: `sha256` went
`4cf667a3…` → `b742efbe…` across the second regeneration while `wc -c`
never moved. **A byte comparison would have confirmed "current" and been
wrong.** The planning pass §12's instruction — *ask again after every
fixture write, and never confirm by byte count* — is what caught it, and
this is the first checkpoint in the series where it had something to
catch. The third ask is CURRENT, and so is the fourth, taken after every
doc write in this checkpoint.

## THE GATE SEQUENCING HOLE `T-135-s3` FOUND IS REAL, AND THIS CHECKPOINT CLOSED IT BY HAND

The DOCS GATE's trigger IS `docs/`, and `docs/architecture/graph.json` is
under `docs/` — **so the gate CAN name the suites a graph commit owes,
provided the graph is in the path list the gate is asked about.** It is
not, if you derive the gate from the RANGE RULE's pair alone: the lane
leaves the file uncommitted and the checkpoint commits it afterwards,
which is exactly the sequence this project prescribes (55 of the 57
commits that ever touched it are checkpoints).

**Asked here WITH `docs/architecture/graph.json` in the list**, the gate
named `tools/e2e/tests/shell-frame.spec.ts` and
`tools/e2e/tests/window-contract.spec.ts` as readers of that file — **a
suite `T-135-s3`'s own "cheap fix for THIS merge" does not mention.** The
card's general fix (a sentence in the GRAPH REGEN bullet naming the DOCS
GATE as owed on the checkpoint's own graph commit) is `docs/CONVENTIONS.md`
and is still unwritten.

## THE LANE WORKTREE IS REMOVED AND THE BRANCH IS KEPT — AND THAT IS A CHOICE, NOT A DEFAULT

`/Users/ujju/Projects/nputer-T-135` was removed after the merge and after
this checkpoint (lane-protocol rule 6). **Half B will NOT reuse it, and
three reasons decide it rather than one:**

1. **A worktree on a `task/` branch IS a lane, by this project's own
   derivation** (rule 7: the lane list is a fact on disk,
   `git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'`).
   Leaving it would make every future session derive a LIVE lane holding
   `crate-index` and `method/tasks/TASK-FORMAT.md` — **blocking
   `T-129-s2/s3/s5`, item 10's gate defects and `T-108-s3`'s second half
   for no reason at all.** A false lane is worse than a missing one.
2. **Rule 2 forbids reusing it anyway.** Half B must be cut from the
   newest known-green commit; that worktree's branch is based at
   `70b1d40`, five merges back. Reusing it would re-inherit that state.
3. **Rule 6's own reason is discharged.** The worktree survives until a
   VERDICT exists so the measured copy is reproducible — it does, at
   `c983a7d`, and everything it measured is in main's history now.

**WHAT WAS DISCARDED WITH IT, STATED PRECISELY.** The worktree carried
one modified file, `docs/architecture/graph.json` — the lane's own
deliberate non-commit. `sha256` proved it byte-identical to this
integrator's FIRST regeneration (`4cf667a3…`), and **not** to what is
committed here (`b742efbe…`), because the fixture writes moved two files'
`loc` afterwards. Nothing irreproducible was lost: the indexer is
deterministic — three independent regenerations agreed byte for byte —
so the lane's exact file is `git checkout c983a7d && index --root ../..`
away. `git worktree remove --force` was used for that one file and for
nothing else; `git worktree prune` ran behind it.

## THE LANE LIST, DERIVED AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-THIRD MEASUREMENT
SAYING SO.** Two commands answer it:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

**AFTER THIS CHECKPOINT THERE ARE ZERO LANES.** T-135's was the only one
and it is removed. **DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO
NOT QUOTE THIS PARAGRAPH** — T-133's integration is the case in the record
where quoting the table would have been wrong within ten minutes.

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's
  ruling of 2026-08-25. It holds no fence, is named after no card, and
  must not be removed after a merge. **IT DID NOT MOVE UNDER THIS
  INTEGRATION**: `212543c` at the start and `212543c` at the end, so it
  is now **eight merges and eight checkpoints** behind main.
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS
  INTEGRATOR'S.** It read **`1f10d10`** throughout (it has moved since
  T-133's checkpoint, which read `209596b`, so it is somebody's live
  checkout and not an abandoned one). On no `task/` branch and named
  after no card, so **not a lane**; read with `git -C … rev-parse` and
  `git -C … status --porcelain` and nothing else, and left alone.
- `/private/tmp/t135d` — T-135's own drill checkout, present during
  T-133's integration and **gone before this one started.**

**EVERY FENCE IS FREE.** `crate-index` and `method/tasks/TASK-FORMAT.md`
are released by this merge; nothing is held by anything.

## Just completed

**T-135 HALF A — a Rust `mod` declaration is an edge, and dependents are
derived rather than stored.** F-06, milestone 4, **size L**, `touches:
[crate-index, method/tasks/TASK-FORMAT.md]` (only the first was used).
Main-before **`7331b87`**, lane tip **`c983a7d`** (derived with `git
rev-parse` — it is the **VERDICT** commit and not the lane's last work
commit `c6c7b1c`), merge **`9ae87a6`**, this checkpoint its direct child.
`builder: claude-opus-5`. **NO STAMP FIELD WAS WRITTEN AND THE CARD IS
NOT `done`** — see the second section of this file. Half A was built by
`claude-opus-5` (planning pass `5547f02`, build `7d386f0`, notes
`c6c7b1c`), verified by a second `claude-opus-5` session
`@T-135A-verify` (`c983a7d`), and integrated by a third that neither
wrote nor reviewed the lane's commits. **When the card is eventually
stamped, `review: same-model` is the honest label for Half A; Half B's
provenance is not yet written and must not be assumed from it.**

### **WHAT SHIPPED, IN TEN CODE PATHS AND SIX DOC PATHS**

- **`src/resolve/rust.rs`** (+305/−) — the `mod` pair resolution, and
  `cargo_target_roots` factored out of `RustWorld::build` so `arch blast`
  reads the SAME definition of root-ness rather than a second one.
- **`src/arch/blast.rs`** (+795, new) — the derivation.
- **`src/arch/cycles.rs`**, **`src/arch/registry.rs`**,
  **`src/arch/mod.rs`**, **`src/cli.rs`**, **`src/resolve/mod.rs`** — the
  narrowed disclosure, `touch_slugs:` finally read, the subcommand wiring.
- **`tests/golden.rs`**, **`tests/self_graph.rs`**,
  **`tests/fixtures/rust-workspace/expected-graph.json`** — the pins.
  **ONE golden fixture moves, not two**: `mixed/native.rs` declares no
  `mod` at all, contrary to the plan's §12.
- The card, four new suggestions, and `T-126-s3` gaining item 4.

### **THE VERIFIER'S EIGHT FINDINGS ARE ALL FIGURES, PLACEMENT OR ROUTING — NONE IS CODE**

**NO BEHAVIOURAL DEFECT WAS FOUND**, across eight poison arms with one
substitution each, `git diff` read back before every run, **sha256 5/5
restored and `git status` empty on every arm**, one arm killing exactly
one body in 512, and a positive control proving no arm was a compile
failure (`error[E…]`=1 with ZERO result lines). **Twelve of the lane's
thirteen corrections were confirmed independently, including that its own
RETRACTION was right** — all five of the plan's line references are exact
at `5547f02`, and the lane had measured them against its own already-edited
tree.

**THE ONE THE VERIFIER CORRECTED (F4): the plan's byte model was 1.0%
low, not 13%.** The lane's **4 917** measures a different quantity than
the plan's **~4 350** — it carries the growth of its own edited
`resolve/*.rs` entries in `files[]`, which a per-edge model never claimed
to cover. Isolated, the 27 edges cost **+4 394, 162.7 bytes per edge**.
**This integrator confirmed the +11 120 total and the 27+4+1 attribution
from `index --check`'s own delta output, and did NOT independently
reproduce the isolated +4 394** — that figure is the verdict's, taken on
its stated method.

**THE DISCLOSURE'S HONEST BOUNDARY, FOUND BY MUTATION AND WORTH A LINE
RATHER THAN A SILENCE.** Deleting the surviving path-expression half of
`arch cycles`' note **reds** (exit 101), so a future widening cannot pass
by deleting the survivor. But **negating the sentence while keeping every
asserted substring PASSES** — exit 0, 512 passed, nothing killed. That
refutes neither of the lane's claims; it is the residual limit of any
substring assertion over prose, and it is the kind of thing that only
gets written down if somebody looks for it.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 7331b87 c983a7d -> tree 48a97144…, exit 0 (read from $? FIRST)
    git diff --name-only 7331b87..9ae87a6   (THE MERGE'S DIFF)            ->  16   the only one that means anything
    git diff --name-only 7331b87...9ae87a6  (three dots AT the merge)     ->  16   collapses, as it must
    git diff --name-only 70b1d40..c983a7d   (merge-base..tip, FORBIDDEN)  ->  16
    git diff --name-only 7331b87..c983a7d   (two dots BEFORE the merge)   ->  28   ← the T-083 trap, live again
    git diff --name-only main..HEAD         (FORBIDDEN)                   ->   0   ← read this row twice

**THE T-083 TRAP IS LIVE AT THIS MERGE TOO, AND THE NUMBER IS DIFFERENT
FROM LAST NIGHT'S.** `c983a7d` is not a descendant of `7331b87`, so the
two-dot form returns the union of the lane's 16 paths and the reversal of
everything main gained since the merge-base — **28 paths**, including
`docs/STATE.md`, `docs/ROADMAP.md` and every `tools/e2e` file T-133
landed. T-133's checkpoint measured **39** for the same shape; the figure
is a function of how far main moved, not a constant, which is the second
reason not to quote it. **The correct PRE-merge form is the merge-base**,
and it agreed with the three-dot form here.

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0.** `merge-tree
--write-tree 7331b87 c983a7d` exits **0** and returns `48a97144`. No
conflict, no resolution, nothing written into the merge commit; parents
are `7331b87` and `c983a7d` and nothing else.

**FENCE DISJOINTNESS IS VACUOUS AT THIS MERGE AND IS STATED AS THAT
RATHER THAN AS A PROOF.** `git worktree list --porcelain | awk
'/^branch refs\/heads\/task\//'` returns **exactly one** entry —
`task/T-135-blast-radius-ceremony`, this merge's own lane. There is no
other lane's path set to intersect with, so the intersection is empty by
the emptiness of the OTHER-LANE SET and not by any comparison of paths.
**That is a weaker statement than a `comm -12` and it is said in the
weaker form on purpose**, because a checkpoint that reports "disjoint"
without saying which two sets it compared is the shape that hid a false
five-path intersection at T-133's merge.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `7331b87` when the range
was derived and `7331b87` in the same command as the merge, read beside
the two diff checks. `git diff --cached --name-only` and `git diff
--name-only` were both EMPTY there, with one `??` row; **`??` alone is
not a ceremony.**

## THREE standing gates — all three FIRE, all derived from the merge's own 16 paths

| gate | trigger | on these 16 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **9 — FIRES** | **ASKED FOUR TIMES**: STALE → regen → **STALE AGAIN** → regen → CURRENT → CURRENT |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **10 — FIRES** | exit **0** on scratch port 15772, both `[nputer]` lines |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, **THREE** suites named, all green |

- **GRAPH REGEN — the graph IS regenerated and IS committed here**, at
  **955 710 bytes · 181 files · 2038 symbols · 1943 edges**, from
  944 590 · 180 · 2018 · 1911. `index --check` printed `files +1 -0 ~8`
  and the nine paths it names are exactly this merge's nine `.rs` paths,
  one for one — no foreign staleness rode along. **The second ask is the
  interesting one and has its own section above.**
- **DOCS GATE — exit 1, FIRES on 6 of 16 (7 with the graph), THREE
  suites**: `npm test` from `app/`, `npm test` from `tools/e2e/`, `npx
  vitest run` from `lib/parser/`. Invoked DIRECTLY from the repo root
  with the RANGE RULE's own path list **plus `docs/architecture/graph.json`
  and the two reconciled fixtures**, never through `xargs`, exit read from
  `$?` on an unpiped command. **14 derived docs readers across 4 suites**,
  census **131 sites in 22 files**, **0 frontmatter issues**, **6
  root-anchored files all argued, 0 unlinked**.
- **`cargo test` IS A FOURTH SUITE THE GATE STILL CANNOT NAME** —
  `T-132-s2`, unchanged. No path in this merge is `include_str!`'d, so
  the gap cost nothing here. It was run anyway. **AND THE `method/` HALF
  OF THAT GAP IS WHAT HALF B WILL WALK INTO**: `TASK-FORMAT.md` is one of
  fourteen `method/` files compiled into the binary, and `method/` is not
  `docs/`, so the gate will not name `cargo test` for Half B's own edit.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 512 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 5.25s**.
  **THE HEADER CHECK WAS DONE AND IT RECONCILES EXACTLY**: 16 `running N
  tests` headers sum to **515 = 512 + 3 ignored**. There is no gap
  between the headers and the result lines and there never was — a brief
  that phrases it as *"515 against 512 + 3"* invites a reader to hunt for
  a three-body discrepancy that is the ignored count. **512 is up 18 from
  T-133's 494**, all of them this card's.
- **parser: 268/268 across 12 files, exit 0** — TWICE, after `npm run
  build` from `lib/parser/`, which was run FIRST regardless.
- **app: `npm run build` exit 0** · **`npm test` FOUR runs, and the first
  two are the finding**: **9 failed / 964** with the regenerated graph and
  the old fixtures, **1 failed / 972** after the first reconciliation pass
  (the hidden tenth assertion), then **973/973** and **973/973 again**
  after the second regeneration. The last is the one that governs.
- **E2E: 194/194, exit 0, 2.0m**, on explicit port **15771**. **AND THE
  HEADER WAS CROSS-CHECKED AGAINST THE BODY COUNT**: `Running 194 tests
  using 1 worker` against 194 `✓` bodies and a highest body number of
  194. **Playwright DOES print the header** — this is the third
  independent confirmation of a claim two integrator briefs got wrong.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root`
  `ok`, `a_hostile_session_id_in_the_init_line…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`. **And the card's own new live pin**,
  `a_mod_declaration_is_an_edge_in_this_repositorys_own_graph`, `ok`.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY**: `arch cycles
  --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle C-08 ->
  C-09 -> C-08`, `components=13 declared_edges=35`, report on **stderr**
  at **645 bytes** with stdout **0 bytes**. **`arch cycles > out.txt` on
  a red yields an EMPTY FILE**, and reading its exit through `| head`
  yields head's 0. **Its disclosure is NARROWED by this merge and now
  names both halves** — the `mod` half fixed by card id, the surviving
  path-expression half by finding id.
- **`npm run lint:docs` exit 0** and **`npm run lint:tokens` exit 0** at
  **TOKEN 138 / CONTROL 773** — **AND BOTH LIVE IN `tools/e2e/package.json`,
  WHICH THIS FILE HAS NEVER SAID.** Run from the repository root they exit
  **254** with `npm error enoent`, because **there is no root
  `package.json` at all**; that reads exactly like a failing lint to a
  hurried reader, and it cost this integrator a minute. **DERIVE THE
  CONTROL FIGURE AT YOUR OWN REF** — 767 at T-133's checkpoint and **773**
  here, +6 for `T-132-s6`'s card, `blast.rs` and the four T-135
  suggestions. `git ls-files` reads **791**.
- **`npm run typecheck` from `tools/e2e` exit 0**, **from `lib/parser`
  exit 0**, and **from `app/` exit 1 `Missing script`** — the last run
  deliberately, to re-derive the trap rather than quote it.
- **RUN LEDGER — every run declared, including the ones that agree.**
  cargo **once** (512/0/3); parser build **once**, suite **twice**; app
  build **once**, `npm test` **four times** (9/964 · 972/973 · 973/973 ·
  973/973); `tools/e2e` **once** (194/194) on port 15771; BOOT GATE
  **once** on port 15772; DOCS GATE **twice** (the merge's paths plus the
  graph and fixtures; then `--census`); `index --check` **FOUR asks**,
  `index --root ../..` **two writes**, all from `app/src-tauri/`; `arch`
  and `arch drift` **once each**; `arch cycles` **once**. **THE SUITES
  THIS FILE'S OWN LAST WRITE OWES ARE DECLARED IN THIS CHECKPOINT'S
  COMMIT MESSAGE**, which is where the regress terminates — a commit
  message is not a code input. **What may never be done is stopping
  because the loop is tiresome, or writing a run's result before running
  it.**

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS EIGHTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **4.0 GB** here, up from T-133's
3.7 GB — **this merge recompiles the crate, which is why** — and the lib
suite is **5.25s** against T-133's 5.05s. **TWENTY-SIX runs across
seventeen integrations and not one lands between 9.5s and 14.6s.** Read
the lib suite's own time first; it tells you which regime you are in
before any assertion does.

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
intervention addresses.* Pooled clean-cache evidence is **1 red in 21**.
It did NOT fire at this merge — read by NAME, `ok`. `T-086-s1` and
`T-102-s3`; fence `[app-agent]`, **FREE**.

## THE MTIME INTERMITTENT — SIX CONSECUTIVE GREENS ON FIXED CODE, AND STILL NOT PROOF

`T-120-s3`'s fractional-millisecond mtime signature (`token-scan.spec.ts`,
`Expected …492.7957` against `Received …493`) was fixed on main at
**`cea839e`** (T-130). The nine-run tally on code that **cannot** carry
that fix was **3 red in 9 — near one in three**. **A red before `cea839e`
is not news; a red at or after it is.** This merge ran e2e once more, 194/194,
and it fired in neither that run nor the five before it — **six
consecutive clean runs on fixed code.** That is evidence accumulating and
it is still not proof: a green was never evidence, in either direction.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** `lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT. The
app resolves `@nputer/parser` through a symlink, so it compiles against
PRE-merge types and fails with e.g. `TS2339` while `vitest` transpiles
without typechecking and the dogfood fixtures red in a way that looks
exactly like an un-reconciled fixture. **One command clears it**: `npm run
build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT IS A
MERGE THAT CHANGES THE PARSER'S TYPES** — CONVENTIONS files the
parser-before-app ORDER under *fresh clone*, so a fully-installed main
checkout reads as exempt and is not. **This merge's parser diff is EMPTY**
— its sixteen paths are ten Rust and six markdown — so the trap did not
fire; the build was run first anyway, in that order, and every exit was 0.
**AND THIS MERGE IS THE ONE WHERE THAT MATTERED**, because the dogfood
fixtures DID red — for the graph, not for the parser — and a hand that had
skipped the parser build would have had two candidate causes for one set
of messages.

**AND THE SEPARATE UNBUILT-APP CLASS IS THE ONE THAT ARRIVES LOOKING LIKE
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns **14 failed
of 973 across six files**, every message about an absent
`app/dist/assets` rather than about the tree. **Both CONVENTIONS bullets
that state it carry a stale denominator, and the file NAMES ITS OWN
CONTRADICTION**: `:856` says *"12 of 840 across five files"*, `:1328` says
*"14 failures across 6 files … 924/924"*, `:1327` says *"SIX files since
T-013 … where the LANE PROTOCOL bullet below still says five"*, and the
suite is **973**. `git diff 7331b87..9ae87a6 -- docs/CONVENTIONS.md` is
**EMPTY**, so all of it was exactly as false one commit ago: ruling
thirteen returns **FILE**, and the seat is `T-092`/`T-093`.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**: `npm run typecheck`
from `app/` exits **1** with `Missing script`. **The app's typecheck is
the TWO `tsc` calls inside `npm run build`** — `tsc && tsc -p
tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap.

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT

**`T-132-s6`, filed hours before this merge after two lanes obeying rule 4
perfectly still collided.** `resolveLanePort()`'s default **14520** is a
CONSTANT shared by every checkout on the machine, so rule 4's
checkout-granular partition does not reach it. **The remedy in practice:
pass an explicit port and re-probe immediately before binding**, which is
what this integration did — 15771 for e2e and 15772 for the boot gate,
both `lsof`-read at **zero rows** at 03:03:47 and 03:03:55 EEST, e2e read
back at **zero rows** at 03:06:12. **No collision, and a probe reserves
nothing — the runner's own bind is what proves the port was free.**
`resolveLanePort()` THROWS on 1420 by construction, which is a defence in
the tree rather than a habit in a session.

## `T-133-s5` — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green at 33, because the shell renders the
project path and the chrome wraps. **The threshold is bracketed between
116 and 128 characters** — at 116 it measures 252 px against a 250 px
floor at 800×600, TWO PIXELS of margin. **Cut drill and scratch worktrees
at SHORT roots.** This integrator cut none, so nothing here re-measures it.

## The board, derived from disk at this checkpoint

**297 flat task files — 98 done / 35 planned / 41 parked / 122 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
98 + 35 + 41 + 122 + 0 + 1 = 297. **`done` DOES NOT MOVE AT THIS MERGE**
— it holds at 98, because T-135 is not stamped `done` and will not be
until Half B lands. **The one `building` is `T-135`, and it has no lane**;
that is the second section of this file. The file count is up **five**
from T-133's 292 — **four** suggestions with this merge and **one**
(`T-132-s6`) that arrived on main in its own commit afterwards.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWENTY-TWO AND WANTS AN
ELEVENTH TRIAGE.** `T-135-s1`…`s4` came in with the merge and none is
triaged, because disposition belongs to a triage pass and not to an
integrator (T-083's ruling), so they stay `status: suggested` exactly as
filed. `T-126-s3` gained an **item 4** rather than a new card, which is
the right shape and which is also why its "fifth D1" error is now sitting
in a card that a triage will read.

## Documents ticked

- **STATE — rewritten, as a snapshot.** `T-133-s2`'s edit (dropping the
  four sections `brief.mjs --state` can answer) was **NOT performed**:
  `docs/STATE.md` is free, but that edit is a card of its own and taking
  it inside a checkpoint would bundle a routed change with a merge.
- **The card** is **NOT stamped `done`** and **no frontmatter line moved
  at all**. It gains an `## Integration — HALF A ONLY` section, and **the
  lane's own text, the planning pass and the verdict are preserved
  byte-untouched** — including the sentence the lane deliberately left
  standing above its own retraction.
- **ROADMAP — TICKED on the census line, NOT on progress.** The
  milestone-4 census was **re-derived on disk rather than carried**:
  **96** cards carry `milestone: 4` — F-01 9, F-02 43, F-03 12, F-04 7,
  F-06 25 — every figure identical to T-133's. **SIXTH CONSECUTIVE MERGE
  WHERE THE F-04 PROGRESS LINE DOES NOT MOVE**, and the fifth distinct
  reason: this is the first one where the card was not stamped `done` at
  all.
- **ARCHITECTURE — UPDATED, and it is the first checkpoint in three where
  rule 3's *"if any interface moved"* answers YES.** C-07's row gains
  `arch blast`, the `mod`-edge coverage change and its ruling, the
  revealed `C-05 -> C-15`, the TS floor-rule gap, and the byte-budget
  entry: **955 710 bytes — 95.57%, 44 290 bytes of headroom**, spending
  **11 120** — the largest single spend in this series and the first that
  is mostly EDGES rather than a file. C-07 goes 34 → **35**. **C-05's
  `Depends on` column was NOT changed**: declaring C-15 is the routed
  repair, not this checkpoint's.
- **CONVENTIONS — NOT TOUCHED.** Its two stale unbuilt-app denominators
  are FILED and not repaired (section above), and `arch blast` joins
  `arch cycles` in the queue at `T-127-s5`.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. **ADR-018 IS OWED AND IS HALF B'S** — planning
  pass §10 specifies its four sections and §11 notes the fence cannot
  reach `docs/decisions/` yet. Writing it here would be taking Half B's
  work without Half B's @human look.
- **`graph.json` REGENERATED and COMMITTED HERE**, in the checkpoint and
  not the merge, with the fixture reconciliation in the same commit.

## Provenance — SELF-DECLARED, never read off a trailer

**98 done cards — 73 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 73 + 19 + 5 + 1 = 98. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented** — and this merge adds none of them,
because it stamps no card `done`. **The `Co-Authored-By` trailer on this
lane's commits is a harness constant and is NOT evidence of a model** —
T-085 proved it and T-101 sharpened it.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT A
SECOND TIME.** **ZERO of this merge's sixteen paths are under
`app/src/**`**; ten are under `app/src-tauri/**`, which is the Tauri
crate and not the vite-served front end, and this checkpoint additionally
writes two files under `app/test/**`. **"MY DIFF IS DOCS-ONLY" IS
EXPLICITLY NOT THE ANSWER TO THE DEPENDENCY QUESTION** (integrator.md
rule 2), so it was answered from the build order instead: this
integration DID rebuild `lib/parser/dist` and DID write `app/dist`, and
both land in `/Users/ujju/Projects/nputer`. The vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd — **@human's own
checkout, eight merges behind** — and `app/node_modules/@nputer/parser`
there is a **RELATIVE** symlink, so it resolves inside that checkout with
its own `lib/parser/dist`. **The running product reads none of what this
integration wrote.**

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a fact
of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this merge's four new suggestion cards and
this checkpoint's regenerated `graph.json` reached the running board
through the watcher** — and the graph is the more interesting half,
because the map pane would re-render with C-05 lit and a 37th relation
row. That is an INTERRUPTION channel (a re-render), never a breakage one,
and no integrator can read which folder is open without touching the app.

**Port 1420 was read with `lsof -nP -iTCP:1420` and nothing else** — no
bind, no connect, no signal. Holder `node` pid **88948**, `TCP
[::1]:1420 (LISTEN)` plus one ESTABLISHED pair with a `com.apple` client
pid 53420, read at **02:54:56 EEST** (before any command that writes),
again at **03:03:47** and again at **03:11:37 EEST** after the suites,
the gates and the doc writes. **Every reading identical, same pid.** The
anchored process read — `ps -o pid,lstart,command -p 88948` — reports
`node /Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started
**Tue Aug 25 10:54:32 2026**, unchanged throughout, and `lsof -a -p 88948
-d cwd` reports cwd `/Users/ujju/Projects/nputer-app/app`. **A pid, a port
holder and a start time are live-environment facts, not functions of a
tree**, and all three are already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT
IS**: `app/node_modules`, `lib/parser/node_modules`,
`tools/e2e/node_modules`, both `dist/` directories and `target/` were
checked and all six were present, so **no fresh dependency install was
owed and no `npm ci` was run**. **There is no root `node_modules` and
there is no root `package.json`** — see the lint bullet above. **The
repair is still item 9 below, unwritten after SIXTEEN consecutive merges
performed it by hand.**

**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-eighth** checkpoint running — not this integrator's, not
this merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test` run and its **nine** `nputer-index`
invocations all WROTE to main's `app/src-tauri/target/`, which reads
**4.0 GB**, as any cargo run must. **The ONLY sibling worktree modified
was T-135's own, and only by removing it** — `../nputer-app` and
`../arch-verify` were read with `git -C … rev-parse` and
`git -C … status --porcelain` and `lsof` only. **All scratch work for this
integration lives outside the repository**, at a session scratch root, and
**no worktree was cut at all.** No path was staged by wildcard; **`git add
-A` was never used**, and every write used `git commit -- <paths>`.

## In progress / broken right now

**NOTHING IS BROKEN. THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED. THE ONE
`building` CARD IS OPEN ON PURPOSE AND HAS NO LANE.**

**ZERO LANES HOLD A FENCE.** Every fence in this project is free. Read
`git worktree list` — or run `brief.mjs --state`, which stamps the reading
with a clock — rather than any table here.

## Next up

1. **HALF B OF `T-135`, AND ITS THREE PRECONDITIONS.** (a) **@human's
   look at §6 and §7** — the card exists to put that judgement in front
   of you, and §6's own measurement is the argument against binding now:
   the rule is a **constant function** on the live board, 35 of 35
   planned and 92 of 97 done cards on the top rung, because **0 of 216
   `touches:` entries has ever named a code path inside the walk**. The
   recommendation in the pass is ADVISORY now, BINDING when a re-derivation
   shows the middle rung non-empty — a measurement, not a date, and one
   command. (b) **The architect widens the fence to include
   `docs/decisions/`**; a lane cannot do it (§11). (c) **The TS half of
   §7's floor rule** — see the blocker section above.
2. **`docs/CONVENTIONS.md` IS FREE AND TEN EDITS ARE QUEUED AT ITS SEAT,
   ACROSS FOUR BULLETS** — `T-104-s5` carries the argument. **THE COMMAND
   LIST — three edits now**: `T-127-s5` (`arch cycles` undocumented, and
   **now `arch blast` too**) and `T-133-s1` (`brief.mjs`). **THE RANGE
   RULE BULLET — three edits, to `T-093`**, plus T-133's fourth candidate
   and **this merge's fifth**: the pre-merge two-dot form gave **28** here
   against T-133's **39**, so the trap's magnitude is a function of how
   far main has moved. **THE POISON DRILL BULLET — four edits, to
   `T-092`**, plus `T-133-s4`'s marker. **AND THE TWO STALE UNBUILT-APP
   DENOMINATORS** (840 at `:856`, 924 at `:1328`, against 973 on disk).
3. **`T-135-s3`'s GENERAL FINDING IS UNFIXED AND IT IS CHEAP.** A
   sentence in the GRAPH REGEN bullet naming the DOCS GATE as owed on the
   checkpoint's OWN graph commit. **This checkpoint did it by hand and it
   worked** — the gate named `tools/e2e` as a `graph.json` reader, which
   the card itself does not. Same seat as item 2.
4. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still returns
   **zero rows**, re-checked at this ref, for the seventh checkpoint
   running. **`method/` is now entirely free**, so this is takeable, and
   it has three cases in the record: T-132's exit-1 conflict, T-133's and
   this merge's exit-0 collapses.
5. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
   EXIST.** Unchanged. Its option (1) — write the rule in
   `lane-protocol.md` rule 4 — is preferred, and **its fence is free**.
   The positive control it asks for is the load-bearing part.
6. **`T-126-s3` — FIVE WRITTEN STATEMENTS ABOUT C-15 ARE NOW FALSE ON
   MAIN**, four of them for five checkpoints and **one of them added by
   this merge's own routing**: item 4 says *"fifth D1"* where `arch drift`
   reports the second D1 and the fourth finding. **Nothing reds.** The
   card also now carries the live `C-05 -> C-15` declaration, which is
   the one-line registry fix this merge deliberately did not make. Fence
   `[app-dispatch, docs/architecture/components/]`, both FREE, and **no
   lane holds its file any more.** Item 3 IS `T-110-s9`, so **one lane
   should take all of it.**
7. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
   PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the
   `app/test/**` fixtures) and `lib-parser` if a component ID moves.
   **Both FREE.** It ships with the measured cost (6 of 973), the
   recommended four-node partition and the reason a smaller one is wrong.
8. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING.** A
   word for C-10 frees 2 of 8 fences outright and makes 2 more honest.
   **`T-127-s4` is its warning label**: a `touch_slugs:` edit is invisible
   to every suite in this repository — **and this merge widens that
   surface**, because `arch::registry` now READS `touch_slugs:` with the
   same strictness `depends_on:` gets, so a malformed one refuses three
   subcommands where yesterday it refused none. All thirteen component
   files carry the inline-list form today; that was measured first.
9. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — SIXTEENTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step —
   `lsof -a -p <pid> -d cwd` for the holder's cwd, compared against the
   checkout you are installing into** — and this integration is a worked
   example again: the cwd read said `/Users/ujju/Projects/nputer-app/app`,
   so an install here would have been provably safe, and nothing in the
   tree says that. Fence `[docs/CONVENTIONS.md]`, **FREE**.
10. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64 — a false sentence,
    never a false verdict; (b) the live positive control is brittle to a
    shared closing hop. Fence `[crate-index]`, **FREE with this merge.**
11. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, **FREE**.
12. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its conflict
    rests on is not in `method/`. **The two are one card**, and **both
    halves are free now** — `roles/` and `tasks/TASK-FORMAT.md`.
    **`T-135-s4` BELONGS BESIDE THEM**: it is the same file's step 6, and
    the three are one seat's worth of work on how a fence and a status
    behave when a card is only half-dispatched.
13. **`T-135-s1` and `T-135-s2` — THE TWO GRAPH CARDS THIS MERGE FILES.**
    s1: a cross-package FILE-level blast radius is not computable from
    today's graph; ignore the seam and all 25 `lib/parser` files read 0
    dependents, attribute it to every file and each reads ~28. s2: a
    distinct `mod` edge kind needs `GRAPH_EDGE_KINDS` widened in
    `app-map` first. Both untriaged.
14. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, threshold bracketed 116–128 characters, two-pixel margin at
    800×600. The fix is in `app/src` (`app-shell`, FREE). **Until it
    lands, every drill and scratch worktree must be cut at a short root.**
15. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — `T-134`'s subject arriving early. Both FREE.
16. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-21.** Two findings, one body, `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence. **AND THE FOURTH INTERMITTENT** —
    `T-120-s3`'s mtime signature, now six consecutive greens on fixed
    code — is `[tools/e2e]`, **FREE**.
17. **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class; `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, FREE). **`T-129-s2`**, **`T-129-s3`**,
    **`T-129-s5`** are `crate-index`, **FREE with this merge**, and should
    be read beside item 10 — same file's neighbourhood, and `blast.rs` is
    new company for them.
18. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**. Measured: **exit 0 as `.rs`, exit 134 as
    `.ts`**, and TS `namespace` chains abort at **2 000** against Rust's
    tightest **3 000**, so **TypeScript is the MORE exposed language.**
19. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals; the
    C-09 → C-08 direction has THREE closing edges and the card names two.
20. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
21. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND TWENTY-TWO AND WANTS AN
    ELEVENTH TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-129-s1`…`s5`,
    `T-130-s1`…`s2`, `T-127-s1`…`s5`, `T-132-s1`…`s6`, `T-133-s1`…`s5`
    and now `T-135-s1`…`s4` are untriaged. **`T-130-s1`'s OWN ROUTING LINE
    IS STILL STALE** — it says `docs/CONVENTIONS.md` is *"held by T-104"*;
    `T-104` is `done` and the seat is `T-092`.
22. **THE BOARD-TRUTH RULING** — TWENTIETH ask. **A PATTERN COUNT IN THE
    FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column still
    closes at the first push, and `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief in this thread has contained at
least one error, and saying so is the most valuable thing a checkpoint
returns.** This brief's central instruction was a reading list — *`git
show c983a7d`, then `git show 5547f02`, then the notes commit, because a
summarised finding loses the findings inside it* — **and that instruction
is the reason this checkpoint has anything worth reading in it.** The
nine-versus-six, the three unmoving reds, the D1's provenance and the
disclosure's honest boundary all live in those three commits and not one
of them survives compression. Sorted into the four categories the brief
asked for.

1. **FACTS — EVERY LOAD-BEARING ONE HELD, AND THE CENTRAL ONE WAS
   UNDERSTATED RATHER THAN WRONG.** *"`T-135-s3` reproduces in DIRECTION
   but not in MAGNITUDE, and following it to the letter still ships three
   reds"*: **confirmed independently at 9 failed / 964 passed**, 4 and 5,
   with all three extra messages verbatim. But the brief's *"three extra
   reds"* counts failing BODIES; **there were TEN red assertions**, and
   the tenth was invisible until the ninth was fixed, in the same body.
   **The brief's number was right and its unit was the wrong one to plan
   a repair against.** Also confirmed: the lane tip is a VERDICT commit;
   `graph.json` uncommitted and byte-identical (sha256, against the
   lane's own copy); +32 = 27 + 4 + 1 purely additive; the D1 real since
   T-126 and `T-126-s3` calling it the fifth when it is the second;
   `arch cycles` exit 1 with stdout empty; **Playwright DOES print
   `Running N tests`**; `status:` closed; ports machine-wide.
2. **ONE FACT IMPRECISE, AND IT IS THE ONE A DRILL WOULD HAVE RELIED
   ON.** *"`.vtarget` is **not** ignored (I verified both;
   `app/src-tauri/.gitignore:3` is an anchored `/target/`)."* Both halves
   are true — `git check-ignore -v .vtarget/` exits **1**, and that file's
   line 3 IS `/target/` — **but the anchored rule is not the one that
   protects a drill's target directory.** A `CARGO_TARGET_DIR` at a
   scratch worktree's ROOT is caught by the **unanchored `target/` at the
   repository `.gitignore:4`**, which is what `git check-ignore -v
   target/` actually reports. The brief cites the rule that would NOT
   have protected the drill. Same correction the verdict made about
   itself; re-derived here rather than carried.
3. **ONE FRAMING THAT INVITES A HUNT FOR A DEFECT THAT DOES NOT EXIST.**
   *"Derive cargo counts against the `running N tests` headers; the lane
   reports 16 headers summing 515 **against** 512 + 3."* **512 + 3 = 515
   exactly.** There is no discrepancy and there never was — the headers
   count ignored bodies and the result lines report them separately. The
   discipline the brief is protecting is right and load-bearing (a
   SIGABRT prints no result line at all), but *"against"* reads as a
   three-body gap. Measured here: 16 headers, 515; 16 result lines,
   512/0/3.
4. **ONE OMISSION THAT COST A MINUTE AND READS EXACTLY LIKE A RED.**
   Neither the brief nor this file's previous revision says **where
   `npm run lint:docs` and `lint:tokens` live.** They are in
   `tools/e2e/package.json`. **There is no root `package.json`**, so from
   the repository root both exit **254** with `npm error enoent`. Now
   written down.
5. **ARGUMENTS — ALL SOUND, AND THE BEST ONE WAS ABOUT MY OWN
   CHECKPOINT.** *"Your checkpoint must say plainly that this card is
   merged-but-open, or the next reader will treat a `building` card with
   no live lane as a lapsed stamp"*: correct, and it is the second
   section of this file for exactly that reason. *"Repair what the merge
   introduces; file what it merely reveals"*: correct, and the parent
   test answered the `C-05 -> C-15` question in one command. *"Ask GRAPH
   REGEN, never predict it, and ask again after any write — your pass
   writes fixtures"*: **correct and load-bearing; the second ask is the
   only reason the committed graph is current**, and it is the first time
   in this series the trap has fired.
6. **PREDICTIONS — EVERY ONE FIRED.** `arch cycles` exit 1 on stderr;
   `npm run typecheck` from `app/` missing; build `lib/parser` first;
   pass an explicit port and re-probe (no collision, 15771 and 15772 both
   zero rows before and after); cut nothing deep (nothing was cut at
   all). **The two the brief told me to derive rather than take — the
   fixture reconciliation and CONVENTIONS' unbuilt-app figure — are the
   two where taking the brief's number would have been wrong**, which is
   the format working as designed.
7. **STALENESS — NONE, AND THE REASON IS WORTH ONE LINE.** T-133's
   checkpoint recorded that a hand-read lane list has a shelf life of
   minutes. This integration had **one** lane and it was its own, so
   there was nothing to go stale — the first integration in the record
   where the lane list could not move under it, and the last one for
   which that will be true by accident rather than by measurement.
