---
id: T-058-s2
title: A FIFTH poison shape — the selftest's assertion count is unpinned, so deleting an assertion deletes its own failure
status: suggested
suggested_by: verifier claude-opus-5 @T-058
---

The four measured poison-discipline violations this project has
catalogued share one tell: **the matcher moved, never the value** — a
`toContain` needle that stayed a substring, a loosened inequality, an
equality widened to a negated one, an exact set widened to a containment
matcher. Hunting for a fifth on T-058 turned one up, and it has a
different tell entirely: **nothing moves, because the assertion is gone,
and the assertion was the only thing that would have noticed.**

`lint-tokens.mjs` (now `token-scan.mjs`) builds its evidence as three
self-enumerating arrays — `SAMPLES`, `CONTROL_SAMPLES`, and the rows
returned by `walkPolicyChecks()` — and `selftest()` iterates each,
failing per element. The green line then PRINTS the cardinality:

    lint-tokens selftest: 49 TOKEN samples + 2 CONTROL samples green,
    37 walk-policy checks green

Nothing compares any of those three numbers to anything. Delete an
element and the run stays green at a smaller number, and the number is
in stdout that no gate reads.

Measured on the branch tip, four deletions, each applied alone and
reverted (`token-scan.mjs` restored to SHA-256 `998d98a2...e90f0e`):

| deletion | selftest | lint | focused suite |
|---|---|---|---|
| the six `CONTROL includes <root>/` rows | exit 0, **31** checks | exit 0 | 5 passed |
| three pinned-format rows (ci.yml, Cargo.toml, ROADMAP.md) | exit 0, **34** checks | exit 0 | 5 passed |
| the P5 positive CONTROL sample | exit 0, **1** CONTROL sample | exit 0 | 5 passed |
| four TOKEN positives, one per pattern P1–P4 | exit 0, **45** samples | exit 0 | 5 passed |

The last row is the sharpest: **the gate can lose its only positive
sample for each of P1, P2, P3 and P4 and stay green everywhere.**

The module already knows this class of failure exists — its own
`MUST_TOKEN_COVER` comment records T-045 measuring it ("deleting
`app/test` from it left the selftest green at ten checks — the deletion
removed its own check") and defends against it with a second list that
does not move with the first. That defence covers exactly one property,
the TOKEN walk roots. Everything else in the evidence set is undefended,
and T-058 grows the undefended set by 2 samples and 26 walk-policy rows.

This is a pre-existing property T-058 inherits, not a defect introduced
by it. But the cheap fix is now cheaper than it has ever been, because
the focused suite exists: one Playwright assertion pinning the three
counts, or a floor per pattern id (`every id in TOKEN_PATTERNS has at
least one positive sample; P5 has at least one positive and one
negative`), would make a deletion fail against something that did not
move with it. The floor version is better than a literal count — it
survives honest additions and still catches a removal.

Worth adding to the standing poison-discipline note as shape five:
**an assertion removed is not a mutation the mutation drill can see, so
the assertion set needs a cardinality or a coverage floor of its own.**
