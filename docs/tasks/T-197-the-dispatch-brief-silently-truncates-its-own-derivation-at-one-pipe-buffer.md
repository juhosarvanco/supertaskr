---
id: T-197
title: The dispatch brief SILENTLY TRUNCATES its own derivation at exactly one pipe buffer — `brief.mjs` ends at `process.exit()`, and the loss GROWS with the board in the tool whose entire contract is a trustworthy figure
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [tools/e2e]
suggested_by: "T-192's executor, which met it as an e2e red it proved was not its own; re-measured and confirmed at the architect/integrator seat before filing"
builder: claude-opus-5@subagent
review: independent
---

**FOUND BY A LANE THAT REFUSED TO ACCEPT A RED AS ITS OWN**, and
re-measured at this seat rather than taken on report.

## The measurement, run at `57c1b39`

    node scripts/brief.mjs --dispatch > file      →  69,293 bytes
    node scripts/brief.mjs --dispatch | cat > f   →  65,536 bytes

**65,536 is exactly 64 KiB — one pipe buffer.** 3,757 bytes are lost, and
**nothing says so**: exit status is 0, no error is printed, and the
output ends mid-derivation looking like a complete answer.

## RE-MEASURED AT `5e36a0b` — AND THERE IS NO SINGLE BOUNDARY

**The 64 KiB figure above is one reader's answer, not the defect's.** Two
readers, same tree, same command:

    --dispatch > file                    →  66,464 bytes  (whole)
    --dispatch | cat                     →  65,536 bytes  (8 of 8 runs)
    --dispatch via spawnSync (the spec)  →  survives to ~66,470

**The loss point is a property of WHO IS READING**, because it is a race
between the reader draining the pipe and the writer exiting. A fix that
pins one number pins one reader.

**HEAD SAT UNDER THIRTY BYTES FROM RED AND NOTHING SAID SO.** A 30-byte
title edit to `T-212` took the brief from 66,464 to 66,494 and turned
`dispatch-order.spec.ts` from 14 passed to 1 failed. The spec's own
failure text is the tell — a stamp truncated to `<- @ 5e3`.

**AND CI'S GREEN IS NOT EVIDENCE OF ABSENCE AT THIS BOUNDARY.** CI passed
on `5e36a0b` with the brief already 928 bytes past the `| cat` line. A
green run here proves the reader won the race, not that the tail arrived.

**THE LANE-COUNT ATTRIBUTION IN THE RECORD IS WRONG AND THIS CORRECTS
IT.** `docs/checkpoints/2026-08-31-four-lanes-and-a-spec-that-tested-itself.md`
says the body's red/green history "tracked only how many lanes happened
to be open." At this measurement **zero lanes are live and zero worktrees
appear in the output at all** — the BOARD'S OWN GROWTH crossed it. Four
cards filed in one afternoon did what six live lanes had done before.

**Useful for whoever builds this: the brief carries card TITLES, not
BODIES.** The `T-212` edit added 2,135 bytes of body and moved the brief
exactly 30 — the title delta alone. So this card's own body may grow
freely; a new card, or a longer title, is what costs.

## THE STANDING HAZARD UNTIL THIS LANDS

**One more card, or one more sentence in one title, drops the brief's
tail silently.** Every seat is dispatching against a tool that is one
edit away from lying, and the tool's whole contract is a trustworthy
figure. This is why the card was reordered ahead of `T-199`.

## The mechanism

`brief.mjs` ends at `process.exit()`. **Node's stdout is asynchronous
when it is a pipe** and synchronous when it is a file or a TTY, so
`process.exit()` tears the process down with the write queue still
draining. To a file the write completes; to a pipe it does not.

## WHY THIS IS THE WORST POSSIBLE PLACE FOR THIS BUG

`dispatch-brief.mjs`'s own contract, rule 2, is that **"every emitted
figure carries the provenance that produced it, and the provenance cannot
be stripped"** — the module builds RECORDS rather than strings so that a
figure cannot leave the tool detached from its source.

