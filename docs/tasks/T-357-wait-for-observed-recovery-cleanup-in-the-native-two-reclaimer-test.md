---
id: T-357
title: Wait for observed recovery cleanup in the native two-reclaimer test
feature: F-04
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: []
touches: [tools/e2e/tests/native-codex.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
built_by:
verified_by:
---

The existing two-reclaimer test observes completed recovery cleanup before asserting that the temporary recovery gate is absent, while still proving a stale reclaimer cannot take or remove the live successor's lock.

## Finding

The full integration reading at `79a6ce3b2fd549adf167c51dd0bf2051c6a915ce`, 2026-10-25, failed the named test at its immediate recovery-directory absence assertion. Its earlier live-successor owner and stale-acquisition assertions passed. The unchanged-tree bounded control then passed. The failing spec and native transaction implementation are byte-identical to first parent `b752c4ef46f468f96a41152da3d8b163fc0db65f`; this is a revealed existing test race, not a T-356 code repair.

The fixture writes its checked-ready marker from onRecoveryChecked, which the native transaction calls before its finally block removes the recovery directory. Awaiting that marker does not establish cleanup. The parent may inspect the directory during that valid interval. The original full RED, actual error/trace, same-ref control and source comparison remain retained with T-356's integration evidence. A control pass never converts that original full reading into GREEN.

## Acceptance criteria

- WHEN the named two-reclaimer test in `tools/e2e/tests/native-codex.spec.ts` reaches the recovery-check observation, THEN synchronize on cleanup of the observed stale recovery attempt through a named bounded observation before requiring its recovery directory absent; onRecoveryChecked alone is insufficient. Then re-read the exact successor owner and assert no stale acquisition while the successor remains intentionally held. Retain abandoned-temp cleanup and the completed callbacks/inflight/final-lock outcomes. Do not replace these with a sleep, weaken the negative assertions or change native transaction behavior.

- WHEN cleanup fails to occur or the stale reclaimer acquires/removes the live successor, THEN the actual relevant assertion still fails within a named bound. Fixture-owned controls distinguish a valid pre-cleanup interval from missing cleanup or broken successor safety. Release and settle every spawned fixture child before removing its repository, including assertion-failure cleanup; preserve actual terminal errors rather than leave an unhandled child rejection.

- WHEN qualification runs, THEN retain the actual original failure and compare the repaired named body with controlled fixture observations, reporting exact tested refs and real exits. Scope stays in the existing spec and its fixture machinery. Change no production guard, authority policy or runtime callback behavior, and inherit no proof exception from another card. Derived ordinary verification and integration remain owed.

## Implementation notes

Prepared outside the repository from actual failure evidence and a full read of the named test, its recoveryProcessSource and the native recovery callback/cleanup sequence. The change is bounded synchronization of existing assertions, not a new delivery methodology. Final dispatch still reviews currency and derives the tier. Filing as suggested grants no dispatch.

## Verdicts

Independent packet-only contract review accepted filing as suggested after the fresh-after-synchronization clarification incorporated above. Actual source/fence qualification at dispatch and independent implementation verification remain owed. No dispatch or production change is authorized by filing.
