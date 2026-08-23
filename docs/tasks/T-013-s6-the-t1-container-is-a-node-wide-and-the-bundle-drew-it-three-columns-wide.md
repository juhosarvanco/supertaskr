---
id: T-013-s6
title: The T1 container is one node wide because the criterion says "within its own column"; the bundle drew it three columns wide, and nobody has ruled
status: parked
suggested_by: executor claude-opus-5 @T-013
---

Two sentences in the record disagree about the shape of an expanded
component, and T-013 obeyed the one in its own criterion.

- **The criterion** (T-012's amendment (a), which rewrote T-013's first
  criterion at dispatch): *"the container grows down within its own
  column and pushes only that column; siblings do not move"*. The
  bundle's layout footer says the same: *"T1 container grows down into
  the slots below it in its own column and pushes only that column"*.
- **The bundle's T1 card**: *"the container grows down AND RIGHT into
  the lane it already owns"*, drawn **420 px wide beside 132 px nodes**,
  with the files in a two-up grid.

At this map's real geometry a node is **192 px** and the column pitch is
**216 px**, so the mock's ratio is ~611 px — nearly THREE columns. Growing
right by that much moves exactly the siblings the criterion forbids, so
the container stays `NODE_W` and only its height moves, and the file
grid is one column instead of two.

**THE COST IS REAL AND IS NOT HYPOTHETICAL.** The inner row is
192 − 2·1 border − 2·8 padding − 12 gutter = **162 px** of mono at
~11 px, about 26 characters. On this repository's own map that truncates
`architecture-dogfood.test.ts` (28) and every longer test name; the
`title` attribute carries the full path and the panel's file section
carries the complete list, so nothing is unreachable, but the container
reads as a column of ellipses for C-05.

**WHAT A RULING WOULD LOOK LIKE**, so this is a decision and not a
complaint. (a) Keep 192 and accept truncation — today's behaviour. (b)
Let the expanded column's PITCH widen and push the columns to its right,
which contradicts "siblings do not move" but is what the mock draws; it
would need the criterion rewritten, not reinterpreted. (c) Widen only
into the 24 px gutter (216 px total), which buys 24 px and leaves zero
separation from the next column. This is the architect's call and it is
a DESIGN question — the handoff's own §9 says "IF a component or edge
state has no designed treatment THEN the pass is not done", and the two
sentences above are one state with two treatments.

**PARKED at the seventh triage (2026-08-24).** Unpark at the same design pass — the finding calls it "the architect's call and a DESIGN question": two sentences of record, one state, two treatments.
