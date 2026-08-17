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

Absorbs: T-027-s4, T-049-s3 (triage 2026-08-17). The suggestion files
are removed in the same commit as this card.

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
- THE `interview-model.test.ts` marquee test SHALL compare two
  genuinely different inputs: `byPlanner` built from a script that
  DOES carry planner events (a `started` + `completed` whose text
  names the file) and `byHuman` from one that carries none, asserting
  the two chip maps are equal. Today both sides are the same pure
  function called with byte-identical arguments, so the line asserts
  determinism and is deletable with the suite green (T-027-s4).
- THE `bank()` helper SHALL stop being a hand-copy of
  `InterviewChat`'s effect: either export the observation step from
  `interview-model.ts` as a pure `observeBanking(baseline, docs,
  active, chips) -> { baseline, chips }` called by BOTH, or drop
  `bank()` and drive its eight cases through the real effect in the
  DOM suite. It has ALREADY drifted by the project-switch clause
  (`state.seq > baseline.seq` against the chat's
  `docs.seq > baseline.current.seq || docs.projectDir !== …`)
  (T-027-s4).
- THE accelerator hook's four advertised properties SHALL each gain a
  test that KILLS its mutant — verified by performing the deletion
  and watching it red, with the four mutants recorded in notes:
  (1) the unmount cleanup (`removeEventListener` in the effect's
  return, `accelerators.ts:188`); (2) "an absent entry is left
  completely alone" (`preventDefault` must stay BELOW the
  `run === undefined` return, :182–184); (3) the table is re-read on
  every render (the `latest.current = table` effect, :174–175);
  (4) "added once, removed once" (the registration effect's `[]`
  deps). Every one is deletable today with the suite green
  (T-049-s3).
- (2) IS THE LOAD-BEARING ONE and the notes SHALL say why: today
  `App` always supplies both entries so the mutant is unobservable —
  the moment a screen is handed a PARTIAL table, this is the
  difference between politely declining a chord and silently
  swallowing a key the app does not handle. T-027 already hands the
  interview screen a scoped table.
- THE `trackKeydownPaths` comment in `accelerators.test.tsx` SHALL be
  corrected: it says it records "every live keydown listener in the
  app, whichever target it is on" and it patches `window` and
  `document` only. A comment correction, not a test (T-049-s3's
  closing note).
- EVERY test this task adds SHALL be poisoned and shown red before it
  is shown green, and the poison/restore evidence SHALL be in the
  notes — a card about assertions that cannot fail may not ship one.

Verification: headless — `npx vitest run` + `npx tsc --noEmit` from
app/, with the six mutants (four hook + the tautology + the drifted
helper) each demonstrated red. @human: none.

## Implementation notes

## Verdicts
