---
id: T-153-s7
title: A poison over a clock-restore assertion can be killed by the PREVIOUS run, because `utimesSync` leaves the target's mtime a fixed point of itself — and T-111-s10's clock sentence now owes a Linux half
feature: F-06
milestone: 4
priority: 6
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5@subagent @T-153-s5
builder:
verifier:
built_by:
verified_by:
review:
---

**TAKE THIS WITH `T-111-s10`, NOT INSTEAD OF IT.** That card already
owns the POISON DRILL bullet's clock paragraph — it absorbed `T-130-s1`
(*"50 of 50 fresh writes land on a sub-millisecond mtime, the Date form
round-trips 0 of 50 and the seconds form 50 of 50"*) and `T-079-s3`, and
`T-104-s5`'s routing fact says these edits land in a small number of
bullets and want ONE pass. Both halves below are sentences for that same
paragraph. Filed separately only because `T-153-s5`'s fence is
`[tools/e2e]` and cannot reach `docs/CONVENTIONS.md`.

## Half one — the sentence T-130-s1's measurement is missing

The absorbed measurement is a DARWIN measurement and does not say so.
`T-153-s5` measured the same round-trip on Linux, where it does not
hold: `utimesSync` takes SECONDS AS A DOUBLE, and libuv's
`uv__fs_to_timespec` truncates the nanosecond field to a whole
MICROSECOND before `utimensat` sees it, while the Darwin path carries
the nanoseconds through. The seconds form is still the RIGHT form; what
was wrong is the inference from *"round-trips 50 of 50 here"* to
*"round-trips exactly"*. The sentence the bullet wants is the one that
survives a second platform: a clock restore round-trips at MICROSECOND
precision, and an assertion that demands more is measuring the
measuring platform.

## Half two — a poison shape the catalogue does not carry

`T-153-s5`'s drill mutated the restored clock's TOLERANCE to zero and
expected both plant-and-restore bodies to red. Only ONE redded. The
cause is not the assertion and not the mutation: the seven targets of
the other body had been restored BY THE PREVIOUS MUTANT'S RUN through
`utimesSync`, which makes their stored mtime a FIXED POINT of the very
conversion under test — feed a value that already came out of
`utimesSync` back into it and it reproduces exactly, so a zero tolerance
is satisfied and the mutant survives. Re-run with the eight targets
`touch`ed to kernel-fresh timestamps first, the same mutant redded BOTH
bodies (measured at `5970bf6` in a detached drill worktree).

**THE TELL, which is what makes it worth a sentence:** the state the
assertion reads was WRITTEN BY THE PREVIOUS RUN of the same suite, so
the mutant is killed by history rather than by the body. It is distinct
from SHAPE TEN (there the comparison has nothing on either side; here
both sides are real and equal for a reason outside the test) and from
SHAPE ELEVEN (there the WITNESS is buffered; here the SUBJECT is
pre-conditioned). MECHANICAL REMEDY: none in general — but the
PROCEDURE is cheap and general, and is the half worth writing: **before
poisoning an assertion over persistent state, put that state back to a
condition the suite did not create.**

**THE ORDINAL IS NOT MINTED HERE.** The catalogue is closed at eleven
and every ordinal is minted in `docs/CONVENTIONS.md`; whether this is a
TWELFTH shape or a second face of ten is that seat's call, and this card
deliberately does not decide it.
