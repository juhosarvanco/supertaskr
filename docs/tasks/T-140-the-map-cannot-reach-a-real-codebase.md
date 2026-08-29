---
id: T-140
title: The graph carries an undroppable floor per file (1,131 B at landing, ~919-file ceiling — printed live by index --check since this card), so nputer cannot yet be pointed at a big codebase
feature: F-06
milestone: 5
priority: 6
size: L
status: done
blocked_by: [T-139]
touches: [crate-index, app-map, app-shell]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5
verified_by: claude-opus-5@subagent
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
cannot go below. RETRACTED AT MERGE (verdict, correction 4): the 802
bytes/file / ~1,000-file figures below were this card's FILING-time
measurement and are STALE — the landed re-derivation is **1,131
bytes/file over 189 files, ceiling ~919** (both re-derived by the
verifier to the byte), and the live figure now PRINTS from
`index --check`'s floor line at every run, which is the only place it
cannot go stale. The table below is kept as the filing-time record.

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

**R3's SHAPE-SIX CLASSIFICATION WAS FALSIFIED AT VERIFICATION AND IS
CORRECTED HERE (verdict, correction 3):** the verifier's
`graph.files.truncate(24)` mutant kills the relation body ALONE (1 of
525) — a measured UNIQUE kill this record now carries in place of the
shape-six claim. The honest half SURVIVES the correction: an
`edges.clear()` mutant does NOT red the relation body, so it stays
blind to a fix that removes the import-edge 75% while keeping the file
list — which is exactly the flat-payload shape T-140-s1 proposes, and
why the body remains that card's discriminator. The original reasoning
stands for the half it got right — the floor is linear because BOTH halves of it are,
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

## Verdicts

### 2026-08-30 — APPROVED WITH ASSIGNED CORRECTIONS (verifier `claude-opus-5@subagent`, independent hand)

**Pair reviewed `a533a4d..1792e3a`. Every figure below is my own, at a
named ref, derived with my own instrument.** Two-phase blindness held in
the direction that matters: the attack set was written from the card AT
ITS BASE `a533a4d` (down to and including Acceptance criteria) plus the
raw code diff, before the Implementation notes or the executor's report
were consulted; phase 2 only EXTENDED it. The shipped behaviour is
correct and the measurements reproduce. What is missing is guard
integrity on two of them, which is why this is not a bare APPROVED.

#### The battery, at `1792e3a`, every exit read unpiped from `$?`

    lib/parser  npx vitest run                    exit 0   15 files / 314 tests
    lib/parser  npx tsc --noEmit                  exit 0
    lib/parser  npm run build                     exit 0
    app         npm run build                     exit 0
    app         npm test                          exit 0   47 files / 1014 tests
    app/src-tauri  cargo test --no-fail-fast      exit 0   525 passed / 0 failed / 4 ignored
                   summed over 18 `test result:` lines; the 529 `running N`
                   headers cross-check as 525 + 4 ignored. Lib suite 4.26s —
                   under the 9.5s cache-cliff line with a 4.3G target/, so no
                   `cargo clean` was considered.
    app/src-tauri  index --check --root ../..     exit 1   STALE, EXPECTED — read, not regenerated
    tools/e2e   npm run typecheck                 exit 0
    tools/e2e   npm run lint:tokens -- --selftest exit 0
    tools/e2e   npm run lint:tokens               exit 0
    tools/e2e   npm run lint:docs                 exit 0
    tools/e2e   NPUTER_E2E_PORT=14538 npm test    exit 1   280 passed / 281 — INHERITED, proved below
    tools/e2e   NPUTER_BOOT_PORT=14545 npm run boot:check  exit 0, both [nputer] lines
    repo root   node tools/e2e/scripts/brief.mjs --card T-140  exit 0, no figure finding

Every port `lsof -nP -iTCP:<port> -sTCP:LISTEN` at **zero rows**
immediately before binding (14538, 14545). Port 1420 was never read,
probed, bound or connected by this pass.

#### THE ONE E2E RED IS INHERITED — verified by reproducing it at the base myself

