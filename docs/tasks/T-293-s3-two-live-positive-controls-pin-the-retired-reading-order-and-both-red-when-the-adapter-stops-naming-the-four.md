---
id: T-293-s3
title: "Two live positive controls pin the RETIRED reading order — one in the rust suite, one in the e2e suite — and both red the moment the root adapter stops naming the four governing documents; the repair is to re-point each at the property T-293 leaves behind"
feature: F-01
milestone: 4
size: S
priority: 1
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-293, measured at cbdafa4e9d9853291eacf9d9bd39134cf4204a76 with T-293's tree"
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Row 3 of the dispatch brief hands a seat a READ-FIRST SET derived by
collecting every `docs/<NAME>.md` the root adapter names ANYWHERE in its
text, then subtracting whatever the acting role file says it does not
read. Three bodies assert, as their POSITIVE CONTROL, that the live root
adapter really does name the document the role file subtracts — because
"the subtracted document is absent from the applied set" is satisfied
equally by a working subtraction and by an adapter that never named it.

T-293 retires the five-document reading order: the adapter now names
docs/STATE.md, docs/INDEX.md and docs/NORTH_STAR.md, and NOTHING else,
because a governing document's path in that file is that document back
in every seat's standing read whatever the sentence around it says. The
controls therefore lose their subject — correctly, and by the card.

Measured on T-293's tree, `npm test` from tools/e2e/:

    2 failed, 84 passed — tests/brief.spec.ts
      ROW 3 APPLIES the role file's reading step, and still shows what
      the adapter itself named
      the subtraction and the addition FOLLOW the role file — no clause
      leaves the adapter's list unchanged

and in the rust suite, `app/src-tauri/src/dispatch/brief.rs`:

    row_three_applies_the_role_files_reading_step_rather_than_printing_it_beside_the_list

whose control reads *"the positive control: the adapter really does name
ROADMAP"*.

**NOTHING ABOUT ROW 3 IS BROKEN.** The tool still reads the adapter,
still applies the role file's step, and still prints both halves; what
changed is the DOCUMENT it reads. Each of the three files already holds
a sibling body that proves the same machinery against SYNTHETIC text —
`the_subtraction_and_addition_are_derived_from_the_role_file_and_are_not_vacuous`
in the rust file, and the plain-role-file arm in the spec — so the
repair is to give the live-adapter control a subject that survives:
assert the adapter names docs/INDEX.md, that the applied set carries it,
and that a role file subtracting a document the adapter DOES name still
removes it, with the adapter text supplied by the body.

## Acceptance criteria

- WHEN the root adapter names only the standing read THE three bodies
  SHALL still hold a positive control, and it SHALL be one the card that
  retired the reading order cannot make vacuous again.
- WHEN a role file's subtraction sentence is removed THE applied set
  SHALL still be shown to change — the property the plain-role-file arm
  exists for — against adapter text the body controls.
- Neither suite SHALL lose a body: three re-pointed, none deleted.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
