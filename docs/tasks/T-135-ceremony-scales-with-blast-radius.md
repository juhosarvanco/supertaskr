---
id: T-135
title: Ceremony scales with how many things depend on what a card touches, not with S/M/L — adopted by @human, and the graph cannot yet answer the question it now has to answer
feature: F-06
milestone: 4
priority: 7
size: L
status: building
blocked_by: []
touches: [crate-index, method/tasks/TASK-FORMAT.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Size L: planning pass COMPLETE (below, §0–§12) — drafted 2026-08-26, awaiting
architect ratification of §11's frontmatter amendment and **@human's look at
§6 and §7**, which is the look this card's Verification section asks for.

**@human adopted this on 2026-08-25** as item 5 of `T-131`'s five process
changes, **having been shown the architect's objection to it and chosen it
anyway.** The objection is recorded below because it is now a risk to
manage rather than a reason to decline, and a card that hides the argument
against itself is worse than one that never had it.

## The ruling

**Card size is a proxy for risk and a poor one.** `T-126` was size S and
was the difference between a feature existing and not existing — a lane
reader rejected twice, waived once by @human, rebuilt by two executors and
approved on a third pass, compiled into nothing because no module declared
it. Meanwhile the same session spent ~930 000 tokens on a full three-hand
ceremony for cards whose blast radius was a single unimported file.

**A card touching a file nothing imports is cheap to get wrong. A card
touching a file twelve things import is not.** nputer already computes the
thing that predicts this — the architecture map knows every file's
dependents — and does not use it. Ceremony keyed to that number spends the
expensive rungs where they earn.

## THE ARCHITECT'S RECORDED OBJECTION

Stated at the ruling and preserved verbatim in substance: **this rests on
one session, five merges, and one unusually introspective repository.** It
would change how every card in the project is dispatched. It is the most
valuable of the five if true and the least evidenced of the five as
measured.

**@human ruled to adopt with that in view.** The objection therefore
becomes this card's obligation: **the ADR SHALL argue the decision with a
measurement rather than record it as a preference**, and the rollout SHALL
be reversible.

## THE PREREQUISITE, AND IT IS NOT SMALL

**The graph cannot answer the question this ruling asks of it.**

- **`T-126-s4`, verified three independent ways during this session**: the
  indexer records `use` imports only, so a **`mod` declaration plus a path
  expression — the strongest dependency Rust has — produces ZERO edges.**
  `lib.rs` gained a real dependency on the dispatch component and the
  edge count did not move.
- **`T-010-s6`**: the Rust resolver emits **no `call` and no `type_ref`
  edges at all**, and states the omission in its own source.
- **There is no dependents view.** The graph is walked forward; nothing
  reverses it.

**So a blast-radius number computed against today's graph would
under-count Rust dependencies badly, and would do so silently** — the
number would look authoritative and be wrong in the direction that
matters, marking risky cards cheap. **Shipping the ceremony rule before
the graph can answer it would be worse than not shipping it**, because a
wrong number carries more authority than no number.

## Acceptance criteria

- **THE GRAPH SHALL RECORD `mod` DECLARATIONS AS EDGES**, and a pin SHALL
  show it does. **The pin SHALL fail against the pre-fix tree** — today
  `lib.rs`'s dependency on the dispatch module produces no edge, which is
  the whole finding (`T-080-s1`).
- **THE RUST EDGE COVERAGE SHALL BE ENUMERATED AND RULED ON, NOT
  SILENTLY WIDENED.** Say which edge kinds Rust emits after this card and
  which it still does not, and whether each omission is safe for a
  blast-radius count. **`T-010-s6` is the standing record of the gap** and
  SHALL be cited rather than rediscovered.
- **DEPENDENTS SHALL BE DERIVED, NOT STORED.** A reverse index that can
  disagree with the forward one is two implementations of the same fact
  (T-057). IF materialising it is necessary for cost THEN the derivation
  SHALL be the pin.
- **THE CEREMONY RULE SHALL NAME ITS THRESHOLDS AND SHALL JUSTIFY THEM
  FROM MEASURED DISTRIBUTION**, not from taste. Compute the dependent
  count for every component and every file the board's planned cards
  touch, state the distribution, and put the rungs where the data
  separates rather than at round numbers.
- **THE RULE SHALL DEGRADE SAFELY WHEN THE NUMBER IS UNKNOWN.** A card
  touching a path the graph does not cover — anything outside the walk,
  `docs/`, `method/`, `tools/` — SHALL get the HIGHER ceremony, never the
  lower. **An unmeasured blast radius is not a small one.**
- **AN ADR SHALL ARGUE THE DECISION WITH A MEASUREMENT.** @human's ruling
  is the authority; the ADR is the reasoning, and it SHALL include the
  architect's recorded objection and what would falsify the change.
- **THE ROLLOUT SHALL BE REVERSIBLE AND SHALL SAY HOW.** IF the rule
  misclassifies a card in practice THEN there SHALL be a stated way to
  override it per-card with a reason recorded, so a bad threshold costs a
  sentence rather than a re-ruling.
- **S/M/L SHALL NOT SIMPLY BE DELETED.** It carries planning information
  (how long the work is) that blast radius does not. Say what each field
  now means, or the two will drift into meaning the same thing badly.

Verification: headless — bare `cargo test --no-fail-fast` from
`app/src-tauri`, exit read **unpiped from `$?`**, the total **SUMMED from
the `test result:` lines and cross-checked against the `running N tests`
headers** — a mutant this session produced an ordinary-looking
`465 passed / 1 failed` while three bodies had vanished into an abort that
printed no result line at all. **`graph.json` SHALL be regenerated and its
movement stated**, and since this card deliberately adds edges, **the
byte/symbol/edge deltas are the deliverable rather than a side effect**.
**Ask GRAPH REGEN, never predict it, and ask AGAIN after any write** — a
regeneration has twice left every headline figure identical while the file
changed. **POISON DRILL on every new assertion**, producer mutated and
never the assertion, in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it, **OUTSIDE the repository** — and note the
pollution **outlives the mutants**: a stale binary in a drill's target
directory produced a plausible and entirely false defect report this
session. **Uniqueness of kill SHALL be measured against the whole suite.**
**This is an L card and owes a planning pass before any code.** @human:
one look at the final thresholds, because where the rungs sit is a
judgement about how much this project is willing to pay for safety.

## Implementation plan (size-L planning pass — planner session claude-opus-5, 2026-08-26)

Drafted read-only in lane `task/T-135-blast-radius-ceremony` at base `70b1d40`.
**No production code, no test bodies, no frontmatter line was written by this
pass.** The architect reviews this section, applies the frontmatter amendment in
§11, and commits; **@human's look is owed at §6 and §7 before the rule binds
anything.** Every figure below was derived at `70b1d40` with the command shown;
none is transcribed from another document, and none may be quoted at a later ref
(TASK-FORMAT.md: a count in a criterion is a line number by another name).

### 0. The census, asked and not predicted

    cd app/src-tauri && cargo run -q -p nputer-index -- index --check --root ../..
    -> exit 0, "graph.json is CURRENT ... 944590 bytes, 180 files, 2018 symbols, 1911 edges"

So every number below is measured against a graph that is current at this ref.
**The edge census, by kind and by the language of the edge's source:**

| language | files | symbols | LOC | `import` | `call` | `type_ref` | total |
|---|---|---|---|---|---|---|---|
| TypeScript | 128 | 1 174 | 48 928 | 508 (296 file→file, 159 npm, 53 node) | 552 | 704 | **1 764** |
| Rust | 52 | 844 | 36 657 | 147 (86 file→file, 61 cargo) | **0** | **0** | **147** |

**The asymmetry is the whole prerequisite.** Rust carries 29% of the walked
files and 43% of the symbols and produces **7.7% of the edges** — 0.174 edges
per symbol against TypeScript's 1.50, a **8.6x** gap. Every `call` and every
`type_ref` edge in this repository is TypeScript, symbol→symbol; `T-010-s6` is
the standing record and `resolve/rust.rs`'s module doc states it in the source
("no `call` or `type_ref` edges are emitted for Rust").

### 1. What the under-count actually costs, measured rather than argued

`T-126-s4` reproduces exactly at this ref. `app/src-tauri/src/lib.rs` has **four**
outbound edges — `agent/mod.rs`, `churn.rs`, `docs_watch.rs`, `index_cmd.rs` —
and **none to `dispatch/`**, though `lib.rs` declares `pub mod dispatch;`.
`app/src-tauri/src/dispatch/mod.rs` is an **isolated node**: zero edges in either
direction. **The file whose absence made a whole component compile into nothing
is the file the graph rates at zero.**

It is not one file. Resolving every non-inline `mod` declaration in the walked
Rust set against the same rule `resolve/rust.rs::build_module_tree` already uses
yields **44 (declaring file → target file) pairs, of which 17 already carry a
`use` edge and 27 do not.** Those 27 rescue **nine core Rust files that read
exactly zero dependents today**:

    extract/ts.rs (1 199 lines)  extract/rust.rs (942)  cache.rs  cli.rs
    emit.rs  walk.rs  arch/glob.rs  acl_pin.rs  dispatch/join.rs

Direct dependents 0 → 1 for each; **transitive dependents 0 → 12…20**. The
TypeScript extractor — the single largest file in C-07 — is currently in the
cheapest bucket the proposed rule has. **This is the failure direction the card
names, live, at nine files, not hypothetically.**

**And the fix immediately finds a true dependency no gate can see.**
`lib.rs`(C-05) → `dispatch/mod.rs`(C-15) is the one new *cross-component* edge in
the 27. `C-05-app.md`'s `depends_on:` does not list C-15, so `arch drift` gains a
**D1 `C-05 -> C-15`** and `arch`'s summary moves `edges=36 → 37`,
`findings=3 → 4`, `drift_components=3 → 4`. **That drift is real and has been
real since T-126; the mod fix does not create it, it reveals it.** It is the
best single piece of evidence this card has, and it is the ADR's opening.

### 2. Sequencing, and where the reversible boundary sits

The card is one card with two risks that are not comparable. **They land in this
order, in separate commits:**

- **HALF A — the graph (fence `crate-index` alone).** `mod` edges, the Rust
  edge-coverage ruling, the derivation, and `arch`'s own disclosure narrowed.
  **Independently valuable even if the ceremony ruling is reversed tomorrow**:
  it removes a whole class of blindness from `arch drift`, it discharges
  `T-126-s4`, and it makes the C-05→C-15 drift visible. Nothing in it mentions
  ceremony.
- **HALF B — the policy (fence `method/tasks/TASK-FORMAT.md` + `docs/decisions/`).**
  The ceremony section and the ADR. **Prose only. No code, no field, no parser
  change, no format version bump** (§9 says why that last one is not optional).

**THE REVERSIBLE BOUNDARY IS THE COMMIT THAT ADDS THE CEREMONY SECTION TO
`TASK-FORMAT.md`.** Everything before it is a strict improvement to a
measurement; everything at or after it is a policy whose entire footprint is one
section of one file plus one ADR. Reverting is `git revert` of that commit —
no schema migration, no re-index, no card rewrite, because **nothing is stored**:
the number is derived on demand (§5) and no card frontmatter records it.

**If the architect prefers two cards, the seam is exactly that boundary** and the
fences are already disjoint. This pass recommends keeping one card — splitting
doubles ceremony on a card whose subject is reducing it — but the seam is real
and Half A must be able to merge alone.

### 3. Half A — the design, and the one thing it must not do

**Emit `mod` dependencies through the existing `import` accumulator, not as a new
edge kind.** The reason is measured, not aesthetic:

- `app/src/lib/architecture/graph.ts:23` declares `GRAPH_EDGE_KINDS =
  ["import", "call", "type_ref"]` as a **closed** vocabulary, and line 346 skips
  any edge outside it **while emitting a `graph-entry` issue**. A `kind: "mod"`
  would be dropped by the map pane and would surface 27 new parse issues in the
  app's error strip.
- `crates/nputer-index/src/arch/mod.rs:281` filters `edge.kind != "import"`, so
  a new kind is invisible to `arch`, `arch drift` and D1–D5 as well.
- **Both files are outside this card's fence** (`app-map` and… `arch/mod.rs` is
  in-fence, `graph.ts` is not). A criterion that required a new kind would be a
  criterion the lane cannot satisfy — TASK-FORMAT.md's own defective-card case.

