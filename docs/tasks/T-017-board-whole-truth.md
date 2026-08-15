---
id: T-017
title: Board tells the whole truth — panel + card-face completeness
feature: F-02
milestone: 4
priority: 8
size: M
status: verifying
blocked_by: []
touches: [app-board, app-shell]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-004-s1, T-005-s1, T-005-s2, T-005-s3, T-006-s3, T-006-s4.
Triage 2026-08-15. app-shell only for the header data-panel-exempt
attribute.

## Acceptance criteria
- THE task cards and ghost cards SHALL contain pathological unbroken
  titles (break/clamp utilities; token-backed) without bleeding
  across columns.
- WHEN a parked row is expanded THE parked tasks SHALL open in the
  existing detail panel via their cardRef (the one population the
  board cannot inspect today).
- THE detail panel SHALL render Implementation notes as a
  collapsed-by-default disclosure section (@human-confirmed taste
  call; verbatim, mono, scrollable like verdicts).
- WHEN the theme toggle (or other header controls marked
  data-panel-exempt) is pressed WHILE the panel is open THE panel
  SHALL stay open.
- THE card face SHALL show the design's `rejected ×N` count derived
  from verdictEntries() in selectBoard (no parser change), AND
  verdict-block tinting SHALL be first-match-wins on the header
  paragraph (an APPROVED entry mentioning "REJECTED" tints approved)
  — both pinned by tests.
- IF a card has zero verdicts THEN no count renders (absence, not 0).

## Implementation notes

Executor claude-fable-5 @fresh, 2026-08-15, branch t017-board-truth.
One structural move underpins riders 5+6: the verdict family
(`VerdictEntry`, `verdictEntries`, new `rejectedVerdictCount`) left
task-detail.ts for **app/src/lib/verdicts.ts** — task-detail already
imports from board-model, and the card-face count must use the very
classifier the panel tints with (a count disagreeing with the tint
would be a lie), so the shared module keeps the import graph acyclic.
detail-presentation.test.ts imports moved with it; no re-export shim.

Per rider:

- **T-004-s1 title overflow** — `break-words` added to the four title
  spans (TaskCard real + below-slice variants, GhostCard, and the new
  parked entries from birth); every span already had `min-w-0`, which
  overflow-wrap needs to actually constrain. Wrapping, not clamping —
  this task is "whole truth", so a hostile title makes a tall card,
  never hidden glyphs and never a defaced board. No new tokens:
  break-words is a static (non-scale) utility, and because the
  tokens-only setup makes unmapped utilities silently dead I verified
  the COMPILED bundle defines it:
  `grep -o '\.break-words{[^}]*}' dist/assets/index-*.css` →
  `.break-words{overflow-wrap:break-word}` (same probe confirms
  whitespace-pre-wrap / overflow-x-auto / min-w-0). jsdom cannot do
  layout, so the class contract is what the suite pins
  (board-truth.test.tsx); the launch-screenshot judgment on the
  @human's checklist is the visual half.
- **T-005-s1 parked access** — BoardColumn.parkedCount became
  `parked: BoardCard[]` (count = length; no redundant field to drift).
  selectBoard routes parked through the same toCard as everything else,
  sorted byIdThenFile like ghosts. ParkedRow's row is now a real button
  (aria-expanded) that expands IN PLACE below itself — "nothing above
  it moves", per the design sheet — into dashed ghost-like entries
  (id + title) carrying `data-card-trigger`, so clicking one opens or
  switches the panel via cardRef exactly like a card. Parked tasks
  always carry ids (TASK-FORMAT requiredness: only suggestions may
  omit), so every parked ref resolves by id.
- **T-005-s2 notes disclosure** — selectTaskDetail gains
  `implementationNotes` (same empty-normalization as the other
  sections); the panel renders it between verdict history and
  provenance as a collapsed-by-default disclosure (React state, not
  `<details>` — testable everywhere and remountable): summary row in
  the section-header dress, body verbatim in the verdict blocks' mono
  whitespace-pre-wrap treatment inside an `overflow-x-auto` container
  so preformatted runs scroll instead of widening the panel. Keyed by
  task ref: re-targeting (blocker click, other card) starts the next
  task collapsed. Absent notes render the section visibly empty like
  every other section, no disclosure affordance.
