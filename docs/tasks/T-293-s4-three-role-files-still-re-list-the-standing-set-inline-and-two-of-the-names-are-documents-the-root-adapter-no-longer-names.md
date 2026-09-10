---
id: T-293-s4
title: "Three role files still re-list the standing set INLINE — and two of the names are documents the root adapter no longer names, so ARCHITECTURE and CONVENTIONS stay in three seats' standing read by their own role file's words"
feature: F-01
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-293 (phase 2), measured at 6d904bf72ca0dc57cd674c419c898b7f3f8f293c"
blocked_by: []
touches: [method/roles/, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293 cut the standing read to docs/STATE.md plus the generated index,
and the root adapters now name exactly three paths. Three role files did
not move with it, and each of them writes the set out a second time:

    grep -n "the standing set this project's root adapter names" method/roles/*.md

- `method/roles/orchestrator.md` step 1 and `method/roles/integrator.md`
  step 0 both read *"the standing set this project's root adapter names
  — docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md — listed
  there once and deliberately not re-listed here, because a second copy
  of a list drifts from the first and this project has watched that
  happen."* The sentence says the list is not re-listed while re-listing
  it, and the copy has now drifted.
- `method/roles/executor.md` step 1 carries the same three names in the
  same shape without the disclaimer.
- `method/roles/verifier.md` step 0 was ALREADY repaired and is the
  worked example: it names no document and says in as many words that
  the copy which used to stand in that sentence had drifted.

**WHY IT IS NOT COSMETIC.** The applied read-first set a brief hands a
seat is the adapter's list minus the role file's subtraction clauses, so
the BRIEF is right. A seat reading its role file with its eyes is told
to read `docs/ARCHITECTURE.md` — 9,522 bytes, about 2,381 tokens at the
room's ratio — which the index exists to replace. Three of the five role
files, and none of them can be reached from T-293's fence.

**AND THE VOCABULARY HALF IS UNGUARDED TOO.** T-293's new body forbids
an adapter from spelling a governing document's PATH, in the derivation
and in the raw text both. Nothing forbids the prose form: a sentence
saying *"also skim the roadmap before starting"* in any seat-facing file
passes every body on the tree. Measured at this ref by feeding both
spellings to the reader the bodies use:

    node -e 'import("./tools/e2e/scripts/docs-scan.mjs").then(m => console.log(m.adapterNamedDocs("also skim docs/ROADMAP.md"), m.adapterNamedDocs("also skim the roadmap")))'

The path spelling comes back naming the document and reds the body; the
prose spelling comes back empty and reds nothing.

## Acceptance criteria

- WHEN a role file names the standing set THE names SHALL come from the
  root adapter rather than from a second copy, and a body SHALL red when
  a seat-facing method file spells a `docs/<NAME>.md` the root adapter
  does not name.
- WHEN a seat-facing file directs a reader to a governing document by
  prose rather than by path THE guard SHALL still see it, or the residual
  SHALL be stated where the guard is written rather than left implied.
- The repair SHALL NOT leave the three seats thinner than they are today
  without a route to what they lose — see the sibling finding about the
  seats that receive no context pack.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
