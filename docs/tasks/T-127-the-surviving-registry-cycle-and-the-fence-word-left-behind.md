---
id: T-127
title: T-033 killed three of the four registry cycles and left the fence word behind — one cycle survives, no gate stops the next one, and app-shell still expands to four components holding 21 of 36 planned cards
feature: F-06
milestone: 4
priority: 6
size: M
status: done
blocked_by: []
touches: [crate-index, docs/architecture/components/]
builder: claude-opus-5
verifier: claude-opus-5 @T-127-verify
built_by: claude-opus-5 @T-127 — code d0494fc, 1b51d61, 6839450; notes e7d597a
verified_by: claude-opus-5 @T-127-verify — APPROVED, 2026-08-25 — verdict commit 33cc8de
review: same-model
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

## Verdict: APPROVED — adversarial verifier, claude-opus-5, 2026-08-25

Verified in a detached worktree `../nputer-T-127-verify` cut from the lane
tip **`e7d597a`** (`git rev-parse`, never quoted), with its own
`CARGO_TARGET_DIR` inside it. Two further detached drill worktrees at
`d0494fc` and `e7d597a`, each with its own target dir. The lane's own
worktree was never written into except for this section.

**BOUNDED READ, declared.** The card was read at its base ref `afe23c1`
and NOTHING else; the attack set was derived from its nine criteria and
written to disk at **2026-08-25T19:46Z**, BEFORE the diff, the notes or
any file at the tip was opened (`00-attack-set-PREREAD.md`, card extract
sha256 `9100dd47…`). Then the notes commit `e7d597a` was read, then the
diff. Every figure below is mine, derived at my own ref.

### THE CENSUS, DERIVED AT FOUR REFS BY A WALKER THAT IS NOT THE TOOL

A separate parser and a recursive Johnson-style enumeration (the crate's
is iterative — deliberately a different implementation) over
`depends_on:` from all `C-*.md` frontmatter:

| ref | components | declared edges | declared cycles |
|---|---|---|---|
| `b505fca` (the card's "main") | 12 | 23 | **2** — `C-05 -> C-12 -> C-05`, `C-08 -> C-09 -> C-08` |
| `935693f` (T-033 tip) | 13 | 35 | 1 |
| `afe23c1` (lane base, BEFORE) | 13 | 35 | **1** |
| `e7d597a` (lane tip, AFTER) | 13 | 35 | **1** |
| `e7db842` (main at my ref) | 13 | 35 | 1 |

**Before 1, after 1**, and the tool agrees with my walker exactly on all
five (13 / 35 / `C-08 -> C-09 -> C-08`). **The card's "TWO" was TRUE at
`b505fca`, which the card's own table names as main** — it did not
mis-count, it went stale when T-033 dropped `C-12 -> C-05`. The lane's
correction is right; its framing ("the card says TWO — there is ONE") is
right at the lane's ref and slightly unkind to the card at the card's own.

### THE GATE'S SCOPE — ATTACKED HARDEST, AND IT HOLDS

**Registry-only: confirmed by reading and by running.** `arch cycles`
calls `read_registry` and nothing else; no graph, no index. Proven at the
process boundary: on a fixture with **no `graph.json` on disk**, `arch`
is exit 3 and `arch cycles` is exit 0.

**The disclosure survives green, and it is on STDOUT.** Streams split by
hand against the LIVE registry and against a real acyclic control:

- GREEN → exit 0, whole report incl. all three `note` lines on **stdout**
  (529-byte red / stderr empty on green, and vice versa).
- RED → exit 1, whole report on **stderr**, stdout **empty**.

The red-to-stderr split is not a deviation: `index --check` does exactly
this (stale→stderr, current→stdout). `arch drift` differs because it is a
report with an optional `--fail-on`, not a gate. **Attack found nothing.**
One note for readers: the transcript in the notes does not say the red
half is stderr, so `arch cycles > out.txt` on a red yields an empty file.

**The green never overclaims**: it says `ACYCLIC no declared cycle`, not
"no cycles", and states its own corpus (components and edge count).

**A REAL CYCLE THE GATE CANNOT SEE — CONSTRUCTED, WITH A WORKING CONTROL
IN THE SAME TREE.** My first attempt was inconclusive and I say so: a
fixture without a `Cargo.toml` emitted zero edges for *everything*,
control included. Made a real crate, and the two halves separate cleanly:

| pair | how the dependency is written | edges emitted | `arch drift --fail-on any` | `arch cycles` |
|---|---|---|---|---|
| `p.rs` ↔ `q.rs` (C-03/C-04) | `use crate::q::…` | **2 `import`** | **2 × D1**, both named | ACYCLIC |
| `a.rs` ↔ `b.rs` (C-01/C-02) | `crate::b::pong()` path expression | **ZERO** | **nothing** | ACYCLIC |

The invisible pair is a *genuine* mutual compile-time dependency, not a
typo: it compiles clean, and breaking one side yields
`error[E0425]: cannot find function … in module crate::a`. **So a real
two-component cycle is invisible to BOTH sides at once**, exactly as the
lane says, and the caveat line is load-bearing rather than decoration.
Note the sharper form: even the VISIBLE undeclared cycle is reported by
no command *as a cycle* — `arch drift` calls it two D1s and `arch cycles`
is green because nothing is declared. The printed note covers this.

**Edge kinds re-derived from the committed graph**: Rust **143**, every
one an `import`, **zero** `call`, **zero** `type_ref`; TypeScript **1764**
(508 / 552 / 704); 143 + 1764 = 1907 = `stats.edges`. The brief's "139"
is wrong and the lane's 143 is right.

### CRITERION 3 — NOT BUILT, AND THE REASON REPRODUCES EXACTLY

I applied the lane's smallest acyclic re-partition myself (registry only,
`git diff` read back before every run):

