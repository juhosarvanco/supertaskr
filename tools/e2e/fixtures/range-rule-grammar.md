# Authored range reader grammar

These deadbeef-style references and small counts are parser examples. They do
not describe Supertaskr history and are never compared to historical Git refs.

- THE RANGE RULE: authored grammar
  | AT the merge (integrator) | `git diff M^ M` |
  | BEFORE the merge (executor) | `git merge-tree --write-tree A B` then `git diff A TREE` |
  RE-MEASURED at T-027's merge `aaaaaaa`: the boot trigger matches **1** paths under the prescribed range and **2** under that one, and the extra **1**.
  Measured on T-078's lane at main-before `bbbbbbb` and tip `ccccccc`: two dots return **2** paths, three dots and the merge-tree form return **1**, and the merge `ddddddd` itself changed **1**.
  `git merge-base --is-ancestor aaaaaaa bbbbbbb` exits **0**, and at the merge `aaaaaaa..bbbbbbb` and `aaaaaaa...bbbbbbb` both return **1** paths; before it, against the branch tip instead, `aaaaaaa..ccccccc` returns **2** and `aaaaaaa...ccccccc` returns **1**.
  Scored over the **2** first-parent merges on main from BOOT GATE's own merge `aaaaaaa` through `ddddddd`.
  | `merge-tree --write-tree` | **2** of 2 | **2** of 2 |
  | three dots | **2** of 2 | **1** of 2 |
  | pre-merge two dots | **1** of 2 | **1** of 2 |
  the one merges it drops between them are one where it names EXACTLY the right paths and states them against the wrong baseline — `bbbbbbb`.
  Forgiving `index` lines and nothing else is a THIRD metric — it lifts three dots to **2** and moves neither other row.
  is T-014's `aaaaaaa`, where `merge-tree --write-tree` exits **1** and prints CONFLICT instead of a tree.
  At T-028's merge `ddddddd` NEITHER form predicts under EITHER metric. That is the honest ceiling on the recommended command, and it is one merge in two.
  For each merge M the truth is `git diff M^ M`; the three forecasts are `git diff A TREE`, `git diff A...B` and `git diff A..B`.
  DERIVE THE LIST, NEVER QUOTE IT — for each merge M, compare `git diff M^ M` against `git diff A..B` and match each side against the gate's own trigger.
  Derived at `ddddddd` across those same 2 merges: the prescribed range says BOOT GATE is NOT owed **1** times and the naive range fires anyway on **1** of them; it says GRAPH REGEN is not owed **1** times and the naive range fires anyway on **1 of 1**.
  TWO FLIPS IN TWO CHANCES, over TWO distinct merges.
  chronologically and BY GATE — BOOT GATE at T-001 `bbbbbbb` (0 against 1); GRAPH REGEN at T-002 `ccccccc` (0 against 1), which is the one merge that flips BOTH gates at once.
  but at `bbbbbbb` GRAPH is 0 against 0 and it is BOOT GATE that goes 0 against 1.
  it was WRITTEN at `ddddddd`, and its earliest counterexample — T-030's merge `aaaaaaa` — landed at an earlier time (`git merge-base --is-ancestor aaaaaaa ddddddd` exits 0).
  `A...B` is DEFINITIONALLY `git diff $(git merge-base A B) B`.
  `merge-tree` answers the gate's own question for this example.
  Not "rarely": when the two derivations disagree at all, the naive one manufactures a gate run MORE OFTEN THAN NOT.
  **READ `merge-tree`'s EXIT CODE** — 0 is a tree, 1 is a conflict report, and a command substitution that swallows it hands you an EMPTY forecast wearing the costume of a clean gate.

- DOCS GATE (T-084 authored grammar)
  TREE=$(git merge-tree --write-tree A B)
  node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only A "$TREE")
  | Exit | `$(...)`, BSD | piped, BSD |
  | --- | --- | --- |
  | 0 clean | 0 | 0 |
  | 1 found | 1 | 1 |
  | 2 usage | 2 | 0 on empty list |
  | 3 cannot run | 3 | 1 |
