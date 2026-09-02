---
id: T-225-s2
title: With the dispatchable-now filter landed, `--task` is the arm nearest the line and NOTHING filters it — `--task <id> --state --full` prints 74,439 bytes against a 65,536-byte buffer, and the row set grows with the documents rather than with the card
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
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

## Absorbs: T-225-s9 (2026-09-02, handed to this live lane at T-225-s1's verifier report)

The absence half is scoped to the line its key anchors, so a clause that is false about ONE caller survives on ANOTHER caller's line

**NOT A FAILURE OF T-225-s1, AND FILED SO IT IS NOT RE-DERIVED.** That
card's two rejections are both closed and drilled: the default is
bracketed from both sides to ±1, and `Claim` gained the `absent` half that
catches the retired clause restored beside the true text. This is a
THIRD-ORDER variant the fix does not reach, measured while confirming that
it does reach the first two.

`disagreements()` narrows the haystack to the line its `key` anchors —
which is SHAPE EIGHT's remedy and is right — and then asks both questions
of that line only. So a sentence about caller A, planted on caller B's
line, meets neither B's needles nor B's ban list.

Measured at `b1dc556`, one substitution in `dispatch-brief.mjs`, the
pipe-reader arm's tail `"on the tail"` extended to
`"on the tail, and spawnSync past its maxBuffer likewise receives a prefix
with no error"`. That clause is FALSE — the same run measures `ENOBUFS`,
`SIGTERM` and an overrun — and `brief.spec.ts` answers 4 passed on the
margin bodies, 39 passed whole. A neighbouring mutant that plants the
clause where it is TRUE but misplaced survives for the same reason, and
that one is only untidy.

**WHY IT WAS NOT A REJECTION.** The criterion the parent card carries is
that each named caller's own line agrees with what that caller was
measured doing, and it now does, on both questions, with two controls that
themselves red when disarm

## Implementation notes, 2026-09-02 — executor claude-opus-5@subagent

Branch `task/T-225-s2-arms-past-the-buffer`, cut at `09526da`. Every
figure below is at the ref it names.

### Every arm's bytes, before and after, at ONE HELD BOARD

The base was read in a DETACHED drill worktree `/private/tmp/nd-T-225-s2-base`
cut from `09526da`, and the diff was read in the lane IMMEDIATELY after,
so the two readings differ in the diff and in nothing else. The board
moves: `--task T-133` read 53,663 and then 53,682 bytes at one unchanged
ref twenty minutes apart, so an unbracketed before/after table is a
figure with no keeper in either direction. Bytes to a FILE destination,
exit read from `$?` unpiped.

    arm                            BEFORE     AFTER     delta   AFTER vs 65,536
    --dispatch                     38,036    38,333      +297    27,203 UNDER
    --dispatch --full             105,910   106,208      +298    40,672 PAST
    --task T-133                   53,682    41,281   -12,401    24,255 UNDER
    --task T-133 --state           64,943    52,551   -12,392    12,985 UNDER
    --task T-133 --state --full    82,479    59,168   -23,311     6,368 UNDER
    --task T-133 --role executor   53,682    41,281   -12,401    24,255 UNDER
    --task T-133 --preflight       83,021    70,665   -12,356     5,129 PAST
    --state                        12,393    12,690      +297    52,846 UNDER
    --card T-133                    4,867     5,156      +289    60,380 UNDER

**THREE ARMS WERE PAST THE LINE AND TWO ARE.** This card's own subject,
`--task <id> --state --full`, is 6,368 UNDER. The `+290`-ish on every arm
is the margin block's new own-cost line. What is still past is routed:
`T-225-s11` (`--preflight`, whose residual is the preflight's own
findings block, outside this fence) and `T-225-s12` (`--dispatch --full`,
the triage view, whose size is `dispatch-order.mjs`'s and outside this
fence).

### What was written, per absorbed card

**`T-215-s4` — the two long passages are CITED, not transcribed.**
`citedRule` in `dispatch-brief.mjs` replaces each with the file, the
passage's own opening capitals, its flattened size at this ref, and a
`command grep` whose needle is EXTENDED word by word only while the RAW
file still contains it — so a 70-column hard wrap cannot make the printed
command miss. Measured at `09526da`: rule four 12,984 bytes,
the lane bullet 10,078. **The brief was wrong about where rule four
prints** (below).

