# ADR-012: Native surfaces live Rust-side; the webview grant set stays empty

Date: 2026-08-15 · Status: accepted · Decided in: T-007 build +
verification (record in docs/tasks/T-007-open-own-repo.md)

## Context
T-007 needed the app's first native OS surface — a folder-picker
dialog. The documented Tauri v2 path is the plugin's JS API: install
the npm bindings, grant `dialog:allow-open` (or `dialog:default`) in
capabilities, invoke from the webview. ADR-010 demands the narrowest
grant that works but presumes a grant gets added; T-007 had to
decide what "narrowest" means when the surface can be driven
entirely from Rust.

## Options considered
JS bindings + a scoped dialog grant (the upstream default) —
rejected: it hands a compromised webview a real primitive (pop
dialogs, receive user-picked filesystem paths) that nothing
requires. Rust-side invocation with zero new grants — chosen.

## Decision
Native OS surfaces are invoked from Rust behind app-defined
commands; the webview capability set stays exactly `core:default`
and plugin JS bindings are not installed. The narrowest capability
set is often EMPTY: the ACL gates webview→IPC only, so a plugin
registered but never webview-invoked needs no grant — empirical
mechanism (T-007, extending T-003's note): registered PLUGIN
commands are ACL-gated and denied under bare `core:default`, while
app-defined commands are un-gated, so narrowness lives in the app
commands' own signatures (zero-argument where possible; sensitive
values like picked paths never transit the webview).

## Consequences
Future native-surface work (F-03 genesis panes, F-04 dispatch)
starts from "can this live Rust-side?" — a webview-reachable grant
is added only when the webview itself genuinely must call the
plugin, then narrowly per ADR-010, justified in the task file and
swept by its verifier, who treats new plugin JS bindings with the
same suspicion as grants. Costs: each surface needs an app command +
typed outcome instead of a one-line JS call, and async plugin APIs
meet Tauri's command-macro constraints (AppHandle, channel bridges).
Evidence protocol: grants are proven via regenerated
gen/schemas/capabilities.json + a runtime ACL probe, never `strings`
on the binary (grants compile to code; ADR-010's "config or strings"
note holds for the CSP half only — CONVENTIONS gotcha; regression
test proposed in T-007-s2).
