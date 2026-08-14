---
id: T-005
title: Card detail view
feature: F-02
milestone: 1
priority: 5
size: M
status: verifying
blocked_by: [T-004]
touches: [app-board]
builder: claude-fable-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN a card is clicked THE system SHALL open a detail panel showing
  acceptance criteria, blocked_by (with blocking cards linked),
  touches, verdict history verbatim, and the built_by / verified_by /
  review stamps.
- WHILE the detail panel is open THE system SHALL reflect live file
  changes to that task (via T-003).
- IF the task body lacks a section THEN THE panel SHALL show it as
  empty rather than erroring.

## Implementation notes

Executor claude-fable-5, 2026-08-14/15, branch `t005-card-detail`
(worktree, parallel with T-007 — touches held to app-board: board
components + lib selectors + tests + this file only).

### What was built
The read-only card detail panel, same shape as T-004: a pure selector
plus thin components, everything derived from the live T-003 store.

- **Selector** (`app/src/lib/task-detail.ts`): `selectTaskDetail(model,
  ref): TaskDetail | undefined` — DOM-free derivation of everything the
  panel renders: title/status/visual/size, acceptance criteria and
  verdicts passed through RAW (undefined = visibly empty; contentless
  headings normalize to empty too), blocked_by resolved against the
  model into link data (resolved flag + target title/status/visual),
  touches, raw built_by/verified_by stamp strings, review mode, source
  file. `TaskRef` is the panel's identity: `{kind:"id"}` for cards with
  ids (ids are the convention's stable identity — blocker links target
  them, and a panel follows its task across file renames), `{kind:
  "file"}` for id-less suggestion ghosts. `cardRef(card)` picks per
  card; `refLabel(ref)` names the ref for the missing state. ADR-009:
  the id lookup is a `Map` (a `blocked_by: [__proto__]` entry must not
  resolve via inheritance — pinned by test).
- **Panel** (`app/src/components/board/TaskDetailPanel.tsx`): fixed
  right-side aside (non-modal — the board stays visible and clickable;
  existing tokens/utilities only, no new tokens needed). Header: id,
  title, status chip (STATUS_CLASSES, now exported from TaskCard;
  dashed ghost chip for suggested), size chip. Sections: acceptance
  criteria (whitespace-pre-wrap), blocked by (resolved blockers are
  status-colored BUTTONS that re-target the panel via onOpen; unknown
  ids render as inert dimmed chips titled "not in the current model"),
  touches (mono chips), verdicts VERBATIM in `<pre>` — font-mono
  text-xs, max-h-80 overflow-auto (long history scrolls vertically,
  unbroken lines horizontally; nothing rewrapped or trimmed), stamps
  as label/value rows (raw model[@session] strings; review renders the
  T-004 ReviewBadge + mode; unset values render an em-dash). Footer:
  source file path. Esc and outside-click close (document listeners;
  clicks on `[data-card-trigger]` are exempt so clicking another card
  switches instead of closing); close button top-right; focus moves
  into the panel on open/re-target and returns to the original opener
  on close. Missing ref renders the calm `detail-missing` state and
  recovers by construction when the task returns.
