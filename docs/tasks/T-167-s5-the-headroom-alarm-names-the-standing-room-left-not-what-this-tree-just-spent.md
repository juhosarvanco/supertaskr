---
id: T-167-s5
title: The graph gate's budget block says nothing about what this tree DID to the graph — it names the standing room left (the same number for everybody) and stays silent while symbols are being dropped, which is the state that means the opposite of relief
feature: F-06
milestone: 4
priority: 7
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-167-s2
blocked_by: []
touches: [crate-index]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-167-s7 (standing triage sitting #3, 2026-08-30) — the same
function, the same fence, the same printed block, and the two asks are
the two halves of one sentence: what this working tree SPENT, and what
the emitter had to DROP. Its file is removed in this commit; the whole
of its content is carried below under THE DEGRADATION HALF.

**CLASS PARENT: `T-167-s2`.** `T-167-s2` made `index --check` shout
below `check::WARN_HEADROOM_BYTES` of room. What it shouts is the room
LEFT — a property of the tree, not of the reader's diff. Derived in that
lane at `3b6098ebea80f198911b176a865594c7d0726378`: the block says
`6865 bytes left`, and it will say very nearly that to every lane that
runs the gate until the payload shape moves. **A number that is the same
for everybody is read once and then becomes wallpaper**, which is the
habituation `T-167-s2`'s own doc comment warns about one level down
("a block that printed on every run would be a banner").

The number that would not go stale on the reader is THEIR OWN SPEND, and
`CheckReport` already carries both halves: `committed_bytes` is the room
the tree had when the graph was last regenerated and `fresh_bytes` is
what this working tree would write. Their difference at that same ref
was **530 bytes** — the cost of that lane's single edited file, and
exactly the sentence a lane needs to see: *this working tree spends 530
of the 6,865.* On a CURRENT graph the two are equal and the clause
should simply not print, which is also the state where it would say
nothing useful.

Cheap, and inside one fence: `check::headroom_alarm` in
`app/src-tauri/crates/nputer-index/src/check.rs`, one conditional clause,
no new symbol, no change to `budget_line` or `floor_line` (whose format
strings are pinned from `tools/e2e` by symbol — see
`health-bands.spec.ts` — and must stay put). The positive control has a
shape already: the same tree at two budgets is `T-167-s2`'s control, and
this one wants the same tree at two COMMITTED graphs.

## THE DEGRADATION HALF (absorbed T-167-s7, filed by the integrator at the T-169 merge regen)

Measured at the T-169 merge regen, one command
(`index --check --root ../..` from the Rust workspace), two consecutive
regens on the same day:

- T-025-s6's regen: 190 files, **2,205 symbols**, 1,035,307 bytes —
  99.5%, ALARM printing (4,693 left under the 14,914 tripwire).
- T-169's regen: 192 files, **2,084 symbols**, 1,005,840 bytes —
  96.7%, **NO ALARM** (34,160 left).

Two files JOINED and 121 symbols VANISHED: `apply_budget` began
dropping symbol arrays largest-first — the honest degradation T-140
built — and the emitted file SHRANK below the tripwire, so
`headroom_alarm` fell silent at the exact moment the graph started
lying by omission. The check output prints NOTHING about the drop:
no dropped-symbols count, no per-file thinning list, and the CURRENT
verdict reads as clean health.

The ask: degradation is a LOUDER state than low headroom, not a
cure for it — when the fresh emit dropped anything, the alarm block
prints the dropped count (and ideally which files thinned), and low
headroom stays the lesser warning beneath it. This is the case
where "spent" goes negative and means the opposite of relief.
`T-140-s1` remains the real fix and its urgency is now measured in
dropped symbols, not remaining bytes.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p7, CARRYING BOTH HALVES**, at `@ 51fa31c0964c`. Its
own disposition hint asked to be promoted "behind whatever moves the
budget next"; `T-140-s1` has landed, so that condition is met and the
alarm is now a moving number rather than a standing one.

**THE ABSORPTION IS NOT A TIDY-UP — IT IS THE ONLY WAY EITHER HALF CAN
BE BUILT.** Both cards edit `check::headroom_alarm`, the same function
in the same file behind the same one-slug fence, and both add a clause
to the same emitted block. Two lanes would be two lanes editing one
function; a second lane would rebase onto the first's rewrite of the
very lines it came to change. And the ORDER matters within the block —
`T-167-s7`'s whole ask is that the degradation clause sits ABOVE the
headroom clause as the louder state — which is a decision a single
author has to take once, not a merge conflict to resolve.

**THE DEGRADATION HALF IS LIVE AT THIS BASE, AND DERIVABLE WITHOUT A
BUILD**, which is more than the absorbed card could show at filing time.
The committed graph is CURRENTLY TRUNCATING:

    perl -0777 -ne 'print $1 if /"stats"\s*:\s*(\{[^}]*\})/' docs/architecture/graph.json
    -> "files": 198, "symbols": 2095, "edges": 2292,
       "truncated_symbols": true, "truncated_files": 2

    wc -c docs/architecture/graph.json   -> 1037788   (budget 1_040_000)

So at `@ 51fa31c0964c` the emitter is dropping symbol arrays from two
files AND the emit is UNDER budget — which is precisely the state
neither printed line describes. Read the code at this ref and the
silence is structural, not incidental: `budget_line`'s
degradation sentence is inside its `used > budget` arm, and
`headroom_alarm`'s is inside the identical arm. **Under budget, in both
functions, the word "dropped" cannot be printed at all.** The absorbed
card inferred that from two regens; it is readable here from one file
and forty lines.

**ONE CORRECTION TO THE ABSORBED HALF, MADE RATHER THAN RULED.** Its
measurement block cited the command as run "from app/src-tauri/". That
path token is a declared component's territory and the preflight reads
criteria and prose for exactly such tokens; the command is unchanged and
the directory is now named by its role. Nothing about the measurement
moves.

**WHAT THIS CARD DOES NOT CLAIM.** It does not claim the 121 vanished
symbols of the absorbed measurement were ALL `apply_budget`'s doing —
two files joined the walk in the same regen and real code moved under
it, so some of that delta is the tree rather than the emitter. The
lane does not need the attribution: `truncated_symbols` and
`truncated_files` are the emitter's own record of what IT dropped, they
are what the criteria below print, and they are true at this base
regardless of how the 121 decomposes. A criterion resting on that
decomposition would have been a criterion resting on an inference.

## Acceptance criteria

- WHERE the fresh emit dropped anything — `truncated_symbols` set, or
  `truncated_files` non-zero — THE alarm block SHALL print the drop and
  SHALL do so whether or not the emit is over budget. THE under-budget
  case is the one that has no printed sentence today and is the reason
  this criterion exists.
- WHERE both a drop and low headroom are present, THE drop SHALL be the
  louder of the two and SHALL read as the more serious state: a graph
  that is smaller than the tree it describes is not relief, and a block
  that lets a reader mistake it for relief has failed.
- WHERE a fresh index differs in size from the committed graph AND the
  alarm is armed, THE block SHALL name the difference as this working
  tree's own spend, beside the room left.
- WHERE the committed graph is current, THE block SHALL NOT print a
  zero-byte spend — a clause that says "0" every time is the wallpaper
  this card is against.
- THE change SHALL carry a positive control for EACH clause
  (`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`): for the spend, one
  tree at two committed graphs with the printed spend differing by
  exactly the difference between them; for the drop, one tree emitted at
  two budgets, dropping at one and not at the other, with the block
  differing accordingly.
- THE change SHALL NOT move `budget_line` or `floor_line`, and SHALL NOT
  change the exit code — `T-167-s2`'s notes carry the reason for both,
  and `health-bands.spec.ts` pins those two format strings by symbol
  from another package.

**PREFLIGHT AT PROMOTION.** `node scripts/brief.mjs --task T-167-s5
--preflight`, run from the e2e package at `@ 51fa31c0964c`: **exit 0**,
the card ruled `startable`, `crate-index` held by no lane, paths missing
**0**, unrunnable figures **0**, ref stamps **1 of 1 resolving**. One
path is REPORTED and not refused — the e2e package directory, named as
the working directory of the derive command in this very paragraph,
which is a citation and not a write claim; the tool's own note says a
path under no component is never refused on.

## Implementation notes

Built at base `0a8dd5861f4620885d7040dea56f3e2ad6967502` (derived
`git merge-base main HEAD`, which equalled HEAD — the lane was cut and
not yet advanced). Implementation `4133ab8`, +429/-1 on one file.

### WHERE THE CARD IS WRONG, and it is the card's own live premise

**THE COMMITTED GRAPH IS NOT TRUNCATING AT THIS BASE.** The card's
"THE DEGRADATION HALF IS LIVE AT THIS BASE, AND DERIVABLE WITHOUT A
BUILD" section was measured at `@ 51fa31c0964c`, and every figure in it
has moved. Re-derived at `0a8dd58` with the card's own command:

    perl -0777 -ne 'print $1 if /"stats"\s*:\s*(\{[^}]*\})/' \
      docs/architecture/graph.json
    -> "files": 200, "symbols": 2456, "edges": 2379

`truncated_symbols` and `truncated_files` are **ABSENT** — they are
`skip_serializing_if = "Option::is_none"`, so their absence IS the
emitter's record that it dropped nothing. `wc -c` is `1153961` against a
budget of `2_145_959` (`IndexOptions::default`, lib.rs), leaving
**991 486 bytes** — about seventy times the tripwire. T-140-s4 raised
the budget between the card's ref and this one and unclamped the graph.

**This does not weaken a single acceptance criterion**, and the card is
right that it does not need to: the criteria are about what the BLOCK
does in each state, and the states are reachable through `IndexOptions`
in a fixture. What it does mean is that the lane could not use the live
tree as its own demonstration, so every state below is measured on a
fixture driven through the real `index()`/`apply_budget`, never a
hand-built `CheckReport`.

**THE CARD'S COST ESTIMATE IS ALSO LOW, in a way worth naming.** It says
"one conditional clause, no new symbol". The SPEND half is that. The
DROP half cannot be: `CheckReport` carried no truncation information at
all — `fresh_stats` is `(files, symbols, edges)` — so the emitter's own
record had to be plumbed into the struct as two new fields. That is
still entirely inside the fence (`CheckReport` is constructed only in
`check.rs`; derived, not assumed — `git grep CheckReport` over
`app/src-tauri` returns nothing outside that file at this ref).

### THE UNIT, stated because this family has got it wrong three times

`T-194` headed one *complete* while omitting a refusal, `T-196` lettered
five where eleven mechanisms existed, `T-208` counted four constructs
where six existed — a unit MISMATCH rather than an omission. So:

**THE DROP CLAUSE'S PRINTED COUNT IS IN FILES — files whose symbol array
was emptied — AND NEVER IN SYMBOLS.** `apply_budget` records
`truncated_files = all_dropped.len()`, a count of files; the number of
symbols inside those arrays is written down nowhere and cannot be
recovered from the emitted document, because a file with an empty
`symbols` array is indistinguishable from a file that never had any. The
unit is in the printed line itself (`unit: FILES whose array was
emptied, never symbols`) and in the field's doc comment, so a reader
cannot take it for the symbol count the absorbed half's prose implies
("121 symbols VANISHED").

**AND THE COUNT AND THE FLAG ARE TWO FACTS, NOT ONE.** `apply_budget`'s
floor arm sets `truncated_symbols` while leaving `truncated_files`
unset (emit.rs — the `costs.is_empty()` branch guards the count with
`if !all_dropped.is_empty()`). So `truncated_files == 0` does NOT imply
an untruncated emit, and a clause reading only the count would go silent
in the worst state of all. Both are carried; the clause fires on either;
the floor case gets its own sentence rather than printing "0 files".

### The four criteria, and how each was measured

1. **Drop prints whether or not the emit is over budget.** The drop is
   derived BEFORE any budget arm. The proof is the under-budget half,
   because the over-budget half already worked: fixture of one fat file
   (400 symbols) and three thin ones, budget `fresh - 1000`; the emitter
   drops the fat array and lands **1761 of 82496 bytes, 80 735 left** —
   healthy by the tripwire's own measure, so the old function returned
   `String::new()` and said nothing at all. It now prints GRAPH
   TRUNCATED and, correctly, no headroom sentence.
2. **Drop is the louder where both are present.** Placement, asserted by
   index: `find("GRAPH TRUNCATED") < find("GRAPH HEADROOM ALARM")`, plus
   the wording `THIS IS THE LOUD ONE`.
3. **Spend named beside the room left, when armed.** `fresh_bytes -
   committed_bytes`, signed (`i128`) — the negative side is the shape a
   drop makes, and unsigned subtraction there would underflow in exactly
   the state the block exists to shout about.
4. **Never a zero-byte spend.** Guarded at `spend == 0`, and the third
   half of the spend control commits the fresh graph and asserts the
   armed block carries neither `WORKING TREE SPENDS` nor `GIVES`.
5. **A positive control per clause** — see the drills below.
6. **`budget_line` / `floor_line` / exit code unmoved.** The two format
   strings `tools/e2e/tests/health-bands.spec.ts` pins BY SYMBOL are
   byte-identical (that spec reads check.rs and asserts
   `fn budget_line(` plus both format strings; it is outside this fence
   and was not touched). The exit code is decided in `cli.rs` from
   `report.is_stale()` alone and this change touches only `render`'s
   text, so it cannot move.

### Drills — six mutants, one side only, each restored by sha256

**EVERY COUNT BELOW IS AT FULL `cargo test --no-fail-fast` SCOPE FROM
`app/src-tauri/` — 18 targets, 614 bodies green.** An earlier revision of
these notes reported "260 other tests" with no scope named; that figure
was `-p nputer-index` scope and is not comparable to a workspace count.
The rule this breached is the family's own: a number without its unit or
its scope cannot distinguish an omission from a mismatch. The drill
runner now takes the workspace, so every row here is one population.

Pre-drill `sha256(check.rs)` for the first four =
`6d410796eff156fe79d51bd382b5751becaf7c9cc377bd48e61e394fac2a793e`
(byte-identical to the verifier's own reading, so both drills ran the
same bytes); for all six after the assigned corrections =
`bb5f5a118696b4376fa53721ef6a4838e6942b138159c0908781aa436f1d98de`.
Every mutant's LANDING was decided by `git diff --no-index` against the
pre-mutant file — not against HEAD (the tree already differed from HEAD,
so a HEAD diff would have reported "landed" for a pattern that never
matched) and never by the mutator's own exit. Every restoration was
proved by sha256 equality, never by an empty diff.

| mutant | what it reverts | RED |
|---|---|---|
| drop-reachability | healthy-headroom arm returns empty unconditionally (the pre-card defect) | **1** — `a_drop_speaks_even_at_healthy_headroom_...` |
| drop-disjunction | guard reads only the count, never the flag | **1** — `the_flag_alone_still_speaks_when_no_file_count_...` |
| spend-negative-arm | `if spend < 0` never fires | **1** — `a_fresh_index_smaller_than_the_committed_graph_...` |
| spend-zero-silence | the `spend == 0` guard never fires | **1** — `the_block_names_this_working_trees_own_spend_...` |
| drop-ordering | drop clause below the headroom sentence | **2** — `where_both_states_are_present_...` + `the_flag_alone_still_speaks_...` |
| spend-arithmetic | prints `fresh` instead of `fresh - committed` | **2** — `the_block_names_this_working_trees_own_spend_...` + `a_fresh_index_smaller_...` |

**FOUR AT A COUNT OF ONE; TWO AT TWO, AND BOTH OVERLAPS ARE HONEST
RATHER THAN VOLUME.** In all six, every red is one of this card's own
bodies and nothing unrelated moved. The two twos are two bodies
asserting one true invariant, not a body reddening on noise: the floor
control asserts the drop leads the block (the floor is the most serious
state of all, so it must), which an ordering mutant necessarily breaks;
and `fresh - committed` is the arithmetic under BOTH spend halves, so
replacing it breaks both. **The assertions were left in.** Trimming a
true assertion to make a drill number read `1` would be gaming the
measurement the number exists to be — and the overlap is reported here
rather than quietly averaged away.

No mutant produced a compile error (checked for `could not compile` /
`error[E…]` specifically, because cargo's ordinary `error: test failed,
to rerun` line on a red suite is not one, and reading it as one would
have hidden whether the mutant even built).

### The two assigned corrections — the code was right, the claim was not

Both were live branches with correct code and no body, found by the
integrator after the verifier's C1 attack (that dropping symbols raises
headroom and could DISARM the alarm the clause sits in, reproducing the
bug in the fix) came back clean — the drop is computed before any budget
arm, and only the divide guard sits above `let used`. **The same shape
had reappeared one level up, in the tests.**

1. **The disjunction was half-pinned.** The notes claimed the flag and
   the count are two facts and the clause "fires on either" — true of
   the code, held by nothing. Narrowing the guard to
   `report.fresh_truncated_files == 0` survived. Now pinned by
   `the_flag_alone_still_speaks_when_no_file_count_was_ever_recorded`,
   whose fixture is six SYMBOL-LESS files at `max_graph_bytes: 200`:
   `costs` collects only files with a non-empty array, so a tree with
   none drives `emit.rs`'s `costs.is_empty()` floor on the first pass —
   `files=0, symbols_flag=true`, nothing ever emptied, the count never
   recorded, and the flag set anyway.
2. **The negative-spend arm had no body**, and it is this card's own
   named case ("where 'spent' goes negative and means the opposite of
   relief"). All three original halves ran with `fresh > committed` or
   `spend == 0`, so `if spend < 0` → `if false` survived. Now pinned by
   `a_fresh_index_smaller_than_the_committed_graph_reads_as_giving_back`
   — a committed graph from an 8-file tree against a fresh index of the
   surviving 4. **The cost is not coverage**: `spend` is `i128` exactly
   because a shrinking index is the shape a drop makes, and a later
   refactor to `usize` or `saturating_sub` would restore either the
   underflow or the silent zero — criterion 4's own ban — with the suite
   green.

### Gates

- **GRAPH REGEN — FIRES** (`*.rs` outside docs/). Asked rather than
  predicted, at `4133ab8`: `index --check` exits **1**, STALE, naming
  `check.rs (content, loc 996 -> 1424, symbols 15 -> 17)`, fresh
  `1154473` against committed `1153961` — **this lane's own spend is
  +512 bytes**, which is the very figure the new clause prints.
  **NOT PERFORMED, AND ROUTED**: `docs/architecture/graph.json` is
  outside this fence (`decide()` returns `outside-the-fence`), and the
  bullet itself says the regen commits **with the CHECKPOINT**. The
  integrator owes it.
- **BOOT GATE — FIRES** (`app/src-tauri/**`), and CONVENTIONS makes the
  executor run it too. `NPUTER_BOOT_PORT=14675 npm run boot:check` from
  tools/e2e: **exit 0**, both lines — `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-167-s5` and `[nputer] window "main"
  created`; tree stopped on SIGTERM, and 14675 read back to zero rows,
  so no orphaned listener.
- **DOCS GATE — FIRES** (this commit's own `docs/tasks/` path); run
  against the merge forecast, recorded in the report.
- **METHOD EVAL GATE — NOT OWED**: nothing under `method/` in the diff.

### For the verifier

- The strongest single body is
  `a_drop_speaks_even_at_healthy_headroom_which_is_where_it_used_to_be_silent`.
  Its two `assert!`s on the PRECONDITIONS are load-bearing and should be
  attacked first: if the fixture ever stops landing under budget, or
  stops overshooting past `WARN_HEADROOM_BYTES`, the body silently
  becomes a second test of the over-budget arm that already worked.
- The spend control holds `fresh_bytes` constant across its two halves
  and asserts so. A clause printing the budget, the room left, the tree
  size or any other property of the tree passes neither half.
- `printed_dropped_files` / `printed_spend` parse the RENDERED text, so
  the pins are on behaviour rather than on the report's fields.

### Noticed, not done

- The absorbed half asked for the thinned-file LIST ("ideally"). Not
  built: `apply_budget` discards its `all_dropped` set on return, so the
  list is not derivable from `CheckReport` or from the emitted document
  without changing the emitter's signature — a different blast radius
  from a render clause. Routed as `T-167-s13` (next free `sN` under
  T-167 at this ref — s7 was absorbed by this card, s1..s6 and s8..s12
  exist).
- `graph/budget-headroom-bytes` in `health-bands.config.mjs` still
  carries T-139's `15_751` against this file's `13_921`. Already known
  and routed by `T-167-s2` (see the `WARN_HEADROOM_BYTES` doc comment);
  outside this fence; not re-routed.

## Verdicts
