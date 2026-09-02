---
id: T-225-s19
title: With the preflight's own half down 37%, `--task <id> --preflight` sits 2,700 bytes under the buffer and 47,431 of what is left is the ROW SET plus a sweep that grows with the machine's checkout count
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-225-s11
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE ARM IS UNDER THE BUFFER AND THE MARGIN IS NOW A PROPERTY OF THE
MACHINE RATHER THAN OF THE CARD.** Measured back to back at one held
board — 17 checkouts on this machine, 5 of them lanes, the same list
before and after both runs:

    --task T-133 --preflight   74,633 -> 62,836 bytes   (-11,797)

against a 65,536-byte pipe buffer. T-225-s11 took 9,439 bytes off the
PREFLIGHT'S OWN half (25,155 -> 15,716) by budgeting every reported
listing and citing the card by id instead of repeating its 79-byte
filename on 78 provenance lines. What is left is **47,431 bytes of ROW
SET and machine-wide SWEEP**, and neither was in that fence.

**THE SWEEP IS THE HALF THAT MOVES WITH SOMETHING NOBODY EDITS.**
`brief.mjs` prints one line per checkout of this repository on this
machine — 17 lines here, and the count is a fact about a laptop rather
than about a tree. The same answer measured minutes apart read 62,104 at
17 checkouts and 63,147 at 18. So the 2,700-byte margin is roughly two
dozen checkouts wide, and a machine that accumulates verifier benches and
drill worktrees eats it without a single commit.

**AND THE ROW SET GROWS QUADRATICALLY IN LANES.** Row 5 spells every live
lane and then every PAIR of them for the disjointness verdicts, so the
five-lane board here already prints ten pair lines; the eighth lane
prints twenty-eight.

## What a fix would decide

The same question T-225 answered for `--dispatch` and T-225-s11 answered
for the preflight's listings, now asked of the two remaining producers:

1. **The sweep** — whether its per-checkout lines collapse to the STALE
   ones plus a count of the current ones, which is what a reader acts on
   (a stale checkout runs guards this project does not register; a
   current one is news to nobody), with `--full` printing every row.
2. **The row set** — whether the pair-wise disjointness lines collapse to
   the pairs that are NOT disjoint plus a count of those that are.

Both are `print what the reader will act on, and say how much was not
printed`, and both have a worked precedent in this file family now.

## Acceptance criteria

- `--task <id> --preflight` is measured back to back at one held board
  with the checkout count and the lane count named, base and tip, and the
  tip is under 65,536 bytes with a margin stated in checkouts rather than
  in bytes alone.
- A body SHALL prove the sweep prints every row under `--full` and only
  the stale ones plus a count without it, with a positive control: a
  fixture whose checkouts are all current prints no per-checkout row and
  still names the count.
- No finding and no stale-checkout row is dropped at either verbosity;
  the finding sets at base and tip are compared and shown identical.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s11 merge (4363ca4)

The architect seat. T-239 has landed, so the blocker is discharged; the
sweep and the row set are the arm's last 47,000 bytes and they scale
with the machine. No dispatch follows today by the user's instruction.
