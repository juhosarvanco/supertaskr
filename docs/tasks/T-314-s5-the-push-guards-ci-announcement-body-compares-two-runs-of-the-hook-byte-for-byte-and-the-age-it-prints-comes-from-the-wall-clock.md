---
id: T-314-s5
title: "The push guard's CI-announcement body compares two runs of the hook byte for byte while the sentence they print carries an AGE taken from the wall clock, so the body reds whenever its two invocations straddle a minute boundary"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-300-s7, its graded run at f3c6a59f: the body failed on `running for 294h 27m` against `294h 28m` and passed on one re-run; the spec is outside that lane's fence"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts, .claude/hooks/push-guard.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The body named "the acknowledgement is RETIRED, and no environment
variable moves this guard's CI arm" runs the wired hook twice against one
fixture and asserts that the second run's stderr EQUALS the first's,
character for character. The sentence both runs print announces an
in-flight CI run and states how long it has been running, and that age is
computed from the clock at the moment the hook runs.

The two invocations are separated by whatever the first one costs. When
they fall on either side of a minute boundary the two sentences differ by
one digit and the body reds, naming a difference that is a property of
the clock rather than of the guard.

Measured at f3c6a59f during T-300-s7's one graded run of its owed set:
the e2e leg was RED at exit 1 over 867 bodies with this as its only
failure, reporting `running for 294h 27m` against `running for 294h 28m`
over the same invented run. One re-run of that body alone was GREEN. The
lane's diff touches neither this spec nor the hook.

The property the body is defending is real and worth keeping: naming the
retired variable must move neither the verdict nor the sentence. What is
wrong is the comparison, which asserts equality over a string that
carries a live clock reading.

## Acceptance criteria

- WHEN the body compares two runs of the hook THE comparison SHALL be over text that does not move with the clock: either the hook's age reading is made a function of an injected instant that the fixture supplies, or the age is normalised out of both sides before the comparison, with the normalisation asserted to have actually matched something.
- WHEN the normalisation or the injection is in place THE body SHALL still red if naming the retired variable changes any other part of the sentence, proved by a mutant that makes the hook print one extra word under that variable.
- WHEN the fix is an injected instant THE hook SHALL keep its real clock wherever nothing injects one, so no production path depends on a fixture's seam.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
