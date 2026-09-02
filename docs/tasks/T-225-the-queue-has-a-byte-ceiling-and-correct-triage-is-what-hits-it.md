---
id: T-225
title: THE QUEUE HAS A BYTE CEILING AND CORRECT TRIAGE IS WHAT HITS IT — promoting seven sound suggestions leaves 290 bytes of a 64 KiB buffer, so the board's capacity is now a function of the spawn buffer rather than of the work
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief-flush.spec.ts, tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/brief.spec.ts]
suggested_by: "the architect/integrator seat, 2026-09-01 — met during the triage sitting docs/STATE.md said was owed, measured rather than predicted"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**A TRIAGE SITTING WAS OWED, IT WAS CORRECT, AND THE BOARD COULD NOT
CARRY ITS RESULT.**

Measured at `a014b81`, three lanes live:

    brief.mjs --dispatch              60,731 bytes
    spawnSync buffer                  65,536 bytes
    margin                             4,805 bytes

    promoting 7 sound suggestions     +4,515 bytes
    margin after                         290 bytes

Seven cards in one cluster — `T-215`, `T-216`, `T-218`, `T-219`,
`T-222`, `T-223`, `T-224` — were triaged PROMOTE on their merits. Every
blocker had landed, every finding reproduced. **Four were promoted and
three were held, and the three were chosen by ARITHMETIC.**

## Why this is a defect and not a budget

The obvious reading is *the board is too full, prune it*. That reading is
wrong: **the queue's capacity is not a function of how much work
exists**, it is a function of how many bytes the brief prints per card
against a buffer size chosen by whoever called `spawnSync`.

### THE FIRST DIAGNOSIS ON THIS CARD WAS WRONG, AND THE MEASUREMENT IS KEPT

This card was filed saying the cluster overflowed because its TITLES are
long, and that *a cluster of seven short-titled cards would have fit* —
with the flourish that the ceiling therefore penalises exactly the
stating-the-finding titles this method requires. **It was an unmeasured
counterfactual and it is false.** Measured at `ed92057` across all 92
planned cards:

    title length, planned cards      min 32, median 169, max 250
    the seven in question, total     1,237 bytes
    seven MEDIAN-length titles       1,183 bytes
    difference                          54 bytes

    measured promotion cost          4,515 bytes  (~645 per card)
    of which title                                (~177 per card)

**Fifty-four bytes.** These seven are barely above median, and title
length accounts for about 1% of the overshoot. Seven median cards would
have overflowed too.

**THE REAL COST IS THE ~468 BYTES PER CARD THAT IS NOT TITLE** — the
per-row provenance the brief prints so that every figure names its
source. That is a feature of this tool, not an accident, and it is what
makes the ceiling arrive at ~100 dispatchable cards regardless of how
anybody writes.

So the defect is not that the method's titles are expensive. **It is that
a per-card cost the tool pays deliberately meets a buffer nobody chose
deliberately**, and the two were never reconciled.

The wrong version is kept rather than edited away because it changes what
a fix targets: shortening titles would have bought 54 bytes and felt like
progress.

## THE FAILURE IS SILENT, WHICH IS THE PART THAT COSTS

`spawnSync` truncates at the buffer and reports success. Earlier in this
same window a dispatch stamp moved two cards to `building`, grew the
brief past the boundary, and **reddened a lane's own gate** — a lane that
had touched nothing related, and that had to prove the red was not its
own. The margin is now the thinnest it has been while three lanes are
live.

## THE SHIPPED ORACLE AGREES, WHICH IS WHY THE FIGURES ABOVE ARE USABLE

Confirmed against `brief-flush.spec.ts`'s own disclosure at `4f3549f`,
443 passed, exit 0 — the guard computes this independently of the seat
that filed this card:

    --dispatch:              63,817 bytes,  1,719 UNDER the loss point
    --task T-133 --state:    55,692 bytes,  9,844 UNDER
    --task T-133:            47,289 bytes, 18,247 UNDER
    --state:                  8,402 bytes, 57,134 UNDER

**`--dispatch` is the only arm near its boundary, and it is the one a
dispatcher runs every time.** The other three have an order of magnitude
of room, so a fix must not be measured on them: an arm with 57 KiB spare
proves nothing about the arm with 1.7.

This section exists because a figure this seat measured earlier in the
same window did NOT reproduce against the shipped oracle — a `[bin]`
zero-path claim taken with the parser's component map where the oracle
uses `git ls-files`. These four agree, and that is stated rather than
assumed.

