---
id: T-150-s2
title: The census-claim detector stops at the card, and the false-ordinal chain it catches ran through STATE.md and ARCHITECTURE.md first
status: parked
suggested_by: executor claude-opus-5 @T-150
---

Absorbs: T-141-s2 (Amnesty triage 2026-08-29 (triage seat)) — the incident this card is about, traced in full: two documents used the same four words about different events, the second is the true one on contemporaneous fixture evidence, and the false ordinal propagated through six documents across two weeks because each hand trusted the one before it. Its two SEED sentences are gone at this base — ARCHITECTURE.md:1004 and STATE.md:124 were both cut by ADR-019's compactions and grep for "first D2" now returns nothing in either — so what survives is exactly this card's subject: the detector was wired to the LAST link and not the first.

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

Amnesty triage 2026-08-29 (triage seat): PARKED — the owner of the false-ordinal class, and the incident it absorbs shows exactly where the detector is not: the card was the LAST link in a six-document chain, not the first. Arm 1 already works by hand today (brief.mjs --audit docs/STATE.md) and the gap is that nothing ASKS. Its own caution is the load-bearing half and must survive into whatever is built: these documents are NARRATIVES that carry census claims on purpose, so a gate redding a checkpoint for writing "the third D2" in a table whose subject is the D2 census would be ignored within a week. RESURFACES: the next tools/e2e dispatch, which SHALL measure the hit rate on docs/ before wiring anything — the way T-150 measured it on docs/tasks/ — and SHALL expect a different answer because the prose is different.
