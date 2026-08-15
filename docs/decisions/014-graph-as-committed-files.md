# ADR-014: Map data is committed, deterministic plain files

Date: 2026-08-15 · Status: accepted · Decided in: human directive
(map planning session), promoted by architect review

## Context
The reality layer needs a persisted model of the code. It could live
in an app-side cache or database — fast, invisible, unversioned — or
as files in the repo like everything else nputer knows.

## Options considered
App-internal store: no repo noise, but violates files-are-the-brain
(ADR-002), unreadable to agents, unreplayable. Chosen: plain files.

## Decision
- Intent: `docs/architecture/components/C-xx-<slug>.md` (frontmatter +
  prose, one per component, same C-namespace as ARCHITECTURE.md).
- Reality: `docs/architecture/graph.json`, written only by the
  indexer, deterministic — same tree → byte-identical bytes (sorted
  keys/arrays, stable pretty-printing). Volatile fields (HEAD sha,
  timings) are OMITTED from the committed payload.
- Never hand-edited; merge conflicts resolve by taking either side
  and re-running the indexer. `nputer index --check` exits non-zero
  when the committed graph is stale (the `cargo fmt --check` pattern).
- Delivery rides the existing docs pipeline: component files are .md
  under docs/ (collected today); the collector gains .json under
  docs/architecture/. The collector's 1 MiB/file cap governs the
  indexer's symbol budget — exceeding it is a defined degraded state.

## Consequences
Graph history is diffable (the time-machine seam) and agent-readable
(`nputer arch` greps it). Repo carries a generated file; the --check
gate keeps it honest. Layout pins (`layout.json`) are the map's only
app-written file, absent by default.
