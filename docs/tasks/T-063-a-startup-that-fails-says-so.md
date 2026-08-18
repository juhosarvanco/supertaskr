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
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
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

2026-08-18 — claude-opus-5 @fresh (verifier, same-model as builder): **APPROVED**

Range **derived, not quoted**: `git merge-base HEAD main` =
`2fc3475294a231fcbc517825b8a4f37024caba39`, so `2fc3475..HEAD` = three
commits `a2f3a94`, `a967079`, `3e2318c` — **12 files, 1590+/45−**, none
of them missed. Worktree `nputer-T-063`. Scratch ports **17641** (lane),
**17642** (boot gate) and **17643** (the real-app probe run), all three
bind-probed free on `::1` AND `127.0.0.1` before use and all three
released afterwards. **1420 was never bound, connected to or signalled** —
read-only `lsof` before and after shows exactly the human's one listener
(node pid 82549, `[::1]:1420`). No model calls, no screen control. Every
poison restored and proved by **sha256**, never by a clean `git status`.

### Criterion by criterion, and how

| # | criterion | verdict | how I checked it |
|---|---|---|---|
| 1 | the store HOLDS the unlisten handle | **holds** | `unlistenDocs` is assigned from `await listen(...)` and torn down before replacement. Poison: replace `unlistenDocs?.(); unlistenDocs = unlisten;` with a comment → **2 RED**, exactly the executor's figure, and both are COUNTS (`ipc.unlistened` order, `ipc.liveSubscriptions`), never outcomes. I re-read all three tests in that describe: the discriminator in each is a count; the `phase` / `startupFailure` lines are sanity, not the claim. A stacked subscription really is invisible otherwise — the mock's own `subscribe()` proves it, and the poison run showed `liveSubscriptions === 2` with identical shell state. |
| 2 | a pick after a refused SUBSCRIBE re-runs startup, interleaving pinned | **holds** | Poison: delete the `before.startupFailure?.step === "subscribe" && ...` block → **4 RED**. Both directions of the seq race exercised (stale pull dropped by identity with one echo; newer pull applies with two). **One of the five in that family does NOT discriminate — filed as T-063-s7**, see below; its sibling does, so the criterion is covered. |
| 2b | THE HAZARD THE CARD DID NOT MENTION (genesis) | **holds, and the fix is load-bearing** | Driven exactly as asked: refuse the subscribe, then `pickGenesisFolder` with Rust answering `noDocs` about the interview's own folder. The user stays on `screen: "genesis"`, `genesisDir` intact, `listenCalls === 2`, `liveSubscriptions === 1`. Poison: delete `if (shell.phase === "genesis" && status.kind !== "open") return;` → **1 RED**, and the un-guarded run drops the user on the front door precisely as the notes say. The guard is not a wall: an `open` status still applies (`docs.seq` 11, tasks parsed) because `applyDocsPayload` keeps the phase (T-026). Verified it cannot regress startup: `applyProjectStatus` is only reachable from `runHandshake` and the harness, and the phase at startup is `loading`, never `genesis`. Also verified the failure is cleared BEFORE the swallowed status, so nobody is left in an interview under a stale failure. |
| 3 | a HANG is distinguishable from a REJECTION | **holds** | `deadline` is a third `StartupStep`, reaches the screen with its own heading and copy, and reaches the log. Poison: delete the timer → **5 RED**. The pre-deadline state is pinned as what @human saw (same promise back, `listenCalls` stays 1). |
| 4 | N MEASURED, not guessed | **holds — and I could not break it from either end** | **Too short:** I built the collector's own worst legitimate case and measured it. `docs_watch.rs` caps at `MAX_FILES = 2_000` and `MAX_FILE_BYTES = 1 MiB`, so the largest tree the collector will admit is 2 GiB. Built exactly that (2 000 files x 1 MiB) and walked+read it with a proxy using the same `std` calls as `collect_docs_tree` (`read_dir` + `symlink_metadata` + `canonicalize` + `read_to_string`): **cold 228 ms** (page cache evicted with 26 GiB of writes on a 24 GiB machine), warm 165–733 ms. A 2 000 x 50 KiB tree: **42 ms**. This repo's real tree: **4.3–19.7 ms**. So at the collector's HARD cap the Rust half is ~35x under 8 s — I could not construct a legitimate tree that exceeds the deadline. **Too long:** 8 s of the unchanged waiting copy is a real cost and is the one thing this card does not improve; the card's fallback ("say how long it has been waiting") was owed only IF N could not be defended, and it can. One structural property worth recording that makes the figure safer than it looks: a long SYNCHRONOUS parse can never trip the deadline, because `applyProjectStatus` blocks the loop and `.finally(settle)` is a microtask that drains before the `setTimeout` macrotask — so only the genuinely async boundary call is timed. |
| 4b | **THE POISON THAT CAME BACK GREEN** | **fix verified, and the sweep is clean** | Reproduced the executor's finding exactly: `STARTUP_DEADLINE_MS = 8_000_000` reds **exactly one** test — the new pin, `expected 8000000 to be 8000` — and leaves **53 passing**, including every other deadline test and the whole of `startup-screen.test.tsx`. So the generalisation is right and the new test is the only thing standing between the constant and a silent 8 000-second deadline. **Swept the rest of the diff for the same shape**: the two remaining parametrised assertions are the deadline MESSAGE (`...within ${N} ms`) and the deadline COPY (`Math.round(N / 1000)` seconds) — both parametrised, both stated as such in their own comments, and both covered by the pin. The pin's bounds are literals (`> 778 * 2`, `<= 30_000`), the Rust line-builder tests hard-code their own payloads, the bundle needle is a literal, and the `MAX_ECHO_LOG_CHARS` guard is an absolute `< 1_000` rather than a re-derivation of the constant. No second instance found. |
| 5 | a raced-out attempt leaks no second subscription, and self-heals | **holds** | Poison run showed the ghost path is real: after the deadline, attempt 1's parked subscribe is released and tears down ITS OWN subscription (`unlistened === [1]`, `liveSubscriptions === 1`, no shell write). **And the self-heal is genuine**: the "nobody behind it" case brings the app to `screen: "board"` with `startupFailure` retracted — this is what makes a false positive cheap, and both tests red when the timer is removed. I also walked the token algebra by hand for four interleavings (deadline-then-heal, deadline-then-retry-then-late-answer, retry-during-flight, late rejection after supersession); `startupToken` gates every post-await write and no path can unlatch a newer attempt. |
| 6 | THE FAILURE REACHES THE LOG, sanitised | **holds — proved on a real app, not only in a unit test** | Ran the real thing: temporary probe emitting four `startup-failed` payloads through the shipped `emit`, `npm run tauri dev` on 17643, captured the real process's streams. **Four lines arrived on stderr**, each `[nputer] startup-failed: recv_at_ms=<13 digits> payload=...`. The hostile one (NUL + BEL + ESC + 10 000 chars): **zero raw control bytes**, the ESC legible as its six-ASCII JSON escape, the truncation marker present, one line. Probe removed; `watcher-store.ts` back to sha256 `f1936907ec9a6dfb...`, `git status` clean. **BOTH HALVES of the sanitise correction verified**: on the live path JSON has already escaped the control bytes so the CAP is what the sanitise adds — poisoning `sanitize_for_log` out of `startup_failed_line` reds **exactly 2** cargo tests, the two whose subject is the sanitise, and one of them is the raw-bytes test that has no serializer in front of it. Sinks confirmed at the source: `eprintln!` here, `println!` for `model-updated`. |
| 7 | four presses, four log lines | **holds — and the join is now demonstrated, though still not mechanised** | Frontend half: four presses give `[1,2,3,4]` and `listenCalls === 4`; poisoning the emit out reds **4**. Rust half: four payloads give four distinct numbered lines. **I closed the join myself on the real wire**: four emits crossed the real bus and produced four distinct real stderr lines carrying attempts 1, 2, 3, 4. So it is proven end to end BY THIS VERIFICATION — but by nothing in the repo, which is exactly T-063-s2 and is why that filing matters (see below). |
| 8 | the DEV-gate mechanism written down | **holds, mechanism re-measured on THIS tree** | `npm run build` and `npx vite build --mode development` produce a **sha-IDENTICAL** asset: `index-B8WhFkef.js`, 489 667 B, sha256 `0e6365e57cb77039cd836ca818299f8e4dcc5e8c36478c1e65dad3c7fbb4cae7`, both with zero harnesses. `NODE_ENV=development npm run build` produces `index-BGb0qqkt.js`, **765 255 B**, sha256 `c38cd3ef5d9fa5f7c2fe4198df6117d81886b668173b267be67cd1a73fdd0d1c`, carrying `__nputerShellHarness`, `__nputerDocsHarness`, `__nputerInterviewHarness` and the DEV block's own console line. The card's **696 302 B is stale** and the executor was right to file it rather than copy it (T-063-s1) — my figure is 765 255 B against s1's 764 391 B at `2fc3475`, the +864 B being T-063's own code, which is itself the argument for describing that bundle qualitatively. |
| 9 | the build-half test pins the MECHANISM | **holds, and its honest limit is true** | `has("import.meta.env") === false` on the shipped bundle. **And the note that it does NOT catch the NODE_ENV lever is measured, not assumed**: the DEV-flipped bundle above carries all three harnesses and contains **zero** occurrences of `import.meta.env` — the flag was folded to `true` rather than left unfolded. The two assertions genuinely cover different failures. ci.yml correctly untouched (0-file diff on `.github/`), declined to T-054. |

