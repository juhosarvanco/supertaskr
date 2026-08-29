---
id: T-140
title: The graph's floor is 802 bytes per file, so the map stops working at about a thousand files — nputer cannot currently be pointed at a real codebase
feature: F-06
milestone: 5
priority: 6
size: L
status: verifying
blocked_by: [T-139]
touches: [crate-index, app-map, app-shell]
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5
verified_by:
review:
---

**@human, 2026-08-26, on being shown that T-139 raised the budget**:
*"If the graph is already starting to have too much data, then it's not
going to work for bigger projects. How do we fix this? 1MB can't be the
limit."*

**That is correct, and the arithmetic is worse than "the limit is tight".
This card exists so `T-139`'s raise is not mistaken for an answer.**

## The floor, measured

`emit::apply_budget` drops symbol arrays when the graph exceeds its budget
and **never drops files or `import` edges**. So there is a floor the budget
cannot go below, and at this repository's shape it is **802 bytes per
file** (146 788 bytes for 183 files, derived by serializing files-without-
symbols plus import edges alone).

| project | skeleton ALONE | against the 1 MiB collector cap |
|---|---|---|
| this repo, 183 files | 147 KB | 0.14× |
| **1 000 files** | **802 KB** | **0.8× — at the wall** |
| 5 000 files | 4.0 MB | **3.8× over** |
| 20 000 files | 16 MB | **15× over** |

**So the graceful degradation stops being graceful at roughly a thousand
files.** Past that the part that *cannot* be dropped is itself over the
cap, and the collector's response to over-cap is not truncation — it is
`SkipReason::Oversize` and `continue`. **The pane stops receiving a graph
at all.**

`T-139` raised the emit budget from 1 000 000 to 1 040 000 on a correct
argument and bought this repository a few weeks. **It does not move this
number, because the binding constraint is the skeleton and the skeleton is
linear in file count.**

## Three measurements from T-139 that all point the same way

1. **THE LIMIT IS NOT PROTECTING PERFORMANCE.** Cost is **linear to 25 MB
   with no knee**, and loading today's 989 KB graph takes **3.7 ms** total.
   Nothing is slow at a megabyte. **A cap defending against slowness would
   sit somewhere else entirely, or nowhere.**
2. **THE GRAPH IS TRAVELLING THROUGH THE DOCUMENTS PIPELINE.** It is
   subject to `MAX_FILE_BYTES` only because it lives under `docs/` and is
   collected by `is_collected_docs_path`'s `.json`-under-`docs/architecture/`
   branch. **That pipeline is built for markdown a human wrote**, and its
   per-file cap is sized for prose. Measured: the real payload is
   **372 files / 7.5 MB, of which `graph.json` is 13.7% — 86% is markdown.**
   The graph inherited a constraint designed for something else.
3. **65% OF THE LOAD COST IS THE DELIVERY MECHANISM, NOT THE DATA.**
   `emit_js_script` splices the serialized JSON **verbatim into a JS source
   string** which the webview `eval`s, so it is parsed by the general JS
   parser rather than the JSON fast path — **1.76 ms to eval against
   0.92 ms to `JSON.parse` the same bytes.** (`T-139-s2`.)

## The shape of the fix, measured rather than asserted

**The pane should not receive the whole graph.** It should receive the
component-level picture, and pull file-level detail only for what the user
is actually looking at.

**Measured at this ref**: the component rollup — every component and its
`depends_on` — is **720 bytes against the graph's 989 181. About 1 370×
smaller, and FLAT in project size**: thirteen components whether the repo
holds 183 files or 20 000. The per-file detail is the part that scales,
and it is exactly the part a pane needs only for what is on screen.

**That is the only shape on the table that is not linear in file count.**
Raising a constant, compressing the format, or interning path strings all
buy a constant factor and leave the growth curve alone.

## Acceptance criteria

- **THE FLOOR SHALL BE RE-DERIVED AT THE EXECUTING REF, NOT INHERITED.**
  802 bytes per file is this repository's shape today. **Derive it, and
  derive the file count at which the skeleton crosses the collector cap** —
  that number is the card's whole subject and it moves as the format does.