Not accepted on the executor's word. `brief.spec.ts:313` classifies an
emitted line as "read from the integration branch" by testing
`\bmain\b` against the WHOLE provenance string, and `T-153-s9`'s card
FILENAME carries `-local-main-so-`, which `\b` matches across the
hyphens. I imported **the base tree's own `dispatch-brief.mjs`** in a
detached worktree at `a533a4d` and ran the spec's own filter, character
for character:

    at a533a4d : 5 refReads, 2 NOT live-stamped — both T-153-s9 lines, exit 1
    at 1792e3a : 5 refReads, 2 NOT live-stamped — the same two lines,  exit 1

Same failure, same two lines, at the base. **It is not this lane's.**
Classified against the lane's own fence manifest (`.nputer/lane-fence.json`,
64 paths, stamped at `a533a4d`): the manifest contains **no `tools/**`
entry at all**, so the fix is unreachable from inside this lane, and
every one of the 11 paths this lane changed is either inside the manifest
or under the unfenceable `docs/tasks/`. Routing it to `T-140-s2` is
correct. (I also reproduced the executor's brief-format observation on
the way past: row 4 hands `f63f8a0`, the newest `Checkpoint:`, where the
actual cut was `a533a4d`.)

#### THE MEASUREMENTS, adversarially — all four reproduce

**(a) The floor, re-derived through the emitter's own instrument, and
then AGAIN by a hand that does not use the emitter at all.**

    at a533a4d, tip binary against a detached base worktree:
      floor 213,712 of 1,040,000 (20.5%) — 1131 B/file — about 919 files
    at 1792e3a, in the lane:
      floor 213,914 of 1,040,000 (20.6%) — 1132 B/file — about 918 files

My independent hand: a JS reconstruction that (i) **re-serializes the
committed `graph.json` byte-identically — 1,021,562 in and 1,021,562
out**, which is what licenses the rest, then (ii) applies
`apply_budget`'s floor transform by hand — every symbol array emptied,
every non-`import` edge whose endpoint is a dropped file's symbol
removed, `stats` restamped — and measures. **213,712 bytes. The
emitter's number, to the byte.** Edge kinds at that ref: 722 import /
585 call / 804 type_ref; 178 of 189 files carry symbols; 722 import
edges survive.

The printed line's arithmetic checks against my own division at both
refs: `213712/189 = 1130.75 -> 1131` and `floor(1040000/1130.75) = 919`;
`213914/189 = 1131.82 -> 1132` and `floor(1040000/1131.82) = 918`. The
rounding seam is real but does not bite here — a reader who re-divides
from the PRINTED `1131`/`1132` gets 919/918 as well.

**And the floor splits where the executor says it does**, which is the
whole of its least-confident point, now measured rather than asserted:
of the 1130.75 B/file at `a533a4d`, the file list is **280.9** and the
`import` edges are **849.8** — 75% of the undroppable cost is import
edges.

**(b) LINEARITY, on my own resample points, two independent ways.**

Induced subgraphs of the live committed graph at `a533a4d` (prefixes in
path order, so directory locality survives), ten points of my choosing:

     N     floor   B/file   N     floor   B/file
     12    10,571   880.9   120  128,071  1067.3
     24    27,548  1147.8   144  162,855  1130.9
     36    40,271  1118.6   168  184,428  1097.8
     48    51,554  1074.0   189  213,603  1130.2
     72    74,435  1033.8
     96    97,734  1018.1

    least squares: floor = 1124.2 * files - 3080,  R^2 = 0.996985

Then the CRATE's own instrument on synthetic trees, which is the
stronger test because it removes my harness from the loop entirely —
`index --check` reading its own `floor:` line:

    fixed density (4 imports/file), size 50 -> 400:
      807 / 805 / 803 / 803 B/file  ->  ceiling 1288 / 1292 / 1294 / 1295

**Per-file cost is flat to 0.5% across an 8x size range.** The floor is
linear in file count and the projection is size-invariant. Criterion 1
is met on evidence.

