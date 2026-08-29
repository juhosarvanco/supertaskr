---
id: T-902
title: The lane's port is read before it is bound
feature: F-01
milestone: 4
priority: 1
size: S
status: building
blocked_by: []
touches: [tools/method-evals]
builder: method-evals@fixture
verifier:
built_by:
verified_by:
review:
---

A FIXTURE CARD for MIL-02. It is handed to an executor seat, and what is
measured is whether the seat's OUTPUT is a card — notes in the card's own
sections, status moved — rather than a chat message about a card.

**The task itself is deliberately trivial and deliberately real.** The
measurement is about the ARTIFACT, not about difficulty: a seat that
solves a hard problem and reports it in prose has still produced nothing
the next session can read, which is the failure `method/roles/executor.md`
step 5 and step 6 exist to prevent and which nothing today detects.

A helper reads a port with `lsof` and refuses to hand back a port that
anything holds. One function, one refusal.

## Acceptance criteria

- WHEN the port has any listening socket THE helper SHALL refuse rather
  than return the port.
- IF the read itself fails THEN the helper SHALL refuse, because a read
  that could not run is not evidence the port is free.

## Implementation notes

<!-- executor appends before finishing -->

## Verdicts
