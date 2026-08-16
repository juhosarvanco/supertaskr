---
id: T-037
title: Mount the lens — wire T-024's genesis pane into T-026's screen slot
feature: F-03
milestone: 3
priority: 5
size: S
status: done
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: "claude-opus-5 @fresh"
verified_by:
review: self-verified
---

The first slice's join, which fell between two parallel branches and
belonged to neither. T-024 built the lens (C-13, `app/src/genesis/**`)
against a base that predated T-026's screen; T-026 built the screen
against a base that predated the lens, leaving a marked placeholder
slot (`data-testid="genesis-pane-slot"`) rendering one honest line.
Both are on main now, both are tested, and nothing imports the pane —
verified at T-026's merge three ways: no src-side import, no
C-05→C-13 file edge in the regenerated graph, and the built bundle
missing the pane's own strings while the screen's are present. So the
slice's promise — hand-driven genesis rendered live — is undelivered,
and T-024's @human visual pass plus both deferred served-bundle
probes (T-024-s1, T-026-s7) have no route to the pane. S-tier:
executor + tests, orchestrator merges (T-016/T-036 precedent). The
change is one import and one element; the CARE is in not breaking
either half's fence, and in the props contract T-026 deliberately
designed for exactly this (`{ projectDir, docs: DocsModelState }` —
the type T-024's derivation already consumes).

## Acceptance criteria
- THE genesis screen SHALL render T-024's `GenesisPane` in the marked
  slot, receiving the same watched `DocsModelState` the placeholder
  line reads today, so the pane updates through the existing watcher
  with no new IPC and no polling (both halves' contracts unchanged).
- THE built bundle SHALL contain the pane — the exact inverse of the
  measurement taken at T-026's merge: the pane's own strings
  ("the project, so far", `genesis-artifact`) present in
  `app/dist/assets/*.js`, asserted by a served-bundle-free grep of
  the build output so the claim is mechanical rather than visual.
- THE existing suites SHALL pass unchanged — T-024's derivation and
  DOM tests, T-026's shell-routing and genesis-entry tests — and the
  screen's other states (front door, "No plan in <folder>", board,
  map) SHALL be untouched, pinned by the tests that already cover
  them.
- WHEN the genesis screen renders with docs present THE pane's own
  content SHALL appear (north-star card, backbone grid, artifact
  rows) rather than the placeholder line, asserted at DOM level
  against a fixture tree; WHEN docs/ is empty THE pane's empty state
  SHALL render without crash or blank.
- IF the pane throws for any input THEN the genesis screen SHALL NOT
  take the app down — an error boundary or an equivalent guard keeps
  the shell alive, pinned by a test that forces a throw (the pane is
  now on the shell's critical path; T-024's degradation criteria
  covered malformed DOCS, not a broken component).

Verification: headless — vitest DOM against fixture trees, the
built-bundle grep, and the full app + cargo suites at main's counts.
@human, now UNBLOCKED by this task and listed for the session it
enables: the pane's visual judgment against the design screen, light
and dark.

## Implementation notes

Executor `claude-opus-5 @fresh`, 2026-08-16, branch `t037-mount-lens`
(worktree ../nputer-t037). Branch point: **main@f7fdf13** (the dispatch
commit). S-tier: executor + tests, no verifier session — so every claim
below is written to stand on its own, with the reproduction command
beside it. Baselines re-derived HERE at the branch point before any
edit, not taken from the dispatch: app `npm test` **455 passed
(24 files)**, `npm run build` exit 0, `npx tsc --noEmit` exit 0;
lib/parser **159/159 (10 files)**; bare `cargo test` **139 passed +
2 ignored**; tools/e2e **17/17**.

### The whole change

    app/src/components/shell/GenesisScreen.tsx        93/25
    app/test/genesis-entry.test.tsx                   20/5
    app/test/genesis-mount.test.tsx                  368/0   (new)
    app/test/genesis-pane-boundary.test.tsx          171/0   (new)
    app/test/node-builtins.d.ts                        4/2
    docs/tasks/T-037-s1-token-lint-is-red-on-main.md  68/0   (new)
    docs/tasks/T-037-mount-the-lens.md                (these notes)

The mount proper is two lines of the 93: `import { GenesisPane } from
"@/genesis/GenesisPane"` and `<GenesisPane docs={docs} />` inside the
slot T-026 marked. Everything else in that file is the criterion-5
guard, the slot's four changed layout utilities, and comments. **Zero
diff** under `app/src/genesis/**` (T-024's territory — the fence held
without a fight; nothing there needed touching), `lib/`, `method/`,
`app/src-tauri/`, `capabilities/`, `tauri.conf.json`, `tools/`, both
package-locks, `Cargo.toml`/`Cargo.lock`, `docs/architecture/`,
`app/src/App.tsx` and every other screen state.

### Criteria → evidence

**(1) The pane renders in the marked slot, on the watched state, with
no new IPC and no polling.** `GenesisScreen.tsx:62-70`. The props T-026
shaped for exactly this (`{ projectDir, docs: DocsModelState }`) are
handed straight through; nothing was plumbed, added or fetched.
Evidence, `app/test/genesis-mount.test.tsx`:

- *"the pane renders inside genesis-pane-slot"* — the query is
  `slot.querySelector("[data-testid=genesis-pane]")`, i.e. containment
  inside the marked region, not mere presence on the screen; and
  `[data-testid=genesis-docs-count]` (the placeholder line) is asserted
  **null**, so the two cannot both be shipping.
- *"the pane reads the same watched state the screen was handed"* — the
  screen's own `data-genesis-files`, the pane's own header count and the
  `DocsModelState` the shell passed in all read 9 on the streak tree;
  a second render with a different tree moves the pane to 5, so the seam
  carries updates rather than snapshotting once at mount.
- *"the seam adds no IPC, no polling and no new dependency"* — a
  mechanical scan of GenesisScreen.tsx for `invoke`, `listen(`,
  `fetch(`, `setInterval`, `setTimeout`, `XMLHttpRequest`, `WebSocket`,
  `localStorage`, `innerHTML`, `dangerouslySetInnerHTML`: zero hits, and
  the import + element are asserted by regex so the mount cannot be
  quietly replaced by a copy of the pane's markup.
- The end-to-end half rides the REAL pipeline in
  `app/test/genesis-entry.test.tsx` steps 4–6 (real App, real store,
  real docs-model and parser; only the IPC boundary mocked): the pane's
  own count goes 0 → 1 → 2 files as snapshots arrive down the real
  `docs-changed` channel, and the written files stop being `expected`
  rows. No new dependency: `package.json` and both lockfiles are
  zero-diff; the only new import in the whole branch is React's
  `Component` (already a dependency) and the pane itself.

**(2) The built bundle contains the pane — the inverse of T-026's
measurement.** Both halves measured in this worktree, output pasted
below under "The bundle grep". Kept as a standing test rather than a
one-off command, in `genesis-mount.test.tsx`, in two parts:

- *"is not stale"* — the newest `dist/assets/*.js` mtime must be ≥ the
  mtimes of `GenesisScreen.tsx`, `GenesisPane.tsx` and
  `genesis-derive.ts`. Without this, a dist built from an older commit
  would answer a question about today's source.
- *"carries the pane's own strings"* — the criterion's two named probes
  (`the project, so far`, `genesis-artifact`) plus six siblings from
  every region of the pane (`genesis-north-star`, `genesis-backbone`,
  `genesis-file-count`, `genesis-assumption-badge`, `grows as you
  answer`, `plain markdown, in your repo`), the screen's own strings
  still present, and the retired placeholder line (`nothing written
  yet`) asserted **absent**.

  It **fails loudly when `dist/` is missing** — it does not skip. A
  probe that quietly passes on an absent build is worse than no probe,
  and this repo has been bitten twice by suites that did not actually
  run. **Consequence, stated rather than discovered later: `npm test`
  in app/ now requires a prior `npm run build`.** That is already the
  house order (docs/CONVENTIONS.md § Build & test lists build then
  test) and already CI's order (`app build` at ci.yml:115-116 precedes
  `app suite` at :118-119). The failure message names the fix
  verbatim. Assertions are made on `js.includes(needle)` booleans, never
  on the 442 KB haystack, so a failure prints one line instead of the
  bundle.

