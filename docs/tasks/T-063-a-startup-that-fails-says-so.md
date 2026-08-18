---
id: T-063
title: A startup that fails says so — on screen, in the log, and to the next attempt
feature: F-02
milestone: 3
priority: 29
size: M
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
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

Built by `claude-opus-5 @fresh` in worktree `nputer-T-063` off `2fc3475`.
Two commits: the Rust half, then the frontend seam.

**CONFIRMED BEFORE TOUCHING ANYTHING** (CLAUDE.md): one seam in
`watcher-store.ts`, four moves in the order they depend on each other —
hold the unlisten handle (the prerequisite), re-subscribe after a
successful pick, deadline the hang, emit the failure to the log — plus
the DEV-gate comment and one bundle assertion.

### The asymmetry REPRODUCED, not assumed

The card's central claim holds exactly as written and is now enforced
rather than described. `startup-recovery.test.ts` measures both halves:
after a refused `invoke`, `liveSubscriptions === 1` and a `docs-changed`
push still reaches the board with no retry; after a refused `listen`,
`liveSubscriptions === 0`. Every cited line reproduced too —
`recordStartupFailure` did end at `console.error`, `sendEcho` was the
only `emit(` site, `await listen<…>(…)` did discard its handle.

### N = 8 000 ms, MEASURED

Five `npm run tauri dev` launches out of this worktree on a scratch port
(17630, bind-probed free), the first immediately after a cold cargo
build. Instrumented with a TEMPORARY probe on the success path that
emitted through the very `startup-failed` channel this card adds; the
probe was removed afterwards and its removal proved by sha256 against
the pre-probe copy (`3dab2f72…` both sides). Two figures:

| run | the window the deadline covers | padded upper bound | applied − generated |
|-----|-------------------------------|--------------------|---------------------|
| 1 (cold) | 72.0 ms | 778 ms | 93 ms |
| 2 | 66.0 ms | 657 ms | 87 ms |
| 3 | 68.0 ms | 601 ms | 87 ms |
| 4 | 70.0 ms | 710 ms | 96 ms |
| 5 | 69.0 ms | 607 ms | 92 ms |

The **window** is `listen("docs-changed")` + `invoke("docs_snapshot")`,
the latter including Rust's walk and read of docs/ (159 files, 2.9 MB) —
i.e. exactly what the deadline times. The **padded upper bound** is the
`[nputer] window "main" created` line to the applied snapshot; it
strictly CONTAINS the window, so it is the conservative number.

**8 000 ms is 111× the worst window and 10× the worst padded bound.** The
margin is deliberately lopsided towards "too long": a premature failure
screen is a claim the user cannot check, while a late one merely arrives
after they have started wondering. And the false positive is not fatal —
the raced-out attempt is NOT cancelled, so if it answers with nobody
behind it the app comes up and the failure clears itself (pinned).
`STARTUP_DEADLINE_MS`'s own header carries the figures so the next reader
does not re-measure, and one test pins the VALUE (see the drill below for
why that test had to exist).

### A hazard criterion 2 creates, found by reproducing rather than reading

`apply_genesis_folder` sets Rust's project dir to the interview's folder,
and a genesis folder legitimately has no `docs/` YET — so the re-run's
`docs_snapshot` answers `NoDocs` about the very folder being interviewed
in, and `applyProjectStatus` would have dropped the user on the front
door's "No plan in <folder>" card mid-interview. A criterion meant to
close a silent failure would have opened a loud one. `applyProjectStatus`
now holds the rule `applyDocsPayload` has held since T-026. An interview
needs the live watcher MORE than a board does: the banked chips ARE a
docs-snapshot diff, so a dead subscription is an interview that banks
nothing.

### The four-presses proof, in two halves and how they join

Frontend: four `startDocsWatcher()` calls against a refusing boundary
produce four `emit("startup-failed", …)` calls with attempts `[1,2,3,4]`
and `listenCalls === 4`. Rust: `startup_failed_line` turns four such
payloads into four distinct lines each carrying its attempt number. The
join is the event name and the payload shape, asserted as an exact
literal on the TS side — and the Rust side has no equivalent, which is
filed as **T-063-s2**.