**`T-225-s8` — the block declares its own cost.** `withMargin` already
knows the derivation's size, so the split is exact and costs no second
fixed point: `this block: N of those bytes are this disclosure and M are
the derivation`, in both arms, with a `NOT COUNTED` sentence in the
unsettled fallback where the figure is the derivation's alone. The block
is 1,629 bytes of a 38,333-byte `--dispatch` answer at this tip. It is a
DISCLOSURE and not a deletion: the per-caller lines print in both arms on
the symmetry rule T-225-s1 landed, and removing them to save bytes would
breach it.

**`T-225-s7` — the arm list is compared to the command.** `LIVE_ARMS`
gains `--dispatch --full` and `--task <id> --preflight`; a new body
derives `brief.mjs`'s own `FLAGS` literal and reds on a flag nothing
announces; and the margin guard, which has the sizes, requires the
BIGGEST arm it measured to be a `--full` arm. The residual — a missing
COMBINATION of flags each covered elsewhere — is stated in the file and
routed as `T-225-s13`.

**`T-225-s6` — the writer's exit behind a reader that stops.** An
uncaught stdout `EPIPE` was a stack trace at exit 1, which is
`EXIT.FOUND`: a caller could not tell *"the repository disagrees with
something"* from *"you closed the pipe"*. `brief.mjs` now maps it to
`CANNOT_RUN`, whose own wording is *"this run is not a claim about the
repository at all"*. **The race is not ended and nothing here pretends
otherwise.** The new brief-flush body asserts the READER's side (a
prefix of at most one buffer, the reader clean), asserts that the
reachable SET excludes `FOUND` — derived from this run's own whole read
rather than typed — and DISCLOSES the writer's spread over five runs
asserting nothing about it. Measured in this lane: 12 hand runs of
`--dispatch --full | dd bs=65536 count=1` left the writer at 0 eleven
times and 3 once; the reader took exactly 65,536 in all twelve.

**`T-225-s9` — the absence half ranges over every line.** The carve-out
is DERIVED, never listed: a banned phrase is excused only where it sits
on another claim's own line AND that claim's own measured needles already
say it. A blanket ban reds the TRUE arm, because two claims are the same
caller under different limits — the default-maxBuffer line legitimately
says *"with no error"* and *"receives the whole answer"*, and the second
of those is now a MEASURED needle on that line for exactly this reason.
The card's own production mutant is drilled below as M7.

