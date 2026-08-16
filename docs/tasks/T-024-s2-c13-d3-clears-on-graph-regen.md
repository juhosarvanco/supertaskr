---
title: C-13's D3 and its two planned edges clear on the next graph regeneration
status: suggested
suggested_by: executor claude-opus-5 @T-024
---

T-024 declares C-13 (genesis pane, `app/src/genesis/**`). The committed
`docs/architecture/graph.json` is an index snapshot that predates that
directory, so today the derivation honestly reports:

- `D3:C-13` — declared, zero indexed files (a fourth declared-only
  component alongside C-01, C-07, C-11);
- `C-13→C-10` and `C-13→C-11` as **planned**, `observedCount 0`, even
  though both imports are real in the tree.

Unlike C-01 and C-11 (structurally non-code — see T-011-s2), C-13's
territory is ordinary TypeScript, so this is the self-clearing kind:
one indexer run over a tree containing the pane turns the D3 off and
flips `C-13→C-10` to confirmed. T-024 deliberately did **not**
regenerate the graph — indexing is C-07/`src-tauri` territory, outside
the `app-interview` lane, and a hand-edited graph would be a lie about
what the indexer saw.

Suggested: fold into whatever regeneration step already exists at merge
(see T-009-s1, "graph regen at merge") rather than as separate work.
The dogfood expectations in `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` will need the matching update
when it happens — the reconciliation block at
`architecture-dogfood.test.ts:111` enumerates exactly which rows T-024
moved, so the reverse delta is already written down. `C-13→C-11` will
stay planned regardless: no TS import can confirm an edge to a
stylesheet, the same honest state C-12→C-11 already carries.
