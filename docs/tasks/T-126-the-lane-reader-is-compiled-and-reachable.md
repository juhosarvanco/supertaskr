---
id: T-126
title: The lane reader is built, verified three times, and compiled into nothing — one module declaration and one zero-argument command stand between F-04 and its own data
feature: F-04
milestone: 4
priority: 5
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

Absorbs (ninth triage, 2026-08-25): T-110-s1 — file removed in this
commit.

**MEASURED AT MAIN `e04f5b3`: `git grep -c "mod dispatch" app/src-tauri/src/lib.rs` returns `0`.**
T-110 merged `app/src-tauri/src/dispatch/**` — a lane reader that was
rejected twice, waived once by @human, rebuilt by two fresh executors and
approved on a third verification pass — and **rustc compiles no file that
no module declares.** The whole thing is dead code on main right now.

## Why the fence made this correct, and why it must not stay

T-110's fence was `[app-dispatch]` = C-15. The `mod` line lives in
`app/src-tauri/src/lib.rs`, which is C-05's `app-shell`, and `app-shell`
was held by a live lane at every one of T-110's three dispatches. Its
executors routed this rather than widening — the right call three times
over, and the third verifier ruled the fence argument sound. **The defect
is not the routing; it is that the routing had nowhere to land**, so a
card can be verified to a very high standard and still ship into a void.

**AND IT IS ALREADY MISLEADING SOMEBODY.** `T-111` is in flight as this
is written, deriving a board disposition from the lane set. Its TypeScript
half compiles against `app/src/lib/dispatch-store.ts`, which is real — so
T-111 can be built and pinned and merged **while the data it renders can
never arrive**, because nothing on the Rust side is compiled to produce
it. The board would show a correct-looking empty answer.

## What "not compiled" was measured to mean

T-110's own third pass recorded the sharp version: a planted **type
error** in `lanes.rs` leaves `cargo build` at exit **0**. The suite is
green because the lane's own bodies reach the module through
`app/src-tauri/tests/dispatch_lanes.rs`, a two-line `#[path]` shim that
compiles it as part of a test target. **So the tests prove the code
works and prove nothing about the app containing it.**

## Acceptance criteria

- **`lib.rs` SHALL DECLARE THE MODULE**, so `app/src-tauri/src/dispatch/**`
  is compiled as part of the binary rather than only as part of a test
  target. **A PIN SHALL SHOW THAT IT IS**: a planted type error in
  `dispatch/lanes.rs` SHALL make `cargo build` fail. Today it exits 0,
  which is the whole finding — the assertion that reds must be one that
  is red today.
- **THE READER SHALL BE REACHABLE FROM THE WEBVIEW BY ONE
  ZERO-ARGUMENT `#[tauri::command]`**, registered in `generate_handler!`
  in the same commit. Zero arguments is not a style preference here: it
  is ADR-012's "narrowness lives in the command's own signature", and
  every one of this app's existing commands that takes no caller input
  takes none. **No path, no branch name and no task id crosses the
  boundary inbound.**
- **THE IPC CENSUS SHALL BE DERIVED FROM BOTH ENDS AND INTERSECTED BY
  NAME**, the discipline every command-adding card here has used:
  count line-anchored `#[tauri::command]` attributes, count
  `generate_handler!` entries, sort both name lists and require
  `comm -3` to be EMPTY. State the before and after counts.
- **`acl_pin.rs` SHALL BE A 0-FILE DIFF at its pinned 92-grant hash.**
  An app command is not a webview grant (ADR-012, applied rather than
  reopened) — if the grant set moves, something is wrong with the
  approach rather than with the pin.
- **THE COMMAND SHALL NOT READ THIS REPOSITORY'S OWN `.git` IN ANY
  TEST.** Lanes come and go while a suite runs, so a body asserting
  against the live worktree list is non-deterministic by construction —
  T-110's card says so in as many words and its criteria are the
  precedent. Fixtures in a temp directory.
- IF wiring reveals that the reader's public surface does not fit a
  zero-argument command — for example that it needs the project root the
  shell already holds — THEN say so and route it rather than adding an
  argument to make it fit. **The shell knowing the open project is not
  the webview supplying it.**
- **THE TWO-LINE `#[path]` SHIM SHALL BE ADDRESSED, NOT INHERITED.**
  `app/src-tauri/tests/dispatch_lanes.rs` exists only because the module
  was unreachable; once `lib.rs` declares it, state whether the shim is
  still needed and delete it if it is not. `T-110-s9` records that this
  file is currently the tree's ONLY unmapped file — this repository's
  first D2 finding — so removing it may drain that finding too. Check
  and report either way.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines **and the count derived, not just the exit**), plus
`npm test` from app/ if any payload shape moves. **POISON DRILL on every
new or changed assertion**, one side only, producer mutated and never the
assertion, mutated text read back with `git diff` before its run,
restores proved per-path by sha256, in a detached scratch worktree with
its own `CARGO_TARGET_DIR` inside it, **named for this lane and placed
OUTSIDE the repository** (`T-052-s2`). The BOOT GATE fires on
`app/src-tauri/**` — run it and record the exit and both `[nputer]`
lines; **it is the gate that matters most here**, because the failure
this card fixes is precisely one that every suite passes and only a real
build catches. GRAPH REGEN fires on `*.rs` since `e1f3023`; ask
`index --check` rather than predicting. @human: none.
