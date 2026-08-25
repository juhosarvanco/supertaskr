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

## Implementation notes — HALF A ONLY (executor claude-opus-5, 2026-08-26)

**Built in lane `task/T-135-blast-radius-ceremony`, fence `crate-index`
alone. `method/tasks/TASK-FORMAT.md` is UNTOUCHED and no file under
`method/` was written.** Half B — the ceremony section and the ADR — is
not built and is not routed: it waits on **@human's look at §6 and §7**,
which is what the card's own Verification section asks for. `status:`
therefore stays `building`; the conflict that creates with
`method/roles/executor.md` step 6 is filed as `T-135-s4` rather than
decided here.

Every figure below was derived in this lane at the ref named beside it,
with the command shown, exits read **unpiped from `$?`**.

### What Half A discharges, criterion by criterion

- **Criterion 1 — `mod` declarations are edges, with a pin that fails
  against the pre-fix tree.** Four pins, three of them new bodies and one
  a fixture: `resolve::rust::tests::every_resolved_mod_declaration_is_recorded_as_a_pair`,
  `…::a_declaration_of_an_already_visited_module_is_still_that_files_dependency`,
  `…::a_module_declared_by_several_targets_is_a_dependency_of_every_one_of_them`,
  `self_graph::a_mod_declaration_is_an_edge_in_this_repositorys_own_graph`
  (the live `lib.rs -> dispatch/mod.rs` case, asserted against a FRESH
  index), and two new rows in
  `golden::rust_workspace_carries_every_shape_the_criteria_name`. All six
  are zero-edge facts before this commit, so none can pass by accident
  (`T-080-s1`).
- **Criterion 2 — Rust edge coverage enumerated and ruled.** After this
  card Rust emits `import` from `use` **and** `import` from `mod`. It
  still emits **no `call` and no `type_ref`** — `T-010-s6` cited, not
  rediscovered. The ruling is written where a reader meets it: the module
  doc of `resolve/rust.rs`, and `arch::cycles::render`'s note, **narrowed
  rather than deleted** (below). §4's arithmetic is cited and was not
  re-derived; I did not disagree with it.
- **Criterion 3 — dependents DERIVED, never stored.** `arch blast
  <path|slug>…`, a new subcommand on the `arch cycles` precedent. It
  reads the COMMITTED graph, reverses the forward `import` edges **at
  read time**, writes nothing, and adds no schema field. There is no
  reverse index, so the T-057 disagreement cannot arise.
- **Criteria 4–8 — Half B**, and §11's fence widening to
  `docs/decisions/` is still owed before criterion 6 can be built at all.

### The one in-fence spelling, and what it bought

**`mod` edges ride the existing `import` kind.** The brief is right that
this has exactly one in-fence spelling: `GRAPH_EDGE_KINDS` in
`app/src/lib/architecture/graph.ts` is CLOSED and its reader skips an
unknown kind **while emitting a `graph-entry` issue**, and
`arch::join` filters `kind != "import"` — so a `kind: "mod"` would be
invisible to the map pane, to `arch`, to `arch drift` and to D1–D5, while
adding one error-strip entry per edge. Filed as `T-135-s2`.

**Inside that spelling the executor's call was how STRONG the occurrence
is, and I made it the weakest possible one: no `symbols` entry, no
`reexport` claim, no provenance field.** `EdgeAcc.all_reexport: bool`
became `reexport: Option<bool>` to carry "no import occurrence has
spoken yet".

**The reason is measured, and it is the strongest property this change
has.** Against the base graph the whole final diff is **32 edges added,
0 removed and 0 CHANGED IN PLACE**. Both live alternatives break that:

- a `mod` occurrence spelled `reexport: false` CLEARS `reexport: true`
  off three live edges (`lib.rs -> {diff,error,graph}.rs`, each a
  `pub mod` + `pub use` pair) and off the fixture's
  `core/src/lib.rs -> core/src/types.rs`;
- a `mod` occurrence spelled with the module's own name ADDS that name to
  the `symbols` array of every one of the 17 pairs that already carried a
  `use` edge.

`tests/golden.rs` already asserted both of those facts before this card
touched it, which is why the wrong choice would have been caught — and
both are now poisoned deliberately (M3, M4 below).

### The measurements, all at `7d386f0` unless stated

**GRAPH REGEN, asked twice and never predicted.**

    cd app/src-tauri && cargo run -q -p nputer-index -- index --check --root ../..
    BEFORE (at base 5547f02):  exit 0  CURRENT  944590 bytes · 180 files · 2018 symbols · 1911 edges
    BEFORE (at 7d386f0):       exit 1  STALE    fresh 955710 · 181 · 2038 · 1943
    regen: NPUTER_UPDATE_GOLDEN=1 cargo test -q -p nputer-index --test self_graph -- --ignored   exit 0, 1 passed
    AFTER:                     exit 0  CURRENT  955710 bytes · 181 files · 2038 symbols · 1943 edges

