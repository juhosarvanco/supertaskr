---
id: T-089-s11
title: Two brief-contract residuals the second verdict found are card-body text only — row 9 has no file at all, and row 5's lives inside a closed_by-stamped suggestion that triage is told to delete
status: suggested
suggested_by: integrator claude-opus-5 @T-089-integrate (crediting verifier claude-opus-5 @T-089-verify, second-pass finding 4)
---

Materialized at T-089's integration, not found there. The APPROVED
verdict's finding 4 says, in as many words, *"`s7` is marked closed and
these three rows are what remains — recorded here so 'closed' does not
read as 'complete'"*. Three rows: 11, 9 and 5. **Row 11 got a file
(`T-089-s9`, part two). Rows 9 and 5 did not**, and that is the T-061
hazard the verdict itself names one section earlier: a finding that
lives only in a card body is invisible to triage.

Row 5's case is worse than absent. It IS written down — inside
`T-089-s7`, which carries `closed_by:` and whose own last line invites
triage to *"promote this the usual way (`Absorbs:` + removal)"*.
`method/tasks/TASK-FORMAT.md`'s absorption rule REMOVES the suggestion
file in the same commit. So the one surviving copy of row 5's residual is
in a file the convention schedules for deletion. That is exactly the
divergent-copies-without-precedence shape the same commit's rule 4
companion was written to prevent, applied to the finding about it.

**Neither row is fixed here. This card only makes them findable.**
`method/` was outside the integration's business and the fixes are one
phrase each.

## Row 9 — the untwinned twin

Row 8 (Gates) gained an ENUMERATION rule in the second pass: each
standing gate is a CONVENTIONS bullet naming a merge-diff TRIGGER, and
`grep -n "at any merge whose diff" docs/CONVENTIONS.md` returns exactly
the three — a rule a program can run, and one that discriminates against
AUDIT GATE POLICY and the token lint, which have no merge-diff trigger.
(Re-measured at the merged tree: 3 hits, lines 592, 717, 746.)

Row 9 (Standing disciplines) has the same defect, was walked in the same
pass, and got nothing. Its source column still reads *"the project's
CONVENTIONS"* with no way to enumerate what counts as a standing
discipline — so an assembler cannot produce row 9 from its own source,
which is the defect `T-089-s7` exists to close and closed for five other
rows.

**Fix:** an enumeration rule for row 9 in the same shape as row 8's — a
greppable marker, or a named section, or the explicit statement that the
set is not machine-derivable and must be transcribed whole.

## Row 5 — the slug↔path map is named but not located

Row 5 now names *"the project's slug↔path map"* as a source. Every other
row names a FILE: row 3 the root adapter, rows 6/7/8/9/10 CONVENTIONS,
row 11 the ceremony table. This one makes a program search.

It is `docs/ARCHITECTURE.md` (the component table) plus each
`docs/architecture/components/*.md`'s `touch_slugs:` field. Both halves
are needed: the table maps ID→component, the component files map slug→
paths. Without it, a fence of `[app-shell]` and a fence of
`[method/, docs/CONVENTIONS.md]` cannot be tested for disjointness at
all — one is a slug and the other is two paths.

**Fix:** name those two locations in row 5's source column, the way rows
3 and 11 name theirs.

## Why one card

Same table, same source column, same defect class, and one editor closes
both in a single pass over `method/roles/executor.md`. Whoever takes
`T-089-s9` is already in that file.