- **THE PANE'S ACTUAL NEED SHALL BE ESTABLISHED BEFORE ANYTHING IS BUILT.**
  What does the map render without a user drilling in? IF it already draws
  only components at rest THEN the rollup is sufficient by construction and
  this card is smaller than it looks. **Measure what the pane reads, do not
  assume it needs what it is sent.**
- **THE DEGRADATION SHALL BECOME HONEST AT SCALE.** Today an over-cap graph
  is **dropped whole** and the pane's own truncation rendering
  (`MapView.tsx:969`) never fires, because the payload never arrives.
  **Whatever ships, a project too large to map fully SHALL say so on
  screen** — silence is the current behaviour and it is the defect.
- **THE DOCUMENTS PIPELINE SHALL BE RULED ON, NOT WORKED AROUND.** Either
  the graph leaves it and gets a channel with its own limit, or the `.json`
  branch gets a graph-specific cap — `T-139`'s criterion 4 already names
  the second and `T-139-s3` holds the general form. **Say which and why;
  do not raise `MAX_FILE_BYTES`, which governs all 372 collected files and
  whose largest markdown is 145 078 bytes.**
- **THE `eval` CHANNEL SHALL BE MEASURED AGAIN AT THE NEW SHAPE.** If the
  payload becomes kilobytes, `T-139-s2`'s 65% becomes irrelevant and the
  finding should be closed with that measurement rather than left open.
  IF it stays large THEN the channel is the next constraint and this card
  SHALL say so.
- **NO PIN SHALL ENCODE A PROJECT SIZE.** A body asserting "works to N
  files" rots the day the format changes. **Pin the RELATION** — that the
  shipped payload does not grow with file count — which is the property
  that actually distinguishes the fix from the status quo.
- **`T-139`'s RAISE SHALL NOT BE RE-LITIGATED.** It was correct on its own
  argument and its reasons are written at their definition sites. This card
  records that it bought time; it does not reverse it.

Verification: headless — bare `cargo test --no-fail-fast` from
`app/src-tauri`, exit **unpiped from `$?`**, total SUMMED from the
`test result:` lines and cross-checked against the `running N tests`
headers. `npm test` from `app/` (the pane is C-12's, the collector C-10's).
**Build `lib/parser` first, then `npm run build` from `app/`.**
**POISON DRILL on every new assertion**, producer mutated and never the
assertion, read back with `git diff` before its run, restores per-path by
sha256, detached worktree **OUTSIDE the repository at a SHORT path** with
its `CARGO_TARGET_DIR` named `target` — and note `walk.rs:58` hard-skips
only `.git` and `node_modules`, so `target/` is excluded by the root
`.gitignore` and that protection is a line anyone can edit (`T-111-s10`,
as corrected by `T-139`). **Uniqueness of kill SHALL be measured against
the whole suite.** **A benchmark is not an assertion** — if this card
measures, say so and state why the measurement is not drilled, as `T-139`
did. **Ask GRAPH REGEN rather than predicting it and ask AGAIN after any
write.** **Ports are machine-wide while rule 4 partitions by CHECKOUT.**
**This is an L card and owes a planning pass before any code.**
**@human: one look at the shape**, because how much of a codebase the map
shows at rest is a product decision about what the pane is for.

## Planning pass (executor, `claude-opus-5`, lane `task/T-140-file-ceiling`)

**The card owes a planning pass before any code and no separate planning
session was dispatched, so this is it, run FIRST and recorded before the
first edit.** Criteria 1, 2 and 5 are measurements, and the card makes
them prerequisites rather than deliverables — "the pane's actual need
SHALL be established BEFORE anything is built". They were, and one of the
three answers changed what the rest of this card could honestly be.

### 1. The floor, re-derived at `a533a4d` — the card's 802 is stale

    committed graph.json    1,021,562 bytes · 189 files · 2,157 symbols · 2,111 edges
                            (722 import, 585 call, 804 type_ref) · 24 packages
    undroppable floor         213,712 bytes  =  1,131 bytes/file
    against max_graph_bytes 1,040,000  ->  ~919 files
    against MAX_FILE_BYTES  1,048,576  ->  ~927 files

