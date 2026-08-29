---
id: T-140-s1
title: The pane should receive the component picture and pull file detail only for what is on screen — the shape T-140 measured, and the one it could not build inside its own fence
status: suggested
suggested_by: executor claude-opus-5 @T-140
---

**This is `T-140`'s criterion 6 — "pin the RELATION, that the shipped
payload does not grow with file count" — recorded as NOT BUILT and
routed, because the relation cannot be pinned until the shape that makes
it true ships, and that shape needs a decision `T-140` reserves to
@human in its own last line: *"how much of a codebase the map shows at
rest is a product decision about what the pane is for."***

## What T-140 measured, at `a533a4d`

- The undroppable floor — files plus `import` edges, which
  `emit::apply_budget` never drops — is **213 712 bytes over 189 files,
  1 131 bytes/file**, so at this tree's density the emit budget stops
  degrading gracefully at **about 919 files**. Both figures are now
  PRINTED by `index --check`'s floor line rather than written down; run
  the gate rather than quoting this paragraph.
- The floor is **linear in file count**, pinned as a relation by
  `crates/nputer-index/tests/budget.rs`'s
  `the_undroppable_floor_grows_with_the_file_count`. **That body is this
  card's discriminator and is expected to RED when this card lands** —
  retire it here, and its red is the evidence the shape changed rather
  than a constant having moved.
- The **component rollup is flat**: fifteen components with their
  `depends_on` serialize to about 2 KB against the graph's 1 021 562, and
  fifteen is fifteen whether the repo holds 189 files or 20 000.

## The finding T-140's own criterion 2 turned up, and it changes the size

`T-140` hoped the pane "already draws only components at rest", in which
case "the rollup is sufficient by construction". **Measured, it is not**,
and the reason is worth carrying:

- At rest the pane renders component nodes and component edges — no
  symbols. `symbols`, `loc`, `hash` and `unresolved` are read ONLY by
  `map-zoom.ts`'s `fileDetail` and `MapPanel`'s file section, i.e. only
  after a drill-in. So the SYMBOL half of the payload is already
  drill-only, and the emitter's budget already protects it.
- But the component picture is DERIVED IN THE PANE, from the full file
  list and the file-level `import` edges: `derive.ts` matches every
  `graph.files[].path` against the registry's globs and rolls
  `graph.edges` up into component edges. That derivation needs exactly
  the skeleton — which is exactly the part that is linear in file count.

**So the rollup is not sufficient by construction; it is sufficient only
if the file→component join moves.** That is the whole design question,
and it is the one that needs the ruling.

## What already exists, and it is more than half

`nputer-index`'s `arch` module ALREADY computes the reality-side join in
Rust — file → component mapping, observed component edges with their
counts, the `{confirmed, planned, undeclared}` relations, and findings
D1–D5 — and its own module doc records the measurement that it
reproduces the TypeScript engine on this repo's live tree row for row.
ADR-015 keeps the status/provenance/task join in TypeScript, and nothing
here proposes moving that: the rollup this card wants is the REALITY
side, which is the side Rust already has.

What is missing is a channel. `docs_watch.rs` broadcasts the whole docs
tree on every change and cannot express "detail for what is on screen";
`T-140` ruled at `MAX_FILE_BYTES`'s own definition site that the graph
LEAVES that pipeline rather than getting a cap of its own, with the
reasons written there.

## What this card would do

1. Emit (or serve) the component-level rollup — components, their
   observed and declared edges with counts, and per-component file
   COUNTS — as the map's resting payload.
2. Give file-level detail a pull: a request naming what the user opened,
   answered with that component's files, or that file's symbols and
   edges.
3. Retire `the_undroppable_floor_grows_with_the_file_count` and pin the
   relation the other way round — the shipped resting payload does not
   grow with the file count — which is the property that distinguishes
   this from every constant anyone could raise.
4. Keep the honest degradation `T-140` built (`map-too-large`) as the
   backstop for whatever limit the new channel does carry.

## What it needs first, and it is not code

**@human's look at the shape.** How much of a codebase the map shows at
rest is a product decision, and every option here is a different answer
to it: a rollup-at-rest map is a different pane from today's, and
`docs/rooms/map-sequencing.md` shows this feature's scope has been
@human's before.

**And `T-151` is a different card, not a smaller version of this one.**
It raises the budget by at most 8 575 bytes — about seven files at the
floor re-derived here — and its own honest framing already says so.
