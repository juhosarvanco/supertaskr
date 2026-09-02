---
id: T-230-s7
title: QUOTED RUNS THAT SPAN THE 70-COLUMN HARD WRAP ARE INVISIBLE TO THE UNMARKED CENSUS — unmarkedQuotes decides nearness over the paragraph but extracts needles line by line with a class that stops at the newline, so 2,386 runs on 364 of 448 cards are never seen, 6.5 times the floor drop T-230-s5 counted
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-230-s3-verify, phase 1 at f5bad14, 2026-09-02
blocked_by: [T-230-s3]
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE CENSUS SEES A QUOTE ONLY WHEN IT FITS ON ONE LINE.** `unmarkedQuotes`
in tools/e2e/scripts/brief.mjs decides `nearPath` over the whole paragraph
and then extracts the quoted needles LINE BY LINE with `QUOTED_RUN`, whose
character class is `[^"\n]+`. Every card in docs/tasks/ is hard-wrapped at
seventy columns, so a quoted sentence that crosses a line break — the
ordinary shape of a quoted acceptance criterion — is two half-runs to the
extractor and neither opens and closes on its line. Measured at f5bad14
by the T-230-s3 verifier, controls printed first: **2,386 quoted runs
across 364 of 448 cards cross a wrap**, against the 369 runs on 140 cards
that T-230-s5 found dropped below the four-character floor. T-230-s3's
own card is an instance: lines 44–45, where it quotes T-230's first
acceptance criterion to make its case, are invisible to the arm that
card is about.

The consequence is a false-negative census, and a false-negative census
is the wrong kind: T-230 exists because a card's quotation of a
document it did not read is the claim most worth catching, and the
longer the quotation the likelier it wraps.

## The construction

Extract needles from the PARAGRAPH the nearness decision already
reads, with the wrap folded — join the paragraph's lines on a single
space before matching, the way the parser folds a card's own frontmatter
title, and let the class be `[^"]+` bounded by the paragraph. A run that
spans two paragraphs is not a quotation and stays unseen; say so in the
`cannot` line, without a digit (the `note()` path throws on one). The
floor and the marker rules are unchanged; only what reaches them changes.

## Acceptance criteria

- WHEN a card paragraph carries a quoted run that crosses a line break
  THE unmarked census SHALL see it as ONE run, and a body SHALL plant
  such a run in a fixture card and show it counted, with the same card
  minus the wrap as the control.
- WHEN the same run is marked with the card-claim marker THE census
  SHALL treat it exactly as it treats a single-line marked run.
- THE preflight of the live board SHALL print how many runs the fold
  newly reaches, once, at the lane's tip, beside the T-230-s5 floor
  count, so the record carries both figures.
- A run that spans two paragraphs SHALL stay unseen and the `cannot`
  line SHALL say so in words.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

T-230 (the arm), T-230-s3 (the title and frontmatter gap, whose lane
this filing is blocked behind because both edit the same reader),
T-230-s5 (the floor count), and the T-230-s3 verifier's phase-1 ground
truth in the sitting's record.
