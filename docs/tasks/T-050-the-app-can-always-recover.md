---
id: T-050
title: The app can always recover — the startup latch, the swallowed error, the dead end
feature: F-02
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

Reported by @human on 2026-08-16 with a screenshot, mid-review: the
app open on "waiting for the first docs snapshot…", nothing else on
screen but "Toggle theme". Their words: "it opens often like this.
often also with nputer repo."

**Three layers, each independently a defect.**

1. **The latch is set before the awaits and never resets.**
   `startDocsWatcher` (app/src/lib/watcher-store.ts) opens
   `if (started) return; started = true;` and only THEN awaits
   `listen("docs-changed", …)` and `invoke("docs_snapshot")`. A
   rejection from either leaves the latch set with `phase` still
   `"loading"`, and every later call returns at the guard. `started`
   is declared once, checked once, set once — there is no reset
   anywhere. One transient IPC failure strands the app permanently.

2. **The rejection is swallowed.** The call site is
   `void startDocsWatcher()` (App.tsx) with no `.catch`, so a failure
   becomes an unhandled rejection: nothing logs, nothing renders, and
   the user is given no reason.

3. **The `loading` screen is a dead end.** "Open folder…" is gated on
   `screen.screen === "board"`, `EmptyState` is not mounted, so there
   is no picker and (before T-049) no accelerator. The only control
   on that screen is the theme toggle.

**What is NOT claimed.** The mechanism above is proven by reading the
code; which trigger stranded the human's instance is NOT. Their log
was healthy — the backend emitted through seq 22 (131 files, 76
tasks) and the frontend echoed every one, the last at 19:45:29 — and
no filesystem event followed, so the log cannot say whether the
webview reloaded and stranded itself afterwards. The Rust
`ProjectStatus` enum and the TS `ProjectStatusPayload` union were
checked and match exactly (NoProject / NoDocs / Open), so a
fall-through on an unhandled kind is ruled OUT. Do not write a
diagnosis the evidence does not support.

**T-049 already mitigates layer 3 by accident**: its `useAccelerators`
hook mounts at the App root, so ⌘O now fires from the `loading`
screen. That is an escape, not a fix, and it does not clear the latch.

Serialized behind T-049's merge deliberately — both touch
`watcher-store.ts` and `App.tsx`.

## Acceptance criteria
- THE startup latch SHALL be set only on SUCCESS, so a failed attempt
  can be retried: a rejecting `listen` or `invoke` SHALL leave the
  module in a state where calling `startDocsWatcher` again genuinely
  re-attempts. Guard against the concurrent case too (a second call
  arriving while the first is still in flight SHALL NOT start a second
  subscription) — the current code's one virtue is that it is
  StrictMode-safe, and that SHALL survive.
- THE failure SHALL be surfaced rather than swallowed: the rejection
  is caught, recorded in shell state, and rendered — the user learns
  that startup failed and what failed, not merely that nothing
  happened. The existing `sanitize_for_log` discipline applies to
  anything echoed to stdout; nothing from an error message may reach
  the DOM as markup.
- THE `loading` screen SHALL carry a real escape: at minimum a retry
  affordance that re-runs startup, and the same "Open folder…" /
  "Start an interview" route the header offers elsewhere — so no
  reachable screen leaves the user with only the theme toggle. WHEN
  startup has failed THE screen SHALL say so rather than continuing
  to claim it is waiting.
- THE suite SHALL pin the case nothing covers today: a rejecting
  `listen` and a rejecting `invoke`, each proven to leave the app
  RECOVERABLE — a subsequent retry succeeds and reaches the board.
  A test SHALL also pin that the happy path still latches exactly
  once (no double subscription under StrictMode's double-effect).
- THE existing startup behaviour SHALL be otherwise unchanged: the
  subscribe-then-pull order stays (the seq guard settles the race),
  no new IPC, no new grant, no new dependency, and every current
  watcher-store and shell test stays green by name.

Verification: headless — vitest driving the store with a rejecting
IPC boundary, plus the tools/e2e lane through T-041's shell harness
for the rendered failure state. @human: whether the failure copy
reads right, and whether retry belongs on that screen or in the
header.

## Implementation notes

## Verdicts
