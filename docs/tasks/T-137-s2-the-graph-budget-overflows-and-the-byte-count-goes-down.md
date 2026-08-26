---
id: T-137-s2
title: The graph budget is exceeded by four ordinary new files, and the byte count goes DOWN when it happens — so a percentage-of-budget reading says everything is fine
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [crate-index]
---

**THIS IS `T-139`'s AND `T-140`'s SUBJECT, FIRING FOR REAL IN A LANE.**
`T-137` added two source files and two test files under `lib/parser/` and
crossed `max_graph_bytes`. `index --check` reports
`stats.truncated_files None -> Some(1)` and
`app/src-tauri/tests/agent_runner.rs (symbols 125 -> 0)` — an unrelated
Rust test file silently loses its entire symbol block.

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

**THE TIPPING FILE IS ONE FOUR-HUNDRED-LINE MODULE.** `max_graph_bytes` is
`1_000_000` at `crates/nputer-index/src/lib.rs:79`; `apply_budget` drops
the most expensive symbol block until the document fits.

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
3. **The limit itself is `T-139`'s.** This card supplies the measurement
   it asked for: a single ordinary module is enough to cross it, so the
   budget is now smaller than one card's worth of work.
