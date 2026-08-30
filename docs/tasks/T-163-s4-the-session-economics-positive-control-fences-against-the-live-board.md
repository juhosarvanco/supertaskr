---
id: T-163-s4
title: session-economics.spec.ts's positive control spawns `brief.mjs --task T-112` and asserts exit 0 — so any live card sharing a fence entry with T-112 reds the e2e suite, and one has since `bf274ed`
feature: F-06
milestone: 4
priority: 12
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-163-s3
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163-s3'S LANE AT `0f41aef`, ROUTED RATHER THAN FIXED:
`tools/e2e` is outside that lane's fence** (`touches:
[docs/CONVENTIONS.md]`). Recorded here per the lane rule rather than
reached for.

## The measurement

`NPUTER_E2E_PORT=41633 npm test` from tools/e2e/ at `0f41aef` —
**1 failed / 319 passed, exit 1**, and the one red is

    tests/session-economics.spec.ts:73
    "the recommended seat is a function of the CARD, and an environment
     full of model dials does not move it"

failing at line 113, `expect(other.status, other.stderr ?? "").toBe(0)`,
Received `1`. The subprocess it grades is
`node scripts/dispatch-brief.mjs --task T-112`, and its stderr is

    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-169 app-board against T-112 app-board
      — the same entry (lane-protocol rule five).

## The cause, and it is not the spec's subject

Derived at `0f41aef`:

    T-112  status: planned   touches: [app-dispatch, app-board]
    T-169  status: building  touches: [lib-parser, app-board]

`git log --oneline -- docs/tasks/T-169-*.md` puts the `building` stamp
at **`bf274ed`**, *"Dispatch stamps: T-163-s3, T-169, T-164 building —
the third wave"* — which is the commit every lane of that wave was cut
from. **The brief is behaving correctly**: T-169 holds `app-board` and
`--task T-112` is a dispatch question, so refusing is the answer. The
defect is that a POSITIVE CONTROL was spelled as a live card id.

**PRE-EXISTING, PROVEN, NOT CAUSED BY THE T-163-s3 DIFF.** Positive
control run in that lane: `git checkout bf274ed -- docs/CONVENTIONS.md`
then `node tools/e2e/scripts/brief.mjs --task T-112` → **exit 1**;
restore the lane's own file and re-run → **exit 1**. Same code, same
cause, both refs. A docs/CONVENTIONS.md edit cannot move fence
disjointness, which is computed from cards' `touches:` and the
component registry.

## Why the body wants a control at all — do not just delete it

The comment above the failing line says so in as many words: it is the
POSITIVE CONTROL for the comparison two assertions earlier, proving the
advisory block is *not a constant*, so that "identical under a loud
environment" is a claim about the environment rather than about a string
that could never differ. **That property is worth keeping.** Only its
INSTANCE is board-dependent — the same shape as the T-163 discharge on
`lib/parser/test/fence.test.ts` and `app/test/select-board.test.ts`,
whose model was: keep the live half asserting the ruled fact, move the
MECHANISM onto a synthetic fixture that still carries the shape.

## Acceptance criteria

- THE spec SHALL NOT grade its positive control on a card id whose
  fence the live board can collide — a second card's `touches:` is not
  this suite's input, and today's red is the proof.
- THE control SHALL still prove the advisory block is not a constant:
  two inputs, one command, two different blocks, with the difference
  asserted.
- WHERE a live card is still the right input, THE spec SHALL derive one
  whose fence is disjoint at the ref it runs at, rather than naming one.
- THE fix SHALL NOT loosen the assertion to tolerate a non-zero exit —
  an exit code accepted as "either" is the assertion deleted.
- Verification: headless. `npm test` from tools/e2e/ exits 0 with the
  body still red when the advisory block is stubbed to a constant.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