**All of that care is defeated after the fact by the process exiting
early.** A reader who pipes the brief into `head`, `grep`, `sed`, `tail`
or `less` — which is the ordinary way anyone reads a 69 KB document —
gets a derivation that is **correct as far as it goes and silently
incomplete**, with no signal distinguishing "this is the answer" from
"this is the first 64 KiB of the answer."

This is the night's most-repeated failure family arriving in the
project's most-trusted tool: **a summary of nothing is indistinguishable
from a summary of success**, and here a *truncation* is indistinguishable
from a *complete answer*.

**And it is not hypothetical for this seat.** The architect/integrator
piped `brief.mjs` output through `head` and `grep` repeatedly on the
night this was filed. Any invocation whose output exceeded 64 KiB was
read truncated, while every visible signal said the derivation was whole.

## What a fix decides

1. **Whether `process.exit()` is needed at all.** The usual correct shape
   is to set `process.exitCode` and let Node exit naturally once stdout
   drains. If an explicit exit is genuinely required, it must be deferred
   until the stream reports flushed. **Prefer removing the cause to
   adding a wait.**
2. **Whether the sibling commands share it.** `brief.mjs` is one entry
   point among several under `tools/e2e/scripts/`. **Sweep the class** —
   name every script that calls `process.exit()` after writing to stdout,
   and say for each whether it can exceed a buffer. A script whose output
   is always small is a non-member, but say so with its size rather than
   by assumption.
3. **Whether anything else already depends on the truncation.** The e2e
   suite reads this tool's output; a body that currently passes against
   truncated output would change behaviour when the fix lands. Check
   before, not after.

## Acceptance criteria

- WHEN `brief.mjs`'s output exceeds one pipe buffer THE full output SHALL
  reach a piped consumer, byte-identical to the same invocation
  redirected to a file.
- A body SHALL prove it by **comparing the two destinations for one
  invocation large enough to exceed the buffer**, and SHALL assert the
  size is over the buffer — **a body run against small output would pass
  before and after the fix and is the vacuity this card is about**
  (poison shape TEN).
- **THE BODY SHALL PROVE BOTH READER SHAPES, not one.** The loss point is
  reader-dependent — `| cat` truncates at 65,536 while `spawnSync`
  survives to ~66,470 — so a body proving one shape leaves the other
  reader's race unproven. **A fix that pins a single boundary number has
  pinned a single reader** and will be re-measured false by the next one.
- **A MARGIN GUARD SHALL ANNOUNCE AN APPROACH RATHER THAN LET IT BE
  SILENT.** `HEAD` sat under 30 bytes from red with nothing anywhere
  saying so, and a 30-byte title edit reddened the suite. The guard's
  threshold SHALL be DERIVED and SHALL state which reader it is derived
  against, since there is no single line.
- THE sweep SHALL name every sibling script that exits after writing, and
  argue membership either way with a measured size.
- WHERE any suite body currently passes against truncated output, it
  SHALL be identified before the fix lands.
- **A CI GREEN SHALL NOT BE TAKEN AS EVIDENCE FOR THIS CLASS.** CI passed
  at `5e36a0b` with the brief already 928 bytes past the `| cat` line; if
  the fix's own proof runs only in CI it inherits that blindness.
- Verification: headless, the `tools/e2e` suite.

## Read beside

`T-143-s1` (the sibling class of `tools/e2e` bodies that red for reasons
outside the diff — this is what `T-192` first met), and
`dispatch-brief.mjs`'s rule 2, whose provenance guarantee this defect
silently voids.

## AND IT REDS A STANDING GATE THAT EVERY DOCS-TOUCHING LANE NOW INHERITS

Added after `T-190` reported it independently, to the same byte, and
corroborated rather than re-filing.

