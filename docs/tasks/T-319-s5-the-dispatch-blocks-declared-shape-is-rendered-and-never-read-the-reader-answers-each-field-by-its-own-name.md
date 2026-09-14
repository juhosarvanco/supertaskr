---
id: T-319-s5
title: "The dispatch block's declared `shape:` is rendered and never read: the reader answers each field by its own name, so the shape the schema declares and the check the reader runs can disagree without a word, and a row added to the declaration is required present and then dropped"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-319 phase 2, measured on the bench at the lane's tip; the gap is inside that card's fence but the repair is a change of shape rather than a correction to what it built"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts, method/runtime/process-schema.yaml]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-319 declares the dispatch block once in the process schema and reads it
against that declaration. Most of the declaration really is the source:
the field set drives the unknown-key refusal at every depth, the mode
rows' `values` drive the mode refusal, their `absent` drives the explicit
no-grant state, and `required` drives which fields a block owes. The
card's own parser fixture proves it by declaring words no shipped file
says, and a reader carrying the words itself reds there.

The `shape:` attribute is the exception, and nothing says so. The reader
answers each field by its own name — `grant.at` through an instant check,
`grant.revision` through a positive-integer check, `grant.cards` through a
blob-sha check — and the row's declared shape reaches only the refusal
sentence and the generated reference page. Measured on the verifier's
bench at the lane's tip: with `grant.at` declared `shape: text` instead of
`shape: instant`, a block writing `at: "yesterday"` was still refused as
not an ISO instant. The declaration moved and the reading did not.

The same seam has a sharper edge. A row ADDED to the declaration is
half-read: with `grant.note` declared `required: with-parent, shape:
text`, a grant that omits `note:` was refused by name, and a grant that
carried `note: 12345` was read — with `note` validated by nothing and
absent from the value the reader answers. So the declaration can make the
reader DEMAND a field it will then drop, which is the one outcome a
declaration should not be able to produce.

Nothing reds in either case, because no body changes a shape and expects
the reading to move. The schema's own prose reads "`shape` — what the
value must BE", which is what a maintainer would act on.

This is not a defect in what that card was asked for: its criterion names
a fixed field set, and every field in it is checked correctly today. It
is the seam that opens the moment the block gains a field, which the
admission card and anything after it will do.

## Acceptance criteria

- WHEN the reader checks a field's value THE check SHALL be chosen by the row's declared `shape` rather than by the field's own id, so that a shape edited in method/runtime/process-schema.yaml changes what the reader accepts, pinned by a body that edits one row's shape and requires the reading to move, and by a body that leaves the shipped shapes alone and requires every refusal the card already names to stand.
- WHEN the declaration carries a row the reader has no name of its own for THE reader SHALL answer that row's value under its declared shape, and SHALL NEVER require a field it then drops from the value it answers, pinned by a body that adds a row to a fixture declaration and requires the value to carry it.
- WHEN the schema describes the `shape` attribute THE sentence SHALL say what the attribute governs, so that a maintainer editing a shape knows whether the reading moves with it.

## Implementation notes

## Verdicts
