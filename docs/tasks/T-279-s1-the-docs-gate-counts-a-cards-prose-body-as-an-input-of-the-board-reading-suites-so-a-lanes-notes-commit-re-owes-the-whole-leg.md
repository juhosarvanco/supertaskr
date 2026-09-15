---
id: T-279-s1
title: "The docs gate counts ANY write under docs/tasks as an input of the board-reading suites, so a lane's own notes commit re-owes the twelve-minute end-to-end leg — measure which readers a body-only edit can move, and scope the trigger to those"
feature: F-04
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-279, 2026-09-09, at f88b289"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-279 orders a lane's last four moves so its owed suites run once. It
does not touch the reason the repeat was owed in the first place: ask
`docs-gate.mjs` about a single card path and it answers with three
suites — `npm test` from app/, `npm test` from tools/e2e/ and
`npx vitest run` from lib/parser/ — because fourteen readers are derived
as reading `docs/tasks` as a directory. Measured at f88b289 on this
card's own parent: one path under docs/, fourteen readers, three suites,
of which the tools/e2e leg is about twelve minutes.

The trigger is the DIRECTORY, so it cannot tell a frontmatter edit (the
board's own fields, which every one of those readers really does parse)
from a prose write into `## Implementation notes` (which nothing asserts
on). That is why the notes commit that ends every lane re-owes the whole
leg: the gate is answering a coarser question than the one the lane is
asking. The coarseness is not obviously wrong — `lib/parser`'s
`splitSections` parses the body into sections and `task-waves.ts` reads
`## Verdicts` REJECTED entries into the board's `rejected` count, so SOME
body writes really do move a reader's answer.

So this card is a MEASUREMENT before it is a change: for each of the
fourteen derived readers, which part of a card can move its answer —
frontmatter, a named body section, or any byte? Then scope the trigger to
what the measurement supports, and where the answer is "any byte", say so
and leave the trigger alone. A gate that fires on a wider trigger than it
can justify is still the safe direction, and this card is allowed to
conclude that.

## Acceptance criteria

- WHEN the docs gate is asked about a path under `docs/tasks` THE answer
  SHALL be derived from which PART of the card moved, and the derivation
  SHALL name, per reader, the part that reader can be moved by.
- WHEN a card write moves only prose inside a body section no derived
  reader asserts on THE gate SHALL name the suites still owed and the
  ones it can drop, with the reader that decided each.
- IF the measurement shows a reader whose answer can move on any byte of
  the file THEN the trigger for that reader SHALL stay the whole path,
  and the card SHALL record the reader by name rather than narrowing it.
- WHEN the scoping lands THE positive control SHALL be a frontmatter edit
  that still fires every suite the wide trigger fired, so the narrowing
  cannot be a gate that stopped firing.

## Re-triage, 2026-09-16 — with T-330's measurements, as the owner ruled

T-330 has landed and its figures are in. A card-only change — a card filed, or a card re-triaged — selects **three suites and 12 of 42 end-to-end spec files**, measured at the base and reproduced on the runner. The whole leg is 1215 bodies across 42 files; T-330's own narrowing for a configuration change is 1125 bodies across 22, so it drops 90 bodies, and every one of those 90 lies in a spec carrying no reference to the configuration.

WHAT THAT SETTLES FOR THIS CARD. The cost this card exists to remove is real but it is NOT the whole leg: a notes commit already selects twelve specs rather than forty-two, because the docs gate's reader map narrows it. What remains is whether those twelve are the right twelve for a change that touches only a card's prose, and that is a question about which observers a given PART of a card can move — which is this card's actual subject.

The caution from the earlier note stands and is now sharper: records are not uniformly inert, and T-330 demonstrated the shape of an answer — a reader map derived from the corpus rather than a hand-kept list, with a fail-closed answer for any input it cannot place. Whatever is proposed here should be derived the same way and should keep that fallback.

The priority is left where the owner set it; this note supplies the evidence the re-triage was to be made on, not a new ruling about when it runs.

## Triage note, 2026-09-15

Scheduled for re-triage on the owner's ruling of 2026-09-15, after the Codex orchestrator's faster-delivery review, USING T-330'S MEASUREMENTS: that card reports the checks selected and the elapsed time for a card-only change, which is the evidence this card's narrowing should be judged on rather than an estimate. The re-triage therefore happens at T-330's merge and not before.

A caution to carry into it: records are NOT universally inert. Verdict prose moves rejected counts, criteria and fences reach dispatch, an assignment or a grant reaches authority, and directory membership can reach the census. A narrowing that treats any write under the tasks directory as uniform would be wrong in the direction that loses coverage. Whatever part-aware selection is proposed has to show which observers a given part can actually move, and keep the conservative answer for consumers that read arbitrary text.

## Implementation notes

## Verdicts
