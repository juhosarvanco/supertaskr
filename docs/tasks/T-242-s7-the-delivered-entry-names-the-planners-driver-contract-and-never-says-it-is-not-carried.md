---
id: T-242-s7
title: "The delivered entry names the planner's driver contract and never says it is not carried — the same file says so for the card format and for the archaeology document, so the omission reads as a file the folder has"
feature: F-04
milestone: 4
size: XS
priority: 5
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-242, found by enumerating every path the delivered file names against the seeds it carries"
blocked_by: []
touches: [tools/e2e/scripts/interview-skill.mjs, tools/e2e/tests/interview-skill.spec.ts, method/skills]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The generated entry states a discipline in its own generator's header:
what does not ride is SAID rather than left to be found. It applies that
discipline twice and well — the card-format document and the archaeology
document are each named, declared absent, and answered with what to do
instead.

It is not applied to the planner's driver contract. The banks the entry
carries verbatim open with a line saying the interview is run by the
planner, and that the driver contract, the resume rule and the overwrite
rule all live in the planner's role file. The framing prose immediately
above that block enumerates all three and then redirects only two of
them, saying the two rules are in section 4 of the entry. The driver
contract is named and then silently dropped, so a reader is told a file
holds something the reader needs and is never told the file is not here.

The app's lens carries that file whole: the planner's role file is the
opening entry of the kit's snapshot table, materialized into the
project. So this is also the widest place where the two lenses hold
different method, and the one the entry does not account for.

Enumerated at T-242's tip by listing every path-shaped token in the
delivered file against the seed blocks it carries: the only pointers
that resolve to nothing and are not answered in the prose are the
planner's role file for the driver contract, and the generated index and
the docs protocol named by the adapter and state templates. The second
pair is pre-existing and identical in both lenses, so it is not this
card's; the driver contract is.

## Acceptance criteria

- WHEN the delivered entry names a method file it does not carry THE
  entry SHALL say in the same section that the file is not here and what
  the reader does instead, as it already does for the card format and the
  archaeology document.
- WHEN the entry is generated THE generator SHALL derive the set of
  named-but-absent files rather than carry a hand list, so a pointer
  added to a canonical source cannot arrive unanswered.
- IF a named file is absent and unanswered THEN a body SHALL red naming
  that file, with a control that an answered one does not red it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
