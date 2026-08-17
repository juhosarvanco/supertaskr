---
id: T-056
title: The transcript stops re-rendering itself — memoise the turn, then measure it
feature: F-03
milestone: 3
priority: 9
size: S
status: planned
blocked_by: [T-028]
touches: [app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-027-s3 (triage 2026-08-17). The suggestion file is removed
in the same commit as this card. Its own named home was "T-028 or a
small card of its own"; T-028 is BUILDING, so it takes the card.
`blocked_by: [T-028]` is lane serialization — T-028 holds
app-interview and is already editing `InterviewChat.tsx` for the
focus fix.

Every `textDelta` produces a new `GenesisState`, which notifies
`useSyncExternalStore`, which re-renders `InterviewChat` — and with it
the WHOLE transcript, because `assembleTranscript` returns a fresh
array and every `PlannerTurn` is a fresh element. The runner coalesces
at 150 ms, so the ceiling is ~6–7 renders per second for the duration
of a turn, each re-rendering every turn in the conversation.

Nobody has felt it, and that is not evidence: no agent loop in this
project has ever run against a real model (T-025-s2), so every stream
this screen has seen is a scripted fixture landing in milliseconds. A
real stage-8 decomposition turn runs for minutes on a transcript that
is by then seven questions long.

DO NOT THROTTLE. A second coalescing window on top of the runner's
150 ms would make the "no dead air" property T-025 measured untrue at
the layer the user actually sees.

## Acceptance criteria
- THE `PlannerTurn` element SHALL be memoised on the turn object,
  which the store already gives for free: `upsertTurn` copies only
  the turn that changed, so every OTHER turn's object identity is
  stable across a delta.
- THE property the memo depends on SHALL be pinned by a vitest unit:
  a `textDelta` for turn N leaves turn N−1's object identity
  UNTOUCHED (`Object.is` on the previous turn across the reduction).
  It is true today; nothing asserts it.
- THE measurement SHALL be taken and recorded, not merely enabled:
  drive T-025's `happy` scenario end to end and record renders per
  turn and total commit time for turn 1 (one turn on screen) against
  turn 7 (seven turns, one of them 10k characters), before and after
  the memo. A `useRef` counter under a React Profiler, or
  `performance.measure` around the commit phase.
- IF the measurement shows renders-per-turn × transcript-size is NOT
  what grows THEN the memo SHALL still land and the notes SHALL say
  the cost was not observable — a one-line change that costs nothing
  is worth keeping, and the number is worth having written down.
- NO throttle, NO second coalescing window, and no change to
  `reduceGenesisEvent` — the single fold of that channel stays single
  (T-027's C-14 fence rule, and the 0-byte `agent-store.ts` diff that
  merge was proud of).

Verification: headless — vitest for the identity pin, the profiler
run against the fake CLI's scripted stream for the numbers. No model
call. @human: whether the screen FEELS different, which only a real
observed turn (T-025-s2) can answer.

## Implementation notes

## Verdicts
