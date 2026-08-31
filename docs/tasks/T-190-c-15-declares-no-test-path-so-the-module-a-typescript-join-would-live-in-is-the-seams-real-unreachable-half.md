---
id: T-190
title: C-15 declares no test path, so `dispatch-store.ts` — the module a TypeScript join would live in — is the seam's real unreachable half, and the ruling named C-18 instead
feature: F-04
milestone: 4
priority: 2
size: S
status: verifying
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

## Implementation notes (executor, lane `task/T-190-c-15-declares-no-test-path`)

**THE LANE'S BASE IS `57c1b39`, NOT THE BRIEF'S `a07358d`.** Named up
front by the dispatching seat and filed as `T-187`; every figure below is
re-derived at `57c1b39` and none is transcribed from the brief.

**WHAT CHANGED: one file, and it is prose.**
`docs/architecture/components/C-15-dispatch.md` gains a
`WHY THIS COMPONENT DECLARES NO app/test/** PATH (T-190)` section, in the
shape `C-18-board-root.md` already uses for the sibling case. No source
file was touched, and the registry's `paths:` are unchanged — **that is a
measured decision, not an omission**, and the measurement is drill 1.

### Criterion by criterion

**1. "`C-15-dispatch.md` SHALL declare a test path of its own, or SHALL
state why the dispatch store is deliberately unreachable from a suite."**
**MET on the second arm, because the first arm was measured impossible
from inside this fence.** Adding the `paths:` line reds exactly one body
and that body is in `app/test/architecture-dogfood.test.ts`, which is
**C-12's** (slug `app-map`, routed there at T-149) — no part of an
`[app-dispatch]` fence. The section records the wall, the derivation
commands, and the `touches:` line the next lane needs. **The wording
avoids "deliberately unreachable"**, which would be false: the component
is *accidentally* unreachable and the section says what it costs to fix,
exactly as `T-112-s4` discharged the identical OR on C-18.

**AND WHAT MAKES C-15 SPECIAL IS THE MATCHER — a claim I first wrote
without checking.** Three components have their live `paths:` asserted
anywhere in this repository: C-11 (`app/test/select-board.test.ts`) and
C-05 (`lib/parser/test/fence.test.ts`) both by **`toContain`**, which a
superset satisfies, so either could gain a path silently. **C-15's is the
only exact `toEqual` over a live component's whole array**, which is why
an added entry reds here and nowhere else. Derived with
`command grep -rn '\.paths' app/test lib/parser/test | command grep 'expect'`;
everything else that surfaces is over a fixture registry, not the live
tree.

**2. "A pin SHALL drive `hydrateJoin` … such that a one-sided mutation of
it reds a body."** **NOT BUILT — RECORDED AND ROUTED**, per
TASK-FORMAT's "a criterion that cannot be built inside the fence is not
built". `hydrateJoin` exists today at `app/src/lib/dispatch-store.ts`, so
the criterion's hedge ("or whatever the join's entry point is named") did
not fire — the entry point is there and it is unpinnable. The fence is
`app/src-tauri/src/dispatch`, `app/src/lib/dispatch-store.ts` and this
component's registry file. **No location reachable by that fence is
collected by any test runner**: `app/vitest.config.ts` collects
`test/**/*.test.{ts,tsx}` relative to `app/`, so a body must live under
`app/test/`; in-source testing would need `includeSource` in that config;
and a Rust body under `src/dispatch/` cannot execute TypeScript. **The
card is one token short of its own criterion** — the shape it needed is
`T-112-s6`'s, which names the test FILE in `touches:` — and this is the
"record and route" case rather than a fence to widen.

**3. "The lane SHALL derive, at its own ref, whether anything yet imports
`dispatch-store.ts`, by `import`/`require`/`import()` and never by the
module's name."** **MET.** At `57c1b39`, over `app/src` and `app/test`
from the repository ROOT, all four forms return nothing:

    from "…dispatch-store"            0 hits   exit 1
    bare side-effect import           0 hits   exit 1
    require("…dispatch-store")        0 hits   exit 1
    dynamic import("…dispatch-store") 0 hits   exit 1

**POSITIVE CONTROL (poison shape TEN — an empty comparison reports
agreement):** the identical specifier pattern aimed at `board-model.ts`
returns **12 files** at exit 0. So the zero is a fact about the tree
rather than about the search. The module's NAME occurs 10 times under
`app/`: 5 in `dispatch-store.ts` itself, 5 elsewhere — all of the latter
doc comments except two path literals inside the dogfood census.
**`arch`'s `C-05 -> C-15 undeclared observed=1` is NOT a counter-example**
and is the trap here: it is `lib.rs`'s `pub mod dispatch;`, which carries
an edge since T-135, not a TypeScript import.

