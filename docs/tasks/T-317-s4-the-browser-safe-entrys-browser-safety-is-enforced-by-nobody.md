---
id: T-317-s4
title: "The browser-safe entry's browser-safety is enforced by nobody: a node builtin added to the pure barrel leaves every suite and every gate green, so the one rule that keeps the app's bundle loadable lives only in a header comment"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-317, measured at that card's base and again at its tip; pre-existing on both sides and outside that card's criteria, which scope the purity clause to the moved module"
blocked_by: []
touches: [lib/parser/test/pure-entry.test.ts, docs/CONVENTIONS.md, docs/conventions/app-and-ui.md, docs/conventions/architecture.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The parser package publishes two entries: a root entry that is filesystem
backed, and a browser-safe entry the app imports in seventeen import
statements across twelve of its source files. What makes the second one
browser-safe is a hand-kept barrel and a sentence in its own header
comment asking the next writer to keep it free of any module that touches
a node builtin. Nothing checks it.

Measured twice, on a bench, and restored each time. With an import of
`node:fs` added to the browser entry barrel itself: at T-317's base the
parser build, the parser typecheck, the parser suite at 389 bodies, the
app build and the app suite at 1171 bodies were all green; at T-317's tip
the parser suite answers 412 passed and the typecheck 0. The app's own
build does notice, and says so in a line nobody reads as a failure —
it externalises the builtin for browser compatibility and warns, exit 0.

T-317 bought half of this: its own new body reads the moved module's
source and reds when that module imports anything at all, with a positive
control over a module that does import. What is still unguarded is the
ENTRY — the barrel, and everything it re-exports transitively. A module
that is itself clean can be pulled into the browser bundle by a sibling
the barrel names, and no Node-run suite can ever see it, because in Node
the import simply succeeds.

## Acceptance criteria

- WHEN the browser entry is resolved THE transitive import graph reachable from it SHALL carry no node builtin and no dependency that does, derived by walking the graph rather than by reading one file, and a body SHALL red when a builtin is reachable through any module the barrel names.
- WHEN that body runs THE derivation SHALL be shown failing on an entry that lacks the property — a builtin planted one module deep, not in the barrel itself — so the walk is proved to reach past its first hop rather than asserted to.
- WHEN the rule is recorded THE conventions SHALL carry it beside the package's other entry rules, so it is a rule with a gate rather than a comment in a source header.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/architecture.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
