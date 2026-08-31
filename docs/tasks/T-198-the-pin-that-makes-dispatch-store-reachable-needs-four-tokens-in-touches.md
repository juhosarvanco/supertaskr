---
id: T-198
title: The pin that makes `dispatch-store.ts` reachable needs FOUR tokens in `touches:` — `T-190` priced the wall and could not cross it from a one-slug fence, and this is the card the F-04 seam actually waits on
feature: F-04
milestone: 4
priority: 1
size: S
status: planned
blocked_by: []
touches: [app-dispatch, docs/architecture/components/C-15-dispatch.md, app/test/dispatch-store.test.ts, app/test/architecture-dogfood.test.ts]
suggested_by: "T-190's executor, which met criterion 2's fence wall, measured what it costs, and derived the exact token list this card carries"
builder:
review:
---

**`T-190` PRICED THIS WALL RATHER THAN GUESSING AT IT, AND THIS CARD IS
WHAT IT BOUGHT.** That lane could not build its own criterion 2 — a pin
driving `hydrateJoin` — from inside `[app-dispatch]`, and it established
why by measurement rather than by assertion:

- `hydrateJoin` exists at `app/src/lib/dispatch-store.ts:298`.
- **No location an `[app-dispatch]` fence reaches is collected by any
  runner**: `app/vitest.config.ts` collects `test/**` relative to `app/`.
- So the pin's test file must live at `app/test/…`, which the fence does
  not carry — and adding the registry `paths:` line **reds exactly one
  body**, in a file outside that fence.

`TASK-FORMAT` calls a card whose criterion and fence disagree **defective
by definition** and prescribes record-and-route. `T-190` recorded, priced
and routed; this is the route.

## The four tokens, and why each is load-bearing

    touches: [app-dispatch,
              docs/architecture/components/C-15-dispatch.md,
              app/test/dispatch-store.test.ts,
              app/test/architecture-dogfood.test.ts]

- **`app-dispatch`** — the module being made reachable.
- **the C-15 registry file** — where the `paths:` line is declared.
- **`app/test/dispatch-store.test.ts`** — the pin itself, which must be
  named EXPLICITLY: a fence expands to the registry **as it stood at
  dispatch**, so declaring the path does not grant the right to write the
  file it names. `T-112-s4` proved that shape the hard way and
  `T-112-s6` carries it.
- **`app/test/architecture-dogfood.test.ts`** — the one body the new
  registry line reds. Its owner is **C-12 (`app-map`)**, not C-05;
  `T-190` got that wrong from memory first, measured it, and corrected
  itself in both the file and its notes.

**A lane cut without all four cannot finish**, which is the whole reason
this card states them rather than leaving the next executor to discover
it. `T-112-s6` may be one token short for the same reason — flagged by
`T-190`, not measured.

## Why this is priority 1

`T-126-s2`'s ruling is that the join goes to TypeScript **behind a test
path**, and `T-190` established that the unreachable half is C-15's. So
this card is the last thing between a ruled architecture decision and a
lane that can execute it. **`T-126-s2`'s `blocked_by` names this card.**

## Acceptance criteria

- `app/src/lib/dispatch-store.ts` SHALL be reachable from a body a runner
  collects, and `hydrateJoin` SHALL be driven by that body rather than
  merely imported.
- **A one-side-only mutant of `hydrateJoin` SHALL be killed by the new
  body**, proving reachability behaviourally rather than structurally —
  `T-110` measured four producer mutants surviving at exit 0 on this
  side, and structural reachability is what it already had.
- THE registry line SHALL be declared, and the body it reds SHALL be
  reconciled in the same lane — its count moves by construction, not by
  accident.
- WHERE the pin makes `T-185` or `T-195` cheaper to close, the card SHALL
  say so; neither is in scope here.
- Verification: headless, the app suite plus `architecture-dogfood`.

## Read beside

`T-190` (which priced the wall — read its notes first), `T-112-s6` (the
same fence-expansion trap, one component over), `T-126-s2` (the ruling
this unblocks), and `T-110` (why structural reachability is not enough).
