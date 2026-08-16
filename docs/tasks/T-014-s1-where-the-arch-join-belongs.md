---
id: T-014-s1
title: The reality-side join now exists in Rust as well as TypeScript — rule on where it belongs
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

T-014 criterion 2 requires the binary to print component/drift
summaries. ADR-015 assigns "the intent⨝reality⨝tasks derivation
(mapping, edge relations, status/provenance rollups, drift findings)" to
pure TypeScript in the app, and `docs/architecture/components/
C-07-nputer-index.md` says in as many words: "Emitting graph.json is its
entire job (parsing and derivation live in TypeScript)."

Both cannot be literally true at once, and T-014 resolved it the
narrowest way it could rather than leaving a criterion unbuilt. What the
crate now computes (`src/arch/`) is the REALITY-SIDE join only: the
file→component mapping, observed component edges including the
package.path seam, the three relations, and D1–D5. What it deliberately
does NOT compute is everything that needs the task tree — status rollup,
provenance rollup, the `component:` field, ADR-016 marks, the inferred
degraded mode. It reads six machine-shaped frontmatter keys and REFUSES
(exit 3, naming the file) on anything it cannot read exactly, so it can
never quietly disagree with @nputer/parser; and the join was measured
against the TypeScript engine's live pins before shipping — all 8
mapping counts, the 28-row relation table row for row, all 9 finding
ids in order, all 22 D1 file edges in order.

That is a defensible narrow reading, but it is still a second
implementation of a documented one-implementation rule, and only the
architect can say which way it should be reconciled. The options, as
they look from here:

**(a) Amend C-07 and ADR-015** to say the crate owns the reality-side
join and TypeScript owns the intent⨝tasks half. This matches what
`--fail-on undeclared|unmapped` already implies (both are reality
findings), keeps the binary self-contained for the CI/agent path the
plan calls "the power path", and costs one clause in each document.

**(b) Move `arch` to the Node CLI (C-02)** when it exists, so the CLI
shells out to the binary for `index` and computes `arch` itself from the
TypeScript engine. This is the purest reading of ADR-015 and of plan §7
("the app calls the same code"), but C-02 does not exist, the engine
currently lives inside `app/src/lib/architecture/` rather than in a
shareable package, and until both are true `nputer arch` cannot exist at
all — which is what T-014's criterion was written to prevent.

**(c) Keep both and pin their agreement** — see T-014-s2, which is worth
doing under (a) regardless.

Note the option that is NOT available: the crate cannot shell out to
Node for the answer. ADR-003's direction is Node→binary, and inverting
it would give the indexer a Node runtime dependency that ADR-015
specifically keeps it free of.
