---
id: T-015-s3
title: the layout pin and the status pin share one node face, and a node carrying both would render "pin pin"
status: suggested
suggested_by: executor claude-opus-5 @T-015
---

T-015's third criterion says *"Pinned nodes SHALL show the faint pin hint
from the design spec"*. The design spec describes **two different pins**
and gives them the **same treatment**, and one of the two already ships.
This needs a ruling before the hint is built, not a defect report after.

## The collision

**Pin A — the STATUS pin. Already built (T-012).** A component file whose
`status:` is anything other than `auto` overrides the task rollup.
`derive.ts` sets it (`const pinned = component.status !== "auto"`) and
`MapNode.tsx` renders it:

    {component.pinned && (
      <span className="font-mono text-map-meta text-muted-foreground">pin</span>
    )}

`MapPanel.tsx` explains it in words — *"status pinned by the architect —
the task rollup says …"*. Its source is the design handoff §4.1:
*"**pinned** (status manually overridden by the architect — a tiny "pin"
hint, not a color)"*, and the bundle's state grid labels that swatch
*"pinned · word, not colour"*.

**Pin B — the LAYOUT pin. T-015's.** A dragged node keeps its dropped
position. The bundle's map-behavior screen renders it as a mono `pin`,
muted, in the header row's right slot — the identical element, in the
identical place — with the caption *"drag to pin · the computed slot
stays behind as a dashed ghost so you can see what you overrode, and
drop-on-ghost unpins · the word "pin", never a glyph"*.

**They are the same word, the same size, the same ink and the same
slot.** A component that is both `status:`-overridden and dragged renders
`pin` twice, side by side, in `MapNode`'s composed right slot (whose
recorded order is drift · pulse dot + word · provenance mark · pin).

## Why it cannot be resolved by an executor guessing

The two pins mean genuinely different things — one is an architect's
claim about a component's STATE, written in a committed markdown file;
the other is a user's claim about where the node SITS, written in
`layout.json`. Collapsing them into one word loses information the panel
can restore but the face cannot. Keeping both loses the calm the whole
map is built for. The design pass gave them one treatment because it
designed them on different screens and never drew a node carrying both.

## The options, so the ruling is cheap

1. **One word, panel disambiguates.** Render `pin` at most once; the
   panel gains a *"position pinned"* line beside the existing *"status
   pinned by the architect"* one. Cheapest, keeps the face calm, and both
   design captions remain literally satisfied. **The ghost slot is
   already the layout pin's discriminating signal** — a status pin has no
   ghost — so the face is not actually ambiguous once the ghost is drawn.
   This is the option this finding recommends.
2. **Two words** (`pin pin`, or `pin` + something). Refused on sight by
   the map's own restraint budget, but recorded because it is what a
   literal reading of both captions produces.
3. **Rename one.** The status pin could become `held` or `set`, the
   layout pin `placed`. Correct in the abstract, but it changes shipped
   copy for a state the map has rendered since T-012, and it needs the
   same design authority that wrote the captions.

Whatever is chosen, `MapNode`'s right slot needs its composed order
extended, and `MapPanel`'s two pin sentences need to stay
distinguishable — a reader who sees one word must be able to find out
which pin it was.

## Where it must NOT be resolved

Not in `derive.ts` by overloading `DerivedComponent.pinned`. That field
means *status override*, is read by `map-visuals.ts`'s `declaredOnly`
computation (`component.declaredOnly && !component.pinned`) and by
`MapPanel` twice; widening it to mean "or dragged" would silently change
the declared-only face of any dragged node. The layout pin belongs in
its own state, sourced from `layout.json`, and joined at the render.
