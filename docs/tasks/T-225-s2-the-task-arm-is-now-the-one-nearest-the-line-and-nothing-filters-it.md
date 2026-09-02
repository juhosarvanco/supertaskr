---
id: T-225-s2
title: With the dispatchable-now filter landed, `--task` is the arm nearest the line and NOTHING filters it — `--task <id> --state --full` prints 74,439 bytes against a 65,536-byte buffer, and the row set grows with the documents rather than with the card
feature: F-06
milestone: 4
priority: 3
size: M
status: planned
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder:
verifier:
built_by:
verified_by:
review: independent
---

**T-225 MOVED THE CEILING OFF `--dispatch` AND ONTO THE ARM BESIDE IT.**
Measured by `tests/brief-flush.spec.ts`'s own margin guard at
`5f193e6`, after that card's filter landed, against a loss point of
65,536 derived in the same run for `spawnSync`:

    --dispatch                     30,185 bytes,  35,351 UNDER
    --task T-133 --state --full    74,439 bytes,   8,903 PAST
    --task T-133 --state           57,463 bytes,   8,073 UNDER
    --task T-133                   48,406 bytes,  17,130 UNDER
    --state                         9,396 bytes,  56,140 UNDER
    --card T-133                    4,164 bytes,  61,372 UNDER

**ONE ARM IS PAST THE LINE AND IT IS NOT THE ONE THAT CARD WAS ABOUT.**
The guard has been announcing this shape since T-197 built it; T-225
answered the arm whose size was a function of the BOARD and left
untouched the arm whose size is a function of the DOCUMENTS it
transcribes.

**AND THE TWO GROW FOR DIFFERENT REASONS, WHICH IS WHY THE SAME FIX DOES
NOT APPLY.** `--dispatch` grew with the card count, so a
dispatchable-now filter shrank it and the sets it dropped are answered by
`--full`. `--task` grows with the LENGTH of the rules it transcribes —
`lane-protocol.md` rule four alone is a screen of prose, quoted verbatim
under row 10 because *"a brief is a TRANSCRIPTION, not a summary"*
(`method/roles/executor.md`). **A filter on that arm is a filter on a
contract**, and the row set is exactly the thing the brief may not
abbreviate.

**WHAT A FIX WOULD HAVE TO DECIDE**, and none of it is an executor's
call from inside a fence:

1. Whether `--full` should be the DEFAULT-OFF dial for the prose halves
   it already gates, and whether the un-`--full` arm is then a brief at
   all under row 3's own reading.
2. Whether a row may cite a rule BY PATH AND ORDINAL rather than quoting
   it — which `docs/CONVENTIONS.md`'s A CITATION NAMES A SYMBOL, NOT A
   LINE would bless, and which the brief contract's transcription rule
   would not.
3. Whether the answer is not a filter at all but the disclosure T-225
   landed, on the grounds that a reader who is TOLD is no longer being
   silently truncated — which is what the margin block now says on every
   run.

**THE CHEAP HALF IS ALREADY DONE AND SHOULD BE STATED WHEN THIS IS
TRIAGED**: the disclosure T-225 landed prints `OVER by 8,903` on that
invocation, so the failure is no longer silent. This card is about
whether the arm should be smaller, not about whether the reader is
warned.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, size M

The architect seat, at the stamp of T-225's merge (7435eae). Measured by
the lane's own margin guard: `--task <id> --state --full` is past the
`spawnSync` line today and the row set grows with the board, so the
ceiling T-225 moved off `--dispatch` now sits on the arm every executor
reads. Serialises behind T-225-s1 on dispatch-brief.mjs and brief.spec.ts.
