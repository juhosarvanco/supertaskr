---
id: T-225
title: THE QUEUE HAS A BYTE CEILING AND CORRECT TRIAGE IS WHAT HITS IT — promoting seven sound suggestions leaves 290 bytes of a 64 KiB buffer, so the board's capacity is now a function of the spawn buffer rather than of the work
feature: F-06
milestone: 4
priority: 2
size: M
status: done
blocked_by: []
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief-flush.spec.ts, tools/e2e/tests/dispatch-order.spec.ts, tools/e2e/tests/brief.spec.ts]
suggested_by: "the architect/integrator seat, 2026-09-01 — met during the triage sitting docs/STATE.md said was owed, measured rather than predicted"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

## FIX PASS, 2026-09-02 — V-225's F1, and the census figure corrected

**APPENDED, NOTHING ABOVE IT EDITED** — the same rule this lane applied
to `T-197`'s notes, turned on its own. Two figures above are now known
wrong and the corrections are here rather than in place, because a
record that rewrites itself destroys the evidence anybody believed it.

### F1 — control two asserted the outcome of a race

**The finding is right and I do not contest any part of it.**
`brief-flush.spec.ts` body four's control two required `| cat` to
receive all 524,400 bytes from a pre-T-197 writer:

    expect(fast.bytes, "a DRAINING reader lost bytes …").toBe(smallWant);

That is who wins a race, not a property. V-225 measured 1 of 25 runs
short on a quiet machine, 16 of 25 at six busy cores, and — the part
that settles it — **one real suite red while an unrelated mutant of
`dispatch-order.mjs` was applied**, a file that body cannot reach. At
`retries: 0` on a shared runner such a red arrives on somebody else's
work, carrying a message about write shape, in the file whose subject is
write shape. **And the asymmetry was the tell I missed**: this body's
header argues at length that control ONE is owed because *"a harness
that drops data on a writer that dropped none would red this body for
its own reason and read as a finding"* — and then asserted exactly that
about the fast reader instead of proving it.

