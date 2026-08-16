---
id: T-041
title: Shell harness — the served bundle can reach every front-door state
feature: F-03
milestone: 3
priority: 5
size: M
status: done
blocked_by: []
touches: [app-shell, tools/e2e/]
builder: claude-opus-5
verifier: claude-opus-5
built_by: "claude-opus-5 @fresh"
verified_by: "claude-opus-5 @fresh"
review: same-model
---

Absorbs: T-024-s1, T-026-s7. Triage 2026-08-16: the two deferred
served-bundle probes are ONE item with ONE blocker, and three planned
tasks are already writing cheques against it. T-024's Verification line
owed a "served-bundle probe rendering the dry-run fixture" that could
not exist (nothing mounted the pane); T-037 mounted it
(`data-testid="genesis-pane-slot"`, GenesisScreen.tsx:63), so that half
is now merely missing. T-026's Verification line owed a "served-bundle
probe of the two front-door states" and its verifier found the deeper
reason it was deferred: `window.__nputerDocsHarness` exposes only
`{ apply, getState }` (watcher-store.ts:458), and `apply` is
`applyDocsPayload`, which in a browser bundle always lands on phase
"open". `noProject`, `noDocs`+probe, `rejectedPick` and `genesis` are
produced ONLY by `applyProjectStatus`/`reducePickOutcome`, both behind
the Tauri branch — so those states are UNREACHABLE from a served
bundle today. The deferral was over-determined: a browser would not
have been enough.

Land before T-027. T-027, T-028 and T-029 each name a served-bundle
probe in their Verification lines and none of them can write one until
this exists. Serialize app-shell with T-042 and T-022 at dispatch.

## Acceptance criteria
- THE app SHALL expose a DEV-only `window.__nputerShellHarness`
  ({ applyProjectStatus, applyPickOutcome, getShell }) behind exactly
  the `!isTauri && import.meta.env.DEV` gate that already fences
  `__nputerDocsHarness` — a test surface over the shell's own state,
  never new IPC: no Tauri command, no new grant, nothing reachable
  from the packaged app. A test SHALL assert the Tauri path never
  defines it (that gate is the whole security argument and SHALL be
  looked at explicitly, not inherited).
- WHEN the lane drives the harness THE served bundle SHALL reach every
  shell phase the shipped app can reach — noProject, noDocs with a
  probe, rejectedPick, genesis, open — and `getShell` SHALL report the
  phase so a spec asserts on the phase rather than on a selector that
  could pass on a different screen.
- THE lane SHALL carry three tools/e2e specs against the real bundle
  and real CSS: the two-button front door; the "No plan in <folder>"
  card with its ○/✓ marks measured from the probe; and the genesis
  screen rendering T-024's lens with the `streak` fixture inside
  `genesis-pane-slot` — the probe T-024 could not write.
- THE lane SHALL run on its own vite on `NPUTER_E2E_PORT` (default
  14520) with `reuseExistingServer: false`; setting it to 1420 already
  throws at config load and that guard SHALL stay — no spec starts or
  contacts a server it does not own.
- THE existing suites SHALL be unchanged: app vitest, the 17 existing
  lane specs, and `npm run lint:tokens` all green; zero new tokens.

Verification: headless — `npx playwright test` from tools/e2e/, one
worker, retries 0, no skips, its own vite; plus the app suite. @human:
none — the visual judgments on these screens stay on the open session's
list; this task proves assembly, not taste.

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-16, branch `t041-shell-harness`
(worktree ../nputer-t041). Branch point: main@2961599 (the dispatch
commit). Baselines measured there and reproduced here before any edit:
lib/parser **159/159**, app **483/483** (28 files after this branch;
27 before), cargo **208 passed + 3 ignored**, tools/e2e **17/17**,
`lint:tokens` clean at 37 files.

Seven files, all new except one: `app/src/lib/watcher-store.ts` (the
harness + one refactor), `app/test/shell-harness.test.ts` (new),
`tools/e2e/fixtures/shell.ts` (new), `tools/e2e/tests/shell-harness.ts`
(new, helpers — not a spec), and the three new lane specs
`front-door.spec.ts`, `no-plan-card.spec.ts`, `genesis-screen.spec.ts`.
Plus this file and two suggestions. **Zero diff** under
`tools/e2e/scripts/`, `docs/CONVENTIONS.md`, `app/src-tauri/`,
`lib/parser/`, `method/`, `docs/architecture/`, every lockfile, and
every existing file in `tools/e2e/` (the three new specs and their two
new modules are additions; `helpers.ts`, `preflight.ts` and
`playwright.config.ts` are untouched — `openApp` and `repoRoot` are
IMPORTED, never edited).

### What was built, and the one design call

