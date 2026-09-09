---
id: T-271-s1
title: "Row 7 of a brief is derived ONLY from the per-package command bullets, so the blessed runner's spelling reaches a seat through the CONTEXT PACK instead — and that path has 397 bytes of margin left before it flips to a citation"
feature: F-04
milestone: 4
size: S
priority: 30
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

T-271's criterion 5 asks that "the executor's and verifier's briefs
(row 7) carry the scoped spelling". Measured in that lane:
`deriveCommands` builds row 7 from `packageCommands`, which scans
docs/CONVENTIONS.md for bullets matching "run from <dir>/:" and takes
the backticked segments between middle dots. The BLESSED GATE-RUNNER
bullet is not one of those, so **row 7 has never carried the runner's
spelling at all** — not the scoped form, and not `gate-run.mjs parser`
either. An assembled executor brief at cc41ff3 confirms it: row 7 lists
`npm ci`, `npm test`, `cargo test` and their siblings, and no graded
reading.

What DOES carry it is the CONTEXT PACK, which transcribes the whole
BLESSED GATE-RUNNER bullet verbatim, and row 9, which names it. T-271
verified this by assembling a brief after its edit: the scoped spelling
arrives whole.

**Two things are worth a card.** First, the criterion's row number is
wrong and the next card that cites it will look for the spelling in the
wrong place. Second, the pack transcribes a bullet only while its
FLATTENED size is at or under `PACK_TRANSCRIPTION_LIMIT` (2000). After
T-271 that bullet is 1603 bytes: **397 bytes of margin**, after which
the pack cites it by address and every brief silently stops carrying the
words a card required them to carry. Nothing measures that margin today
and the flip is invisible at the moment it happens.

Disposition hint: the cheap half is a body that reds when a bullet a
card requires briefs to carry crosses the limit — the limit is already
an exported constant. The expensive half, widening row 7 to name the
graded readings, wants a ruling first: row 7's contract says "every
package the full suite spans", and the blessed runner is not a package.
