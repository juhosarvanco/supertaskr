---
id: T-297-s4
title: "The readings owe a ratified verdict outcome and a CI-red count — the two fields loop/soft-verifier is wired for and waiting on, and the same debt north-star/rejection-rate-by-size has carried since T-156"
feature: F-06
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-297, 2026-09-10"
blocked_by: []
touches: [method/tasks/TASK-FORMAT.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`loop/soft-verifier` compares two checkpoint windows and flags a tier
whose rejections fell to zero while its CI reds rose. The comparison is
built, is driven by the suite on a planted history, and reads UNREAD at
every ref, because no capture stamps either number where a program can
find it. This is the same debt `north-star/rejection-rate-by-size` was
declared UNKEPT for: verdict outcomes on this board are free prose, and
`tools/e2e/scripts/health-bands.config.mjs` records the attempt that
measured that corpus and refused it.

Two things close it. The METHOD ratifies a verdict outcome marker a
program can read off a card, which is what T-156-s2 already routes; and
the merge verb copies that outcome, plus the count of CI reds attributed
to the card, onto every reading it appends. While the block's vocabulary
is open, add the second half of the same class: a `## Meters` block has
no stated fields, so a seat can omit its token figure and the band goes
dark rather than the report being refused — T-296's executor block did
exactly that, which is why `loop/token-budget-used` is unread at the ref
this card was filed from.

## Acceptance criteria

- WHEN a verdict is written THE outcome SHALL be carried in a marker the method ratifies, and a program SHALL read it off the card without parsing prose.
- WHEN the merge appends a reading THE line SHALL carry that outcome and the count of CI reds attributed to the card.
- WHEN a `## Meters` block omits a field the bands read THE arm SHALL say which seat omitted which field, at the merge, rather than letting the band go dark two windows later.
