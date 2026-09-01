---
id: T-236-s2
title: DOC_BUDGETS' `landed` figures have no keeper — a mistyped landing size, or a warn/fail line that no longer follows ADR-019's formula from it, reds nothing anywhere
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-fable-5-1@subagent @T-236
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**A FIGURE WITH NO KEEPER, IN THE TABLE THAT EXISTS TO KEEP FIGURES.**
`DOC_BUDGETS` in tools/e2e/scripts/docs-scan.mjs carries three numbers
per governing document. The gate reads `fail` and the health bands
read `warn`, so those two are exercised on every run — but `landed`
is read by nothing that could contradict it, and nothing asserts that
`warn` and `fail` are the values ADR-019 §Budgets derives FROM
`landed` (`warn = ceil(landed + max(F, landed × 0.25))`,
`fail = ceil(landed × 1.5)`, `F = 2 053` per addendum 5). T-236
re-landed CONVENTIONS' row by hand — `git cat-file -s
d01b24f:docs/CONVENTIONS.md` = 117502, warn 146878, fail 176253 — and
checked its own arithmetic in a node one-liner, which is exactly the
kind of hand check ADR-019's Law 2 says goes stale. Two keepers close
it inside `[tools/e2e]`: a health-bands.spec.ts body that recomputes
`warn` and `fail` from each gated entry's `landed` under the ADR's
formula and reds on a mismatch (a DATA mutant of one row is its
positive control), and a comment-free `landedAt: "<sha>"` field per
row so a second body can assert `landed === git cat-file -s
<sha>:<path>` — the derive command the addenda already prescribe,
executed rather than quoted. Note the STATE row: addendum 5 records
that the floor moves its warn line to 8825 while the table still holds
8465 (`T-162-s2`, planned, owns that edit); a formula keeper would red
on it today, which is the correct reading and one more reason to land
T-162-s2 first or together. Class parent: ADR-019 Law 2 and T-142 (a
census with no positive control reads clean).
