---
id: T-320-s8
title: "Two seams of the express path are argued in comments and driven by nobody: the merge keeper reads a hand-built record rather than one the flow wrote, and the arm's measured admission is never shown to be the admission the lane cut makes"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-320, filed at the phase-2 bench on 2026-09-14"
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Two joints of T-320 are correct by construction and pinned on both sides
of the joint but not across it.

**The receipt at the merge.** `run-record.spec.ts` drives a planted
completion through the real `observeRun` and reads the receipt back off
a record on disk, asserting the two field names the record carries.
`merge.spec.ts` drives `receiptKeeperReport` over an object literal cast
through `as unknown as`, and it is that reading — selecting the records
whose `assignment.id` is this merge's card — that no body exercises
against a record the flow wrote. Both ends name the same two fields, so
the seam is narrow; it is still a seam.

**The admission the lane cut makes.** `expressPlan` measures an
admission against the blob it computed from the composed bytes and says,
in a comment, that the admission which BINDS is the lane cut's and that
the two ask about the same bytes. They do: the arm stages the card
before the hand-over and `cardBlobSha` hashes the working-tree file,
which the dispatch stamp has not yet touched. The body that drives the
whole run stubs the hand-over — for a stated reason, that the ordinary
ritual needs installed suites a scratch checkout does not have — so the
claim that the measured admission and the binding one agree is argued
and not driven.

## What would settle it

For the receipt: one body that starts a run, plants a mismatching
completion through `observeRun`, and hands `allRecords` of that root to
`receiptKeeperReport`, requiring the refusal and requiring a second
card's record in the same directory to be left alone.

For the admission: a body that runs the express arm to the hand-over
against a fixture whose ritual can answer, or that calls
`dispatchLanePlan` over the staged compact card and requires its
admission's blob to equal the blob the express plan measured against.

## Implementation notes

## Verdicts