**`window.__nputerShellHarness = { applyProjectStatus, applyPickOutcome,
getShell }`** — installed in `startDocsWatcher` (watcher-store.ts:547)
inside the SAME `if (!isTauri) { if (import.meta.env.DEV) { … } }` block
(:533-534) and the same statement sequence as `__nputerDocsHarness`
(:535). Not a copy of the gate: the same gate.

- `applyProjectStatus` is the module's own `applyProjectStatus` — the
  function the Tauri path calls with `docs_snapshot`'s answer. Passed by
  reference, so there is no second implementation to drift.
- `applyPickOutcome` is `commitPickOutcome`, which is **`runPicker`
  minus the `invoke`**. The reduce+notify+echo body was extracted from
  `runPicker` (watcher-store.ts:619; `runPicker` at :600) so
  the harness drives the exact code a real picker drives, identity
  discipline and the "never fake an echo" seq rule included. This is the
  dispatch's "expose the shell's real reducers, not a parallel
  implementation" requirement made structural rather than promised: a
  parallel implementation would have to be written on purpose now,
  because the only spelling in the file is the shared one.
- `getShell` is `shellHarnessSnapshot` (watcher-store.ts:442) →
  `ShellHarnessSnapshot`, a **summary, not `ShellState`**: the harness is
  read across `page.evaluate`, which structured-clones, and
  `DocsModelState` carries two `ReadonlyMap`s that do not survive that
  trip. It reports `phase` FIRST (the criterion's point) and `screen`
  from the real `selectScreen` — not a second opinion about what a phase
  means — plus resolvedDir/resolvedProbe/genesisDir/rejectedPick/
  picking/indexing and a six-field docs summary.

**WHERE IT LIVES, and why — beside the docs harness in
`watcher-store.ts`, not in its own module.** The dispatch asked for the
reasoning, and it is a security argument rather than a taste one. The
three things the harness needs — `applyProjectStatus`,
`commitPickOutcome`, and the module-level `shell` + `listeners` — are all
module-private. A separate module could only reach them through NEW
EXPORTS on the store: an exported `applyProjectStatus`, an exported way
to mutate the live shell and notify. Those exports exist in production
whether or not anything imports them, so the harness's blast radius
would grow from "a dev-only window property" to "a permanently widened
store API that a future non-test caller can reach for". Keeping it here
costs one `declare global` entry and buys: one gate to audit instead of
two that can drift, **zero new RUNTIME exports**, and the reducers by
reference rather than by re-export. (`git diff main -- app/src | grep
'^+export'` is exactly one line — `export interface
ShellHarnessSnapshot`, a TYPE, erased at build; no export was removed
or changed.) The counter-argument — that
`watcher-store.ts` gains ~60 lines of test surface — is real and is the
price; it is bounded by the fact that all of it is inside the DEV block
and provably absent from the bundle (below).

### Criteria → evidence map

**C1 — a DEV-only harness behind exactly the docs harness's gate; no new
IPC; a test that the Tauri path never defines it.**
watcher-store.ts:349-366 (the `ShellHarnessSnapshot` type, with its
docstring from :337), :393-397 (the `declare global` entry, security
note from :378), :442-461 (`shellHarnessSnapshot`), :547-551 (the
install, inside the existing gate at :533-534), :619-630
(`commitPickOutcome`, split out of `runPicker` at :600).
**No Tauri command, no grant, no `invoke`, no `listen`, no
`emit` added** — `git diff main -- app/src` contains zero new
`invoke(`/`listen(`/`emit(` call sites, `app/src-tauri/` is a zero-byte
diff, and `EXPECTED_GRANTS`/capabilities/tauri.conf.json are untouched by
construction (no Rust in the diff at all). Test:
`app/test/shell-harness.test.ts`, 8 tests, both halves of the gate
separately (see obligation 2).

**C2 — every shell phase reachable, and `getShell` reports the phase.**
All five reached, each asserted by PHASE and then by what the phase
renders:
`noProject` (front-door.spec.ts:25), `noDocs` + probe
(no-plan-card.spec.ts:47 and :93), `rejectedPick`
(no-plan-card.spec.ts:115 — and :144 for the `error` shape),
`genesis` (genesis-screen.spec.ts:46, :71, :171), `open`
(front-door.spec.ts:102, no-plan-card.spec.ts:111). The vitest half
sweeps the same five in one narrative
(`reaches every phase the shipped shell can reach`).
`expectPhase()` (tools/e2e/tests/shell-harness.ts:81) asserts the
harness's `phase` AND `screen` AND that the DOM's `data-screen` agrees —
so a disagreement between the shell and what is on screen is a failure
rather than an unnoticed truth.
**Why the phase matters, demonstrated rather than asserted:**
`data-screen="empty"` is shared by THREE different shell states, and
no-plan-card.spec.ts:121 pins the case that breaks selector-only
probes — a rejected pick over an open project reads
`phase: "open", screen: "empty"`, with the board's model untouched
underneath. A selector assertion cannot tell that from a launch that
resolved nothing; `getShell` can.

**C3 — three lane specs against the real bundle and real CSS.**
- `tools/e2e/tests/front-door.spec.ts` (3 tests) — the two-button
  front door: labels, the `⌘O · ⌘N` hint, the one-row layout measured
  from bounding boxes, no rail, and phase `open` taking the board back.
  Real CSS: the ink pill's computed `background-color` equals the page's
  own resolution of `--primary` (probe element, so the served sheet is
  what answers, not a hard-coded hex), its colour equals
  `--primary-foreground`, the outline button's border is `1px` of
  `--input`, the hint resolves `--muted-foreground` and Geist Mono; then
  a **trusted click** on Toggle theme re-measures all of it in dark and
  asserts the fill actually moved.
- `tools/e2e/tests/no-plan-card.spec.ts` (4 tests) — the "No plan in
  &lt;folder&gt;" card. The ○/✓ marks are **measured from the probe**:
  the spec derives the four expected marks from the probe it sent and
  checks them row by row, both for a mixed probe (○ ○ ✓ ✓, with the
  found `.git` carrying its clause) and for an all-false probe (four ○,
  no ✓ anywhere, counted). Real CSS: the ✓ glyph resolves
  `--review-disc`, the ○ resolves `--muted-foreground`. Adopt asserted
  absent case-insensitively over the card's rendered text. The rejected
  half returns to the board on a **trusted click** of "keep current
  project".
- `tools/e2e/tests/genesis-screen.spec.ts` (3 tests) — see C3's third
  clause below.

**C3's third clause — the probe T-024 could not write.**
`genesis-screen.spec.ts:68` drives the served bundle to phase `genesis`
and pushes T-024's `streak` tree through the docs harness, then asserts
**the PANE's own strings and testids INSIDE `genesis-pane-slot`**, never
the screen's: `genesis-pane`, "the project, so far",
`genesis-file-count` = `docs/ · 9 files written`, the north-star title
byte-for-byte (`A habit tracker that lives where its user already is:
the terminal.`), the three `genesis-chip`s by `data-kind`
(person/success/non-goal), five `genesis-feature` cells
(F-01 Log / F-02 Week view / F-03 Habit management / F-04 History &
stats, then the F-05 slot), nine `genesis-artifact` rows by
`data-path`+`data-status` in banking-map order, the comment-aware
`genesis-assumption-badge` counts (`4 [?]` on NORTH_STAR — five raw
markers, one inside the skipped-Q4 HTML comment — and `2 [?]` on STATE,
none on ROADMAP), `genesis-stage` = `stage ~8 · decomposition`,
`genesis-next` = `Milestone 1 decomposed — the board is live.`, and
`data-stage="8"` on the pane. Every one of those is scoped through the
slot locator. The screen-level negatives are asserted too
(`genesis-pane-failed` absent, the retired placeholder string absent).
**The fixture is T-024's actual tree** — `tools/e2e/fixtures/shell.ts`
reads `app/test/fixtures/genesis/streak/docs` from disk and refuses
loudly if it is missing or no longer nine files, rather than carrying a
copy that could rot into being true of something else.

**C4 — own vite on `NPUTER_E2E_PORT`, `reuseExistingServer: false`, the
1420 throw stays.** `tools/e2e/playwright.config.ts` and `preflight.ts`
are **zero-byte diffs** (`git diff main -- tools/e2e/playwright.config.ts
tools/e2e/preflight.ts | wc -c` = 0), so the guard is untouched by
construction. Re-derived anyway rather than assumed:
`NPUTER_E2E_PORT=1420 npx playwright test` throws at config load with
the standing message, before anything binds. Nothing in this branch
starts or contacts a server it does not own; the only port the lane bound
all session was 14520.

**C5 — existing suites unchanged, zero new tokens.** Numbers under
obligation 5. `app/src/styles/tokens.css` and `app/src/index.css` are
zero-byte diffs; the branch adds no `className` anywhere (the only
`app/src` change is `watcher-store.ts`, which renders nothing), so "zero
new tokens" is structural rather than lint-attested — and `lint:tokens`
is clean at 37 files regardless.

### The six proof obligations

**1. The three specs green against the real bundle, with the phase
assertions shown.** `npx playwright test` from tools/e2e/ →
**27 passed (6.6s)**, headless, one worker, retries 0, no skips: the 17
existing specs plus these 10. The phase assertions, as they run:

    front-door.spec.ts        browser -> noProject -> open
    no-plan-card.spec.ts      noDocs(probe) ; noDocs(empty probe) ;
                              open+rejectedPick -> open ; noProject+error
    genesis-screen.spec.ts    noDocs -> genesis ; genesis + streak ;
                              genesis (layout/paint)

Each of those is an `expectPhase(page, phase, screen)` call, which
checks the harness's `phase`, its `screen`, and the DOM's `data-screen`
together.

**2. THE DEV GATE PROVEN BOTH WAYS — and drilled both ways.**
- *Runtime half, by test*: `app/test/shell-harness.test.ts`, describe
  "the gate, runtime half" — the store is re-imported with
  `__TAURI_INTERNALS__` present (it decides `isTauri` at module load),
  `startDocsWatcher()` runs to completion, and the test first proves it
  really took the IPC path (`listen("docs-changed")`,
  `invoke("docs_snapshot")`, phase → `noProject`) so that "no harness"
  cannot be true for the boring reason that nothing ran. Then
  `__nputerShellHarness` and `__nputerDocsHarness` are both `undefined`.
  A second test runs every other entry point the store has
  (`pickProjectFolder`, `pickGenesisFolder`, `startGenesisHere`,
  `runIndexRepo`, `keepCurrentProject`) and re-checks.
- *Build half, by grep of the shipped bundle* (the T-037 pattern, with
  its staleness guard and its refusal to skip on a missing dist). Over
  `app/dist/assets/index-vTAlOtQD.js` (442,069 bytes):

      __nputerShellHarness         0
      __nputerDocsHarness          0
      __nputerEchoes               0
      "browser dev harness active" 0     (the DEV block's fingerprint)
      applyPickOutcome             0
      -- controls, same bundle --
      "no project open —"          1
      "model-updated"              1
      "No plan in"                 1
      "the project, so far"        1

  The controls matter: the store and the pane ARE in this bundle, so the
  four absences are about the gate and not about a bundle that happens
  to be missing the module.
- *And the strongest form of the build half, unasked:* **the harness
  contributes ZERO BYTES.** A variant source was built consisting of
  main's `watcher-store.ts` plus ONLY the `runPicker`/`commitPickOutcome`
  split — no harness, no type, no snapshot function, the test file held
  aside — and the emitted asset is **byte-identical** to the full
  branch's: `dist/assets/index-vTAlOtQD.js`, sha256
  `3132ec98549553481f9422b8e0f999621b80406850732d8dfa64ba0d9c6d63fb`,
  442,069 bytes, from both trees. So the entire production delta of this
  branch is the refactor. (For scale: pristine main builds
  `index-DvrlAOQE.js`, 442.05 kB — the +0.02 kB is the named function.)
- *Both halves DRILLED, since a gate nobody attacked is a gate nobody
  tested.* (a) `import.meta.env.DEV` replaced by `true` → rebuild →
  `__nputerShellHarness`, `__nputerDocsHarness` and the console line all
  appear in `dist/assets/index-C6rcLpYw.js` (442.71 kB) and the bundle
  test goes RED with "the shell harness must not reach production:
  expected true to be false". (b) the `!isTauri` half dropped (the
  install hoisted above the branch, guarded by DEV alone) → both runtime
  tests RED with "the shell harness must not exist under Tauri: expected
  { …(3) } to be undefined", and the staleness pin fired too, which is
  its own small proof that the staleness guard works. Both drills
  reverted from a saved copy and re-verified by sha256 on the source
  (`49b504d96e5ff7bd0e6d795240825ddfb783b26a0c2b4b095f26afefb3e9e6ef`)
  AND on the rebuilt asset (back to `index-vTAlOtQD.js`, same sha).

**3. The genesis spec renders T-024's actual pane.** Covered above under
C3's third clause: every content assertion is `slot.getByTestId(…)` or a
`slot.locator(…)`, i.e. scoped inside `genesis-pane-slot`, and the
strings are the PANE's (`the project, so far`, `genesis-file-count`,
`genesis-chip`, `genesis-feature`, `genesis-artifact`,
`genesis-assumption-badge`, `genesis-stage`, `genesis-next`), never the
screen's (`genesis-screen`, `genesis-project-dir`). The screen's own
strings are asserted separately in the first test, where they are the
subject. The fixture is read from `app/test/fixtures/genesis/streak`,
so "T-024's lens with the streak fixture" is literal.