### Every command, in order, with its exit

     1  npm ci (tools/e2e)                                              0
     2  npm ci (app)                                                    0
     3  npm run build (app)                                             0
     4  npm run typecheck (tools/e2e), five times over the pass         0
     5  npx playwright test brief-flush.spec.ts                         0  (6 passed)
     6  npx playwright test brief.spec.ts                               0  (39 passed)
     7  npx playwright test brief.spec.ts (with the new bodies)         1  (2 failed — withMargin not yet wired)
     8  npx playwright test brief.spec.ts                               1  (1 failed — T-179 sweep, allowlist)
     9  npx playwright test brief.spec.ts brief-flush.spec.ts           0  (46 passed)
    10  git commit (implementation)                                     0  adc5596
    11  eleven drills M1..M11, each below                               1 each, by design
    12  the eleven CONVENTIONS reader specs                             0  (335 passed)
    13  node tools/e2e/scripts/gate-run.mjs parser                      0  GREEN bodies=363
    14  node tools/e2e/scripts/gate-run.mjs app                         0  GREEN bodies=1141
    15  node tools/e2e/scripts/gate-run.mjs rust                        0  GREEN bodies=639
    16  node tools/e2e/scripts/gate-run.mjs e2e                         1  RED bodies=607, 1 failed
    17  git commit (the guard's bracket)                                0  7dd1079
    18  cargo run -p nputer-index -- index --check --root ../..         0  CURRENT
    19  npm run capabilities:check                                      1  STALE, 51,025 -> 51,380
    20  git merge-tree --write-tree main HEAD                           0  tree b54a605

**COMMAND 16 IS THE ONE TO READ.** The e2e leg reddened on ONE body, the
margin guard, on `--task T-133 --preflight`: 66,800 bytes to the file
destination and 68,405 to `spawnSync` seconds later. **That is the board
moving mid-arm, not a flush**, and it is a defect I had introduced: that
arm sweeps every checkout on the machine and takes six seconds per read,
so it straddles any worktree another seat cuts. A body that reds when a
sibling lane is dispatched is a red on somebody else's work at
`retries: 0` — the shape `V-225` rejected T-225 for. Commit `7dd1079`
brackets the pipe read: on a disagreement a SECOND file read is taken and
the pipe read must match one of the two around it. A truncation matches
NEITHER, so the property is untouched, and the second read is never taken
on a quiet board.

### The drills — one side only, read back with `git diff`, restored by sha256

M1..M10 at `adc5596`, M11 at `7dd1079`. Each ran the two fenced readers
(46 bodies) and the kill set is the whole failing set, not a sample.

    id   file                site                                   kill set (of 46)
    M1   dispatch-brief.mjs  citation -> transcription              1  the CITED body
    M2   dispatch-brief.mjs  byte figure + 1                        1  the CITED body
    M3   dispatch-brief.mjs  needle wrap guard disarmed             1  the CITED body
    M4   dispatch-brief.mjs  block cost is not a split of the size  2  margin disclosure, BOTH arms
    M5   dispatch-brief.mjs  the uncounted arm goes silent          1  BOTH arms
    M6   brief.mjs           the EPIPE handler disarmed             1  the one-read body
    M7   dispatch-brief.mjs  the cross-caller clause planted        1  the OVER-arm body
    M8   brief.spec.ts       the cross-line pass disarmed           1  the OVER-arm body
    M9   brief.mjs           a flag nothing announces               1  the arm-coverage body
    M10  brief-flush.spec.ts the biggest arm dropped                1  the margin guard
    M11  brief.mjs           process.exit(code) restored            5  T-197's own set + OVER arm

**M7 IS `T-225-s9`'s OWN PRODUCTION MUTANT**, applied verbatim: the
pipe-reader arm's tail extended with *"and spawnSync past its maxBuffer
likewise receives a prefix with no error"*. That substitution passed
`brief.spec.ts` 39 of 39 at `b1dc556`; at this tip it reds by name.
**M8 IS THE OTHER HALF OF THE SAME CONTROL** — disarm the cross-line pass
and the planted clause stops being reported, which is the red-before to
M7's green-after.

**M9 RAN TWICE.** Its first run showed 2 failures, the second being the
margin guard on `--task T-133` with a 259-byte delta — the board moving,
the same artifact command 16 caught. Re-run alone: 1 failed, 45 passed.
The kill set above is the second run's. The board moved a great deal in
that window: `--dispatch --full` read 106,208, then 98,516, then 97,669
bytes at one ref.

RESTORATION, every drill: `git restore --source=<commit> --staged
--worktree -- <path>`, then `git show <commit>:<path> | shasum -a 256`
against the working file. All eleven matched, with an empty per-path
`git diff` as the companion and never as the proof:

    91f3d674b9ff2ed328d1f28799c51786663e78d28654e344d37237e69c4b9bff  dispatch-brief.mjs @ adc5596
    0270a75b43c0b96ee227c2a2dd6acdd22337a983e2a5f549ad046f128abf02d5  brief.mjs @ adc5596
    f8c76534f086a7603671b5de19d102347f50b4d7cb968663f63896a0faaeae41  brief.spec.ts @ adc5596
    c3b103f418f3837010d0dd0b607826035af3a1c41cfcc66844b998c8ea298519  brief-flush.spec.ts @ adc5596

The measurement worktree `/private/tmp/nd-T-225-s2-base` was detached at
`09526da`, carried two symlinks into the lane's built parser (both
gitignored paths), reported an EMPTY tracked status at removal, and was
removed with `git worktree remove --force`.

### Standing gates, derived on the merge forecast

`git merge-tree --write-tree main HEAD` exits 0 at tree `b54a605`;
`git diff --name-only main b54a605` returns the four fenced source paths
plus this card and the four routed suggestions once this commit lands.

