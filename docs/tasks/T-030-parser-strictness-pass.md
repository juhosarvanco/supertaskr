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
header half lives in T-032), T-019-s2, T-019-s3, T-023-s1, T-024-s6
(the parser half — the load-bearing one; the board-badge half lives in
T-031 and the map-badge half in T-032). Triage
2026-08-16: four validateProject/parse strictness rules sharing one
test discipline — separately each would rebuild the same fixtures.
Each rule tightens what inputs are legal; this task's creation is the
deliberate ratification the suggestions asked for (never a silent
widening). Land before T-027 — the live interview renders ROADMAP.md
as it materializes, and T-023-s1's phantom-feature trap sits directly
under it; the lib-parser lane is free now (T-019/T-023 done).

T-024-s6's ARM IS RULED HERE, because two of its three arms collide
with this task's own last criterion. Arm 2's gate ("raise a validation
issue when the model half contains whitespace, `@` or `+`") would flag
the LIVE TREE — T-020 and T-024 both carry compound stamps — and
nothing may flag the live tree. Arm 1 (a full delimited grammar) has
the widest blast radius and would require editing two done tasks'
frontmatter. TAKEN: arm 3 plus the correctness patch — accept the
compound stamp as legitimate prose, define a REPRESENTATIVE model, fix
`policy`, bound the badges (T-031/T-032), and pin a compound fixture.

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
- THE model[@session] parse SHALL yield a REPRESENTATIVE model rather
  than the whole prose: after splitting at the LAST `@`, the model is
  the last whitespace-delimited token of the left half, with `raw`
  keeping the full stamp for the detail panel. Measured today,
  `claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh
  x2 (...)` yields a FIFTY-character badge; after this rule it yields
  `claude-opus-5`. `codex/gpt-5.2 @S3` SHALL be unchanged (T-024-s6).
- THE `policy` flag SHALL read the session's FIRST whitespace-
  delimited word instead of requiring an exact `fresh`, so an
  annotated `@fresh x2 (...)` stops reporting `resume`. SIX live
  stamps report the opposite of what happened today — T-001, T-002,
  T-005, T-019, T-020, T-024 — and nothing outside model-session.ts
  reads the field yet, which is precisely why it will be believed
  later. The existing pins SHALL stay green (T-024-s6).
- THE suite SHALL carry a fixture pinning a COMPOUND cross-model stamp
  end to end — `raw` preserved, representative model, policy fresh,
  short badge — so the next cross-model build does not rediscover
  this (T-024-s6).
- THE smoke suite SHALL still parse this repo's live tree with zero
  issues — no new rule may flag the live tree.
- IF any new rule fires THEN the record SHALL stay collected and
  flagged, never hidden (flagging-not-hiding contract).

## Implementation notes

## Verdicts
