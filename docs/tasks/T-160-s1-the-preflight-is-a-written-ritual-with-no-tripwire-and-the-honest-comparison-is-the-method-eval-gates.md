---
id: T-160-s1
title: The preflight is a written ritual with no tripwire — nothing makes a dispatcher run it, and the honest comparison is the METHOD EVAL GATE's own disclosure about itself
feature: F-04
milestone: 4
priority: 4
size: M
status: planned
blocked_by: []
touches: [tools/e2e, .github/workflows/, docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review: independent
---

**PROMOTED at the first standing triage, 2026-08-30. Kept SEPARATE from T-160-s2 deliberately.**

T-160-s2's class is *make the preflight read correctly*; this one is
*make the preflight unskippable*. They share a package and nothing else:
this card's two arms reach `.github/workflows/` and `docs/CONVENTIONS.md`,
neither of which s2 touches, and the choice between them is a design
ruling a hardening lane should not be asked to make in passing.

Re-derived at this ref, both halves HOLD:
`grep -rn "preflight\|brief.mjs" .github/workflows/` returns nothing, and
the manifest literal at `tools/e2e/scripts/lane-fence.mjs:183-199` carries
no preflight-verdict field, so a lane armed without a preflight is
indistinguishable from one armed with it.

**THE CARD'S OWN INSTRUCTION STANDS AND IS THE ACCEPTANCE:** build ONE
arm, not both — a CI step, or a preflight receipt stamped into
`.nputer/lane-fence.json` — and record why the other was declined.

**DISPATCH NOTE FOR THE ORCHESTRATOR:** this fence carries
`docs/CONVENTIONS.md`, which the live `task/T-111-s10-poison-drill-bullet`
lane holds at the time of this sitting. Not dispatchable concurrently
with it; the overlap is the ordinary `touches:` guardrail, not a defect.

**GUARD-CLASS.** Its subject is a thing whose job is to REFUSE, so it
dispatches `review: independent` and owes a POSITIVE CONTROL — prove a
preflighted lane still arms, not only that an unpreflighted one is
stopped.

## What T-160 built, and what it did not

`brief.mjs --preflight` refuses a dispatch on a stale card claim, and
docs/CONVENTIONS.md's lane bullet now names it as the step before
`--write-fence`. **Nothing enforces the step.** A dispatcher that
skips it gets no warning, and a lane cut without it is
indistinguishable on disk from one cut with it — the manifest records
that the fence was expanded, never that the card was preflighted.

That is the same disposition the METHOD EVAL GATE already discloses
about itself ("until that lands this gate is a written ritual with one
tripwire, not a gate CI holds"), and T-154's fence guard is the worked
counter-example one card over: the fence stopped being a discipline at
the handoff and became a property at the moment of the write.

## Two arms, and they are not the same size

- **CI.** The command is deliberately NOT in "Build & test", because
  `deriveExpectedSteps` in tools/e2e/tests/workflow-parity.spec.ts reads
  exactly the `run from <dir>/:` bullets that section carries and reds by
  name on a command it cannot map to a CI step — a two-package edit
  T-160's fence did not reach. But a CI step would answer a different
  question anyway: CI has no card to preflight.
- **A RECEIPT IN THE MANIFEST.** `--write-fence` already writes
  `.nputer/lane-fence.json` at dispatch. If `--preflight` stamped its
  verdict and ref there, the hook could refuse a lane whose manifest
  says the card was never preflighted — the `no-manifest` arm's shape,
  one field over. This is the arm worth measuring first.

## Acceptance criteria

- THE seat SHALL decide between the two arms above with the reason
  written down, and SHALL NOT build both.
- IF the manifest arm is taken THEN a lane armed without a preflight
  verdict SHALL be distinguishable from one armed with it, pinned by a
  positive control in tools/e2e/tests/lane-fence.spec.ts's own shape.
