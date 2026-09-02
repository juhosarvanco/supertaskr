---
id: T-202-s2
title: THE MARGIN GUARD compares two separate invocations of one arm, so a worktree added or removed between them reds it — a THIRD body inheriting machine-global state, and T-205-s8 names only the other two
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-202-s1, measured at 2ed2861, 2026-09-02
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured

`tools/e2e/tests/brief-flush.spec.ts:631` — *"THE MARGIN GUARD: every
live arm against a loss point DERIVED in this run, for a NAMED reader"*
— asserts, for every arm, that what `spawnSync` receives equals what the
file destination received. It gets those two figures from **two separate
invocations of the assembler**, so anything that moves between them
moves the assertion.

Measured in this lane's `gate-run e2e` leg at `2ed2861`:

    Error: --task T-133 --state --full: spawnSync received 84026 bytes
           where the file destination received 83532
    Expected: 83532
    Received: 84026

A 494-byte delta between two reads of one command. The arm's own size
was **83532 bytes in that run and in three consecutive re-runs of the
body alone, all three GREEN** — so the size did not move and the body is
not measuring a size regression. What moved was the machine: five lanes
are live on this host and their worktrees are added and removed by peer
seats mid-body, and `--state --full` renders the board.

**The body already knows.** Its own comment says: *"If this fails with a
small delta and no `process.exit` in `brief.mjs`, suspect the board
moving between the two runs (a worktree added or removed) before
suspecting the flush."* The hazard is documented and unguarded — the
comment tells the reader how to attribute the red after it has already
cost them the attribution.

## Why this is not already covered

`T-205-s8` names this exact class and this exact cause — a body whose
answer depends on `git worktree list`, which is machine-scoped and
belongs to no ref — but its body names **two** bodies by file and line,
`session-economics.spec.ts:179` and `:365`, and derives its remedy from
what those two are about. This is a **third** body, in a different file,
failing by a different mechanism: 179 and 365 red because the assembler
*refuses* (exit 1) when a live worktree has no card; this one reds
because the assembler *succeeds twice with different answers*. A fix
that makes those two stop asserting `status === 0` does not touch this
one. Whoever triages should decide whether to absorb it into `T-205-s8`
— whose `touches:` is the whole of `tools/e2e` — or build it beside it;
this card is filed so the third instance is not lost either way.

## What is asked

Make the guard's two figures come from ONE invocation, or make the body
detect that the board moved between them and say so instead of failing
as a flush defect. The disclosed MARGIN announcement is the body's real
product and should survive either way.

## Acceptance criteria

- The body cannot red because a worktree was added or removed while it
  ran; demonstrated by a positive control that moves the board between
  the two reads and requires the body to survive it.
- The flush property the body exists for still reds when it is really
  broken — the existing kill, restoring `process.exit(code)` in
  `brief.mjs`, still kills it.
- The MARGIN announcement still prints every arm's size against the
  derived loss point, near or far.

## Routed, not built (T-202-s1's lane, 2026-09-02)

Outside `T-202-s1`'s fence — that lane reserves
`tools/e2e/scripts/gate-run.mjs` and `tools/e2e/tests/gate-run.spec.ts`
only — so it is filed here rather than fixed there.
