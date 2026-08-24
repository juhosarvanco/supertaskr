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
  - app/src/components/shell/**
  - app/src/components/ui/**
  - app/src/lib/utils.ts
  - app/src/lib/verdicts.ts
  - app/src-tauri/src/lib.rs
  - app/src-tauri/src/main.rs
  - app/src-tauri/src/acl_pin.rs      # T-010 settlement, see below
  - app/src-tauri/src/churn.rs        # T-010 settlement, see below
  - app/src-tauri/src/index_cmd.rs    # T-010 settlement, see below
  - app/src-tauri/build.rs
  - app/src-tauri/tauri.conf.json
  - app/src-tauri/capabilities/**
depends_on: [C-01, C-08, C-10, C-11, C-12]
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

**THE THREE `.rs` FILES ADDED AT T-010, AND WHY THEY ARE CLAIMED RATHER
THAN DECLINED.** This component named its Rust half three files at a
time — `lib.rs`, `main.rs`, `build.rs` — while three more sat beside them
owned by nobody. They were invisible only because the indexer collected
no Rust; T-010 makes them territory, so the registry settles them here
(ADR-004) instead of letting the regen discover an unmapped bucket.
`index_cmd.rs` and `churn.rs` are the shell's own command bodies, the
thing this file already calls "the thin command wrappers" — ARCHITECTURE
names the churn source "C-05's Rust half" in as many words, and
`index_cmd.rs` is the seam T-012 opened onto C-07, so claiming it is what
makes the DECLARED C-05→C-07 dependency observable at all. `acl_pin.rs`
drives real InvokeRequests against `capabilities/**`, a path this
component already claims, so the pin belongs to the surface it pins.
Nothing here is declined: every `.rs` under `app/src-tauri/` is now
claimed by C-05, C-10, C-14 or C-07, and the D2 unmapped bucket stays
gone. The two fixture files T-025 left over — `src/bin/fake_agent.rs` and
`tests/agent_runner.rs` — went to C-14 at the same triage, because a
component's test double belongs to the component it doubles.
