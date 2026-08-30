---
id: T-167-s2
title: The committed graph is at 99.3% of its byte budget with 7395 bytes left — T-167 alone spent 8875 of them, so the next code lane is the one that runs out
feature: F-06
milestone: 4
priority: 1
size: S
status: building
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [crate-index]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-167's LANE WHEN IT ASKED THE GRAPH GATE, WHICH PRINTS THE
BUDGET LINE BESIDE ITS VERDICT.** The finding is not about T-167's
diff; it is about the headroom every lane after it inherits.

## The measurement

`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri/`, run at T-167's tip `1c797df`:

    budget:      1032605 of 1040000 bytes (99.3%) - 7395 left
    floor:       214704 of 1040000 bytes (20.6%) - 1130 bytes/file
                 truncation can never reclaim, so at this tree's density
                 the budget stops degrading gracefully at about 920 files

The COMMITTED graph at that ref is 1023730 bytes — **16270 bytes of
headroom before this lane, 7395 after it**. One `.rs` module of ~600
lines plus four edited files spent more than half of what was left.
State the DELTA as the invariant and both endpoints as ref-bound
(CONVENTIONS, "a forecast is measured, never extrapolated"): re-derive
both numbers at your own ref with the command above, which takes about a
second and is the same command CI runs.

## Why this is priority 1 rather than a note

Nothing is red today and nothing will announce this in advance. The
budget line is printed by `index --check` on every run, including the
runs that exit 0 — so a lane that reads only the headline verdict
("current") never sees it, and the failure, when it comes, arrives inside
somebody else's merge as a gate they did not cause and their fence
forbids them to fix. That is the same shape as the graph-trigger gap
`T-123-s5` closed, and it cost that night nothing only because the rule
said ASK THE GATE.

The board's next dispatches include Rust-touching cards. Two of them
landing before this is addressed is enough.

## What the fix has to weigh, and what it must not do

The budget lives with the indexer (`crate-index`, C-07) — its constant,
its truncation policy, and its floor computation are all in
`app/src-tauri/crates/nputer-index/`. **Derive the authority from the
crate, never from this card.** Three shapes are available and they are
not equally honest:

1. **Raise the cap.** Cheapest, and it moves the cliff rather than
   removing it — but the floor line above says truncation stops helping
   at about 920 files at this tree's density, and the tree is at 190. A
   raise buys real runway.
2. **Shrink what is emitted per file.** Changes what the graph CAN
   answer; every consumer of `graph.json` — `arch`, `arch blast`,
   `arch cycles`, the app's map, the dogfood fixtures — is a reader with
   a pin. Costly and possibly correct.
3. **Narrow the walk.** The tempting one and the one to argue hardest
   against: `.rs` joined the walk at T-010 for a reason, and dropping
   files to fit a budget is a gate that reports "current" about a tree it
   stopped looking at.

Whatever is chosen, note that DECLARING nothing here moves the three
live-registry fixtures — this is a budget, not a component — but a change
to what the graph emits DOES move `app/test/architecture-dogfood.test.ts`
and `app/test/map-dogfood-render.test.tsx`, which are outside
`crate-index`. Route what the fence cannot reach.

## The cheap tripwire, if the fix is deferred

`index --check` already computes the number. A card could make the gate
exit non-zero — or print a loud line — below a named headroom, so the
lane that spends the last bytes finds out at its own build instead of at
somebody else's merge. That is smaller than any of the three above and
does not decide between them.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 1 — AND NARROWED TO THE TRIPWIRE, because the value call is already ruled

The sitting checked the three shapes above against the board before
promoting, and two of them are not this card's to take:

- **Shape 1, raise the cap — CLOSED BY A RULING.**
  `docs/tasks/rejected/T-151-the-graph-budget-cannot-be-raised-alone-and-the-margin-it-would-eat-is-the-design.md`
  carries @human's decision of 2026-08-30: REJECTED, because the map
  payload shape ruled in `T-140-s1`'s favour removes the wall a raise
  only postpones, and T-151's own framing conceded it.
- **Shape 2, shrink what is emitted — IS that ruled fix and it has a
  card.** `T-140-s1` (planned, blocked on `T-135`) is the payload-shape
  work; STATE names the chain `T-135` Half B then `T-140-s1`.
- **Shape 3, narrow the walk** — this card's own paragraph argues
  against it and the promotion keeps that argument rather than taking it.

