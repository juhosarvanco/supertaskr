---
id: T-140-s4
title: The graph can now LEAVE the docs collector, because since T-140-s1 nothing reads it from there at rest — the last step of T-140's own ruling, and it needs a value call this lane refused to make
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
suggested_by: executor claude-opus-5 @T-140-s1
touches: [app-shell, app-map, crate-index]
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
---

PARKED at standing triage sitting #3, 2026-08-30 (architect seat),
`@ 51fa31c0964c` — **NOT DECLINED, AND NOT RULED HERE, BECAUSE THE
RULING IS @HUMAN'S.** The card's own precondition says so and this seat
agrees with it: removing the `.json`-under-`docs/architecture/` branch
makes `map-too-large` unreachable unless the new channel is given a
size limit of its own, and a size limit is a VALUE — the class `T-151`
reserves to @human and that `T-140` refused in writing at
`MAX_FILE_BYTES`'s own definition site. A seat that promoted this card
would be handing a lane either an invented number or a deletion of the
banner `T-140` built as the answer to a silence it measured. STATE
already routes it the same way: *"`T-140-s4` (the graph limit ruling)
is @human's when the alarm's number matters again."*

**RE-DERIVED AT THIS BASE RATHER THAN TAKEN ON THE CARD'S WORD**, and
one half of the card's premise has MOVED: the committed graph is now
**TRUNCATING**. `perl -0777 -ne 'print $1 if /"stats"\s*:\s*(\{[^}]*\})/'
docs/architecture/graph.json` answers `truncated_symbols: true,
truncated_files: 2` at `files: 198, symbols: 2095`, and
`wc -c docs/architecture/graph.json` is 1037788 against the crate's
1040000. So "the alarm's number matters again" is closer than the card's
own measurement suggests, and the value question is live rather than
theoretical. That is a reason to route it, not a licence to answer it.

**RESURFACES:** @human rules the graph size-limit question — here, in
`docs/rooms/`, or in session — OR `T-140-s3` (F-06 p13, the sibling
still on the board) is dispatched, whichever is first. Either event is
checkable by the seat that meets it without remembering this card. A
resurfaced card is RE-DERIVED, never trusted: the census figures in the
body below are stamped at refs that have moved and the card says so
itself.

**T-140 RULED, at `MAX_FILE_BYTES`'s own definition site in
`docs_watch.rs`, that "THE GRAPH LEAVES THIS PIPELINE".** `T-140-s1` built
the channel that makes leaving possible — `arch_rollup` serves the
component picture and `arch_detail` serves file-level detail for one named
target, both reading `docs/architecture/graph.json` Rust-side so the file
never crosses IPC. **It did not remove the `.json`-under-
`docs/architecture/` branch of `is_collected_docs_path`.** This card is
that removal, and it is filed rather than done for a reason that is worth
reading before anyone does it.

## Why `T-140-s1` stopped short, in its own words

The four numbered steps under `T-140-s1`'s "What this card would do" are
its criteria, and **criterion 4 is "keep the honest degradation T-140
built (`map-too-large`) as the backstop for whatever limit the new channel
does carry."** `map-too-large` fires on
`derived.indexNotRun && graphSkip === "oversize"` — the collector's own
`SkipReason::Oversize` row for `graph.json`. Remove the collector branch
and that signal cannot occur, so the backstop the criterion says to KEEP
becomes unreachable unless the new channel is given a size limit of its
own — **and a size limit needs a VALUE, which is the decision `T-151`
reserves to @human and which `T-140` refused in writing at the same
definition site.** A lane that removed the branch and invented a number to
keep the banner alive would be doing `T-151`-shaped work under another
card's name.

So the removal is correct and its precondition is a ruling, not code.

## What it costs today to leave it in place, measured

Nothing on the map, and that is the point of the shape that landed: at any
project size the pane rests on the rollup, whose serialization is a
function of the REGISTRY (measured over synthetic trees in
`crates/nputer-index/tests/budget.rs`: **464 -> 464 bytes, 1.000x, over
23 -> 83 files, 3.61x**, while the graph floor moved 3.61x in the same
run). What it costs is the SNAPSHOT: `graph.json` is still collected,
still counted against `MAX_FILES`, and still the one collected file
anywhere near `MAX_FILE_BYTES` — so every docs push still carries it, for
a consumer that no longer needs it at rest.

## What this card would do

1. Remove the `.json`-under-`docs/architecture/` branch from
   `is_collected_docs_path`, and with it `docs-model.ts`'s `GRAPH_FILE`
   passthrough and `MapView`'s `graphContent` prop — **or say why each
   stays**. The pane's graph-derived path is deliberately retained as the
   browser/dev-harness fallback (`rollup-source.ts` answers `notTauri`
   there), so "remove the prop" and "remove the fallback" are two
   decisions, not one.
2. Re-source or retire `map-too-large` per @human's ruling on the limit
   question above. Retiring it is a legitimate answer — the state it names
   may simply no longer exist once the map is independent of the snapshot
   — but it must be RULED rather than deleted, because `T-140` built it as
   the answer to a silence it measured.
3. Re-measure the collected census at the executing ref. The last two
   readings are `372 files / 7.5 MB / graph.json 13.7%` (T-139) and
   `421 files / 8 215 112 bytes / 12.4%` (T-140, at `a533a4d`); both are
   dated and neither is to be quoted. The harness is
   `app/src-tauri/tests/graph_budget_bench.rs` plus
   `app/test/graph-budget-bench.mjs`.

