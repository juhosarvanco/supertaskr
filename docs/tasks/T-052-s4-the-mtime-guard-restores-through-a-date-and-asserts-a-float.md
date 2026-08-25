---
id: T-052-s4
title: The P6 plant-and-restore body restores its clock through a Date and asserts against a sub-millisecond float, so it reds on any filesystem finer than a millisecond
status: suggested
suggested_by: executor claude-opus-5 @T-052
---

**Found by T-052's own gate run, in a file T-052's diff never touches**
(zero `tools/e2e/**` paths in its merge forecast, worktree clean at 0
rows). `npm test` from `tools/e2e/` went **144 passed / 1 failed at exit
1**:

    tests/token-scan.spec.ts:201
      P6 reds a planted bare motion utility and leaves its motion-safe twin alone

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too - a
    content-exact restore that moves the clock reds an mtime guard
      Expected: 1787642946850.1958
      Received: 1787642946850

## It is not a flake. It is a deterministic function of one file's mtime

The body captures `const clock = statSync(target)`, restores with

    utimesSync(target, clock.atime, clock.mtime)

and then asserts against `clock.mtimeMs`.

**`clock.mtime` is a `Date`, and a JavaScript `Date` holds INTEGER
MILLISECONDS.** `clock.mtimeMs` is a float carrying the filesystem's
finer resolution. So the body restores through the millisecond-precision
view of the stat and checks against the sub-millisecond one — two
different precisions of the same reading, and they disagree by
construction whenever the file's mtime has a fractional millisecond.
APFS stores nanoseconds, so that is the ORDINARY case for a file git has
just written.

**PROVED IN BOTH DIRECTIONS, at T-052's tip:**

| fixture mtime | `tests/token-scan.spec.ts` |
|---|---|
| whole milliseconds | **10 passed**, three consecutive runs |
| fractional millisecond, set deliberately | **1 failed / 9 passed**, same Expected/Received pair |

**AND IT HIDES ITSELF, WHICH IS WHY IT READS AS INTERMITTENT.** The
failed run's own `finally` block restores a whole-millisecond mtime, so
the NEXT run captures a whole `mtimeMs` and passes. Red, then green,
with nothing changed — the same self-healing signature `T-079-s3`
records for the `git diff --quiet` assertion this body's own comment
replaced, one notch deeper.

## The fix is one token, and it was measured rather than proposed

    utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000)

`utimesSync` round-trips sub-millisecond values exactly — probed
directly: asking for `1787642946850.1958` returns `1787642946850.1958`.
So the assertion can stay as strict as it is; only the restore has to
stop going through `Date`. Fence `[tools/e2e]`.

## Why this belongs on T-079-s3 rather than beside it

`T-079-s3` says *"A CONTENT-EXACT RESTORE IS NOT A COMPLETE RESTORE"*
and names `utimesSync`'s one honest limit — it cannot restore `ctime`.
This is the same sentence one level finer: **a clock restore is only as
complete as the precision it is expressed in**, and the API hands you
two views of the same timestamp with no hint that picking the wrong one
is lossy. The finding generalises past this body — any restore written
as `utimesSync(f, st.atime, st.mtime)` truncates, and CONVENTIONS' POISON
DRILL bullet is where the next author of a plant-and-restore body will
look for the shape.

**Check the sibling before fixing only this one.** `T-079-s3` already
names T-058's seven-path control-byte body as using the same technique
over seven first-party roots; whether it restores through `Date` too is
one grep and was not run here, because it is outside this lane's fence
and outside its card.
