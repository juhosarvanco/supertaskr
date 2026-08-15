---
id: T-025
title: Agent runner — spawn/resume headless planner turns, Rust-side, zero grants
feature: F-03
milestone: 3
priority: 4
size: L
status: planned
blocked_by: [T-023]
touches: [app-agent, app-shell, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

Size L: planning pass required before dispatch (process topology:
per-turn resume vs long-lived piped process — decide against the
installed claude CLI's verified flags; fake-CLI fixture packaging
portable to Windows; delta-vs-turn streaming granularity). The
milestone's hard core and F-04's future substrate. Implements
ADR-017: the user's own agent CLI, spawned headless with the T-023
kit, the AGENT writing docs/ under its own project-scoped
permissions; the app writes only .nputer/ runtime files. ADR-012
pattern throughout: std::process (argv arrays, never a shell string),
no tauri-plugin-shell, no plugin JS bindings, webview grant set stays
exactly core:default. Declares component C-14-agent-runner (paths
app/src-tauri/src/agent/** + app/src/lib/agent-store.ts, touch slug
app-agent) in-branch. lib.rs command registration is the app-shell
touch — serialize with T-026 at dispatch.

## Acceptance criteria
- THE runner SHALL expose app-defined commands with typed outcomes
  (PickOutcome precedent): genesis_start() — zero-argument; kickoff
  prompt assembled Rust-side from the bundled method snapshot (a
  build-time Tauri resource carrying the method version stamp) plus
  the open project from WatchState, never from the webview;
  genesis_send_turn(text) — the user's own typed answer, the only
  webview-supplied datum, passed as data (stdin or one argv element
  per the adapter template), never interpolated into a shell line;
  genesis_status(); genesis_cancel() — kills the child process
  group; child processes SHALL not outlive the app.
- THE adapter SHALL be a declarative Rust-side table with exactly one
  v1 entry (claude: binary name, spawn/resume argv templates, output
  parse mode, permission flags scoped to the project dir + read-only
  access to the bundled method snapshot; never a bypass-permissions
  flag) — adding an agent is one entry (ADR-003), and the table is
  unreachable from the webview.
- WHEN a turn runs THE runner SHALL emit turn lifecycle events to the
  webview (docs-changed event precedent): started, progress (content
  visible within the planning pass's stated latency bound — no dead
  air), completed with the turn text, or failed with a typed error;
  the CLI's native session id SHALL be captured from the stream and
  recorded in .nputer/sessions.json per
  method/runtime/sessions-schema.md (roles: ["planner"], turns
  incremented), and each exchanged turn appended to
  .nputer/genesis/transcript.jsonl — both runtime files, losable by
  charter, and .nputer/ SHALL remain outside the docs watch root
  (no snapshot spam; asserted in tests).
- THE binary resolution SHALL handle GUI-launch PATH poverty: resolve
  via a login-shell probe once, cache in app config, surface
  not-found as a typed outcome (T-029 renders it as the hand-driven
  fallback, never a dead end).
- THE full cargo suite SHALL drive the runner against a fake agent
  CLI fixture (canned stream output; no real model in any suite):
  spawn/turn/resume round trip, session id capture, transcript
  append, kill-on-cancel (no orphan process), malformed stream
  handling; one env-gated #[ignore] smoke MAY drive a real local CLI.
- IF the spawned CLI exits nonzero, emits unparseable output, or
  stalls past a timeout THEN the runner SHALL emit a typed failure
  for that turn, leave the project untouched, keep the session
  resumable, and never panic.
- IF the webview attempts anything beyond the four commands THEN the
  surface is unchanged: capabilities zero-diff proven per the T-007-s2
  protocol (regenerated gen/schemas/capabilities.json + runtime ACL
  probe; strings proves nothing — CONVENTIONS gotcha). Adapter flag
  changes are swept by the verifier with grant-level suspicion.

Verification: headless — cargo suites vs the fake CLI, ACL proof,
env-hygiene assertion on the spawned child (deliberate inherited env,
explicit PATH augmentation). @human: one real-CLI local smoke run
observed before the milestone closer.

## Implementation notes

## Verdicts