## Fence and hazards

`touches: [app-shell, app-map]` at minimum (`docs_watch.rs` is C-10's,
`docs-model.ts` C-05's, the pane C-12's). It moves `map-shell-dom`,
`map-view-dom` and `docs-model` bodies by name, and the `docs_watch`
collector tests. **`T-139-s3` holds the general form of the
graph-specific-cap question** and should be read first if the ruling goes
the other way.


## PROMOTED AND RULED (2026-08-30, standing triage sitting #4's seat) — @human ruled RAISE THE BUDGET

**@human's ruling, taken FIRST-HAND in this seat's own session
(2026-08-30): "yes, raise the budget — go ahead".** It was relayed
beforehand by the outgoing integrator session, which recorded the
rationale offered with it and accepted: the 1 MB cap protected the
RESTING map's payload, `T-140-s1` moved the resting map to a rollup so
the full graph is read on DRILL only, and the cap's original pressure is
therefore gone. The relay was treated as context; the word above is the
authority.

**THIS RULING REVERSES `T-151`'s REJECTION, AND THE REVERSAL IS HONEST
RATHER THAN A CONTRADICTION.** `docs/tasks/rejected/T-151-*.md` carries
@human's rejection of "raise the graph budget" from the same day. What
changed is not the argument but a FACT the argument rested on: T-151 was
right that the raise was capped and that spending the gap removed the
early warning — and it was arguing about a graph that was still a
COLLECTED FILE. This card removes it from the collector, which is the
step that dissolves T-151's constraint rather than overruling it.

## THE SEQUENCING FINDING — the raise is capped at 8,575 bytes unless step 1 lands first

Derived at `2370144`, and it is the reason this card carries the budget
constant at all:

    app/src-tauri/crates/nputer-index/src/lib.rs:160   max_graph_bytes: 1_040_000
    app/src-tauri/src/docs_watch.rs:158                MAX_FILE_BYTES: u64 = 1_048_576
    app/src-tauri/src/docs_watch.rs:1908               the_emit_budget_stays_below_the_collectors_file_cap

`graph.json` is subject to BOTH limits, and `lib.rs`'s own doc comment
says why: *"the collector accepts `.json` only under
`docs/architecture/`, a rule written for this file"*. So raising
`max_graph_bytes` ALONE buys at most **8,575 bytes** — about ten files at
T-140's measured floor — and spends the gap that keeps DEGRADATION
(symbols thin, files and import edges survive) in front of the CLIFF
(`SkipReason::Oversize`, the pane receives nothing). **That is exactly
what `T-151` was rejected for.**

**Remove the collector branch — this card's own step 1 — and
`MAX_FILE_BYTES` stops applying to the graph at all**, at which point the
budget is free to rise to a derived number. So the ruling and the removal
are ONE lane in ONE order, which is why the fence now carries
`crate-index` beside `app-shell` and `app-map`.

**AND THE INVARIANT TEST GOES WITH IT.**
`the_emit_budget_stays_below_the_collectors_file_cap` asserts a coupling
whose premise this card deletes. It is RECONCILED — retired with its
reason recorded at the assertion site, or re-aimed at whatever limit the
new channel carries — and never merely deleted to make a suite pass.

## THE ONE SUB-DECISION STILL OPEN, AND IT IS @human's

Step 2 of this card's own list: with the graph out of the collector,
`map-too-large` (`app/src/architecture/MapView.tsx:822`) can never fire,
because the state it names stops existing. The card says retiring it is a
legitimate answer but must be RULED rather than deleted, since `T-140`
built it as the answer to a measured silence. **The seat's recommendation,
routed rather than taken: RETIRE it, and have the lane write one sentence
naming what speaks in its place** — `truncated_files` / `truncated_symbols`
and the crate's own headroom alarm are the live keepers of the signal that
still exists. **DO NOT DISPATCH THIS CARD UNTIL THAT WORD IS GIVEN**; the
rest of the card is ready.

## Derive, do not pick — the new number

The budget's value is the point of the ruling, so it is DERIVED at the
lane's own ref and never rounded to something that looks tidy:

- the graph's NATURAL untruncated size today (regenerate with the budget
  raised high enough not to bind, and read what it wants to be);
- what that costs to read at DRILL, which is the only consumer left;
- growth room proportional to this repository's measured per-merge
  growth — `check::WARN_HEADROOM_BYTES`'s own one-ordinary-merge
  derivation is the pattern to copy, and the alarm should be re-armed
  against the new headroom rather than left pointing at the old one.

Expect a LARGE `graph.json` diff: four files are truncated at this ref and
get their symbols back, `docs_watch.rs` among them at 0 symbols today. The
dogfood pins that count symbols and edges move with it and are re-derived
WITH THE STORY, never loosened.

## THE SUB-DECISION IS RULED — @human, 2026-08-30, in session: RETIRE `map-too-large`

The hold above is DISCHARGED. @human's word, given first-hand to this
seat when the seat routed the question with its recommendation:
**"retire it"**.

So step 2 of this card's list is settled: `map-too-large`
(`app/src/architecture/MapView.tsx:822`) is RETIRED rather than
re-sourced, because once the graph leaves the collector the state that
banner names cannot occur.

