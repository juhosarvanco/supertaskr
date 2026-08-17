---
id: T-063
title: A startup that fails says so — on screen, in the log, and to the next attempt
feature: F-02
milestone: 3
priority: 29
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-050-s1, T-050-s2, T-050-s3, T-041-s4 (triage 2026-08-17).
The suggestion files are removed in the same commit as this card.

The three T-050 residuals are one seam in `watcher-store.ts`, and
T-050-s2's option 3 (hold the unlisten handle) is explicitly "the one
that makes both other options safe" — so they cannot honestly be
split. T-041-s4 rides because its cheapest arm is a comment in the
same file, and no other card is going there.

THE ASYMMETRY, pinned as a FACT in `startup-recovery.test.ts` rather
than fixed there: an `invoke` rejection is self-healing (`listen` had
already resolved, so the subscription is LIVE and the next file change
brings the app up with no retry at all), while a `listen` rejection
leaves NO subscription. T-050 put "Open a folder…" and "Start an
interview" on the failure screen and they work — `pick_project_folder`
re-arms the Rust watcher and answers a snapshot — **but after a failed
`subscribe` that board is a photograph.** The user sees a working app
that has silently stopped tracking their files, which is a worse
failure mode than the honest error screen they escaped from, precisely
because it looks fine. STATE ranks this first among the older set.

AND THE ONE FAILURE A USER REPORTS IS THE ONE THE LOG CANNOT DESCRIBE.
Re-verified at triage: `recordStartupFailure` ends at
`console.error("[nputer] startup failed at", step, reason)`
(`watcher-store.ts:702`), and the store's ONLY `emit(` call site is
`sendEcho` at `:652`. A WKWebView `console.error` never reaches the
Tauri process's stdout. This is not hypothetical — on 2026-08-16
@human reported exactly this defect with a screenshot, sent their log,
and the log was healthy through seq 22 because the thing that broke
could not write to it. T-050's card had to say the trigger is NOT
claimed.

## Acceptance criteria
- THE STORE SHALL HOLD THE UNLISTEN HANDLE. `await listen<…>(…)` at
  `watcher-store.ts:746` discards the function `listen` resolves to.
  Holding it is what lets a retry tear a previous subscription down
  instead of stacking a second one — and it is the prerequisite for
  both other halves of this card (T-050-s2 option 3).
- WHEN a pick succeeds AND `startupFailure?.step === "subscribe"` THE
  app SHALL re-run startup — one `void startDocsWatcher()` in
  `commitPickOutcome`; the latch is open because recording a failure
  releases it. The re-subscribe SHALL NOT fight the pick's own
  snapshot (the seq guard settles it, the same way it settles the
  subscribe-then-pull race today) and that interleaving SHALL be
  pinned (T-050-s2 option 1).
- A STARTUP THAT HANGS SHALL BE DISTINGUISHABLE FROM ONE THAT
  REJECTED. Today the `startup` latch hands the SAME promise to every
  later caller — right, because it is what keeps React's double-effect
  from opening two subscriptions — so "Try again" during an in-flight
  attempt is a no-op BY CONSTRUCTION and the screen goes on saying
  "waiting for the first docs snapshot…", which is TRUE and is
  exactly what @human's screenshot showed. A deadline SHALL be
  recorded as a third `StartupStep` (or a `kind` beside `step`) so
  the copy can say "the watcher did not answer in N seconds" rather
  than "was refused" (T-050-s1).
- N SHALL BE MEASURED, NOT GUESSED — a cold Tauri start timed on this
  machine, with the figure and the margin in notes. Too short and
  every slow launch shows a failure screen that is not one; too long
  and the affordance arrives after the user has quit. IF a measured N
  cannot be defended THEN the intermediate SHALL ship instead: the
  waiting copy says how long it has been waiting, which needs a timer
  and a re-render and no new failure semantics.
- A RACED-OUT ATTEMPT IS STILL RUNNING and SHALL NOT leak a second
  subscription — the unlisten handle above is what makes this
  answerable (T-050-s1).
- THE FAILURE SHALL REACH THE LOG: `emit("startup-failed", { step,
  message, attempt })` from `recordStartupFailure`, a listener beside
  the `model-updated` one in `app/src-tauri/src/lib.rs`, and
  `eprintln!` through **`sanitize_for_log`** — which is MANDATORY and
  is exactly why: the message is an arbitrary string from the
  boundary, T-050's verification put a NUL + BEL + ESC run and 10 000
  characters through it, the DOM handles that safely and a terminal
  would not. New event, no new command, no new grant (T-050-s3
  option 1).
- FOUR "Try again" PRESSES SHALL PRODUCE FOUR LOG LINES with four
  attempt numbers — the evidence a diagnosis needs, all of which is
  discarded today.
- THE DEV-GATE MECHANISM SHALL BE WRITTEN DOWN where the gate is, in
  one clause at `app/src/lib/watcher-store.ts`'s harness gate: DEV is
  false for a build because **vite forces `NODE_ENV=production` for
  `vite build` before the config loads whenever NODE_ENV is unset**,
  and an INHERITED `NODE_ENV` is the one lever that changes that —
  `--mode development` does NOT (measured: `npm run build` and
  `npx vite build --mode development` produce a sha-IDENTICAL asset;
  `NODE_ENV=development npm run build` produces a 696,302 B bundle
  carrying `__nputerShellHarness`). `tauri.conf.json`'s
  `beforeBuildCommand` is `npm run build`, so a packaging run
  inheriting `NODE_ENV=development` embeds the harness — where the
  RUNTIME `__TAURI_INTERNALS__` guard still prevents installation,
  which is the case for having two layers. T-027's merge re-confirmed
  every figure. One comment, so the next reader does not re-measure
  it (T-041-s4 arm 1).
- THE BUILD-HALF TEST SHALL PIN THE MECHANISM, not only the outcome:
  one assertion that the built asset carries no `import.meta` DEV
  fingerprint, beside the existing "the shell harness must not reach
  production" (T-041-s4 arm 2). The ci.yml variant (a step asserting
  NODE_ENV before `npm run build`) is declined here and named in
  notes — it belongs with **T-054**, which owns ci.yml.

Verification: headless — vitest against the real store with the IPC
boundary mocked (both failure shapes, the pick-then-resubscribe
interleaving, the deadline), plus a cargo-side test that the emitted
event reaches `eprintln!` sanitised. @human: the copy for the timeout
case, and whether "Try again" now does what its label says.

## Implementation notes

## Verdicts