**(3) The existing suites pass unchanged, and the screen's other states
are untouched.** T-024's `genesis-derive.test.ts` **24/24** and
`genesis-pane-dom.test.tsx` **10/10** — byte-untouched files, green.
T-026's `project-shell.test.tsx` **11/11** (front door, the "No plan in
&lt;folder&gt;" card, the accelerators) — byte-untouched, green.
`watcher-store.test.ts`, `board-truth`, `map-*`, `watcher-truth`: all
byte-untouched, all green. The rail condition, `App.tsx`, and every
other screen state are zero-diff.

**The one existing test file that DID move, declared loudly.**
`app/test/genesis-entry.test.tsx`, +20/−5, three assertions. It could
not not move: steps 4/5/6 asserted the text of
`[data-testid="genesis-docs-count"]` — **the placeholder line itself**,
which criterion 4 orders replaced. Those three queries now read the
PANE's own header (`genesis-file-count`), plus one added
`expect(genesis-pane).not.toBeNull()` and, at step 5, three added
assertions that the two written files reach the pane's artifact list as
non-`expected` rows while the unwritten `docs/ARCHITECTURE.md` still
renders as a row. **Changed, never loosened**: every replacement
asserts strictly more than what it replaced, because it can only pass
if the pane itself rendered inside the real App. Steps 1, 2 and 3
(front door, empty board, rejected pick) are byte-untouched, and the
three criteria those steps carry are unaffected. Nothing was deleted;
no `.skip`/`.only`/`.todo` exists in any file this branch touches.
`app/test/node-builtins.d.ts` +4/−2 is one ambient field (`mtimeMs` on
`statSync`) that the staleness guard needs — test-only, no runtime code,
the same additive move T-024 made when it added `statSync` at all.

