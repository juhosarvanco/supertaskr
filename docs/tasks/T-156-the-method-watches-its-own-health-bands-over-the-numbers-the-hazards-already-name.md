---
id: T-156
title: The method watches its own health — control bands over the numbers the standing hazards already apply by eyeball
feature: F-06
milestone: 4
priority: 34
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 3: F-06's premise — drift as a first-class signal —
applied to the method's own health. The bands already exist as
hand-applied rules: the lib-suite duration cliff (every green under
9.5s, every red over 14.6s, nothing between — T-088-s4, a control
band read by eyeball for twenty-plus checkpoints), graph budget
headroom (98.1% at this filing, the number nothing reports), the four
doc budgets (gated hard/warn but trend-blind), e2e wall time.

## The shape

1. One deterministic script: read each metric from its existing
   authority (`index --check`'s budget line, the suites' own timing
   output, `wc -c` against DOC_BUDGETS), compare against a
   version-controlled bands config.
2. Tiered response, all three tiers cheap: inside the band — silent;
   drifting — print the trend with its derivation; breached — FILE
   the finding as a suggestion card, which re-enters the board the
   way every finding already does. No tier acts on anything.
3. Run at checkpoints (a line in the record template's Gates section)
   and on CI's schedule once the pipeline is green (behind `T-153`).

## Acceptance criteria

- WHEN a watched metric breaches its band THE script SHALL emit a
  finding naming the metric, the reading, the band and the
  derivation — and the checkpoint SHALL carry it.
- IF a metric's authority cannot be read THEN the script SHALL say
  so at exit 3, never report the band as holding.
- WHEN the bands config changes THE change SHALL carry its measured
  reason, the max_graph_bytes pattern.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
