# ADR-010: Webview hardening baseline

Date: 2026-08-14 · Status: accepted · Decided in: T-001 verification
(REJECTED verdict + fix; record in docs/tasks/T-001-app-shell.md)

## Context
The app's webview is the surface T-003/T-004/T-007 will fill with
content read from arbitrary repos. The Tauri scaffold shipped
`"csp": null` and a stock `opener:default` capability grant
(open-any-URL, reveal-any-path) that nothing called; a competent
builder kept both — the null CSP unexamined, the grant justified as
"needed later". The security sweep rejected both: unexamined defaults
are how a webview compromise gets free primitives.

## Options considered
Keep scaffold defaults until something breaks — rejected: the
cheapest moment to harden is before content flows. CSP with
`style-src 'unsafe-inline'` (the common Tauri compromise) — rejected:
empirically unneeded here (built CSS is one linked file; React writes
styles via CSSOM, which CSP does not gate; zero violations under full
interaction). Strict baseline — chosen.

## Decision
The webview ships `default-src 'self'; script-src 'self'; style-src
'self'; connect-src ipc: http://ipc.localhost` (no `'unsafe-inline'`
anywhere; connect-src admits only Tauri's IPC pseudo-origins, needed
on Linux/Windows) and capabilities carry exactly `core:default` —
zero plugins, zero extra grants. Any future permission or CSP
loosening is added narrowly, by the task that needs it, justified in
that task's file and swept by its verifier.

## Consequences
T-003 (watcher IPC), T-004 (story map), T-007 render untrusted repo
content inside a webview that can't run inline script/style, reach
the network, or invoke anything beyond core introspection — a
compromise starts with no primitives. Tasks adding capability grants
must name the narrowest permission (e.g. `allow-open-path` with a
scope, never `opener:default`). Note for verifiers: Tauri v2 applies
the CSP at serve time; it never appears in dist/index.html
(CONVENTIONS gotcha) — check the config or `strings` on the binary.
