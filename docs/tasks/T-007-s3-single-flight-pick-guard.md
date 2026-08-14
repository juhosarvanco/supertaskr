---
title: Rust-side single-flight guard for pick_project_folder
status: suggested
suggested_by: verifier claude-fable-5 @T-007-verify
---

The picker's double-invoke guard lives webview-side only (the store's
`picking` flag, which also disables the buttons — verified). Under
ADR-010's threat model that is the wrong side: a compromised webview
can invoke `pick_project_folder` repeatedly and stack native folder
dialogs on the user. The residual is annoyance-grade by design — no
path ever transits the webview and every dialog needs a human answer
(the task notes acknowledge exactly this residual capability) — but
it is the one webview-triggerable native effect that ships unthrottled.

Suggest a Rust-side single-flight: an `AtomicBool` (or try-lock) in
`WatchState`; a second `pick_project_folder` arriving while one dialog
is open returns immediately with a typed outcome (`Cancelled`, or a
new `Busy` variant if the distinction earns its keep). Shrinks the
residual to one dialog at a time.

Worth folding into the same small change: `apply_picked_folder` holds
the project mutex across the re-arm rendezvous (up to the 10s
REARM_TIMEOUT), so a concurrent `docs_snapshot` pull can block behind
a slow re-arm — serialization, not deadlock (the watcher thread never
takes that lock), but the same guard naturally narrows the window.
Small scope; app/src-tauri only; nothing in the webview changes.
