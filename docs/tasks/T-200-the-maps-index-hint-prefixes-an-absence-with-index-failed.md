---
id: T-200
title: The map's index hint prefixes an ABSENCE with "index failed:", so T-192's bound puts a sentence on screen that contradicts itself in its first three words
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-192, carrying its blind verifier's CORRECTION 2 — that seat measured the rendering and ruled it out of T-192's fence; the id was allocated by the dispatching seat, not minted in-lane"
touches: [app-map]
blocked_by: []
builder:
review:
---

**ROUTED OUT OF `T-192`'S BLIND VERDICT, WHICH COULD NOT ASSIGN IT.**
`T-192` bounded `index_repo` so a command that never answers stops
holding the `indexing` latch. Its verifier found that the bound's answer
is RENDERED under a prefix the answer was written to avoid, and ruled it
outside that lane's `app-shell` fence rather than assignable to it.

## The mechanism, measured rather than described

`T-192`'s `UNANSWERED_INDEX_MESSAGE` carries a doc comment stating the
wording is *"about TIME, not blame, because nothing was refused"* — it
follows `startupStepPhrase`'s deadline arm, which exists for exactly that
reason (T-063).

The bound delivers it as `IndexOutcomePayload { kind: "error" }`, because
`error` is the only arm of that union a bound can answer with. The sole
renderer of that arm is `app/src/architecture/MapView.tsx:790`:

    index failed: {indexOutcome.message}

so a fired bound puts this on screen:

> *index failed: the indexer did not answer within 15 seconds. It has not
> been refused — it may still be running, and re-indexing is safe.*

A sentence that contradicts itself in its first three words. The span is
`max-w-70 truncate`, so the half that retracts the blame is probably
reachable only through the `title` tooltip.

## What is NOT being claimed

**It is not inherited, and it is not `T-192`'s to have fixed.** Before
that card the only outcome reaching this arm was a genuine rejection, for
which *"index failed"* is accurate; the bound is the first NON-failure
routed through it. So `T-192` introduced the wrong rendering while being
unable to repair it: `app/src/architecture/**` is **C-12 (`app-map`)**
and that lane's fence is `app-shell` (C-05, C-10, C-16). It routed rather
than widened, which is correct.

**No sighting.** Like its parent, this is a shape measured in the source
and the render path, not something a user has reported.

## What a fix decides

1. **Whether the repair is at the RENDERER or in the TYPE.** Either give
   the hint a non-blaming arm when the message is the bound's, or widen
   `IndexOutcomePayload` so an unanswered run is not spelled `error` at
   all. The second is cleaner and crosses a component boundary
   (`watcher-store.ts` is `app-shell`), so a card taking it needs both
   slugs — say which shape is chosen and why.
2. **Whether the truncated span is part of the defect.** A retraction the
   user can only reach by hovering is close to no retraction.
3. **What the other consumers of `kind: "error"` should show.** A genuine
   refusal should still read as a failure; only the absence should not.

## Acceptance criteria

- WHERE the index outcome is an ABSENCE rather than a refusal, the map's
  hint SHALL NOT assert that the index failed, and a body SHALL prove it
  against the RENDERED text.
- A body SHALL prove a genuine REJECTION still reads as a failure, so the
  repair does not flatten the two cases into one.
- THE body SHALL assert the rendered string rather than the payload,
  because `app/test/map-view-dom.test.tsx:674` pins the `index failed`
  prefix today and would otherwise pass either way — the verifier named
  this specifically.
- Verification: headless, the app suite.