- **Cards clickable** (`TaskCard.tsx`, `GhostCard.tsx`): the card face
  is now a real `<button>` inside the li (native Enter/Space/focus;
  visual classes stay on the li, padding moved to the button,
  focus-visible ring via the existing ring tokens; inner divs became
  spans for button content-model validity). `FeatureColumn` threads
  `onOpen` down; `Board.tsx` owns the open ref (useState) and renders
  the panel — App.tsx untouched (T-007's). The board's empty line and
  the panel are now siblings, so a panel outlives a board that empties
  under it.
- **Tests** (`app/test/select-task-detail.test.ts`): 17 new cases in
  the existing node-env vitest style, fixtures through the real parser:
  full-field derivation, raw section pass-through incl. markup/
  indentation verbatim, blocker resolution (resolved with title/status/
  visual; unresolved), blocker-chain walkability, stamps, live-update
  by id across model versions, id-follows-rename, duplicate-id
  determinism (parser sorts by path — pinned), empty-body and
  contentless-heading normalization, deleted-task undefined (id and
  file refs), ADR-009 `__proto__`/`constructor` blockers, suggestion
  by file ref + suggested_by, cardRef/refLabel. App suite 41 → 58.

### Smallest-choice decisions (criteria/dispatch silences)
- **Panel identity**: by id when the card has one, by file for id-less
  ghosts (dispatch says "by task id"; suggestions have none — file is
  their only identity). Duplicate ids resolve to the first task in
  model order, which is the parser's sorted-path order — deterministic,
  same family as the parser's duplicate-id first-seen and the board's
  duplicate-column rule.
- **Unresolvable blockers** (id not in the model): rendered as inert
  dimmed chips, not links — "clicking it switches the panel" can only
  hold for ids that resolve; hiding them would misreport blocked_by.
- **Deleted while open**: calm "no longer present" state naming the
  ref, panel stays open, auto-recovers if the task returns (criterion 2
  makes the panel a live derivation; vanishing is just one more state).
- **Ghost minimal variant**: same panel minus the stamps block (a
  suggestion cannot have been built/verified), plus a suggested_by
  line and a dashed status chip; sections render (as visibly empty when
  absent) so criterion 3 stays uniform.
- **Implementation notes section NOT rendered**: the criterion
  enumerates the panel's content and notes are not on the list —
  criteria-literal, same reasoning the T-004 verifier applied to
  review-on-done-only. Filed as T-005-s2 for an architect call.
- **Non-modal, no backdrop**: blocker-link navigation and
  click-to-switch need the board visible and clickable; outside-click
  close + Esc give the dismissal the dispatch asks for without a
  focus-trap dialog. Hand-rolled (~40 lines of listeners) rather than
  radix Dialog/vendored sheet — T-004's purpose-built-over-vendored
  precedent, and zero risk to package.json.
- **Focus**: panel container takes focus on open and on re-target
  (blocker click re-renders the list under the pointer; parking focus
  on the panel keeps keyboard users oriented); close restores focus to
  the ORIGINAL opener when it still exists.
- **Open ref is view state**: useState in Board, deliberately ephemeral
  — the pure-lens rule ("UI holds no state not in a file") governs
  PROJECT state; which pane you are looking at is transient view state,
  like scroll position. Nothing here writes anything.

### Verification per criterion (macOS/Darwin 25.6, node 22.22.0, npm 11.12.1, rustc 1.95.0)
Suites from fresh worktree installs (ADR-011 order — lib/parser `npm
ci` + `npm run build`, then app `npm ci`): parser `npx vitest run`
**78/78** + `npx tsc --noEmit` clean + build clean (parser untouched);
app `npm run build` (tsc + vite) exit 0, `npm test` **58/58** (41
baseline + 17 new); src-tauri `cargo test` **7/7** (Rust untouched).
Token discipline: zero `-[` arbitrary values in touched files; every
utility used verified present in the built CSS (incl. the
focus-visible:ring-ring/50 variant forms).

DOM half per the T-003/T-004 harness precedent — dev bundle in a plain
browser, payloads via `window.__nputerDocsHarness.apply`, no-reload
window marker planted first. PORT NOTE: the human's live app owns 1420,
so vite.config.ts server.port was TEMPORARILY repointed for the probe
and REVERTED before commit (final diff shows vite.config.ts untouched);
first attempt 14205 was blocked by the probe browser's origin policy,
so the probe ran on 127.0.0.1:8098 (free, previously-allowed origin),
started with `TAURI_DEV_HOST=127.0.0.1 npm run dev`. Scratch tree: 2
backbone features, T-101 (done; blocked_by [T-102, T-999]; touches;
stamps; review: same-model; full body incl. hostile `<img onerror>` in
a verdict line and a 350-char unbroken line), T-102 (building, criteria
only), T-103 (planned, NO body sections), id-less suggestion file.

1. **Click → panel with all content (criterion 1)**: click on
   T-101's trigger → panel opens (ref T-101, by id): title, done chip
   (bg-status-done class), acceptance criteria text exact, blocked_by
   = T-102 as a status-colored link (bg-status-building, hover title
   "Blocking task — building") + T-999 inert/dimmed, touches
   app-board + lib-parser, verdicts `<pre>` textContent
   STRICT-EQUAL to the source section (verbatim check true; tag PRE,
   computed overflow auto, max-height 320px, mono stack, scrollWidth >
   clientWidth on the long line — scrolls), stamps built_by
   `codex/gpt-5.2 @S3` / verified_by `claude-fable-5 @fresh` / review
   `same-model` + ReviewBadge SVG, file footer. Blocker-link click →
   SAME panel node (tagged JS property survived) re-targeted to T-102.
   Hostile verdict content inert: 0 img/script nodes in panel, onerror
   never fired. PASS.
2. **Live update while open (criterion 2)**: with the panel open on
   T-102, seq 2 changed the file (title edit, building→done, verdicts
   + stamps appeared): panel title/status-chip/verdicts/stamps all
   updated IN PLACE — same panel DOM node, no-reload marker intact,
   board card updated alongside. Deleted-while-open: seq 3 removed the
   file → calm "no longer present" in the same node (no error overlay,
   board fine); seq 4 restored → full content back, same node. Broken
   content while open (seq 6, T-101 file replaced by frontmatter-less
   garbage): store keeps last-good → panel keeps showing last-good
   content while the app badge reads "1 parse error" (T-003 semantics
   ride through untouched). PASS.
3. **Missing sections render empty (criterion 3)**: T-103 (no body at
   all) → acceptance "(empty)", blocked by "none", touches "none",
   verdicts "(empty)", stamps all "—"; zero console errors, no
   overlay. Contentless-heading variant covered by unit test. PASS.

Interaction extras verified live: real-mouse card click opens; real
click on a second card switches (not closes); real click inside the
panel keeps it open; real outside-click closes; close button closes
with focus restored to the opener card's trigger; Esc closes (panel
open → one bubbled `keydown{Escape}` → closed — verified with settled
reads); ghost click opens the minimal variant (kind=file, dashed
suggested chip, suggested_by line, stamps block absent); dark-mode
toggle re-resolves panel + chip token values (light/dark oklch pairs
observed); card triggers are real focusable BUTTONs. Console: zero
errors/warnings from this session's page.

