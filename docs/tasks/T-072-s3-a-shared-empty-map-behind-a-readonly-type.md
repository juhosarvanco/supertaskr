---
id: T-072-s3
title: The empty banking observation is a shared mutable Map wearing a readonly type
status: parked
suggested_by: executor claude-opus-5 @T-072
---

`EMPTY_BANKING_OBSERVATION` and `UNPRIMED_BASELINE` in
`app/src/genesis/interview-model.ts` are module-level constants whose
`chipsByTurn` and `contents` are real `Map`s, typed `ReadonlyMap`. Every
mount of `InterviewChat` starts from that ONE object, and every
`observeBanking` chain in `app/test/interview-model.test.ts` starts from
it too. **`ReadonlyMap` is a compile-time view, not a runtime one**: a
cast, a JS caller, or any code outside this program can `set` on it, and
the mutation is shared by every consumer that has ever started from the
constant.

**MEASURED, as a by-product of T-072's drill rather than as a
hypothesis.** Mutant `M7` replaced the copy in `observeBanking` —

    const chipsByTurn = new Map(previous.chipsByTurn);

— with a cast that reuses the caller's map. **Eight bodies red, across
two files**, and the interesting ones are not the bodies that touch the
mutation: `pre-existing docs do NOT chip on turn 1`, `a turn whose
activity labels name docs paths produces ZERO chips` and `nothing chips
before the interview has started` all red on chips they never banked,
because an EARLIER test in the same run had written into the shared
constant and every later chain inherited it. Three of the eight failures
are pollution, not the property under test, and the reporter cannot tell
you which is which.

**In the shipped app the same shape is a cross-mount leak**: two
interviews in one session both prime from the same object.

**The close is one line and it is a runtime guard rather than a type
one.** `Object.freeze` the two constants and their maps — or build them
through a helper that freezes — and a `set` on the shared instance
throws at the mutation site instead of surfacing three tests later as a
chip nobody wrote. Freezing a `Map` does not stop `map.set` (the entries
are internal, not own properties), so this wants either a genuinely
immutable wrapper or a `set` that throws; the honest cheap version is a
factory (`emptyBankingObservation()`) so no two consumers ever share one
instance, which removes the class rather than guarding it.

Nothing is broken today: the live code copies before writing and always
has. This is about the distance between where such a bug is INTRODUCED
and where it is OBSERVED, which T-072 measured at three unrelated test
bodies and one file.

**PARKED at the fifth triage (2026-08-20).** Unpark when a second consumer of EMPTY_BANKING_OBSERVATION appears, or when a test-pollution failure is attributed to the shared map. Verified at the fifth triage: live code copies before writing and always has.
