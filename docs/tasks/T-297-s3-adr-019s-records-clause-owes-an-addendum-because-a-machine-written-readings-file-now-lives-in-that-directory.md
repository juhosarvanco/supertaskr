---
id: T-297-s3
title: "ADR-019's Records clause owes an addendum, because a machine-written readings file now lives in that directory and a band reads it — the owner's sentence, not a lane's"
feature: F-01
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-297, 2026-09-10"
blocked_by: []
touches: [docs/decisions/019-governing-docs-rules-truths-records.md]
builder:
verifier:
built_by:
verified_by:
review:
---

ADR-019 says no suite, gate or generator may DEPEND on the contents of
`docs/checkpoints/`. ADR-024 decision 3 then had the merge verb append
`docs/checkpoints/meters.jsonl` and named T-297's bands as its reader,
and T-297 wired them. The two hold together on the reading this lane
wrote into `docs/CONVENTIONS.md` and `docs/checkpoints/TEMPLATE.md` —
the reporter is not a suite, a gate or a generator; the file is written
by a program and by no hand; and the hazard the clause exists against is
a program that reds when a human writes a paragraph another way, which
cannot happen to a file no human writes. That reading is written down in
two governing documents and is nowhere in the ADR it reads.

An ADR is amended by ADDENDUM and by its owner. This card is the note
that the addendum is owed and that no lane should write it. The sentence
it wants is one paragraph: which file, why it is not a record's prose,
and that the hand-written marker lines still reach a command only
through the `--readings` route the template already describes.

## Acceptance criteria

- WHEN ADR-019 is next opened by its owner THE Records clause SHALL carry an addendum naming the machine-written readings file and the reader ADR-024 gave it.
- WHEN the addendum lands THE two governing documents that carry the reading today SHALL cite it rather than argue it.
