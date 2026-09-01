---
id: T-227
title: An empty `touches:` expands to a fence that is DISJOINT FROM EVERYTHING and can write NOTHING, and expandFence reports no issue for it — latent today, because every one of the 95 dispatchable cards happens to declare one
status: rejected
suggested_by: "the architect/integrator seat, 2026-09-01 — opened by T-221's blind verifier reporting that sharedDomain is reachable only through compareFences' tokens[] loop; probed read-only at d6fd4ad with positive controls on both halves"
---

**LATENT, AND FILED AT THAT SEVERITY.** Nothing is broken on the board
today. Measured at `d6fd4ad`: **95 planned/building cards, every one of
them declaring a non-empty `touches:`.** This card is about a path that
exists and is currently unreachable, and triage should weigh it as such
rather than as an incident.

## The two halves, each probed with a positive control

`compareFences` iterates `a.tokens × b.tokens`, so a fence whose
`tokens` is empty produces zero witnesses:

    empty fence   tokens: []        paths: []
    EMPTY vs REAL      verdict: disjoint     witnesses: 0
    REAL  vs REAL2     verdict: overlapping  witnesses: 1   <- control

The control matters: the probe demonstrably CAN report an overlap, so
`disjoint` is an answer rather than a silence. **An empty fence is
therefore disjoint from a fence it would fully overlap, and `T-209`'s
dispatch guard would ALLOW the lane.**

The write hook goes the other way, and this is what keeps it harmless:

    domain set []           tools/e2e/x.ts:false  app/src/main.tsx:false
    domain set [tools/e2e]  tools/e2e/x.ts:true   app/src/main.tsx:false

**An empty fence refuses every path.** So the lane would be dispatched,
start cleanly, and be unable to write anything at all.

## What is actually wrong, stated no larger than it is

Not a security hole: the two halves disagree in the SAFE direction, and
a lane that can write nothing cannot collide with anything.

The defect is that **`expandFence` reports no issue and no `unusable`
entry** for a fence that permits nothing — measured, both empty. A card
promoted to `planned` without a `touches:` field gets a lane that
dispatches, passes its guard, and then refuses its executor's first
write with a fence the executor will read back as legitimately empty.
**The diagnosis costs whoever hits it far more than the mistake did**,
which is this project's usual reason for turning a silence into a
refusal.

## Why it is plausible rather than theoretical

TASK-FORMAT rules that a suggestion is a MINIMAL file — `status`,
`title`, context, `suggested_by` — and correctly carries no `touches:`.
Sixteen such cards sit on the board right now. **Promotion is the moment
the field has to be added, and nothing checks that it was.** The same
triage sitting that produced this card promoted four suggestions by
editing one line each; three of those already had the field, and that was
luck rather than a gate.

## What triage should weigh

- Whether `expandFence` should emit an `invalid-field` issue for an empty
  expansion, the way it already does for an unusable token — the
  machinery exists and is not reached.
- Whether the REFUSAL belongs at promotion instead: a card at `planned`
  with no `touches:` is malformed, and the docs gate already reads every
  card's frontmatter and reports issue counts.
- **Whether the two halves should be made to agree explicitly rather than
  by luck.** They disagree safely today; nothing states that they must,
  and a future reader reconciling them could reasonably pick either.

## Read beside

`T-209` (the guard that would allow it), `T-212` (the landing gate, the
third consumer of the same expansion), `T-221` (which pins the separator
in the same function and whose verifier surfaced the `tokens[]` routing
this card rests on), and `T-222` — the closest sibling in KIND: a fence
path the gate ANNOUNCES rather than refuses, which is the same silence in
a different place.

**REJECTED 2026-09-02 — absorbed, not declined**: a second instance of
T-219's class (`expandFence`'s silence), appended there as a dated
corroboration in the same commit as this move; the criterion it asks for
is written on T-219 for its promotion.