The truncation is not merely a reading nuisance: **it reds
`dispatch-order.spec.ts`**, which the DOCS GATE names for any lane
touching `docs/`. So every such lane now inherits a red it did not cause
and must spend time attributing.

**And the tell makes it read as a flake rather than a bug**: the
truncation point is fixed at one buffer, but WHAT falls past it moves
with the live lane count, because the dispatch listing grows with every
worktree. So the failing assertion moves between runs. Two lanes
attributed it correctly only by restoring their files to base and
reproducing it there.

`T-143-s1` owns the neighbouring class — `tools/e2e` bodies that red for
reasons outside the diff — and this is a second member with a different
cause.


## THE OVERSIZE INPUT MUST BE SYNTHESISED — the live `--dispatch` CANNOT be the body's subject

`T-142-s1` established this the useful way: it inherited the red, proved
it on a pristine tree, and then **watched it go fully green with no
relevant change** — `T-190` and `T-192`'s worktrees were removed, the
dispatch listing fell from **69,302 to 62,651 bytes**, and the whole
output dropped under one pipe buffer.

**This card already records that WHAT falls past the buffer moves with
the lane count. What is new is that the lane count decides whether
ANYTHING does.** A tell that moves reads as a flake; a tell that goes
fully green reads as **fixed**.

**Consequence for this card's own criterion, and it is binding**: the
*"one invocation large enough to exceed the buffer"* **cannot be the live
`--dispatch`**. On a quiet machine — which is exactly when an integrator
runs the final battery — that invocation is under the buffer, the body
passes for the wrong reason, and it would pass identically before and
after the fix.

**SYNTHESISE the oversize input.** A body whose subject is the live board
is vacuous whenever the board is small, which is poison shape TEN wearing
a regression test's costume.


## THE TITLE'S FIGURE WAS MOVING AND IS REMOVED — the loss GROWS with the board

Filed with *"loses 3,757 bytes"* in the title. **Four measurements now
exist and the number is not stable**, because the truncation point is
fixed at one buffer while the OUTPUT grows with the board:

| ref / lane | bytes to a file | piped | lost |
|---|---|---|---|
| at filing | 69,293 | 65,536 | **3,757** |
| `T-192` | 69,197 | 65,536 | 3,661 |
| `T-198` | 70,092 | 65,536 | 4,556 |
| `T-202` | 77,712 | 65,536 | **12,176** |
| `T-194` | 77,634 | 65,536 | **12,098** |

**The title now names the MECHANISM rather than a figure**, per this
project's own rule that a moving number does not belong where it cannot
be re-derived.

**And the trend is the finding, not a footnote.** The loss more than
TRIPLED in a day of ordinary board growth. Every card filed, every lane
opened, every worktree listed pushes more of the derivation past the cut —
so this defect gets worse on exactly the days the tool is used most.

**It also sharpens the acceptance criterion already on this card**: a
body must SYNTHESISE its oversize input, because the live `--dispatch`
crosses and re-crosses the buffer as lanes open and close. `T-142-s1`
watched the red go fully green when two worktrees were removed.

## THE BODY WENT GREEN AGAIN, AND THE GREEN IS THE PROOF

Measured at this checkpoint with **zero lanes live**:

    --dispatch > file    →  63,732 bytes
    --dispatch | cat     →  63,732 bytes      lost: 0

**The output is now UNDER the 64 KiB buffer, so nothing is truncated and
the `dispatch-order` body passes.** Across one day it has gone red, green,
red and green again — 69,293 → 77,712 → 63,732 bytes — tracking nothing
but how many lanes happened to be open.

**That is this card's acceptance criterion demonstrating itself.** A body
whose oversize input is the LIVE board is green whenever the board is
small, which is exactly the state an integrator is in when running a
final battery — so the fix would appear unnecessary at precisely the
moment someone checks.

**Four measurements now sit either side of the boundary and none of them
is evidence about the code.** The defect is unchanged; only the input
moved.
