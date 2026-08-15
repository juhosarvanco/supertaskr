---
id: T-009-s1
title: Committed graph.json goes silently stale at TS-touching merges until T-014's --check lands
status: suggested
suggested_by: executor claude-fable-5 @T-009
---

docs/architecture/graph.json is committed and deterministic (ADR-014),
but its staleness check (`self_graph_is_current`) is deliberately
`#[ignore]`d so the default cargo suite stays hermetic to unrelated TS
edits. Consequence: every merge that touches app/ or lib/parser TS
quietly invalidates the committed graph, and nothing fails until
T-014's `nputer index --check` exists (milestone 4). T-011/T-012 need a
CURRENT graph for their dogfood fixtures and the live map.

Suggest an interim integrator convention (one line in the merge
checklist): at any merge whose diff touches `*.ts/*.tsx/*.js/*.jsx`
outside docs/, regenerate and commit the graph with

    NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored

and re-run `cargo test -p nputer-index --test self_graph -- --ignored`
to confirm byte-identity. Retires automatically when T-014's check mode
becomes a gate (T-020's CI lane is its natural home).
