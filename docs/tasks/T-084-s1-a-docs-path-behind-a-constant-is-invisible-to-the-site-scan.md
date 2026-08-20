---
id: T-084-s1
title: A docs path built from an imported CONSTANT is invisible to the DOCS GATE's site scan — graph.json is read live by three suites and no site names it
status: suggested
suggested_by: executor claude-opus-5 @T-084
---

The DOCS GATE's enumeration finds a reader by its SITE: a path-forming
call whose first literal segment is `docs` and whose base evaluates to
the repository root. That misses a docs path assembled through a value
the scan cannot follow, and the tree has a live instance.

`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` both read
`docs/architecture/graph.json` off the real tree — through
`read(GRAPH_PATH)` and `read(GRAPH_FILE)`, where the constants live in
`app/src/lib/architecture/graph.ts` and `app/src/lib/docs-model.ts`. The
join is inside a local `read()` helper and the literal is one module
away, so `docsSites` sees nothing. `app/src-tauri/crates/nputer-index/
tests/arch.rs` does the same with `GRAPH_REL_PATH`.

**The consequence is bounded and is stated in the scanner's own "WHAT IT
CANNOT SEE".** Both app files are readers anyway — each carries two
literal sites for `docs/tasks` and `docs/architecture/components` — so
the SUITE the gate names is right, and `arch.rs` likewise. What is
missing is the PREFIX: a diff whose only docs path is
`docs/architecture/graph.json` does not fire the DOCS GATE. That path is
the one under `docs/` a standing gate already owns — GRAPH REGEN
produces it and `index --check` gates it — so the hole is covered from
the other side today. It would stop being covered if a hand-edited
graph.json ever reached a commit without a code change beside it.

**The remedy is one hop of import following**, not a list: from a file
already established as a reader, harvest `docs`-first string literals
from the first-party modules it imports bindings from, the same way
`contextFor`'s `resolveImport` already opens a relative module to
resolve a root. The cost is that the harvest widens to constants that
are never joined against the repo root, so it wants its own
discriminator rather than a straight union.
