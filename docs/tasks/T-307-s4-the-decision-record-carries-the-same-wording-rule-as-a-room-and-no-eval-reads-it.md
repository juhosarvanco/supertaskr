---
id: T-307-s4
title: "A decision record carries the same wording rule as a room entry and nothing reads it — MF-11's subject is docs/rooms only, so the template's instruction is held by the reader's eye alone"
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-307, measured at b78f9f507aba638617462ea284d5c02913360977, 2026-09-10"
blocked_by: []
touches: [tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `b78f9f507aba638617462ea284d5c02913360977`

T-307 states the wording rule twice: once in `method/rooms/ROOM-FORMAT.md`
for a room entry and once in `method/docs-templates/decisions/000-template.md`
for a decision record. MF-11 reads one of the two. Its `contract` says so
plainly — every entry under `docs/rooms` dated on or after the floor —
and `roomPaths()` lists that one directory. `docs/decisions/` is never
opened.

The card's third criterion asks for an eval that fails on **a room
entry**, so the lane built exactly what it was asked for and this is not
a defect against it. It is a hole in the pair: the two files were given
one rule and one of them got a reader.

Measured by running the same matcher over the live decision records with
no floor: five of them — `020`, `021`, `022`, `023` and `024` — carry
seven quotations of exactly the refused shape between them, so the check
would have something to say the day a new record is written. Those five
are records and stay as they are; the floor is what keeps them out, the
same way it keeps the rooms out.

## The shape that would work

The audit is already a function over a corpus keyed by root-relative
path, and the only thing tying it to rooms is one `startsWith` test and
the directory `roomPaths()` lists. Widening is a two-line change plus a
second directory in `reads`.

TWO THINGS TO DECIDE FIRST, neither inherited:

- **The date.** A decision record carries `Date:` in its own header
  rather than a dated heading per entry, so the whole file is one entry
  with one date. That is simpler than a room, not harder — but the
  cascade in `entriesOf` was written for headings and would place a
  record by the newest date anywhere in it, which is not the same
  question.
- **The floor still has to hold.** The measurement above is exactly why:
  lower the floor by a day too far and the eval reds on records the
  method says are never rewritten, which is the one outcome T-307's card
  forbids.
