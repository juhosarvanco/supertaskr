---
id: T-190
title: C-15 declares no test path, so `dispatch-store.ts` — the module a TypeScript join would live in — is the seam's real unreachable half, and the ruling named C-18 instead
feature: F-04
milestone: 4
priority: 2
size: S
status: planned
blocked_by: []
touches: [app-dispatch, docs/architecture/components/C-15-dispatch.md]
suggested_by: executor claude-opus-5@subagent @T-112-s4 — derived while discharging that card's registry criterion, not anticipated by it
builder:
review:
---

**`T-126-s2`'s RULING IS RIGHT ABOUT THE SHAPE AND NAMES THE WRONG
COMPONENT AS THE BLOCKER.** The ruling stands: the join goes to
TypeScript, shapes 1 and 2 are refused on properties no measurement can
revive, and shape 3 is refused on test reachability — a property a lane
can fix. This card does not reopen any of that. It corrects **which**
component has to be fixed before shape 3 is reachable, because the
ordering the ruling forced is downstream of that answer.

The ruling reads: *"`T-112-s4` is this card's BLOCKER … Until that is
fixed, anything put in TypeScript here is unpinnable by construction."*

## The dispatch view model already has a test path, from inside `[app-board]`

Derived at `T-112-s4`'s base, by reading the test files rather than by
grepping for a module name — which is the check the sitting itself
records as the one that settled the question:

- `selectDispositions` — the frontier's own classification, the thing
  `board-model.ts` reads `row.state` and `row.lanes` off — is driven
  directly from `app/test/select-board.test.ts`, which is **C-08's** and
  therefore inside `[app-board]`. `DispatchReading` and `DispatchStamp`
  fixtures are constructed there.
- `selectBriefPanel` — the presentation judgement — is driven from
  `app/test/select-task-detail.test.ts`, which is **C-09's**.
- The drawer's rendered dispatch block is driven from
  `app/test/detail-assignment.test.tsx`, which is **C-09's** and imports
  `TaskDetailPanel`, `DispatchReading` and `BriefOutcomeView` directly.

So the ruling's own precondition — *"after the dispatch view model has a
test path"* — is **already satisfied for the view model**. What is not
satisfied is a test path for the module a TypeScript join would actually
be written in.

## C-15 declares no `app/test/**` path at all

`C-15-dispatch.md`'s `paths:` are `app/src-tauri/src/dispatch/**` and
`app/src/lib/dispatch-store.ts`. There is no test entry, and there is no
glob under `app/test/` anywhere in the registry — T-149 removed the last
one and every test file is enumerated to a component by name. So:

- no C-15-owned test file exists, and none can be created by a lane whose
  fence expands to C-15's paths as they stand (the ordering trap
  `T-112-s4` paid for; see `C-18-board-root.md`);
- no OTHER component's test file may import `dispatch-store.ts` either,
  because C-08 and C-09 do not declare C-15 and the import would be the
  undeclared component edge `arch drift` caught at T-169.

And the module is genuinely unreached: nothing under `app/src` or
`app/test` imports it by `import`, `require` or dynamic `import()`. Every
occurrence of the string is a doc comment or a path literal inside a
registry census — the "census satisfied by a MENTION rather than by a
USE" family the ruling itself nearly booked a decision on.

## The `C-09 -> C-15` edge, priced rather than declared

`T-112-s5`'s shape 3 wants this edge, and `T-112-s4` was asked whether to
declare it while it had the registry open. **It did not, and the case is
recorded here rather than acted on**, because an executor may not make an
unruled architecture decision from inside a lane — `T-126-s2`'s own
corroboration says exactly that. What that card derived, so this one is
cheap:

- **It creates no cycle.** C-15's declared closure is `{C-10, C-06,
  C-01}` and C-09 is not in it; `arch cycles --root ../..` is ACYCLIC at
  that base and would stay so.
- **It costs no drift.** A declared-but-unobserved edge is an ordinary
  state in this registry, reported as `planned observed=0` — `C-15 ->
  C-10` is exactly that today, alongside several others. So the edge is
  one line and reds nothing.
- **But declaring it presupposes `T-112-s5`'s shape 3**, which is not
  ruled. The edge should be declared by the card that WRITES the import,
  in the same commit, which is when it becomes observed — the discipline
  `C-18-board-root.md` states as *"the seam is drawn where the code
  already was"*, and which `task-detail.ts` already applies one module
  over when it refuses to import `dispatch-store.ts` for a type.

## Acceptance criteria

- `C-15-dispatch.md` SHALL declare a test path of its own, or SHALL state
  why the dispatch store is deliberately unreachable from a suite.
- A pin SHALL drive `hydrateJoin` — or whatever the join's TypeScript
  entry point is named when this lands — such that a one-sided mutation
  of it reds a body, and the lane SHALL report the failing-body count for
  each mutant it names.
- The lane SHALL derive, at its own ref, whether anything yet imports
  `dispatch-store.ts`, by `import`/`require`/`import()` and never by the
  module's name.
- `cargo run -p nputer-index -- arch cycles --root ../..` SHALL exit 0
  after the change.

## Ordering

This card, not `T-112-s4`, is what `T-126-s2` carries as its `blocked_by`
for the test-reachability half. `T-112-s4`'s own registry work is
discharged; `T-112-s6` carries the C-18 test file, which is placement
debt with a working pin rather than a blocker for this seam. **Whoever
picks this up should read `C-18-board-root.md`'s new section first** — it
carries the derivation both of these cards rest on.

**ACCEPTED BY THE ARCHITECT SEAT, 2026-08-31, while `T-112-s4`'s lane was
still open.** The seat that wrote the ruling confirmed the correction and
is amending `T-126-s2` itself: **the DIRECTION stands — the join goes to
TypeScript behind a test path — and the BLOCKER moves from C-18 to C-15.**
`T-112-s4`'s lane did not touch `T-126-s2`, deliberately: a lane does not
edit the card that rules over it.

## HOW THIS CARD'S ID COLLIDED, RECORDED BECAUSE THE GAP IS REAL

This card was first filed as **`T-187`**, which was already taken — by
`T-187-a-lane-based-on-the-newest-checkpoint-reads-a-stale-copy-of-its-own-card…`,
committed to main earlier the same night by a different seat. `T-188` and
`T-189` were taken in the same window. The clash was caught by the
dispatching seat at hand-back and renumbered here to `T-190`.

**Nothing in this method derives the next free id.** The lane picked
`T-187` by listing `docs/tasks/` at its own base commit and taking the
successor of the highest — which is correct at the instant it is run and
stale immediately afterwards, because the id space is **machine-scoped
and shared across concurrent seats** while every lane reads it from a
CHECKOUT-scoped snapshot. That is exactly the scope mismatch
`lane-protocol.md` rule 4's closing paragraph names — *"name the scope of
every surface you depend on, and where the answer is machine, DERIVE the
value from the lane rather than defaulting it"* — and the id space is a
surface that rule's own examples do not list.

**Two seats filing concurrently will keep colliding, and the failure is
silent**: nothing reds, two cards simply share an id until a human
notices. Worth a card of its own — the cheap fix is a derivation
(an id allocated FROM the lane, the way scratch ports already are)
rather than a check, since a check still races.
