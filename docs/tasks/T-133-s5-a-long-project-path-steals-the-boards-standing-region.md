---
id: T-133-s5
title: A deep project path shrinks the board below the standing floor it committed to, and every poison drill cut in a scratch directory inherits the red
feature: F-02
milestone: 4
priority: 37
size: S
status: planned
blocked_by: []
touches: [app-shell, tools/e2e]
suggested_by: executor claude-opus-5 @T-133
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29.** Two reasons, and the
first one is a user:

1. **A user with a deep checkout gets a smaller board than the floor
   this project committed to.** At 800x600 the board region falls to
   **234** against a floor of **250** — measured, with `scrollHeight`
   and the capped error strip byte-identical between the two worktrees,
   so only the chrome above the board differs. The deficit GROWS as the
   viewport narrows (14px at 1280, 26px at 1024, 50px at 800), which is
   the signature of text WRAPPING rather than of a fixed-height
   difference. Nothing about a drill is special except that it found it.
2. **It is a standing trap for the POISON DRILL**, which is mandatory
   for every card that adds or changes a test body. The drill discipline
   says to cut the scratch worktree outside the repository, session
   scratch roots are deep, and any drill running the full `tools/e2e`
   suite from there inherits a red that belongs to its working
   directory. This card's own drill measured it in the CONTROL and
   subtracted it. `docs/STATE.md` now warns every session to cut at
   SHORT roots — a workaround in the first document a session reads,
   standing in for the fix.

## Acceptance criteria

- THE board's standing region SHALL NOT be a function of how deep the
  user's checkout sits. The lane SHALL take one of the three arms and
  say which: bound the rendered path in the chrome (truncate,
  middle-ellipsis, or one line with `overflow-hidden`); assert the floor
  against the chrome's own height so a legitimate long path fails on the
  property it violates; or RULE that the floor is owed only at a bounded
  path length and record the decision in the spec.
- IF the path is bounded in the chrome THEN the full value SHALL remain
  reachable (a `title=` or equivalent), on this repository's own
  precedent for every other bounded display string.
- WHEN the change lands THE lane SHALL reproduce this card's measurement
  at BOTH roots — a short one and a >=128-character one — at 1280x840,
  1024x700 and 800x600, and report `board.clientHeight` at each. A run
  at one root cannot tell a fix from a coincidence of path length.
- WHEN it is fixed THE `docs/STATE.md` hazard bullet telling sessions to
  cut scratch worktrees at short roots SHALL be retired in the same
  integration, and the retirement SHALL name this card.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
