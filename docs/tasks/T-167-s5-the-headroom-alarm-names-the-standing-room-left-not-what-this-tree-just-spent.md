---
id: T-167-s5
title: The graph gate's budget block says nothing about what this tree DID to the graph — it names the standing room left (the same number for everybody) and stays silent while symbols are being dropped, which is the state that means the opposite of relief
feature: F-06
milestone: 4
priority: 7
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-167-s2
blocked_by: []
touches: [crate-index]
builder:
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

## Verdicts
