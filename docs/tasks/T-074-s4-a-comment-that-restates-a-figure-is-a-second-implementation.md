---
id: T-074-s4
title: A comment that restates a measured figure is a second implementation of it — cite the assertion instead
status: suggested
suggested_by: executor claude-opus-5 @T-074
---

The generalisation T-074 earned by doing the work, offered rather than
assumed: **of this card's six corrections, exactly one had a mechanical
reader, and it lived in a different npm package from the comment it
contradicted — which is why the two could disagree for three weeks.**

| corrected claim | is anything holding it? |
|---|---|
| `GenesisScreen.tsx`: the lens is W-640 (800 / 640 / 384) | **YES, at a distance** — `tools/e2e/tests/interview.spec.ts` asserts `width - 640` at three widths. It pinned the NUMBER and could not see the COMMENT restating it wrongly. |
| `GenesisScreen.tsx`: "the design's own number" | no |
| `map-tasks-lens-dom.test.tsx`: which gates/searchers a control byte blinds | no |
| T-041 / T-063: the DEV-flipped bundle size | no, and by DESIGN — T-063 chose the sha and the property precisely because a size rots |
| T-063: 870 characters, not 887 | no — see `T-074-s3` |
| `startup-screen.test.tsx`: "10 of these 23 tests" | no, and the file's own test COUNT is not asserted anywhere either |

**THE SHAPE.** A number written twice is a number that can disagree with
itself, and a comment is the copy nothing runs. This repo already knows
the rule for code (T-057: *a rule with two implementations is two chances
to disagree*) and for method (T-024-s5's three fixtures). Prose was never
brought under it, and the cost is now measured five times over in one
card.

**THE CHEAP HALF, which needs no gate.** Where a figure IS asserted
somewhere, the comment should CITE THE ASSERTION BY NAME rather than
restate its value — *"the lens takes the rest; `interview.spec.ts`'s
`the split is 640 + the lens at >=1024` measures it"* cannot go stale,
because the only thing it claims is that a test exists, and a rename reds
nothing but also misleads nobody about a width. That is a writing habit,
not a mechanism, and it belongs in CONVENTIONS' gotchas beside *A
CITATION NAMES A SYMBOL, NOT A LINE* — which is the same lesson one
category over, and which was itself written down only after four findings
cited lines that had drifted.

**THE EXPENSIVE HALF, named and NOT recommended yet.** A gate that greps
comments for digit runs and demands a nearby ref would fire constantly on
prose that is fine. The honest version is narrower: flag a comment that
quotes a figure in the same file as an assertion of a DIFFERENT value.
Worth a prototype only if a sixth instance turns up.

**Fenced out of this card deliberately.** `docs/CONVENTIONS.md` is
T-084's fence this week, so nothing was written there.
