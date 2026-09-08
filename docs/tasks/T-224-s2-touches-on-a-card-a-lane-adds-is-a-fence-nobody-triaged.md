---
id: T-224-s2
title: "`touches:` on a card a lane ADDS is a fence nobody triaged — the landing gate's amendment arm has no base line to compare it against, by construction"
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-224's lane, 2026-09-08 — disclosed as limit 5(a) in landing-gate.mjs and driven by that spec's "a card the range ADDS or DELETES is not an amendment"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`T-224`'s arm compares a card's `touches:` line at the range's base
against its tip. A card the range ADDED has no line at the base, so
there is nothing to have moved — and that is not a bug to fix in place:
it is how a lane files a suggestion at all, which is the ordinary,
universal case the whole arm is written not to refuse.

## What it leaves

A lane may commit a NEW card carrying any `touches:` it likes, and that
card lands. It fences no LIVE lane — a lane's card exists on the
integration branch before its branch is cut, so no live lane's fence is
read from a card a sibling invented — and dispatching from it is
triage's act, with `--write-fence`'s own overlap refusal in front of it.
So the reachable damage is not a widening; it is a card whose `touches:`
was written by the lane that wanted the paths rather than by the seat
that grants them, sitting on the board looking exactly like a triaged
one.

## What to build, and the argument against building it

The cheap version is a rule that a card ADDED by a lane must carry
`status: suggested` — which is already the executor's own protocol
(`method/roles/executor.md` step 5) and would make the gate enforce a
convention it currently only benefits from. **Weigh it against the cost
of being wrong**: a lane legitimately files parked and rejected cards
too, and a gate that refused the wrong one stops a lane on the one write
`method/lane-protocol.md` rule 5 exists to keep performable. State the
answer either way — the disclosure in `landing-gate.mjs`'s limit 5(a) is
what this card upgrades or ratifies, and ratifying it in writing is a
legitimate outcome.
