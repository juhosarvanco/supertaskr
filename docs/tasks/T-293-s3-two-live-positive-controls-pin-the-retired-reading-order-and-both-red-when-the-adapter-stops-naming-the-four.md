---
id: T-293-s3
title: "Two live positive controls pin the RETIRED reading order — one in the rust suite, one in the e2e suite — and both red the moment the root adapter stops naming the four governing documents; the repair is to re-point each at the property T-293 leaves behind"
feature: F-01
milestone: 4
size: S
priority: 1
status: parked
wake: T-292
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

**DISCHARGED IN T-293'S OWN LANE, AFTER THE STAMP AND BY A GRANTED
WIDENING.** This card was filed because both files were outside T-293's
fence. The seat then granted the second ask, option 1 — the fence gained
`app/src-tauri/src/dispatch/brief.rs` and `tools/e2e/tests/brief.spec.ts`
— and the lane performed the repair on branch
`task/T-293-the-standing-read`. **THE STATUS STAYS `suggested`**:
`method/tasks/TASK-FORMAT.md` rules that a discharged finding keeps it
and records the discharge in its own body, naming the commit that did
it, and that disposing of the card is triage's move and not a lane's.
This section is that record; the commit is named in the line below,
which the same lane's stamp commit appends.

**THE COMMIT THAT DID IT: `37964699` on `task/T-293-the-standing-read`**,
whose own battery — parser, app, rust and e2e, graded once at that ref
through this project's blessed runner — is GREEN on all four legs, the
e2e leg scoped to the six specs the fix's own paths own.

Against the three acceptance criteria above:

- **A control the retiring card cannot make vacuous again — MET.** The
  rust body's arm one now reads the live adapter for `docs/INDEX.md`,
  which is what the standing read IS after this card, and asserts the
  four retired documents are absent from the APPLIED set — the card's
  own property rather than a fact about a document it removed. The e2e
  control is DERIVED and names no document: it asks that the adapter
  name at least one document this role file leaves alone.
- **The applied set still shown to change against adapter text the body
  controls — MET.** The rust arm two overlays the adapter through the
  module's own `OverlayFiles` source. The e2e pair cannot overlay an
  adapter — the JS deriver reads the root adapters off the checkout and
  takes no injection point, and that file is outside the widened fence —
  so the same property is measured from the other side: the ROLE FILE is
  rewritten in memory to subtract a document the adapter really names,
  the document leaves the applied set, and it comes back when the clause
  goes.
- **Neither suite loses a body — MET.** Three bodies re-pointed, none
  deleted, no test name moved; both e2e names are pinned verbatim in
  `docs/CAPABILITIES.md` and stand unchanged.

**WHAT IS LEFT FOR TRIAGE.** Only the disposition. One thing worth
carrying into it: the JS mirror has no seam for adapter text, so its two
bodies prove the subtraction from the role-file side only. Giving
`deriveReadFirst` the injection point its rust twin already has is a
separate card in a separate fence, and nothing in this one needs it.

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; two positive controls pin the retired reading order; whether they still do needs a body-level read of the split specs.