| | baseline | re-partitioned |
|---|---|---|
| declared cycles (my walker AND the gate) | 1 | **0**, `verdict ACYCLIC … 34 declared edges` |
| `npm test` from `app/` | **973 / 973, exit 0** | **6 failed / 967 passed of 973, exit 1** |
| `npx vitest run` from `lib/parser` | 268 / 268 | **268 / 268, exit 0** |

The six are in `test/architecture-dogfood.test.ts` and
`test/map-dogfood-render.test.tsx`, and one of them prints
`expected [ 'C-10', 'C-12' ] to deeply equal [ 'C-10' ]` — **verbatim the
lane's quoted message.** Both files are under `app/test/**`, owned by
C-05 (`app-shell`), and also claimed by C-09 (`app-board`) and C-14.
Neither slug is in `[crate-index, docs/architecture/components/]`.

**So the fence really does forbid it.** The registry edit is in fence; the
fixtures it invalidates are not, and widening a fence from inside the lane
it fences is the one repair this role may never make. The routing is
correct and it is held to the standard of a rejection: it ships with the
measurement, the recommended partition, and the reason a smaller one is
wrong. Restored: `git diff` empty, sha256 per path identical —
C-08 `46efdf15…` (**the lane's own recorded hash**), C-09 `8dd48f90…`.

### THE FILE-LEVEL DAG CLAIM — THE ROUTE-IT CLAUSE GENUINELY DOES NOT FIRE

Independent iterative Tarjan over the committed graph, both edge sets:

- 179 file nodes, **379 distinct file import edges**, and **exactly ONE
  SCC of size > 1**: `resolve/{mod,rust,ts,tsconfig}.rs`.
- Under `import` + `call` + `type_ref`: **the same single SCC** (897 edge
  instances projecting onto the same 379 file pairs).
- **Its owner set is `['C-07']` and nothing else** — entirely inside one
  component, as the lane says.
- **No C-08 or C-09 file takes part in any SCC.** So criterion 2's "IF one
  does THEN route it as a real design defect" clause does NOT fire, and
  the lane's `T-127-s3` is a correct *disclosure* rather than a dodged
  criterion. This was the brief's sharpest suspicion; it is laid to rest.

My first pass reported the SCC owner set as EMPTY. **That was my bug, not
a finding**: my frontmatter parser rejected C-07's `paths:` line because
it carries a trailing YAML comment. Fixed and re-run. The lane's "166 file
nodes" also reconciles exactly — it is *files touched by ≥1 non-self edge*
(167 including `dispatch-store.ts`, which has only a self-edge).

### THE CARD'S CLOSING EDGES — DERIVED FROM SOURCE, NOT FROM THE GRAPH

C-08 → C-09 is **6** file edges; C-09 → C-08 is **3**:
`TaskDetailPanel.tsx -> TaskCard.tsx`,
`TaskDetailPanel.tsx -> badges/ReviewBadge.tsx`, and
`task-detail.ts -> board-model.ts`. Confirmed at the import lines:

- `board-model.ts` imports **only** `./verdicts`. It does **not** import
  `task-detail.ts`. `task-detail.ts` imports `./board-model`. **The card's
  first hop is drawn backwards**, and so is the chain it anchors.
- `TaskDetailPanel.tsx` imports the class constants from `./TaskCard`
  (line 12) **and** `ReviewBadge` from `./badges/ReviewBadge` (line 13).

**The consequence the lane draws is correct and is the most useful of its
corrections**: severing only the class constants leaves both the
`ReviewBadge` hop and `task-detail.ts -> board-model.ts` standing, so the
component cycle survives a fix aimed at the edge the card names.

### THE POISON DRILL — SIX MUTANTS OF MY OWN, EVERY RESTORE PROVED

Producer side only, never an assertion; `git diff` read back BEFORE each
run; whole-suite counts, because uniqueness of kill is measured.

| # | one side mutated | where | exit | killed / suite |
|---|---|---|---|---|
| **V1** | `env!`-shaped root added to `cycles.rs` | verify tree | 0 | **0 — MY MUTANT WAS WRONG**, reported |
| **V1b** | the ACTUAL pre-fix `cycles.rs` restored in place | verify tree | **1** | docs gate RED, census **6 → 7**, `+ …/arch/cycles.rs — holds the root, unargued` |
| **V6** | REGISTRY on disk — `C-01`'s `depends_on: []` → `[C-06]` | drillPOST | 101 | **2 / 218** |
| **V7** | REGISTRY on disk — `C-08` removed from C-09 (cycle fixed, allowlist left) | drillPOST | 101 | **1 / 218** |
| **M6** | `MAX_CYCLES` 64 → 100000 | drillPRE `d0494fc` | **0** | **ZERO / 217 — SURVIVED** |
| **M6b** | `MAX_CYCLES` 64 → 100000 | drillPOST `e7d597a` | 101 | **exactly 1 / 218** |

**M6 and M6b both reproduce, and the fix is genuine.** The pre-fix tree
takes the mutation at **exit 0 with 217 bodies and zero kills**; the
post-fix tree kills exactly one,
`the_enumeration_cap_is_the_documented_constant`, printing
**`left: 100000 / right: 64`** — which is the proof the fix pins a
LITERAL and did not merely move the parametrisation one level up. The two
baselines differ by exactly one body (217 → 218), i.e. the fix added one
body and changed nothing else.

**V6 is the card's prescribed drill and it reproduces the lane's M1
verbatim**, including the coupling the lane disclosed rather than glossed:

    left:  ["C-01 -> C-06 -> C-01", "C-08 -> C-09 -> C-08"]
    right: ["C-08 -> C-09 -> C-08"]

and the binary against the same mutated registry printed both cycles as
paths at exit 1. **V7 is the other direction** and is why the allowlist
cannot rot: `left: [] / right: ["C-08 -> C-09 -> C-08"]`, uniquely 1 body.
**The ENFORCING copy really is `cargo test`, not the subcommand.**

**RESTORATION PROVED PER PATH BY sha256**: `cycles.rs` `5258eb40…`
(drillPRE) and `3791df26…` (drillPOST and verify tree) before and after;
`C-01-method.md` `f002b3c3…`; `C-09-detail-panel.md` `8dd48f90…`;
`C-08-board-pane.md` `46efdf15…`. `git status` clean but for target dirs
in all three worktrees. **Three of those hashes are the lane's own
recorded values**, which independently corroborates that its drill ran
where it says it ran.

### POSITIVE CONTROLS — INCLUDING ONE AGAINST THE LIVE TREE

A negative assertion needs one, and a cycle gate needs a green it can
actually say. Beyond the lane's three, I ran my own: **the real live
registry with one hop removed** → exit 0, `verdict ACYCLIC no declared
cycle among 13 components and 34 declared edges`, all three notes on
stdout, stderr empty. The gate can say ACYCLIC about this tree.

The lane's process-level controls are stronger than the card asked for:
`arch_cycles_says_on_every_run_what_it_cannot_see` pins the caveat **on
the green path, on stdout**, together with D5-is-not-a-cycle.

### WHAT I FOUND — FOUR ITEMS, NONE OF THEM A FALSE GREEN

**1. THE GRAPH REGEN FIGURES IN THE NOTES ARE ONE COMMIT STALE, AND THE
CLAIM ABOVE THEM IS NOT TRUE AS WRITTEN.** The notes record
`943006 bytes · 180 files · 2014 symbols · 1910 edges`, `~3` changed,
`+3` edges. I pointed the tip binary at a worktree of `1b51d61` and got
**those figures exactly, byte for byte**. At the actual tip `e7d597a` it
is `944590 bytes · 180 files · 2018 symbols · 1911 edges`, `~4` changed,
`+4` edges — the extra file and edge being `tests/arch.rs` and
`tests/arch.rs -> cycles.rs`, i.e. **the docs-gate fix at `6839450`
itself**. So the bullet's "**ASKED**, never predicted, and asked AGAIN
after every write" is contradicted by its own numbers: the last write was
not followed by a re-ask. Consequently "`index --check` reports the
**three** edges `cycles.rs` adds" is also stale — at the tip it is
**four**. **The substance survives intact and is if anything stronger:
all four are `import`, still zero `call` and zero `type_ref`.** Asked
twice at my ref, byte-identical both times, and `graph.json` unchanged on
disk (the check never writes). ACTIONABLE: one edit to the notes, in
fence. The integrator regenerates and commits the graph regardless, so
the blast radius is a reader comparing against a stale number.

**2. `T-127-s5` IS ROUTED ON THE BRANCH AND NAMED NOWHERE IN THE NOTES.**
The diff carries five suggestions; the notes enumerate `s1`–`s4` and
mention `s5` **zero** times. `T-127-s5` says `arch cycles` ships
undocumented because the CONVENTIONS command bullet is out of fence —
which is a real out-of-fence disclosure and exactly the kind the card
demands be loud. A routing that ships unannounced in the record is the
lane's own "a silent change is worse than a loud one", applied to itself.
ACTIONABLE: one line. (Its "covered by 22 test bodies" is also off by one
— the lane added **23**.)

**3. THE TRUNCATION FLAG IS OFF BY ONE AT THE BOUNDARY.** Built registries
of 63, 64 and 65 disjoint 2-cycles. At **exactly 64** the report prints
all 64 cycles *and* `... enumeration stopped at 64; the list is incomplete
and the verdict is not` — **the list is complete**. At 65 it is honest. A
false sentence, never a false verdict, and it errs toward warning. The
boundary is untested: `enumeration_is_capped_…` uses a complete digraph on
9 nodes, far above the cap. Recommend routing, not blocking.

**4. THE LIVE POSITIVE CONTROL IS BRITTLE TO A SHARED CLOSING HOP.**
`the_live_registry_minus_one_hop_per_reported_cycle_is_acyclic` asserts
`dropped == before.cycles.len()`. I built the shape that breaks it —
`C-01 -> C-02 -> C-03 -> C-01` and `C-01 -> C-04 -> C-03 -> C-01`, which
the gate correctly reports as two cycles sharing the hop `C-03 -> C-01`.
One `retain` removes it, so `dropped` is 1 against 2 and the body reds
with *"every reported hop must exist in the registry it was read from"* —
a misleading message for a hop that did exist and was shared. **It fails
SAFE (red, never green)** and is unreachable at one cycle. Recommend
routing. The lane's claim that this body does not go vacuous when the last
cycle is fixed is **correct**: at zero cycles the loop is empty and it
asserts the live tree itself.

### ATTACKS THAT FOUND NOTHING — REPORTED BECAUSE THEY ARE THE EVIDENCE

- The enumeration is a correct Johnson-style restriction: `on_path` is
  fully unwound at every start (and explicitly before `break 'starts`),
  `next < start` guarantees each simple cycle once rotated to its lowest
  member, and order-independence is pinned by a body I re-read.
- Dangling `depends_on` is excluded from `declared_edges` and cannot close
  a walk; a duplicate target is one edge; a self-declaration is
  `C-01 -> C-01`. All confirmed against the live tool.
- A missing registry is exit 3, never a cheerful ACYCLIC.
- **The path format never degrades to "cycle detected"** — checked for
  2-cycles, 3-cycles, self-loops, two independent cycles, two cycles
  sharing a hop, and 64+ cycles. Every one printed as a closed walk.
- `arch` / `arch drift` output is byte-unchanged: `arch/mod.rs` gains one
  `pub mod cycles;` line and the `Arch | ArchDrift` arm is untouched.
- **The registry edits are prose-only** — no `paths:`, `depends_on:` or
  `touch_slugs:` field changed anywhere in the diff, so no fence moved
  silently and the census could not have moved.
- The `ROOT_ANCHOR_LEDGER` move weakened nothing: normalised body
  comparison shows assert counts identical (2/2, 3/3, 6/6) and the only
  differences are inlined `let` bindings. **My first comparison returned a
  vacuous "IDENTICAL" because BSD `sed` errored and both sides were empty
  — reported, and redone in Python.**

### THE SLUG CENSUS AND THE BENEFIT, RE-DERIVED AT MY OWN REF

Reproduces the lane exactly: `app-shell` **20**, `tools/e2e` **10**,
`docs/CONVENTIONS.md` **9**, `app-agent` **5**, `app-map` **4**,
`method/` **4**; demand side `app-shell` **57**, `tools/e2e` **22** (so
"no other slug exceeding 21" is indeed false now). `crate-index` I make
**3**, not the lane's 4 — the difference is T-127 itself moving from
`building` to `verifying`, which is the card's own point about a census
over a directory that changes as cards are filed. **`T-126` is `done`**,
so the nine are **eight**, and the eight are exactly the lane's list.

The benefit claim holds, having read what each of the eight touches:
**not one** names `ui/**`, `utils.ts` or `verdicts.ts`, so `app-ui` would
relieve **0 of 8** — the answer to `T-033-s7` is derived, not asserted.
Exactly four name a C-10 path, and the split is right: **T-114** and
**T-035** name only C-10 paths (freed outright), while **T-044** and
**T-106** also name `Cargo.toml` / `lib.rs` (made honest, not freed).
**Two of eight, said rather than buried.**

### SUITES AND GATES — EVERY EXIT READ UNPIPED, EVERY COUNT DERIVED

| command | result | exit |
|---|---|---|
| `cargo test --no-fail-fast`, `app/src-tauri/` | **16 headers summing 497; 494 passed + 3 ignored = 497**; 16 result lines | **0** |
| `npm test`, `app/` | 47 files, **973 / 973** | 0 |
| `npx vitest run`, `lib/parser/` | 12 files, **268 / 268** | 0 |
| `npm test`, `tools/e2e/` — **RUN 1** | **170 passed / 1 failed** | **1** |
| `npm test`, `tools/e2e/` — **RUN 2** | **171 / 171** | **0** |
| `npm run lint:docs`, `tools/e2e/` | **6 root-anchored, all argued, 0 unlinked** | 0 |
| `NPUTER_BOOT_PORT=14791 npm run boot:check` | both `[nputer]` lines, tree stopped, port freed | **0** |
| `index --check --root ../..`, asked TWICE | STALE, byte-identical both asks | 1, 1 |
| `npm run typecheck`, `app/` | **Missing script** — the documented trap, not a defect | 1 |

**The cargo count is derived against the `running N tests` headers**: 16
headers summing 497 against 16 result lines summing 494 + 3 = 497, so no
binary vanished into a SIGABRT.

**BOTH E2E RUNS DECLARED, AND RUN 1 IS NOT THIS LANE'S DEFECT — matched
to signature before re-running.** `token-scan.spec.ts:201` failed with
`Expected: 1787687153361.5767 / Received: 1787687153362`, a fractional
millisecond against a whole number. `cea839e`, which fixes it, **is in
main but is NOT an ancestor of this lane tip** (`merge-base --is-ancestor`,
both directions checked), so the red is expected in this tree and would be
news in one that carries the fix.

**BOOT GATE FIRES AND THE CARD'S VERIFICATION OMITS IT** — the diff is
under `app/src-tauri/**`. Derived from CONVENTIONS' trigger and run: exit
**0**. Port **1420** read READ-ONLY with `lsof` only: `node` pid 88948,
`[::1]:1420 (LISTEN)`, the human's app. Never bound, never connected.

**GRAPH REGEN fires and is the INTEGRATOR's.** `graph.json` is outside
this fence and correctly not committed. See finding 1 for the stale
figures the integrator should ignore in favour of a fresh derivation.

### THE RANGE, AT MY OWN MAIN

Main moved again: **`e7db842`** at my ref, not the `5036958` the notes
name. Exit read from `$?` BEFORE any substitution.

    git merge-tree --write-tree e7db842 e7d597a  ->  exit 0 FIRST, tree 1ce9d65…
    git diff --name-only e7db842 <TREE>          ->  14 paths

Never `<merge-base>..<tip>`, never `main..HEAD`. The path set is identical
to the lane's at its ref: 5 under `crate-index`, 3 under
`docs/architecture/components/`, and 6 in `docs/tasks/` which are this
card and its own five suggestions. **The fence is clean.**

### A TRAP FOR THE NEXT VERIFIER, FOUND BY WALKING INTO IT

I named my scratch target dir `.vtarget` inside the worktree. `.gitignore`
ignores `target/`, which does **not** match `.vtarget`, so
`index --check` walked my build artefacts and reported
`serde_core-*/out/private.rs` as tree staleness — a completely fabricated
GRAPH REGEN reading that I nearly filed. Renaming it to `target` fixed it.
**A verifier's own `CARGO_TARGET_DIR` inside the worktree must be named to
match an ignore rule, or the staleness gate reports the verifier.** I also
poisoned one early reading by exporting `GIT_DIR` alongside `git -C`,
which compared main's index against my worktree's files and printed a
frightening list of "modifications" that did not exist.

### WHERE THE BRIEF WAS WRONG

- **"Rust emitted 139 edges" — it is 143** at this ref, as the lane says.
- **"the card names TWO closing edges where there are THREE"** is right,
  but the card names one edge *per direction*, which is how a 2-cycle
  closes; the load-bearing correction is that the C-09 → C-08 direction
  has **three** edges, so a class-constant-only fix leaves it standing.
- **"the card draws the alternation backwards"** — confirmed, and it is
  worse than one hop: none of the four hops in the card's chain matches a
  real import edge in the direction drawn.
- **"check the SCC hardest — if it does underlie the declared cycle, a
  criterion fires that the lane says does not"** — checked; it does not.
  The lane is right and the criterion correctly does not fire.
- **"the census … an unchanged count is only acceptable if criterion 3's
  non-construction is legitimate"** — it is legitimate, measured, and I
  reproduced the measurement to the failing-body count.

### THE RULING

**APPROVED.** The gate is correct, its scope is stated on every run
including the green one and on the stream a CI reader captures, and the
scope statement is *true* — I built the cycle it cannot see and proved the
dependency is real. The enforcing copy is the test suite, and it reds in
both directions with an exact-set allowlist that cannot rot. Criterion 3
is unbuilt for a reason I reproduced exactly rather than took on trust,
and it ships as a disclosure with a measurement and a routing, which is
the shape this project accepts. No attack produced a green where a red was
owed.

Findings **1** and **2** are record defects, both fixable in fence in a
line each, and both should be corrected before hand-off; the integrator
should derive GRAPH REGEN fresh and ignore the notes' figures. Findings
**3** and **4** are latent, fail safe, and are worth routing rather than
blocking.

## Integration — 2026-08-25, `claude-opus-5`, THIRD HAND

Merge **`ad3ac8a`**, main-before **`e7db842`**, lane tip **`33cc8de`**
(`git rev-parse`, never quoted). Checkpoint its direct child. **The
lane's own text and the verdict are preserved BYTE-UNTOUCHED** — this
section is the integrator's own record beside them, not a rewrite of
either, and the ruling below says why.

### WHAT THE GATE'S GREEN MEANS, AND WHY A READER WILL OVER-READ IT

`nputer-index arch cycles` reads the **REGISTRY ONLY** — no graph, no
index — so a stale graph cannot falsely redden it, and its verdict is
about **declared `depends_on:` and nothing else.** Every run, green
included, prints on stdout that the observed side sees `import` edges
only. **That disclosure is load-bearing rather than decoration, and the
verifier proved it by construction**: a `use`-based mutual pair fires two
D1s, while a `crate::b::pong()` path-expression pair fires **nothing on
either side** — and it compiles, failing with `E0425` when broken, so the
dependency is real. **A cycle made of Rust `mod`/path dependencies is
invisible to BOTH sides at once.**

**THE SUBCOMMAND IS RED ON MAIN TODAY AND THAT IS THE DESIGNED STATE.**
Re-run at this merge: exit **1**, the whole 529-byte report on **stderr**
with stdout **empty**, `cycle C-08 -> C-09 -> C-08`, `components=13
declared_edges=35`. The ENFORCING copy is `cargo test`, which is
**green**, because `tests/arch.rs` pins the census against
`KNOWN_DECLARED_CYCLES` — an EXACT SET holding exactly this cycle, so a
new cycle reds today and a stale entry reds the day `T-127-s1` lands.
**A reader who runs `arch cycles` on main and reads exit 1 as breakage is
reading it right and concluding wrong.**

### THE CENSUS IS 1 BEFORE AND 1 AFTER, AND THE REASON IS THE FENCE

Criterion 3 is **NOT BUILT**, disclosed with its measurement, routed as
`T-127-s1` with a recommended partition. The smallest acyclic
re-partition takes the app suite to **6 failed / 967 passed of 973**,
because the fixtures live in `app/test/**` — C-05's `app-shell`, outside
`[crate-index, docs/architecture/components/]`. The verifier reproduced
it verbatim, to the failing-body count and the failure message. **This is
`T-101`'s precedent: a disclosed defect above a widened fence.** The
census did not move because a fence forbade the move, not because the
gate failed to see it.

### GRAPH REGEN — DERIVED FRESH HERE, AND THE VERIFIER'S FINDING 1 REPRODUCES

The notes record `943006 bytes · 180 files · 2014 symbols · 1910 edges`,
`~3` changed, `+3` edges. **Derived at this merge instead of carried:**
**944 590 bytes · 180 files · 2018 symbols · 1911 edges**, `files +1 -0
~4`, `edges +4 -0`. The fourth file and the fourth edge are `tests/arch.rs`
and `tests/arch.rs -> cycles.rs` — the docs-gate fix at `6839450`, the
lane's own last code commit. **So the notes' figures predate the lane's
own last commit and the bullet above them — "ASKED, never predicted, and
asked AGAIN after every write" — is contradicted by its own numbers.**
The substance survives and is stronger: **all four new edges are
`import`, still zero `call` and zero `type_ref`**, so the consequence the
notes draw is right and only the digits are stale. The notes also say
`index --check` reports **three** edges `cycles.rs` adds; at the tip it
is **four**.

### THE RULING ON THE CARD'S OWN WRONG ANALYSIS — FILE, DO NOT REPAIR

**Section ONE of this card is wrong in the specifics, I re-derived it
from source rather than taking either hand's word, and I did NOT rewrite
it.** Derived at this merge by reading the import lines and the registry
`paths:` globs:

- **None of the four alternation hops matches a real edge in the
  direction drawn.** `board-model.ts` imports only `@nputer/parser/pure`
  and `./verdicts`; the real edge is `task-detail.ts -> board-model.ts`.
  `task-detail.ts` imports only the parser and `./board-model`; the real
  edge is `TaskCard.tsx -> task-detail.ts`. `TaskCard.tsx` does not
  import `TaskDetailPanel.tsx`; the real edge is the reverse.
  `TaskDetailPanel.tsx` imports neither `FeatureColumn.tsx` nor
  `Board.tsx`; the real edges are `Board.tsx -> TaskDetailPanel.tsx` and
  `FeatureColumn.tsx -> TaskCard.tsx`. **Four hops, four reversals** —
  worse than the lane's correction, which named one.
- **The card names two closing edges and there are three in the C-09 →
  C-08 direction**: `TaskDetailPanel.tsx -> TaskCard.tsx` (the class
  constants), `TaskDetailPanel.tsx -> badges/ReviewBadge.tsx` (unnamed by
  the card; `badges/**` is C-08's) and `task-detail.ts -> board-model.ts`.
  `arch` agrees at this merge: **`C-08 -> C-09 observed=6`** and
  **`C-09 -> C-08 observed=3`**. **A fix severing only the class
  constants would leave the component cycle standing**, which is the one
  consequence that changes what a future lane would do.
- **The card's "TWO cycles" went STALE rather than miscounting.** It was
  TRUE at `b505fca`, the ref the card's own table names as main; T-033
  dropped `C-12 -> C-05`. The criterion was written over the CENSUS
  rather than over a named pair, and that is exactly what kept it
  checkable under a history that moved.

**THE RULING, and the rule it applies is the one this project landed
tonight**: *repair what the merge INTRODUCES, file what the merge merely
REVEALS.* **That analysis predates this merge by the whole life of the
card** — it was written when the card was authored, from a walk of
`app/src/**` whose own LIMITS paragraph disclosed what it could not see.
This merge does not introduce it; the lane's derivation and the
verifier's sharpening REVEAL it. **So it is filed, not repaired.**

**Two further reasons make this stronger than ruling thirteen alone, and
they are worth more than the ruling here because the ruling is still not
citable** (`git grep` over `method/` and `docs/CONVENTIONS.md` returns
**zero rows** at this ref, for the second checkpoint running — it is
written and unmerged in `T-132`'s lane):

1. **`T-108`'s OWN PRECEDENT POINTS THE SAME WAY, AND IT IS THE SHARPER
   ARGUMENT.** This project's established remedy for a wrong claim in a
   landed card is a **card**, fenced on the specific card paths and
   dispatched by the architect — that is what `T-108` was, and its fence
   ruling says in as many words that a card's own file is exempt from its
   fence **for PROTOCOL WRITES**: `status`, `builder`, `built_by`,
   `verified_by`, `review`. **An integrator's closing stamp is a protocol
   write. Rewriting a card's technical analysis is a LANE write**, and
   this integrator holds no lane. The archive-accuracy problem `T-108`
   merged to fix is real, and `T-108` is also the evidence for who may
   fix it.
2. **THE CORRECTION IS ALREADY IN THIS FILE, TWICE.** The lane's *"Where
   the card and the brief were wrong"* items 2–4 and the verdict's *"THE
   CARD'S CLOSING EDGES"* section both land in this same file at this
   merge, and this section is the third. **The archive is not left
   teaching the wrong thing; it is left teaching the wrong thing FIRST
   and the right thing three times over, further down a 1 288-line
   card.** That residual — a reader who stops at section ONE — is the
   real cost of this ruling, it is stated rather than argued away, and it
   is why the correction is written here in permanent form rather than
   only in `STATE`, which is a snapshot and will be rewritten at the next
   merge.

**NO SUGGESTION IS FILED FOR IT BY THIS CHECKPOINT** (T-083: disposition
belongs to a triage pass, not to an integrator), and **it is NOT covered
by `T-127-s3`**, which carries only the DAG claim. **It has no owner and
that is recorded rather than tidied.**

### THE VERIFIER'S OTHER THREE FINDINGS, ALL CONFIRMED AS ROUTED OR RECORDED

- **`T-127-s5` is routed on the branch and named nowhere in the notes**,
  which enumerate s1–s4. Confirmed: the merge carries five suggestion
  cards and the notes mention `s5` zero times. Recorded here rather than
  edited into the notes, on the same ruling. (Its *"covered by 22 test
  bodies"* is also off by one — derived at this merge, the lane adds
  **23**: the cargo suite goes 471 → **494** passed with ignored held at
  3.)
- **The truncation flag is off by one at exactly 64** — a false sentence,
  never a false verdict, erring toward warning; the boundary is untested.
  Latent, fails safe.
- **The live positive control is brittle to a shared closing hop** — it
  reds with a misleading message. Fails safe, unreachable at one cycle.

Both are defects in code this merge INTRODUCES, so ruling thirteen would
have them repaired; **the verifier recommended routing rather than
blocking, and an integrator writing new Rust with new bodies at a
checkpoint is a lane write by another name.** They are carried in `STATE`
for the eleventh triage.

### THE DRILL-POLLUTION CLASS, SELF-CAUGHT — AND THE PROTECTION IS THE NAME

The verifier reported its own two false starts, including a **fabricated
staleness reading** caused by naming its scratch target dir `.vtarget`,
which `.gitignore`'s `target/` does not match, so `index --check` walked
its build artefacts and reported `serde_core-*/out/private.rs` as tree
staleness. **The protection is the NAME, not the location**: a scratch
`CARGO_TARGET_DIR` inside a worktree must be named to match an ignore
rule or the staleness gate reports the verifier. Worth a line in
`docs/CONVENTIONS.md`'s POISON DRILL bullet, where the other three queued
edits already sit.
