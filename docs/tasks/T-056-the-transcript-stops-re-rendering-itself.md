---
id: T-056
title: The transcript stops re-rendering itself — memoise the turn, then measure it
feature: F-03
milestone: 3
priority: 9
size: S
status: done
blocked_by: [T-028, T-029]
touches: [app-interview]
builder: codex/gpt-5 @fresh
verifier:
built_by: codex/gpt-5 @fresh
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

Built by `codex/gpt-5 @fresh` from architect checkpoint `59763f3`.

- `PlannerTurn` is a plain React `memo` boundary. Its shallow props keep the
  `GenesisTurn` object as the principal identity while still observing
  `current`, current-only `approxStage`, `onRetry` and `onHandDriven`. The
  store already replaces a turn object for changed text, activity, status,
  relay truncation or error; a new identity therefore renders every visible
  change. Historical turns receive `approxStage: null`, while starting the
  next turn flips the former current turn to history and renders it once.
- Rehydration now holds a `WeakMap` projection by the immutable transcript
  payload array's identity. An unchanged pull reuses its completed
  `GenesisTurn` objects while live state continues to win by turn number; a
  refreshed pull has a new array identity and is hydrated afresh.
- The reducer itself was not changed. Its existing live identity contract is
  now pinned with `Object.is`, the rehydrated identity is pinned across a live
  update, and the existing resume DOM suite counts actual `PlannerTurn`
  function calls for live and rehydrated history, docs-stage movement,
  current-to-history movement, visible turn-field changes, and both callback
  identities.

### Measurement

The temporary benchmark used the same fixed reducer script before and after:
six completed planner turns plus a streaming seventh, and six rehydrated
planner turns plus the same streaming seventh. The stream was twenty 500-char
`textDelta`s followed by the canonical 10,000-char `completed` text: 21 update
commits. Each case had five warmups and 30 measured runs under `StrictMode`.
Function invocations were counted per turn; React Profiler `actualDuration`
was summed across the 21 updates per run, then median/p95 were taken. Mount
work was recorded separately. `commitTime` was not treated as elapsed work.

| case | update invocations, turns 1–6 / turn 7 | update `actualDuration` median / p95 | StrictMode mount invocations per turn | mount `actualDuration` median / p95 |
|---|---:|---:|---:|---:|
| live before | 42 each / 42 | 4.442 / 5.318 ms | 2 | 1.088 / 1.418 ms |
| live after | 0 each / 42 | 0.791 / 4.928 ms | 2 | 0.434 / 1.173 ms |
| rehydrated before | 42 each / 42 | 4.522 / 5.439 ms | 2 | 0.798 / 0.974 ms |
| rehydrated after | 0 each / 42 | 0.665 / 0.905 ms | 2 | 0.291 / 0.364 ms |

The deterministic count shows the transcript-size multiplier was real and is
removed. The live p95 retained one noisy slow run, while its median and the
rehydrated distribution moved materially. StrictMode mount counts are
unchanged, as expected: this boundary optimizes updates, not first paint.

Temporary instrumentation was removed: the benchmark file is absent and a
recursive source/test grep finds no `Profiler`, `T-056-measurement` or
`__t056PlannerTurnProbe`. The final `interview-turns.tsx` SHA-256 is
`f221cda44dacb94f0581c801dcffee165e92c21e111188e8a7dcb85f4a1c9fe6`.

### Verification

- App production build (including `tsc`) green; explicit `tsc --noEmit`
  green; full Vitest **822/822 in 42 files**.
- Focused identity/render suite **89/89** after restoration.
- Poison drill **3/3 changed test bodies red**. Restored SHA-256:
  `agent-store.test.ts` `18cd86b0…`, `interview-model.test.ts`
  `599ce963…`, `interview-resume-dom.test.tsx` `6da720e4…`.
- E2E package typecheck green. Token lint clean over 117 files; self-test
  49 samples + 14 walk-policy checks green.
- Executor boot gate on scratch port 17660 exited 0 and detected both
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-056` and
  `[nputer] window "main" created`; it stopped its own process tree.
- Graph regeneration/currentness remains the integrator's gate, as the task
  card requires for shipped TypeScript. No model or real CLI was called.
- Blast radius is the three `app/src/genesis/**` implementation files, three
  existing app tests, and this card. `tools/e2e/**`,
  `app/src/lib/agent-store.ts`, app-shell, Rust and parser have zero-byte
  task diffs.

## Verdicts
