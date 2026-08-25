---
id: T-133-s5
title: A long project path steals the board's standing region, so a poison drill cut in a deep scratch directory reds a layout body that has nothing to do with the drill
status: suggested
suggested_by: executor claude-opus-5 @T-133
---

**ROUTED, NOT TAKEN.** T-133's fence is `touches: [tools/e2e]`. The body
that reds lives inside that fence and **it is not the thing that is
wrong** — the fix is in the app's shell layout (`app/src`), which is
outside this lane, and a fence is not widened from inside the lane it
fences (lane-protocol rule 5).

## What was measured

`tools/e2e/tests/shell-frame.spec.ts:263` — *the error strip owns a
ceiling while every diagnostic and the board remain reachable* — is
**GREEN in the lane worktree and RED, twice in two runs, in this card's
poison-drill worktree at the SAME COMMIT `82e8ab4`.** It reds in the
drill's CONTROL arm, so it subtracts cleanly from every mutant; a reader
who did not check the control would have attributed it to the mutation.

The spec prints its own measurements, and they name the difference:

| viewport | `board.clientHeight` in the lane | in the drill | floor |
|---|---|---|---|
| 1280x840 | **524** | **510** | — |
| 1024x700 | **384** | **358** | — |
| 800x600 | **284** | **234** | **250** |

`board.scrollHeight` is **14948 in both**, and `details.borderBoxHeight`
is **192 in both** — so the CONTENT and the capped error strip are
identical and only the chrome above the board differs. **The deficit
GROWS as the viewport narrows** (14px, 26px, 50px), which is the
signature of text WRAPPING, not of a fixed-height difference.

## The mechanism, derived rather than guessed

`repoDocs()` in that spec builds its snapshot with
**`projectDir: repoRoot`**, and the shell renders that path in the chrome
above the board. The two roots are:

    /Users/ujju/Projects/nputer-T-133                                   33 chars
    …/scratchpad/T-133-fix/nputer-T-133-drill                          128 chars

At 800px the long one wraps to more lines, the chrome grows, and the
board region falls to 234 against a floor of 250. At 1280px it wraps less
and the deficit shrinks to 14px. **Everything else was ruled out by
measurement, not by argument**: the two worktrees' installed app
dependency trees are byte-identical (`app/node_modules/.package-lock.json`
sha256 `9928d6b9f8228…`, 500 packages, zero version differences) and their
built parser artifacts are byte-identical (`dist/pure.js`, `index.js`,
`component.js` all matching).

## Why it is worth a card rather than a note

1. **It is a real property, and the spec is right to assert it.** A user
   with a deep project path gets a smaller board than the standing floor
   this project committed to. Nothing about the drill is special except
   that it found it.
2. **It is a trap for every future POISON DRILL.** The drill discipline
   says to cut the scratch worktree OUTSIDE the repository, and the
   session scratch root is a deep path — so any drill that runs the full
   `tools/e2e` suite from there inherits a red that belongs to its own
   working directory. This card's drill measured it in the CONTROL and
   subtracted it. The next one might not.

## What would close it

Any ONE of these, and the choice is a judgement for whoever owns the
shell:

- **Bound the rendered path** in the chrome (truncate, middle-ellipsis,
  or one line with `overflow-hidden`), so the board's region stops being
  a function of how deep the user's checkout sits.
- **Assert the floor against the chrome's own height** in the spec, so a
  legitimate long path fails on the property it actually violates rather
  than on a constant.
- Or rule that the floor is only owed at a bounded path length, and say
  so in the spec — the one option that changes nothing and records the
  decision.
