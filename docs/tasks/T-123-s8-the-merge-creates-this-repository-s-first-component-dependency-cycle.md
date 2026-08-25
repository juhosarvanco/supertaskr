---
id: T-123-s8
title: T-123's merge creates this repository's first component dependency CYCLE — C-10 gains an undeclared edge to C-14, which already declares one back
status: suggested
suggested_by: verifier claude-opus-5 @T-123-verify2
---

**MEASURED AT THE MERGED TREE, not forecast.** `git archive` of
`git merge-tree --write-tree e1f3023 338a7e2` into a scratch directory,
indexed and reported with main's own indexer, its `CARGO_TARGET_DIR`
outside the tree so the target does not index itself.

`arch --root <main e1f3023>` (the baseline — `index --check` says
CURRENT there, 890 866 bytes · 172 files · 1874 symbols · 1842 edges):

    component  C-10  Docs watcher  files=3  declared_deps=1  observed_deps=1  drift=-
    edge  C-14 -> C-10  confirmed  observed=2
    (no C-10 -> C-14 row)

`arch --root <merged tree>`:

    component  C-10  Docs watcher  files=3  declared_deps=1  observed_deps=2  drift=D1
    edge  C-10 -> C-14  undeclared  observed=1
    edge  C-14 -> C-10  confirmed   observed=2

The new file edge is
`docs_watch.rs -> agent/sessions.rs (import) symbols=[GenesisReachability]`.

**THE REGISTRY DECLARES THE OPPOSITE DIRECTION AND ONLY THAT ONE.**
`docs/architecture/components/C-10-docs-watcher.md` reads
`depends_on: [C-06]`; `C-14-agent-runner.md` reads `depends_on: [C-10]`.
So the observed graph now contains a two-node cycle, C-10 ⇄ C-14, and
C-10 picks up its FIRST drift finding.

**THIS IS THE CARD'S OWN INSTRUCTION, NOT AN EXECUTOR CHOICE**, and it
is filed here rather than charged to the lane. Criterion 2 says the
shell *"SHALL ask `sessions::genesis_record` (or a sibling accessor
added beside it in C-14)"* and *"IF the accessor's current shape does not
answer this question THEN the new one lives in C-14 beside it and not in
`docs_watch.rs`"*. `docs_watch.rs` is C-10. Any spelling that obeys that
sentence puts a C-10 → C-14 edge in the graph; moving the type would not
help, because the CALL to `genesis_reachability` is the edge.

**THE ARCHITECT'S CALL, on the standing rule** (the integrator
regenerates, the architect rules on the registry — the disposition
`D1:C-05->C-07` took at T-010's checkpoint). Three answers are open:
declare `C-10 depends_on: [C-06, C-14]` and accept the cycle as
architecture; invert it (C-14 owns the routing rule and C-10 calls
nothing, which contradicts criterion 2's placement); or route the
reachability fact through C-05, which owns both today.

**AND IT IS AN OBLIGATION AT THE CHECKPOINT EITHER WAY.** The merged
tree indexes to **892 093 bytes · 172 files · 1878 symbols · 1843
edges** against main's committed 890 866 / 172 / 1874 / 1842, so
`index --check` is **exit 1, a REAL red** at this merge (`~3` files, `+2
-1` edges, no file added). GRAPH REGEN is owed, and the regen moves at
least `app/test/architecture-dogfood.test.ts`'s relation table and
`C-10`'s drift/`declaredOnly` accounting — the two live-registry
fixtures a merge regen always moves.
