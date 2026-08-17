---
id: T-044
title: Shell pins cover the surface they claim
feature: F-02
milestone: 4
priority: 22
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

Absorbs: T-021-s2, T-021-s3. Triage 2026-08-16: two pins that step
over the path they exist to guard, in the two files T-021 owns
(src/lib.rs, src/docs_watch.rs, with the pin in src/acl_pin.rs).

Also absorbs: T-014-s4, T-014-s7 (triage 2026-08-17) — two MORE pins
that step over the path they exist to guard, in the same two files,
found by T-014's executor and verifier. Their suggestion files are
removed in the same commit as this line. T-014-s7 is one of the six
assertions-that-cannot-fail caught in a single night; its siblings in
the app's TypeScript suites went to T-057, and this one comes here
because its fix belongs in `docs_watch.rs`, which is this card's
fence.
T-021-s2 is BIGGER than filed — it names two AppHandle-taking commands
and there are now FOUR (`pick_project_folder`, `pick_genesis_folder`,
`start_genesis_here`, `index_repo`), because T-026 added two. Sized M
rather than S deliberately: the ACL pin is the repo's most
load-bearing test and no task may weaken it accidentally.

## Acceptance criteria
- THE AppHandle-taking app commands SHALL be runtime-generic
  (`AppHandle<R>`, `R: tauri::Runtime`) so `generate_handler!` stops
  monomorphizing them to Wry and the ACL pin can register the REAL
  shipped handler set on its MockRuntime app instead of only the
  runtime-generic `docs_snapshot`. IF the macro fights the generic
  THEN a thin non-generic wrapper around a generic body SHALL be used
  and the choice recorded in notes — the goal is the pin's coverage,
  not a particular signature.
- THE ACL pin SHALL gain a LOCAL positive control for `index_repo`
  (its NoProject path — zero filesystem work) beside the existing
  `docs_snapshot` control, and SHALL keep probing every command from
  the remote origin. `pick_project_folder` and `pick_genesis_folder`
  SHALL NEVER be invoked locally in any test: their handlers ask the
  dialog plugin for a native dialog, and the headless rule is
  absolute.
- THE 92-grant `EXPECTED_GRANTS` set SHALL be BYTE-UNCHANGED by this
  task and all four existing acl_pin assertions (capability source,
  runtime denials, authority cross-check, grant diff) SHALL stay
  green — this widens what the pin REGISTERS, never what the app
  GRANTS (ADR-012). The pre/post grant diff SHALL be recorded in
  notes as proof, not asserted in prose.
- THE picker latch's panic path SHALL be pinned by a SHIPPED test:
  `begin_pick`, a `catch_unwind` around a panicking holder, then
  `begin_pick` succeeds again. Today it releases by construction
  (`PickInFlight`'s `Drop`, docs_watch.rs:246-248) and no shipped test
  drives it — the three concurrency tests are all non-panicking — so
  replacing the RAII guard with manual stores would silently regress
  a picker into answering `busy` until restart (T-021-s3).
- THE DEBOUNCE EQUALITY SHALL BE A COMPARISON, NOT A RESTATEMENT.
  `crates/nputer-index/src/watch.rs:207-212`'s
  `the_debounce_window_matches_the_app_watchers` asserts the crate's
  own constant against a literal 250 ms and never reads
  `docs_watch`'s — while its comment says "this is a real pin and not
  a restatement". Reproduced: changing `docs_watch.rs:48` to 300 ms
  leaves the whole workspace suite at `296 passed; 0 failed;
  3 ignored`, exit 0. The crate cannot see `docs_watch`, but the app
  crate DEPENDS on `nputer-index`, so a test in
  `app/src-tauri/src/docs_watch.rs` comparing the two constants
  compiles into a real pin that reds naming both. **The misleading
  comment in `watch.rs` SHALL be deleted in the same commit** — a
  test that says it pins something it does not is worse than no test,
  because the next reader of T-014's criterion 4 will believe it
  (T-014-s7).
- `default-run` SHALL BE PINNED BY SOMETHING `cargo test` RUNS.
  `cargo run` from `app/src-tauri/` — which is what `tauri dev`
  shells out to — now chooses among THREE binaries across TWO
  default-member packages (`nputer`, `fake_agent`, `nputer-index`),
  so the one line T-040 added for a two-binary problem is
  load-bearing for a three-binary one, and the ONLY thing that
  notices its loss is the boot gate: a CONVENTIONS ritual outside the
  fast loop. One assertion in the app crate's own suite reading
  `app/src-tauri/Cargo.toml` and requiring `default-run = "nputer"`,
  with the failure message naming T-040. A manifest read — no build,
  no spawn. The sharper worry belongs in that message: a FOURTH
  binary, or a rename of the `nputer` bin, breaks this in a way whose
  only symptom is that the app stops launching, invisible to
  `cargo test`, `cargo build` and three full suites (T-014-s4).
- No new grant, no new command, no new IPC surface, and no change to
  any command's observable payload.

Verification: headless — bare `cargo test` from app/src-tauri/.
@human: none.

## Implementation notes

## Verdicts
