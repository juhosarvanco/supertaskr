---
id: T-057
title: Assertions that cannot fail — pin the mechanisms the suites only claim
feature: F-02
milestone: 4
priority: 25
size: M
status: planned
blocked_by: []
touches: [app-shell, app-interview]
builder: codex/gpt-5.6
verifier:
built_by: codex/gpt-5.6 @fresh
verified_by:
review:
---

Absorbs: T-027-s4, T-049-s3 (triage 2026-08-17), T-063-s7, T-063-s4
and T-062-s5 (architect triage 2026-08-18). The suggestion files are
removed in the corresponding triage commits.

THIS IS A PATTERN, NOT TWO FINDINGS. In one night the pipeline caught
SIX assertions that cannot fail — T-049's retired "stops listening
once the front door is gone" (vacuous after the fix), T-049-s3's four
deletable hook properties, T-014-s7's debounce pin restating its own
literal, and T-027-s4's `f(x) === f(x)`. Three different tasks, two
languages, builders and verifiers both. The two that live in the app's
own suites are absorbed here; T-014-s7's Rust half went to T-044,
where its file already is.

The shape is always the same: a test billed as proving a MECHANISM
proves only an OUTCOME that some other test already covers, so the
mutant survives and the comment lies. The repo's antidote already
exists as PRACTICE — integrators poison every test body and require it
to red (133-for-133 at T-027) — and is written down nowhere. Ratifying
that practice is **T-054's** criterion; this card fixes what it found.

## Acceptance criteria
- THE test-only banking replay SHALL stop hand-copying `InterviewChat`'s
  effect. Export one pure observation transition from `interview-model.ts`
  that owns baseline advancement, project-switch rebaselining, per-turn
  merge, sorting and deduplication; BOTH the shipped chat and tests SHALL use
  it. No second banking loop may remain.
- THE transition SHALL pin the missing project-switch sequence: switch from
  project A to B without producing chips, then change B and produce chips
  only for the later B change. Removing project-directory rebaselining SHALL
  fail this test.
- THE `byPlanner === byHuman` tautology and its "sharpest proof" wording SHALL
  be removed. The app has no authorship signal. The honest disk-only property
  is the conjunction of a positive (a docs snapshot during an active turn
  produces a chip) and the existing negative (model activity/text over an
  unchanged tree produces none).
- THE accelerator hook SHALL gain the two mechanism pins still missing:
  unmount then dispatching its chord does not call the action; and rerendering
  with fresh table identities registers exactly once while mounted and removes
  exactly once on unmount. Deleting cleanup or changing `[]` to `[table]`
  SHALL red those tests.
- THE two accelerator properties already closed by T-027 SHALL stay pinned,
  not gain duplicate tests: moving `preventDefault` above the absent-entry
  return and deleting the latest-table refresh each already red the scoped
  command tests.
- THE `trackKeydownPaths` comment in `accelerators.test.tsx` SHALL be
  corrected: it says it records "every live keydown listener in the
  app, whichever target it is on" and it patches `window` and
  `document` only. A comment correction, not a test (T-049-s3's
  closing note).
- THE stale-pull test in `startup-recovery.test.ts` SHALL prove the re-arm
  occurred with exact `listenCalls === 2`, `invokeCalls === 1`, plus its
  existing one-echo outcome. A rejected initial subscribe never invokes
  `docs_snapshot`; the suggestion's proposed two invokes was false. Deleting
  the post-pick re-arm block SHALL red this exact test.
- `startup-screen.test.tsx` SHALL dynamically import `isTauriRuntime` beside
  its other store value import and assert it is true before rendering. A
  temporary top-level value import of the store SHALL red this legible
  tripwire rather than silently changing the file's runtime.
- EVERY test this task adds or changes SHALL be poisoned and shown red before
  green, with restore evidence in the notes. Prefer changing only the expected
  value while the actual expression and matcher stay fixed. A matcher change
  counts only if the observed value cannot satisfy the new relation;
  widenings such as `arrayContaining`, `.not` and loosened inequalities are
  not evidence.

Verification: headless — app build/types/full vitest, with seven mechanism
mutants demonstrated red: project rebaseline, cleanup, registration deps,
absent-entry ordering, latest-table refresh, post-pick re-arm, and premature
store value import. Every changed assertion also gets an expected-value-only
poison. Boot and graph gates fire because shipped TypeScript moves. @human:
none.

