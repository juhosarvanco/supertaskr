---
id: T-280
title: The push and the bench owe the suites and the spec files the DIFF owes — derived from the docs gate's reader map and the specs' import graph, recorded in the verdict token, required by the push guard exactly — instead of the four-suite battery on every push
feature: F-06
milestone: 4
size: M
priority: 2
status: building
suggested_by: "@human (2026-09-09): \"Yes, file both\" — ruling decision 2 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md); supersedes T-271's second criterion (amended by @human earlier the same day to keep the verifier and the integrator on four legs) by this later ruling"
blocked_by: [T-271]
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, .claude/hooks/push-guard.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/push-guard.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

About a dozen four-suite batteries ran on the integration checkout in
one night of 2026-09-09, roughly 3.5 machine-hours, and twice two
collided on the solo lock. Around half were for commits that moved no
source under any package: dispatch stamps, card promotions, a
checkpoint, a guide page. The rule that costs it is CONVENTIONS' push
bullet — every push owes the four-suite battery, run last — and the
guard that enforces it, `REQUIRED_SUITES` in gate-token.mjs.

The instrument that makes a smaller rule honest already exists in
halves. The docs gate derives which suites read which docs from the
code (`docs-scan.mjs`'s reader map: a card is read by the parser
census and by specific end-to-end specs; a guide page by shell-frame
and window-contract). T-271 derives which end-to-end spec files own a
changed source through the static import graph. What is missing is
the token recording the owed set and the guard requiring it.

The false shortcut is named so nobody takes it: letting CI catch what
the local push skipped makes CI the gate, which is what the push guard
exists to prevent. The safety net here is the derivation, fail-closed.

## Acceptance criteria

- WHEN `gate-run.mjs` is given a range (`--range <base>..<tip>`, the
  push range or a bench's base..tip) THE runner SHALL derive the OWED
  SET: the parser, app and rust suites by the package roots the
  range's paths fall under; the end-to-end suite by the spec files
  that own those paths (T-271's import graph) plus the spec files the
  docs gate's reader map names for every docs path in the range — and
  SHALL grade exactly that set, writing the token with the owed set,
  the range and the inputs the derivation read.
- WHEN the push guard judges a token THE guard SHALL derive the owed
  set for the push range by the same function and require every
  member measured GREEN at the range's tip; a token whose measured set
  does not cover the owed set SHALL be refused with a new reason,
  `token-partial`, naming what is missing — additive to the existing
  reasons, none renamed.
- IF the derivation cannot place a path (a file under no package root,
  a reader the map does not know, a spec whose imports cannot be
  resolved) THEN the owed set SHALL be the whole four-suite battery —
  fail closed, and the token SHALL say why.
- WHEN a bench verifies a lane THE verifier's one run at its tip
  (T-262) SHALL be the owed set for base..tip, not the four legs —
  the bench's report naming the set and its derivation.
- THE derivation SHALL be a function with its own bodies, drilled with
  a DATA mutant: a reader planted in a spec (or a doc read added)
  grows the owed set, and a body asserts it; a hand-listed set
  anywhere is a rejection.
- WHEN CONVENTIONS' push bullet is read THE rule SHALL say the owed
  set, the derivation and the fail-closed case, and SHALL say that CI
  still runs the whole battery after every push; `workflow-parity`
  keeps CI on four legs.
- THE health band for suite seconds SHALL keep reading the whole
  battery (it measures the suite, not the push), and the checkpoint
  SHALL stamp the battery minutes saved for one sitting before and one
  after, with the clock.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