**AND NOTE WHERE THE DISCLOSURE LIVES.** The margin is computed by the
SPEC, not by the brief. A dispatcher who never runs e2e never sees it —
which is criterion 2 below, and is the difference between a measurement
that exists and one that reaches the person holding the decision.

## What a fix decides

1. **Whether `--dispatch` should stream rather than be buffered.** A
   reader that consumes the brief incrementally has no ceiling at all,
   and the buffer only exists because the caller chose to collect the
   whole output.
2. **Whether the queue view owes every planned card.** A dispatcher needs
   what is dispatchable NOW; a card blocked by a live lane is not. The
   filter is derivable — `T-209` already computes it — and it is the
   difference between a list that grows with the board and one that
   grows with the ready work. **The corrected measurement above makes
   this the strongest of the three**: at ~645 bytes per card, the ceiling
   sits near 100 dispatchable cards whatever anybody writes, and 92 are
   planned today. Filtering is the only lever that scales.
3. **What the tool does when it is near the boundary.** `T-167-s5`
   landed a headroom alarm for the graph budget and the shape transfers:
   the brief should DISCLOSE its own margin, so a reader meets the
   ceiling as a sentence rather than as a truncated line.

## Acceptance criteria

- THE dispatch brief SHALL NOT be silently truncated by its own caller's
  buffer, and a body SHALL prove it by driving the emitter with a board
  whose output EXCEEDS the buffer, requiring the full text to arrive.
- WHERE the brief approaches its boundary it SHALL DISCLOSE the margin in
  its own output, the way the graph budget already does.
- **A POSITIVE CONTROL SHALL prove the brief still emits a COMPLETE
  board** — an emitter made unbreakable by emitting less is the defect
  this card is about, and it would read as a fix on every measurement
  this card names.
- THE fix SHALL be measured on the REAL board at the ref it runs at,
  never on a synthesised one alone: the numbers above are what a live
  board did, and a fixture chosen to fit is not evidence about it.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Read beside

`T-197` (which built the flush guard and whose verifier established that
the synthesised arm carries the proof while the live arms announce an
approach), `T-220` (the margin guard, which reds on a board that MOVES
rather than one that overflows — the sibling failure at the same seam),
`T-167-s5` (the headroom alarm whose disclosure shape this card borrows),
and `T-209` (which already computes the dispatchable-now filter criterion
2 would need).

## The three cards this defect is currently holding

`T-215`, `T-218` and `T-219`, each carrying a dated triage paragraph
saying the disposition is PROMOTE and naming this card as the reason it
is not applied. **When this lands, promote them without re-triaging** —
their merits were settled on 2026-09-01 and nothing about them changed.

## Absorbs: T-197-s1 (2026-09-02)

Correct the two prose sites that say write SHAPE decides truncation loss —
T-197's implementation notes (a record: append the correction, never edit
it) and the comment in `tools/e2e/tests/brief-flush.spec.ts` — to say the
loss is decided by a SLOW READER: bytes are lost iff they are still
queued in userland when `process.exit()` runs. Measured by T-197's
verifier at ab873e0: 200 small console.logs lose 49 KB against a slow
reader and nothing against a fast one. Keep the one-long-line synthesis
exactly as it is. This card already opens that spec, so the rider costs
one comment.

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Fence narrowed at dispatch to six files by path**: the three scripts
that assemble and print the dispatch arm (`dispatch-order.mjs`,
`dispatch-brief.mjs`, `brief.mjs`) and the three specs that read them
(`brief-flush.spec.ts`, `dispatch-order.spec.ts`, `brief.spec.ts`).
T-223 released `dispatch-brief.mjs` at its merge; nothing live holds any
of the six.

**Audit (orchestrator 5b) — the card's mechanism is partly stale, and
the card is worth more, not less, for knowing it.** Since T-197 landed,
`brief.mjs` no longer exits before its stdout drains, and
`brief-flush.spec.ts`'s margin guard asserts that spawnSync receives
exactly what a file destination receives — PAST the loss point as well
as under it. Measured at 2489853 with four lanes in flight: `--dispatch`
printed 86,872 bytes against the 65,536-byte line, the guard disclosed
"PAST" and every body stayed green, and this seat's battery went green
three times at that size. So the truncation the card opens with no
longer occurs for a fast reader; what remains is exactly the card's own
three decisions — the SLOW-reader residual (decision 1), the
dispatchable-now filter that stops the print growing with the board
(decision 2, the one that scales), and the margin DISCLOSED in the
brief's own output rather than only in a spec (decision 3). Build to
those, and re-measure the size at your own ref rather than the card's.

