---
id: T-049
title: A way in from anywhere — the accelerators leave the front door, and genesis gets a door
feature: F-03
milestone: 3
priority: 6
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Found by @human on 2026-08-16 during the visual review session, trying
to use the shortcuts the front door advertises: "command + o and
command + n are not working in nputer."

**They are the right keys and nothing is broken — the listener simply
is not there.** `useEffect`'s `window.addEventListener("keydown", …)`
lives INSIDE the `EmptyState` component (app/src/App.tsx:143), so it
registers when the front door mounts and unregisters when it leaves.
With a project open the board renders instead, `EmptyState` never
mounts, and ⌘O/⌘N reach nothing. T-026's tests pin exactly this — the
unmount-scoping is asserted deliberately — because its criterion says
the affordances appear "on EVERY empty state". Built to spec; the
spec was narrower than the app needs.

**The sharper half: there is NO way to start an interview from an
open project.** Not a shortcut, not a button. The board's header
carries "Open folder…" (App.tsx:325) and nothing else, so reaching
genesis today is: Open folder… → choose a folder with no docs/ → land
on the "No plan in <folder>" card → "Start an interview here". Four
steps to reach the thing milestone 3 is named after, and the first
step is a picker whose own shortcut does not work from where you are.

Related and deliberately NOT duplicated: T-026-s2 asked for one
screen-scoped accelerator table instead of per-component `window`
listeners, and the second triage folded it into T-027 — the right home
for the ROUTING question, since T-027 is the second screen that wants
keys. This task is the narrow usability fix that cannot wait for an L
card blocked on a human verdict; it must leave T-027's fold intact and
should make that fold EASIER, not redundant.

## Acceptance criteria
- THE ⌘O and ⌘N accelerators SHALL fire from any screen the app can
  show — board, map, genesis, and every empty state — rather than
  only while `EmptyState` is mounted; the Ctrl equivalents keep
  working as today.
- THE board SHALL offer a "Start an interview" affordance beside the
  existing "Open folder…" button, so genesis is reachable in one step
  from an open project rather than four, and so the capability is
  discoverable without knowing a chord. Design source: the front
  door's own two-button pairing (docs/design/claudedesign_handoff/
  "nputer app.dc.html", the `open a folder` screen) — same verbs, same
  order, adapted to the header's existing button idiom; tokens-only,
  no new tokens, both schemes.
- WHEN an accelerator fires while a picker is already in flight THE
  app SHALL do nothing rather than stack a second native dialog —
  T-021's single-flight guard already returns a typed `busy`, and this
  SHALL be respected rather than re-implemented.
- THE existing front-door behaviour SHALL be unchanged: the two
  buttons, the `⌘O · ⌘N` hint, the "No plan in <folder>" card and its
  "Start an interview here" all render and behave as they do today,
  pinned by T-026's existing suites.
- THE registration SHALL be a single app-scoped listener, not a second
  `window` listener racing the first — T-026's `EmptyState` listener
  is REPLACED, not supplemented. A test SHALL assert exactly one
  keydown listener path handles the chords, so T-027's later
  accelerator table has one thing to absorb rather than two.
- IF a text input or textarea has focus THEN the accelerators SHALL
  still work (⌘O/⌘N are not text-editing keys) but SHALL NOT fire on
  a chord the platform reserves — no new preventDefault beyond the two
  chords already claimed.

Verification: headless — vitest DOM asserting the chords fire from
board, map and genesis screens as well as the front door, that the
listener is single, and that a busy picker is respected; plus the
tools/e2e lane driving a real trusted ⌘O through the shell harness
T-041 just landed (the first task able to do this). @human: whether
the header's two-button pairing reads right at the board's density —
the front door has room to breathe and the header does not.

## Implementation notes

## Verdicts