**The deltas, which this card says are the deliverable:**

| | base | final | delta |
|---|---|---|---|
| bytes | 944 590 | 955 710 | **+11 120** |
| files | 180 | 181 | +1 (`arch/blast.rs`) |
| symbols | 2 018 | 2 038 | +20 |
| edges | 1 911 | 1 943 | **+32** |

**And the +32 attributes exactly**: **27** are the `mod` fix on files that
already existed — the plan's figure, reproduced — **4** are `blast.rs`'s
own outbound `use` edges, and **1** is `arch/mod.rs -> arch/blast.rs`,
which is itself a `mod` edge produced by this card's own
`pub mod blast;`. Measured in isolation before `blast.rs` existed, the
`mod` fix alone moved the graph 944 590 → **949 507** bytes (**+4 917**,
against the plan's forecast of ~4 350) for 27 edges and 0 other movement.

**THE FINDING THE FIX REVEALS.** `arch --root ../..`, exit **0**:

    component  C-05  App  … observed_deps=9 -> 10  drift=- -> drift=D1
    edge  C-05 -> C-15  undeclared  observed=1
    summary  … edges=36 -> 37  findings=3 -> 4  drift_components=3 -> 4

    arch drift, exit 0:
    finding  D1  D1:C-05->C-15  C-05 -> C-15  file_edges=1
      file-edge  app/src-tauri/src/lib.rs -> app/src-tauri/src/dispatch/mod.rs

**Not a regression. The drift has been real since T-126 and invisible
because a `mod` declaration produced no edge** (`T-126-s4`, now
discharged). Routed to `T-126-s3` as item 4.

**`arch cycles --root ../..` — exit 1, BY DESIGN**, the surviving
`C-08 -> C-09 -> C-08`, whole report on stderr, stdout empty. Read
unpiped.

### The three obligations the card does not name — my ruling on each

1. **`arch/cycles.rs`'s disclosure — NARROWED, not deleted and not
   widened.** Its `mod` half became false with this commit; its
   path-expression half stands. The note and the module doc now name both
   halves, and the module doc records WHY narrowing is the only honest
   move when a fix makes a disclosure half-true. Its test
   (`every_green_and_every_red_carries_what_the_gate_cannot_see`) now
   asserts BOTH halves — the fix by its card id and the surviving gap by
   its finding id — because asserting only the survivor would let a future
   widening pass unnoticed.
2. **The golden fixtures — ONE moved, not two.** See the corrections
   below; the card and the brief both say two.
3. **`GRAPH_EDGE_KINDS` — taken as the one in-fence spelling**, with the
   sub-choice argued above and the alternative routed as `T-135-s2`.

**And a FOURTH the plan did not name, which decided the design**: the
`reexport`/`symbols` merge semantics of a `mod` occurrence, three live
edges and one existing fixture assertion deep. It is written up above
because it is the reason the graph delta is purely additive.

### Poison drills — eleven arms, every one RED

Detached scratch worktree **outside the repository at a SHORT path**,
`/private/tmp/t135d` (19 characters), cut at the tip under test, with
`CARGO_TARGET_DIR=/private/tmp/t135d/target`. **NOT `.vtarget` — see the
corrections.** Producer mutated in every arm, never an assertion; the
diff read with `git diff` BEFORE each run; the whole suite run with
`--no-fail-fast`; restore proved per path by `sha256` against a baseline
taken before the first arm, plus an empty `git status --porcelain`.

**Control first**: unmutated, `cargo test --no-fail-fast` in that
worktree, **exit 0**. **And a control on the arm itself**: every arm shows
exactly one `Compiling nputer-index` line and **zero `error[E…]`**, so no
arm was a compile failure wearing a kill's exit code. (My first pass at
that check reported a compile error on all eleven — it was matching
cargo's own `error: test failed` summary line. The guard was wrong, not
the arms.)

| # | mutation (producer) | suite | killed |
|---|---|---|---|
| M1 | the `mod` pair is never recorded | 101 | 6 |
| M2 | the pair is recorded at the QUEUE PUSH instead of the DECLARATION | 101 | **1** |
| M3 | a `mod` occurrence claims `reexport: false` | 101 | 2 |
| M4 | a `mod`-only edge claims `reexport: true` | 101 | 2 |
| M5 | `arch blast` drops the `kind != "import"` filter | 101 | 1 |
| M6 | the package seam is not marked | 101 | 1 |
| M7 | every input is classed `measured` | 101 | 2 |
| M8 | an unknown slug answers zero instead of refusing | 101 | 2 |
| M9 | a build-target root is never marked | 101 | 1 |
| M10 | the disclosure reverts to its half-false form | 101 | 1 |
| M11 | `touch_slugs:` is not read | 101 | 1 |

**Uniqueness measured against the whole 512-body suite**, not against the
file under test. Seven arms kill a body nothing else kills. M2, M3, M4 and
M11 kill only bodies another arm also kills — each is a NARROWING of a
neighbouring mutation, which is what makes that expected rather than a
gap: M1 subsumes M2's body, M3 and M4 are the two directions of one
`reexport` decision and both land on the same fixture pair, and M11's
single body is also M7's and M8's.