**Absorbed rider T-197-s1** rides here because this lane opens
`brief-flush.spec.ts`: the two prose sites that say write SHAPE decides
the loss say SLOW READER instead, with T-197's notes corrected by an
appended line, never an edit.

**Holder**: this lane does NOT hold the integration checkout and does
not merge; it stamps `verifying`, reports ready-to-merge with branch and
tip, and leaves its worktree standing. Ceremony row M, guard-class,
review independent.

## Implementation notes

Lane `task/T-225-dispatch-byte-ceiling`, cut at `5f193e6` (the dispatch
stamp, not the newest Checkpoint — the brief's row 4 named
`43e776a` and the worktree was already sitting on `5f193e6`; T-233's
known defect, stated here because a figure carries the ref it was
measured at).

### The audit was right, and the card's opening no longer reproduces

Re-measured at `5f193e6` before a line was written, on the real board:

    --dispatch, three lanes live         85,818 bytes
    to a file                            85,818 — nothing lost
    through `| cat`                      85,818 — nothing lost
    through 4,096 bytes every 5 ms       85,818 — nothing lost, 3 runs

So criterion 1's silent truncation is discharged by T-197's landed work
for a fast reader AND, as of this lane's measurement, for a slow one.
What this card built is the residual the DISPATCH section named.

### Decision 3 — the margin, in the brief's own output