**(c) The criterion-2 NO, confirmed from `derive.ts` itself and not from
the note.** `deriveDeclared` (`app/src/lib/architecture/derive.ts`) walks
`graph.files` matching every `file.path` against each component's `paths`
globs to build `fileComponent`, then walks `graph.edges`, keeps
`kind === "import"`, resolves both endpoints through `filesById` /
`packagesById`, and only then rolls them up into component edges. So the
resting render consumes exactly the per-file paths and the file-level
import edges — the linear part. I confirmed the other half too: `symbols`,
`loc`, `hash` and `unresolved` are read in `map-zoom.ts`'s `fileDetail`
and `MapPanel`'s file section and nowhere else, i.e. drill-in only.
**The rollup as it exists is insufficient BY CONSTRUCTION because the
join lives in the pane** — 15 component records with their `depends_on`
serialize to 1,619 bytes against 1,021,562 on my own minimal shape
(631x; the executor's 2,056 / 497x is a fatter shape of the same fact,
and the conclusion does not turn on which).

**(d) The T-139-s2 corrections both reproduce, from the collector's own
predicate.** Walking `is_collected_docs_path`'s rule (`.md` anywhere
under `docs/`, `.json` only under `docs/architecture/`) over the base
worktree at `a533a4d`: **421 files (420 md + 1 json) · 8,215,112 content
bytes · graph.json 1,021,562 = 12.44%**, largest markdown 145,078 bytes
(`docs/tasks/T-110-…`), and nothing else in the set within 900 KB of
`MAX_FILE_BYTES`. The census in the `docs_watch.rs` ruling is right.

**Criterion 5, re-run by me on this tree** (`node
app/test/graph-budget-bench.mjs`, exit 0, min-of-9): on the LIVE
1,021,562-byte graph, JSC `eval` of tauri's real emit script **1.94 ms**
against `JSON.parse` of the same bytes **0.98 ms** — 1.98x, and eval is
**61.8%** of the 3.14 ms webview total. Envelope 1,135,715 for 1,021,562
= **1.1117x amplification**, the executor's figure falling straight out
of my own run. Cost stays linear to 14.7 MB with no knee. `T-139-s2`
reproduces; the payload did not become kilobytes; the second branch of
criterion 5 applies and the card says so.

#### THE REFUSALS — all three hold

- **No limit VALUE moved.** `max_graph_bytes: 1_040_000` and
  `MAX_FILE_BYTES: 1_048_576` are byte-identical at `a533a4d` and
  `1792e3a`; `MAX_FILES` and `MAX_DEPTH` too. The entire `docs_watch.rs`
  diff is `///` lines — I filtered the diff for non-comment changes and
  it is **empty**.
- **The criterion-4 ruling is a RULING, at the definition site.** It sits
  immediately above `MAX_FILE_BYTES`, says WHICH of T-139's two shapes is
  taken and why, gives three reasons that are reasons rather than
  restatements, and refuses the interim IN WRITING with the reason the
  interim would need a value that is @human's to set.
