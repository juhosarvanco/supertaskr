---
id: T-159-s4
title: The stage-0 banking row and the brief's row-3 subtraction are the two arms T-159 could not reach, and both live one directory outside the canonical bump fence
status: suggested
suggested_by: executor claude-opus-5@subagent @T-159
touches: [method/interview/plan-interview.md, app/src/genesis/genesis-derive.ts, app/test/genesis-derive.test.ts, tools/e2e/scripts/dispatch-brief.mjs]
---

**CLASS PARENT: `T-132-s2`** — *"`method/` is not a category; the test
is per-path"*. Both arms below are that finding one file deeper: the
boundary runs through `method/interview/plan-interview.md` itself, so
the version stamp in its heading and a cell of its table answer to
different fences.

**DISPOSITION HINT: promote as one size-S card — the two arms are
independent and both are small, and arm A is a two-line edit whose
whole cost is that it spans two packages.**

## ARM A — the stage-0 banking cell, WITHDRAWN AT T-159 AND MEASURED

`T-124-s1`'s second half asked for one clause appended to the stage-0
row of plan-interview.md's banking map:

> ; git run bare in the cwd, files written with the write tool

T-159 wrote it, and the app suite went **1 failed / 1014 passed, exit
1**: `BANKING_MAP` in `app/src/genesis/genesis-derive.ts` is a verbatim
transcription of that table and
`every_cell_of_the_9_row_table_matches_plan_interview_md_verbatim` in
`app/test/genesis-derive.test.ts` asserts it cell by cell. **Neither
file is inside `[method/, docs/CONVENTIONS.md, app-agent]`**, which is
the canonical bump fence and the one a bump card is given. The clause
was withdrawn rather than the fence widened from inside the lane, and
the CONVENTIONS gotcha now names this reader so the next bump meets it
as a sentence instead of as a red.

**`T-124-s1`'s FIRST half DID land** — the bare-git and write-tool
spellings are in `method/roles/planner.md` step 1 at v0.1.8, generalised
off the one CLI whose refusals produced them, as that card's own
caution asked. **So the rule is stated and only the interview file's
echo of it is missing**, which is why this is a suggestion and not a
regression.

**The taker's real question is whether the echo is wanted at all.** The
row is a BANKING map — which artifacts a stage writes — and a spelling
about how to touch the disk is arguably not banking. Answering "no" and
recording it discharges this arm at zero cost.

## ARM B — the brief's row 3 still prints the list it was told to filter

At v0.1.8 row 3 of the brief contract says the read-first set is the
adapter's list **minus the role file's own subtractions**, and that the
role file wins. `tools/e2e/scripts/dispatch-brief.mjs` prints the new
rule text — it is column three, transcribed — **and then prints the
unfiltered list underneath it.** Derive it: `node
tools/e2e/scripts/brief.mjs --task <any card>` and read row 3, where
`CLAUDE.md names:` still ends in `docs/ROADMAP.md` for an executor
whose role file subtracts it by name four rows earlier.

**This is the arm `T-155-s4` called the only one that cannot go stale**,
and it is outside T-159's fence because it is code. The shape: when
assembling row 3, apply the reading step of `ctx.role`'s own file to
the adapter's list, and PRINT WHAT IT SUBTRACTED rather than silently
shortening — a row that quietly drops a document is a different failure
from one that names it.

**And there is an eval half worth taking in the same pass.** `MF-01`
requires every contract row to be DERIVED; it cannot yet ask whether
two derived rows CONTRADICT each other, which is exactly the class here
— a brief that is internally inconsistent while every row is
individually faithful to its source. A worked instance is in hand,
which is the cheapest moment such a check ever gets.
