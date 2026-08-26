---
id: T-150-s2
title: The census-claim detector stops at the card, and the false-ordinal chain it catches ran through STATE.md and ARCHITECTURE.md first
status: suggested
suggested_by: executor claude-opus-5 @T-150
---

T-150 built `CENSUS_CLAIM` in `tools/e2e/scripts/card-figures.mjs` — an
ordinal bound to a repository-scope phrase, which is the shape that has
no digit in it and that no figure scanner can see. It is wired to
`brief.mjs --card` (a card) and `--audit` (any file handed to it).

**IT IS NOT WIRED TO THE DOCUMENTS THE ERROR CHAIN ACTUALLY RAN
THROUGH.** `T-141-s2` traces the false ordinal from
`docs/ARCHITECTURE.md` through `docs/STATE.md` into two cards and a
fixture: *"A single false ordinal has propagated through six documents
across two weeks because each hand trusted the one before it."* The card
was the LAST link, not the first.

## The two arms

1. **`--audit` already reaches them by hand** — `node
   tools/e2e/scripts/brief.mjs --audit docs/STATE.md` works today. The
   gap is that nothing ASKS.
2. **The DOCS GATE is the natural home** and it already lives in this
   fence (`tools/e2e/scripts/docs-gate.mjs`). A census-claim arm over the
   docs a diff touches would fire on the seed rather than on the sixth
   copy.

**DO NOT TAKE ARM 2 BY REFLEX.** These documents are NARRATIVES and carry
census claims on purpose — the ledger `T-141-s2` proposes for
ARCHITECTURE.md is itself three ordinal rows. A gate that reds a
checkpoint for writing "the third D2" in a table whose whole subject is
the D2 census would be ignored within a week, which is the over-fire trap
`docs/CONVENTIONS.md` names against itself under DOCS GATE. **Measure the
hit rate on `docs/` before wiring anything**, the way T-150 measured it
on `docs/tasks/`, and expect the answer to be different because the prose
is different.

## Disposal

`touches:` `[tools/e2e]` for the scanner arm; the derivers themselves need
nothing new. T-150's own fence was `[tools/e2e]` and could have reached
the gate — this was left OUT on judgement, not on reach, and the
judgement is the thing worth a triage rather than a lane.
