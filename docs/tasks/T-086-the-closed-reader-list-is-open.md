---
id: T-086
title: CONVENTIONS says the live-reader list is CLOSED AT TWO — it is four and counting, and the gate that could answer already exists
feature: F-06
milestone: 4
priority: 44
size: S
status: building
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-081-s6, T-078-s10 (fifth triage, 2026-08-20). Both files
removed in this commit.

`docs/CONVENTIONS.md:359-360` states, of files that read
`docs/CONVENTIONS.md` itself off disk: **"TWO LIVE READERS … CLOSED AT
TWO."** False three ways at this triage, and the fifth-triage census
names the third reader outright:
`tools/e2e/tests/docs-input-gate.spec.ts` reads the file through
`conventionsText()` — a reader ADDED BY THE GATE CARD, which means the
sentence went stale as a direct consequence of building the machinery
that could have kept it true. T-078-s10's half: the closure was
asserted over a property ("found by grep for the path") the sentence
never states, so it was unfalsifiable as written.

**The fix is deletion, not re-counting.** T-084's gate derives the
reader set from the tree and prints it on demand
(`node tools/e2e/scripts/docs-gate.mjs --census`). A sentence that
transcribes a count into prose is a second implementation of the
census, and this repository has now measured — five separate times —
what happens to transcribed counts.

## Acceptance criteria

- THE "CLOSED AT TWO" claim SHALL be deleted and replaced with the
  derivation: the reader list for this file is whatever
  `docs-gate.mjs --census` prints, and the bullet SHALL name that
  command rather than any count, matching the ruling T-084 already
  applied to the root-anchored figure.
- WHAT THE BULLET IS FOR SHALL SURVIVE: an editor of CONVENTIONS must
  still learn, from the bullet, that their edit can red suites and
  which command tells them which. The walk-table's purpose is the
  warning, not the census.
- IF any other transcribed reader-count survives in CONVENTIONS THEN
  this card SHALL correct it the same way or state why it stays — the
  class is the finding, not the instance.
- THE three live readers of CONVENTIONS SHALL each be run green at the
  edit (kit.rs's stamp test, workflow-parity, docs-input-gate), since
  editing this file is exactly the act the bullet warns about.

Verification: headless — the three readers run with exits stated; the
docs gate run on the diff and its owed suites run. @human: none.