**(4) The pane's own content with docs present; its empty state with
docs empty.** `genesis-mount.test.tsx`, against T-024's landed fixture
trees — **no new fixture was authored**:

- *streak (complete)*: the north-star card carries its parsed title
  sentence and the three chips in order (person / success / non-goal);
  the backbone grid is `built, built, built, built, slot` with F-01 Log
  in the first; nine artifact rows, every one `written`, the ✓ disc SVG
  present on `docs/NORTH_STAR.md`; the footer's banking-map line
  ("Milestone 1 decomposed — the board is live.") and `stage ~8 ·
  decomposition`.
- *streak-stage4 (mid-interview)*: 5 files, `docs/decisions/001-stack.md`
  renders as an `expected` placeholder row, the backbone is all slots.
- *empty*: `docs/ · 0 files written`, seven `expected` rows, north star
  `forming…`, `stage —`, the slot's text content non-empty (a positive
  "never blank" assertion, not an absence of throw), and the failure
  fallback asserted **absent** so an empty tree can never be mistaken
  for a crash.

**(5) A throwing pane cannot take the app down.** The guard is
`GenesisPaneBoundary` at the bottom of `GenesisScreen.tsx` — React's own
boundary contract, ~45 lines, no library, nothing reusable invented for
one call site. Two design points, both pinned by tests: it does **not**
latch (its `resetKey` is `docs.seq`, so the next snapshot gets one fresh
attempt and a single torn moment cannot brick an interview for the
session), and it **wraps** the pane rather than keying it, so ordinary
renders leave the pane mounted and its change log — the writing-pulse
window T-024 built — intact.

Proven at two levels, and the first level uses the REAL pane with no
module mocking at all:

