---
id: T-153-s18
title: brief-flush's MARGIN GUARD cannot tell a truncation from a board that moved between its OWN three reads, and says so in the failure message while a concurrent lane is what moved it
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: executor claude-opus-5@subagent @T-153-s3, seen on the e2e leg at dd0bcff, 2026-09-09
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`THE MARGIN GUARD: every live arm against a loss point DERIVED in this
run, for a NAMED reader` (tools/e2e/tests/brief-flush.spec.ts) takes
THREE reads of the same `brief.mjs` invocation — one through
`spawnSync`, two into file destinations — and requires the pipe read to
appear among the file reads. On the `T-153-s3` lane's e2e leg it failed:

    --task T-133 --preflight: spawnSync received 62750 bytes where the
    file destination received 62259 then 61774 — the pipe read matches no
    file read taken around it, which is what a truncation looks like and
    is not what a moving board looks like

**The message's own second clause is the defect.** `--preflight` derives
LIVE facts — the worktree list among them — and three sibling lanes were
running their own e2e legs at that moment, cutting and removing bench
worktrees as they went. The three figures fall MONOTONICALLY, 62750 →
62259 → 61774, which is what a shrinking board looks like and is not
what a truncation looks like: a truncation stops at a buffer boundary and
does not walk downward by a few hundred bytes per read. The lane's
worktree count moved from 19 to 13 during that leg.

**Re-run once, alone, it is green**: `npx playwright test
tests/brief-flush.spec.ts` at the same tip `dd0bcff`, 6 passed, exit 0.
So the body is not wrong about the tree; it is unable to hold its own
premise while anything else is running.

## Why it is worth a card rather than a shrug

- **It fails with a message that names the wrong cause**, and it names it
  confidently. A reader who trusts it goes looking for a pipe truncation
  in `brief.mjs` — the thing that file exists to measure — and there is
  none. That is the expensive direction.
- **The pipeline it runs in is CONCURRENT BY DESIGN.** docs/STATE.md
  already carries a standing hazard for the same class one file over
  (*"A BENCH OLDER THAN A SIBLING LANE REDS brief.spec's eight-hand-steps
  body and session-economics by ref skew"*). This is a THIRD member and a
  different mechanism: not ref skew but a live derivation moving between
  reads inside one body.
- It reds a lane's four-leg battery for a cause the lane did not create
  and cannot fix, which costs a re-run of the longest leg.

## Arms

- **(a)** Take the three reads against a FROZEN board — a fixture
  worktree list, or one snapshot handed to all three — so the body
  measures the writer's flush and nothing else. Closest to what the body
  is for.
- **(b)** Keep the live reads and make the DISCRIMINATION real: a
  truncation lands on a buffer boundary and the reads bracket it, while a
  moving board walks monotonically. Assert that shape rather than
  set membership, and say which was seen.
- **(c)** Re-read until two agree, bounded, and disclose the retry.
  Cheapest and the weakest — it hides the movement instead of naming it.

Whoever takes it should derive the byte figures at their own ref: every
number above is a function of a tree AND of what else was running, and
they are stamped at `dd0bcff` on 2026-09-09.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