**THE REMEDY, AND WHY IT IS STRONGER THAN THE ONE THE VERDICT NAMES.**
V-225 offered three: assert `fast > slow`, derive the fast arm in-run as
`deriveLossPoint` derives the slow one, or keep the equality and
`disclose()` the shortfall. **I took the second and the third together,
and the assertion is the first over the derived value** — because the
verdict's own leading option, taken alone, is still one sample of a
race. Under sustained load `cat` reaches the pauser's own floor of one
pipe buffer: that is precisely what V-225's spurious red was, `Expected:
524400  Received: 65536`, and against a `slow` that also sat at 65,536 a
single `fast > slow` would have redded too. So:

    slow.bytes < smallWant           asserted — a PROPERTY: a reader
                                     that pauses cannot drain half a
                                     megabyte before a burst writer exits
    fastBest > slow.bytes            asserted — the DISCRIMINATION the
                                     argument actually makes, over the
                                     BEST of FAST_SAMPLES runs
    "a draining reader loses NOTHING"  DISCLOSED with its full spread,
                                     no longer asserted

The MAX is the mirror of `deriveLossPoint`'s MIN one screen down, and
the same argument turned around: that function takes the conservative
end of a spread because it announces a margin against it, and here the
claim is *this reader CAN keep up*, whose conservative end is the
maximum. Failing now requires **every** sample to be as bad as the
pauser, which is a strictly weaker event than any one of them being.

**MEASURED UNDER THE VERIFIER'S OWN CONDITION**, six busy cores, body
four alone, at `eb05606`: **8 runs, 8 passed, 0 failed.** The disclosure
caught the class live in that batch — one run's spread carried a
**191,392**-byte draining sample that the old equality would have redded
on, and one run's pauser took **152,062** rather than 65,536, which is
why no bound is asserted on the pauser's arrival either.

### The fix pass's own drill

Detached scratch worktree `/private/tmp/nd-T-225-fix` at `f16f019`, own
installs; one side only, mutation read back from `git diff`, restored by
`git restore --source=f16f019 --staged --worktree` and proved by sha256
(both files byte-identical, no residual dirt).

| # | mutant | killed |
|---|---|---|
| FX1 | the control writer FLUSHES (`process.exitCode = 0`) — nothing left to discriminate | **3**, body four failing on *"the reader that PAUSES lost nothing from a pre-T-197 writer at this size"* |
| FX2 | the fast arm reads with the PAUSER — two identical readers | **1**, body four failing on *"not one of 5 runs of the DRAINING reader took more … than the reader that pauses did"* |
| FX3 | `process.exitCode = code` → `process.exit(code)` in brief.mjs | **4**, body four still failing on *"the SLOW reader lost bytes the file destination received"* |

FX1 and FX2 are the two directions the control has to separate — a
writer that flushes, and a reader that does not drain — and FX3 shows
the proof it guards still reds against the card's own defect.

### The census figure, corrected

The notes above say `capabilities:check` is stale by **three** new test
names. **It is SIX** — V-225 derived it and I take the correction as
read: six `test(` names added, none removed, census 45,893 → 46,468
bytes, suite 553 bodies against a committed 547. The fix pass adds no
test body, so six stands at this tip. Not regenerating in the lane
remains correct (T-210 leaves `docs/CAPABILITIES.md` read-only inside a
fence); **the integrator carries SIX into the merge commit.**

### And the OVER arm's sentence, corroborated against

V-225 appended a dated corroboration to `T-225-s1` that sharpens it from
*the label is wrong* to *the sentence the tool PRINTS is false*: at
`b5d015b`, `spawnSync` with `maxBuffer: 65536` over `--dispatch --full`
returns **the whole 102,752 bytes** with `status: null`, `signal:
SIGTERM` and `error.code: ENOBUFS` — not *"receives a prefix with no
error"*, which is what the margin block's OVER arm tells a dispatcher.
**I concur, and I did not fix it here**: the fix pass's mandate is F1,
the OVER arm's wording is a producer change, and `T-225-s1` now carries
both the class and the measurement. Whoever takes s1 should change that
clause, not only add a second reference point.

## Verdicts

### V-225, 2026-09-02 — claude-opus-5@subagent (verifier bench `../nputer-V-T-225`, detached at `b5d015b`)

**REJECTED**, on ONE finding in one new test body. Everything else in
this diff is sound, and several parts answer the card better than it
asked. The remedy is two lines, touches no producer, and does not touch
the proof this body carries.

**MY BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINARY.** Phase 1 reached me
before the work existed (orchestrator 5c), so there was no diff to
decline to read. The attack set and the ground truth were written and
hashed at the base ref `5f193e6` on 2026-09-02 at 00:03–00:13Z, BEFORE
this lane's first commit:

    fd8f255a2f20566fba3918bde51d33f117561b72907a0b7caa782c77682e1518  attack-V-T-225.md
    709f2046ab0f25f188a5425e86df8e6e6817ee67e96edfe6efa06ae12cbc08d3  ground-V-T-225.md
    c56d05335b106c7398684c36605543a64519522610ccbbf9222306641d466b75  verdict-draft-V-T-225.md

The verdict draft above was stamped at 01:24:55Z, **before** the
implementation notes or any suggestion card was opened. What I read
afterwards, disclosed: the notes, the four suggestion cards, and — this
one unavoidably and early — the four suggestion FILENAMES, which are
descriptive and appeared in the first `git diff --stat`. My phase-2
brief also carried executor-derived specifics (a harness bug, "two
disclosed surviving mutants", red-body attributions, a census figure);
that is above the line for phase 1 and phase 1 was already closed and
hashed, but it is said rather than left for a reader to wonder about.

---

#### THE FINDING — F1, blocking

**`tools/e2e/tests/brief-flush.spec.ts`, body four's CONTROL TWO asserts
the outcome of a race, in the direction machine load pushes it.**

    expect(
      fast.bytes,
      "a DRAINING reader lost bytes from two hundred small writes, so this run cannot show that " +
        "the write shape is not what decides the loss",
    ).toBe(smallWant);

`fast` is `readViaCatPipe` over `controlWriter(CONTROL_WANT, 200)` — a
pre-T-197 writer emitting 524,400 bytes in 200 small writes and then
calling `process.exit(0)`. The body requires `| cat` to receive **all**
524,400. That is not a property; it is who wins a race, and `cat` loses
it often enough to matter.

**Reproduce** (no repository state needed; the writer is
`controlWriter`'s output, transcribed):

    cat > /tmp/w.mjs <<'EOF'
    for (let i = 0; i < 200; i += 1) process.stdout.write("c".repeat(2621) + "\n");
    process.exit(0);
    EOF
    node /tmp/w.mjs > /tmp/ref.txt          # 524400 — a file cannot lose
    for i in $(seq 25); do node /tmp/w.mjs | cat | wc -c; done

**Measured in my bench at `b5d015b`, expected 524,400 every time:**

    quiet, sample 1              1 of 25 runs SHORT   (smallest arrival 68,158)
    quiet, sample 2              0 of 30 runs SHORT
    2 busy cores                 0 of 30 runs SHORT
    6 busy cores                16 of 25 runs SHORT   (smallest arrival 97,000)

**And it is not only a micro-benchmark: it failed as a real suite red in
my own drill.** While mutant D10 was applied — a mutation of
`holdingLanes` in `dispatch-order.mjs`, which cannot reach this body —
body four failed with *"a DRAINING reader lost bytes from two hundred
small writes"*, `Expected: 524400  Received: 65536`. A body that reds
under an unrelated file's mutation is a body that will red under
somebody else's lane.

**WHY THIS IS BLOCKING RATHER THAN A SUGGESTION.** This lane runs at
`retries: 0` by deliberate design, on every lane and on a shared CI
runner whose load nobody controls. A new intermittent here arrives
detached from its cause and gets attributed to whatever diff is nearest
— which `docs/STATE.md` names as this seat's most common failure. The
red does not even look like a harness problem: its message is about
write shape, in a file whose subject is write shape.

**AND THE STANDARD IS THIS BODY'S OWN.** Control ONE proves the SLOW
reader cannot lose by itself, and the header explains at length why that
proof is owed — *"a harness that drops data on a writer that dropped
none would red this body for its own reason and read as a finding"*.
Exactly that is true of the FAST reader, and control two asserts its
no-loss claim instead of proving it. The asymmetry is the whole defect.

**REMEDY (the lane's to choose; any of these clears F1).** The argument
control two makes is *one writer, one shape, two readers, two answers* —
which needs the DISCRIMINATION, not the maximum:

    expect(fast.bytes).toBeGreaterThan(slow.bytes);   // the actual claim
    expect(slow.bytes).toBeLessThan(smallWant);       // unchanged

or derive the fast arm in-run the way `deriveLossPoint` already derives
the slow one (max of N samples), or keep the equality but `disclose()`
the shortfall instead of asserting it. **Do not add a retry** — that
would mask the trusted-timing class this lane exists to catch.

---

#### EVERYTHING ELSE — attacked against a stamped set, and it holds

My attack set named six ways this card could be satisfied in its letter
and failed in its purpose. **Five of the six do not land, and each was
tested with a mutant rather than read for.**

**The emitter is NOT made unbreakable by emitting less.** This was my
primary attack, because at `5f193e6` dropping `UNBLOCKED BUT FENCED`
alone takes the print from 85,820 to 26,403 bytes and satisfies every
byte-shaped criterion at once. It is not what happened: the filter is a
DERIVED predicate over `readDispatchOrder`'s own partition, there is no
byte budget, no row cap and no `slice` anywhere in the render path, and
the census line states what was RULED ON beside what was SPELLED OUT.
Mutants, mine, in my bench, one side only, landing read from `git diff`,
restored and proved by sha256:

| mutant (producer side unless noted) | killed |
|---|---|
| D1 `process.exitCode = code` → `process.exit(code)` | 4 — flush proof, slow reader, margin guard, sweep |
| D3 `PIPE_BUFFER_BYTES` 65,536 → 32,768 | 1 — the two-arms body |
| D4 invert the FENCED verbosity branch | 3 — filter, positive control, live board |
| D5 drop FENCED rows from `--full` too | 2 — filter, positive control |
| D6 truncate STARTABLE rows (`slice(0, 0)`) | 3 — lane-with-no-card, filter, positive control |
| D7 **DATA mutant**: move `T-951` fenced→startable, cardinality UNCHANGED | 2 — filter, positive control |
| D8 `setTimeout(() => process.exit(code), 50)` | 1 — the flush sweep |
| D2b `withMargin` made a pass-through | 3 — both margin bodies, the T-179 sweep |
| D9 census `ruled:` made a function of `ctx.full` | 1 — the positive control |
| D10 `holdingLanes(...)` → `""` in the counted line | 1 — the filter body (plus F1 firing spuriously) |

**D5 is the one I pre-committed on**: my attack set said *"if this mutant
survives, criterion 3's control is vacuous and that is a REJECT."* It
does not survive. **D6 answers my sharpest question** — the suite CAN
tell a filter from a truncation. **D7 is the one I care about most**: the
row moved between families and the cardinality did not change, and it
still reds. That is CONVENTIONS' poison shape NINE defeated by a CONTENT
floor rather than a count floor, and it is the answer to the attack I
thought most likely to land.

**KILL-SET CONTAINMENT, not the count.** The filter body is killed by
{D4, D5, D6, D7, D10}; the positive control by {D4, D5, D6, D7, D9}.
**Neither contains the other** — D10 kills the first and not the second,
D9 the second and not the first — so both are load-bearing. Two honest
observations against that standard: the live-board body's kill set {D4}
is CONTAINED by both, and over ten producer mutants I could not
construct one that body four kills and body one does not (D8, my
intended discriminator, killed neither). Neither is a defect. Both
bodies discharge obligations the card states in words — criterion 4's
"never on a synthesised one alone", and the rider's demand that the
correction be driven rather than written — and a body whose job is a
DISCLOSURE or a DEMONSTRATION does not earn its place by its kill set.
The lane's own M2 and M3c separate body four on its controls, which is
the site that property lives in; I record that I could not separate it
from the producer side.

**The margin is derived where it must be and constant where it says so.**
The size is `Buffer.byteLength` of the answer, at a FIXED POINT that
includes the block declaring it — I checked that against the filesystem
rather than against the body that checks it: `--dispatch` declares
41,256 and `wc -c` says 41,256; `--dispatch --full` declares 102,752 and
`wc -c` says 102,752. It prints FIRST, it prints in BOTH arms, and D3
proves the buffer constant is pinned rather than shared with its own
assertion. My attack A2c — that deriving the loss point per run would
buy a subprocess into a read-only command — is avoided, and the
trade-off is the one I named as acceptable in advance.

**The unfiltered view is kept and is discoverable in band.** `--full` is
an existing flag, so no governing document had to move and
`workflow-parity` is untouched; the default view's own header tells the
reader the flag exists. My attack A6a/A6b do not land.

**The rider is complete and the record was APPENDED.** The brief said two
prose sites; I derived FOUR independently in phase 1 and stamped them
before the diff existed, including the `LIVE_ARMS` sentence that is
hard-wrapped as `harder to\n * lose` so a one-line grep returns nothing
and reads like a refutation. All four are taken. `T-197`'s card is
**38 additions, 0 deletions, landing at line 573** — the end of the file
— and its base content hashes to
`58e00078003284ec961114a2a78e21753f5d91537ff80d8e51e7fb6e70befca7`,
byte-identical to my phase-1 stamp. Nothing above the correction moved.
My own sweep over `tools/e2e/**`, `method/**` and `docs/**` in collapsed
text finds no surviving uncorrected assertion; every remaining mention is
a quotation inside its own retraction.

**Security sweep — clean, and stated as a comparison rather than a
feeling.** Base and tip both spawn exactly `git`, `lsof` and `hostname`,
all from `dispatch-brief.mjs`, all as fixed-argv0 arrays; `brief.mjs` and
`dispatch-order.mjs` spawn nothing at either ref. The diff adds no
`execFileSync`/`spawnSync`, no `writeFileSync`/`chmodSync`, no new
`readFileSync`, no `shell: true`, and no dependency — no manifest is in
the diff at all. The only new I/O is `process.stdout.write` replacing
`console.log`. `--dispatch` still writes nothing, and the body pinning
that with a `git status --porcelain` comparison still passes.

**ARCHITECTURE and CONVENTIONS.** No component registry file, no
`touch_slugs:`, no `method/` path and no governing document is touched,
so the DECLARING A COMPONENT and method-bump classes are not in play.
`tools/e2e` is dev tooling under no component and `.nputerignore`d.

---

#### THE BATTERY, in my bench at `b5d015b`, `NPUTER_E2E_PORT=25225`

    gate-verdict suite=parser exit=0 bodies=349  GREEN
    gate-verdict suite=app    exit=0 bodies=1131 GREEN
    gate-verdict suite=rust   exit=0 bodies=631  GREEN
    gate-verdict suite=e2e    exit=1 bodies=553  RED — 551 passed, 2 failed
    typecheck 0 · lint:tokens 0 · lint:tokens --selftest 0 · lint:docs 0
    capabilities:check 1 STALE

**THE TWO E2E REDS ARE NOT THIS DIFF'S, AND I PROVED IT RATHER THAN
ACCEPTING THE ATTRIBUTION I WAS HANDED.** They are
`session-economics.spec.ts:179` and `:365`, both refusing because the
LIVE lane set at this base is not pairwise disjoint (`T-230-s3` carries
the broad `touches: [tools/e2e]` at `5f193e6`, and `T-236-s1` is a lane
whose card this ref does not have). I checked out `5f193e6` in the same
bench, with the diff entirely absent, and ran that spec: **2 failed, 8
passed — the same two bodies.** REF SKEW, confirmed by measurement.

**I saw no `EACCES` body at all**, because my bench is detached and
carries no fence manifest, which is exactly why the bench is the place to
measure T-216-s4's class from.

**ONE CORRECTION TO THE HANDOFF, because the integrator will act on it.**
The notes and my dispatch brief both say `capabilities:check` is stale by
**three** new test names. It is **six** — the diff adds six `test(` names
and removes none, and the census moves 45,893 → 46,468 bytes with the
suite at 553 bodies against a committed census of 547. Not regenerating
in the lane is correct (T-210 leaves `docs/CAPABILITIES.md` read-only
inside a fence); the figure the integrator carries into the merge commit
should be six.

*(I ran `npm run capabilities` once in my bench by accident while
checking that delta, which wrote `docs/CAPABILITIES.md` there. Restored
immediately with `git restore --source=HEAD --staged --worktree`, sha256
back to `dc6752608f544d59df402764db05ff4dc9d780de18225db3fc6aeead5ac73247`
and `git status` clean. Recorded because an unrecorded write and an unrun
one are indistinguishable.)*

---

#### GROUND TRUTH I STAMPED BEFORE THE DIFF EXISTED, AND WHAT IT SETTLED

The card's opening mechanism does not reproduce, and I measured that at
the base ref before this lane wrote a line — so the finding is not a
reading of the notes. At `5f193e6`, `--dispatch` = **85,820 bytes**,
**20,284 PAST** the flush guard's own derived loss point, and **nothing
is lost** to a file, to `| cat`, to `| (sleep 1; cat)`, to
`| (sleep 5; cat)` (pipeline wall 5,020 ms — the writer blocked and
waited), or to `spawnSync` at Node's default `maxBuffer`. **Criterion 1
is degenerate**: it was satisfied by T-197's landed work at the commit
this card was cut from. The lane discloses that in as many words rather
than reporting it as proved, which is what I pre-committed to require.

I also re-derived the rider's own claim before the diff existed: 200
small writes plus `process.exit(0)` lose **50,264 bytes** to
`| (sleep 1; cat)` and **nothing** to `| cat`, and the same writes lose
nothing at all once `process.exit()` goes. The rider is right.

**AND THE FIXTURE EVAPORATED WHILE I WAS MEASURING IT.** Between
00:03:27Z and 00:12:53Z the `T-216-s4` lane merged; at the identical
bench ref `--dispatch` fell **85,820 → 76,549 bytes** on the lane list
alone, while the card-row count stayed at **96**. One lane merging moved
the print by 9,271 bytes with the tree unchanged and the count
unchanged. **Any `--dispatch` size stated anywhere must carry its ref AND
its lane count** — the notes do this correctly, and it is why D7 mattered
to me.

---

#### FILED, NOT BLOCKING

`T-225-s5` (the CLASS behind F1: a control that asserts a race outcome
must derive its own reliability in-run), and a dated CORROBORATION
appended to `T-225-s1` — my measurement sharpens it from *the label is
wrong* to *the sentence the tool PRINTS is false*: at `b5d015b`,
`spawnSync` with `maxBuffer: 65536` over `--dispatch --full` returns
**the whole 102,752 bytes**, `status: null`, `signal: SIGTERM`,
`error.code: ENOBUFS` — not "a prefix with no error", which is what the
OVER arm tells every dispatcher who crosses the line.

`T-225-s2`, `T-225-s3` and `T-225-s4` are the lane's own and I concur
with all three; s2 and s4 are two I had independently on my attack set.

**On re-verification**: fix F1 and re-run `tools/e2e` only. No producer
changes, so the parser, app and rust readings above stand at their ref.

### V-225 RE-VERIFICATION, 2026-09-02 — claude-opus-5@subagent, at `e086e1c8a06e`

**APPROVED.** F1 is cleared, and the fix is better than the remedy I
proposed. Everything I approved at `b5d015b` is untouched by this diff.

**WHAT I JUDGED.** `git diff eb05606..e086e1c` — two files: this card
(+101, **0 deletions**) and `tools/e2e/tests/brief-flush.spec.ts`
(+80/−13). No producer changed. My own verdict section is **byte-identical**
at both refs (`sed -n '/^## Verdicts$/,$p' | shasum -a 256` gives
`2e5d3a503ed9a2433e4e7c04faa4a64a1b7e7b81fe6df07b873ba6a2f435f961` at
`eb05606` and at `e086e1c`); the fix notes were inserted ABOVE it, which
is the right document order and left the record intact.

#### F1 IS CLEARED, AND THE EXECUTOR'S ARGUMENT AGAINST MY REMEDY IS RIGHT

I proposed a bare `fast > slow`. The fix instead derives the draining
reader in-run — the MAX of `FAST_SAMPLES = 5`, mirroring
`deriveLossPoint`'s MIN — and the notes argue my version is still one
sample of a race, because under sustained load `cat` reaches the
pauser's own floor of one pipe buffer. **That is correct and I measured
it**: in my sampling below, individual `cat` runs hit exactly 65,536 —
the pauser's floor — twice in 100 samples. A single `fast > slow` would
have failed on those. **A control I proposed was weaker than the one
built, which is the question verifier.md tells me to ask of my own
suggestions; the lane asked it for me.**

**MEASURED AT TWICE THE LOAD THE FIX PASS USED.** My machine has 10
cores; I ran 20 spinners, against the fix pass's six.

A faithful replica of control two — one pauser run, five `cat` runs,
`max(cat) > pauser` — **25 iterations, 150 reader runs**:

    control two would FAIL 0 of 25   (and the slow arm 0 of 25)

Twelve instrumented iterations under the same load, showing the margin:

    slow=65536   best=524400  margin=458864   cat spread: 65536 330358 524400 524400 524400
    slow=107488  best=524400  margin=416912   cat spread: 524400 524400 524400 524400 524400
    slow=65536   best=524400  margin=458864   cat spread: 89134 450970 524400 65536 409018
    …best was 524400 in ALL TWELVE; margin never below 416,912 bytes

**Body four itself, 8 runs under the same 20 spinners: 8 passed, 0
failed.** Its own disclosure shows the degradation is real and the
assertion still clears it — one run reported *"1 of 5 whole"* with the
spread `91756, 133708, 498180, 128464, 524400`, and another included a
`65536` sample sitting exactly on the pauser's floor.

**The before/after on one dataset.** Of the 60 `cat` samples in the
instrumented run, **26 were short** — the OLD `toBe(smallWant)` would
have failed 43% of the time under this load, which reproduces my F1.
The new form failed 0 of 25 + 0 of 8. Across 100 `cat` samples only 2
reached the floor, so the failure the new assertion needs — all five at
once — is not a rate I could reach by loading the machine.

#### AND THE RELAXATION DID NOT COST THE BODY ITS TEETH

The risk in relaxing an assertion is that it stops discriminating. Two
mutants in my bench, one side only, landing read from `git diff`,
restored and sha256-proved:

| mutant | killed |
|---|---|
| R1 `process.exitCode = code` → `process.exit(code)` in `brief.mjs` | **4** — flush proof, **slow reader**, margin guard, sweep |
| R2 control two's fast arm reads with the PAUSER instead of `cat` | **1** — the slow-reader body, alone |

R1 says the body still detects the defect it exists for. **R2 is the one
that matters for a relaxed control**: the reader IDENTITY is still
load-bearing, kill count one, aimed exactly at the site the property
lives. A control that had been relaxed into vacuity would have survived
R2.

**ONE HONEST RESIDUAL, NOT A DEFECT AND NOT A CARD.** Nothing pins that
the aggregate is `Math.max` rather than `Math.min` — on a quiet machine
both are 524,400, so a MIN mutant survives quietly and only fails under
load. That is the same class as the original F1 one level up, it is
bounded by the disclosure (the spread is printed every run, so a reader
sees which it got), and pinning it would need a load fixture this
project has no way to make deterministic. Named here so the next reader
inherits the observation rather than re-deriving it. `T-225-s5` already
owns the class.

#### THE REST OF MY ATTACK SET IS UNMOVED, AND I CHECKED RATHER THAN ASSUMED

The diff touches one spec body and this card. It reaches no producer, so
the filter, the margin, the completeness census, the rider's four sites
and the security surface are the artefacts I already approved — I
re-confirmed the file list rather than reasoning from the stat.
`FAST_SAMPLES` adds five extra `| cat` runs to one body; body four went
from ~1.6 s to ~2 s in my runs, which is noise against the suite's 7-plus
minutes.

#### GATES AT THE TIP I JUDGED, IN MY BENCH, `NPUTER_E2E_PORT=25225`

    gate-verdict suite=parser exit=0 bodies=349  GREEN
    gate-verdict suite=app    exit=0 bodies=1131 GREEN
    gate-verdict suite=e2e    exit=1 bodies=553  RED — 551 passed, 2 failed

The two reds are `session-economics.spec.ts:179` and `:365`, the SAME
two I attributed at `b5d015b` by checking them out at the base ref with
the diff absent: REF SKEW, not this diff's. **I saw no `EACCES` body**,
my bench being detached and unfenced — which is why the three the lane
sees are the physical layer's and not the diff's.

**The census correction landed**: the fix notes now say six. I re-derived
it at this tip — six `test(` added since `5f193e6`, none removed;
`capabilities:check` STALE, committed 45,893 against a fresh 46,468. The
integrator regenerates in the merge commit (T-210).

**READY TO MERGE at `e086e1c8a06ec96fa692b76e7115abc4b4ed6191`**, with
`docs/CAPABILITIES.md` owed in the merge commit and `T-225-s1`…`s5`
carried to triage.

## Absorbs: T-225-s5 (2026-09-02, at the fix pass)

The verifier filed T-225-s5 with the REJECTED verdict: a control that
asserts a race outcome must derive its own reliability in-run. The fix
pass at f16f019 built exactly that — control two now derives the
draining reader over the max of five samples and discloses the spread —
and the re-verification measured it at twice the load. The one residual
the verifier named (nothing pins max over min; a min mutant survives on a
quiet machine, bounded by the disclosure) is recorded here rather than
carded, on the verifier's own reading that it is not worth a second card.

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-197-s1: `git show 2489853^:docs/tasks/T-197-s1-write-shape-is-not-the-invariant.md`
- T-225-s5: `git show ae41f78^:docs/tasks/T-225-s5-a-control-that-asserts-a-race-outcome-must-derive-its-own-reliability.md`

A lane building this card reads those before it builds.
