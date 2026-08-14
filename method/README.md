# Nputer — a project genesis and multi-session development method

Nputer (computer minus "co" — Omputer's sibling) is a convention for running big development
projects with AI coding agents: one planning interview up front, then
disposable sessions executing one task each, coordinated entirely through
markdown files in the repo.

**Core principle: the files are the shared brain — if it's not in the
repo, it didn't happen.** Sessions and models never
talk to each other directly. Every session reads the docs, does its turn,
writes results back. Any session can be killed at any time and the project
resumes from disk. Any model that can read files can participate.

## The layers

1. **Convention** (this package) — works by hand with any model, no tooling
2. **CLI** — genesis + dispatch (`nputer init`, `nputer next`, `nputer verify`, `nputer merge`)
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
.nputer/
  nputer.yaml                role → model defaults, thresholds
  sessions.json            session registry (runtime, not project truth)
```

## The lifecycle

1. `/plan` interview → docs generated → decomposition stage turns the backbone into exact task files (interview/decomposition.md)
2. Orchestrator (fresh session, any time) picks the highest-priority unblocked task
3. Executor (fresh or named session) builds it in a git worktree
4. Verifier (independent by default) red-teams the diff, writes a verdict
5. Integrator merges, runs the full suite, performs the checkpoint ritual
6. Docs updated → board fills in → repeat

Ceremony scales with the task's size tier — see tasks/TASK-FORMAT.md.

## Using it manually (no CLI yet)

Open any agent CLI, paste the relevant role prompt from roles/, point it at
the files it needs. That's the whole protocol. The CLI only automates this.
