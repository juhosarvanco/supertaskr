---
title: Verdict tint picks REJECTED over an APPROVED header when one paragraph carries both words
status: suggested
suggested_by: verifier claude-fable-5 @T-006-verify
---

`verdictEntries()` (app/src/lib/task-detail.ts) decides a verdict
block's tint from the entry's first paragraph, testing REJECTED before
APPROVED. When a single-paragraph APPROVED entry mentions the word
REJECTED — e.g. `2026-08-14 — verifier: APPROVED — the REJECTED repro
from the first entry no longer reproduces.` — the block takes
`kind: "rejected"`: terracotta tint AND the printed "rejected" label
over a verdict whose verbatim text says APPROVED. Reproduced headlessly
against the dev bundle during T-006 verification (fixture task with
that exact entry → `data-verdict-kind="rejected"`).

Scope check: the existing test ("only the header paragraph decides the
tint, not quoted body text") covers REJECTED quoted in a LATER
paragraph; the hole is both words in the SAME first paragraph. A scan
of every `## Verdicts` section in the live docs/ tree found zero
occurrences today, so nothing currently renders wrong — this is a
latent edge, not a live defect, and the verbatim text itself is always
correct either way (T-005's reading-surface rule holds).

Suggest: first-verdict-word-wins — compare the earliest match position
of /\bREJECTED\b/ and /\bAPPROVED\b/ in the first paragraph instead of
testing REJECTED categorically first (one-line change plus a pinned
test for the both-words case). Convention verdicts lead with the
verdict word after the role colon, so first-match is the honest read.
Touches app-board only (task-detail.ts + detail-presentation.test.ts).
