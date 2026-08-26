---
id: T-139
title: Two size limits govern the graph, neither carries a reason, nothing enforces the invariant between them, and crossing the outer one does not degrade — it drops the file
feature: F-06
milestone: 4
priority: 3
size: M
status: building
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
