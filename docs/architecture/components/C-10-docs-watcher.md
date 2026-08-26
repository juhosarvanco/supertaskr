---
id: C-10
name: Docs watcher
layer: app
paths:
  - app/src-tauri/src/docs_watch.rs
  - app/src/lib/watcher-store.ts
  - app/src/lib/docs-model.ts
  # The tests that exercise this pipeline, routed out of C-05's test
  # umbrella at T-149. All four drive `watcher-store.ts` or
  # `docs-model.ts` and nothing else of anyone's. `shell-harness` is the
  # one whose NAME says shell: the surface it audits,
  # `window.__nputerShellHarness`, is installed by `watcher-store.ts`,
  # and the code a fix would edit is this component's.
  - app/test/docs-model.test.ts
  - app/test/shell-harness.test.ts
  - app/test/startup-recovery.test.ts
  - app/test/watcher-store.test.ts
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

**THIS COMPONENT IS WHERE THE `app-shell` CONTENTION ACTUALLY IS, AND
THE SLUG IS NOT MOVED HERE (T-127, 2026-08-25, derived at `afe23c1`).**
Of the eight live cards whose `touches:` is exactly `[app-shell]`, two
work only on this component — `T-114` (`docs_watch.rs` and nothing else,
by its own criterion) and `T-035` (`applySnapshot` in `docs-model.ts`) —
and two more span C-05 AND this one (`T-044`, `T-106`). A dedicated
`app-watcher` word therefore frees two cards outright and makes two more
say what they really hold, where a word for `C-16` frees none
(`T-033-s7`, answered in that component's file).

**IT IS SEQUENCED RATHER THAN TAKEN, because `touch_slugs:` is what
`touches:` expands to.** Changing this field re-draws the fence of every
live card reading `[app-shell]` — 20 of them at this ref — and `T-044`
and `T-106` would silently STOP covering `docs_watch.rs` unless their own
`touches:` move in the same commit. Those cards are `docs/tasks/`
placement fields (the architect's single-writer territory) and the slug
prose lives in `docs/ARCHITECTURE.md`; neither is inside T-127's fence,
and **no suite in this repository can see a `touch_slugs:` edit at all**
— measured: changing this line alone left `npm test` from `app/` at
973 / 973, exit 0 (`T-127-s4`). A silent fence change is worse than a
loud one, so it waits for one commit that carries all three.
