---
id: C-15
name: Dispatch
layer: app
paths:
  - app/src-tauri/src/dispatch/**
  - app/src/lib/dispatch-store.ts
  - app/test/dispatch-store.test.ts
depends_on: [C-10]
decisions: [ADR-009, ADR-012, ADR-017]
status: auto
touch_slugs: [app-dispatch]
---
The dispatch surface (F-04), declared before it is a directory. A lane
is a fact git already wrote down — `<repo>/.git/worktrees/*/gitdir` and
`*/HEAD` — so the Rust half READS those files and runs no subprocess,
and the TS half mirrors the typed lane list and joins it against the
board. The join's PRODUCT is the disagreement: a `building` stamp with
no worktree is a lane that died, a worktree with no stamp is a dispatch
that skipped it. Data for the board half arrives on C-10's existing
docs path — no new watcher and no second source of truth. Follower
first (`docs/rooms/cockpit-or-mirror.md`, ruled 2026-08-20): the brief
is assembled for a HUMAN to paste into whatever agent they already
have, which covers agents that exist only as desktop apps and can never
be spawned; the spawn path follows and is not this component's promise
yet. Zero webview grants — the reader is Rust-side (ADR-012) — and
every collection keyed by a branch name, worktree name or task id is a
Map or a null-prototype object, because those are strings this project
does not author (ADR-009).

**WHY THIS IS DECLARED AND C-02/C-03/C-04 ARE NOT.** A component file
may only be written where a doc has DECIDED where the code will live.
`docs/design/dispatch-technical-plan.md`'s D2 decided this one — the
two paths above are that ruling, not a guess — which is the same
footing C-07 was declared on before its binary existed. The CLI, the
runtime and the daemon have no such ruling: no doc says where their
code goes, so any `paths` glob for them would be INVENTED, and
T-008-s1's re-park stands until one does. The fence word comes first
because without it every dispatch card inherits `app-agent` and
serialises against every genesis card for the life of the feature, for
no reason but a missing declaration.

**`tests/dispatch_lanes.rs` IS GONE, AND THE SETTLEMENT IT DISCLOSED IS
MOOT (T-126, `0fa83da`).** T-110 wrote that file as a two-line `#[path]`
shim so `cargo test` could reach `src/dispatch/**` while no module
declared it — and T-033 claimed it here rather than leaving the tree's
only unmapped file. **T-126 declared the module in `lib.rs`, which made
the shim compile the same code twice and run its bodies twice, so it was
deleted.** The `paths:` entry went with it in the eleventh triage's
cleanup; this paragraph is kept, rewritten, because the settlement it
records is why the entry existed at all.

**WHY THIS COMPONENT DECLARED NO `app/test/**` PATH, AND WHAT IT COST TO
GAIN ONE (T-190 priced it; `T-198` crossed it).**

**READ THIS SECTION AS A RECORD, NOT AS THE CURRENT STATE.** The
`paths:` array above now carries `app/test/dispatch-store.test.ts` and
`hydrateJoin` is driven by a collected body; `T-198`'s section at the
bottom of this file is what changed and what stayed true. Everything
between here and there is `T-190`'s measurement, kept verbatim because
the price it established is the reason the crossing was affordable — and
because two of its sentences turned out to be wrong in ways worth
keeping visible.

This is the answer to `T-126-s2`'s test-reachability blocker, recorded
here so the next lane does not re-derive it. Its sibling case is written
up one component over in `C-18-board-root.md`, and **the two walls are
NOT the same wall** — which is the finding.

