---
id: T-153-s5
title: token-scan's clock-restore guard asserts an exact mtimeMs round-trip that Linux does not grant, so the e2e lane's first Linux run reds two bodies main cannot fix while the fence is held
feature: F-01
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [tools/e2e]
suggested_by: integrator nputer-4e @T-153-s2 checkpoint
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED AT FILING (2026-08-29, integrator, the T-153-s2 checkpoint's
CI watch)** on the same standing authorization that promoted T-153-s2:
it is a blocker on main's first-ever green CI run, and the block is
measured, not predicted.

## The evidence — CI run 33259394002, the e2e lane's FIRST Linux contact

229 passed / 5 failed. Three of the five are the shallow-clone class,
fixed at the same checkpoint by `fetch-depth: 0` in ci.yml (the specs
READ git history; depth-1 hands them a one-commit repository). The two
this card owns:

- `token-scan.spec.ts:106` — "one runtime-built control byte reds all
  seven first-party roots at exact byte offsets": red at the line-163
  guard, `app/package.json restored its MTIME too`.
- `token-scan.spec.ts:227` — "P6 reds a planted bare motion utility
  and leaves its motion-safe twin alone": red at the line-272 twin of
  the same guard, `tools/e2e/fixtures/shell.ts`.

Both guards assert `statSync(target).mtimeMs` EXACTLY equals the
pre-plant `clock.mtimeMs` after a byte-exact restore plus a
`utimesSync` clock restore. Green on every macOS run this repository
ever made; red on ubuntu-24.04 on first contact.

## Why this is the T-130-s1 family, not a new mystery

The amnesty absorbed T-130-s1 into `T-111-s10` carrying the
measurement that predicts this: mtime round-trips are PRECISION-FRAGILE
— on the measuring platform, fresh writes land on sub-millisecond
mtimes, the Date form round-trips 0 of 50 and the seconds form 50 of
50. The guard's exact-`mtimeMs` equality is a fourth spelling of the
same trap, and Linux's filesystem is the second platform the spelling
never met. Derive the exact divergence ON LINUX (CI is the only Linux
this project has): stamp what `utimesSync` wrote and what `statSync`
read back, at full float precision, into the run log.

## What the guard is FOR — do not delete it to fit

The spec's own comment (token-scan.spec.ts:166–172) records why the
clock restore exists: `git diff --quiet` answers from the index's
cached stat info, and a restore that moves the clock produced a
red-green-green intermittent (P6's history). The guard proves the
restore restored the clock. That intent survives; only the assertion's
precision is wrong.

## Acceptance criteria

- THE lane SHALL first MEASURE the divergence on Linux (one CI cycle
  with the stamped read-back is acceptable evidence) and record it on
  this card.
- THE guards at token-scan.spec.ts:163 and :272 SHALL assert the clock
  restore at a precision BOTH platforms round-trip (derived from the
  measurement, not guessed) — or, if the measurement shows no such
  precision exists, assert the restore's PURPOSE instead (the empty
  `git diff --quiet` plus the P6 exactness that follow) and record the
  demotion with the T-130-s1 lineage cited.
- THE load-bearing halves SHALL NOT weaken: byte-exact sha256 restore,
  the empty-diff proof, P6's exactly-one-hit and offset assertions all
  stand as written.
- THE fix SHALL be proven where the defect lives: a full-suite CI run
  green on Linux, cap 3 CI cycles, each cycle's read stamped.
- WHEN the fence is the question: this card's `touches: [tools/e2e]`
  is HELD by T-156's live lane at filing — dispatch AFTER that lane
  lands; the lane list is the authority, and reaching in from an
  unfenced seat is the T-154-s2 class this project refuses.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
