---
id: T-197
title: The dispatch brief SILENTLY TRUNCATES its own derivation at exactly one pipe buffer — `brief.mjs` ends at `process.exit()`, and the tool whose entire contract is a trustworthy figure loses 3,757 bytes to `| head`
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: "T-192's executor, which met it as an e2e red it proved was not its own; re-measured and confirmed at the architect/integrator seat before filing"
builder:
review:
---

**FOUND BY A LANE THAT REFUSED TO ACCEPT A RED AS ITS OWN**, and
re-measured at this seat rather than taken on report.

## The measurement, run at `57c1b39`

    node scripts/brief.mjs --dispatch > file      →  69,293 bytes
    node scripts/brief.mjs --dispatch | cat > f   →  65,536 bytes

**65,536 is exactly 64 KiB — one pipe buffer.** 3,757 bytes are lost, and
**nothing says so**: exit status is 0, no error is printed, and the
output ends mid-derivation looking like a complete answer.

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
- THE sweep SHALL name every sibling script that exits after writing, and
  argue membership either way with a measured size.
- WHERE any suite body currently passes against truncated output, it
  SHALL be identified before the fix lands.
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