**What is left is the half neither covers, and the day this card was
filed made its case twice.** The budget line is printed by
`index --check` on every run INCLUDING the runs that exit 0, so nothing
announces the cliff to the lane that spends the last bytes.
Corroboration, 2026-08-30: `@ 780d0af02f90ca6072c946fe9d19a6ca40362472`
is a graph regeneration whose own subject records the
ask-after-every-write rule broken twice in one day by one batching
habit, and it moved the COMMITTED graph to exactly the size this card
was filed on. Headroom at that commit, derived with
`wc -c docs/architecture/graph.json` against the crate's own
`max_graph_bytes`: 1040000 − 1032605 = 7395 bytes — the same figure, now
readable without a build.

## Acceptance criteria

- THE gate SHALL say so LOUDLY, in its own output rather than in a line
  a reader may skip, when the remaining headroom falls below a named
  threshold — so the lane that spends the last bytes finds out at its own
  build instead of at somebody else's merge.
- THE threshold SHALL carry its measured reason at the definition site in
  the crate, the way the byte budget beside it already does (T-139's
  pattern); a number with no reason is the shape this card was filed
  against.
- THE lane SHALL derive the headroom at its own ref, before and after,
  with `cargo run -p nputer-index -- index --check --root ../..` run from
  `app/src-tauri/`, and record both answers here. The figures in this
  body are stamped at the refs they were read at and are not the lane's
  input.
- THE change SHALL carry a positive control: a graph below the threshold
  trips the new signal and one above it does not, so the signal is shown
  capable of failing (`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`,
  docs/CONVENTIONS.md).
- THE lane SHALL NOT raise the byte budget, change what the graph emits,
  or narrow the walk. All three are the VALUE call, it is ruled above,
  and a tripwire that quietly bought runway would spend a ruling nobody
  asked it for.
- WHERE the change moves a reader outside this fence, THE lane SHALL
  record it and route it rather than edit it — the app's dogfood fixtures
  are the known case and they are outside `crate-index`.
- Verification: headless. `index --check` exit 0 at the lane's own ref
  with the graph regenerated, and the crate's own `cargo test` green.

## Implementation notes

**Executor, 2026-08-30, lane `task/T-167-s2-graph-tripwire`, base
`9ed2b7fa430d5088c6b5cbefe8c4f4cbac906803`, tip
`3b6098ebea80f198911b176a865594c7d0726378`.** One file changed:
`app/src-tauri/crates/nputer-index/src/check.rs`.

### The tripwire, and where it fires

`check::headroom_alarm` — a new render arm, called from `check::render`
immediately BELOW the headline verdict and ABOVE the indented stat
lines, on both the CURRENT and the STALE path. Under
`check::WARN_HEADROOM_BYTES` of room it prints an unindented
`[nputer-index] !! GRAPH HEADROOM ALARM` block; at or above it, nothing
at all. `budget_line` and `floor_line` are untouched, byte for byte.

**Placement is the mechanism, not the wording.** The number this card is
about has been printed on every run since T-139 — the failure was never
that it was absent, it was that it arrives as an indented stat between
two other indented stats, which is where the reader of a green gate has
already stopped. So the block breaks that shape (no indent, blank
`[nputer-index]` lines either side, `!!` markers) and sits above the
stats. That placement is asserted, not merely intended: the body
compares `find("GRAPH HEADROOM ALARM")` against `find("  budget:      ")`
and against `find("is CURRENT")`, and the drill's M3 below moves the
call one line and reds it.

