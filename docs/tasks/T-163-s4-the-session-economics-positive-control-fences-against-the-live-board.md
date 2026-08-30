---
id: T-163-s4
title: session-economics.spec.ts's positive control spawns `brief.mjs --task T-112` and asserts exit 0 — so any live card sharing a fence entry with T-112 reds the e2e suite, and one has since `bf274ed`
feature: F-06
milestone: 4
priority: 1
size: S
status: building
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-163-s3
builder: claude-opus-5@subagent
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

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p1**, at `@ 51fa31c0964c`, with the day's second
instance measured at this seat rather than quoted from the filing. The
priority is the evidence: this is the only card on the board whose
defect is RED AT THE MOMENT OF ITS OWN PROMOTION.

**THE THIRD INSTANCE, MEASURED HERE.** The board moved under this
sitting — four lanes were dispatched while it sat — and the body redded
again immediately, on a different card than the one it was filed
against:

    cd tools/e2e && node scripts/brief.mjs --task T-112   # exit 1
    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-143-s3 app-board against T-112 app-board
      — the same entry (lane-protocol rule five).

Filed against `T-169` holding `app-board` at `bf274ed`; red again here
against `T-143-s3` holding `app-board` at `51fa31c`. **Two different
lanes, one control, same red** — which is the card's own claim promoted
from "any live card sharing a fence entry" to a measured pair. The
brief is behaving correctly both times; the spec is not.

**CORRECTION 1 — THE CARD NAMES THE WRONG SCRIPT IN ITS BODY, and a
lane following it would measure a green.** The measurement block above
says the subprocess is `node scripts/dispatch-brief.mjs --task T-112`.
It is not. `tools/e2e/tests/session-economics.spec.ts:54` reads

    const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

and line 109 spawns `[CLI, "--task", "T-112"]`. `dispatch-brief.mjs` is
the MODULE — its own header says *"the runnable half is `brief.mjs`
beside this file; this module holds the derivation and executes
nothing"* — so `node scripts/dispatch-brief.mjs --task T-112` exits **0**
with no output at this base, measured. The card's TITLE had it right
(`brief.mjs`) and its body did not; the body is corrected rather than
ruled, because a reproduction command that exits 0 on a live defect is
the one error that costs a lane its whole first hour.

**CORRECTION 2 — THE `bf274ed` STAMP IS KEPT AND IS NO LONGER THE LIVE
CAUSE.** `T-169` is `done` at this base, so the filing-time collider is
gone and the card's "and one has since `bf274ed`" is history rather than
a current reading. It stays on the card because a retraction that erases
what it retracts leaves nobody able to check it; the live cause at this
ref is named above.

**THE FENCE IS AS FILED AND THE COLLISION IS NAMED.** `touches:
[tools/e2e]` is correct and unchanged. At this base `T-154-s2` is a LIVE
LANE holding `.claude, tools/e2e, docs/CONVENTIONS.md`, so this card's
preflight reports a fence collision against it — a DISPATCH-TIMING fact,
not a defect in this card, ruled here so no dispatcher re-derives it.
Two other cards promoted at this sitting also fence `tools/e2e`
(`T-167-s8`, `T-167-s6`) and one more reaches it (`T-164-s2`): the four
serialize against each other, and this one is p1 of the four.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-163-s4 --preflight` from tools/e2e at
`@ 51fa31c0964c` exits **1** with exactly ONE finding, and it is the
live-lane hold above: *"the parser rules this card: fenced — T-154-s2
(refs/heads/task/T-154-s2-laneless-guard) holds tools/e2e"*. Every other
claim class ran clean: paths missing **0**, criteria naming paths the
fence does not reserve **0**, unrunnable figures **0**, `blocked_by`
nothing, ref stamps **1 of 1 resolving**, fence expanding to 59 tracked
files. **THIS IS NOT DISCHARGEABLE BY A CARD LINE AND SHOULD NOT BE** —
a `PREFLIGHT RULING` binds a finding about the CARD, and a live lane is
a fact about the clock; the tool says so in as many words when one is
tried against it ("discharges nothing at this ref"). The card is
correct and unstartable, and it becomes startable the moment that lane
lands, with nothing to re-edit.

## Implementation notes
<!-- executor appends before finishing -->

### Confirmation of understanding — executor, lane `T-163-s4` at base `8ebbb08`

I am building one card inside `touches: [tools/e2e]`: `tests/session-economics.spec.ts`
grades subprocess exits of `scripts/brief.mjs --task <live card id>`, and
`brief.mjs --task` is a DISPATCH question, so it answers exit 1 whenever the named
card's fence collides with any live lane's — which makes a board fact, belonging to
no input this suite owns, decide whether this suite is green. My job is to keep the
property the bodies buy (the advisory block is not a constant; nothing about the
SESSION reaches the recommendation) while removing the board from the grading path:
the control's card id must be DERIVED as disjoint at the ref it runs at rather than
typed in, no assertion may be loosened to tolerate a non-zero exit, and I check every
body in the file that shells the brief rather than only `:73`. My own lane is the test
bed — it holds `tools/e2e`, so the red must be reproducible before my fix and absent
after it WITH this lane still live. I re-derive every figure at my own ref and say
plainly where the card and the repository disagree; the repository wins. Size S,
`touches: [tools/e2e]` — tooling, not shipped code — so I stamp `verifying` in-lane
and leave the verifier fields empty as dispatched, and I do not merge, push, or touch
the integration checkout.

## Verdicts
