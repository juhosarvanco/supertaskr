---
id: T-341
title: "The dispatch ritual runs its most expensive step before the classification that in almost every case does not need it, and reports nothing while it runs: compute the tier ahead of it and say whether it is already fixed or needs keeper evidence, name every refusal before a stamp or a worktree exists, and make each phase report its scope, its elapsed time and where its output is — with the baseline run and its admission outcomes unchanged in this slice"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the Codex architect's lean-dispatch proposal of the same day; the seat confirmed the step order, the classifier's inputs and the synchronous child against the tree before drafting, and measured the overlap the proposal asked it to check"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/conventions/dispatch-and-scratch.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The dispatch ritual's published step order runs the keeper before the tier. The keeper is the most expensive step there is: it runs the end-to-end specs that own the fence at the base, before any worktree, stamp or executor exists.

For almost every card the tier does not depend on that answer. The classifier settles guarded from a guard-class path in the fence or from size L, and settles standard from any size that is not XS, all without consulting the keeper at all. Only one case reaches for it: size XS with no guard-class path, where whether a keeper already pins what the card changes is what separates bounded from standard.

Measured on this project on 2026-09-15: a guarded card whose fence carried a widely-read conventions chapter spent about twenty minutes in that step, running twenty-one owning specs, and its tier had been decided by a guard-class path in its fence before the keeper could contribute anything. Another card dispatched the same day refused its scoped reading immediately, because the derivation could not place the workflow path in its fence, and took seconds. Neither figure is a property of the ritual in general; both are properties of those fences.

The runtime setting that names this step declares a cost band of one to three minutes. The measured twenty is outside that band by most of an order of magnitude, and nothing in the ritual notices or says so.

While that step runs the command says nothing at all. It writes its whole answer at the end, so a seat watching a dispatch cannot tell a twenty-minute keeper from a hang, cannot see which specs were selected or why, and cannot find the output. That is not a hypothetical: it is how the step was discovered.

THE KEEPER HAS ANOTHER PURPOSE, IT IS NOT THE TIER, AND IT DOES NOT GO AWAY. It also refuses a graded red baseline before a lane is cut. Reordering the steps does not remove that purpose and must not weaken it.

## What would settle it

The tier is computed ahead of the keeper and reported as either already fixed, with the input that fixed it, or as needing keeper evidence. The keeper still runs where the baseline is owed, and its selected scope, its purpose and where its output can be read are reported before it starts rather than after it ends. Each phase reports its identity, its outcome and its elapsed time, and a reader can tell an expensive step in progress from a stopped one.

Every refusal the arm can reach cheaply — admission, blockers, contention, an unresolvable fence, a card with no size — is named before anything is stamped, cut or spawned.

THE ADMISSION OUTCOMES ARE PRESERVED EXACTLY AS THEY ARE. Graded-green, graded-red and nothing-was-graded stay three distinct results with the meanings they have today; an unanswered keeper still confers no bounded eligibility; a refusal, an error or an interruption still becomes none of them. This card changes when the classification is computed and what the arm says while it works. It does not change what any result permits, and it drops no check. Any proposal to change unmeasured-baseline admission is a separate card and a separate decision.

WHAT THIS CARD IS EXPECTED TO SAVE, AND WHAT IT IS NOT. Where the tier is already fixed and the baseline is still owed, the keeper still runs and the wall time is unchanged: what is bought is that the seat can see what is happening, and that a cheap refusal no longer waits behind an expensive step. The reduction in the keeper's own cost belongs to the card that makes those bodies cheap, not to this one. No figure is claimed here in advance; the card reports what it measures.

## Acceptance criteria

- WHEN a dispatch is requested THE arm SHALL compute the tier before running the keeper, and SHALL report it either as already determined, naming the input that determined it, or as needing keeper evidence; and it SHALL stamp only the finally derived tier.
- WHEN a refusal is reachable from the card, the board and the tree alone THE arm SHALL name it before the keeper runs and before any stamp, worktree, fence or child exists.
- WHEN the keeper is required THE arm SHALL report its selected scope and the purpose it serves before execution begins, and SHALL report where its output can be read without waiting for the dispatch to finish.
- WHEN a phase begins or ends THE arm SHALL record its identity, its outcome and its elapsed time, and SHALL report whether a worktree and a child exist, so that a step in progress is distinguishable from a stopped one.
- WHEN the keeper is still running THE phase report for the phase in progress SHALL have already REACHED the reader, and a body SHALL demonstrate it — reading the emission while the keeper's child is alive, not after the call returns. `runDispatchLane` today returns a result that `brief.mjs` renders once it is complete, so moving a line inside that final renderer does not satisfy this and SHALL be shown not to: an output callback or a supported stream is the shape that can, and which one is chosen is the card's to demonstrate rather than to assert.
- WHEN this card is built THE FIRST test written SHALL establish the real input path — that the fixture consumes the COMMITTED configuration it is meant to and that the dispatch plans against the intended root — before any expensive battery is asked to provide coverage, because a large suite run more often cannot compensate for testing the wrong input (T-330's rejection arc is the worked example).
- WHEN the keeper answers THE arm SHALL keep graded-green, graded-red and nothing-was-graded as three distinct outcomes with the admission each confers today, SHALL confer no bounded eligibility on an unanswered keeper, and SHALL turn no refusal, error or interruption into any of them.
- WHEN the arm reports a phase's elapsed time THE report SHALL name the declared cost band for that phase where the runtime settings publish one, and SHALL say when the measurement fell outside it.
- WHEN this card is verified THE tests SHALL reach a successful dispatch and SHALL demonstrate the preserved outcomes for a guard-class fence, a non-XS size and an XS card both with and without keeper evidence, together with a named red-baseline refusal and an unmeasured-baseline dispatch.
- WHEN this card lands THE card SHALL report the measured elapsed time of each phase for at least one guarded dispatch, SHALL attribute any change to the mechanism that caused it, and SHALL claim no saving it has not measured.

## Implementation notes

## Verdicts
