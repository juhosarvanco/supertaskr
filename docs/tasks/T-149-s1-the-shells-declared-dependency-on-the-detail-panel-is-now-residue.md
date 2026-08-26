---
id: T-149-s1
title: C-05 -> C-09 is now a declared dependency with zero observed edges — all three of its file edges were test edges, and T-012's own precedent says drop it
status: suggested
suggested_by: executor claude-opus-5 @T-149
---

**MEASURED AT `bf09a57`, THIS LANE'S TIP.** `nputer-index arch --root .`
prints:

    edge  C-05 -> C-09  planned  observed=0

It read `confirmed observed=3` at the lane base `23ee41b`. All three
observed file edges were `app/test/**` edges —
`detail-presentation.test.ts`, `panel-dismissal.test.ts` and
`select-task-detail.test.ts` — and T-149 routed them to C-09, the
component they exercise. **Nothing in `app/src/` reaches C-09 from the
shell directly**: `App.tsx` renders `Board.tsx` (C-08) and the board
opens the drawer, so the real path is `C-05 -> C-08 -> C-09`, both hops
declared and both observed.

## The precedent is exact and it is in this registry already

`docs/architecture/components/C-12-map-pane.md` carries it in as many
words, about the mirror case at T-033:

> this edge measured `planned observed=0` the moment it did — a declared
> dependency with nothing behind it, which the map draws as INTENT and
> which was not intent but residue.

C-12 dropped `C-05` from its `depends_on` for exactly this reason, and
the argument transfers: a `planned` row asserts intent, and there is no
intent here — the shell never meant to import the drawer, it meant to
import the board.

## Why T-149 did not take it

The card's charter is `paths:`, in its own words: *"Route each
`app/test/**` file to the component it exercises, by editing component
`paths:` in the registry."* Dropping a declared dependency is a
different judgement with a different argument, and T-033 spent a
section on the equivalent one. Taking it inside a routing card would
have bundled a decision with a reconciliation.

## What it costs and what it moves

One line in `docs/architecture/components/C-05-app.md`. It moves the
dogfood relation table from **37 rows to 36** and the tally from
`25 confirmed / 2 undeclared / 10 planned` to `25 / 2 / 9`, plus the
matching `declared_deps` figure on C-05's `arch` line (11 -> 10). It
moves no drift finding: a `planned observed=0` row produces none today.

**CHECK THE SECOND HALF BEFORE TAKING IT.** `C-05 -> C-11` and
`C-05 -> C-01` are also `planned observed=0` and are NOT residue —
C-01 and C-11 are `non_code: true`, so nothing there can ever be
observed. The test that separates them is whether the target has
indexed files at all, and C-09 has six.

Fence: `[docs/architecture/components/]`.