### The sanitise, proved END TO END on a real app

Not only in tests. During the measurement run the temporary probe emitted
a message containing `<script>`, a NUL + BEL + ESC run and 10 000
characters. The real `app.listen` wrote, to the real process's stderr:

    [nputer] startup-failed: recv_at_ms=1787015863821 payload={"attempt":1,
    "message":"TEMPPROBE window_ms=72.0 HOSTILE=<script>\u0000\u0007\u001b[31mAAA…(truncated)

**887 characters, zero raw control bytes, the cap's own marker present.**

**And it corrects the card's mental model.** By the time a payload
reaches the sink it has been through JSON, so the ESC is already six
ASCII characters and `escape_default` finds no raw control byte to
escape. On the live path the **CAP** is what the sanitise adds; the
escaping is defence in depth. That is still worth having — the function
takes a `&str` and nothing in its type says a serializer stands in front
of it — so there is a second cargo test that hands it raw control bytes
directly.

### The DEV gate: re-measured, and one figure was stale

`npm run build` and `npx vite build --mode development` produce a
**sha-IDENTICAL** asset (`index-ByWKsUIt.js`, 488,805 B, sha256
`3aec41b1…`). `NODE_ENV=development npm run build` produces
`index-D2WWdpHl.js` carrying all three harnesses. The card's **696,302 B
is stale — measured today at 764,391 B** (filed as **T-063-s1**), so the
comment states the mechanism and the sha-identical pair and describes the
DEV-flipped bundle qualitatively rather than by a byte count that will
rot again. The ci.yml arm is declined and belongs to **T-054**.

The build-half assertion is `has("import.meta.env") === false`, and its
reach is stated honestly in the test: it catches a build that stopped
FOLDING the flag, and it does NOT catch the NODE_ENV lever — measured, a
DEV-flipped bundle carries `__nputerShellHarness` and still contains zero
`import.meta.env`. That is why the two assertions sit side by side.

### The poison drill, and the gap it found

**32 poisons, 32 RED.** 5 Rust bodies + 26 TS bodies/assertions + 1 late
addition, each restored and proved by sha256 rather than by a clean
`git status`. Implementation poisons were run too, and they discriminate
rather than blanket: removing `sanitize_for_log` reds exactly the two
tests whose subject is the sanitise; discarding the unlisten handle reds
2; removing the pick re-subscribe reds 4; deleting the deadline timer
reds 5; dropping the emit reds 4; removing the genesis guard reds 1.

**One poison came back GREEN and that is the most useful thing the drill
did.** Raising `STARTUP_DEADLINE_MS` to 8 000 000 — which would make the
deadline effectively never fire — left every deadline test passing,
because they all advance the clock BY the constant. *A test parametrised
by a constant cannot pin that constant.* A test now pins the value and
its two bounds, and the same poison reds it.

### Not done, and why

- **No new IPC command and no new grant.** `invoke_handler!` unchanged;
  `acl_pin.rs` byte-identical (whole-file sha256 `8d24cbad706d9e6f…`,
  92 grants) and 0-file diffs across `capabilities/`, `gen/`,
  `Cargo.toml`, `Cargo.lock`, `app/package.json`, `package-lock.json`,
  `.github/`, `lib/`, `method/`, `tauri.conf.json` and `graph.json`.
- **No new dependency**, no lockfile line, no `innerHTML`, no
  `writeTextFile`/`writeFile`/`mkdir` under `app/src` (ADR-017 —
  `startup-screen.test.tsx`'s whole-of-`app/src` sweep re-runs green).
- **No model call, no screen control.** The app opened and closed its own
  window for the boot gate and the measurement, per the @human ruling;
  nothing was clicked, typed into or screenshotted.
- **`graph.json` NOT regenerated** — the integrator's ritual.

### Five suggestions filed

T-063-s1 (stale bundle figure), s2 (the event name is two literals with
no join — the sharpest of the set, because a Rust-side rename passes
every suite), s3 (the subscribe copy overclaims after a refused
re-subscribe), s4 (a value import silently debased 10 of 15 tests — it
happened during this build), s5 (the deadline arms a real 8 s timer
inside a parked test narrative).

## Verdicts