**4. Every new test executes.** Poison injection —
`expect("PROBE").toBe("EXECUTED")` as the FIRST statement of every new
`it()`/`test()` body, run, then reverted:
- `app/test/shell-harness.test.ts`: 8 injected → **8 failed (8)**.
- the three lane specs: 3 + 4 + 3 = 10 injected → **10 failed**, each
  named in the failure list. Nothing is inert.
Reverted from copies taken before injection and confirmed equal by
sha256 — `app/test/shell-harness.test.ts`
`dac4009bb6c3b1faa6504807566cc3613ea82201d8d69077b633a6d104672e34`,
`front-door.spec.ts`
`af4d830339ff4d8fea3acc7d7e80b7050e74035442fd7dd15f2dbc7d2430f064`,
`no-plan-card.spec.ts`
`a4295a0248fd4251b1d3f359fee2c81b5529b697d7b74911c277a89890284266`,
`genesis-screen.spec.ts`
`73d82af9694dd6bd109adf9a5714edb63f06eb256ddd9aa7f39f9ac8bcf19083`
— and both suites re-run green after the revert.

**5. Suites.** macOS 15/Darwin 25.6, node v22.22.0, ADR-011 order, from
this worktree with fresh installs:
- lib/parser: `npm ci` + `npm test` → **159 passed (10 files)**;
  `npx tsc --noEmit` clean. Re-run AFTER the two suggestion files landed
  in the live `docs/tasks/` tree (T-024's lesson: that suite parses the
  live tree, so a docs-only commit can red a package whose files never
  moved) → still **159/159**.
