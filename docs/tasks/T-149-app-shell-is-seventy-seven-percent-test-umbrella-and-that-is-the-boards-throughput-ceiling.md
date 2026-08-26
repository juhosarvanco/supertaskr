---
id: T-149
title: app-shell is 77% a test umbrella, 20 of 34 planned cards touch it, and two thirds of those tests belong to something other than the shell
feature: F-06
milestone: 4
priority: 1
size: M
status: building
blocked_by: []
touches: [docs/architecture/components/, app-shell, app-map]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## The measurement

**`app-shell` is the board's throughput ceiling.** 20 of 34 planned
cards touch it; while one lane holds it, **59% of the board cannot be
dispatched.** That is not a scheduling annoyance — it is why nothing was
dispatchable for most of 2026-08-26 with a single lane live.

The slug expands to four components, and they are not comparable:

    C-05-app                64 files
    C-10-docs-watcher        3
    C-16-shared-primitives   3
    C-11-design-tokens       0   (also carries app-board — the C-11 seam)

**So `app-shell` is C-05, and C-05 is mostly a test directory:**

    C-05 total          64 files
    under app/test/**   49   (77%)
    everything else     15

The shell itself — `App.tsx`, `main.tsx`, `components/shell/**`,
`lib.rs`, `main.rs` and the build plumbing — is **fifteen files**.

## Why routing them to one new slug would NOT fix it

The obvious move is to give `app/test/**` its own slug. **It moves the
queue rather than shortening it**: nearly every card writes an app test,
so they would all serialise on the test slug instead of on the shell.

## What the test names say

Grouped by the subject each filename declares:

| subject | files |
|---|---|
| map / architecture | **18** |
| interview / genesis | **10** |
| shell (genuinely) | 16 |
| docs-watcher | 3 |
| board | 3 |
| agent | 1 |

**Thirty-three of forty-nine belong to something other than the shell.**
A map card and an interview card collide today for no reason except that
both write into one umbrella.

## The evidence that this is a real defect and not tidiness

**`T-137` could not fix the assertions its own merge broke.** Its fence
was `[lib-parser, app-map, tools/e2e]`; the three dogfood assertions its
regen moved live in `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — **files about the architecture
map, owned by the shell.** The lane was honestly green at its own tip and
the integrator had to reconcile them at the checkpoint.

**A test that cannot be edited by the card that owns its subject is
mis-filed.**

## What to change, and what NOT to

Route each `app/test/**` file to the component it exercises, by editing
component `paths:` in the registry. **No file moves on disk** — this is
the same shape as T-033's extraction, which the dogfood suite already
records as precedent.

**Do NOT split C-05's fifteen real files.** They are a coherent shell and
splitting them buys nothing.

## Three things that will bite

1. **Every rollup assertion moves.** The dogfood suite asserts exact
   per-component file counts and a full relation table. Expect a larger
   reconciliation than `T-141`'s fourteen. **That is the card's real
   cost, and it is why this is an M.**
2. **A misrouted file becomes `ambiguous` (two globs match) or reopens
   the D2 (`unmapped`).** `arch drift` currently reports
   `unmapped=0 ambiguous=0` and it must still say that at the end. Run it
   after every registry edit, not once at the end.
3. **New edges.** A test moving into C-12 may make C-12 depend on
   something it did not declare. The T-141 precedent applies: **measure
   the arrangements rather than arguing them**, and prefer the owner that
   adds no edge.

## The measurement that says whether it worked

Before: **20 of 34 planned cards touch `app-shell`.** Re-derive that
number after. Per `T-142`, confirm the count can move before trusting it
to have moved — the same query on the pre-change tree must still say 20.
