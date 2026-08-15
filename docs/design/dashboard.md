# Dashboard design — decisions of record

The dashboard is layer 4: a LENS over the files. It renders, it never
stores. A file watcher pushes changes over a websocket; "live" is free.
The moment the UI holds state not in a file, disposability is broken.
Stack per ADR-007 + ADR-008: TypeScript end to end — Tauri desktop
app from day one (React + Vite + Tailwind + shadcn/ui), Node daemon
as sidecar. The app IS the front door; the CLI is plumbing.
New pane 0: the in-app interview — split view, planner chat left,
story map materializing live right; design budget concentrates here.
Beautiful from day 0 is a requirement; the pure-lens rule is what
keeps beauty from becoming a second source of truth.

## Four panes

### 1. Story map (home)
- Columns = backbone features (dark headers, F-IDs), ordered as the
  USER experiences the product.
- Cards = task files; everything derived from frontmatter (feature,
  priority, milestone, status) — no stored layout. Dragging a card
  writes one field back to one file.
- Vertical position = priority; top undone card = the feature's next
  task. Cards KEEP their slot on completion — progress reads as color
  filling columns top-down; teal below gray is a visual smell.
- Dispatch frontier = topmost undone cards read left to right,
  filtered by blocked_by and touches overlap.
- Milestone slice line: above ships first; dragging below the line is
  scope-cutting made physical. New features land below the line by
  default.
- Status colors: gray planned, amber building, pulsing while
  verifying, red rejected, teal verified+merged. Suggested cards
  render as GHOSTS (dashed) at column bottom; parked row collapsed
  under each feature.
- Card badges: size tier, model (codex · M), verification badge —
  TWO marks per ADR-016 (2026-08-15, supersedes the original
  three-way rule here): solid disc + check = checked by another
  session (independent or same-model), half disc = self-verified.
  The invariant that survives: a mark from the author's own session
  is never visually identical to another session's check. The
  independent/same-model distinction stays first-class in data and
  text (panel, labels), not in the mark.
- Expanded card: acceptance criteria, blockers, builder/verifier
  selectors (model → fresh | registered sessions with task history,
  turn count, sediment marker past warn_after_turns), dispatch
  button. Selectors lock at dispatch; unlock on rejected/planned.
- Secondary views: pipeline kanban filter; dependency graph
  (blocked_by edges → critical path).

### 2. Architecture map
- Rendered from ARCHITECTURE.md Mermaid + component table.
- Live enrichment: nodes colored planned/built/verified from the
  tasks touching them — the map doubles as a progress heatmap; you
  watch the architecture fill in as tasks merge.
- Click a component: description, linked ADRs, every task that
  modified it.

### 3. Rooms
- Threads rendered as live chat; a session posts by appending; the
  daemon routes @mentions to headless agent turns; @human pauses.
- The human is IN the room — type like any participant, steer the
  project from one pane.
- Resolved rooms collapse to their Resolution card → the rooms pane
  doubles as a browsable decision log.

### 4. Sessions
- Renders .nputer/sessions.json: live + past sessions, model, tasks
  built, turn count, sediment warnings, kill switch.
- Killing a session is safe by construction — the project resumes
  from docs/.

## Build order (revised by ADR-007 — UI day 0)
task-file parser + watcher + READ-ONLY story map rendered beautifully
→ write path (card drag = one field; room post = one append) → CLI
dispatch growing underneath → daemon @mention routing (reuses dispatch
code).

## Role in strategy
The dashboard is the marketing that happens to be useful — screenshots
of the map filling in and agents consulting in rooms are the shareable
artifact. The convention stays the product; keep the maintenance
hierarchy in that order.
