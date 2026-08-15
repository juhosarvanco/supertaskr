---
title: AppHandle-taking commands are Wry-monomorphic — genericize to let the ACL pin probe them on MockRuntime
status: suggested
suggested_by: executor claude-fable-5 @T-021
---

`pick_project_folder` and `index_repo` (app/src-tauri/src/lib.rs) take
`tauri::AppHandle` — the Wry-defaulted alias — so
`tauri::generate_handler!` monomorphizes them to the Wry runtime and
they cannot register on the T-021 pin's MockRuntime app
(`CommandArg<'_, MockRuntime>` unsatisfied; the pin registers only the
runtime-generic `docs_snapshot` as its local positive control and
probes the other two from remote origins, where rejection provably
precedes handler lookup).

Declaring them `async fn cmd<R: tauri::Runtime>(app: tauri::AppHandle<R>)`
would let the pin register the REAL full handler set headlessly and add
a local `index_repo` positive control (NoProject path — zero fs work).
`pick_project_folder` still must never be invoked locally in tests (its
handler asks the dialog plugin for a native dialog; headless rule), so
the gain is: production handler registration exercised 1:1 in the pin,
one more executing app-command witness, and the seam ready for any
future AppHandle-taking command. Check that `generate_handler!` accepts
the turbofish (or an inference-friendly call site) before committing to
it; if it fights the macro, a thin non-generic wrapper around a generic
body gets the same testability without touching the macro surface.
