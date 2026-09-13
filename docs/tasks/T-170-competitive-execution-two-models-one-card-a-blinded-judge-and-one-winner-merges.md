---
id: T-170
title: Competitive execution — two or more assigned models build the same card in sibling lanes, a blinded comparative judge applies the card's own criteria, and exactly one winner merges
status: parked
wake: T-274
suggested_by: "@human (2026-08-30): do we have the feature where different models execute the same task and an evaluator chooses the better result and merges it? — carded at @human's yes"
---

**A planning hook, the T-165/T-166 pattern, carrying the design
sketch so the sitting starts warm.** The feature is charter entry 21
(Ring 3 of Beyond the Playbook); nothing on the board, in the rooms,
or in the playbook plans it today — checked 2026-08-30.

## The design sketch (assessed 2026-08-30, integration seat)

Everything hard already exists but one thing:

- **Isolation is free**: N competing lanes are N worktrees cut from
  one checkpoint, same card, different `builder:` assignments — and
  D5's ruling composes cleanly (@human assigns SEVERAL models
  deliberately; each assignment binds its lane).
- **The judge is nearly built**: the verifier seat's two-phase
  blindness becomes comparative judging — the attack set derived from
  the card's criteria ALONE, then applied identically to every
  contender; the verdict names a winner with the comparison on the
  record. The judge must be blind to WHICH model built WHICH lane
  until its rubric is written, or the comparison inherits brand
  prejudice — the blindness rule's natural extension.
- **The one real design change is the fence**: two lanes sharing one
  fence is exactly what dispatch REFUSES today. Competition mode
  needs a DECLARED exception — sibling lanes sharing a fence on
  purpose, legal because at most one merges. Whether that is a card
  field (`competition: N`), a dispatch flag, or a lane-manifest
  sibling list is the sitting's first question; IF it needs a policy
  ruling beyond mechanics THEN open a room then (none exists yet, on
  purpose).
- **The economics layer names the trigger**: the KNOW/TRY derivation
  already identifies uncertain cards; TRY cards are where 2–3× build
  cost beats one attempt plus rework. The losers are not waste —
  where contenders DIVERGE is a finding about the card's ambiguity,
  filed as suggestion cards by the judge.

RESURFACES: F-04's spawn path lands its first worked example (the
T-165 trigger — automated competition needs nputer launching agents),
OR @human prioritizes it earlier by hand — a hand-driven competition
(the integrator cutting two lanes and judging) is legal TODAY under
the current method and would be this card's best pre-decomposition
measurement. Decomposes at its own sitting; the fence-exception
question is that sitting's opener.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-274; the model experiment is the cheaper first cut at the same question and runs before any seat rule changes.
