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

THE SURVEY THIS SECTION FIRST CARRIED WAS WRONG, and it is corrected in place rather than swapped silently, because the determination below rested on it. The withdrawn sentences said there is today no shared CI reader and that nothing under `tools/e2e/scripts/` reads a CI run at all. THE SECOND IS FALSE, and it was reached by counting matches for a phrase instead of reading the module — the same failure that produced this card's other withdrawn claim. It was caught in review on 2026-09-16.

WHAT IS ACTUALLY THERE. `tools/e2e/scripts/dispatch-brief.mjs` reads CI runs today. `liveRuns` calls `gh run list --branch main --limit 60 --json databaseId,headSha,conclusion,createdAt`; `liveLog` calls `gh run view <id> --log-failed --attempt 1`; `defaultRunnerIo` wraps both behind a replay seam that `SUPERTASKR_RUNNER_RUNS` and `SUPERTASKR_RUNNER_LOGS` fill from files instead. `assembleReturnBrief` is the consumer, and `tools/e2e/tests/brief.spec.ts` already drives that seam with planted run listings.

WHAT SURVIVES THE CORRECTION is the weaker and still load-bearing half: the guard's run-reading is the guard's own. The field set, the required-field set, the run-list and run-view argument builders, the active and completed statuses, the non-verdict conclusions and the announced-red conclusions all live in `.claude/hooks/push-guard.mjs`, and the brief's reader shares none of them. There are two CI readers with no module in common — which is a different claim from no reader existing, and it is the claim the routes below are argued from.

WHAT THE CORRECTION CHANGES. The extraction route is no longer a hypothetical new home: a CI-reading module under a path a lane can write already exists, already carries an injection seam built for exactly this kind of verification, and already has spec coverage using it. And neither reader asks the listing for `event`, `status`, `workflowName` or the attempt — so neither can attribute a displacement today without widening its field set. That widening is work either route owes, and it is not saved by staying in the guard.

The guard is nevertheless ALREADY consumed as a library rather than as a script alone: it exports seventy-six symbols and seventeen files import from it, four of them specs that import constants precisely so their assertions cannot drift from the guard's own definitions.

That gives two honest routes, and they differ in what a lane can verify rather than in taste:

- **The derivation moves to a module under a path a lane can write**, which reads a run listing and answers which runs were cancelled and what can be said about each one's cause, and the guard consumes that answer. The derivations then carry their own spec, their own data mutants and their own drills — executable verification, fully supported, with the run listings from the two observed cancellations as real fixtures. THE CORRECTED SURVEY STRENGTHENS THIS ROUTE: `tools/e2e/scripts/dispatch-brief.mjs` is already such a module, with `defaultRunnerIo`'s replay seam and a spec that drives it, so the question at promotion is whether the derivation joins that reader or sits beside it — not whether a testable home can be built at all.
- **The derivation stays inside the guard.** It is the natural home and needs no extraction. On 2026-09-15 that route could not be built or drilled by a lane in this session's agent harness, for the reason T-336's scope amendment records precisely.

EITHER ROUTE ENDS WITH AT LEAST ONE EDIT INSIDE THE GUARD, because the guard is what a seat reads at push time and a module nothing consumes reports to nobody. The routes differ in how much sits there: a consumption of a few lines, or the whole derivation. The card is written so the substance is verifiable wherever the rest lands.

The behaviour itself, whichever route carries it:

- Report over an EXPLICIT BOUNDED WINDOW — the runs for the commits in the push's own range, or a stated run count the notice names. The card's first spelling walked from the newest run until the first run that reached a verdict, and that is withdrawn: a cancelled run whose replacement has since gone green sits BEHIND that green in a newest-first listing, so the walk stops short of the very case the transferred obligation exists to cover. Keeping the notice off the ordinary green push is a DEDUPLICATION question — announce a given cancellation once — and not a reason to make an older cancellation unreportable. Narrowing the inherited obligation would be a decision for the owner, not a side effect of a cutoff.
- SAY WHAT IS OBSERVED, AND SAY SEPARATELY WHAT IS INFERRED. The cancellation is a fact in the listing and is named as one. The displacer is not. A later run sharing the commit and the event is a CANDIDATE, and a human cancellation followed by an unrelated rerun produces exactly those rows; so does a rerun of the same attempt. GitHub's own documentation distinguishes concurrency queue order from dispatch time and does not guarantee ordering, so creation order is evidence and not proof. The notice therefore carries one of three: an EVIDENCED displacer, a LABELLED INFERENCE naming a candidate as a candidate, or an UNKNOWN cause. Among candidates the earliest created is the one to name, for the three-arrival reason — the earliest displaces the one after it and that one displaces the last.
- THE TWO OBSERVED CANCELLATIONS PREDATE THE KEY THEY WOULD BE MATCHED BY. Both are push-versus-schedule collisions under the concurrency key as it stood BEFORE T-336; same-commit-and-event matching describes the key T-336 landed. A fixture built from those rows carries the policy in force when they were recorded, and expects the attribution THAT policy supports or an explicit unknown. Writing the new workflow's semantics over old rows would manufacture an attribution the rows cannot support.
- Where nothing can be attributed, name nothing and say so. A confidently wrong run identifier is worse than none, and a missing field is an unknown rather than a licence to guess.
- The notice says both halves — not a red tree, and not a verdict still pending — and it fires on a green push, which is the case the existing count sentence cannot reach.
- The existing count sentence is not reworded. A body pins it, and the notice is additive.
- One workflow is assumed because the concurrency group's leading component is the workflow name and this repository declares one workflow. Say so at the site, and name the repair if another ever arrives.

## Acceptance criteria

- WHEN a cancellation falls inside the derivation's stated reporting window THE derivation SHALL report it, and SHALL NOT suppress it because a later run in the listing reached a verdict; the window SHALL be an explicit bound — a commit range or a stated run count — that the notice names, and any deduplication SHALL be a stated rule of its own rather than a silent cutoff.
- WHEN a cancellation is reported THE derivation SHALL name the cancelled run as observed and SHALL state its cause separately as exactly one of an EVIDENCED displacer, a LABELLED INFERENCE naming the earliest later run sharing the commit and event as a candidate, or an UNKNOWN cause — and it SHALL NOT present a candidate as an established cause, SHALL NOT relabel a human cancellation as a displacement because a later matching run exists, and SHALL NOT turn a rerun attempt into a displacer.
- WHEN a displacement is reported THE notice SHALL state that the outcome is neither a red tree nor a verdict still pending, and SHALL be reached on a push whose eventual verdict is a success.
- WHEN the run listing omits a field the derivation reads THE derivation SHALL degrade rather than refuse, and SHALL NOT turn a missing field into an attributed displacement.
- WHEN this card is built THE derivations SHALL be exercised by bodies that plant data mutants in a run listing — a removed displacer, two candidates, three arrivals, a rerun attempt of the same run, a human cancellation, a listing missing a field the derivation reads, and a completed green replacement sitting IN FRONT OF the cancellation in newest-first order — and each SHALL be demonstrated to red against a derivation lacking the property.
- WHEN this card is built THE fixtures SHALL include the run listings of the two cancellations observed on 2026-09-14 and 2026-09-15, each carried WITH the concurrency policy in force when it was recorded — both predate T-336's key and are cross-event collisions under the old one — and each SHALL expect either the attribution that policy supports or an explicit unknown, never an attribution derived from the key T-336 landed.
- WHEN the guard's existing count sentence is present THE change SHALL leave it as it stands, and the displacement notice SHALL be additive to it.

## Implementation notes

## Verdicts
