---
id: T-205-s4
title: MF-02 resolves numbered rules and is blind to LETTERED sub-steps, so `roles/orchestrator.md 5d` — now cited from two role files — dangles silently the day 5d is renamed
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**A HOLE MF-02 ALREADY KNOWS THE SHAPE OF, IN A CITATION FORM T-205 JUST
MADE LOAD-BEARING.** `tools/method-evals/evals/mf-02-rule-citations.mjs`
resolves `<file>.md rule N` against that file's own `^ {0,3}(\d+)\.\s`
items. The method's role files do not number their steps that way in
every case: `roles/orchestrator.md` carries `5b.`, `5c.` and now `5d.`,
and every citation of them — `(roles/orchestrator.md 5c)` in two files
before T-205, `roles/orchestrator.md 5d` in `roles/verifier.md` and
`roles/executor.md` after it — carries no `rule` keyword and names no
ordinal MF-02 can see. **The regex does not match, so the citation is
never examined**, which is the same silent class MF-04's own header
names for a bare unprefixed filename.

**WHY IT MATTERS NOW RATHER THAN BEFORE.** T-205's whole shape is *one
statement, everything else points at it* (`T-057`). A pointer that
cannot be checked is the failure mode of that shape: rename 5d, or
insert a 5d ahead of it, and two role files quietly cite a step that is
not there while every gate stays green. This is MF-02's own opening
argument — *an ordinal IS a line number wearing a rule's clothes* —
applied to the form the method actually writes.

## Acceptance criteria

- MF-02 SHALL resolve a LETTERED sub-step citation (`<file>.md 5d`,
  `<file>.md 5c`) against that file's own `^\d+[a-z]\.` items.
- THE coverage count SHALL rise, and the eval SHALL still throw when it
  examines nothing — a widened predicate that matches nothing is a
  quieter version of the hole it closed.
- THE POSITIVE CONTROL SHALL rename `5d` in the home file and require
  the eval to name the two role files that cite it, demonstrated red.
- THE predicate SHALL NOT start matching ordinary prose: run it over the
  corpus and show the findings count is zero before the degradation.
