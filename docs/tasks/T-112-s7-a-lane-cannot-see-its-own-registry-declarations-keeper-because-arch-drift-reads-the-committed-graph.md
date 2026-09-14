---
id: T-112-s7
title: "A lane cannot see its own registry declaration's keeper — `arch drift` reads the COMMITTED graph, so a MISSING `depends_on` reds nothing in-lane and costs a D1 finding at the integrator's regen, detached from its cause"
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-112-s5, drill M8 at 2661f7a, 2026-09-09"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/merging.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, MEASURED rather than reasoned

`T-112-s5` added one declared edge (`C-09 -> C-15`) beside the import
that makes it true. Mutant **M8** reverted the `depends_on` line and left
the import in place — one side only, sha256-restored — and asked what
reds:

    npx vitest run test/architecture-dogfood.test.ts \
                   test/map-dogfood-render.test.tsx \
                   test/detail-assignment.test.tsx
    Test Files  3 passed (3)    Tests  31 passed (31)    exit 0

**Nothing.** Worse than nothing: reverting the declaration turned the two
dogfood pins from RED to GREEN, because those pins are pinned to the
tree BEFORE the change and the declaration is what moves them. A lane
whose only signal is "is my tree green" is pointed the wrong way.

The keeper is real and lands one seat later. Derived in a `git archive`
copy of the same tip with the declaration absent and the graph
regenerated INSIDE the copy:

    finding  D1  D1:C-09->C-15  C-09 -> C-15  file_edges=1
      file-edge  app/src/components/board/TaskDetailPanel.tsx -> app/src/lib/dispatch-store.ts
    summary  findings=5  undeclared=3      <- 4 and 2 with the declaration
    edge     C-09 -> C-15  undeclared  observed=1

`app/test/architecture-dogfood.test.ts`'s findings body reds on that
third D1 — **at the integrator's GRAPH REGEN, in a file no `[app-*]`
fence reaches, detached from the lane that caused it.** That is the same
shape `C-18-board-root.md` records for T-112-s6's half-fence and calls
harmful rather than merely insufficient.

## What is not the problem

Not the pin ownership: T-211 is right that a lane must not update the
dogfood pins, and `T-112-s5` did not. Not `arch drift` either — its own
note says it computes from the COMMITTED graph and points at
`index --check`. The gap is that **no standing discipline tells a lane to
ask the question in a form a lane can answer.**

## The suggestion

A CONVENTIONS bullet — beside DECLARING A COMPONENT, which already
handles the new-component case — for the `depends_on`-only edit: derive
the answer in a throwaway regenerated copy rather than from the lane's
own red. The two commands `T-112-s5` used, in full:

    git -C <lane> archive HEAD | tar -x -C <copy>
    supertaskr-index index --root <copy>          # regenerate IN the copy
    supertaskr-index arch drift --root <copy>     # findings/undeclared, post-regen

It writes nothing into the lane, needs no fence, costs about a minute
against an already-built binary, and answers the one question the lane's
own suite structurally cannot: *does my declaration match what the merged
tree will observe?* Whether it becomes a bullet, a script under
`tools/e2e/scripts/`, or an arm of the existing gate runner is the
architect's; the measurement above is the argument for having one.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/merging.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
