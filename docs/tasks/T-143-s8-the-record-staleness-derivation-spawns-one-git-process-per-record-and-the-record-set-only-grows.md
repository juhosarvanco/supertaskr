---
id: T-143-s8
title: "The record staleness derivation spawns one git process per checkpoint record, and the record set is append-only — three seconds of the docs gate and of every push, growing by one process per checkpoint forever"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-143-s5, measured at that lane's tip while re-deriving the cost of the reading it moved; pre-existing on both sides of that change and outside its criteria, which scope to WHICH commit is read and not to how many processes read it"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts, tools/e2e/tests/push-checks.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`staleStateRecords` reads one commit timestamp per checkpoint record by
shelling `git log` once per file. Measured at T-143-s5's tip over the 89
records then under docs/checkpoints/, three readings of the whole
function: 3022 ms, 3031 ms, 3018 ms. Process startup is nearly all of
it — one pass each over the same 89 records gave 3220 ms for the
latest-touch spelling and 2866 ms for the creating one, so neither
reading is the expensive half.

Three seconds is not a lot. What makes it a card is the SHAPE: checkpoint
records are append-only by ADR-019, so the loop gains one git process at
every checkpoint and never gives one back, and the price is paid by the
docs gate at every merge AND by the push guard's cheap checks at every
push — the checks whose own module header argues that a check a fresh
worktree cannot run is a check that gets skipped.

One `git log` walk over docs/checkpoints/ answers every record in a
single process. The reason to be careful rather than quick about it is
that the per-file reading has a property the walk has to keep: a record
added ONLY IN A MERGE COMMIT has no add-filtered answer at all, because
git does not diff merges, and the derivation falls back to that record's
latest touch rather than going silent. A walk that loses that record
loses it invisibly.

## Acceptance criteria

- WHEN the staleness derivation runs over a checkout THE record timestamps SHALL be read in a number of git invocations that does not grow with the record count, and the answer SHALL be identical to the per-record reading over this checkout's own records and over every fixture arrangement already pinned — the append that passes, the creation without its regeneration that reds, the same-commit tie, and the merge-added record.
- WHEN a record's creating commit is absent from the batched walk THE derivation SHALL still fall back to that record's latest touch rather than dropping it, and a body SHALL show a merge-added record still reported by name after the change.
- WHEN the change lands THE cost SHALL be re-measured at one ref before and after, both readings recorded on the card, so the saving is a figure rather than a claim.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
