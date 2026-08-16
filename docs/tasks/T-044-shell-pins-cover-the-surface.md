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
- No new grant, no new command, no new IPC surface, and no change to
  any command's observable payload.

Verification: headless — bare `cargo test` from app/src-tauri/.
@human: none.

## Implementation notes

## Verdicts
