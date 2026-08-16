---
id: T-014-s2
title: The Rust and TypeScript joins agree today, and nothing keeps them agreeing
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

Measured at T-014 against this repo's live registry and its committed
92-file graph, `nputer-index arch` reproduces exactly what
`app/test/architecture-dogfood.test.ts` pins for the TypeScript engine:
all 8 mapping counts (C-05 42, C-06 21, C-08 10, C-09 3, C-10 2, C-12
11, C-13 2, C-14 1), the 28-row relation table row for row with every
`observedCount`, all 9 finding ids in order, and all 22 D1 file edges in
order including the `p:@nputer/parser` package annotations.

Nothing keeps that true. Either side can move — a glob-semantics fix in
`glob.ts`, a first-match rule change, a new relation, a schema field —
and the only symptom would be two reports that quietly disagree about
the same repo. The map would say one thing and the CI gate another,
which is precisely the drift disease this product treats, aimed at
itself.

T-014 deliberately did NOT pin it as a fourth live-registry fixture.
`docs/CONVENTIONS.md` already warns that declaring a component moves
THREE of them (the parser smoke test, the dogfood test, the map render
test); a fourth, in a second language, would be a standing reconciliation
cost at every merge for a property the TypeScript fixture already
guards on its own side. `tests/arch.rs` instead pins what cannot go
stale — totality, determinism, order-independence, the package.path
seam.

The cheap shape that would close it, if the architect wants it closed:
one assertion **beside the TypeScript fixture** (app lane, where the
expectations already live and already get reconciled) that spawns
`nputer-index arch --root <repo>` and compares its `edge` lines against
the same `derived.edges` array the fixture already builds. One
reconciliation point instead of two, no new numbers to maintain, and it
goes red the moment either engine moves. It needs a built binary on
PATH or a `cargo build -p nputer-index` step, which is the one real cost
and the reason it is filed rather than built here: `app/test/**` is
outside T-014's fence.

Read with T-014-s1 — if the architect chooses option (b) there, this
suggestion dissolves along with the Rust join.
