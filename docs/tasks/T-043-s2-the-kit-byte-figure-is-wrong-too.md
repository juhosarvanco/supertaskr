---
id: T-043-s2
title: T-025 §3's kit size "~60 KB" is wrong by 2.5x, and unlike the file count it should be deleted rather than corrected
status: suggested
suggested_by: executor claude-opus-5 @T-043
---

T-043's criterion corrected §3's `(13 files, ~60 KB)` to **14 files** —
verified against `KIT_FILES`, which has fourteen entries, and against §3's
own enumeration, which lists fourteen. That half is done and closes the
count half of the parked **T-025-s3** (its `runtime/nputer.yaml` half is
untouched and stays parked for the second adapter).

**The byte figure in the same parenthetical is also wrong, and nobody had
checked it.** Measured on this branch, `wc -c` over exactly the fourteen
`include_str!` sources:

```
14 files, 23890 bytes (23.3 KiB)
```

against the plan's "~60 KB" — off by a factor of about 2.5, in the
opposite direction from the file count.

**The recommendation is to delete the figure, not to fix it**, and that is
why this is a suggestion rather than something T-043 did quietly. The
count is STABLE and LOAD-BEARING: adding a template moves it, the parity
walk asserts the table matches the directory, and a wrong count sends a
reader looking for a fifteenth file. The byte total is neither — it is
`include_str!` of fourteen live `method/` documents that every method
version bump rewrites, so it was already stale by the next commit and
will be stale again by the next reader. A number that no test can hold
and that drifts by construction is worse in a plan than no number.

If a size claim is wanted, the honest form is a bound with a reason ("the
kickoff prompt carries tens of KB, not hundreds") rather than a figure
that reads like a measurement.
