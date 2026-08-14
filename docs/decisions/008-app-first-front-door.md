# ADR-008: nputer is an app; the CLI is plumbing

Date: 2026-08-14 · Status: accepted · Decided in: planning chat (human directive) · Amends: ADR-007

## Context
ADR-007 framed `npx nputer init` as the front door with the dashboard
grown on top. Human correction: the product's face is a separate,
beautiful app from day 0.

## Decision
- The application is the front door: open nputer → welcome/board →
  "New project" runs the planning interview IN the app: split view,
  planner chat on one side, the story map materializing live on the
  other as answers land.
- Tauri shell from day one (not "later"): same React/Tailwind/shadcn
  frontend, Node daemon as sidecar (file watcher + agent-CLI spawning).
  Real download, icon, window — macOS/Linux/Windows.
- The CLI remains as plumbing and the power-user/CI path; `npx nputer`
  still works headlessly. Terminal-forever stays a capability
  guarantee, no longer the entry story.

## Consequences
Backbone re-centers on the app: shell + read-only board first, in-app
interview second, dispatch third, rooms/daemon fourth. The pure-lens
rule is now the product's sharpest differentiator: beautiful app,
boring files — projects stay plain markdown in git, hand-drivable,
alive if nputer vanishes. Design budget concentrates on the interview
split-view (the demo moment) and the board.
