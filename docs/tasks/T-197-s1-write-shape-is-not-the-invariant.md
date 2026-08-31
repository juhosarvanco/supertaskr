---
id: T-197-s1
title: The "write shape decides the loss" finding is true only against a fast reader, and a future sweep could lean on it
status: suggested
suggested_by: verifier claude-opus-5 @T-197-verify
---

T-197's implementation notes and `tests/brief-flush.spec.ts` both record
that a 115 KB output written as 200 small `console.log`s **lost nothing
through either reader** with the defect fully present, and conclude that
*"a single write past one buffer is what loses"* — the spec comment puts
it as a multi-write arm being *"harder to lose, never easier"*.

**The observation reproduces; the generalisation does not.** Measured at
`ab873e0`, Darwin 25.6.0, node v22.22.0, 5/5 runs each:

| write shape | `\| cat` (fast) | `(sleep 0.5; cat)` (slow) |
|---|---|---|
| 200 small `console.log` | 115,000 (whole) | **65,536 (truncated)** |
| 2,000 tiny `console.log` | — | **65,493 (truncated)** |
| one big `write()` | 65,536 | 65,536 |

Write shape does not decide loss. It decides whether the pipe ever
FILLS. The invariant is: **bytes are lost iff they are still queued in
userland when `process.exit()` runs.** A fast reader keeps the queue
empty regardless of shape; a slow reader fills it regardless of shape.

**Why this is worth a card rather than a comment fix.** Nothing in
T-197's diff depends on the false half — the synthesis uses one long
line, and the sweep's non-membership arguments rest on measured SIZE.
The risk is forward: `EXITS_AFTER_WRITING` carries eight scripts that
still exit after writing, and the next lane to argue a ninth into
non-membership may reach for "it only makes small writes" and be wrong.
A reader on a loaded machine, a slow terminal, or `| less` left unread
is the slow reader.

Cheapest fix: correct the two prose sites to say "against a fast
reader", and keep the one-long-line synthesis exactly as it is.