`marginRecs` and `withMargin` in `dispatch-brief.mjs`, in the shape
`nputer-index`'s `budget_line` uses: `output: X of Y bytes (P%) - N
left`, or `- OVER by N` with the sentence naming what changes past the
line, plus a per-unit density and the projection it implies. Three
choices worth the verifier's eye:

1. **It prints at every run**, near the line or far from it, because a
   disclosure that fires only in the bad case cannot be told from one
   that is broken. `budget_line`'s own reason.
2. **It prints FIRST.** A truncation eats the TAIL, so a margin line
   under an answer too big to arrive is lost in exactly the case it was
   written for. That is why `brief.mjs` now collects every arm and
   writes once, with the block ahead of it — and why the crash path
   flushes what was derived before printing its refusal, which the
   arm-by-arm printing used to give for free.
3. **The size it declares is the size it is**, at a fixed point that
   includes the block itself, so `brief.mjs --dispatch | wc -c` agrees
   with the number. The unsettled branch is honest and untested; routed
   as `T-225-s3`.

### Decision 2 — the dispatchable-now filter, and what the unfiltered view is for

The growth was never the card count alone. Each held card's REASON
re-enumerates every live lane and every path it holds, so the answer was
O(cards x lanes x paths). At `5f193e6` with three lanes the FENCED
section alone was 59,465 of 85,818 bytes over 60 cards — ~991 bytes each
against ~660 for the whole answer.

The default now spells out what a session could START and collapses
FENCED, WAITING and BLOCKED to one counted line each. **The counted line
names what a reader acts on rather than a bare number**: the LANES doing
the holding (free one and the whole set comes back) and the unmet
BLOCKERS (so the section header's promise that the blocker is named
still holds). Both grow with the work in flight, not with the board.

**Three sets stay in full at every verbosity, each for a reason.**
UNFENCEABLE is a REFUSAL and not a queue — no overlap proved and none
ruled out, and a count would hide the one state whose remedy is to go
and look. IN FLIGHT is bounded by the work under way. STARTABLE is the
answer.

**WHAT `--full` IS STILL FOR, said plainly because the card asks.** It
is the TRIAGE view, not a verbose one. *"What can I start?"* is the
dispatcher's question and the default answers it. *"Why can I not start
T-204, and which lane do I have to free to get it back?"* is the
question a triage sitting asks — this card exists because a triage
sitting could not carry its own result — and it is answered per card by
the sentence naming the exact shared paths. That sentence is the reason
this command exists at all: an architect who hand-rolled the fence
expansion reported two overlapping cards disjoint. It moved behind a
flag; it was not deleted.

Measured on the REAL board, ONE read of the worktree list feeding both
views (two live reads of a board the dispatcher is moving is `T-220`'s
own failure at this seam):

    at 5f193e685051, 2 lanes live
      unfiltered            77,133 bytes
      dispatchable-now      29,636 bytes
      saved                 47,497 over 55 fenced + 2 blocked cards
      ruled census          IDENTICAL in both views

### Decision 1 — the slow-reader residual

`brief-flush.spec.ts` gains a reader that PAUSES — 4,096 bytes every
5 ms — and drives the synthesised oversize invocation through it against
the destination that cannot lose.

**THE HARNESS IS THE FINDING WORTH READING.** The obvious build spawns
the command with a piped stdout, pauses that stream and reads it in
slices. **It loses bytes by itself**: measured at `5f193e6`, `/bin/cat`
of a 524,400-byte FILE read that way delivered **397,312** bytes, twice,
because node tears down a child's stdio when the child exits and the
readable buffer goes with it. A harness that drops data on a writer that
dropped none would have redded this body for its own reason and read as
a finding. So the slow reader is a SUBPROCESS on the far side of a real
pipeline, owning its own stdin — where a human's pager sits — and its
own integrity is control one of the body.

### The absorbed rider T-197-s1

The brief said two prose sites; **there are four**, and the coordinator
named the fourth before this lane found it. All four taken:

1. `brief-flush.spec.ts`'s header — *"a property of the WRITE SHAPE
   too … One write larger than a buffer is what loses"*.
2. Its body-one synthesis comment — the same inference, one level down.
3. Its `LIVE_ARMS` comment — *"harder to lose, never easier"*, which is
   hard-wrapped across a line break, so a one-line grep for it returns
   nothing and reads like a refutation. Search the COLLAPSED text.
4. `T-197`'s implementation notes — **an APPENDED correction section,
   nothing above it edited**, because a record takes the instance and a
   correction that rewrites the sentence it corrects destroys the
   evidence anybody believed it. That card's own verdict section already
   adjudicated it (*"TRUE AS MEASURED, FALSE AS GENERALISED"*), which is
   why the notes were the site that needed the line.

**And it is a BODY now, not a paragraph.** One pre-T-197 writer, 524,400
bytes as 200 small writes, at `5f193e6`:

    through `| cat`          524,400 arrive — 0 lost
    through the pauser        65,536 arrive — 458,864 lost

Same writer, same size, same shape, two readers. The write shape
explains none of it. The one-long-line synthesis is KEPT exactly as it
is — against two DRAINING readers it is still the most reliable
reproduction, which is a fact about those readers.

### The positive control the card asked for

`dispatchReport` now states what it RULED ON beside how much of it the
verbosity spells out, and `THE POSITIVE CONTROL` in
`dispatch-order.spec.ts` requires the ruled half to be IDENTICAL across
the two views and every ruled card to have a row in `--full`. An emitter
made smaller by ruling on less would read as a fix on every size this
card measures; this is the assertion that separates the two.

### For the verifier

- **Two assertions were RELAXED and it is on purpose.** `brief.mjs` now
  stamps a LIVE margin block on every arm, so `--audit`'s output is no
  longer byte-identical across two invocations. Body one and body four
  compare through `sameButTheClock`, which normalises the ISO timestamp
  and nothing else; the SIZES are still compared raw, so a byte lost
  inside the margin block reds exactly as one lost in the derivation.
- **`brief.spec.ts`'s T-179 sweep gained two allowlist entries** and one
  new positive control. The margin measures THIS INVOCATION's answer,
  and the `repository:` row the sweep already allows to move is one of
  the lines inside it — a size that did NOT move with a row it contains
  would be measuring something else. The new control requires the
  `output:` row to have moved exactly once, so the entry cannot be a
  dead one.
- **Two mutants SURVIVED and both are disclosed below.** The slow
  reader's two tuning constants are not load-bearing; its `pause()` +
  await loop is.
- **`capabilities:check` is STALE at this tip and was NOT regenerated**
  (T-210: the fence leaves `docs/CAPABILITIES.md` read-only, and the
  integrator regenerates in the merge commit). Committed 45,893 bytes,
  fresh 46,468 — three new test names.
- **Three e2e bodies red inside this lane and none is this diff's.**
  `lane-lock.spec.ts:428`, `token-scan.spec.ts:225` and
  `token-scan.spec.ts:356`, every one an `EACCES` on a tracked file
  outside this fence (`app/package.json`, `tools/e2e/fixtures/shell.ts`)
  — T-216-s4's finding, being fixed in its own lane. **Attributed by
  measurement rather than by assertion**: the same two spec files run
  23-for-23 at exit 0 in a DETACHED checkout of this lane's own tip,
  where the physical layer is not armed.

### The poison drill

Every mutant in a DETACHED scratch worktree at `/private/tmp/nd-T-225`,
cut at this lane's commit `5bb0aad`, with its own installs. One side
only, the mutation READ BACK with `git diff` before the suite ran,
restored with `git restore --source=5bb0aad --staged --worktree` and
proved by sha256 against `git show`. **The kill set is judged by
CONTAINMENT** over the three fenced specs (58 bodies, baseline exit 0).

| # | mutant, as it LANDED | killed |
|---|---|---|
| M1 | `process.exitCode = code` → `process.exit(code)` in brief.mjs | **4** — flush bodies one, two, three AND the new slow-reader body, which failed on `the SLOW reader lost bytes the file destination received`, 65,536 against 91,216 |
| M2 | the reader-integrity control's honest writer ends at `process.exit(0)` | **1** — the slow-reader body, on control one |
| M3 | `SLOW_DELAY_MS` 5 → 0 | **0 — SURVIVED** |
| M3b | `SLOW_CHUNK` 4,096 → 1,048,576 | **0 — SURVIVED** |
| M3c | control two reads with `readViaCatPipe` instead of the pauser | **1** — the slow-reader body |
| M4 | `withMargin` returns `body + text` (block at the foot) | **2** — both margin bodies |
| M5 | the fixed-point iteration returns on pass 0 | **2** — both margin bodies |
| M6 | `marginRecs`'s `bytes > buffer` → `false` | **1** — the two-arms body |
| M7 | the density line's guard → `if (false)` | **2** — both margin bodies |
| M8 | `dispatchReport`'s three `!ctx.full` → `false` (always unfiltered) | **2** — the filter body and the live-board body |
| M9 | the same three → `true` (always filtered) | **3** — filter, positive control, live board |
| M10b | the census's ruled half made a function of `ctx.full` | **1** — the positive control |
| M11 | `marginRecs` rounds its size to the nearest 10,000 | **3** — both margin bodies and the T-179 sweep's new control |

**THE TWO SURVIVORS ARE THE FINDING, AND THEY ARE NOT VACUITY.** M3 and
M3b move the slow reader's slice size and its delay and change nothing:
the reader loses to a pre-fix writer at 1 MiB slices with no delay at
all. **Its slowness is STRUCTURAL — `pause()` plus an event-loop turn
between reads — and the constants only tune how slow.** That is
robustness rather than a dead assertion, and M3c proves the reader
IDENTITY is load-bearing by swapping in the draining one and killing the
body. The constants are documented as tuning, not as the mechanism.

**TWO MUTATIONS DID NOT LAND AS TYPED AND THE READ-BACK CAUGHT BOTH.**
The first M10 attempt lost its `$` to perl interpolation and deleted the
fenced count instead of making it conditional; M10b appended rather than
replaced. Both are recorded as they LANDED, and both are still mutants
of the property under test. This is exactly why CONVENTIONS requires the
diff to be read rather than the substitution counted.

### Gates, derived from the merge forecast

Range rule, executor form, against `main` at `4a9c68c`:
`git merge-tree --write-tree` exit **0**, tree `16f34a9`, **9 paths**
(the 7 code/record paths plus this card and the four suggestions, all
under `docs/tasks/`).

- **GRAPH REGEN — FIRES** (`.ts` outside docs/, and `.mjs` is not in the
  trigger's suffix list). Asked rather than predicted.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**`,
  `app/src/**`, `app/package.json` or `app/src-tauri/Cargo.toml`.
