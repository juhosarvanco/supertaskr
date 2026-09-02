---
id: T-205-s6
title: GRAPH REGEN's trigger lists `.ts/.tsx/.js/.jsx` and omits `.mjs`, so a lane changing a `.mjs` derives `not owed` from a suffix list rather than from the graph, and today only a coincidence makes that answer right
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**MET WHILE DERIVING T-205's OWN GATES, AND THE RIGHT ANSWER WAS
REACHED BY A DIFFERENT ROUTE THAN THE BULLET'S.** T-205's merge diff
carries 12 paths: 10 `.md` and 2 `.mjs` under `tools/method-evals/evals/`.
`docs/CONVENTIONS.md`'s GRAPH REGEN bullet fires *"at any merge whose
diff touches `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside docs/"*. **`.mjs`
is not on that list**, so a reader obeying the bullet literally answers
NOT OWED — and a reader obeying its evident purpose (code outside
`docs/`) answers OWED. Two readings, opposite answers, and the bullet is
the thing a lane is told to DERIVE from.

## Why the literal answer happens to be right, and why that is the problem

Measured at `7547c96`: `docs/architecture/graph.json` declares
`languages: ["rust", "ts"]` over 200 files, and holds **zero** paths
under `tools/` and **zero** `.mjs` of any kind. So the graph cannot move
on this diff, and NOT OWED is correct — **but it is correct because of
what the indexer happens to index, not because of what the suffix list
happens to say.** The bullet and the truth agree by coincidence, and a
coincidence is not a derivation. The day the indexer learns JavaScript,
or the day a `.mjs` lands somewhere the walk reaches, the bullet keeps
saying NOT OWED and nothing reds.

**AND THE TREE ALREADY DISAGREES WITH ITSELF ABOUT THIS SUFFIX**:
`MODULE_SUFFIXES` in `tools/e2e/scripts/docs-scan.mjs` is
`["", ".ts", ".tsx", ".mts", ".cts", ".mjs", ".js", "/index.ts",
"/index.js"]` — the docs scanner treats `.mjs` as a module and the graph
gate's trigger does not.

## What a fix decides

Which of the two the bullet should mean, and then say it once:

1. **DERIVE THE TRIGGER FROM THE INDEXER** — the honest shape, and the
   one this project reaches for elsewhere: the gate fires when the diff
   touches a path the graph walk would index, asked of the walk rather
   than of a list in prose. Costs a reader that can ask.
2. **FIX THE LIST AND SAY WHY IT IS A LIST** — add `.mjs`/`.mts`/`.cts`,
   and record that the list is deliberately WIDER than the indexer so a
   spurious regen is the failure mode rather than a missed one. Cheap,
   and it keeps the bullet answerable with no tooling.

**Option 2 is the smaller change and this card should not assume it.**
The RANGE RULE bullet already argues that a trigger set *"4x too wide is
a checkpoint that lies"*, which is a real cost on the other side.

## Acceptance criteria

- THE bullet SHALL give one answer for a `.mjs` outside `docs/`, and a
  reader SHALL be able to reach it without knowing what the indexer
  indexes.
- WHERE the trigger stays a literal list, the bullet SHALL say that it
  is deliberately wider or narrower than the walk, and which.
- A POSITIVE CONTROL SHALL show the chosen derivation answering OWED for
  a path that moves the graph and NOT OWED for one that cannot, both run.
