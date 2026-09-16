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

**CORRECTED 2026-09-17, AND THE ORIGINAL READING IS SET OUT BELOW RATHER THAN DELETED.** This card was filed saying the seat had confirmed each half against the arm. Two of its statements did not survive a second check, and both are corrected in place here.

**The admission reads the order for membership, and the parser reads BOTH structures against each other.** The admission asks whether the card is in the order. The card map is consulted for drift since approval. And the parser's own grant reader — `readGrant` in the parser library's process-settings module — computes the ids the order names that the map does not carry AND the ids the map carries that the order does not name, and refuses when either set is non-empty. Its refusal already gives the reasoning: a card in one and not the other is either an approval with no revision or a revision nobody approved. Its unit suite covers both directions in one body.

One consequence follows, and it is the one that matters.

**A CARD ADDED TO BOTH HALVES IS ADMITTED, AND NOTHING NOTICES.** Put an id into the order and its current blob into the map, and the admission passes on membership while the drift check passes on a blob that matches because it was taken from the card as it now stands. The entry is internally consistent and the widening is invisible. THE TWO-WAY CHECK CANNOT REACH IT, because an entry present in both structures disagrees with nothing — the check catches a card in one and not the other, which is a different defect and one this tree already refuses. What no check reaches is an entry that is well-formed and was never approved.

**AND THE BLOCK ATTESTS ONLY TO ITSELF.** It records `given_by` and `at` — who approved it and when — as prose. The arm DOES reference them: the succession reader that tells a fresh seat what grant it inherits renders both into the line the seat reads, and the seat saw that line printed on 2026-09-16 while taking the seat. **The defect is that neither value is independently authenticated — not that nothing references them.** So the reader validates that a grant is internally well-formed and says nothing about whether the owner ever gave it. A block edited after approval, or written from whole cloth, passes exactly the check an approved one passes.

**WHAT THIS IS NOT.** It is not a claim that anyone has done either, and it is not an external-attacker story: writing the template already requires a fence that carries it, which is the seat's to grant. The property that is missing is AUDITABILITY. Nothing in the mechanism can tell an approved grant from a modified one, so an accidental widening — a card added while editing, a revision bumped without a ruling — is indistinguishable from the real thing, by any reader, including the seat that made it.

**BOTH HALVES WERE REACHED TWICE, INDEPENDENTLY.** T-330's phase-one attack set named them before any implementation existed and without tools, as A3.9 ("the criterion names a card missing from the map but not an extra card… an added entry silently widens authority and an iterate-the-template check can never see it") and A3.10 ("a check that validates whatever is there against its own recorded blobs authenticates a forgery as happily as the real thing"). Its phase two reached the same two with the diff in front of it. Two passes from opposite directions is the strongest evidence this method produces.

## What would settle it

The two-directional read of the order against the card map ALREADY EXISTS and is kept as a regression control rather than built again. What this card adds sits beyond it: an entry consistent in both structures that was never approved is refused, rather than admitted on internal consistency.

The block is bound to something outside itself. What that something is belongs to preparation rather than to this card: the approval's own record, a reference the owner's ruling carries, or a signature over the block — each has different costs and a different failure when the binding is absent, and choosing among them on evidence is part of the work. What the card requires is that the reader can say WHETHER a block is the one that was approved, and that it refuses rather than assumes when it cannot.

WHICH GUARANTEE THIS CARD PROMISES, SAID PLAINLY, because the smallest adequate mechanism follows from it and a card that leaves it open invites the wrong one. THIS CARD PROMISES AUDITABILITY AND DRIFT DETECTION. It does not promise prevention: an agent with write access to the template can alter the grant, and nothing this card proposes stops it. What the card buys is that the alteration cannot pass unnoticed as an approved grant — the accidental widening while editing, the revision bumped without a ruling, the block inherited by a fresh seat with no way to check it.

AND “OUTSIDE ITSELF” HAS TO MEAN OUTSIDE. A second field inside the same editable block — a hash of the grant written beside the grant, an `approved: true`, a countersignature the same hand can write — adds a step to an alteration and adds no authority to the check, because whoever can edit the `order` can edit the attestation in the same write. The binding has to rest on something the editing hand does not also control: a record kept outside the template, a reference the owner's own ruling carries, or a signature whose key is not in the tree. Landing the cheap version and calling the property established would leave the board WORSE than it stands today, because an unauditable grant would then look audited.

Where the binding cannot be established the answer is an explicit unknown that does not confer admission, not a pass. An unverifiable grant is closer to no grant than to an approved one.

The current checks stay until their replacement is shown to catch what they catch: the drift check earns its place and is not dropped in the course of adding these.

## How this stands with T-344, recorded 2026-09-16

T-344 was filed the same day on the owner's requirement that a routine
grant revision cost no suites, commits, pushes or CI. It moves the active
grant out of the shipped runtime template into one authoritative
operational store at one designated integration checkout. THE TWO CARDS
SHARE ONE CONTRACT AND MUST NOT BECOME TWO DESIGNS.

T-344 owns WHERE the grant lives and HOW it is updated. THIS CARD OWNS
WHAT IS CHECKED: the order and the card map read against each other in
both directions, and the block bound to something outside itself.

That move helps this card without discharging it. The store gains a
retained revision chain and a designated home, both of which a reader can
check, and its update path validates before it writes. None of that makes
the block unforgeable: an agent with write access to the store can still
write it, which is why this card promises auditability and drift
detection rather than prevention.

WHAT IT CHANGES HERE: at promotion this card is read against the store
T-344 builds rather than against the template's dispatch block. The
criteria below are unchanged by that — they are about what the reader
must compare and refuse, not about which file it opens. If T-344 has not
landed when this card is promoted, the two are sequenced rather than
merged, and this card's reader targets whichever home is then current.

## Acceptance criteria

- WHEN the grant is read THE existing refusal of an order and a card map that disagree in either direction SHALL still hold, and a body SHALL demonstrate it still does; this card ADDS nothing here and SHALL NOT claim the property as its own.
- WHEN a card is present in both the order and the map but was not part of the approval THE reader SHALL NOT admit it on internal consistency alone, and SHALL report that it cannot establish the entry's approval.
- WHEN the record cannot be bound to the approval it claims THE reader SHALL report an explicit unknown, and that unknown SHALL confer no admission; THE card SHALL distinguish three things that are not interchangeable — the project's identity, the authorized store location, and the approval evidence — and SHALL NOT treat a different checkout as automatically a different project.
- WHEN the binding is established THE reader SHALL say what it was established against, so a later seat can check the claim rather than inherit it.
- WHEN the binding is implemented THE thing bound against SHALL be a concrete trusted approval reference chosen before dispatch, and a second file inside the editing session's reach SHALL NOT be accepted as that reference merely for being a different file; the card's verdict SHALL state which of drift detection and prevention the built mechanism reaches, and SHALL NOT claim prevention against a hand that can write the store.
- WHEN this card is built THE existing drift check SHALL still refuse a blob stale beyond the admission's mechanical drift, and a body SHALL demonstrate it still does.
- WHEN this card is verified THE bodies SHALL plant, as the CORE case, a record in the correct project and the designated store whose cards are internally consistent and which carries no matching owner approval, and SHALL plant beside it an entry added to both structures, a record whose binding names a different authorized location, and a record carrying no binding at all; each SHALL be demonstrated to red against a reader lacking the property, and the peripheral cases SHALL NOT be offered in place of the core one.

## Implementation notes

## Verdicts
