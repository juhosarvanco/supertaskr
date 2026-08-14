---
id: T-004
title: Story map board (read-only)
feature: F-02
milestone: 1
priority: 4
size: L
status: building
blocked_by: [T-001, T-002, T-003]
touches: [app-board, app-shell]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
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

## Verdicts
