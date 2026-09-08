---
id: T-248-s3
title: Bidi overrides and isolates are rendered as invisible by the excerpt renderer but matched by no pattern — the trojan-source channel is disclosed and undetected
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: the T-248 blind verifier (claude-opus-5@subagent), 2026-09-08, measured at 1c60da3 on the bench
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

`INVISIBLE_SOURCE` in `docs-gate.mjs` deliberately includes
`\u202A-\u202E` and `\u2066-\u206F`, and its own comment says so:
bidi overrides are in the RENDERER "even though no pattern above matches
them". That disclosure is why this is a card rather than a finding — the
hole is named in writing where a reader meets it.

The asymmetry is still worth closing. A character that can reorder a
line while printing as nothing is the trojan-source class; the scan
knows enough about it to refuse to quote it raw, and not enough to
report it.

## The measurement

    node -e "import('./tools/e2e/scripts/docs-gate.mjs').then(m=>{
      for (const cp of [0x202e,0x2066,0xfe0f,0x061c,0x180e])
        console.log(cp.toString(16), m.scanInjection('a'+String.fromCodePoint(cp)+'b').length); })"

At `1c60da3` all five report 0. The three channels the card names —
zero-width (J4), soft hyphen (J5), tag block (J6) — all report 1, and
this repository's docs/ carry exactly one hidden-Unicode occurrence
(a U+200B, found by J4).

## Acceptance criteria

- WHEN a docs file carries a bidi override or isolate THE scan SHALL
  report a hit naming the code point, with a planted positive and a
  planted negative like every other pattern.
- The false-positive count over this repository's own docs/ SHALL be
  derived and written down with its command before the pattern lands.
- IF a channel is deliberately left uncovered THEN the file SHALL say
  which and why, as it already does for these.
