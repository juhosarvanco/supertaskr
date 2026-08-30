---
id: T-160-s4
title: T-059's fence cannot reach a file its own criteria order it to write, which is T-127-s1's shape sitting on the board right now
feature: F-04
milestone: 4
priority: 1
size: S
status: planned
blocked_by: []
touches: [docs/tasks/T-059-the-two-joins-cannot-quietly-disagree.md]
suggested_by: verifier claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30, at the TOP of its column — this is the only live defect on the board that a dispatch would pay for.**

Re-derived at this ref, from both cwds, before promoting:
`node tools/e2e/scripts/brief.mjs --task T-059 --preflight` exits 1 with
`UNCOVERED CRITERION PATH ... line 74: app/test/architecture-dogfood.test.ts is named in the acceptance criteria, exists at HEAD, and is reserved by the app-map slug — which this card's touches do not carry.`
T-059's fence is `touches: [crate-index, app-shell]`; its criterion at line 74 orders an assertion to LIVE BESIDE `app/test/architecture-dogfood.test.ts`, which `app-map` reserves. TASK-FORMAT is unambiguous about what that makes T-059: *a card whose criterion and whose fence disagree is a DEFECTIVE CARD, not a hard call for the lane.*

**Why priority 1.** The preflight was run over all 48 cards at
planned/building/verifying/merging and T-059 is the ONLY hit — and T-059
is startable right now (its blocker T-033 is done, and the parser rules
it disjoint from every live lane). The protection today is procedural,
not mechanical: `brief.mjs:289` gates the fence write on preflight
findings only when `--preflight` is passed in the same invocation, so
`--write-fence` alone still arms a clean manifest over this card.

**THE FENCE ON THIS CARD IS NARROWED BY HAND, AND THAT IS THE FINDING
APPLIED TO ITSELF.** As filed, this card carried `touches: [tools/e2e]`
while its own criterion ordered an edit to T-059's card — the very shape
it was filing against. It escaped its own preflight only because
`docs/tasks/` is under no component slug and because a suggested card is
refused a preflight at all. A bare `docs/tasks` fence is refused BY THE
PARSER (`UNFENCEABLE_PATHS`, `lib/parser/test/fence.test.ts`), so the
fence is narrowed to the single card file this work may touch, on the
T-108 precedent.

**THE REPAIR IS ONE OF TWO AND THE LANE CHOOSES IN WRITING**, per
TASK-FORMAT: widen T-059's `touches:` to carry `app-map`, or rewrite the
criterion as a ROUTE (*IF this path is outside the fence THEN record it,
route it as a suggestion naming the fence it needs, and say so*).
Acceptance is the command, not a count: `brief.mjs --task T-059
--preflight` SHALL exit 0, and no other card's preflight SHALL change.

## The instance, found by the tool under verification

`T-160`'s preflight was run over every card the board's schedule draws
(173 of 322 at `2771ae9`). Of the statuses a dispatch can actually pick
from — planned, building, verifying, merging — the ownership arm fires
exactly ONCE, and the hit is real:

    node tools/e2e/scripts/brief.mjs --task T-059 --preflight

`T-059` carries `touches: [crate-index, app-shell]`. Its acceptance
criteria carry:

- ONE assertion SHALL live BESIDE the TypeScript fixture in the app
  lane (`app/test/architecture-dogfood.test.ts`, where the
  expectations already live and already get reconciled)

That file is reserved by the `app-map` slug, which `T-059`'s fence does
not carry. The criterion is a WRITE instruction, not a citation — it
orders an assertion into that file — so the card as it stands would be
dispatched with a fence that refuses the write its own criteria demand.

This is the shape `T-127-s1` paid for: that lane stopped honestly and
the stop cost roughly 164k tokens. `method/tasks/TASK-FORMAT.md` already
rules on it in as many words — *"A card whose criterion and whose fence
disagree is a DEFECTIVE CARD, not a hard call for the lane"* — and puts
the repair on the seat that writes the criterion, not on the lane.

## What to do

Widen `T-059`'s `touches:` to carry `app-map` before it is dispatched,
or rewrite that criterion as a ROUTE in the form TASK-FORMAT prescribes.
Either repair is one line on the card. Re-run the preflight afterwards
and require exit 0 — the same command above is the check.

## Why this is a card and not a verdict line

The defect is on `T-059`, not on `T-160`. A verdict on `T-160` cannot
repair another card, and a finding recorded only in a verdict is a
finding the board never sees. `T-160`'s own dispatch had the same shape
caught by hand (its filed fence missed `docs/CONVENTIONS.md`), and that
repair is written into its Verdicts section — this is the same class,
caught mechanically instead.

## Acceptance criteria

- `node tools/e2e/scripts/brief.mjs --task T-059 --preflight` SHALL
  exit 0, with no UNCOVERED CRITERION PATH finding, by a change to
  `T-059`'s own card and to nothing else.