- **GRAPH REGEN — FIRES** (the diff carries `*.ts` outside `docs/`), and
  the answer is a no-op by construction: `tools/` is `.nputerignore`d.
  ASKED rather than predicted — `index --check` exits **0**, CURRENT,
  1,170,079 of 2,145,959 bytes.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**`,
  `app/src/**` or either manifest, on a 9-path forecast.
- **DOCS GATE — FIRES** on `docs/tasks/*.md`. Asked with the forecast's
  own path list; the answer is in the report.
- **METHOD EVAL GATE — NOT OWED.** No `method/**` path.
- **CENSUS — STALE AND IT IS THE INTEGRATOR'S.** Three test names are
  ADDED, none renamed or removed; `capabilities:check` exits 1, committed
  51,025 bytes against a fresh 51,380. `npm run capabilities` belongs in
  the merge commit.

### Where the brief was wrong

1. **`T-215-s4` says `--full` prints both passages. Rule four prints in
   EVERY `--task` brief**, from `deriveProhibitions`, with no `--full` in
   sight — 12,984 bytes of a 41,281-byte default answer. The dispatch
   message repeated it (*"only how `--full` presents them moves"*). Both
   passages are now cited in every arm they appear in, because a `--full`
   view that printed LESS than the default would be incoherent, and
   because the card's own CORROBORATION names `--preflight`, which never
   passes `--full`.
2. **`disagreements()` is in `tools/e2e/tests/brief.spec.ts`, not in
   `dispatch-brief.mjs`** as the T-225-s9 hand-off said. Both are in the
   fence, so the ask was buildable as written.
3. **Row 4 of the assembled brief gives the base as `5d3d516`**, which is
   not this lane's base; the worktree's HEAD `09526da` is, as the
   dispatch message warned (T-233's known defect).
4. **The brief's arm list asks for `--role executor` and `--preflight` as
   arms.** Neither stands alone — `brief.mjs` answers `USAGE` for a
   request with no card — so both were measured as `--task T-133 --role
   executor` and `--task T-133 --preflight`.
5. **The dispatching seat's own figures differ from this lane's** for the
   same reason the table above is bracketed: `--task <id> --state --full`
   80,715 against 82,479, `--preflight` 73,212 against 83,021. Neither is
   wrong; the board is a third party to both.

### For the verifier

- The one-read body's control writer is sized at **three** buffers, not
  two, and the comment says why: at two the writer can push the rest into
  a drained kernel buffer and leave cleanly, which is why the live arm's
  spread is 11-to-1 rather than 0-to-12. At three the `EPIPE` is a
  certainty and the control is a control rather than a second sample of
  the race.
- The margin guard's bracket is the one place an assertion was LOOSENED.
  M11 shows it still kills the flush defect.
- `--dispatch --full` and `--task <id> --preflight` add about 30 seconds
  to the e2e lane. The seconds band is already breached (`T-120-s2`).

### Addendum, same sitting — the docs gate caught one of mine

`docs-gate.mjs` on the resolved forecast answered exit **1** and named
`T-225-s12`'s own frontmatter: its `title:` opened with a backtick, so
the card did not parse as YAML. That is the `9c64cd8` incident this
project already paid for — *two card titles opening with a backtick,
both cards silently unparseable, four bodies red* — reproduced by the
lane that quotes it. Repaired in the same sitting by moving the backticked
command out of the title's first position; all four routed cards then
parse, and the gate's remaining answer is the three suites it names.

**AND THE MERGE FORECAST IS A CONFLICT, WHICH IS THE ANSWER AND NOT A
FAILURE.** `git merge-tree --write-tree main HEAD` exits **1** and prints
a CONFLICT report for this card: `main` gained the `## Absorbs: T-225-s9`
section as its own commit after this lane's base, and the lane committed
the same text from its worktree. The two sides added the same lines to a
base that had neither. **The lane's copy is main's card byte for byte
plus the `verifying` stamp and these notes** — verified by comparing the
first 209 lines of each, which differ on the status line alone — so the
resolution is to take the lane's side, and it is stated here rather than
left for the integrator to derive under a merge marker. The forecast in
the gate section above was built on the RESOLVED tree with a scratch
index (`git read-tree -m --aggressive`, one `update-index --cacheinfo`,
`git write-tree`), which moves no ref and is a real tree rather than a
proxy: `259e3ad`, 9 paths.
