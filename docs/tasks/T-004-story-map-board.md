---
id: T-004
title: Story map board (read-only)
feature: F-02
milestone: 1
priority: 4
size: L
status: done
blocked_by: [T-001, T-002, T-003]
touches: [app-board, app-shell]
builder: claude-fable-5
verifier: claude-fable-5
built_by: "claude-fable-5 @fresh"
verified_by: "claude-fable-5 @fresh"
review: same-model
---

## Acceptance criteria
- THE board SHALL render backbone features as column headers in
  ROADMAP order, task cards beneath ordered by priority (1 = top),
  and a milestone slice line separating milestone 1 from later.
- THE board SHALL color cards by status (planned gray, building amber,
  verifying pulsing, rejected red, done teal), render
  status:suggested as dashed ghosts at column bottom, and collapse
  parked into a row per feature.
- WHEN the underlying files change THE board SHALL update in place
  without a full page reload (via T-003 push).
- IF a card's feature does not exist in the backbone THEN THE board
  SHALL render it in an "unmapped" column rather than dropping it.
- Cards SHALL show id, title, size, model badge when set, and the
  verification badge distinguishing independent / same-model /
  self-verified per docs/design/dashboard.md.

## Implementation plan (size-L planning pass — architect, claude-fable-5 @chat-session, 2026-08-14)

