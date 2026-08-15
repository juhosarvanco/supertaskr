# ADR-017: Genesis runs as spawned headless planner turns; the agent is the writer; the app stays a lens

Date: 2026-08-16 · Status: accepted · Decided in: F-03 decomposition
review — human-verified three-condition approval (app-first, ADR-003
literal, ADR-006 evidence-first)

## Context
F-03 requires the app to drive a planner conversation. ADR-003
forbids calling model APIs; dashboard.md's pure-lens rule limits app
writes to single-field frontmatter edits or thread appends, but
genesis generates docs/ wholesale. ADR-008's daemon-sidecar line
("Node daemon as sidecar: file watcher + agent-CLI spawning") was
already half-superseded in practice when T-003 built the watcher
Rust-side.

## Options considered
Spawned-agent-only (delays the demonstrable slice and makes plumbing
load-bearing for the concept demo); hand-driven-only (fails ADR-008's
"interview IN the app" and never touches the riskiest surface F-04
needs anyway); chosen: staged inside one milestone — hand-driven
first slice as the permanent fallback mode, spawned core after.

## Decision
(1) The interview runs as the user's own installed agent CLI,
spawned/resumed headless by the app turn-by-turn with the planner kit
as its prompt (ADR-003 kept literally: spawn and resume, never API
calls, never keys). (2) The spawn surface lives Rust-side behind
app-defined zero-and-minimal-argument commands (ADR-012 pattern); the
webview capability set stays exactly `core:default`; no shell plugin,
no plugin JS bindings; the adapter table (binary, argv templates,
output format, permission flags) is Rust-side data the webview never
sees or supplies. (3) The spawned agent is the writer of docs/ — with
its own session, tools, and adapter-scoped permissions confined to
the project directory. The app writes nothing under docs/ during
genesis; the split view's right pane renders what lands on disk via
the existing watcher, so the app remains a pure lens and a
mid-interview kill loses nothing (the docs written so far ARE the
record; succession rule). (4) App-side writes are confined to
`.nputer/` runtime files per method/runtime/sessions-schema.md's
charter (session registry entry with the CLI's native session id for
resume; a losable transcript cache) — runtime state, never project
truth. (5) Hand-driven genesis — the human runs the planner in their
own terminal while the app renders — is a first-class mode and the
universal fallback. (6) v1 adapter set: claude-code headless, one
declarative entry; new agent support = one adapter entry (ADR-003's
promise, now a concrete table). (7) No Node daemon is born; C-04
remains F-05's decision.

## Consequences
C-02/C-04 are not forced early. ARCHITECTURE.md's interfaces line
gains: "Genesis: the spawned planner session is the writer; the app
renders what lands (ADR-017); app-side writes confined to .nputer/
runtime files." CI never invokes real models — runner and pane tests
run against a fake-CLI fixture emitting canned stream output; one
env-gated ignored test may exercise a real local CLI. Spawned-agent
permission flags are a security surface the verifier sweeps like
grants.