- app: `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**252 modules**, `index-vTAlOtQD.js` 442.07 kB /
  `index-BheOMAjN.css` 41.24 kB), `npm test` → **491 passed (28 files)**
  = 483 + the 8 new. No pre-existing test was edited, deleted or
  loosened (`git diff main -- app/test` is one new file and nothing
  else).
- app/src-tauri: bare `cargo test` → **208 passed + 3 ignored**, exit 0
  — the baseline exactly, as it must be for a branch with zero Rust.
  Per-target: 100, 28+1, 68, 3, 7, 0+1, 2+1. Run because "a suite not
  run is a suite not known", not because the diff suggested it.
- tools/e2e: `npm ci` + `npx playwright test` → **27 passed (6.6s)**
  (17 existing, all green and untouched, + 10 new);
  `npm run typecheck` clean; `npm run lint:tokens` **clean, 37 files**;
  `npm run lint:tokens -- --selftest` **43 samples green**.

**6. Fence.** `git diff --stat main..HEAD` touches nothing under
`tools/e2e/scripts/`, `docs/CONVENTIONS.md`, `app/src-tauri/`,
`lib/parser/`, `method/`, or any lockfile —
`git diff main -- tools/e2e/scripts/ docs/CONVENTIONS.md app/src-tauri/
lib/parser/ method/ '**/package-lock.json' '**/Cargo.lock' | wc -c` is
**0**. `docs/architecture/graph.json` is also a zero-byte diff (not
regenerated — the integrator's ritual). Neither T-046's nor T-047's
worktree was entered.

### For the integrator: the graph regen delta, forecast not measured

The interim T-009-s1 rule **FIRES** — the diff carries `*.ts` outside
`docs/` (`app/src/lib/watcher-store.ts`, `app/test/shell-harness.test.ts`,
and three `tools/e2e` files). Deliberately NOT regenerated here, and
deliberately NOT measured in-branch either, because measuring it means
running the regen and restoring, which is the integrator's ritual to
perform on the merged tree.

Forecast, derived from the indexer's own rules rather than guessed:
- **`tools/e2e/**` is invisible**: `.nputerignore` carries `tools/`
  (T-020 §3), so the three new lane files cannot move the graph. Every
  claim below is about the two app files only.
- files **88 → 89**: adds `app/test/shell-harness.test.ts`; nothing
  removed. `app/src/lib/watcher-store.ts` is content-changed (hash/loc).
- symbols and edges rise by the new file's exports plus
  `watcher-store.ts`'s new `ShellHarnessSnapshot` /
  `shellHarnessSnapshot` / `commitPickOutcome`; the new test file imports
  `node:fs`, `node:path`, `vitest`, `../src/lib/watcher-store` and
  `@tauri-apps/api/*` (mocked), so its edges land in C-05 and externals.
- **No component is declared here**, so the T-024-s5 three-fixture rule
  does NOT fire in its registry form: `lib/parser/test/smoke.test.ts` is
  a REGISTRY pin and must not move. A merge regen moves at most the two
  APP dogfood fixtures: `app/test/architecture-dogfood.test.ts` (the
  file count `toBe(88)` and, if the new edges cross a boundary, the
  `["C-05","C-10",…]` observation count) and
  `app/test/map-dogfood-render.test.tsx` (the `committed graph · 88
  files` string). Both are the same two lines T-026's and T-037's merges
  moved.

### Deliberate silences and honest limits

- **The lane drives Chromium's DEV bundle, not the packaged wkwebview**
  — T-020's recorded limit, unchanged. What is new is that the served
  bundle can now reach the states; the engine question is still the
  boot check plus the @human pass.
- **The harness proves the SHELL handles these payloads, not that Rust
  sends them.** Rust pins its own JSON
  (`genesis_and_no_docs_wire_shapes_are_pinned`, docs_watch.rs:2641) and
  the TS mirror is hand-written; nothing compares the two, and
  tools/e2e now mirrors the mirror. Filed as **T-041-s2** rather than
  quietly widened into this task.
- **`getShell` is a summary, not `ShellState`.** `indexOutcome` and the
  docs Maps are not exposed. Adding them costs a serialization decision;
  nothing needed them, and a harness that returns more than a spec can
  assert on invites specs that assert on internals.
- **Picker flows stay @human** — native dialogs are unreachable from a
  browser harness and tauri-driver has no macOS (T-020 §9). The harness
  deliberately does not simulate the dialog; it delivers the OUTCOME,
  which is where the shell's own behaviour starts.
- **The genesis screen's scroll behaviour is measured, not fixed** —
  T-041-s1. The probe pins today's answer with a comment naming the
  file and the reconciliation.
- **No boot-check run** (T-046 owns that script) and **nothing bound or
  contacted port 1420** at any point: the lane bound 14520 only, and the
  human's live app was never touched. No screen control, no screenshots,
  no input injection beyond Playwright's own trusted input into its own
  headless browser. No model call. No new dependency — `git diff main --
  '**/package.json' '**/package-lock.json'` is empty.

