---
title: layoutKey separator hygiene — hostile inferred ids can alias the memo key
status: suggested
suggested_by: verifier claude-fable-5 @T-012
---

`layoutKey` (app/src/architecture/map-layout.ts) builds the structural
identity as `sorted(components).join("U+0002") +
sorted(edges).join("U+0002")` with `U+0001` separating fields — and NO
divider between the component list and the edge list. Two theoretical
alias paths exist:

1. A component id containing `U+0001`/`U+0002` can forge field/record
   boundaries. Declared ids come from the registry (architect-authored,
   `C-\d+`-shaped), but INFERRED pseudo-component ids in the
   no-components degraded mode derive from top-level directory names of
   an untrusted repo — POSIX filenames may contain control characters.
2. The missing list divider makes the component/edge boundary
   ambiguous in principle (a crafted suffix of the component string
   could parse as an edge prefix).

Consequence is bounded and non-exploitable: a key collision means the
ref-cache serves a STALE layout for one render cycle (positions from
the previous structure) until any real key change; no crash, no XSS, no
persistence. The T-012 verifier probed proto-key and unknown-endpoint
hostility (inert) but constructing an actual collision requires control
characters in directory names — exotic, hence a suggestion, not a
failure.

Fix is two lines: join the two lists with an unused divider
(`U+0003`), and strip/escape C0 control characters when deriving
inferred ids in `deriveArchitecture` (which also keeps them out of the
DOM's id slot). A unit probe pinning `layoutKey(c1,e1) !==
layoutKey(c2,e2)` for a crafted near-collision pair would hold it.
