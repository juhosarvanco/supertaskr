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
builder:
verifier:
built_by:
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

## Verdicts
