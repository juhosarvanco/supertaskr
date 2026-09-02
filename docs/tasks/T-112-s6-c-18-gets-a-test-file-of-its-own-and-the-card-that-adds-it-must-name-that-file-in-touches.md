---
id: T-112-s6
title: C-18 gets a test file of its own — and the card that adds it must name that file in `touches:`, because a fence expands to the registry as it stood at dispatch
feature: F-02
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
touches: [app-board, docs/architecture/components/C-18-board-root.md, app/test/board-root.test.tsx]
suggested_by: executor claude-opus-5@subagent @T-112-s4 — routed under TASK-FORMAT's "a criterion that cannot be built inside the fence is recorded and routed"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THIS IS THE HALF OF `T-112-s4`'s FIRST CRITERION THAT ITS OWN FENCE
COULD NOT REACH**, routed rather than approximated. That card's criterion
read *"`C-18-board-root.md` SHALL declare a test path of its own, or the
registry SHALL state in that file why the composition root is
deliberately untested from inside a `[app-board]` fence."* The second arm
is discharged — `C-18-board-root.md` now carries the derivation. The
first arm is this card, and the reason it is a separate card is
mechanical rather than a matter of appetite.

## Why `T-112-s4` could not do it, stated so this card is not re-filed

A `[app-board]` fence expands to C-08/C-09/C-17/C-18's `paths:` **as they
stand at the moment the fence is written**, which is dispatch. C-18
declares exactly one path, `Board.tsx`. So:

- the lane may ADD `app/test/<name>.test.tsx` to C-18's `paths:` — the
  registry is inside the fence;
- and the lane still may NOT WRITE that file — the manifest at
  `.nputer/lane-fence.json` was expanded before the line existed, and a
  lane may not re-expand its own fence (the manifest is outside every
  fence, by design).

**The registry line and the file it names cannot land in one lane unless
the card's `touches:` names the FILE.** `C-05-app.md`'s T-149 note
already prescribes *"the card adding a test fences its own component's
slug plus that component's own registry FILE"*; that is necessary and not
sufficient, because the slug expansion is what is stale. Hence the
`touches:` line above — it is the deliverable of `T-112-s4`'s learning and
should be taken verbatim rather than re-derived.

**RETRACTED 2026-09-02 BY THE LANE THIS SENTENCE STOPPED.** It read:
*"`app-board` already reaches `C-18-board-root.md` through the slug, so
no separate registry token is needed here; a dispatcher preferring the
narrower T-149 spelling may use `[app-board,
docs/architecture/components/C-18-board-root.md,
app/test/board-root.test.tsx]` instead, and the two are equivalent for
this card's writes."* **The two are NOT equivalent, and the second is the
only one that works.** The slug expands to each component's `paths:`, and
the section above quotes C-18's own body saying that no component
declares its own registry file there — so the sentence was refuted by
this card's own citation two paragraphs up. `touches:` at the top is now
the three-token spelling; the account is at the end of this card.

## What the file may and may not import

Every edge a C-18-owned test needs is ALREADY DECLARED — this component
sits above the whole board side, with `depends_on: [C-06, C-08, C-09,
C-17]`. So a file importing `Board`, the parser, the card faces, the
drawer and the board model adds no registry line beyond its own path.

**It may not import `App`, or anything under `app/src/components/shell/`.**
That is C-05's, C-05 already declares `C-05 -> C-18`, and declaring the
reverse edge cycles — `C-05 -> C-18 -> C-05` and
`C-05 -> C-13 -> C-18 -> C-05`, `arch cycles` exit 1. **But read the
measurement in `C-18-board-root.md` rather than that sentence**, because
the wall a lane actually hits comes first and is different: re-homing
`board-truth.test.tsx` by a PATH MOVE alone leaves `arch cycles` ACYCLIC
at exit 0 and instead raises an `arch drift` **D4** double-claim, which
can only be cleared from `C-05-app.md` — a file no `[app-board]` fence
reaches. **So a new file is not merely the tidier option here; it is the
only one this card's fence can execute.** That is also why
`app/test/board-truth.test.tsx` cannot simply be re-routed here.

`T-169-s1` is adjacent but is NOT authority for the above: it parked on
whether that file moves to **C-08's or C-09's** `paths:`, and on moving
the review-badge bodies into it. Neither question is this card's, and
both stay open.

## Acceptance criteria

- `C-18-board-root.md` SHALL declare an `app/test/**` path of its own,
  and that file SHALL exist and be collected by `app/vitest.config.ts`.
- The new file SHALL drive `Board` with a lane reading and require the
  drawer's dispatch block, so that deleting either threading line in
  `Board.tsx` reds a body in a file `[app-board]` may itself edit.