- **The `T-151` arithmetic reproduces from my own figures.** The gap is
  8,576 and the maximum legal raise is **8,575** (the cross-crate pin is
  a strict `<`, which T-151's own title already says) — so this is not an
  off-by-one. `8575 / 1130.75 = 7.58` and `8575 / 1131.82 = 7.58`:
  **about seven files** at either ref. Cross-check: raising the budget to
  1,048,575 moves the projection 919 -> 927, a delta of 8.

#### GUARD-TESTING — my own mutants, poison-drill rules, and TWO SURVIVORS

Detached scratch worktree at `1792e3a` on a short root, one stem derived
from this seat (`t140v`) spent on the worktree, its `CARGO_TARGET_DIR`
(placed OUTSIDE the worktree, so it cannot enter the graph walk at all —
`T-153-s3` one better), the driver and every results file. Committed
work drilled at a commit; one side mutated per run, never an assertion;
every mutation read back with `git diff` before its run; **rebuilt
between mutation and run** on both sides. Baselines inside the drill
first: cargo **525 / 0 / 4 exit 0**, app **1014 exit 0** — identical to
the lane. Uniqueness measured against the WHOLE suite.

| # | mutant (producer only) | result |
|---|---|---|
| V1 | `floor_line`: `ceiling = ((budget as f64) / per_file / 2.0)` — the projection HALVED | **SURVIVES. 525 / 0, exit 0** |
| V1b | `floor_line`: `per_file = floor / (files * 2)` — both printed figures moved | **SURVIVES. 525 / 0, exit 0** |
| V2a | `apply_budget` floor branch gains `graph.edges.clear()` | 1 failed / 524 — and it is `under_an_impossible_budget_the_graph_is_still_emitted_and_still_flagged`. **The relation body stays GREEN.** |
| V2b | `apply_budget` floor branch gains `graph.files.truncate(24)` | **1 failed / 524 — `the_undroppable_floor_grows_with_the_file_count` ALONE. A UNIQUE KILL.** |
| A1 | MapView: `graphSkip === "oversize"` -> `true` on the too-large branch | 1 failed / 1013 — the new map body alone |
| A2 | MapView: the withdrawal condition dropped, so the button always renders | 1 failed / 1013 — the new map body alone |
| A3 | MapView: `indexHint`'s oversize string -> the non-oversize string (producer only) | 1 failed / 1013 — the new map body alone |
| A4 | App.tsx: the wiring made to never match (`s.path === \`x${GRAPH_FILE}\``) | **SURVIVES. 1014 / 1014, exit 0** |

A4's first spelling (`const graphSkip: undefined = undefined`) failed the
BUILD on TS6133 and then showed two build-freshness failures — the drill
reporting its own footprints, exactly as the executor's A4a note warns.
The build-clean spelling above is the honest one, and it survives.

**Restorations proved, not asserted:** `git checkout --` per path, then
`git show HEAD:<path> | shasum -a 256` against the working file for all
five touched paths (`check.rs`, `emit.rs`, `MapView.tsx`, `App.tsx`, and
`map-view-dom.test.tsx` untouched) — **MATCH on every one**, with
`git status --short` empty in the drill after each. The app bundle was
rebuilt from clean source at the end so no mutated `dist/` survives. The
lane checkout never carried a mutant; my scratch drive spec lived and
died in the drill worktree only.

#### THE APP FIX, DRIVEN ON BOTH SIDES BY MY OWN HAND

Four bodies of my own in the drill worktree, all green:

- **normal graph** — both declared components render as nodes, there is
  **no `map-degraded` banner at all**, the header keeps `map-reindex`,
  and the hint reads `committed graph · N files`.
- **oversize** — banner says *too large to map*, does **not** contain
  "index not run", `map-run-index` is **absent**, the hint reads
  `graph too large to deliver`, and the declared components still draw,
  so the pane is not blank.
- **precedence** — an in-session `indexed` outcome still outranks a
  standing skip in `indexHint`, which is right.
- **the residual** — see the routed finding below.

Criterion 3 is met: the state this card exists for now says so on screen,
and it withdraws the one offer that could not have helped.

#### ASSIGNED CORRECTIONS (the integrator performs; none blocks the merge's substance)

1. **PIN THE PROJECTION'S ARITHMETIC.** V1 and V1b above are SHAPE SEVEN
   on the card's own headline number: `check.rs`'s
   `the_report_names_the_floor_truncation_can_never_reclaim` pins only
   the ORDINAL relation (`projected_ceiling(dense) < projected_ceiling(sparse)`)
   and the `"<floor> of <budget> bytes"` substring, so any constant
   FACTOR on either printed figure ships green. Add, in that body, a
   re-derivation from the report's own fields — parse the printed
   bytes/file and the printed ceiling and require them to equal
   `round(floor_bytes / fresh_stats.0)` and
   `floor(budget_bytes / (floor_bytes / fresh_stats.0))`. That is the
   assertion V1 and V1b cannot pass.
2. **PIN THE APP-SIDE WIRING.** A4 above is the same shape one layer out
   and it is the more serious of the two: break the single line in
   `App.tsx` that finds `GRAPH_FILE`'s skip row and the whole fix is dead
   in the shipped app — the pane goes back to "index not run" over a
   too-large project — and 1014 of 1014 stay green. Add one body that
   drives the shell with a `DocsSnapshotPayload` whose `skipped` carries
   `{ path: GRAPH_FILE, reason: "oversize" }` and asserts the map is
   handed it. `app/src/App.tsx` and `app/test/**` are both inside this
   lane's fence, so this is in-reach work rather than a route.
3. **REPLACE THE SHAPE SIX RECORDING WITH THE MEASURED UNIQUE KILL.** The
   notes record `the_undroppable_floor_grows_with_the_file_count` as
   SHAPE SIX — "its kill is non-unique because both halves are pinned by
   stronger invariants". **My V2b falsifies that**: one mutant, one
   failing body, 1 of 525. The executor's structural argument fails in
   the one case it did not try — a flattening that bites only ABOVE the
   other fixtures' sizes, which is precisely the shape a real fix has.
   The ordinals in CONVENTIONS' catalogue are cited by other cards, so a
   wrong SHAPE SIX entry in landed text is a durable error. **Keep the
   honest half in the rewrite**: V2a shows the body is blind to a change
   that removes the import-edge 75% of the per-file cost while keeping
   the file list, so "its red is the evidence that the shape actually
   changed" is true only for the file-list half. Both facts belong in the
   record.
4. **RETRACT THE STALE HEADLINE AT ITS SITE.** The title and
   "## The floor, measured" still assert **802 bytes/file** and "about a
   thousand files" as current; the re-derivation that corrects them is
   110 lines below. This repository retracts in place — the CI bullet's
   own "THE SENTENCE THAT USED TO SIT HERE WAS FALSE AND IS RETRACTED" is
   the house form — and the card-figures audit cannot catch this one
   (`brief.mjs --card T-140` exits 0 because these are unstamped bare
   numbers, and arm one is deliberately not rebuilt). One line at the
   site, naming the re-derived 1,131 / ~919 and where it lives, is
   enough. Not editing the history was right; leaving the reader to find
   the correction is not.

#### ROUTED, NOT BLOCKING

`T-140-s3` — a graph skipped for any reason OTHER than `oversize` now
gets a header that says `graph not delivered` while the banner beneath it
still says `index not run` and still offers `Run index`. Driven and
measured by me with `graphSkip: "unreadable"`. The disagreement is
introduced by this diff (before it, both said "index not run"), it is
narrow, and the banner half is unchanged pre-existing behaviour — so it
is a finding and not a defect in what this card promised.

#### OBSERVATIONS, recorded rather than assigned

- **The projection's denominator is the BUDGET, not the collector cap.**
  `floor_line` divides by `max_graph_bytes` (919 at `a533a4d`, 918 at
  `1792e3a`); the limit at which the document actually stops reaching the
  pane is `MAX_FILE_BYTES`, which by my own division is 927 and 926 at
  those same two refs. The printed sentence says "the budget stops
  degrading gracefully", so it is honest about what it measures — but a
  reader after "where does the map stop" wants the other number, and the
  two are eight files apart.
- **`floor_line`'s `files == 0` arm is live and untested.** I reached it
  with an empty tree: it prints the floor with no projection, correctly.
  In that degenerate state the printed floor (218) EXCEEDS the printed
  fresh size (187), because `apply_budget`'s floor branch stamps
  `truncated_symbols: true` even when nothing was truncated. Pre-existing
  behaviour, newly visible; harmless on any real tree.
- **`floor_len` clones the graph and re-serializes it on every gate run.**
  Measured cost: `index --check` at the tip is 0.88–0.95 s wall over three
  runs. Not material.
- **Security sweep: clean.** No dependency added (no `Cargo.toml`,
  `Cargo.lock`, `package.json` or lockfile in the diff), no new input path
  crosses a trust boundary, no secret or key, no untrusted text
  interpolated into markup — the banner strings are literals and
  `graphSkip` is a closed union. Adjacent features intact: `indexHint`'s
  new parameter is optional and every existing call site keeps its
  behaviour, and the `graphUnreadable` and truncation states still fire on
  their own triggers.
- **A note on the two 189-file floors in this card.** The planning pass
  lists "189 -> 213,603" from the JS resample beside the authoritative
  213,712. My own resample harness reproduces 213,603 exactly, and the
  109-byte difference is the `unresolved` array (one entry, 99 bytes
  pretty-printed) that an induced-subgraph model zeroes out. Not an
  error in either figure; worth one clause so the next reader does not
  spend the ten minutes I did.

#### ASSESSMENT for the integrator and @human (both flagged on `T-140-s1`)

**On the executor's least-confident point — the ~918 ceiling is a
one-repository density figure.** It is correct, and I can now put a
number on the sensitivity rather than an adjective. Through the crate's
own instrument, at a fixed 200 files, varying only how much each file
imports:

    1 import/file   365 B/file   ceiling ~2846
    2               511         ~2033
    4               803         ~1294
    8             1,388          ~749
    16            2,556          ~406

The per-file floor is almost exactly `219 + 146 * imports`. So across a
plausible density range the ceiling swings about **7x**, while at any
FIXED density it is stable to 0.5% across an 8x change in project size.
**That is the right shape for the claim the card makes**: the linearity
is solid and is the product fact; the constant is this repository's
import density and is not. The printed line's "at this tree's density"
is the correct disclosure and should survive any rewrite.

**On the criterion-4 design ruling.** I read it as a ruling and it is
one: it names the shape taken, gives three reasons, and refuses the
alternative in writing at the site where the next person would reach for
it. My density sweep above is independent support for its first reason —
any constant cap is passed by a large enough project, because the driver
is linear and the cap is not. It remains a lane-written DESIGN ruling on
a question the card reserves to @human, and @human's shape look on
`T-140-s1` may move it; nothing here should be read as pre-empting that.

**On what this card did NOT do, and why that is right.** Criterion 6 is
routed rather than met, and the card says so in its own notes rather than
claiming a pin it does not have. Given criterion 2's answer — the join
lives in the pane, so the payload cannot be swapped without moving the
shape — routing it with the measurement attached is the honest move, and
the relation body left behind is a real discriminator for the fix (V2b
proves it kills uniquely today). @human's look on what the map shows at
rest is still owed and nothing here spends it.

**Gates I owe for my OWN writes**, since a verdict is a commit and prose
is a code input here: my writes are confined to this section and to a new
`docs/tasks/T-140-s3-*.md`, both under `docs/tasks/`. They cannot move
the graph — `docs/` is `.nputerignore`d and outside the walk — so
`index --check` stays STALE for exactly the reason it was already stale
(this lane's `.rs` edits) and the regen remains the integrator's. The
DOCS GATE result at MY tip and the suites it names are recorded
immediately below.

#### The gates at MY OWN tip `a998794`, because a verdict is a commit

Run after appending this section and filing `T-140-s3`, against
`main` at **`129e3c9`** — and note that main MOVED during this pass
(`T-153-s13`'s CI fix landed on it between my first read and this one),
which is why the ref is named rather than the word "main".

    MAIN=$(git rev-parse main)                        # 129e3c9…
    TREE=$(git merge-tree --write-tree "$MAIN" HEAD)  # exit 0, a tree not a conflict
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only "$MAIN" "$TREE")

**exit 1 — it HAS a verdict.** 4 paths under `docs/` are code inputs (this
card and all three suggestions), owing three suites; 22 derived readers
across 4 suites; **every live task card's frontmatter parses with a legal
status**, which is the half that catches a verdict's own writes. Owed and
run at this tip:

    app         npm test                       exit 0   47 files / 1014 tests
    lib/parser  npx vitest run                 exit 0   15 files / 314 tests
    tools/e2e   NPUTER_E2E_PORT=14538 npm test exit 1   280 passed / 281 — the SAME
                                                        single inherited brief.spec.ts
                                                        body, no new failure
    repo root   node tools/e2e/scripts/brief.mjs --card T-140     exit 0, no figure finding
    repo root   node tools/e2e/scripts/brief.mjs --card T-140-s3  exit 0, no figure finding

`index --check` is still STALE at this tip for exactly the reason it was
stale at `1792e3a` — this lane's `.rs` edits — and nothing in my writes
can move it, `docs/` being outside the graph walk. **No graph was
regenerated by this pass**, in the lane or in either scratch worktree.
The two scratch worktrees (`/tmp/t140v-base` detached at `a533a4d`,
`/tmp/t140v-drill` detached at `1792e3a`) were removed after this run;
neither was ever a lane and neither held a fence.
