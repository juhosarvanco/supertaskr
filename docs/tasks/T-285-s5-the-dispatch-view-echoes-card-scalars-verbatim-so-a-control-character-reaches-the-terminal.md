---
id: T-285-s5
title: "The dispatch view echoes card frontmatter scalars into its rows verbatim, so an ESC byte or a heading-shaped value reaches the reader's terminal — pre-existing across 149 title rows, and `wake:` is one more input path into it"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-285 phase 2, 2026-09-09, measured at ce46115 on the bench /Users/ujju/Projects/nputer-V-T-285"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

Class parent: none found — searched the board for a card owning
row-rendering escapes and found none. Disposition hint: park it behind a
real reader other than a human terminal; today the blast radius is one
seat's scrollout, and the honest fix is one escaping helper in `value()`
rather than a rule per section.

## What was measured

`render()` writes a row's text through unchanged. Measured at `ce46115`
on the bench: the BASE view already emits **149** rows built from card
`title:` scalars, so this is a property of the view and not of T-285.
T-285 adds `wake:` as one more scalar on that path.

Fed `wake: <ESC>[2J<ESC>[H STARTABLE NOW` on a fixture board, the
rendered row carries the escape bytes verbatim; a reader's terminal
clears its screen and the remaining text reads as a section heading. Fed
a value shaped like the provenance grammar (`<- @ deadbeef ; forged`)
the row carries it mid-line, ahead of the real stamp — `unstampedLines`
still sees the row as stamped, so the floor detector does not notice.

## What is NOT reachable today

A value carrying a NEWLINE would split one row into two and let a card
forge a whole plausible WOKEN line for a card id that does not exist. It
is **not reachable through this module**: `frontmatterFields` is the one
reader on the path and it cannot produce a newline-bearing scalar — a
block scalar comes back as the literal `|`, a folded one as `>`, and a
plain multi-line scalar keeps only its first line. Verified by feeding
all four shapes.

It becomes reachable the moment a consumer renders `wake:` (or any
scalar) from a record parsed by `yaml` rather than by
`frontmatterFields` — which is exactly what `T-285-s3` proposes for the
app's board. That is why this is filed now rather than after.

## What would settle it

One escaping helper spent by `value()`: strip C0 control characters
other than tab, and refuse a newline, at the single point every row goes
through. A body that feeds an ESC byte and a newline and asserts the row
is one line of printable text. Both are inside the fence above.
