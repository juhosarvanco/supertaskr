---
id: T-077-s1
title: A failing file's SECOND issue is still count-only, and T-077 did not close that half
status: suggested
suggested_by: executor claude-opus-5 @T-077
---

**WHAT T-077 CLOSED AND WHAT IT LEFT.** The card's criterion 1 asks that
`model.issues` not represented in `failures` get their own rows *"so the
count and the list can never disagree about how many problems the docs
have"*. The rule shipped is a statement about FILES, because that is what
a failure row is: an issue is dropped when every file it names already
has a failure row. That closes the whole cross-file family and every soft
issue on a record that parsed. **It does not close a file that failed
with more than one issue.**

**THE RESIDUE, MEASURED.** The failure row renders
`f.issues[0]?.message` — the FIRST issue and only the first — while
`f.issues` carries all of them and, when the file has no last good parse,
`model.issues` carries them all too. So a task file whose frontmatter is
present but whose `status` is invalid AND whose `title` is missing counts
**2** and shows **1** row. The strip is no longer empty, which is the
defect T-077 was filed for; the arithmetic still does not close.

**WHY IT WAS NOT FIXED THERE.** Criterion 5 of that card pins the
strip's existing behaviour for withheld records as UNCHANGED, and every
way to close this changes a failure row: append `(+N more in this file)`,
render one row per issue instead of one per file, or fold the failure
rows into the same derivation. All three are defensible and all three are
a different card's call.

**AND NOTE THAT EXACT EQUALITY IS UNREACHABLE ANYWAY**, which is why this
is a suggestion rather than a bug. A file that fails WITH a last good
parse produces a failure row for an issue that is NOT in `model.issues`
at all — `effective` renders the good content, so the model never sees
the bad one. Rows will always be able to exceed the count. The honest
target is *"no counted problem is unexpandable"*, not *"rows == count"*,
and whoever takes this should write that sentence down somewhere the next
reader of the criterion will find it.

**Cheapest close**: render one row per issue in `f.issues` rather than
one per failure, keyed by path plus index, with the
`(showing last valid state)` suffix on the first only. Two lines in
`App.tsx`, and it makes `data-failure-count` and the row count diverge —
which is fine, since the chip counts FILES and always did.
