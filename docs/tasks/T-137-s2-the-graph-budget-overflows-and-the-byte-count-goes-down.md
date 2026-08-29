---
id: T-137-s2
title: Crossing the graph budget makes the byte count go DOWN, so the percentage every checkpoint quotes cannot see an overflow — measured on the lane that crossed it, and T-139's raise landed in between
status: parked
suggested_by: executor claude-opus-5 @T-137
touches: [crate-index]
---

**THIS IS `T-139`'s AND `T-140`'s SUBJECT, FIRING FOR REAL IN A LANE —
AND `T-139` LANDED THE FIX WHILE THE LANE RAN, SO READ THE CEILING BEFORE
THE VERDICT.** `T-137` added two source files and two test files under
`lib/parser/` and crossed `max_graph_bytes` **as it stood at that lane's
base commit `00e133a`: `1_000_000`.** `index --check` reports
`stats.truncated_files None -> Some(1)` and
`app/src-tauri/tests/agent_runner.rs (symbols 125 -> 0)` — an unrelated
Rust test file silently loses its entire symbol block.

**AND THE OVERFLOW IS ABSORBED BY `T-139`'s RAISE, WHICH THIS CARD DID NOT
KNOW ABOUT WHEN IT WAS DRAFTED.** `T-139` merged at `ae92f67` while this
lane was building and took `max_graph_bytes` to `1_040_000`, citing the
same 10 819-byte headroom this lane then spent. Re-derived exactly — the
serialisation is verified to reproduce the committed graph byte for byte
at indent two plus a newline, 989 181 = 989 181:

    agent_runner.rs symbol block            125 symbols = 38 862 bytes
    this lane's graph, TRUNCATED                       973 194
    this lane's graph, UNTRUNCATED                   1 012 056
      against 1_000_000 (this lane's base)      12 056  OVER
      against 1_040_000 (main at ae92f67)       27 944  of headroom

**SO THE INSTANCE IS CLOSED AND THE MECHANISM IS NOT.** The forty thousand
bytes `T-139` added buy roughly one more module of the size that crossed
the old ceiling. Everything below is about the mechanism and holds at
either ceiling.

**MEASURED FILE BY FILE**, against a detached scratch worktree at
`00e133a` with the lane's files copied in one at a time, using the lane's
own built indexer:

    tree                                            bytes  files  symbols  truncated
    base 00e133a                                  989 181    183     2101   no
    + the app re-export and both barrels           976 473    183     2081   no
    + lib/parser/src/task-waves.ts                 992 929    184     2105   no    <- 7 071 left
    + lib/parser/src/lanes.ts                      968 081    185     1996   YES
    + lib/parser/test/task-waves.test.ts           970 276    186     1999   YES
    + lib/parser/test/lanes.test.ts (whole lane)   973 194    187     2004   YES

**THE TIPPING FILE IS ONE FOUR-HUNDRED-LINE MODULE.** `max_graph_bytes` was
`1_000_000` at `crates/nputer-index/src/lib.rs:79` at this lane's base and
is `1_040_000` at `:134` on main since `ae92f67`; `apply_budget` drops the
most expensive symbol block until the document fits. **DERIVE THE CEILING
AT YOUR OWN REF** — it moved once inside a single lane's lifetime.

**AND THE FINDING THAT IS NOT ON EITHER OF THE TWO EXISTING CARDS: THE
HEADLINE FIGURE MOVES THE WRONG WAY.** Crossing the budget takes the byte
count from **992 929 DOWN to 968 081**. A checkpoint watching usage as a
percentage reads **96.8%** and concludes there is headroom. The overflow
is visible only in `stats.truncated_files` — which `index --check` prints,
`arch` does not report, and `docs/STATE.md`'s byte-budget section does not
track. **The one figure every checkpoint in this series has been quoting
is the one that cannot see this.**

**THREE THINGS TO CONSIDER, RANKED BY EVIDENCE.**

1. **`arch` should print `truncated_files` / `truncated_symbols`.** It is
   the reporter every checkpoint reads and it is silent on the one state
   that means the graph is lying. Cheapest of the three.
2. **The byte-budget paragraph in `docs/STATE.md` should carry the
   truncation flags beside the percentage**, because the percentage is
   NOT monotone in the tree's size and every reader has been treating it
   as if it were.
3. **The limit itself is `T-139`'s and `T-139` has moved it.** This card
   supplies the measurement that card asked for, from the other side: a
   single ordinary four-hundred-line module crossed the old ceiling, and
   **27 944 bytes of the new one remain after this lane** — so the raise
   buys about one more module of that size, not a generation. `T-140`'s
   per-file floor is the structural answer; this is the interim figure.

Amnesty triage 2026-08-29 (triage seat): PARKED — the INSTANCE is closed — T-139's raise to 1_040_000 absorbed the overflow while this lane ran, with 27 944 bytes of headroom left after it — and the MECHANISM is not. Crossing the budget takes the byte count from 992 929 DOWN to 968 081, so a reader watching usage as a percentage sees 96.8% and concludes there is headroom; the overflow is visible only in stats.truncated_files, which index --check prints and arch does not. Arm 2 is discharged: STATE now says GRAPH means ask index --check, never predict, and a byte count is not a content check. Arm 1 is live — grep for truncated in arch/mod.rs returns only test literals. RESURFACES: the next crate-index dispatch, where arm 1 (arch printing truncated_files / truncated_symbols) is a format string on the reporter every checkpoint reads. T-151 is that lane and is blocked on T-135; T-140's per-file floor is the structural answer and this card is the interim figure for it.