**NOTHING IMPORTS `dispatch-store.ts`, MEASURED RATHER THAN REMEMBERED**
(at `57c1b39`). Four forms were searched over `app/src` and `app/test`
from the repository ROOT — a `from "…"` specifier, a bare side-effect
`import`, `require(`, and a dynamic `import(` — and every one returned
nothing. **The zero is evidence rather than a miss because the same
specifier pattern aimed at `board-model.ts` returns twelve files**: a
search-based claim is run once against a known hit before its zero is
written down (docs/CONVENTIONS.md, POISON DRILL and shape TEN). Every
occurrence of the module's NAME is a doc comment or a path literal inside
a registry census — the "census satisfied by a MENTION rather than by a
USE" family the `T-126-s2` sitting nearly booked a decision on.
**`arch`'s `C-05 -> C-15 observed=1` is NOT a TypeScript import** and a
reader will mistake it for one: it is `lib.rs`'s `pub mod dispatch;`,
which has carried an edge since T-135.

**THE WALL IS A FIXTURE, IT IS EXACTLY ONE BODY, AND IT IS OUTSIDE
`[app-dispatch]`.** Adding a third `paths:` entry here was PERFORMED
rather than forecast — one side only, the registry side, restored and
proven by sha256:

    app/test/architecture-dogfood.test.ts
      "C-15 HAS TERRITORY AT LAST: five files under its declared globs,
       D3 cleared"
      AssertionError: expected [ …(3) ] to deeply equal [ …(2) ]
      npm test from app/   1 failed | 48 passed (49 files)   exit 1

and **nothing else moved**: `cargo test --no-fail-fast` stayed at its
baseline over 18 targets, `arch cycles` stayed ACYCLIC, and `arch`'s
summary line and C-15 row came back byte-identical to base, as did
`index --check`'s. **So a dangling declaration is invisible to every gate
in this repository except that one fixture** — the same silence the
eleventh triage recorded when `tests/dispatch_lanes.rs`'s glob outlived
its file by nine merges.

