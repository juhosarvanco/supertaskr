---
id: T-225-s2
title: With the dispatchable-now filter landed, `--task` is the arm nearest the line and NOTHING filters it — `--task <id> --state --full` prints 74,439 bytes against a 65,536-byte buffer, and the row set grows with the documents rather than with the card
feature: F-06
milestone: 4
priority: 2
size: M
status: building
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

## CORROBORATION, 2026-09-02 — the `--preflight` arm is past the line too

Measured at the dispatch of T-018-s5 (a03259f): `brief.mjs --task
T-018-s5 --preflight` printed 68,078 bytes, OVER the 65,536-byte buffer by
2,542, disclosed by its own margin block. The seat read it through a file
redirect and lost nothing; a `spawnSync` caller would have received a
prefix. Same class as `--task --state --full`; the row set grows with the
board and the preflight carries the whole row set plus its findings.

## Absorbs: T-215-s4 (2026-09-02), priority raised to 2

At T-215's merge (c8f69aa). `brief.mjs --full` prints the LANE PROTOCOL
bullet and lane-protocol rule 4 VERBATIM — 22.5 KB of a 66 KB answer —
so any correction to either pushes the triage view past the buffer, and
T-215 measured it at 68,031 before recompressing to 66,265. The same
class as this card's `--task --state --full` overflow; the fence gains
brief.mjs, and the lane SHALL cite the two bullets by ref and section in
`--full` rather than printing them, or split the arm — with the byte
count of every arm printed before and after at its ref.

## TRIAGE, 2026-09-02 — dispatched at T-225-s1's merge (81604e6), absorbing three more

The architect seat. T-225-s1 landed the margin's callers; this card owns the arms past the buffer, and the three residuals T-225-s1's lane filed are the same class, in the same four files.

## Absorbs: T-225-s6 (2026-09-02)

The writer's own exit behind a reader that stops after ONE read is a RACE, and the one fact a caller would reach for — "it exited 0, so nothing was cut" — is the unreliable one

**Class parent: `T-197`** (the brief reaches a pipe whole), whose bodies
all drive readers that DRAIN. The reader that stops early is the one
shape none of them covers, and it is the shape a human uses: `| head`,
`| dd`, a pager closed on the first screen.

**MEASURED AT `482be56`**, on `Mac.lan`, node v22.22.0.
`brief.mjs --dispatch --full` piped into `dd bs=65536 count=1` leaves the
WRITER at exit **0** in six hand runs and on the dispatching seat's own
bench — and at exit **1** on the first loaded run of `T-225-s1`'s new
OVER-arm body, which is what caught it. Whether the `EPIPE` from the
closed pipe reaches node before the process ends is timing, not a
property.

**WHY IT IS WORTH A CARD.** The READER's side is stable and is what
`T-225-s1`'s disclosure now claims: at most one buffer, no error, the cut
invisible. The WRITER's side is what a script would test — *"the command
exited 0, so I got everything"* — and it is exactly the half that flips
under load. Nothing in the tree records this today, and `T-225-s1` had to
delete the claim from both its sentence and its assertion after measuring
it.

**WHAT A FIX WOULD DECIDE.** Whether `brief-flush.spec.ts` gains a fourth
reader sha

## Absorbs: T-225-s7 (2026-09-02)

The margin guard announces six live arms and not the seventh, which is the biggest one there is and the view T-225 made the triage default

**Class parent: `T-197`/`T-225`.** `LIVE_ARMS` in
`tools/e2e/tests/brief-flush.spec.ts` enumerates six invocations and
announces each one's size against a loss point derived in the same run —
*"the failure this guard exists for is an approach nobody could see"*.

**`--dispatch --full` IS NOT IN THAT LIST.** Measured at `482be56` on
`Mac.lan` it renders **119,809 bytes**, about 183% of one pipe buffer,
where every arm the list does carry sits near or under it. It is also the
arm the project reads most deliberately: since T-225 it is the TRIAGE
view (docs/STATE.md's "TRIAGE IS OWED AT THE STAMP"), so the arm most
likely to meet a ceiling is the one the guard never mentions.

**AND THE OMISSION IS SILENT BY CONSTRUCTION**, which is what makes it
worth a card rather than a one-line addition somebody remembers: the list
is a hand-kept enumeration, and nothing compares it to the flag set
`brief.mjs` actually accepts. The same shape as every stale enumeration
this project has paid for.

**WHAT A FIX WOULD DECIDE.** Whether the arm list gains one row, or
whether it is DERIVED from the command's own flags so a seventh arm
cannot be forgotten again. The second is the standing preference here

## Absorbs: T-225-s8 (2026-09-02)

The margin block's own cost grew by 799 bytes under the line, in the one command whose scarce resource its parent card proved is bytes

**A DECISION FOR TRIAGE, NOT A DEFECT**, filed by the lane that made the
change rather than left for somebody to discover in a size report.

**MEASURED AT `482be56`** against `fb2a944`'s module, rendering at a
fixed size and a fixed clock so nothing but the prose moves: the UNDER
arm's block went **342 → 1,141 bytes (+799)** and the OVER arm's
**500 → 2,183 (+1,683)**. Every `--task` brief and every `--state`
answer now carries the UNDER figure.

**WHY IT MIGHT BE TOO MUCH.** `T-225` exists because this command's own
size decided a triage sitting — seven cards promoted on their merits and
three held BY ARITHMETIC. Adding ~800 bytes to every answer spends the
resource the block was built to disclose.

**WHY IT WAS SPENT ANYWAY.** The UNDER arm's share of the cost is one
line saying what each named caller does BELOW the line — which is
nothing. It is there on the symmetry rule this block already stands on:
*a disclosure that appears only past some threshold cannot be told from
one that is broken.* `T-225-s1` read that rule as binding on the arms as
well as on the block, and that reading is arguable in both directions.

**WHAT A FIX WOULD DECIDE.** Whether the per-caller line belongs 
