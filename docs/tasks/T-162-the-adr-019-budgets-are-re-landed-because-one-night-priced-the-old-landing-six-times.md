---
id: T-162
title: The ADR-019 budgets are RE-LANDED — ROADMAP and CONVENTIONS compacted on their own terms and warn/fail re-derived from the new landing, because one night priced the old landing six times
feature: F-04
milestone: 4
priority: 1
size: M
status: building
blocked_by: []
touches: [docs/ROADMAP.md, docs/CONVENTIONS.md, docs/decisions, tools/e2e]
suggested_by: "@human ruling (2026-08-30, rulings sitting): full re-landing pass approved over raise-the-lines-only and keep-absorbing"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT @HUMAN'S RULING (2026-08-30), planned at filing** — the
T-160 precedent for a card that exists because a decision landed.

## The measurement that forced the decision

`npm run health` (tools/e2e/) reads both bands; derive at your own
ref, never quote this paragraph. At filing: ROADMAP BREACHED (headroom
under 2% of the warn line, re-breached SIX times in one night of
one-sentence-per-merge growth, an absorption trim paid each time) and
CONVENTIONS drifting with the seat HELD — `T-156-s1` and every further
CONVENTIONS lane parked on the runway. The landed figures are too
tight for the measured merge velocity; nibbling at 3am was the
alternative @human declined.

## Acceptance criteria

- THE lane SHALL compact docs/ROADMAP.md and docs/CONVENTIONS.md each
  on its OWN terms under ADR-019's law: RECORD-shaped sentences move
  to the records that keep them (cards, checkpoint records, room
  resolutions — cited, not deleted); RULE and TRUTH sentences stay,
  reworded only where a shorter sentence says the same thing. A hazard
  is never deleted to fit. The 2026-08-27 compaction record is the
  worked precedent (docs/checkpoints/2026-08-27-adr019-compaction.md).
- CONVENTIONS sentences are PINNED by readers — brief, dispatch-order,
  docs-input-gate, lane-fence, range-rule, workflow-parity among them
  (the census: `npm run lint:docs` reader rows). THE lane SHALL run
  the reader suites and keep every pin green; where a pinned sentence
  must move or shrink, the pin moves in the same commit, never
  loosened to a weaker assertion.
- WHEN both files are landed THE lane SHALL re-derive `DOC_BUDGETS`
  (tools/e2e/scripts/docs-scan.mjs) by ADR-019's own formula — warn at
  landed size × 1.25, fail at landed size × 1.5 — for the two re-landed
  files ONLY; the other budgets keep their landings.
- THE lane SHALL write the record of execution as a dated addendum in
  docs/decisions/019-governing-docs-rules-truths-records.md naming
  both new landings with their derivation, plus its own checkpoint
  record — the 2026-08-27 form.
- THE health bands SHALL read INSIDE for both docs-headroom bands
  after the landing (`npm run health`), and the RE-BREACH price is
  stated: if the new ROADMAP landing buys less than the old landing's
  measured one-night growth (~six sentences), the card has not
  answered the velocity problem and SHALL say so rather than land a
  number that fails next week.
- THE DOCS GATE fires on this diff; run what it owes, exits unpiped.

## Fence note at filing

`touches:` carries the two governing docs, docs/decisions for the
addendum, and tools/e2e because DOC_BUDGETS and the pins live there.
This fence collides with every e2e-seat card — dispatch ALONE on the
e2e seat, and `T-160-s4`/`T-156-s1` queue behind it. `T-156-s1`
unblocks the moment this lands; it is the first consumer of the new
runway.
