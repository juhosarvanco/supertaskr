---
id: T-163-s5
title: Two brief.spec.ts bodies accept `[CLEAN, FOUND]` against the LIVE checkout because the board can move the exit — the same defect T-163-s4 fixed by deriving the id, discharged there by loosening instead
feature: F-06
milestone: 4
priority: 6
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-163-s4
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE SWEEPING FOR T-163-s4'S CLASS ACROSS EVERY SPEC THAT
SHELLS THE BRIEF, AND NOT FIXED THERE BECAUSE IT IS A DIFFERENT CARD'S
SUBJECT.** T-163-s4's criterion four forbids ITS fix from tolerating a
non-zero exit; it says nothing about bodies that already do, and
expanding to them from inside that lane would have been scope the card
did not carry.

## The measurement

Derived at `a18a6f8` (the T-163-s4 lane tip). `command grep -n
"EXIT.CLEAN, EXIT.FOUND" tools/e2e/tests/brief.spec.ts` returns **five**
lines; **two** of them spawn against the LIVE checkout and are this card's
subject:

    tools/e2e/tests/brief.spec.ts:734   expect([EXIT.CLEAN, EXIT.FOUND], run.stderr ?? "").toContain(run.status)
    tools/e2e/tests/brief.spec.ts:750   expect([EXIT.CLEAN, EXIT.FOUND]).toContain(run(["--task", "T-133"]).status)

Both spawn `brief.mjs --task T-133` with `cwd: repoRoot` and no `--root`,
and :734's own comment says why in as many words: *"whether this
repository has a finding right now is a LIVE fact — a lane cut two
minutes ago can add one — and a body that asserted it would red in
somebody else's lane for somebody else's dispatch."* **The reasoning is
correct and the remedy is the weaker of the two available.** An exit
accepted as either is the exit assertion deleted: at `a18a6f8` both bodies
pass identically whether the command answers 0 or 1, so a regression that
made every brief answer FOUND is invisible to them.

**THE OTHER THREE ARE A DIFFERENT CLASS AND ARE NOT IN SCOPE** (`:1019`,
`:1049`, `:1069`): each passes `--root <fixture>`, and a fixture repo has
no worktrees on task branches, so no live lane reaches them. Their
looseness is about whether a FIXTURE TREE carries a finding, which is a
property of the fixture and not of the board. Leave them.

## What changed under them

T-163-s4 built the missing half in the same package:
`tools/e2e/tests/session-economics.spec.ts` now derives, at the ref it
runs at, the set of card ids whose fence is disjoint from every live
lane's — through the same `fenceOverlaps` the command compares with — and
grades `toBe(0)` on one of them. Measured at `a18a6f8` with two lanes
live (`T-025-s4` app-agent, `T-163-s4` tools/e2e): **246 of 357 cards are
unfenced, and all 246 answer exit 0**, so fence disjointness fully
predicted the exit at that ref.

`T-133` is not special to those three bodies — each wants *a card that
briefs cleanly*, which is exactly what the derivation returns.

## Acceptance criteria

- WHERE a body spawns `brief.mjs --task` against the live checkout and
  grades its exit, THE body SHALL name a card id derived as fence-disjoint
  at the ref it runs at, rather than a typed one.
- THE two live-checkout bodies above SHALL assert `EXIT.CLEAN` exactly,
  and no body changed by this card SHALL accept a set of exit codes where
  it previously accepted one.
- THE three fixture-root bodies SHALL be left unchanged, and the card that
  changes them SHALL say why it disagrees with the paragraph above.
- THE derivation SHALL NOT be a second implementation: `unfencedIds` is in
  `tests/session-economics.spec.ts` today, so this card either imports it
  from a shared test helper or moves it to one — two copies of a fence
  rule is T-057's own failure shape.
- WHERE a body's subject is the exit-code contract itself
  (`"THE EXIT CODES keep \`I derived it\` apart from \`I could not tell
  you\`"`), THE fixture arms (`--help`, `--nope`, `T-999`, a broken
  `--root`) SHALL be left alone: they are already board-independent.
- Verification: headless. `npm test` from tools/e2e/ exits 0, and each
  changed body reds when `brief.mjs` is stubbed to answer `EXIT.FOUND` on
  a clean brief.

## Implementation notes

## Verdicts

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-06, priority 20 -> 6

Re-derived at `b60b06d`:
`command grep -n "EXIT.CLEAN, EXIT.FOUND" tools/e2e/tests/brief.spec.ts`
still returns five sites, and the two the card claims — `:734` and
`:750` — still spawn against the live checkout with no `--root`. The
three fixture-root sites (`:1019`, `:1049`, `:1069`) are unchanged and
stay out of scope exactly as the card argues.

**PRIORITY MOVED, AND THE REASON IS NOT VALUE.** F-06's planned column
already holds p20; p6 was free. The card is also one of the two
promotions dispatchable under the `T-140-s4` freeze (fence `[tools/e2e]`,
outside the graph walk), and it closes a class `T-163-s4` opened rather
than starting a new one.
