---
id: T-333
title: "The seat fixture in the push-guard spec copies one docs file twice onto the same destination and copyFileSync gives that destination the source's mode, so inside any fenced lane the later copy meets its own read-only output and three bodies die in the fixture rather than in their subject: normalise the mode of a fixture root the test owns, and pin it with a body that builds a root from a read-only source tree"
feature: F-04
milestone: 4
size: XS
priority: 2
status: suggested
suggested_by: "the T-331 lane's executor on 2026-09-15, found because that lane's fence carries a workflow path the derivation cannot place, so its scoped reading refused and it ran the full end-to-end leg; the architect seat confirmed the modes across the lane, the bench and the integration checkout before ruling the widening down"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 by the architect seat at T-331's merge. The T-331 lane raised it through the ask file rather than repairing it, because the remedy lies one path outside that lane's fence; the seat declined to widen, and ruled that the lane should file nothing itself, since filing is a write and the gate that write would owe is the full end-to-end leg the lane had just paid twenty-one minutes for. The attribution, the mechanical cause and the demonstration below are the lane's; the mode readings across the three checkouts are the seat's.

## The finding

`seatFixture` in the push-guard spec builds its fixture root by copying the documents twice over. It begins by copying every flat file directly under the docs directory, which creates a destination for the conventions index; it then copies each entry of the conventions chapter list, and the conventions index heads that list, so the same source lands on the same destination twice. `copyFileSync` gives a destination it creates the SOURCE's mode. In the integration checkout the conventions index is mode 644 and the later copy overwrites its own output without complaint. Inside a fenced lane the fence holds every path outside the lane's own fence read-only at mode 444, so the earlier copy creates a read-only destination and the later one raises a permission error writing over it.

Three bodies then die inside the fixture rather than inside the subject they were written to measure: the one asserting that taking the seat installs the guard and announces it and that both seat verbs report a checkout without the hook as unguarded, the one asserting that taking the seat records no seat when the guard cannot be installed and leaves the configuration and the index alone, and the one asserting that a seat acquisition failing for a reason of its own configures nothing. All three report the same permission error at the same helper, and a re-run reproduces them exactly.

The defect has been invisible for two separate reasons at once. It cannot appear in the integration checkout, where the mode is 644. And it cannot appear in a lane that runs a scoped end-to-end reading, because the scoped selection does not carry this spec. A lane sees it only when it runs the full leg, and a lane runs the full leg only when its scoped reading was refused — which is what happened to the lane that found it, whose fence carries a workflow path the derivation cannot place.

Measured on 2026-09-15 by the architect seat, at the T-331 lane tip: the conventions index is mode 444 in the lane, 644 in the integration checkout, and 644 in the verifier's detached bench, which carries no fence at all. So the failure is lane-local; it does not reach a verification bench, an integration checkout, or the runner, and it invalidated no landing.

## What would settle it

A fixture root the test owns is writable by the test whatever the mode of the tree it was copied from. The remedy the finding lane sketched is to normalise the destination's mode after the chapter copies, so that a fixture inherits its own contract rather than the write protection of whichever checkout it happened to be built in. A body pins it: a fixture root built from a source tree whose files are read-only is still a writable root, which is the property, and which fails before the repair.

The wider point is worth stating even though this card does not act on it: a fixture that inherits a fence's write protection is measuring the lane rather than the subject, and any other fixture in this suite that copies from the tree carries the same latent defect. The repair names its class and sweeps for other sites.

## Another spelling, recorded 2026-09-16

The T-330 lane's executor reached this finding independently on 2026-09-15 — the same finding reached independently once more that day — and offered a remedy this card did not carry: `rmSync(dest, { force: true })` immediately before the repeated `copyFileSync`, rather than normalising the destination's mode afterwards.

IT IS A CANDIDATE TECHNIQUE, CARRIED WITH ITS ATTRIBUTION, AND NOT THE BETTER REMEDY. Calling it the better of the two was the seat's overstatement when this section was written on 2026-09-16; it is withdrawn here rather than quietly reworded, because the card recorded a comparison it had not made.

What is true of the executor's spelling: it is mode-independent, so it does not depend on choosing a mode that happens to be right; it keeps the derived chapter list rather than special-casing the file that collides; and it addresses the repeated write onto a destination an earlier write already created rather than the symptom that the destination is read-only.

WHAT IT DOES NOT DO IS REACH THIS CARD'S STATED PROPERTY. `rmSync(dest, { force: true })` can remove a read-only destination while the parent directory is writable, so the second copy stops throwing — but `copyFileSync` carries the SOURCE's mode, and the source inside a fenced lane is the read-only one. The replacement therefore lands read-only again, and a fixture root whose files cannot be written is the defect this card is about. A copy that stops throwing is not yet a writable owned fixture.

The mode-normalising spelling remains the one that reaches the property, because it makes the fixture's own files writable whatever the mode of the tree they came from. Whoever builds this may well want both — the unlink to make the repeated copy legal, the normalisation to make its result writable — and neither is approved here. The criteria below are the test either spelling has to pass.

Neither spelling has been built. The measurements behind the finding are unchanged.

## Acceptance criteria

- WHEN a fixture root is built by copying from a source tree whose files are read-only THE fixture SHALL produce a root the test can write, and the three named seat bodies SHALL pass inside a fenced lane worktree as they pass in the integration checkout.
- WHEN the repair lands THE spec SHALL carry a body that builds a fixture root from a read-only source tree, and that body SHALL assert BOTH that the repeated chapter copy onto one destination completes AND that the resulting file can afterwards be written, and SHALL assert that the source tree is still read-only at the end; it SHALL be shown to fail against the fixture as it stands before the repair.
- WHEN the repair is made THE card SHALL name the class (a fixture inheriting the write protection of the tree it copied from) and SHALL record the sweep for other fixtures in this suite that copy from the tree, or record that none was found.

## Implementation notes

## Verdicts
