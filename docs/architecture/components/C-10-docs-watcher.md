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

**`C-10 -> C-14` IS THE ONE UNDECLARED ROW T-033 DELIBERATELY LEAVES
STANDING, AND `T-125` OWNS IT.** T-123 gave the genesis routing a second
input: before deciding whether a folder may be interviewed,
`docs_watch.rs` asks C-14's session registry
(`app/src-tauri/src/agent/sessions.rs`) whether one is already registered
for it. That is one real file edge, it is **this component's first D1
finding**, and beside the declared `C-14 -> C-10` it is this repository's
first component cycle.

**It is NOT declared here, and that is a ruling rather than an oversight.**
The architect first ruled "declare it as an argued cycle"; **@human
overturned that on 2026-08-25** and set the standing rule — *extract when
the tangle is an accident, extract when it is real: the registry holds no
cycles*. Declaring this one would have changed a single markdown line and
left the tangle in the source, and a tool whose product is showing people
tangles in their own code cannot ship a "cycles are fine here" precedent
at fifteen components. So the fact stays visible as amber until the
extraction lands, the extraction is **T-125**, and zero drift is reached
in two commits rather than one. Delete this paragraph with the commit
that pays it.
