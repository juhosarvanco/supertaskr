---
id: T-140-s1
title: The pane should receive the component picture and pull file detail only for what is on screen — the shape T-140 measured, and the one it could not build inside its own fence
feature: F-06
milestone: 4
priority: 2
size: L
status: verifying
blocked_by: [T-135]
touches: [crate-index, app-map, app-shell]
suggested_by: executor claude-opus-5 @T-140
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

**PROMOTED at the rulings sitting (2026-08-30): @human ruled the
payload shape in this card's favour — rollup at rest, file detail
pulled for what is on screen.** The density measurements below are
this card's acceptance evidence, and the four numbered steps under
"What this card would do" are its criteria, each read as a SHALL. The
same ruling REJECTED `T-151` (docs/tasks/rejected/) by that card's own
framing; nothing here inherits its cap-raise. `blocked_by: [T-135]`
because `crate-index` is held by T-135's building status; the fence
question is re-derived at dispatch, not quoted from here.

**This is `T-140`'s criterion 6 — "pin the RELATION, that the shipped
payload does not grow with file count" — recorded as NOT BUILT and
routed, because the relation cannot be pinned until the shape that makes
it true ships, and that shape needs a decision `T-140` reserves to
@human in its own last line: *"how much of a codebase the map shows at
rest is a product decision about what the pane is for."***

## What T-140 measured, at `a533a4d`

- The undroppable floor — files plus `import` edges, which
  `emit::apply_budget` never drops — is **213 712 bytes over 189 files,
  1 131 bytes/file**, so at this tree's density the emit budget stops
  degrading gracefully at **about 919 files**. Both figures are now
  PRINTED by `index --check`'s floor line rather than written down; run
  the gate rather than quoting this paragraph.
- The floor is **linear in file count**, pinned as a relation by
  `crates/nputer-index/tests/budget.rs`'s
  `the_undroppable_floor_grows_with_the_file_count`. **That body is this
  card's discriminator and is expected to RED when this card lands** —
  retire it here, and its red is the evidence the shape changed rather
  than a constant having moved.
- The **component rollup is flat**: fifteen components with their
  `depends_on` serialize to about 2 KB against the graph's 1 021 562, and
  fifteen is fifteen whether the repo holds 189 files or 20 000.

## The finding T-140's own criterion 2 turned up, and it changes the size

`T-140` hoped the pane "already draws only components at rest", in which
case "the rollup is sufficient by construction". **Measured, it is not**,
and the reason is worth carrying:

- At rest the pane renders component nodes and component edges — no
  symbols. `symbols`, `loc`, `hash` and `unresolved` are read ONLY by
  `map-zoom.ts`'s `fileDetail` and `MapPanel`'s file section, i.e. only
  after a drill-in. So the SYMBOL half of the payload is already
  drill-only, and the emitter's budget already protects it.
- But the component picture is DERIVED IN THE PANE, from the full file
  list and the file-level `import` edges: `derive.ts` matches every
  `graph.files[].path` against the registry's globs and rolls
  `graph.edges` up into component edges. That derivation needs exactly
  the skeleton — which is exactly the part that is linear in file count.

**So the rollup is not sufficient by construction; it is sufficient only
if the file→component join moves.** That is the whole design question,
and it is the one that needs the ruling.

## What already exists, and it is more than half

`nputer-index`'s `arch` module ALREADY computes the reality-side join in
Rust — file → component mapping, observed component edges with their
counts, the `{confirmed, planned, undeclared}` relations, and findings
D1–D5 — and its own module doc records the measurement that it
reproduces the TypeScript engine on this repo's live tree row for row.
ADR-015 keeps the status/provenance/task join in TypeScript, and nothing
here proposes moving that: the rollup this card wants is the REALITY
side, which is the side Rust already has.

What is missing is a channel. `docs_watch.rs` broadcasts the whole docs
tree on every change and cannot express "detail for what is on screen";
`T-140` ruled at `MAX_FILE_BYTES`'s own definition site that the graph
LEAVES that pipeline rather than getting a cap of its own, with the
reasons written there.

## What this card would do

1. Emit (or serve) the component-level rollup — components, their
   observed and declared edges with counts, and per-component file
   COUNTS — as the map's resting payload.
2. Give file-level detail a pull: a request naming what the user opened,
   answered with that component's files, or that file's symbols and
   edges.
