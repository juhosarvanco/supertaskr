---
id: T-083-s1
title: The fourth counterexample is recorded against the wrong gate — T-076 flipped BOOT, not GRAPH
status: suggested
suggested_by: executor claude-opus-5 @T-083
---

`docs/STATE.md` at `cb3aa31` writes the tally that T-083 was dispatched
to correct: *"T-076 (GRAPH REGEN 0 vs 5), T-069 (GRAPH REGEN 0 vs 18),
T-078 (GRAPH REGEN 0 vs 18 AND BOOT GATE 0 vs 6), and now T-080 (BOOT
GATE 0 vs 4)."* Three of the four are right. **T-076 is not: its flip is
the BOOT GATE, not GRAPH REGEN.**

Derived at `79ae34a` (T-076's merge, main-before `76cf034`, merge-base
`e4a5ae7`). The prescribed range is 19 paths, all under `docs/tasks/`
and `lib/parser/`; **13** of them match GRAPH REGEN's trigger. The naive
range adds five Rust files under `app/src-tauri/` — T-043's already
merged and already boot-gated work. So:

| gate | prescribed `76cf034..79ae34a` | naive `e4a5ae7..79ae34a` |
|---|---|---|
| BOOT GATE | **0 — the flip** | 5 |
| GRAPH REGEN | 13 | 13 — no flip at all |

The pair of numbers *0 vs 5* is right and was carried faithfully; only
the gate's name is wrong. This is the citation hazard the CONVENTIONS
gotcha already names one level up — **a figure that survives copying
while the thing it describes does not** — and it matters here because
the mislabelled row was one of only four on record, so a reader
reconstructing the pattern from the checkpoint would conclude GRAPH
REGEN flips three times and BOOT once, when at `ddcc8bb` it is BOOT
eight times and GRAPH five.

T-083 corrects the list inside `docs/CONVENTIONS.md` and cites this
finding there. **STATE itself is not edited** — it is a checkpoint
record, outside T-083's `[docs/CONVENTIONS.md]` fence, and a checkpoint
is a statement about a moment rather than a live claim. Whoever writes
the next checkpoint should carry the correction forward rather than
re-deriving the wrong row from `cb3aa31`.
