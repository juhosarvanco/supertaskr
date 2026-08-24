---
id: T-079
title: A motion utility without motion-safe is a lint hit
feature: F-02
milestone: 4
priority: 37
size: S
status: building
blocked_by: [T-058]
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-028-s4 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

TAILWIND EMITS A BARE RULE FOR EVERY ANIMATION UTILITY ALONGSIDE THE
GATED ONE, and both are in the shipped sheet — measured in
`app/dist/assets/`: the reduced-motion media block carries the
`motion-safe:` variants, and the ungated class sits outside it for every
motion utility this app has. Using the ungated one is a ONE-CHARACTER
MISTAKE that compiles, paints, and ignores the user's accessibility
setting silently. Nothing red-flags it: not `tsc`, not the token lint
(its patterns are about arbitrary values and default-palette utilities),
not the DOM suites, and not the lane, because a spec that does not
emulate reduced motion sees no difference.

TODAY THE TREE IS CLEAN and T-028 pinned its own corner: a
character-exact sweep over `app/src` asserting that its entrance utility
never appears un-prefixed, hand-written, inside a test belonging to one
task. **The property is general and the guard should be too.** Prior art
for why it is worth it: T-006 introduced one motion-safe utility and
T-012 another, three tasks apart, both correct by hand with nothing
enforcing it. Every T-028-shaped task adds a fourth chance to get it
wrong.

## Acceptance criteria
- THE token lint SHALL gain a pattern: inside a string literal, a class
  token matching an animation utility that is not immediately preceded
  by `motion-safe:` or `motion-reduce:` is a hit. Zero dependencies,
  same shape as the existing patterns, and the scanner already walks and
  masks exactly the right text.
- **THE PATTERN IS P6, NOT P5.** T-058 claims P5 for the control-byte
  rule, and this card is `blocked_by: [T-058]` for that reason. It lands
  in the extracted `scripts/token-scan.mjs`, not in the unconditional
  wrapper.
- **IT BELONGS TO THE TOKEN CORPUS, NOT THE CONTROL CORPUS.** This is a
  Tailwind rule and SHALL NOT be applied to prose, parser or Rust files
  — T-058's fourth criterion is explicit that token rules stay off the
  CONTROL corpus, and a motion utility named in a design document is not
  a violation.
- IT SHALL carry its own POSITIVE AND NEGATIVE selftest samples like
  every other pattern, and the allowlist SHALL stay ZERO. Per T-078's
  shape-five clause, the positive sample SHALL be reachable by the
  coverage floor T-080 adds rather than being a sample that can be
  deleted silently.
- T-028'S HAND-WRITTEN SWEEP SHALL BE KEPT OR EXPLICITLY RETIRED IN
  WRITING. Two gates over one property is not automatically duplication
  — T-058's own ruling on the standing control-byte check is the
  precedent, and the reasoning there (one fast and scoped, one running
  against a bare checkout) SHALL be applied here rather than assumed.

Verification: headless — `npm run lint:tokens`, the selftest, and a
planted bare motion utility shown RED then reverted with the restoration
proved by hash rather than by a clean `git status`.

## Implementation notes

## Verdicts
