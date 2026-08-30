---
id: T-168-s1
title: Two session-economics bodies red whenever a sibling lane holds the fence of the card they brief — the suite asserts exit 0 from a command whose refusal is correct
feature: F-01
milestone: 4
priority: 36
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-168
builder:
verifier:
built_by:
verified_by:
review:
---

## What T-168 measured

T-168's diff is two documents under `docs/research` and `docs/rooms`.
The DOCS GATE (diff half, executor's pair) answered exit 1 with a
verdict owing ONE command, `npm test` from `tools/e2e/`. That suite ran
**318 passed, 2 failed**, and NEITHER failure is a function of the
diff — both are a function of the LIVE WORKTREE LIST at the moment the
suite runs.

The two bodies, both in `tools/e2e/tests/session-economics.spec.ts`:

- `:73` — *the recommended seat is a function of the CARD, and an
  environment full of model dials does not move it*
- `:247` — *the advisory line is NOT a contract row — it is printed
  outside the row set and derives none of it*

Both spawn `brief.mjs --task T-157` against the live repository root
and assert `status === 0`. During T-168's lane the command exits **1**,
printing a finding it is right to print:

    fences are not disjoint: T-156-s1 docs/checkpoints/ against
    T-157 docs/checkpoints/ — the same entry (lane-protocol rule five).

## The mechanism, read in the source rather than guessed

`tools/e2e/scripts/dispatch-brief.mjs` builds the fence set it tests
for disjointness from `ctx.lanes` — **one fence per LIVE LANE**, taken
from `git worktree list`, plus the target card when it holds no
worktree yet (the loop above the `fences are not disjoint` finding).
So the comparison is live-lane-versus-card, not card-versus-card.

That is confirmed by the tree this lane ran in: at T-168's base commit
the T-156-s1 card still reads `status: planned`, so a status-driven
check could not have produced the finding, while
`git worktree list --porcelain` showed three live lanes — T-156-s1,
T-167 and T-168. **The refusal is a live-environment fact, and the
method's own figure rule already names that class: a lane list carries
the time and host it was read at, never a commit ref.**

Measured this way, unpiped, in the T-168 worktree:

- `brief.mjs --task T-157` (fence `docs/checkpoints/`, held by the live
  T-156-s1 lane) → exit **1**
- `brief.mjs --task T-164` (fence `bin`, held by nobody) → exit **0**

The command is not broken. It is refusing correctly, and two suite
bodies read that correct refusal as a failure.

## Acceptance criteria

- THE lane SHALL make the two bodies independent of which lanes are
  live when the suite runs, WITHOUT weakening what they assert. Both
  exist to prove a property of the ADVISORY BLOCK (that the seat comes
  from the card, and that the advisory is not a contract row); neither
  exists to assert that some particular card is dispatchable today.
- WHERE a body needs the command's stdout, THE lane SHALL either brief
  a card whose fence cannot collide, or accept a non-zero exit whose
  findings are all fence findings, or drive the assembler through its
  API rather than through the process boundary — and the choice SHALL
  be argued in the body, because the third form is what the same file
  already does two lines above the spawn.
- THE lane SHALL NOT pin `T-157` by name into a body that any future
  parallel dispatch can red; whichever card a body briefs, the reason
  it is safe to brief SHALL be stated where the body reads it.
- IF the answer is that the bodies are correct and the suite simply may
  not be run beside a colliding lane, THEN that SHALL be written into
  CONVENTIONS' e2e bullet as a precondition, so the next executor owed
  this suite by the DOCS GATE reads it before spending forty minutes on
  a red that is not theirs. A precondition nobody publishes is a trap.
- Verification: headless. Run the suite while a scratch worktree holds
  a lane whose card touches `docs/checkpoints/`, and again with no such
  lane; both runs answer the same.

## Why this is filed rather than fixed

`tools/e2e` is outside T-168's fence — the lane's manifest is
`[docs/research, docs/rooms]`, and running the e2e scripts is permitted
while editing them is not. The finding is therefore carried here rather
than acted on, with the measurement attached so the next seat does not
re-derive it.

## The standing hazard it exposes, worth a sentence wherever hazards live

The DOCS GATE owes `npm test` from `tools/e2e/` to ANY diff under
`docs/`, which is most docs lanes — and the parallel-dispatch pattern
this project now uses routinely puts two or three lanes in flight at
once. So the class is general: **a docs lane can be handed a red that
belongs to a sibling's fence**, and the red arrives under a title about
model dials and advisory lines, three layers from its cause. That is
the exact failure shape the DOCS GATE bullet in CONVENTIONS was written
against, arriving from the other direction.
