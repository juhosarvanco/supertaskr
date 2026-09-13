---
id: T-296-s4
title: "The guard-class mechanism does not guard itself — the module the classifier lives in, the document the map lives in, and the modules a mapped guard imports are all uncovered"
feature: F-01
milestone: 4
size: S
priority: 2
status: parked
wake: T-292
suggested_by: "verifier claude-opus-5@subagent @T-296, 2026-09-10"
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-296's guard-class map covers the hooks, the workflows, the method, the
parser and six named scripts. It does not cover three things the tier
derivation itself rests on, so a card whose fence names only one of them
is classified by its size.

`tools/e2e/scripts/dispatch-brief.mjs` carries `classifyTier`,
`guardClassMap`, `guardClassIds` and `blessedRunner` — a one-line change
there retires the classifier for every later card, which is the argument
the guard-class list makes about every file it does name.
`docs/CONVENTIONS.md` carries the map and the blessed-runner bullet the
keeper run is derived from. And every local module a mapped guard imports
is uncovered: the merge verb reaches `rename-scan.mjs`, whose classifier
IS the forbidden-spelling keeper, and five of the six mapped scripts reach
`docs-scan.mjs`.

The keeper body cannot see any of this, because the candidate derivation
is a NAME rule over `tools/e2e/scripts/` — a basename carrying gate,
guard, fence, lock, push or landing. That rule is honest and it is
published; what it cannot reach is a guard whose name says nothing, and
the method's own definition of a guard names a keeper and a lint among
them.

## Acceptance criteria

- WHEN the guard-class candidates are derived THE derivation SHALL reach every local module a mapped guard-class file imports, and red naming any that no class covers.
- WHEN a card's fence names the module the tier classifier lives in, or the document carrying the guard-class map, THE arm SHALL classify it guarded.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; the guard-class mechanism does not guard itself, and its module is one of the three being split out.
