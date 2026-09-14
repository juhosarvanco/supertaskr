---
id: T-295-s1
title: "The wide re-drill scope is priced and unwired — 9.6 minutes and 443 bodies for ONE block over thirteen specs against a five-minute ritual, so `--drill-wide` exists and nothing chooses it; the tier classifier should, with guarded taking the stronger RED ALONE claim and standard taking the block's own spec"
feature: F-04
milestone: 4
size: S
priority: 2
status: parked
wake: T-284
suggested_by: "the T-295 executor, 2026-09-10, measuring its own fixture: one correction to one script under tools/e2e was owned by 13 e2e spec files, and that block's drill ran 443 bodies in 9.6 minutes"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, docs/CONVENTIONS.md, docs/conventions/merging.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

T-295 built `drillScope`, which asks the owning-spec rule which specs own
the files a merge's corrections wrote. Running that set is the stronger
reading of "the named body RED ALONE" — it is a claim about every body
the corrected source can reach rather than about whatever the block's own
spec happens to hold. It was built as the default, run on the card's own
fixture clone, and priced: thirteen spec files, 443 bodies, 9.6 minutes,
for ONE block. A verdict carrying three blocks would be half an hour, and
ADR-024's whole point is a merge of about five minutes.

So the default became the block's own spec, with the owning set derived
and READ (a block whose spec is not among the owners is pinning a
property the correction did not move, which is now said), and
`--drill-wide` takes the wide run. Nothing chooses that flag. A dial a
seat has to remember is the dial this whole arm exists to remove.

## Acceptance criteria

- WHEN the merge verb runs on a card the tier classifier calls guarded
  THE re-drill SHALL take the wide scope without the seat naming a flag;
  WHEN the tier is standard or bounded THE re-drill SHALL take the
  block's own spec, and the transcript SHALL say which reading it took.
- WHEN the wide scope runs THE elapsed time and body count per block
  SHALL be printed, so the next reading of this price is derived rather
  than remembered.
- WHEN a block's spec is not among the specs the fix diff owns THE
  transcript SHALL say so under both readings, since that is the cheap
  half and it costs nothing.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the wide re-drill scope is priced and unwired; the tier classifier is what should choose it.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/merging.md, docs/conventions/shell-and-scripts.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