**AND THE OBLIGATION THAT COMES WITH RETIRING IT IS NOT DISCHARGED BY
THE RULING** — `T-140` built that banner as the answer to a silence it
MEASURED, so removing it owes one written sentence, at the site, naming
what speaks now. The live keepers are `truncated_files` /
`truncated_symbols` in the emitted graph and `check.rs`'s headroom
alarm, both of which report DEGRADATION; what disappears with the banner
is the report of a CLIFF that can no longer happen. Say that, at the
place the banner used to be, or the next reader inherits a silence with
no note.

## Implementation notes — executor `claude-opus-5@subagent`, 2026-08-30

Lane `/Users/ujju/Projects/nputer-T-140-s4`, branch
`task/T-140-s4-graph-leaves-collector`, base `5073db6`, work commit
`656511f`. Fence: `app-shell`, `app-map`, `crate-index` (64 paths);
nothing outside it is committed.

### 1. The removal, and the two decisions the card asked to be STATED

`is_collected_docs_path` (docs_watch.rs) now answers `Some("md")` and
nothing else. `MAX_FILE_BYTES`'s doc block, which was mostly a
census of the graph's share of the collected payload, is rewritten to
say what it now governs; the T-139/T-140 figures are kept as STAMPS and
marked history. The collected census is **re-derived at this lane's own
ref**: `530 files · 8 441 726 content bytes`, largest member
`docs/tasks/T-110-a-lane-is-a-fact-on-disk.md` at `145 078` bytes,
**13.8%** of the 1 MiB cap
(`find docs -name '*.md' -type f -exec wc -c {} +`). T-015's
`layout.json` loses its free ride deliberately — `git ls-files
'docs/architecture/*.json'` answers `graph.json` alone at this ref, so
nothing exists to break.

**`docs-model.ts`'s `GRAPH_FILE` passthrough STAYS.** Argued at its own
site. The fold is the SNAPSHOT's, not the collector's, and the snapshot
has a second producer: `window.__nputerDocsHarness.apply` hands
`applyDocsPayload` whatever a caller composes (watcher-store.ts, DEV +
`!isTauri`). That is the supply line for `MapView`'s documented
`graphContent` fallback, which `rollup-source.ts` promises for exactly
the case its channel cannot serve (`unavailable: notTauri`).

**`MapView`'s `graphContent` prop STAYS**, same reason, and the card is
right that these are two decisions: removing the prop would remove the
browser fallback, which nobody ruled on.
`app/test/map-dogfood-render.test.tsx` drives that path against the live
repository's graph on every `npm test`, so it is not a hypothetical
reader.

**What did NOT stay, and was not in the card's list:** `graphSkip` (the
prop, and App.tsx's `skipped.find(s => s.path === GRAPH_FILE)` lookup)
and `COLLECTOR_CAP_BYTES`. The eligibility gate in `collect_docs_tree`
runs BEFORE the size gate, so a file that is not collected is never
reported as skipped — `graphSkip` became a `find` over a list that
cannot contain its needle. `COLLECTOR_CAP_BYTES` was worse than
unreachable: a transcribed copy of `MAX_FILE_BYTES` that would have gone
on printing `· over the snapshot cap` for every index of this repository
once the budget passed 1 MiB, which is now a FALSE sentence on screen.

### 2. The cross-crate invariant — RETIRED, with its reason at the site

`the_emit_budget_stays_below_the_collectors_file_cap` is gone and a
block of prose stands where it was, in `docs_watch.rs`'s test module. It
was **not re-aimed**, and the reason is not a judgement call: the new
channel carries no limit to aim it at, and `arch_cmd`'s module doc says
so in writing — *"The read is deliberately UNCAPPED and this is not an
oversight"*. A test re-aimed at a limit that does not exist is a body
that cannot red.

Two other bodies lost their premise with it and are reconciled rather
than deleted:

- `index_cmd::tests::reindex_emits_once_then_never_again` → renamed
  `reindex_is_snapshot_silent_because_the_graph_left_the_collector`. It
  asserted that the graph write emits exactly ONE snapshot; the write is
  now invisible to the collector, so the loop it guarded cannot start
  rather than terminating after one turn. **It gained a POSITIVE CONTROL
  it did not have**, because the re-aimed body is two silences: after
  them it writes one ordinary `.md` into the same watched tree and
  REQUIRES the emit, proving the watcher, channel and debounce were
  alive throughout.
- `symlinked_architecture_json_is_never_followed` →
  `symlinked_docs_file_in_a_subdirectory_is_never_followed`, re-aimed to
  `.md` so it does not go vacuous. What it still covers that
  `symlinks_are_never_followed` does not is the RECURSION arm.

`is_collected_docs_path_accepts_md_anywhere_and_json_only_under_architecture`
and `collects_architecture_json_alongside_md` are replaced by
`is_collected_docs_path_accepts_md_and_nothing_else` and
`collects_no_json_at_all` — the rule INVERTED rather than deleted, so
reinstating the branch reds by name.
`oversized_architecture_json_is_skipped_like_oversized_md` is retired
(its subject cannot exist; `oversized_files_are_skipped` keeps the `.md`
case). `skips_report_only_would_be_collected_files` gains the new rule's
consequence asserted where it bites: an oversized `graph.json` produces
NO skip row at all.

### 3. THE NEW BUDGET: `2_145_959`, and the arithmetic

