---
id: C-14
name: Agent runner
layer: app
paths:
  - app/src-tauri/src/agent/**
  - app/src/lib/agent-store.ts
depends_on: [C-10]
decisions: [ADR-003, ADR-012, ADR-017]
status: auto
touch_slugs: [app-agent]
---
The spawn surface (T-025, F-03): the user's OWN agent CLI, started
headless once per interview turn and resumed by its native session id,
with the compiled-in method snapshot materialized into the project's
`.nputer/genesis/kit/` so the CLI reads it inside its own cwd scope.
Fixed argv arrays, never a shell string; the prompt on stdin; `env_clear`
plus an explicit allowlist, so no key or token ever reaches the child
(ADR-003). Four app commands, zero webview grants (ADR-012) — the
adapter table is const data inside the binary that no command returns.
The AGENT writes `docs/`; this component writes only `.nputer/` runtime
files, which sit outside the docs watch root (ADR-017). Its TS half
mirrors the typed outcomes and reduces the one `genesis-turn` event
channel; T-027 renders it.
