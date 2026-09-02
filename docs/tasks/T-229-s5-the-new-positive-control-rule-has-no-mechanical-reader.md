---
id: T-229-s5
title: The positive-control rule T-229 wrote into the method has no mechanical reader, so a later compaction can delete it and nothing reds
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-155`** (the method gets an eval suite — a bump that
degrades the work reds before it ships), whose whole argument is
`T-093-s1`'s class: the hand rules have no mechanical reader.
**Disposition hint: promote only if a second method rule wants the same
treatment; on its own it is one eval and may not earn a card.**

T-229 wrote a SHALL into three places — `method/roles/verifier.md` step
2b, `method/roles/executor.md`'s report drill row, and
`method/tasks/TASK-FORMAT.md`'s guard-class paragraph. Derived at
`637af3f`: the model-free set reads those files for STRUCTURE (MF-02
citations, MF-03 openings, MF-04 crossrefs, MF-05 vocabularies) and for
nothing else, so the rule's CONTENT is unread. The lane's own drill
measured exactly this and reported it as the honest limit: breaking the
`roles/verifier.md` pointer inside the new sentence reds MF-04 by name,
and deleting the whole rule reds nothing.

**AND THE RULE IS THE ONE THAT ASKS FOR THIS.** *"A rule stated without
its measurement reads as advice"* is the card's own citation of
`T-146`, and a rule with no keeper is the next step down from that. The
shape is an MF-07 in the existing corpus: assert that each of the three
sites still carries the demonstration SHALL and that the four instance
ids still resolve, with the `degrade()` half deleting the sentence and
requiring the audit to notice — the same `control`/`degraded` pair
every other model-free eval already uses, so it costs no new machinery.

**THE HONEST COUNTER-ARGUMENT, RECORDED SO TRIAGE CAN WEIGH IT**: an
eval that greps for a sentence pins the WORDS and not the rule, which
is `SHAPE EIGHT` in `docs/CONVENTIONS.md`'s poison catalogue — a
search-based assertion satisfied by any occurrence. If it is built, the
haystack is narrowed to the section and the ANCHOR is asserted unique,
the way `snapshot_version_matches_the_live_method_stamps` does.