The card inherited **802 bytes/file (146,788 over 183 files) and ~1,000
files**. Re-derived through the emitter's own floor — `apply_budget` at an
unmeetable budget, which is what an oversized project actually ships —
the per-file cost is **41% higher** and the ceiling is **~919, not
~1,000**. Cross-checked two ways that agree to the byte: a Rust run of
`emit::apply_budget` and a JS reconstruction whose full-document
re-serialization is byte-identical to the committed file (1,021,562 both),
which is what makes the JS resample below trustworthy.

**Linearity, resampled over prefixes of the live file list** (JS, same
serializer shape): 24 files → 27,558 · 48 → 51,564 · 96 → 97,734 · 189 →
213,603. File count ×7.875, floor ×7.75.

**The figure now has a keeper.** `index --check` prints a `floor:` line
deriving the floor, the per-file cost and the implied file count at every
run, so no document has to carry them — which is the defect this card's
own opening figure demonstrated.

### 2. What the pane reads — and the hoped-for shortcut is NOT available

The card hoped the pane "already draws only components at rest", in which
case "the rollup is sufficient by construction and this card is smaller
than it looks". **Measured, half of that is true and the load-bearing
half is not:**

- **Symbols are already drill-only.** `symbols`, `loc`, `hash` and
  `unresolved` are read by exactly two places — `map-zoom.ts`'s
  `fileDetail` and `MapPanel`'s file section — both reached only by
  opening a file (T2). Nothing at rest touches them.
- **But the component picture is DERIVED IN THE PANE from the skeleton.**
  `derive.ts` matches every `graph.files[].path` against the registry's
  globs and rolls the file-level `import` edges up into component edges.
  So what the resting render needs from graph.json is precisely the file
  list plus the import edges — which is precisely the part that is linear
  in file count and that truncation can never reclaim.

**The component rollup is flat, as the card says** — 15 components with
their `depends_on` serialize to ~2,056 bytes against 1,021,562, ~497×
smaller and constant in project size (the card's 720 bytes / 13
components has moved with the registry). **It is not sufficient by
construction**, because the join that produces it lives in the pane. That
is the finding, and it is what makes criterion 6 a shape change rather
than a payload swap — routed as `T-140-s1`.

**What is NOT missing is the join itself.** `nputer-index`'s `arch`
module already computes the reality-side join in Rust — file→component
mapping, observed component edges with counts, relations, findings D1–D5 —
and records the measurement that it reproduces the TypeScript engine on
this repo's live tree row for row. What is missing is a channel.

### 5. The `eval` channel, re-measured at this ref

Both harnesses re-run on Darwin 25.6.0 at this lane's tip. The payload
did NOT become kilobytes, so the card's second branch applies and this
card says so: **the channel is the next constraint.**

    LIVE 1,021,562 bytes, JSC (the engine a macOS WKWebView runs):
      S2b  eval of tauri's real emit script   1.98 ms
      S2b' JSON.parse of the same bytes       1.04 ms      1.9x
      webview total (eval + parseGraph)       3.22 ms      eval is 61%
    Rust half: S1 collect 6,834 us · S2a encode 4,103 us · amplification 1.1117x

`T-139-s2`'s finding **reproduces** — the delivery mechanism, not the
data, is the majority of what the webview waits on. It stays open and
STATE already records that it wants a room; nothing here re-opens it.

**And the bench prints the cliff this card is about.** At a synthetic
1,499,011-byte graph the collector DROPS the file (`SkipReason::Oversize`)
and the payload column goes to **0** — the state criterion 3 says must
never be silent.

**One inherited census corrected in passing** (`docs_watch.rs` carried
T-139's, at T-139's ref): the collected set is now **421 files /
8,215,112 content bytes, graph.json 12.4%**, not 372 / 7.5 MB / 13.7%.
The argument is unchanged and stronger; the note is written beside the
old figures rather than replacing them.

