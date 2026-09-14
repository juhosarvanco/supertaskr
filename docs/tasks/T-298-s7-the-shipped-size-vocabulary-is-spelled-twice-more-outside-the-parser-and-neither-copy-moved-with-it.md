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
touches: [docs/reference/02-cards.md, app/src/components/board/badges/SizeBadge.tsx, method/interview/decomposition.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/docs-input-gate.spec.ts]
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

## Correction of 2026-09-14 — the census is five copies, not two (assigned by the verifier of T-298-s3, claude-opus-5@subagent)

The title and the finding above say the vocabulary is spelled TWICE more
outside the parser. The record stands and this section corrects it: at
T-298-s3's tip 900e6626 three further live copies still read the old set,
and all three were in the architect seat's own census of the spellings,
taken at that lane's base before its diff existed.

- method/interview/decomposition.md line 62 — "Size honestly (S/M/L per
  TASK-FORMAT.md)". This is the worst of the three and the reason the
  fence gains a guard-class path. It is METHOD TEXT, and it is the line
  that tells an author how to size a card — so the interview still
  teaches the vocabulary that made the cheapest tier unreachable, which
  is T-298-s3's own finding one document further out.
- tools/e2e/scripts/merge.mjs line 2204 — "The board's parser knows S, M
  and L today", in the header of the live XS bound. The sentence is now
  false about the tree the script runs in. The keeper's BEHAVIOUR is
  correct and unchanged; only the sentence explaining it is stale.
- tools/e2e/tests/merge.spec.ts line 508 — the same sentence again, as
  the stated reason for a control loop over S, M and L.

So the tree carries FIVE copies of this vocabulary outside the pair MF-05
compares, and a fence naming two of them is a fence the first criterion
below cannot be satisfied inside. The touches line above is widened to
all five sites plus the spec the check would live in. Nothing here
changes what the criteria ask for: the point was never the retyping, and
a fix that only moves five lines has closed this no better than one that
moved two.

## Acceptance criteria

- WHEN the parser's declared size set changes THE tree SHALL red on any
  in-repository copy of that vocabulary that did not move with it,
  naming the file and the values that differ.
- WHEN the copies agree THE same check SHALL pass, reading each side
  from its own file.

## Implementation notes
<!-- executor appends before finishing -->

### The integrator's correction of 2026-09-14 (the T-298-s3 verdict's one assigned correction, wording, no block, applied as an append because a record is never rewritten)

The T-298-s3 verifier measured, at that lane's tip, three live copies of the size vocabulary that this card's finding and fence do not name, beside the two it does: `method/interview/decomposition.md` line 62 ("Size honestly (S/M/L per TASK-FORMAT.md)") — method text, guard-class, the line that teaches an author how to size a card; `tools/e2e/scripts/merge.mjs` line 2204 ("The board's parser knows S, M and L today", in the header of the XS bound); `tools/e2e/tests/merge.spec.ts` line 508 (the same sentence, as the stated reason for a control loop over S, M and L). The behaviour at all three sites is correct; what is wrong is a card filed to close a class naming two of five members, with a fence an executor cannot satisfy the criterion inside. This line widens the finding to all five copies; the fence widens by the same three paths at promotion, with the ordering caveat that merge.mjs and merge.spec.ts are held by T-295-s10's live lane and by T-295-s4 after it, so this card dispatches after those merge.

## Verdicts
