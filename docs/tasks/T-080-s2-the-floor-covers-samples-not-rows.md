---
id: T-080-s2
title: The evidence floor covers the sample arrays; the walk-policy rows and the near-miss negatives still have none
status: suggested
suggested_by: executor claude-opus-5 @T-080
---

T-080 closes poison shape five for the two SAMPLE arrays — every TOKEN
pattern id must keep a positive, P5 must keep a positive, a negative and
a positive whose hex carries a letter — and it closes the CORPUS
property structurally, by deriving the coverage rows from the tracked
list so they cannot be deleted one at a time. Two residuals were
measured at `fef8870` and are deliberately left, because closing them is
a design question rather than an omission. **First: the walk-policy
array still has no cardinality floor.** Deleting the six literal
`CONTROL includes <root>/` rows leaves the selftest green at 64 checks
instead of 70. It no longer COSTS anything — with those rows gone, a
`SKIP_DIRS` gaining `docs` still reds nine ways through the derived
rungs — and the rows are kept only because a root vanishing from the
TREE would remove its derived row while the literal row stays. **Second:
the TOKEN negatives have a coverage floor of one, not of families.**
Deleting the regex-literal negative (`const re = /text-[0-9]+/g;`) left
the selftest green at 48 samples, because the floor asks only that
negatives exist. The near-misses fall into named families in the source
comments — arbitrary variants, labeled tuples, regex literals, comments,
selector strings — and a `family:` tag per negative with one row per
family would give them the same floor the positives now have. That is
the shape worth deciding on, not another literal count: the module's own
argument is that "the negatives ARE the precision", and precision is
currently pinned by prose.