- **T-005-s3 header exemption** — attachPanelDismissal now also
  returns early when the pointerdown target has a `[data-panel-exempt]`
  ancestor (same closest() walk, still decided on POINTERDOWN — the
  T-005 microtask-checkpoint gotcha governs this listener unchanged).
  The one app-shell touch is precisely: App.tsx's header controls
  container `<div className="flex items-center gap-2.25">` gained
  `data-panel-exempt` (plus an explaining comment) — covering the theme
  toggle, Open folder…, and the parse badge in one attribute, so future
  controls added there inherit the exemption; bare header space (the
  wordmark) still dismisses. Judgment call within the same mechanism:
  the parked-row TOGGLE also carries the attribute — expanding the list
  to reach a parked task must not cost the panel you are comparing
  against (its entries are card triggers, which switch instead).
- **T-006-s3 rejected ×N** — toCard derives
  `rejectedCount = rejectedVerdictCount(task.sections.verdicts)`,
  present only when > 0 (absence, not 0 — a zero-verdict or
  approved-only history yields undefined, so the face can never say
  ×0). The face fuses it to the rejected status word — `rejected ×2` —
  exactly the design mockup's card; other status words stay bare (the
  design shows the count nowhere else), but the count remains model
  truth for ANY status and is exposed as `data-rejected-count` for
  probes. No parser change.
- **T-006-s4 tint precedence** — verdictEntries compares the earliest
  match position of /\bREJECTED\b/ vs /\bAPPROVED\b/ within the first
  paragraph; first match wins. The criterion's exact case is pinned:
  `APPROVED — the REJECTED repro … no longer reproduces` tints
  approved; the mirrored REJECTED-first case and the existing
  header-wraps-to-next-line and quoted-body-text behaviors are pinned
  green alongside.

Verification (all from the worktree):
- lib/parser: `npx tsc --noEmit` clean; `npx vitest run` 132/132
  (untouched — zero diff under lib/parser/).
- app: `npm ci` + `npm run build` clean (tsc + vite);
  `npm test` **121/121** (was 94; +27: select-board parked/count
  derivations, verdicts first-match + count, select-task-detail notes
  passthrough, panel-dismissal exemption fake-tree cases, and
  board-truth.test.tsx — jsdom DOM pins for overflow classes, ×N face,
  parked expand→panel routing, disclosure collapse/expand/re-target,
  plus a full-App mount driving the real store's DEV harness to press
  the theme toggle with the panel open).
- Compiled-CSS utility probe as above (read from dist/ directly — no
  port bound anywhere; the human's live app on 1420 untouched).
- Boundary: `git diff 850b5b0..HEAD --name-only` shows only
  app/src/components/board/**, app/src/lib/{board-model,task-detail,
  verdicts}.ts, app/src/App.tsx, app/test/** — zero src-tauri, zero
  lib/parser, zero styles/tokens, zero deps (package.json untouched),
  nothing in app/src/lib/architecture/.

Flags for the verifier:
- jsdom pins the break-words CLASS + the bundle defines the RULE;
  actual glyph containment (span scrollWidth vs the T-004 probe's
  92,217px bleed) needs a real layout engine — one browser/screenshot
  pass over a pathological-title fixture closes that gap.
- The trusted-input pointerdown race stays synthetic-irreproducible;
  the exemption is tested at mechanism level (fake tree) and via
  synthetic full-App press — a real-input Esc/click pass remains on the
  @human checklist (T-005-s4 lane).
- `data-rejected-count` renders on any status (invisible model truth);
  the VISIBLE ×N is deliberately rejected-word-only, per the mockup.
- Choice: ×N renders for N ≥ 1 (a once-rejected rejected card says
  `rejected ×1`) — the criterion's only absence carve-out is zero, and
  the count is the design's honesty device; flag if the intent was
  N ≥ 2.

## Verdicts
