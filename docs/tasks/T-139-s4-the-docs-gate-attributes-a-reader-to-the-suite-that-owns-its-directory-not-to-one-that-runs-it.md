---
id: T-139-s4
title: The DOCS GATE attributes a docs reader to the suite that owns its DIRECTORY, so a file no suite executes is still reported as owing one — and T-139 added two of them
status: suggested
suggested_by: executor claude-opus-5 @T-139
---

`docs-scan.mjs`'s `suiteFor(rel)` returns *"the longest declared package
prefix"* over a frozen four-entry `SUITES` table. It answers **where a
file lives**, and the gate then reports that answer as **which suite
reads the doc** — those are the same thing only for files their package's
test runner actually executes.

**T-139 ADDED THE FIRST TWO FILES IN THIS TREE WHERE THEY COME APART, AND
BOTH ARE ITS MEASUREMENT HARNESSES.** Derived at T-139's lane tip, from
the gate's own census (which went 16 readers -> 18):

    reader  app/src-tauri/tests/graph_budget_bench.rs  [cargo test from app/src-tauri/]  docs/architecture/graph.json
    reader  app/test/graph-budget-bench.mjs            [npm test from app/]              docs/architecture/graph.json

- `graph-budget-bench.mjs` is a **standalone node script**. `app/`'s
  vitest config does not match it, so `npm test` from `app/` never
  executes it. Verified empirically: the suite is 1013/1013 with the file
  present and absent alike.
- `graph_budget_bench.rs` is **`#[ignore]`d**. A bare `cargo test` runs it
  as ignored and reads nothing; it reads `graph.json` only under
  `-- --ignored`.

So the gate now reports `docs/architecture/graph.json` as a code input
owed to two suites, **neither of which opens it under the command the
gate prints.**

**THIS IS OVER-FIRING, WHICH IS THE SAFE DIRECTION** — the same argument
`docs/CONVENTIONS.md`'s GRAPH REGEN bullet makes for a trigger wider than
the walk. Nothing is missed and nothing goes red wrongly. It is filed
because the gate's output is *read as a derivation*, and a line reading
`[cargo test from app/src-tauri/] docs/architecture/graph.json` invites
an integrator to conclude that running `cargo test` exercised the graph.
It did not.

**THERE IS A SMALL GOOD SIDE AND IT SHOULD NOT BE THROWN AWAY**: before
this, `docs/architecture/graph.json` had to be added to the gate's list
**by hand** at the checkpoint — `T-135-s3`, which
`docs/STATE.md` records three consecutive checkpoints doing manually. It
is now derivable. The repair below should keep the derivation and fix the
attribution, not delete the reader.

**Two shapes:**

1. **Say what is known instead of guessing.** Where the runner's own
   include pattern (vitest `include`, cargo's `#[ignore]`) can be
   consulted, consult it; where it cannot, print the suite's DIRECTORY
   rather than its COMMAND — `[app/]` instead of `[npm test from app/]` —
   so the line stops asserting an execution it has not checked.
2. **A third column.** Keep the suite attribution and add how the file is
   reached: `run by the suite` / `run by hand`. The two harnesses above
   already name their own command in their module docs, so the fact
   exists in the tree; nothing derives it.

Option 1 is honest and cheap. Option 2 is more useful and needs a
convention for declaring "run by hand", which is a design decision rather
than a mechanical one.

**Fence: `[tools/e2e]`**, free at the time of filing.
