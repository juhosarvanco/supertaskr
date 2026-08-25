---
id: T-127
title: T-033 killed three of the four registry cycles and left the fence word behind — one cycle survives, no gate stops the next one, and app-shell still expands to four components holding 21 of 36 planned cards
feature: F-06
milestone: 4
priority: 6
size: M
status: verifying
blocked_by: []
touches: [crate-index, docs/architecture/components/]
builder: claude-opus-5
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

## Implementation notes — 2026-08-25, `claude-opus-5 @T-127`

Lane `task/T-127-registry-cycle-gate`, worktree `/Users/ujju/Projects/nputer-T-127`,
cut from `afe23c1`. **Every figure below was re-derived at this lane's own
ref; nothing in the card's tables survived unchanged, and that is the
card's own instruction working rather than a surprise.**

### THE CENSUS, DERIVED BOTH TIMES — AND THE CARD'S FIGURE OF TWO IS STALE

DFS for simple cycles over `depends_on:` parsed from all thirteen
`docs/architecture/components/C-*.md` frontmatter blocks, cross-checked
against `nputer-index arch`'s own edge table.

| | at `afe23c1` (BEFORE) | at this lane's tip (AFTER) |
|---|---|---|
| components | 13 | 13 |
| declared edges (dangling excluded) | 35 | 35 |
| **declared cycles** | **1 — `C-08 -> C-09 -> C-08`** | **1 — unchanged** |

**The card says *"On main today there are TWO — `C-08 ↔ C-09` and
`C-05 ↔ C-12`"*. There is ONE.** T-033 dropped `C-12 -> C-05`, and
`C-12-map-pane.md` carries the note. This is exactly why the criterion
was written over the CENSUS instead of over a named pair: it stayed
checkable under a history that moved, and a criterion naming `C-08 ↔
C-09` would have shipped this card believing it closed everything.

**THE CENSUS DID NOT MOVE, because the fix is OUT OF FENCE.** See
criterion 3 below; it is routed as `T-127-s1` with the measurement.

### THE FILE-LEVEL DAG CLAIM, MADE GLOBAL — AND IT IS FALSE AS THE CARD STATES IT

Tarjan over the whole committed graph rather than the card's 51-file
`app/src/**` walk:

| edge kinds | file nodes | file edges | SCCs of size > 1 |
|---|---|---|---|
| `import` only | 166 | 379 | **1** |
| `import` + `call` + `type_ref` | 166 | 897 | **1**, the same one |

The one SCC is `resolve/{mod,rust,ts,tsconfig}.rs`, **entirely inside
C-07** — idiomatic Rust `use super::` against a parent module, not a
compilation cycle and not a design defect. Filed as `T-127-s3` so the
card's *"the file import graph is a DAG"* stops being repeated
unqualified.

**FOR THE DECLARED CYCLE ITSELF THE ANSWER IS THE CARD'S**: none of
C-08's ten files and C-09's three takes part in any SCC, so
`C-08 ↔ C-09` is evidence about the node boundary and not about the
code, and criterion 2's "route it as a real design defect" clause does
NOT fire. **The card's account of the closing edges is nonetheless wrong
in the specifics** — see "Where the card and the brief were wrong".

### THE GATE

`nputer-index arch cycles [--root DIR]`, in `src/arch/cycles.rs`.

**Decided there rather than in the docs lint, and here is why.** The
docs lint's corpus is `git ls-files` text and its question is *"which
suites does this diff owe?"*; a cycle is a topology fact about a graph
somebody has to build, and `nputer-index` already reads this registry
through one hardened reader (ADR-015) that REFUSES rather than guesses.
Three properties follow that a lint could not have:

- **It reads the REGISTRY ONLY** — no graph, no index. `arch` and `arch
  drift` are exit 3 without a committed `graph.json`; this is not, and
  it therefore cannot be a false red from a stale graph. `index --check`
  stays the one staleness gate.
