---
id: T-338
title: "A run cancelled by another run is reported as a count and never as a name, and is silent altogether in front of a green, so a seat meets a word that names no fault and no verdict: derive the displacement and its displacing run in a module a lane can build and drill, and have the guard consume that result"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-15, split from T-336 on the owner's ruling of the same day; the finding, the measurements and the design are the T-336 lane executor's, recorded in its ask and its report, and the owning-file determination is the seat's"
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 on the owner's ruling, as the follow-up T-336's scope amendment names. THE OBLIGATION IS CARRIED OVER WHOLE, not softened: what T-336's criterion required, this card requires.

The fence is deliberately EMPTY. The owner's ruling was that the owning files and a supported verification route are established before the fence is fixed, rather than inherited from the card this was split out of. The determination below is the seat's reading of the tree on 2026-09-15; the fence is written at promotion from whichever route is chosen, and the card is preflighted then. A card with no fence cannot be dispatched, which is the intended state until that choice is made.

## The finding

A run cancelled by another run is, to every reader this project has, a word that names no fault in the tree and no verdict either. The pre-push guard already handles most of that correctly and deliberately: `cancelled` is out of the announced-red set, so it is not read as a red tree, and it is in the non-verdict set, so the newest-verdict search steps over it rather than waiting on it. Both are pinned by bodies in the guard's own spec.

The remaining part is missing. The guard reports a COUNT of runs that reached no verdict and never an identifier — not the cancelled run's and not the displacing run's — and it prints even that count only where the verdict it eventually reaches is NOT a success. A cancellation sitting in front of a green is therefore entirely silent, which is the common case and was the actual case on both observed days.

It could not name the displacing run today in any event. After T-336 the displacing run is the newer run sharing a commit AND an event, and `event` is not among the eight fields the guard asks the run listing for.

This is not hypothetical and not rare. On 2026-09-14 a push run was displaced by the nightly on the same commit, and on 2026-09-15 another was displaced thirteen minutes into its end-to-end shard with eight of its ten jobs already successful. On the later occasion the seat spent real time establishing, by hand, what a one-line notice would have said.

## What would settle it — and the determination the owner asked for before any fence

WHERE THIS BELONGS IS THE QUESTION TO SETTLE BEFORE A FENCE IS WRITTEN, and the seat's reading of the tree on 2026-09-15 is this.

There is today no shared CI reader. Every piece of run-reading lives inside `.claude/hooks/push-guard.mjs`: the field set, the required-field set, the run-list and run-view argument builders, the active and completed statuses, the non-verdict conclusions and the announced-red conclusions. Nothing under `tools/e2e/scripts/` reads a CI run at all.

The guard is nevertheless ALREADY consumed as a library rather than as a script alone: it exports seventy-six symbols and seventeen files import from it, four of them specs that import constants precisely so their assertions cannot drift from the guard's own definitions.

That gives two honest routes, and they differ in what a lane can verify rather than in taste:

- **The derivation moves to a module under a path a lane can write**, which reads a run listing and answers which runs were displaced and which run displaced each, and the guard consumes that answer. The derivations then carry their own spec, their own data mutants and their own drills — executable verification, fully supported, with the run listings from the two observed displacements as real fixtures.
- **The derivation stays inside the guard.** It is the natural home and needs no extraction. On 2026-09-15 that route could not be built or drilled by a lane in this session's agent harness, for the reason T-336's scope amendment records precisely.

EITHER ROUTE ENDS WITH AT LEAST ONE EDIT INSIDE THE GUARD, because the guard is what a seat reads at push time and a module nothing consumes reports to nobody. The routes differ in how much sits there: a consumption of a few lines, or the whole derivation. The card is written so the substance is verifiable wherever the rest lands.

The behaviour itself, whichever route carries it:

- Walk from the newest run collecting cancellations until a run that reached a verdict, because a verdict after a cancellation settles the question. That walk is self-limiting, which is what keeps this off the ordinary green push.
- The displacing run is the EARLIEST run sharing the cancelled run's commit and event and created after it — earliest and not newest, because with three arrivals the earliest displaces the one after it and that one displaces the last. Order by creation, since a queued run has joined the group before it starts.
- Where the displacing run cannot be attributed, name nothing and say so. A confidently wrong run identifier is worse than none.
- The notice says both halves — not a red tree, and not a verdict still pending — and it fires on a green push, which is the case the existing count sentence cannot reach.
- The existing count sentence is not reworded. A body pins it, and the notice is additive.
- One workflow is assumed because the concurrency group's leading component is the workflow name and this repository declares one workflow. Say so at the site, and name the repair if another ever arrives.

## Acceptance criteria

- WHEN a run listing carries a cancellation newer than the newest run that reached a verdict THE derivation SHALL report that run as displaced, and SHALL stop walking at the earliest run it meets that reached a verdict.
- WHEN a displaced run has a later run sharing its commit and its event THE derivation SHALL name the EARLIEST such run as the displacing run, and WHEN no such run can be attributed THE derivation SHALL name none and SHALL say that it could not attribute one.
- WHEN a displacement is reported THE notice SHALL state that the outcome is neither a red tree nor a verdict still pending, and SHALL be reached on a push whose eventual verdict is a success.
- WHEN the run listing omits a field the derivation reads THE derivation SHALL degrade rather than refuse, and SHALL NOT turn a missing field into an attributed displacement.
- WHEN this card is built THE derivations SHALL be exercised by bodies that plant data mutants in a run listing — a removed displacer, two candidates, a human cancellation, a cancellation in front of a green — and each SHALL be demonstrated to red against a derivation lacking the property.
- WHEN this card is built THE fixtures SHALL include the run listings of the two displacements observed on 2026-09-14 and 2026-09-15, so the behaviour is graded against real rows and not only against rows written to match the reader.
- WHEN the guard's existing count sentence is present THE change SHALL leave it as it stands, and the displacement notice SHALL be additive to it.

## Implementation notes

## Verdicts
