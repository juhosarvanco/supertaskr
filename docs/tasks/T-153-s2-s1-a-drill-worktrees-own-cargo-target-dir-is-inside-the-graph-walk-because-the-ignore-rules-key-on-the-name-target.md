---
id: T-153-s2-s1
title: A drill worktree's own CARGO_TARGET_DIR is INSIDE the graph walk, because the ignore rules key on the name "target" and the convention tells you to pick a different one
status: suggested
suggested_by: executor claude-opus-5 @T-153-s2
---

**CONVENTIONS' POISON DRILL bullet says to drill in a detached scratch
worktree and give it its OWN `CARGO_TARGET_DIR` INSIDE ITSELF, and
`T-092` says to derive the whole stem from the lane id — one stem, every
artefact, no exceptions.** Obeying both produces a build directory named
something like `.t153s2-target` at the worktree root. **Nothing ignores
it.** `.nputerignore` names `docs/`, the indexer's fixture tree and
`tools/`, and the only thing keeping a normal build directory out of the
graph is the NAME `target`, which the drill's derived stem deliberately
is not.

## Measured, at `b5e3e4e` in a detached drill worktree

A graph regen run inside that worktree —
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, exit 0 — produced a graph of **201 files**, where the lane's
own `index --check` at the same commit reports **189**. The **12** extra
are cargo build-script outputs the walk found because they are `.rs` and
`.js` and nobody excluded them:

    .t153s2-target/debug/build/nputer-…/out/__global-api-script.js
    .t153s2-target/debug/build/serde_core-…/out/private.rs
    .t153s2-target/debug/build/web_atoms-…/out/named_entities.rs
    … 9 more, all under .t153s2-target/debug/build/*/out/

`index --check` then answered **CURRENT at 1,029,909 bytes, 99.0% of the
budget with 10,091 left** — a green verdict over a tree that contains
twelve files existing nowhere but one session's scratch directory. The
clean fresh index at the same commit is **1,021,184 bytes / 189 files /
2,156 symbols / 2,111 edges**, 98.2% with 18,816 left. **The
contamination ate 8,725 bytes of a budget this repository is already
within 2% of** (`T-151` is the card about that margin).

Nothing was committed: the drill's `docs/architecture/graph.json` was
restored and sha256-proved against `b5e3e4e` before anything else ran.
It was caught only because the file count looked wrong beside a number
read minutes earlier — not by any gate.

## Why this is a defect and not a session's mistake

The three rules that produce it are each right on their own, and they are
in three different files:

- POISON DRILL says the target directory goes INSIDE the drill worktree.
- `T-092`'s clause says every artefact carries the lane-derived stem, so
  it must NOT be called `target`.
- The graph walk excludes build output by NAME, via `.gitignore`'s
  `target/`, and `.nputerignore` never mentions build output at all.

So the convention instructs a session into the one directory name the
walk does not skip. **And the failure is silent in the direction that
matters**: the regen SUCCEEDS, `index --check` says CURRENT, and the
poison is only visible as a file count nobody has a reason to read.

## Arms

- **(a)** `.nputerignore` gains the build-output shape rather than a
  name — the pattern that catches any `*target*` build directory, or
  better, `**/build/*/out/` under any of them. Cheapest, and it fixes
  every future stem at once.
- **(b)** POISON DRILL names the collision where the target directory is
  chosen, and prescribes a stem that IS ignored (e.g.
  `target-t153s2/`, if the ignore pattern is widened to match) — a doc
  fix that depends on (a) to be true.
- **(c)** The regen refuses to write a graph containing a path under a
  cargo build directory, which is the only arm that cannot be forgotten.
  Most expensive; worth it only if (a) proves insufficient.

**(a) plus (b) is the pair.** Whoever takes it should derive the file
count and the byte figures at their own ref — every number above is a
function of a tree and is stamped at `b5e3e4e`.
