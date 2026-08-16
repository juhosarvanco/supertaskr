---
id: T-024
title: Genesis lens — the right pane as pure derivation over materializing docs
feature: F-03
milestone: 3
priority: 2
size: M
status: building
blocked_by: [T-023]
touches: [app-interview, docs/architecture/components/]
builder: claude-fable-5
verifier:
built_by: claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh (completion)
verified_by:
review:
---

The split view's right half ("the project, so far") built as a
standalone, driver-agnostic surface: it renders whatever lands in
docs/ — whether written by T-025's spawned planner, or by a human
hand-driving the method in a terminal (the ADR-006 evidence
instrument and the permanent fallback). Pure lens: derivation is pure
TS over the existing watcher state (DocsModelState.effective already
carries every docs/*.md content — C-10 files are OFF-LIMITS; read,
never edit). Design source: the `interview` screen of
docs/design/claudedesign_handoff/"nputer app.dc.html" (right pane,
values extracted from source per the T-006 protocol; the screen is
context-fidelity, not README-measured — nearest token step, deviations
disclosed). Declares component C-13-genesis-pane
(paths app/src/genesis/**, touch slug app-interview) in
docs/architecture/components/ in-branch, per the T-012 §2 precedent.

## Acceptance criteria
- THE app SHALL gain a pure module app/src/genesis/genesis-derive.ts
  mapping parsed docs state to a genesis model: per-artifact status
  {expected (from T-023's banking map), written (present and
  renderable), writing (present, changed within the last few seconds),
  assumption count (occurrences of "[?]")}, an approximate stage (the
  highest banking-map stage whose artifacts exist; approximation
  recorded as designed), north-star card content (title sentence +
  person/success/non-goal chips parsed from NORTH_STAR headings,
  absent-tolerant), and backbone entries (from the parsed ROADMAP
  model, built vs forming) — deterministic, no I/O, unit-tested
  against fixture trees including T-023's dry-run tree (landed here
  as a fixture) at empty / stage-4 / complete.
- WHEN the genesis pane renders THE app SHALL show the design's right
  pane from that model only: "the project, so far" header with live
  "docs/ · N files written" count, north star card with chips,
  backbone grid (dark built cards, dashed forming placeholders),
  artifacts list rows with written ✓ / writing pulse states, an
  assumption badge on artifacts with [?] markers, and the footer
  "next" line from the banking map — tokens-only styling (no
  arbitrary values), both schemes, dark values derived by token
  family and flagged to the screenshot pass.
- WHILE files change on disk (any writer) THE pane SHALL update via
  the existing watcher pipeline with no polling and no new IPC.
- IF a rendered doc is mid-write or malformed THEN the pane SHALL
  degrade per the existing last-good machinery (stale content + the
  established parse-chip family), never a crash or a blank pane; the
  suite SHALL pin a torn-file simulation (partial frontmatter) and
  hostile content in artifact names/headings rendering as React text
  nodes only (no-innerHTML grep gate extended to app/src/genesis/).
- IF prefers-reduced-motion is set THEN the writing pulse SHALL be
  static (existing motion-safe mechanism).

Verification: headless — vitest unit (derivation tables) + jsdom DOM
states + served-bundle probe rendering the dry-run fixture; board and
map suites untouched. @human, listed explicitly: visual judgment of
the pane against the design screen, light + dark screenshots.

## Implementation notes

### The handoff (this task is the project's first cross-model build)

Built in two sessions by two different models. `claude-fable-5 @fresh`
carried it from dispatch through commit `ad2716f` — the time-critical
fixture harvest, the derivation module, its 24 unit tests, the pane,
and the opening of the DOM suite — and then **hit its usage limit
mid-file**; the session ended with the DOM suite uncommitted and
unrunnable. `claude-opus-5 @fresh` resumed from disk, banked the
untracked work verbatim before touching anything (commit `6cfb874` —
stall insurance is the standing lesson), and completed. The `built_by`
stamp names both, split at `ad2716f`, because the record should say who
actually built what. No work was lost; the Fable session's derivation
module is unmodified except where noted under "changed from the
predecessor" below.

### Criteria → evidence

**(1) Pure derivation module.** `app/src/genesis/genesis-derive.ts`.
Per-artifact status assembled at :409 (`expected` / `written` /
`writing` + `[?]` count via `countAssumptions` :304, which strips HTML
comments first so a template comment *about* the convention is not
counted as an unresolved claim — the streak tree's four constraint
assumptions count 4, not 5). Approximate stage at :402, highest-wins
over the banking map. North-star card at :367 (first `§ Vision`
sentence + person/success/non-goal chips, absent-tolerant). Backbone at
:372 from the parsed ROADMAP model. `BANKING_MAP` :40 is a **verbatim
transcription** of the 9-row normative table in
`method/interview/plan-interview.md § Output`; `app/test/genesis-derive.test.ts:75`
re-reads that method file and asserts every cell still matches, so a
method edit fails this suite instead of silently drifting the lens (the
CONVENTIONS "transcribed table" gotcha, mechanised).
**Determinism, no I/O:** time enters *only* as the `nowMs` argument
(`deriveGenesis(docs, log, nowMs)` :337); the `writing` window
(`WRITING_WINDOW_MS = 5000` :161) is therefore testable with zero
wall-clock flake — every test passes a fixed clock, and the
window-expiry cases advance an injected counter rather than sleeping.
`observeDocsChange` :201 is a pure fold across observed states; its
first snapshot per project is a **baseline** (records content, stamps
nothing), so opening or resuming an existing tree never renders a wall
of false "writing" pulses, and a project switch re-baselines. Evidence:
24 tests in `app/test/genesis-derive.test.ts`, including the empty /
stage-4 / complete fixture trees and an explicit deep-equal
determinism pin (:155).

**(2) The design's right pane from that model only.**
`app/src/genesis/GenesisPane.tsx`. Header + live count :166; north-star
card + chips :201; backbone grid :230 (dark built cards, dashed
forming/slot placeholders); artifact rows :272 with written ✓ disc /
writing pulse; assumption badge :88; footer "next" line :285 and the
approximate-stage line :288, both straight off the banking map. The
pane holds no data of its own beyond the change log that powers the
pulse window. Evidence: `app/test/genesis-pane-dom.test.tsx` (10
tests). Token table and disclosed deviations below.

**(3) Updates ride the existing watcher.** The pane is a pure function
of its `docs` prop; `app/test/genesis-pane-dom.test.tsx:322` drives the
**real** `watcher-store` through the same dev harness the board and map
suites use and asserts the pane advances (5 files → 6, stage 4 → 5) on
pushed snapshots. Zero new IPC, zero new dependencies, no webview grant
changes, and no polling: the pane's single `setTimeout`
(`GenesisPane.tsx:149`) is a **one-shot re-render scheduled at the
known `writing`→`written` horizon** the model computes
(`nextTransitionMs`), armed only while something is actually writing.
Nothing is fetched and nothing repeats — it renders a state transition
whose time is already known, which is the opposite of polling.

**(4) Mid-write / malformed degrades, never crashes or blanks.** Four
DOM tests: a torn task file (unterminated frontmatter) keeps its
last-good row while the established parse-chip family reports the
failure; a file that *never* parsed still renders a row with a chip
carrying no "last valid state" claim; collector skips surface in the
sibling chip (T-018 family); every row still renders in all cases (the
"never blank" pin is a positive assertion, not an absence of throw).
`stripHtmlComments` (:230) tolerates an *unclosed* comment by design —
the commonest torn-file shape. Hostile content: artifact names and
headings carrying `<img onerror>`, `<script>`, and an RTL override
render as React text nodes only — asserted by *absence of the
elements* (`querySelector("img")`/`("script")` null) plus presence of
the literal bytes as text. The no-innerHTML grep gate is now
**standing** rather than a one-time diff grep: a test walks every file
under `app/src/genesis/` and fails on `innerHTML`,
`dangerouslySetInnerHTML`, `insertAdjacentHTML` or `document.write`, so
a future edit cannot quietly reach for a raw-HTML sink.

**(5) prefers-reduced-motion.** The pulse is
`motion-safe:animate-status-pulse` on the 5px dot
(`GenesisPane.tsx:105`) — the existing mechanism documented at
`app/src/index.css:220` and used by `TaskCard.tsx:208` /
`MapNode.tsx:156`. Pinned in the same form the map suite established
(`map-view-dom.test.tsx:226`): the test asserts the class carries the
`motion-safe:` prefix **and** that no bare `animate-status-pulse`
exists, so the gate cannot be lost by a careless edit.

### Design token extraction (T-006 protocol, context-fidelity)

Source: `docs/design/claudedesign_handoff/"nputer app.dc.html"`, the
`interview` screen's right pane (lines 565–612). The app's type scale
is redefined in `app/src/styles/tokens.css`, so "nearest token step"
is measured against *that* scale, not Tailwind's defaults.

| Design value | Token used | Match |
|---|---|---|
| pane bg `#fafafa` | `bg-sidebar` | exact |
| card bg `#fff` | `bg-card` | exact |
| card border `#e5e5e5` | `border-border` | exact |
| chips `#d5f0e4` / `#bfe7d6` / `#2f7256` | `bg/border/text-status-done*` | exact |
| built card `#111` / `#fafafa` / `#a3a3a3` | `column-header` family | exact |
| writing row border `#f3ddab`, text `#7d5c12` | `status-building` family | exact |
| writing dot `#b5651d`, 5px | `bg-chart-4`, `h-1.25 w-1.25` | exact |
| ✓ disc `#1f7a58` on `#fff`, 12px | `--review-disc` / `--review-mark` | exact |
| footer dashed rule `#d4d4d4` | `border-ghost-border` | exact |
| card shadow `0 1px 2px rgba(0,0,0,.05)` | `shadow-card` | exact |
| all paddings/gaps (26/22/20/18/13/11/10/9/7/5/3/2px) | spacing scale | exact |
| overlines 10–11px | `text-xs` (11px) | nearest step (+1px on the 10px ones) |
| north-star title 19px | `text-2xl` (20px) | nearest step (+1px) |
| artifact path 12px, feature name 13px | `text-sm` (12.5px) | nearest step (±0.5px) |
| footer next line 13.5px | `text-base` (14px) | nearest step (+0.5px) |
| header rule `#ededed` | `border-hairline` (`#e5e5e5`) | nearest token; no `#ededed` in the sheet |
| forming card border `#cfcfcf` | `border-ghost-border` (`#d4d4d4`) | nearest token; forming stays darker than slot, as designed |
| slot card border `#e0e0e0` | `border-border` (`#e5e5e5`) | nearest token |
| north-star card radius 12px | `rounded-lg` (10px) | tie with `rounded-xl` (14px); took the card family, `--radius` being documented "cards, column headers, buttons" |
| artifact row radius 9px | `rounded-lg` (10px) | nearest step |
| backbone card radius 10px, chip radius 6px | `rounded-lg`, `rounded-chip` | exact |

**Deviations disclosed** (beyond nearest-step rounding):
1. **Footer right slot.** The design reads `~9 min elapsed`. Replaced
   with `stage ~N · <step>`. Elapsed time is wall-clock state that no
   docs tree carries, and inventing it would break criterion 1's
   determinism; the criterion asks for the approximate stage instead.
   The tilde and the phrasing follow the design's own left-pane
   `stage 4 of 7 · constraints` line.
2. **Artifact filenames.** The design mockup shows lowercase
   `docs/north-star.md`; the pane shows real paths
   (`docs/NORTH_STAR.md`), because it is a lens over actual files and
   the method's filenames are uppercase.
3. **States the design does not draw.** `expected` artifact rows, the
   `slot` backbone cell, the empty/`forming…` north-star card, and the
   parse/skip chip strip have no mockup counterpart. Each is derived
   from the design's nearest precedent — placeholders take its dashed
   treatment, chips reuse the established parse-chip family.
4. **Dark scheme** is derived by token family throughout (every colour
   above is a token that already carries a dark value); no dark
   mockup exists. Flagged to the @human screenshot pass.

Zero arbitrary Tailwind values: `grep -nE '\[[0-9]+(px|rem|%)\]|\[#[0-9a-fA-F]{3,8}\]|\[(color|background|border|fill|stroke|--)[^]]*\]|-\(--[a-z-]+\)|text-(red|blue|…)-[0-9]' app/src/genesis/*` → **no hits**. Every
utility the pane uses was additionally confirmed to *emit* into the
built stylesheet (`dist/assets/index-*.css`) — a class that does not
exist would otherwise fail silently.

### Fixture provenance

`app/test/fixtures/genesis/streak/` is the **T-023 dry-run tree**,
harvested byte-faithfully from the live scratch directory
(`/private/tmp/…/streak`, outside the repo) at its single commit
`b18a33c`, before that scratch tree could be lost. This discharges
**T-023-s2**, which asked precisely for this ("land T-024's fixture
from the still-alive scratch tree, else record the five divergences") —
T-023's verifier had found that the task-file transcript is only
*partly* verbatim (001-stack.md restructured, CONVENTIONS/T-002 quotes
stripped of template comments, the mermaid block paraphrased,
T-001/T-003 summarised). The harvested tree carries none of those
losses. Verified three ways this session:
- **Inventory** matches T-023's recorded 13-file tree exactly — 12
  files land, `.nputer/nputer.yaml` correctly excluded as gitignored.
- **Line total** matches exactly: T-023 records "docs .md total 343
  lines"; the fixture is 315 lines under `docs/` plus 28 in the two
  root adapter files = **343**. (The 343 figure counts every `.md` in
  the tree, not only `docs/` — worth recording, since the raw
  `docs/`-only count reads as a 28-line shortfall until reconciled.)
- **Byte-diff** of the two files T-023's verifier certified byte-exact
  (`NORTH_STAR.md`, `ROADMAP.md`) against the transcript quotes:
  identical.

`streak-stage4/` is a hand-built variant (5 files, NORTH_STAR banked
through `§ Hard constraints`, ROADMAP/ARCHITECTURE still template) —
the transcript's kill point, exercising the mid-interview states the
complete tree cannot show.

### Commands and counts

    cd app
    npm test    # 23 files, 432 passed, exit 0
    npm run build  # tsc && vite build, exit 0

Baseline at the branch point (`main@45894b7`) was **398/398**.
**398 → 432**: +24 `genesis-derive.test.ts`, +10
`genesis-pane-dom.test.tsx`. No pre-existing test was deleted or
loosened. `lib/parser` and `src-tauri` untouched (zero files changed
under either).

### C-13 and the dogfood reconciliation

`docs/architecture/components/C-13-genesis-pane.md` declared in-branch
per the T-012 §2 precedent (paths `app/src/genesis/**`, touch slug
`app-interview`, `depends_on: [C-10, C-11]`, `decisions: [ADR-006,
ADR-017]`). Declaring a component necessarily moves the dogfood
fixtures, which pin the live registry. Reconciled — **changed, never
loosened** — with the delta enumerated in a header block at
`app/test/architecture-dogfood.test.ts:111`: registry 9 → 10 ids;
declared count 9 → 10; findings gain `D3:C-13` (three declared-only
components → four); relation table 23 → 25 rows, the additions being
`C-13→C-10` and `C-13→C-11`, both **planned** with `observedCount 0`;
tally 12 confirmed / 4 undeclared / 7 → 9 planned; drift nodes 6 → 7;
`map-dogfood-render` node count 9 → 10 and edge count 23 → 25. Every
pre-existing row, count and file edge is byte-unchanged.
C-13 is honestly a D3 today: the committed `graph.json` is an index
snapshot that predates `app/src/genesis/`, so no indexed file can
confirm the pane's imports. It clears itself the next time the indexer
runs over a tree containing the pane — no action needed, and **the
graph was deliberately not regenerated** (indexing is C-07/src-tauri
territory, outside this lane).

### C-10 read-only check

The predecessor's one C-10 touch (`app/src/lib/docs-model.ts`, in
`ad2716f`) is **additive**: a new `effective` field plus retention of
non-model-input files in the map that was already being built. Verified
the retention is additive *in effect* too, not just in shape — that map
is passed to `parseProjectFromFiles`, so it now carries more entries
than before, but the parser selects by path (`lib/parser/src/files.ts`
:128 task paths, :158 components dir, :161 roadmap file) and never
iterates the map, so the parsed model is byte-identical. The whole
pre-existing suite staying green at 398 corroborates it. No other C-10
behaviour was touched.

### Changed from the predecessor (with reasons)

1. `genesis-pane-dom.test.tsx` fixture root: `import.meta.url` →
   `resolve("test/fixtures/genesis")`. Under the jsdom environment
   `import.meta.url` is rewritten to the page origin, so the whole
   suite failed to *collect* ("The URL must be of scheme file") — it
   had never run. `genesis-derive.test.ts` keeps the `import.meta.url`
   form legitimately, running in the node environment.
2. Same file, the store test: it expected `window.__nputerDocsHarness`
   to exist, but the harness installs inside `startDocsWatcher()`,
   which other suites trigger by rendering `<App />`. The pane is
   standalone and `App.tsx` is T-026's, so the test now calls the
   store's own public entry point — same code path, no shell wiring.
3. `bg-card` added to the forming/slot backbone cards and the expected
   artifact rows: the design's dashed placeholder cards explicitly
   carry `background:#fff`, which the pane was dropping onto the
   `#fafafa` pane background.
4. `test/node-builtins.d.ts` gained a minimal `statSync` declaration
   and one `.at(-1)` became index access — `npm run build` (tsc) was
   failing on both; the app deliberately ships no `@types/node`, so
   the shim declares exactly the consumed surface and nothing more.
5. The no-innerHTML gate was made a standing test rather than a
   one-time grep over the diff.

### Boundary: what this task does NOT do

The pane is **not mounted anywhere** — the only references to it
outside `app/src/genesis/` are two comments in `docs-model.ts`. That is
T-026's job, and `App.tsx`/shell routing were not touched. Consequence
for verification: the task's Verification line calls for a
**served-bundle probe rendering the dry-run fixture**, and that probe
cannot exist yet — a served bundle has no route that reaches the pane
until T-026 mounts it. The styling half of what such a probe would
check *was* verified against the real bundle (every utility confirmed
present in `dist/assets/index-*.css`). Filed as **T-024-s1** so the
probe lands with the mount rather than being quietly dropped.

### @human (visual judgment — never performed here; headless only)

1. **The pane against the design screen, light + dark.** Screenshots of
   both schemes. Dark values are derived by token family with no dark
   mockup to check against; the built/forming/slot card contrast and
   the writing-row warm border are the places to look hardest.
2. **The nearest-step type rounding read at real size** — five type
   sizes moved by 0.5–1px (table above). Whether the north-star title
   at 20px still reads as the design's 19px hero is a judgment call.
3. **The footer's substituted right slot** (`stage ~4 · constraints`
   in place of `~9 min elapsed`) — a product decision as much as a
   visual one.
Blocked until T-026 mounts the pane, since there is no route to it in
a running app today.

## Verdicts
