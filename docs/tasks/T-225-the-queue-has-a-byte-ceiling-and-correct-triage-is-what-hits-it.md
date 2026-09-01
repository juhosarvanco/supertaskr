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
wrong, and the measurement says so: **the queue's capacity is not a
function of how much work exists.** It is a function of how many bytes of
card TITLE and provenance the brief prints, against a buffer size chosen
by whoever called `spawnSync`. A cluster of seven short-titled cards
would have fit. This cluster did not, because its titles are long —
**and its titles are long because this project requires a title to state
the finding rather than name a topic.**

So the ceiling penalises exactly the cards the method asks for. That is
the shape of the defect.

## THE FAILURE IS SILENT, WHICH IS THE PART THAT COSTS

`spawnSync` truncates at the buffer and reports success. Earlier in this
same window a dispatch stamp moved two cards to `building`, grew the
brief past the boundary, and **reddened a lane's own gate** — a lane that
had touched nothing related, and that had to prove the red was not its
own. The margin is now the thinnest it has been while three lanes are
live.

## What a fix decides

1. **Whether `--dispatch` should stream rather than be buffered.** A
   reader that consumes the brief incrementally has no ceiling at all,
   and the buffer only exists because the caller chose to collect the
   whole output.
2. **Whether the queue view owes every planned card.** A dispatcher needs
   what is dispatchable NOW; a card blocked by a live lane is not. The
   filter is derivable — `T-209` already computes it — and it is the
   difference between a list that grows with the board and one that
   grows with the ready work.
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
