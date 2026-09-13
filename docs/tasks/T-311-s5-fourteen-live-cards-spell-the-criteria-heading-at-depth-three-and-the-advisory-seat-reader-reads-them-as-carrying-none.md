---
id: T-311-s5
title: "Fourteen live cards spell the criteria heading at depth three; the advisory seat reader requires depth two and read T-311's seven criteria as none, while the card preflight accepts either depth — one spelling, named by the task format and kept by a body"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: building
suggested_by: "executor claude-opus-5@subagent @T-311, reported in its notes after the stamp at a98e5a067ca815b984d133ed8b311366899499f4 and filed by the seat, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/session-economics.mjs, tools/e2e/tests/session-economics.spec.ts, method/tasks/TASK-FORMAT.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

Absorbs: T-311-s7 (the owner's ruling of 2026-09-13: the readers pair runs as one lane now). The sibling's file is removed in the same commit as this line; its finding and its two acceptance criteria are kept whole below under their own heading, and the verifier's attack set covers them by the sibling's id. Both cards fix a reader that accepts a narrower shape than the rule it enforces (the merge verb's newest-verdict reader wants the date first; the advisory seat reader wants the criteria heading at depth two), both touch method text, and their fences are disjoint, so the folded fence is the union of the two. This fold departs from the limits T-284 (planned, not landed) proposes for batches — it spans two fences and carries a priority-1 card — by the owner's explicit ruling; the priority-1 card is not held behind anything, since the lane runs at once. Size re-stated from the sum: M.

## The finding

The task format names the section `## Acceptance criteria`. Measured on the
integration checkout at the T-311 dispatch: 491 live cards spell it so and 14
spell it `### Acceptance criteria` — T-093, T-112-s3, T-177, T-208, T-229-s4
and the nine cards of the 2026-09-12 planning batch (T-299-s6, T-300-s6,
T-311 to T-317), which were drafted in one file and inherited one depth.

Two readers disagree about them. The card preflight's heading pattern accepts
any depth from two, so those cards preflight green and their criteria are
checked. The advisory seat reader in the session-economics module compares
the heading as an exact string at depth two, so for T-311 it read the seven
criteria as none, reported "the card carries no acceptance criteria", and
answered TRY — the stronger seat, so nothing was lost this time. The parser
library documents the section as depth two as well. A card with criteria that
one reader sees and another does not is a card whose signals depend on which
tool asked.

## Acceptance criteria

- WHEN a card's criteria section is read by the advisory seat reader THE heading SHALL be matched by the same rule the card preflight uses, so both answer the same criteria for the same card; a body drives both readers over a card at each depth and requires agreement.
- WHEN the task format is read THE one spelling SHALL be stated there with the depth named, and a body over the live cards SHALL red naming any card at another depth — with the fourteen measured here listed as the known set at this ref so the body is green at landing and reds on the fifteenth; whether those fourteen are repaired is the owner's ruling, recorded on this card, since records are appended and not rewritten.
- WHEN a verdict entry under `## Verdicts` is a depth-three heading carrying a date anywhere in it THE newest-verdict reader SHALL find it, and a body drives the reader over the two spellings seen so far (date first, date last) and a heading with no date, requiring the first two found and the third refused. (absorbed from T-311-s7)
- WHEN the role file states the verdict's heading THE one shape SHALL be spelled there with the date's place named, so a verifier does not have to guess what a later reader wants; the sentence stays product-agnostic. (absorbed from T-311-s7)

## Absorbed from T-311-s7 — a verdict whose heading carries its date at the end is invisible to the merge verb (kept whole)

Title as filed: "A verdict whose heading carries its date at the end is invisible to the merge verb — the newest-verdict reader wants the date first, the role file only says dated, and the T-311 merge stopped at the drill with the verdict in plain sight". Filed by the Claude seat after the T-311 merge on 2026-09-12; priority 1; fence tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md.

### T-311-s7's finding

The T-311 verifier appended its verdict under the card's `## Verdicts`
heading as `### APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent,
verifier phase 2, 2026-09-12`, which is dated and names its model and
session as the role file's step 5 asks ("dated, with your model@session").
The merge verb's newest-verdict reader matches a heading against a pattern
that requires the date at the start, after at most one capitalised word. So
the verb planned no correction step, and its drill refused with "the card's
`## Verdicts` section carries no dated `### ` entry" while the entry stood
one screen above the message. Every earlier verdict happened to spell the
date first.

The seat ruled through: correction 1's block was drilled by hand (RED under
its mutant, restored and proved by sha256), correction 2 applied and drilled
both ways, the readings and the message written by hand. That is the third
false stop of the verb in eight runs, and the second whose cause is a
reader narrower than the rule it enforces.

### T-311-s7's acceptance criteria (kept whole)

Moved on 2026-09-13, by the owner's ruling, into this card's `## Acceptance criteria` section above, unchanged and tagged with their source card, so that every reader, the preflight's coverage checks and the verifier's citations see one four-criterion contract; the finding above stays as history.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 2, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.

Ruling recorded 2026-09-13 (the owner, before this lane's stamp): the six live cards that spelled the criteria heading at depth three at this lane's base (T-299-s6, T-312, T-313, T-314, T-315, T-316) are repaired on the integration branch to the canonical depth two, no criteria text changed, in the same records commit as this line; the readers continue to accept both depths, and the known set the second criterion lists is the set measured at the lane's base, kept as an exclusion so a repaired card stays green and a new card at another depth reds by name.