The same reader reads **named fields only** and ignores unknown ones, so the
provenance may be carried on an additive optional field (`skip_serializing_if`),
exactly the T-129 precedent (`depth_refused` / `depth_limited`, `schema` stays
**1**, bytes unchanged for every input that does not exercise it). **Whether to
carry provenance at all is the executor's call; inventing a `kind` is not.**

**The seam is `resolve::resolve_all`'s `import_edges: BTreeMap<(String,String),
EdgeAcc>`.** Feeding mod pairs through `accumulate` buys dedupe, the merge with
an existing `use` edge for the same pair (which is why 44 pairs cost only 27
edges), and the existing `edges.sort_by` determinism for free. **A second edge
vector would have to re-earn all three.**

**One trap the executor must not walk into.** `build_module_tree` guards twice
on `visited` — once at the top of the queue loop and once before
`queue.push_back`. **The edge belongs to the DECLARATION, not to the queue
push**: `tests/common/mod.rs` is declared by six different test roots and is
visited once. Its direct dependents go **2 → 8** in this pass's derivation; a
push-site implementation would report 2 → 3 and look plausible. **This is the
poison drill's first target.**

**Byte cost, measured against the real emitter.** `json.dumps(graph, indent=2)
+ "\n"` reproduces the committed file **byte-identically** (944 590 = 944 590),
so the model is exact. A pretty-printed `{from,to,kind}` file→file edge is
**~161 bytes**; **27 of them is ~4 350 bytes against 55 410 of headroom** (7.8%).
`max_graph_bytes` is `1_000_000` (`lib.rs:79`) and the docs collector's per-file
cap is 1 MiB. **The fix fits with ~51 000 bytes to spare.** Derive it again at
the merge; do not quote this figure.

### 4. Criterion 2 — the Rust edge coverage, enumerated and ruled

**After this card Rust emits: `import` (from `use`), `import` (from `mod`).
Rust still emits NO `call` and NO `type_ref`.** `T-010-s6` is cited, not
rediscovered. The ruling, with the two measurements that decide it:

1. **`call`/`type_ref` are redundant for a FILE-granularity count in
   TypeScript, provably.** Of 1 256 TS `call`/`type_ref` edges, the number whose
   *file pair* has no `import` edge is **zero**. In TS you must import before you
   can call, so the import edges already carry every file-level dependency.
2. **They are NOT redundant in Rust, and the residue is small and bounded.**
   Rust reaches across modules by path expression without a `use`. Counting
   `crate::`/`super::`/`self::` paths with a further `::`, on lines that are not
   `use` lines and not comments, over the walked Rust set: **67 occurrences in 15
   files** — an upper bound on the file pairs a body-level resolver could add,
   before deducting the ones the same file already `use`s.
3. **The budget forbids buying them here.** Projecting TS's call/type_ref density
   onto Rust gives **~900–940 edges and ~175 000–182 000 bytes**, by symbols and
   by LOC independently. That is **3.2x the entire remaining headroom** and would
   put the graph over both `max_graph_bytes` and the 1 MiB collector cap. It also
   needs body-level name resolution, which is a card, not a clause.

**So the omission is RULED SAFE for the number this card computes** — a
file-granularity dependent count — **and RULED UNSAFE for any symbol-granularity
question**, and the crate must say so. **`arch/cycles.rs:231–234` prints a
disclosure that this card makes half-false** (its `mod` half is fixed, its
path-expression half stands) and its test at line 303 asserts the text. Both are
in-fence. **Narrow the sentence; do not delete it, and do not silently widen the
claim.** That is criterion 2 discharged in the one place a reader meets it.

**A THIRD GAP THE CARD DOES NOT NAME, AND IT IS THE ONE TO WATCH.** The
`package.path` seam (`p:@nputer/parser -> lib/parser`) resolves at **component**
granularity only — `arch/mod.rs` maps the package's directory to its owning
component. At FILE granularity there is no correct answer without resolving the
package's entry point, and both available answers are wrong: ignore the seam and
all 25 `lib/parser` files read 0 dependents; attribute it to every file and each
reads ~28. **A cross-package file-level blast radius is not computable from
today's graph.** Until it is, `lib-parser` is a component-granularity answer
only — say so in the derivation's output rather than printing a confident zero.

### 5. Criterion 3 — dependents derived, not stored

**One derivation, in Rust, in `crate-index`, reachable as a subcommand.**
`arch cycles` is the shape and the precedent: `cli.rs` already parses
`arch <sub>` (lines 195–197) and every gate shares the 0/1/2/3 exit contract.
Add `arch blast <path>…` (name is the executor's), which:

- reads the **committed** graph, like `arch` and `arch drift`, and prints the
  same `note computed from the COMMITTED graph; index --check is what proves it
  current` line;
- reverses the forward walk **at read time** — no reverse index is written, so
  the T-057 two-implementations failure cannot arise. **If materialising is ever
  needed for cost, the derivation is the pin**, per the criterion;
- takes paths and/or slugs, resolving slugs through each component's own
  `touch_slugs:` — **never through `ARCHITECTURE.md`'s prose signpost**, which
  that file says of itself is not the map (`T-089-s7`);
- prints, per input, the file set, the per-file dependent counts, the maximum,
  whether any input is a build-target root, and the coverage class of §7 —
  **and never a rung it has not shown the working for.**

The TypeScript side must not grow a second copy. `app/src/lib/architecture/
derive.ts` already filters `edge.kind !== "import"` twice and is outside this
fence anyway.

### 6. Criterion 4 — the distribution, and where the rungs go

**THE METRIC.** Direct file→file dependents over `import` edges (post-`mod`-fix),
internal edges only, cross-package edges excluded per §4. Direct rather than
transitive because **transitive saturates**: in a 180-file graph with one large
connected app, 43 distinct transitive values collapse into a dense 12–29 band
that separates nothing, while direct keeps a legible tail.

**THE DISTRIBUTION, all 180 files, post-fix:**

    dependents  0: 80 files      5:  3      11: 4
                1: 28            6:  5      12: 1
                2: 16            7:  0  <-- 13: 1
                3: 20            8:  3      15: 1
                4: 12            9:  1      20: 1
                                10:  3      29: 1

    widest gaps above zero:  20→29 (9)   15→20 (5)   13→15 (2)   6→8 (2)

**THE RUNGS, put where the data separates:**

- **rung 0 — `0` dependents.** 80 files (44%). 70 of them are test files and 8
  are build-target roots; after the floor rule in §7 the genuine rung-0
  population is **2 files**.
- **rung 1 — `1`–`7`.** 84 files (47%).
- **rung 2 — `>= 8`.** 16 files (8.9%), separated by the empty bucket at 7.

**The face-validity check, which is the qualitative half.** The 16 files at
rung 2 are, in order: `docs-model.ts` (29), `architecture/derive.ts` (20),
`watcher-store.ts` (15), `App.tsx` (13), `architecture/graph.ts` (12),
`lib/utils.ts` (11), `task-detail.ts` (11), `agent-store.ts` (11),
`nputer-index/src/lib.rs` (11), `parser/types.ts` (10), `parser/index.ts` (10),
`nputer-index/src/graph.rs` (10), `nputer-index/src/testutil.rs` (9),
`board-model.ts` (8), `map-visuals.ts` (8), `nputer-index/tests/common/mod.rs`
(8). **That is the list a careful reader would write by hand**, and the last of
them enters the top rung only because of the `mod` fix (2 → 8).

**AND NOW THE FINDING THAT DECIDES THE CARD, WHICH IS A FINDING ABOUT THE
PROPOSAL AND NOT A FAILURE OF THE PLAN (criterion 3's own words).**

**The rule cannot read this distribution, because no card's `touches:` has ever
named a code file.** Over all **134** planned + done + building cards there are
**216 `touches:` entries: 135 slugs and 81 non-code paths, and ZERO entries that
name a code path inside the walk.** Every code fence in this project's history is
component-sized. `app-shell` is 69 files; `crate-index` is 34; the smallest,
`app-dispatch`, is 5.

The consequence is arithmetic. **Every component-sized set that contains code
contains a rung-2 file**, so the rung is a constant:

| population | rung 0 | rung 1 | rung 2 |
|---|---|---|---|
| 35 planned cards, rule as the criteria specify it | 0 | 0 | **35** |
| 97 done cards, same rule | 0 | 5 | **92** |
| 35 planned, with §7's corrected unknown rule | 8 | **0** | 27 |
| 97 done, same | 22 | 6 | 69 |

**The rule as specified is a constant function on the live board.** With §7's
correction it becomes two-valued, and the split it produces — code vs not-code —
is **exactly the rule of thumb the ceremony table already carries** (*"docs,
method and tooling self-integrate; anything a user could run does not"*). **It
adds no information over the rule it would replace.** The middle rung is empty on
the planned board and holds 6 of 97 done cards.

**This is not a defect in the metric. The per-file distribution separates
cleanly and its top rung has high face validity.** The metric has never been
given an input finer than a component. **The prerequisite is path-granular code
fences — which T-108's ruling already adopted as the norm** (*"a fence names the
paths a lane WRITES, at the narrowest granularity that still covers them"*) —
**and which 216 of 216 entries have not adopted.**

**@human's call, and it is the one this card exists to put in front of you:**
land the rungs above as **ADVISORY** — computed, printed at dispatch, recorded
by the architect, binding on nothing — and make them **BINDING** when a
re-derivation of the table above shows the middle rung non-empty. That condition
is a measurement, not a date, and it is one command. The alternative is to bind
them now, which buys a rule that agrees with the existing one on 132 of 132
cards and costs a session per card to compute.

### 7. Criterion 5 — the unknown case, and the conflation it currently hides

The criterion says an unmeasured blast radius is not a small one, and it is
right. **But "unmeasured" and "not code" are two different things and the
criterion conflates them.** Measured: **33 of 35 planned cards and 36 of 97 done
cards touch at least one path with no graph entry** — and every one of those
paths is `docs/`, `method/`, `tools/` or `.github/`, i.e. **excluded by
`.nputerignore` or carrying no walked extension.** Taken literally, criterion 5
promotes the entire docs/method/tooling population — the population the ceremony
table deliberately routes to its *cheapest* row — to the *most expensive* one,
and ceremony gets more expensive on average. **That is the opposite of the
ruling's stated purpose, and it is the card arguing against itself.**

**THE THREE COVERAGE CLASSES, all derivable, none a judgement:**

- **KNOWN NON-CODE** — the path is excluded by `.nputerignore`, or carries no
  walked extension, or belongs to a component whose declared `paths:` name
  neither. The graph's own `D3 declared_only_component` already names this case:
  `arch drift` reports **D3 for C-01 (`method/**`) and C-11 (`app/src/styles/**`,
  `app/src/assets/**`)** at this ref. **These take the ceremony table's existing
  rule of thumb, not a raised rung.**
- **GENUINELY UNMEASURED** — a walked extension inside the walk root with no
  graph entry, or an entry the indexer could not complete: `stats.skipped`,
  `stats.truncated_files`, `stats.truncated_symbols`, `stats.depth_limited`, or a
  `files[].depth_refused`. **All five are absent from the graph at this ref, so
  this class is currently EMPTY** — which is precisely why it is safe to make it
  the strict one. **This class gets the HIGHER ceremony, never the lower.**
- **MEASURED** — a graph entry exists; §6's rungs apply.

**AND THE FLOOR RULE, WHICH IS NOT OPTIONAL.** Reverse reachability terminates
at build-target roots, so **a root has zero dependents by construction**. Eight
of them sit at 0 at this ref: `app/src-tauri/build.rs`,
`crates/nputer-index/src/bin/nputer-index.rs`, `app/src-tauri/src/bin/fake_agent.rs`,
**`app/src-tauri/src/lib.rs`**, `app/src-tauri/src/main.rs`, `app/src/main.tsx`,
`app/vite.config.ts`, `app/vitest.config.ts`. `app/src-tauri/src/lib.rs` is the
Tauri crate root — `generate_handler!`, fifteen IPC commands, every module
declaration — **and it is the file T-126 touched.** *The card that the entire
ruling is argued from is floored by the rule it motivates, before the mod fix and
after it.* So: **a build-target root is never at rung 0.** The indexer already
computes crate roots (`resolve/rust.rs` step 2); TS entry points come from the
same walk. This over-corrects on three or four genuinely cheap roots (`build.rs`
is three lines), and that is the correct direction: the card's own failure
analysis says under-counting is the failure that matters.

### 8. Criterion 8 — what `size:` becomes

**They stop overlapping by each keeping the half it actually knows.**

- **`size:` = HOW LONG THE WORK IS.** Duration and decomposition — whether the
  work needs a planning pass or a debate room before anyone opens an editor.
  **It keeps exactly one rung of the ceremony table: `L` ⇒ planning pass.** That
  is a fact about the work's shape, and no dependent count predicts it. This card
  is the proof: `size: L` earned this pass, and its blast radius did not.
- **blast radius = HOW EXPENSIVE IT IS TO GET WRONG.** It takes the two rungs
  that are about risk: **whether a VERIFIER is owed, and whether a SEPARATE
  INTEGRATOR is owed.**

    rung 0  ->  executor + tests; the executor is its own integrator
    rung 1  ->  executor -> verifier; the executor integrates its own work
    rung 2  ->  executor -> verifier -> integrator
    size L  ->  a planning pass before any of the above, whatever the rung

**This is continuity, not replacement.** The table's existing S-row split already
*is* a blast-radius proxy — *"if any entry names a component whose build output
SHIPS, the card takes a verifier"* — and this card replaces the proxy with the
measurement while keeping the three rungs the table already has. **Nothing is
deleted, the mapping is total, and an M or L card whose rung is 0 or 1 is now
possible where before it was unspellable.**

### 9. Criterion 7 — reversibility, and a version bump that must NOT be attempted

**The override is prose in the card body and NOTHING else.** At dispatch the
architect may move the computed rung by writing the tier and the reason into the
card, and the ceremony section says so. **A bad threshold then costs a sentence.**

**THE NEW FIELD IS REFUSED, AND THE REASON IS A FENCE MEASUREMENT.** A new
frontmatter field is a `method/` format change, and `docs/CONVENTIONS.md` rules
that **a bump is a three-file commit whose third file is Rust**: this file's
stamp, `method/interview/plan-interview.md`'s Output-heading stamp, and
`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`, which
`snapshot_version_matches_the_live_method_stamps` checks against both on every
`cargo test`. **All three are outside any fence this card can be given without
colliding with `app-agent`**, and the two doc stamps cannot move without the
const — a one-sided move is exit 101, twice, in a fixed order. **A body sentence
needs none of it: no field, no parser change, no bump, no gate.** Discipline, not
enforcement — which TASK-FORMAT.md already says of half its own rules, in as many
words.

**So the whole policy footprint is one section of `TASK-FORMAT.md` plus one ADR,
and reverting is reverting one commit.** Nothing is stored on a card, nothing is
serialized into the graph, and `arch blast` survives a reversal as a report.

### 10. Criterion 6 — the ADR

**`docs/decisions/018-*.md`.** It records @human's ruling as the authority and
supplies the reasoning, and it SHALL contain, in this order:

1. **The architect's objection verbatim in substance** — one session, five
   merges, one unusually introspective repository; most valuable of the five if
   true and least evidenced as measured — **and the fact that @human adopted with
   it in view.**
2. **The measurement, which now answers the objection in both directions.**
   *For:* the graph was blind to 27 real Rust dependencies, nine core files sat
   at exactly zero, and fixing it immediately surfaced a true undeclared
   `C-05 -> C-15` dependency that has been real and invisible for three merges.
   *Against:* on the live board the rule is a constant function (§6's table), and
   with the unknown case corrected it reproduces the rule of thumb it replaces.
   **Both halves are this session's, both are commands, and an ADR that carried
   only the first half would be the preference the objection warned about.**
3. **What would falsify it.** Three named, cheap checks: (a) re-derive §6's
   table after code fences go path-granular — if the middle rung is still empty,
   the rule is dead; (b) take any card the rule rates rung 0 or 1 and ask whether
   its actual defects were caught without a verifier; (c) if a rung-2 card's
   verifier finds nothing on N consecutive cards, the top threshold is too low.
4. **The prerequisite it depends on** — path-granular code fences, T-108's
   already-adopted norm, 0 of 216 adoption — **named as a prerequisite, not as
   future work.**

### 11. The fence, and what is routed rather than built

**THE FENCE MUST MOVE BEFORE DISPATCH, AND ONLY THE ARCHITECT MAY MOVE IT.**
`touches: [crate-index, method/tasks/TASK-FORMAT.md]` **cannot satisfy criterion
6**: an ADR lives in `docs/decisions/`, which the fence does not carry. That is
TASK-FORMAT.md's own defective-card case — *widen the fence BEFORE dispatch,
which is this seat's to do and no lane's, or write the criterion as a ROUTE.*
Criterion 6 is @human's condition for adopting, so it should be built, not
routed. **Recommended: `touches: [crate-index, method/tasks/TASK-FORMAT.md,
docs/decisions/]`.** Derived from disk at this ref, that stays disjoint from the
only other lane (`T-133`, `[tools/e2e]`) — `git worktree list --porcelain | awk
'/^branch refs\/heads\/task\//'` returns exactly `T-133` and `T-135`.

**ROUTED, NOT BUILT — three, each with its vehicle:**

- **The `C-05 -> C-15` D1 the mod fix reveals.** The one-line fix is
  `depends_on:` in `docs/architecture/components/C-05-app.md`, outside this
  fence. **`T-126-s3` is the vehicle** — it already holds
  `[app-dispatch, docs/architecture/components/]` and already carries four false
  C-15 statements. File the D1 against it rather than opening a new card.
- **The cross-package file-level seam (§4).** Needs the package's entry point
  resolved; that is a `crate-index` card of its own, with its own budget
  argument. File as a suggestion naming §4's measurement.
- **A distinct `mod` edge kind, if anyone ever wants one.** Needs
  `GRAPH_EDGE_KINDS` in `app/src/lib/architecture/graph.ts` widened first —
  `app-map`. File as a suggestion naming the closed vocabulary and line 346's
  skip-with-issue behaviour, so the next hand does not discover it at the merge.

**`graph.json` IS NOT THIS LANE'S TO COMMIT, and the criterion should not be read
as saying so.** Of the 57 commits that have ever touched
`docs/architecture/graph.json`, **55 are checkpoints**; the two exceptions are
T-009 (which created it) and T-082. `self_graph_is_current` is `#[ignore]`d, so a
stale committed graph does not red a bare `cargo test`. **The lane's obligation
is to RUN the regen and STATE the deltas — bytes, files, symbols, edges — and the
integrator's is to commit it.** Read the criterion that way and it is in-fence;
read it the other way and it is not.

### 12. Verification

Bare `cargo test --no-fail-fast` from `app/src-tauri`, **exit read unpiped from
`$?`**, total **SUMMED from the `test result:` lines and cross-checked against
the `running N tests` headers** — an abort prints no result line at all, so the
header check is what catches vanished bodies. Derive both counts at your own ref.

**THIS CARD WRITES FIXTURES, WHICH IS THE IDENTICAL-FIGURES TRAP'S ACTUAL
TRIGGER.** `tests/fixtures/rust-workspace/expected-graph.json` (23 edges today)
and `tests/fixtures/mixed/expected-graph.json` (6) are byte-compared by
`golden.rs::check_fixture` and regenerate only under
`NPUTER_UPDATE_GOLDEN=1`. **The discriminator is not whether the headline figures
match — it is whether a fixture was written, and here one was.** Ask GRAPH REGEN
before, ask again after every fixture write, and never confirm by byte count.
Read `arch cycles` **unpiped**: it is exit **1 by design** on main (the surviving
`C-08 -> C-09 -> C-08`), prints its whole report on **stderr** with stdout empty,
and reading its exit through `| head` yields head's 0.

**THE PINS, AND EACH MUST FAIL AGAINST THE PRE-FIX TREE (`T-080-s1`).**

1. **The live case, which is the finding itself.** A fresh index of this
   repository carries `f:app/src-tauri/src/lib.rs -> f:app/src-tauri/src/dispatch/mod.rs`.
   Asserted against a fresh index (`self_graph.rs`'s `self_options()`), never
   against the committed file — the lane does not commit it (§11). **Zero edges
   pre-fix; the pin cannot pass by accident.**
2. **The shape sweep, which the fixture already supports.**
   `rust-workspace` already carries every shape: an ordinary `mod` in a crate
   root, a `mod` in a `mod.rs`, a `mod` in a `[[bin]]` target, a `mod` in a
   `tests/` root, a workspace-sibling crate, **and a `#[path]` relocation**
   (`mod moved;` → `src/relocated/elsewhere.rs`). **No new fixture is needed**;
   extend `golden.rs::rust_workspace_carries_every_shape_the_criteria_name`'s
   existing `edge(from, to)` list.
3. **The multi-declarer case from §3.** `tests/common/mod.rs`'s direct dependents
   go 2 → 8; a `visited`-guarded implementation reports 3 and passes every other
   pin.
4. **The disclosure.** `arch cycles`'s note names what Rust still cannot see, and
   its existing assertion at `cycles.rs:303` is updated rather than deleted.

**POISON DRILL on every new assertion** — producer mutated, never the assertion
— in a **detached scratch worktree OUTSIDE the repository** with its own
`CARGO_TARGET_DIR` **inside** that worktree and **NAMED to match an ignore rule**
(`.vtarget`; the protection is the name, not the location). **The pollution
outlives the mutants**: a stale binary in a drill's target directory has produced
a plausible and entirely false defect report on this project. **Uniqueness of
kill is measured against the whole suite**, not against the file under test.

**`cargo test` IS OWED BY THE `method/` EDIT and no gate will say so.**
`TASK-FORMAT.md` is one of exactly fourteen `method/` files compiled into the
binary (`include_str!` through `agent/kit.rs`), measured from cargo's own
dep-info; the DOCS GATE's trigger keys on `docs/` and `method/` is not `docs/`
(`T-132-s2`). **The ADR, being under `docs/`, DOES fire the DOCS GATE** — run it
with the merge's own path list and let it name its suites; do not predict them.
Build `lib/parser` first, then `npm run build` from `app/`; **`npm run typecheck`
from `app/` does not exist** — the scripts are exactly `dev, build, preview,
test, tauri`, and its absence reads exactly like a compile failure.

**@human's look is owed at §6 and §7** before the ceremony section binds
anything, because where the rungs sit — and whether they bind at all — is a
judgement about how much this project is willing to pay for safety.