**4. "`arch cycles --root ../..` SHALL exit 0 after the change."**
**MET** — exit 0, `ACYCLIC  no declared cycle among 15 components and 43
declared edges`. It was also exit 0 under drill 1's heavier mutant, which
is the stronger reading: a `paths:` move declares no edge.

### Drills

**DRILL 1 — the wall. One side only (the registry), read back, restored,
proven.** Mutation: a third `paths:` entry,
`app/test/dispatch-store.test.ts`, added to this component's frontmatter.
The mutated TEXT was read back before any suite ran (`git diff` through
Bash is refused by this session's harness classifier; the file itself was
re-read instead, and the sha256 below is the proof the drill bullet calls
authoritative).

| run | base `57c1b39` | under the mutant |
|---|---|---|
| `npm test` from app/ | 49 files / 1094 tests, **exit 0** | **1 failed \| 48 passed (49)**, **exit 1** |
| `cargo test --no-fail-fast` | 18 targets, 601 passed / 0 failed / 4 ignored, exit 0 | **identical**, exit 0 |
| `arch cycles` | ACYCLIC, exit 0 | ACYCLIC, exit 0 |
| `arch` summary | `components=15 files=199 mapped=199 unmapped=0 edges=45 findings=4 drift_components=4` | **byte-identical** |
| `index --check` | CURRENT, 199 files / 2446 symbols / 2363 edges | **identical** |

The single failing body, named rather than counted:
`app/test/architecture-dogfood.test.ts > dogfood: the nputer repo through
its own derivation engine > C-15 HAS TERRITORY AT LAST: five files under
its declared globs, D3 cleared`, asserting
`expected [ …(3) ] to deeply equal [ …(2) ]`.

**FAILING-BODY COUNT = 1, which is the answer poison shape SIX asks
for**: the mutation kills exactly one body, so that body is the unique
keeper of C-15's globs — corroborating its own comment that it is
"still the only thing in this tree that pins C-15's globs". **Shape TEN
is answered separately** by criterion 3's positive control above.

**RESTORATION PROVEN BY HASH**, not by an empty diff:
`git restore --source=HEAD --staged --worktree --` then
`shasum -a 256` = `0ad9922d826e8318b947389db90ce31b0fb861a3286248db090601343eb3ce4f`,
identical to `git show HEAD:` before the mutation, with
`git status --porcelain` empty as the companion.

**SCOPE OF THE DRILL, STATED RATHER THAN IMPLIED:** the mutant was run
under `cargo test`, the app suite, `arch`, `arch cycles` and
`index --check`. It was **not** run under `lib/parser`'s vitest or the
e2e lane, both of which the DOCS GATE names as readers of
`docs/architecture/components`. So "exactly one body" is a claim about
those five runs and not about the whole repository.

**DRILL 2 — the fence itself, and it did NOT hold.** Writing
`app/test/dispatch-store.test.ts` — a path outside every entry in
`.nputer/lane-fence.json` — **succeeded**. The file was removed
immediately, `git status --porcelain` (with `--untracked-files=all` over
`app/test`) is empty, and nothing outside the fence survives in this
lane. See "Where the brief was wrong" below: this is a DECLARED limit of
the hook, not a discovery, and it means the fence here was kept by hand.

### Gates, derived from this lane's own diff

The diff is `docs/architecture/components/C-15-dispatch.md` plus this
card. **Derived against the tree this lane's tip WILL have** (both files
are in the final commit), so the notes commit does not move the answer.

- **DOCS GATE — FIRES.** `node tools/e2e/scripts/docs-gate.mjs
  docs/architecture/components/C-15-dispatch.md` run from the repository
  root: **exit 1**, `FIRES — 1 path(s) under docs/ are code inputs`,
  naming four suites: `cargo test` from app/src-tauri/, `npm test` from
  app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/.
  All four were run. **The gate refuses a bare relative path** (exit 2,
  "CALLED WRONG") unless run from the repository root — worth knowing.
- **GRAPH REGEN — NOT OWED.** Trigger is a diff touching
  `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside `docs/`. This diff touches
  two paths, both under `docs/`, neither of those extensions.
  `index --check` is CURRENT at exit 0 on the final tree.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`
  or either manifest. This diff touches none of the three.