3. Retire `the_undroppable_floor_grows_with_the_file_count` and pin the
   relation the other way round — the shipped resting payload does not
   grow with the file count — which is the property that distinguishes
   this from every constant anyone could raise.
4. Keep the honest degradation `T-140` built (`map-too-large`) as the
   backstop for whatever limit the new channel does carry.

## What it needs first, and it is not code

**@human's look at the shape.** How much of a codebase the map shows at
rest is a product decision, and every option here is a different answer
to it: a rollup-at-rest map is a different pane from today's, and
`docs/rooms/map-sequencing.md` shows this feature's scope has been
@human's before.

**And `T-151` is a different card, not a smaller version of this one.**
It raises the budget by at most 8 575 bytes — about seven files at the
floor re-derived here — and its own honest framing already says so.

Standing triage 2026-08-30 (architect seat): PARKED — NOT RULED, because this one is not triage's to rule. docs/STATE.md's "@human's items" names `T-140-s1` (the payload shape, with the verifier's density numbers attached) as awaiting @human, and a triage seat that promoted or declined it would be spending a decision that was explicitly reserved. The finding itself is not in doubt: it is the shape T-140 MEASURED and could not build inside its own fence, and the measurement travels with the card.
RESURFACES: @human rules the payload shape. The ruling is already queued on STATE's @human list, so the event is checkable by whoever next reads that list rather than by whoever remembers this card. IF the ruling lands in favour of the component-picture-plus-on-screen-detail shape THEN this promotes to a planned card carrying the density numbers as its acceptance evidence; IF it does not, this is DECLINED and says so with the ruling named.

## Implementation notes (executor, `claude-opus-5`, lane `task/T-140-s1-rollup`)

Base `ed42c44`. Every figure below carries its derive command or its ref;
every suite exit is read UNPIPED from `$?`.

### The shape as built

**One channel, two commands, and the graph never crosses it.**
`nputer-index` gains `src/rollup.rs`; the app gains `src/arch_cmd.rs` and
two Tauri commands. `arch_rollup` (zero-argument, the
`index_repo`/`repo_churn`/`dispatch_lanes` pattern) reads
`docs/architecture/graph.json` **from disk, Rust-side**, joins it against
the registry through the `arch` module that already computed this join,
and returns [`Rollup`]. `arch_detail(target)` answers one named target.
**That the file is read rather than delivered is what removes the wall**:
`graph.json` can be any size the indexer wrote and the pane still gets its
picture, because what crosses IPC is the rollup.

**At rest** the pane receives: every component with its file COUNT (plus
the synthetic `unmapped` node with its own count), every observed and
declared component edge with its `relation`, `declared` flag and observed
count, the D1/D3/D5 findings whole, and D2/D4 as ONE TALLY EACH with a
`count`. Nothing keyed by a file travels — asserted by name in
`rollup::tests::the_rollup_carries_counts_and_edges_and_no_file_path_anywhere`,
which checks every path in its fixture against the serialized document, so
a field added later that carries one reds rather than silently restoring
the linear payload. **Flat BY CONSTRUCTION, not by measurement**:
`components` is bounded by the registry, `edges` by its square, D1/D3/D5
by the same; the two rules that ARE file-keyed collapse to counts, and
`RollupFinding`'s doc comment states that a future file-keyed rule belongs
in that group.

**On a drill** the pane pulls one [`Detail`]. `c:<component-id>` answers
with that component's file paths (clipped at `MAX_DETAIL_FILES = 500`,
with the honest `total` and a `truncated` flag) plus the import edges with
both ends inside it; `c:unmapped` answers with the D2 body;
`f:<graph file id>` answers with that file's symbols and **every graph
edge, any kind, either direction, whose endpoint is the file or one of its
symbols**, plus the packages and neighbour paths those edges name.
Anything else is `Detail::Unknown { target }` — the REFUSAL, an answer and
not an error, because an empty list would read as "that component has no
files".

**The answer is a SLICE OF THE GRAPH rather than a summary of it, and
that is the design decision worth arguing with.** `rollup.ts`'s
`partialGraph` assembles pulled answers into one `ArchGraph` **through
`parseGraph`** — the same hardened collect-don't-throw reader the
committed file goes through — so `expansionFor`, `intraEdges`,
`fileDetail` and `searchMap` run over it UNCHANGED. One implementation of
"what a file's panel shows", fed from two sources, instead of a second
rollup-shaped renderer for every screen. Endpoints the pane has not pulled
get stub entries (`loc: 0`, empty kind) so the edges the pull was made for
survive referential integrity; a pulled file always overwrites a stub.