Everything measured at base `5073db6` with this card's own diff in the
tree, on Darwin 25.6.0.

| term | value | how |
|---|---|---|
| natural untruncated size | **1 134 406** | budget set to 100 000 000, `index --check` asked: `fresh index: 1134406 bytes · 199 files · 2418 symbols · 2331 edges`, `truncated_*` absent |
| first graph.json ever committed | **122 853** | first blob of the `git log --reverse -- docs/architecture/graph.json` size series |
| lifetime growth | **1 011 553** | 1 134 406 − 122 853 |
| **budget** | **2 145 959** | natural + lifetime growth |

**The horizon this states, in one sentence:** the budget binds again when
the graph has grown by everything it has grown since it first existed.
One measured quantity, no free coefficient to argue about — which is why
it is this rule and not `k × mean`.

**Cross-checked in the unit the alarm speaks.** One ordinary merge's
growth, re-derived here, is **13 921** bytes (mean of the **68** positive
single-commit growths; median 4 501, max 241 980 at T-010). So the room
is `1 011 553 / 13 921 = 72.7` ordinary merges, against **68** growths on
the entire record. Two independent framings — "double the lifetime" and
"one more lifetime of merges" — agree to within 7%. That is the reason
the number is stated rather than rounded to 2 MiB (2 097 152), which
would have meant nothing.

**What it costs the only consumer left, measured rather than assumed.**
The graph is now read on a DRILL only — `arch_cmd::load`: `fs::read` plus
`serde_json::from_slice::<Graph>`, Rust-side, never crossing IPC.
`app/src-tauri/tests/graph_budget_bench.rs` gained that stage (the two
collector stages it owned are the ones this card removed, so a harness
left as it was would have been measuring a dead path). Release build,
min of 9 trials after a discarded warm-up:

| graph bytes | D read | D deserialize | total |
|---|---|---|---|
| 1 039 590 (LIVE, pre-raise) | 31 us | 1 017 us | **1.05 ms** |
| 1 997 524 | 51 us | 1 849 us | 1.90 ms |
| 3 993 948 | 91 us | 3 628 us | 3.72 ms |
| 7 997 517 | 211 us | 7 357 us | 7.57 ms |
| 25 839 104 | 1 206 us | 23 581 us | 24.79 ms |

Linear, no knee, ~0.93 us/KB. **At the new ceiling a drill costs about
2.0 ms, paid on a click.** The same harness measures the docs snapshot
this app ships on EVERY push at **9 830 us to collect and 4 094 us to
encode**, so the drill is an order of magnitude off the stage that binds.
**Term 2 therefore does not set the number — it proves term 3
affordable**, which is the honest way round.

**THE SELF-REFERENCE, NAMED AT THE SITE.** The regen at the finished
tree answers **1 134 409**, three bytes above the 1 134 406 the
derivation used: the derivation is written into `.rs` files that are
themselves inside the walk (this doc comment and the bench's drill
stage). The constant is deliberately NOT chased to a fixed point — each
correction is also indexed. It is a ceiling; three bytes against
1 011 549 of headroom.

**THE ALARM RE-ARMED.** `check::WARN_HEADROOM_BYTES` 14 914 → **13 921**,
by its own stated derivation at this lane's ref (the series to date:
15 751/55 at `13c736e`, 14 914/61 at `9ed2b7f`, 13 921/68 here). Two
things are written at the site that were not there before: that the last
seven growths were measured under a BINDING budget and so bias this mean
DOWNWARD — the safe direction, it fires early — and that the constant no
longer sits under a second limit, so what it warns about is now exactly
one thing.

**Post-raise, from `index --check` (exit 0, CURRENT):**
`budget: 1134410 of 2145959 bytes (52.9%) - 1011549 left`;
`floor: 230079 of 2145959 (10.7%) - 1156 bytes/file … about 1856 files`.
Graceful degradation now ends at ~1 856 files where it ended at ~898.
That is a FACTOR and not a new curve — exactly what T-140 said a raise
would buy — so this constant still is not the answer to "how large a
project can the map hold". It is the answer to "how long before the map
stops answering what is in a file".

### 4. `map-too-large` RETIRED, and the sentence it owes

@human's ruling of 2026-08-30 applied. The banner is gone from
`MapView.tsx` and a comment stands in its place carrying the obligation
in as many words: **what speaks now is `truncated_files` /
`truncated_symbols` in the emitted graph and `nputer_index::check`'s
headroom alarm at `index --check`, both of which report DEGRADATION —
symbols thinned, files and import edges kept. What vanishes with the
banner is the report of a CLIFF that can no longer happen**, because
`is_collected_docs_path` no longer carries the graph at any size and a
file that is never collected is never `SkipReason::Oversize`. What the
banner said, and why T-140 built it, is preserved in the same comment.

`map-view-dom`'s pair-assertion collapses to its control arm and is
re-aimed rather than deleted: the retirement is PINNED (a re-introduced
`map-too-large` under any condition reds), and the retired
`· over the snapshot cap` arm is pinned by asserting that a graph far
past the old constant now reads like any other.
`map-shell-dom`'s shell-wiring body is retired with T-140's verdict
correction 2 recorded at the site — the lesson it taught is still paid
for by the neighbouring body, which drives the real App through the
harness with a real graph and so still kills a cut `graphContent` wire.

### 5. The regen and the pins

