---
id: T-202-s1
title: The gate runner's solo lock keys on the LAST EIGHT BYTES of the checkout path, so a verifier bench and its own lane share one lock for every eight-character card id and the two seats the method runs in parallel are serialised
feature: F-06
milestone: 4
size: S
priority: 2
status: planned
suggested_by: verifier claude-opus-5@subagent @T-223-s3-verify, phase 1 at 695954f, 2026-09-02; filed by the architect seat
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding, measured

`lockPath(root)` in `tools/e2e/scripts/gate-run.mjs` derives the lock key
as `Buffer.from(root).toString("hex").slice(-16)` — the last eight
BYTES of the checkout path. For a card whose id is exactly eight
characters (every `T-NNN-sN`), the lane `…/nputer-T-223-s3` and its bench
`…/nputer-V-T-223-s3` end in the same eight bytes and produce the
identical key (`542d3232332d7333`); for `T-228` they do not. V-T-223-s3
verified both. The consequence: a bench's gate run is refused as
"solo-locked" while its own lane runs a suite, and vice versa — the
executor and the blind verifier, the two seats the method deliberately
runs side by side, are serialised on every eight-character card. Three
seats reported the refusal today (V-T-216-s8, V-T-223-s3, V-T-112-s6's
e2e baseline) and each read it as another checkout's lock, which the
runner's own header says cannot happen.

## What is asked

The key SHALL be a function of the WHOLE path (a digest of it, or the
full hex), so distinct checkouts never share a lock; the per-checkout
solo property is unchanged. A body plants two roots differing only
before their last eight bytes and requires distinct keys; a second body
keeps two runs in ONE root serialised.

## Acceptance criteria

- `lockPath` for `/x/nputer-T-223-s3` and `/x/nputer-V-T-223-s3` differ;
  for the same root twice they are equal.
- The positive control demonstrated failing: the base key function reds
  the distinct-roots body by name.
- Existing gate-run bodies green at the tip; the lock file's location
  and lifetime are unchanged, so no other reader moves.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, at the seat

Serialising the bench against its lane costs every eight-character card
a full suite length of wall-clock, silently, and misattributes the
refusal. Dispatch at the next free slot; the fence is free of every
live lane.
