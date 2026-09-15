---
id: T-339
title: "The dispatch grant admits a card by its membership in the order and validates the block against nothing but itself, so a card added to both halves widens authority with nothing to notice and a revision nobody approved passes its own check: read the map against the order in both directions, and bind the block to the approval it claims"
feature: F-04
milestone: 4
size: M
priority: 1
status: suggested
suggested_by: "the T-330 verifier bench and the T-330 phase-one attack set on 2026-09-15, which reached both halves independently — the bench with the diff in front of it, phase one blind and before any work existed, as its attacks A3.9 and A3.10; the architect seat confirmed each against the arm before filing"
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 by the architect seat at T-330's merge. NEITHER HALF IS A FINDING AGAINST THAT LANE: both are properties of the arm as it already stood, both lie outside that card's fence, and its verifier recorded them explicitly as not grounds to reject. They are filed separately so they are not rediscovered later out of a verdict.

WHAT MAKES THIS WORTH PRIORITY 1 RATHER THAN A NOTE. The owner's approved dispatch grant lands with T-330's merge. Until that moment the tree is the explicit no-grant state and neither half of this can bite. From that moment the block is the datum a fresh seat inherits its authorization from, and these are properties of the thing doing the authorizing.

THE FENCE IS EMPTY ON PURPOSE. The admission and the grant reader both live in the dispatch arm, which is the most contended file on this board — it is imported by eleven spec files and its lifecycle bodies live in a spec that most live cards touch. Establish the owning files and a supported route at promotion and write the fence then, rather than inheriting a guess from this draft. Preflight then too; none has been run against this card.

## The finding

The grant block carries two structures that describe the same set: `order`, a list of the cards the owner approved for dispatch, and `cards`, a map from each of those ids to the blob its card had at the approval ref.

**The admission reads one of them.** It asks whether the card is in the order. The map is consulted to check that a card has not drifted since approval — which is a real and useful check, and it is the only thing the map is read for.

Two consequences follow, and the seat confirmed each against the arm before filing.

**A CARD ADDED TO BOTH HALVES IS ADMITTED, AND NOTHING NOTICES.** Put an id into the order and its current blob into the map, and the admission passes on membership while the drift check passes on a blob that matches because it was taken from the card as it now stands. The entry is internally consistent and the widening is invisible. The check is one-directional: it reads the order into the map and never the map back into the order, and neither direction is compared against anything outside the block.

**AND THE BLOCK ATTESTS ONLY TO ITSELF.** It records `given_by` and `at` — who approved it and when — as prose. The arm references neither: a search for those fields across the dispatch arm returns nothing. So the reader validates that a grant is internally well-formed and says nothing about whether the owner ever gave it. A block edited after approval, or written from whole cloth, passes exactly the check an approved one passes.

**WHAT THIS IS NOT.** It is not a claim that anyone has done either, and it is not an external-attacker story: writing the template already requires a fence that carries it, which is the seat's to grant. The property that is missing is AUDITABILITY. Nothing in the mechanism can tell an approved grant from a modified one, so an accidental widening — a card added while editing, a revision bumped without a ruling — is indistinguishable from the real thing, by any reader, including the seat that made it.

**BOTH HALVES WERE REACHED TWICE, INDEPENDENTLY.** T-330's phase-one attack set named them before any implementation existed and without tools, as A3.9 ("the criterion names a card missing from the map but not an extra card… an added entry silently widens authority and an iterate-the-template check can never see it") and A3.10 ("a check that validates whatever is there against its own recorded blobs authenticates a forgery as happily as the real thing"). Its phase two reached the same two with the diff in front of it. Two passes from opposite directions is the strongest evidence this method produces.

## What would settle it

The two structures are read against each other in both directions, so that a card in the map that the order does not name, and a card in the order the map does not pin, are each refused by name rather than passing on the direction that happens to be checked.

The block is bound to something outside itself. What that something is belongs to preparation rather than to this card: the approval's own record, a reference the owner's ruling carries, or a signature over the block — each has different costs and a different failure when the binding is absent, and choosing among them on evidence is part of the work. What the card requires is that the reader can say WHETHER a block is the one that was approved, and that it refuses rather than assumes when it cannot.

WHICH GUARANTEE THIS CARD PROMISES, SAID PLAINLY, because the smallest adequate mechanism follows from it and a card that leaves it open invites the wrong one. THIS CARD PROMISES AUDITABILITY AND DRIFT DETECTION. It does not promise prevention: an agent with write access to the template can alter the grant, and nothing this card proposes stops it. What the card buys is that the alteration cannot pass unnoticed as an approved grant — the accidental widening while editing, the revision bumped without a ruling, the block inherited by a fresh seat with no way to check it.

AND “OUTSIDE ITSELF” HAS TO MEAN OUTSIDE. A second field inside the same editable block — a hash of the grant written beside the grant, an `approved: true`, a countersignature the same hand can write — adds a step to an alteration and adds no authority to the check, because whoever can edit the `order` can edit the attestation in the same write. The binding has to rest on something the editing hand does not also control: a record kept outside the template, a reference the owner's own ruling carries, or a signature whose key is not in the tree. Landing the cheap version and calling the property established would leave the board WORSE than it stands today, because an unauditable grant would then look audited.

Where the binding cannot be established the answer is an explicit unknown that does not confer admission, not a pass. An unverifiable grant is closer to no grant than to an approved one.

The current checks stay until their replacement is shown to catch what they catch: the drift check earns its place and is not dropped in the course of adding these.

## Acceptance criteria

- WHEN the grant is read THE reader SHALL compare the order and the card map in both directions, and SHALL refuse by name both a card the map pins that the order does not name and a card the order names that the map does not pin.
- WHEN a card is present in both the order and the map but was not part of the approval THE reader SHALL NOT admit it on internal consistency alone, and SHALL report that it cannot establish the entry's approval.
- WHEN the block cannot be bound to the approval it claims THE reader SHALL report an explicit unknown, and that unknown SHALL confer no admission.
- WHEN the binding is established THE reader SHALL say what it was established against, so a later seat can check the claim rather than inherit it.
- WHEN the binding is implemented THE thing bound against SHALL lie outside the block's own editable extent, and a field added inside the grant SHALL NOT be accepted as the binding; the card's verdict SHALL state which of drift detection and prevention the built mechanism reaches, and SHALL NOT claim prevention against a hand that can write the template.
- WHEN this card is built THE existing drift check SHALL still refuse a blob stale beyond the admission's mechanical drift, and a body SHALL demonstrate it still does.
- WHEN this card is verified THE bodies SHALL plant an added entry in both structures, an entry in one structure only in each direction, and an unbindable block, and each SHALL be demonstrated to red against a reader lacking the property.

## Implementation notes

## Verdicts