### T-063-s4, the debasement — repaired, and I re-broke it to prove it

The repair is the right one: `import type { StartupFailure }` (erased,
loads nothing) at the top, and the VALUE (`STARTUP_DEADLINE_MS`) taken
from a dynamic `await import` at line 94, **after** the
`__TAURI_INTERNALS__` assignment at line 92. Re-introducing a genuinely
used top-level value import reds **9 of 15** with s4's exact signatures
(`expected 'browser' to be 'loading'`), so the file still discriminates
and really is running under the Tauri runtime. **Swept every test in
`app/test/` that flips `__TAURI_INTERNALS__` — eleven files — for the
same shape: none carries a top-level value import of the store or App.**
Two corrections to the record are filed as **T-063-s6**: the in-file
comment says "10 of these 23 tests" where the file has 15 and today's
poison reds 9, and an UNUSED value import is elided by TypeScript and is
harmless, so the hazard requires the value to be genuinely used.

### T-063-s2 — I reproduced it, and it is out of this card's fence

Renaming the RUST side of the event constant to a typo: `cargo test`
**304 passed / 0 failed / 3 ignored, exit 0, zero warnings**, and the app
suite **39/39** on the file that owns the channel. **Nothing anywhere
sees it**, and the defect this card exists to close silently reopens.
Renaming the TS side instead reds **4** — the asymmetry s2 describes is
exact. Ruling, and I have tried to be fair: the card's criterion 6 asks
for an event, a listener and a sanitised `eprintln!`, and asks for no
name pin; the TS-side literal assertion is already more than was asked;
and the same hand-mirrored-constant shape is open on `model-updated`,
`docs-changed` and `genesis-turn`, so closing one channel could buy false
confidence. **Correctly filed, not a rejection.** I record only that s2's
own closer (a) is four lines and would have closed the NEW channel, and
that my reproduction should raise its priority rather than leave it as a
theoretical hole.