**ADR-015 IS NOT REOPENED.** What moved is the reality side, which is the
side the crate already had. The status rollup, the provenance rollup, the
task join, the `component:` field, ADR-016's marks and the `non_code:` D3
downgrade are all computed in `deriveFromRollup` over the same registry
records and task records `deriveDeclared` uses, through the same functions
— `tasksForComponent`, `rollupStatus`, `rollupProvenance`,
`isDriftFinding`. There is one implementation of each and this path calls
it (pinned: "the status and provenance join stays TypeScript's").

**Precedence, and the fallback that keeps the browser honest.** `rollup`
wins over `graph` in `DeriveInputs`. In the shipped app the channel
answers and the resting picture is the rollup's; in a served browser
bundle there is no `invoke`, `rollup-source.ts` answers `notTauri`, and
the pane derives from `graphContent` exactly as before — which is why the
whole existing suite is unmoved. `MapView` never mixes the two: it reads
the committed graph when it has one and the assembled slice otherwise,
because a half-committed, half-pulled graph would attribute file edges
against two different file sets.

**One new constant, and it is not the one T-140 refused.**
`MAX_DETAIL_FILES = 500` caps ONE drill answer's row list. It cannot make
a project unmappable — the map at rest is the rollup and the rollup has no
list to cap — and it degrades honestly rather than refusing (`total`
travels beside the clipped slice). The distinction from the cap `T-140`
refused and `T-151` reserves to @human is written at its definition site.
`MAX_TARGET_CHARS = 512` bounds the pull's argument, because a miss echoes
it back. **No limit VALUE moved**: `max_graph_bytes` and `MAX_FILE_BYTES`
are byte-identical to their base.

### Criterion by criterion — each read as a SHALL

