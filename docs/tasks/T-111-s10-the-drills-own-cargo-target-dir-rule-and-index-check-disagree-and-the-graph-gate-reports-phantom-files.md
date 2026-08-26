---
id: T-111-s10
title: CONVENTIONS tells a drill to put CARGO_TARGET_DIR *inside* its worktree, and `index --check` walks it — the graph gate reported three phantom files and a wrong edge count on a tree that was clean
status: suggested
suggested_by: executor claude-opus-5 @T-111
touches: [docs/CONVENTIONS.md]
---

**TWO STANDING RULES IN THIS FILE COLLIDE, AND THE COLLISION PRODUCES A
CONFIDENT WRONG ANSWER FROM A GATE RATHER THAN AN ERROR.** Measured on
`T-111`'s fix pass at main `6a6bc87`. Fence is `docs/CONVENTIONS.md`,
outside `T-111`'s `[app-board, app-shell]`, so this is routed per
`roles/executor.md`.

## The two rules

**POISON DRILL** says, in capitals: *"DRILL IN A DETACHED SCRATCH WORKTREE
AT A NAMED COMMIT, AND GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF"*
— arm (c), taken at T-013's merge after the hazard *"bitten three
agents"*. The measurement it cites is that a drill rooted at
`<scratch>/.drilltarget` left the main checkout's `target/` byte-identical.

**GRAPH REGEN / `index --check`** walks the tree and excludes `target/`.
It does not exclude `.drilltarget`, `.fctarget`, or any other name arm (c)
invites you to choose — arm (c) names one, and the name is not the point
of the rule, so nothing makes the two agree.

## What it produced

The same merged tree, the same commit, the same command, twice — differing
only in whether `CARGO_TARGET_DIR` sat inside the worktree or beside it:

| `CARGO_TARGET_DIR` | committed | fresh index | verdict |
|---|---|---|---|
| `/private/tmp/t111r/.fctarget` (INSIDE, as arm (c) says) | 970961 B · 183 files · 1986 edges | 991761 B · **186 files** · 2034 edges | **`files +3 -0 ~2`** · `edges +51 -3` |
| `/private/tmp/t111rtgt` (BESIDE) | 970961 B · 183 files · 1986 edges | 989181 B · **183 files** · 2033 edges | **`files +0 -0 ~2`** · `edges +50 -3` |

The three phantom files:

    + .fctarget/debug/build/serde-96533ca132bdbf45/out/private.rs
    + .fctarget/debug/build/serde_core-3dd530b7d67e3910/out/private.rs
    + .fctarget/debug/build/serde_core-b5ed433853b4cd54/out/private.rs

plus a phantom package node `p:cargo:serde_core` and its import edge —
which is where the extra edge in `+51` comes from.

## Why this is worth a card and not a note

**`files +0 -0` IS THE SENTENCE A CHECKPOINT DECIDES ON.** It is the whole
argument for *"the checkpoint owes NO fixture reconciliation"*: zero files
join or leave the index, so `architecture-dogfood.test.ts`'s
`fileComponent.size` and `map-dogfood-render.test.tsx`'s header hint
cannot move. **A `+3` inverts that sentence** — and a session that has
just followed arm (c) faithfully, in the worktree arm (c) told it to
build, will read `files +3 -0 ~2` and reasonably conclude the merge owes a
reconciliation it does not owe. The failure direction is
over-reconciliation, which is cheap; **the opposite reading is not, and it
is equally available**: a real `+1` hidden among build artefacts a reader
has learned to discount.

**AND `docs/CONVENTIONS.md` ALREADY KNOWS THE SHAPE OF THIS BUG.** The
`--root` paragraph three bullets up exists because `index --check` gives a
FALSE RED that *"IS NOT DISTINGUISHABLE BY THE HEADLINE"* and tells the
reader to read the second line. This is the same gate answering
confidently and wrongly for a second reason, and the second line does not
disambiguate it either — a phantom `+` file is formatted exactly like a
real one.

## The repair, three options

- **(a) NAME THE DIRECTORY IN THE RULE.** Arm (c) says *its own
  `CARGO_TARGET_DIR` inside itself*; make it say **`<scratch>/target`**,
  which the walk already excludes. One word, no code, and the drill
  hazard arm (c) exists to close is closed identically — the hazard is
  *not sharing the parent's cache*, never the directory's name.
  **RECOMMENDED**, and it is the only option that costs nothing.
- **(b) PUT IT BESIDE THE WORKTREE.** `/private/tmp/t111rtgt` for a
  worktree at `/private/tmp/t111r`. Also correct, also outside the walk,
  and it survives `git clean` — but it leaves a directory nobody's
  worktree removal will collect.
- **(c) TEACH THE WALK.** Exclude any directory containing
  `CACHEDIR.TAG`, which cargo writes into every target dir it creates.
  The most general fix and the only one that helps a reader who chose a
  third name; it is `crate-index`'s code rather than a doc edit, so it is
  a different fence and a different card.

**(a) AND (c) ARE NOT ALTERNATIVES** — (a) fixes today's readers in one
word, (c) fixes the class. The doc edit should not wait on the code one.

## The one-line version for whoever writes it

*A drill's target directory must be invisible to the walk as well as to
the parent's cache, and only one of those two is currently written down.*
