---
id: T-030
title: Parser strictness pass — comment-blind roadmap, cycles, filenames, id aliases
feature: F-02
milestone: 4
priority: 14
size: M
status: planned
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-008-s3, T-011-s4 (the parse-time-warning half; the glob.ts
header half lives in T-032), T-019-s2, T-019-s3, T-023-s1. Triage
2026-08-16: four validateProject/parse strictness rules sharing one
test discipline — separately each would rebuild the same fixtures.
Each rule tightens what inputs are legal; this task's creation is the
deliberate ratification the suggestions asked for (never a silent
widening). Land before T-027 — the live interview renders ROADMAP.md
as it materializes, and T-023-s1's phantom-feature trap sits directly
under it; the lib-parser lane is free now (T-019/T-023 done).

## Acceptance criteria
- THE roadmap parser SHALL ignore HTML-comment content (strip
  `<!-- -->` spans, multi-line included, before line matching) so a
  column-0 `- F-NN:` bullet inside a comment yields neither a
  FeatureRecord nor a roadmap-error issue; fixtures SHALL pin the
  commented-bullet case, the commented-malformed case, and a live
  bullet adjacent to a comment (unchanged). WHEN this lands THE
  CONVENTIONS gotcha ("a bare example row would parse as real
  content") SHALL be updated to record the trap is closed — the
  templates stay comment-wrapped regardless (T-023-s1).
- THE validateProject SHALL emit one structured issue per blocked_by
  cycle, self-reference included, naming the member ids — one issue
  per cycle, not per member (the T-019 one-root-cause discipline)
  (T-019-s3).
- THE validateProject SHALL flag an id-bearing task file whose
  basename encodes no id (T-banana.md with `id: T-901`) as an issue;
  id-less suggestion files stay legitimately free-form beyond the
  `T-` prefix (T-019-s2).
- THE component-set parse SHALL emit a structured warning when two
  DIFFERENT id strings share one numeric value ("numerically equal
  ids C-05 and C-005 — zero-padding aliases one slot"), reusing or
  siblinging the duplicate-id kind, collect-don't-throw (T-008-s3).
- THE component parser SHALL warn on a single-segment leading-slash
  `paths` pattern (`/dist`): the strip rule unanchors it against
  git's root-only intent; the message SHALL name `dist/**` as the
  anchored idiom (T-011-s4).
- THE smoke suite SHALL still parse this repo's live tree with zero
  issues — no new rule may flag the live tree.
- IF any new rule fires THEN the record SHALL stay collected and
  flagged, never hidden (flagging-not-hiding contract).

## Implementation notes

## Verdicts
