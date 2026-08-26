---
id: T-139
title: Two size limits govern the graph, neither carries a reason, nothing enforces the invariant between them, and crossing the outer one does not degrade — it drops the file
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: []
touches: [crate-index, app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human, 2026-08-26**: *"measure the parse cost and set both limits with
a reason."*

**The committed graph is at 989 181 of 1 000 000 bytes — 98.92%, 10 819
left — and the merge that took it there spent 18 220.** It is the first
merge in the series whose headroom is smaller than its own spend.

## The two limits, and the invariant nobody wrote down

| what | where | value |
|---|---|---|
| the indexer's emit budget | `crates/nputer-index/src/lib.rs:79` | **1 000 000** |
| the docs collector's per-file cap | `app/src-tauri/src/docs_watch.rs:66` | **1 048 576** (1 MiB) |

**Neither carries a reason.** The first is a bare literal in a `Default`
impl with no comment, no ADR and no linked measurement; the second carries
only the comment `// 1 MiB per file`, which states the value and not the
argument. **No test pins either number** — `git grep 1_000_000` over the
suites returns nothing.

**And `graph.json` is subject to BOTH**, which is not obvious: the
collector accepts `.json` **only** under `docs/architecture/`
(`docs_watch.rs:622`), a rule written for exactly this file. So the
indexer's budget sits **48 576 bytes below** a second, harder cap that
governs the same artifact.

**That gap is almost certainly the reason for the round number — and it is
inferred, not recorded.** Anyone raising the inner limit without knowing
about the outer one has 48 576 bytes of rope.

## THE FAILURE MODES ARE ASYMMETRIC, AND THAT IS THE POINT

**Crossing the inner budget DEGRADES.** `emit::apply_budget` drops symbol
arrays greedily from the largest block down, drops `call`/`type_ref` edges
that would dangle, sets `truncated_symbols`/`truncated_files`, and **never
drops files or `import` edges** — an over-budget graph is still emitted,
valid and flagged.

**Crossing the outer cap DOES NOT DEGRADE.** `docs_watch.rs:729`: a file
over `MAX_FILE_BYTES` is pushed to `skips` with `SkipReason::Oversize` and
**`continue`** — not truncated, not partially read. **The app simply stops
receiving the architecture graph.**

So the inner limit is a designed guard and the outer one is a cliff, and
**the only thing standing between them is a literal in a different crate
that nothing checks.**

## What must be measured, because the numbers are guesses

The graph reaches the pane as a **string** — the collector reads it into
`DocsFile { path, content }`, ships it over IPC, and `graph.ts:149` parses
it in the webview. **Three stages, and nobody knows which one binds.**

Measure each separately against graph size: the Rust-side read, the IPC
transfer, and `JSON.parse` plus model construction in the webview. **A
limit set without knowing which stage dominates is the same guess with a
bigger number.**

## Acceptance criteria

- **BOTH LIMITS SHALL CARRY THEIR REASON AT THE DEFINITION SITE**, naming
  the measurement and its ref. A value with a comment restating the value
  is what this card exists to replace.
- **THE MEASUREMENT SHALL SEPARATE THE THREE STAGES** and say which binds.
  IF one dominates so heavily that the others are noise THEN say so with
  the numbers — that is a finding, not a shortcut.
- **`max_graph_bytes < MAX_FILE_BYTES` SHALL BE ENFORCED, NOT ASSUMED.**
  Today nothing checks it and the two live in different crates. **A pin
  SHALL fail if the inner budget is raised to or above the outer cap** —
  and it must fail today if the constant is mutated, which is the only way
  to know it is a check rather than a comment (`T-080-s1`).
- **THE OUTER CAP'S BLAST RADIUS SHALL BE STATED BEFORE IT MOVES.**
  `MAX_FILE_BYTES` governs **every** collected doc, not just the graph.
  Raising it to buy graph headroom raises it for every markdown file the
  watcher reads. **Say what else that admits**, and if the right answer is
  a graph-specific cap rather than a wider general one, say that instead.
- **THE HEADROOM SHALL BE REPORTED WHEREVER THE SIZE IS.** `check.rs`
  prints `bytes · files · symbols · edges` and never the remaining room —
  **the one number that would have warned anyone is the one it does not
  print.** `T-010-s3` holds the general form of this and its arms 1–2 are
  `[crate-index]`; **take it here or route it explicitly, but do not leave
  it unowned a second time.**
- **THE DEGRADATION PATH SHALL BE EXERCISED, NOT TRUSTED.** Drive a graph
  over the inner budget and assert what survives: files kept, `import`
  edges kept, `truncated_*` set. **Nothing in the suite does this today**,
  so the graceful half is documented and unproven.
- IF the measurement shows the current numbers are already right THEN
  **say so and write the reason down anyway.** The deliverable is a
  justified limit, not necessarily a different one.

Verification: headless — bare `cargo test --no-fail-fast` from
`app/src-tauri`, exit **unpiped from `$?`**, total SUMMED from the
`test result:` lines and cross-checked against the `running N tests`
headers. `npm test` from `app/` (the pane's model is C-12's and the
collector's shape is C-10's). **Build `lib/parser` first, then
`npm run build` from `app/`.** **POISON DRILL on every new assertion**,
producer mutated and never the assertion, read back with `git diff` before
its run, restores per-path by sha256, detached scratch worktree
**OUTSIDE the repository at a SHORT path**, with its own `CARGO_TARGET_DIR`
inside it — **and note `T-111-s10`: that rule collides with
`index --check`, whose walk excludes `target/` and nothing else.**
**Uniqueness of kill SHALL be measured against the whole suite.** **Ask
GRAPH REGEN rather than predicting it, and ask AGAIN after any write** —
three distinct graphs measured at *exactly* 970 961 bytes this week, so a
byte comparison is not a content check. **Ports are machine-wide while
lane-protocol rule 4 partitions by CHECKOUT (`T-132-s6`)** — explicit
port, re-probed immediately before binding. **@human: one look at the
final two numbers**, because how much of the codebase the map is allowed
to know is a product judgement, not a mechanical one.

## Implementation notes (executor, `claude-opus-5`, lane `task/T-139-graph-limits`)

Everything below is derived at **`13c736e`** (my base, and `main`'s tip
when this lane was cut) on **Apple M5 / macOS 26.6 build 25G72 /
rustc 1.95.0 / node v22.22.0**, with `jsc` from the system
JavaScriptCore framework. **Re-derive at your own ref.**

### 1. THE MEASUREMENT, PER STAGE — AND THE IPC HOP BINDS

Two harnesses, both re-runnable, both naming their command in their own
module doc:

    cargo test --release -p nputer --test graph_budget_bench -- --ignored --nocapture
    node app/test/graph-budget-bench.mjs

Delivering the live **989 181-byte** `graph.json` to the pane, minimum of
9 trials after a discarded warm-up:

| stage | what it is | cost | share |
|---|---|---|---|
| **1 read** | `collect_docs_tree`: walk, canonicalize, size gate, `read_to_string` | **0.126 ms** | **3.4%** |
| **2 IPC** | `serde_json::to_string(DocsSnapshot)` 0.614 ms + webview `eval` 1.76 ms | **2.374 ms** | **64.9%** |
| **3 parse** | `parseGraph` end to end (of which `JSON.parse` 0.70, model 0.46) | **1.160 ms** | **31.7%** |
| | | **3.66 ms** | |

**THE TABLE IS ONE RUN'S MINIMA AND IT REPRODUCES.** Both harnesses were
run twice at this tip and the LIVE row moved by under 5% on every cell —
Rust `S1 collect` 126 then 121 us, `S2a encode` 613 then 621 us; JSC
`S2b eval` 1.76 then 1.80 ms, `S3b model` 1.16 then 1.14 ms. So the
totals are **3.66-3.68 ms** and the shares **3.3-3.4% read / 64.9-65.8%
IPC / 31.0-31.7% parse**: the ordering is not close and does not depend
on which run you read. Both harnesses print `max` beside `min` on every
cell so a re-runner can see the spread rather than take this on trust.

**THE IPC HOP BINDS, AND IT BINDS FOR A SHAPE REASON RATHER THAN A SIZE
ONE.** `EmitArgs::new` (tauri 2.11.5 `event/mod.rs:130`) serializes the
snapshot with serde_json, and `emit_js_script` (`:194`) then splices that
JSON **verbatim into a JS source string** which `webview/mod.rs:1975`
hands to `eval`. The webview therefore parses a megabyte-scale **object
literal with its general JS parser**, not with the engine's JSON fast
path. On **JavaScriptCore**, the engine a macOS WKWebView actually runs:
**1.76 ms to eval, against 0.92 ms to `JSON.parse` the same bytes** —
about half that stage is the channel. Routed as **`T-139-s2`**.

Two things the harness had to get right or the number would have been
fiction, both stated because they are the sort of thing a reader should
be able to check: (a) tauri sends a NEW source string every time, so the
harness evaluates a **distinct** script per trial — an identical one hits
JavaScriptCore's source cache, and the first version of this harness
reported **0.00 ms for a 14 MB eval** because the minimum landed on a
cached run; (b) the graph rides as a JSON **string field**, so it is
escape-encoded a second time — measured amplification **1.1115x** at the
live size.

**JAVASCRIPTCORE IS FASTER THAN V8 HERE, WHICH INVERTS THE USUAL
CAUTION.** Every other measurement in this repository runs V8 (`npm
test`, every CI step). On the model-construction stage JSC is **0.52x to
0.87x** of V8 across the curve, so the everyday tooling **overstates**
the webview's cost rather than understating it. Both columns are printed
side by side; the harness says plainly that JSC is the answer and V8 the
control, and refuses to report one engine as two when `jsc` is absent.

**LINEAR TO 14 MB, NO KNEE.** Twelve sizes from 97 KB to 25 MB. Nothing
in any of the three stages argues for a limit anywhere near 1 MiB. **The
only non-linearity in the whole pipeline is the collector's cliff**,
which the Rust harness prints as its own row: at `MAX_FILE_BYTES + 1` the
payload stops carrying a graph at all and the `S2a collect` column goes
to zero microseconds because there is nothing left to encode.

**WHICH POINTS ARE REAL**: exactly one row per harness is the committed
artifact, marked `LIVE`. Every other row is synthetic — the live graph
deserialized, then resampled (a prefix of the real file list below its
size, the real list replicated under `syntheticNN/` prefixes above it),
each file carrying its own out-edges when both endpoints survive. That
holds symbols-per-file and edges-per-file at the live artifact's density
and does **not** hold import topology, which no measured stage reads. The
JS half prints `parseGraph`'s own issue count per row: **0 everywhere**,
which is what says the synthetic input is well-formed and the timings
describe the right thing.

**AND THE GRAPH IS NOT THE EXPENSIVE PART OF THE SNAPSHOT.** Measured
against the real tree: **372 files, 7 240 105 content bytes, 7 503 958
IPC payload bytes**, and `graph.json` is **13.7%** of it — the other
86.3% is markdown. `collect_docs_tree` over the whole tree is 6.31 ms and
the encode is 3.65 ms. Routed as **`T-139-s3`**.

### 2. THE TWO NUMBERS, AND THE REASON FOR EACH

**`max_graph_bytes`: 1 000 000 -> `1_040_000`.** Three findings compose:

- **No stage binds near 1 MiB** (above), so time cannot set this number.
  What sets it is the cliff, and *only* the cliff.
- **The 48 576-byte gap to the cliff was doing no safety work.**
  `apply_budget` caps the emitted document, so while `max_graph_bytes <=
  MAX_FILE_BYTES` and `apply_budget`'s FLOOR stays under the cap, the
  graph can never be dropped. **The floor — every symbol array emptied,
  dependent `s:` edges gone — is `204 996` bytes here, 19.6% of the
  cap**, so the emitter can always meet the budget with about 5x of
  file/edge growth in hand. The gap cost about **130 symbols** at this
  graph's 373 bytes/symbol and bought nothing.
- **The headroom had gone below one ordinary merge.** 55 positive graph
  growths on record (`git log --first-parent -- docs/architecture/graph.json`,
  then `git cat-file -s` per blob): **max 241 980** (T-010, the day Rust
  joined the walk), **mean 15 751**, **median 5 230**, top decile 36 155.
  Headroom under `1_000_000` was **10 819**. The next ordinary merge
  crossed it and the map would have started losing symbol panels.

**The remaining 8 576 bytes are NOT a growth allowance** — growth is
absorbed by truncation, which is what the budget is for. They are there
because the two limits are two different measurements in two different
crates (`apply_budget` compares the serialized string length, the
collector compares the on-disk `meta.len()`), and because a non-zero gap
is what gives the strict `<` in the pin something to catch.

**IT IS INERT TODAY, WHICH IS THE PROPERTY WORTH KNOWING.** The committed
graph carries neither `truncated_symbols` nor `truncated_files`, so
`apply_budget` returns on its first pass and **raising the budget changes
zero bytes of `graph.json`**. The change only takes effect at the next
11 KB of growth.

**`MAX_FILE_BYTES`: `1_048_576`, UNCHANGED, and that is a decision rather
than an omission.** It is an availability control, not a performance one.
It governs **all 372 collected files**, of which exactly one
(`graph.json`, at 94.3%) is within 7x of it — the largest markdown is
145 078 bytes, 13.8%. `MAX_FILES` is 2 000 and **nothing caps the
aggregate**, so raising the per-file cap to buy headroom for one JSON
file raises the worst case by the same factor for two thousand markdown
files. **If the map is ever to know more than ~1 MiB of a codebase, the
shape that buys it is a graph-specific cap on the `.json` branch of
`is_collected_docs_path`** — criterion 4's own alternative — not a wider
general one. Said at the definition site, and routed as **`T-139-s3`**.

**@human's one look is on these two numbers.** Both reasons are written
at their definition sites, with the measurement, the machine and the ref.

### 3. THE INVARIANT, ENFORCED — AND THE MUTATION THAT PROVES IT

`docs_watch::tests::the_emit_budget_stays_below_the_collectors_file_cap`
reads `nputer_index::IndexOptions::default().max_graph_bytes` and
`MAX_FILE_BYTES` and **restates neither**, so it pins the RELATION rather
than either value (`T-010-s3` arm 2's own trap, avoided deliberately).
Its third clause is the **positive control**: it drives the real
collector with a file of exactly the emitter's budget and shows it
**arriving whole**, beside one byte past the cap being skipped as
`Oversize` — without it, `budget < cap` would still pass in a world where
the collector had stopped shipping `.json` at all.

**IT FAILS TODAY UNDER THE MUTATION THE CARD NAMES.** Arm **A1**:
`max_graph_bytes: 1_040_000 -> 1_048_576` (equal to the cap, the weakest
possible violation). **exit 101, 517 passed / 1 failed / 4 ignored — it
kills EXACTLY ONE BODY and that body is this pin.** The other 517 bodies
stayed green while the pane would have stopped receiving the graph
entirely, which is the whole of what this criterion was about.

### 4. THE DEGRADATION PATH, EXERCISED — AND WHAT THE CARD GOT WRONG ABOUT IT

`app/src-tauri/crates/nputer-index/tests/budget.rs`, three bodies, all
driven through the **public `index()`** rather than through
`apply_budget` directly. They assert on the **SURVIVORS**: every file
present, every `import` edge present, no dangling `s:` id, stats agreeing
with the document, `truncated_files` counting the arrays *this run*
emptied — plus a full-budget control run that is the set everything is
compared against, and a floor body where the budget cannot be met at all.

**The card's "Nothing in the suite does this today" is FALSE and the true
gap was narrower and better.** `emit.rs`'s own unit tests already cover
`apply_budget` thoroughly (five bodies, including "files are never
dropped" and "imports stay"). What nothing covered was the **FIELD**:
before this lane, `IndexOptions.max_graph_bytes` was never set to a
non-default value anywhere in the repository, so the single line
`lib.rs:221` that carries the option into the emitter was held by
inspection alone. Arm **A7** proves it: replacing `opts.max_graph_bytes`
with `usize::MAX` reds **exactly the three new `budget.rs` bodies and
nothing else** — 515 passed / 3 failed — so 519 other bodies were content
for the budget to be ignored completely.

### 5. THE HEADROOM IS NOW REPORTED — `T-010-s3` RULED, NOT LEFT

`index --check` prints one new line wherever it prints a size:

    [nputer-index]   budget:      997202 of 1040000 bytes (95.9%) - 42798 left

and over budget it names the degradation rather than reading as a
failure — `OVER by N: symbol arrays are being dropped
(stats.truncated_symbols / truncated_files say how many)`. It is the
FRESH size, because the question at this gate is what the next regen will
write.

**`T-010-s3` is dispositioned here, all three arms:**

- **Arm 1 (print the headroom on `--check`) — TAKEN.** It is the arm that
  reaches a human: the integrator runs this gate by hand at every
  checkpoint. Two bodies, both drilled (A3, A4, unique kills).
- **Arm 2 (a test that reds at a stated fraction of the budget) —
  DECLINED, with the reason.** Against the live tree it is
  content-dependent, which `self_graph.rs`'s own module doc says the
  default suite must not be; `#[ignore]`d it would join
  `self_graph_is_current` in being invisible, which is exactly the trap
  this card's own brief flags. Arm 1 discharges the need with a number a
  human reads at every checkpoint and no `#[ignore]` on it.
- **Arm 3 ("raise nothing") — REFUTED BY MEASUREMENT.** Its premise is
  that the gap to the collector's cap is a safety margin. It is not: the
  emitter caps the document, so the ordering is what protects and the
  size of the gap only matters at the floor, which is 204 996 bytes. Arm
  3's own supporting figure — the floor, which it measured at 186 883 at
  T-010's tip — is what refutes it, re-derived at this ref.

Its figures also needed re-deriving and I did: 890 843 -> **989 181**,
89.1% -> **98.92%** of the old budget, 186 883 -> **204 996** floor.

### 6. WHAT ELSE RAISING THE OUTER CAP WOULD ADMIT

Stated because criterion 4 asks, even though the cap did not move: it
admits **371 markdown files** at the new size, not one JSON file. There
is **no aggregate cap** (`MAX_FILES` 2 000 x `MAX_FILE_BYTES` 1 MiB =
2 GiB, unchecked), so the worst case scales by the same factor 2 000
times over. And it silently desynchronises the pane, because
`MAX_FILE_BYTES` has **three spellings** and only one is the authority —
`app/src/architecture/MapView.tsx:61` restates it and `:112` renders a
user-facing warning from the restatement. Routed as **`T-139-s1`** (it is
`app-map`, outside this fence) and **`T-139-s3`**.

### 7. THE DOCS GATE'S READER CENSUS MOVED 16 -> 18 AND BOTH NEW ROWS ARE MINE

Disclosed rather than left to be discovered: the gate now derives
`docs/architecture/graph.json` as a code input — which is `T-135-s3`'s
hand-maintained entry finally becoming derivable — but it attributes both
harnesses to the suite that owns their DIRECTORY, and neither suite
executes them under the command it prints (`graph-budget-bench.mjs` is a
standalone node script vitest does not match; `graph_budget_bench.rs` is
`#[ignore]`d). Over-firing, which is the safe direction, with a false
reason. Filed as **`T-139-s4`** with the repair options.

### 8. FINDINGS FILED

`T-139-s1` (three spellings of the outer cap, one authority),
`T-139-s2` (the IPC hop evals JS source), `T-139-s3` (no aggregate cap;
the per-file cap is the wrong axis), `T-139-s4` (the DOCS GATE attributes
a reader to the suite that owns its directory).
