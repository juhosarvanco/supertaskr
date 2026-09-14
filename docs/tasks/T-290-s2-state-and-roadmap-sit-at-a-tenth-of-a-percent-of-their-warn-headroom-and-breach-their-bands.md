---
id: T-290-s2
title: "docs/STATE.md and docs/ROADMAP.md each sit at 0.1% of their warn headroom, breaching their bands, and the compaction that would move content off them has never been cut"
feature: F-01
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-290, read from `npm run health` at the lane's tip; both documents are outside this lane's fence"
blocked_by: []
touches: [docs/STATE.md, docs/ROADMAP.md, tools/e2e/scripts/docs-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-290 re-landed this project's conventions and its band moved from
BREACHED to inside. Reading the same report at that lane's tip shows two
documents left in the state the conventions were just taken out of:

    docs-headroom/docs/STATE.md      0.08 % of the warn line   BREACHED
    docs-headroom/docs/ROADMAP.md    0.11 % of the warn line   BREACHED

The breach line is 2% and the drift line is 10%. STATE stands at 8 458
bytes against a warn line of 8 465 — seven bytes — and ROADMAP at 12 238
against 12 252, which is fourteen. Neither is a slow slide: ADR-019's own
rule is that when a byte band warns, content MOVES to a record or a card
and a hazard is never deleted to fit, and neither document has anywhere
to move content to today except by hand at a checkpoint.

Both are outside T-290's fence, so that lane could not repair either and
reports them instead. They are named together because the remedy is the
same shape and because a card that fixed one would leave the other one
byte from the same reading.

## Acceptance criteria

- WHEN this card lands THE two documents SHALL each be inside their own band, with the content that left them moved — never deleted — to the record or the reference chapter that owns it, and the move SHALL be verbatim.
- WHEN the budgets are re-landed for either document THE row SHALL be derived at the landing commit by ADR-019's formula with `F` re-derived there, and the addendum that records it SHALL be proposed to the owner rather than written by the lane.
- WHEN the health bands are read at the tip THE two bands SHALL read inside, and the reading SHALL be recorded on the card with its ref.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
