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

### Fix pass after 2026-08-15 rejection — fresh executor claude-fable-5

2026-08-15, same branch/worktree, headless throughout (no screen
control, per the human's order). Scope: exactly the rejected
interaction — the panel's dismissal logic — plus its regression
test. Diff: TaskDetailPanel.tsx (effect now delegates), NEW
app/src/components/board/panel-dismissal.ts (the wiring, extracted),
NEW app/test/panel-dismissal.test.ts (6 tests; app suite 58 → 64),
this file. Nothing else.

**Chosen direction: (b) — dismiss on `pointerdown`, not `click`.**
Of the verdict's three options, (b) is the only one that makes the
race structurally impossible instead of compensating for it: the
inside/outside/[data-card-trigger] decision runs BEFORE any
activation handler and therefore before any React flush, so it always
reads the still-intact tree — for every in-panel interactive element,
current and future, whatever its activation unmounts or re-parents
(the T-005-s3 family: whichever element a later architect call
exempts, the exemption machinery now reads pre-activation DOM; s3
itself is NOT implemented — the theme toggle is a genuine outside
press and still dismisses, spec-consistent). Against (a)
`!target.isConnected`: it patches the symptom — the decision still
runs post-mutation, misfires if the target survives but its ancestry
changes, and silently swallows genuine outside clicks on
self-unmounting controls. Against (c) captured `composedPath()`:
snapshot-correct for containment but still a late decision, and it
keeps press-inside-release-outside dismissal (selecting verdict text
in the `<pre>` and releasing outside closed the panel; with (b) it no
longer does). (b) is the pattern production dismissal layers use
(Radix DismissableLayer, React Aria useInteractOutside), and it
covers keyboard activation for free: Enter/Space on a focused chip
fires a trusted click with the SAME mid-propagation flush — the click
path had that same latent bug — but no pointer event at all, so it
can no longer spuriously dismiss. Deliberate semantics that come with
(b): dismissal happens at press; any-button press outside dismisses
(native transient-surface convention); a scrollbar drag on the board
(outside) dismisses — the panel's own scrollbar is inside and exempt.

**Mechanism encoded headlessly** (the app suite is deliberately
node-env — vitest.config.ts — and no DOM emulator is a dependency;
zero new deps): the wiring moved verbatim into exported
`attachPanelDismissal(doc, panel, onClose)` beside the panel, the
effect body shrank to one line, and the test drives the real function
with minimal fakes implementing exactly what it reads (instanceof
Element, contains, closest, parent links, isConnected), delivering
events in the verdict's TRUSTED order: pointerdown with the chip
attached → onOpen re-target → the flush (the chip's li unmounted, a
different-key list swapped in, `chip.isConnected === false` asserted
— the verdict's step 3) → the click delivered to the document-level
wiring with the DETACHED target. Assertions: onClose never fired
(Board unmounts the panel exactly on onClose, so this IS "stays
open") and the re-target stands. Companions: the keyboard-activation
variant (trusted click, no pointer events), outside press dismisses
exactly once across the press+click pair, card-trigger subtree
exempt, Escape/other-keys, detach removes all wiring.

**Failing → passing proof** (same test file both runs): the
extraction was first made with the ORIGINAL `click` listener —
character-identical logic to the rejected code (only
`panelRef.current` became `panel()`) — and `npx vitest run` failed
exactly the two mechanism tests, "trusted blocker-chip click…" and
"keyboard activation…", both `AssertionError: expected 1 to be +0`
at `expect(t.closeCount()).toBe(0)`: Tests 2 failed | 62 passed
(64), tsc clean (behavior, not types — the wiring closed on the
detached target, reproducing the rejection). Then the fix — `click`
→ `pointerdown`, the whole diff of stage two — and the suite went
64/64. The trusted-timing mechanism is now pinned in-suite; the
verdict's T-005-s4 (real-input E2E for this class) stands as filed.

**Suites** (fresh installs, ADR-011 order, this pass, same machine
as above): lib/parser `npm ci` + vitest **78/78** + `npx tsc
--noEmit` clean + `npm run build` clean; app `npm ci` + `npm run
build` exit 0 + `npm test` **64/64** (58 baseline + 6 new);
src-tauri `cargo test` **7/7** (Rust untouched). Boundary re-audited:
zero diff in App.tsx, package.json, every lockfile, src-tauri/**,
tokens.css, index.css, lib/parser/**; zero new dependencies; no
ports opened, no dev server run, the human's 1420 instance untouched.

End-to-end confirmation under real input is human-verifiable
post-merge: one real mouse click on a resolved blocker link in the
live app should re-target the panel, not close it (the @human
precedent). No real input was attempted in this pass.

## Verdicts

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder):
REJECTED — one interaction failure on criterion 1's own wording
("blocked_by (with blocking cards linked)"): under a real, OS-level
(trusted) click, a resolved blocker link CLOSES the panel instead of
re-targeting it. Everything else verified green — both other
criteria, the security sweep, the parallel boundary — so the fix
round is one handler plus a regression story.

Failure (TaskDetailPanel.tsx, outside-click handler vs blocker
re-target): clicking a resolved blocker chip fires onOpen(target) and
React 18 flushes that discrete update in a microtask. For a TRUSTED
click the browser performs microtask checkpoints between listener
invocations (the JS stack empties between them), so the flush lands
between React's root listener and the panel's document-level click
listener: the re-render replaces the blocked-by list (different li
keys — a target task's blockers never match the source's at the same
index), the clicked button is detached, and when the event reaches
document the handler sees a disconnected target →
panelRef.contains(target) false → closest('[data-card-trigger]')
null → onClose(). For a SYNTHETIC element.click() the entire
propagation completes synchronously before any microtask, the
document listener still sees the button connected inside the panel,
and the re-target works — which is why the builder's probe (and any
jsdom/unit test) passes while a real mouse fails.

Repro (real input): in app/, `npm run dev -- --port 8098 --host
127.0.0.1` (CLI flags — no vite.config.ts edit needed), open in a
browser, apply via window.__nputerDocsHarness a model where T-A has
blocked_by: [T-B] (any resolvable id); mouse-click T-A's card, then
mouse-click the T-B chip under "blocked by".
Expected (criterion 1 + the builder's own notes): panel re-targets
to T-B and stays open. Actual: panel closes.
Observed live (Chromium pane, viewport 1280x720): trusted click at
page (936, 361.6), inside the chip rect 921–971 × 351–373 and
elementFromPoint = blocker-link → [data-testid=task-detail-panel]
absent at the settled read; zero console/window errors; no-reload
marker intact. Headless confirmation of every link in the chain:
(1) synthetic chip.click() re-targets and stays open, same node —
reproduces the builder's record; (2) when click() returns the chip
is STILL connected (the document listener already ran, hence no
close); (3) after the flush the clicked chip is detached
(isConnected false) — under trusted dispatch that flush runs before
the document listener; (4) breadth: the detachment equally occurs on
ul→ul re-targets (different li keys), so effectively EVERY real
blocker-link click closes the panel.

Fix direction (any one): ignore disconnected targets in the
outside-click handler (a detached target cannot be a genuine outside
click — `if (!target.isConnected) return;`); or close on pointerdown
(fires before click's state update); or test a captured
composedPath() against the panel instead of live contains().
Regression coverage for this class needs real-input E2E — no
synthetic test can pin it (filed as T-005-s4, non-blocking).

Verified green, independently (fresh installs, ADR-011 order):
lib/parser npm ci + vitest 78/78 + tsc clean + build clean; app npm
ci + npm run build exit 0 + npm test 58/58; src-tauri cargo test
7/7. Parallel boundary audited file-by-file: ZERO diff in App.tsx,
app/package.json, every lockfile, app/src-tauri/**, tokens.css,
index.css, lib/parser/** — the diff is exactly board components +
lib selector + tests + T-005 docs; zero new dependencies (ADR-010
trivially intact). Criterion 1 content probed with my own hostile
fixtures (script / img-onerror / iframe-srcdoc / javascript:-href as
section text, a 5000-char unbroken line, RTL overrides, ANSI, CJK/
emoji, hostile HTML title via live edit): acceptance criteria and
verdicts render STRICT-equal to the parser's raw section strings in
a PRE (max-h 320px, overflow auto, the long line scrolls), with zero
element injection (0 script/img/iframe nodes inside the panel, no
onerror fired, no innerHTML anywhere in the diff). Stamps raw,
em-dash for unset, touches chips, source-file footer all correct;
Implementation notes correctly not rendered (criteria-literal,
T-005-s2 stands). ADR-009 live: blocked_by [__proto__, constructor]
render as inert unresolved chips — the Map lookup holds; the pinned
unit test re-ran green. Criterion 2 with the panel held open across
nine harness snapshots (seq 1–9): in-place update of title/status
chip/verdicts/stamps in the SAME DOM node with the board card
updating alongside; delete → calm "no longer present" naming the
ref → restore recovers, same node; broken file → last-good content +
"1 parse error" badge (showingLastGood true), heals clean; the panel
outlives an emptied board (board-empty line + missing state) and
recovers — one continuous panel node through the entire sequence.
Criterion 3: a bodyless task renders (empty)/none markers ×4 and —
stamps with zero errors; the ghost opens by file ref with the dashed
suggested chip, suggested_by line, and NO stamps block; a
merging+review task shows its review stamp in-panel while its board
card stays done-only (matches the builder's T-004-s2 note).
Interactions (synthetic — see caveat): Esc via a bubbled
KeyboardEvent through the app's document listener closes with focus
restored to the opener; open parks focus on the panel; inside-click
keeps it open; outside-click closes; card→card switch re-targets the
same node (card triggers survive the re-render, so the trusted-click
race does NOT hit that path — corroborated by the real card clicks
observed before the moratorium below); close button restores focus
to the FIRST opener as documented; dark-mode toggle re-resolves
panel tokens (--status-done-bg oklch 0.94→0.28 pair observed). Note
in passing: the theme toggle itself counts as an outside click and
closes the panel (spec-consistent; filed T-005-s3). Security sweep:
no innerHTML/dangerouslySetInnerHTML/eval/new Function/
document.write in the diff; pure-lens holds (no writes, no invoke,
handlers are view-state setters only); no arbitrary Tailwind values
in touched files; CSP/capabilities untouched (src-tauri diff empty).

Environment caveat (recorded per the T-001-s3 precedent): mid-
verification the human ordered all screen control stopped, so
real-key Esc/Enter/Space and further real-mouse passes are
unverified-by-real-input in this run. The pane's key injection
delivers no page events anyway — builder's flag confirmed: a
capture-phase listener saw zero keydown for injected Escape and "a".
Card triggers are native type=button BUTTONs, so Enter/Space →
click activation is UA-guaranteed; Esc was exercised through the
app's actual handler via a bubbled synthetic event. The REJECTED
finding was observed with a real trusted click BEFORE the moratorium
and disambiguated headlessly afterward.

Builder's two self-flags, judged: (1) key-injection blindness —
accurate, an environment limitation, not a defect. (2) async-render
read timing — accurate (a synchronous DOM read right after harness
apply() returns the previous frame; settled reads are correct) —
standard React scheduling, not a defect. Neither is REJECTED-level.
The trusted-vs-synthetic CLICK divergence behind this rejection is
the same event-timing family as flag 2, but the criterion-1
blocker-link pass was recorded from synthetic dispatch only.

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder),
re-verification of the fix pass (61f9f2f, fresh executor): APPROVED.

Extraction fidelity: CONFIRMED. attachPanelDismissal's decision body
is line-for-line the rejected onClick logic (same three guards, same
order) modulo two non-behavioral edits — `panelRef.current?.` became
the `panel()?.` thunk (same live read) and the parameter annotation
widened MouseEvent → Event (only .target is read). Independently
re-derived stage 1: sed-swapping ONLY the two event-name strings
("pointerdown" → "click") in the SHIPPED module and running the
SHIPPED test file against it fails exactly the two mechanism tests
with exactly the claimed assertion (`expected 1 to be +0` at
closeCount) — 2 failed | 4 passed — so the entire behavioral diff
between rejected and shipped wiring is the click → pointerdown swap,
as claimed. (Probe copies lived transiently in app/test/, deleted;
tree clean.)

Mechanism-test fidelity: FAITHFUL to the rejection's ground truth.
The trusted ordering is forced step-for-step as observed live on
2026-08-15: pointerdown delivered with the chip attached → onOpen
re-target → the flush simulated at the microtask-checkpoint position
(chip's li unmounted, different-key list in, `chip.isConnected ===
false` asserted — the same assertion the verdict's step 3 made in the
real browser) → the click delivered to the document-level wiring with
the DETACHED target retained, which models the real dispatch's
retained propagation path (exactly what the rejected run's document
listener received). ListenerDoc delivers to document-level listeners
only — all the wiring has. "onClose never fired == panel stays open"
holds because Board unmounts the panel precisely on onClose. The
keyboard-activation companion pins a REAL latent variant the rejected
code shared (Enter/Space fires a trusted click with the same flush
and no pointer event) that the first verification had not separately
named — a genuine catch, consistent with the mechanism.

Fix soundness: the pointerdown decision runs before any activation
handler and therefore before any React flush, so the
inside/outside/exemption test always reads the pre-activation tree —
the race is structurally impossible, not compensated for. Chosen
direction (b) of the verdict's three; the notes' argument against (a)
and (c) is sound.

Suites, fresh installs, ADR-011 order, re-run: lib/parser 78/78 +
tsc clean + build clean; app build exit 0 + npm test 64/64 (58 + 6);
src-tauri cargo 7/7. Boundary re-audited file-by-file over
d8dc86d..61f9f2f: exactly TaskDetailPanel.tsx + panel-dismissal.ts +
panel-dismissal.test.ts + this file; zero diff in App.tsx,
package.json, every lockfile, src-tauri/**, tokens.css, index.css,
lib/parser/**; zero new dependencies; the 2026-08-15 REJECTED entry
above is byte-untouched (docs diff is pure addition). Security
posture unchanged: the new module adds listeners and a detach only —
no sinks, no writes, no keyed collections.

New-semantics probes, headless on the built dev bundle (fixtures via
the harness; synthetic press = PointerEvent pointerdown + click):
blocker press+click re-targets the same panel node (chip detaching
after, as before — now harmless: no click-time dismissal listener
exists); press-inside-release-outside (pointerdown on panel text,
click landing on the header) keeps the panel open — the text-
selection improvement the notes claim; a press inside a card
trigger's subtree never closes and its click switches; a genuine
outside press closes AT PRESS exactly once, the paired click inert;
post-unmount presses and Escapes are inert with zero errors
(cleanup verified behaviorally, and pinned by the detach test);
Escape closes with focus restored to the opener; live in-place
update (same DOM node) and hostile-verdict strict verbatim (zero
injected elements, long line scrolls) re-confirmed unregressed.
Disclosed semantic deltas judged acceptable within the builder's
dismissal-mechanics space (the design of record specifies none):
dismissal at press time; any-button press outside closes (probed:
button 2 closes — native transient-surface convention); a drag on
the board's scrollbar now dismisses while the panel's own does not.
T-005-s3 (header/app-chrome exemption) remains the architect's call
and is unaffected; T-005-s4 (real-input E2E lane) stands.

Human-verifiable under real input, post-merge (screen-control
moratorium unchanged; no real input attempted this pass): one real
mouse click on a resolved blocker link re-targets the panel instead
of closing it; real-key Esc and Enter/Space activation.

Environment note for the record: the human's port-1420 instance
(node PID 84310) was alive at this re-verification's baseline check
and was found gone mid-pass, before this verifier's probe server
started. No command of this run binds 1420, signals foreign PIDs, or
leaves the t005 worktree/scratchpad (round-1 kill was PID 98665, own
probe server, with 1420 verified alive afterwards; this pass killed
only own PID 9141). Cause unknown from this seat — flagged to the
orchestrator for triage; deliberately NOT restarted (binding 1420 is
out of bounds).