**M2 IS THE ARM WORTH READING, AND IT CORRECTS THE PLAN.** It kills
**exactly one body in 512** —
`a_declaration_of_an_already_visited_module_is_still_that_files_dependency`
— and it changes the live graph **not at all**: with M2 applied, a fresh
index of this repository is `955710 bytes · 181 files · 2038 symbols ·
1943 edges`, byte-identical to the correct implementation. So the trap is
real, latent, and guarded by a single synthetic body. See the corrections
for why the plan's stated discriminator does not discriminate.

### Standing gates, derived from the merge's own diff

**THE RANGE RULE**, exit read BEFORE the substitution. Main had moved off
this lane's base while it built (`70b1d40` → `2a0652a`, the T-133 merge):

    MAIN=2a0652aff5b84210185f8bdeb939b3be3a0ddbc0
    TREE=$(git merge-tree --write-tree "$MAIN" HEAD)   # $? = 0
    git diff --name-only "$MAIN" "$TREE"               # 16 paths

- **GRAPH REGEN — FIRES** (9 of 16 paths are `*.rs` outside `docs/`). Run
  above; `graph.json` is **regenerated and left UNCOMMITTED**, because 55
  of the 57 commits that ever touched it are checkpoints. The deltas are
  stated above; the file is the checkpoint's to commit.
- **BOOT GATE — FIRES** (10 of 16 under `app/src-tauri/**`).
  `NPUTER_BOOT_PORT=14521 npm run boot:check` from `tools/e2e/`, **exit
  0**, both lines: `[nputer] project folder: /Users/ujju/Projects/nputer-T-135`
  and `[nputer] window "main" created`. Port 1420 was read once,
  read-only — `lsof -nP -iTCP:1420 -sTCP:LISTEN` at 2026-08-26 02:07:44
  EEST names `node` pid 88948 on `[::1]:1420` — and never touched.
- **DOCS GATE — FIRES**, exit **1**, 6 paths under `docs/`, naming three
  suites. All three run, all green:

      npx vitest run  from lib/parser/   exit 0   12 files / 268 tests
      npm test        from app/          exit 0   47 files / 973 tests
      npm test        from tools/e2e/    exit 0   Running 171 tests, 171 passed

  The gate also reports *"every live task card's frontmatter parses, with
  a legal status"*, which is the check the four new suggestion cards owed.

**AND THE `app/` SUITE HAS A CONTROL IN BOTH DIRECTIONS, WHICH IS THE
FINDING.** Run with the REGENERATED graph in the tree it is **6 failed /
967 passed**, and all six are the `C-05 -> C-15` D1 arriving in
`architecture-dogfood.test.ts` (3) and `map-dogfood-render.test.tsx` (3).
Run with the committed graph — which is what the merge's own diff carries
— it is **973 / 973, exit 0**. So the merge is green and the CHECKPOINT's
graph commit is not, and no standing gate is positioned to say so. Filed
as `T-135-s3`, measured rather than predicted.

`cargo test --no-fail-fast` from `app/src-tauri`, exit **0**: 16 `running`
headers summing **515**, 16 `test result:` lines totalling **512 passed /
0 failed / 3 ignored**. The two reconcile, so no body vanished into an
abort. `cargo audit` was not run: no manifest or lockfile is in the diff.

### Routed, not built