- `cargo run -p nputer-index -- arch cycles --root ../..` SHALL exit 0
  after the change, and `arch --root ../..` SHALL report the new file
  mapped rather than unmapped — derive both at the lane's own ref.
- The lane SHALL say whether the existing pin in
  `app/test/board-truth.test.tsx` is left in place or superseded, and
  SHALL NOT delete it from outside `[app-shell]`.

## What this card is NOT

**It is not a coverage gap.** The composition root's threading is pinned
today and every one-sided mutant of it dies — `T-112-s4` measured that at
its own base and the figure belongs to that card, not transcribed here.
This is placement debt with a working pin, which is why it is filed at a
priority that says so. The cost of leaving it is paid by the NEXT
`[app-board]` card that changes `Board.tsx`'s threading and cannot update
the pin that protects it.

PREFLIGHT RULING (2026-08-31): `app/test/board-root.test.tsx` is ABSENT
and INSIDE this card's own fence — it is the file this card CREATES, so
the preflight's own classification (`creation target`) is the correct
one and the finding is discharged rather than corrected. Recorded because
the dispatch gate refuses on any finding, benign ones included, and a
ruling is the mechanism it names for exactly this.

## DISPATCH REFUSED 2026-08-31 — the fence cannot reach two criterion paths

The dispatch preflight refused the fence write, and it was right:

    UNCOVERED CRITERION PATH line 80: app/vitest.config.ts
      — reserved by app-shell, which this fence does not carry
    UNCOVERED CRITERION PATH line 88: app/test/board-truth.test.tsx
      — reserved by app-shell, which this fence does not carry

`touches:` is `[app-board, app/test/board-root.test.tsx]`. Both named
paths belong to **C-05 (`app-shell`)**.

**THIS IS `T-185`'S SHAPE, CAUGHT BEFORE THE LANE WAS CUT RATHER THAN
AFTER IT BUILT.** `T-185` reached a C-05 fixture its fence could not
touch, was rejected for a regression it was forbidden to repair, and cost
a whole second card (`T-185-s2`) to discharge. Here the preflight refused
at dispatch and cost nothing.

**What the next dispatch must decide, and it is a judgement not a
widening:** a criterion names a path for two different reasons — because
the work WRITES it, or because the argument CITES it. If these are cited,
the criteria should say so and the fence is already right. If they are
written, the fence needs `app-shell` and the card should say why a
board-root test reaches the shell's config. Do not widen on reflex; the
preflight's own note draws exactly this distinction.

Stamp returned to `planned`; no lane was cut and nothing was built.

## AND THE SECOND DISPATCH WAS REFUSED TOO — BY THE LANE HOOK, MID-BUILD

The re-dispatch took `touches:` as the card asked, verbatim:
`[app-board, app/test/board-root.test.tsx]`. The armed manifest expanded
to **18 paths, none of them a registry file**, and the hook refused
`docs/architecture/components/C-18-board-root.md` — the file the FIRST
acceptance criterion requires. Probed rather than discovered by a failed
write:

    docs/architecture/components/C-18-board-root.md  exit=2
      LANE FENCE: ... is outside T-112-s6's fence.

**THE LANE STOPPED RATHER THAN SHIPPING THE HALF IT COULD REACH, AND THE
HALF WAS MEASURED HARMFUL BEFORE THAT WAS DECIDED.** On a `git archive`
copy of the tree at the lane's base, the test file WITHOUT the registry
line lands `arch drift` **D2 unmapped=1, findings 4 to 5, edges 45 to
48** — which `app/test/architecture-dogfood.test.ts` asserts against by
name, and which reds at the integrator's graph regen, detached from its
cause, in a file no `[app-board]` fence reaches. With the line, the same
copy answers **mapped 201, unmapped 0, edges 45, findings 4** — every
summary at its base value.

**BOTH OF THOSE ARE THE COPY'S FIGURES AND NEITHER IS THIS TREE'S.**
`arch` reads the COMMITTED graph, which no lane regenerates, so at this
lane's tip it still prints `files=200 mapped=200` and cannot name the new
file at all. **Criterion 3's "`arch` reports the new file mapped" is
therefore satisfiable only after the INTEGRATOR's regeneration**, and
what this lane can show in-tree is `index --check` answering **STALE,
`files +1 -0`, `edges +12 -0`** — the expected reading — plus
`arch cycles` **ACYCLIC at exit 0**, which needs no graph because it
reads the registry only. The derivation is now in `C-18-board-root.md`,
which is where the next component in this position will look.

The fence was re-armed on the three-token spelling and the card built
under it. **The cost of the two refusals was two dispatches and no
rejected build**, which is the trade the preflight and the lane hook are
both for.