### Suites, first-hand, exit codes unpiped

lib/parser **225/225 (11 files)**, `PARSER_EXIT=0`; `typecheck` exit 0 ·
app `npx tsc --noEmit` exit 0 · app `npm run build` `BUILD_EXIT=0` · app
`npm test` **794/794 (41 files)**, `TEST_EXIT=0` (touched files:
`startup-recovery` 39, `startup-screen` 15, `shell-harness` 8) ·
`cargo test` **304 passed + 3 ignored, 0 failed**, exit 0, **zero
warnings**, 15 test binaries counted from `test result:` lines, and the
warning-free build is on a genuine recompile (the poison runs changed
`lib.rs` and rebuilt it); `nputer_lib` unit tests **113** = 108 + the
five this card adds · tools/e2e `typecheck` exit 0 · tools/e2e
`NPUTER_E2E_PORT=17641 npm test` **70 passed (18.8 s)**, exit 0, no
skips, no retries · `lint:tokens` **clean (114 files scanned under
app/src, app/test, tools/e2e)**, exit 0 · `lint:tokens -- --selftest`
**49 samples green, 14 walk-policy checks green**, exit 0.

**BOOT GATE re-fired on a different scratch port (17642):**

    [boot-check] port 17642 free - spawning `npm run tauri dev -- --config ...`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-063
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