- **METHOD EVAL GATE — NOT OWED.** Trigger is `method/**`; zero paths.
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of
  these.

### Routed, and NO ids minted

Per the dispatching seat's instruction and `T-187`'s rule that only the
dispatching seat allocates, these are described rather than filed:

**(a) THE PIN CARD — this card's criterion 2, and the seam's actual
unblock.** `dispatch-store.ts` gets a test file of its own. Its
`touches:` must carry four tokens and the last two are the ones a slug
will not supply:
`[app-dispatch, docs/architecture/components/C-15-dispatch.md,
app/test/dispatch-store.test.ts, app/test/architecture-dogfood.test.ts]`.
It writes the file, adds the `paths:` line, reconciles the dogfood body
(and the tree-wide file-count body) by the T-088 throwaway-probe
technique rather than off a failure, and drives `hydrateJoin` so a
one-sided mutation reds a body with the failing-body count reported.
`C-15-dispatch.md`'s new section is that card's spec. **`T-126-s2`'s
`blocked_by` should move from `T-190` to this card once it exists** — this
card prices the path; it does not lay it.

**(b) `T-112-s6` MAY BE ONE TOKEN SHORT, and it is not this lane's to
fix.** Its `touches:` is `[app-board, app/test/board-root.test.tsx]`.
C-18 has no `paths:` `toEqual` pin, so the registry line is safe there —
but WRITING the file adds a `.ts` to the walk and moves C-18's own
`files` tally in the same dogfood body, whose file is `app-map`'s. That
lane should check whether it needs
`app/test/architecture-dogfood.test.ts` too. **Flagged, not measured** —
it is outside this fence and I did not drill it.

**(c) THE BRIEF ASSERTS AN ENFORCEMENT THE HOOK DECLINES TO PROVIDE.**
See below; worth a card against the brief assembler rather than against
the hook.

### Where the brief was wrong

**1. The base commit — disclosed by the dispatcher, confirmed here.**
`.nputer/BRIEF.md` row 4 derives `base commit:
a07358da96e9cd02bce386c9fd0c1b114d937283`; this worktree is at
`57c1b394440579a780edb7d1be44356cfbb69177`. Filed as `T-187`. Every other
derived row matched the tree.

**2. "A PreToolUse hook enforces it" is FALSE for this session's shape,
and the hook says so itself.** `.claude/settings.json` does point a
`PreToolUse` matcher at `.claude/hooks/lane-fence-hook.mjs`. But
`decide()` stands aside on two independent arms that both apply here:
the writing checkout is on `claude/adoring-nash-028cf4`, which is not a
`task/T-NNN-<slug>` branch, and every path written into
`/Users/ujju/Projects/nputer-T-190` is outside that checkout's root.
**Limit 2 in `lane-fence.mjs`'s own header names this exact
configuration** — *"the hook has no term that separates an architect
reaching into a lane from THE LANE'S OWN EXECUTOR writing into it from a
shell parked elsewhere — a live shape, and the one this very card was
built in"* — and declines the four-line fix on purpose, because a guard
that refuses the executor it serves is worse than the hole. **So the hole
is declared, not a defect; the defect is the brief calling it
enforcement.** The consequence for a verifier: **this lane's fence was
kept as a DISCIPLINE and not by a mechanism**, which is exactly the
disclosure `roles/executor.md` requires when a guarantee is really a
habit. Drill 2 is the measurement, and the out-of-fence file it created
was removed.

**3. The card's own criterion 2 outruns the card's own fence.** Named
here because TASK-FORMAT calls that defective by definition and
prescribes record-and-route, which is what happened.

### For the verifier

- The whole diff is prose in two files; there is **no new test body**, so
  the poison drill's "mutate every new or changed assertion" has an empty
  subject. The drills above mutate the REGISTRY to measure a wall, which
  is the only mutable thing this fence contains.
- **The claim most worth attacking** is criterion 3's zero. Re-run the
  four import forms at your own ref and check the positive control comes
  back non-empty; a zero with a dead control proves nothing.
- **The second** is "exactly one body". Its scope is the five runs listed
  under drill 1; `lib/parser` and the e2e lane were not run under the
  mutant.
- **The third** is the ownership claim about
  `app/test/architecture-dogfood.test.ts`. I wrote `C-05` first from
  memory and the derivation said `C-12`; the file now carries the
  derivation command and the correction. Re-derive it rather than
  trusting either sentence.
