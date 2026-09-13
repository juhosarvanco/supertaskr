---
id: T-298-s7
title: "The size vocabulary is spelled twice more outside the parser — docs/reference/02-cards.md's frontmatter block and the board's SizeBadge doc comment both still read S | M | L after T-298-s3 added XS, and no gate compares either with the set the parser declares"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-298-s3, measured at 4e24160be293ab6a34d2a0043a55db76a7557176, 2026-09-14"
blocked_by: []
touches: [docs/reference/02-cards.md, app/src/components/board/badges/SizeBadge.tsx, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-298-s3 moved the size vocabulary in the two places a checker compares:
lib/parser/src/types.ts's TASK_SIZES and method/tasks/TASK-FORMAT.md's
`size:` comment, which MF-05 requires to be equal. Two further copies
exist and neither is compared with anything.

docs/reference/02-cards.md's frontmatter block reads
`size: M  # S | M | L — sets the ceremony tier`. That chapter is
hand-written: docs/reference/README.md marks only chapter 15 as
GENERATED, so nothing regenerates this line and nothing reds while it is
stale. The reference's own reading rule says the source wins and the
chapter is the bug, which is what this card is.

app/src/components/board/badges/SizeBadge.tsx opens
`/** Size tier chip (S | M | L) on the card face`. The component itself
is vocabulary-free — it takes a TaskSize and renders it, so an XS card
draws correctly today — but the comment now describes a smaller set than
the type it annotates.

**WHY THIS IS A CARD RATHER THAN A SWEEP INSIDE T-298-s3.** Both paths
are outside that card's fence, and its amendment named the two sides the
repair moves. The interesting half is not the two edits: it is that
MF-05 pins exactly one pair and this tree has four spellings, so the
next value added to the set will go stale in the same two places for the
same reason. A fix that only retypes the two lines has not closed it.

## Acceptance criteria

- WHEN the parser's declared size set changes THE tree SHALL red on any
  in-repository copy of that vocabulary that did not move with it,
  naming the file and the values that differ.
- WHEN the copies agree THE same check SHALL pass, reading each side
  from its own file.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