- **It is not a drift finding.** Adding a D6 was considered and REJECTED:
  it would move `arch`'s `summary findings=` and `drift=` columns, and it
  would diverge from the TypeScript engine, which computes findings and
  would not gain it — the `T-033-s11` two-engines shape, bought for
  nothing. `arch`/`arch drift` output is byte-unchanged by this card.
- **The ENFORCING copy is `cargo test`, not the command.** A subcommand
  nobody runs is the suggestion-with-a-strong-voice the card complains
  about. `tests/arch.rs` pins the live census against
  `KNOWN_DECLARED_CYCLES`, an EXACT SET, so a new cycle reds today and a
  stale allowlist entry reds the day `T-127-s1` lands.

**IT NAMES THE CYCLE AS A PATH**, rotated to its numerically-lowest
member so one cycle has exactly one spelling, and a self-declaration is
`C-01 -> C-01`. The walk is ITERATIVE with an explicit stack — T-129's
lesson, since a blown stack in this crate is an `abort()` — and capped at
`MAX_CYCLES = 64` with the truncation stated, because simple-cycle count
is exponential and the registry directory is writable by anyone.

**WHAT THE GATE'S CLAIM RESTS ON, AND WHAT IT CANNOT SEE — printed on
EVERY run, green included.** The verdict is about DECLARED `depends_on:`
edges. It says nothing about observed imports, and the observed side has
a measured blind spot. Re-derived at `afe23c1` over `graph.json` rather
than taken from the brief: **1907 edges — Rust 143, every one an
`import`, ZERO `call` and ZERO `type_ref`; TypeScript 1764 across all
three kinds (508/552/704).** A Rust `mod` declaration plus a path
expression yields no edge at all (`T-126-s4`), so **a cycle made only of
Rust `mod` dependencies is invisible to BOTH sides**. A green from this
gate is a green about declarations; it is not a green about the code, and
the report says so in as many words rather than leaving it to be
inferred. *(The brief said Rust emitted 139 edges. At this ref it is
143.)*

**The lane's own diff demonstrates the blind spot**: `index --check`
reports the three edges `cycles.rs` adds, and **all three are `import`;
it contributes no `call` and no `type_ref`.**

### THE RED, AND THE POSITIVE CONTROL

    $ cargo run -q -p nputer-index -- arch cycles --root ../..
    cycles  source=declared depends_on  root=../..  registry=docs/architecture/components  components=13  declared_edges=35
    cycle  C-08 -> C-09 -> C-08
    verdict  DECLARED CYCLE  1 cycle(s) among 13 components - the registry is not acyclic
    note  this verdict is about DECLARED depends_on only; it is not a claim about observed imports
    note  the observed side (`arch drift`) sees `import` edges only - a Rust `mod` declaration plus a
    note  path expression yields no edge at all (T-126-s4), so a cycle made of those is invisible to BOTH
    exit=1

**POSITIVE CONTROLS, three of them, because a negative assertion needs
one**: a fixture DIAMOND (the shape a naive `visited` walk calls a cycle)
is green and states its own corpus; `clean-repo` is green through the
real process with no graph on disk; and — against the LIVE corpus rather
than a fixture — `the_live_registry_minus_one_hop_per_reported_cycle_is_acyclic`
drops the closing hop of every reported cycle and requires ACYCLIC, which
on the day `T-127-s1` lands degenerates to asserting the live tree
itself rather than going vacuous.

### CRITERION 3 IS NOT BUILT, AND THE REASON IS A MEASUREMENT

