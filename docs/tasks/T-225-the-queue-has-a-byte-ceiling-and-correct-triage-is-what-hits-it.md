---
id: T-225
title: THE QUEUE HAS A BYTE CEILING AND CORRECT TRIAGE IS WHAT HITS IT — promoting seven sound suggestions leaves 290 bytes of a 64 KiB buffer, so the board's capacity is now a function of the spawn buffer rather than of the work
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: "the architect/integrator seat, 2026-09-01 — met during the triage sitting docs/STATE.md said was owed, measured rather than predicted"
builder:
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
