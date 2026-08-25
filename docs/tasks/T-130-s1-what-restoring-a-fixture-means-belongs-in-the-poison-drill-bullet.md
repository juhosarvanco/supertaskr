---
id: T-130-s1
title: What restoring a fixture MEANS belongs in the POISON DRILL bullet — and the ctime caveat beside it is weaker than it reads
status: suggested
suggested_by: executor claude-opus-5 @T-130
---

**ROUTED, NOT TAKEN.** `docs/CONVENTIONS.md` is held by **T-104** at
T-130's dispatch, so this is the CONVENTIONS sentence T-130's own
acceptance criteria asked to be routed rather than written. It is the
same seat `T-079-s3` items 2 and 3 already sit in, and it should be taken
in one edit with them rather than as a fourth pass over the same bullet.

## The sentence

The POISON DRILL bullet already rules how a restoration is PROVED —
*"`git show HEAD:<path> | shasum -a 256` against the working file, or an
empty `git diff -- <path>`"*. It does not say what restoring MEANS. Two
properties, and the second cost this project six checkpoints:

> **A CONTENT-EXACT RESTORE IS NOT A RESTORE.** A body that plants into a
> tracked file restores its BYTES *and* its CLOCK, because a sibling
> suite may be reading the clock. And **a clock restored through a `Date`
> is lossy below the millisecond**: `Stats.mtime` is a `Date` and a
> `Date` holds whole milliseconds, so `utimesSync(target, stats.atime,
> stats.mtime)` writes back a ROUNDED timestamp. Pass SECONDS AS A
> NUMBER — `utimesSync(target, stats.atimeMs / 1000, stats.mtimeMs /
> 1000)` — which carries the fraction into the `timespec`.

Measured at T-130 on APFS / Darwin 25.6.0 / node v22.22.0: **50 of 50**
fresh writes produce a sub-millisecond mtime, the `Date` form round-trips
**0 of 50**, and the seconds form round-trips **50 of 50**.

**AND THE FAILURE REPAIRS ITS OWN PRECONDITION, which is why the rule has
to be written rather than discovered.** The lossy restore leaves the file
on a whole millisecond, so the next run captures a whole-millisecond
clock, the rounding is a no-op and the body passes. Red once, green
forever after, in that checkout — so **re-running until green is the
defect's own healing mechanism, not evidence.** Whatever wording lands,
that sentence should land with it; four separate lanes met this on one
night and each had to identify it by its digits.

## The `ctime` caveat beside it is WEAKER than it currently reads

`T-079-s3` item 1 records, as a measured property, that `utimesSync`
cannot restore `ctime`, that `git diff --quiet` answers from the index's
cached stat info, and that the first call after a restore therefore
*"reports a difference on stat alone"* — **"Measured red-green-green over
three consecutive runs."** The same sentence is carried in the comment
above `token-scan.spec.ts`'s P6 assertion. It was the one reason not to
give the T-058 body a clock restore, since that body proves its own
restoration with `git diff --quiet`.

**IT DID NOT REPRODUCE.** T-130 replayed the T-058 body's exact sequence
over its exact seven targets, both arms — content-only, and content plus
the clock restore — reading `git diff --quiet`'s exit each cycle:
**12 cycles per arm, exit 0 in 12 of 12, in both arms, across two
checkouts**, one of them a freshly-cut worktree whose index had never
been refreshed. The clock restore shipped on that measurement.

This is **not** a claim that the red-green-green never happened; it is a
claim that the hazard is not a property you can rely on being present.
So if the `ctime` half goes into the doc (T-079-s3 item 3), it should be
written as **an observation that has been seen once and not reproduced in
24 further cycles**, not as a mechanism — and the standing advice stays
what it already is: **prove restoration by HASH**, which is immune to the
question either way.

**Fence:** `[docs/CONVENTIONS.md]` — held by **T-104**.
