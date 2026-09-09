---
id: T-281
title: The verifier COMMITS the bodies its corrections assign, on the bench, with a text-anchored MUTANT BLOCK the merge verb's drill step reads — the integrator re-drills and never rewrites, and a correction lifted from a transcript is a thing of the past
feature: F-06
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-09): decision 1 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md) — \"1 yes\""
blocked_by: []
touches: [method/roles/verifier.md, method/roles/integrator.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

Nine merges on 2026-09-09 each carried two to five assigned
corrections. In every case the verifier had already WRITTEN the body
that pins the correction and run it both ways on its bench — and then
described it in the verdict, sometimes verbatim, sometimes not. The
integrator (the architect seat) recovered the bodies from the
verifier's transcript file (T-167-s13, T-244), or rewrote them from the
description (T-241, T-203-s1), or lifted them from a verdict that
carried them (T-238-s1, T-254), and drilled each with a mutant it had
to construct itself. That was 20–30 minutes of the seat's context per
merge, the single largest consumer of the architect's attention after
the merges themselves, and the recovery from a transcript is fragile
by construction (a JSONL parse of tool inputs, keyed on guessed
strings).

The verifier already commits on the bench: its verdict and the cards
it files. The bodies are one more commit there. What is missing is the
rule and the reader.

## Acceptance criteria

- WHEN a phase-2 verdict assigns a correction THE verifier SHALL commit
  the body that pins it on the bench, in the spec file the property
  lives in, in a commit named for the correction — AFTER the verdict
  commit, so the verdict's figures still name the tip they were
  measured at — and SHALL have run the body RED against an
  implementation lacking the property and GREEN against one carrying
  it, both recorded in the verdict.
- WHEN a verdict assigns a correction THE verdict SHALL carry a MUTANT
  BLOCK for it in one fixed layout: the file, the exact old text and
  the exact new text (each matching the file once, never a line
  number — a line number is a coordinate in a mutable object), the
  body's name, and the failure message expected; a block naming a line
  number SHALL be refused by the reader.
- WHEN the integrator merges THE merge verb SHALL read every block off
  the card's newest verdict, plant each mutant on the MERGED tree, run
  the owning spec, require the named body RED alone with the message,
  restore the site and prove it by sha256 — and SHALL stop before the
  commit on a survivor, a body that reds more than itself, or a block
  whose anchors do not match once.
- THE integrator SHALL NOT rewrite a body the verifier committed; where
  a correction needs a code change beside the body (the verdict names
  it), the integrator performs the code change and the committed body
  is what proves it.
- WHEN verifier.md and integrator.md are read THE contracts SHALL say
  the above once each; the method eval gate SHALL run and the bump
  SHALL carry its eval block.
- WHEN the checkpoint is recorded THE record SHALL stamp the merge
  minutes per correction for one sitting before and one after, with
  the clock.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
