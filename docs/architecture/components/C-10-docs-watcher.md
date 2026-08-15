---
id: C-10
name: Docs watcher
layer: app
paths:
  - app/src-tauri/src/docs_watch.rs
  - app/src/lib/watcher-store.ts
  - app/src/lib/docs-model.ts
depends_on: [C-06]
decisions: [ADR-002, ADR-014]
status: auto
touch_slugs: [app-shell]
---
The live-update pipeline (T-003): Rust side walks and watches docs/,
ships contained { path, content } snapshots over IPC; TS side applies
them, re-parses through C-06, and keeps last-good models per file. The
map rides this same pipeline (component files are .md under docs/;
graph.json joins via the collector's .json rule, ADR-014).
