---
id: T-153-s3
title: A drill worktree's own CARGO_TARGET_DIR is INSIDE the graph walk, because the ignore rules key on the name "target" and the convention tells you to pick a different one
feature: F-06
milestone: 4
priority: 11
size: S
status: planned
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5 @T-153-s2
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30. THIS CARD ALREADY HAD A SLOT WRITTEN FOR IT AND NEITHER DOCUMENT KNEW.**

`T-111-s10` (planned, `touches: [docs/CONVENTIONS.md]`) carries a
criterion that routes exactly this work and names no card:
*"THE class fix (teaching the walk to skip any directory containing
cargo's own `CACHEDIR.TAG`) SHALL be ROUTED as its own `[crate-index]`
card rather than taken here — it is code, it is a different fence, and
the doc edit must not wait on it. Arm (a) and arm (c) are not
alternatives."* **T-153-s3 IS that card.** Promoting it with the
`[crate-index]` fence T-111-s10 specifies is what makes the routing real
instead of a sentence hoping someone connects it.

Re-derived at this ref — **documented, not fixed**, which is the trap:
`.nputerignore` lists only `docs/`, the index fixtures dir and `tools/`;
`.gitignore:4` has the sole entry `target/`; `grep -rn 'CACHEDIR'` over
`crates/nputer-index/src/` returns nothing and `walk.rs:55` still only
calls `add_custom_ignore_filename(".nputerignore")`. `docs/CONVENTIONS.md`
still instructs a drill to **"GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE
ITSELF"** with `<scratch>/.drilltarget` as the worked example. So the
convention still tells a seat to build the very directory the walk will
index, and the only thing that changed is that `docs/STATE.md` now warns
about it as a standing hazard. **A hazard note is not a fix, and the
distance between them is this card.**

**DISPATCH ORDER NOTE:** T-111-s10's own criterion says the doc edit must
NOT wait on this, and that lane is live right now
(`task/T-111-s10-poison-drill-bullet`). The fences are disjoint —
`crate-index` here, `docs/CONVENTIONS.md` there — so this may run
concurrently, which is precisely what that criterion arranged for.

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

## THIS IS THE SECOND SIGHTING IN ONE DAY, BY A DIFFERENT SEAT

**T-154's verifier hit it first and routed it**, hours before this lane
did — read it there rather than trusting this card's account of it:
`docs/tasks/T-154-the-fence-becomes-a-property-at-the-moment-of-the-write.md`,
the paragraph headed *"A HAZARD I CREATED AND ANYONE REPEATING THIS PASS
WILL CREATE"*, plus its routed item 5. Same mechanism, same **twelve**
cargo build artifacts, target directory at `/tmp/v154/.cargotarget`. Its
own sentence is the diagnosis this lane independently reached: *"Two
written rules collide here and neither names the other"*.

**IT IS FILED HERE BECAUSE A VERDICT'S ROUTED ITEM IS NOT A CARD** and
the board cannot see one — which is the same reason the suggestion-triage
convention makes filing, not mentioning, the move that discharges a
finding.

**AND THE TWO SIGHTINGS SAW OPPOSITE HALVES, WHICH IS WHAT RAISES THIS
ABOVE A REPEAT.** T-154's seat saw a FALSE STALE — the gate refusing over
artifacts, loud, exit 1, and it cost that session a run. This lane ran the
REGEN first, so the artifacts went INTO the committed graph and
`index --check` then answered **CURRENT at exit 0** over a tree containing
twelve files that exist in one scratch directory and nowhere else. **The
loud half costs a run; the silent half is the one that commits**, and no
gate stands between it and a checkpoint.

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
