---
id: T-056
title: The transcript stops re-rendering itself — memoise the turn, then measure it
feature: F-03
milestone: 3
priority: 9
size: S
status: planned
blocked_by: [T-028, T-029]
touches: [app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-027-s3 (triage 2026-08-17). The suggestion file is removed
in the same commit as this card. Re-derived after T-028 and T-029 at
checkpoint `7d94043` (architect triage 2026-08-18): both blockers are
done. T-029 added rehydrated history, which the first version of this
card did not account for.

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

There are now TWO identity paths to hold. `upsertTurn` preserves unchanged
LIVE turn objects. T-029's `mergeRehydrated`, however, rehydrates banked
history during render and recreates its `GenesisTurn` objects. A shallow
`memo` around `PlannerTurn` therefore protects live history and can still
rerender every resumed turn. `approxStage` is also passed to every turn even
though only the current one renders stage-dependent footer state. This task
must close both paths rather than optimizing only the pre-T-029 world.

DO NOT THROTTLE. A second coalescing window on top of the runner's
150 ms would make the "no dead air" property T-025 measured untrue at
the layer the user actually sees.

## Acceptance criteria
- THE `PlannerTurn` element SHALL be memoised with the `GenesisTurn` object as
  its principal identity. Changed planner text, status, activity, error,
  relay truncation, retry callback or hand-driven callback SHALL still render.
- THE property the memo depends on SHALL be pinned by a vitest unit:
  a `textDelta` for turn N leaves turn N−1's object identity
  UNTOUCHED (`Object.is` on the previous turn across the reduction).
  It is true today; nothing asserts it.
- BANKED history SHALL be hydrated once per unchanged `rehydrated` payload
  identity, or an equivalent construction SHALL preserve every unchanged
  rehydrated turn's identity while a live turn streams.
- STAGE data reaching historical turns SHALL be stable or current-only. A
  docs-stage change MAY rerender the current question/footer and SHALL NOT
  rerender every historical planner turn. Starting turn N+1 SHALL still
  rerender turn N once when it moves from current to history.
- THE measurement SHALL be taken and recorded, not merely enabled. Use fixed
  equivalent reducer events — a browser cannot run the Rust fake CLI — and
  measure BOTH six live completed turns plus a streaming seventh, and six
  rehydrated turns plus a streaming seventh whose final text is 10k
  characters. Record per-turn function invocation counts and React Profiler
  `actualDuration` before/after, with at least five warmups and 30 measured
  runs; record median and p95 and separate StrictMode mount work. Do not call
  `commitTime` elapsed work.
- IF the measurement shows renders-per-turn × transcript-size is NOT
  what grows THEN the memo SHALL still land and the notes SHALL say
  the cost was not observable — a one-line change that costs nothing
  is worth keeping, and the number is worth having written down.
- NO throttle, NO second coalescing window, and no change to
  `reduceGenesisEvent` — the single fold of that channel stays single
  (T-027's C-14 fence rule, and the 0-byte `agent-store.ts` diff that
  merge was proud of).
- BLAST RADIUS: `app-interview` only. `tools/e2e/**`,
  `app/src/lib/agent-store.ts`, app-shell, Rust and parser SHALL be zero-byte
  task-branch diffs.

Verification: headless — app typecheck/build and full vitest, including live
and rehydrated identity/render-count pins and the removed temporary profiler
instrumentation proved by empty diff or hashes. The existing E2E interview
lane may be run read-only but `tools/e2e/**` does not move. Run boot and graph
gates at integration because shipped TypeScript moves. No model call.
@human: whether the screen FEELS different, which only a real observed turn
(T-025-s2) can answer.

## Implementation notes

## Verdicts
