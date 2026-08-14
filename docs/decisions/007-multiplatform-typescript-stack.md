# ADR-007: Multi-platform from day one; TypeScript end to end

Date: 2026-08-14 · Status: accepted · Decided in: planning chat (human directive: beautiful UI day 0; platform decides stack)

## Context
Beautiful story-map UI required from day 0. First user = technical
builder with an agent CLI, on macOS AND Linux AND Windows/WSL.
Open-source launch is the distribution channel. Conductor already owns
(and is punished for) the macOS-native position. Agents build web UI
far more fluently than SwiftUI — and agents are the build team.

## Options considered
Native macOS (SwiftUI): most "app-like", but locks out ⅔ of the launch
audience, occupies a taken position, and puts the build in the agents'
weakest dialect. Electron: cross-platform but heavy. Chosen path below.

## Decision
- One language: TypeScript/Node everywhere. Every target user already
  has Node (Claude Code requires it) → `npx nputer` zero-install
  distribution on all platforms.
- CLI + daemon: Node (commander, chokidar watcher, ws, child_process
  spawning of agent CLIs).
- Dashboard: React + Vite + Tailwind + shadcn/ui, served by the daemon
  at localhost (`nputer ui`). Beauty is a design-language investment,
  not a platform property — target macOS-grade polish on web tech.
- Later app shell: wrap the same frontend in Tauri for a native-feeling
  desktop app on all three platforms; nothing rewritten.

## Consequences
Build order reverses (supersedes the dashboard doc's files→CLI→daemon→
dashboard-last): milestone 1 = parser + watcher + read-only story map,
rendered beautifully, with the CLI growing underneath. The pure-lens
rule is the non-negotiable guardrail: the board renders files and
writes single frontmatter fields only — day-0 beauty must never become
day-0 second source of truth. Interview note: this resolves Q5 (stack)
early; recorded rationale doubles as the interview's stack answer.