## Implementation notes (executor, `claude-opus-5`, lane `task/T-140-file-ceiling`)

### Criterion by criterion

- **1 · THE FLOOR RE-DERIVED — MET.** Above, plus `emit::floor_len` and
  `check::floor_line`, so the figure is derived at every gate run instead
  of transcribed. `floor_len` asks `apply_budget` for the document rather
  than recomputing a floor beside it (one implementation, not two).
- **2 · THE PANE'S NEED ESTABLISHED — MET, and it answered NO.** Above.
  The card is not smaller than it looks; it is a shape change.
- **3 · THE DEGRADATION MADE HONEST — MET, and this was the defect.**
  The collector already reported `SkipReason::Oversize` on graph.json and
  the shell already carried the row (`skipped-files-badge`); the map — the
  one pane useless without that file — was never handed it. So the state
  this whole card is about rendered as **"index not run"**, over a project
  whose index had run and written a correct file, under a **Run index**
  button whose only possible effect is to write the same file again. It
  now says *too large to map*, names the cause, and withdraws the offer.
  `MapView.tsx:969`'s truncation note is a DIFFERENT state (over
  `max_graph_bytes`, symbols thinned) and still fires on its own trigger.
- **4 · THE DOCUMENTS PIPELINE RULED ON — MET, as a ruling.** Written at
  `MAX_FILE_BYTES`'s own definition site, T-139's pattern: **the graph
  LEAVES the pipeline; it does not get a cap of its own**, with three
  reasons (a cap only moves a cliff whose driver is linear; a broadcast
  cannot express "detail for what is on screen"; the measured cost is the
  channel's SHAPE, not its size) and an explicit refusal of the interim.
  `MAX_FILE_BYTES` is unchanged. Building the channel is `T-140-s1`.
- **5 · THE `eval` CHANNEL RE-MEASURED — MET.** Above; second branch.
- **6 · PIN THE RELATION — NOT BUILT, ROUTED as `T-140-s1`.** The
  relation "the shipped payload does not grow with file count" cannot be
  pinned while the shape that makes it true does not ship, and that shape
  needs the product decision this card's own last line reserves to
  @human. What IS pinned is the relation that is TRUE and is the defect:
  `the_undroppable_floor_grows_with_the_file_count` in
  `crates/nputer-index/tests/budget.rs`, asserting NO project size —
  only a ratio between two trees measured in the same run. **It is the
  discriminator for the fix and is expected to red when the fix lands.**
- **7 · T-139's RAISE NOT RE-LITIGATED — HELD.** `max_graph_bytes` and
  `MAX_FILE_BYTES` both unchanged, and the added text at both sites
  extends T-139's argument rather than reversing it.

### Refused

**`T-151`-shaped work was not done and no limit VALUE moved.** The budget
number is @human's (`T-151`), and a lane may measure and recommend, never
set. Two places where the pull was real and was refused: an interim
graph-specific cap on the `.json` branch (criterion 4's second shape)
would have to be given a value, so it is refused in writing at the
definition site rather than left unbuilt-and-unexplained; and the
re-derived floor makes `T-151`'s own arithmetic worse — 8,575 bytes at
1,131 bytes/file is **about seven files**, not the ten its card computed
at 802.

### The suites, at `7107d62` — every exit read unpiped from `$?`

    lib/parser  npx vitest run          exit 0    15 files / 314 tests
    lib/parser  npx tsc --noEmit        exit 0
    app         npm run build           exit 0
    app         npm test                exit 0    47 files / 1014 tests (baseline 1013, +1)
    app/src-tauri  cargo test --no-fail-fast   exit 0
                   525 passed / 4 ignored, summed over 18 `test result:` lines and
                   cross-checked against the `running N` headers (baseline 522/4, +3)
    app/src-tauri  index --check --root ../..   exit 1  STALE, and EXPECTED
    tools/e2e   NPUTER_BOOT_PORT=14531 npm run boot:check   exit 0, both [nputer] lines

`index --check` is stale **because this lane edited `.rs` files**: the
fresh index moves by the two files it changed. GRAPH REGEN is the
integrator's at the checkpoint and `docs/architecture/graph.json` is
outside this fence — no regenerated graph is committed here. The gate was
asked before the first edit (STALE only for main's own reasons at the
base) and again after every write, per STATE's standing instruction.

### Gates, derived from this lane's own diff

- **GRAPH REGEN — FIRES** (`.rs` and `.tsx` outside `docs/`). The
  integrator's at the checkpoint; deliberately not run here.
- **BOOT GATE — FIRES** (`app/src/**`, `app/src-tauri/**`). Run by this
  executor as the trigger requires: **exit 0** on scratch port 14531,
  `lsof -nP -iTCP:14531 -sTCP:LISTEN` zero rows immediately before.
  Port 1420 read once and never touched: `node` pid 19746, `[::1]:1420`.
- **DOCS GATE — FIRES** (`docs/tasks/*.md`). Run on the merge-tree
  diff; result in the report.
- **METHOD EVAL GATE — NOT OWED**: nothing under `method/**`.

### Poison drills — 5 mutants, one side only, every mutation read back

Detached worktree at `7107d62`, one stem derived from the lane (`T-140`)
spent on the worktree AND its `CARGO_TARGET_DIR` (`.T-140-cargo`, a
non-`target` stem per `T-153-s3`), with no graph regenerated inside it.
Baselines inside the drill first: cargo **525 passed / 4 ignored, exit
0**; app **1014 passed, exit 0**. Uniqueness measured against the WHOLE
suite, as the card requires.

| # | mutant (producer only) | result |
|---|---|---|
| R1 | `floor_line`'s projection → the constant `1000` | **1 failed / 524**, `the_report_names_the_floor_truncation_can_never_reclaim` alone |
| R2 | `if floor >= budget` → `>= budget * 100`, so the over-floor branch never fires | **1 failed / 524**, `a_floor_over_the_budget_says_there_is_nothing_left_to_give` alone |
| R3 | `apply_budget` floor branch gains `graph.files.truncate(1)` | **NOT a kill of the relation body** — 1 failed, and it was `floor_emits_over_budget_graph_flagged_never_dropping_files` |
| R3b | the same plus `graph.edges.clear()` | **3 failed / 522**: the relation body reds, so it is not vacuous — with `floor_emits_over_budget_graph_flagged_never_dropping_files` and `under_an_impossible_budget_the_graph_is_still_emitted_and_still_flagged` |
| A4a | `graphSkip === "oversize"` → `"nonUtf8"` on the banner branch | **1 failed / 1013**, the new map body alone |
| A4b | the hint string in the producer only (the assertion's copy verifiably unmoved) | **1 failed / 1013**, the new map body alone |

**R3 IS THE FINDING AND IT IS RECORDED RATHER THAN PAPERED OVER: the
relation body is SHAPE SIX.** It reds under a value poison and kills no
mutant another body does not already kill, and the reason is structural
rather than careless — the floor is linear because BOTH halves of it are,
so any mutant that flattens it has to drop files or import edges, and
each of those is already pinned by a stronger invariant. R3 shows this
directly: truncating files alone leaves the floor linear, because the
import-edge block carries the growth on its own. **Its value is a FUTURE
kill** — it is the discriminator for `T-140-s1`, where a flat payload
reds it and nothing else — and stating that is better than claiming a
uniqueness it does not have.

**A NOTE ON A4a's FIRST RUN, because it is a drill hazard worth having in
writing:** the first mutant run showed **3** failures, two of them
`the build is newer than the sources it is evidence about`. Those are
freshness guards reacting to the drill's own edit, not kills. Rebuilding
the bundle and re-running gave the honest **1 of 1014**. A drill on a
tree with a built-artifact guard must rebuild between mutation and run,
or it reports its own footprints as findings.

**Restoration, proved rather than asserted:** `git checkout --` per path,
then `git show HEAD:<path> | shasum -a 256` against the working file for
all five touched paths — **MATCH on every one** — and `git status
--porcelain` in the drill clean apart from its own untracked
`.T-140-cargo/`. The drill worktree was then removed; the lane checkout
was verified clean throughout and never carried a mutant.

### For the verifier

- **The card's own headline figure is wrong at this ref and the card is
  not edited to hide it.** Title and body still say 802 bytes/file and
  "about a thousand files"; the re-derivation says 1,131 and ~919. The
  figure now has a deriver, which is the durable half of the fix.
- **Criterion 6 is the one deliberate omission.** It is routed with its
  measurement, not skipped: `T-140-s1` carries the shape, the finding
  from criterion 2 that makes it a shape change, and the pointer to the
  Rust join that already exists.
- **@human's look is still owed** on what the map shows at rest. Nothing
  built here changes that: the resting render is untouched, and the only
  new on-screen state is one that previously showed a false sentence.
- **Least confident point** is named in the report and repeated here: the
  ~919-file projection is a per-file DENSITY figure taken on one
  repository, and import density is the term that dominates it. A repo
  with sparser imports reaches further and a monorepo of small heavily
  cross-importing modules reaches less far. The line says "at this tree's
  density" for that reason; the ORDER of magnitude is the claim.

### The DOCS GATE, run on the merge-tree diff

    MAIN=$(git rev-parse main)                     # eecc83e at this run
    TREE=$(git merge-tree --write-tree "$MAIN" HEAD)   # exit 0, a tree not a conflict
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only "$MAIN" "$TREE")

**exit 1 — it HAS a verdict**: 2 paths under `docs/` are code inputs
(this card and the suggestions), owing three suites. All three run and
all three green at the tip:

    npm test from app/           exit 0
    npx vitest run from lib/parser/   exit 0
    npm test from tools/e2e/     exit 1 — ONE failure, INHERITED, filed as T-140-s2

**The e2e failure is not this lane's** and was proved so rather than
asserted: `brief.spec.ts`'s provenance rule classifies a line as "read
from the integration branch" by regexing `\bmain\b` against the whole
SOURCE string, and `T-153-s9`'s card FILENAME contains `-local-main-so-`.
Re-run alone at the tip — same single failure, so not a concurrency
artifact — then reproduced at this lane's BASE `a533a4d` in a detached
worktree with that tree's own `brief.mjs`: **5 refReads, 2 not
live-stamped, both `T-153-s9` lines**. This lane adds no path containing
`main` and touches nothing under `tools/e2e`, which is `T-153-s9`'s fence
— so it is filed and routed, never fixed from here.

### Final verification round, at `0e78f20` — every exit read unpiped

    lib/parser  npx vitest run                    exit 0    15 files / 314 tests
    lib/parser  npx tsc --noEmit                  exit 0
    app         npm run build                     exit 0
    app         npm test                          exit 0    47 files / 1014 tests
    app/src-tauri  cargo test --no-fail-fast      exit 0    525 passed / 0 failed / 4 ignored
    app/src-tauri  index --check --root ../..     exit 1    STALE — this lane's own .rs edits
    tools/e2e   npm run lint:tokens -- --selftest exit 0
    tools/e2e   npm run lint:tokens               exit 0
    tools/e2e   npm run typecheck                 exit 0
    tools/e2e   npm run lint:docs                 exit 0
    tools/e2e   npm test                          exit 1    280 passed / 281 — the inherited
                                                            brief.spec.ts failure, T-140-s2
    tools/e2e   NPUTER_BOOT_PORT=14531 npm run boot:check   exit 0, both [nputer] lines
    tools/e2e   node scripts/brief.mjs --card T-140          exit 0, no figure finding

`index --check` at this tip also prints what this card added, and the
figure moved between the base and the tip exactly as a derived figure
should — 213,914 bytes, 1,132 bytes/file, about 918 files, against the
base's 213,712 / 1,131 / 919. Two source files grew; the projection
followed. That is the property the card asked for.

**Ports, all read with `lsof -nP -iTCP:<port> -sTCP:LISTEN` at zero rows
immediately before binding:** boot check 14531, e2e runs 14561/14562/
14563/14564. Port 1420 was READ once and never bound, probed or
connected: `node` pid 19746 on `[::1]:1420`, the human's app, untouched.
