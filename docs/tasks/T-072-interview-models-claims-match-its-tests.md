---
id: T-072
title: interview-model's claims match its tests — a non-duplicate positive, an identity restored, a header made true
feature: F-03
milestone: 4
priority: 15
size: S
status: planned
blocked_by: []
touches: [app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-057-s1, T-057-s2, T-057-s3, T-057-s4 (fourth triage,
2026-08-19). The suggestion files are removed in the same commit as this
card. All four live in `app/src/genesis/interview-model.ts` and
`app/test/interview-model.test.ts`, and one pass closes all four.

T-057'S OWN RECURSIVE FINDING, and it is the sharpest of the four. The
card that removed the `f(x) === f(x)` tautology replaced it, per its
criterion 3, with a test that is byte-equivalent to one three cases
above it in the same `describe`: same `bank()` helper, same seq, same
`at`, same prime tree, same matcher, same expected value. The only
difference is an inert content string, and no code path reads it
differently — `bankedSince` compares against `undefined` in both cases,
so both take the identical absent-to-present branch. **Measured:**
rewriting the newer test's content string to match the older one makes
the two calls character-for-character identical and the file still
passes 58 of 58. It kills no mutant of its own; it stayed green under
the rebaselining mutant and under the deleted different-project guard.
The tautology did not go away — it moved from inside one test to across
two.

**This is poison shape SIX and it belongs in T-078's drill clause**: a
body that reds under an expected-value poison while killing no mutant
another test does not already kill. It is not vacuous in the poison
sense, which is exactly why T-057's own poison discipline passed it.
Worth saying plainly: the criterion ASKED for this. It named as its
honest positive a property the suite already had, and the executor
implemented the criterion literally.

THE RELOCATION ALSO MOVED WHERE THE BASELINE LIVES. Before, the baseline
was a `useRef` mutated without a re-render and the early return called
no setter at all. After, both live in one `useState` and the transition
returns a fresh object whenever the baseline advances even when nothing
chips — and a fresh object literal is never `Object.is`-equal to the
previous one, so React does not bail out. Two paths gained renders, not
one: the nothing-banked path and the file-changed-twice-in-one-turn
path. `InterviewChat` has an effect keyed on `transcript`, which is
recomputed unmemoised on every render, so each added render also fires
the auto-scroll write. Bounded, not user-visible — and a regression in
the exact direction T-056 exists to move, landed by a card whose subject
is tests.

## Acceptance criteria
- THE duplicate positive SHALL either be DELETED, with the existing test
  three cases above it renamed to carry the positive half, or be given a
  shape the suite does not already drive. Whichever arm is taken, the
  surviving test SHALL be proved to kill a mutant NO OTHER TEST IN THE
  FILE kills, and that proof SHALL be recorded — a replacement that
  merely reds under a value poison repeats the finding.
- `observeBanking` SHALL restore the render identity the relocation
  lost: return the PREVIOUS observation when `chipsByTurn` did not
  change, carrying the advanced baseline without forcing a new state
  object — or split the return so a baseline advance does not force one.
  Criterion 1 of T-057 (ONE pure transition, shared by chat and tests)
  SHALL stay intact; this is not a request to put the rule back in the
  component.
- THE render count SHALL be pinned, not argued: a quiet snapshot (seq
  advances, docs contents unchanged, nothing banked) SHALL be shown to
  produce no additional render, and the pin SHALL fail if the identity
  is dropped again.
- THE module header's rule 1 SHALL stop saying "deliberate AND TESTED"
  about the hand-written-file property whose test T-057 deleted. The
  property is still true by construction — the only input is the
  watcher's snapshot, which is the type-level argument the same sentence
  already makes — so the honest text drops "and tested", or names the
  surviving negative test (activity labels and completed text naming
  docs paths produce ZERO chips) as what backs it.
- THE project-switch test SHALL not read as more than it proves. Its
  `switched: undefined` half is held by the STALE-SNAPSHOT guard, not by
  the different-project guard its name implies: measured, deleting the
  project guard reds two OTHER tests and leaves this one green. This is
  a TENSION, not a mistake — the equal and lower watermarks are what
  make the other half isolate the project clause, and at a higher switch
  seq the rebaselining would happen anyway. A comment beside the
  assertion, or a third arm at a higher seq asserting the switch
  produced no chip FOR THE PROJECT REASON, SHALL close the gap.

Verification: headless app Vitest. Poison discipline applies to every
changed assertion, and per T-078's clause the mutation SHALL be
one-sided — never a literal the producer and the assertion share.

## Implementation notes

## Verdicts
