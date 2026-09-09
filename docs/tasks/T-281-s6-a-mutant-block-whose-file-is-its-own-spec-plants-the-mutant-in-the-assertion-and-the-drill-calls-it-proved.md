---
id: T-281-s6
title: "A mutant block whose `file` is its own `spec` plants the mutant in the ASSERTION rather than the producer, and the drill grades it CLEAN — the one rule verifier doctrine 2b states that the reader does not carry"
feature: F-04
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-281, 2026-09-09, at d086c73"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts, method/roles/verifier.md]
builder:
verifier:
built_by:
verified_by:
review:
---

The block's layout separates `file` (where the mutant is planted) from
`spec` (where the pinning body lives), which is better than the criterion
asked for. Nothing requires them to differ.

**Measured** at the verifier's bench, with `file` and `spec` both
`tools/e2e/tests/brief.spec.ts`: the drill planted `const x = 2;` into the
spec file, ran that same spec file, and reported

    C-SELF: "b" RED ALONE in tools/e2e/tests/brief.spec.ts, with the message the block names

returning `EXIT.CLEAN`. The drill proved that the test file can be
broken — not that any producer-side property is pinned.

`method/roles/verifier.md` 2b already states the rule this needs
("producer-side, never the assertion"), and it is the whole basis on
which a re-drill is evidence about a correction. A one-line refusal in
`readOneBlock` — `file` may not equal `spec` — carries it, with a body
that supplies such a block and requires the refusal.

The class is open rather than urgent: it takes a verifier writing a block
against itself, which is a mistake rather than an attack, and the mistake
is currently silent. The phase-1 attack set pre-committed this class to a
suggested card rather than a rejection, and that pre-commitment is kept
here.
