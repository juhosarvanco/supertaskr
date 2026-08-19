---
id: T-080-s1
title: A criterion can specify a check that cannot fail, and two criteria on one card can contradict
status: suggested
suggested_by: executor claude-opus-5 @T-080
---

T-080's first acceptance criterion offers two forms of the CONTROL
coverage floor and states a preference: "EITHER a named set of suffix
classes the corpus must cover, OR a check that every suffix present in
the tracked file list minus the binary set is present in the corpus.
**The second is preferred**". Read literally, the preferred form **can
never fail**. The corpus is DEFINED as the tracked list minus the skip
directories minus `CONTROL_BINARY_EXTENSIONS`, so adding `.rs` to that
set removes `.rs` from the expectation at the same instant it removes it
from the corpus — the deletion deletes its own failure, which is the
exact shape (poison five) the floor exists to close, one rung up. The
card's SECOND criterion then requires the floor to bite for `.rs` and
`.tsx`, so criteria 1 and 2 as written cannot both be satisfied by the
form criterion 1 prefers. The build resolved it by making the exemption
a genuinely second list (`CONTROL_UNCOVERED_SUFFIXES`), which preserves
the property criterion 1 actually wanted — no staleness when a new
first-party text format arrives, measured — while restoring the
asymmetry that makes a check able to fail. The general lesson is worth a
line in the decomposition rules beside the poison shapes: **a criterion
that names a relation between a policy and a view DERIVED from that
policy has specified a tautology**, and it reads exactly like a real
check until someone tries to red it. The card's own evidence paragraph
did not catch it because the evidence was gathered by mutating the
policy, not by mutating the proposed check.