**THE EXIT CODE IS DELIBERATELY UNTOUCHED**, and the card's own criteria
decide that rather than my judgement. The tripwire paragraph offers
"exit non-zero — or print a loud line"; the last criterion requires
`index --check` exit 0 at this lane's own ref. At today's headroom every
threshold worth naming is already crossed, so an exit-code tripwire
would exit 1 here and both criteria cannot hold at once. The loud line
is the one that can. The reason is also written at the definition site:
exit 1 means STALE (`cli`'s exit-code contract), a low-headroom graph is
current rather than stale, and a gate that redded here would hand every
later lane a red it did not cause and its fence cannot fix — this card's
own failure shape with the sign flipped.

### The threshold and what measured it

`pub const WARN_HEADROOM_BYTES: usize = 14_914` in `check.rs`, with the
measurement, the derive command and the ref in its own doc comment
(T-139's pattern, criterion 2). It is the MEAN of the 61 single-commit
growths of `docs/architecture/graph.json` in this repository's history —
median 5,230, max 241,980 at T-010 — re-derived at
`9ed2b7fa430d5088c6b5cbefe8c4f4cbac906803` from successive blob sizes:

    git log --reverse --format=%H -- docs/architecture/graph.json \
      | while read -r c; do git cat-file -s "$(git rev-parse "$c:docs/architecture/graph.json")"; done

then the positive deltas of that series and their mean. The mean and not
the median, because the question is "can the next ORDINARY merge spend
the rest" and the merges that spend a graph budget are the large ones a
median hides — the median growth here is under a third of the room the
tree had left the day this card was filed, and would have called that
state healthy.

**IT IS A RE-MEASUREMENT OF A FIGURE THIS REPO ALREADY CARRIES TWICE,
NOT A NEW STATISTIC.** `IndexOptions::max_graph_bytes`'s doc states the
same statistic at `13c736e` — 15,751 over 55 growths — and rejected a
10,819-byte headroom in the words "one ordinary merge from truncating".
Six growths later the same measurement is 837 bytes lower. Both older
copies are stamped at their own refs and neither is false, so neither
was edited; the new doc comment says which ref each belongs to.

### The headroom at this lane's own ref, before and after (criterion 3)

`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri/`, both readings taken by hand in this worktree:

- **BEFORE**, at the base `9ed2b7fa430d`: **exit 0**, `graph.json is
  CURRENT`, `budget: 1032605 of 1040000 bytes (99.3%) - 7395 left`,
  `floor: 214704 of 1040000 bytes (20.6%) - 1130 bytes/file … about 920
  files`. This reproduces the figures the card body stamped at
  `1c797df`/`780d0af` exactly, so nothing moved between those refs and
  this lane's base.
- **AFTER**, at the tip `3b6098ebea80`: **exit 1**, `graph.json is
  STALE`, `fresh index: 1033135 bytes · 190 files · 2197 symbols · 2117
  edges`, `budget: 1033135 of 1040000 bytes (99.3%) - 6865 left`, floor
  line unchanged. The whole delta is `files +0 -0 ~1`:
  `…/src/check.rs (content, loc 745 -> 972, symbols 13 -> 15)`.

**So this lane spent 530 of the 7,395 bytes and leaves 6,865** — one
more entry in the series the card is about, and the tripwire it installs
fires on this repository at its own tip, on real data rather than on a
fixture.

### THE ONE CRITERION THIS FENCE CANNOT MEET — recorded, not taken

> *Verification: headless. `index --check` exit 0 at the lane's own ref
> **with the graph regenerated**, and the crate's own `cargo test` green.*

`docs/architecture/graph.json` is outside this lane's fence.
`.nputer/lane-fence.json` for `T-167-s2` reads `paths:
["app/src-tauri/crates/nputer-index"]` with `alwaysWritable:
["docs/tasks"]`, and CONVENTIONS' GRAPH REGEN bullet puts the regen at
the CHECKPOINT and names the INTEGRATOR as who runs it — for the stated
reason that the checkpoint itself edits indexed fixture files, so a
graph regenerated earlier is stale again by the time they are
reconciled. The dispatch brief for this lane said the same in one line.
The criterion is therefore unmeetable by any lane whose fence is one
crate, and it is reported rather than worked around: **`index --check`
is exit 1 STALE at this tip, the entire delta is this lane's own single
file, and the regen is owed at the checkpoint.** The crate's own
`cargo test` half of that criterion is green (below). No file outside
the fence was written.

### Readers outside the fence — checked rather than assumed (criterion 6)

`check::render`'s text has exactly one programmatic consumer outside
this crate, and it is in `tools/e2e`, which this fence does not carry:

- `tools/e2e/scripts/health-bands.mjs`'s `parseGraphHeadroom` regex
  scans the whole text for `budget:\s+(\d+) of (\d+) bytes …`, first
  match wins, so a new block ABOVE that line could have hijacked the
  band's reading and left it silently reading the wrong number. Verified
  on the real output rather than by eye — the new block carries no
  `budget:` token — feeding this tip's actual `index --check` output to
  the shipped parser returns `{"value":6865}` and
  `readingsFromOutput` still yields `graph/budget-headroom-bytes`.
- `tools/e2e/tests/health-bands.spec.ts` pins two of `budget_line`'s
  format strings against `check.rs`'s source, by symbol. Both survive
  unchanged: nothing in `budget_line` or `floor_line` moved.

`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — the movers the card names — are
NOT moved by this change: it alters no emitted payload, only rendered
report text. The graph they read does move (by 530 bytes, above), which
is the ordinary regen the integrator owes.

### POISON DRILL — 6 mutants, 6 one-sided kills

Drilled at the commit `3b6098ebea80`, in a **detached scratch worktree**
`/tmp/n167d` (short root, T-133-s5) with its own
`CARGO_TARGET_DIR=/tmp/n167d/target` (the walk-safe form). Every mutant
changed the CODE UNDER TEST, never an assertion and never a literal the
two share; the planted text was read back out of the file each time
rather than trusting a substitution count. Suite:
`cargo test -p nputer-index --lib check::` (12 bodies).

| mutant | red body | result |
|---|---|---|
| M1 threshold ignored (`left >= 1`) | `…fires_below_its_threshold_and_is_silent_above_it` | 11 passed / 1 failed |
| M2 silence removed (`if false`) | same | 11 passed / 1 failed |
| M3 alarm moved below the stat lines | same | 11 passed / 1 failed |
| M4 the room printed off by one | same | 11 passed / 1 failed |
| M5 the spent arm goes silent | `…is_loudest_once_the_ceiling_is_already_crossed` | 11 passed / 1 failed |
| M6 the spent arm miscounts how far past | same | 11 passed / 1 failed |

Every kill is ONE-SIDED: exactly one body failed each time and it was
the expected one, so the two new bodies discriminate against each other
as well as against the mutant. Restored between mutants with
`git restore --source=3b6098ebea80… --staged --worktree -- <path>`,
naming both sides, and the restoration is proved BY HASH on both sides
in both trees:

    git show <tip>:app/src-tauri/crates/nputer-index/src/check.rs | shasum -a 256
    shasum -a 256 < app/src-tauri/crates/nputer-index/src/check.rs
    230a09f3d03f52441caa4385f2d4a1738136a9222bff48ab96a1a1e78c7996de   # identical, both trees

`git status --short` empty in both; the scratch worktree was removed.

### Gates

- `cargo test` from `app/src-tauri/` — **exit 0, unpiped**. 547 passed,
  0 failed, 4 ignored across 12 binaries. Cache-cliff reading taken from
  the suite's own output rather than the target size (`target/` was
  499M): the app LIB binary finished in **4.07s**, under the 9.5s green
  line, and `startup_arm_watches_the_initial_root` passed. The indexer's
  lib binary is 192 passed / 0 failed.
- `cargo run -p nputer-index -- index --check --root ../..` — **exit 1,
  STALE**, verdict reported above; regen owed at the checkpoint.
- `npm run lint:docs` from `tools/e2e/` — **exit 0** (23 derived docs
  readers across 4 suites, 0 frontmatter issues, budgets hold).
- **THE DOCS GATE NAMES MORE ON THIS DIFF, AND IT WAS RUN.** Judged from
  the repository root over the four changed paths, `docs-gate.mjs` exits
  1 — FIRES — because the three `docs/tasks/**` files in this diff are
  code inputs to nine readers. All three suites it names were run in
  this lane, in the fresh-clone order:
  - `npx vitest run` from `lib/parser/` — **exit 0**, 15 files / 315
    tests (after `npm ci`; `npx tsc --noEmit` and `npm run build` also
    exit 0).
  - `npm test` from `app/` — **exit 0**, 47 files / 1015 tests (after
    `npm install` and `npm run build`, both exit 0).
  - `npm test` from `tools/e2e/` — **exit 0**, 320 passed in 3.7m, on
    `NPUTER_E2E_PORT=14538`, `lsof -nP -iTCP:14538 -sTCP:LISTEN` read at
    zero rows immediately before binding.
- GRAPH REGEN fires on this diff (`*.rs` outside `docs/`). BOOT GATE
  fires (`app/src-tauri/**`). METHOD EVAL GATE not owed — no `method/**`
  path in the diff.

### Suggestions filed

- **`T-167-s5`** — the alarm names the STANDING headroom, not what the
  reader's own working tree just spent; the delta is already in the
  report's own fields.
- **`T-167-s6`** — the same statistic now lives in two packages with no
  pin between them, in a repo whose spec already pins the band's PARSER
  to this file's source and not its THRESHOLD.

## Verdicts