**AND IT IS NOT OWNED BY WHO YOU WOULD GUESS — DERIVE IT:**

    command grep -n 'architecture-dogfood' docs/architecture/components/*.md

`app/test/architecture-dogfood.test.ts` is **`C-12-map-pane.md`'s**, slug
`app-map`, routed there at T-149 with the other fifteen tests that drive
the map. It is NOT C-05's: T-149 replaced that component's `app/test/**`
umbrella with sixteen files named one by one, and this is not among
them — C-05's only mention of the file is prose. **This section said
`app-shell` until the claim was derived rather than remembered**, which
is the same motion this whole section is about. Either way the
conclusion holds and is what matters: **a fence expanding from
`[app-dispatch]` reaches no part of it.**

**AND THAT IS WHERE C-15 DIFFERS FROM C-18 — IT IS THE MATCHER, NOT THE
FACT OF BEING PINNED.** Derive it, do not trust this sentence:

    command grep -rn '\.paths' app/test lib/parser/test | command grep 'expect'

Three components have their LIVE `paths:` asserted anywhere in this
repository. **Two of the three use `toContain`** — C-11 in
`app/test/select-board.test.ts` and C-05 in `lib/parser/test/fence.test.ts`
— and a `toContain` is satisfied by a superset, so those components can
gain a path without reddening anything. **C-15's is the only exact
`toEqual` over a live component's whole array**, which is why an ADDED
entry reds here and nowhere else. (Everything else that matcher-greps
into view is over a fixture registry, not the live tree.)

C-18 has no such pin at all, which is why `T-112-s6` may add its registry
line and its file in one lane while the equivalent card here cannot:
C-18's obstacle was the ORDER alone, and C-15's is the order PLUS an
exact-array fixture in a third component's territory. The fixture is not
a defect — its own comment says it is deliberately the only thing pinning
these globs — and it is exactly the keeper that makes this component's
territory unwidenable from inside it.

**WHAT THE NEXT LANE MUST CARRY, so it is taken rather than re-derived.**
Four tokens, and the last two are the ones a slug will not supply:

    touches: [app-dispatch,
              docs/architecture/components/C-15-dispatch.md,
              app/test/dispatch-store.test.ts,
              app/test/architecture-dogfood.test.ts]

The slug reaches the source; the registry FILE is never inside a
component's own `paths:` (the rule `C-18-board-root.md` states); the test
file must be named because the slug expands to this component's `paths:`
**as they stood at dispatch**; and the fixture file must be named because
of the wall above.

**AND THE RECONCILIATION IS WIDER THAN THE ASSERTION THAT REDS FIRST.**
The drill above moved only the `paths:` array because no file existed;
a lane that also WRITES the file moves `c15?.files`, the `fileComponent`
tally and the tree-wide file-count body with it, and adds a `.ts` file to
the walk, so `index --check` goes STALE until the merge's GRAPH REGEN.

> **THIS PARAGRAPH IS WRONG ABOUT THE TIMING AND `T-198` MEASURED IT
> WRONG — corrected here rather than deleted, because the forecast is
> the kind a next lane acts on.** Those three tallies do NOT move
> in-lane. `architecture-dogfood.test.ts`'s `liveModel()` parses the
> registry LIVE but reads the graph from the **committed**
> `docs/architecture/graph.json`, which a lane does not regenerate
> (T-009-s1) — so with the registry line added AND the file written,
> a throwaway probe at `T-198`'s ref returned `c15?.files` still SIX,
> the `fileComponent` C-15 tally still SIX, `fileComponent.size` still
> 199, findings `[]` and issues `[]`. **Exactly one assertion moves in
> the lane: the `paths:` array.** The rest move at the merge's GRAPH
> REGEN, where C-15 goes 6 → 7 files and the tree-wide count 199 → 200.
> `T-190`'s own blind verifier reached the same result independently
> (its non-blocking observation 2, measured as `1 failed | 49 passed
> (50)` with the file written and declared) — so this is two
> measurements agreeing against one forecast. The forecast's DIRECTION
> is right and only its timing is wrong, which is exactly what makes it
> dangerous: a lane that budgets for four reds and meets one will go
> looking for the missing three.
**No tally is written here on purpose** — the first red in that body
hides the ones below it, and the file's own remedy is the T-088
technique it documents: derive the new values from a throwaway probe
against the regenerated graph BEFORE running the suite, never off a
failure. **Every edge such a file needs is already declared**: it imports
`dispatch-store.ts`, which is C-15's own, so it adds no cross-component
edge and `arch cycles` does not move.

**WHAT THIS UNBLOCKS, AND WHAT IT DOES NOT.** `T-126-s2`'s ruling stands
and its DIRECTION is untouched — the join goes to TypeScript behind a
test path. What this section supplies is the price of that path,
measured. It does not supply the path: `hydrateJoin` is still driven by
nothing, and a one-sided mutation of it still reds no body anywhere.

> **THAT LAST SENTENCE STOPPED BEING TRUE AT `T-198`, WHICH IS THE WHOLE
> POINT OF THIS FILE'S HISTORY.** It was true when written, survived a
> deliberate falsification attempt by `T-190`'s blind verifier, and is
> now false by construction: `app/test/dispatch-store.test.ts` drives
> `hydrateJoin` from a collected body, and the canonical one-side-only
> mutant — deleting `rows.set(row.taskId, row)` — reds. See the `T-198`
> section at the foot of this file for the mutants and their
> failing-body counts.

**IT MAKES `T-185` AND `T-195` CHEAPER, AND BY DIFFERENT AMOUNTS.**
`T-185`'s fourth criterion asks for a body CONSTRUCTING a reading with a
populated `notLanes` and one with `truncated: true`, which needs a file
importing both `dispatch-store.ts` and `board-model.ts`; that file is the
one routed above, and `T-185`'s own note already says the criterion is
unbuildable without it — so the routed card is its precondition and this
section is that card's spec. `T-195` is cheaper only if its pin lands on
the WIRE side; its own first decision points the other way, at
`task-detail.ts`, which `app/test/select-task-detail.test.ts` already
drives and which needs none of this. **So this section is load-bearing
for `T-185` and optional for `T-195`**, and `T-195`'s lane should read
that as permission to take the presentation side rather than to wait.