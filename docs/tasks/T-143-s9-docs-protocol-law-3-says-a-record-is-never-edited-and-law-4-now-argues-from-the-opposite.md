---
id: T-143-s9
title: "method/docs-protocol.md law 3 says a record is written once and never edited, law 4 now argues that records are append-only and cites law 3 for it, and docs/checkpoints/TEMPLATE.md carries the same contradiction into every record ever written"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-143-s5, phase 2, which found the contradiction newly load-bearing rather than newly made; the ground taken at that lane's base had already flagged it before the diff existed"
blocked_by: []
touches: [method/docs-protocol.md, docs/checkpoints/TEMPLATE.md, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`method/docs-protocol.md` law 3 is headed "Governing documents are
replaced; records are appended" and closes "a record is written once and
never edited". `docs/checkpoints/TEMPLATE.md` repeats the closing half in
its own opening lines — "Append-only: written once, never edited (the
T-101 precedent applies here in full force)" — so the formula reaches
every record from the template they are all copied from.

T-143-s5 moved the staleness derivation to the record's creating commit
precisely so that an AMENDMENT to an already-checkpointed record stops
charging a state-document commit. Its law 4 now reads "Records are
APPEND-ONLY rather than write-once (law 3)". So one law tolerates a thing
the law it cites forbids, and a reader who follows that citation lands on
the sentence that denies it.

The tension is OLDER than that card and is not its doing: the ground
taken at its base recorded it before the diff existed, and the history
shows the practice has always been the amendment — the two instances that
card measured are both records appended to minutes after they were
written, one of them a re-run battery line. What the card changed is that
a law now ARGUES from the append-only reading, which turns a dormant
inconsistency into a live one.

The choice is a method ruling and not a lane's. Either records may be
amended, and law 3's closing clause and the template's line are replaced
by the current sentence plus a citation — which is law 3's own procedure
for a stale sentence — or they may not, and then the amendments in
docs/checkpoints/ are violations and law 4's premise needs a different
argument. Nothing here is a code change; every acceptance criterion below
is about text and about the one body that would keep it true.

## Acceptance criteria

- WHEN `method/docs-protocol.md` law 4 argues from records being appended THE same document's law 3 SHALL agree with it in its own words, so a reader following the citation lands on a sentence that supports it rather than on the sentence that denies it; and where the older wording is replaced, law 3's own procedure SHALL be used — the current sentence plus a citation to the card or record holding the history.
- WHEN a checkpoint record is copied from `docs/checkpoints/TEMPLATE.md` THE template's own account of what may later happen to that record SHALL say the same thing `method/docs-protocol.md` says, so the file every record is born from does not contradict the law that governs it.
- WHEN the two texts say the same thing THE agreement SHALL be pinned by a body in `tools/e2e/tests/docs-input-gate.spec.ts` that reads both files and reds when one carries the retired wording while the other carries the current one, with a planted positive in a scratch copy so that a reader which matched nothing would red too.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