`T-126-s3` item 4 (the `C-05 -> C-15` declaration), `T-135-s1` (the
cross-package file-level seam), `T-135-s2` (a distinct `mod` edge kind),
`T-135-s3` (the checkpoint's graph commit reds two `app/` suites),
`T-135-s4` (a half-dispatched card has no true `status:`).

### WHERE THE CARD, THE PLAN AND THE BRIEF WERE WRONG

1. **"Two golden fixtures move (`rust-workspace`, `mixed`)" — §12 and the
   brief. ONE moves.** Measured before regenerating: `cargo test -p
   nputer-index --test golden` reds **1 of 9**, and it is
   `rust_workspace_matches_golden`; `mixed_matches_golden` PASSES.
   `tests/fixtures/mixed/native.rs` is `fn main() { println!(…) }` and
   declares no `mod` at all, so that tree has no pair to add.
   `rust-workspace` goes 23 → 25 edges. **The trap the plan drew from this
   is still real and still fired**: `NPUTER_UPDATE_GOLDEN=1` WRITES all
   four fixture files unconditionally, and three of them came back
   byte-identical — `git status` and a sha256 comparison are what
   distinguish a write from a change, and a byte count is not.
2. **The `.vtarget` instruction is INVERTED, in §12 and in the brief.**
   Both say to name the drill's `CARGO_TARGET_DIR` `.vtarget` *"to match
   an ignore rule"*. `.vtarget` matches **no** ignore rule in this
   repository — `git check-ignore -v .vtarget` exits 1 — and it is the
   exact name that FAILED for T-127's verifier, whose own notes say so and
   whose fix was **renaming it to `target`**. `.gitignore:4` is `target/`.
   I used `target`, verified with `git check-ignore -v target` → matched
   at `.gitignore:4`. **A drill following the card as written reproduces
   T-127's fabricated staleness reading.**
3. **§3's multi-declarer trap names a case that does not discriminate.**
   The plan says *"`tests/common/mod.rs` is declared by six different test
   roots and is visited once … a push-site implementation would report
   2 → 3"*. Measured: **eight** test roots declare `mod common;`, the
   count goes 2 → **8**, and **a push-site implementation also reports
   8** — `build_module_tree` is called once per cargo target with a FRESH
   `visited` set, so a declaration in a different root is never suppressed.
   Proved by running the whole suite with the push-site mutation applied
   (M2): `a_module_declared_by_several_targets_…` **survives**, and a
   fresh index is byte-identical at 1943 edges.
   **The trap is real and the plan is right to name it — the
   DISCRIMINATING case is different.** A push-site recording loses a
   declaration only when the declaring file is processed after its target
   has already been popped, which needs two declarers **inside one root's
   walk**. `…a_declaration_of_an_already_visited_module_is_still_that_files_dependency`
   builds exactly that (a `#[path]` alias declared by the crate root
   before the sibling that also declares it) and is the only body in 512
   that kills M2.
4. **§3's paths are one component short.** The crate is at
   `app/src-tauri/crates/nputer-index/`, not `crates/nputer-index/`. Every
   `crates/nputer-index/…` reference in the plan needs that prefix. The
   LINE numbers beside them are correct.
5. **TWO CORRECTIONS I DRAFTED AND THEN RETRACTED, BECAUSE I CHECKED THEM
   AND THEY WERE MINE.** I had written that §3's `arch/mod.rs:281` and
   §4's `cycles.rs:231–234` / `cycles.rs:303` had drifted. **They have
   not — all three are exact at `5547f02`**, verified with
   `git show 5547f02:<path> | sed -n '<n>p'`: 281 is
   `if edge.kind != "import" {`, 231–234 is the two-line `mod`
   plus-path-expression note, and 303 is `text.contains("T-126-s4")`. I
   had measured them against my own already-edited tree, which is the
   error the correction clause exists to catch, committed inside the
   correction clause itself. **The plan's line references are the most
   precisely checkable thing in it and they all hold.**
6. **The plan's byte forecast is 13% low.** ~4 350 predicted for the 27
   edges; **4 917** measured, at 944 590 → 949 507. The per-edge model
   (~161 bytes) is close; the paths in this repository are longer than the
   sample it was fitted on.
7. **§5 requires `arch blast` to resolve slugs through `touch_slugs:` and
   does not say that the crate cannot read that field.**
   `arch::registry::Component` carried `id`, `name`, `layer`, `status`,
   `paths`, `depends_on` and `file` only; `touch_slugs:` fell through the
   reader's `_ => {}`. Half A adds it, with the same strictness
   `depends_on:` gets — which **widens the refusal surface of `arch`,
   `arch drift` and `arch cycles` by one field**, measured first: all
   thirteen component files carry the inline-list form today.
8. **§5 asks `arch blast` to print "whether any input is a build-target
   root" and §7 says the indexer already computes crate roots — but that
   computation was buried inside `RustWorld::build`,** which needs the
   extracted records and is index-time. Half A factors it out as
   `resolve::rust::cargo_target_roots` so `arch blast` reads the SAME
   definition rather than re-deriving one (the T-057 hazard this card's
   own criterion 3 names). **The TS half of the floor rule is NOT
   answered**: this crate computes no TypeScript entry points, and
   `arch blast` marks no TS file as a root. §7's list of eight roots
   includes three TS files; a rule that binds on §7 needs that gap closed
   or stated.
9. **§6's metric is "internal edges only, cross-package edges excluded"
   and §4 says to say so in the output — but neither says what to say.**
   `arch blast` prints `pkg-seam=p:@nputer/parser(importers=28)` beside
   every file of a repo-internal package, so the internal count and the
   reason it is not the whole answer arrive together. Filed as `T-135-s1`.
10. **The brief says the card's Verification section reads as ordering the
    lane to commit `graph.json`.** It does not, quite — it says the file
    "SHALL be regenerated and its movement stated", which is exactly what
    a lane can do. §11 already reads it that way. No correction needed;
    recorded because the brief asked.
11. **The brief's own claim that `arch cycles` prints on stderr with
    stdout empty holds only on RED.** On this repository it is red by
    design, so the claim is true here — but `cycles.rs`'s `render` is
    printed to **stdout** on green (`cli.rs`), and a reader who greps
    stderr on a green registry will find nothing.
12. **"`status:` has a closed vocabulary" — confirmed, and the DOCS GATE
    is what checks it.** `docs-gate.mjs` reports *"every live task card's
    frontmatter parses, with a legal status"*, so the four new suggestion
    cards are checked rather than assumed.
13. **`method/roles/executor.md` step 6 says a brief telling the executor
    to skip the `verifying` stamp is wrong; this brief says to leave
    `building`.** I followed the brief, because `verifying` on a card
    whose Half B is unwritten is a false statement and the vocabulary has
    no true value. **Recorded and routed rather than decided** — that is
    what the same role file requires of a conflict — as `T-135-s4`.

## Verdict — HALF A ONLY: **APPROVED** (verifier claude-opus-5 @T-135A-verify, 2026-08-26)

**APPROVED for Half A.** Half B (the ceremony section and ADR-018) was not
reviewed and its absence is not a defect; `status: building` staying is
correct and `T-135-s4` is the right disposition. Every acceptance criterion
Half A owns is discharged, and **no attack found a behavioural defect.**
Eight findings follow and **all eight are figures, disclosure placement or
routing — none is code.** One of them (F2) **the integrator must read before
committing `graph.json`**, because T-135-s3 as filed understates the reds it
exists to warn about.

**BOUNDED READ, DECLARED.** The card at the lane's base `70b1d40` and the
planning pass `git show 5547f02` §0–§12 were read first, and the attack set
was written down at **2026-08-25T23:23Z** — before the diff, before the
notes, and before `STATE.md` — in
`…/scratchpad/T-135A-verify/00-attack-set.md`. Verified in a detached
worktree **outside the repository** at `/private/tmp/t135t` (17 chars) with
`CARGO_TARGET_DIR=/private/tmp/t135t/target`, drills at `/private/tmp/t135p`.

**THE RANGE, WITH ITS REFS.** `git merge-tree --write-tree e692819 c6c7b1c`
→ exit **0** (read from `$?` into a variable BEFORE the substitution) → tree
**`b9c6faf`**; `git diff --name-only e692819 b9c6faf` → **16** paths. Ten are
`app/src-tauri/crates/nputer-index/**` (`crate-index`, in fence), five are
this card and its four new suggestions, one is `T-126-s3` — additive, a new
`## ITEM 4` section, no other hand's text touched, and it is what the
ratified plan §11 directed. **`docs/architecture/graph.json` is NOT in the
range**, which is §11 applied. **The card's frontmatter is byte-unchanged
from `70b1d40`** — no `verifier:`, `verified_by:` or `review:` is stamped by
this verdict either.

### The six claims, attacked

**1. THE EDGE-KIND CHOICE — UPHELD, and both counter-cases hold, one of them
by a smaller margin than claimed.** `GRAPH_EDGE_KINDS` is closed at
`graph.ts:23` and line **346** skips an unknown kind with
`entry(where, "unknown edge kind …; skipped")`; `arch/mod.rs:282` filters
`edge.kind != "import"`. So `kind: "mod"` really had no in-fence spelling.
Counter-case (a) is **exact**: the live graph carries exactly **three** Rust
`reexport: true` edges, all `nputer-index/src/lib.rs → {diff,error,graph}.rs`,
and `lib.rs` writes `pub mod diff;` / `mod error;` / `mod graph;` beside
`pub use diff::…` / `error::…` / `graph::…`, so a `reexport: false`
occurrence clears all three; the fixture's `core/src/lib.rs → types.rs`
(`pub mod types;` + `pub use types::Shape;`) is the one fixture assertion,
and the fixture's other `reexport: true` row (`app/src/lib.rs →
engine/runner.rs`) is correctly untouched because no `mod` names it.
**Counter-case (b) is F1 below.** Both are poisoned live (my arms C and D,
2 kills each).

**2. THE DELTA — RE-DERIVED INDEPENDENTLY AND EXACT.** I re-derived the mod
pairs from the Rust module rules in Python, without reading the lane's code:
**44 resolved pairs, 17 already carrying a `use` edge, 27 new** — the plan's
figures, reproduced from the tree. Set-equal to the lane's 27 (`only mine: []`,
`only theirs: []`). GRAPH REGEN, asked and never predicted, at `c6c7b1c`:
before **exit 1 STALE**, after `index --root ../..` **exit 0 CURRENT**,
**955 710 bytes · 181 files · 2038 symbols · 1943 edges** — the lane's table
reproduced. **The attribution: +32 = 27 + 4 + 1**, where 4 are `blast.rs`'s
own outbound edges (`glob.rs`, `registry.rs`, `graph.rs`, `p:cargo:std`) and
1 is `arch/mod.rs → arch/blast.rs`, this card's own `pub mod blast;`.
**PURELY ADDITIVE, PROVED AS SETS AND NOT AS COUNTS**: keying every edge on
the FULL tuple `(from, to, kind, symbols, reexport, confidence)` — **32
added, 0 removed, 0 changed in place.** A count alone cannot prove this;
this can.

**3. THE FINDING THE FIX REVEALS — CONFIRMED, AND THE FRAMING IS RIGHT.**
On the regenerated graph, `arch --root ../..` exit **0**:
`edges=36 → 37  findings=3 → 4  drift_components=3 → 4`, `C-05
observed_deps=10 drift=D1`; `arch drift` exit **0**: `finding D1
D1:C-05->C-15 … file-edge app/src-tauri/src/lib.rs ->
app/src-tauri/src/dispatch/mod.rs`, exactly one file edge. **REVEAL, not
create, and now with its provenance**: `git log -S "pub mod dispatch;" --
app/src-tauri/src/lib.rs` names **`0fa83da` (T-126)**, and
`git log -S "C-15" -- docs/architecture/components/C-05-app.md` is **EMPTY**
— C-05 has never declared C-15 in its history. The dependency has been real
since T-126 and the declaration has never existed.

**4. `T-135-s3` — REPRODUCES IN DIRECTION, NOT IN MAGNITUDE. THIS IS F2.**

**5. THE DISCLOSURE NARROWING — THE CLAIMED PROTECTION HOLDS.** Arm E
deleted the surviving path-expression line and left the fixed half: **exit
101, `every_green_and_every_red_carries_what_the_gate_cannot_see` red.** A
future widening therefore **cannot** pass by deleting the survivor. The
honest boundary, measured rather than assumed: arm **E2** kept every
asserted substring and negated the sentence around it ("…and it is FALSE
that a cross-module PATH EXPRESSION with no `use` still carries none") —
**exit 0, 512 passed, nothing killed.** That is the residual limit of any
substring assertion over prose, not a defect in this one; both of the
lane's actual claims survive.

**6. THE DRILL ARMS — NO ARM WAS A COMPILE FAILURE, PROVED WITH A POSITIVE
CONTROL IN BOTH DIRECTIONS.** Every red arm shows `error[E…]` **= 0**,
exactly one `Compiling nputer-index`, **16 `test result:` lines and 16
`running N tests` headers summing 515**. Arm **G** — a deliberate
`let _deliberate: u32 = "this must not compile";` — gives `error[E…]` **= 1**
and **zero** result lines and **zero** headers. So a compile failure and a
kill are separable on two independent signals, and the lane's re-run stands.

### My own mutants — eight arms, producer only, never an assertion

Drilled at `/private/tmp/t135p` (detached, outside the repository),
`CARGO_TARGET_DIR=/private/tmp/t135p/target` — **named `target` because
`git check-ignore -v target/` matches `.gitignore:4` and `.vtarget/` matches
nothing (exit 1)**. Every arm: exactly one substitution asserted before the
write, `git diff` read back BEFORE the run, `cargo test --no-fail-fast`,
then `git checkout` and **sha256 over five producer files compared to a
baseline taken before the first arm — 5/5 identical on every arm, with
`git status --porcelain` empty (0 lines) on every arm.** Control,
unmutated: **exit 0, 512 passed / 0 failed / 3 ignored, 515 headers.**

| arm | producer mutation | exit | killed / 512 |
|---|---|---|---|
| A | the `mod` pair is never recorded | 101 | **6** |
| B | recorded at the QUEUE PUSH instead of the DECLARATION | 101 | **1** |
| C | a `mod` occurrence claims `reexport: false` | 101 | 2 |
| D | a `mod` occurrence carries the module's own name as a symbol | 101 | 2 |
| E | the disclosure drops the surviving path-expression half | 101 | 1 |
| E2 | the disclosure is negated, every asserted substring kept | **0** | **0** |
| F | `arch blast` drops the `kind != "import"` filter | 101 | 1 |
| G | deliberate type error (positive control for the guard) | 101 | n/a |

A kills the live pin, all three new `resolve::rust` bodies and both golden
bodies. **B kills exactly one body in 512** —
`a_declaration_of_an_already_visited_module_is_still_that_files_dependency`
— which independently reproduces the lane's M2. C and D kill the same two
golden bodies, which is what makes them narrowings rather than gaps.

**AND THE PUSH-SITE CLAIM IS NOW PROVED BY CONSTRUCTION, NOT ASSERTED.** I
built the push-site variant and indexed this repository with it:
`955710 bytes · 181 files · 2038 symbols · 1943 edges`, and the **edge sets
are SET-EQUAL on the full tuple** (`only push-site: 0, only shipped: 0`),
with `tests/common/mod.rs` reading **8 dependents under BOTH**. So plan §3's
stated discriminator does not discriminate and the lane's correction is
right. **A caution the lane's own phrasing invites (F8):** the two graph
FILES are **not** byte-identical — they differ at char 59 849, and the only
differing file entry is `resolve/rust.rs`'s own blake3 hash, i.e. **the
mutation's own footprint**. Compare edge sets, never bytes, when the
producer you mutated is itself indexed.

### Findings

**F2 — `T-135-s3` UNDERSTATES ITS OWN SUBJECT BY THREE TESTS, AND
MIS-ATTRIBUTES THE CAUSE. THE INTEGRATOR MUST READ THIS.** Both directions
reproduce, but not at the stated size. With the **committed** graph:
**973 / 973, exit 0** — as claimed. With the graph the lane actually
regenerated and reports one paragraph earlier (955 710 B / 181 files /
1943 edges): **9 failed / 964 passed**, `architecture-dogfood.test.ts`
**4** and `map-dogfood-render.test.tsx` **5** — not 6 / 967 and not 3+3.
**Diagnosed rather than guessed**: I rebuilt the graph the lane's figures
describe — the final tree minus `blast.rs` and its five edges — and ran the
suite against it: **exactly 6 failed / 967 passed, 3 and 3.** So T-135-s3's
numbers were measured at an intermediate tree in which `blast.rs` did not
yet exist, and reported as describing the final one. **The three extra
reds are not the D1 and do not move under either repair T-135-s3 offers:**

    architecture-dogfood.test.ts:1279   expected 181 to be 180
    map-dogfood-render.test.tsx         'C-07 … 35 files' to contain '34 files'
    map-dogfood-render.test.tsx         'committed graph · 181 files' to be '… 180 files'

They are `blast.rs` arriving as the 181st walked file and C-07's 35th.
An integrator who follows T-135-s3 to the letter declares `C-05 → C-15`,
reconciles the findings list and the relation table — **and still ships
three reds.** That is precisely the failure T-135-s3 exists to prevent,
occurring inside T-135-s3. **Actionable fix:** amend T-135-s3 with the
nine, the 4/5 split and the three file-count assertions, and re-derive at
the commit that carries the regenerated graph rather than at any earlier
tree. Its `Measured at 5547f02` line should also name the tree the numbers
came from, since `arch` at `5547f02` reads a graph with no `mod` edges and
cannot print `36 -> 37`.

**F1 — counter-case (b) is 16 of 17, not "every one of the 17".** A `mod`
occurrence carrying the module's own name would add a symbol to **16** of
the 17 merged pairs. The exception is `nputer-index/src/lib.rs → diff.rs`,
whose `symbols` already reads `["GraphDiff", "diff"]` — `pub use
diff::{diff, GraphDiff}` re-exports a function sharing the module's name,
and `EdgeAcc.symbols` is a `BTreeSet`, so the insert is a no-op there. **The
design conclusion is unaffected** (16 perturbations still break the purely
additive property, and arm D kills two bodies), but the notes state a count
one higher than the tree carries.

**F3 — THE TS HALF OF THE FLOOR RULE IS DISCLOSED IN THE NOTES AND NOWHERE A
READER OF THE COMMAND WILL EVER SEE IT. THIS BINDS HALF B.** Measured
through `arch blast` on §7's eight roots: the five Rust roots print
`build-target-root=yes`; **`app/src/main.tsx`, `app/vite.config.ts` and
`app/vitest.config.ts` print a bare `dependents=0` with no marker** — and
neither `render`'s eight `note` lines nor `blast.rs`'s module doc says that
TypeScript entry points are not computed. §7's floor rule ("a build-target
root is never at rung 0") therefore **cannot be bound on this command's
output as it stands**: three of its eight roots are indistinguishable from
genuinely unimported files, in the failure direction this card exists to
close. The lane names the gap in its correction 8, which is right; **the
disclosure belongs in the output too.** Not a Half A defect — §7 is Half B —
but Half B must close or state it before the rule binds.

**F4 — THE PLAN'S BYTE MODEL WAS 1.0 % LOW, NOT 13 %; the 4 917 measures a
different quantity.** The plan forecast **~161 bytes** per pretty-printed
`{from,to,kind}` edge and **~4 350** for 27. I isolated exactly those 27 by
taking the regenerated graph, dropping `blast.rs` and its five edges, and
restoring every file entry to its base version — 180 files, 2018 symbols,
1938 edges: **948 984 bytes, +4 394, 162.7 bytes per edge.** The emitter
model is exact, verified in both directions
(`json.dumps(g, indent=2) + "\n"` reproduces base **and** tip byte-for-byte,
944 590 = 944 590 and 955 710 = 955 710). The lane's **4 917** additionally
carries the growth of its own edited `resolve/*.rs` entries in `files[]`,
which the per-edge model never claimed to cover — the same reconstruction
with those two entries kept reads 949 782, and 949 507 sits between the two.
**The model was good; the comparison changed the quantity.**

**F5 — `arch blast` prints `source=committed graph` and one field that is
not from the graph.** `build_target_root` comes from
`cargo_target_roots(&canon, …)`, which reads `Cargo.toml` off the **working
tree**. Sharing one definition with the indexer is right and is criterion
3's own reasoning; the header and the eight notes should say that root-ness
is a working-tree fact, or a report whose graph is stale can mark roots that
its counts do not know about.

**F6 — `arch blast ""` answers `coverage=non-code`**, the cheapest class,
because an empty string names no walked extension. The card's own rule is
that an uninterpretable input is not a small one. One line in `is_slug`/
`classify`, or a usage refusal.

**F7 — `T-126-s3` item 4 says "without it a **fifth D1**".** Measured on the
regenerated graph there are **four findings, of which two are D1**
(`D1:C-05->C-15`, `D1:C-10->C-14`). It is the second D1 and the fourth
finding; the lane's own notes say `findings=3 -> 4` three paragraphs above.

**F8 — "byte-identical" for the push-site graph is true of the FIGURES and
false of the FILE.** Stated above with the measurement.

### Attacks that found nothing, named because they were run

`arch cycles --root ../..` exit **1** unpiped, **stdout 0 bytes, stderr 645
bytes**, all four `note` lines present and the narrowed disclosure naming
both halves; `cli.rs:386-392` confirms the green path writes `render` to
**stdout** and only the red path to stderr, so the lane's correction 11 is
right. All **13** component files carry `touch_slugs:` in the inline form
(`C-01` is `[]`, `app-shell` appears in four), so the registry's widened
refusal surface is safe on the live tree. `pkg-seam=p:@nputer/parser
(importers=28)` **does** print beside every one of `lib/parser`'s 25 files —
my first grep truncated it and the marker is there. `known_slugs` refuses
`app-shel` at exit **2** naming the eight declared slugs, and `arch blast`
with no inputs is exit **2**. Security sweep: **zero** manifest lines in the
range (no dependency added), no `unsafe`, no `Command::new`, no `env::var`,
no file open anywhere in `blast.rs`; `../../../../etc/passwd`, `../..`,
`a/../b` and `%00` never reach the filesystem — they are string-matched
against graph paths — and `-x` is exit 2. `self_graph_is_current` is
`#[ignore]`d and the suite reports **3 ignored**, so the gate really is the
only staleness signal; the new live pin
`a_mod_declaration_is_an_edge_in_this_repositorys_own_graph` **is** in the
default suite. Bare `cargo test --no-fail-fast` from `app/src-tauri`, exit
**0** from `$?` unpiped: **16 headers summing 515, 16 result lines totalling
512 passed / 0 failed / 3 ignored**, and 512 + 3 = 515 reconciles, so no body
vanished into an abort. `npm run typecheck` from `app/` is exit 1 `Missing
script` and the scripts are exactly `dev, build, preview, test, tauri`. All
four suggestion cards carry `status: suggested` and `suggested_by:`.

### The lane's thirteen corrections — twelve confirmed, one corrected

Confirmed independently: **ONE** golden fixture moves, not two (four
`expected-graph.json` files exist, and the `mixed` tree contains **no** `mod`
declaration anywhere — `grep` exit 1); **`.vtarget` is inverted in both §12
and the brief** (`git check-ignore -v .vtarget/` exit 1, `target/` matches
`.gitignore:4`); §3's multi-declarer trap (proved by construction above —
**eight** roots declare `mod common;`, my own parse found the same eight);
§3's paths are one component short; **the retraction was RIGHT** — at
`5547f02`, `arch/mod.rs:281` is `if edge.kind != "import" {`,
`cycles.rs:231-234` is the two-line note and `cycles.rs:303` is
`text.contains("T-126-s4")`, and `graph.ts:23` and `:346` hold too, so all
five line references in the plan are exact and the lane was right to retract
against its own edited tree; `touch_slugs:` was unread; `cargo_target_roots`
factored to one definition; the `pkg-seam` line; the card does not order the
lane to commit `graph.json`; `arch cycles`' stream behaviour; the closed
`status:` vocabulary; and the `executor.md` step 6 conflict, correctly
routed rather than decided. **Corrected: number 6, the byte forecast — F4.**

### What this brief got wrong

Its `.vtarget` warning is **right** and is the plan's error, not its own;
`app/src-tauri/.gitignore:3` is `/target/` as stated, though the rule that
actually protects a drill target at a worktree ROOT is the unanchored
`target/` at `.gitignore:4`. Its claim that both counter-cases hold is right
for (a) and one short for (b) (F1). Its statement of `T-135-s3` — "6 failed
/ 967 passed, three and three" — **is the lane's figure carried forward, and
it is wrong at the tip under review** (F2): the brief asked me to reproduce
both directions and the third direction is what found it. Its `arch cycles`
description is right and, as the lane says, only because this registry is
red. `CONVENTIONS.md:1328`'s unbuilt-drill figure is half-stale exactly as
the brief says — 14 across 6 files is right, **924** is the stale
denominator against today's 973.

**One process note, offered because this thread has twice made it the most
valuable thing in a merge.** F2 exists because a figure was carried from an
earlier tree into a paragraph about a later one, and F4 because a
measurement changed quantity between the forecast and the check. Both are
the habit `STATE.md` records as this session's best process finding, and
both were invisible to every gate. **The nine-versus-six was found only by
running the suite a third time, against a tree nobody asked for.**