- **1 · THE ROLLUP IS THE MAP'S RESTING PAYLOAD — MET.** Above.
  `deriveArchitecture` accepts it, `MapView` prefers it, and the resting
  model it produces has `files: []` on every component, an empty
  `fileComponent`, an empty `unmappedFiles`, and exact `fileCount` /
  `indexedFileCount` / `unmappedCount` — asserted together in
  `app/test/map-rollup.test.ts` ("derives the whole map from counts, with
  every file list empty").
- **2 · FILE DETAIL HAS A PULL — MET, both shapes.** `arch_detail` names
  what the user opened; `MapView` fires it at the three places that open
  something (select, expand, open file). Happy path pinned in Rust
  (`the_pull_answers_a_component_a_file_and_the_unclaimed_group`), at the
  channel (`the_channel_serves_the_rollup_at_rest_and_the_detail_on_a_pull`)
  and at the pane (`rebuilds one file's neighbourhood well enough for the
  T2 panel`). Refusal pinned at all three
  (`the_pull_refuses_by_name_rather_than_answering_emptily`,
  `the_pull_refuses_an_unknown_target_by_name_over_a_real_project`, "a
  refusal is an ANSWER and never an empty list"), each with a POSITIVE
  CONTROL in the same body so the refusal is about the target and not
  about the fixture.
- **3 · THE PIN RETIRED AND THE RELATION PINNED THE OTHER WAY — MET.**
  `the_undroppable_floor_grows_with_the_file_count` is DELETED from
  `crates/nputer-index/tests/budget.rs` and replaced, in the same file and
  the same style, by `the_resting_rollup_does_not_grow_with_the_file_count`
  — synthetic trees, no project size asserted, a relation between two
  trees measured in one run. **The retired body's own measurement is kept
  as this one's positive control**: the graph floor MUST still track the
  file count over the same fixture pair, or "1.0x" would be a claim about
  the fixture rather than about the payload. Measured (by flipping the
  bound to force the message, then restoring by sha256 — see the drills):

      resting rollup   464 -> 464 bytes   1.000x
      graph floor                          3.61x
      file count        23 ->  83 files    3.61x

  Two further controls in the same body: the fixture pair really differs
  (>3x), and both rollups are a real picture (two components and a
  `confirmed` edge) rather than an empty document that would be trivially
  flat.
- **4 · `map-too-large` KEPT — MET, unchanged.** Its trigger
  (`derived.indexNotRun && graphSkip === "oversize"`), its `data-testid`,
  its sentence and its two pinning bodies in `map-shell-dom.test.tsx` and
  `map-view-dom.test.tsx` are byte-identical to their base. The collector
  branch it depends on is deliberately untouched — removing it is
  `T-140-s4`, and it is filed rather than done because it makes this
  criterion unsatisfiable without inventing the limit value `T-151`
  reserves to @human.

### Refused, and disclosed

- **No graph-specific cap, and no move to `MAX_FILE_BYTES` or
  `max_graph_bytes`.** The read in `arch_cmd.rs` is uncapped ON PURPOSE,
  with the reason at the site: the file is the app's own committed
  artifact, `emit::write_graph` has read it whole with no cap since T-009
  to do its byte-compare, and a cap there would reinstate one layer down
  exactly the cliff this card removes.
- **`is_collected_docs_path` untouched** — `T-140-s4`, with the argument.
- **Search is the one capability the resting payload gives up** —
  `T-140-s6`, disclosed rather than discovered. `searchMap` matches
  against `components[].files`, which are empty until a component is
  pulled, so at rest file search reaches only what has been opened.
  Component search is unaffected. Two fixes were available and both are a
  decision rather than a lane's; the card names them.

### The suites, at `230986b` — every exit read UNPIPED from `$?`

    cargo test --no-fail-fast (app/src-tauri)  EXIT 0
      560 passed, 0 failed, 4 ignored — SUMMED from the 18 `test result:`
      lines and cross-checked against the `running N tests` headers
      (564 = 560 + 4)
    lib/parser  npm run build   EXIT 0
                npx vitest run  EXIT 0   336 passed (16 files)
                npx tsc --noEmit EXIT 0
    app         npx tsc          EXIT 0
                npx vite build   EXIT 0
                npm test         EXIT 0   1047 passed (49 files)
    app         npm run build    EXIT 2   ** INHERITED RED — see below **
    tools/e2e   NPUTER_E2E_PORT=4173 npm test   EXIT 1
                318 passed / 3 failed — all three `docs-input-gate`,
                ** INHERITED RED — see below **
    tools/e2e   npm run lint:docs               EXIT 1  ** INHERITED **
    tools/e2e   NPUTER_BOOT_PORT=4183 npm run boot:check  EXIT 0

Ports: `lsof -nP -iTCP:<port> -sTCP:LISTEN` read at ZERO ROWS for 4173 and
4183 immediately before binding.

### Two inherited reds, both PROVEN at the base and both outside this fence

1. **`npm run build` from `app/` exits 2** on two `noUnusedLocals` errors
   in `app/test/review-badge.test.tsx`. Measured at `ed42c44` with this
   lane's work stashed: same two lines, same exit. Because the three
   commands are `&&`-chained, `vite build` never runs — so this lane ran
   `npx tsc` (EXIT 0) and `npx vite build` (EXIT 0) separately to produce
   `app/dist` for the suite. **Filed as `T-140-s5` with the measurement;
   the file is `app-board`'s and is in no current fence.**
2. **`docs-gate` exits 1** because `docs/STATE.md` is STALE against
   `docs/checkpoints/2026-08-30-T-135.md` (record committed 16:26:51,
   STATE last written 16:15:21 — `git log -1 --date=iso` on each). Same
   exit at the base with docs checked out to `ed42c44`. That is
   docs-protocol rule 4, the INTEGRATOR's step 2, and `docs/STATE.md` is
   not in this fence. It is the sole cause of the `lint:docs` red and of
   all three failing e2e specs. Not filed as a card: the protocol already
   assigns it and the next checkpoint discharges it.

### The graph verdict — REPORTED, not regenerated (the regen is the integrator's)

`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri/` at `230986b`, EXIT **1** (STALE, as expected — this lane
adds five indexed files and touches fourteen):

    committed:   1007622 bytes · 193 files · 2087 symbols · 2163 edges
    fresh index: 1038234 bytes · 198 files · 2096 symbols · 2293 edges
    budget:      1038234 of 1040000 bytes (99.8%) - 1766 left
    floor:       228238 of 1040000 (21.9%) - 1153 bytes/file, so at this
                 tree's density the budget stops degrading gracefully at
                 about 902 files

**THIS LANE MOVES THE GRAPH +30 612 BYTES AND SPENDS 94.6% OF THE
HEADROOM IT INHERITED** (32 378 at the committed file). The headroom alarm
is LIVE — 1766 bytes against the 14 914-byte tripwire — and
`stats.truncated_files` goes **1 -> 2**: `app/src-tauri/src/agent/
runner.rs` loses its 71 symbols to the budget. Diff: files +5 -0 ~14,
edges +131 -1.

**Read this as the hazard `docs/STATE.md` already names, arriving.** The
next code lane of any size crosses, and crossing is silent by design —
the emitter drops symbol arrays and sets `truncated_symbols`. What this
card changes is WHERE the loss lands: the map's resting picture no longer
reads symbols at all, so an over-budget graph now degrades the DRILL
(a pulled file's symbol list) rather than the map. It does not move the
budget, which is `T-151`'s and @human's, and a lane may measure and
recommend, never set.

### Poison drill — 13 of 13 mutants KILLED, every restoration proven by sha256

Detached scratch worktree at `/Users/ujju/np140` (SHORT root), cut at
`230986b`, with `CARGO_TARGET_DIR=/Users/ujju/np140/target` — inside
itself, per the T-111-s10 correction. Every mutation is ONE-SIDED (the
PRODUCER, never the assertion), the mutated TEXT was read back with
`git diff --unified=0` before each run, and each path was restored with
BOTH sides named (`git restore --source=HEAD --staged --worktree`) and
verified by sha256 against `git show HEAD:`. The worktree was `git status
--short` CLEAN after each half and was removed at the end.

    M1  the D4 tally becomes one finding per path   -> the_two_file_keyed_findings…
    M2  the rollup gains one entry per FILE          -> the_resting_rollup_does_not_grow…
                                                        + the_rollup_carries_counts…
    M3  the component arm of the pull stops answering-> the_pull_answers_a_component…
                                                        + the_channel_serves_the_rollup…
    M4  the refusal answers emptily by name          -> the_pull_refuses_by_name…
                                                        + the_pull_refuses_an_unknown_target…
    M5  the display cap stops capping                -> a_component_over_the_display_cap…
    M6  the symlink refusal is lifted                -> a_symlinked_architecture_directory…
    M7  the target length bound stops bounding       -> an_over_long_target_is_out_of_bounds…
    M8  the boundary accepts a foreign schema        -> "refuses a schema it does not understand"
    M9  the resting model loses its counts           -> "derives the whole map from counts"
    M10 the D2 sentence reads the LIST not the count -> "a count is never rendered as a stated zero"
    M11 the slice stops stubbing symbol endpoints    -> "rebuilds one file's neighbourhood"
    M12 a refusal folds into a channel failure       -> "a refusal is an ANSWER"
    M13 `arch_detail` leaves the Rust handler        -> "Rust exposes exactly seventeen commands"

**M2 is the one that matters most**: it makes the resting payload linear
in file count, and the body that replaced the retired pin is what catches
it. The retired pin's own red is not re-derivable after its deletion, so
M2 is the standing evidence in its place.

### The dogfood suites and the census

`architecture-dogfood.test.ts` and `map-dogfood-render.test.tsx` both pass
UNCHANGED except for the `observedCount: 1` now carried beside each D1
row's `fileEdges` — the count travels beside the list here because in the
rollup mode it travels instead of it, and pinning both in one row is what
checks that they AGREE. No component was declared, so the third
live-registry fixture (`lib/parser/test/smoke.test.ts`) is untouched. The
IPC census moved by name in both directions: the frontend reaches
**thirteen** commands and Rust exposes **seventeen**, and `acl_pin.rs`'s
remote-denial roster gained both names while `EXPECTED_GRANTS` is a 0-line
diff — an app command is not a grant (ADR-012, applied rather than
reopened).

### Blast radius (ADVISORY, ADR-018) — `arch blast <slug> --root ../..`

    crate-index  components=C-07             files=36  coverage=measured  max_dependents=13
    app-map      components=C-12             files=34  coverage=measured  max_dependents=20
    app-shell    components=C-05,C-10,C-16   files=41  coverage=measured  max_dependents=30

All three print `incomplete stats.truncated_files=1 / truncated_symbols=true`
over the committed graph, so every count is a FLOOR. The L row governs the
ceremony regardless: executor -> verifier -> integrator.

### Suggestions filed

`T-140-s4` (the graph leaves the docs collector — needs the limit ruling
first), `T-140-s5` (the inherited `app/` build red), `T-140-s6` (search
cannot reach an unopened file once the pane rests on the rollup).
