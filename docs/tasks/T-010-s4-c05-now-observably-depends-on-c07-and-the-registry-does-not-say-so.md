---
id: T-010-s4
title: C-05 → C-07 is observable for the first time and is undeclared; ARCHITECTURE already said when it should be declared
status: suggested
suggested_by: executor claude-opus-5 @T-010
---

T-010's regen produces a **new `D1:C-05->C-07`** with exactly one file
edge:

    app/src-tauri/src/index_cmd.rs -> app/src-tauri/crates/nputer-index/src/lib.rs

This is the seam T-012 opened ("the app's first dependency edge on the
indexer crate, C-05→C-07 at the Rust level") finally becoming visible:
`use nputer_index::{index, stable_json, write_graph, IndexOptions,
GRAPH_REL_PATH};` was always there, and the map could not see it because
the indexer collected no Rust.

**ARCHITECTURE'S COMPONENT TABLE ALREADY CARRIES THE RULING.** C-05's
"Depends on" cell reads `C-01, C-06; C-07 when F-06 lands` — and F-06 is
the feature T-010 belongs to. `docs/architecture/components/C-05-app.md`
has `depends_on: [C-01, C-08, C-10, C-11, C-12]`, which is the AUTHORITY
and which lists neither C-06 nor C-07. So the two sources already
disagree, and this merge makes one half of the disagreement observable.

T-010 deliberately did NOT declare it. This project's standing practice
is that a lane which CREATES an undeclared edge leaves it for the
architect — T-037, T-027 and T-028 each did the same, and ARCHITECTURE
states it in as many words: *"Neither was drained at the merge — an
integrator regenerates, the ARCHITECT rules on the registry."* T-010's
own criterion is about the UNMAPPED set, which it drains to zero; the
DECLARED edge set is a different decision.

Two things for whoever rules on it:

- Declaring `C-07` in C-05's `depends_on` removes one D1 finding and
  moves `app/test/architecture-dogfood.test.ts`'s findings list and
  `map-dogfood-render.test.tsx`'s C-05 drift count — the same two
  fixtures `T-010-s2` already moves, so doing both in one checkpoint is
  cheaper than doing them in two.
- The C-06 half of ARCHITECTURE's cell is a SEPARATE and older
  divergence (`D1:C-05->C-06` has been live at 13 file edges), and it
  should not be settled by accident while settling this one.

**Fence: `[docs/architecture/components/]`.**
