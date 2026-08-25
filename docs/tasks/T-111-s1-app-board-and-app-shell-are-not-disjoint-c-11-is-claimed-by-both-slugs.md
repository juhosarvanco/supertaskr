---
id: T-111-s1
title: app-board and app-shell are NOT disjoint — C-11 carries both slugs, so this card's own dispatch put two overlapping lanes in flight
status: suggested
suggested_by: executor claude-opus-5 @T-111
---

**THE TWO LANES LIVE IN THIS REPOSITORY AT `e04f5b3` OVERLAP, AND THE
FENCE THAT CUT THEM COULD NOT SEE IT.** This is not a hypothetical about
the frontier T-111 was going to build; it is the frontier's first finding,
produced by deriving the thing the card exists to derive, and the instance
is T-111's own dispatch.

    T-033  touches: [docs/architecture/components/, lib-parser, app-map, app-shell]
    T-111  touches: [app-board]

    STRING-EQUALITY fence   -> intersection EMPTY  -> reported DISJOINT
    COMPONENT-EXPANDED fence -> intersection {C-11} -> OVERLAPPING

Derived mechanically from each component file's own `touch_slugs:` field
at `e04f5b3` — the authority ARCHITECTURE names, never its prose table:

    app-board -> C-08, C-09, C-11
    app-shell -> C-05, C-10, C-11
    C-11 paths: app/src/styles/**, app/src/assets/**

**C-11 IS THE ONLY COMPONENT IN THE REGISTRY CARRYING TWO SLUGS**, and it
is therefore the only slug pair in the whole vocabulary that can collide
this way. `touch_slugs: [app-shell, app-board]` has been in
`docs/architecture/components/C-11-design-tokens.md` since the component
was written; ARCHITECTURE's own derived table prints both rows containing
C-11, four lines apart. **The data was never missing. Nothing joined it.**

## IT IS ONE PAIR IN FIFTEEN ON THE LIVE BOARD, AND THE BOARD IS ALSO OVER ITS CEILING

**The lane set went from TWO to SIX while this lane was working** — T-086,
T-091, T-102 and T-107 were cut between 10:51Z and 11:08Z, and main moved
three times in twenty-two minutes (`e04f5b3` → `ad5a0df` → `c4c15c8`). So
the arithmetic below is a live-environment fact read at **11:10Z against
main `c4c15c8`**, not a function of a tree. It was run by hand, because
the thing that should run it is the card this lane could not build.

    T-033  [docs/architecture/components/, lib-parser, app-map, app-shell]
    T-086  [docs/CONVENTIONS.md]
    T-091  [tools/e2e]
    T-102  [app-agent]
    T-107  [app-interview]
    T-111  [app-board]

**Fifteen pairs. Fourteen agree — disjoint under both computations.
ONE disagrees, and it is the only one that can:**

    T-033 x T-111 : string-equality = EMPTY        (reported DISJOINT)
                    component-expanded = {C-11}    (OVERLAPPING)

**AND THE BOARD IS AT OR OVER ITS CEILING.**
`method/roles/orchestrator.md` step 4 reads *"Ceiling: 3–5 concurrent."*
There are **six** lanes. This is T-111's criterion 5 — *"the disposition
SHALL distinguish 'nothing is dispatchable' from 'the ceiling is
reached'"* — live rather than hypothetical, and nothing in the tree
reports it. The frontier would have said so on every dispatch after the
fifth.

## Why this is a fence overlap and not a matter of taste

`method/roles/orchestrator.md` step 4 dispatches a card "whose `touches:`
don't overlap any task currently building". ARCHITECTURE settles what
"overlap" ranges over, in the paragraph that exists precisely to stop a
fence being computed from prose: *"A fence computed from the prose would
call two overlapping cards disjoint — the exact failure a fence exists to
prevent."* The fence is over PATH SETS; slugs are a naming layer on top of
components. Two slugs sharing a component share that component's paths.

**NOTHING WAS BREACHED, AND THAT IS THE WHOLE DANGER.** Neither lane wrote
a byte under `app/src/styles/**` or `app/src/assets/**` — T-033 is a
registry/parser/map card and T-111 shipped no source change at all. So the
overlap is a FENCE overlap, not a file collision, and it cost nothing this
time. A fence is a pre-declaration; it is worth exactly what it is worth
before anybody writes anything. This one was wrong at dispatch and stayed
undetected through a full lane because the only thing that could have
detected it is the card the lane was dispatched to build.

## What the frontier owes because of this

T-111's criterion for the reason string — *"a reason string honest enough
that a human can see it is the coarse fence rather than a real overlap,
and override deliberately"* — is written for the case the card names in
its own body: `app-shell` treated as an atom refusing a Rust-only card
because a TypeScript-only card is in flight. **The card does not
anticipate this case, which is its converse**: two slugs that look
DISJOINT as strings and overlap as component sets. A reason string is no
help here at all, because no reason is computed — the pair is reported
disjoint and the frontier stays silent. The fenced/dispatchable decision
has to expand slugs to components BEFORE it compares, or it inherits this
defect at the layer that is supposed to remove it.

## Three arms, and the third is the cheap one

1. **Expand before comparing** — the frontier resolves each `touches:`
   token through the component files' `touch_slugs:` and intersects
   COMPONENT sets (falling back to a normalised path token when a token
   names no slug). This is the fix, and it belongs in T-111 whenever the
   card is re-dispatched; it costs the frontier nothing it was not
   already going to build.
2. **Split C-11's double claim** — give the tokens their own component,
   or drop one slug from `touch_slugs:`. A registry change: it moves the
   three live-registry fixtures (T-024's rule) and it is a decision about
   what a design token belongs to, not about fences. Not recommended as a
   fix for this; recorded so the option is on the record.
3. **Say it out loud in ARCHITECTURE** — one sentence under the derived
   slug table naming C-11 as the one component with two slugs and the
   consequence for disjointness. This costs a line and would have
   prevented this dispatch. Fence `[docs/architecture/components/]` or
   ARCHITECTURE's own, whichever the architect prefers; both are held by
   T-033 today.

Arm 1 is the only one that survives a fourth slug being double-claimed
later. Arms 1 and 3 are not alternatives — arm 3 helps the human doing
the dispatch by hand, which is every dispatch until F-04 lands.
