---
id: T-127
title: T-033 killed three of the four registry cycles and left the fence word behind — one cycle survives, no gate stops the next one, and app-shell still expands to four components holding 21 of 36 planned cards
feature: F-06
milestone: 4
priority: 6
size: M
status: planned
blocked_by: [T-033]
touches: [crate-index, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (when filed): `T-033-s10` and `T-033-s7`, both of which land with
T-033's merge. This card is the answer to the question `T-033-s7` asks.

## ARCHITECT'S RULING on T-033-s10 — 2026-08-25

T-033's lane filed `T-033-s10`: `C-08 ↔ C-09` is a **declared cycle that
predates @human's "no cycles" ruling by nine days**, and it asked whether
the ruling reaches backwards.

**It does, and the retroactivity question dissolves once the cycle is
measured rather than argued about — because satisfying the ruling costs
ZERO lines of behaviour.** The ruling stands as given.

## What was measured, and CREDIT WHERE IT IS DUE

**Derived, not read by eye** — reading by eye is what produced an
undercount the first time this was attempted. Two derivations were run:
a DFS for simple cycles over `depends_on:` parsed from all component
frontmatter, and an independent walk of the real import graph (every
`.ts`/`.tsx` under `app/src`, `@/…` and relative specifiers resolved to
files, files mapped to components by the registry's `paths:` globs,
Tarjan for file-level SCCs).

| | main `b505fca` | T-033 tip `935693f` |
|---|---|---|
| files walked / import edges | 51 / 133 | 51 / 133 |
| **file-level cycles** | **0** | **0** |
| files owned by no component | 0 | 0 |
| components carrying undeclared-real edges | **4** | **0** |
| **component cycles implied by REAL imports** | **9** | **1** |
| component cycles from DECLARED `depends_on` | 2 | 1 |
| components under `app-shell` | 3 | **4** |

**THE REAL IMPORT GRAPH ON MAIN IMPLIES NINE CYCLES WHILE ONLY TWO ARE
DECLARED.** The seven hidden ones were masked by drift — `C-08`, `C-09`
and `C-13` really import `@/lib/utils` and `@/lib/verdicts` (C-05) while
declaring nothing, and C-05 really imports C-13. **So the drift was not
untidiness; it was concealing cycle violations**, and a drift fix that
declared the real edges without moving a boundary would have *created*
seven declared cycles. A drift fix and a cycle fix that each break the
other if done alone.

**T-033 DID BOTH AT ONCE.** It extracts `C-16 Shared primitives`
(`app/src/components/ui/**`, `lib/utils.ts`, `lib/verdicts.ts`) with
`depends_on: []` **derived rather than asserted**, and re-points C-08,
C-09, C-12 and C-13 at C-16 instead of at the shell. On its tip,
real-import cycles fall from **9 to 1**, drift falls to **zero**, and
**declared equals real exactly (1 = 1)** — which is what "zero drift"
ought to mean. **Eight of main's nine cycles passed through C-05**, so
one extraction accounts for all of them.

That is the right fix arrived at from the drift side, and this card
should not re-litigate it. **What is left is a survivor, a missing gate,
and a fence word.**

## ONE — why the survivor survives, and why the fix is not to sever an import

**A CYCLE BETWEEN TWO NODES WHOSE UNDERLYING FILES FORM A DAG IS
EVIDENCE ABOUT THE NODE BOUNDARY, NOT ABOUT THE CODE.**

**The file import graph is a DAG on BOTH refs — zero cycles over 51 files
and 133 edges, by Tarjan, with zero files owned by no component.** So
`C-08 ↔ C-09` cannot be a real import cycle. It is where the node
boundary was drawn: C-09's files sit *between* C-08's in topological
order, four alternations deep —

    board-model.ts (C-08) -> task-detail.ts (C-09) -> TaskCard.tsx (C-08)
      -> TaskDetailPanel.tsx (C-09) -> FeatureColumn.tsx / Board.tsx (C-08)

The two edges that close the component cycle are:

    TaskCard.tsx (C-08):3         imports cardRef           from task-detail.ts (C-09)
    TaskDetailPanel.tsx (C-09):12 imports CHIP_BORDER_CLASSES,
                                          STATUS_CLASSES    from TaskCard.tsx (C-08)

Both imports are *correct*. `cardRef` is board vocabulary that happens to
live in the detail module; the class constants are status presentation
that happens to live in the card component. **Neither should be severed
to please a diagram** — that makes the code worse to make the picture
better, and this card explicitly forbids it.

**LIMITS OF THE DERIVATION, so the next reader can discount it
properly**: it walks only `app/src/**`, so `app/test/**`,
`app/src-tauri/**`, `lib/parser/**` and `tools/e2e/**` are outside it; it
ignores bare package specifiers; it resolves `@/` to `app/src/` by
convention rather than by reading `tsconfig`/`vite.config`; a file
matched by more than one component's globs is credited to all of them;
and it reads static `import`/`export … from` only, so a dynamic
`import()` is invisible to it. **Any of those could hide an edge**, which
is the reason the gate below belongs in `nputer-index` — which already
walks the whole tree — rather than staying a script.

## TWO — the ruling has no gate, so it is a suggestion with a strong voice

@human ruled "no cycles". **Nothing enforces it.** T-033 removed three
cycles by hand and nothing prevents the next `depends_on:` line from
restoring one — including T-033's own merge, whose reviewer had to take
the acyclicity on trust because no command answers the question.

**A ruling without a gate decays at exactly the rate people forget it.**

## THREE — the fence word was left behind, and that is the expensive half

`T-033-s7` asks, in as many words, whether shared primitives should have
their own fence word. **C-16 ships with `touch_slugs: [app-shell]`** — so
the extraction created a component and NOT a fence. **On this one axis
the tip is measurably worse than main: `app-shell` goes from three
components to four.** That is a routed consequence rather than an
unnoticed regression — `T-033-s7` names it — but it means the throughput
problem was not merely left unfixed; it was made one node larger. After
T-033, `app-shell` expands to **four** components:

    C-05 App                 touch_slugs: [app-shell]
    C-10 Docs watcher        touch_slugs: [app-shell]
    C-11 Design tokens       touch_slugs: [app-shell, app-board]
    C-16 Shared primitives   touch_slugs: [app-shell]

**`touch_slugs:` turns a node boundary into a LOCK, and this one locks
almost everything.** Measured over `docs/tasks/` at `765924d`:

| slug | cards wanting it (planned + parked + building) |
|---|---|
| **`app-shell`** | **22** |
| `tools/e2e` | 9 |
| `docs/CONVENTIONS.md` | 8 |
| `app-agent` | 7 |
| `app-map` | 6 |
| every other slug | 2 or fewer |

**21 of the 36 planned cards want `app-shell`. Nine want NOTHING ELSE** —
`T-126`, `T-022`, `T-035`, `T-044`, `T-115`, `T-114`, `T-099`, `T-100`,
`T-106`. Those nine cannot run two at a time, ever, whatever else is
idle, because they name the same word.

**AND THE WORD SPANS FIVE UNRELATED CONCERNS**: the shell proper, the
docs watcher, the design tokens, the shared primitives, and — still —
every app test plus the whole Tauri plumbing inside C-05.

**`T-126` is priority 5, the second-highest card on the board, and it
needs one `mod` line and one command registration in `lib.rs`.** It waits
behind a registry lane that never opens `lib.rs`. **That is not collision
avoidance; it is a hash collision in the naming scheme** — and it is the
same shape as the ruling on `T-108`, whose `[docs/tasks/]` directory
fence collided with the lane protocol itself.

**This is the answer `T-033-s7` was owed: yes, and here is the number.**

## FIVE — the demand side, and the one-line fix that is NOT this card's

**The tenth triage (2026-08-25) measured the same word from the other
end and got a larger number**: **57 of 126 cards' `touches:` lists name
`app-shell`**, no other slug exceeding 21, and **fifteen of its
twenty-three promotions sit behind one lane.** Its conclusion is worth
quoting as the demand-side statement of this card's supply-side one:
*the queue is not long because there is a lot of work; it is long because
one word owns most of the tree.*

**AND IT FOUND THE MECHANISM THAT MAKES `app-shell` UNAVOIDABLE RATHER
THAN MERELY POPULAR.** `app/vitest.config.ts` collects
`include: ["test/**/*.test.{ts,tsx}"]` and nothing else, and that file
plus `app/test/**` are C-05's. **So every TypeScript pin in this
repository must be written by a lane holding `app-shell`** — five of the
eight slugs cannot hold a test assertion at all. Rust has no equivalent,
because `#[cfg(test)] mod tests` lives inside the module it tests.

The cost is on the record four times, each filed as a local surprise:
T-015 built nothing; **T-110's first pass was REJECTED** for shipping an
unpinned TypeScript join; **T-107 shipped with criterion 5 unmet**, its
verifier proving by positive control that a colocated body is invisible
to the collector (exit 0 at 958/958) while the same body under a
collector that sees the glob exits 1; and T-111 was unbuildable in its
own fence.

**THAT FIX IS ONE LINE AND IT IS NOT THIS CARD'S** — adding
`src/**/*.test.{ts,tsx}` to that `include`. It is promoted separately as
`T-031-s4`, at higher priority than this card, and it is named here only
so the two are not solved twice. **This card moves node boundaries;
that one moves a collector glob. They relieve the same slug from
opposite directions and neither substitutes for the other.**

## Acceptance criteria

- **THE CYCLE CENSUS SHALL BE DERIVED, NOT READ**, and stated before and
  after at this card's own ref. Reading by eye is what undercounted four
  cycles as one.
- **THE FILE-LEVEL DAG CLAIM SHALL BE MADE BY DERIVATION AND MADE
  GLOBAL.** For every declared cycle, show whether a cycle exists among
  the underlying FILES. IF one does THEN it is a real design defect and
  SHALL be routed as its own card — **the rule cuts both ways, and a
  boundary moved to hide a real file cycle is worse than the cycle.**
- **EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL BE GONE, AND NO
  IMPORT SHALL BE SEVERED TO DO IT.** The criterion is deliberately
  written over the *census* rather than over `C-08 ↔ C-09` by name.
  **On main today there are TWO** — `C-08 ↔ C-09` and `C-05 ↔ C-12` —
  and only T-033's tip has one. This card is `blocked_by: [T-033]`, so on
  the expected path a single cycle remains; but a criterion that names one
  cycle closes one cycle, and **if T-033 is re-scoped or lands
  differently this card would ship having satisfied its own wording while
  leaving a violation standing.** Naming the census instead makes the
  criterion true under either history. (Found by the tenth triage, which
  checked this card's criteria against main rather than against the
  branch it was written from — the same discipline the card demands of
  its own figures, applied to it.) No behaviour changes and no file moves
  on disk; the fix is which node claims which path. IF the executor
  concludes a source file must actually move or an import must actually
  change, THEN that is a different card and SHALL be routed.
- **A GATE SHALL MAKE A REINTRODUCED CYCLE FAIL, AND IT SHALL FAIL
  TODAY.** Its natural home is `nputer-index`, which already walks the
  registry and already answers `index --check` — decide there or argue
  for the docs lint, and say which and why. **Run it against the pre-fix
  registry and require the RED**, because an assertion that cannot fail
  against today's tree is a defect (`T-080-s1`); record that run and its
  message. **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL**: prove it
  passes a genuinely acyclic registry as well as failing a cyclic one.
- **THE GATE SHALL NAME THE CYCLE AS A PATH** (`C-08 -> C-09 -> C-08`),
  never as a bare "cycle detected". A gate that says only that something
  is wrong sends the next reader to redo this card's measurement.
- **`T-033-s7` SHALL BE ANSWERED WITH A DECISION, NOT A DISCUSSION**:
  does `C-16` get its own fence word, and do `C-10` and `C-11`? **Re-derive
  the slug-demand census at this card's own ref** rather than quoting the
  table above — it counts a directory that changes every time a card is
  filed, which is the exact defect `T-108` is about.
- **THE BENEFIT SHALL BE QUANTIFIED BY NAME.** State how many of the nine
  `app-shell`-only cards become concurrent under the proposed slugs,
  **having read what each of them actually touches** rather than assuming.
  IF the answer is "few" THEN say so — a re-partition that does not
  relieve the queue bought a cleaner diagram at the price of a fence
  migration, and that is a result worth reporting rather than burying.
- **THE FENCE CONSEQUENCES SHALL BE WRITTEN BEFORE THE REGISTRY MOVES.**
  `touch_slugs:` is what `touches:` expands to, so re-drawing a word
  re-draws every queued card's fence. Say which slug loses paths and what
  that does to the cards fenced on it — `T-111`/`T-112` on `app-board`,
  and the nine above on `app-shell`. **A silent fence change is worse
  than a loud one**: a lane that thinks it holds a path it no longer
  holds is the disjointness bug `T-111-s1` recorded, from the other side.
- **THE LANDING SHALL BE SEQUENCED, NOT MERELY CORRECT.** State which
  lanes were live at the merge, and do NOT merge while a lane holds a
  slug whose paths move. IF lanes are live THEN wait or route.

Verification: headless — bare `cargo test` from `app/src-tauri`
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines and the count derived), plus `npm test` and
`npm run build` from `app/` if any slug expansion the frontend reads
moves. **GRAPH REGEN fires on `*.rs` since `e1f3023` and on
`docs/architecture/` paths a code suite reads** — ask
`cargo run -p nputer-index -- index --check --root ../..` rather than
predicting. The DOCS GATE fires on `docs/architecture/components/**`.
**POISON DRILL on the new gate, one side only, the REGISTRY mutated and
never the assertion** — add a `depends_on:` edge that closes a cycle,
read the mutated text back with `git diff` before the run, require the
RED, restore proved per-path by sha256 at the drill's own commit, in a
detached scratch worktree with its own `CARGO_TARGET_DIR` inside it,
named for the lane and placed OUTSIDE the repository (`T-052-s2`).
@human: none — this is a derivation with a gate, and nothing in it is a
taste call.