### Dependencies + surface
Zero new dependencies (package.json/lockfiles no diff — radix/shadcn
untouched, panel is hand-rolled). Zero IPC/capability/CSP diff
(src-tauri untouched; ADR-010 zero-room held). tokens.css/index.css
untouched — existing tokens/utilities sufficed, no new-token
suggestion needed. No writes of any kind: the panel renders React text
nodes only; the sole event handlers are open/close/switch view-state
setters. ADR-009 audit of the diff: one new file-keyed collection (id →
task Map) is a `Map`; STATUS_CLASSES remains keyed by the
project-authored StatusToken union (comment updated at the site).

### Flags for the verifier
- Esc-close cannot be probed via this browser pane's synthesized key
  injection — it delivers NO keydown to the page at all (verified: a
  probe listener saw zero events for Escape AND for plain "a"). Use a
  real keyboard or a bubbled synthetic `KeyboardEvent`; with either,
  the panel closes.
- React renders async under the harness: assert DOM state in a LATER
  task (timeout/next call), not synchronously after `apply()` — two
  early probe reads were stale for this reason, not app bugs. rAF is
  throttled while the pane is hidden (T-004's known flag) — use
  timeouts.
- New data hooks: task-detail-panel (+ data-ref-kind, data-task-ref),
  detail-close/-status/-suggested-by/-acceptance/-blocked-by/-touches/
  -verdicts/-verdicts-text/-stamps/-missing/-empty, blocker-link,
  blocker-unresolved, stamp-built-by/-verified-by/-review, and
  `data-card-trigger` on the card buttons. All read-only annotations.
- TaskCard/GhostCard DOM changed (button now wraps the face; padding
  moved li → button; inner divs → spans): T-004's testids and visual
  classes are unchanged on the li, but any probe that assumed the li
  had no interactive child needs the trigger selector.
- The focus-restore target is the FIRST opener of a panel session, not
  the last re-target — a deliberate smallest choice; revisit if it
  reads wrong.

### Suggestions filed
T-005-s1 (parked tasks have no detail surface — count row is a dead
end), T-005-s2 (panel omits Implementation notes; criteria-literal,
architect call). Open T-004-s2 (review badge on merging) NOT
implemented per dispatch — the panel shows review from frontmatter
whenever set, so a merging task's review IS visible in the panel while
its card badge stays done-only (consistent with both rules).

## Verdicts
