---
id: T-080-s7
title: Poison shape nine — a mutation that MOVES a generated row between families leaves the cardinality unchanged, so a count floor is blind to it
status: suggested
suggested_by: verifier claude-opus-5 @T-080
---

Found while attacking T-080's corpus floor, and it is an argument
against the remedy `T-080-s2` proposes. Shape five says a
self-enumerating assertion array has no cardinality floor, so deleting a
row deletes its own failure. The standing fix is to add a count floor.
**Measured at `9c64cd8`, here is a mutation a count floor cannot see.**

Declaring a suffix class binary in BOTH `CONTROL_BINARY_EXTENSIONS` and
`CONTROL_UNCOVERED_SUFFIXES` is the workflow the module documents for a
genuine new binary asset. Applied to `.jsx` — a first-party TEXT class,
two tracked React sources — the selftest stays at **exit 0 with exactly
70 walk-policy checks**, the same number as the untouched tree, and the
lint goes green at 511 of the 513 CONTROL files tracked at `9c64cd8`.
(That 513 is a function of the tree and nothing else: the same corpus
has read 496, 502, 507, 514, 517, 520, 521 and 529 at other refs. Every
figure in this finding is `9c64cd8`.) Nothing is deleted. Rung A generates one row per
tracked class either way: the class simply moves from the "covers every
tracked `.jsx` file" family to the "excludes every tracked `.jsx` file"
family, and rung C nets out because `exempt` grows by exactly what
`covered` loses. **The count is conserved by construction**, so a floor
of the form "at least N checks" would have passed at every N.

The general shape, worth numbering beside the other eight: **a
generated assertion set whose cardinality is invariant under the
mutation, because the mutation reclassifies a row rather than removing
one.** Cardinality floors answer deletion; they say nothing about
reclassification. Only a CONTENT floor does — here `MUST_CONTROL_COVER`,
which reds for `.rs .ts .tsx .md` and for nothing else, so the other
fourteen tracked classes have a two-line silent escape.

**A derived replacement exists and was exact when measured, at
`9c64cd8`.** Every one of the 18 tracked files of an exempt class at
that ref is byte-detectably binary —
all 18 contain U+0000 AND fail a strict UTF-8 decode — while **no**
tracked file of ANY covered class is (`.rs` 44, `.md` 240, `.jsx` 2,
`.txt` 1, `.mts` 1: zero binary by that test). So a fourth rung — "every
tracked file of a class declared uncoverable must actually be binary" —
would have red the `.jsx` edit loudly, needs no hand-maintained name
list, derives from the TREE rather than from a ruling, and cannot go
stale when a real new asset format arrives. That is a better authority
than four quoted class names, and it is the answer to the design
question T-080's notes leave open.
