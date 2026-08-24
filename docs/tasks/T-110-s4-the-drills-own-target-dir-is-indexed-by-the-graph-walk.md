---
id: T-110-s4
title: The poison drill's prescribed .drilltarget is INDEXED by the graph walk, so any regen run inside a drill worktree is wrong by one file
status: suggested
suggested_by: executor claude-opus-5 @T-110
---

Two standing disciplines collide, and the collision is silent in the
direction that produces a plausible wrong number.

- **POISON DRILL, arm (c)**: *"DRILL IN A DETACHED SCRATCH WORKTREE AT A
  NAMED COMMIT, AND GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF"* —
  the worked example in that bullet is `<scratch>/.drilltarget`.
- **THE FOUR WALKS**: the graph walk's ignore inputs are the in-tree
  `.gitignore` plus `.nputerignore`, and `walk_root` sets
  `.hidden(false)` (*"tracked hidden dirs may hold real code"*).

`.gitignore` lists `target/`. It does not list `.drilltarget/`, and the
leading dot does not save it. **So the directory the drill convention
tells you to create is indexed.**

## Measured tonight, in T-110's own drill at `6917b4a`

A regen run inside a drill worktree that had done any cargo work:

    fresh index: 659056 bytes · 128 files · 1145 symbols · 1738 edges

The same tree with `.drilltarget` moved out, re-derived immediately
after:

    fresh index: 658702 bytes · 127 files · 1145 symbols · 1738 edges

The extra file is
`.drilltarget/debug/build/nputer-65819d5daf010ee4/out/__global-api-script.js`
— a tauri build-script artifact. It carries **zero symbols and zero
edges**, which is exactly what makes it dangerous: the byte/symbol/edge
figures look sane, only the FILE count moves, and it moves by one.

**The damage is not one number.** The artifact is under no component's
glob, so it becomes unclaimed territory, and running the two dogfood
fixtures against that graph reported SIX moved assertions instead of the
five that are real — including
`app/test/map-dogfood-render.test.tsx`'s *"renders all twelve declared
components in full mode, no unmapped bucket, no banner"* going 12 → 13
with an unmapped bucket, and
`architecture-dogfood.test.ts`'s `unmappedFiles` losing its `[]`. An
executor forecasting a merge's regen from inside its own drill would
report a component-count move and an unmapped bucket that the merge will
not produce, and both look exactly like real findings.

## Arms

- **(a) Add `.drilltarget/` to `.gitignore`** (one line, `[.github/]`- or
  root-fenced). Cheapest, and it fixes every future drill at once. It
  also makes `git status` in a drill clean, which is what the drill's own
  restoration proof reads — T-110's drill had to report
  `?? .drilltarget/` as expected noise.
- **(b) Add it to `.nputerignore`** instead, with the reason written
  beside `docs/` and `tools/`. Narrower: it excludes the path from the
  GRAPH only, leaving git's view alone.
- **(c) Name a target directory OUTSIDE the worktree** in the POISON
  DRILL bullet. This is what T-110 fell back to for its own derivation,
  and it does NOT weaken arm (c)'s property — the hazard that bullet
  exists for is the PARENT's cache being reused by drill-compiled
  binaries, and a directory exclusive to the drill has that property
  wherever it sits. But it re-opens the "obvious economy" the bullet
  warns about, so it wants the reason restated rather than the rule
  loosened.

**(a) plus a sentence in the POISON DRILL bullet is the recommendation**:
the ignore line makes the trap unreachable, and the sentence is what a
reader of the drill bullet needs, since that is the file that told them
to create the directory.

Fence: `[.github/]` does not cover the root `.gitignore`; no component
claims it either, so this is a path-fenced card —
`touches: [.gitignore, docs/CONVENTIONS.md]` for arms (a)+(c), or
`[.nputerignore, docs/CONVENTIONS.md]` for (b). Note `.nputerignore`'s
own edit reds nothing by itself, so whichever arm is taken should carry a
regen and say what moved.
