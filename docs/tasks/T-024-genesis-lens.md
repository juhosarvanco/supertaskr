---
id: T-024
title: Genesis lens — the right pane as pure derivation over materializing docs
feature: F-03
milestone: 3
priority: 2
size: M
status: done
blocked_by: [T-023]
touches: [app-interview, docs/architecture/components/]
builder: claude-fable-5
verifier: claude-opus-5
built_by: claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)
verified_by: "claude-opus-5 @fresh"
review: same-model
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
Absorbs: T-023-s2 (triage 2026-08-16) — the dry-run fixture was
harvested byte-faithfully from the surviving scratch tree rather than
reconstructed from T-023's notes, which is exactly what s2 asked for;
discharged in-branch and re-derived by the verifier (12 files, 343
`.md` lines, NORTH_STAR/ROADMAP byte-identical to the certified
quotes), so the suggestion file is removed at this merge.

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
of its `docs` prop; `app/test/genesis-pane-dom.test.tsx:341` drives the
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

### Fix pass after REJECTED (2026-08-16, fresh executor claude-opus-5 @fresh)

Third session on this task, dispatched with the verifier's findings
after the REJECTED verdict below. Scope: fix exactly what was broken,
prove it, hand back. The earlier sessions' notes are left as written —
this section is an append, not a rewrite.

**What was broken — one line, one directory away.** Declaring C-13
moves **three** fixtures that pin the live component registry, not two.
`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` were reconciled in `b9df9b1`;
`lib/parser/test/smoke.test.ts:40` — T-008's live-tree registry pin —
was not, and left that package's required suite RED at HEAD.
Reproduced here first, before touching anything, rather than taken on
the verdict's word: `cd lib/parser && npm test` → **1 failed | 158
passed (159)** at `test/smoke.test.ts:40`, diff `+ "C-13"`. The
verdict's account matched exactly, line for line.

**The remedy.** `'C-13'` appended to that array in registry order,
under a dated addendum comment in the same house form the other two
reconciliations carry. **Changed, never loosened**: the assertion is
still `expect(components.map((c) => c.id)).toEqual([…])` — a whole-array
equality over ten explicit ids, not a subset check, not a length check,
not a sort-insensitive compare — and every pre-existing id is
byte-unchanged. `lib/parser/src/**` is byte-untouched. The task's "zero
diff under `lib/parser/**`" fence is a **source** fence; a fixture
reconciliation forced by an in-branch component declaration is the
T-012 §2 move this branch already made twice, and the verifier ruled it
in scope.

**All three suites, run in this worktree.**

| suite | before the fix | after |
|---|---|---|
| `lib/parser` — `npm test` | 158/159, **1 failed** | **159/159**, exit 0 |
| `lib/parser` — `npx tsc --noEmit` | clean | clean, exit 0 |
| `app` — `npm test` | 432/432 (23 files) | **432/432**, exit 0 |
| `app` — `npm run build` | exit 0 | exit 0 |
| `app/src-tauri` — `cargo test` | **never run** | **121 passed, 0 failed, 2 ignored** |

The cargo tally matches the branch-point baseline exactly — this branch
touches no Rust. It was run anyway, because that is the entire lesson.

**Two line citations corrected** (the record should cite reality; both
re-checked by grep here, not accepted from the verdict): the store test
is at `genesis-pane-dom.test.tsx:341`, not `:322` — `:322` sits inside
the innerHTML gate's `scan` helper; and T-024-s3's `GenesisPane.tsx:136`
is the *comment above* the write — the render-phase ref stamp itself is
`:140`. Corrected in the notes above and in the s3 file respectively.

**The lesson, plainly.** Two halves, and the second is the general one.
(i) A component declaration moves **three** registry pins, one of them
in a different npm package — that inventory is exactly what T-024-s5
asks to write down so it stops being folklore. (ii) **A suite not run
is a suite not known.** The completing session reported `lib/parser`
"untouched (zero files changed)", which was true *as a diff claim* and
is precisely why the red was never seen: that fixture parses the **live
docs/ tree**, so a docs-only commit breaks a suite whose own files
never moved. Diff scope is not test scope. The habit the next executor
should inherit is to run every package's suite before handing back,
whatever the diff says — the same failure mode this task's completing
session had already caught once, one directory away.

