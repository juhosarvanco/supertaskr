---
title: Pin the webview ACL surface with a permanent regression test
status: suggested
suggested_by: verifier claude-fable-5 @T-007-verify
---

T-007's verification proved the zero-webview-surface claim headlessly,
but the proof lives in throwaway verifier probes: capability drift (a
future task granting `dialog:default` "temporarily", a plugin added
without its sweep) is currently caught only by human diff review of
capabilities/ and task notes. The machinery to pin it permanently is
all public tauri API, demonstrated working during this verification:
`tauri::test::mock_context` + `Context::runtime_authority_mut`, an
authority built from the SHIPPED artifacts through tauri's own
resolver (`tauri::utils::acl::resolved::Resolved::resolve` over
gen/schemas/acl-manifests.json + capabilities/default.json — the same
routine tauri-build runs), and `tauri::test::get_ipc_response` firing
real InvokeRequests at a MockRuntime webview with the real plugins
registered. (`tauri = { features = ["test"] }` as a dev-dependency;
note `generate_context!()` cannot expand twice per binary on macOS —
the Info.plist embed symbol — hence the authority-transplant route.
Commands taking the Wry-bound `AppHandle` alias don't register on the
MockRuntime; runtime-generic State-injected commands do.)

Suggest a permanent cargo test asserting, from the local origin:
every `plugin:dialog|*` command denied, `plugin:fs|*` and
`plugin:opener|*` unreachable, one core:default command
(`plugin:event|listen`) resolvable as the positive control, and remote
origins reaching nothing (the capability is local-only). Fails the
moment anyone widens the grant set without meaning to.

Record the paired learning (CONVENTIONS-gotcha material, integrator's
call): capability grants are NOT findable via `strings` on the binary
— even the granted `core:default` is absent, because tauri 2.11 embeds
the resolved ACL as code, not identifier strings; only the config JSON
(hence the CSP) is string-findable. ADR-010's "check the config or
`strings` on the binary" note therefore holds for the CSP half only;
for capabilities, check gen/schemas/capabilities.json or probe the
authority. Pairs with the executor's flagged note that registered
PLUGIN commands are ACL-gated while app-defined commands are not.