## Implementation notes

Built 2026-08-18 by `codex/gpt-5.6 @fresh` from checkpoint `71fa546`.

`observeBanking` is now the one pure observation transition over a
`BankingObservation`. It owns first-turn priming, newer-snapshot baseline
advancement, unconditional project-directory rebaselining, the docs diff,
and sorted/deduplicated per-turn accumulation. `InterviewChat` updates that
state directly, and the scripted banking tests reduce their observations
through the same export; the hand-copied second loop is gone. The switch
probe covers project A at seq 8 moving to project B at both seq 8 and seq 3:
the switch produces no chip, while B's next snapshot produces exactly
`docs/STATE.md`.

The causation tautology and its "sharpest" claim are gone. The honest
positive now says only that an active-turn docs snapshot produces a chip;
the existing hostile reducer script remains the negative, proving activity
labels and completed text naming docs paths produce none over an unchanged
tree. The accelerator lane has isolated hook mounts for cleanup and
registration lifetime: a post-unmount chord cannot call its action, and two
fresh table identities still produce one add plus one remove. Its listener
tracker comment now names its real `window`/`document` scope. The stale-pull
assertion is one exact observation containing `listenCalls: 2`,
`invokeCalls: 1`, seq 9, the surviving T-901 tree and one echo. The startup
screen dynamically imports and checks `isTauriRuntime()` only after installing
`__TAURI_INTERNALS__`.

### Mutation and poison evidence

All seven requested mechanism mutants were applied one at a time and restored:

- removed project-directory rebaselining: the finalized equal/lower switch
  test failed, with both later B changes missing;
- deleted accelerator cleanup: the cleanup test observed two calls instead
  of one;
- changed registration dependencies from `[]` to `[table]`: the lifetime
  test observed 2 adds / 2 removes instead of 1 / 1;
- moved `preventDefault` above the absent-entry return: the existing scoped
  command suite failed because the board claimed the cancel chord once;
- deleted the latest-table refresh: the existing scoped command suite failed
  because the interview claimed the cancel chord zero times;
- deleted post-pick startup re-arming: the stale-pull test observed
  `listenCalls: 1`, `invokeCalls: 0` instead of 2 / 1;
- added an observably used premature top-level watcher-store value import:
  the runtime tripwire failed `false` versus `true` before any test rendered.

Poison discipline is **6/6 red**. Every added or changed assertion had only
its expected value changed while its actual expression and matcher stayed
fixed: active-turn chip, equal/lower project switch, accelerator cleanup,
accelerator registration lifetime, stale-pull aggregate, and the runtime
tripwire. The combined run reported five failed tests plus the expected
top-level failed suite, one red per assertion; the finalized switch assertion
was poisoned once more after its equal-watermark arm was added. After restore,
the focused suite passed **130/130**. Final restored test SHA-256 values are
`2019421b...f3409` (interview model), `d9736c5e...df5238`
(accelerators), `668c5cc8...134ff6` (startup recovery), and
`da3226ad...195c33` (startup screen). Temporary mutant surfaces
`accelerators.ts` and `watcher-store.ts` have empty diffs.

### Gates and fence

- documented fresh setup used the local cache: parser `npm ci --offline` and
  build; app `npm install --offline`, both with zero audit vulnerabilities;
- focused T-057 Vitest: **130/130**;
- explicit app `npx tsc --noEmit`: green;
- app `npm run build`: green, 265 modules transformed;
- full app Vitest: **825/825 tests in 42 files**;
- boot gate on scratch port 17657: exit 0, observed
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-057` and
  `[nputer] window "main" created`, then stopped by SIGTERM;
- permanent fence is exactly the two shipped genesis files, four test files,
  and this card. No App.tsx, watcher-store, production accelerator, parser,
  Rust, tools/e2e, manifest, token, registry, fixture, IPC, capability,
  filesystem-write, network, real-CLI or model surface moved. Graph
  regeneration is intentionally deferred to the integrator's checkpoint.

No suggestion was filed; the unused premature import being optimized away
was handled inside the required temporary mutant by making its value
observably used, so the module necessarily loaded early.

## Verdicts