Planning pass, not a debate room: no contested architectural fork
remains (the one candidate fork — parser wiring — was settled by
T-003's file: dependency). This section settles every decision a fresh
executor would otherwise have to guess. Criteria above are unchanged.

**Frontmatter changes made by this pass:** blocked_by gains T-003 (the
live-update criterion consumes T-003's push/store — a true technical
blocker the decomposition missed); touches gains app-shell, honestly
declaring the tokens.css additions below (moot for parallelism today,
but the guardrail only works if touches: tells the truth).

### Data flow (pure lens — no new surface)
The board is a pure function of the T-003 store's DocsModel
(tasks + features + issues from @nputer/parser). NO new IPC commands,
no new file reads, no new capabilities, CSP untouched (ADR-010 has
zero room here). Implement as pure selector(s) —
`selectBoard(model): BoardModel` in app/src/lib/ — unit-testable
without DOM, then thin components over the result.

### Rendering spec (settles every ambiguity)
- **Columns** = FeatureRecords in ROADMAP backbone order; header shows
  F-ID + name. One trailing **"unmapped"** column appears ONLY when
  needed: cards whose feature is missing from the backbone, AND
  suggestion cards with no feature: field (the minimal suggestion
  format omits it — they must land somewhere visible).
- **Card order** within a column: priority asc (1 = top), tie-break id
  asc. Status does NOT affect position — done cards keep their slot
  (progress = color filling in, per docs/design/dashboard.md).
- **Milestone slice line**: rendered per column at the boundary
  between milestone == 1 cards and everything later (milestone > 1 or
  unset). Label the line once (leftmost column): "milestone 1".
- **Status → color**, via NEW semantic tokens (see Tokens): planned
  gray · building amber · verifying amber + pulse · rejected red ·
  done teal · **merging teal + pulse** (approved, not yet landed —
  the criterion's five colors don't name it; this is the decision).
- **suggested** → dashed ghost card at column bottom (below all real
  cards; no priority). **parked** → one collapsed row per feature at
  the very bottom: "N parked" (static count — expansion is T-005
  territory).
- **Card face**: id, title, size chip (S/M/L), model badge when
  builder OR built_by is set (short model name, e.g. "claude-fable-5"
  → "fable"; show builder pre-done, built_by after), and on done
  cards the **verification badge** from review:: independent = filled
  check, same-model = half-filled check, self-verified = outline
  check + warning tint — three visually DISTINCT marks (never
  identical, per dashboard.md); no review: → no badge.
- **Live update**: subscribe to the existing store; re-render in
  place (criterion 3 is satisfied by construction — but must be
  DEMONSTRATED with T-003's harness flow, not asserted). Parse errors
  keep T-003's chip + last-good model; the board adds no error UI.
- **Empty states**: feature with zero tasks renders header + empty
  column (F-01 has none today — the live board must not crash);
  empty model renders a minimal "no features found" line (full
  friendly empty state is T-007's).

### Tokens (the only app-shell surface)
Add to app/src/styles/tokens.css: --status-planned/-building/
-verifying/-rejected/-done/-merging (bg + fg pairs), placeholder
values from restrained neutrals + amber/red/teal; a --pulse keyframe
(opacity oscillation) defined in the mechanism layer, honoring
prefers-reduced-motion (static fallback). NO arbitrary values, no
Tailwind defaults (CONVENTIONS gotcha binds). T-006 later edits
VALUES only, never the mechanism — same contract as T-001's tokens.

### Component structure
app/src/components/board/: Board.tsx (layout over selectBoard),
FeatureColumn.tsx, TaskCard.tsx, GhostCard.tsx, ParkedRow.tsx,
SliceLine.tsx, badges/ (SizeBadge, ModelBadge, ReviewBadge). shadcn
primitives (e.g. Badge) may be vendored via the CLI consistent with
components.json — justify each addition.

### Tests + verification protocol
- Unit (app vitest, exists since T-003): selectBoard — grouping,
  priority order + tie-break, slice-line placement, unmapped routing
  (unknown feature; feature-less suggestion), ghost/parked
  partition, badge derivation incl. the review: three-way, merging
  mapping, empty-feature/empty-model cases.
- Empirical per criterion, T-003-style: run against a scratch tree
  exercising every status/size/review combination + an unmapped
  feature + suggestions with and without feature:; live-edit files to
  show in-place update (no reload) and slot-keeping on status flips;
  DOM check via the DEV harness precedent; record commands + results.
- Suites: parser (untouched — must stay green), app npm test +
  npm run build, cargo test (untouched).

### Out of scope (do not build)
Dragging/write-back of any kind, card detail panel (T-005), design
polish beyond token plumbing (T-006), folder picker/full empty state
(T-007), pipeline/dependency-graph secondary views (post-milestone-1).

### Dispatch note
Dispatch AFTER T-003 integrates (blocked_by now enforces this) and
only with explicit @human approval (size L). T-004 unblocks T-005,
T-006, and (with T-003) T-007 — it is the milestone's critical path.

## Implementation notes

Executor claude-fable-5, 2026-08-14, branch `t004-story-map-board`.

### What was built
The read-only story map board as a pure lens over the T-003 store —
exactly the planning pass's shape, no deviations:

- **Selector** (`app/src/lib/board-model.ts`): `selectBoard(model:
  ProjectParseResult): BoardModel` — DOM-free derivation of columns
  (backbone order + trailing unmapped only when non-empty), per-column
  card order, sliceIndex, ghosts, parkedCount, and per-card badge
  fields; plus `statusVisual` (status → token pair + pulse flag) and
  `shortModelName`. ADR-009: the feature-id-keyed column lookup is a
  `Map`; the only keyed literal in components (`STATUS_CLASSES`) is
  keyed by our own parser-validated StatusToken union, not file
  strings (commented at the site for the sweep).
- **Components** (`app/src/components/board/`): Board.tsx (layout +
  empty line), FeatureColumn.tsx (dark header F-ID + name, cards with
  SliceLine at the boundary, ghosts below, ParkedRow at bottom),
  TaskCard.tsx (status colors via token utilities; pulse via
  `motion-safe:animate-status-pulse`; face = id · title · SizeBadge ·
  ModelBadge · ReviewBadge), GhostCard.tsx (dashed, muted, id when
  present + title), ParkedRow.tsx ("N parked"), SliceLine.tsx
  (labeled "milestone 1" in the leftmost column only), badges/
  (SizeBadge, ModelBadge, ReviewBadge — three structurally distinct
  inline-SVG circled checks: filled disc + knockout check /
  half-filled disc + haloed check / outline ring + stroked check with
  amber tint). App.tsx: T-003's placeholder task list replaced by
  `<Board model={model} />`; header, counts line, and parse-error
  badge/details unchanged (`task-list` testid is gone; `docs-model`,
  `model-counts`, `parse-error-badge` remain).
- **Tokens** (the only app-shell surface, per plan): tokens.css gains
  the six `--status-*-bg/fg` pairs (light + dark values; placeholder
  restrained neutrals + amber/red/teal — verifying==building and
  merging==done values for now, distinguished by pulse until T-006
  diverges them) and `--pulse-duration`/`--pulse-opacity-dip`;
  index.css (mechanism layer) maps them into `--color-status-*` theme
  entries and registers `--animate-status-pulse` + the
  `@keyframes status-pulse` in the `@theme` block. No Tailwind
  defaults, no arbitrary values (grep of board components: zero
  `-[` occurrences); every utility used verified to emit token-backed
  CSS in the built bundle.
- **Tests**: `app/test/select-board.test.ts` — 28 new cases in the
  existing node-env vitest setup, fixtures fed through the real
  parser (`parseProjectFromFiles`) so they pin frontmatter → board:
  grouping/column order, empty feature column, duplicate backbone id,
  priority order + numeric-aware id tie-break, missing priority,
  slot-keeping on status, slice placement (mixed, interleaved,
  all-m1, all-later), unmapped routing (unknown feature / feature-less
  suggestion / suggestion-with-feature / no-unmapped-when-unneeded),
  ghost/parked partition (incl. feature-less parked under unmapped),
  model badge (builder pre-done, built_by after, none), review
  three-way + done-only, statusVisual incl. merging = teal + pulse,
  shortModelName, empty model / features-only / tasks-only-backbone.

### Smallest-choice decisions (where the plan was genuinely silent)
- **Interleaved milestones**: cards partition into a milestone-1
  block then a later block (priority asc, id asc, file asc within
  each) — for well-formed trees this IS plain priority order, and it
  keeps the slice line a single boundary when a messy tree interleaves
  priorities across milestones (the plan's order rule and line rule
  can only both hold under this reading). Pinned by test.
- **Tie-breaks**: missing priority sorts last within its block; id
  tie-break is numeric-aware (`localeCompare(en, numeric)`, so T-9 <
  T-10); file path is the final deterministic key. Ghosts order by id
  (absent → last) then file — the plan gives them "no priority".
- **Routing**: one rule for every task — feature in backbone → that
  column, else (unset OR unknown) → unmapped; applies to parked too
  (a feature-less parked card counts under unmapped rather than
  vanishing). Duplicate backbone ids collapse to the first occurrence
  (parser already issues `duplicate-id`; a second identical column
  adds nothing).
- **Ghost face**: minimal — id when present + title. Suggestions are
  minimal files; size/model/review fields effectively never exist on
  them, and the face spec's badge row would render empty.
- **Model badge fallback**: "builder pre-done, built_by after"
  implemented as done|merging → `builtBy ?? builder`, else
  `builder ?? builtBy` — graceful when only the other side is set.
- **Review badge**: done-only, plan-literal ("on done cards"): a
  merging card with review: already stamped shows no badge until it
  lands. Flagged here in case T-005/T-006 wants approved-not-landed to
  show it.
- **shortModelName heuristic**: part before `/` (stamped combos show
  the agent CLI, `codex/gpt-5.2` → `codex`), drop trailing
  version-ish segments, drop a leading `claude` vendor prefix;
  plan's example pinned (`claude-fable-5` → `fable`).
- **Slice line everywhere**: rendered in every column at its boundary
  — bottom when all cards are milestone 1, top when none are (incl.
  empty columns), so the slice reads across the whole board; label
  once, leftmost column.
- **self-verified warning tint** reuses the amber
  `--status-building-fg` via its utility — the plan's token list
  names no separate warning token and T-006 owns values. The badge
  knockout/halo strokes reference `var(--status-done-bg)` (the badge
  exists only on done cards, whose surface is that token), so T-006
  value edits follow automatically.
- **Empty flag**: `empty` = zero columns (no backbone features AND no
  unmapped content). A tasks-only tree (backbone empty) renders the
  unmapped column, not the empty line — criterion 4 forbids dropping.

### Verification per criterion (macOS/Darwin 25.6, node 22.22.0, rustc 1.95.0)
Suites first (all from wiped-state installs at task start): lib/parser
`npm ci` + `npx vitest run` → **78/78**, `npx tsc --noEmit` clean,
`npm run build` clean (parser untouched); app `npm run build` (tsc +
vite) exit 0, `npm test` → **41/41** (13 T-003 + 28 new); src-tauri
`cargo test` → **7/7** (Rust untouched).

Live protocol: scratch git repo (scratchpad) with 4 backbone features
(incl. one with zero tasks) + 18 task files exercising every status,
every size, all three review modes, model-session variants
(`claude-fable-5`, `codex@S3`, stamped `codex/gpt-5.2 @S3`, none), an
unknown-feature card (F-99), suggestions with and without feature:,
and feature-less/unknown-feature parked. Parser CLI check: 18 tasks /
4 features / **0 issues**. DOM half in a plain browser against the
served dev bundle via the T-003 DEV harness (payloads applied with
`window.__nputerDocsHarness.apply`, window marker
`__t004NoReloadMarker` planted before any snapshot to detect reloads):

1. **Columns/order/slice (criterion 1)**: column order F-01→F-04 +
   trailing unmapped; F-01 sequence [T-101..T-105, SLICE, T-106,
   T-107, T-108, GHOST] — priority 1 top, slice after the five
   milestone-1 cards; "milestone 1" label present only in the
   leftmost column; F-02 tie at priority 2 ordered T-202 then T-203;
   slice at bottom for all-m1 (F-02), top for all-later (F-03) and
   empty (F-04) columns. PASS.
2. **Status colors + ghosts + parked (criterion 2)**: computed
   backgrounds resolve the token values per status (planned gray
   0.97/0, building+verifying amber 0.95/0.055/90, rejected red,
   done+merging teal); `animation: status-pulse 2s` present on
   verifying AND merging only, empirically advancing while visible
   (currentTime 143766→144432ms across 600ms, opacity oscillating
   0.949→0.826; zero animations on other cards); dark-scheme values
   resolve after toggling `.dark`; ghost card `border-style: dashed`
   at column bottom; "2 parked" (F-01) and "1 parked" (unmapped)
   rows. Reduced-motion static fallback is the `motion-safe:` wrap,
   verified in the built CSS (`@media (prefers-reduced-motion:
   no-preference)` gates the animation; nothing else animates). PASS.
3. **In-place update (criterion 3)**: T-201 flipped planned →
   building → done+review across seqs 2/3: the SAME DOM node (tagged
   JS property survived both flips) stayed at slot 0 of F-02 while
   bg went gray → amber → teal and model/review badges appeared;
   window marker intact throughout (no reload); empty-files payload
   (seq 4) swapped the board for the "no features found" line and
   seq 5 restored it, marker still intact; a re-applied stale seq
   changed nothing and echoed nothing (echo ledger exactly [1,2,3,…]).
   Real-file half: debug binary cwd-launched at the scratch repo —
   boot log `project folder` + `watching …/docs (debounce 250ms)`,
   seq=1 echo `taskCount:18 featureCount:4 issueCount:0`; two on-disk
   status flips of T-201 round-tripped write→appliedAtMs in **372ms /
   279ms** (seqs 2,3 applied exactly once each). PASS.
4. **Unmapped (criterion 4)**: F-99 card T-401 rendered in the
   trailing unmapped column (amber, badges intact); feature-less
   suggestion ghosted there; feature-less parked counted there;
   column absent from a fully-mapped board (unit test + live tree
   below has it present due to feature-less suggestions). PASS.
5. **Card face + badges (criterion 5)**: every card shows id, title,
   size chip; model badge `fable` (builder `claude-fable-5`), `codex`
   (`codex@S3`, and stamped `codex/gpt-5.2 @S3` on a done card —
   built_by wins after done), absent when neither set (T-108); review
   badges: three structurally different SVGs (distinct innerHTML,
   1-circle-filled / 3-path half-fill / 1-path ring variants),
   self-verified additionally amber-tinted, titles "verified:
   independent" / "verified: same-model review" / "self-verified";
   absent on done-without-review and on non-done. PASS.

Smoke against the real tree: debug binary cwd-launched at this
worktree → seq=1 echo `taskCount:16 featureCount:5 issueCount:0`;
the same tree applied in the browser renders F-01..F-05 + unmapped,
F-02 reading T-001/T-002/T-003 done (teal, same-model badges),
T-004 building (amber), T-005..T-007 planned — teal filling
top-down, exactly the design's progress-as-color story.

### Dependencies + surface
- **Zero new dependencies** (npm and cargo untouched; package.json /
  lockfiles have no diff). The plan allowed vendoring shadcn
  primitives; none were needed — the three badges are purpose-built
  ~20-line components, smaller than a vendored Badge.
- **Zero IPC/capability/CSP diff**: `git diff app/src-tauri` is empty
  (ADR-010 zero-room held by construction); no fetch/WebSocket/
  localStorage/dangerouslySetInnerHTML anywhere in the new code (the
  board renders untrusted file content as React text nodes only).
- Prod bundle re-checked: `__nputerDocsHarness` absent (0 grep hits
  in dist assets) — T-003's dev-only gate unchanged.

### Build/test command changes (integrator)
None. Same per-package commands; app `npm test` now runs 41 tests
(was 13). tsconfig already typechecks test/ via `npm run build`.

### Flags for the verifier
- Pulse `currentTime` does not advance while the page/tab is hidden
  (browser render throttling freezes the animation clock even though
  `playState` is "running") — probe with the window visible.
- The DOM half rides the T-003 harness precedent (same bundle, plain
  browser, DEV-only `window.__nputerDocsHarness`); data hooks:
  `data-testid` board/feature-column/task-card/ghost-card/parked-row/
  slice-line/size-badge/model-badge/review-badge/board-empty, plus
  `data-feature-id`, `data-task-id`, `data-status`, `data-pulse`,
  `data-review`.
- Cards are keyed by source file path (suggestions have no id);
  duplicate-id trees therefore still render every file as its own
  card while the parser's duplicate-id issue rides the counts line.
- The review badge suppression on `merging` (and on any non-done
  status) is plan-literal — see smallest-choice notes if it reads as
  information loss.

### Suggestions filed
None — no non-blocking discovery rose above notes-level; the
observations worth keeping are recorded in the flags above.

## Verdicts

2026-08-14 — claude-fable-5 @fresh (verifier, same-model as builder): APPROVED

Suites reproduced from `npm ci` installs, ADR-011 order: lib/parser
78/78 + `tsc --noEmit` + build clean; app `npm run build` exit 0 +
`npm test` **41/41**; src-tauri `cargo test` **7/7**. Boundary holds:
diff touches app/** + this file only; lockfiles, lib/parser, src-tauri,
capabilities and CSP have ZERO diff (ADR-010 baseline verbatim).

Plan-compliance audit, clause by clause: PASS with no deviations found.
All ten "smallest choice" decisions audited — each fills a genuine plan
silence and none contradicts plan text. Notably the interleaved-
milestone partition is the only reading under which the plan's order
rule and single-boundary line rule can both hold (probed with m1 block
{p5,p6} above a later block {p1,p2,p3} — held); review-badge-on-done-
only is plan-literal ("on done cards the verification badge from
review:") — the criterion sets no timing, the plan does, so it governs;
consequence filed as T-004-s2, not a failure.

Probed beyond the executor's transcripts (own 15-case scratch suite fed
through the real parser, removed after the run; own browser trees via
the DEV harness; own on-disk repo via the real binary):
- SHUFFLED ROADMAP backbone (F-02, F-03, F-01, F-04): column order
  follows ROADMAP order in unit AND DOM — the executor's fixtures never
  distinguished ROADMAP order from id order; verified independently.
- Unknown-feature parked and unknown-feature suggestions route to
  unmapped (executor only pinned the feature-less variants); duplicate
  task ids render as two file-keyed cards; unmapped column slices too.
- Every status live in one tree: computed bgs match the six token pairs
  (light AND dark after `.dark` toggle); pulse on exactly
  {verifying, merging}, empirically animating (currentTime
  24382→25165ms across ~700ms, opacity 0.863→0.575); ghost
  border-style dashed; "2 parked" per column; reduced-motion fallback
  is structural — the ONLY `animate-status-pulse` rule in dev-served
  and built CSS lives inside `@media (prefers-reduced-motion:
  no-preference)`, nothing else animates.
- Live update: T-201/T-202 flipped planned→verifying→done+review via
  harness seqs — SAME DOM node (JS-property tag survived every flip),
  slot 0 kept, model badge precedence flipped fable→codex when built_by
  took over at done, review badge appeared; stale seq re-apply inert
  (echo ledger [1..9] exactly once each); empty-files payload swapped
  to "no features found" and restore brought all 5 columns back;
  no-reload window marker intact throughout. Real binary cwd-launched
  at a scratch git repo: boot logs + seq=1 echo (4 tasks/2 features/0
  issues); on-disk status flip write→appliedAtMs **422ms**; a 3-write
  burst 80ms apart collapsed to exactly ONE new seq (debounce held,
  final content won).
- Hostile content: titles with `<img onerror>`/`<script>`, a hostile
  HTML task ID (ids are format-unvalidated until T-002-s3), RTL
  override, ANSI escapes, 10k-char title — all inert: zero img/script
  nodes in the board, no handlers fired, text rendered verbatim as
  React text nodes. The unbroken 10k title bleeds glyphs across
  neighboring columns without breaking column/page structure —
  non-blocking, filed as T-004-s1.
- Executor's flags evaluated: hidden-tab animation throttling is real
  (hit it myself — rAF stalls while the pane is hidden; pulse verified
  with the window visible); data-* hooks are read-only annotations of
  already-rendered data, fine; review-on-merging suppression judged
  plan-compliant (above).

Security sweep: PASS. Zero new dependencies (both lockfiles
diff-empty); ADR-009 clean — the one file-keyed collection
(feature-id → column) is a `Map`, `STATUS_CLASSES` is keyed by the
project-authored StatusToken union and unreachable by file strings
(invalid `status:` hard-fails the parser identity gate and never
becomes a TaskRecord — probed); no
innerHTML/dangerouslySetInnerHTML/eval/fetch/WebSocket/storage
anywhere in the diff; `__nputerDocsHarness` absent from MY OWN prod
build (0 grep hits in dist assets); pure-lens holds — board components
carry no event handlers, no invoke, no writes of any kind. Two initial
probe failures were verifier fixture bugs (JS default-param trap;
non-`T-*` filenames are not task files), not code faults.

Suggestions filed (non-blocking): T-004-s1 (contain pathological
title overflow), T-004-s2 (consider showing the verification badge on
merging cards).