One incidental confirmation worth recording: after restoring a poisoned
file with `cp`, the app suite went **1 failed / 793 passed** — the
staleness guard in `shell-harness.test.ts` firing on the bumped mtime
while the CONTENT sha was identical. Rebuilt and re-ran: **794/794,
exit 0**. The guard works.

### Security sweep

**No new IPC command and no new grant, verified rather than asserted.**
`generate_handler!` extracted from base and HEAD and compared — byte
identical, nine commands, unmoved. `acl_pin.rs` whole-file sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
base AND HEAD (the same digest T-051's verifier recorded), **92 grant
entries** counted from the array itself. **0-file diffs** across
`capabilities/`, `gen/`, `Cargo.toml`, `Cargo.lock`, `app/package.json`,
`app/package-lock.json`, `.github/`, `lib/`, `method/`, `tools/`,
`tauri.conf.json`, `graph.json`. **Zero dependency or lockfile lines**
(`git diff` over all four manifests: 0 lines). ADR-017: no
`writeTextFile` / `writeFile` / `mkdir` anywhere under `app/src`. No
`innerHTML` / `outerHTML` / `dangerouslySetInnerHTML` /
`insertAdjacentHTML` / `document.write` under `app/src`. Tokens-only
Tailwind (lint clean at 114 files, zero allowlist). `file(1)` on all 12
changed files: **Unicode text, UTF-8** every one, no binaries. C0 scan
(excluding TAB/LF) over all 12: **zero raw control bytes**; zero CR.
`git grep` used wherever a result mattered.

### Poison drill, re-run independently

**8 implementation poisons, each restored and sha256-verified.** They
discriminate rather than blanket, and every count the executor published
reproduced: deadline constant x1000 → **1** (the pin only); genesis guard
→ **1**; unlisten handle → **2**; pick re-subscribe → **4**; deadline
timer → **5**; emit → **4**; `sanitize_for_log` → **exactly 2** cargo
tests; TS event rename → **4**. The ninth, the Rust event rename, is the
one that reds **nothing** — which is the finding, not a miss.

### For @human, not for me

The deadline COPY is explicitly the human's call and I have not judged it
— the screen now says the watcher **"did not answer within 8 seconds. It
has not been refused — it may still answer, and the app will come up if
it does"**, under the heading **"startup timed out · attempt N"**, and
the three ways out are unchanged. Two things belong on the same morning
list: **T-063-s3** (after a refused re-subscribe the subscribe copy's
second clause is false while a live watcher is attached) is a copy
decision in the same family, and the FIRST 8 SECONDS are unchanged —
until the deadline fires the user sees exactly the sentence from the
2026-08-16 screenshot. That is inside the card's fence (the "say how long
it has been waiting" intermediate was owed only if N could not be
defended, and N was defended), but it is the part of the report the
deadline does not answer.

### Findings filed

**T-063-s6** — two quoted figures in this build do not reproduce: the
end-to-end log line is **870 characters / 872 bytes**, not 887 (58 prefix
+ 800 `MAX_ECHO_LOG_CHARS` + 12 marker, content-independent once the cap
fires, so 887 cannot be produced by this code at all), and the comment at
`startup-screen.test.tsx:13` says "10 of these 23 tests" where the file
has 15 and the poison reds 9. Every QUALITATIVE claim in both places
reproduced exactly. **T-063-s7** — "the re-subscribe does not FIGHT the
pick's own snapshot" stays GREEN when the re-subscribe is deleted, while
its four siblings red; the shipped behaviour is right and the sibling
discriminates, but the test cannot see the interleaving it is named for.
One line closes it.

`status: building` left for the integrator (the `9d30d0e` ruling exempts
cards already in flight); `graph.json` correctly not regenerated.
