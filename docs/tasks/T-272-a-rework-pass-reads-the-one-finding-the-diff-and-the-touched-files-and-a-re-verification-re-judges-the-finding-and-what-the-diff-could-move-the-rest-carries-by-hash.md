---
id: T-272
title: "A rework pass reads the one finding, the diff and the touched files, and a re-verification re-judges the finding and what the diff could move — the previous verdict's measurements carry by hash for everything else"
feature: F-01
milestone: 4
size: S
priority: 18
status: planned
suggested_by: "@human, 2026-09-09 (\"file the first two\"); measured on T-224: two re-verifications re-ran every attack of the sealed set and the whole battery (211K and 301K tokens, 52 and 40 min) for diffs of one function"
blocked_by: []
touches: [method/roles/verifier.md, method/roles/executor.md, method/tasks/TASK-FORMAT.md, docs/CONVENTIONS.md, docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

A rejection names one finding with a reproducible failure. Today the
fix pass re-reads the whole card (40 KB of notes and verdicts on
T-224) and the standing set, and the re-verification re-runs the
entire sealed attack set and the full battery. The blindness the bench
buys is a property of the FIRST pass; a re-verification is judging a
delta, and a delta is judged by what it could move.

## Acceptance criteria

- WHEN an executor is dispatched on a REWORK THE brief SHALL name the
  finding (quoted from the verdict), the files the fix may touch and
  the bodies that must red-then-green, and the role file SHALL say the
  rework reads THOSE plus the read-first set — not the card's history —
  and confirms the finding in one paragraph before touching anything.
- WHEN a phase 2 re-verifies after a rejection THE role file SHALL say
  it verifies the sealed digests, reads the previous verdict, then
  judges (a) the closed finding by its own re-derivation and its own
  mutant at the site, and (b) every attack of the sealed set whose
  SUBJECT the rework diff could move (derived from the diff's paths
  against the set's named files), and (c) the owed suites once at its
  own tip — and that every other measurement of the previous verdict
  CARRIES, cited by that verdict's commit and the unchanged files'
  blob hashes, never re-run.
- WHEN a rework diff touches a file the previous verdict did not
  measure THE re-verification SHALL widen to the attacks naming that
  file; IF the diff touches a record or a card's frontmatter THEN the
  full falsifier list re-runs (a record moved is never carried).
- The frame line of a re-verification SHALL say which attacks were
  re-judged and which carried, with the hashes, so a later reader can
  see the delta was the delta.
- The method version SHALL bump; the pin test moves in the same lane.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/merging.md, docs/conventions/records-and-rooms.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
