---
id: T-135-s3
title: Committing T-135's regenerated graph.json reds `app/test/architecture-dogfood.test.ts`, and the lane that produces the regen is fenced out of the file that has to move with it
status: suggested
suggested_by: executor claude-opus-5 @T-135
touches: [app-shell, docs/architecture/components/]
---

**FOR WHOEVER COMMITS `docs/architecture/graph.json` AFTER T-135 MERGES.
Read this before running the checkpoint's suites, not after.**

T-135 Half A adds 27 `import` edges to the committed graph, one of which
is cross-component: `app/src-tauri/src/lib.rs` (C-05) →
`app/src-tauri/src/dispatch/mod.rs` (C-15). `C-05-app.md`'s `depends_on:`
does not declare C-15, so the graph gains a **fourth** drift finding.

Measured at `5547f02`, both commands read unpiped, both exit **0**:

    arch        summary  edges=36 -> 37  findings=3 -> 4  drift_components=3 -> 4
    arch drift  finding  D1  D1:C-05->C-15  file_edges=1

**`app/test/architecture-dogfood.test.ts` pins that set as an exact
literal.** `expect(derived.findings).toEqual([...])` currently lists
exactly three entries (`D1:C-10->C-14`, `D3:C-01`, `D3:C-11`), and
`expect(derived.edges.map(...)).toEqual([...])` pins the whole relation
table row for row with observed counts. **Both move**, and they move
whichever repair is chosen:

- **declare it** (`T-126-s3` item 4, the recommended fix) → the row
  becomes a **confirmed** `C-05 -> C-15`, tally 26/1/9 → 27/1/9, and no
  new finding;
- **leave it undeclared** → a **fourth finding** `D1:C-05->C-15` and the
  row stays undeclared.

**NO STANDING GATE NAMES THIS.** GRAPH REGEN fires on the `*.rs` diff and
says "regenerate and commit graph.json with the CHECKPOINT" — it does not
say which suites read the file it just moved. BOOT GATE's trigger
(`app/src-tauri/**`, `app/src/**`, either manifest) does fire on a T-135
merge, but the boot check does not run vitest. The DOCS GATE's trigger IS
`docs/` and `docs/architecture/graph.json` is under `docs/` — so the DOCS
GATE is the one that can catch it, **provided the regenerated graph is in
the pair of commits the RANGE RULE names.** It is not, if the lane leaves
the file uncommitted and the checkpoint commits it afterwards, which is
exactly the sequence this project's own rule prescribes (55 of the 57
commits that ever touched `graph.json` are checkpoints).

**THAT SEQUENCING HOLE IS THE FINDING**, and it is more general than
T-135: any lane whose diff moves the graph hands the checkpoint a
`docs/`-changing commit that the checkpoint's own DOCS GATE run has
already been derived without.

**The cheap fix for THIS merge**: run `npm test` from `app/` after
committing the regenerated graph, and reconcile
`architecture-dogfood.test.ts` in the same commit. The cheap fix for the
GENERAL case is a sentence in the GRAPH REGEN bullet naming the DOCS GATE
as owed on the checkpoint's own graph commit; that is `docs/CONVENTIONS.md`
and belongs to whoever takes it.

Absorbs (eleventh triage, 2026-08-26): T-129-s4 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.
