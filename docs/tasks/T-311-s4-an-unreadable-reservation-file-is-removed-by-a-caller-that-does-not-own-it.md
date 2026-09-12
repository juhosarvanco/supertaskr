---
id: T-311-s4
title: "An UNREADABLE reservation file is removed by a caller that does not own it, because the ownership check is skipped when the JSON does not parse — the one file that decides who may write a lane treats damaged as absent"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-311 phase 2, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`releaseReservation` reads the reservation it is about to remove and
refuses when that reservation names another attempt. When the file does
not PARSE, `readReservation` answers `null`, the ownership check is
skipped as though there were nothing to check, and the file is removed
anyway.

The reachable routes are narrow. `releaseIfOurs`, which every terminal
transition goes through, returns early on a null reading and is safe. The
two that reach the removal are `continue --replace`, which releases
before it reacquires, and the failure path of `start`, which releases a
reservation whose record could not be written. Both act on their own
resource, so nobody is stealing a lane today.

What makes it worth writing down anyway is the shape rather than the
reach. This is the one file that decides who may write a lane, and a
damaged one is being read as an absent one. Everywhere else the module
takes the opposite position and says so: a record that does not parse is
refused by name rather than treated as missing, because a record read as
absent is a resource read as free.

## Why it is worth a card rather than a shrug

The reservation is the whole answer to two writers for one lane, and the
argument for it is that the filesystem decides rather than a reader. A
reader that deletes what it cannot understand has put itself back in the
decision, in the one case where it knows least.

It is a card rather than a passing fix because the right answer is a
judgement, not an edit. A damaged reservation could be refused outright
(safe, and it needs a way out for a human), or removed only by an attempt
that can show it owns the resource some other way, or quarantined beside
its replacement. Which of those the loop wants is the question, and the
answer changes what a seat does at three in the morning.

## The shape that would work

`releaseReservation` refuses an unreadable reservation by name, with a
code a caller can match on, and says what a seat should do with it. The
body plants a reservation file that is not JSON and asks a DIFFERENT
attempt to release it — a data mutant, because the property lives in the
file rather than in the code — and a second body keeps the ordinary
release working so the refusal is about the damage and not about every
release.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