- *Screen level* (`genesis-mount.test.tsx`): the pane is handed a
  `DocsModelState` whose `effective` map is a Proxy that throws on any
  property access. `observeDocsChange` touches it first thing, so the
  genuine `GenesisPane` throws during render. Result: `genesis-screen`,
  its heading, the project path and the slot all still render;
  `genesis-pane` is gone; the fallback renders; `componentDidCatch`
  logged `"[nputer] the genesis pane failed to render"` (the
  `watcher-store.ts:422` house idiom). Then a further snapshot renders
  the real pane again at `docs/ · 5 files written` — recovery, asserted.
- *Shell level* (`genesis-pane-boundary.test.tsx`): the real App, real
  store, real docs-model and parser, driven front door → `genesis`, with
  the pane module replaced by a **switchable** stand-in (it delegates to
  the real component whenever the switch is off, so the recovery leg is
  the genuine pane). The hostile-state probe cannot reach this level —
  the store builds every `DocsModelState` itself from the IPC payload —
  which is why the stand-in exists here and only here. With the switch
  on: `<main data-screen="genesis">` still mounted, `<h1>nputer</h1>`
  still there, "Starting a plan in" still there, `data-seq` advanced to
  21 (the store kept running underneath), and only the pane's subtree
  replaced by the fallback.

**What the user actually sees instead** (captured from the rendered
DOM in this worktree, then the probe deleted):

    interview
    Starting a plan in /tmp/sketchpad
    The planner writes into docs/ and this screen renders whatever
    lands — nothing is copied, nothing is imported.
    the view of docs/ stopped rendering
    Nothing was written and nothing was lost — this screen only reads.
    Your files are on disk and the watcher is still live; the next file
    written to docs/ tries this view again.

The copy deliberately refuses to imply data loss, because there is none
— the screen only reads (ADR-017). It also deliberately avoids the
string "the project, so far", so the fallback can never satisfy this
task's own bundle grep.

### The bundle grep — before and after, run here