## Verdicts

2026-08-16 — claude-opus-5 @fresh, verifier — same-model review
relative to the completing builder; the fable-built half received
cross-model review: **REJECTED** — the branch leaves `lib/parser`'s
required suite RED. All five acceptance criteria were independently
re-derived and hold; the break is in the C-13 reconciliation, which is
one fixture short.

**The break, with reproduction.** Declaring C-13 moves every fixture
that pins the live component registry. There are **three**, not two:
`app/test/architecture-dogfood.test.ts`, `app/test/map-dogfood-render.test.tsx`
— both correctly reconciled — and `lib/parser/test/smoke.test.ts:40`
("parses the dogfood component registry (T-008): same C-namespace as
ARCHITECTURE.md"), which was not. T-008's own commit message names it:
"live-tree smoke pins the exact registry".

    cd lib/parser && npm test
    → 1 failed | 158 passed (159)
      test/smoke.test.ts:40  expected [ Array(10) ] to deeply equal [ Array(9) ]
      + "C-13"

    # cause isolated: move docs/architecture/components/C-13-genesis-pane.md
    # aside, re-run, restore
    → 159 passed (159)

The suite was green at the branch point and is red at HEAD, caused
solely by this branch. `docs/CONVENTIONS.md § Build & test` names that
suite a gate ("The suite's smoke test parses this repo's live docs/
tree"); `docs/tasks/T-012-map-view.md:179` — the §8 suites line of the
very precedent these notes invoke — requires "lib/parser untouched **at
its then-current count**". The count moved. The implementation notes
present their delta as enumerated and complete ("Every pre-existing row,
count and file edge is byte-unchanged … the only movement in this
fixture is C-13's own arrival") and report only the app suite and build
under "Commands and counts", stating `lib/parser` is "untouched (zero
files changed)" — true as a diff claim, and exactly why the red was
never seen. This is the same failure mode the completing session itself
caught earlier on this task: **a suite not run is a suite not known**,
and here it was one directory away.

**Remedy (small, and a scope ruling so re-dispatch is not blocked).**
Add `'C-13'` to the expected id array at `lib/parser/test/smoke.test.ts:40`
— a CHANGE, not a loosening, identical in kind to the six app-side
deltas already made. The task's "zero diff under lib/parser/**" fence is
a *source* fence; a fixture reconciliation forced by an in-branch
declaration is the T-012 §2 move this task already made twice, so it is
in scope. The architect's alternative is to drop the C-13 declaration
from this branch entirely; the reconciliation is the cheaper, honest
path. Nothing else needs to change — re-verification is targeted.

**Everything else attacked, and green.** Re-derived, not accepted:

- **(1) Pure module.** `app/src/genesis/genesis-derive.ts` carries
  **zero** time sources — `grep -rnE 'Date\.now|new Date|performance\.now|Math\.random|setInterval|setTimeout|fetch\(|invoke|listen\(|localStorage|window\.|document\.' app/src/genesis/` hits only `GenesisPane.tsx:135` (`Date.now` as the injectable default clock) and `:151` (the one-shot timer). No I/O anywhere. Hand-derived from the fixtures, then compared to what the tests assert — not read off the implementation: `find streak/docs -name '*.md' | wc -l` = 9 and stage4 = 5 (header counts); raw `[?]` counts 5 / 2 / 1 in NORTH_STAR / STATE / CONVENTIONS, with exactly one of NORTH_STAR's five inside the Q4 HTML comment (`NORTH_STAR.md:45-46`) → the asserted 4 / 2 / 1 is right; the Vision first sentence is byte-identically the asserted title; `ROADMAP.md § Backbone` yields F-01 Log / F-02 Week view / F-03 Habit management / F-04 History & stats, the asserted backbone. Approximation recorded as designed (`GenesisModel.approxStage` doc comment names highest-wins, the two collapses, and the gap rule). 24/24 green.
- **The banking-map coupling — PROVEN, not accepted.** All nine rows
  transcribed verbatim against `method/interview/plan-interview.md
  § Output`, cell by cell, by hand. Then attacked: mutated stage 4's
  "Banks into" cell to "§ Hard limits" in the method file → suite RED
  naming the drift (`genesis-derive.test.ts:88`, expected/received on
  the exact cell); reverted → 24/24 green; `git diff --stat method/`
  empty. The claim is real.
- **(3) The suite-actually-runs sweep — the highest-priority class,
  swept exhaustively.** Not by counting files: I injected
  `expect("PROBE").toBe("EXECUTED")` as the first statement of **every**
  `it()` body in both new files (24 + 10) and ran them — **34 failed
  (34)**, i.e. every single test body executes; reverted. Corroborated
  by `--reporter=verbose` listing all 34 by name, and by a static pass
  confirming no assertion-free test (min 1 `expect`, most 2–22). The
  398 → 432 delta re-derived: `git diff --name-only` touches only the
  two dogfood files among pre-existing tests, no test deleted, no
  `.skip`/`.only`/`.todo` added (the ten `-` lines in the test diff are
  four `it(...)` title rewrites and their paired comment lines), so
  432 − 24 − 10 = 398 is the untouched remainder.
- **(2) Rendering from the model only.** DOM assertions pin header
  count, north-star card + the three chips, backbone (built
  `bg-column-header` / dashed forming / dashed slot), rows with written
  ✓ disc and writing pulse, assumption badges by path, and both footer
  lines. **Tokens-only re-derived**: 82 utilities extracted from every
  class-bearing literal in `GenesisPane.tsx` — **zero** arbitrary
  values, zero `-(--x)` forms, zero default-palette utilities — and
  **all 82 emit** into the freshly built `dist/assets/index-D9PU4sJh.css`
  (selector-boundary match, not substring). `--review-disc` /
  `--review-mark`, used as inline `var()` in the ✓ disc, carry both
  light (`tokens.css:94-95`) and dark (`:252-253`) values.
- **(3) Watcher-driven.** No `setInterval`, no repeating `setTimeout`,
  no new `invoke`/`listen`, no new dependency (zero diff in
  package.json, both lockfiles, Cargo.toml/lock). The one timer is the
  one-shot at `model.nextTransitionMs`. The store test's entry point
  **is** the shell's: `App.tsx:155` calls `void startDocsWatcher()`;
  the test calls `await startDocsWatcher()` — same function, awaited
  instead of fire-and-forget. Not a weaker path.
- **(4) Degradation — attacked with my own hostile fixtures**, written
  independently (5 probes, file deleted after the run): 14 hostile
  derive shapes (10k unbroken run, RTL override + zero-width + BOM +
  ANSI ESC + NUL, `<script>`/`<style>`/unclosed comment, `"[?]"×5000`,
  bare `---`, empty file, `..`-shaped path, script tag *inside a
  filename*, duplicate/lowercase/no-space headings, whitespace-only
  Vision) — none threw, all deterministic on re-derive; a torn-file
  storm with **every** file malformed still rendered all 7 rows and the
  correct count; hostile paths and headings produced **no** `script`,
  `img`, `iframe`, `svg[onload]`, `a[href^=javascript]`, `style`,
  `object` or `embed` element, and **zero** `on*` attributes on any
  element in the tree, with the literal bytes present as text. The
  no-innerHTML gate is genuinely **standing**: planted
  `el.innerHTML = "x"` in `genesis-derive.ts` → RED naming the file;
  reverted.
- **(5) Reduced motion — mechanism, not class name.** The built
  stylesheet carries `.motion-safe\:animate-status-pulse{animation:status-pulse …}`
  **only** inside `@media(prefers-reduced-motion:no-preference)`, and
  there is no bare `.animate-status-pulse` rule anywhere in it. Under
  `reduce` the dot is static by construction.
- **The six cross-lane deltas, ruled individually — all CHANGED, none
  loosened.** (i) registry id list gains an exact `"C-13"` element,
  count 9 → 10, still `toEqual` on the whole array; (ii) findings gain
  an exact `{rule:"D3", id:"D3:C-13", component:"C-13"}`, still a whole-
  array `toEqual`, four D1 rows byte-unchanged; (iii) relation table
  gains exactly `["C-13","C-10","planned",0]` and `["C-13","C-11","planned",0]`,
  still a whole-table `toEqual`, 23 → 25 with 12/4 unchanged; (iv) drift
  and declaredOnly arrays each gain exactly `"C-13"`; (v) map node count
  9 → 10 exact; (vi) map edge count 23 → 25 exact, undeclared still 4.
  No assertion became weaker, vaguer, or disappeared. The header block
  at `architecture-dogfood.test.ts:111` matches the actual deltas
  exactly — its omission is the third pin, not a misstatement about
  these two. The new expectations are **correct**, re-derived from
  first principles rather than accepted: `docs/architecture/graph.json`
  indexes 78 files and **zero** under `app/src/genesis/`, and
  `derive.ts:456` makes a declared-but-unobserved edge `planned` while
  `:490` makes a declared component with no indexed files a D3 — so
  D3:C-13 and two planned edges at observedCount 0 are the honest
  state. `graph.json` correctly **not** regenerated (zero-byte diff).
- **Fixture provenance (T-023-s2) — re-derived both counts.**
  `find streak -name '*.md' | xargs wc -l` totals **343**; docs/-only is
  **315**; the two root adapters are **14 + 14 = 28**; 315 + 28 = 343.
  T-023's label "docs .md total 343 lines" is counting every `.md` in
  the 13-file tree (11 of them are `.md`), so the reconciliation is
  right and the fixture is not 28 lines short. Inventory: 12 files,
  T-023's 13 minus the gitignored `.nputer/nputer.yaml`. Byte-diffed
  the two files T-023's verifier certified byte-exact against the
  transcript quotes extracted from `T-023-genesis-kit.md`:
  `NORTH_STAR.md` and `ROADMAP.md` are **byte-identical**. T-023-s2 is
  discharged.
- **Fence.** `git diff --stat 45894b7..HEAD -- lib/ app/src-tauri/ method/
  app/package.json app/package-lock.json package.json app/src/App.tsx
  app/src/main.tsx docs/architecture/graph.json` → empty. lib/parser and
  src-tauri diff is **zero bytes** (`git diff … | wc -c` = 0).
- **C-10 read-only, verified structurally** (not just by green tests).
  `isModelInput = isTaskFilePath || isComponentFilePath || path === ROADMAP_FILE`
  is exactly the selector set `parseProjectFromFiles` uses
  (`files.ts:128` task paths, `:98` components, `:161` roadmap), and
  `applySnapshot` calls it with default options — so the paths newly
  retained in `effective` are disjoint from everything the parser reads.
  The parsed model is byte-identical by construction.
- **Suites, fresh in this worktree.** app `npm test` → **23 files, 432
  passed (432)**, exit 0. app `npm run build` (tsc && vite build) → exit
  0, genuinely green. lib/parser → **158/159, the break above**. cargo
  not run: zero-byte diff under `app/src-tauri/`.

**The s1 ruling — acceptable, honestly-recorded deferral; s1 is the
right encoding.** The Verification line's third leg ("served-bundle
probe rendering the dry-run fixture") is in tension with the task's own
opening paragraph, which specifies the pane as "a standalone,
driver-agnostic surface" and assigns no mount; the criteria never ask
for one, and `App.tsx` belongs to T-026. A probe that *renders* the
fixture needs a route, a route needs the mount, and manufacturing one
(a dev-only entry point) would plant exactly the dev harness the
security sweep forbids in production paths. Repo precedent supports the
split rather than the omission: T-017's verifier ran a served-bundle
probe on ephemeral port 64502 purely to read the served *stylesheet* —
no route required — and T-024 did that check statically instead, which
I reproduced (82/82 utilities emit). So the deferral is real, not
convenient, and s1 states what remains uncovered without overstating.
**What exists TODAY for the pane in a real bundle, plainly: nothing.**
Stronger than s1 claims — the pane is not merely unrouted, its code is
**absent from the shipped JS**: `grep -F 'the project, so far'
dist/assets/index-BX4hdacT.js` and four sibling probes all miss,
because nothing imports it and Rollup drops it. Its utilities reach the
stylesheet only because Tailwind v4 scans source, not the bundle. Real-
bundle evidence today = tsc type-checks it, and its classes are not
silently dead. Everything else is jsdom.

**Suggestions assessed.** **s1** — real, correctly encoded, correctly
scoped; independently corroborated above, and understated if anything.
**s2** — real and correct: verified the graph indexes zero genesis
files, so the D3 and the two planned edges are honest and self-clearing;
folding into the merge-time regen (T-009-s1) is the right scope. It
inherits the same blind spot as the notes — its reverse-delta list names
two fixtures where three pin the registry. **s3** — real: the render-
phase ref write is at `GenesisPane.tsx:140` (s3 says :136 — stale line
ref, code as described), the identity guard is genuine, the analysis of
the concurrent-render blast radius is fair, and (a)/(b)/(c) is the right
shape for an architect ruling rather than a fix. All three earn their
place.

**New: T-024-s4** (the north-star title is the pane's one unbounded
text surface — reproduced a 10,000-char single text node; chips clip at
44 and rows `truncate`, the title has no `break-words`/`min-w-0`,
departing from T-017's established answer) and **T-024-s5** (record the
registry-pin inventory so "declaring a component moves three fixtures"
stops being folklore).

**Security sweep: clean.** Diff confined per the fence; no `innerHTML`
family anywhere under `app/src/genesis/` and a standing test that
proves it; no network, no `fetch`/`XMLHttpRequest`/`WebSocket`, no new
IPC surface, no shell strings, no `process.env`, no secrets; hostile
fixture content cannot reach the DOM as markup (verified with my own
fixtures, including zero `on*` attributes anywhere); no new dependency
and no lockfile or postinstall change; the browser harness stays gated
behind `!isTauri && import.meta.env.DEV` in pre-existing C-10 code,
unchanged here; port 1420 never bound or contacted — the only
occurrence of "1420" in the whole diff is s1's prose telling a future
executor not to use it. `app/test/node-builtins.d.ts` adds exactly one
ambient `statSync` declaration, test-only, no runtime code.

**Notes-vs-reality deviations (minor, recorded).** The implementation
notes' line citations are accurate on ~15 spot-checks, with two drifts:
the store test is at `genesis-pane-dom.test.tsx:341`, not `:322` (which
is the innerHTML gate), and s3's `:136` is `:140`. One design nuance not
in the notes: `countAssumptions` does not exclude fenced code blocks, so
a `[?]` inside ``` counts — defensible (the convention marks an
unresolved claim wherever it appears), but undocumented.

**@human, unchanged and still blocked until T-026 mounts the pane** —
listed, never performed (headless only): the pane against the design
screen in light **and** dark, with the built/forming/slot contrast and
the warm writing-row border the places to look hardest (no dark mockup
exists; every dark value is derived by token family); the five type
sizes that moved 0.5–1px read at real size, especially the 19px → 20px
north-star hero; and the substituted footer right slot (`stage ~4 ·
constraints` for `~9 min elapsed`), a product decision as much as a
visual one.

2026-08-16 — claude-opus-5 @fresh, verifier — re-verification of the
fix pass (6824e92, fresh executor); same-model relative to the
completing builder: **APPROVED**.

**The break, closed — both halves re-derived, neither accepted.**
Restored the pre-fix fixture into this worktree
(`git show 2bfa654:lib/parser/test/smoke.test.ts`) and ran the package
suite: **1 failed | 158 passed (159)** at `test/smoke.test.ts:40`,
`expected [ Array(10) ] to deeply equal [ Array(9) ]`, diff `+ "C-13"`
— the rejection's reproduction, line for line. Restored HEAD:
**159 passed (159)**, exit 0. The cause is this branch and only this
branch: `git show 45894b7:docs/architecture/components/` lists nine
components, HEAD lists ten. The new expectation is *correct*, not
merely passing — the ten ids were re-derived independently from the
directory listing, and `toEqual` is order-sensitive, so the assertion
pins the parser's real output order rather than a convenient one.

**Changed, never loosened — proven structurally, not read off the
prose.** `git diff --numstat 2bfa654..HEAD -- lib/parser/test/smoke.test.ts`
→ **`13  0`**: thirteen insertions, **zero deletions**. A pure
insertion is byte-level proof that every pre-existing line survives
untouched — the nine prior ids, and the neighbouring
`expect(components.length).toBeGreaterThanOrEqual(5)` at `:39`. The
assertion at `:52` is still
`expect(components.map((c) => c.id)).toEqual([…])` over ten explicit
string literals; an assertion-shape audit of the whole file finds no
`arrayContaining`, no `toHaveLength`, no `sort()`, no `toContain`
substituted for that pin. `'C-13'` sits last, in registry order. **The
source fence holds at zero bytes**: `git diff 45894b7..HEAD -- lib/parser/src/`
is **0 bytes**, and the fixture's +13/−0 is the only movement under
`lib/parser/` across the entire branch.

**Scope — the fix moved nothing it did not claim.**
`git diff --numstat 2bfa654..HEAD` is exactly three files:
`docs/tasks/T-024-genesis-lens.md` 65/2, `T-024-s3-…md` 1/1,
`lib/parser/test/smoke.test.ts` 13/0 — **+79/−3**, matching the claim.
Drive-by check: `git diff 2bfa654..HEAD -- app/src/genesis/ app/test/ docs/architecture/`
is **0 bytes**, so the pane, the derivation module, both app-side
fixtures and s1/s2/s4/s5 are untouched, and the six cross-lane deltas
ruled individually above are byte-identical to what was ruled. The
task-file edit is an append plus the `built_by` line plus one citation;
the REJECTED entry above is byte-untouched.

**All three suites, run here — nothing taken on report.** `lib/parser`
`npm test` → **10 files, 159 passed (159)**, exit 0; `npx tsc --noEmit`
→ exit 0. `app` `npm test` → **23 files, 432 passed (432)**, exit 0;
`npm run build` → exit 0, 249 modules, assets `index-D9PU4sJh.css` /
`index-BX4hdacT.js` — the same hashes the first pass built, so the fix
is genuinely inert to the bundle. `app/src-tauri` `cargo test` →
**121 passed, 0 failed, 2 ignored**, exit 0. All three re-run green
*after* this verdict's own s6 file landed in `docs/tasks/` — a
live-tree directory, which is this task's entire lesson applied to the
verifier's own commit.

**First-pass conclusions spot-checked at HEAD — all hold.** The 34 new
tests still all execute: `expect("PROBE").toBe("EXECUTED")` injected as
the first statement of every one of the 34 `it()` bodies → **34 failed
(34)**; reverted. The banking-map coupling is still real: stage 4's
"Banks into" cell mutated to `§ Hard limits` in
`method/interview/plan-interview.md` → RED at `genesis-derive.test.ts:88`
naming the cell; reverted → 24/24. The no-innerHTML gate still fires:
planted `el.innerHTML = "x"` in `genesis-derive.ts` → RED at
`genesis-pane-dom.test.tsx:332` naming the file; reverted. No
`.skip`/`.only`/`.todo` in either new file. Every probe reverted;
working tree clean at each step.

**Both citation corrections verified by grep, not accepted.**
`genesis-pane-dom.test.tsx:341` is the
`describe("updates ride the existing store (no polling, no new IPC)")`
that opens the real-store test (its `it()` at `:342`), and `:322` is
`const full = join(dir, name);` inside the innerHTML gate's `scan`
helper — exactly as the correction says. `GenesisPane.tsx:140` is
`logRef.current = observeDocsChange(logRef.current, docs, clock());`,
the render-phase write itself; `:136` opens the comment block above it.
Both corrections cite reality.

**Ruling on the fix session's finding (a) — consistent with the
recorded design; not a gap, and the integrator closes it at this
merge.** `self_graph_is_current` is `#[ignore]`d *deliberately*:
`docs/tasks/T-009-indexer-typescript.md:217` records the reason ("the
default `cargo test` must stay hermetic to unrelated TS edits … and
must never dirty the working tree"). A green cargo run proving nothing
about graph currency is therefore the design working as specified, not
a hole this branch opened. What closes it is the integrator's ritual,
and that ritual is no longer a suggestion: T-009-s1 was **ratified at
the 2026-08-16 triage** into `docs/CONVENTIONS.md` on `main` as an
INTERIM integrator rule (the s1 file is gone from `main`'s
`docs/tasks/`, folded into the convention). This branch predates the
ratification, so the rule is absent from the branch's own CONVENTIONS
— it applies because the merge lands on `main`. The notes' claim that
C-13's D3 self-clears on the next indexer run is accurate and, at this
merge, *actionable* rather than indefinite; T-024-s2 already routes it
correctly. No finding.

**Ruling on finding (b) — a real record-truthfulness problem; filed as
T-024-s6.** Verified against the running code, not reasoned about:
`parseModelSession` (`model-session.ts:20`, `lastIndexOf('@')`) turns
the current stamp into `model = "claude-fable-5 @fresh (WIP through
ad2716f) + claude-opus-5"`, `session = "fresh ×2 (…)"`, `policy =
"resume"`. The policy is **false** — both sessions were `@fresh`;
`policy` comes from `session === 'fresh'`, an exact match that any
annotation defeats. The model half also *renders*: board and map both
switch from `builder` to `built_by` exactly when status reaches
done/merging (`board-model.ts:165-167`, `MapPanel.tsx:392-397`), at
which point `shortModelName` yields a **50-character** badge,
`"fable-5 @fresh (WIP through ad2716f) + claude-opus"`, in a chip with
no `truncate` and no `max-w` (`ModelBadge.tsx:12`), and again through
the map's deliberate local twin (`MapPanel.tsx:361,426`). Nothing
catches it: `modelField` (`task.ts:250`) rejects only an empty model or
session, so the live-tree gate's `expect(result.issues).toEqual([])`
passes on a stamp that parses to nonsense. **The executor's own claim
checks out** — the pre-existing and edited stamps produce byte-identical
`model`, `policy` and badge, so the `×2` edit is parse-shape-neutral
and this is not a regression from the fix; the condition arrived with
`09f772d`. Not a rejection ground: the stamp is *honest prose* about
who built what, which is the behaviour the convention wants — what is
missing is a form for saying it. Out of T-024's scope, correctly left
alone, and filed as **T-024-s6** with three options (stamp grammar /
parser change / accept-and-bound-the-render) and a note that it belongs
to T-019's parser-model-hygiene lane.

**Integrator note for this merge.** The graph regen ritual **fires**:
the branch adds `app/src/genesis/GenesisPane.tsx` and
`genesis-derive.ts` — `*.ts/*.tsx` outside `docs/` — so `main`'s
CONVENTIONS rule applies. Run
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`,
re-run without the env var to confirm byte-identity, and commit
`docs/architecture/graph.json` with the merge. Expected delta, derived
here rather than guessed: the genesis files import exactly
`@/lib/docs-model` (C-10, three statements), `react` (external) and
`./genesis-derive` (intra-component) and **nothing else** — so
`D3:C-13` clears, `C-13→C-10` flips planned → confirmed, `C-13→C-11`
stays **planned** (no TS import can confirm a stylesheet edge, the
state `C-12→C-11` already carries), and **no new undeclared edge
appears** (the undeclared tally stays 4). That moves
`app/test/architecture-dogfood.test.ts` — the reverse of its enumerated
block at `:111` — and possibly `map-dogfood-render.test.tsx`. It does
**not** move `lib/parser/test/smoke.test.ts`, which pins the component
*registry* from `docs/architecture/components/` and never reads the
graph: the third pin is a registry pin, not a graph pin, and
over-applying this task's lesson at regen would be the mirror error.

**@human, unchanged and still blocked until T-026 mounts the pane** —
the three visual judgments listed above stand exactly as written;
nothing in the fix touches the pane, its tokens, or the bundle.
