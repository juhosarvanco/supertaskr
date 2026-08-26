---
id: T-150-s3
title: index --check is exit 1 on main and the checkpoint that made it so is the one that regenerated the graph — the two dogfood fixtures moved after the regen, inside the same commit
status: suggested
suggested_by: executor claude-opus-5 @T-150
---

**A REAL RED, NOT THE `--root` FALSE RED.** Run from
`app/src-tauri/` in the `T-150` lane at `f174d5c`:

    cargo run -p nputer-index -- index --check --root ../..   # exit 1

    [nputer-index] graph.json is STALE
    [nputer-index]   committed:   1020023 bytes · 189 files · 2152 symbols · 2111 edges
    [nputer-index]   fresh index: 1020023 bytes · 189 files · 2152 symbols · 2111 edges
    [nputer-index]   files  +0  -0  ~2
    [nputer-index]   | ~ app/test/architecture-dogfood.test.ts  (content, loc 2249 -> 2266)
    [nputer-index]   | ~ app/test/map-dogfood-render.test.tsx   (content, loc 766 -> 770)

It prints both counts and a `~` file diff, which is exactly what
`docs/CONVENTIONS.md` says distinguishes a real red from the `--root`
one (*"a false red says `committed: MISSING`"*).

## IT IS NOT THIS LANE'S

`T-150`'s merge diff is **three paths, all under `tools/e2e/`**, derived
by the RANGE RULE's prescribed pre-merge form (`git merge-tree
--write-tree 92a9181 HEAD` then `git diff --name-only`). `tools/` is
`.nputerignore`d, so the diff cannot move the graph by construction —
and the check agrees: `189` files and `+0 -0` on both sides.

**BOTH NAMED FILES AND `docs/architecture/graph.json` LAST MOVED IN THE
SAME COMMIT: `17e6f8a`, "Checkpoint: T-137 done".** So the tree was
already stale when this lane was cut, and every lane cut from that
checkpoint or later inherits it.

## The mechanism is the one CONVENTIONS already names, arriving one level in

The GRAPH REGEN bullet says the regen belongs to the CHECKPOINT rather
than the merge, *"because the checkpoint edits INDEXED fixture files
(app/test/architecture-dogfood.test.ts and app/test/map-dogfood-render.test.tsx),
so a graph regenerated into the merge commit is stale again the moment
those are reconciled"*. **Here that happened INSIDE the checkpoint**: the
regen ran, then the two fixtures were reconciled in the same commit, and
nothing re-asked the gate afterwards. The rule already anticipates the
ORDER; what is missing is the second ask.

## Disposal

A one-line repair (`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index
--test self_graph -- --ignored`, commit `docs/architecture/graph.json`)
belongs to the next integrator and needs no card. **What is worth a card
is the ORDERING rule**: the checkpoint's LAST act before committing has
to be the regen, or the hand run has to be repeated after the fixture
reconciliation. `touches:` `[docs/CONVENTIONS.md]`.
