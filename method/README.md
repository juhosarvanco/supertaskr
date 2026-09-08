# Supertaskr — a project genesis and multi-session development method

Supertaskr is a convention for running big development projects with AI
coding agents: one planning interview up front, then disposable sessions
executing one task each, coordinated entirely through markdown files in
the repo. One sentence of history: it was called "nputer" (computer
minus "co" — Omputer's sibling) from 2026-08-14 until 2026-09-08, when
ADR-022 named it Supertaskr; the records keep the old spelling.

**Core principle: the files are the shared brain — if it's not in the
repo, it didn't happen.** Sessions and models never
talk to each other directly. Every session reads the docs, does its turn,
writes results back. Any session can be killed at any time and the project
resumes from disk. Any model that can read files can participate.

## The layers

1. **Convention** (this package) — works by hand with any model, no tooling
2. **CLI** — genesis + dispatch (`supertaskr init`, `supertaskr next`, `supertaskr verify`, `supertaskr merge`)
3. **Daemon** — file watcher + @mention routing for rooms
4. **Dashboard** — story map, architecture map, rooms, sessions — all rendered from files

Each layer works without the ones above it.

## The succession guarantee

Any role — including the main architect — can be handed to a different
model or session at any moment, and the successor must be as capable as
the predecessor. Two mechanisms enforce this:

1. **The write-before-die rule** (all roles): every judgment, decision,
   or observation lands in a file in the same turn it is made. Verbal
   agreement in a session that never reaches a file is a leak in the
   record.
2. **The cold-start test** (run it at every switch, not just genesis):
   the incoming session reads only the folder and explains the project,
   the current state, the next dispatch and why. Every gap in its answer
   is a documentation bug — fix the docs, not the moment. When a cold
   session passes, the folder IS the project and the switch is safe.

## Repo layout

```
CLAUDE.md / AGENTS.md      thin adapters — point every agent at docs/
docs/
  NORTH_STAR.md            vision, users, non-goals — rarely changes
  ROADMAP.md               feature backbone + milestones
  ARCHITECTURE.md          component map, colored by status
  STATE.md                 the handoff baton — under one page, always current
  CONVENTIONS.md           genuine gotchas only
  decisions/               append-only ADRs
  tasks/                   one file per task (see tasks/TASK-FORMAT.md)
  rooms/                   consultation and debate threads
.supertaskr/
  supertaskr.yaml          role → model defaults, thresholds
  sessions.json            session registry (runtime, not project truth)
```

## The lifecycle

1. `/plan` interview → docs banked incrementally as it runs (roles/planner.md, interview/plan-interview.md) → decomposition stage turns the backbone into exact task files (interview/decomposition.md)
2. Orchestrator (fresh session, any time) picks the highest-priority unblocked task, stamps it `building` on the integration branch, cuts the lane, and hands over a brief assembled to the contract in roles/executor.md
3. Executor (fresh or named session) builds it in a git worktree (lane-protocol.md)
4. Verifier (an independent session by default) red-teams the diff from
   the card and the diff ALONE — that informational blindness is the
   guarantee, not model diversity (tasks/TASK-FORMAT.md) — writes a verdict
5. Integrator merges `--no-ff`, runs the full suite, writes the checkpoint as a SEPARATE commit, removes the worktree
6. Docs updated → board fills in → repeat

Ceremony scales with the task's size tier — see tasks/TASK-FORMAT.md.

## Using it manually (no CLI yet)

Open any agent CLI, paste the relevant role prompt from roles/, point it at
the files it needs. That's the whole protocol. The CLI only automates this.

The one artifact that actually moves work is the DISPATCH BRIEF, and it
has a written contract — the normative table in roles/executor.md. A
brief assembled by hand and a brief assembled by a program are the same
thing: the layers above only save the typing.