### @human (listed, never performed here — headless session)

1. **The genesis composition at a real window size**, now that
   T-041-s1 has measured what it does: with the complete tree the whole
   page scrolls rather than the pane. Confirm that is unwanted before
   T-027 bounds the column.
2. The standing T-024/T-026 visual items are unchanged by this branch —
   it adds no UI and no CSS, and the shipped bundle's only delta is a
   function extraction.

### Suggestions filed

- `T-041-s1-genesis-column-is-unbounded.md` — the shell column is
  `min-h-screen`, so the page grows (1110px against a 720px viewport
  with the streak tree) and the pane's own scroll region never engages;
  measured numbers, and it belongs to T-027's composition call.
- `T-041-s2-the-wire-shape-is-pinned-twice-and-compared-never.md` — the
  picker/status JSON is pinned in Rust and mirrored by hand twice in TS,
  with no machine comparison anywhere; the harness raises the stakes
  because three specs now assert shell coverage against payloads a TS
  file invented.

## Verdicts

2026-08-16 — claude-opus-5 @fresh, verifier — same-model review (the
builder was claude-opus-5 too; recorded so this is not read as an
independent-model check): **APPROVED**, with two suggestions filed
(s3, s4) and one CORRECTION to a suggestion the branch itself filed
(T-041-s1's remedy is wrong; see s3). Every criterion was re-derived
from the branch — every number below is mine, measured, not read from
the notes. Merge-base confirmed `2961599`, HEAD `f29ac7c`, 10 files.

**Suites (macOS 15/Darwin 25.6, node v22.22.0, ADR-011 order, this
worktree).** lib/parser `npx vitest run` **159 passed (10 files)**,
`tsc --noEmit` clean. app `npm run build` exit 0 (252 modules),
`npx tsc --noEmit` clean, `npx vitest run` **491 passed (28 files)**.
src-tauri bare `cargo test` **208 passed + 3 ignored**, exit 0
(per-target 100 / 28+1 / 68 / 3 / 7 / 0+1 / 2+1). tools/e2e
`npx playwright test` **27 passed (6.7s)**, one worker, retries 0, no
skips; `npm run typecheck` clean; `lint:tokens` **clean, 37 files**;
`--selftest` **43 samples green**. Every number in the notes reproduces.

**C1 — THE GATE. Both halves re-derived, then attacked; it holds.**
*Runtime half.* The test asserts the positive first — `listen("docs-changed")`,
`invoke("docs_snapshot")`, phase → `noProject` — so "no harness" cannot
pass for the boring reason that nothing ran; then both harnesses are
`undefined`. I poisoned all 8 bodies and all 8 went red, so the
assertions execute.
*Build half, my own grep, wider than the notes'.* Over my own build of
`dist/assets/index-vTAlOtQD.js` (442,069 B): `__nputerShellHarness` 0,
`__nputerDocsHarness` 0, `__nputerEchoes` 0, `"browser dev harness
active"` 0, `getShell:` 0, `applyPickOutcome:` 0, `failureCount` 0
(that field exists only in `shellHarnessSnapshot`, so the harness OBJECT
is provably never constructed, not merely unattached). In-bundle
controls, same file: `"no project open —"` 1, `model-updated` 2,
`"No plan in"` 1, `"the project, so far"` 1, `docs-changed` 1,
`docs_snapshot` 1, `genesis-pane-slot` 1. The single lowercase
`harness` hit is the pre-existing browser-screen copy ("no Tauri IPC —
dev harness active, no snapshot applied yet"), shipped on main too.
*The attacks.* (a) `npx vite build --mode development` does **not** flip
DEV — the emitted asset is sha-identical to the production one
(`3132ec98…`), because Vite's CLI forces `NODE_ENV=production` for
builds. (b) `NODE_ENV=development npm run build` DOES flip it: 696,302 B,
all four harness markers present. That is the one lever, it is an
inherited env var rather than any configured path, **the runtime half
still fences it** — I read the emitted code, and the install is still
inside `if(NS=!0,!Wo){…}` with `Wo` the `__TAURI_INTERNALS__` check —
and the branch's own bundle test reds on the next `npm test`. Filed as
**T-041-s4** with the table. (c) `npm run preview` serves `dist/`, which
has no harness. (d) No new IPC: `git diff main -- app/src` adds zero
`invoke(`/`listen(`/`emit(` call sites, `app/src-tauri/` is a zero-byte
diff. (e) `+export` in `app/src` is exactly one line and it is an
`interface` (erased at build); nothing was removed or changed;
`isTauriRuntime` is pre-existing (main:377).

**The extraction is behaviour-preserving.** Line by line against main:
`const before = shell` is still read after `invoke` resolves (it is the
first statement of the callee, invoked with the awaited value);
`if (next !== before) {…}` became `if (next === before) return; …`, the
same branch inverted; assignment → listener loop → echo condition
(`next.docs !== before.docs && next.docs.seq > before.docs.seq`) are in
the same order with the same text; the call sits inside the SAME `try`,
so a throw from the reducer or a listener still lands in the same
`catch` and sets `rejectedPick`, and `finally` still clears `picking`.
`reducePickOutcome` itself is untouched (`return prev` by identity for
`cancelled` and `busy`), and the identity discipline survives the new
path — `applyPickOutcome({kind:"cancelled"})` leaves `getShellState()`
`toBe(before)` and notifies no one (the subscriber log is exactly
`["noDocs","genesis"]`). Nothing before `invoke` moved: `!isTauri ||
shell.picking` still guards, so the harness cannot re-enter the picker.

**C2 — the phase assertions genuinely discriminate.** I built the
confusable cases and required red. Four mutations, one lane run:
`noDocs`→`noProject` (same `screen:"empty"`) RED "the shell must be in
phase noProject / Received: noDocs"; the confusable pair
`open`+rejectedPick→`noDocs` (same `screen:"empty"`) RED "Expected
noDocs / Received: open"; `noProject`→`noDocs` RED; and phase-correct
screen-wrong `genesis`/`board` RED at the screen line. So a spec
asserting phase X cannot pass while the shell is in phase Y even when
`data-screen` is byte-identical — which is the criterion. All four
reverted, sha256-verified.

**C3 — the specs, and the fixture is the real one.** 10 new lane tests,
all green against the served bundle and the served sheet. The genesis
spec reads T-024's tree from disk, and I proved it rather than reading
it: perturbing ONE byte of the real
`app/test/fixtures/genesis/streak/docs/NORTH_STAR.md` (`terminal.` →
`TERMINAL.`) reds the pane assertion, with the perturbed string visible
in the browser's rendered text; adding a 10th file to the fixture
throws the loud "expected 9 markdown files … reconcile rather than
loosen". Both reverted, sha256-verified
(`0c9ee77b…` restored). Every content assertion in that test is scoped
through `slot`/`pane`; the only unscoped `page.getByTestId` calls are
the screen-level ones in test 1, where the screen is the subject, plus
the screen-level negative at :165.

**C4 — the lane owns its port.** `NPUTER_E2E_PORT=1420 npx playwright
test --list` throws at config load, in `resolveLanePort`, before
anything binds. `playwright.config.ts` and `preflight.ts` are zero-byte
diffs. The lane bound 14520 only; 1420 stayed the human's app (pid
90127) throughout, untouched, and 14520 is free again.

**C5 / fence.** `git diff main -- tools/e2e/scripts/ docs/CONVENTIONS.md
app/src-tauri/ lib/parser/ method/ docs/architecture/
'**/package-lock.json' '**/Cargo.lock' | wc -c` = **0**. All 17
pre-existing `tools/e2e` files are untouched (set intersection of
"pre-existing" and "changed" is empty); the 5 lane changes are all
additions. No new dependency.

**Zero bytes — re-derived, and it holds.** I built three trees myself:
pristine main `index-DvrlAOQE.js` **442,052 B**; main + ONLY the
`runPicker`/`commitPickOutcome` split (harness, type, snapshot function
and test file all absent) `index-vTAlOtQD.js` **442,069 B** sha256
`3132ec98549553481f9422b8e0f999621b80406850732d8dfa64ba0d9c6d63fb`;
and this branch's HEAD — **the same name, the same 442,069 bytes, the
same sha256**. So the entire production delta of this branch is **+17
bytes**, and those 17 bytes are the named function the refactor
introduced. The harness costs production exactly nothing. This deserves
to be read as the headline it is: the test surface is not "small in the
bundle", it is *not in the bundle*.

**Execution sweep.** All 18 new bodies poisoned with
`expect("PROBE").toBe("EXECUTED")` as the first statement: vitest
**8 failed (8)**, lane **10 failed**, each named. Reverted from
pre-injection copies and confirmed by sha256 —
`shell-harness.test.ts` `dac4009b…`, `front-door.spec.ts` `af4d8303…`,
`no-plan-card.spec.ts` `a4295a02…`, `genesis-screen.spec.ts`
`73d82af9…` (the notes' four hashes, independently reproduced) — and
both suites re-run green.

**Graph forecast — CONFIRMED, with the integrator's exact delta.** I ran
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored` and then restored the committed file
(`git checkout`, sha256 `a4336380…` back). Measured: files **88 → 89**
(adds `app/test/shell-harness.test.ts`, nothing removed),
`app/src/lib/watcher-store.ts` content-changed, symbols **595 → 602**,
edges **990 → 1003**. No `tools/e2e` file appears — `.nputerignore`'s
`tools/` holds. Against the regenerated graph exactly **three**
assertions move, in **two** files, and `lib/parser` stays **159/159** —
`lib/parser/test/smoke.test.ts` does NOT move, as forecast:
`app/test/architecture-dogfood.test.ts` file count `88` → `89`;
`architecture-dogfood.test.ts:579` `["C-05","C-10","confirmed",19]` →
`20` (the conditional clause in the forecast fires); and
`app/test/map-dogfood-render.test.tsx` `committed graph · 88 files` →
`· 89 files`.

**T-041-s1 — the measurement is right, the remedy is wrong.** I
reproduced s1's numbers exactly at 1280×720 with the streak tree:
viewport **720**, `documentElement.scrollHeight` **1110** (the page
scrolls), column computed `min-height` **720px** and actual height
**1110px**, slot **851**, pane **849**, pane's `overflow-y-auto` region
**796/796** — never engages. Two things s1 understates, both measured:
(1) the page overflows at every ordinary window size, not just short
ones — 800×600 (the app's own configured window size) overflows by
**572px**, 1024×768 by 373, 1280×720 by 390, 1920×1080 still by 30; the
page stops overflowing only at a viewport height of **1110px**, and the
pane's own region never engages at ANY height, because the column is
content-sized rather than bounded. (2) s1's note 1 says flipping the two
`min-h-screen` to `h-screen` "is the whole mechanical fix" — I made that
edit and measured it: both columns bound to 720px and **the page still
scrolls 1110 vs 720, the pane's region still 796/796**. The missing link
is `min-h-0` on `GenesisScreen.tsx:37`; with all three edits the page
stops scrolling (720/720) and the pane's region engages (796/406).
Filed as **T-041-s3**. Both probes reverted, sha256-verified.
*Ruling on the spec: it PINS, it does not bless.* The block at
`genesis-screen.spec.ts:197-228` carries the mechanism, names T-041-s1,
and states the reconciliation; both messages read "today the PAGE grows
past the viewport" and "…so the pane's own region is never asked to
scroll". I drilled it: bounding the column reds the test. A tripwire on
today's truth is the right thing for a task that proves assembly, not
taste — accepted.

**T-041-s2 — verified as stated and correctly scoped.** The Rust pin
`genesis_and_no_docs_wire_shapes_are_pinned` is at docs_watch.rs:2641
and asserts the serialized JSON literally; the TS mirror in
`watcher-store.ts` and the lane's mirror in `fixtures/shell.ts` are
hand-written; no test in the repo feeds Rust-produced JSON into the TS
reducers and no shared fixture exists. The suggestion's own limit is
right: T-041 adds no IPC and changes no wire shape, so it neither
creates nor widens the gap. Worth closing before T-027/T-028/T-029
write more specs on this surface.

**@human, given what I measured.** The genesis composition is the item.
At the app's configured 800×600 window the interview page is 1172px
tall — you scroll the header and the interview heading off the screen to
reach the bottom of the artifact list — and at 1920×1080 it still
overflows by 30px. Judge whether the interview screen should be a
bounded frame (pane scrolling inside a fixed header) or a growing page;
T-027 needs that ruling, and per s3 the fix is three class edits rather
than the two s1 named. Nothing else in this branch is visual: the
shipped bundle's only delta is a 17-byte function extraction.

Everything reverted; tree clean; no stray processes or listeners; port
1420 never bound or contacted; no boot-check run; no model call.