Same command both sides, in this worktree, after `npm run build`.
BEFORE is the untouched branch point; AFTER is HEAD.

    cd app && npm run build && grep -c -F '<needle>' dist/assets/*.js

    needle                          BEFORE (main@f7fdf13)   AFTER (HEAD)
    ------------------------------  ---------------------   ------------
    the project, so far                     0                    present
    genesis-artifact                        0                    present
    genesis-north-star                      0                    present
    genesis-backbone                        0                    present
    grows as you answer                     0                    present
    genesis-screen                          1                    present
    genesis-pane-slot                       1                    present
    nothing written yet                  present                 ABSENT

Bundle: `index-BP8uDHFW.js` **429.66 kB** before →
`index-DvrlAOQE.js` **442.05 kB** after. The +12.4 kB is the pane and
its derivation module arriving in the shipped JS for the first time.
(`genesis-pane` alone is a useless probe: it matches as a substring of
`genesis-pane-slot`, which T-026 already shipped. That is why every
probe above is either the pane's own testid suffix or its own copy.)

**T-026's merge-time finding is therefore now closed on all three of
its own terms**: there IS a src-side import of `app/src/genesis/`, the
regenerated graph DOES carry the C-05→C-13 file edge from
`GenesisScreen.tsx` (measured below), and the built bundle DOES contain
GenesisPane's own strings. T-024-s1 and T-026-s7's served-bundle probes
now have a route to the pane; neither is discharged here (they want the
E2E lane's dev harness), but the blocker they named is gone.

### Mutation drills — is any of this load-bearing?

Each planted, run, reverted; the tree was clean and the suites green
after each revert, and the final rebuild reproduced the same asset hash
(`index-DvrlAOQE.js`), so no drill left residue.

1. **Unmount the pane** (slot back to a placeholder `<p>`) →
   **15 of 19 tests red** across the three genesis files: all of
   genesis-mount's criterion-1, -4 and -5 tests, all three of
   genesis-pane-boundary, and genesis-entry steps 4/5/6. As a bonus,
   `npm run build` itself failed first — `tsc` TS6133 on the now-unused
   `GenesisPane` import, so the typecheck notices an unmount too.
2. **Unmount the pane AND rebuild** (`npx vite build`, skipping tsc) →
   the bundle test goes red naming the exact missing string
   (`"the project, so far" must reach the shipped bundle`), and the
   bundle shrinks back to **429.29 kB**. Criterion 2's assertion is
   real, not decorative.
3. **Stale-build guard** — drill 1 also proved the freshness half
   independently: with dist left over from before the mutation, the
   *contents* test still passed while the *staleness* test went red
   (`dist/ predates src/components/shell/GenesisScreen.tsx`). That is
   exactly the false pass the guard exists to catch, caught.
4. **Neuter the boundary's fallback** (`render()` returns children
   unconditionally) → criterion-5 tests red at BOTH levels; the
   healthy-path test stayed green, so the drill discriminates.
5. **Remove the boundary entirely** (`<GenesisPane>` unwrapped) → the
   throw escapes uncaught (`T-037 PROBE: the pane threw while
   rendering`) and takes the render down at both levels. The guard is
   necessary, not ornamental.

### Every new test actually executes

`expect("PROBE").toBe("EXECUTED")` injected as the FIRST statement of
every one of the **13** new `it()` bodies (10 in genesis-mount, 3 in
genesis-pane-boundary), run, then reverted:

    Test Files  2 failed (2)
         Tests  13 failed (13)

Every body executes; nothing is inert. Reverted, and both files are
byte-identical to their committed form (`grep -c 'expect("PROBE")'` → 0
in both). The three moved assertions in `genesis-entry.test.tsx` live
inside `it()` bodies T-026's verifier already canary-proved (45/45), and
drill 1 above re-proves those three specifically by turning exactly
steps 4/5/6 red.

### Suites — run, not assumed (ADR-011 order, from this worktree)

macOS 15/Darwin 25.6, node 22.22.0. All re-run AFTER the docs edits in
this commit landed (T-024's live-tree lesson: `lib/parser`'s smoke test
and the app's dogfood suites parse the LIVE `docs/` tree, so adding
`T-037-s1-*.md` and these notes is a code-free change that can still
break a suite).

| suite | command | baseline @f7fdf13 | HEAD |
|---|---|---|---|
| lib/parser | `npm test` | 159/159 (10 files) | **159/159 (10 files)** |
| lib/parser | `npx tsc --noEmit` | exit 0 | **exit 0** |
| app | `npx tsc --noEmit` | exit 0 | **exit 0** |
| app | `npm run build` | exit 0 | **exit 0** |
| app | `npm test` | 455 (24 files) | **468 passed (26 files)** |
| app/src-tauri | `cargo test` | 139 + 2 ignored | **139 passed + 2 ignored** |
| tools/e2e | `npx playwright test` | 17/17 | **17/17 in 5.1s** |

**455 → 468 = +13**, exactly the two new files (10 + 3); no
pre-existing test was deleted, skipped or loosened, and
`genesis-entry.test.tsx` still reports its same 6. cargo is unchanged
because this branch touches no Rust (zero-byte diff under
`app/src-tauri/`); it was run anyway, because that is the lesson T-024
paid for.

**Token lint**: `node scripts/lint-tokens.mjs` from tools/e2e produces
**byte-identical output on main and on this branch** (`diff` → no
difference) — one pre-existing hit on a regex literal in
`app/src/genesis/genesis-derive.ts:231`, which T-037 neither caused nor
touches. That lint is RED on main today and gates CI before every
install step; filed as **T-037-s1** (it is T-020-s5's predicted second
class, arrived). The `--selftest` is green (17 samples). My own added
classes are tokens-only: the mount changes four utilities on the slot
(`min-h-0 flex-1 overflow-hidden`, dropping `gap-2 p-6`) and the
fallback uses `bg-sidebar px-6.5 py-5.5 text-destructive max-w-120
bg-muted rounded-sm font-mono` — every one already emitted by the
existing sheet; zero arbitrary values, zero `[prop:value]`, zero
`bg-(--x)`, zero stock-palette utilities, zero raw hex.

### For the integrator: the graph regen delta, measured

The interim T-009-s1 rule **FIRES** (this diff touches `*.tsx` outside
docs/). I regenerated in-branch to MEASURE, then restored
`docs/architecture/graph.json` to the committed bytes — sha256 back to
`ca146f89f976453645f037b6016ab9eef896a6d0f22577cd6cc95a460dfc056d`,
working tree clean, and the two dogfood suites green again against the
committed graph (17/17). **The graph is deliberately NOT regenerated in
this commit**; that is the merge ritual.

What the regen does, derived here rather than guessed:

- files **84 → 86**: adds `app/test/genesis-mount.test.tsx` and
  `app/test/genesis-pane-boundary.test.tsx`; nothing removed.
  Content-changed (hash/loc only): `GenesisScreen.tsx`,
  `genesis-entry.test.tsx`, `node-builtins.d.ts`.
- stats: symbols **539 → 565**, edges **909 → 941** — **32 added, ZERO
  removed**. Languages still `["ts"]`; zero `.rs` files indexed.
- **THE EDGE THIS TASK EXISTS FOR** appears:
  `f:app/src/components/shell/GenesisScreen.tsx --import[GenesisPane]-->
  f:app/src/genesis/GenesisPane.tsx`. That is the C-05→C-13 **src**
  edge whose absence T-026's merge measured three ways.
- mapping **84 → 86**; **C-05 35 → 37** (both new suites under the
  app/test umbrella). Every other component's count holds — C-06 21,
  C-08 10, C-09 3, C-10 2, C-12 11, **C-13 2** (unchanged: the lens
  gains a consumer, not a file). D2 stays empty, no unmapped node.
- **Exactly four fixture assertions move**, all in the same
  changed-never-loosened form the last three merges used:
  1. `app/test/architecture-dogfood.test.ts:266` `toBe(84)` → `86`
     (and the test name at :265, "all 84 files map" → 86);
  2. same file :274, mapping row `["C-05", 35]` → `["C-05", 37]`;
  3. same file :305, the findings array — `D1:C-05→C-13`'s `fileEdges`
     gains two entries, in sorted position:
     `app/src/components/shell/GenesisScreen.tsx → app/src/genesis/GenesisPane.tsx`
     and
     `app/test/genesis-pane-boundary.test.tsx → app/src/genesis/GenesisPane.tsx`.
     No finding is added or removed — still five D1 rows and the same
     D3s, byte-identical apart from those two fileEdges;
  4. same file :377, the relation table — **two rows move and only
     two**: `["C-05","C-10","confirmed", 16 → 19]` and
     `["C-05","C-13","undeclared", 2 → 4]`. The tally is UNCHANGED at
     **13 confirmed / 5 undeclared / 8 planned**, 26 rows: no new
     component pair appears.
  Plus `app/test/map-dogfood-render.test.tsx:181`
  `"committed graph · 84 files"` → `86`. All five verified by running
  the suites against the regenerated graph and reading the actual
  expected/received, not by forecast.
- **`lib/parser/test/smoke.test.ts` must NOT move.** It pins the
  component REGISTRY read from `docs/architecture/components/`, and this
  branch declares no component. Touching it would be T-024's rejection
  mirrored — the inventory is per-artifact, not per-regen.

**One judgment call for the integrator, flagged rather than taken.**
`C-05→C-13` stays **undeclared** (D1) after the regen, and its
character has changed: before this branch it was two TEST-suite edges
(T-024's own suites reaching its own component); now it carries a
**source** dependency of the shell on the lens. Declaring C-05 → C-13
in `docs/ARCHITECTURE.md` would clear that D1 honestly. I did not edit
ARCHITECTURE.md — that is the integrator's ritual (T-026's merge made
exactly three such truth-fixes) — but the two claims that merge left in
that file are now stale in the same place: C-05's status cell and the
"Code layout" bullet both say the lens is an unmounted slot that nothing
imports and Rollup drops. Both are false as of this commit.

### Fence proof

`git diff --stat` is the six files listed at the top, and nothing else.
Zero-byte diffs verified individually against main@f7fdf13 for:
`app/src/genesis/**` (T-024's territory — untouched, and no criterion
forced otherwise), `lib/`, `method/`, `app/src-tauri/`, `capabilities/`,
`tauri.conf.json`, `tools/`, `docs/architecture/`, `app/src/App.tsx`,
`app/src/index.css`, `app/src/styles/tokens.css`, `app/package.json`,
both `package-lock.json`, `Cargo.toml`, `Cargo.lock`. Lane note for the
concurrent T-025: that task touches `lib.rs` command registration and
adds `app/src/lib/agent-store.ts`; this branch touches neither, and
T-025 touches neither `GenesisScreen.tsx` nor `app/src/genesis/**` — the
merges are disjoint.

Security sweep over the added lines: no `innerHTML` family (asserted by
a standing test at the seam, and T-024's own standing gate still covers
`app/src/genesis/`), no `eval`, no `fetch`/`XMLHttpRequest`/`WebSocket`,
no `localStorage`, no `process.env`, no shell strings, no new IPC (three
`invoke` call sites in the app, unchanged), no new dependency and no
lockfile movement, no ACL surface change (zero Rust diff, so
`EXPECTED_GRANTS` cannot have moved). Nothing bound or contacted port
1420 at any point; no server was started; headless throughout, no screen
control, no screenshots, no real model calls. The one new console line
is `console.error("[nputer] the genesis pane failed to render", error)`
— it logs the error object, never file contents.

### @human — the visual session this task UNBLOCKS

T-024's three visual judgments (the pane against the design screen light
+ dark, the five type sizes that moved 0.5–1px, the substituted footer
right slot) are **no longer blocked**: there is now a route to the pane
in a running app — "Start an interview" on a docs-less folder, or "Start
an interview here" on a folder the app just refused. Add these two,
which are about the COMPOSITION rather than the pane, and which only
exist because of this mount:

1. **The pane inside a single-column screen.** T-024 designed it as the
   RIGHT HALF of the interview split view; T-027 builds the left half.
   Until then it sits full width inside T-026's card frame, under the
   screen's own heading block. Two things to judge: whether the pane's
   `bg-sidebar` ground reads correctly framed by a `bg-card` bordered
   box (a sidebar tone inside a card, which the design never draws), and
   whether the five-across backbone grid still reads at full width when
   it was drawn for a half-width pane.
2. **The scroll behaviour at small window heights.** The slot is
   `min-h-0 flex-1` so the pane's own `overflow-y-auto` region scrolls;
   but the shell's column is `min-h-screen`, not `h-screen`, so on a
   very short window the page may grow before the pane starts scrolling.
   Worth one look at a short window with the complete tree loaded.

Everything else on the standing list is unchanged, including T-026-s4's
question (a folder whose `docs/` holds files but no plan): note that the
answer to it now renders through the LENS rather than through the
placeholder line, so what you will see there is the pane's own
`docs/ · 0 files written` scaffold rather than "nothing written yet".

### Suggestions filed

- `docs/tasks/T-037-s1-token-lint-is-red-on-main.md` — the token lint
  exits 1 on untouched `main` (a regex literal in
  `genesis-derive.ts:231` trips the P1 pattern), and it gates CI before
  every install step, so the standing "watch the first CI run" item
  would abort at step 7 and reach none of the Linux evidence it exists
  to collect. This is T-020-s5's own predicted second class, arrived;
  triage should fold it there rather than schedule it twice.

Nothing else was found worth filing. In particular the composition
questions above are @human judgments, not defects, and T-024-s1 /
T-026-s7 already carry the served-bundle work this mount unblocks.

## Verdicts
