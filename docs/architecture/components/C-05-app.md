---
id: C-05
name: App
layer: app
paths:                    # the shell/umbrella only — panes and plumbing own their files
  - app/index.html
  - app/vite.config.ts
  - app/vitest.config.ts
  - app/test/**
  - app/src/App.tsx
  - app/src/main.tsx
  - app/src/index.css
  - app/src/vite-env.d.ts
  - app/src/components/ui/**
  - app/src/lib/utils.ts
  - app/src-tauri/src/lib.rs
  - app/src-tauri/src/main.rs
  - app/src-tauri/build.rs
  - app/src-tauri/tauri.conf.json
  - app/src-tauri/capabilities/**
depends_on: [C-01, C-08, C-10, C-11]
decisions: [ADR-007, ADR-008, ADR-010, ADR-012]
status: auto
touch_slugs: [app-shell]
---
The front door (ADR-008): Tauri shell + window frame + hardened webview
config, mounting panes over the project's files. Umbrella for the app
package (harness, shared ui primitives); the board pane, detail panel,
watcher plumbing and design tokens are its child components C-08–C-11.
Read-only lens; writes stay single-field frontmatter edits or thread
appends, nothing else.
