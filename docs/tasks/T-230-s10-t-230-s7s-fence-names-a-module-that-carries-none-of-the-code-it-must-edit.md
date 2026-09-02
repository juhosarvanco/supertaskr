---
id: T-230-s10
title: T-230-s7's touches names tools/e2e/scripts/brief.mjs, which carries ZERO occurrences of the reader that card is about — the fence guard would refuse every write the lane needs and the preflight would not warn, because the path exists
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-230-s3
blocked_by: []
touches: [docs/tasks]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A FENCE THAT NAMES A REAL FILE AND THE WRONG ONE IS THE CASE NO GUARD
CATCHES.** `T-230-s7` (on main at 8d21442) is about `unmarkedQuotes`
and `QUOTED_RUN`, and its `touches:` reads:

    touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/card-preflight.spec.ts]

Derived at 80c36f8 in this lane, both counts with the control printed
first: `tools/e2e/scripts/brief.mjs` carries **0** occurrences of
`unmarkedQuotes` or `QUOTED_RUN`; `tools/e2e/scripts/card-preflight.mjs`
carries **4**. Its body's own prose says the reader is *in
tools/e2e/scripts/brief.mjs*, and it is not.

## WHY NOTHING WOULD SAY SO

Every arm that could speak answers cleanly on this card:

- the PATH arm resolves `tools/e2e/scripts/brief.mjs` — it EXISTS, so it
  is not a stale path;
- the FENCE arm asks whether the entry reserves a tracked file — it
  does, so it is not a dead entry;
- the UNCOVERED-CRITERION arm fires only on a path a DECLARED component
  owns, and `tools/e2e` sits under no component by design.

So `--preflight` passes, `--write-fence` stamps a manifest reserving the
wrong module, and the executor meets the failure at its FIRST WRITE, as
a refusal it may not repair from inside the lane
(`method/lane-protocol.md` rule 5). The cost is a routed discovery and a
re-dispatch, on a card that is already `blocked_by: [T-230-s3]` and will
be dispatched the moment that block clears.

## THE MOVE IS TRIAGE'S, NOT A LANE'S

The repair is one frontmatter line on somebody else's card, which is
triage's write and not this lane's: correct `touches:` to
`[tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]`
and correct the two body sentences that name the module, BEFORE the
dispatch stamp — `docs/STATE.md` already warns that a fence narrowed
after the first cut reds session-economics in every earlier lane.

## AND THE CLASS IS WORTH A SENTENCE

A `touches:` entry is checked for EXISTENCE and for DISJOINTNESS and
never for RELEVANCE, and nothing in the tree can check relevance in
general. What IS derivable is narrower and worth a prototype only if a
second instance turns up: a card whose PROSE names a symbol, and a
fence none of whose entries contains that symbol at HEAD. That is the
`quotes` arm's own opt-in shape turned on the fence, and it is recorded
here rather than filed so the next instance has somewhere to land.
