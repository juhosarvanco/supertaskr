---
id: T-017
title: Board tells the whole truth — panel + card-face completeness
feature: F-02
milestone: 4
priority: 8
size: M
status: done
blocked_by: []
touches: [app-board, app-shell]
builder: claude-fable-5
verifier: claude-fable-5
built_by: "claude-fable-5 @fresh"
verified_by: "claude-fable-5 @fresh"
review: same-model
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

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder):
APPROVED — all six riders reproduced under independent adversarial
probes, suites fresh and green, boundary exact; the flagged ×N
threshold is RULED N ≥ 1 (executor's choice upheld, reasoning below).

Suites, fresh from clean installs in this worktree: lib/parser `npm
ci` + `npm run build` + `npx vitest run` 132/132 + `npx tsc --noEmit`
clean, with `git diff main...HEAD --numstat -- lib/parser` empty; app
`npm ci` + `npm run build` (tsc + vite) clean + `npm test` 121/121.
src-tauri, docs/architecture, tokens.css, badges/, package.json/lock:
zero diff (cargo not rerun — nothing to run it on). Regression sweep:
the T-005 dismissal pins (blocker re-target mid-propagation, outside
press closes exactly once across the press+click pair, card-trigger
switch, Escape, detach) and the T-006 two-mark badge tests are
present, unmodified (review-badge.test.tsx zero diff; the single
deleted line in panel-dismissal.test.ts is the fake-tree return
shape) and green; focus restore probed green besides (open from a
focused card, Esc, activeElement back on the opener). The only
task-file deletion since dispatch is `status: building` — criteria
untouched.

Independent probes (24 green, file deleted after this verdict;
fixtures: 10k-char unbroken title, 1063-char unbroken URL title,
1950-char unbroken CJK title, notes carrying script tags, an onerror
handler, real ANSI ESC bytes, and a 5k unbroken line):
- Overflow — every span rendering a pathological title (real card,
  below-slice variant, ghost card, parked entry) carries break-words
  + min-w-0 and no truncate/line-clamp/ellipsis/nowrap/overflow-hidden
  utility; the full glyph run is in the DOM (wrapped, never hidden).
  The compiled-CSS claim reproduced from the fresh build AND through a
  served-bundle probe on an ephemeral free port (64502, released;
  port 1420 never bound or contacted):
  `.break-words{overflow-wrap:break-word}` plus pre-wrap /
  overflow-x-auto / min-w-0 all present in the served stylesheet.
  jsdom does no layout — the launch-screenshot judgment already on the
  @human checklist remains the visual half.
- Parked access — entries id-sorted against scrambled input file
  order; entry click opens the panel with data-ref-kind="id";
  expansion inserts strictly BELOW the toggle while every card above
  is the SAME DOM node afterwards (nothing moves, nothing remounts);
  a zero-parked column renders no row; an empty list renders nothing.
  Files-may-lie probe: a parked task without an id fails the parser's
  identity gate calmly (`missing required field 'id'` issue, no board
  entry, board renders on), and ParkedRow handed an id-less card
  directly renders data-task-id="" and opens by FILE ref via the
  cardRef fallback. No crash on any path.
- Notes disclosure — collapsed by default; hostile notes render
  byte-equal to the derived section as ONE text node: zero element
  children, no script element in the document, the onerror never
  wired, window.__pwned unset, ANSI bytes and the 5k line verbatim;
  the body wears overflow-x-auto + whitespace-pre-wrap + font-mono.
  Re-target via BLOCKER LINK (panel stays mounted — a sharper route
  than the suite's card-click pin) re-collapses; absent notes render
  the visibly-empty section with no toggle affordance.
- Exemption — attachPanelDismissal attaches keydown + pointerdown
  ONLY; the exempt walk sits inside the pointerdown handler, so the
  CONVENTIONS gotcha governs unchanged and no click-time dismissal
  logic exists anywhere. Full-App probes: parse-badge press and
  theme-toggle press keep the panel; pointerdown ALONE on the toggle
  keeps it and pointerdown ALONE on the wordmark closes it — the
  decision demonstrably lives at pointerdown; the left-header
  projectDir line (bare chrome) dismisses too. The parked-toggle
  judgment call is RATIFIED: the toggle is a disclosure control, not
  board surface — expanding to reach a parked task must not cost the
  panel being compared against; its entries are card-triggers that
  switch instead, and collapsing with a parked task open keeps the
  panel (probed).
- rejected ×N — the count is REJECTED ENTRIES, never word frequency
  (one entry saying REJECTED twice counts once — probed on face and
  classifier); zero-verdict and approved-only-quoting-REJECTED render
  no count and no data-rejected-count; UNREJECTED never matches; a
  building card keeps the count as invisible model truth with a bare
  status word. Derivation confirmed selectBoard-side from the shared
  classifier; lib/parser untouched.
- Tint precedence — first-match-wins reproduced with both words in
  one header paragraph, both orders; body-paragraph quotes never
  re-tint; lowercase / UNREJECTED / punctuation-adjacent boundaries
  hold; the panel's blocks agree with the classifier in order
  (rejected, rejected, approved on the mixed fixture).

THE ×N RULING. N ≥ 1 stands; `rejected ×1` is correct and is not a
violation of "the design's `rejected ×N`". First, the criteria's only
absence carve-out is zero ("absence, not 0") — reading an unwritten
second threshold into the spec is exactly the shared-assumption
failure this process exists to catch. Second, the bundle shows ×2
only because its recurring fictional card IS twice-rejected (board,
map-tasks, and sessions screens all narrate the same T-008 story);
the card-states tab's density ladder (drop model badge, then size
chip; id and title never shrink) never addresses the count, so no
density rule is violated by three more characters on a rejected face.
Third, ×1 carries information the bare word does not: a task with
status rejected and an EMPTY verdict history renders bare "rejected"
(probed), so ×1 attests the rejection is RECORDED — under an N ≥ 2
threshold, once-rejected and rejection-unrecorded would be
indistinguishable, which is the precise opacity T-006-s3 was absorbed
to remove. If the @human reads the mockup as ×2-at-two-only, it is a
one-line face change plus two test edits; nothing structural depends
on the threshold.

Boundary: name-only diff is the six board components,
app/src/lib/{board-model,task-detail,verdicts}.ts, App.tsx (8+/1−,
exactly the data-panel-exempt attribute and its comment), five test
files, the task file, and T-017-s1 — nothing else. Security sweep: no
dangerouslySetInnerHTML / innerHTML / eval in app/src; hostile
sections render as React text nodes by construction; zero new
dependencies. Handoff notes for the integrator: built_by is unstamped
(stamps land on done per TASK-FORMAT); the branch touches .ts/tsx
outside docs/, so the T-009-s1 standing practice (regenerate
graph.json at merge, confirm byte-determinism) applies.

Non-failure findings filed as suggestions: T-017-s2 (verdict blocks
lack the notes body's overflow containment — the one file-derived
panel surface both this change and T-017-s1 leave exposed to an
unbroken run) and T-017-s3 (the inherited trim-matched date split
lets an INDENTED verbatim quote of an old verdict header mint a
phantom terracotta entry that inflates ×N — count and tint still
agree, blockquote quoting is safe; column-0 anchoring would close
it). Probes reverted; tree clean; no ports or processes left behind.
