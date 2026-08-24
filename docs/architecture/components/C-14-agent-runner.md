---
id: C-14
name: Agent runner
layer: app
paths:
  - app/src-tauri/src/agent/**
  - app/src-tauri/src/bin/fake_agent.rs   # T-010 settlement, see below
  - app/src-tauri/tests/agent_runner.rs   # T-010 settlement, see below
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

**THE TWO FILES T-025 LEFT UNCLAIMED, SETTLED AT T-010 (ADR-004).**
`src/bin/fake_agent.rs` is the fake CLI this runner is proven against and
`tests/agent_runner.rs` is its integration suite; both were written by
T-025 for this component and belonged to no other. They were invisible
while the indexer collected no Rust, so nothing forced the question —
T-010 collects it, and a component's test double and its suite belong to
the component they exercise, the same rule that puts `app/test/**` under
C-05. Neither is declined. Note what `fake_agent.rs` costs elsewhere and
does not stop being: it is the SECOND `[[bin]]` in the app crate, which
is what made T-040's `default-run` line necessary — a fact about the
manifest (C-05's), not about this claim.