- **DOCS GATE — FIRES.** `docs/tasks/T-197-*.md` and this card are flat
  `docs/tasks/T-*.md`, which the parser reads.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.

### Routed, not built

`T-225-s1` (the disclosure names one buffer; `spawnSync`'s is 1 MiB),
`T-225-s2` (`--task --state --full` is now the arm past the line and
nothing filters it), `T-225-s3` (the margin's unsettled fallback is a
branch no body drives), `T-225-s4` (CONVENTIONS and STATE send a seat to
`--dispatch` and name no `--full`; both are outside this fence).

### Where the brief was wrong

1. **Row 4's base.** It names `43e776a`, the newest Checkpoint. This
   lane's base is `5f193e6`, the dispatch stamp, which is where the
   worktree already sat — T-233's known defect, and the dispatch message
   said so.
2. **Rows measured at `5f193e6` have moved.** `main` is now `4a9c68c`;
   the lane list dropped from three live lanes to two while this lane
   ran (`T-216-s4` and `T-236` closed), which moved `--dispatch` from 31
   startable / 60 fenced to 36 / 55. Live facts, re-read rather than
   quoted.
3. **The rider's site count.** T-197-s1 says TWO prose sites; there are
   FOUR. All four are taken.
4. **The card's `spawnSync buffer 65,536`.** That is the PIPE buffer.
   `spawnSync`'s own `maxBuffer` defaults to 1 MiB — a different ceiling
   with a different failure (`ENOBUFS` on a field most callers never
   read). The measurements the card rests on are unaffected; the label
   is wrong, and `T-225-s1` is the card for it.
