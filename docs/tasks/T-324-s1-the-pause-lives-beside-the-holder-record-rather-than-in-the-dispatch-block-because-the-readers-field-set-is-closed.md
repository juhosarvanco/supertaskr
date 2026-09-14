---
id: T-324-s1
title: "The pause lives beside the holder record rather than in the dispatch block: the schema declares no pause row because the parser's reader answers each field by name and would refuse a whole block carrying one, so the owner's stop is a runtime record the block never mentions"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-324, ruled with the architect seat in that lane's ask file on 2026-09-14; the shape is accepted for T-324 and this card is the move the ruling asked to be filed rather than left to omission"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts, method/runtime/process-schema.yaml, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-319's declaration of the dispatch block says, in its own effect line,
that a grant, a PAUSE or a revocation is a dated edit to the block that
appends the previous grant to its history and raises the revision. The
block carries a grant and a revocation. It carries no pause.

The reason is mechanical rather than an oversight. The reader answers
every field it knows BY NAME, and it refuses a key the declaration does
not carry — so a `pause:` row added to the declaration today would parse
and then be dropped: the typed value the reader returns has no place to
put it, and every surface that renders the block would show a control
nothing reads. T-324's own criterion about the optional limits forbids
exactly that shape, in as many words, so T-324 could not put the pause
there and be consistent with itself.

What T-324 built instead is a record in the runtime directory beside
T-238's holder record: a dated, scoped, owner-written document, read by
ONE reader in the dispatch arm, refusing rather than reading as silence
when it cannot be parsed. That is a working shape and the conventions
document it. What it is not is what T-319's own sentence describes, and
the two should agree.

## Acceptance criteria

- WHEN the schema declares a pause THE declaration SHALL carry it as rows of the dispatch block with the same closed attributes every other row answers, and the reader SHALL return it as part of the one typed value it already returns, so that a block carrying a pause is read whole rather than refused or half-read.
- WHEN the block carries no pause THE reader SHALL answer the explicit no-pause state exactly as it answers the no-grant one, from the declaration's own absent values rather than from a reader that invents them.
- WHEN a pause is recorded in the block THE revision SHALL rise and the previous grant SHALL be appended to the history, which is the sentence the declaration already makes and nothing keeps.
- WHEN the move lands THE conventions SHALL say where a pause lives in one place rather than two, and the record beside the holder SHALL either be retired or be documented as what a project with no block uses, so that no reader has to work out which of two shapes is current.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