*"EVERY DECLARED CYCLE AT THIS CARD'S OWN REF SHALL BE GONE"* — **NOT
BUILT. Routed as `T-127-s1`.** Every acyclic re-partition of C-08/C-09's
`paths:` moves fixtures this fence cannot reach, and it was measured
rather than argued. The SMALLEST one (`TaskDetailPanel.tsx` to C-08,
`board-model.ts` to C-09, `C-08` out of C-09's `depends_on`) was applied
in-lane, read back with `git diff`, run, and reverted:

| | before | after |
|---|---|---|
| declared cycles | 1 | **0** |
| `npm test` from `app/` | 973 / 973, exit 0 | **6 failed / 967 passed, exit 1** |
| `npx vitest run` from `lib/parser` | 268 / 268 | 268 / 268, exit 0 |

The six are in `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — the live-registry fixtures
CONVENTIONS' own gotcha names, pinning the relation table, the findings
list, the drift set (`expected [ 'C-10', 'C-12' ] to deeply equal
[ 'C-10' ]`) and the 36-edge list. **Both are under `app/test/**`, which
is C-05's `app-shell`.** The parser's pin held only because no component
ID changed; declaring one moves it too, and that is `lib-parser`.
Restored, `git diff` empty, sha256 identical per path
(`46efdf15…` C-08, `a9ee45bb…` C-09).

Widening the fence from inside the lane is the one repair this role may
never make (`method/roles/executor.md`), so the gate ships and the move
is routed **with a recommended partition and the reason a smaller one is
wrong** (`T-127-s1`, which also records that folding `Board.tsx` into
C-05 would replace the old cycle with `C-05 ↔ C-13`).

### `T-033-s7`, ANSWERED WITH A DECISION AND A NUMBER

**Answer: its option (a) — LEAVE IT.** Written into `C-16`'s own file,
where the question was asked. Re-derived at this ref rather than quoted:
**NOT ONE** of the eight live `app-shell`-only cards names `ui/**`,
`utils.ts` or `verdicts.ts`, so `app-ui` would relieve **0 of 8** while
narrowing 20 live fences. A slug for `C-11` is the same answer — it owns
zero indexed files.

**THE BENEFIT, QUANTIFIED BY NAME, having read what each of the eight
actually touches**: a dedicated word for **C-10** frees **2 of 8**
outright — `T-114` (`docs_watch.rs` and nothing else, by its own
criterion) and `T-035` (`applySnapshot` in `docs-model.ts`) — and makes
**2 more honest**: `T-044` and `T-106` become `[app-shell,
app-watcher]`, which is what they already hold and do not say. The other
four (`T-022`, `T-099`, `T-100`, `T-115`) stay mutually exclusive.
**Two of eight, not eight of eight — said rather than buried**, which is
what the criterion asked for.

### THE FENCE CONSEQUENCES, WRITTEN BEFORE THE REGISTRY MOVED — AND NO SLUG WAS MOVED

`touch_slugs:` is what `touches:` expands to. **Nothing in this lane
changes a `touch_slugs:` value**, so the fence consequence of what
SHIPPED is nil. What a slug move WOULD cost, enumerated by card id
(`T-127-s2` carries it):

- `app-shell` would give up `docs_watch.rs`, `watcher-store.ts`,
  `docs-model.ts`.
- **Must move in the same commit or silently break: `T-044`, `T-106`**
  (both need `docs_watch.rs`); `T-035` and `T-114` should become
  `[app-watcher]`.
- The other 16 live `app-shell` cards are re-fenced and unaffected — none
  names a C-10 path.
- **`app-board` loses nothing, so `T-111`/`T-112` are untouched** — the
  card asked this to be checked and the answer is a plain no.
- `docs/ARCHITECTURE.md`'s slug block goes stale the moment the field
  moves.

**AND IT WOULD BE COMPLETELY SILENT — MEASURED.** C-10's `touch_slugs:`
was changed to `[app-watcher]` in-lane, read back with `git diff`, and
`npm test` from `app/` came back **973 / 973, exit 0**, though the change
takes C-10's task rollup from 20 cards to zero. Restored, sha256
`b1c82551…` identical. Filed as `T-127-s4`: **declaring a component is
loud and re-drawing a fence is silent**, and the silent one is the one
that changes who may write to a file.

The three cards whose `touches:` would have to move are `docs/tasks/`
placement fields — the ARCHITECT's, by the single-writer rule — and the
slug prose is `docs/ARCHITECTURE.md`. Neither is in this fence, so the
move is SEQUENCED rather than taken.

### THE LANDING, SEQUENCED

**Live lanes, derived by filtering `git worktree list` on the branch and
never on the path, twice.** At dispatch: `T-130` (`[tools/e2e]`) and
`T-132` (`[method/lane-protocol.md, method/roles/integrator.md,
method/tasks/TASK-FORMAT.md]`). At hand-off: **`T-132` only** — T-130 has
merged and its worktree is gone. Three DETACHED non-lanes are present and
are not lanes: `../nputer-app` (the human's app, permanent),
`../arch-verify`, and `../nputer-T-132-verify` (new since dispatch).
**Both live fences are disjoint from `[crate-index,
docs/architecture/components/]`, and no lane holds `app-shell` or
`app-board`** — which is why `T-127-s2` is dispatchable now and why this
card still declines to take it.

Port 1420 read READ-ONLY with `lsof -nP -iTCP:1420 -sTCP:LISTEN` at
2026-08-25 22:31:54 EEST on Mac.lan: `node` pid 88948, `[::1]:1420
(LISTEN)` — the human's app, IPv6 only, as CONVENTIONS records. Never
bound, never connected.

### THE POISON DRILL — eight mutants, ONE SURVIVED, and it changed the code

Detached scratch worktree at `d0494fc`, named for the lane, **OUTSIDE the
repository** (`…/scratchpad/T-127/drill-T-127`), with its **own
`CARGO_TARGET_DIR` inside itself** (`.drilltarget-T-127`, 680 MB cold).
Every mutation read back with `git diff` BEFORE its run; one side only;
whole-suite run each time, because **uniqueness of kill is a claim to be
MEASURED and not asserted**. Drill baseline: `cargo test -p nputer-index
--no-fail-fast` = 11 headers summing 217, 215 passed + 2 ignored, exit 0.

| # | one side mutated | exit | bodies killed / 217 |
|---|---|---|---|
| **M1** | **REGISTRY** — `C-01`'s `depends_on: []` → `[C-06]`, closing `C-01 -> C-06 -> C-01` | **101** | **2** |
| **M2** | **REGISTRY** — `C-08` removed from C-09's `depends_on` (the cycle FIXED, the allowlist left) | **101** | **1** |
| M3 | detector — the closing hop dropped from the reported walk | 101 | **8**, across two binaries |
| M4 | detector — the canonical `next < start` guard removed | 101 | **5** |
| M5 | detector — the three `note` lines deleted from `render` | 101 | **2**, one per binary |
| M6 | detector — `MAX_CYCLES` 64 → 100000 | **0** | **ZERO — SURVIVED** |
| M7 | detector — the de-duplication of `depends_on` targets removed | 101 | **1** |
| M8 | detector — `has_cycle()` → `true` | 101 | **8**, across two binaries |

**M1 IS THE ONE THE CARD PRESCRIBES** and its message is the gate working:

    left:  ["C-01 -> C-06 -> C-01", "C-08 -> C-09 -> C-08"]
    right: ["C-08 -> C-09 -> C-08"]

and the binary against the mutated live registry printed both cycles as
paths at **exit 1**. It killed **2**, not 1 — the reintroduction body
asserts the back edge does not already exist, which M1 plants — and that
coupling is recorded rather than glossed.

**M2 IS THE OTHER DIRECTION AND IT IS WHY THE ALLOWLIST CANNOT ROT**:
removing the cycle without removing its entry reds at `left: []` against
`right: ["C-08 -> C-09 -> C-08"]`. Uniquely — 1 body.

**M6 SURVIVED, AND THAT IS THE DRILL'S REAL RESULT.** Raising the cap
from 64 to 100 000 killed **zero of 217** at exit 0, because every
assertion in `enumeration_is_capped_…` is written in terms of
`MAX_CYCLES` — **A TEST PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT
PIN THAT CONSTANT** (CONVENTIONS, T-063), found by drilling rather than
by reading. Fixed at `1b51d61` with one body pinning the literal, and
**re-drilled: M6b kills exactly 1 body**,
`the_enumeration_cap_is_the_documented_constant`.

**RESTORATION PROVED PER PATH BY sha256**, at the drill's own commit:
`C-01-method.md` `f002b3c3…` before and after; `C-09-detail-panel.md`
`8dd48f90…` before and after; `cycles.rs` `5258eb40…` after every one of
M3, M4, M5, M6, M7, M8; `git status` clean but for the drill's own target
directory. **The drill's target dir is the only thing it wrote**: the
lane's `app/src-tauri/target` mtime (22:16:06) predates the drill's first
build (22:22:26), and the main checkout was never built in. The drill
worktree and its target dir were removed afterwards.

**A ninth measurement is in the notes above rather than the table**: the
two in-lane diagnostic mutations that established criterion 3 is out of
fence (the acyclic re-partition, and the `touch_slugs:` change) were
producer-side, read back with `git diff`, and restored with sha256 proof
— but they were run IN LANE rather than in the drill worktree, because
they measure the APP suite (which needs `node_modules` and `app/dist` a
fresh worktree lacks) and they assert nothing new. Said plainly rather
than filed as drills.

### THE RANGE, AND ITS REF

Main moved under this lane: `afe23c1` at dispatch, **`93f8656`** when the
range was taken.

    git merge-tree --write-tree 93f8656 HEAD   ->  exit 0  (read from $? FIRST), tree affc40f…
    git diff --name-only 93f8656 <TREE>        ->  12 paths   THE PRESCRIBED PRE-MERGE FORM

Never `<merge-base>..<tip>`, never `main..HEAD`. Re-derive at the
integrator's own main; this one is a function of `93f8656`.

### GATES, DERIVED FROM THE DIFF RATHER THAN ASSUMED

- **GRAPH REGEN — FIRES, AND IT IS THE INTEGRATOR'S TO RUN.** Four `.rs`
  paths outside `docs/`. **ASKED, never predicted, and asked AGAIN after
  every write**: `cargo run -p nputer-index -- index --check --root ../..`
  was **exit 0 CURRENT at the lane base** and is **exit 1 STALE now** —
  `+1` file, `~3` changed, `+3` edges; 179 → 180 files, 2004 → 2014
  symbols, 1907 → 1910 edges, 939161 → 943006 bytes. The regen belongs
  **with the CHECKPOINT** (CONVENTIONS), and `docs/architecture/graph.json`
  is not in this fence, so this lane deliberately does NOT commit it.
  **SAID LOUDLY: the integrator owes
  `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`
  and the committed graph.**
- **DOCS GATE — FIRES.** Eight paths under `docs/` are code inputs; it
  named four suites and all four were run. **It also caught a real defect
  in this lane**: `src/arch/cycles.rs` held the repository root and was
  unargued in `ROOT_ANCHOR_LEDGER` (`tools/e2e/scripts/docs-scan.mjs`,
  out of fence). Fixed IN FENCE at `6839450` by moving the three
  live-registry bodies into `tests/arch.rs`, which already holds the root
  and is already an argued reader; census back to **6 argued anchors, 0
  unargued, exit 0**. `npm run lint:docs` exit 0.
- **BOOT GATE — FIRES** on `app/src-tauri/**`. Run on scratch port 14538,
  never 1420.
- **AUDIT GATE — not owed**: no manifest or lockfile in the diff.

### SUITES, IN THE ORDER RUN

Setup first, in the documented order — `npm ci` + `npm run build` in
`lib/parser`, then `npm install` + `npm run build` in `app/` — because a
fresh worktree has neither, and skipping the second is 12–14 failures
that read exactly like defects.

| command | result | exit |
|---|---|---|
| `npm ci` then `npm run build`, `lib/parser/` | — | 0, 0 |
| `npm install` then `npm run build`, `app/` | — | 0, 0 |
| `cargo test --no-fail-fast`, `app/src-tauri/` | **16 headers summing 497; 494 passed + 3 ignored = 497** | **0** |
| `npm test`, `app/` | 47 files, **973 / 973** | **0** |
| `npx vitest run`, `lib/parser/` | 12 files, **268 / 268** | **0** |
| `npm test`, `tools/e2e/` — **RUN 1** | **170 passed / 1 failed** | **1** |
| `npm test`, `tools/e2e/` — **RUN 2** | **171 / 171** | **0** |
| `npm run lint:tokens -- --selftest` | 65 TOKEN + 4 CONTROL samples, 87 walk-policy, 9 evidence-floor | 0 |
| `npm run lint:tokens` | clean — TOKEN 135 files, CONTROL 752 tracked | 0 |
| `npm run lint:docs`, `tools/e2e/` | whole-tree half green | 0 |

**THE COUNT IS DERIVED AGAINST THE `running N tests` HEADERS, NOT THE
SUMMARY** — 16 headers summing 497 against 494 passed + 3 ignored = 497,
so no binary vanished into a SIGABRT (T-129's M15 lesson). The two known
intermittents were read **BY NAME** and both are `ok`:
`docs_watch::tests::startup_arm_watches_the_initial_root` and
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`.
The lib suite's own clock reads **4.40 s**, deep in the green band
(`T-088-s4`: every green under 9.5 s); `du -sh app/src-tauri/target` is
**2.7 GB**.

**BOTH E2E RUNS ARE DECLARED, AND RUN 1 IS NOT THIS LANE'S DEFECT.**
`tools/e2e/tests/token-scan.spec.ts:201` — the body *"P6 reds a planted
bare motion utility and leaves its motion-safe twin alone"* — failed with

    Expected: 1787684011060.7908
    Received: 1787684011061

**a fractional millisecond against a whole number**, which is `T-120-s3`
/ `T-130`'s exact signature in a fresh checkout. This lane is cut from
`afe23c1`, which predates T-130's merge, so it carries the defect and not
the fix; the failure repairs the condition that caused it and run 2 is
171 / 171. Re-running was NOT used to make it go away — the signature was
matched first, and both runs are on the record.

`tests/range-rule.spec.ts` printed a **DISCLOSURE** (not a failure) about
GRAPH REGEN's flip counts carrying their trigger. Recorded, unrelated to
this diff.

### WHERE THE CARD AND THE BRIEF WERE WRONG

Finding a card stale is success, not embarrassment. Named plainly:

**THE CARD**

1. **"On main today there are TWO" declared cycles — there is ONE.**
   T-033 dropped `C-12 -> C-05` and the second cycle went with it. The
   census criterion is what caught this, exactly as it was designed to.
2. **The alternation chain is drawn in the wrong direction.** The card
   prints `board-model.ts (C-08) -> task-detail.ts (C-09)`. The real edge
   at this ref is `task-detail.ts -> board-model.ts` — C-09 to C-08, the
   opposite way — and it is one of the three hops that CLOSE the cycle.
3. **The card names TWO closing edges and there are THREE.** It gives
   `TaskCard.tsx -> task-detail.ts` and `TaskDetailPanel.tsx ->
   TaskCard.tsx`. Derived: C-08 → C-09 is **6** file edges and C-09 →
   C-08 is **3** — `TaskDetailPanel.tsx -> TaskCard.tsx`,
   `TaskDetailPanel.tsx -> badges/ReviewBadge.tsx` (unnamed) and
   `task-detail.ts -> board-model.ts`. `arch` agrees: `observed=6` and
   `observed=3`. The `ReviewBadge` hop matters, because a fix that
   severed only the class constants would leave the cycle standing.
4. **"`TaskCard.tsx (C-08):3` … `TaskDetailPanel.tsx (C-09):12`" cites
   LINE NUMBERS**, against CONVENTIONS' own rule that a citation names a
   symbol. The symbols are `cardRef`, and `CHIP_BORDER_CLASSES` /
   `STATUS_CLASSES`.
5. **"The file import graph is a DAG" is false once made global** — one
   SCC of four files inside C-07 (`T-127-s3`). True as stated for
   `app/src/**`, which is what was walked.
6. **Every slug figure is stale**, measured at `765924d`: `app-shell` 22
   → **20**, `tools/e2e` 9 → **10**, `docs/CONVENTIONS.md` 8 → **9**,
   `app-agent` 7 → **5**, `app-map` 6 → **4**, and **"every other slug 2
   or fewer" is false** — `crate-index` and `method/` are **4** each.
   "21 of the 36 planned cards" is **20 of 38**.
7. **`T-126` has SHIPPED**, so the nine `app-shell`-only cards are
   **eight**. The demand-side "57 of 126" reproduces on the numerator
   only: **57 of 134**, and its "no other slug exceeding 21" is now false
   (`tools/e2e` is 22).
8. **The card's Verification section under-derives the gates.** It names
   GRAPH REGEN and the DOCS GATE. **BOOT GATE also fires** — the diff is
   under `app/src-tauri/**` — and it was run (exit 0, both `[nputer]`
   lines, scratch port 14538).

**THE BRIEF**

9. **"Rust emitted 139 edges" — at this ref it is 143.** The rest of that
   measurement reproduces exactly: all Rust edges are `import`, zero
   `call`, zero `type_ref`, against TypeScript's **1764** across three
   kinds (508 / 552 / 704). The brief said to treat its numbers as
   suspect and derive them; that was right.
10. **"Two other lanes are live on `tools/e2e` and on three named
    `method/` files" was true at dispatch and false at hand-off.** T-130
    merged mid-lane; only `T-132` remains, and a THIRD detached non-lane
    (`../nputer-T-132-verify`) appeared. Derived twice by filtering
    `git worktree list` on the branch, never on the path.
11. **The brief says the `token-scan.spec.ts` fix "is merging as you
    work" — it MERGED**, into main at `93f8656`. This lane is cut from
    `afe23c1` and therefore still carries the defect; run 1 red, run 2
    green, both declared.
12. **The brief's "the fence-consequence criterion is the one most likely
    to bite" was right about the criterion and wrong about which fence.**
    It bit on `app/test/**` — the REGISTRY FIXTURES — rather than on a
    slug held by a running lane. No lane held `app-shell` or `app-board`
    at any point in this session.

### THE RANGE AGAIN, AT THE LANE'S OWN TIP — because main moved twice more

Main was `afe23c1` at dispatch, `93f8656` when the range above was taken,
and **`5036958`** at hand-off.

    git merge-tree --write-tree 5036958 6f02a31  ->  exit 0 (read from $? FIRST), tree f5a139f…
    git diff --name-only 5036958 <TREE>          ->  14 paths

The two added paths since the earlier reading are this card itself and
`tests/arch.rs`; the set is otherwise identical, and every path is inside
`[crate-index, docs/architecture/components/]` or is this card and its own
suggestions. **Re-derive at the integrator's own main — this figure is a
function of `5036958` and nothing else.**

**THE LANE LIST MOVED AGAIN TOO**, derived by filtering
`git worktree list` on the branch: `T-132`
(`[method/lane-protocol.md, method/roles/integrator.md,
method/tasks/TASK-FORMAT.md]`) and **`T-133`** (`[tools/e2e]`, which
appeared after T-130 merged). Both disjoint from this fence. Detached
non-lanes: `../nputer-app` and `../arch-verify`. **Still no lane holds
`app-shell` or `app-board`**, so `T-127-s1` and `T-127-s2` are both
dispatchable — which is a live-environment fact to re-read at dispatch,
never to quote from here.
