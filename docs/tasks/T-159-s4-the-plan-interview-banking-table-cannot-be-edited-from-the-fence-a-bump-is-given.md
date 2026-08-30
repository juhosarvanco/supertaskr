---
id: T-159-s4
title: The stage-0 banking row and the brief's row-3 subtraction are the two arms T-159 could not reach, and both live one directory outside the canonical bump fence
feature: F-01
milestone: 4
priority: 13
size: M
status: planned
blocked_by: []
touches: [method/interview/plan-interview.md, app/src/genesis/genesis-derive.ts, app/test/genesis-derive.test.ts, tools/e2e/scripts/dispatch-brief.mjs]
suggested_by: executor claude-opus-5@subagent @T-159
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30, and it ABSORBS the surviving half of T-155-s4 — because the two are the same contradiction, filed from opposite ends, five days apart.**

Two arms, both re-derived at this ref, both HOLD:

**Arm A — the stage-0 banking row.** `grep -n "bare\|write tool"
method/interview/plan-interview.md` returns zero rows; the banking
table's stage-0 cell (line 36) ends at `docs/STATE.md stamped` with no
git/write-tool clause. The clause exists in `method/roles/planner.md`
step 1 and has no banking-table counterpart. Its whole cost is that it
spans two packages, because a verbatim transcription of that table lives
in `app/src/genesis/genesis-derive.ts` with a test pinning it.

**Arm B — row 3 prints the rule and then violates it.**
`deriveReadFirst()` (`dispatch-brief.mjs:1197-1232`) regex-scrapes
`docs/*.md` out of the root adapter and emits the list; **`ctx.role`'s
file is never consulted.** The only role-aware branch is a disagreement
check between the two root adapters. Meanwhile `method/roles/executor.md`
row 3 now demands *"MINUS this role file's own subtractions ... where they
differ the ROLE FILE WINS"* — and `docs/ROADMAP.md` is still in the
printed list for the executor seat, whose role file subtracts it by name
at line 9.

**WHY THE ABSORPTION IS CORRECT AND NOT MERELY TIDY.** T-155-s4 was filed
as *"the executor is told to read a document its own role file subtracts
by name"*, and its central claim has FALLEN: the precedence rule it asked
for landed at `9c0da79` (T-159), taken as its own arm 1 — row 3's column
three now carries the clause and its column-four failure mode is that
card's own sentence. What survives is its arm 3, *"brief.mjs subtracts,
per role, when it assembles row 3 — the only one with a mechanical
reader"*. That is arm B above, word for word. The contradiction is now
ARGUED rather than MECHANICAL, which is a smaller card than either was
filed as, and one lane's work.

Absorbs: T-155-s4 (Standing triage 2026-08-30 (architect seat)) — the executor is told to read a document its own role file subtracts by name. CENTRAL CLAIM DISCHARGED at `9c0da79` — the precedence rule now exists in `method/roles/executor.md` row 3, taken as this card's own preferred arm 1, and its column-four failure mode is quoted from this card. The SURVIVING half is its arm 3, the mechanical subtraction in the brief assembler, which is this card's arm B; and its eval-fodder note (MF-01 cannot ask whether two derived rows contradict each other) rides with it as a criterion. Recorded as a partial discharge rather than a full one, so the next reader can see which half the release paid for. File removed in this commit.

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
