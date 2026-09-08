# 13 — Surfaces

Where a person meets nputer. Since ADR-021 (2026-09-03) and its
addendum (2026-09-08) the shape is: the architect conversation lives in
the user's agent app (Claude Code or Codex), nputer ships the seat's
hand work as a skill, a CLI underneath it, and a desktop app that
mirrors the files beside the chat. The app keeps its interview and
spawns nothing.

## The agent apps

The user runs Claude Code or the ChatGPT app's Codex; the skill is
installed into that app and invoked as a slash command; the
conversation, the model choice, the permission prompts and the billing
are the vendor's. nputer never spawns a session of its own from the
app (ADR-021), and it passes no `--model` anywhere (ADR-003). What it
ships for that chair:

- **The seat skill** (planned: T-241, p1) — the architect's hand work
  as a slash command: the cold-start read, the dispatch view, cut a
  lane, spawn the builder and the blind verifier, fold the verdict,
  merge, push. T-239's one-command arm underneath, so the same seat can
  be held by a human at a prompt or by a skill. Folded in: the quick
  path below the loop (one line files a size-S card with a light review
  mode and lands with a verdict; guard-class cards refused), intent
  triggering (the skill fires on the user's intent, not only on its
  name), and the honest fallback sentence (what the skill cannot do in
  this harness, said in the transcript).
- **The interview skill** (planned: T-242, p1) — the genesis interview
  as a slash command over the same prompt and file contract the app's
  genesis screen uses; the mirror opened beside it at the start
  (T-243, the app opens on a folder from outside).
- **Codex's skill form, measured** (T-246, done) — how a skill is
  installed and invoked in Codex and its CLI, captured before any Codex
  claim: skills are repo-shippable for both vendors; an MCP server is
  user-level on Codex. The two-harness stance is folded into T-244.

## The CLI

Today the CLI is the scripts under tools/e2e/scripts/ and the Rust
indexer, run from the repo root or their package directories: the
dispatch view, the brief, the preflight, the fence writer, the seat
lock, the arm, the docs gate, the gate runner, the health reporter,
the census generator, `index`, `arch`, `arch drift`, `arch cycles`,
`arch blast`. `npx nputer` (planned: T-244, size L, p1) packages them
as one command a skill can call from any project, with `undo <card>`
(safe undo with a dependency check) and the two-harness install. The
CLI is the plumbing and the power and CI path (ADR-008).

## The mirror app

A Tauri desktop app (C-05, ADR-008, ADR-010's hardened webview,
ADR-012's native surfaces on the Rust side). A read-only lens over the
project's files: its writes are single-field frontmatter stamps or
thread appends, nothing else, and it spawns no seats.

- **The board pane** (C-08, C-17, C-18) — the story map rendered from
  the cards: feature columns, the milestone slice line, priority order,
  suggestions as dashed ghosts, provenance marks (ADR-016: two marks,
  what was meant and what ran). Lanes are read off git, so a card
  reading `planned` beside a live worktree shows the worktree.
  Dispositions carry their reasons.
- **The detail panel** (C-09) — one card in full, with its verdicts and
  notes; keyboard activation and accelerators
  (docs/CAPABILITIES.md § accelerators, § keyboard-activation).
- **The map pane** (C-12) — the architecture map from the committed
  graph and the component registry: intent over reality, drift, cycles,
  blast radius, churn, the graph budget with its measured reason
  (ADR-013, ADR-014); the tasks lens over the same map.
- **The genesis pane** (C-13) — the split-view interview with a
  spawned planner (ADR-017) and the watcher-driven chips.
- **The docs watcher** (C-10) — the file watcher over docs/ at a 250 ms
  debounce that makes every pane a function of the files.
- **The dispatch view in-app** (C-15) — the derived dispatch order as a
  read; the app spawns nothing.
- **The agent runner** (C-14) — the Rust-side process runner the
  genesis pane uses for its planner, with a fake agent fixture for
  tests.
- **The launcher** (T-164, done) — one command launches the human's app
  worktree fresh, so the human's live app never shares a checkout with
  a running suite.

The port rule: 1420 is the human's live `tauri dev`; every suite and
boot check takes its own derived port.

## Where each thing happens

| act | surface |
|---|---|
| the interview | the interview skill in the agent app, or the app's genesis pane |
| triage, planning, rooms | the architect conversation in the agent app; files in docs/ |
| dispatch | the seat skill over the arm; today `brief.mjs --dispatch-lane` |
| build, verify | spawned sessions in lanes and benches, driven by the seat |
| merge, checkpoint | the seat, holding the integration checkout |
| watching the board and the map | the mirror app |
| CI | GitHub Actions |