`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, then `index --check`: **CURRENT, exit 0**, `1134410 bytes ·
199 files · 2418 symbols · 2331 edges` (from `1039590 · 199 · 2067 ·
2334`, `truncated_symbols: true, truncated_files: 4`). The four
truncated files get their symbols back: `agent/runner.rs` 0→71,
`dispatch/brief.rs` 0→81, `docs_watch.rs` 0→55,
`tests/agent_runner.rs` 0→145.

**Exactly ONE pin moved**, and it moved with the story:
`["C-12","C-10","confirmed",7]` → `6` in
`app/test/architecture-dogfood.test.ts`. Established as an IDENTITY, not
inferred from a count: the pre-regen graph carried exactly one
`app/src/architecture/** -> docs-model.ts` edge —
`f:app/src/architecture/MapView.tsx -> f:app/src/lib/docs-model.ts`,
kind `import`, the `import type { SkipReason }` that fed the retired
prop — and the regenerated graph carries none. The pair stays
`confirmed` because `churn-source.ts` and `rollup-source.ts` still read
the watcher store. `map-dogfood-render.test.tsx` did **not** move: no
component node changed, and the vanished edge was already folded into a
pair that survives. `lib/parser`'s registry pin did not move either —
the registry is untouched.

**AND THE GRAPH ITSELF IS NOT COMMITTED**, because
`docs/architecture/graph.json` is outside this lane's fence (the hook
refuses it by name, exit 2) and CONVENTIONS gives the regen to the
integrator's checkpoint. **So the branch at `656511f` carries the new
pin and the old graph**: a fresh checkout reds `architecture-dogfood` by
one row and reds `index --check` as STALE, while this worktree is green
because it holds the regenerated file uncommitted. Both are true and
neither is a defect in the work. Routed as `T-140-s8` with three
dispositions and a recommendation. **Verifier: reproduce in this
worktree, which lane-protocol rule 6 preserves for exactly this reason.**

### Gates — every command with its exit

Run in the lane worktree unless stated.

| command | from | result |
|---|---|---|
| `npm ci` | lib/parser | 0 |
| `npm run build` | lib/parser | 0 |
| `npm install` | app | 0 |
| `npm run build` | app | **0** (the app's typecheck; `npm run typecheck` does not exist here) |
| `npm test` | app | **0** — 49 files, **1059 passed** |
| `cargo test` | app/src-tauri | **0** — 18 result lines all `ok`, **588 passed**, 0 failed |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | **0**, CURRENT — `1134410 bytes · 199 files · 2418 symbols · 2331 edges`; `budget: 1134410 of 2145959 (52.9%) - 1011549 left` |
| `npx vitest run` | lib/parser | **0** — 16 files, **336 passed** (the DOCS GATE's reader: this lane's four `docs/tasks/` files parse) |
| `npx tsc --noEmit` | lib/parser | **0** |
| `cargo test --release … graph_budget_bench -- --ignored` | app/src-tauri | 0 (measurement, not an assertion) |

**RANGE RULE, run rather than quoted.** `main` had advanced five
docs-only commits past this lane's base by the time the notes were
written (`5073db6` → `c745f9c`, none of them inside this fence).
`TREE=$(git merge-tree --write-tree $(git rev-parse main) HEAD)` exits
**0** — a tree, not a conflict report, which is the exit this rule says
to read — and `git diff --name-only main "$TREE"` returns **15 paths**:
the eleven source files above plus the four `docs/tasks/` files. Never
`main..HEAD`.

**One warning observed and NOT mine**, said so nobody attributes it to
this diff: `cargo test` prints `unused import: Path` at
`app/src-tauri/src/arch_cmd.rs:2`. `git diff 5073db6 HEAD --
app/src-tauri/src/arch_cmd.rs` is **0 lines**, and the same warning
builds at the base in the drill worktree. It is inside this fence and
out of this card's scope; left alone deliberately rather than swept.

Standing gates DERIVED from this lane's own diff, via the RANGE RULE's
pre-merge form (`git merge-tree --write-tree main HEAD`, then
`git diff --name-only main $TREE`), never `main..HEAD`:

- **GRAPH REGEN — FIRES.** The diff touches `.rs` and `.tsx` outside
  docs/. Regenerated; `index --check` exit 0 CURRENT in this worktree.
  The COMMIT of `graph.json` is the checkpoint's (see above).
- **BOOT GATE — FIRES.** The diff touches `app/src-tauri/**` and
  `app/src/**`. NOT RUN, and stated rather than implied: it spawns
  `tauri dev` and opens a real window, the human's app holds 1420
  (`lsof -nP -iTCP:1420 -sTCP:LISTEN`, read live in this session), and
  the executor's honest position is that the desktop half was not
  exercised. Recommend `NPUTER_BOOT_PORT=<derived> npm run boot:check`
  at verification.
- **DOCS GATE — FIRES.** The diff touches `docs/tasks/**` (this card,
  `T-140-s8`, `T-140-s9`, and a corroboration on `T-167-s6`), which
  `lib/parser` reads. `npx vitest run` from lib/parser covers it.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.

### THE DRILL LEDGER

Detached worktree `/tmp/nd-T-140-s4` at `656511f` (short root, T-133-s5),
`CARGO_TARGET_DIR=/tmp/nd-T-140-s4/target` — inside itself, the
walk-safe form (T-111-s10). One stem for the worktree, its target dir,
its driver and its logs. The regenerated `graph.json` was staged into it
by hand, because the drilled dogfood pin has no evidence without it.
Baseline before mutating: cargo **588 passed**, app **1059 passed**.
Every mutation READ BACK by `git diff` before its suite ran.

| # | side | mutation | result |
|---|---|---|---|
| A | code | `Some("md")` → `Some("md") \| Some("json")` in `is_collected_docs_path` | **RED, 4 bodies**: `collects_no_json_at_all`, `is_collected_docs_path_accepts_md_and_nothing_else`, `skips_report_only_would_be_collected_files`, `reindex_is_snapshot_silent_because_the_graph_left_the_collector` |
| A2 | code | same mutation, bench harness | **RED** at `graph_budget_bench.rs:381` with its own message |
| A3 | code | `Some("md")` → `Some("mdx")` (collector blinded to markdown, graph still out) | **RED at the POSITIVE CONTROL's own assertion**: *"an ordinary .md write must still emit — the two silences above are the collector's rule, not a dead watcher: Timeout"* |
| B | code | lift `is_symlink → continue` (`&& false`) | **GREEN — a finding**, see below |
| B2 | code | lift `is_symlink` AND `!canon.starts_with` | **GREEN — a bigger finding** |
| B3 | assertion | expected paths gain `docs/architecture/link.md` | **RED, exactly 1 body**: `symlinked_docs_file_in_a_subdirectory_is_never_followed` |
| C | code | `len > MAX_FILE_BYTES` → `* 4` | **RED, 4 bodies** incl. `skips_carry_paths_and_reasons_for_oversize_and_non_utf8` |
| D | code | re-introduce the `· over the snapshot cap` suffix in `indexHint` | **RED**, the header-hint body |
| E | code | resurrect a `map-too-large` `<p>` under `derived.indexNotRun` | **RED**, *"expected 'too large to map…' not to contain 'too large to map'"* |
| F | assertion | the moved pin `6` → `7` | **RED**, the dogfood relation table |

**B AND B2 ARE THE FINDING AND ARE ROUTED AS `T-140-s9`.** The
collector's symlink refusal is guarded THREE times — `is_symlink`, the
canonical prefix check, and `relative_posix`'s own `strip_prefix`, the
last being the second predicate written a second time — so neither
symlink body can be poisoned by lifting fewer than three, and the two
tests report coverage of layer 1 that they do not have. B3 proves the
re-aimed body is not vacuous. **Not caused by this card**: the same
three layers exist at `5073db6`.

**RESTORATION PROVED BY sha256** against `git show 656511f:<path>` for
all ELEVEN changed files, every one identical:

    a0cc4122…  app/src-tauri/src/docs_watch.rs
    a8d14bdd…  app/src-tauri/src/index_cmd.rs
    49a05f33…  app/src-tauri/tests/graph_budget_bench.rs
    33615b3f…  app/src/architecture/MapView.tsx
    5c981ea0…  app/src/App.tsx
    0740950d…  app/test/architecture-dogfood.test.ts
    8bef7641…  app/test/map-view-dom.test.tsx
    4ef54435…  app/test/map-shell-dom.test.tsx
    36e25c70…  app/src/lib/docs-model.ts
    dd6a9782…  app/src-tauri/crates/nputer-index/src/lib.rs
    bd9b8caf…  app/src-tauri/crates/nputer-index/src/check.rs

Restored suites: cargo **588 passed / 0 failed**. The app suite first
answered **2 failed** — both the stale-build mtime guard
(*"dist/ predates src/architecture/MapView.tsx"*), which is CONVENTIONS'
own *"restoring a fixture means its bytes AND its clock"* arriving from
the `git restore` side rather than a plant's. The BYTES were already
proved identical by hash; `npm run build` then **1059 passed**. Recorded
rather than quietly rebuilt, because a reader who sees two reds after a
restore should know which kind they are.

### Routed, not built

- **`T-140-s8`** (new): a card that moves the emit budget cannot commit
  the graph its own change regenerates.
- **`T-140-s9`** (new): the triple-guarded symlink refusal, from drills
  B/B2.
- **`T-167-s6`** (existing, CORROBORATED not re-filed): the health band
  `graph/budget-headroom-bytes` still carries T-139's `15 751` while
  `WARN_HEADROOM_BYTES` is now `13 921` — a third re-measurement, the
  crate moving while the band stands still. Added: the band's DRIFT arm
  at `63 004` is now sixteen times inside a healthy reading and may have
  stopped discriminating. `tools/e2e` is outside this fence.

### Where the brief was wrong

Both defects were pre-declared by the dispatcher and are confirmed here
at this lane's own ref, not taken on its word.

1. **ROW 4's worktree path** reads
   `/Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-140-s4` — a
   path INSIDE the repository, which lane-protocol rule 3 forbids. The
   real lane is the sibling `/Users/ujju/Projects/nputer-T-140-s4`, which
   is also what `.nputer/lane-fence.json` and `git worktree list` say.
   Already filed as `T-179`; not re-filed.
2. **ROW 3's read-first list** names `docs/ROADMAP.md`, which
   `method/roles/executor.md` step 1 subtracts. Not read. Already filed
   as `T-112-s3`, in flight; not re-filed.

Two further corrections, mine:

3. **The card's own step 3** asks for a re-measured collected census via
   `graph_budget_bench.rs` + `app/test/graph-budget-bench.mjs`. After
   step 1 the census is one extension and the harness is the wrong
   instrument for it: `find docs -name '*.md' -type f -exec wc -c {} +`
   is the whole derivation, and it is what the constant's doc now names.
   The harness was still updated, for the drill stage.
4. **The dispatch's step 5** says to regenerate the graph and reconcile
   the pins. The pins are in the fence and the graph is not, so half of
   that instruction cannot be committed from inside this lane. Done as
   far as the fence allows and routed as `T-140-s8` — not widened from
   inside, per lane-protocol rule 5.

## Verdicts

### 2026-08-31 — `claude-opus-5@subagent` — APPROVED WITH ASSIGNED CORRECTIONS

Verified in the lane worktree `/Users/ujju/Projects/nputer-T-140-s4` at
`2170fa8`, not a fresh checkout — the regenerated `graph.json` is
uncommitted by design and the worktree is where the true state lives.

**PHASE 1 WAS KEPT.** The attack set — **54 attacks** — was written from
the card at its base ref `5073db6`, plus CONVENTIONS, ARCHITECTURE,
`method/roles/verifier.md` and the base-commit code, BEFORE the diff,
the commits or the implementation notes were opened. It is on disk at
`…/scratchpad/T-140-s4-attack-set.md` with its sources enumerated. The
dispatching brief named no executor-derived specifics, so the two phases
were separable. **51 attacks found the work sound; 3 landed.**

**GATES, RUN IN THIS SEAT, EXITS READ UNPIPED.**

| gate | exit |
|---|---|
| `cargo test` (app/src-tauri) | **0** — 251 + 87 + 197 + 10/4/16/3/3/9/4/1 passed, 0 failed |
| `cargo run -p nputer-index -- index --check --root ../..` | **0** — CURRENT, 1 134 410 bytes · 199 files · 2418 symbols · 2331 edges |
| `npm run build` (app) | **0** |
| `npm test` (app) | **0** — 49 files, 1059 tests |
| `npx vitest run` (lib/parser) | **0** — 16 files, 336 tests |
| `npm run lint:tokens` (tools/e2e) | **0** |
| `npm run lint:docs` (tools/e2e) | **0** |
| **`NPUTER_BOOT_PORT=14144 npm run boot:check`** | **0** |

**THE BOOT GATE FIRED ON THIS DIFF AND HAD NOT BEEN RUN. IT IS RUN NOW
AND IT PASSES.** Both startup lines observed:
`[nputer] project folder: /Users/ujju/Projects/nputer-T-140-s4` and
`[nputer] window "main" created`. Port 14144 was derived (14000 + card
140 + sub-lane 4) and `lsof`-ed to zero rows before and after; 1420 was
READ ONLY, with `lsof -nP -iTCP:1420 -sTCP:LISTEN`, before and after —
zero rows both times, never probed.

**MUTANT LEDGER** — derived from the acceptance criteria with the test
files closed, drilled in the detached scratch worktree
`/private/tmp/nd-T-140-s4` under its own `CARGO_TARGET_DIR`, each
mutation read back with `git diff` before running and every restoration
proven by sha256 against the committed blob. **5 killed, 2 explained
survivors.**

| # | mutation | result |
|---|---|---|
| M1 | restore the `.json`-under-`docs/architecture/` branch | **KILLED** by 4 bodies — `is_collected_docs_path_accepts_md_and_nothing_else`, `collects_no_json_at_all`, `skips_report_only_would_be_collected_files`, `reindex_is_snapshot_silent_because_the_graph_left_the_collector` |
| M2 | `max_graph_bytes` → `1_040_000` | **KILLED** — `index --check` exit 1 STALE, delta naming `stats.truncated_symbols None -> Some(true)`, `truncated_files None -> Some(4)` |
| M3 | `max_graph_bytes` → round `2_097_152` | **SURVIVED, explained** — no body restates the literal, which is this project's own doctrine (`T-010-s3` arm 2's trap). The STALE seen was my own edit to an indexed file (`~1 … lib.rs (content)`), identical for any edit |
| M4 | re-introduce a `map-too-large` banner | **KILLED** — `map-view-dom.test.tsx` |
| M6 | delete App.tsx's `graphContent` spread | **KILLED** — `map-shell-dom.test.tsx`, confirming the deleted shell body's coverage is genuinely picked up by its neighbour |
| M7 | re-introduce `· over the snapshot cap` | **KILLED** — `map-view-dom.test.tsx` |
| M8 | `WARN_HEADROOM_BYTES` → `14_914` | **SURVIVED, explained** — the alarm's tests are relative (`> WARN_HEADROOM_BYTES`); restating the threshold would pin nothing |

**WHAT I RE-DERIVED RATHER THAN ACCEPTED, ALL AT MY OWN REF.** Every
figure the lane states reproduces exactly. The blob series gives **68**
positive growths, mean **13 921**, median **4 501**, max **241 980**,
first blob **122 853** — so `WARN_HEADROOM_BYTES` is genuinely re-armed
rather than scaled. `1_134_406 + (1_134_406 − 122_853) = 2_145_959`
holds. The census reproduces at **530 files · 8 441 726 bytes**. The
regenerated graph is untruncated and its symbol delta is an identity:
all four previously-truncated files restored (`runner.rs` +71,
`brief.rs` +81, `docs_watch.rs` +55, `agent_runner.rs` +145 = +352)
less MapView's deleted constant (−1) = **+351**. The single moved
dogfood pin is likewise an identity — my own edge-set diff of the two
graphs returns exactly three losses and no gains: one `import` edge
`MapView.tsx → docs-model.ts` (the `C-12 → C-10` decrement) and two
`type_ref` edges to `SkipReason`. **The pin was moved with the story,
not loosened.** `git status` shows `docs/architecture/graph.json` as the
ONLY uncommitted path, and `index --check` proves it byte-exact to a
fresh index, so the account of it is confirmed and nothing hides behind
it.

**WHAT THE HARDEST ATTACKS FOUND.** The retirement of the cross-crate
invariant is a premise deletion, not a convenience: its reason stands at
its own site, its two `.json`-arrival siblings are INVERTED rather than
deleted, and the symlink body was re-aimed to `.md` precisely so it
would not pass vacuously. The banner's obligation is paid AT THE SITE
and pays both halves — what speaks now (`truncated_files` /
`truncated_symbols`, the headroom alarm, both DEGRADATION) and what
disappears (the report of a CLIFF that can no longer happen) — and I
confirmed the named keeper really renders (`MapView.tsx`, *"symbols
truncated for N files"*). The two-decisions rule was respected: both the
`GRAPH_FILE` passthrough and the `graphContent` prop STAY with written
reasons, and M6 proves the fallback is pinned rather than merely
described. `COLLECTOR_CAP_BYTES` was found and removed as a transcribed
constant that would have become *reachable and WRONG* — a defect the
card did not name and the lane caught itself.

#### Correction 1 — the budget's cross-check is presented as independent corroboration and is an algebraic near-identity

In `IndexOptions::max_graph_bytes`'s doc comment (and restated in
section 3 of the notes above): *"Two independent framings — 'double the
lifetime' and 'one more lifetime of merges' — agreeing to within 7% is
the reason this number is stated rather than rounded."*

They are not independent. Writing `L` for lifetime growth, `P` for the
sum of positive growths, `N` for the sum of shrinks and `T` for the
truncation the raise recovers, the merge figure is
`L / (P/68) = 68 × (1 − N/P + T/P)` — the count 68 is a FACTOR of the
left-hand side, so the comparison is 68 against 68 × 1.069 and cannot
come out anywhere else unless shrinkage or recovered truncation
approached the whole growth history. Measured here: `N/P = 3.2%`,
`T/P = 10.0%`, and the "7% agreement" is exactly that residue. It has no
power to disconfirm, so it is not evidence.

**This does not make the number wrong** — the chain is two honestly
measured quantities with no free coefficient, and every term reproduced
at my ref. What is wrong is one sentence of justification a later reader
will rely on. **The correction:** delete the "two independent framings /
agree to within 7%" claim, and state the merges figure for what it is —
a RESTATEMENT of the same growth series in the alarm's unit, useful for
intuition and not a second measurement. The "why not 2 MiB" sentence
stands on its own without it: the number is derived and a round one
would not be.

#### Correction 2 — the finished-tree figure is one byte stale and carries no ref

The same doc comment says the regen at the finished tree answers
`1_134_409`, *"three bytes"* above term 1. At the lane tip `2170fa8`
both `wc -c` and `index --check` answer **1 134 410** — four bytes.
The comment already explains the self-referential mechanism and names
`index --check`'s `budget:` line as the authority, which is why this is
a nit and not a defect; but the sentence states a figure for "the
finished tree" with no ref, which is the shape `method/roles/verifier.md`
warns goes wrong the moment anyone writes again. **The correction:**
either stamp it (`1_134_410 at 2170fa8`) or drop the specific number and
keep the mechanism sentence.

#### Correction 3 — `T-167-s6` is filed `status: planned` by an executor

`docs/tasks/T-167-s6-…md` carries `status: planned`.
`method/tasks/TASK-FORMAT.md` is explicit: *"Only the ARCHITECT
(planner/orchestrator role) creates tasks with status: planned …
Everyone else suggests."* Its two siblings from this same lane
(`T-140-s8`, `T-140-s9`) correctly carry `status: suggested`, so this is
an isolated slip. It is NOT a gate failure — `npm run lint:docs` exits 0
and `planned` is legal vocabulary; the gate checks the status is legal,
not who wrote it. **The correction:** set `status: suggested`, and
change `suggested_by: executor claude-opus-5@subagent @T-167-s2` to
`@T-140-s4`, which is the lane that actually found it.

#### Not corrections

The health-band divergence (`15_751` vs `13_921`) is correctly NAMED at
`check.rs`'s own site and routed rather than reached for across the
fence; `tools/e2e` is outside `touches` and was rightly not touched. The
uncommitted `graph.json` is the lane-protocol arrangement working, and
the lane disclosed the underlying fence problem itself as `T-140-s8`
rather than leaving it to be found. `T-140-s9` files a POISON DRILL
survivor the lane was under no pressure to report. Security sweep: no
dependency changes, no `unsafe` added, no new input path — the diff
REMOVES a collection surface. `arch_cmd`'s uncapped read predates this
card and carries its own written argument.

`status:` left at `verifying` for the integrator, per the dispatch.
Gates above were re-run at the tip this verdict was written against; the
three corrections are prose-and-frontmatter only and move no gate.
